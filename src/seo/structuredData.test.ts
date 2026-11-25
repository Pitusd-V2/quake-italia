import { describe, expect, it } from 'vitest';
import { CATALOG } from '../learn/catalog';
import { PERCORSI } from '../learn/percorsi';
import { lastModified, structuredData, structuredDataTags } from './structuredData';

const SITE = 'https://quakeitalia.it';
type Node = Record<string, unknown>;
const graph = (path: string) => (structuredData(path, SITE)[0]?.['@graph'] ?? []) as Node[];
const ofType = (path: string, type: string) => graph(path).find((n) => n['@type'] === type);

describe('Dati strutturati', () => {
  it('la home descrive il sito e chi lo cura', () => {
    expect(ofType('/', 'WebSite')?.name).toBe('Quake Italia');
    expect(ofType('/', 'Organization')?.url).toBe(`${SITE}/`);
  });

  it('ogni articolo ha titolo, data vera dell’ultimo controllo e percorso', () => {
    for (const card of CATALOG) {
      const path = `/capire/${card.slug}`;
      const article = ofType(path, 'Article');
      expect(article?.headline).toBe(card.titolo);
      expect(article?.dateModified).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(article?.dateModified).toBe(card.verificato);
      // Nessuna data di pubblicazione inventata.
      expect(article).not.toHaveProperty('datePublished');
      const crumbs = (ofType(path, 'BreadcrumbList')?.itemListElement ?? []) as Node[];
      expect(crumbs.map((c) => c.name)).toEqual([
        'Quake Italia',
        'Capire',
        PERCORSI.find((p) => p.id === card.percorso)!.titolo,
        card.titolo,
      ]);
      expect(crumbs.at(-1)).not.toHaveProperty('item');
      expect(lastModified(path)).toBe(card.verificato);
    }
  });

  it('le altre pagine non hanno dati strutturati né date inventate', () => {
    expect(structuredData('/cosa-fare', SITE)).toEqual([]);
    expect(structuredData('/capire/non-esiste', SITE)).toEqual([]);
    expect(lastModified('/cosa-fare')).toBeUndefined();
  });

  it('il JSON nel tag non può chiudere lo script', () => {
    const tags = structuredDataTags(`/capire/${CATALOG[0].slug}`, SITE);
    expect(tags.startsWith('<script type="application/ld+json">')).toBe(true);
    const inner = tags.slice('<script type="application/ld+json">'.length, -'</script>'.length);
    expect(inner).not.toContain('<');
    expect(() => JSON.parse(inner)).not.toThrow();
  });
});
