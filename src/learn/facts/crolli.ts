/**
 * Numeri dell'articolo «Perché gli edifici crollano».
 * Vengono da src/data/learn/crolli.json (scripts/build-crolli-data.mjs): tabelle e figure di studi pubblicati, con la fonte
 * indicata accanto ai valori. Le probabilità di danno sono un nostro calcolo con i parametri pubblicati.
 */
import data from '../../data/learn/crolli.json';
import { dec, n } from './format';

export type ClasseMuratura = 'A' | 'B' | 'C' | 'D';
export type ClasseCA = 'C2-M' | 'D-M';
export type LivelloCurva = 'D3' | 'D4';
export const CLASSI: ClasseMuratura[] = ['A', 'B', 'C', 'D'];
export const CLASSI_CA: ClasseCA[] = ['C2-M', 'D-M'];

interface Parametri {
  mediane: number[];
  beta: number;
}
type Curve = Record<LivelloCurva, number[]>;
interface Luogo {
  luogo: string;
  nota?: string;
  ems: [string, string | null];
  pgv: [number, number];
  pga: [number, number];
  misurato: [boolean, boolean];
}

export const crolliData = data as unknown as Omit<typeof data, 'fragilita' | 'scuotimento'> & {
  fragilita: {
    formula: string;
    griglia: number[];
    muratura: { fonte: string; dove: string; classi: Record<ClasseMuratura, Parametri>; probabilita: Record<ClasseMuratura, Curve> };
    cementoArmato: { fonte: string; dove: string; classi: Record<ClasseCA, Parametri>; probabilita: Record<ClasseCA, Curve> };
  };
  scuotimento: {
    fonte: string;
    dove: string;
    luoghi: Luogo[];
    pgvAttesa475: [number, number];
    pgvAttesa475Intervallo: [number, number];
    pgvOsservata: [number, number];
  };
};

/* ---------- Formati ---------- */

/** Una quota già in percentuale: «29%». */
export const perc = (v: number) => `${v}%`;
/** Una probabilità da 0 a 1 come percentuale intera; sotto l'1% non scrive un falso zero. */
export const probPct = (p: number) => (p > 0 && p < 0.01 ? 'meno dell’1%' : `${Math.round(p * 100)}%`);
/** Un'accelerazione in g: «0,3 g». */
export const inG = (v: number) => `${dec(v)} g`;
/** Un'accelerazione in cm/s² riportata in g, con due decimali, per confrontarla con gli altri valori del testo. */
export const cmInG = (v: number) => inG(Math.round((v / 981) * 100) / 100);

/* ---------- Norcia e Campi Alto (Sisti e altri, 2022) ---------- */

const nc = crolliData.norciaCampi;
const somma = (q: (number | null)[]) => q.reduce<number>((s, v) => s + (v ?? 0), 0);

/** Le unità strutturali in muratura rilevate. */
export const unitaNorcia = nc.danno.norcia.unita;
export const unitaCampi = nc.danno.campiAlto.unita;
/** Percentuali per indice di danno da 0 a 5. Per Norcia il 5 non è etichettato nella figura: è null. */
export const dannoNorcia = nc.danno.norcia.quote as (number | null)[];
export const dannoCampi = nc.danno.campiAlto.quote as number[];
/** Quota con danno da 0 a 2: il testo dello studio dà 78% e 26%. */
export const finoA2Norcia = somma(dannoNorcia.slice(0, 3));
export const finoA2Campi = somma(dannoCampi.slice(0, 3));
/** Campi Alto: quota con danno 5 (crollo locale o globale). */
export const danno5Campi = dannoCampi[5];
/** Il resto per arrivare a 100: a Norcia «danno 5 o non disponibile», a Campi Alto «non disponibile» o arrotondamenti. */
export const restoNorcia = 100 - somma(dannoNorcia);
export const restoCampi = 100 - somma(dannoCampi);

export const agibilita = nc.agibilita;
export const crolliNorcia = nc.crolli.norcia;
export const crolliCampi = nc.crolli.campiAlto;
/** Unità crollate del tutto o in parte. */
export const crollateNorcia = crolliNorcia.totali + crolliNorcia.parziali;
export const crollateCampi = crolliCampi.totali + crolliCampi.parziali;
/** Campi Alto: unità crollate, del tutto o in parte, che erano state rinnovate dopo il 1982. */
export const crollateRinnovateDopo1982Campi = crolliCampi.totaliRinnovateDopo1982 + crolliCampi.parzialiRinnovateDopo1982;
/** PGA est-ovest (cm/s²) delle due scosse del 26 ottobre: stazione vicino a Campi Alto e stazione vicino al centro di Norcia. */
export const accelerazioni26Ottobre = nc.accelerazioni26Ottobre;
export const qualitaMuratura = nc.qualitaMuratura;
export const dannoFinoA3 = nc.dannoFinoA3;
export const rinforzateDopo1982 = nc.rinforzateDopo1982;
export const demolite1979Norcia = nc.demolite1979Norcia.edifici;

/* ---------- Curve di fragilità ---------- */

const fr = crolliData.fragilita;
export const griglia = fr.griglia;
export const parametriMuratura = fr.muratura.classi;
export const parametriCA = fr.cementoArmato.classi;
export const curveMuratura = fr.muratura.probabilita;
export const curveCA = fr.cementoArmato.probabilita;

/** L'indice del valore di griglia più vicino a una PGA. */
export const indicePga = (pga: number) => Math.max(0, Math.min(griglia.length - 1, Math.round(pga / 0.02)));
/** Probabilità di raggiungere o superare un livello di danno, per una classe di muratura. */
export const probMuratura = (c: ClasseMuratura, l: LivelloCurva, pga: number) => curveMuratura[c][l][indicePga(pga)];
export const probCA = (c: ClasseCA, l: LivelloCurva, pga: number) => curveCA[c][l][indicePga(pga)];

/** La scossa d'esempio del testo e della figura. */
export const PGA_ESEMPIO = 0.3;
/** A 0,3 g: probabilità di danno almeno D3 e almeno D4 per ogni classe. */
export const esempioD3 = Object.fromEntries(CLASSI.map((c) => [c, probMuratura(c, 'D3', PGA_ESEMPIO)])) as Record<ClasseMuratura, number>;
export const esempioD4 = Object.fromEntries(CLASSI.map((c) => [c, probMuratura(c, 'D4', PGA_ESEMPIO)])) as Record<ClasseMuratura, number>;
/** A 0,3 g, quante volte la classe A supera la D per il danno almeno D3. */
export const rapportoAD = esempioD3.A / esempioD3.D;

/** Quanti sono i modelli di fragilità della valutazione nazionale: 4 per la muratura e 2 per il cemento armato. */
export const modelli = crolliData.numeri.modelli;

/* ---------- Quanto ha tremato (Sorrentino e altri, 2019) ---------- */

export const scuotimento = crolliData.scuotimento.luoghi;
export const luogo = (nome: string) => scuotimento.find((l) => l.luogo === nome)!;
export const pgvAttesa475 = crolliData.scuotimento.pgvAttesa475;
export const pgvOsservata = crolliData.scuotimento.pgvOsservata;

/* ---------- Altri numeri pubblicati ---------- */

const num = crolliData.numeri;
export const vittime2016 = num.vittime2016;
export const morti1859Norcia = num.norcia1859.morti;
export const patrimonio = num.patrimonio;
export const muraturaComuni2016 = num.muraturaComuni2016.quota as [number, number];
export const rischio = num.rischio;
export const speseStato50Anni = num.speseStato50Anni.miliardi;
export const speseStatoAnno = num.speseStato50Anni.miliardiAnno;
export const edificiDado = num.dado.edifici;
export const bancheDatiDado = num.dado.bancheDati;

/** Testi pronti. */
export const abitazioniCrollateAnno = `${n(rischio.abitazioniCrollateAnno.media)} (da ${n(rischio.abitazioniCrollateAnno.min)} a ${n(rischio.abitazioniCrollateAnno.max)} secondo il modello)`;

/** La fonte di un blocco di dati. */
export const fonte = (id: keyof typeof crolliData.fonti) => crolliData.fonti[id];
