import { describe, expect, it } from 'vitest';
import { readArticles, readingParts } from '../../plugins/articoli.ts';
import { CATALOG } from './catalog';
import { duration, readingTime, sanitizeRead } from './readState';

const { articles } = readArticles();

describe('Articoli letti e tempi di lettura', () => {
  it('dell’elenco salvato tiene solo nomi di articolo plausibili, senza doppioni', () => {
    expect(sanitizeRead(['le-faglie', 'le-faglie', '<script>', 42, 'Con Maiuscole', 'cos-e-un-terremoto'])).toEqual(['le-faglie', 'cos-e-un-terremoto']);
    expect(sanitizeRead('le-faglie')).toEqual([]);
    expect(sanitizeRead(null)).toEqual([]);
  });

  it('negli elenchi dice un solo tempo di lettura, quello di tutto l’articolo', () => {
    expect(readingTime({ minuti: 20 })).toBe('20 minuti di lettura');
    expect(readingTime({ minuti: 4 })).toBe('4 minuti di lettura');
    expect(duration(45)).toBe('45 minuti');
    expect(duration(60)).toBe('1 ora');
    expect(duration(151)).toBe('2 ore e 31 minuti');
  });

  it('divide i minuti di un articolo a strati tra le sue parti, senza allontanarsi dal totale', () => {
    for (const a of articles) {
      const parti = readingParts(a);
      if (!parti.length) continue;
      expect(parti.map((p) => p.n), a.slug).toEqual(parti.map((_, i) => i + 1));
      const sum = parti.reduce((s, p) => s + p.minuti, 0);
      expect(Math.abs(sum - a.minuti), a.slug).toBeLessThanOrEqual(parti.length - 1);
      for (const p of parti) expect(p.titolo && p.kicker, a.slug).toBeTruthy();
    }
    expect(readingParts(articles.find((a) => a.slug === 'cos-e-un-terremoto')!)).toEqual([]);
    expect(readingParts(articles.find((a) => a.slug === 'effetti-di-sito')!)).toHaveLength(3);
  });

  it('ogni articolo del catalogo ha la sua domanda', () => {
    for (const c of CATALOG) expect(c.domanda, c.slug).toMatch(/\?$/);
    expect(new Set(CATALOG.map((c) => c.domanda)).size).toBe(CATALOG.length);
  });
});
