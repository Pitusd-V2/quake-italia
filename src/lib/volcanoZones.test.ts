import { describe, expect, it } from 'vitest';
import data from '../data/zone-sismiche.json';
import { norm } from './seismicZones';
import { ALL_VOLCANO_COMUNI, volcanoZonesFor } from './volcanoZones';

const official = new Set((data.comuni as string[]).map((row) => {
  const [comune, sigla] = row.split(';');
  return `${norm(comune)}|${sigla}`;
}));

describe('zone rossa e gialla di Vesuvio e Campi Flegrei', () => {
  it('ogni comune esiste nell’elenco ufficiale dei comuni, con la provincia giusta', () => {
    const missing = ALL_VOLCANO_COMUNI.filter(([c, s]) => !official.has(`${norm(c)}|${s}`));
    expect(missing).toEqual([]);
  });

  it('i numeri tornano con quelli della Protezione Civile', () => {
    const count = (volcano: string, zone: string) =>
      new Set(
        ALL_VOLCANO_COMUNI.filter(([c, s]) => volcanoZonesFor(c, s).some((z) => z.volcano === volcano && z.zone === zone)).map(
          ([c, s]) => `${c}|${s}`,
        ),
      ).size;
    expect(count('vesuvio', 'rossa')).toBe(25);
    // 63 comuni più le tre circoscrizioni di Napoli.
    expect(count('vesuvio', 'gialla')).toBe(64);
    expect(count('campi-flegrei', 'rossa')).toBe(7);
  });

  it('distingue i comuni interi da quelli inclusi solo in parte', () => {
    expect(volcanoZonesFor('Pozzuoli', 'NA')).toEqual([{ volcano: 'campi-flegrei', zone: 'rossa', partial: false }]);
    expect(volcanoZonesFor('Ercolano', 'NA')[0]).toMatchObject({ zone: 'rossa', partial: false, twin: 'Emilia-Romagna' });
    const napoli = volcanoZonesFor('Napoli', 'NA');
    expect(napoli).toHaveLength(4);
    expect(napoli.every((z) => z.partial)).toBe(true);
    expect(napoli[0].zone).toBe('rossa');
  });

  it('nel resto d’Italia non c’è nessuna zona vulcanica', () => {
    expect(volcanoZonesFor('Norcia', 'PG')).toEqual([]);
    expect(volcanoZonesFor('Scala', 'SA')).toHaveLength(1);
  });
});
