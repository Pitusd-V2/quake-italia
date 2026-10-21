/** Scale e tacche minime per grafici SVG scritti a mano (niente librerie pesanti). */

export interface Scale {
  (v: number): number;
  domain: [number, number];
  range: [number, number];
}

export function linear(domain: [number, number], range: [number, number]): Scale {
  const [d0, d1] = domain;
  const [r0, r1] = range;
  const k = d1 === d0 ? 0 : (r1 - r0) / (d1 - d0);
  const f = ((v: number) => r0 + (v - d0) * k) as Scale;
  f.domain = domain;
  f.range = range;
  return f;
}

/** Scala logaritmica in base 10 (domain > 0). */
export function log10(domain: [number, number], range: [number, number]): Scale {
  const l = linear([Math.log10(domain[0]), Math.log10(domain[1])], range);
  const f = ((v: number) => l(Math.log10(Math.max(v, domain[0])))) as Scale;
  f.domain = domain;
  f.range = range;
  return f;
}

/** Tacche "tonde": 0, 2, 4… oppure 0, 50, 100… */
export function niceTicks(min: number, max: number, count = 5): number[] {
  if (max <= min) return [min];
  const raw = (max - min) / count;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= raw) ?? raw;
  const out: number[] = [];
  for (let v = Math.ceil(min / step) * step; v <= max + step * 1e-9; v += step) out.push(Math.round(v * 1e6) / 1e6 || 0); // "|| 0" evita il -0
  return out;
}

export function logTicks(min: number, max: number): number[] {
  const out: number[] = [];
  for (let p = Math.floor(Math.log10(min)); p <= Math.ceil(Math.log10(max)); p++) {
    const v = 10 ** p;
    if (v >= min && v <= max) out.push(v);
  }
  return out;
}

const DAY = 86_400_000;
const fmtDay = new Intl.DateTimeFormat('it-IT', { timeZone: 'Europe/Rome', day: 'numeric', month: 'short' });
const fmtMonth = new Intl.DateTimeFormat('it-IT', { timeZone: 'Europe/Rome', month: 'short', year: '2-digit' });
const fmtHour = new Intl.DateTimeFormat('it-IT', { timeZone: 'Europe/Rome', hour: '2-digit', minute: '2-digit' });

/** Tacche temporali con granularità scelta in base all'intervallo (ore, giorni, mesi). */
export function timeTicks(t0: number, t1: number, maxTicks = 6): { t: number; label: string }[] {
  const span = t1 - t0;
  const steps = [3_600_000 * 3, 3_600_000 * 6, 3_600_000 * 12, DAY, DAY * 2, DAY * 7, DAY * 14, DAY * 30, DAY * 91, DAY * 182, DAY * 365];
  const step = steps.find((s) => span / s <= maxTicks) ?? DAY * 365;
  const fmt = step < DAY ? fmtHour : step < DAY * 30 ? fmtDay : fmtMonth;
  // Allinea alla mezzanotte UTC per i passi giornalieri (abbastanza preciso per un asse).
  const start = step < DAY ? Math.ceil(t0 / step) * step : Math.ceil(t0 / DAY) * DAY;
  const out: { t: number; label: string }[] = [];
  for (let t = start; t <= t1; t += step) out.push({ t, label: fmt.format(new Date(t)) });
  return out;
}

export const fmtNum = (v: number, digits = 0) =>
  new Intl.NumberFormat('it-IT', { maximumFractionDigits: digits, minimumFractionDigits: digits }).format(v);

export const fmtCompact = (v: number) =>
  v >= 1000 ? new Intl.NumberFormat('it-IT', { notation: 'compact', maximumFractionDigits: 1 }).format(v) : String(v);
