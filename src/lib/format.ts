/** Orari sempre in ora italiana, come sul sito INGV. */
export const TZ = 'Europe/Rome';

const timeFmt = new Intl.DateTimeFormat('it-IT', { timeZone: TZ, hour: '2-digit', minute: '2-digit' });
const dayKeyFmt = new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' });
const longDayFmt = new Intl.DateTimeFormat('it-IT', { timeZone: TZ, weekday: 'long', day: 'numeric', month: 'long' });
const longDayYearFmt = new Intl.DateTimeFormat('it-IT', { timeZone: TZ, day: 'numeric', month: 'long', year: 'numeric' });
const fullFmt = new Intl.DateTimeFormat('it-IT', {
  timeZone: TZ, day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit',
});
const numFmt1 = new Intl.NumberFormat('it-IT', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
// Separatore delle migliaia sempre (anche 1.753), per numeri più facili da leggere.
const intFmt = new Intl.NumberFormat('it-IT', { useGrouping: 'always' } as Intl.NumberFormatOptions);

export const formatTime = (d: Date) => timeFmt.format(d);
export const dayKey = (d: Date) => dayKeyFmt.format(d);
export const formatFull = (d: Date) => fullFmt.format(d);
export const formatMag = (m: number) => numFmt1.format(m);
export const formatInt = (n: number) => intFmt.format(n);

/** "oggi alle 14:32", "ieri alle 20:10", "lunedì 18 ottobre alle 10:05" */
export function formatWhen(d: Date, now: Date = new Date()): string {
  const k = dayKey(d);
  const today = dayKey(now);
  const yesterday = dayKey(new Date(now.getTime() - 86_400_000));
  const at = `alle ${formatTime(d)}`;
  if (k === today) return `oggi ${at}`;
  if (k === yesterday) return `ieri ${at}`;
  const sameYear = k.slice(0, 4) === today.slice(0, 4);
  return `${sameYear ? longDayFmt.format(d) : longDayYearFmt.format(d)} ${at}`;
}

/** "adesso", "5 minuti fa", "2 ore fa", "3 giorni fa" */
export function timeAgo(d: Date, now: Date = new Date()): string {
  const s = Math.max(0, (now.getTime() - d.getTime()) / 1000);
  if (s < 60) return 'meno di un minuto fa';
  const min = Math.floor(s / 60);
  if (min < 60) return min === 1 ? '1 minuto fa' : `${min} minuti fa`;
  const h = Math.floor(min / 60);
  if (h < 24) return h === 1 ? "un'ora fa" : `${h} ore fa`;
  const days = Math.floor(h / 24);
  if (days < 60) return days === 1 ? 'un giorno fa' : `${days} giorni fa`;
  if (days < 730) return `${Math.floor(days / 30.44)} mesi fa`;
  return `${Math.floor(days / 365.25)} anni fa`;
}

export const hoursAgo = (h: number, now = Date.now()) => new Date(now - h * 3_600_000);
export const daysAgo = (d: number, now = Date.now()) => new Date(now - d * 86_400_000);
