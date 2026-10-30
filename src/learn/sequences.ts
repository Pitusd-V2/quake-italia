/**
 * Sequenze da rivedere sulla mappa (sezione «Capire»). Poche, scelte una per una, ognuna per insegnare una cosa:
 * - Centro Italia 2016–17: le repliche, e una scossa più forte che arriva dopo, senza preavviso;
 * - Campi Flegrei: lo sciame vulcanico legato al bradisismo, senza una scossa principale.
 *
 * Le tappe sono solo scosse presenti nei dati del catalogo INGV, con la stessa magnitudo (un test lo controlla):
 * niente valori «a memoria». I testi sulle conseguenze vengono da fonti ufficiali citate.
 */
import { distanceKm } from '../lib/geo';
import type { LatLon } from '../lib/types';

export type SequenceId = 'centro-italia' | 'campi-flegrei';

export interface SequenceData {
  titolo: string;
  richieste: string[];
  inizio: string;
  fine: string;
  sogliaMag: number;
  /** [minuti dall'inizio, lat×1000, lon×1000, profondità×10, magnitudo×10] */
  eventi: [number, number, number, number, number][];
}

export interface Milestone {
  /** Istante della scossa (UTC), come nel catalogo INGV. */
  at: string;
  mag: number;
  title: string;
  text: string;
}

export interface SequenceDef {
  id: SequenceId;
  name: string;
  /** Cosa insegna, in una riga. */
  lesson: string;
  center: LatLon;
  load: () => Promise<SequenceData>;
  milestones: Milestone[];
  /** Larghezza delle barre sotto il cursore del tempo, in giorni. */
  binDays: number;
  /** Per quanti giorni una scossa resta «recente» (arancione) sulla mappa. */
  recentDays: number;
  /** Raggio dei cerchi per magnitudo: coppie [magnitudo, pixel]. */
  radius: [number, number][];
  notes: string[];
  sources: { label: string; href: string }[];
}

export const SEQUENCES: Record<SequenceId, SequenceDef> = {
  'centro-italia': {
    id: 'centro-italia',
    name: 'Centro Italia 2016–2017',
    lesson: 'Le repliche diminuiscono col tempo, ma una scossa più forte può arrivare dopo, senza preavviso.',
    center: { lat: 42.8, lon: 13.2 },
    load: () => import('../data/learn/seq-centro-italia.json').then((m) => m.default as unknown as SequenceData),
    milestones: [
      {
        at: '2016-08-24T01:36Z',
        mag: 6,
        title: '24 agosto 2016 · magnitudo 6,0 vicino ad Accumoli e Amatrice',
        text: 'La scossa principale, nel cuore della notte. Le vittime sono 299, soprattutto ad Amatrice, Accumoli e Arquata del Tronto. Poi le repliche, tantissime nei primi giorni e sempre meno col passare delle settimane.',
      },
      {
        at: '2016-10-26T19:18Z',
        mag: 5.9,
        title: '26 ottobre 2016 · magnitudo 5,4 e 5,9 vicino a Visso',
        text: 'Due scosse forti a due ore di distanza, più a nord, tra Visso e Castelsantangelo sul Nera.',
      },
      {
        at: '2016-10-30T06:40Z',
        mag: 6.5,
        title: '30 ottobre 2016 · magnitudo 6,5 vicino a Norcia',
        text: 'La più forte di tutta la sequenza, arrivata due mesi dopo Amatrice. Nessuno poteva prevederla: per questo, durante una sequenza, si resta prudenti anche quando sembra tutto calmo.',
      },
      {
        at: '2017-01-18T10:14Z',
        mag: 5.5,
        title: '18 gennaio 2017 · quattro scosse tra 5,0 e 5,5',
        text: 'In poche ore, più a sud, vicino a Capitignano (L’Aquila).',
      },
    ],
    binDays: 1,
    recentDays: 3,
    radius: [[2.5, 2.5], [4, 6], [5, 10], [6.5, 17]],
    notes: [
      'Ci sono solo le scosse di magnitudo 2,5 o più: quelle più piccole erano molte di più.',
      'Nelle prime ore dopo una scossa forte manca anche qualcuna di queste: gli strumenti faticano a distinguere scosse così ravvicinate.',
      'Guardando i punti non si può capire dove o quando arriverà la prossima scossa: i terremoti non si possono prevedere.',
      'Le posizioni sono stime e hanno un piccolo margine di errore.',
    ],
    sources: [
      {
        label: 'Dipartimento della Protezione Civile — Relazione di aggiornamento sui numeri dell’emergenza (22 agosto 2018)',
        href: 'https://emergenze.protezionecivile.gov.it/static/f438b5ebc904a11a47dd5db891db0fbb/Relazione_di_aggiornamento_numeri_dell_emergenza__22_agosto_2018_.pdf',
      },
    ],
  },
  'campi-flegrei': {
    id: 'campi-flegrei',
    name: 'Campi Flegrei dal 2023',
    lesson: 'Uno sciame: tante scosse che vanno e vengono, legate al suolo che si solleva, senza una scossa principale.',
    center: { lat: 40.827, lon: 14.139 },
    load: () => import('../data/learn/seq-campi-flegrei.json').then((m) => m.default as unknown as SequenceData),
    milestones: [
      {
        at: '2024-05-20T18:10Z',
        mag: 4.4,
        title: '20 maggio 2024 · magnitudo 4,4',
        text: 'Viene attivata l’Unità di crisi della Protezione Civile.',
      },
      {
        at: '2025-03-13T00:25Z',
        mag: 4.6,
        title: '13 marzo 2025 · magnitudo 4,6',
        text: 'Danni lievi e un ferito.',
      },
      {
        at: '2025-06-30T10:47Z',
        mag: 4.6,
        title: '30 giugno 2025 · magnitudo 4,6',
        text: 'Con epicentro in mare: nessun danno segnalato.',
      },
      {
        at: '2026-07-31T17:47Z',
        mag: 4.7,
        title: '31 luglio 2026 · magnitudo 4,7',
        text: 'La più forte finora in questa fase: 26 feriti e crolli di edifici disabitati.',
      },
    ],
    binDays: 7,
    recentDays: 30,
    radius: [[1, 2.5], [2, 4], [3, 7], [4, 11], [4.7, 14]],
    notes: [
      'Ci sono le scosse del catalogo nazionale INGV, da magnitudo 1 circa in su. L’Osservatorio Vesuviano ne registra molte di più, anche piccolissime.',
      'Per la stessa scossa il catalogo nazionale e l’Osservatorio Vesuviano possono indicare due magnitudo diverse, calcolate in modo diverso. Per esempio il 27 settembre 2023: 3,1 nel catalogo, 4,2 (magnitudo di durata) nel comunicato dell’Osservatorio. Per questo alcune scosse dell’articolo qui non compaiono tra le tappe.',
      'La mappa mostra solo le scosse, non il sollevamento del suolo, che è l’altra metà del bradisismo.',
      'Non permette di prevedere un’eruzione né la prossima scossa: lo stato del vulcano lo comunicano l’Osservatorio Vesuviano e la Protezione Civile.',
      'I dati si fermano al 30 settembre 2026.',
    ],
    sources: [
      {
        label: 'Tappe: comunicati INGV – Osservatorio Vesuviano e Dipartimento della Protezione Civile (vedi l’articolo sui Campi Flegrei)',
        href: 'https://rischi.protezionecivile.gov.it/it/vulcanico/vulcani-italia/campi-flegrei/il-bradisismo-ai-campi-flegrei/linea-del-tempo/',
      },
    ],
  },
};

/**
 * Quale sequenza mostrare per prima: quella vicina a casa tua, se c'è; altrimenti quella adatta all'articolo.
 * Si può sempre cambiare con un tocco.
 */
export function chooseSequence(home: LatLon | null | undefined, preferred: SequenceId): SequenceId {
  if (home) {
    if (distanceKm(home, SEQUENCES['campi-flegrei'].center) <= 60) return 'campi-flegrei';
    if (distanceKm(home, SEQUENCES['centro-italia'].center) <= 80) return 'centro-italia';
  }
  return preferred;
}

/** Indice della scossa del catalogo che corrisponde a una tappa (stesso minuto ±2, stessa magnitudo), o -1. */
export function findMilestone(data: SequenceData, m: Milestone): number {
  const t = (Date.parse(m.at) - Date.parse(data.inizio)) / 60_000;
  return data.eventi.findIndex((e) => Math.abs(e[0] - t) <= 2 && Math.abs(e[4] / 10 - m.mag) < 0.05);
}
