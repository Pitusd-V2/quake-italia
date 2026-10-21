/**
 * Zone rossa e gialla dei piani nazionali di protezione civile per il Vesuvio e i Campi Flegrei.
 * Elenchi del Dipartimento della Protezione Civile (Vesuvio: direttive 14/02/2014 e 16/11/2015;
 * Campi Flegrei: DPCM 24/06/2016). Diversi comuni sono inclusi solo in parte: lì diciamo «in parte»
 * e rimandiamo alla mappa ufficiale, perché conosciamo il comune ma non l'indirizzo.
 */
import { norm } from './seismicZones';

export type Volcano = 'vesuvio' | 'campi-flegrei';
export type VolcanoZoneColor = 'rossa' | 'gialla';

export interface VolcanoZone {
  volcano: Volcano;
  zone: VolcanoZoneColor;
  /** Solo una parte del territorio comunale è nella zona. */
  partial: boolean;
  /** Quali parti, quando l'elenco ufficiale lo dice. */
  parts?: string;
  /** Regione gemellata che accoglierebbe gli abitanti in caso di evacuazione (solo Vesuvio, zona rossa). */
  twin?: string;
}

export const VOLCANO_NAME: Record<Volcano, string> = { vesuvio: 'Vesuvio', 'campi-flegrei': 'Campi Flegrei' };

export const VOLCANO_LINKS: Record<Volcano, { plan: string; advice: string }> = {
  vesuvio: {
    plan: 'https://www.protezionecivile.gov.it/it/approfondimento/aggiornamento-del-piano-nazionale-di-protezione-civile-il-vesuvio/',
    advice: 'https://iononrischio.protezionecivile.gov.it/it/preparati/vulcani/vesuvio/cosa-sapere/',
  },
  'campi-flegrei': {
    plan: 'https://rischi.protezionecivile.gov.it/it/vulcanico/vulcani-italia/campi-flegrei/la-pianificazione-nazionale-di-emergenza-il-rischio-vulcanico-i-campi-flegrei/',
    advice: 'https://iononrischio.protezionecivile.gov.it/it/preparati/vulcani/campi-flegrei/cosa-sapere/',
  },
};

type Row = [comune: string, sigla: string, zone: Omit<VolcanoZone, 'volcano'>];

const VESUVIO: Row[] = [
  // Zona rossa: comuni interi, con la Regione gemellata.
  ['Boscoreale', 'NA', { zone: 'rossa', partial: false, twin: 'Calabria' }],
  ['Boscotrecase', 'NA', { zone: 'rossa', partial: false, twin: 'Basilicata' }],
  ['Cercola', 'NA', { zone: 'rossa', partial: false, twin: 'Liguria' }],
  ['Ercolano', 'NA', { zone: 'rossa', partial: false, twin: 'Emilia-Romagna' }],
  ['Massa di Somma', 'NA', { zone: 'rossa', partial: false, twin: 'Molise' }],
  ['Ottaviano', 'NA', { zone: 'rossa', partial: false, twin: 'Lazio' }],
  ['Palma Campania', 'NA', { zone: 'rossa', partial: false, twin: 'Friuli-Venezia Giulia' }],
  ['Poggiomarino', 'NA', { zone: 'rossa', partial: false, twin: 'Marche' }],
  ['Pollena Trocchia', 'NA', { zone: 'rossa', partial: false, twin: 'Trentino-Alto Adige' }],
  ['Pompei', 'NA', { zone: 'rossa', partial: false, twin: 'Sardegna' }],
  ['Portici', 'NA', { zone: 'rossa', partial: false, twin: 'Piemonte' }],
  ['San Gennaro Vesuviano', 'NA', { zone: 'rossa', partial: false, twin: 'Umbria' }],
  ['San Giorgio a Cremano', 'NA', { zone: 'rossa', partial: false, twin: 'Toscana' }],
  ['San Giuseppe Vesuviano', 'NA', { zone: 'rossa', partial: false, twin: 'Veneto' }],
  ['San Sebastiano al Vesuvio', 'NA', { zone: 'rossa', partial: false, twin: 'Puglia' }],
  ["Sant'Anastasia", 'NA', { zone: 'rossa', partial: false, twin: 'Veneto' }],
  ['Scafati', 'SA', { zone: 'rossa', partial: false, twin: 'Sicilia' }],
  ['Somma Vesuviana', 'NA', { zone: 'rossa', partial: false, twin: 'Lombardia' }],
  ['Terzigno', 'NA', { zone: 'rossa', partial: false, twin: 'Abruzzo' }],
  ['Torre Annunziata', 'NA', { zone: 'rossa', partial: false, twin: 'Puglia' }],
  ['Torre del Greco', 'NA', { zone: 'rossa', partial: false, twin: 'Lombardia' }],
  ['Trecase', 'NA', { zone: 'rossa', partial: false, twin: 'Sicilia' }],
  // Zona rossa solo in parte.
  ['Napoli', 'NA', { zone: 'rossa', partial: true, parts: 'le circoscrizioni di Barra, Ponticelli e San Giovanni a Teduccio', twin: 'Lazio' }],
  ['Nola', 'NA', { zone: 'rossa', partial: true, twin: 'Valle d’Aosta' }],
  ["Pomigliano d'Arco", 'NA', { zone: 'rossa', partial: true, parts: 'l’enclave nel territorio di Sant’Anastasia', twin: 'Veneto' }],
  // Zona gialla (63 comuni e tre circoscrizioni di Napoli).
  ...(
    [
      ['NA', 'Agerola, Brusciano, Camposano, Carbonara di Nola, Casalnuovo di Napoli, Casamarciano, Casola di Napoli, Castellammare di Stabia, Castello di Cisterna, Cimitile, Comiziano, Gragnano, Lettere, Liveri, Mariglianella, Marigliano, Meta, Nola, Pimonte, Pomigliano d\'Arco, San Paolo Bel Sito, San Vitaliano, Santa Maria la Carità, Sant\'Antonio Abate, Saviano, Scisciano, Striano, Tufino, Vico Equense, Visciano, Volla'],
      ['SA', 'Angri, Bracigliano, Castel San Giorgio, Cava de\' Tirreni, Corbara, Mercato San Severino, Nocera Inferiore, Nocera Superiore, Pagani, Positano, Ravello, Roccapiemonte, San Marzano sul Sarno, San Valentino Torio, Sant\'Egidio del Monte Albino, Sarno, Scala, Siano, Tramonti'],
      ['AV', 'Avella, Baiano, Domicella, Forino, Lauro, Marzano di Nola, Monteforte Irpino, Moschiano, Mugnano del Cardinale, Pago del Vallo di Lauro, Quindici, Sperone, Taurano'],
    ] as const
  ).flatMap(([sigla, list]) =>
    list.split(', ').map((c): Row => {
      // Nola e Pomigliano sono in parte in zona rossa: il resto del territorio è in zona gialla.
      const partial = c === 'Nola' || c === "Pomigliano d'Arco";
      return [c, sigla, { zone: 'gialla', partial }];
    }),
  ),
  ['Napoli', 'NA', { zone: 'gialla', partial: true, parts: 'le circoscrizioni di Barra, Ponticelli e San Giovanni a Teduccio' }],
];

const CF_NAPOLI_ROSSA =
  'i quartieri di Soccavo, Pianura, Bagnoli e Fuorigrotta e parte di San Ferdinando, Posillipo, Chiaia, Arenella, Vomero, Chiaiano e Montecalvario';
const CF_NAPOLI_GIALLA =
  '24 quartieri: Arenella, Avvocata, Barra, Chiaia, Chiaiano, Mercato, Miano, Montecalvario, Pendino, Piscinola, Poggioreale, Porto, San Carlo all’Arena, San Ferdinando, San Giovanni a Teduccio, San Giuseppe, San Lorenzo, San Pietro a Patierno, Scampia, Secondigliano, Stella, Vicaria, Vomero e Zona Industriale';

const CAMPI_FLEGREI: Row[] = [
  ['Pozzuoli', 'NA', { zone: 'rossa', partial: false }],
  ['Bacoli', 'NA', { zone: 'rossa', partial: false }],
  ['Monte di Procida', 'NA', { zone: 'rossa', partial: false }],
  ['Quarto', 'NA', { zone: 'rossa', partial: false }],
  ['Giugliano in Campania', 'NA', { zone: 'rossa', partial: true }],
  ['Marano di Napoli', 'NA', { zone: 'rossa', partial: true }],
  ['Napoli', 'NA', { zone: 'rossa', partial: true, parts: CF_NAPOLI_ROSSA }],
  ['Villaricca', 'NA', { zone: 'gialla', partial: false }],
  ['Calvizzano', 'NA', { zone: 'gialla', partial: false }],
  ['Marano di Napoli', 'NA', { zone: 'gialla', partial: true }],
  ['Mugnano di Napoli', 'NA', { zone: 'gialla', partial: false }],
  ['Melito di Napoli', 'NA', { zone: 'gialla', partial: false }],
  ['Casavatore', 'NA', { zone: 'gialla', partial: false }],
  ['Napoli', 'NA', { zone: 'gialla', partial: true, parts: CF_NAPOLI_GIALLA }],
];

const key = (comune: string, sigla: string) => `${norm(comune)}|${sigla}`;

const INDEX = new Map<string, VolcanoZone[]>();
for (const [volcano, rows] of [['vesuvio', VESUVIO], ['campi-flegrei', CAMPI_FLEGREI]] as const) {
  for (const [comune, sigla, z] of rows) {
    const k = key(comune, sigla);
    INDEX.set(k, [...(INDEX.get(k) ?? []), { volcano, ...z }]);
  }
}

/** Le zone vulcaniche di un comune (vuoto per quasi tutta Italia). Prima le rosse. */
export function volcanoZonesFor(comune: string, sigla: string): VolcanoZone[] {
  return [...(INDEX.get(key(comune, sigla)) ?? [])].sort((a, b) => (a.zone === b.zone ? 0 : a.zone === 'rossa' ? -1 : 1));
}

/** Tutti i comuni in elenco, per i test. */
export const ALL_VOLCANO_COMUNI: [string, string][] = [...VESUVIO, ...CAMPI_FLEGREI].map(([c, s]) => [c, s]);
