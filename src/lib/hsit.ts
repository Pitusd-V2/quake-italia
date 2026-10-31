/**
 * Questionario INGV «Hai sentito il terremoto?» (hsit.it).
 * Il modulo non accetta una scossa nel link: la si sceglie da una lista che mostra data e ora italiane,
 * nel formato «[31 ott 2026 17:41] 3 Km W Palena (CH) -- ML: 2.1». Se non c'è, si scelgono
 * «Terremoto non in lista» e si scrivono data (gg/mm/aaaa) e ora (hh:mm).
 * Qui prepariamo le stesse scritte, così chi compila sa cosa cercare.
 */
import type { Quake } from './types';
import { TZ } from './format';

export const HSIT_FORM = 'https://www.hsit.it/compile.html';

// Minuti senza arrotondare (17:41:59 resta 17:41), come nella lista del questionario.
const listFmt = new Intl.DateTimeFormat('it-IT', { timeZone: TZ, day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
const dateFmt = new Intl.DateTimeFormat('it-IT', { timeZone: TZ, day: '2-digit', month: '2-digit', year: 'numeric' });
const timeFmt = new Intl.DateTimeFormat('it-IT', { timeZone: TZ, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });

export interface HsitHint {
  /** Come appare nella lista del questionario, es. «31 ott 2026 17:41». */
  inList: string;
  /** Per «Terremoto non in lista»: data e ora italiane. */
  date: string;
  time: string;
}

export function hsitHint(q: Pick<Quake, 'time'>): HsitHint {
  const p = Object.fromEntries(listFmt.formatToParts(q.time).map((x) => [x.type, x.value]));
  return {
    inList: `${p.day} ${p.month} ${p.year} ${p.hour}:${p.minute}`,
    date: dateFmt.format(q.time),
    time: timeFmt.format(q.time),
  };
}
