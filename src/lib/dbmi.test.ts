import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import zones from '../data/zone-sismiche.json';
import { DBMI_CITATION, DBMI_DOI, historicDate, intensityWords, loadTownHistory, pickTown } from './dbmi';

const DIR = join(import.meta.dirname, '..', 'data', 'dbmi');
const all: Record<string, unknown[]> = {};
for (const f of readdirSync(DIR)) Object.assign(all, JSON.parse(readFileSync(join(DIR, f), 'utf8')));

describe('Storia sismica dei comuni (DBMI15, INGV)', () => {
  it('la citazione è quella chiesta dall’INGV, parola per parola', () => {
    expect(DBMI_CITATION).toBe(
      'Locati M., Camassi R., Rovida A., Ercolani E., Bernardini F., Castelli V., Caracciolo C.H., Tertulliani A., Rossi A., Azzaro R., D’Amico S., Antonucci A. (2022). Database Macrosismico Italiano (DBMI15), versione 4.0 [Data set]. Istituto Nazionale di Geofisica e Vulcanologia (INGV).',
    );
    expect(DBMI_DOI).toBe('https://doi.org/10.13127/dbmi/dbmi15.4');
  });

  it('a Napoli i più sentiti sono quelli del 1456 e del 1688, e c’è l’Irpinia del 1980', async () => {
    const h = await loadTownHistory('Napoli', 'NA');
    expect(h?.place).toBe('Napoli');
    expect(h?.placeId).toBe('IT_60182');
    expect(h?.quakes.slice(0, 2).map((q) => [q.year, q.intensity])).toEqual([[1456, '8'], [1688, '8']]);
    expect(h?.quakes.find((q) => q.year === 1980)).toMatchObject({ intensity: '7', area: 'Irpinia-Basilicata', month: 11, day: 23 });
  });

  it('ad Amatrice compaiono le scosse del 2016', async () => {
    const h = await loadTownHistory('Amatrice', 'RI');
    expect(h?.quakes.filter((q) => q.year === 2016).map((q) => q.intensity).sort()).toEqual(['10', '11']);
  });

  it('trova il comune anche se la provincia è cambiata, ma non sceglie a caso tra comuni con lo stesso nome', () => {
    const row = ['Prova', 'Prova', 'IT_1', 3, 1500, 0, []] as never;
    expect(pickTown({ 'prova|CI': row }, 'Prova', 'SU')?.comune).toBe('Prova');
    expect(pickTown({ 'prova|CI': row, 'prova|BG': row }, 'Prova', 'SU')).toBeNull();
    expect(pickTown({ 'prova|CI': row, 'prova|BG': row }, 'Prova', 'BG')?.comune).toBe('Prova');
  });

  it('dice l’intensità a parole, senza inventare un grado per le sigle', () => {
    expect(intensityWords('8')).toMatchObject({ label: 'Grado 8', name: 'Rovinoso' });
    expect(intensityWords('7-8').text).toMatch(/^Tra il grado 7 e il grado 8\. Al grado 7:/);
    expect(intensityWords('D')).toMatchObject({ label: 'Danni' });
    expect(intensityWords('D').name).toBeUndefined();
    expect(historicDate({ year: 1456, month: 12, day: 5 })).toBe('5 dicembre 1456');
    expect(historicDate({ year: 1280, month: 0, day: 0 })).toBe('1280');
  });

  it('quasi tutti i comuni di oggi hanno la loro storia', () => {
    const rows = (zones as { comuni: string[] }).comuni.map((r) => r.split(';'));
    const found = rows.filter(([comune, sigla]) => pickTown(all as never, comune, sigla)).length;
    console.log(`comuni con una storia sismica: ${found} su ${rows.length}`);
    expect(found / rows.length).toBeGreaterThan(0.9);
  });
});
