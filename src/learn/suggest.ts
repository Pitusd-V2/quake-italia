/**
 * Quale articolo di «Capire» aiuta a capire QUESTA scossa. Le persone arrivano sul sito per una scossa, non per
 * leggere: qui scegliamo due o tre domande che in quel momento è naturale farsi, e portano all'articolo giusto.
 *
 * Solo regole semplici e spiegabili, senza dati esterni. Se un articolo indicato non esiste (ancora), la regola non
 * mostra niente: un test controlla che i nomi qui sotto corrispondano ad articoli veri.
 */
import { volcanoNear } from '../lib/volcanoAreas';
import type { LatLon, Quake } from '../lib/types';

export interface QuakeContext extends LatLon {
  mag: number;
  depthKm: number;
  magType: string;
  /** La descrizione dell'INGV, per esempio «Campi Flegrei» o «4 km E Norcia (PG)». */
  place: string;
  /** Minuti passati dalla scossa. */
  ageMin: number;
  /** Fa parte di una sequenza: è abbastanza forte da averne una pagina, o è seguita da altre scosse vicine. */
  sequence: boolean;
  /** Quanto si è sentita a casa di chi guarda, se ha indicato il comune (le chiavi di feltHere in impact.ts). */
  feltAtHome?: 'damage' | 'strong' | 'felt' | 'weak' | 'few' | 'no';
}

/** I dati di una scossa come servono alle regole. */
export const contextOf = (q: Quake, now: Date, extra: Pick<QuakeContext, 'sequence' | 'feltAtHome'>): QuakeContext => ({
  lat: q.lat,
  lon: q.lon,
  mag: q.mag,
  depthKm: q.depthKm,
  magType: q.magType,
  place: q.place,
  ageMin: (now.getTime() - q.time.getTime()) / 60_000,
  ...extra,
});

/** Tutti gli articoli che le regole possono proporre (per il test). */
export const SUGGESTED = [
  'campi-flegrei',
  'terremoti-e-vulcani',
  'repliche-e-sequenze',
  'magnitudo-e-intensita',
  'effetti-di-sito',
  'come-si-trova-un-terremoto',
  'perche-la-magnitudo-cambia',
  'si-possono-prevedere',
  'tante-piccole-poche-grandi',
  'cos-e-un-terremoto',
  'le-zone-sismiche',
  'grandi-terremoti-della-storia',
] as const;

/** Al massimo tre articoli, dal più legato a questa scossa al più generale. */
export function slugsForQuake(q: QuakeContext): string[] {
  const out: string[] = [];
  const add = (slug: (typeof SUGGESTED)[number]) => {
    if (!out.includes(slug)) out.push(slug);
  };

  // 1. Dove: i vulcani hanno una storia tutta loro.
  const volcano = volcanoNear(q);
  if (/campi flegrei/i.test(q.place) || volcano?.name === 'Campi Flegrei') add('campi-flegrei');
  else if (volcano) add('terremoti-e-vulcani');

  // 2. Dopo una scossa che ne porta altre, la prima domanda è quanto durerà.
  if (q.sequence) add('repliche-e-sequenze');

  // 3. Si è sentita a casa: perché qui è arrivata così, e non come dice il numero.
  if (q.feltAtHome === 'damage' || q.feltAtHome === 'strong' || q.feltAtHome === 'felt') {
    add('magnitudo-e-intensita');
    add('effetti-di-sito');
  }

  // 4. Primi minuti e primi giorni: i numeri possono cambiare, e una magnitudo «Md» o «ML» non è quella che gira altrove.
  if (q.ageMin < 60) add('come-si-trova-un-terremoto');
  if (q.mag >= 3.5 && (q.ageMin < 24 * 60 || /^md$/i.test(q.magType))) add('perche-la-magnitudo-cambia');

  // 5. Dopo una scossa forte ci si chiede se si poteva sapere; per una microscossa, perché ce ne sono così tante.
  if (q.mag >= 4.5) add('si-possono-prevedere');
  if (q.mag < 2) add('tante-piccole-poche-grandi');

  // In ogni caso almeno due letture: le due più generali.
  for (const general of ['magnitudo-e-intensita', 'cos-e-un-terremoto'] as const) if (out.length < 2) add(general);
  return out.slice(0, 3);
}
