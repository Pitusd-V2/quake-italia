/** Statistiche sismologiche per la modalità esperto. */
import type { Quake } from './types';

const BIN = 0.1;
const round1 = (x: number) => Math.round(x * 10) / 10;

export interface FmdBin {
  mag: number;
  /** Numero di eventi con magnitudo in questo intervallo. */
  count: number;
  /** Numero di eventi con magnitudo >= mag (Gutenberg-Richter). */
  cumulative: number;
}

/** Distribuzione frequenza-magnitudo, con intervalli di 0,1. */
export function frequencyMagnitude(quakes: Quake[]): FmdBin[] {
  if (!quakes.length) return [];
  const counts = new Map<number, number>();
  for (const q of quakes) {
    const m = round1(q.mag);
    counts.set(m, (counts.get(m) ?? 0) + 1);
  }
  const mags = [...counts.keys()];
  const min = Math.min(...mags);
  const max = Math.max(...mags);
  const bins: FmdBin[] = [];
  for (let m = min; m <= max + 1e-9; m = round1(m + BIN)) bins.push({ mag: m, count: counts.get(m) ?? 0, cumulative: 0 });
  let cum = 0;
  for (let i = bins.length - 1; i >= 0; i--) {
    cum += bins[i].count;
    bins[i].cumulative = cum;
  }
  return bins;
}

/**
 * Magnitudo di completezza con il metodo della "massima curvatura"
 * (il picco della distribuzione non cumulativa) più la correzione di +0,2
 * suggerita in letteratura (Woessner & Wiemer, 2005).
 */
export function completenessMaxc(bins: FmdBin[]): number | null {
  if (!bins.length) return null;
  const peak = bins.reduce((best, b) => (b.count > best.count ? b : best), bins[0]);
  return round1(peak.mag + 0.2);
}

export interface BValue {
  b: number;
  /** Incertezza secondo Shi & Bolt (1982). */
  sigma: number;
  a: number;
  mc: number;
  n: number;
}

/** Stima di massima verosimiglianza di Aki-Utsu, con correzione per i dati a intervalli. */
export function bValue(quakes: Quake[], mc: number): BValue | null {
  const mags = quakes.map((q) => round1(q.mag)).filter((m) => m >= mc - 1e-9);
  const n = mags.length;
  if (n < 30) return null;
  const mean = mags.reduce((s, m) => s + m, 0) / n;
  const denom = mean - (mc - BIN / 2);
  if (denom <= 0) return null;
  const b = Math.LOG10E / denom;
  const variance = mags.reduce((s, m) => s + (m - mean) ** 2, 0) / (n * (n - 1));
  const sigma = 2.3 * b * b * Math.sqrt(variance);
  const a = Math.log10(n) + b * mc;
  return { b, sigma, a, mc, n };
}

export interface HistBin {
  from: number;
  to: number;
  count: number;
}

/**
 * Istogramma con classi di larghezza variabile (`edges` in ordine crescente).
 * Le classi oltre il valore massimo vengono tolte; i valori fuori scala finiscono nell'ultima.
 */
export function histogram(values: number[], edges: number[]): HistBin[] {
  if (!values.length || edges.length < 2) return [];
  const max = values.reduce((a, b) => Math.max(a, b), -Infinity);
  let last = edges.findIndex((e) => e > max);
  if (last === -1) last = edges.length - 1;
  const bins: HistBin[] = [];
  for (let i = 0; i < Math.max(1, last); i++) bins.push({ from: edges[i], to: edges[i + 1], count: 0 });
  for (const v of values) {
    let i = bins.findIndex((b) => v < b.to);
    if (i === -1) i = bins.length - 1;
    bins[i].count++;
  }
  return bins;
}
