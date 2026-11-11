/**
 * Il glossario generale di «Capire»: le parole spiegate in fondo agli articoli, riunite al build
 * (plugins/articoli.ts). Si scarica a parte, solo quando serve: la pagina del glossario e la ricerca.
 */
import type { GlossaryEntry } from './articleTypes';

/** Promessa che ricorda il suo stato: così `use()` di React la legge subito se è già pronta (anche al build). */
type Tracked<T> = Promise<T> & { status?: 'pending' | 'fulfilled' | 'rejected'; value?: T; reason?: unknown };

let cache: Tracked<GlossaryEntry[]> | null = null;

export function loadGlossary(): Tracked<GlossaryEntry[]> {
  if (!cache) {
    const tracked: Tracked<GlossaryEntry[]> = import('virtual:glossario').then((m) => m.default);
    tracked.status = 'pending';
    tracked.then(
      (value) => {
        tracked.status = 'fulfilled';
        tracked.value = value;
      },
      (reason) => {
        tracked.status = 'rejected';
        tracked.reason = reason;
        cache = null; // un errore di rete non resta per sempre: al prossimo tentativo si riprova
      },
    );
    cache = tracked;
  }
  return cache;
}

/** L'iniziale sotto cui sta una parola («È» → «E», «b-value» → «B»); i numeri e i simboli vanno sotto «#». */
export function initial(term: string): string {
  const c = term.normalize('NFD').replace(/[\u0300-\u036f]/g, '').charAt(0).toUpperCase();
  return /[A-Z]/.test(c) ? c : '#';
}
