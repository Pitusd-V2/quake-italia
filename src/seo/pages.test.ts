import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ARTICLES } from '../learn/articles';
import { HOME_TITLE, metaFor, PAGES } from './pages';

describe('Pagine per Google e anteprime dei link', () => {
  it('ogni articolo ha la sua pagina generata con il testo', () => {
    for (const a of ARTICLES) {
      const p = PAGES.find((x) => x.path === `/capire/${a.slug}`);
      expect(p?.prerender, a.slug).toBe('full');
      expect(p?.description).toBe(a.subtitle);
    }
  });

  it('titoli e descrizioni ci sono, sono unici e non troppo lunghi', () => {
    const titles = new Set(PAGES.map((p) => p.title));
    expect(titles.size).toBe(PAGES.length);
    for (const p of PAGES) {
      expect(p.title.length, p.path).toBeLessThanOrEqual(80);
      expect(p.description.length, p.path).toBeGreaterThan(40);
      expect(p.description.length, p.path).toBeLessThanOrEqual(200);
    }
  });

  it('le pagine con dati dal vivo non vengono scritte nell’HTML fisso (invecchierebbero)', () => {
    for (const path of ['/', '/terremoti', '/ho-sentito', '/il-mio-comune']) {
      expect(PAGES.find((p) => p.path === path)?.prerender, path).not.toBe('full');
    }
  });

  it('metaFor riconosce le pagine, anche con la barra finale, e per le altre usa quelli generali', () => {
    expect(metaFor('/cosa-fare/').title).toContain('Cosa fare');
    expect(metaFor('/terremoto/123').title).toBe(HOME_TITLE);
  });

  it('_redirects non ha la regola «tutto → index.html», che nasconderebbe le pagine generate', () => {
    const rules = readFileSync(join(__dirname, '../../public/_redirects'), 'utf8')
      .split('\n')
      .filter((l) => l.trim() && !l.startsWith('#'));
    expect(rules.some((l) => /^\/\*\s/.test(l))).toBe(false);
    for (const r of rules) expect(r).toMatch(/^\/(terremoto|sequenza)\/\*\s+\/index\.html\s+200$/);
  });
});
