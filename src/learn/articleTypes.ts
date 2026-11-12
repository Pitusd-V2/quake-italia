/** Com'è fatto un articolo di «Capire» (i dati in cima ai file contenuti/articoli/*.mdx). Solo tipi. */

export interface Fonte {
  testo: string;
  url?: string;
}

export interface Revisione {
  nome: string;
  ruolo: string;
  data: string;
}

export interface ArticleData {
  slug: string;
  titolo: string;
  sottotitolo: string;
  /** La domanda che le persone si fanno davvero e a cui l'articolo risponde: è il suo «ingresso» negli elenchi. */
  domanda: string;
  percorso: string;
  ordine: number;
  minuti: number;
  /** Data (AAAA-MM-GG) dell'ultimo controllo a mano delle affermazioni sulle fonti. */
  verificato: string;
  /** Solo se un esperto esterno ha davvero rivisto l'articolo. */
  revisione?: Revisione;
  correlati: string[];
  paroleChiave: string[];
  riassuntoTitolo?: string;
  riassunto: string[];
  glossario: { termine: string; definizione: string }[];
  fonti: Fonte[];
  notaDati?: string;
}

/** Quello che sta nel pacchetto principale dell'app: solo il necessario per elenchi, ricerca e Google. */
export type ArticleCard = Pick<
  ArticleData,
  'slug' | 'titolo' | 'sottotitolo' | 'domanda' | 'percorso' | 'ordine' | 'minuti' | 'verificato' | 'revisione' | 'correlati' | 'paroleChiave'
> & {
  /** Le parti degli articoli «a strati», con i minuti di lettura di ognuna (calcolati al build). Vuoto per gli altri. */
  parti: Parte[];
};

export interface Parte {
  n: number;
  /** «La storia», «Cosa dicono i dati», «Per chi vuole andare a fondo». */
  kicker: string;
  titolo: string;
  minuti: number;
}

/** Un pezzo del testo di un articolo, per la ricerca: il titolo del paragrafo e le sue frasi. */
export interface Sezione {
  titolo: string | null;
  /** La parte dell'articolo «a strati» a cui appartiene (La storia, Cosa dicono i dati…). */
  parte: string | null;
  testo: string;
}

/** Il testo di un articolo, come lo vede la ricerca (creato al build, scaricato solo quando si cerca). */
export interface ArticleText {
  slug: string;
  riassunto: string[];
  sezioni: Sezione[];
}

/** Una parola del glossario generale: la stessa parola può essere spiegata in più articoli. */
export interface GlossaryEntry {
  /** Per l'indirizzo: /capire/glossario#faglia-normale */
  id: string;
  termine: string;
  voci: { slug: string; definizione: string }[];
}
