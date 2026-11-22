/**
 * Misure e colori dell'immagine di anteprima di una scossa (1200×630).
 *
 * L'immagine ha tre fasce. Quella in alto (magnitudo e livello) e quella in basso (avvertenza) sono già pronte, create da
 * scripts/build-quake-og.mjs. Quella in mezzo (nome, luogo, data) si scrive per ogni scossa da src/preview/ogImage.ts:
 * così il calcolo resta nei pochi millisecondi concessi dal piano gratuito di Cloudflare.
 */
export const OG_W = 1200;
export const OG_H = 630;
/** La fascia che cambia con la scossa: dalla riga BAND_TOP (compresa) alla riga BAND_BOTTOM (esclusa). */
export const BAND_TOP = 396;
export const BAND_BOTTOM = 552;
export const TEXT_X = 72;
export const TEXT_MAX = OG_W - 2 * TEXT_X;

export const OG_BG = '#0e5e7e';
export const OG_FOOT = '#0a4a64';
export const OG_SOFT = '#e3f1f6';
export const OG_PINK = '#ff7a8a';
/** Gli stessi colori dei livelli del sito (src/styles/tokens.css): sfondo e testo. */
export const OG_LEVELS: [string, string][] = [
  ['#5d6b78', '#ffffff'],
  ['#2f7d5b', '#ffffff'],
  ['#e3b505', '#1d1d1d'],
  ['#ea7c1c', '#1d1d1d'],
  ['#c62828', '#ffffff'],
  ['#7a1f3d', '#ffffff'],
];

type Rgb = [number, number, number];
const rgb = (h: string): Rgb => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];

/** n colori da a a b, estremi compresi. */
function ramp(a: string, b: string, n: number): Rgb[] {
  const [x, y] = [rgb(a), rgb(b)];
  return Array.from({ length: n }, (_, i) => {
    const t = i / (n - 1);
    return [0, 1, 2].map((c) => Math.round(x[c] + (y[c] - x[c]) * t)) as Rgb;
  });
}

const colors: Rgb[] = [
  // I primi 16 sono le sfumature del testo sullo sfondo: l'indice è direttamente la copertura del carattere (0-15).
  ...ramp(OG_BG, '#ffffff', 16),
  ...ramp(OG_BG, OG_PINK, 8),
  ...ramp('#ffffff', OG_PINK, 8),
  ...ramp(OG_FOOT, OG_SOFT, 16),
  ...ramp(OG_BG, OG_FOOT, 3),
  ...OG_LEVELS.flatMap(([bg, on]) => [...ramp(OG_BG, bg, 12), ...ramp(bg, on, 20)]),
];

/** La tavolozza dell'immagine, tre byte per colore. */
export const OG_PALETTE = Uint8Array.from(colors.flat());

/** La magnitudo come numero intero di decimi (4,3 → 43); null se non c'è un'immagine pronta. */
export function magKey(mag: number): number | null {
  const k = Math.round(mag * 10);
  return Number.isInteger(k) && k >= 0 && k <= 99 ? k : null;
}

/**
 * Il link da condividere. La magnitudo nell'indirizzo fa due cose: dice al server di preparare l'anteprima anche se
 * l'app che la chiede non si fa riconoscere, e se l'INGV corregge il valore il link cambia, così WhatsApp non riusa la
 * vecchia anteprima che ha salvato.
 */
export function quakeShareUrl(origin: string, id: string, mag: number): string {
  const key = magKey(mag);
  return `${origin}/terremoto/${id}${key === null ? '' : `?m=${key}`}`;
}

export const headFile = (key: number, level: number) => `h-${key}-${level}.bin`;
export const OG_DATA_PATH = '/og-data';
