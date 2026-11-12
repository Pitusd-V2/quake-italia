/**
 * Gli articoli di «Capire» già letti: servono a mostrare da dove continuare in ogni percorso.
 * Restano solo sul dispositivo (localStorage), come le altre scelte: nessuno li riceve. Si cancellano da
 * Impostazioni → I tuoi dati, insieme al resto.
 */
import { useMemo, useSyncExternalStore } from 'react';
import { readRaw, writeJson } from '../lib/storage';
import type { ArticleCard } from './articleTypes';

const KEY = 'quakeitalia:letti:v1';
const EMPTY: string[] = [];

let cache: string[] | null = null;
const listeners = new Set<() => void>();

/** L'elenco salvato può essere stato modificato a mano: teniamo solo nomi di articolo plausibili. */
export function sanitizeRead(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return [...new Set(raw.filter((x): x is string => typeof x === 'string' && /^[a-z0-9-]{1,80}$/.test(x)))].slice(0, 500);
}

function snapshot(): string[] {
  cache ??= sanitizeRead(readRaw(KEY));
  return cache;
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  // Un'altra scheda del browser ha cambiato l'elenco: lo rileggiamo.
  const onStorage = (e: StorageEvent) => {
    if (e.key !== KEY) return;
    cache = null;
    listener();
  };
  window.addEventListener('storage', onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener('storage', onStorage);
  };
}

export function setRead(slug: string, read: boolean): void {
  const next = new Set(snapshot());
  if (read) next.add(slug);
  else next.delete(slug);
  cache = sanitizeRead([...next]);
  writeJson(KEY, cache);
  for (const l of listeners) l();
}

/** Gli articoli letti su questo dispositivo. Al build (e alla prima visita) è vuoto. */
export function useReadArticles(): ReadonlySet<string> {
  const list = useSyncExternalStore(subscribe, snapshot, () => EMPTY);
  return useMemo(() => new Set(list), [list]);
}

/**
 * Il tempo di lettura negli elenchi: un numero solo, quello di tutto l'articolo. Quanto dura ogni parte (e che ci si
 * può fermare prima dell'ultima) lo dice l'indice dentro l'articolo: negli elenchi due numeri erano solo un conto in più.
 */
export const readingTime = (a: Pick<ArticleCard, 'minuti'>): string => `${a.minuti} minuti di lettura`;

/** «1 ora e 31 minuti», «45 minuti». */
export function duration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (!h) return `${m} minuti`;
  return `${h} ${h === 1 ? 'ora' : 'ore'}${m ? ` e ${m} minuti` : ''}`;
}
