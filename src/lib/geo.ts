import type { LatLon } from './types';

const R_EARTH_KM = 6371;
const rad = (d: number) => (d * Math.PI) / 180;

/** Distanza in superficie (km) tra due punti. */
export function distanceKm(a: LatLon, b: LatLon): number {
  const dLat = rad(b.lat - a.lat);
  const dLon = rad(b.lon - a.lon);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * R_EARTH_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

/**
 * Coordinate arrotondate: con 2 decimali il punto si sposta di 0,7 km al massimo, con 3 di 70 metri.
 * Serve a non far uscire dal dispositivo il punto esatto di casa (vedi ingv.ts e geocode.ts).
 */
export function coarse(at: LatLon, decimals: number): LatLon {
  const k = 10 ** decimals;
  return { lat: Math.round(at.lat * k) / k, lon: Math.round(at.lon * k) / k };
}

/** Distanza "vera" dal punto di rottura in profondità (ipocentro). */
export function hypocentralKm(surfaceKm: number, depthKm: number): number {
  return Math.sqrt(surfaceKm ** 2 + Math.max(0, depthKm) ** 2);
}

/** Direzione (0-360°) da `from` verso `to`. */
export function bearingDeg(from: LatLon, to: LatLon): number {
  const y = Math.sin(rad(to.lon - from.lon)) * Math.cos(rad(to.lat));
  const x =
    Math.cos(rad(from.lat)) * Math.sin(rad(to.lat)) -
    Math.sin(rad(from.lat)) * Math.cos(rad(to.lat)) * Math.cos(rad(to.lon - from.lon));
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

const COMPASS_IT = ['nord', 'nord-est', 'est', 'sud-est', 'sud', 'sud-ovest', 'ovest', 'nord-ovest'];

export function compassIt(deg: number): string {
  return COMPASS_IT[Math.round(deg / 45) % 8];
}

export function formatKm(km: number): string {
  if (km < 1) return 'meno di 1 km';
  if (km < 10) return `${km.toFixed(0)} km`;
  return `${Math.round(km)} km`;
}
