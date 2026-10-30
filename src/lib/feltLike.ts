/**
 * «Così si è sentita a casa tua»: l'intensità stimata, detta con le immagini delle scale di intensità.
 *
 * I paragoni non sono inventati: vengono dalle descrizioni ufficiali dei gradi della scala Mercalli modificata
 * (USGS: il grado III è «come il passaggio di un camion», e molti non capiscono che è un terremoto) e della scala
 * europea EMS-98 (Grünthal 1998: vetri e piatti che tintinnano, oggetti appesi che oscillano, chi si sveglia,
 * oggetti che cadono). Un pizzico di ironia solo dove la scossa non fa niente; dal grado V in su, solo chiarezza.
 */
import { impactAt, intensityAt } from './impact';
import type { LatLon, Quake } from './types';

export interface FeltLike {
  /** Grado arrotondato, da 1 a 6 (6 = «VI o più»). */
  degree: 1 | 2 | 3 | 4 | 5 | 6;
  roman: string;
  title: string;
  text: string;
  /** Ampiezza dell'oscillazione del lampadario disegnato, in gradi. */
  swingDeg: number;
}

const LEVELS: Record<FeltLike['degree'], Omit<FeltLike, 'degree'>> = {
  1: {
    roman: 'I',
    title: 'Qui non si è sentita',
    text: 'L’hanno registrata solo gli strumenti. Neanche il lampadario se n’è accorto.',
    swingDeg: 0,
  },
  2: {
    roman: 'II',
    title: 'Quasi impercettibile',
    text: 'Al massimo l’ha sentita qualcuno fermo o sdraiato, soprattutto ai piani alti. Se stavi camminando o guardando la TV, è normale non essersene accorti.',
    swingDeg: 1.5,
  },
  3: {
    roman: 'III',
    title: 'Leggera',
    text: 'Un tremolio leggero, come il passaggio di un camion in strada. Tanti non capiscono nemmeno che è un terremoto.',
    swingDeg: 4,
  },
  4: {
    roman: 'IV',
    title: 'Si è sentita bene',
    text: 'In casa se ne accorgono in molti: tintinnano vetri, porte e piatti e il lampadario oscilla. Qualcuno si sveglia, ma di solito non fa paura.',
    swingDeg: 8,
  },
  5: {
    roman: 'V',
    title: 'Forte',
    text: 'La sentono quasi tutti e molti si svegliano. I lampadari oscillano parecchio, i bicchieri sbattono tra loro e qualche oggetto in alto può cadere. È normale spaventarsi.',
    swingDeg: 14,
  },
  6: {
    roman: 'VI o più',
    title: 'Molto forte',
    text: 'Molte persone si spaventano ed escono di casa. Cadono piccoli oggetti e negli edifici possono comparire crepe sottili nell’intonaco.',
    swingDeg: 22,
  },
};

/**
 * Il grado segue l'intensità stimata, ma non contraddice mai il livello d'effetto usato nel resto del sito:
 * una scossa «non avvertibile» resta al massimo II, e senza possibili danni non si arriva al VI.
 */
export function feltLike(q: Quake, at: LatLon): FeltLike {
  const i = intensityAt(q, at);
  const impact = impactAt(q, at);
  let degree = Math.min(6, Math.max(1, Math.round(i))) as FeltLike['degree'];
  if (impact === 'none') degree = Math.min(degree, 2) as FeltLike['degree'];
  else if (impact !== 'damage') degree = Math.min(degree, 5) as FeltLike['degree'];
  return { degree, ...LEVELS[degree] };
}
