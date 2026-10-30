import { describe, expect, it } from 'vitest';
import centro from '../data/learn/seq-centro-italia.json';
import flegrei from '../data/learn/seq-campi-flegrei.json';
import { distanceKm } from '../lib/geo';
import { chooseSequence, findMilestone, SEQUENCES, type SequenceData, type SequenceId } from './sequences';

const DATA: Record<SequenceId, SequenceData> = {
  'centro-italia': centro as unknown as SequenceData,
  'campi-flegrei': flegrei as unknown as SequenceData,
};
const RADIUS_KM: Record<SequenceId, number> = { 'centro-italia': 40, 'campi-flegrei': 8 };

describe('sequenze da rivedere sulla mappa', () => {
  for (const id of Object.keys(SEQUENCES) as SequenceId[]) {
    const def = SEQUENCES[id];
    const data = DATA[id];

    it(`${def.name}: ogni tappa è una scossa vera del catalogo INGV, con la stessa magnitudo`, () => {
      for (const m of def.milestones) expect(findMilestone(data, m), m.title).toBeGreaterThanOrEqual(0);
    });

    it(`${def.name}: le tappe sono in ordine di tempo e dentro il periodo dei dati`, () => {
      const times = def.milestones.map((m) => Date.parse(m.at));
      expect([...times].sort((a, b) => a - b)).toEqual(times);
      for (const t of times) {
        expect(t).toBeGreaterThan(Date.parse(data.inizio));
        expect(t).toBeLessThan(Date.parse(data.fine));
      }
    });

    it(`${def.name}: dati ordinati, nella zona della richiesta e sopra la soglia dichiarata`, () => {
      const ev = data.eventi;
      expect(ev.length).toBeGreaterThan(1000);
      for (let i = 1; i < ev.length; i++) expect(ev[i][0]).toBeGreaterThanOrEqual(ev[i - 1][0]);
      for (const e of ev) {
        // Un piccolo margine per l'arrotondamento delle coordinate a 3 decimali.
        expect(distanceKm(def.center, { lat: e[1] / 1000, lon: e[2] / 1000 })).toBeLessThanOrEqual(RADIUS_KM[id] + 0.5);
        expect(e[4] / 10).toBeGreaterThanOrEqual(data.sogliaMag - 1e-9);
      }
    });
  }

  it('la magnitudo delle tappe è quella scritta nel titolo', () => {
    for (const def of Object.values(SEQUENCES)) {
      for (const m of def.milestones) expect(m.title).toContain(String(m.mag).replace('.', ','));
    }
  });

  it('parte dalla sequenza vicina a casa tua, altrimenti da quella dell’articolo', () => {
    expect(chooseSequence({ lat: 40.85, lon: 14.27 }, 'centro-italia')).toBe('campi-flegrei'); // Napoli
    expect(chooseSequence({ lat: 42.79, lon: 13.09 }, 'campi-flegrei')).toBe('centro-italia'); // Norcia
    expect(chooseSequence({ lat: 45.46, lon: 9.19 }, 'campi-flegrei')).toBe('campi-flegrei'); // Milano
    expect(chooseSequence(null, 'centro-italia')).toBe('centro-italia');
  });
});
