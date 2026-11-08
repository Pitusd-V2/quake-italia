/**
 * Numeri dell'articolo «Magnitudo e intensità», calcolati dalle intensità per comune del database «Hai Sentito Il
 * Terremoto» dell'INGV (src/data/learn/intensita.json, da scripts/build-intensita-data.mjs): il testo li legge da qui.
 *
 * Nel database l'intensità 1 vuol dire «non sentito»; dal 2 in su qualcuno l'ha sentita. Distanze, mediane e confronto
 * con la formula del sito (src/lib/impact.ts) sono un nostro calcolo, fatto dallo script.
 */
import data from '../../data/learn/intensita.json';

/** [distanza dall'epicentro in km, intensità MCS, 1 se il comune è più a sud dell'epicentro] */
export type Punto = [number, number, number];

export interface Fascia {
  da: number;
  a: number;
  n: number;
  mediana: number;
  /** Percentuale dei comuni dove qualcuno l'ha sentita (intensità 2 o più). */
  sentito: number;
}

export interface Lato {
  n: number;
  mediana: number;
  sentito: number;
}

export interface Scarto {
  n: number;
  /** Intensità HSIT meno intensità della formula: positivo se la formula sottostima. */
  mediana: number;
  media: number;
  sd: number;
  /** Percentuale dei comuni dove la formula sbaglia al massimo di un grado. */
  entro1: number;
}

export interface Evento {
  id: string;
  chiave: 'ischia' | 'emilia' | 'norcia' | 'policastro';
  nome: string;
  /** Data e ora UTC (ISIDe). */
  tempo: string;
  magTipo: string;
  mag: number;
  prof: number;
  lat: number;
  lon: number;
  ingv: { tempo: string; lat: number; lon: number; prof: number; magTipo: string; mag: number; luogo: string };
  /** Comuni con un'intensità nel database. */
  comuni: number;
  /** Comuni con almeno 3 questionari: quelli del grafico. */
  comuniUsati: number;
  questionari: number;
  massimo: { comune: string; I: number; q: number; dKm: number };
  /** Il comune più lontano (km) con intensità 2 o più e almeno 3 questionari. */
  distMaxSentito: number;
  /** Cosa prevede la formula del sito proprio sopra l'epicentro. */
  formulaEpicentro: number;
  scarto: Scarto | null;
  mediane: Fascia[];
  asimmetria: { da: number; a: number; sud: Lato | null; nord: Lato | null }[];
  /** La curva della formula: [distanza dall'epicentro km, intensità]. */
  curva: [number, number][];
  punti: Punto[];
}

/** Intensità EMS-98 meno MCS negli stessi comuni (stessi questionari, soglie di percentuale diverse). */
export interface ConfrontoScale {
  n: number;
  media: number;
  /** Percentuale dei comuni dove la EMS-98 è più alta della MCS, e dove è più bassa. */
  emsPiuAlta: number;
  emsPiuBassa: number;
}

export interface Classe extends Scarto {
  da: number;
  a: number;
  terremoti: number;
  /** Percentuale di accordi «facili»: il comune dice «non sentito» e anche la formula dà grado I. */
  nonSentitoEntrambi: number;
  /** Percentuale dei comuni «non sentito» (intensità 1) nella classe. */
  nonSentito: number;
  /** Distanza mediana dei comuni dall'ipocentro (km). */
  rMediana: number;
  /** Il tipo di magnitudo nel database (quella preferita dall'INGV), in percentuale dei comuni. */
  tipiMagnitudo: Record<string, number>;
}

export const intensitaData = data as unknown as {
  titolo: string;
  fonte: string;
  citazione: string;
  doi: string;
  licenza: string;
  file: { csv: string; readme: string };
  scaricato: string;
  richieste: string[];
  script: string;
  formula: string;
  database: {
    righe: number;
    terremoti: number;
    conIntensita: number;
    nonSentito: number;
    sentito: number;
    questionari: number;
    primo: string;
    ultimo: string;
    intensitaMassima: number;
  };
  eventi: Evento[];
  confronto: { profMax: number; distMax: number; qMin: number; classi: Classe[]; q10: Classe[]; soloSentiti: Classe[];
    righeProfonde: number;
    /** Le scosse più profonde di profMax, escluse dal confronto: quante, e quante di magnitudo 4 e 5 o più. */
    profonde: { terremoti: number; m4: number; m5: number };
  };
  scale: { tutti: ConfrontoScale; soloSentiti: ConfrontoScale };
};

export const HSIT_ZIP = intensitaData.richieste[0];
export const HSIT_DOI = intensitaData.doi;

/* ---------- Il database ---------- */

export const db = intensitaData.database;
/** Quota delle intensità comunali che dicono «non sentito» (0–1). */
export const quotaNonSentito = db.nonSentito / db.conIntensita;

/* ---------- Le quattro scosse del grafico ---------- */

export const eventi = intensitaData.eventi;
const evento = (k: Evento['chiave']) => eventi.find((e) => e.chiave === k)!;
export const ischia = evento('ischia');
export const emilia = evento('emilia');
export const norcia = evento('norcia');
export const policastro = evento('policastro');

/** La mediana in una fascia di distanza (km), se c'è. */
export const medianaFascia = (e: Evento, da: number) => e.mediane.find((f) => f.da === da);

/** Ischia tra 30 e 50 km: intensità mediana appena sopra II, sentita in circa metà dei comuni (oltre, in nessuno). */
export const ischiaFascia30 = medianaFascia(ischia, 30)!;
/** Emilia e Norcia tra 150 e 200 km: la scossa emiliana, più piccola, lì si sente quanto o più di quella di Norcia. */
export const emilia150 = medianaFascia(emilia, 150)!;
export const norcia150 = medianaFascia(norcia, 150)!;

/** La scossa profonda: tra 100 e 200 km dall'epicentro, comuni a sud (Calabria) contro comuni a nord. */
export const policastro100 = policastro.asimmetria.find((f) => f.da === 100)!;
export const policastroSud = policastro100.sud!;
export const policastroNord = policastro100.nord!;
/** La formula, simmetrica, a 150 km dall'epicentro della scossa profonda. */
export const policastroFormula150 = policastro.curva.reduce((a, c) => (Math.abs(c[0] - 150) < Math.abs(a[0] - 150) ? c : a))[1];

/* ---------- Quanto sbaglia la formula del sito ---------- */

export const confronto = intensitaData.confronto;
export const classi = confronto.classi;
export const classe = (da: number, xs: Classe[] = classi) => xs.find((c) => c.da === da)!;
/** Quanti confronti comune per comune in tutto (scosse fino a 40 km, comuni entro 300 km, almeno 3 questionari). */
export const confrontiTotali = classi.reduce((a, c) => a + c.n, 0);
export const terremotiConfronto = classi.reduce((a, c) => a + c.terremoti, 0);
/** La forchetta della quota «entro un grado» tra le classi di magnitudo (percentuali). */
export const entro1Min = Math.min(...classi.map((c) => c.entro1));
export const entro1Max = Math.max(...classi.map((c) => c.entro1));
/** Lo scarto mediano più grande, in valore assoluto, tra le classi. */
export const scartoMaxAssoluto = Math.max(...classi.map((c) => Math.abs(c.mediana)));
/**
 * Solo i comuni con almeno 10 questionari. Attenzione: è anche una selezione dei comuni dove la scossa si è sentita
 * (i «non sentito» calano molto) e un po' più vicini; per questo il testo non la presenta come «stime più solide».
 */
export const q10Forti = confronto.q10.filter((c) => c.da >= 5);
/** Le scosse profonde escluse dal confronto (più di 40 km). */
export const profonde = confronto.profonde;

/* ---------- MCS ed EMS-98 negli stessi comuni ---------- */

/** Nei questionari HSIT la EMS-98 è in media un po' più alta della MCS (soglie di percentuale più basse). */
export const scale = intensitaData.scale;
/**
 * Magnitudo 2–3: una buona parte dell'accordo è «facile» (nessuno l'ha sentita e la formula dice grado I).
 * Togliendo questi casi, la quota entro un grado scende: è questo il numero onesto per le scosse piccole.
 */
export const piccole = classe(2);
export const piccoleEntro1SenzaFacili = Math.round(((piccole.entro1 - piccole.nonSentitoEntrambi) / (100 - piccole.nonSentitoEntrambi)) * 1000) / 10;
/** Quota dei confronti in cui la magnitudo del database è la Mw (la formula è stata tarata sulla Mw), per classe. */
export const quotaMw = (c: Classe) => c.tipiMagnitudo.Mw ?? 0;

/* ---------- Dalla percentuale di chi l'ha sentita al grado (readme HSIT I.4, tabella 2) ---------- */

/**
 * La percentuale di chi ha sentito la scossa nel comune (con i «non sentito» moltiplicati per 6) dà un grado che serve a
 * correggere verso il basso quello ricavato dagli effetti descritti (Sbarra et al. 2025). L'ultima fascia vuol dire
 * «VI o più». Valori della tabella 2 del readme del database (non sono un nostro calcolo): da (incluso) e a (escluso), in %.
 */
export const PERCENTUALE_GRADO = [
  { grado: 'II', da: 0.1, a: 12.5 },
  { grado: 'III', da: 12.5, a: 37.5 },
  { grado: 'IV', da: 37.5, a: 62.5 },
  { grado: 'V', da: 62.5, a: 87.5 },
  { grado: 'VI', da: 87.5, a: 100 },
] as const;

/* ---------- Scrittura ---------- */

const ROMANI = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
/** Il grado in numeri romani (arrotondato al grado intero). */
export const romano = (v: number) => ROMANI[Math.min(12, Math.max(1, Math.round(v)))];
/** Un valore con un decimale e la virgola: 0,3. Con il segno quando serve: +0,3 o −0,4. */
export const dec1 = (v: number) => (Math.round(v * 10) / 10).toFixed(1).replace('.', ',');
export const conSegno = (v: number) => (v > 0 ? `+${dec1(v)}` : v < 0 ? `−${dec1(-v)}` : dec1(0));
/** Un'intensità come la scrive HSIT: 6 o 2,1 (niente «6,0»). */
export const valI = (v: number) => (Number.isInteger(v) ? String(v) : dec1(v));
/** Una percentuale intera: 77%. */
export const pct = (v: number) => `${Math.round(v)}%`;
/** La data italiana della scossa (dal tempo UTC del database). */
export const dataScossa = (e: Evento) =>
  new Intl.DateTimeFormat('it-IT', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Rome' }).format(new Date(`${e.tempo.replace(' ', 'T')}Z`));
