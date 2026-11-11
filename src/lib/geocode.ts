/**
 * Ricerca dei comuni con Photon (komoot), gratuito e basato su OpenStreetMap.
 * Per un uso con molto traffico conviene ospitare una propria istanza.
 */
import type { Bounds, LatLon, Place } from './types';
import { coarse } from './geo';
import { cleanText, isLat, isLon } from './sanitize';
import { norm } from './seismicZones';

const PHOTON = 'https://photon.komoot.io';
// Area che comprende l'Italia (anche le isole minori).
const BBOX = '6,35,19,48';
// Solo centri abitati: niente masserie, località isolate o quartieri omonimi.
const PLACE_TYPES = new Set(['city', 'town', 'village', 'hamlet', 'suburb', 'municipality']);

export interface PhotonFeature {
  properties: Record<string, string | undefined>;
  geometry: { coordinates: [number, number] };
}

/** Ogni testo che arriva da Photon passa dal filtro: niente link, caratteri invisibili o testi enormi. */
function cleanProps(raw: unknown): Record<string, string | undefined> {
  const out: Record<string, string | undefined> = {};
  if (raw && typeof raw === 'object') {
    for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
      if (typeof v === 'string' || typeof v === 'number') out[k] = cleanText(v, 80) || undefined;
    }
  }
  return out;
}

const validCoords = (f: PhotonFeature) => {
  const c = f.geometry?.coordinates;
  return Array.isArray(c) && isLon(Number(c[0])) && isLat(Number(c[1]));
};

function toPlace(f: PhotonFeature): Place {
  const p = cleanProps(f.properties);
  const name = p.name ?? p.city ?? p.town ?? p.village ?? 'Luogo senza nome';
  const detail = [p.county, p.state].filter((x) => x && x !== name).join(', ') || undefined;
  return { name, detail, lon: f.geometry.coordinates[0], lat: f.geometry.coordinates[1] };
}

/**
 * Nomi sempre come sul posto («Napoli», «Lombardia»), qualunque sia la lingua del browser: senza questo, con un browser
 * in inglese Photon risponde «Naples» e il comune non si trova più nell'elenco ufficiale delle zone sismiche.
 * («it» non è tra le lingue di Photon; «default» = il nome locale di OpenStreetMap.)
 */
const LANG = 'default';

export async function searchPlaces(text: string, signal?: AbortSignal): Promise<Place[]> {
  const q = text.trim();
  if (q.length < 2) return [];
  const url = `${PHOTON}/api/?q=${encodeURIComponent(q)}&limit=15&bbox=${BBOX}&osm_tag=place&lang=${LANG}`;
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error('Ricerca non disponibile in questo momento.');
  const json = (await res.json()) as { features?: PhotonFeature[] };
  const seen = new Set<string>();
  const out: Place[] = [];
  // Prima i luoghi in Italia, poi quelli di confine (l'ordine di rilevanza resta).
  const features = [...(json.features ?? [])].sort(
    (a, b) => Number(b.properties.countrycode === 'IT') - Number(a.properties.countrycode === 'IT'),
  );
  for (const f of features) {
    if (!validCoords(f)) continue;
    if (f.properties.osm_value && !PLACE_TYPES.has(f.properties.osm_value)) continue;
    const pl = toPlace(f);
    const key = `${pl.name}|${pl.detail}`;
    if (!seen.has(key)) {
      seen.add(key);
      out.push(pl);
    }
  }
  return out.slice(0, 6);
}

/* ---------- Ricerca della via (per il punto di casa) ---------- */

export interface StreetMatch {
  name: string;
  /** Quartiere e comune, per riconoscere la via giusta. */
  detail?: string;
  /** Il rettangolo che contiene tutta la via. */
  bounds: Bounds;
}

/**
 * Dai risultati di Photon alle vie da mostrare. OpenStreetMap divide spesso una via in più pezzi (anche lontani
 * qualche km): li riuniamo in una voce sola, con il rettangolo che li contiene tutti. Prima le vie del comune scelto.
 */
export function groupStreets(features: PhotonFeature[], town: Place): StreetMatch[] {
  const groups = new Map<string, { name: string; city?: string; districts: Set<string>; bounds: Bounds }>();
  for (const f of features) {
    if (!validCoords(f)) continue;
    const p = cleanProps(f.properties);
    if (p.type !== 'street' || !p.name) continue;
    if (p.countrycode && p.countrycode !== 'IT') continue;
    const [lon, lat] = f.geometry.coordinates.map(Number);
    // «extent» è [ovest, nord, est, sud]; se manca usiamo il punto.
    const ext = (f.properties as unknown as { extent?: unknown }).extent;
    const e = Array.isArray(ext) && ext.length === 4 ? ext.map(Number) : [lon, lat, lon, lat];
    const lons = [e[0], e[2], lon];
    const lats = [e[1], e[3], lat];
    if (!lons.every(isLon) || !lats.every(isLat)) continue;
    const city = p.city ?? p.town ?? p.village;
    const key = `${norm(p.name)}|${norm(city ?? '')}`;
    const g = groups.get(key) ?? { name: p.name, city, districts: new Set<string>(), bounds: { minLat: 90, maxLat: -90, minLon: 180, maxLon: -180 } };
    if (p.district) g.districts.add(p.district);
    g.bounds = {
      minLat: Math.min(g.bounds.minLat, ...lats),
      maxLat: Math.max(g.bounds.maxLat, ...lats),
      minLon: Math.min(g.bounds.minLon, ...lons),
      maxLon: Math.max(g.bounds.maxLon, ...lons),
    };
    groups.set(key, g);
  }
  const here = norm(town.name);
  return [...groups.values()]
    .sort((a, b) => Number(norm(b.city ?? '') === here) - Number(norm(a.city ?? '') === here))
    .slice(0, 5)
    .map((g) => ({
      name: g.name,
      // Il quartiere solo se è uno: una via lunga ne attraversa diversi.
      detail: [g.districts.size === 1 ? [...g.districts][0] : undefined, g.city].filter((x) => x && x !== g.name).join(', ') || undefined,
      bounds: g.bounds,
    }));
}

/**
 * Cerca una via vicino a un comune, per portare la mappa del «punto di casa» nel posto giusto.
 * A Photon vanno il testo scritto, il nome del comune e un riquadro largo decine di km attorno al comune: mai il punto
 * di casa. Cerchiamo solo le vie: i numeri civici in OpenStreetMap sono incompleti, il punto esatto si tocca sulla mappa.
 */
export async function searchStreets(text: string, town: Place, signal?: AbortSignal): Promise<StreetMatch[]> {
  const q = cleanText(text, 80);
  if (q.length < 3) return [];
  const c = coarse(town, 1);
  const bbox = [c.lon - 0.4, c.lat - 0.3, c.lon + 0.4, c.lat + 0.3].map((n) => n.toFixed(1)).join(',');
  const url = `${PHOTON}/api/?q=${encodeURIComponent(`${q} ${town.name}`)}&limit=20&bbox=${bbox}&layer=street&lang=${LANG}`;
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error('Ricerca non disponibile in questo momento.');
  const json = (await res.json()) as { features?: PhotonFeature[] };
  return groupStreets(json.features ?? [], town);
}

/**
 * Trova il nome del luogo più vicino a delle coordinate GPS.
 * `address` è un indirizzo leggibile ("Via Roma 12, Norcia"), utile da mostrare all’utente.
 * A Photon non va il punto esatto: per trovare il comune bastano coordinate arrotondate a circa 100 metri.
 */
export async function reverseGeocode(at: LatLon, signal?: AbortSignal): Promise<Place & { address?: string }> {
  const fallback: Place = { ...at, name: 'La mia posizione' };
  try {
    const near = coarse(at, 3);
    const res = await fetch(`${PHOTON}/reverse?lat=${near.lat}&lon=${near.lon}&lang=${LANG}`, { signal });
    if (!res.ok) return fallback;
    const json = (await res.json()) as { features?: PhotonFeature[] };
    const first = json.features?.[0];
    if (!first?.properties) return fallback;
    const p = cleanProps(first.properties);
    const name = p.city ?? p.town ?? p.village ?? p.county ?? p.name;
    const street = p.street ? [p.street, p.housenumber].filter(Boolean).join(' ') : undefined;
    return {
      ...at,
      name: name ?? fallback.name,
      detail: [p.county, p.state].filter((x) => x && x !== name).join(', ') || undefined,
      address: [street, name].filter(Boolean).join(', ') || undefined,
    };
  } catch {
    return fallback;
  }
}
