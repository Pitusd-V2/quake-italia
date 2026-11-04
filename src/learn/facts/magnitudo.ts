/**
 * Numeri dell'articolo «Una scossa, tante magnitudo», calcolati dai dati del catalogo INGV
 * (src/data/learn/magnitudo.json, da scripts/build-magnitude-data.mjs): il testo li legge da qui,
 * così restano sempre uguali ai dati.
 */
import data from '../../data/learn/magnitudo.json';

export interface Stima {
  tipo: string;
  valore: number;
  incertezza: number | null;
  stazioni: number | null;
  preferita: boolean;
}

export interface Evento {
  id: number;
  nome: string;
  tempo: string;
  luogo: string;
  richiesta: string;
  stime: Stima[];
}

export const magnitudoData = data as { titolo: string; fonte: string; scaricato: string; eventi: Evento[] };

const nums = (xs: (number | null)[]) => xs.filter((v): v is number => v !== null);

/** Il riassunto di un terremoto: le stime ML, la Mw (o la Md) e quanto variano. */
export function sintesi(e: Evento) {
  const ml = e.stime.filter((s) => s.tipo === 'ML');
  const mwLike = e.stime.filter((s) => s.tipo.startsWith('Mw')); // Mw e Mwp: stime della magnitudo momento
  const mw = e.stime.find((s) => s.tipo === 'Mw' && s.preferita) ?? e.stime.find((s) => s.tipo === 'Mw');
  const md = e.stime.filter((s) => s.tipo === 'Md');
  const mlValori = ml.map((s) => s.valore);
  const stazioni = nums(ml.map((s) => s.stazioni)).filter((n) => n > 0);
  const incertezze = nums(ml.map((s) => s.incertezza)).filter((n) => n > 0);
  // La ML «principale»: quella calcolata con più stazioni (se il catalogo non lo dice, la prima).
  const mlPrincipale = [...ml].sort((a, b) => (b.stazioni ?? -1) - (a.stazioni ?? -1))[0]?.valore ?? null;
  return {
    nome: e.nome,
    tempo: e.tempo,
    anno: Number(e.tempo.slice(0, 4)),
    richiesta: e.richiesta,
    stime: e.stime.length,
    nML: ml.length,
    mlMin: mlValori.length ? Math.min(...mlValori) : null,
    mlMax: mlValori.length ? Math.max(...mlValori) : null,
    mlValori,
    mlPrincipale,
    mw: mw?.valore ?? null,
    nMw: mwLike.length,
    mwTutteUguali: mwLike.every((s) => s.valore === mwLike[0]?.valore),
    mdValori: md.map((s) => s.valore),
    stazMin: stazioni.length ? Math.min(...stazioni) : null,
    stazMax: stazioni.length ? Math.max(...stazioni) : null,
    incMin: incertezze.length ? Math.min(...incertezze) : null,
    incMax: incertezze.length ? Math.max(...incertezze) : null,
  };
}

export type Sintesi = ReturnType<typeof sintesi>;

function evento(nome: string): Sintesi {
  const e = magnitudoData.eventi.find((x) => x.nome === nome);
  if (!e) throw new Error(`Manca il terremoto «${nome}» in magnitudo.json`);
  return sintesi(e);
}

export const norcia = evento('Norcia');
export const amatrice = evento('Amatrice');
export const aquila = evento('L’Aquila');
export const visso = evento('Visso');
export const emilia = evento('Emilia');
export const marche = evento('Costa marchigiana');
export const flegrei = evento('Campi Flegrei');

/** I terremoti con ML e Mw, dal più forte (per Mw). */
export const conMw: Sintesi[] = magnitudoData.eventi
  .map(sintesi)
  .filter((s) => s.mw !== null && s.nML > 0)
  .sort((a, b) => (b.mw ?? 0) - (a.mw ?? 0));

/** Quante volte il momento sismico di una scossa supera quello di un'altra: Mw = ⅔ (log₁₀ M₀ − 9,1). */
export const momentoVolte = (mwA: number, mwB: number) => 10 ** (1.5 * (mwA - mwB));

/** Con le magnitudo arrotondate al decimale, la differenza vera può essere ± 0,1: il rapporto sta tra questi due valori. */
export const momentoForbice = (mwA: number, mwB: number) => [momentoVolte(mwA - 0.1, mwB), momentoVolte(mwA + 0.1, mwB)] as const;

/** 10 elevato a 1,5: quante volte cresce il momento sismico per ogni punto di Mw. */
export const perPunto = 10 ** 1.5;

/** Il momento sismico (newton·metro) che corrisponde a una Mw, con la formula Mw = ⅔ (log₁₀ M₀ − 9,1). */
export const momento = (mw: number) => 10 ** (1.5 * mw + 9.1);

/** Un numero con un decimale, alla italiana: 6.5 → «6,5». */
export const d1 = (v: number | null) => (v ?? Number.NaN).toFixed(1).replace('.', ',');

/** Campi Flegrei, 13 marzo 2025: la prima Md e quella dopo la revisione (la principale del catalogo). */
const cfMd = magnitudoData.eventi.find((e) => e.nome === 'Campi Flegrei')?.stime.filter((s) => s.tipo === 'Md') ?? [];
export const flegreiMd = {
  prima: Math.min(...cfMd.map((s) => s.valore)),
  finale: cfMd.find((s) => s.preferita)?.valore ?? Number.NaN,
  incertezza: cfMd.find((s) => s.preferita)?.incertezza ?? null,
};
