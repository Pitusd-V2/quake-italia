/**
 * Le aree vulcaniche italiane dove le scosse sono molto superficiali: lì la stessa scossa si sente in modo molto
 * diverso a pochi chilometri di distanza (Ischia 2017, Campi Flegrei, i fianchi dell'Etna). Centro e raggio in km:
 * sono cerchi indicativi, servono a scegliere cosa proporre, non a dire chi è in pericolo. Per le zone ufficiali dei
 * piani di protezione civile (Vesuvio e Campi Flegrei) c'è volcanoZones.ts.
 */
import { distanceKm } from './geo';
import type { LatLon } from './types';

export interface VolcanoArea extends LatLon {
  name: string;
  /** Come si dice «abiti…»: «vicino ai Campi Flegrei», «a Ischia». */
  near: string;
  km: number;
}

export const VOLCANO_AREAS: VolcanoArea[] = [
  { name: 'Campi Flegrei', near: 'vicino ai Campi Flegrei', lat: 40.827, lon: 14.139, km: 12 },
  { name: 'Vesuvio', near: 'vicino al Vesuvio', lat: 40.821, lon: 14.426, km: 10 },
  { name: 'Ischia', near: 'a Ischia', lat: 40.731, lon: 13.897, km: 8 },
  { name: 'Etna', near: 'vicino all’Etna', lat: 37.751, lon: 14.994, km: 25 },
];

/** L'area vulcanica in cui cade un punto (la più vicina, se sono più di una), oppure null. */
export function volcanoNear(at: LatLon): VolcanoArea | null {
  let best: VolcanoArea | null = null;
  let bestKm = Infinity;
  for (const v of VOLCANO_AREAS) {
    const km = distanceKm(at, v);
    if (km <= v.km && km < bestKm) {
      best = v;
      bestKm = km;
    }
  }
  return best;
}
