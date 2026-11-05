/**
 * Numeri dell'articolo «Le faglie», calcolati dai meccanismi focali del catalogo INGV
 * (src/data/learn/faglie.json, da scripts/build-fault-data.mjs): il testo li legge da qui.
 */
import data from '../../data/learn/faglie.json';

export type Tipo = 'normale' | 'inversa' | 'trascorrente';
/** [lat, lon, profondità km, magnitudo, tipo (0 normale, 1 inversa, 2 trascorrente), rake, anno] */
export type Riga = [number, number, number, number, number, number, number];

export interface Notevole {
  tempo: string;
  luogo: string;
  mag: number;
  magTipo: string;
  prof: number;
  tipo: Tipo;
  p1: number[];
  p2: number[];
}

export const faglieData = data as unknown as {
  titolo: string;
  fonte: string;
  scaricato: string;
  area: { minlat: number; maxlat: number; minlon: number; maxlon: number };
  magnitudoMinima: number;
  anni: [number, number];
  richieste: string[];
  fonteCoste: string;
  tipi: Tipo[];
  scosse: Riga[];
  notevoli: Notevole[];
  coste: [number, number][][];
};

export const TIPI = faglieData.tipi;
export const tutte = faglieData.scosse;
/** Le scosse nella crosta (fino a 40 km): quelle delle faglie di cui parla l'articolo. */
export const PROF_MAX = 40;
export const crostali = tutte.filter((s) => s[2] <= PROF_MAX);
/** Le scosse più profonde avvengono dentro la placca che scende sotto il Tirreno: sono un'altra storia. */
export const profonde = tutte.filter((s) => s[2] > PROF_MAX);
/** Quelle sotto il Tirreno meridionale e la Calabria (37,5–40,5° N, 13,5–17° E). */
export const profondeSud = profonde.filter((s) => s[0] >= 37.5 && s[0] <= 40.5 && s[1] >= 13.5 && s[1] <= 17);

/** Quante scosse di ogni tipo: [normali, inverse, trascorrenti]. */
export const conta = (xs: Riga[]) => [0, 1, 2].map((t) => xs.filter((s) => s[4] === t).length) as [number, number, number];

/** Le zone del confronto: riquadri semplici in gradi [lat min, lat max, lon min, lon max]. */
export const ZONE = [
  { nome: 'Appennino centrale', box: [41.8, 43.8, 12.2, 14.2] },
  { nome: 'Pianura Padana', box: [44.3, 45.5, 9, 12.6] },
  { nome: 'Calabria', box: [37.9, 40.1, 15.5, 17.3] },
  { nome: 'Sicilia e Tirreno meridionale', box: [36.5, 38.6, 12, 15.5] },
] as const;

const dentro = (s: Riga, [la0, la1, lo0, lo1]: readonly number[]) => s[0] >= la0 && s[0] <= la1 && s[1] >= lo0 && s[1] <= lo1;

export const zone = ZONE.map((z) => {
  const xs = crostali.filter((s) => dentro(s, z.box));
  const c = conta(xs);
  return { ...z, n: xs.length, conta: c, quota: c.map((v) => (xs.length ? v / xs.length : 0)) as [number, number, number] };
});
export const zona = (nome: string) => zone.find((z) => z.nome === nome)!;

export const notevoli = faglieData.notevoli;
const trova = (testo: string) => notevoli.find((n) => n.luogo.includes(testo))!;
export const norcia = trova('Norcia');
export const aquila = trova('Aquila');
export const amatrice = trova('Accumoli');
export const finale = trova('Finale Emilia');
export const medolla = trova('Medolla');
export const marche = trova('Costa Marchigiana');
export const croazia = trova('Croatia');

/** «quasi 9 su 10», «8 su 10»… dalla quota (0–1). */
export function suDieci(q: number) {
  const n = Math.round(q * 10);
  const quasi = q * 10 < n - 0.15;
  return `${quasi ? 'quasi ' : ''}${n} su 10`;
}

export const int = (v: number) => String(Math.round(v));
/** Un angolo con il segno meno tipografico: −89. */
export const gradi = (v: number) => (v < 0 ? `−${Math.abs(v)}` : String(v));
export const dec = (v: number, d = 1) => v.toFixed(d).replace('.', ',');
