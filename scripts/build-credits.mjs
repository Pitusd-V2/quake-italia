/**
 * I crediti completi nel README: ogni fonte citata dal sito, raggruppata per articolo e per pagina, dentro sezioni
 * a tendina (<details>) che si aprono con un clic.
 *
 *   npm run crediti        riscrive la parte dei crediti nel README
 *
 * Le fonti si leggono da dove stanno già: in cima a ogni articolo (contenuti/articoli/*.mdx) e in
 * src/data/pageSources.ts per le pagine. Lo script tocca solo il testo tra i due segni CREDITI_INIZIO e CREDITI_FINE
 * del README; il resto lo lascia com'è. Il test src/credits.test.ts fa fallire la build se il README non è
 * aggiornato, ed elenca uno per uno i riconoscimenti che mancano.
 *
 * Le citazioni sono riportate come sono negli articoli e nelle pagine, senza completarle: dove c'è «e altri», l'elenco
 * completo degli autori si trova dal link o dal DOI.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readArticles } from '../plugins/articoli.ts';
import { PERCORSI } from '../src/learn/percorsi.ts';
import { CAA_SOURCE, DAMAGE_SOURCES, RUMOR_SOURCES, SAFETY_SOURCES, SITE_SOURCES } from '../src/data/pageSources.ts';

export const README = path.resolve(import.meta.dirname, '..', 'README.md');
export const START = '<!-- CREDITI_INIZIO: questa parte la scrive «npm run crediti», non modificarla a mano -->';
export const END = '<!-- CREDITI_FINE -->';

/** Caratteri che in Markdown cambierebbero il testo (corsivi, link…): li rendiamo letterali. */
const md = (s) => s.replace(/([\\`*_[\]<>|])/g, '\\$1');
/** Le parentesi tonde negli indirizzi chiuderebbero il link prima del tempo. */
const href = (u) => u.replace(/\(/g, '%28').replace(/\)/g, '%29').replace(/ /g, '%20');

/** Una riga dell'elenco: la citazione, poi il link. È anche la «chiave» con cui il test confronta. */
export const line = (s) => `- ${md(s.testo ?? s.label)}${s.url ? ` — [link](${href(s.url)})` : ''}`;

function block(summary, groups) {
  const out = ['<details>', `<summary><strong>${summary}</strong></summary>`, ''];
  for (const g of groups) {
    out.push(`#### ${md(g.title)}`, '');
    if (g.note) out.push(g.note, '');
    for (const s of g.sources) out.push(line(s));
    out.push('');
  }
  out.push('</details>');
  return out.join('\n');
}

const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;
const unique = (lists) => new Set(lists.flat().map(line)).size;

/** Il testo dei crediti, tra i due segni (compresi). */
export function creditsSection() {
  const { articles } = readArticles();
  const order = (p) => PERCORSI.findIndex((x) => x.id === p);
  const sorted = [...articles].sort((a, b) => order(a.percorso) - order(b.percorso) || a.ordine - b.ordine);
  const articleGroups = sorted.map((a) => ({
    title: a.titolo,
    note: `*${md(PERCORSI.find((p) => p.id === a.percorso)?.titolo ?? a.percorso)}* · [leggi l’articolo](contenuti/articoli/${a.slug}.mdx)`,
    sources: a.fonti,
  }));
  const pageGroups = [
    { title: 'Cosa fare in caso di terremoto', sources: [...SAFETY_SOURCES, CAA_SOURCE] },
    { title: 'La casa ha dei danni', sources: DAMAGE_SOURCES },
    { title: 'È vero? Le voci sui terremoti', sources: RUMOR_SOURCES },
    ...SITE_SOURCES,
  ];
  const nArticles = unique(articleGroups.map((g) => g.sources));
  const nPages = unique(pageGroups.map((g) => g.sources));
  return [
    START,
    '',
    '### Tutte le fonti citate',
    '',
    'Ogni fonte citata nel sito, senza eccezioni: anche quelle usate una volta sola. Le fonti degli articoli sono riportate',
    'come sono scritte negli articoli; dove c’è «e altri», l’elenco completo degli autori si trova dal link o dal DOI.',
    'Questa parte si aggiorna da sola con `npm run crediti`, e la build si ferma se manca qualcosa.',
    '',
    block(
      `Fonti degli articoli di «Capire» — ${plural(nArticles, 'fonte', 'fonti')} in ${plural(articles.length, 'articolo', 'articoli')}`,
      articleGroups,
    ),
    '',
    block(`Fonti delle pagine e delle funzioni del sito — ${plural(nPages, 'fonte', 'fonti')}`, pageGroups),
    '',
    END,
  ].join('\n');
}

/** Il README con la parte dei crediti aggiornata. Se i segni mancano, la aggiunge prima di «## Licenze». */
export function withCredits(readme, section = creditsSection()) {
  const a = readme.indexOf(START.slice(0, 20));
  const b = readme.indexOf(END);
  if (a >= 0 && b > a) return readme.slice(0, a) + section + readme.slice(b + END.length);
  const at = readme.indexOf('\n## Licenze');
  if (at < 0) throw new Error('Nel README non trovo né i segni dei crediti né la sezione «## Licenze».');
  return `${readme.slice(0, at)}\n${section}\n${readme.slice(at)}`;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const before = fs.readFileSync(README, 'utf8').replace(/\r\n/g, '\n');
  const after = withCredits(before);
  if (after === before) console.log('Crediti del README già aggiornati.');
  else {
    fs.writeFileSync(README, after);
    console.log('Crediti del README aggiornati.');
  }
}
