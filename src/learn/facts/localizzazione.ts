/**
 * Numeri dell'articolo «Come l’INGV trova un terremoto», calcolati dai dati del catalogo INGV
 * (src/data/learn/localizzazione.json, da scripts/build-location-data.mjs): il testo li legge da qui.
 */
import data from '../../data/learn/localizzazione.json';

export type TipoLoc = 'automatica' | 'sala' | 'tensore' | 'bollettino' | 'altro';

export interface Localizzazione {
  tipo: TipoLoc;
  autore: string;
  dopoSecondi: number;
  stazioni: number | null;
  profKm: number;
  profIncKm: number | null;
  orizIncKm: number | null;
  spostamentoKm: number;
}

export interface Arrivo {
  stazione: string;
  nome?: string;
  km: number;
  P: number | null;
  S: number | null;
}

/** Per ogni scossa: di quanto la prima stima automatica, l'ultima automatica e la revisione della sala differiscono dal Bollettino. */
export interface Confronto {
  mag: number;
  magTipo: string;
  primaS?: number;
  primaKm?: number;
  primaProfKm?: number;
  primaStaz?: number | null;
  autoS?: number;
  autoKm?: number;
  autoProfKm?: number;
  autoStaz?: number | null;
  salaS?: number;
  salaKm?: number;
  salaProfKm?: number;
  salaStaz?: number | null;
}

export const locData = data as unknown as {
  titolo: string;
  fonte: string;
  scaricato: string;
  esempio: { id: number; luogo: string; tempo: string; richiesta: string; localizzazioni: Localizzazione[]; arrivi: Arrivo[] };
  statistica: { anni: string[]; magnitudoMinima: number; richieste: string[]; scosse: number; confronti: Confronto[] };
};

const es = locData.esempio;

/* ---------- Pietrapaola, 1° agosto 2024 ---------- */

/** Le localizzazioni dell'ipocentro, in ordine di tempo (senza le stime del tensore momento, che sono un'altra cosa). */
export const localizzazioni = es.localizzazioni.filter((l) => l.tipo === 'automatica' || l.tipo === 'sala' || l.tipo === 'bollettino');
export const automatiche = localizzazioni.filter((l) => l.tipo === 'automatica');
export const primaAuto = automatiche[0];
export const ultimaAuto = automatiche[automatiche.length - 1];
export const sala = localizzazioni.find((l) => l.tipo === 'sala')!;
export const bollettino = localizzazioni.find((l) => l.tipo === 'bollettino')!;
export const tensore = es.localizzazioni.filter((l) => l.tipo === 'tensore');
export const esempio = es;

const conP = es.arrivi.filter((a) => a.P !== null);
export const arrivi = es.arrivi;
export const piuVicina = conP[0];
export const piuLontana = conP[conP.length - 1];
export const stazioniP = conP.length;

/** Le stazioni con l'arrivo sia dell'onda P sia della S, e il «lampo e tuono»: km di distanza per secondo di ritardo. */
export const conPeS = es.arrivi
  .filter((a): a is Arrivo & { P: number; S: number } => a.P !== null && a.S !== null)
  .map((a) => ({ ...a, ipoKm: Math.hypot(a.km, bollettino.profKm), ritardo: a.S - a.P }));
export const kmPerSecondo = conPeS.reduce((n, a) => n + a.ipoKm * a.ritardo, 0) / conPeS.reduce((n, a) => n + a.ritardo * a.ritardo, 0);
const rapporti = conPeS.map((a) => a.ipoKm / a.ritardo).sort((a, b) => a - b);
export const kmPerSecondoMin = rapporti[0];
export const kmPerSecondoMax = rapporti[rapporti.length - 1];

/* ---------- Tutte le scosse di magnitudo 3 o più, 2024–2025 ---------- */

/** Il valore sotto cui sta una certa quota dei dati (0,5 = la metà, 0,9 = 9 su 10). */
export function quantile(xs: number[], p: number) {
  const s = [...xs].sort((a, b) => a - b);
  if (!s.length) return Number.NaN;
  const i = (s.length - 1) * p;
  const lo = Math.floor(i);
  return s[lo] + (s[Math.min(lo + 1, s.length - 1)] - s[lo]) * (i - lo);
}

const conf = locData.statistica.confronti;
const def = (xs: (number | null | undefined)[]) => xs.filter((v): v is number => v !== undefined && v !== null);

/** Il valore «di metà» e quello entro cui stanno 9 scosse su 10, per una fase (prima, auto, sala). */
function fase(k: 'prima' | 'auto' | 'sala') {
  const epi = def(conf.map((c) => c[`${k}Km`]));
  const prof = def(conf.map((c) => c[`${k}ProfKm`]));
  return {
    n: epi.length,
    secondi: quantile(def(conf.map((c) => c[`${k}S`])), 0.5),
    stazioni: quantile(def(conf.map((c) => c[`${k}Staz`])), 0.5),
    epiMeta: quantile(epi, 0.5),
    epi9: quantile(epi, 0.9),
    profMeta: quantile(prof, 0.5),
    prof9: quantile(prof, 0.9),
  };
}

export const stat = {
  scosse: locData.statistica.scosse,
  confrontate: conf.length,
  /** La prima stima automatica: pochi secondi e poche stazioni. */
  prima: fase('prima'),
  /** L'ultima stima automatica prima della revisione dei sismologi. */
  auto: fase('auto'),
  /** La prima localizzazione dei sismologi della sala di sorveglianza. */
  sala: fase('sala'),
};

/** Numeri alla italiana. */
export const d1 = (v: number) => v.toFixed(1).replace('.', ',');
export const int = (v: number) => String(Math.round(v));
