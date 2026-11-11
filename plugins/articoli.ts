/**
 * Gli articoli di «Capire» sono file in contenuti/articoli/<indirizzo>.mdx: testo in Markdown, con in cima
 * i dati dell'articolo (titolo, riassunto, fonti…). Questo modulo li legge, li CONTROLLA e prepara:
 *  - il catalogo leggero (`virtual:articoli`): titoli, percorsi, date… per l'elenco e Google;
 *  - il testo vero, che resta in file separati e si scarica solo quando qualcuno apre l'articolo;
 *  - il glossario generale (`virtual:glossario`): le parole spiegate in fondo a ogni articolo, riunite;
 *  - il testo per la ricerca (`virtual:ricerca`): si scarica solo quando qualcuno cerca.
 *
 * Se un articolo non rispetta le regole (vedi /come-scriviamo), il build si ferma con un messaggio chiaro.
 * Usato da vite.config.ts, vite.ssr.config.ts e dagli script (scripts/check-sources.mjs).
 */
import fs from 'node:fs';
import path from 'node:path';
import { parse } from 'yaml';
import type { Plugin } from 'vite';
import { isAllowedLink } from '../src/lib/sanitize.ts';
import { PERCORSI } from '../src/learn/percorsi.ts';
import { fold, termKey } from '../src/learn/searchEngine.ts';
import { articleSections } from './testo-articolo.ts';
import type { ArticleCard, ArticleData, ArticleText, Fonte, GlossaryEntry } from '../src/learn/articleTypes.ts';

export const ARTICLES_DIR = path.resolve(import.meta.dirname, '..', 'contenuti', 'articoli');

export type { ArticleCard, ArticleData, Fonte };

export const MIN_FONTI = 3;
const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;

export function frontmatter(file: string): Record<string, unknown> {
  const text = fs.readFileSync(file, 'utf8').replace(/^﻿/, '');
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/);
  if (!m) throw new Error('mancano i dati in cima al file (il blocco tra due righe ---)');
  const data = parse(m[1]) as unknown;
  if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error('i dati in cima al file non sono validi');
  return data as Record<string, unknown>;
}

/** Legge e controlla un articolo. Restituisce i problemi trovati (vuoto = tutto a posto). */
export function check(slug: string, d: Record<string, unknown>, today: string): { data: ArticleData | null; errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];
  const str = (k: string, max = 400) => {
    const v = d[k];
    if (typeof v !== 'string' || !v.trim()) errors.push(`«${k}» manca o è vuoto`);
    else if (v.length > max) errors.push(`«${k}» è troppo lungo (${v.length} caratteri, massimo ${max})`);
    return typeof v === 'string' ? v.trim() : '';
  };
  const int = (k: string, min: number, max: number) => {
    const v = d[k];
    if (typeof v !== 'number' || !Number.isInteger(v) || v < min || v > max) errors.push(`«${k}» deve essere un numero intero tra ${min} e ${max}`);
    return typeof v === 'number' ? v : 0;
  };
  const list = (k: string) => {
    const v = d[k] ?? [];
    if (!Array.isArray(v) || v.some((x) => typeof x !== 'string' || !x.trim())) errors.push(`«${k}» deve essere un elenco di testi`);
    return Array.isArray(v) ? (v as string[]).map((x) => String(x).trim()) : [];
  };
  const date = (k: string, v: unknown) => {
    const s = v instanceof Date ? v.toISOString().slice(0, 10) : String(v ?? '');
    if (!DATE.test(s)) errors.push(`«${k}» deve essere una data AAAA-MM-GG`);
    else if (s > today) errors.push(`«${k}» è nel futuro (${s})`);
    return s;
  };

  if (!SLUG.test(slug)) errors.push('il nome del file deve essere fatto di lettere minuscole, numeri e trattini');
  if (slug === 'glossario') errors.push('«glossario» è l’indirizzo del glossario generale: scegli un altro nome per il file');
  const titolo = str('titolo', 90);
  const sottotitolo = str('sottotitolo', 200);
  const percorso = str('percorso', 40);
  if (percorso && !PERCORSI.some((p) => p.id === percorso)) errors.push(`percorso «${percorso}» sconosciuto (vedi src/learn/percorsi.ts)`);
  const ordine = int('ordine', 1, 999);
  const minuti = int('minuti', 1, 60);
  const verificato = date('verificato', d.verificato);
  if (DATE.test(verificato)) {
    const days = (Date.parse(today) - Date.parse(verificato)) / 86_400_000;
    if (days > 365) warnings.push(`fonti verificate l'ultima volta più di un anno fa (${verificato}): ricontrollarle`);
  }
  let revisione: ArticleData['revisione'];
  if (d.revisione != null) {
    const r = d.revisione as Record<string, unknown>;
    if (typeof r.nome !== 'string' || typeof r.ruolo !== 'string') errors.push('«revisione» deve avere nome e ruolo di chi ha rivisto l’articolo');
    else revisione = { nome: r.nome.trim(), ruolo: r.ruolo.trim(), data: date('revisione.data', r.data) };
  }
  const riassunto = list('riassunto');
  if (riassunto.length < 2 || riassunto.length > 5) errors.push('«riassunto» deve avere da 2 a 5 punti');
  const glossarioRaw = d.glossario ?? [];
  const glossario: ArticleData['glossario'] = [];
  if (!Array.isArray(glossarioRaw)) errors.push('«glossario» deve essere un elenco');
  else
    for (const g of glossarioRaw as Record<string, unknown>[]) {
      if (typeof g?.termine !== 'string' || typeof g?.definizione !== 'string') errors.push('ogni voce del glossario vuole «termine» e «definizione»');
      else glossario.push({ termine: g.termine.trim(), definizione: g.definizione.trim() });
    }
  const fontiRaw = d.fonti ?? [];
  const fonti: Fonte[] = [];
  if (!Array.isArray(fontiRaw)) errors.push('«fonti» deve essere un elenco');
  else
    for (const f of fontiRaw as Record<string, unknown>[]) {
      if (typeof f?.testo !== 'string' || !f.testo.trim()) {
        errors.push('ogni fonte vuole almeno «testo»');
        continue;
      }
      if (f.url != null) {
        if (typeof f.url !== 'string' || !isAllowedLink(f.url)) errors.push(`fonte con link non ammesso (solo https e siti in lista, src/lib/sanitize.ts): ${String(f.url)}`);
        fonti.push({ testo: f.testo.trim(), url: String(f.url) });
      } else fonti.push({ testo: f.testo.trim() });
    }
  if (fonti.length < MIN_FONTI) errors.push(`servono almeno ${MIN_FONTI} fonti (ce ne sono ${fonti.length})`);
  if (!fonti.some((f) => f.url)) errors.push('almeno una fonte deve avere un link, così chiunque può controllarla');
  const notaDati = d.notaDati == null ? undefined : str('notaDati', 600);
  const riassuntoTitolo = d.riassuntoTitolo == null ? undefined : str('riassuntoTitolo', 40);

  const data: ArticleData = {
    slug,
    titolo,
    sottotitolo,
    percorso,
    ordine,
    minuti,
    verificato,
    revisione,
    correlati: list('correlati'),
    paroleChiave: list('paroleChiave'),
    riassuntoTitolo,
    riassunto,
    glossario,
    fonti,
    notaDati,
  };
  return { data: errors.length ? null : data, errors, warnings };
}

/** Tutti gli articoli, controllati. Lancia un errore (che ferma il build) se qualcosa non va. */
export function readArticles(dir = ARTICLES_DIR, today = new Date().toISOString().slice(0, 10)): { articles: ArticleData[]; warnings: string[] } {
  const files = fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => f.endsWith('.mdx')).sort() : [];
  const problems: string[] = [];
  const warnings: string[] = [];
  const articles: ArticleData[] = [];
  for (const f of files) {
    const slug = f.replace(/\.mdx$/, '');
    try {
      const r = check(slug, frontmatter(path.join(dir, f)), today);
      problems.push(...r.errors.map((e) => `${f}: ${e}`));
      warnings.push(...r.warnings.map((w) => `${f}: ${w}`));
      if (r.data) articles.push(r.data);
    } catch (e) {
      problems.push(`${f}: ${(e as Error).message}`);
    }
  }
  const slugs = new Set(articles.map((a) => a.slug));
  const seen = new Map<string, string>();
  for (const a of articles) {
    for (const c of a.correlati) if (!slugs.has(c)) problems.push(`${a.slug}.mdx: articolo correlato «${c}» inesistente`);
    const key = `${a.percorso}#${a.ordine}`;
    if (seen.has(key)) problems.push(`${a.slug}.mdx: stesso «ordine» (${a.ordine}) di ${seen.get(key)} nel percorso «${a.percorso}»`);
    seen.set(key, `${a.slug}.mdx`);
  }
  if (problems.length) throw new Error(`Articoli da sistemare:\n  - ${problems.join('\n  - ')}`);
  const order = (p: string) => PERCORSI.findIndex((x) => x.id === p);
  articles.sort((a, b) => order(a.percorso) - order(b.percorso) || a.ordine - b.ordine);
  return { articles, warnings };
}

export const toCard = ({ slug, titolo, sottotitolo, percorso, ordine, minuti, verificato, revisione, correlati, paroleChiave }: ArticleData): ArticleCard => ({
  slug,
  titolo,
  sottotitolo,
  percorso,
  ordine,
  minuti,
  verificato,
  revisione,
  correlati,
  paroleChiave,
});

/**
 * Il glossario generale: tutte le parole dei glossari degli articoli, in ordine alfabetico. La stessa parola spiegata
 * in più articoli («Replica» e «Repliche», «Faglia») diventa una voce sola, con una spiegazione per articolo:
 * ogni spiegazione è stata approvata dentro il suo articolo, quindi non ne scegliamo una al posto delle altre.
 */
export function buildGlossary(articles: ArticleData[]): GlossaryEntry[] {
  const byKey = new Map<string, GlossaryEntry>();
  const ids = new Set<string>();
  for (const a of articles) {
    for (const g of a.glossario) {
      const key = termKey(g.termine) || fold(g.termine);
      let entry = byKey.get(key);
      if (!entry) {
        let id = fold(g.termine).replace(/ /g, '-') || 'parola';
        while (ids.has(id)) id += '-2';
        ids.add(id);
        entry = { id, termine: g.termine, voci: [] };
        byKey.set(key, entry);
      }
      entry.voci.push({ slug: a.slug, definizione: g.definizione });
    }
  }
  return [...byKey.values()].sort((x, y) => x.termine.localeCompare(y.termine, 'it', { sensitivity: 'base' }));
}

/** Il testo di tutti gli articoli, per la ricerca. */
export function buildTexts(articles: ArticleData[], dir = ARTICLES_DIR): ArticleText[] {
  return articles.map((a) => ({
    slug: a.slug,
    riassunto: a.riassunto,
    sezioni: articleSections(fs.readFileSync(path.join(dir, `${a.slug}.mdx`), 'utf8')),
  }));
}

/** I moduli creati dagli articoli: catalogo leggero, glossario, testo per la ricerca. */
const MODULES: Record<string, (articles: ArticleData[]) => unknown> = {
  'virtual:articoli': (articles) => articles.map(toCard),
  'virtual:glossario': buildGlossary,
  'virtual:ricerca': (articles) => buildTexts(articles),
};
const resolved = (id: string) => `\0${id}`;

/** Plugin di Vite: prepara i moduli qui sopra. */
export function articoliPlugin(): Plugin {
  return {
    name: 'quakeitalia-articoli',
    resolveId: (id) => (id in MODULES ? resolved(id) : null),
    load(id) {
      const name = Object.keys(MODULES).find((m) => resolved(m) === id);
      if (!name) return null;
      const { articles, warnings } = readArticles();
      if (name === 'virtual:articoli') for (const w of warnings) this.warn(w);
      for (const f of fs.readdirSync(ARTICLES_DIR)) this.addWatchFile(path.join(ARTICLES_DIR, f));
      return `export default ${JSON.stringify(MODULES[name](articles))};`;
    },
    handleHotUpdate(ctx) {
      // Se cambia un articolo, catalogo, glossario e testo per la ricerca vanno riletti.
      if (ctx.file.startsWith(ARTICLES_DIR.replace(/\\/g, '/')) || ctx.file.startsWith(ARTICLES_DIR)) {
        for (const name of Object.keys(MODULES)) {
          const mod = ctx.server.moduleGraph.getModuleById(resolved(name));
          if (mod) ctx.server.moduleGraph.invalidateModule(mod);
        }
      }
    },
  };
}
