/**
 * «Cosa vuol dire per me?»: dalla scossa all'effetto probabile dove sei, e da lì al tono giusto.
 *
 * La magnitudo da sola non basta: una 5 a 150 km quasi non si sente, una 4,5 poco profonda sotto casa può far cadere
 * calcinacci. Per questo tutto parte dall'intensità stimata nel tuo comune. Le soglie sono scelte per non allarmare:
 * il 112 compare solo quando è plausibile che serva davvero.
 */
import { feltEstimate } from './describe';
import { distanceKm, hypocentralKm } from './geo';
import type { LatLon, Quake } from './types';

/**
 * Intensità stimata (scala Mercalli) in un punto, senza effetti di sito.
 * Allen, Wald & Worden (2012), «Intensity attenuation for active crustal regions», J. Seismology 16:409–433,
 * versione con distanza ipocentrale (coefficienti come in OpenQuake, AllenEtAl2012Rhypo). Incertezza tipica ±1 grado.
 */
export function intensityAt(q: Quake, at: LatLon): number {
  const r = hypocentralKm(distanceKm(at, q), q.depthKm);
  const rm = -0.209 + 2.042 * Math.exp(q.mag - 5);
  let i = 2.085 + 1.428 * q.mag - 1.402 * Math.log(Math.sqrt(r * r + rm * rm));
  if (r > 50) i += 0.078 * Math.log(r / 50);
  return Math.max(1, i);
}

/** Dal più tranquillo al più serio. */
export const IMPACTS = ['none', 'weak', 'felt', 'strong', 'damage'] as const;
export type Impact = (typeof IMPACTS)[number];

export const impactRank = (i: Impact) => IMPACTS.indexOf(i);

/**
 * La formula sovrastima le scosse piccole e molto superficiali. Ai Campi Flegrei, a 2–3 km di profondità, la Md 4,2
 * del 2023 non ha fatto danni, la Md 4,6 del 2025 sì (danni lievi, un ferito): sotto 4,5 non parliamo mai di danni.
 */
const DAMAGE_MIN_MAG = 4.5;

export function impactAt(q: Quake, at: LatLon): Impact {
  const i = intensityAt(q, at);
  if (i >= 5.5) return q.mag >= DAMAGE_MIN_MAG ? 'damage' : 'strong'; // VI: possibili danni lievi
  if (i >= 4.5) return 'strong'; // V: la sentono tutti in casa, cadono oggetti
  if (i >= 3.5) return 'felt'; // IV: la sentono molti, vibrano vetri e porte
  // Il grado II («solo poche persone a riposo, ai piani alti») a casa quasi nessuno lo nota: per dire «potresti averla
  // sentita» vogliamo almeno il cuore del II (i ≥ 2, con ±1 grado il III è plausibile) e che anche la stima di
  // avvertibilità sia d'accordo (dentro il raggio, non «avvertita da pochi»). Così una 1,9 a 11 km resta fuori, una 3 a
  // 10 km, una 4 a 50 km o una 5 a 150 km no. La pagina «Ho sentito una scossa» resta inclusiva: usa feltEstimate.
  const key = feltEstimate(q, at).key;
  return i >= 2 && (key === 'clear' || key === 'light') ? 'weak' : 'none';
}

/** Per quanto tempo una scossa resta «la notizia» in cima alla pagina iniziale. */
const FRESH_MIN: Record<Impact, number> = { none: 0, weak: 60, felt: 120, strong: 6 * 60, damage: 24 * 60 };

/**
 * Il 112 solo se può servire davvero: dove sono possibili danni, oppure per una scossa forte (magnitudo 5 o più)
 * che a casa tua si è sentita molto. Una 4,2 che fa tremare i vetri non è un'emergenza.
 */
export const shows112 = (impact: Impact, mag: number) => impact === 'damage' || (impact === 'strong' && mag >= 5);

export interface HomeImpact {
  quake: Quake;
  impact: Impact;
  intensity: number;
  /** È appena successa: la pagina iniziale la mette al primo posto. */
  fresh: boolean;
  /** Primi minuti: magnitudo e posizione dell'INGV possono ancora cambiare. */
  preliminary: boolean;
}

/**
 * La scossa che conta di più per chi abita in `home`, tra quelle che si possono aver sentito.
 * Conta l'effetto a casa tua, non la magnitudo: vince la più sentita; se è ancora «fresca» resta in cima anche
 * se nel frattempo ne sono arrivate di più piccole.
 */
export function homeImpact(quakes: Quake[], home: LatLon, now: Date): HomeImpact | null {
  const t = now.getTime();
  const felt = quakes
    .map((quake) => ({ quake, intensity: intensityAt(quake, home), impact: impactAt(quake, home) }))
    .filter((c) => c.impact !== 'none');
  if (!felt.length) return null;
  const ageMin = (q: Quake) => (t - q.time.getTime()) / 60_000;
  const isFresh = (c: (typeof felt)[number]) => ageMin(c.quake) >= 0 && ageMin(c.quake) <= FRESH_MIN[c.impact];
  const fresh = felt.filter(isFresh);
  const pool = fresh.length ? fresh : felt;
  // A pari effetto: tra le scosse appena successe conta l'ultima, nel riepilogo della giornata la più sentita.
  const better = (a: (typeof felt)[number], b: (typeof felt)[number]) =>
    impactRank(b.impact) !== impactRank(a.impact)
      ? impactRank(b.impact) > impactRank(a.impact)
      : fresh.length
        ? b.quake.time.getTime() > a.quake.time.getTime()
        : b.intensity > a.intensity;
  const best = pool.reduce((a, b) => (better(a, b) ? b : a));
  return { ...best, fresh: fresh.length > 0, preliminary: ageMin(best.quake) < 20 };
}

/** Notte (ora italiana): chi viene svegliato da una scossa ha bisogno di una parola in più. */
export function isNightInItaly(now: Date): boolean {
  const h = Number(new Intl.DateTimeFormat('it-IT', { timeZone: 'Europe/Rome', hour: 'numeric', hourCycle: 'h23' }).format(now));
  return h >= 23 || h < 6;
}
