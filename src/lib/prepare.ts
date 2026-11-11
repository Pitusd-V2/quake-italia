/**
 * «Prepara la tua casa», a livelli. Le missioni vengono dall'elenco «Fin da subito» della campagna Io non rischio
 * della Protezione Civile (https://iononrischio.protezionecivile.it/it/preparati/terremoto/cosa-fare/), più due voci
 * della nostra pagina «Cosa fare» (acqua e medicine nel kit, punto di ritrovo in famiglia). Se cambia la fonte,
 * cambia anche questo file.
 *
 * Le spunte restano sul dispositivo, in settings.checklist: una chiave per ogni missione semplice e una per ogni
 * pezzo delle missioni divise in pezzi (gas, acqua e luce; le stanze; il kit). Chiavi: solo lettere minuscole.
 */

export interface MissionPart {
  key: string;
  label: string;
}

export interface Mission {
  /** Chiave della spunta (missioni semplici) o nome della missione (missioni a pezzi). */
  id: string;
  title: string;
  time: string;
  how: string;
  parts?: MissionPart[];
  /** Il pulsante «Cerca il piano del tuo Comune». */
  townPlan?: boolean;
}

export interface Level {
  n: number;
  title: string;
  /** Il distintivo che si conquista finendo il livello. */
  badge: string;
  missions: Mission[];
}

export const LEVELS: Level[] = [
  {
    n: 1,
    title: 'Scopri la tua casa',
    badge: 'Esploratore',
    missions: [
      {
        id: 'area',
        title: 'Trova l’area di attesa del tuo Comune',
        time: '10 minuti',
        how: 'È il posto sicuro dove andare dopo una scossa forte. Cerca il piano di protezione civile sul sito del Comune (o chiedi in Comune), trova l’area più vicina a casa e fai una volta la strada a piedi.',
        townPlan: true,
      },
      {
        id: 'gas',
        title: 'Gas, acqua e luce: sai dove si chiudono?',
        time: '15 minuti',
        how: 'Trova ognuno e impara come si chiude. Non serve chiuderli adesso: dopo una scossa forte, prima di uscire, si chiudono tutti e tre.',
        parts: [
          { key: 'gasrubinetto', label: 'Rubinetto del gas' },
          { key: 'acquarubinetto', label: 'Rubinetto generale dell’acqua' },
          { key: 'luceinterruttore', label: 'Interruttore generale della luce' },
        ],
      },
      {
        id: 'punti',
        title: 'I punti sicuri, stanza per stanza',
        time: '15 minuti',
        how: 'In ogni stanza cerca dove ripararti: vicino a una parete portante (la più spessa), sotto una trave, nel vano di una porta in un muro portante, oppure sotto un tavolo o un letto robusti. Al centro della stanza possono cadere oggetti, intonaco e mobili.',
        parts: [
          { key: 'puntocamera', label: 'Camera da letto' },
          { key: 'puntocucina', label: 'Cucina' },
          { key: 'puntosoggiorno', label: 'Soggiorno' },
          { key: 'puntobagno', label: 'Bagno' },
        ],
      },
    ],
  },
  {
    n: 2,
    title: 'Ferma i mobili',
    badge: 'Casa ferma',
    missions: [
      {
        id: 'letto',
        title: 'Niente mobili pesanti vicino a letti e divani',
        time: 'un pomeriggio',
        how: 'Guarda cosa potrebbe caderti addosso mentre dormi o sei seduto: sposta il mobile, oppure il letto o il divano.',
      },
      {
        id: 'mobili',
        title: 'Fissa al muro scaffali, librerie e mobili alti',
        time: 'un pomeriggio',
        how: 'Con staffe e tasselli adatti al tuo muro: se non sai che muro è, chiedi in ferramenta.',
      },
      {
        id: 'quadri',
        title: 'Quadri e specchi con ganci chiusi',
        time: '30 minuti',
        how: 'Un gancio chiuso impedisce che si stacchino dalla parete durante la scossa.',
      },
      {
        id: 'oggetti',
        title: 'Oggetti pesanti in basso, biadesivo in alto',
        time: '30 minuti',
        how: 'Sposta le cose pesanti sui ripiani bassi. Quelle che restano sui ripiani alti puoi fissarle con il nastro biadesivo.',
      },
      {
        id: 'sportelli',
        title: 'Un fermo agli sportelli di piatti e bicchieri',
        time: '30 minuti',
        how: 'In cucina, un fermo sull’apertura degli sportelli evita che si aprano durante la scossa.',
      },
    ],
  },
  {
    n: 3,
    title: 'Pronti insieme',
    badge: 'Famiglia pronta',
    missions: [
      {
        id: 'kit',
        title: 'Prepara il kit di emergenza',
        time: 'un’ora',
        how: 'Mettilo in un posto facile da raggiungere e controllalo ogni tanto: pile cariche, medicine non scadute.',
        parts: [
          { key: 'kitdocumenti', label: 'Copia dei documenti' },
          { key: 'kitsoccorso', label: 'Pronto soccorso' },
          { key: 'kittorcia', label: 'Torcia' },
          { key: 'kitradio', label: 'Radio a pile' },
          { key: 'kitacqua', label: 'Acqua' },
          { key: 'kitmedicine', label: 'Le tue medicine' },
        ],
      },
      {
        id: 'punto',
        title: 'Decidete un punto dove ritrovarvi',
        time: '10 minuti',
        how: 'Se la scossa vi trova in posti diversi, sapete già dove cercarvi: per esempio l’area di attesa del Comune.',
      },
    ],
  },
  {
    n: 4,
    title: 'Il passo in più',
    badge: 'Parere del tecnico',
    missions: [
      {
        id: 'tecnico',
        title: 'Chiedi a un tecnico se la casa va rinforzata',
        time: 'un appuntamento',
        how: 'A volte basta rinforzare i muri portanti o migliorare i collegamenti fra pareti e solai: per scegliere bene serve un tecnico esperto, per esempio un ingegnere o un architetto.',
      },
    ],
  },
];

export type Checklist = Record<string, boolean>;

const isOn = (c: Checklist, key: string) => c[key] === true;

/** Una missione è fatta quando sono fatti tutti i suoi pezzi (o la sua spunta, se non ne ha). */
export function missionDone(m: Mission, c: Checklist): boolean {
  return m.parts ? m.parts.every((p) => isOn(c, p.key)) : isOn(c, m.id);
}

/** Quanti pezzi sono fatti, per le missioni a pezzi. */
export const partsDone = (m: Mission, c: Checklist) => (m.parts ?? []).filter((p) => isOn(c, p.key)).length;

/** Le chiavi da cambiare per spuntare (o togliere) un'intera missione. */
export function missionKeys(m: Mission): string[] {
  return m.parts ? m.parts.map((p) => p.key) : [m.id];
}

/** Applica un cambiamento: tiene solo le chiavi vere, così il salvataggio resta piccolo. */
export function withKeys(c: Checklist, keys: string[], value: boolean): Checklist {
  const next = { ...c };
  for (const k of keys) {
    if (value) next[k] = true;
    else delete next[k];
  }
  return next;
}

export const ALL_MISSIONS = LEVELS.flatMap((l) => l.missions);

export function progress(c: Checklist) {
  const levels = LEVELS.map((l) => {
    const done = l.missions.filter((m) => missionDone(m, c)).length;
    return { level: l, done, total: l.missions.length, complete: done === l.missions.length };
  });
  const done = levels.reduce((s, l) => s + l.done, 0);
  return { levels, done, total: ALL_MISSIONS.length, complete: done === ALL_MISSIONS.length };
}

/**
 * Le spunte della vecchia lista (8 frasi) diventano i pezzi della nuova, così nessuno perde quello che aveva già
 * fatto. «area», «mobili», «oggetti» e «punto» restano uguali.
 */
const LEGACY: Record<string, string[]> = {
  gas: ['gasrubinetto', 'acquarubinetto', 'luceinterruttore'],
  kit: ['kittorcia', 'kitradio', 'kitacqua', 'kitsoccorso'],
  medicine: ['kitmedicine', 'kitdocumenti'],
  casa: ['tecnico'],
};

export function migrateChecklist(c: Checklist): Checklist {
  let next = c;
  for (const [old, keys] of Object.entries(LEGACY)) {
    if (!(old in next)) continue;
    if (isOn(next, old)) next = withKeys(next, keys, true);
    next = withKeys(next, [old], false);
  }
  return next;
}
