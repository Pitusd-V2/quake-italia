/**
 * Controlla UN articolo, anche una bozza fuori da contenuti/articoli, senza fare il build di tutto il sito.
 *
 *   node scripts/check-article.mjs contenuti/bozze/effetti-di-sito.mdx
 *
 * 1. I dati in cima al file: le stesse regole del build (plugins/articoli.ts).
 * 2. Gli articoli correlati e l'«ordine»: confrontati con quelli pubblicati e con le altre bozze.
 * 3. I link: quelli verso siti non ancora nell'elenco (src/lib/sanitize.ts) sono segnalati a parte, perché li
 *    aggiunge chi integra la bozza nel sito. I link non https sono un errore.
 * 4. Il testo: viene compilato e disegnato in HTML come al build, così un errore in un grafico o in un numero
 *    salta fuori subito. Alla fine stima i minuti di lettura e li confronta con «minuti».
 *
 * Esce con 0 se non ci sono errori (anche se ci sono siti da aggiungere all'elenco), 1 se ce ne sono.
 * Non scrive niente nel progetto: può girare insieme ad altri controlli.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createServer } from 'vite';
import { ARTICLES_DIR, check, frontmatter } from '../plugins/articoli.ts';
import { isAllowedLink } from '../src/lib/sanitize.ts';

const file = process.argv[2];
if (!file || !file.endsWith('.mdx') || !fs.existsSync(file)) {
  console.error('Uso: node scripts/check-article.mjs <percorso del file .mdx>');
  process.exit(2);
}

const ROOT = path.resolve(import.meta.dirname, '..');
const DRAFTS_DIR = path.join(ROOT, 'contenuti', 'bozze');
const abs = path.resolve(file);
const slug = path.basename(abs, '.mdx');
const today = new Date().toISOString().slice(0, 10);
const errors = [];
const warnings = [];
const hostsToAdd = new Set();

/* ---------- 1. Dati in cima ---------- */

let data = null;
try {
  const r = check(slug, frontmatter(abs), today);
  data = r.data;
  // Un link https verso un sito non ancora in elenco non è un errore della bozza: lo segnaliamo a parte (punto 3).
  errors.push(...r.errors.filter((e) => !/^fonte con link non ammesso/.test(e) || !/https:\/\//.test(e)));
  warnings.push(...r.warnings);
  if (!data && errors.length === 0) {
    // Gli unici errori erano link verso siti non in elenco: rileggiamo i dati senza quei link, per i controlli dopo.
    const fm = frontmatter(abs);
    const fonti = Array.isArray(fm.fonti)
      ? fm.fonti.map((f) => (typeof f?.url === 'string' && !isAllowedLink(f.url) ? { ...f, url: undefined } : f))
      : fm.fonti;
    data = check(slug, { ...fm, fonti }, today).data;
  }
} catch (e) {
  errors.push(e.message);
}

/* ---------- 2. Correlati e ordine ---------- */

const others = [];
for (const dir of [ARTICLES_DIR, DRAFTS_DIR]) {
  if (!fs.existsSync(dir)) continue;
  for (const f of fs.readdirSync(dir).filter((x) => x.endsWith('.mdx'))) {
    const p = path.join(dir, f);
    if (p === abs) continue;
    try {
      const fm = frontmatter(p);
      others.push({ slug: f.replace(/\.mdx$/, ''), percorso: fm.percorso, ordine: fm.ordine, where: path.relative(ROOT, p) });
    } catch {
      /* un'altra bozza ancora a metà: non è un problema di questo file */
    }
  }
}
if (data) {
  const known = new Set(others.map((o) => o.slug));
  for (const c of data.correlati) if (!known.has(c) && c !== slug) errors.push(`articolo correlato «${c}» inesistente (né pubblicato né tra le bozze)`);
  if (data.correlati.includes(slug)) errors.push('l’articolo non può essere correlato a sé stesso');
  // Una riscrittura (stesso nome in contenuti/articoli) prende il posto dell'originale: il suo «ordine» non conta.
  const clash = others.find((o) => o.slug !== slug && o.percorso === data.percorso && o.ordine === data.ordine);
  if (clash) errors.push(`stesso «ordine» (${data.ordine}) di ${clash.where} nel percorso «${data.percorso}»`);
}

/* ---------- 3. Link ---------- */

const text = fs.readFileSync(abs, 'utf8');
for (const m of text.matchAll(/\bhttps?:\/\/[^\s)\]"'<>{}|`]+/g)) {
  const url = m[0].replace(/[.,;:]+$/, '');
  if (isAllowedLink(url)) continue;
  if (!url.startsWith('https://')) {
    errors.push(`link non https: ${url}`);
    continue;
  }
  try {
    hostsToAdd.add(new URL(url).hostname);
  } catch {
    errors.push(`link non valido: ${url}`);
  }
}

/* ---------- 4. Compilazione e disegno ---------- */

let words = 0;
if (errors.length === 0) {
  const cacheDir = fs.mkdtempSync(path.join(os.tmpdir(), 'qi-check-article-'));
  const server = await createServer({
    configFile: path.join(ROOT, 'vite.ssr.config.ts'),
    root: ROOT,
    logLevel: 'error',
    cacheDir,
    appType: 'custom',
    server: { middlewareMode: true, hmr: false, watch: null, ws: false },
    optimizeDeps: { noDiscovery: true, include: [] },
  });
  try {
    const { createElement } = await import('react');
    const { renderToString } = await import('react-dom/server');
    const { StaticRouter } = await import('react-router');
    const { Part } = await server.ssrLoadModule('/src/learn/LearnPart.tsx');
    const mod = await server.ssrLoadModule(abs);
    // «Termine»: le parole del glossario nel testo (plugins/termini.ts). Qui basta disegnarle come parole in evidenza.
    const components = { Part, Termine: ({ children }) => createElement('dfn', null, children), a: ({ href, children }) => createElement('a', { href }, children) };
    // Gli avvisi di React sul disegno lato server (useLayoutEffect…) non sono errori dell'articolo.
    const origError = console.error;
    const reactErrors = [];
    console.error = (...args) => {
      const msg = args.map(String).join(' ');
      if (!/useLayoutEffect/.test(msg)) reactErrors.push(msg);
    };
    let html = '';
    try {
      html = renderToString(createElement(StaticRouter, { location: `/capire/${slug}` }, createElement(mod.default, { components })));
    } finally {
      console.error = origError;
    }
    for (const msg of reactErrors) warnings.push(`React: ${msg.slice(0, 300)}`);
    const plain = html
      .replace(/<svg[\s\S]*?<\/svg>/g, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&[a-z#0-9]+;/gi, ' ');
    words = plain.split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w)).length;
    if (/\bNaN\b|\bundefined\b|\[object Object\]/.test(plain)) errors.push('nel testo disegnato compare «NaN», «undefined» o «[object Object]»: un numero preso dai dati non funziona');
  } catch (e) {
    errors.push(`il testo non si compila o non si disegna: ${(e.stack || e.message).split('\n').slice(0, 6).join('\n    ')}`);
  } finally {
    await server.close();
    fs.rmSync(cacheDir, { recursive: true, force: true });
  }
}

if (data && words) {
  // Circa 200 parole al minuto, più il riassunto e il glossario.
  const extra = data.riassunto.join(' ').split(/\s+/).length + data.glossario.map((g) => `${g.termine} ${g.definizione}`).join(' ').split(/\s+/).length;
  const est = Math.max(1, Math.round((words + extra) / 200));
  if (Math.abs(est - data.minuti) > Math.max(2, est * 0.3)) warnings.push(`«minuti» è ${data.minuti}, ma il testo (circa ${words + extra} parole) si legge in circa ${est} minuti`);
}

/* ---------- Risultato ---------- */

console.log(`\nControllo di ${path.relative(ROOT, abs)}`);
if (words) console.log(`Testo disegnato: circa ${words} parole.`);
if (errors.length) console.log(`\nERRORI (${errors.length}):\n  - ${errors.join('\n  - ')}`);
if (warnings.length) console.log(`\nAvvisi (${warnings.length}):\n  - ${warnings.join('\n  - ')}`);
if (hostsToAdd.size)
  console.log(`\nSiti da aggiungere all'elenco dei link ammessi (src/lib/sanitize.ts), a cura di chi integra:\n  - ${[...hostsToAdd].sort().join('\n  - ')}`);
console.log(errors.length ? '\nRisultato: da sistemare.' : '\nRisultato: OK.');
process.exit(errors.length ? 1 : 0);
