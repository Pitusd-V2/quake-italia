import { describe, expect, it } from 'vitest';
import { CATALOG } from './catalog';
import { slugsForQuake, SUGGESTED, type QuakeContext } from './suggest';
import { volcanoNear } from '../lib/volcanoAreas';

const quake = (over: Partial<QuakeContext> = {}): QuakeContext => ({
  lat: 42.8, lon: 13.1, mag: 3, depthKm: 10, magType: 'ML', place: '4 km E Norcia (PG)', ageMin: 3 * 24 * 60, sequence: false, ...over,
});

describe('Aree vulcaniche (dove il punto di casa conta di più)', () => {
  it('riconosce i comuni vicini a un vulcano dal loro centro', () => {
    expect(volcanoNear({ lat: 40.823, lon: 14.122 })?.name).toBe('Campi Flegrei'); // Pozzuoli
    expect(volcanoNear({ lat: 40.8359, lon: 14.2488 })?.name).toBe('Campi Flegrei'); // Napoli, centro
    expect(volcanoNear({ lat: 40.806, lon: 14.352 })?.name).toBe('Vesuvio'); // Ercolano
    expect(volcanoNear({ lat: 40.748, lon: 13.908 })?.name).toBe('Ischia'); // Casamicciola Terme
    expect(volcanoNear({ lat: 37.693, lon: 15.105 })?.name).toBe('Etna'); // Zafferana Etnea
  });

  it('lontano dai vulcani non propone niente', () => {
    expect(volcanoNear({ lat: 42.79, lon: 13.09 })).toBeNull(); // Norcia
    expect(volcanoNear({ lat: 41.9, lon: 12.5 })).toBeNull(); // Roma
    expect(volcanoNear({ lat: 37.5, lon: 15.09 })).toBeNull(); // Catania, a più di 25 km dalla cima dell'Etna
  });
});

describe('Articoli proposti accanto a una scossa', () => {
  it('ogni articolo che le regole possono proporre esiste davvero', () => {
    const slugs = new Set(CATALOG.map((c) => c.slug));
    for (const s of SUGGESTED) expect(slugs.has(s), s).toBe(true);
  });

  it('propone sempre due o tre letture, senza doppioni', () => {
    for (const q of [quake(), quake({ mag: 1.2 }), quake({ mag: 5.8, sequence: true, ageMin: 5, feltAtHome: 'damage' })]) {
      const out = slugsForQuake(q);
      expect(out.length).toBeGreaterThanOrEqual(2);
      expect(out.length).toBeLessThanOrEqual(3);
      expect(new Set(out).size).toBe(out.length);
    }
  });

  it('ai Campi Flegrei parte dall’articolo sui Campi Flegrei, anche solo dalla posizione', () => {
    expect(slugsForQuake(quake({ place: 'Campi Flegrei', lat: 40.83, lon: 14.14, depthKm: 2.5, mag: 4.7, sequence: true }))[0]).toBe('campi-flegrei');
    expect(slugsForQuake(quake({ place: '2 km S Pozzuoli (NA)', lat: 40.81, lon: 14.12 }))[0]).toBe('campi-flegrei');
  });

  it('vicino agli altri vulcani propone «terremoti e vulcani», lontano no', () => {
    expect(slugsForQuake(quake({ place: '3 km NE Milo (CT)', lat: 37.74, lon: 15.14, depthKm: 4 }))[0]).toBe('terremoti-e-vulcani');
    expect(slugsForQuake(quake())).not.toContain('terremoti-e-vulcani');
  });

  it('segue quello che è successo: sequenza, scossa sentita a casa, primi minuti, scossa forte, microscossa', () => {
    expect(slugsForQuake(quake({ sequence: true }))[0]).toBe('repliche-e-sequenze');
    expect(slugsForQuake(quake({ feltAtHome: 'strong' })).slice(0, 2)).toEqual(['magnitudo-e-intensita', 'effetti-di-sito']);
    expect(slugsForQuake(quake({ ageMin: 10 }))).toContain('come-si-trova-un-terremoto');
    expect(slugsForQuake(quake({ mag: 4, ageMin: 120 }))).toContain('perche-la-magnitudo-cambia');
    expect(slugsForQuake(quake({ mag: 5.2 }))).toContain('si-possono-prevedere');
    expect(slugsForQuake(quake({ mag: 1.4 }))).toContain('tante-piccole-poche-grandi');
    // Una scossa qualunque, vecchia e lontana: le due letture generali.
    expect(slugsForQuake(quake())).toEqual(['magnitudo-e-intensita', 'cos-e-un-terremoto']);
  });
});
