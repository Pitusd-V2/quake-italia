/**
 * Tutto ciò che trasforma i numeri dell'INGV in frasi semplici.
 * Le soglie sono volutamente prudenti e descrittive: non sono previsioni
 * e non sostituiscono le valutazioni ufficiali.
 */
import { distanceKm, formatKm, hypocentralKm } from './geo';
import { formatMag, formatWhen } from './format';
import { PROVINCES } from './provinces';
import type { LatLon, Place, Quake } from './types';

export type Level = 0 | 1 | 2 | 3 | 4 | 5;

export interface MagLevel {
  level: Level;
  min: number;
  name: string;
  feel: string;
}

export const MAG_LEVELS: MagLevel[] = [
  { level: 0, min: -Infinity, name: 'Microscossa', feel: 'La registrano solo gli strumenti: le persone non la sentono.' },
  { level: 1, min: 2, name: 'Molto leggera', feel: 'Può sentirla qualche persona vicina, soprattutto se ferma o ai piani alti.' },
  { level: 2, min: 3, name: 'Leggera', feel: 'La sentono molte persone nella zona. Vetri e oggetti possono tremare. Di solito non fa danni.' },
  { level: 3, min: 4, name: 'Moderata', feel: 'La sente quasi tutta la zona, anche a decine di km. Possono cadere oggetti e ci possono essere piccoli danni.' },
  { level: 4, min: 5, name: 'Forte', feel: 'Può causare danni, soprattutto agli edifici vecchi o fragili.' },
  { level: 5, min: 6, name: 'Molto forte', feel: "Può causare danni gravi su un'area estesa." },
];

export function magLevel(mag: number): MagLevel {
  for (let i = MAG_LEVELS.length - 1; i >= 0; i--) if (mag >= MAG_LEVELS[i].min) return MAG_LEVELS[i];
  return MAG_LEVELS[0];
}

/* ---------- Località ---------- */

const DIRECTIONS: Record<string, string> = {
  N: 'nord', NNE: 'nord-nord-est', NE: 'nord-est', ENE: 'est-nord-est',
  E: 'est', ESE: 'est-sud-est', SE: 'sud-est', SSE: 'sud-sud-est',
  S: 'sud', SSW: 'sud-sud-ovest', SW: 'sud-ovest', WSW: 'ovest-sud-ovest',
  W: 'ovest', WNW: 'ovest-nord-ovest', NW: 'nord-ovest', NNW: 'nord-nord-ovest',
};

export interface PlaceText {
  /** "4 km a est di Bolognola (Macerata)" */
  full: string;
  /** Il nome principale da mostrare grande: "Bolognola" */
  main: string;
  /** Riga secondaria: "4 km a est · provincia di Macerata" */
  sub: string | null;
}

const NEAR_RE = /^(\d+(?:[.,]\d+)?)\s*km\s+([NSEWO]{1,3})\s+(.+?)\s*(?:\(([A-Za-z]{2})\))?\s*$/;

function cleanBrackets(s: string): string {
  const out = s
    .replace(/\s*\[mare\]/i, ' (in mare)')
    .replace(/\s*\[[^\]]*\]/g, '')
    .trim();
  // "Svizzera (SVIZZERA)" -> "Svizzera"
  const dup = /^(.+?)\s*\((.+)\)$/.exec(out);
  return dup && dup[1].toLowerCase() === dup[2].toLowerCase() ? dup[1] : out;
}

/** Converte "4 km E Bolognola (MC)" in italiano semplice. */
export function placeText(raw: string): PlaceText {
  const m = NEAR_RE.exec(raw.trim());
  if (m) {
    const km = m[1].replace('.', ',');
    const dirCode = m[2].toUpperCase().replace(/O/g, 'W');
    const dir = DIRECTIONS[dirCode] ?? m[2];
    const town = m[3].trim();
    const prov = m[4] ? (PROVINCES[m[4].toUpperCase()] ?? m[4].toUpperCase()) : null;
    const where = `${km} km a ${dir}`;
    return {
      full: `${where} di ${town}${prov ? ` (${prov})` : ''}`,
      main: town,
      sub: prov ? `${where} · provincia di ${prov}` : where,
    };
  }
  const clean = cleanBrackets(raw);
  return { full: clean, main: clean, sub: null };
}

/* ---------- "L'avrò sentita?" ---------- */

/**
 * Raggio indicativo (km) entro cui una scossa viene di solito avvertita
 * da qualcuno. Relazione empirica approssimata: M2≈9 km, M3≈25 km,
 * M4≈70 km, M5≈200 km. Serve solo a dare un'indicazione a parole.
 */
export function feltRadiusKm(mag: number): number {
  return 10 ** (0.45 * mag + 0.05);
}

export type FeltKey = 'clear' | 'light' | 'maybe' | 'no';

export interface FeltEstimate {
  key: FeltKey;
  label: string;
  explain: string;
  /** distanza ipocentrale / raggio di avvertibilità: più è basso, più è probabile. */
  ratio: number;
}

export function feltEstimate(q: Quake, at: LatLon): FeltEstimate {
  const ratio = hypocentralKm(distanceKm(at, q), q.depthKm) / feltRadiusKm(q.mag);
  if (ratio <= 0.5)
    return { key: 'clear', ratio, label: 'Probabilmente avvertita', explain: 'A questa distanza molte persone l’avranno sentita.' };
  if (ratio <= 1)
    return { key: 'light', ratio, label: 'Forse avvertita leggermente', explain: 'A questa distanza si può essere sentita come un leggero tremolio.' };
  if (ratio <= 2)
    return { key: 'maybe', ratio, label: 'Avvertita da pochi', explain: 'A questa distanza può averla sentita solo qualcuno, se fermo o ai piani alti.' };
  return { key: 'no', ratio, label: 'Difficile da sentire qui', explain: 'A questa distanza di solito non si sente.' };
}

/* ---------- Profondità ---------- */

export function depthText(km: number): string {
  if (km < 1) return 'meno di 1 km di profondità';
  return `${Math.round(km)} km di profondità`;
}

export function depthNote(km: number): string | null {
  if (km >= 70)
    return 'È un terremoto profondo: di solito si sente meno forte, ma su un’area più ampia.';
  if (km <= 5)
    return 'È un terremoto superficiale: vicino all’epicentro si può sentire bene anche con una magnitudo bassa.';
  return null;
}

/* ---------- Frasi complete ---------- */

export function distanceFrom(q: Quake, place: Place): string {
  return `a ${formatKm(distanceKm(place, q))} da ${place.name}`;
}

/** Testo pensato per essere letto ad alta voce (niente sigle). */
export function speechText(q: Quake, now: Date, home?: Place | null): string {
  const lvl = magLevel(q.mag);
  const p = placeText(q.place);
  const parts = [
    `${lvl.name}: terremoto di magnitudo ${formatMag(q.mag)}.`,
    `${capitalize(formatWhen(q.time, now))}, ${p.full.replace(/\bkm\b/g, 'chilometri')}.`,
    `Profondità: ${depthText(q.depthKm).replace(/\bkm\b/g, 'chilometri')}.`,
  ];
  if (home) {
    const d = formatKm(distanceKm(home, q)).replace(/\bkm\b/g, 'chilometri');
    parts.push(`Si trova a ${d} da ${home.name}. ${feltEstimate(q, home).explain}`);
  }
  parts.push(lvl.feel);
  return parts.join(' ');
}

export function shareText(q: Quake, now: Date): string {
  const lvl = magLevel(q.mag);
  return `Terremoto di magnitudo ${formatMag(q.mag)} (${lvl.name.toLowerCase()}) ${formatWhen(q.time, now)} — ${placeText(q.place).full}. Fonte: INGV.`;
}

export const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
