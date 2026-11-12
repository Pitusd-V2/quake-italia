import { describe, expect, it } from 'vitest';
import { SECTIONS, SOURCES, sectionText } from './SafetyPage';
import { isAllowedLink } from '../lib/sanitize';

describe('«Cosa fare»: ogni consiglio ha la sua fonte', () => {
  const numbers = new Set(SOURCES.map((s) => s.n));

  it('le fonti sono numerate da 1 in su e hanno un link che il sito può mostrare', () => {
    expect(SOURCES.map((s) => s.n)).toEqual(SOURCES.map((_, i) => i + 1));
    for (const s of SOURCES) expect(isAllowedLink(s.url), s.url).toBe(true);
  });

  it('ogni passo e ogni «da non fare» cita almeno una fonte che esiste', () => {
    for (const s of SECTIONS) {
      const all = [...s.groups.flatMap((g) => g.steps), ...(s.dont ?? [])];
      expect(all.length, s.id).toBeGreaterThan(0);
      for (const item of all) {
        expect(item.src.length, JSON.stringify(item)).toBeGreaterThan(0);
        for (const n of item.src) expect(numbers.has(n), `fonte ${n}`).toBe(true);
      }
    }
  });

  it('il testo letto ad alta voce non contiene i numeri delle fonti', () => {
    expect(sectionText(SECTIONS[0])).toContain('Controlla come stanno le persone vicino a te');
    expect(sectionText(SECTIONS[0])).not.toMatch(/Font[ei] \d/);
  });
});
