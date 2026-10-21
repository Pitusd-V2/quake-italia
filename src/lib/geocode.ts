/**
 * Ricerca dei comuni con Photon (komoot), gratuito e basato su OpenStreetMap.
 * Per un uso con molto traffico conviene ospitare una propria istanza.
 */
import type { LatLon, Place } from './types';
import { cleanText, isLat, isLon } from './sanitize';

const PHOTON = 'https://photon.komoot.io';
// Area che comprende l'Italia (anche le isole minori).
const BBOX = '6,35,19,48';
// Solo centri abitati: niente masserie, località isolate o quartieri omonimi.
const PLACE_TYPES = new Set(['city', 'town', 'village', 'hamlet', 'suburb', 'municipality']);

interface PhotonFeature {
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

export async function searchPlaces(text: string, signal?: AbortSignal): Promise<Place[]> {
  const q = text.trim();
  if (q.length < 2) return [];
  const url = `${PHOTON}/api/?q=${encodeURIComponent(q)}&limit=15&bbox=${BBOX}&osm_tag=place`;
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

/**
 * Trova il nome del luogo più vicino a delle coordinate GPS.
 * `address` è un indirizzo leggibile ("Via Roma 12, Norcia"), utile da mostrare all’utente.
 */
export async function reverseGeocode(at: LatLon, signal?: AbortSignal): Promise<Place & { address?: string }> {
  const fallback: Place = { ...at, name: 'La mia posizione' };
  try {
    const res = await fetch(`${PHOTON}/reverse?lat=${at.lat}&lon=${at.lon}`, { signal });
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
