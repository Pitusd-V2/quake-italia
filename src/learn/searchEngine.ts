/**
 * Il motore della ricerca di «Capire»: solo funzioni, senza dati e senza import, così lo usano sia il sito sia il
 * build (plugins/articoli.ts) sia i test.
 *
 * Come cerca:
 *  - le parole vengono «ridotte» (niente accenti, niente finale: «previsioni» e «previsione» sono la stessa parola);
 *  - le parole di tutti i giorni portano a quelle della scienza («assestamento» trova «repliche»): vedi SINONIMI;
 *  - conta dove sta la parola: nel titolo vale più che nel testo;
 *  - prima i risultati che contengono tutte le parole cercate, poi quelli che ne contengono solo alcune.
 */

/** Minuscole, senza accenti, solo lettere e numeri separati da spazi. */
export const fold = (s: string) =>
  s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

/** Parole che non aiutano a trovare niente. */
const STOP = new Set(
  (
    'il lo la gli le un uno una di da in con su per tra fra ed ma che chi cui non piu come dove quando perche cosa cose quale quali ' +
    'quanto quanti quanta del dello della dei degli delle al allo alla ai agli alle dal dallo dalla dai dagli dalle nel nello nella nei ' +
    'negli nelle sul sullo sulla sui sugli sulle sono era si ci mi ti vi se anche ce ne ha ho hanno questo questa questi queste quello ' +
    'quella puo possono fa fare essere stato sta'
  ).split(' '),
);

/**
 * «previsioni» → «prevision», «sismiche» → «sismic», «questionario» e «questionari» → «questionar»:
 * toglie la vocale finale, poi la «i» rimasta (-io, -ia, -ie) e la «h» di -che, -ghi.
 */
export function stem(word: string): string {
  if (word.length <= 3 || /\d/.test(word)) return word;
  let s = word.replace(/[aeiou]$/, '');
  if (s.length > 4 && s.endsWith('i')) s = s.slice(0, -1);
  if (/[cg]h$/.test(s)) s = s.slice(0, -1);
  return s;
}

/** Le parole di un testo, ridotte. Le lettere isolate («l’Aquila» → «l», «aquila») si scartano, i numeri no. */
export function stems(text: string, keepStop = false): string[] {
  const out: string[] = [];
  for (const w of fold(text).split(' ')) {
    if (!w || (w.length === 1 && !/\d/.test(w))) continue;
    if (!keepStop && STOP.has(w)) continue;
    out.push(stem(w));
  }
  return out;
}

/** La «chiave» di un termine: serve a riconoscere «Replica» e «Repliche», «Effetto di sito» ed «Effetti di sito». */
export const termKey = (term: string) => stems(term).join(' ');

/**
 * Quale voce di un glossario spiega la parola `word` scritta nel testo? Devono coincidere, a parte singolare e
 * plurale; la sigla tra parentesi conta da sola («Md» trova «Magnitudo durata (Md)», e anche «magnitudo durata»).
 * Niente somiglianze vaghe: «magnitudo» non deve aprire la spiegazione di «Magnitudo momento». -1 se non c'è.
 */
export function matchTerm(word: string, terms: string[]): number {
  const key = termKey(word);
  if (!key) return -1;
  return terms.findIndex((t) => {
    const inside = [...t.matchAll(/\(([^)]*)\)/g)].map((m) => m[1]);
    const plain = t.replace(/\s*\([^)]*\)/g, '');
    return [t, plain, ...inside].some((x) => termKey(x) === key);
  });
}

/**
 * Dalle parole di tutti i giorni a quelle usate negli articoli. Poche e scelte: ogni voce nasce da una ricerca vera
 * che non trovava niente. Si scrivono come si parla: la riduzione la fa il codice.
 */
export const SINONIMI: Record<string, string[]> = {
  assestamento: ['repliche', 'sequenza'],
  assestamenti: ['repliche', 'sequenza'],
  maremoto: ['tsunami'],
  capogiri: ['vertigini'],
  giramenti: ['vertigini'],
  richter: ['magnitudo'],
  mercalli: ['intensità'],
  sisma: ['terremoto'],
  prevedere: ['previsione'],
  previsione: ['prevedere'],
  predire: ['previsione', 'prevedere'],
  allarme: ['allerta'],
  crollo: ['crolli', 'danni'],
  tremare: ['trema', 'scuotimento'],
  paura: ['ansia', 'spavento', 'timore'],
  panico: ['ansia', 'spavento', 'paura'],
  spavento: ['ansia', 'paura'],
};

const SYN = new Map(Object.entries(SINONIMI).map(([k, v]) => [stem(fold(k)), v.flatMap((x) => stems(x))]));

/* ---------- Indice ---------- */

export interface SearchField {
  text: string;
  /** Quanto vale trovare la parola qui (titolo 10, testo 1). */
  weight: number;
  /** Per il testo lungo: il titolo del paragrafo, mostrato nel risultato. */
  label?: string;
  /** Da questo campo si può mostrare la frase trovata. */
  snippet?: boolean;
}

export interface SearchEntry<T = unknown> {
  /** Cosa restituire quando viene trovata (articolo, parola del glossario, pagina…). */
  item: T;
  fields: SearchField[];
  /** Nomi che, cercati per intero, portano questa voce in cima (le parole del glossario: «faglia normale»). */
  exact?: string[];
}

interface Indexed<T> {
  entry: SearchEntry<T>;
  /** Parola ridotta → il campo dove vale di più. */
  words: Map<string, { weight: number; field: number }>;
  exact: Set<string>;
}

/** Quanto vale in più una voce cercata con il suo nome intero. */
const EXACT_BONUS = 20;

export interface SearchIndex<T> {
  docs: Indexed<T>[];
}

export function buildIndex<T>(entries: SearchEntry<T>[]): SearchIndex<T> {
  return {
    docs: entries.map((entry) => {
      const words = new Map<string, { weight: number; field: number }>();
      entry.fields.forEach((f, field) => {
        for (const w of stems(f.text)) {
          const old = words.get(w);
          if (!old || f.weight > old.weight) words.set(w, { weight: f.weight, field });
        }
      });
      return { entry, words, exact: new Set((entry.exact ?? []).map(termKey).filter(Boolean)) };
    }),
  };
}

/* ---------- Ricerca ---------- */

export interface Segment {
  text: string;
  hit: boolean;
}

export interface SearchHit<T> {
  item: T;
  score: number;
  /** Quante delle parole cercate ci sono. */
  matched: number;
  /** Il titolo del paragrafo dove è stata trovata, se è nel testo. */
  label?: string;
  /** La frase trovata, a pezzi: quelli con `hit` sono le parole cercate. */
  snippet?: Segment[];
}

export interface SearchResult<T> {
  hits: SearchHit<T>[];
  /** Nessun risultato contiene tutte le parole: questi ne contengono solo alcune. */
  partial: boolean;
}

/** Le parole cercate, senza quelle che non aiutano («il», «come», «quanto»). Ognuna con i suoi sinonimi. */
function queryTerms(q: string): string[][] {
  return [...new Set(stems(q))].map((w) => [w, ...(SYN.get(w) ?? [])]);
}

/**
 * La parola `word` risponde a `wanted`? Uguale, oppure inizia così: serve a trovare mentre si scrive («terrem») e i
 * derivati. Con meno di 4 lettere solo se è uguale: «dur» non deve trovare «durante».
 */
const answers = (word: string, wanted: string) => word === wanted || (wanted.length >= 4 && word.startsWith(wanted));

const WORD = /([\p{L}\p{N}]+)/u;

/** La prima frase di `text` che contiene una delle parole cercate, con quelle parole segnate. */
export function sentenceWith(text: string, wanted: string[]): Segment[] | undefined {
  const has = (s: string) => stems(s, true).some((w) => wanted.some((x) => answers(w, x)));
  const found = text.split(/(?<=[.!?])\s+(?=[\p{Lu}«“"(])|\n+/u).find(has);
  if (!found) return undefined;
  const short = found.length > 220 ? `${found.slice(0, 217).replace(/\s+\S*$/, '')}…` : found;
  const out: Segment[] = [];
  for (const piece of short.split(WORD)) {
    if (!piece) continue;
    const hit = WORD.test(piece) && wanted.some((x) => answers(stem(fold(piece)), x));
    const last = out[out.length - 1];
    if (last && last.hit === hit) last.text += piece;
    else out.push({ text: piece, hit });
  }
  return out;
}

export function search<T>(index: SearchIndex<T>, q: string, limit = 30): SearchResult<T> {
  const terms = queryTerms(q);
  if (!terms.length) return { hits: [], partial: false };
  const whole = termKey(q);
  const hits: SearchHit<T>[] = [];
  for (const doc of index.docs) {
    let score = doc.exact.has(whole) ? EXACT_BONUS : 0;
    let matched = 0;
    let poorest: { weight: number; field: number } | undefined;
    for (const variants of terms) {
      let top: { weight: number; field: number } | undefined;
      for (const [word, where] of doc.words) {
        for (let i = 0; i < variants.length; i++) {
          if (!answers(word, variants[i])) continue;
          // Una parola uguale vale più di un inizio; la parola scritta più di un sinonimo.
          const weight = where.weight * (word === variants[i] ? 1 : 0.7) * (i === 0 ? 1 : 0.8);
          if (!top || weight > top.weight) top = { weight, field: where.field };
        }
      }
      if (!top) continue;
      matched++;
      score += top.weight;
      if (!poorest || top.weight < poorest.weight) poorest = top;
    }
    if (!matched || !poorest) continue;
    const hit: SearchHit<T> = { item: doc.entry.item, score, matched };
    // Se una delle parole c'è solo nel testo lungo, mostriamo la frase: è lì che chi cerca vuole arrivare.
    const field = doc.entry.fields[poorest.field];
    if (field.snippet) {
      hit.label = field.label;
      hit.snippet = sentenceWith(field.text, terms.flat());
    }
    hits.push(hit);
  }
  const all = hits.filter((h) => h.matched === terms.length);
  const list = all.length ? all : hits;
  list.sort((a, b) => b.matched - a.matched || b.score - a.score);
  return { hits: list.slice(0, limit), partial: !all.length && hits.length > 0 };
}
