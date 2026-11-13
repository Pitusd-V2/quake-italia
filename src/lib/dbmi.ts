/**
 * La storia sismica di un comune: i terremoti che lì si sono sentiti di più negli ultimi mille anni, dal Database
 * Macrosismico Italiano DBMI15 dell'INGV (versione 4.0, terremoti dal 1000 al 2020).
 *
 * I dati sono preparati da scripts/build-dbmi-data.mjs, che dal database tiene solo pochi terremoti per comune: per
 * la storia completa di una località rimandiamo alla pagina dell'INGV. Un file per iniziale del comune, scaricato
 * solo quando serve.
 *
 * LA CITAZIONE. L'INGV chiede che la fonte sia sempre citata, «anche per un uso parziale», con le parole qui sotto.
 * Sono copiate dalla pagina ufficiale di download e coincidono con il registro dati dell'INGV e con il registro del
 * DOI (controllati il 12/11/2026). Non vanno riformulate né accorciate. Devono comparire accanto ai dati.
 */
import { norm } from './seismicZones';
import { MCS } from './mcs';

// La citazione e il DOI stanno in src/data/pageSources.ts, insieme alle altre fonti del sito (e ai crediti del README).
export { DBMI_CITATION, DBMI_DOI } from '../data/pageSources';
export const DBMI_LICENSE = { name: 'CC BY 4.0', url: 'https://creativecommons.org/licenses/by/4.0/deed.it' };
export const DBMI_SITE = 'https://emidius.mi.ingv.it/CPTI15-DBMI15/';
/** L'ultimo anno coperto dal database. */
export const DBMI_UNTIL = 2020;

/** La pagina dell'INGV con tutta la storia sismica di una località. */
export const dbmiPlaceUrl = (placeId: string) => `https://emidius.mi.ingv.it/CPTI15-DBMI15/place/${placeId}`;

export interface HistoricQuake {
  year: number;
  /** 0 se il mese o il giorno non sono noti. */
  month: number;
  day: number;
  /** L'intensità in quella località, come la scrive il database: «8», «7-8», oppure una sigla («D», «HF»…). */
  intensity: string;
  /** La zona dell'epicentro, o quella dove gli effetti sono stati più forti. */
  area: string;
  /** L'intensità più alta raggiunta da quel terremoto, dove ha colpito di più: dice quanto è stato grande. */
  maxIntensity: string;
}

export interface TownHistory {
  comune: string;
  /** La località a cui si riferiscono i dati: un centro abitato, non tutto il territorio del comune. */
  place: string;
  placeId: string;
  /** Quanti terremoti hanno un effetto registrato in questa località. */
  observations: number;
  /** L'anno del più antico. */
  since: number;
  /** Altre località dello stesso comune che hanno dati propri. */
  otherPlaces: number;
  /** I più sentiti, dal più forte. Vuoto se nessuno è arrivato almeno a «sentito». */
  quakes: HistoricQuake[];
}

type Row = [string, string, string, number, number, number, [number, number, number, string, string, string][]];

const files = import.meta.glob<{ default: Record<string, Row> }>('../data/dbmi/dbmi-*.json');

const toHistory = (r: Row): TownHistory => ({
  comune: r[0],
  place: r[1],
  placeId: r[2],
  observations: r[3],
  since: r[4],
  otherPlaces: r[5],
  quakes: r[6].map(([year, month, day, intensity, area, maxIntensity]) => ({ year, month, day, intensity, area, maxIntensity: maxIntensity ?? '' })),
});

/** Dentro un file già letto: prima comune e provincia; se la provincia è cambiata dal 2015, il nome se è uno solo. */
export function pickTown(data: Record<string, Row>, comune: string, sigla: string): TownHistory | null {
  const name = norm(comune);
  const exact = data[`${name}|${sigla.toUpperCase()}`];
  if (exact) return toHistory(exact);
  const same = Object.keys(data).filter((k) => k.slice(0, k.lastIndexOf('|')) === name);
  return same.length === 1 ? toHistory(data[same[0]]) : null;
}

/** La storia sismica di un comune, o null se il database non ne ha una (non vuol dire che lì non abbia mai tremato). */
export async function loadTownHistory(comune: string, sigla: string): Promise<TownHistory | null> {
  const name = norm(comune);
  const letter = /^[a-z]/.test(name) ? name[0] : '_';
  const load = files[`../data/dbmi/dbmi-${letter}.json`];
  if (!load) return null;
  return pickTown((await load()).default, comune, sigla);
}

/* ---------- L'intensità, a parole ---------- */

/**
 * Cosa vuol dire ogni grado: la scala MCS del database, con le descrizioni riassunte dal testo ufficiale INGV
 * (src/lib/mcs.ts, lo stesso elenco della figura dell’articolo «Magnitudo e intensità»).
 */
const DEGREES: Record<number, { name: string; text: string }> = Object.fromEntries(MCS.map((x) => [x.n, { name: x.name, text: x.text }]));

/** Le sigle che il database usa quando le notizie non bastano per un grado preciso (parole del database). */
const CODES: Record<string, string> = {
  F: 'Sentito',
  HF: 'Sentito distintamente',
  SD: 'Danni leggeri',
  D: 'Danni',
  HD: 'Danni gravi',
};

/** I gradi con la loro descrizione, dal 4 al 12: per la legenda accanto alla storia sismica. */
export const DEGREE_LEGEND = MCS.map((x) => ({ degree: x.n, name: x.name, text: x.text }));

export interface IntensityWords {
  /** «Grado 7-8», oppure «Danni» per le sigle. */
  label: string;
  /** Il nome del grado («Dannoso»), se c'è un grado. */
  name?: string;
  text: string;
}

export function intensityWords(intensity: string): IntensityWords {
  const code = CODES[intensity.toUpperCase()];
  if (code) return { label: code, text: 'Le notizie dell’epoca non bastano per assegnare un grado preciso.' };
  const [low, high] = intensity.split('-').map(Number);
  if (!Number.isFinite(low)) return { label: intensity, text: '' };
  const d = DEGREES[Math.min(12, Math.max(4, Math.floor(low)))];
  const between = Number.isFinite(high) && high !== low;
  return {
    label: `Grado ${intensity}`,
    name: d?.name,
    text: between ? `Tra il grado ${low} e il grado ${high}. Al grado ${low}: ${d.text}` : d.text,
  };
}

const MONTHS = ['gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno', 'luglio', 'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre'];

/** «5 dicembre 1456», «dicembre 1456» o solo «1456», secondo quello che si sa. */
export function historicDate(q: Pick<HistoricQuake, 'year' | 'month' | 'day'>): string {
  const month = MONTHS[q.month - 1];
  if (!month) return String(q.year);
  return q.day ? `${q.day} ${month} ${q.year}` : `${month} ${q.year}`;
}
