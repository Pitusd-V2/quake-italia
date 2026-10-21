import { describe, expect, it } from 'vitest';
import { homeImpact, impactAt, intensityAt, isNightInItaly, shows112 } from './impact';
import { sequenceTrend } from './trend';
import type { Quake } from './types';

const HOME = { lat: 42, lon: 13 };
const KM_PER_DEG_LAT = 111.195;
const NOW = new Date('2026-10-21T12:00:00Z');

/** Una scossa a `km` a nord di casa. */
const quakeAt = (km: number, mag: number, depthKm = 10, minutesAgo = 5, id = String(Math.random())): Quake => ({
  id, time: new Date(NOW.getTime() - minutesAgo * 60_000), lat: HOME.lat + km / KM_PER_DEG_LAT, lon: HOME.lon,
  depthKm, mag, magType: 'ML', place: 'Test', author: 'TEST', version: 1, type: 'earthquake',
});

describe('intensità a casa tua (Allen, Wald & Worden 2012)', () => {
  it('riproduce la formula pubblicata', () => {
    // Epicentro sotto casa a 10 km di profondità: distanza ipocentrale 10 km.
    expect(intensityAt(quakeAt(0, 4), HOME)).toBeCloseTo(4.57, 1);
    expect(intensityAt(quakeAt(0, 5), HOME)).toBeCloseTo(5.97, 1);
    // Oltre 50 km entra il termine di attenuazione anelastica.
    expect(intensityAt(quakeAt(150, 5), HOME)).toBeLessThan(3);
  });

  it('una 4,2 a 10 km si sente bene ma non è un’emergenza', () => {
    const q = quakeAt(10, 4.2);
    expect(impactAt(q, HOME)).toBe('felt');
    expect(shows112(impactAt(q, HOME), q.mag)).toBe(false);
  });

  it('una 5,8 vicina può fare danni: il 112 compare', () => {
    const q = quakeAt(8, 5.8);
    expect(impactAt(q, HOME)).toBe('damage');
    expect(shows112('damage', q.mag)).toBe(true);
  });

  it('una 5,5 a 30 km è forte: 112 solo come riga, non come allarme', () => {
    const q = quakeAt(30, 5.5);
    expect(impactAt(q, HOME)).toBe('strong');
    expect(shows112('strong', q.mag)).toBe(true);
    expect(shows112('strong', 4.6)).toBe(false);
  });

  it('una 5 lontana 150 km non è mai «forte»', () => {
    expect(['none', 'weak']).toContain(impactAt(quakeAt(150, 5), HOME));
  });

  it('le scosse che a casa quasi nessuno nota non contano come «sentite»', () => {
    // Il caso reale: una 1,9 a 11 km. Prima era «weak» perché «avvertita da pochi, se fermi o ai piani alti».
    expect(impactAt(quakeAt(11, 1.9, 10), HOME)).toBe('none');
    expect(impactAt(quakeAt(11, 1.9, 5), HOME)).toBe('none');
    expect(impactAt(quakeAt(0, 2, 10), HOME)).toBe('none');
    expect(impactAt(quakeAt(30, 3), HOME)).toBe('none');
    expect(impactAt(quakeAt(80, 4), HOME)).toBe('none');
    expect(homeImpact([quakeAt(11, 1.9)], HOME, NOW)).toBeNull();
  });

  it('una scossa piccola ma vicina resta tra quelle che potresti aver sentito', () => {
    expect(impactAt(quakeAt(10, 3), HOME)).toBe('weak');
    expect(impactAt(quakeAt(5, 2.2, 8), HOME)).toBe('weak');
    expect(impactAt(quakeAt(0, 2.5, 10), HOME)).toBe('weak');
    expect(impactAt(quakeAt(50, 4), HOME)).toBe('weak');
    expect(impactAt(quakeAt(150, 5), HOME)).toBe('weak');
  });

  it('sotto magnitudo 4,5 non parla mai di danni, anche se molto superficiale', () => {
    expect(impactAt(quakeAt(1, 3.5, 2), HOME)).toBe('strong');
    // Come la Md 4,2 dei Campi Flegrei del 2023: forte, ma senza danni.
    const cf = quakeAt(3, 4.2, 3);
    expect(impactAt(cf, HOME)).toBe('strong');
    expect(shows112('strong', cf.mag)).toBe(false);
    // Come la Md 4,6 del 2025: possibili danni.
    expect(impactAt(quakeAt(3, 4.6, 2.5), HOME)).toBe('damage');
  });
});

describe('quale scossa mettere in cima', () => {
  it('una scossa forte di 3 ore fa resta in cima anche se ne arriva una piccola', () => {
    const r = homeImpact([quakeAt(10, 4.8, 10, 180, 'forte'), quakeAt(5, 2.2, 8, 5, 'piccola')], HOME, NOW);
    expect(r).toMatchObject({ fresh: true, impact: 'strong' });
    expect(r!.quake.id).toBe('forte');
  });

  it('passate le 6 ore, la notizia è la scossa appena successa', () => {
    const r = homeImpact([quakeAt(10, 4.8, 10, 8 * 60, 'forte'), quakeAt(5, 2.2, 8, 5, 'piccola')], HOME, NOW);
    expect(r).toMatchObject({ fresh: true, impact: 'weak' });
    expect(r!.quake.id).toBe('piccola');
  });

  it('senza scosse recenti fa il riepilogo con la più sentita', () => {
    const r = homeImpact([quakeAt(60, 3.5, 10, 10 * 60, 'lontana'), quakeAt(10, 3.6, 10, 12 * 60, 'vicina')], HOME, NOW);
    expect(r!.fresh).toBe(false);
    expect(r!.quake.id).toBe('vicina');
  });

  it('i primi minuti sono dati preliminari', () => {
    expect(homeImpact([quakeAt(10, 4, 10, 3)], HOME, NOW)!.preliminary).toBe(true);
    expect(homeImpact([quakeAt(10, 4, 10, 40)], HOME, NOW)!.preliminary).toBe(false);
  });

  it('riconosce la notte in Italia', () => {
    expect(isNightInItaly(new Date('2026-10-21T01:00:00Z'))).toBe(true); // 3:00 ora legale
    expect(isNightInItaly(NOW)).toBe(false);
  });
});

describe('andamento delle repliche', () => {
  const MAIN = new Date(NOW.getTime() - 4 * 86_400_000);
  /** Repliche ogni `everyMin` minuti tra `fromH` e `toH` ore dopo la scossa principale. */
  const series = (fromH: number, toH: number, everyMin: number) => {
    const out: Quake[] = [];
    for (let t = fromH * 60; t < toH * 60; t += everyMin) out.push({ ...quakeAt(5, 2), time: new Date(MAIN.getTime() + t * 60_000) });
    return out;
  };

  it('calo come da legge di Omori → «in calo»', () => {
    const after = [...series(48, 72, 30), ...series(72, 96, 120)];
    expect(sequenceTrend(after, MAIN, NOW)).toMatchObject({ kind: 'calming', windowHours: 24 });
  });

  it('ritmo costante → «stabile», anche con qualche scossa in più per caso', () => {
    const after = [...series(48, 96, 60), quakeAt(5, 2, 10, 30)];
    expect(sequenceTrend(after, MAIN, NOW).kind).toBe('steady');
  });

  it('forte aumento → «in aumento»', () => {
    const after = [...series(48, 72, 240), ...series(72, 96, 30)];
    expect(sequenceTrend(after, MAIN, NOW).kind).toBe('rising');
  });

  it('nelle prime ore non dà giudizi', () => {
    const main = new Date(NOW.getTime() - 3 * 3_600_000);
    expect(sequenceTrend([quakeAt(5, 2, 10, 60)], main, NOW).kind).toBe('early');
  });

  it('quasi nessuna scossa → «zona quasi tranquilla»', () => {
    expect(sequenceTrend([...series(50, 51, 30)], MAIN, NOW).kind).toBe('quiet');
  });
});
