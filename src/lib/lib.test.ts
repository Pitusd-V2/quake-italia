import { describe, expect, it } from 'vitest';
import { buildQueryUrl, ITALY_BOUNDS, onlyWithin, parseCollection, parseIngvTime } from './ingv';
import { distanceFrom, feltEstimate, fromPlace, magLevel, placeText } from './describe';
import { coarse, distanceKm } from './geo';
import { groupStreets } from './geocode';
import { formatWhen, timeAgo } from './format';
import { bValue, completenessMaxc, frequencyMagnitude } from './stats';
import type { Quake } from './types';

const quake = (over: Partial<Quake> = {}): Quake => ({
  id: '1', time: new Date('2026-10-20T12:00:00Z'), lat: 42.8, lon: 13.1, depthKm: 10, mag: 3,
  magType: 'ML', place: '4 km E Norcia (PG)', author: 'SURVEY-INGV', version: 100, type: 'earthquake', ...over,
});

describe('INGV', () => {
  it("legge l'ora UTC senza 'Z' e con 6 decimali", () => {
    expect(parseIngvTime('2026-10-20T19:10:16.970000')?.toISOString()).toBe('2026-10-20T19:10:16.970Z');
    expect(parseIngvTime('non una data')).toBeNull();
  });

  it('converte il GeoJSON e scarta le righe incomplete', () => {
    const qs = parseCollection({
      features: [
        { properties: { eventId: 47587182, time: '2026-10-20T18:40:55.620000', mag: 1.5, magType: 'ML', place: '4 km E Bolognola (MC)', version: 100 }, geometry: { coordinates: [13.2818, 42.997, 24.7] } },
        { properties: { eventId: 2, time: '2026-10-20T18:40:55', mag: null }, geometry: { coordinates: [13, 42, 5] } },
      ],
    });
    expect(qs).toHaveLength(1);
    expect(qs[0]).toMatchObject({ id: '47587182', lat: 42.997, lon: 13.2818, depthKm: 24.7, mag: 1.5 });
  });

  it('costruisce la richiesta FDSN', () => {
    const url = new URL(buildQueryUrl({ start: new Date('2026-10-13T19:00:00Z'), bounds: ITALY_BOUNDS, minMag: 2 }));
    expect(url.searchParams.get('format')).toBe('geojson');
    expect(url.searchParams.get('starttime')).toBe('2026-10-13T19:00:00');
    expect(url.searchParams.get('minlat')).toBe('35');
    expect(url.searchParams.get('minmag')).toBe('2');
    const around = new URL(buildQueryUrl({ start: new Date(0), around: { lat: 42.7, lon: 13.2, radiusKm: 100 } }));
    expect(around.searchParams.get('maxradiuskm')).toBe('100');
    expect(around.searchParams.has('minlat')).toBe(false);
  });

  it('non manda all’INGV il punto esatto di casa', () => {
    const home = { lat: 40.83594, lon: 14.24881 };
    const url = new URL(buildQueryUrl({ start: new Date(0), around: { ...home, radiusKm: 30, personal: true }, limit: 5 }));
    // Coordinate arrotondate a circa 1 km, cerchio più largo di 1 km, qualche scossa in più da cui scegliere.
    expect(url.searchParams.get('lat')).toBe('40.84');
    expect(url.searchParams.get('lon')).toBe('14.25');
    expect(url.searchParams.get('maxradiuskm')).toBe('31');
    expect(url.searchParams.get('limit')).toBe('10');
    expect(url.href).not.toContain('40.8359');
    // L'arrotondamento non sposta mai il punto più di quanto il cerchio è stato allargato.
    for (const p of [home, { lat: 45.005, lon: 7.005 }, { lat: 36.995, lon: 15.085 }]) expect(distanceKm(p, coarse(p, 2))).toBeLessThan(1);
    // Una ricerca degli esperti attorno a un punto scritto a mano resta precisa.
    const exact = new URL(buildQueryUrl({ start: new Date(0), around: { ...home, radiusKm: 30 }, limit: 5 }));
    expect(exact.searchParams.get('lat')).toBe('40.8359');
    expect(exact.searchParams.get('limit')).toBe('5');
  });

  it('tiene solo le scosse entro il raggio vero dal punto di casa', () => {
    const home = { lat: 42.8, lon: 13.1 };
    const near = quake({ id: 'a', lat: 42.9, lon: 13.1 }); // circa 11 km
    const ring = quake({ id: 'b', lat: 43.075, lon: 13.1 }); // circa 30,6 km: dentro il cerchio allargato, fuori dal raggio
    const q = { start: new Date(0), around: { ...home, radiusKm: 30, personal: true } };
    expect(onlyWithin(q, [near, ring]).map((x) => x.id)).toEqual(['a']);
    expect(onlyWithin({ ...q, limit: 1 }, [near, quake({ id: 'c' })]).map((x) => x.id)).toEqual(['a']);
    // Senza punto personale non si tocca niente.
    expect(onlyWithin({ start: new Date(0), around: { ...home, radiusKm: 30 } }, [near, ring])).toHaveLength(2);
  });
});

describe('Ricerca della via per il punto di casa', () => {
  const street = (name: string, city: string, lon: number, lat: number, extra: Record<string, unknown> = {}) => ({
    properties: { type: 'street', name, city, countrycode: 'IT', ...extra } as Record<string, string | undefined>,
    geometry: { coordinates: [lon, lat] as [number, number] },
  });
  const napoli = { name: 'Napoli', lat: 40.84, lon: 14.25 };

  it('riunisce i pezzi della stessa via e mette prima quelle del comune scelto', () => {
    const found = groupStreets(
      [
        street('Via Roma', 'Pozzuoli', 14.12, 40.82),
        street('Via Alessandro Manzoni', 'Napoli', 14.1923, 40.807, { district: 'Municipalità 1', extent: [14.192, 40.808, 14.193, 40.806] }),
        street('Via Alessandro Manzoni', 'Napoli', 14.2133, 40.8357, { district: 'Municipalità 1' }),
        { ...street('Bar Manzoni', 'Napoli', 14.2, 40.8), properties: { type: 'house', name: 'Bar Manzoni', city: 'Napoli' } },
        street('Via Fuori', 'Napoli', 500, 40.8),
      ],
      napoli,
    );
    expect(found.map((s) => s.name)).toEqual(['Via Alessandro Manzoni', 'Via Roma']);
    expect(found[0].detail).toBe('Municipalità 1, Napoli');
    // Il rettangolo contiene tutti i pezzi, anche lontani qualche km.
    expect(found[0].bounds).toEqual({ minLat: 40.806, maxLat: 40.8357, minLon: 14.192, maxLon: 14.2133 });
  });

  it('toglie link e pezzi di HTML dai nomi che arrivano da fuori', () => {
    const [s] = groupStreets([street('Via <b>Roma</b> http://evil.example', 'Napoli', 14.25, 40.84)], napoli);
    expect(s.name).toBe('Via Roma');
  });
});

describe('Da dove partono le distanze', () => {
  it('«da casa tua» solo se il punto è stato indicato', () => {
    const napoli = { name: 'Napoli', lat: 40.84, lon: 14.25 };
    expect(fromPlace(napoli)).toBe('da Napoli');
    expect(fromPlace({ ...napoli, point: 'map' })).toBe('da casa tua');
    expect(fromPlace({ ...napoli, point: 'gps' })).toBe('da casa tua');
    expect(distanceFrom(quake({ lat: 40.84, lon: 14.14 }), { ...napoli, point: 'map' })).toBe('a 9 km da casa tua');
  });
});

describe('Testi semplici', () => {
  it('traduce la località INGV', () => {
    expect(placeText('4 km E Bolognola (MC)')).toEqual({
      full: '4 km a est di Bolognola (Macerata)',
      main: 'Bolognola',
      sub: '4 km a est · provincia di Macerata',
    });
    expect(placeText('3 km SW Monte Cavallo (MC)').full).toBe('3 km a sud-ovest di Monte Cavallo (Macerata)');
    expect(placeText("2 km NW L'Aquila (AQ)").full).toBe("2 km a nord-ovest di L'Aquila (L'Aquila)");
    expect(placeText('Mar Ionio Meridionale [Mare]').full).toBe('Mar Ionio Meridionale (in mare)');
    expect(placeText('Vanuatu Islands [Sea: Vanuatu]').full).toBe('Vanuatu Islands');
  });

  it('assegna i livelli di magnitudo', () => {
    expect(magLevel(1.9).name).toBe('Microscossa');
    expect(magLevel(2).name).toBe('Molto leggera');
    expect(magLevel(3.4).name).toBe('Leggera');
    expect(magLevel(4.0).name).toBe('Moderata');
    // In Italia da 4,5 sono possibili danni lievi: non è più «moderata».
    expect(magLevel(4.8).name).toBe('Forte');
    expect(magLevel(5).name).toBe('Molto forte');
    // Molto superficiale (come ai vulcani): un livello in più da 3,8, e la spiegazione dice perché.
    expect(magLevel(4.4, 2.6)).toMatchObject({ name: 'Forte', shallow: true });
    expect(magLevel(4.7, 2.5).name).toBe('Molto forte');
    expect(magLevel(3.9, 1.5).name).toBe('Moderata');
    expect(magLevel(4.4, 2.6).feel).toContain('molto superficiale');
    // Stessa magnitudo ma profonda: nessun livello in più.
    expect(magLevel(4.4, 10).name).toBe('Moderata');
    expect(magLevel(3.5, 2).name).toBe('Leggera');
    expect(magLevel(6.5).name).toBe('Molto forte');
  });

  it('stima se la scossa è stata avvertita', () => {
    const at = { lat: 42.8, lon: 13.1, name: 'Qui' };
    expect(feltEstimate(quake({ mag: 3.5 }), at).key).toBe('clear');
    expect(feltEstimate(quake({ mag: 1.2, lat: 43.2 }), at).key).toBe('no');
    // Una M5 a ~100 km si sente ancora.
    expect(feltEstimate(quake({ mag: 5, lat: 43.7 }), at).key).not.toBe('no');
  });

  it('scrive date e tempi relativi in italiano', () => {
    const now = new Date('2026-10-20T20:00:00Z'); // 22:00 in Italia
    expect(formatWhen(new Date('2026-10-20T19:30:00Z'), now)).toBe('oggi alle 21:30');
    expect(formatWhen(new Date('2026-10-19T19:30:00Z'), now)).toBe('ieri alle 21:30');
    expect(timeAgo(new Date('2026-10-20T19:55:00Z'), now)).toBe('5 minuti fa');
    expect(timeAgo(new Date('2026-10-20T17:00:00Z'), now)).toBe('3 ore fa');
  });

  it('calcola le distanze', () => {
    // Roma - Milano ~ 477 km
    expect(distanceKm({ lat: 41.9028, lon: 12.4964 }, { lat: 45.4642, lon: 9.19 })).toBeGreaterThan(470);
    expect(distanceKm({ lat: 41.9028, lon: 12.4964 }, { lat: 45.4642, lon: 9.19 })).toBeLessThan(485);
  });
});

describe('Statistiche', () => {
  // Catalogo sintetico che segue Gutenberg-Richter con b = 1 sopra M 1.0.
  const synthetic: Quake[] = [];
  let id = 0;
  for (let m = 1.0; m <= 4.0001; m += 0.1) {
    const n = Math.round(1000 * (10 ** (-(m - 1.0)) - 10 ** (-(m + 0.1 - 1.0))));
    for (let i = 0; i < n; i++) synthetic.push(quake({ id: String(id++), mag: Math.round(m * 10) / 10 }));
  }
  // Sotto la completezza il catalogo "perde" eventi.
  for (let i = 0; i < 80; i++) synthetic.push(quake({ id: String(id++), mag: 0.8 }));

  it('costruisce la distribuzione frequenza-magnitudo', () => {
    const bins = frequencyMagnitude(synthetic);
    expect(bins[0].mag).toBe(0.8);
    expect(bins[0].cumulative).toBe(synthetic.length);
    expect(bins.every((b, i) => i === 0 || b.cumulative <= bins[i - 1].cumulative)).toBe(true);
  });

  it('stima Mc e b-value vicino a 1', () => {
    const mc = completenessMaxc(frequencyMagnitude(synthetic));
    expect(mc).toBe(1.2);
    const fit = bValue(synthetic, 1.0)!;
    expect(fit.b).toBeGreaterThan(0.9);
    expect(fit.b).toBeLessThan(1.1);
    expect(fit.sigma).toBeGreaterThan(0);
  });
});

describe('Località duplicate', () => {
  it('rimuove la ripetizione tra parentesi', () => {
    expect(placeText('Svizzera (SVIZZERA)').full).toBe('Svizzera');
    expect(placeText('Costa Marchigiana Anconetana (Ancona)').full).toBe('Costa Marchigiana Anconetana (Ancona)');
  });
});

describe('Tempo trascorso lungo', () => {
  it('usa mesi e anni per gli eventi vecchi', () => {
    const now = new Date('2026-10-20T20:00:00Z');
    expect(timeAgo(new Date('2026-07-20T20:00:00Z'), now)).toBe('3 mesi fa');
    expect(timeAgo(new Date('2016-10-30T06:40:17Z'), now)).toBe('9 anni fa');
  });
});
