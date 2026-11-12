/**
 * La ricerca di «Capire», con tutti i suoi dati. Questo file si scarica solo quando qualcuno tocca il campo di
 * ricerca: dentro c'è il testo di tutti gli articoli (creato al build), quindi non deve pesare su chi non cerca.
 *
 * Cerca in: articoli (titolo, parole chiave, riassunto, testo), parole del glossario, e le pagine pratiche del sito
 * («È vero?», «Cosa fare», «La casa ha dei danni», «Prepara la tua casa»), perché chi scrive «crepe» o «kit» una
 * risposta sul sito ce l'ha, anche se non è un articolo.
 */
import rawTexts from 'virtual:ricerca';
import rawGlossary from 'virtual:glossario';
import { CATALOG } from './catalog';
import { PERCORSI } from './percorsi';
import type { ArticleCard, ArticleText, GlossaryEntry } from './articleTypes';
import { buildIndex, search, type SearchEntry, type SearchResult } from './searchEngine';
import { PAGES } from '../seo/pages';
import { RUMORS } from '../pages/RumorsPage';
import { SECTIONS as SAFETY, sectionText } from '../pages/SafetyPage';
import { SECTIONS as DAMAGE } from '../pages/DamagePage';
import { LEVELS } from '../lib/prepare';

// Il tipo va dichiarato qui: per i moduli creati al build TypeScript non lo ricava da solo (come in catalog.ts).
const texts: ArticleText[] = rawTexts;
const glossary: GlossaryEntry[] = rawGlossary;

export type Found =
  | { kind: 'articolo'; card: ArticleCard }
  | { kind: 'parola'; entry: GlossaryEntry }
  /** `where`: in quale pagina del sito si trova (mostrato come etichetta). */
  | { kind: 'pagina'; to: string; title: string; where: string };

/* Quanto vale trovare la parola in ogni posto. */
const W = { title: 10, keywords: 8, term: 9, subtitle: 6, pageTitle: 6, headings: 4, summary: 4, percorso: 3, definition: 2, pageText: 1.5, body: 1 };

function articleEntry(card: ArticleCard): SearchEntry<Found> {
  const text = texts.find((t) => t.slug === card.slug);
  const terms = glossary.filter((g) => g.voci.some((v) => v.slug === card.slug)).map((g) => g.termine);
  return {
    item: { kind: 'articolo', card },
    fields: [
      { text: card.titolo, weight: W.title },
      { text: card.paroleChiave.join(' · '), weight: W.keywords },
      { text: card.domanda, weight: W.keywords },
      { text: card.sottotitolo, weight: W.subtitle },
      { text: terms.join(' · '), weight: W.headings },
      { text: (text?.sezioni ?? []).map((s) => s.titolo ?? '').join(' · '), weight: W.headings },
      { text: PERCORSI.find((p) => p.id === card.percorso)?.titolo ?? '', weight: W.percorso },
      { text: (text?.riassunto ?? []).join('\n'), weight: W.summary, label: 'In breve', snippet: true },
      ...(text?.sezioni ?? []).map((s) => ({ text: s.testo, weight: W.body, label: s.titolo ?? undefined, snippet: true })),
    ],
  };
}

const page = (to: string, title: string, where: string, text: string): SearchEntry<Found> => ({
  item: { kind: 'pagina', to, title, where },
  fields: [
    { text: title, weight: W.pageTitle },
    { text, weight: W.pageText, label: undefined, snippet: true },
  ],
});

const groupsText = (groups: { title?: string; items: string[] }[]) => groups.map((g) => [g.title, ...g.items].filter(Boolean).join('\n')).join('\n');

const entries: SearchEntry<Found>[] = [
  ...CATALOG.map(articleEntry),
  ...glossary.map<SearchEntry<Found>>((entry) => ({
    item: { kind: 'parola', entry },
    // «Magnitudo momento (Mw)» si trova per intero, senza sigla, o con la sola sigla.
    exact: [entry.termine, entry.termine.replace(/\s*\([^)]*\)/g, ''), ...[...entry.termine.matchAll(/\(([^)]*)\)/g)].map((m) => m[1])],
    fields: [
      { text: entry.termine, weight: W.term },
      { text: entry.voci.map((v) => v.definizione).join('\n'), weight: W.definition },
    ],
  })),
  ...RUMORS.map((r) => page(`/e-vero#rumor-${r.id}`, r.says, 'È vero?', r.answer.join('\n'))),
  ...SAFETY.map((s) => page(`/cosa-fare#sec-${s.id}`, s.title, 'Cosa fare', sectionText(s))),
  ...DAMAGE.map((s) => page(`/danni-casa#sec-${s.id}`, s.title, 'La casa ha dei danni', groupsText(s.groups))),
  ...LEVELS.flatMap((l) =>
    l.missions.map((m) => page('/prepara-la-casa', m.title, 'Prepara la tua casa', [m.how, ...(m.parts ?? []).map((p) => p.label)].join('\n'))),
  ),
  // Le altre pagine del sito, con la loro descrizione (le stesse che vede Google).
  ...PAGES.filter((p) => p.path !== '/' && !p.path.startsWith('/capire')).map((p) =>
    page(p.path, p.title.replace(/ — Quake Italia$/, ''), 'Pagina del sito', p.description),
  ),
];

const index = buildIndex(entries);

export const searchSite = (q: string): SearchResult<Found> => search(index, q);
