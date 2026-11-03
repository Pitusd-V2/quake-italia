import { describe, expect, it } from 'vitest';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { readArticles } from '../../plugins/articoli.ts';
import { CATALOG, hasArticleFile } from './catalog';
import { PERCORSI } from './percorsi';
import { formatInt } from '../lib/format';
import slab from '../data/learn/slab.json';
import gr from '../data/learn/gr-italia.json';
import cpti from '../data/learn/cpti15.json';
import tempo from '../data/learn/tempo-terremoto.json';

const { articles } = readArticles();
const summary = (slug: string) => articles.find((a) => a.slug === slug)!.riassunto.join(' ');

describe('Articoli di «Capire»', () => {
  it('il catalogo dell’app e i file coincidono', () => {
    expect(CATALOG.map((c) => c.slug).sort()).toEqual(articles.map((a) => a.slug).sort());
    for (const c of CATALOG) expect(hasArticleFile(c.slug), c.slug).toBe(true);
  });

  it('ogni percorso usato esiste e ogni articolo ha almeno 3 fonti, di cui una con link', () => {
    for (const a of articles) {
      expect(PERCORSI.some((p) => p.id === a.percorso), a.slug).toBe(true);
      expect(a.fonti.length, a.slug).toBeGreaterThanOrEqual(3);
      expect(a.fonti.some((f) => f.url), a.slug).toBe(true);
    }
  });

  // I riassunti sono testo fisso: questi numeri devono restare uguali ai dati da cui vengono.
  it('i numeri dei riassunti coincidono con i dati', () => {
    expect(summary('perche-l-italia-trema')).toContain(`${slab.statistiche.maxProfonditaKm} km`);
    expect(summary('tante-piccole-poche-grandi')).toContain(formatInt(gr.totale));
    expect(summary('grandi-terremoti-della-storia')).toContain(`${formatInt(cpti.totaleEventi)} terremoti dall’anno ${cpti.primoAnno} al ${cpti.ultimoAnno}`);
    expect(summary('tempo-da-terremoto')).toContain(`${tempo.meteo.terremoti} terremoti forti`);
    expect(summary('tempo-da-terremoto')).toContain(`${formatInt(tempo.mesi.n)} terremoti`);
  });
});

describe('Controlli sugli articoli (fermano il build)', () => {
  const write = (name: string, fm: string) => {
    const dir = mkdtempSync(join(tmpdir(), 'articoli-'));
    writeFileSync(join(dir, name), `---\n${fm}\n---\n\nTesto.\n`);
    return dir;
  };
  const good = `titolo: Prova
sottotitolo: Un articolo di prova per i test.
percorso: le-basi
ordine: 1
minuti: 3
verificato: 2026-11-01
riassunto: [Primo punto., Secondo punto.]
fonti:
  - testo: Fonte uno
    url: https://doi.org/10.1/abc
  - testo: Fonte due
  - testo: Fonte tre`;

  it('un articolo in regola passa', () => {
    expect(readArticles(write('prova.mdx', good), '2026-11-03').articles).toHaveLength(1);
  });

  it('meno di 3 fonti: errore', () => {
    const fm = good.replace('  - testo: Fonte tre', '');
    expect(() => readArticles(write('prova.mdx', fm), '2026-11-03')).toThrow(/almeno 3 fonti/);
  });

  it('link a un sito non in lista: errore', () => {
    const fm = good.replace('https://doi.org/10.1/abc', 'https://sito-a-caso.example/x');
    expect(() => readArticles(write('prova.mdx', fm), '2026-11-03')).toThrow(/link non ammesso/);
  });

  it('data di verifica nel futuro o percorso inesistente: errore', () => {
    expect(() => readArticles(write('prova.mdx', good.replace('2026-11-01', '2030-01-01')), '2026-11-03')).toThrow(/nel futuro/);
    expect(() => readArticles(write('prova.mdx', good.replace('le-basi', 'boh')), '2026-11-03')).toThrow(/sconosciuto/);
  });

  it('nome del file non valido: errore', () => {
    expect(() => readArticles(write('Prova Strana.mdx', good), '2026-11-03')).toThrow(/nome del file/);
  });
});
