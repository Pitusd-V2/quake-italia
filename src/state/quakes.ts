import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { fetchQuakes, ITALY_BOUNDS, type QuakeQuery } from '../lib/ingv';
import { daysAgo } from '../lib/format';
import type { Quake } from '../lib/types';
import { isSafeId } from '../lib/sanitize';

/** L'INGV mette in cache i dati per 60 secondi: inutile chiedere più spesso. */
export const REFRESH_MS = 60_000;
export const FEED_DAYS = 7;

/**
 * Il "notiziario" principale: tutti i terremoti in Italia degli ultimi 7 giorni.
 * Home, elenco, mappa e "Ho sentito una scossa" leggono tutti da qui,
 * così l'app fa una sola richiesta al minuto.
 */
export function useQuakeFeed() {
  return useQuery({
    queryKey: ['quakes', 'italy', FEED_DAYS],
    queryFn: ({ signal }) => fetchQuakes({ start: daysAgo(FEED_DAYS), bounds: ITALY_BOUNDS }, signal),
    refetchInterval: REFRESH_MS,
    refetchIntervalInBackground: false,
    staleTime: REFRESH_MS - 5_000,
  });
}

/** Un singolo evento (anche vecchio, fuori dal notiziario). */
export function useQuake(rawId: string | undefined, feed: Quake[] | undefined) {
  // Un ID strano nella barra degli indirizzi non viene nemmeno mandato all'INGV.
  const id = isSafeId(rawId) ? rawId : undefined;
  const inFeed = feed?.find((q) => q.id === id) ?? null;
  const remote = useQuery({
    queryKey: ['quake', id],
    queryFn: async ({ signal }) => (await fetchQuakes({ start: new Date(0), eventId: id }, signal))[0] ?? null,
    enabled: !!id && !inFeed && feed !== undefined,
    staleTime: 5 * 60_000,
  });
  return {
    quake: inFeed ?? remote.data ?? null,
    isLoading: !!id && !inFeed && (feed === undefined || remote.isLoading),
    error: remote.error,
  };
}

/** Ricerca personalizzata (modalità esperto). Non si aggiorna da sola. */
export function useQuakeSearch(query: QuakeQuery | null, key: string) {
  return useQuery({
    queryKey: ['search', key],
    queryFn: ({ signal }) => fetchQuakes(query!, signal),
    enabled: query !== null,
    staleTime: 5 * 60_000,
    // Mentre arriva il nuovo risultato i grafici mostrano ancora il precedente.
    placeholderData: keepPreviousData,
  });
}
