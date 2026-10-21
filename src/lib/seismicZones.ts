/**
 * Zona sismica dei comuni (Dipartimento della Protezione Civile, maggio 2025).
 * Il file (~50 KB compressi) si scarica solo quando serve.
 */
import { PROVINCES } from './provinces';
import type { Place } from './types';

export interface ComuneZone {
  comune: string;
  sigla: string;
  provincia: string;
  /** Codice ufficiale, es. "1", "2B", "2A-3A-3B". */
  code: string;
  /** Zona principale (la più pericolosa se il comune ne ha più di una). */
  zone: 1 | 2 | 3 | 4;
  /** Il territorio comunale è diviso in più zone. */
  mixed: boolean;
}

export const ZONE_INFO: Record<1 | 2 | 3 | 4, { label: string; text: string }> = {
  1: { label: 'Pericolosità alta', text: 'È la zona più pericolosa: qui possono avvenire terremoti molto forti.' },
  2: { label: 'Pericolosità medio-alta', text: 'Qui possono avvenire terremoti forti.' },
  3: { label: 'Pericolosità media', text: 'Qui possono avvenire terremoti forti, ma sono rari.' },
  4: { label: 'Pericolosità bassa', text: 'È la zona meno pericolosa: i terremoti forti sono molto rari, ma non impossibili.' },
};

export const ZONES_SOURCE = 'Dipartimento della Protezione Civile — classificazione sismica aggiornata a maggio 2025';

export const norm = (s: string) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

export function parseZone(code: string): { zone: 1 | 2 | 3 | 4; mixed: boolean } {
  const digits = (code.match(/[1-4]/g) ?? ['4']).map(Number);
  return { zone: Math.min(...digits) as 1 | 2 | 3 | 4, mixed: new Set(digits).size > 1 || code.includes('-') };
}

let index: Promise<Map<string, ComuneZone[]>> | null = null;

function loadIndex(): Promise<Map<string, ComuneZone[]>> {
  index ??= import('../data/zone-sismiche.json').then((mod) => {
    const map = new Map<string, ComuneZone[]>();
    for (const row of mod.default.comuni as string[]) {
      const [comune, sigla, code] = row.split(';');
      const entry: ComuneZone = { comune, sigla, provincia: PROVINCES[sigla] ?? sigla, code, ...parseZone(code) };
      const key = norm(comune);
      map.set(key, [...(map.get(key) ?? []), entry]);
    }
    return map;
  });
  return index;
}

/**
 * Trova il comune di un luogo. Con comuni omonimi usa la provincia
 * (es. "Castro" in provincia di Bergamo o di Lecce).
 */
export async function findComune(place: Place): Promise<ComuneZone | null> {
  const map = await loadIndex();
  const candidates = map.get(norm(place.name)) ?? [];
  if (candidates.length <= 1) return candidates[0] ?? null;
  const detail = norm(place.detail ?? '');
  return candidates.find((c) => detail.includes(norm(c.provincia))) ?? null;
}
