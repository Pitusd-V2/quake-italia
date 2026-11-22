/**
 * Numeri dell'articolo «Casa antisismica: cosa vuol dire davvero».
 * I dati vengono da src/data/learn/antisismica.json (scripts/build-antisismica-data.mjs): ISTAT, censimento 2011, e
 * OPCM 3274/2003, Allegato A. Quote, unione dei due elenchi e periodi di ritorno sono nostri calcoli.
 * In `pubblicati` ci sono i numeri copiati da norme e studi, ognuno con la sua fonte.
 */
import data from '../../data/learn/antisismica.json';
import { n } from './format';

export type StatoId = 'SLO' | 'SLD' | 'SLV' | 'SLC';
export type Materiale = 'muratura' | 'ca' | 'altro';

/** Un gruppo di comuni: quanti sono, quanti edifici hanno e come si dividono per epoca (9 classi del censimento). */
export interface Gruppo {
  comuni: number;
  edifici: number;
  epoche: number[];
}

export const antisismicaData = data as unknown as {
  titolo: string;
  scaricato: string;
  fonti: {
    istat: { nome: string; url: string; licenza: string; file: string; filtro: Record<string, string> };
    opcm3274: { nome: string; url: string };
  };
  richieste: string[];
  impronteSha256: Record<string, string>;
  epoche: { id: string; nome: string }[];
  italia: Record<Materiale | 'tutti', number[]> & { totale: number; totaliMateriale: Record<Materiale, number> };
  unione: {
    comuniAllegato: number;
    comuniIstat: number;
    uniti: number;
    passi: Record<string, number>;
    edificiUniti: number;
    edificiTotali: number;
    nonUnitiAllegato: string[];
    nonUnitiIstat: string[];
    edificiNonUniti: number;
  };
  gruppi: Record<'nonClassificati' | 'nonClassificatiSenzaCampania' | 'classificati' | 'senzaCategoria', Gruppo>;
  passaggi: Record<string, Gruppo>;
  mirandola: { codice: string; nome: string; cat1984: string; zona2003: number; totale: number; epoche: number[] };
  statiLimite: { id: StatoId; nome: string; pvr: number }[];
  periodiRitorno: { classe: 'II' | 'III' | 'IV'; cu: number; vr: number; tr: Record<StatoId, number> }[];
  pubblicati: Pubblicati;
};

/** I numeri copiati da norme e studi: i valori e la fonte di ognuno stanno nel JSON. */
interface Pubblicati {
  ntc: {
    fonte: string;
    statiLimite: { fonte: string; pvr: Record<StatoId, number> };
    vitaNominaleAnni: { fonte: string; temporanee: number; ordinarie: number; elevate: number };
    coefficienteUso: { fonte: string; I: number; II: number; III: number; IV: number };
    fattoreComportamentoTelaioCa: { fonte: string; CDA: number; CDB: number };
    fattoreComportamentoPrefabbricati: { fonte: string; CDA: number; CDB: number };
    gammaRdMin: { fonte: string; valore: number };
    miglioramento: { fonte: string; classeII: number; scuoleEClasseIV: number };
    adeguamento: { fonte: string; casiABD: number; casiCE: number };
  };
  classificazione1984: { fonte: string; comuniClassificati: number; comuniTotali: number; quotaTerritorio: number; quotaPopolazione: number };
  dpcNonStrutturali: { fonte: string; quotaMorti: number };
  emilia: {
    ingv: {
      fonte: string;
      scossa20: { evento: number; mw: number };
      scossa29: { evento: number; mw: number };
    };
    paginaDpc: { fonte: string; url: string; vittime: number; magnitudo20: number; magnitudo29: number };
    rapportoDpc: {
      fonte: string;
      scossa20: { mwRcmt: number; ml: number; ora: string };
      scossa29: { mwRcmt: number; ml: number; ora: string };
      vittime20: number;
      vittime29: number;
      localita: number;
      comuni: number;
      province: number;
    };
    magliulo: {
      fonte: string;
      pgaMirandolaNS: number;
      pgaMirandolaEO: number;
      pgaRiferimentoRoccia475: number;
      attritoMisurato: [number, number];
      attritoCircolare1965: number;
      attritoCaltrans: [number, number];
      quotaPrefabbricatiEpicentro: number;
      quotaPrefabbricatiItalia: number;
      danniDirettiMiliardi: number;
      danniIndirettiMiliardi: number;
    };
    dl74: { fonte: string; verificaMesi: number; sogliaSicurezza: number };
  };
  rintc: {
    fonte: string;
    pga475Roccia: Record<'Milano' | 'Caltanissetta' | 'Roma' | 'Napoli' | 'LAquila', number>;
    tassoCollassoAquilaC: [number, number];
    tassoDannoAquilaC: [number, number];
    tassoCollassoNapoliC: [number, number];
    tassoCollassoMuraturaRegolareAquilaC: [number, number];
    tassoCollassoMuraturaIrregolareAquilaCMax: number;
    tassoCollassoPrefabbricatiAquilaCMax: number;
    /** I tre prefabbricati diversi dal caso massimo: minimo e massimo. */
    tassoCollassoPrefabbricatiAquilaCAltri: [number, number];
    tassoCollassoIsolatiAquilaCMax: number;
    tassoCollassoIsolatiAquilaCMin: number;
  };
  rischioNazionale: {
    fonte: string;
    abitazioniCrollateAnno: number;
    abitazioniCrollate50Anni: number;
    abitazioniInagibiliAnno: number;
    senzatettoAnno: number;
    perditeMiliardiAnno: number;
    differenzaModelli: number;
  };
  norcia: {
    fonte: string;
    norcia: { agibili: number; parziali: number; inagibili: number };
    campiAlto: { unitaInagibili: number; unitaTotali: number; inagibili: number; parziali: number };
  };
}

/* ---------- Formati ---------- */

/** Una percentuale con un decimale: «74,1%». */
export const pct1 = (q: number) => `${(q * 100).toFixed(1).replace('.', ',')}%`;
/** Una percentuale intera: «74%». */
export const pct0 = (q: number) => `${Math.round(q * 100)}%`;

/* ---------- Gli edifici residenziali per epoca (ISTAT 2011) ---------- */

const somma = (xs: number[]) => xs.reduce((a, b) => a + b, 0);
const it = antisismicaData.italia;

/** Le 9 classi del censimento, dalla più vecchia. */
export const EPOCHE = antisismicaData.epoche;
/** Quante classi prendere dall'inizio per arrivare a una certa data. */
const FINO_1945 = 2;
const FINO_1970 = 4;
const FINO_1980 = 5;
const FINO_2000 = 7;

export const edificiTotali = it.totale;
export const edificiPerEpoca = it.tutti;
export const muraturaPerEpoca = it.muratura;
export const caPerEpoca = it.ca;
export const altroPerEpoca = it.altro;
export const totaliMateriale = it.totaliMateriale;
/** La classe più numerosa: dà la scala delle barre. */
export const epocaMassima = Math.max(...it.tutti);

/** Quota cumulata degli edifici costruiti fino alla fine di ogni classe. */
export const quotaCumulata = it.tutti.map((_, i) => somma(it.tutti.slice(0, i + 1)) / it.totale);

export const edificiPrima1919 = it.tutti[0];
export const quotaPrima1919 = edificiPrima1919 / it.totale;
export const edificiPrima1946 = somma(it.tutti.slice(0, FINO_1945));
export const quotaPrima1946 = edificiPrima1946 / it.totale;
export const edificiFino1970 = somma(it.tutti.slice(0, FINO_1970));
export const quotaFino1970 = edificiFino1970 / it.totale;
/** Costruiti fino al 1980: circa tre su quattro. */
export const edificiFino1980 = somma(it.tutti.slice(0, FINO_1980));
export const quotaFino1980 = edificiFino1980 / it.totale;
export const edificiFino2000 = somma(it.tutti.slice(0, FINO_2000));
export const quotaFino2000 = edificiFino2000 / it.totale;
export const edificiDal1991 = somma(it.tutti.slice(6));
export const quotaDal1991 = edificiDal1991 / it.totale;
/** La classe «2006 e dopo»: arriva al censimento (ottobre 2011) e comprende edifici progettati prima delle NTC 2008. */
export const edificiDal2006 = it.tutti[8];
export const quotaDal2006 = edificiDal2006 / it.totale;

export const quotaMuratura = it.totaliMateriale.muratura / it.totale;
export const quotaCa = it.totaliMateriale.ca / it.totale;
export const quotaAltro = it.totaliMateriale.altro / it.totale;

/* ---------- I comuni non classificati fino al 2003 (unione ISTAT e Allegato A) ---------- */

export const unione = antisismicaData.unione;
/** Quota degli edifici italiani che l'unione dei due elenchi non riesce ad assegnare (fusioni di comuni, comuni nuovi). */
export const quotaEdificiNonUniti = unione.edificiNonUniti / unione.edificiTotali;

/** Quota degli edifici di un gruppo costruiti prima del 2001 (classi fino a 1991–2000). */
export const quotaPrima2001 = (g: Gruppo) => somma(g.epoche.slice(0, FINO_2000)) / g.edifici;
/** Quota degli edifici di un gruppo costruiti prima del 1981. */
export const quotaPrima1981 = (g: Gruppo) => somma(g.epoche.slice(0, FINO_1980)) / g.edifici;

export const gruppi = antisismicaData.gruppi;
export const passaggi = antisismicaData.passaggi;
/** Comuni non classificati nei decreti fino al 1984, per la zona ricevuta nel 2003. */
export const ncZona2 = passaggi['N.C.→2'];
export const ncZona3 = passaggi['N.C.→3'];
export const ncZona4 = passaggi['N.C.→4'];
export const nonClassificati = gruppi.nonClassificati;
export const classificati = gruppi.classificati;
/** I comuni non classificati nell'Allegato A, compresi i 15 che non si ritrovano nel censimento (fusi dopo il 2001). */
export const comuniNcAllegato = nonClassificati.comuni + unione.nonUnitiAllegato.filter((c) => c.includes('(N.C.→')).length;
/** Senza la Campania, che aveva già un suo elenco regionale nel 2002: il risultato non cambia di fatto. */
export const differenzaSenzaCampania = Math.abs(quotaPrima2001(gruppi.nonClassificatiSenzaCampania) - quotaPrima2001(nonClassificati));

/** Mirandola, il comune del caso raccontato: non classificato fino al 2003, poi zona 3. */
export const mirandola = antisismicaData.mirandola;
export const mirandolaPrima2001 = somma(mirandola.epoche.slice(0, FINO_2000));
export const quotaMirandolaPrima2001 = mirandolaPrima2001 / mirandola.totale;

/* ---------- Stati limite e periodi di ritorno (NTC 2018) ---------- */

export const STATI = antisismicaData.statiLimite;
export const PERIODI = antisismicaData.periodiRitorno;
export const periodiCasa = PERIODI[0].tr;
export const periodiScuola = PERIODI[1].tr;
export const periodiStrategico = PERIODI[2].tr;

/** Formula [3.2.0] delle NTC 2018: il periodo di ritorno in anni. */
export const periodoRitorno = (vr: number, pvr: number) => -vr / Math.log(1 - pvr);
/**
 * La probabilità di almeno un superamento in un certo numero di anni, con terremoti distribuiti come un processo di
 * Poisson (l'ipotesi della Circolare 7/2019, §C2.4.3).
 */
export const probInAnni = (periodo: number, anni: number) => 1 - Math.exp(-anni / periodo);
/** Probabilità di superare in un anno la scossa di salvaguardia della vita di una casa: 1/475, circa lo 0,21%. */
export const probAnnuaSlv = 1 / periodiCasa.SLV;
/** La stessa scossa in un secolo: circa il 19%. Un conto nostro con la formula di Poisson. */
export const probSlvIn100Anni = probInAnni(periodiCasa.SLV, 100);
/** Da un tasso annuo (studi RINTC) alla probabilità in 50 anni. Un conto nostro. */
export const probDaTasso = (tasso: number, anni = 50) => 1 - Math.exp(-tasso * anni);

/* ---------- Numeri pubblicati (copiati dalla fonte indicata nel JSON) ---------- */

export const pubblicati = antisismicaData.pubblicati;
const mag = pubblicati.emilia.magliulo;
/** Mirandola, 20 maggio 2012: picco registrato (componente maggiore) rispetto al riferimento su roccia con il 10% in 50 anni. */
export const rapportoMirandola = mag.pgaMirandolaNS / mag.pgaRiferimentoRoccia475;
/** RINTC, L'Aquila, suolo C: il collasso calcolato, riportato a 50 anni (conto nostro, dal tasso annuo pubblicato). */
export const collassoAquila50 = pubblicati.rintc.tassoCollassoAquilaC.map((t) => probDaTasso(t)) as [number, number];
/** RINTC, L'Aquila, suolo C: la muratura nuova regolare, riportata a 50 anni (conto nostro, dal tasso annuo pubblicato). */
export const collassoMuraturaAquila50 = pubblicati.rintc.tassoCollassoMuraturaRegolareAquilaC.map((t) => probDaTasso(t)) as [number, number];
/** Vittime contate dal rapporto della Protezione Civile al 15 giugno 2012: non è il bilancio finale (28, pagina DPC). */
export const vittimeEmiliaDpc = pubblicati.emilia.rapportoDpc.vittime20 + pubblicati.emilia.rapportoDpc.vittime29;

/** Testo pronto: «9.028.831 edifici su 12.187.698». */
export const descrizioneFino1980 = `${n(edificiFino1980)} edifici su ${n(edificiTotali)}`;
