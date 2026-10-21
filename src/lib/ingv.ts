import type { Bounds, Quake } from './types';
import { cleanText, inRange, isLat, isLon, isSafeId } from './sanitize';

/** Servizio FDSN pubblico dell'INGV (dati CC BY 4.0). */
export const INGV_EVENT_API = 'https://webservices.ingv.it/fdsnws/event/1/query';

/** Pagina ufficiale di un evento sul sito INGV. */
export const ingvEventPage = (id: string) => `https://terremoti.ingv.it/event/${id}`;

/** La stessa area che usa la mappa ufficiale INGV per l'Italia. */
export const ITALY_BOUNDS: Bounds = { minLat: 35, maxLat: 48, minLon: 6, maxLon: 19 };

export type OrderBy = 'time' | 'time-asc' | 'magnitude' | 'magnitude-asc';

export interface QuakeQuery {
  start: Date;
  end?: Date;
  minMag?: number;
  maxMag?: number;
  minDepth?: number;
  maxDepth?: number;
  /** Rettangolo geografico. Se manca (e manca `around`) la ricerca è mondiale. */
  bounds?: Bounds;
  /** Cerchio attorno a un punto: ha la precedenza su `bounds`. */
  around?: { lat: number; lon: number; radiusKm: number };
  eventId?: string;
  limit?: number;
  orderBy?: OrderBy;
}

export class IngvError extends Error {
  readonly status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = 'IngvError';
    this.status = status;
  }
}

/** Il servizio vuole date UTC senza fuso: 2026-10-20T19:10:16 */
const fdsnTime = (d: Date) => d.toISOString().slice(0, 19);

export function buildQueryUrl(q: QuakeQuery): string {
  const p = new URLSearchParams({ format: 'geojson' });
  if (q.eventId) {
    p.set('eventid', q.eventId);
    return `${INGV_EVENT_API}?${p}`;
  }
  p.set('starttime', fdsnTime(q.start));
  if (q.end) p.set('endtime', fdsnTime(q.end));
  if (q.minMag != null) p.set('minmag', String(q.minMag));
  if (q.maxMag != null) p.set('maxmag', String(q.maxMag));
  if (q.minDepth != null) p.set('mindepth', String(q.minDepth));
  if (q.maxDepth != null) p.set('maxdepth', String(q.maxDepth));
  if (q.around) {
    p.set('lat', q.around.lat.toFixed(4));
    p.set('lon', q.around.lon.toFixed(4));
    p.set('maxradiuskm', String(Math.round(q.around.radiusKm)));
  } else if (q.bounds) {
    p.set('minlat', String(q.bounds.minLat));
    p.set('maxlat', String(q.bounds.maxLat));
    p.set('minlon', String(q.bounds.minLon));
    p.set('maxlon', String(q.bounds.maxLon));
  }
  p.set('orderby', q.orderBy ?? 'time');
  if (q.limit) p.set('limit', String(q.limit));
  return `${INGV_EVENT_API}?${p}`;
}

/**
 * L'INGV scrive l'ora in UTC ma senza la "Z" e con 6 decimali
 * ("2026-10-20T19:10:16.970000"). `new Date()` non è affidabile con questo
 * formato su tutti i browser (Safari in particolare), quindi lo leggiamo a mano.
 */
export function parseIngvTime(s: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.(\d+))?/.exec(s);
  if (!m) return null;
  const ms = m[7] ? Math.round(Number(`0.${m[7]}`) * 1000) : 0;
  return new Date(Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +m[6], ms));
}

interface IngvFeature {
  properties?: Record<string, unknown>;
  geometry?: { coordinates?: unknown[] };
}

/** Come Number(), ma null/undefined/"" diventano NaN invece di 0. */
const toNum = (v: unknown) => (v === null || v === undefined || v === '' ? NaN : Number(v));

export function parseFeature(f: IngvFeature): Quake | null {
  const p = f.properties ?? {};
  const c = f.geometry?.coordinates ?? [];
  const lon = toNum(c[0]);
  const lat = toNum(c[1]);
  const depthKm = toNum(c[2]);
  const mag = toNum(p.mag);
  const time = typeof p.time === 'string' ? parseIngvTime(p.time) : null;
  const id = String(p.eventId ?? '');
  // Dati fuori da ogni intervallo plausibile = risposta rotta o manomessa: l'evento si scarta.
  if (!time || !isSafeId(id) || !isLat(lat) || !isLon(lon) || !inRange(mag, -3, 10)) return null;
  const magType = String(p.magType ?? '');
  const version = Number(p.version);
  return {
    id,
    time,
    lat,
    lon,
    depthKm: inRange(depthKm, -10, 800) ? depthKm : 0,
    mag,
    magType: /^[A-Za-z]{1,6}$/.test(magType) ? magType : '',
    place: cleanText(p.place, 120) || 'Località non indicata',
    author: cleanText(p.author, 60),
    version: p.version != null && inRange(version, 0, 100_000) ? version : null,
    type: cleanText(p.type, 30) || 'earthquake',
  };
}

export function parseCollection(json: unknown): Quake[] {
  const features = (json as { features?: IngvFeature[] })?.features;
  if (!Array.isArray(features)) return [];
  const out: Quake[] = [];
  for (const f of features) {
    const q = parseFeature(f);
    if (q && q.id) out.push(q);
  }
  return out;
}

export async function fetchQuakes(q: QuakeQuery, signal?: AbortSignal): Promise<Quake[]> {
  const real = await fetchFromIngv(q, signal);
  // Solo in sviluppo: eventuali terremoti simulati (vedi src/dev/simulation.ts).
  if (import.meta.env.DEV && typeof sessionStorage !== 'undefined') {
    const { applySimulation } = await import('../dev/simulation');
    return applySimulation(q, real);
  }
  return real;
}

async function fetchFromIngv(q: QuakeQuery, signal?: AbortSignal): Promise<Quake[]> {
  let res: Response;
  try {
    res = await fetch(buildQueryUrl(q), { signal });
  } catch (err) {
    if ((err as Error).name === 'AbortError') throw err;
    throw new IngvError(0, 'Non riesco a collegarmi al servizio INGV. Controlla la connessione a internet.');
  }
  // FDSN risponde 204 quando non ci sono terremoti che corrispondono alla ricerca.
  if (res.status === 204) return [];
  if (!res.ok) {
    const msg =
      res.status === 400 || res.status === 413
        ? 'La ricerca non è valida o è troppo grande. Prova a ridurre il periodo o l’area.'
        : 'Il servizio INGV in questo momento non risponde. Riprova tra qualche minuto.';
    throw new IngvError(res.status, msg);
  }
  return parseCollection(await res.json());
}
