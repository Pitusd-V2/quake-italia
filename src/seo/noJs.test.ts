import { describe, expect, it } from 'vitest';
import { CATALOG } from '../learn/catalog';
import { llmsTxt, noScriptHtml } from './noJs';

const SITE = 'https://quakeitalia.it';

describe('Il sito senza JavaScript', () => {
  it('la home elenca tutti gli articoli, con link e domanda', () => {
    const html = noScriptHtml('/');
    expect(html.startsWith('<noscript>')).toBe(true);
    expect(html.endsWith('</noscript>')).toBe(true);
    for (const a of CATALOG) expect(html).toContain(`href="/capire/${a.slug}"`);
    expect(html).toContain('non è un sistema di allerta');
    // Niente script né stili in linea (la CSP li bloccherebbe).
    expect(html).not.toMatch(/<script|style=/i);
  });

  it('le altre pagine non dicono più che serve JavaScript per tutto', () => {
    const html = noScriptHtml('/capire/le-faglie');
    expect(html).toContain('si leggono lo stesso');
    expect(html).not.toContain('devi attivare JavaScript');
  });

  it('llms.txt ha un link per ogni articolo, con indirizzi completi', () => {
    const txt = llmsTxt(SITE);
    expect(txt.startsWith('# Quake Italia\n')).toBe(true);
    for (const a of CATALOG) expect(txt).toContain(`(${SITE}/capire/${a.slug})`);
    expect(txt).not.toMatch(/\]\(\//); // nessun link relativo
  });
});

describe('Riassunti degli articoli', async () => {
  const { articleSummaries } = await import('./noJs');
  it('ogni articolo ha il suo riassunto, e finisce nella home e in llms.txt', async () => {
    const summaries = await articleSummaries();
    for (const a of CATALOG) expect(summaries[a.slug]?.length, a.slug).toBeGreaterThan(0);
    const first = CATALOG[0];
    const point = summaries[first.slug][0];
    expect(llmsTxt(SITE, summaries)).toContain(`  - ${point}`);
    expect(noScriptHtml('/', summaries)).toContain(first.sottotitolo.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'));
  });
});
