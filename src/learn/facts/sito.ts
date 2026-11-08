/**
 * Numeri dell'articolo «Il terreno amplifica: gli effetti di sito».
 * I numeri dei dati vengono dal flatfile ESM (src/data/learn/sito.json, da scripts/build-sito-data.mjs): il testo li
 * legge da qui. In fondo, separati, i pochi numeri pubblicati in studi e norme, copiati dalla fonte indicata.
 */
import data from '../../data/learn/sito.json';
import { dec, n } from './format';

export type Categoria = 'A' | 'B' | 'C' | 'D' | 'E';
export const CATEGORIE: Categoria[] = ['A', 'B', 'C', 'D', 'E'];

/** Fattore rispetto alla roccia (A) con l'intervallo al 90% del bootstrap. */
export interface Fattore {
  f: number;
  lo: number;
  hi: number;
}
interface Prova {
  id: string;
  nome: string;
  registrazioni: number;
  terremoti: number;
  stazioniA: number;
  perCategoria: Partial<Record<Categoria, number>>;
  pga: Record<Exclude<Categoria, 'A'>, number | null>;
  sa1: Record<Exclude<Categoria, 'A'>, number | null>;
}
type Dispersione = { n: number; p10?: number; p50?: number; p90?: number };

export const sitoData = data as unknown as {
  titolo: string;
  fonte: string;
  doi: string[];
  scaricato: string;
  richiesta: string;
  righe: number;
  metodoCategoriaRighe: Record<string, number>;
  filtri: { profMaxKm: number; magMin: number; rjbMaxKm: number; hKm: number; minRegStazione: number };
  esclusioni: Record<string, number>;
  selezione: {
    registrazioni: number;
    terremoti: number;
    stazioni: number;
    magnitudo: [number, number];
    anni: [number, number];
    perCategoria: Record<Categoria, { registrazioni: number; stazioni: number }>;
    metodoCategoriaStazioni: Record<string, number>;
    riferimentoStazioniA: Record<string, number>;
    sequenze: Record<'aquila2009' | 'emilia2012' | 'centroItalia2016', { registrazioni: number; terremoti: number }>;
  };
  bootstrap: { repliche: number; livello: number; per: string };
  modello: {
    formula: string;
    pga: { b: number; c: number; fattori: Record<Categoria, Fattore> };
    sa1: { b: number; c: number; fattori: Record<Categoria, Fattore> };
  };
  dispersione: Record<Categoria, Dispersione>;
  robustezza: Prova[];
  scossa: {
    id: string;
    tempo: string;
    mw: number;
    ml: number;
    lat: number;
    lon: number;
    profKm: number;
    a: number;
    legenda: string[];
    punti: [number, number, Categoria][];
  };
  g: number;
};

/* ---------- Formati ---------- */

/** Un fattore con una cifra decimale: 2,6. */
export const f1 = (v: number) => dec(Math.round(v * 10) / 10);
/** Sempre con un decimale: 6,0. */
export const d1 = (v: number) => v.toFixed(1).replace('.', ',');
/** «×2,6». */
export const volte = (v: number) => `×${f1(v)}`;
/** Una percentuale intera: 48%. */
export const pct = (q: number) => `${Math.round(q * 100)}%`;
/** Da cm/s² a frazione di g. */
export const inG = (cmS2: number) => cmS2 / sitoData.g;
/** Un'accelerazione in g con due cifre significative: «0,58 g», «0,061 g». */
export const g2 = (cmS2: number) => `${dec(Number(inG(cmS2).toPrecision(2)))} g`;

/* ---------- I dati scelti ---------- */

const sel = sitoData.selezione;
/** Righe scaricate dal flatfile (terremoti in Italia di magnitudo 5 o più dal 2008). */
export const righe = sitoData.righe;
/** Su quante righe la categoria di sottosuolo è dedotta dalla carta geologica, non misurata. */
export const righeGeologia = sitoData.metodoCategoriaRighe.geology ?? 0;
/** Su quante righe la categoria viene da una misura della velocità delle onde S nel terreno. */
export const righeMisurate = sitoData.metodoCategoriaRighe.vs_profile ?? 0;
export const quotaGeologia = righeGeologia / righe;
/** Righe in cui la categoria non è misurata: dedotta dalla geologia o dalla pendenza del terreno, o senza metodo indicato. */
export const righeNonMisurate = righe - righeMisurate;
export const quotaMisurate = righeMisurate / righe;
/** Righe in cui la categoria è dedotta dalla pendenza del terreno. */
export const righeTopografia = sitoData.metodoCategoriaRighe.topography ?? 0;
/** Registrazioni, terremoti e stazioni dopo i filtri. */
export const registrazioni = sel.registrazioni;
export const terremoti = sel.terremoti;
export const stazioni = sel.stazioni;
export const perCategoria = sel.perCategoria;
/** Stazioni con la categoria misurata e stazioni con la categoria dedotta (geologia o pendenza del terreno). */
export const stazioniMisurate = sel.metodoCategoriaStazioni.vs_profile ?? 0;
export const stazioniDedotte = stazioni - stazioniMisurate;
/** Stazioni di categoria A riconosciute come «sito di riferimento» (risposta piatta) nella classificazione riportata da ESM. */
export const stazioniARiferimento = sel.riferimentoStazioniA.YES ?? 0;
export const stazioniA = perCategoria.A.stazioni;
/** Quanto pesano le grandi sequenze sul totale delle registrazioni. */
export const quotaCentroItalia = sel.sequenze.centroItalia2016.registrazioni / registrazioni;
export const quotaEmilia = sel.sequenze.emilia2012.registrazioni / registrazioni;
export const quotaAquila = sel.sequenze.aquila2009.registrazioni / registrazioni;
export const filtri = sitoData.filtri;

/* ---------- Il risultato: quanto in più, in media, rispetto alla roccia ---------- */

/** Accelerazione di picco (PGA): fattori medi per categoria. */
export const fattoriPga = sitoData.modello.pga.fattori;
/** Accelerazione spettrale a 1 secondo (edifici più alti e flessibili). */
export const fattoriSa1 = sitoData.modello.sa1.fattori;
/** Le categorie con poche stazioni: il loro fattore è poco affidabile. */
export const POCHE_STAZIONI = 30;
export const pocheStazioni = (c: Categoria) => perCategoria[c].stazioni < POCHE_STAZIONI;

/** Le prove di robustezza: il fattore C della PGA resta in questo intervallo. */
export const robustezza = sitoData.robustezza;
const cPga = robustezza.map((p) => p.pga.C).filter((v): v is number => v !== null);
export const robustezzaC: [number, number] = [Math.min(...cPga), Math.max(...cPga)];
export const prova = (id: string) => robustezza.find((p) => p.id === id)!;

/** Dispersione tra stazioni: fattore medio di ogni stazione rispetto alla roccia media, percentili 10, 50 e 90. */
export const dispersione = sitoData.dispersione;

/* ---------- Una scossa: 24 agosto 2016 ---------- */

export const scossa = sitoData.scossa;
const mp = sitoData.modello.pga;
/** La curva media del nostro modello per questa scossa: PGA (cm/s²) a una distanza (km) per una categoria. */
export function curva(rjbKm: number, cat: Categoria = 'A') {
  const r = Math.hypot(rjbKm, filtri.hKm);
  return Math.exp(scossa.a + mp.b * Math.log(r) + mp.c * r) * mp.fattori[cat].f;
}
/** In questa scossa, quante volte le stazioni di ogni categoria stanno sopra la curva della roccia (media geometrica). */
export const scossaFattore = Object.fromEntries(
  CATEGORIE.map((c) => {
    const ps = scossa.punti.filter((p) => p[2] === c);
    const m = ps.reduce((s, p) => s + Math.log(p[1] / curva(p[0], 'A')), 0) / (ps.length || 1);
    return [c, { n: ps.length, f: Math.exp(m) }];
  }),
) as Record<Categoria, { n: number; f: number }>;
/** In questa scossa: quante stazioni su terreni soffici (C, D, E) stanno sopra la curva della roccia, e quante su roccia sopra la curva C. */
const soffici = scossa.punti.filter((p) => p[2] === 'C' || p[2] === 'D' || p[2] === 'E');
const roccia = scossa.punti.filter((p) => p[2] === 'A');
export const scossaSoffici = { tot: soffici.length, sopraRoccia: soffici.filter((p) => p[1] > curva(p[0], 'A')).length };
export const scossaRoccia = { tot: roccia.length, sopraC: roccia.filter((p) => p[1] > curva(p[0], 'C')).length };
/** La stazione più vicina e la più forte della scossa. */
export const scossaMax = scossa.punti.reduce((a, b) => (b[1] > a[1] ? b : a));
export const scossaVicina = scossa.punti.reduce((a, b) => (b[0] < a[0] ? b : a));
/** Vero se il valore più alto l'ha registrato proprio la stazione più vicina alla faglia. */
export const scossaMaxVicina = scossaMax === scossaVicina;
/** «nessuna sta», «una sta», «3 stanno»: per scrivere nel testo un conteggio che viene dai dati. */
export const quanteStanno = (k: number) => (k === 0 ? 'nessuna sta' : k === 1 ? 'una sta' : `${k} stanno`);

/* ---------- Numeri pubblicati (copiati dalla fonte, non dai nostri dati) ---------- */

/**
 * Onna e i paesi vicini, scossa del 6 aprile 2009: Cantore, Rovelli e Calderoni (2017), Geophysical Journal
 * International 210(1), Tab. 3. PGA in g; «simulata» = ricostruita dalle repliche registrate (risposta lineare del
 * terreno); intensità MCS osservate (Tertulliani e altri, 2009, citati nello studio) e «simulate» dalla PGA.
 */
export const ONNA_TAB3 = [
  { luogo: 'L’Aquila', pgaOsservata: 0.31, pgaSimulata: 0.33, iOsservata: 'VIII–IX', iSimulata: 'VIII' },
  { luogo: 'Monticchio', pgaOsservata: null, pgaSimulata: 0.18, iOsservata: 'VI–VII', iSimulata: 'VII–VIII' },
  { luogo: 'Onna', pgaOsservata: null, pgaSimulata: 0.58, iOsservata: 'IX–X', iSimulata: 'IX' },
  { luogo: 'Paganica', pgaOsservata: null, pgaSimulata: 0.42, iOsservata: 'VIII–IX', iSimulata: 'VIII–IX' },
  { luogo: 'Bazzano', pgaOsservata: null, pgaSimulata: 0.2, iOsservata: 'VIII', iSimulata: 'VII–VIII' },
] as const;
const onna = ONNA_TAB3.find((r) => r.luogo === 'Onna')!;
const monticchio = ONNA_TAB3.find((r) => r.luogo === 'Monticchio')!;
/** Onna rispetto a Monticchio nella ricostruzione: circa 3 volte. */
export const onnaSuMonticchio = onna.pgaSimulata / monticchio.pgaSimulata;

/**
 * Onna: risonanza a 2–3 Hz con circa 40 m di sedimenti alluvionali (Di Giulio e altri, 2011, abstract).
 * Con f0 = V/(4h) la velocità media delle onde S nello strato sarebbe V = 4·h·f0: un nostro conto di ordine di grandezza.
 */
export const ONNA_RISONANZA = { fHz: [2, 3] as const, hM: 40 };
export const frequenzaPropria = (vMs: number, hM: number) => vMs / (4 * hM);
export const onnaV = ONNA_RISONANZA.fHz.map((f) => 4 * ONNA_RISONANZA.hM * f) as [number, number];

/**
 * ITA10 (Bindi e altri, 2011, Bulletin of Earthquake Engineering 9(6)): coefficienti di sito in log10 rispetto ad A,
 * dal testo dello studio: B circa 0,2 a tutti i periodi; C circa 0,25 a 0,1 s e 0,33 a 2 s.
 */
export const ITA10 = { B: 10 ** 0.2, C: [10 ** 0.25, 10 ** 0.33] as [number, number] };

/** NTC 2018, Tab. 3.2.IV e 3.2.V: valori massimi del coefficiente stratigrafico SS e del coefficiente topografico ST. */
export const NTC_SS_MAX = { B: 1.2, C: 1.5, D: 1.8, E: 1.6 };
/** NTC 2018, Tab. 3.2.IV: il minimo di SS (per D può scendere sotto 1). */
export const NTC_SS_MIN = { B: 1, C: 1, D: 0.9, E: 1 };
/**
 * NTC 2018, Tab. 3.2.IV: il coefficiente CC, che allunga il periodo TC = CC·TC* dove finisce il tratto piatto dello spettro.
 * TC* (in secondi) è un dato della pericolosità di base del luogo, su roccia.
 */
export const NTC_CC = {
  B: (tc: number) => 1.1 * tc ** -0.2,
  C: (tc: number) => 1.05 * tc ** -0.33,
  D: (tc: number) => 1.25 * tc ** -0.5,
  E: (tc: number) => 1.15 * tc ** -0.4,
};
/**
 * Un nostro conto sulla norma: per un periodo tra TC e TD (per esempio 1 secondo) lo spettro vale ag·S·η·Fo·TC/T, quindi
 * rispetto alla roccia è moltiplicato per SS·CC. Con SS al massimo (scuotimento di base debole), per alcuni valori di TC*.
 */
export const NTC_TC_ESEMPI = [0.25, 0.3, 0.4] as const;
export const ntcLungo = (c: keyof typeof NTC_CC, tc: number) => NTC_SS_MAX[c] * NTC_CC[c](tc);
/** Intervallo del fattore della norma a 1 secondo per i terreni C, con TC* tra 0,25 e 0,4 s: circa da 2,1 a 2,5. */
export const ntcLungoC: [number, number] = [ntcLungo('C', NTC_TC_ESEMPI[2]), ntcLungo('C', NTC_TC_ESEMPI[0])];
export const NTC_ST_MAX = { T1: 1, T2: 1.2, T3: 1.2, T4: 1.4 };

/** Testi pronti: «2.895 registrazioni di 40 terremoti a 796 stazioni». */
export const descrizioneSelezione = `${n(registrazioni)} registrazioni di ${n(terremoti)} terremoti a ${n(stazioni)} stazioni`;
