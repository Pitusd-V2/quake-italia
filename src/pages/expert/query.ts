/**
 * Ricerca avanzata <-> parametri dell'indirizzo (URL), così una ricerca
 * si può salvare nei preferiti o condividere con un link.
 */
import { ITALY_BOUNDS, type QuakeQuery } from '../../lib/ingv';
import type { Place } from '../../lib/types';

export type PeriodPreset = '1g' | '7g' | '30g' | '90g' | '1a' | 'custom';
export type Area = 'italia' | 'mondo' | 'casa' | 'punto';

export interface ExpertForm {
  period: PeriodPreset;
  from: string; // YYYY-MM-DD (solo "custom")
  to: string;
  minMag: string;
  maxMag: string;
  minDepth: string;
  maxDepth: string;
  area: Area;
  lat: string;
  lon: string;
  radiusKm: string;
  limit: string;
}

export const PERIOD_DAYS: Record<Exclude<PeriodPreset, 'custom'>, number> = { '1g': 1, '7g': 7, '30g': 30, '90g': 90, '1a': 365 };
export const MAX_LIMIT = 20_000;


export const DEFAULT_FORM: ExpertForm = {
  period: '30g',
  from: '',
  to: '',
  minMag: '',
  maxMag: '',
  minDepth: '',
  maxDepth: '',
  area: 'italia',
  lat: '',
  lon: '',
  radiusKm: '100',
  limit: '10000',
};

const KEYS: Record<keyof ExpertForm, string> = {
  period: 'periodo', from: 'da', to: 'a', minMag: 'mmin', maxMag: 'mmax', minDepth: 'zmin', maxDepth: 'zmax',
  area: 'area', lat: 'lat', lon: 'lon', radiusKm: 'r', limit: 'max',
};

export function formFromParams(p: URLSearchParams): ExpertForm {
  const f = { ...DEFAULT_FORM };
  for (const k of Object.keys(KEYS) as (keyof ExpertForm)[]) {
    const v = p.get(KEYS[k]);
    if (v !== null) (f as Record<string, string>)[k] = v;
  }
  if (!['1g', '7g', '30g', '90g', '1a', 'custom'].includes(f.period)) f.period = DEFAULT_FORM.period;
  if (!['italia', 'mondo', 'casa', 'punto'].includes(f.area)) f.area = 'italia';
  return f;
}

export function paramsFromForm(f: ExpertForm, keep: URLSearchParams): URLSearchParams {
  const p = new URLSearchParams();
  const tool = keep.get('strumento');
  if (tool) p.set('strumento', tool);
  for (const k of Object.keys(KEYS) as (keyof ExpertForm)[]) {
    if (f[k] !== DEFAULT_FORM[k] && f[k] !== '') p.set(KEYS[k], f[k]);
  }
  return p;
}

const num = (s: string) => (s.trim() === '' ? undefined : Number(s.replace(',', '.')));

export interface Built {
  query: QuakeQuery | null;
  error: string | null;
}

/** Trasforma il modulo in una richiesta FDSN, controllando che abbia senso. */
export function buildQuery(f: ExpertForm, home: Place | null): Built {
  const err = (error: string): Built => ({ query: null, error });
  const now = Date.now();
  let start: Date;
  let end: Date | undefined;
  if (f.period === 'custom') {
    if (!f.from) return err('Indica la data di inizio.');
    start = new Date(`${f.from}T00:00:00Z`);
    end = f.to ? new Date(`${f.to}T23:59:59Z`) : undefined;
    if (Number.isNaN(start.getTime()) || (end && Number.isNaN(end.getTime()))) return err('Una delle date non è valida.');
    if (end && end < start) return err('La data di fine viene prima di quella di inizio.');
  } else {
    start = new Date(now - PERIOD_DAYS[f.period] * 86_400_000);
  }

  const q: QuakeQuery = { start, end, orderBy: 'time' };
  const values = { minMag: num(f.minMag), maxMag: num(f.maxMag), minDepth: num(f.minDepth), maxDepth: num(f.maxDepth) };
  for (const [k, v] of Object.entries(values)) {
    if (v !== undefined && !Number.isFinite(v)) return err('Controlla i valori di magnitudo e profondità: devono essere numeri.');
    (q as unknown as Record<string, number | undefined>)[k] = v;
  }
  if (q.minMag != null && q.maxMag != null && q.minMag > q.maxMag) return err('La magnitudo minima è più alta della massima.');
  if (q.minDepth != null && q.maxDepth != null && q.minDepth > q.maxDepth) return err('La profondità minima è più alta della massima.');

  const radiusKm = num(f.radiusKm) ?? 100;
  if (f.area === 'italia') q.bounds = ITALY_BOUNDS;
  else if (f.area === 'casa') {
    if (!home) return err('Non hai ancora impostato il tuo comune (vai in Impostazioni).');
    q.around = { lat: home.lat, lon: home.lon, radiusKm };
  } else if (f.area === 'punto') {
    const lat = num(f.lat);
    const lon = num(f.lon);
    if (lat == null || lon == null || Math.abs(lat) > 90 || Math.abs(lon) > 180) return err('Inserisci latitudine e longitudine valide.');
    q.around = { lat, lon, radiusKm };
  }
  if (q.around && !(radiusKm > 0 && radiusKm <= 2000)) return err('Il raggio deve essere tra 1 e 2000 km.');

  const limit = num(f.limit) ?? 10_000;
  q.limit = Math.min(MAX_LIMIT, Math.max(1, Math.round(limit)));
  return { query: q, error: null };
}

