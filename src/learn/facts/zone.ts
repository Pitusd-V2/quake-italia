/**
 * Numeri dell'articolo «Le zone sismiche, spiegate», calcolati da src/data/learn/zone.json
 * (da scripts/build-zone-data.mjs): elenco DPC dei comuni (maggio 2025), popolazione ISTAT (1/1/2025),
 * Allegato A dell'OPCM 3274/2003 e griglia INGV MPS04. Il testo li legge da qui, così restano uguali ai dati.
 */
import data from '../../data/learn/zone.json';
import { dec } from './format';

export type Zona = 1 | 2 | 3 | 4;
/** Categorie dei decreti fino al 1984, nell'ordine dell'Allegato A: I, II, III, non classificato. */
export type Categoria = 'I' | 'II' | 'III' | 'N.C.';
type Quattro = [number, number, number, number];

export interface Fonte {
  nome: string;
  url: string;
  pagina?: string;
  licenza?: string;
  doi?: string;
}

export interface Regione {
  nome: string;
  atto: { tipo: string; numero: string; data: string };
  comuni: number;
  /** Comuni per zona principale (la più pericolosa del codice). */
  zone: Quattro;
  /** Abitanti per zona dei comuni con un'unica zona. */
  pop: Quattro;
  /** Abitanti dei comuni divisi tra zone con numeri diversi. */
  popDivisi: number;
  /** Codici ufficiali usati e quanti comuni ne hanno ciascuno (es. «3S»: 165). */
  codici: Record<string, number>;
  /** Comuni ritrovati per nome nell'Allegato A del 2003, quanti hanno lo stesso codice di allora, quanti non si trovano. */
  confronto2003: { trovati: number; uguali: number; nonTrovati: number };
}

export interface Esempio {
  comune: string;
  sigla: string;
  regione: string;
  cat1984: string;
  proposta1998: string;
  zona2003: number;
  codice2025: string;
  zona2025: number;
  pop2025: number;
}

export const zoneData = data as unknown as {
  titolo: string;
  scaricato: string;
  fonti: Record<'zone' | 'atti' | 'popolazione' | 'opcm3274' | 'mps04', Fonte>;
  richieste: string[];
  impronteSha256: Record<string, string>;
  controlli: {
    comuni: number;
    ugualeAlSito: boolean;
    righeDiverseDalSito: number;
    senzaPopolazione: string[];
    nomiDiversiIstat: string[];
    comuniIstat: number;
    popIstatTotale: number;
    attiInvariati: boolean;
  };
  oggi: {
    comuni: number;
    zone: Quattro;
    popTotale: number;
    pop: Quattro;
    divisi: { comune: string; sigla: string; codice: string; zona: number; pop: number }[];
    sottozoneStessaZona: { comune: string; sigla: string; codice: string }[];
    codici: Record<string, number>;
  };
  regioni: Regione[];
  storia: {
    comuni: number;
    nuoviSenzaCategoria: number;
    categorie: Categoria[];
    cat1984: Quattro;
    proposta1998: Quattro;
    zone2003: Quattro;
    passaggi: Record<Categoria, Quattro>;
  };
  esempi: Esempio[];
  griglia: {
    punti: number;
    passoKmMediano: number;
    passoKmP05: number;
    passoKmP95: number;
    agMax: number;
    sogliaAlti: number;
    /** I punti con ag oltre sogliaAlti, dal più alto: [lon, lat, ag]. */
    piuAlti: [number, number, number][];
    blocco: {
      box: { minlat: number; maxlat: number; minlon: number; maxlon: number };
      luogo: string;
      /** Righe (da nord a sud) e colonne (da ovest a est) del blocco: i punti sono in quest'ordine. */
      righe: number;
      colonne: number;
      legenda: string[];
      punti: [number, number, number, number, number][];
    };
  };
};

const somma = (xs: number[]) => xs.reduce((a, b) => a + b, 0);
/** Percentuale con un decimale, come numero (34,7 → 34.7): nel testo si scrive con dec(). */
const pct1 = (parte: number, tutto: number) => Math.round((parte / tutto) * 1000) / 10;
/** Percentuale intera. */
const pct0 = (parte: number, tutto: number) => Math.round((parte / tutto) * 100);

export const ZONE: Zona[] = [1, 2, 3, 4];

/* ---------- Le soglie di legge (non sono dati: OPCM 3519/2006, Allegato 1A) ---------- */

/**
 * Accelerazione orizzontale massima su roccia (ag, in g) con il 10% di probabilità di essere superata in 50 anni:
 * l'intervallo di ogni zona e il valore «di ancoraggio» che le norme del 2003 usavano per tutta la zona.
 */
export const SOGLIE: Record<Zona, { da: number; a: number; ancoraggio: number }> = {
  1: { da: 0.25, a: 0.35, ancoraggio: 0.35 },
  2: { da: 0.15, a: 0.25, ancoraggio: 0.25 },
  3: { da: 0.05, a: 0.15, ancoraggio: 0.15 },
  4: { da: 0, a: 0.05, ancoraggio: 0.05 },
};

/**
 * Punti della griglia delle Norme Tecniche (DM 14 gennaio 2008, Allegato B, tabella 1; le NTC 2018, § 3.2, la usano
 * ancora). Non è un dato scaricato: lo riporta la Regione Toscana, «Azioni sismiche per la progettazione».
 */
export const PUNTI_NTC = 10751;

/* ---------- Oggi (DPC, maggio 2025; ISTAT, 1° gennaio 2025) ---------- */

export const oggi = zoneData.oggi;
/** Comuni nell'elenco DPC (7.896). */
export const comuniOggi = oggi.comuni;
/** Comuni per zona principale: [zona 1, zona 2, zona 3, zona 4]. */
export const comuniZona = oggi.zone;
/** Quota di comuni per zona (%, un decimale). */
export const quotaComuni = oggi.zone.map((v) => pct1(v, oggi.comuni)) as Quattro;

/** Abitanti al 1° gennaio 2025 in tutti i comuni dell'elenco. */
export const popTotale = oggi.popTotale;
/** Abitanti per zona, contando solo i comuni con un'unica zona. */
export const popZona = oggi.pop;
/** Quota di abitanti per zona (%, un decimale). */
export const quotaPop = oggi.pop.map((v) => pct1(v, oggi.popTotale)) as Quattro;

/** I comuni divisi tra zone con numeri diversi (Roma, Vejano, Pescorocchiano). */
export const divisi = oggi.divisi;
export const popDivisi = somma(divisi.map((d) => d.pop));
export const quotaPopDivisi = pct1(popDivisi, popTotale);
export const roma = divisi.find((d) => d.comune === 'Roma')!;
export const quotaRoma = pct1(roma.pop, popTotale);

/** Zone 1 e 2 insieme, senza i comuni divisi: abitanti e quota (%). */
export const popZone12 = popZona[0] + popZona[1];
export const quotaPopZone12 = pct1(popZone12, popTotale);
/** Zone 3 e 4 insieme, abitanti senza i comuni divisi. */
export const popZone34 = popZona[2] + popZona[3];
/** Zone 1 e 2 insieme, contando anche i comuni divisi che hanno almeno una parte in zona 1 o 2 (Roma compresa). */
export const quotaPopZone12ConDivisi = pct1(popZone12 + somma(divisi.filter((d) => d.zona <= 2).map((d) => d.pop)), popTotale);
/** Zone 3 e 4 insieme, senza i comuni divisi. */
export const quotaPopZone34 = pct1(popZona[2] + popZona[3], popTotale);

/** Codici diversi usati nell'elenco (1, 2A, 3S, 2A-3A-3B…). */
export const codiciDiversi = Object.keys(oggi.codici).length;
/** Comuni con un codice che non è un numero semplice (sottozone, «3S», comuni divisi). */
export const comuniCodiceSpeciale = somma(Object.entries(oggi.codici).filter(([k]) => !/^[1-4]$/.test(k)).map(([, v]) => v));
/** Comuni con sottozone dello stesso numero (es. Rieti, 2A-2B). */
export const sottozoneStessaZona = oggi.sottozoneStessaZona;

/* ---------- Per regione ---------- */

export const regioni = zoneData.regioni;
/** Regioni e Province autonome, ognuna con il suo atto (21). */
export const nEnti = regioni.length;
export const regione = (nome: string) => regioni.find((r) => r.nome === nome)!;
const perData = [...regioni].sort((a, b) => a.atto.data.localeCompare(b.atto.data));
/** L'atto in vigore più vecchio e il più recente. */
export const attoPiuVecchio = perData[0];
export const attoPiuRecente = perData[perData.length - 1];
/** Regioni (e Province autonome) senza comuni in zona 4, e senza comuni in zona 1. */
export const senzaZona4 = regioni.filter((r) => r.zone[3] === 0).map((r) => r.nome);
export const senzaZona1 = regioni.filter((r) => r.zone[0] === 0).map((r) => r.nome);
/** Regioni con un'unica zona (es. Sardegna: tutta zona 4). */
export const unaSolaZona = regioni.filter((r) => r.zone.filter((v) => v > 0).length === 1).map((r) => ({ nome: r.nome, zona: (r.zone.findIndex((v) => v > 0) + 1) as Zona }));
export const sardegna = regione('Sardegna');
export const calabria = regione('Calabria');
export const piemonte = regione('Piemonte');
export const basilicata = regione('Basilicata');
export const lazio = regione('Lazio');
/** Comuni del Piemonte in «zona 3S». */
export const piemonte3S = piemonte.codici['3S'] ?? 0;

/**
 * Gli elenchi approvati prima che la mappa MPS04 fosse pronta (aprile 2004: Meletti & Stucchi 2009) e ancora in vigore.
 * Sono Campania (2002), Calabria, Puglia e Sardegna (2004).
 */
export const MPS04_PRONTA = '2004-04-01';
export const primaDiMps04 = perData.filter((r) => r.atto.data < MPS04_PRONTA);
export const comuniPrimaDiMps04 = somma(primaDiMps04.map((r) => r.comuni));
export const quotaComuniPrimaDiMps04 = pct0(comuniPrimaDiMps04, comuniOggi);
const popRegione = (r: Regione) => somma(r.pop) + r.popDivisi;
export const popPrimaDiMps04 = somma(primaDiMps04.map(popRegione));
/** Gli stessi abitanti in milioni, con un decimale (12,9). */
export const milioniPrimaDiMps04 = Math.round(popPrimaDiMps04 / 1e5) / 10;
export const quotaPopPrimaDiMps04 = pct0(popPrimaDiMps04, popTotale);
/** Tra questi, gli enti in cui ogni comune ritrovato nell'Allegato A ha ancora la zona del 2003. */
export const ugualiAl2003 = primaDiMps04.filter((r) => r.confronto2003.trovati > 0 && r.confronto2003.uguali === r.confronto2003.trovati).map((r) => r.nome);

/* ---------- La storia (Allegato A dell'OPCM 3274/2003) ---------- */

export const storia = zoneData.storia;
const idx = (c: Categoria) => storia.categorie.indexOf(c);
/** Comuni nell'Allegato A (codici ISTAT del 2001). */
export const comuni2003 = storia.comuni;
/** Comuni nati dopo il 1984, senza categoria precedente. */
export const nuoviSenzaCategoria = storia.nuoviSenzaCategoria;
/** Classificazione dei decreti fino al 1984: comuni in I, II, III categoria e non classificati. */
export const cat1984 = { I: storia.cat1984[idx('I')], II: storia.cat1984[idx('II')], III: storia.cat1984[idx('III')], NC: storia.cat1984[idx('N.C.')] };
export const classificati1984 = cat1984.I + cat1984.II + cat1984.III;
export const quotaClassificati1984 = pct0(classificati1984, comuni2003);
/** La proposta del gruppo di lavoro del 1998 (mai adottata). */
export const proposta1998 = { I: storia.proposta1998[idx('I')], II: storia.proposta1998[idx('II')], III: storia.proposta1998[idx('III')], NC: storia.proposta1998[idx('N.C.')] };
/** Zone del 2003, prima delle modifiche delle Regioni: [zona 1, 2, 3, 4]. */
export const zone2003 = storia.zone2003;
/** Dove sono finiti nel 2003 i comuni non classificati: [zona 1, 2, 3, 4]. */
export const daNonClassificati = storia.passaggi['N.C.'];
/** Comuni passati dalla II categoria alla zona 1. */
export const daIIaZona1 = storia.passaggi.II[0];
/** Nessun comune è sceso di livello nel 2003 (categoria I → zona 1 o più, II → zona 2 o più, III → zona 3 o più). */
export const nessunoDeclassato = (['I', 'II', 'III'] as const).every((c, k) => storia.passaggi[c].slice(k + 1).every((v) => v === 0));

/* ---------- I comuni d'esempio ---------- */

export const esempio = (nome: string) => zoneData.esempi.find((e) => e.comune === nome)!;
export const sanGiuliano = esempio('San Giuliano di Puglia');
export const aquila = esempio("L'Aquila");
export const mirandola = esempio('Mirandola');
export const romaStoria = esempio('Roma');
export const cagliari = esempio('Cagliari');

/* ---------- La griglia MPS04 ---------- */

export const griglia = zoneData.griglia;
/** Punti della griglia (in mare compresi). */
export const puntiGriglia = griglia.punti;
/** Distanza tipica tra punti vicini (km, un decimale): nostro calcolo. */
export const passoGrigliaKm = Math.round(griglia.passoKmMediano * 10) / 10;
/** Il valore più alto di ag della mappa (g, due decimali). */
export const agMaxMps04 = Math.round(griglia.agMax * 100) / 100;
/** La soglia dei valori più alti (0,275 g) e i punti che la superano, divisi tra Calabria e Sicilia (sopra o sotto 38,5° N). */
export const sogliaAlti = griglia.sogliaAlti;
export const piuAlti = griglia.piuAlti;
export const altiCalabria = piuAlti.filter((p) => p[1] > 38.5);
export const altiSicilia = piuAlti.filter((p) => p[1] <= 38.5);
/** Il punto con il valore più alto: [lon, lat, ag]. */
export const puntoMax = piuAlti[0];
/** Il blocco di punti veri per il disegno: [lon, lat, ag, 16° percentile, 84° percentile]. */
export const bloccoGriglia = griglia.blocco.punti;
export const bloccoAgMin = Math.min(...bloccoGriglia.map((p) => p[2]));
export const bloccoAgMax = Math.max(...bloccoGriglia.map((p) => p[2]));
export const bloccoRighe = griglia.blocco.righe;
export const bloccoColonne = griglia.blocco.colonne;
/**
 * Gli indici dei quattro punti di una maglia della griglia, scelta al centro del blocco (righe 3 e 4, colonne 2 e 3,
 * contando da 1): nel disegno l'edificio sta lì. In ordine: nord-ovest, nord-est, sud-ovest, sud-est.
 */
const rigaMaglia = Math.floor((bloccoRighe - 1) / 2);
const colMaglia = Math.floor((bloccoColonne - 1) / 2);
export const magliaIndici = [0, 1, bloccoColonne, bloccoColonne + 1].map((d) => rigaMaglia * bloccoColonne + colMaglia + d);
/** Valori di ag dei quattro punti della maglia (g). */
export const magliaAg = magliaIndici.map((i) => bloccoGriglia[i][2]);

/* ---------- Per scrivere ---------- */

/** «A, B e C». */
export const elenco = (xs: string[]) => (xs.length < 2 ? xs.join('') : `${xs.slice(0, -1).join(', ')} e ${xs[xs.length - 1]}`);
/** «zona 2», «zone 1 e 2». */
export const ZONA_NOME: Record<Zona, string> = { 1: 'zona 1', 2: 'zona 2', 3: 'zona 3', 4: 'zona 4' };
/** Accelerazione in g con due decimali, anche quando l'ultima cifra è zero (0,20 e non 0,2): passa da dec(). */
export const g2 = (v: number) => {
  const s = dec(Number(v.toFixed(2)));
  return /,\d$/.test(s) ? `${s}0` : s.includes(',') ? s : `${s},00`;
};
const dataLunga = new Intl.DateTimeFormat('it-IT', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
/** «Delibera della Giunta regionale n. 425 del 15 luglio 2024». */
export const atto = (r: Regione) => `${r.atto.tipo} n. ${r.atto.numero} del ${dataLunga.format(new Date(`${r.atto.data}T00:00:00Z`))}`;
export const annoAtto = (r: Regione) => Number(r.atto.data.slice(0, 4));
