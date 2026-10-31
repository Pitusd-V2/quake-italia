import { describe, expect, it } from 'vitest';
import { sanitizeSettings } from '../state/settings';
import type { Quake } from '../lib/types';
import { isRelevant } from './useQuakeAlerts';

const NOW = Date.parse('2026-10-30T12:00:00Z');
const HOME = { name: 'Norcia', lat: 42.79, lon: 13.09 };
/** Una scossa a `km` a nord di Norcia, 5 minuti fa. */
const q = (km: number, mag: number, depthKm = 10): Quake => ({
  id: 'x', time: new Date(NOW - 5 * 60_000), lat: HOME.lat + km / 111.195, lon: HOME.lon, depthKm, mag,
  magType: 'ML', place: 'Test', author: 'TEST', version: 1, type: 'earthquake',
});
// Impostazioni di base (raggio 30 km, avvisi da magnitudo 2,5) con il comune impostato.
const settings = { ...sanitizeSettings({}), home: HOME };

describe('avvisi delle nuove scosse', () => {
  it('il raggio di base è 30 km', () => {
    expect(sanitizeSettings({}).radiusKm).toBe(30);
  });

  it('avvisa per le scosse vicine dalla magnitudo scelta', () => {
    expect(isRelevant(q(20, 2.6), settings, NOW)).toBe(true);
    expect(isRelevant(q(20, 2.0), settings, NOW)).toBe(false);
  });

  it('avvisa anche per una scossa lontana che a casa si può essere sentita', () => {
    // Fuori dai 30 km, ma una 4,5 a 60 km a casa arriva come «leggera» (grado III): va segnalata.
    expect(isRelevant(q(60, 4.5), settings, NOW)).toBe(true);
  });

  it('non avvisa per una scossa lontana che a casa non si sente', () => {
    expect(isRelevant(q(60, 3), settings, NOW)).toBe(false);
  });

  it('non avvisa per scosse vecchie', () => {
    const old = { ...q(10, 4), time: new Date(NOW - 3 * 3_600_000) };
    expect(isRelevant(old, settings, NOW)).toBe(false);
  });
});
