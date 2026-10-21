import { distanceKm } from './geo';
import { placeText } from './describe';
import type { Quake } from './types';

export interface ActiveZone {
  name: string;
  center: Quake;
  quakes: Quake[];
  strongest: Quake;
}

/**
 * Raggruppa le scosse vicine tra loro (entro `radiusKm`) per mostrare
 * "le zone più attive". Semplice clustering avido a partire dalle scosse più forti.
 */
export function activeZones(quakes: Quake[], radiusKm = 20, minCount = 4): ActiveZone[] {
  const left = [...quakes].sort((a, b) => b.mag - a.mag);
  const zones: ActiveZone[] = [];
  while (left.length) {
    const seed = left.shift()!;
    const members = [seed];
    for (let i = left.length - 1; i >= 0; i--) {
      if (distanceKm(seed, left[i]) <= radiusKm) members.push(...left.splice(i, 1));
    }
    if (members.length >= minCount) {
      zones.push({ name: placeText(seed.place).main, center: seed, quakes: members, strongest: seed });
    }
  }
  return zones.sort((a, b) => b.quakes.length - a.quakes.length);
}
