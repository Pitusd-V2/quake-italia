/**
 * Quello che legge chi apre il sito senza JavaScript: gli assistenti IA che leggono le pagine per rispondere a una domanda,
 * alcuni programmi di lettura, chi ha JavaScript spento.
 *  - noScriptHtml: il blocco <noscript> di ogni pagina. Nella home (che è un'app con dati in tempo reale, senza testo
 *    nell'HTML) contiene una presentazione del sito e l'elenco di tutti gli articoli; nelle altre pagine una frase onesta.
 *    Chi ha JavaScript non lo vede: il contenuto è lo stesso del sito, non c'è niente di nascosto o diverso.
 *  - llmsTxt: /llms.txt, un indice del sito per gli assistenti IA (proposta llmstxt.org, non uno standard).
 * Tutto è generato al build dal catalogo degli articoli: si aggiorna da solo a ogni articolo nuovo. Per ogni articolo ci
 * sono titolo, domanda, sottotitolo e i punti del riassunto «In 30 secondi», così un assistente può dire di cosa parla
 * anche senza aprirlo. Niente dati in tempo reale: questo testo è fermo al momento del build.
 */
import { CATALOG, loadArticle } from '../learn/catalog';
import { PERCORSI } from '../learn/percorsi';
import { HOME_DESCRIPTION, PAGES } from './pages';

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const SITE_NAME = 'Quake Italia';
const short = (title: string) => title.replace(/ — Quake Italia$/, '');

/** Le pagine principali da elencare (non gli articoli, che hanno un elenco a parte). */
const MAIN = ['/terremoti', '/ho-sentito', '/il-mio-comune', '/cosa-fare', '/prepara-la-casa', '/danni-casa', '/e-vero', '/capire', '/come-scriviamo', '/informazioni'];
const mainPages = () => MAIN.map((p) => PAGES.find((x) => x.path === p)).filter((p) => p !== undefined);

/** Gli articoli divisi per percorso, nell'ordine del percorso. */
function byPath() {
  return PERCORSI.map((p) => ({
    percorso: p,
    articoli: CATALOG.filter((a) => a.percorso === p.id).sort((a, b) => a.ordine - b.ordine),
  })).filter((g) => g.articoli.length > 0);
}

/** I punti del riassunto «In 30 secondi» di ogni articolo (dai dati in cima ai file MDX), per indirizzo. */
export type Summaries = Record<string, string[]>;

/** Al build: legge il riassunto di ogni articolo. */
export async function articleSummaries(): Promise<Summaries> {
  const entries = await Promise.all(
    CATALOG.map(async (a) => [a.slug, ((await loadArticle(a.slug)).frontmatter.riassunto ?? []).map(plain)] as const),
  );
  return Object.fromEntries(entries);
}

/** Toglie i segni Markdown più comuni (grassetto, corsivo, link) dai punti del riassunto. */
const plain = (s: string) => s.replace(/\*\*|__/g, '').replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');

const NOTICE =
  'Senza JavaScript non funzionano la mappa, i terremoti in tempo reale e le pagine sul tuo comune. Gli articoli di «Capire», i consigli su cosa fare e le pagine informative si leggono lo stesso.';

export function noScriptHtml(path: string, summaries: Summaries = {}): string {
  if (path !== '/') return `<noscript><p>${esc(NOTICE)} <a href="/capire">Tutti gli articoli</a>.</p></noscript>`;

  const sections = mainPages()
    .map((p) => `<li><a href="${p.path}">${esc(short(p.title))}</a>: ${esc(p.description)}</li>`)
    .join('');
  const articles = byPath()
    .map(
      ({ percorso, articoli }) =>
        `<h3>${esc(percorso.titolo)}</h3><p>${esc(percorso.descrizione)}</p><ul>${articoli
          .map((a) => {
            const points = summaries[a.slug] ?? [];
            const list = points.length ? `<ul>${points.map((p) => `<li>${esc(p)}</li>`).join('')}</ul>` : '';
            return `<li><a href="/capire/${a.slug}">${esc(a.titolo)}</a>: ${esc(a.domanda)}<p>${esc(a.sottotitolo)}</p>${list}</li>`;
          })
          .join('')}</ul>`,
    )
    .join('');

  return [
    '<noscript><main>',
    `<h1>${SITE_NAME}</h1>`,
    `<p>${esc(HOME_DESCRIPTION)}</p>`,
    '<p>Quake Italia non prevede i terremoti e non è un sistema di allerta: per le indicazioni ufficiali valgono la Protezione Civile, l’INGV e il proprio Comune.</p>',
    `<p>${esc(NOTICE)}</p>`,
    `<h2>Le sezioni</h2><ul>${sections}</ul>`,
    `<h2>Gli articoli di «Capire» (${CATALOG.length})</h2>`,
    '<p>Articoli con fonti verificabili, scritti da una persona insieme a un’intelligenza artificiale e letti e approvati da una persona prima della pubblicazione.</p>',
    articles,
    '</main></noscript>',
  ].join('');
}

/** /llms.txt in Markdown: cos'è il sito e dove sono i contenuti. */
export function llmsTxt(site: string, summaries: Summaries = {}): string {
  const lines = [
    `# ${SITE_NAME}`,
    '',
    `> ${HOME_DESCRIPTION}`,
    '',
    'Quake Italia è un sito gratuito e open source sui terremoti in Italia. Non prevede i terremoti e non è un sistema di allerta: per le indicazioni ufficiali valgono il Dipartimento della Protezione Civile, l’INGV e il proprio Comune. Gli articoli di «Capire» hanno fonti verificabili (dati INGV, enti ufficiali, studi con DOI), una data di ultima verifica e sono letti e approvati da una persona prima della pubblicazione. Il sito è in italiano.',
    '',
    '## Sezioni',
    '',
    ...mainPages().map((p) => `- [${short(p.title)}](${site}${p.path}): ${p.description}`),
    '',
    ...byPath().flatMap(({ percorso, articoli }) => [
      `## Capire — ${percorso.titolo}`,
      '',
      ...articoli.flatMap((a) => [
        `- [${a.titolo}](${site}/capire/${a.slug}): ${a.domanda} ${a.sottotitolo} (fonti verificate il ${a.verificato})`,
        ...(summaries[a.slug] ?? []).map((p) => `  - ${p}`),
      ]),
      '',
    ]),
    '## Altro',
    '',
    `- [Le parole della scienza](${site}/capire/glossario): il glossario di tutti gli articoli`,
    `- [Codice sorgente](https://github.com/Pitusd-V2/quake-italia)`,
    '',
  ];
  return lines.join('\n');
}
