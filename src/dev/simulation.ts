/**
 * SIMULAZIONI — solo in sviluppo (`npm run dev`).
 * Aggiungono terremoti finti ai dati veri dell'INGV per vedere come reagisce l'app
 * (stato "vicino a te", avvisi, pagina "Cosa sta succedendo"...).
 * In produzione questo file non viene nemmeno incluso.
 */
import { bearingDeg, distanceKm } from '../lib/geo';
import type { QuakeQuery } from '../lib/ingv';
import type { LatLon, Quake } from '../lib/types';

export type Scenario = 'off' | 'forte' | 'leggera' | 'danni' | 'giorni';

export interface SimState {
  scenario: Scenario;
  /** Quando è iniziata la simulazione: gli eventi sono calcolati rispetto a questo istante. */
  startedAt: number;
  center: LatLon & { name: string };
  /** Usa una posizione GPS finta (vicino al centro) invece di quella vera. */
  fakeGps: boolean;
}

const KEY = 'quakeitalia:sim';

export function getSim(): SimState | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as SimState) : null;
  } catch {
    return null;
  }
}

export function setSim(s: SimState | null): void {
  try {
    if (s) sessionStorage.setItem(KEY, JSON.stringify(s));
    else sessionStorage.removeItem(KEY);
  } catch {
    /* niente */
  }
}

/** Generatore pseudo-casuale con seme: la stessa simulazione dà sempre gli stessi eventi. */
function rng(seed: number) {
  let s = seed % 2147483647 || 1;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

const CODES = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
/** Descrizione nello stile INGV: "5 km NE Norcia". */
const describe = (from: LatLon & { name: string }, at: LatLon) =>
  `${Math.max(1, Math.round(distanceKm(from, at)))} km ${CODES[Math.round(bearingDeg(from, at) / 45) % 8]} ${from.name}`;

/** Sposta un punto di `km` verso nord e `kmEst` verso est. */
const offset = (p: LatLon, kmNord: number, kmEst: number): LatLon => ({
  lat: p.lat + kmNord / 111.2,
  lon: p.lon + kmEst / (111.2 * Math.cos((p.lat * Math.PI) / 180)),
});

function fake(id: string, at: LatLon, time: number, mag: number, depthKm: number, place: string): Quake {
  return {
    id, time: new Date(time), lat: at.lat, lon: at.lon, depthKm, mag: Math.round(mag * 10) / 10,
    magType: 'ML', place, author: 'SIMULAZIONE', version: 0, type: 'earthquake',
  };
}

/** Tutti gli eventi del copione (anche quelli "futuri", filtrati poi per orario). */
export function scriptedQuakes(s: SimState): Quake[] {
  const r = rng(s.startedAt);
  if (s.scenario === 'leggera') {
    const at = offset(s.center, 6, 7);
    return [fake('sim-leggera', at, s.startedAt - 2 * 60_000, 3.1, 9, describe(s.center, at))];
  }
  if (s.scenario === 'forte') {
    const main = offset(s.center, 8, 0);
    const t0 = s.startedAt - 25 * 60_000;
    const out = [fake('sim-forte', main, t0, 4.8, 10, describe(s.center, main))];
    // Repliche: tante subito, poi sempre meno (legge di Omori), più deboli della principale.
    let t = t0;
    for (let i = 0; i < 60; i++) {
      t += (20_000 + r() * 40_000) * (1 + i * 0.35);
      const at = offset(main, (r() - 0.5) * 12, (r() - 0.5) * 12);
      const mag = 1 + r() ** 3 * 2.6; // per lo più piccole, raramente fino a ~3,6
      out.push(fake(`sim-replica-${i}`, at, t, mag, 7 + r() * 6, describe(s.center, at)));
    }
    return out;
  }
  if (s.scenario === 'danni') {
    // Scossa che può fare danni vicino a casa: qui deve comparire il 112.
    const main = offset(s.center, 5, 3);
    return [fake('sim-danni', main, s.startedAt - 4 * 60_000, 5.8, 9, describe(s.center, main))];
  }
  if (s.scenario === 'giorni') {
    // Sequenza iniziata 4 giorni fa: repliche che calano secondo Omori (p = 1, c = 1 ora).
    const main = offset(s.center, 8, 0);
    const t0 = s.startedAt - 4 * 86_400_000;
    const out = [fake('sim-giorni', main, t0, 4.6, 9, describe(s.center, main))];
    const c = 3_600_000;
    const span = s.startedAt - t0;
    for (let i = 0; i < 220; i++) {
      const t = t0 + c * ((span / c + 1) ** r() - 1);
      const at = offset(main, (r() - 0.5) * 10, (r() - 0.5) * 10);
      out.push(fake(`sim-giorni-${i}`, at, t, 1 + r() ** 3 * 2.4, 7 + r() * 6, describe(s.center, at)));
    }
    return out;
  }
  return [];
}

/** Aggiunge gli eventi simulati che rispettano i filtri della richiesta. */
export function applySimulation(q: QuakeQuery, real: Quake[]): Quake[] {
  const s = getSim();
  if (!s || s.scenario === 'off') return real;
  const now = Date.now();
  let fakes = scriptedQuakes(s).filter((x) => x.time.getTime() <= now);
  if (q.eventId) {
    const hit = fakes.find((x) => x.id === q.eventId);
    return hit ? [hit] : real;
  }
  fakes = fakes.filter((x) => {
    const t = x.time.getTime();
    if (t < q.start.getTime() || (q.end && t > q.end.getTime())) return false;
    if (q.minMag != null && x.mag < q.minMag) return false;
    if (q.maxMag != null && x.mag > q.maxMag) return false;
    if (q.around && distanceKm(q.around, x) > q.around.radiusKm) return false;
    if (!q.around && q.bounds) {
      const b = q.bounds;
      if (x.lat < b.minLat || x.lat > b.maxLat || x.lon < b.minLon || x.lon > b.maxLon) return false;
    }
    return true;
  });
  const all = [...fakes, ...real];
  return q.orderBy === 'magnitude' ? all.sort((a, b) => b.mag - a.mag) : all.sort((a, b) => b.time.getTime() - a.time.getTime());
}

/** Posizione GPS finta (circa 1 km dal centro della simulazione), se attivata. */
export function simulatedPosition(): (LatLon & { accuracyM: number }) | null {
  const s = getSim();
  if (!s?.fakeGps) return null;
  return { ...offset(s.center, 0.6, -0.8), accuracyM: 18 };
}
