import { describe, expect, it } from 'vitest';
import { norm, parseZone } from './seismicZones';
import { scriptedQuakes } from '../dev/simulation';
import data from '../data/zone-sismiche.json';

describe('Zone sismiche', () => {
  it('legge i codici ufficiali', () => {
    expect(parseZone('1')).toEqual({ zone: 1, mixed: false });
    expect(parseZone('2B')).toEqual({ zone: 2, mixed: false });
    expect(parseZone('2A-3A-3B')).toEqual({ zone: 2, mixed: true });
    expect(parseZone('3S')).toEqual({ zone: 3, mixed: false });
  });

  it('contiene i comuni attesi', () => {
    const rows = data.comuni as string[];
    const find = (name: string) => rows.find((r) => norm(r.split(';')[0]) === norm(name));
    expect(rows.length).toBeGreaterThan(7800);
    expect(find('Norcia')).toBe('Norcia;PG;1');
    expect(find('Cagliari')).toBe('Cagliari;CA;4');
  });
});

describe('Simulazione', () => {
  it('la scossa forte ha repliche più deboli e successive', () => {
    const qs = scriptedQuakes({ scenario: 'forte', startedAt: 1_800_000_000_000, center: { lat: 42.79, lon: 13.09, name: 'Norcia' }, fakeGps: false });
    const [main, ...after] = qs;
    expect(main.mag).toBe(4.8);
    expect(after.length).toBeGreaterThan(30);
    expect(after.every((q) => q.mag < main.mag && q.time > main.time)).toBe(true);
    expect(main.author).toBe('SIMULAZIONE');
  });
});
