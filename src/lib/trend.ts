/**
 * «Sta peggiorando?»: l'andamento delle repliche detto a parole.
 *
 * Confronta due finestre di tempo uguali (le ultime ore contro quelle prima) e parla di aumento o calo solo se la
 * differenza è troppo grande per essere un caso (test binomiale). Così una sequenza che oscilla non passa da «in calo»
 * a «in aumento» ogni mezz'ora, e nessuno si spaventa per due scosse in più.
 */
import type { Quake } from './types';

const HOUR = 3_600_000;

export type TrendKind =
  /** Troppo presto: nelle prime ore le repliche sono tante e i dati incompleti. */
  | 'early'
  /** Quasi nessuna scossa recente. */
  | 'quiet'
  | 'calming'
  | 'steady'
  | 'rising';

export interface Trend {
  kind: TrendKind;
  recent: number;
  previous: number;
  /** Lunghezza delle finestre confrontate, in ore. */
  windowHours: number;
}

/** P(X ≤ k) con X ~ Binomiale(n, 1/2). */
function binomCdfHalf(k: number, n: number): number {
  let term = 0.5 ** n;
  let sum = term;
  for (let i = 1; i <= k; i++) {
    term = (term * (n - i + 1)) / i;
    sum += term;
  }
  return Math.min(1, sum);
}

/** Sotto questa soglia la differenza tra le due finestre non è considerata reale. */
const SIGNIFICANCE = 0.1;

export function sequenceTrend(after: Quake[], mainTime: Date, now: Date): Trend {
  const t0 = mainTime.getTime();
  const t = now.getTime();
  const elapsed = t - t0;
  // Le finestre crescono con la sequenza; la prima ora (dati incompleti) non entra mai nel confronto.
  const windowHours = [24, 12, 3].find((h) => elapsed >= (2 * h + 1) * HOUR) ?? 3;
  const w = windowHours * HOUR;
  const count = (from: number, to: number) => after.filter((q) => q.time.getTime() > from && q.time.getTime() <= to).length;
  const recent = count(t - w, t);
  const previous = count(t - 2 * w, t - w);
  const base = { recent, previous, windowHours };

  if (elapsed < 2 * w + HOUR) return { kind: 'early', ...base };
  const n = recent + previous;
  if (recent <= 1 && previous <= 3) return { kind: 'quiet', ...base };
  if (n < 6) return { kind: 'steady', ...base };
  if (recent < previous && binomCdfHalf(recent, n) <= SIGNIFICANCE) return { kind: 'calming', ...base };
  if (recent > previous && binomCdfHalf(previous, n) <= SIGNIFICANCE) return { kind: 'rising', ...base };
  return { kind: 'steady', ...base };
}

const span = (h: number) => (h === 24 ? '24 ore' : `${h} ore`);
const scosse = (n: number) => (n === 1 ? '1 scossa' : `${n} scosse`);

/** La frase da mostrare (e da leggere ad alta voce). */
export function trendText(tr: Trend): string {
  const nums = `${scosse(tr.recent)} nelle ultime ${span(tr.windowHours)}, ${tr.previous} nelle ${span(tr.windowHours)} prima`;
  switch (tr.kind) {
    case 'early':
      return 'È ancora presto per capire l’andamento: nelle prime ore dopo una scossa forte le repliche sono più frequenti.';
    case 'quiet':
      return `La zona si sta calmando: ${nums}.`;
    case 'calming':
      return `Le scosse stanno diminuendo: ${nums}. È quello che succede di solito dopo una scossa forte.`;
    case 'steady':
      return `Il numero di scosse è più o meno stabile: ${nums}.`;
    case 'rising':
      return `Nelle ultime ore le scosse sono aumentate: ${nums}. Nelle sequenze capitano fasi più attive: segui le indicazioni del tuo Comune e della Protezione Civile.`;
  }
}

/** Due parole per la scheda in pagina iniziale. */
export const TREND_SHORT: Partial<Record<TrendKind, string>> = {
  quiet: 'zona quasi tranquilla',
  calming: 'in calo',
  steady: 'stabile',
  rising: 'in aumento',
};
