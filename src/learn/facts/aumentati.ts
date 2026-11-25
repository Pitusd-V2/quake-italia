/**
 * Numeri dell'articolo «I terremoti sono aumentati?».
 * I conteggi vengono dal catalogo INGV (servizio FDSN, 1985-2025) e dal catalogo omogeneo HORUS (1960-2025), nel
 * file src/data/learn/aumentati.json scritto da scripts/build-aumentati-data.mjs: il testo li legge da qui.
 * In fondo, separati, i pochi numeri pubblicati negli studi (soglie di completezza), copiati dalla fonte indicata.
 */
import data from '../../data/learn/aumentati.json';
import cpti from '../../data/learn/cpti15.json';
import { dec, n } from './format';

/* ---------- Il file dei dati ---------- */

interface Principale {
  id: string;
  tempo: string;
  lat: number;
  lon: number;
  mag: number;
  tipoMag: string;
}
interface Sequenza {
  id: 'umbriaMarche1997' | 'aquila2009' | 'emilia2012' | 'centroItalia2016';
  nome: string;
  principali: Principale[];
  perAnno: Record<string, number>;
}

export const aumentatiData = data as unknown as {
  titolo: string;
  fonti: {
    fdsn: { nome: string; doi: string; licenza: string };
    horus: { nome: string; doi: string; studio: string; licenza: string; file: string; ultimoEvento: string };
  };
  scaricato: { fdsn: string; horus: string };
  richieste: string[];
  parametri: {
    riquadro: Record<'minlat' | 'maxlat' | 'minlon' | 'maxlon', string>;
    anniFdsn: [number, number];
    anniHorus: [number, number];
    campiFlegrei: { lat: number; lon: number; raggioKm: number };
    sequenze: { raggioKm: number; giorni: number };
    nuovaRete: string;
    repliche: string;
    horus: string;
    anno: string;
  };
  sequenze: Sequenza[];
  meta2005: { daNuovaRete: number; primaNuovaRete: number };
  fdsn: { legenda: string[]; anni: (number | null)[][] };
  horus: { legenda: string[]; nonTerremoti: number; anni: number[][] };
};

/** Un anno del catalogo INGV (servizio FDSN), nel riquadro 35-48 N, 6-19 E. */
export interface AnnoFdsn {
  anno: number;
  totale: number;
  /** Scosse con magnitudo almeno 1,5; 2; 2,5; 3; 4; 5 (la magnitudo «preferita» del catalogo, di tipo diverso nel tempo). */
  m15: number;
  m2: number;
  m25: number;
  m3: number;
  m4: number;
  m5: number;
  /** Quante scosse hanno come magnitudo preferita la Md (durata), la ML (locale), la Mw (momento) o un altro tipo. */
  md: number;
  ml: number;
  mw: number;
  altre: number;
  senzaMag: number;
  nonTerremoti: number;
  /** Campi Flegrei (entro 8 km dal centro della caldera): tutte e magnitudo almeno 2,5. */
  cf: number;
  cf25: number;
  /** Grandi sequenze (Umbria-Marche 1997, L'Aquila 2009, Emilia 2012, Italia centrale 2016-2017): entro 30 km e 365 giorni dalle scosse principali. */
  seq: number;
  seq25: number;
  seq4: number;
  /** Tutto il resto: né Campi Flegrei né grandi sequenze. */
  resto: number;
  resto25: number;
  resto4: number;
  /** Terremoti «indipendenti» (repliche tolte con Gardner e Knopoff), solo dal 16 aprile 2005: null prima. */
  ind25: number | null;
  ind3: number | null;
  ind4: number | null;
  magMax: number | null;
}

/** Un anno di HORUS, solo terraferma italiana, magnitudo momento (Mw) omogenea. */
export interface AnnoHorus {
  anno: number;
  w25: number;
  w3: number;
  w35: number;
  w4: number;
  w45: number;
  w5: number;
  /** Gli stessi conteggi senza le repliche (Gardner e Knopoff). */
  ind25: number;
  ind3: number;
  ind35: number;
  ind4: number;
  ind45: number;
  ind5: number;
  /** Campi Flegrei, Mw almeno 2,5, 3 e 4. */
  cf25: number;
  cf3: number;
  cf4: number;
  /** Tutti i terremoti in terraferma, di qualunque magnitudo (la completezza cambia molto nel tempo). */
  tutteIta: number;
}

const oggetti = <T>(leg: string[], righe: unknown[][]) => righe.map((r) => Object.fromEntries(leg.map((k, i) => [k, r[i]])) as T);
export const fdsnAnni: AnnoFdsn[] = oggetti<AnnoFdsn>(aumentatiData.fdsn.legenda, aumentatiData.fdsn.anni);
export const horusAnni: AnnoHorus[] = oggetti<AnnoHorus>(aumentatiData.horus.legenda, aumentatiData.horus.anni);

export const fdsn = (anno: number): AnnoFdsn => {
  const r = fdsnAnni.find((a) => a.anno === anno);
  if (!r) throw new Error(`Anno ${anno} non presente nel catalogo INGV`);
  return r;
};
export const horus = (anno: number): AnnoHorus => {
  const r = horusAnni.find((a) => a.anno === anno);
  if (!r) throw new Error(`Anno ${anno} non presente in HORUS`);
  return r;
};

const somma = (xs: number[]) => xs.reduce((a, b) => a + b, 0);
const media = (xs: number[]) => somma(xs) / xs.length;
const tra = <T extends { anno: number }>(righe: T[], a: number, b: number) => righe.filter((r) => r.anno >= a && r.anno <= b);

/* ---------- Formati ---------- */

/** Una cifra decimale, all'italiana: 4,8. */
export const d1 = (v: number) => dec(Math.round(v * 10) / 10);
/** Percentuale intera: «12%». */
export const pct = (v: number) => `${Math.round(v * 100)}%`;
/** Quante volte, con una cifra decimale: «3,4». */
export const volte = (v: number) => d1(v);
export { n };

/* ---------- Parametri dell'analisi ---------- */

export const ANNI_FDSN = aumentatiData.parametri.anniFdsn;
export const ANNI_HORUS = aumentatiData.parametri.anniHorus;
export const CF_RAGGIO_KM = aumentatiData.parametri.campiFlegrei.raggioKm;
export const SEQ_RAGGIO_KM = aumentatiData.parametri.sequenze.raggioKm;
export const SEQ_GIORNI = aumentatiData.parametri.sequenze.giorni;
export const richiesteFdsn = aumentatiData.richieste.length;
export const sequenze = aumentatiData.sequenze;
/** La scossa principale più forte di ogni sequenza, come la dà il catalogo INGV. */
export const piuForte = (id: Sequenza['id']) => {
  const s = sequenze.find((q) => q.id === id);
  if (!s) throw new Error(id);
  return s.principali.reduce((a, b) => (b.mag > a.mag ? b : a));
};

/* ---------- Il catalogo INGV: quante scosse, anno per anno ---------- */

export const tot1985 = fdsn(1985).totale;
export const tot2006 = fdsn(2006).totale;
export const tot2016 = fdsn(2016).totale;
export const tot2025 = fdsn(2025).totale;
/** Quante volte il 2025 supera il 1985 nel numero di scosse del catalogo. */
export const volte2025su1985 = tot2025 / tot1985;
/** Dal 2019 al 2025 (anni senza grandi sequenze): il totale più basso e il più alto. */
const dal2019 = tra(fdsnAnni, 2019, 2025).map((r) => r.totale);
export const totMinDal2019 = Math.min(...dal2019);
export const totMaxDal2019 = Math.max(...dal2019);
/** Tutti i terremoti 1985-2025 nel riquadro. */
export const totale1985_2025 = somma(fdsnAnni.map((r) => r.totale));
/** Esplosioni, cave e simili segnate nel catalogo (escluse dai conteggi). */
export const nonTerremoti = somma(fdsnAnni.map((r) => r.nonTerremoti));
/** Il 2005 diviso in due: prima e dopo il 16 aprile (nuova rete e nuovo bollettino). */
export const meta2005 = aumentatiData.meta2005;

/** Il cambio di «righello»: quota di scosse con magnitudo di durata (Md) nel 1985 e locale (ML) nel 2006. */
export const quotaMd1985 = fdsn(1985).md / tot1985;
export const quotaMl2006 = fdsn(2006).ml / tot2006;
/**
 * La trappola: con le magnitudo «così come sono», il 1985 ha più scosse di magnitudo 2,5 e 3 o più del 2006.
 * Non è la Terra: Md (1985) e ML (2006) non sono confrontabili (Lolli e altri 2025).
 */
export const m3_1985 = fdsn(1985).m3;
export const m3_2006 = fdsn(2006).m3;
export const m25_1985 = fdsn(1985).m25;
export const m25_2006 = fdsn(2006).m25;

/* ---------- Le grandi sequenze ---------- */

export const seq1997 = fdsn(1997).seq;
export const seq2009 = fdsn(2009).seq;
export const seq2012 = fdsn(2012).seq;
export const seq2016 = fdsn(2016).seq;
export const seq2017 = fdsn(2017).seq;
/** Nel 2016, la parte del totale che viene dalla sequenza dell'Italia centrale. */
export const quotaSeq2016 = seq2016 / tot2016;
/** Il 2016 senza la sequenza (e senza Campi Flegrei). */
export const resto2016 = fdsn(2016).resto;
export const m4_2016 = fdsn(2016).m4;
export const seq4_2016 = fdsn(2016).seq4;

/* ---------- Campi Flegrei: l'aumento vero ---------- */

export const cf2018 = fdsn(2018).cf;
export const cf2025 = fdsn(2025).cf;
export const cf25_2025 = fdsn(2025).cf25;
export const quotaCf2025 = cf2025 / tot2025;
/** Le scosse ai Campi Flegrei nel catalogo nazionale dal 1985 al 2014, tutte insieme. */
export const cf1985_2014 = somma(tra(fdsnAnni, 1985, 2014).map((r) => r.cf));
/** HORUS: Campi Flegrei, Mw almeno 3 e almeno 4, nel 2025; e la crisi del 1984. */
export const cfW3_2025 = horus(2025).cf3;
export const cfW4_2025 = horus(2025).cf4;
export const cfW3_1984 = horus(1984).cf3;
export const cfW25_1984 = horus(1984).cf25;

/* ---------- Dal 16 aprile 2005: stessa rete «moderna», stessa magnitudo (ML) ---------- */

/** Terremoti indipendenti (senza repliche) di magnitudo 2,5 o più, in media all'anno, 2006-2015 e 2016-2025. */
export const ind25Prima = media(tra(fdsnAnni, 2006, 2015).map((r) => r.ind25 ?? 0));
export const ind25Dopo = media(tra(fdsnAnni, 2016, 2025).map((r) => r.ind25 ?? 0));
const ind25Tutti = tra(fdsnAnni, 2006, 2025).map((r) => r.ind25 ?? 0);
export const ind25Min = Math.min(...ind25Tutti);
export const ind25Max = Math.max(...ind25Tutti);
/** Lo stesso a magnitudo 4 o più. */
export const ind4Prima = media(tra(fdsnAnni, 2006, 2015).map((r) => r.ind4 ?? 0));
export const ind4Dopo = media(tra(fdsnAnni, 2016, 2025).map((r) => r.ind4 ?? 0));
const ind4Tutti = tra(fdsnAnni, 2006, 2025).map((r) => r.ind4 ?? 0);
export const ind4Min = Math.min(...ind4Tutti);
export const ind4Max = Math.max(...ind4Tutti);
/** Scosse di magnitudo 4 o più (con le repliche), 2006-2025: il minimo, il massimo e gli anni dei picchi. */
const m4Tutti = tra(fdsnAnni, 2006, 2025).map((r) => r.m4);
export const m4Min = Math.min(...m4Tutti);
export const m4Max = Math.max(...m4Tutti);
export const m4_2009 = fdsn(2009).m4;
export const m4_2012 = fdsn(2012).m4;

/* ---------- HORUS: magnitudo momento omogenea, terraferma italiana, 1960-2025 ---------- */

/** Media all'anno (e somma) di una colonna di HORUS tra due anni compresi. */
export const mediaHorus = (k: keyof AnnoHorus, a: number, b: number) => media(tra(horusAnni, a, b).map((r) => r[k]));
export const sommaHorus = (k: keyof AnnoHorus, a: number, b: number) => somma(tra(horusAnni, a, b).map((r) => r[k]));

/** Periodi del confronto: prima della rete digitale, rete digitale con Md, rete moderna con ML. */
export const PERIODI: [number, number][] = [
  [1960, 1984],
  [1985, 2004],
  [2005, 2025],
];
/** Mw 4 o più: tutte e senza repliche, in media all'anno, nei tre periodi. */
export const w4Periodi = PERIODI.map(([a, b]) => mediaHorus('w4', a, b));
export const ind4Periodi = PERIODI.map(([a, b]) => mediaHorus('ind4', a, b));
/** Mw 5 o più senza repliche, nei tre periodi (pochi eventi: solo un ordine di grandezza). */
export const ind5Periodi = PERIODI.map(([a, b]) => mediaHorus('ind5', a, b));
/** Mw 3 o più senza repliche (completo dal 1981): 1981-2004 e 2005-2025. */
export const ind3Prima = mediaHorus('ind3', 1981, 2004);
export const ind3Dopo = mediaHorus('ind3', 2005, 2025);
/** Mw 2,5 o più senza repliche (completo dal 1990): 1990-2004 e 2005-2025. */
export const ind25HPrima = mediaHorus('ind25', 1990, 2004);
export const ind25HDopo = mediaHorus('ind25', 2005, 2025);

/**
 * Rapporto tra due ritmi di Poisson (eventi indipendenti), con l'intervallo al 95% approssimato sul logaritmo:
 * exp(ln r ± 1,96·√(1/n1 + 1/n2)). Un intervallo tutto sopra 1 sarebbe un aumento; tutto sotto 1, un calo.
 */
export function rapportoRitmi(n1: number, anni1: number, n2: number, anni2: number) {
  const r = n2 / anni2 / (n1 / anni1);
  const e = 1.96 * Math.sqrt(1 / n1 + 1 / n2);
  return { r, lo: r * Math.exp(-e), hi: r * Math.exp(e) };
}
/** Mw ≥ 4 senza repliche: 2005-2025 rispetto a 1960-1984 e rispetto a 1985-2004. */
export const rapportoInd4 = rapportoRitmi(sommaHorus('ind4', 1960, 1984), 25, sommaHorus('ind4', 2005, 2025), 21);
export const rapportoInd4Recente = rapportoRitmi(sommaHorus('ind4', 1985, 2004), 20, sommaHorus('ind4', 2005, 2025), 21);
/** Mw ≥ 3 senza repliche: 2005-2025 rispetto a 1981-2004. */
export const rapportoInd3 = rapportoRitmi(sommaHorus('ind3', 1981, 2004), 24, sommaHorus('ind3', 2005, 2025), 21);

/** Gli anni con più scosse Mw ≥ 4 in terraferma (con le repliche): sono gli anni delle grandi sequenze. */
export const ANNI_SEQUENZA_HORUS: Record<number, string> = {
  1968: 'Belice',
  1976: 'Friuli',
  1980: 'Irpinia',
  1997: 'Umbria-Marche',
  2009: 'L’Aquila',
  2012: 'Emilia',
  2016: 'Italia centrale',
};
export const piccoW4 = horusAnni.reduce((a, b) => (b.w4 > a.w4 ? b : a));
export const piccoInd4 = horusAnni.reduce((a, b) => (b.ind4 > a.ind4 ? b : a));

/* ---------- Numeri pubblicati (non nostri) ---------- */

/**
 * Soglia di completezza del catalogo HORUS in Mw, solo terraferma italiana: tabella 10 di Lolli e altri (2020),
 * da Gasperini e altri (2013) per il 1981-2010 e Lolli e altri (2018) per il 1960-1980. [da, a (escluso), Mc].
 * Il 2005 si divide al 16 aprile: nel grafico lo scriviamo 2005,29 (frazione d'anno).
 */
export const MC_TAB10: [number, number, number][] = [
  [1960, 1981, 4.0],
  [1981, 1990, 3.0],
  [1990, 2003, 2.5],
  [2003, 2005.29, 2.1],
  [2005.29, 2011, 1.8],
];
/** Mc anno per anno 2005-2019, metodo «interattivo» degli autori (Lolli e altri 2020, tabella S2). */
export const MC_ANNUALE: [number, number][] = [
  [2005, 1.8], [2006, 1.7], [2007, 1.5], [2008, 2.0], [2009, 1.8], [2010, 1.7], [2011, 1.5], [2012, 2.3],
  [2013, 1.6], [2014, 1.7], [2015, 1.6], [2016, 1.8], [2017, 1.5], [2018, 1.5], [2019, 1.3],
];
/** Da che anno un conteggio in Mw a una certa soglia è completo, secondo la tabella 10 (in terraferma). */
export const completoDal = (soglia: number) => MC_TAB10.find(([, , mc]) => mc <= soglia)?.[0] ?? Infinity;

/** Amato e Mele (2008), p. 421: due anni senza grandi terremoti, prima e dopo il potenziamento della rete. */
export const AMATO_MELE = { epicentri2000: 3000, epicentri2006: 6000, mc2000: [2.3, 2.4] as [number, number], mc2006: 1.7 };
/** Schorlemmer e altri (2010): con la rete moderna il catalogo è completo ovunque da M 2,9 (tranne Sardegna, Pantelleria e Lampedusa). */
export const MC_PMC_OVUNQUE = 2.9;
/** INGV, comunicati: terremoti localizzati nel 2016 («oltre 53.000», 25/2/2017) e nel 2025 (15.759, 12/1/2026). */
export const INGV_2016 = 53000;
export const INGV_2025 = 15759;

/** CPTI15 (già nel sito): terremoti di Mw 6 o più per secolo; completo da Mw 6 dal 1620 (Rovida e altri 2020). */
export const mw6PerSecolo = cpti.mw6PerSecolo as [number, number][];
export const mw6Secolo = (s: number) => mw6PerSecolo.find(([k]) => k === s)?.[1] ?? 0;

/* ---- Aggiunte dopo la verifica ---- */

/** Il calo delle Mw≥4 indipendenti avviene tutto fra il 1980 e il 1981, quando HORUS cambia fonte (Lolli e altri 2020). */
export const ind4_1960_1980 = mediaHorus('ind4', 1960, 1980);
export const ind4_1981_2004 = mediaHorus('ind4', 1981, 2004);
/** Dal 1981 a oggi: nessuna differenza che il caso non possa spiegare. */
export const rapportoInd4Dal1981 = rapportoRitmi(sommaHorus('ind4', 1981, 2004), 24, sommaHorus('ind4', 2005, 2025), 21);

/** Campi Flegrei a soglia fissa (M ≥ 2,5, catalogo INGV): 1985-2014. Le scosse più piccole entrano nel catalogo nazionale solo verso il 2015. */
export const cf25_1985_2014 = somma(tra(fdsnAnni, 1985, 2014).map((r) => r.cf25));

/** Numeri pubblicati (non nostri calcoli), con la fonte. */
/** INGV, Osservatorio Vesuviano, bollettino dei Campi Flegrei di settembre 2026: terremoti nei 12 mesi fino a settembre 2026. */
export const OV_12MESI = 5021;
/** Stesso bollettino: stazioni della rete permanente dei Campi Flegrei. */
export const OV_STAZIONI = 27;
/** Amato e Mele (2008): stazioni della rete nazionale nel 1997, circa. */
export const STAZIONI_1997 = 90;
/** Blog INGVterremoti, 16/6/2025: stazioni oggi, con le reti degli enti che collaborano. */
export const STAZIONI_OGGI = 850;
/** USGS, domande frequenti: terremoti M ≥ 7 nel mondo, media dal 1900, minimo (1989) e massimo (2010) citati. */
export const USGS_M7 = { media: 16, min: [1989, 6] as const, max: [2010, 23] as const };
/** Anni contati con HORUS. */
export const anniHorus = ANNI_HORUS[1] - ANNI_HORUS[0] + 1;
/** Giorni prima e dopo il 16 aprile 2005, nel 2005. */
export const GIORNI_2005 = { prima: 105, dopo: 260 };
