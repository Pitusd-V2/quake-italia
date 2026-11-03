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
  'slug' | 'titolo' | 'sottotitolo' | 'percorso' | 'ordine' | 'minuti' | 'verificato' | 'revisione' | 'correlati' | 'paroleChiave'
>;
