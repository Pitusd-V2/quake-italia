/**
 * Controlla le fonti di tutti gli articoli (contenuti/articoli/*.mdx).
 *
 *   node scripts/check-sources.mjs
 *
 * - Link a uno studio (doi.org): il DOI deve esistere (Crossref o DataCite) e il titolo registrato deve
 *   corrispondere a quello citato nel testo della fonte: così un DOI sbagliato non passa inosservato.
 * - Altri link: la pagina deve rispondere. Un sito che blocca i controlli automatici (403, 429) è solo un avviso.
 * - Articoli con fonti verificate più di un anno fa: avviso.
 *
 * Esce con 0 se non ci sono errori, 1 se ci sono link rotti o DOI che non corrispondono. Il riassunto va anche in
 * sources-check.md, che il controllo settimanale di GitHub usa come testo della segnalazione.
 */
import fs from 'node:fs';
import { readArticles } from '../plugins/articoli.ts';

const REPORT = 'sources-check.md';
const UA = 'QuakeItalia-source-check/1.0 (+https://github.com/Pitusd-V2/quake-italia; mailto:quakeitalia@gmail.com)';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function get(url, { json = false, timeout = 25_000 } = {}) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeout);
  try {
    const res = await fetch(url, {
      redirect: 'follow',
      signal: ctrl.signal,
      headers: { 'User-Agent': UA, Accept: json ? 'application/json' : 'text/html,application/xhtml+xml,application/pdf,*/*' },
    });
    const body = json && res.ok ? await res.json() : null;
    if (!json) res.body?.cancel();
    return { status: res.status, body };
  } catch (e) {
    return { status: 0, error: e.name === 'AbortError' ? 'tempo scaduto' : e.message };
  } finally {
    clearTimeout(t);
  }
}

const words = (s) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/<[^>]+>/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .split(' ')
    .filter((w) => w.length > 3);

/** Il titolo registrato del DOI è quello citato? Almeno 4 delle prime 6 parole significative devono comparire. */
function titleMatches(title, citation) {
  const t = words(title).slice(0, 6);
  if (t.length === 0) return true;
  const c = new Set(words(citation));
  const hits = t.filter((w) => c.has(w)).length;
  return hits >= Math.min(4, t.length);
}

async function doiTitle(doi) {
  const cr = await get(`https://api.crossref.org/works/${encodeURIComponent(doi)}`, { json: true });
  if (cr.status === 200) return { title: cr.body?.message?.title?.[0] ?? '', registry: 'Crossref' };
  const dc = await get(`https://api.datacite.org/dois/${encodeURIComponent(doi)}`, { json: true });
  if (dc.status === 200) return { title: dc.body?.data?.attributes?.titles?.[0]?.title ?? '', registry: 'DataCite' };
  return { title: null, status: cr.status || dc.status, error: cr.error ?? dc.error };
}

const { articles, warnings } = readArticles();
const errors = [];
const notes = [...warnings];
const seen = new Map();
let checked = 0;

for (const a of articles) {
  for (const f of a.fonti) {
    if (!f.url) continue;
    const where = `${a.slug}: «${f.testo.slice(0, 90)}${f.testo.length > 90 ? '…' : ''}»`;
    const doi = f.url.match(/^https:\/\/doi\.org\/(.+)$/)?.[1];
    if (doi) {
      const r = seen.get(doi) ?? (await doiTitle(decodeURIComponent(doi)));
      seen.set(doi, r);
      checked++;
      if (r.title == null) {
        if (r.status === 404) errors.push(`${where}: il DOI ${doi} non esiste`);
        else notes.push(`${where}: DOI ${doi} non verificabile ora (${r.error ?? r.status})`);
      } else if (!titleMatches(r.title, f.testo)) {
        errors.push(`${where}: il DOI ${doi} porta a «${r.title}» (${r.registry}), che non sembra lo studio citato`);
      }
      await sleep(200);
      continue;
    }
    const r = seen.get(f.url) ?? (await get(f.url));
    seen.set(f.url, r);
    checked++;
    if (r.status === 404 || r.status === 410) errors.push(`${where}: pagina non trovata (${r.status}) ${f.url}`);
    else if (r.status === 403 || r.status === 429 || r.status === 401) notes.push(`${where}: il sito non permette il controllo automatico (${r.status}) ${f.url}`);
    else if (r.status === 0 || r.status >= 500) notes.push(`${where}: non risponde ora (${r.error ?? r.status}) ${f.url}`);
    await sleep(300);
  }
}

const lines = [
  `## Controllo delle fonti degli articoli`,
  '',
  `Articoli: ${articles.length}. Link controllati: ${checked}.`,
  '',
  `**Errori da correggere (${errors.length})**`,
  ...(errors.length ? errors.map((e) => `- ${e}`) : ['- nessuno']),
  '',
  `**Avvisi (${notes.length})**`,
  ...(notes.length ? notes.map((n) => `- ${n}`) : ['- nessuno']),
  '',
  'Come correggere: apri l’articolo in `contenuti/articoli/`, sistema la fonte (o il testo, se la fonte ha cambiato contenuto), aggiorna `verificato` e, se l’errore era importante, aggiungi una voce in `src/learn/corrections.ts`.',
];
fs.writeFileSync(REPORT, `${lines.join('\n')}\n`);
console.log(lines.join('\n'));
process.exit(errors.length ? 1 : 0);
