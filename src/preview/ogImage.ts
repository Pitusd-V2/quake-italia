/**
 * Monta il PNG di anteprima di una scossa: fascia alta e bassa già compresse (public/og-data), e in mezzo la fascia con
 * il luogo, scritta qui con caratteri già pronti. Niente librerie di disegno: sul piano gratuito di Cloudflare una
 * richiesta ha 10 millisecondi di calcolo.
 */
import glyphIndex from './glyphs.json';
import { BAND_BOTTOM, BAND_TOP, OG_H, OG_PALETTE, OG_W, TEXT_MAX, TEXT_X } from './ogLayout';

type Glyph = [advance: number, dx: number, dy: number, w: number, h: number, offset: number];
type FontId = keyof typeof glyphIndex;
const FONTS = glyphIndex as unknown as Record<FontId, Record<string, Glyph>>;

export interface OgLine {
  text: string;
  /** I caratteri da provare, dal più grande: si usa il primo in cui il testo ci sta. */
  fonts: FontId[];
  /** La riga di base, contata dall'inizio della fascia. */
  baseline: number;
  /** Quanto è chiaro il testo, da 0 a 15. */
  shade: number;
}

/** Il carattere disponibile più vicino: le lettere accentate non previste perdono l'accento. */
function glyphFor(font: Record<string, Glyph>, c: string): Glyph {
  return font[c] ?? font[c.normalize('NFD')[0]] ?? font['?'];
}

const widthOf = (font: Record<string, Glyph>, chars: string[]) => chars.reduce((s, c) => s + glyphFor(font, c)[0], 0);

/** Sceglie il carattere e, se il testo resta troppo lungo, lo accorcia con i puntini. */
export function fitLine(line: OgLine): { font: FontId; chars: string[] } {
  const chars = [...line.text];
  for (const id of line.fonts) if (widthOf(FONTS[id], chars) <= TEXT_MAX) return { font: id, chars };
  const id = line.fonts[line.fonts.length - 1];
  const font = FONTS[id];
  const room = TEXT_MAX - font['…'][0];
  let w = 0;
  let n = 0;
  while (n < chars.length && w + glyphFor(font, chars[n])[0] <= room) w += glyphFor(font, chars[n++])[0];
  return { font: id, chars: [...chars.slice(0, n).join('').trimEnd(), '…'] };
}

const ROW = OG_W + 1;
const BAND_ROWS = BAND_BOTTOM - BAND_TOP;

function drawBand(lines: OgLine[], px: Uint8Array): Uint8Array {
  const band = new Uint8Array(BAND_ROWS * ROW);
  for (const line of lines) {
    const { font: id, chars } = fitLine(line);
    const font = FONTS[id];
    const scale = line.shade / 15;
    let pen = TEXT_X;
    for (const c of chars) {
      const [adv, dx, dy, w, h, off] = glyphFor(font, c);
      const left = Math.round(pen) + dx;
      const top = line.baseline + dy;
      for (let y = 0; y < h; y++) {
        const row = top + y;
        if (row < 0 || row >= BAND_ROWS) continue;
        for (let x = 0; x < w; x++) {
          const col = left + x;
          if (col < 0 || col >= OG_W) continue;
          const v = px[off + y * w + x];
          if (!v) continue;
          const at = row * ROW + 1 + col;
          const shaded = Math.round(v * scale);
          if (shaded > band[at]) band[at] = shaded;
        }
      }
      pen += adv;
    }
  }
  return band;
}

/* ---------- PNG ---------- */

const CRC = new Int32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  CRC[n] = c;
}

function crc32(buf: Uint8Array, from: number, to: number): number {
  let c = -1;
  for (let i = from; i < to; i++) c = CRC[(c ^ buf[i]) & 255] ^ (c >>> 8);
  return ~c >>> 0;
}

function adler32(buf: Uint8Array): number {
  let a = 1;
  let b = 0;
  for (let i = 0; i < buf.length; ) {
    const end = Math.min(i + 3800, buf.length);
    for (; i < end; i++) {
      a += buf[i];
      b += a;
    }
    a %= 65521;
    b %= 65521;
  }
  return ((b << 16) | a) >>> 0;
}

/** Il controllo Adler-32 di due pezzi uniti, senza rileggerli. */
function adlerCombine(a1: number, a2: number, len2: number): number {
  const B = 65521;
  const rem = len2 % B;
  let s1 = a1 & 0xffff;
  let s2 = (rem * s1) % B;
  s1 += (a2 & 0xffff) + B - 1;
  s2 += ((a1 >>> 16) & 0xffff) + ((a2 >>> 16) & 0xffff) + B - rem;
  if (s1 >= B) s1 -= B;
  if (s1 >= B) s1 -= B;
  if (s2 >= B * 2) s2 -= B * 2;
  if (s2 >= B) s2 -= B;
  return (s2 * 65536 + s1) >>> 0;
}

const u32 = (out: Uint8Array, at: number, v: number) => {
  out[at] = v >>> 24;
  out[at + 1] = (v >>> 16) & 255;
  out[at + 2] = (v >>> 8) & 255;
  out[at + 3] = v & 255;
};
const adlerOf = (s: Uint8Array) => ((s[0] << 24) | (s[1] << 16) | (s[2] << 8) | s[3]) >>> 0;

const SIGNATURE = [137, 80, 78, 71, 13, 10, 26, 10];
const ascii = (s: string) => Array.from(s, (c) => c.charCodeAt(0));

/** head e foot: i file di public/og-data (4 byte di controllo, poi i dati compressi). px: public/og-data/glyphs.bin. */
export function composeOgPng(head: Uint8Array, foot: Uint8Array, px: Uint8Array, lines: OgLine[]): Uint8Array<ArrayBuffer> {
  const band = drawBand(lines, px);
  const headZ = head.subarray(4);
  const footZ = foot.subarray(4);
  // La fascia va in blocchi «non compressi» (al massimo 65.535 byte l'uno): costa qualche KB ma nessun calcolo.
  const blocks = Math.ceil(band.length / 65535);
  const idatLen = 2 + headZ.length + band.length + blocks * 5 + footZ.length + 4;
  const total = SIGNATURE.length + 25 + 12 + OG_PALETTE.length + 12 + idatLen + 12;
  const out = new Uint8Array(total);
  let p = 0;
  out.set(SIGNATURE, p);
  p += SIGNATURE.length;

  const chunkStart = (type: string, len: number) => {
    u32(out, p, len);
    out.set(ascii(type), p + 4);
    const start = p + 4;
    p += 8;
    return start;
  };
  const chunkEnd = (start: number) => {
    u32(out, p, crc32(out, start, p));
    p += 4;
  };

  let c = chunkStart('IHDR', 13);
  u32(out, p, OG_W);
  u32(out, p + 4, OG_H);
  out.set([8, 3, 0, 0, 0], p + 8); // 8 bit, colori da tavolozza
  p += 13;
  chunkEnd(c);

  c = chunkStart('PLTE', OG_PALETTE.length);
  out.set(OG_PALETTE, p);
  p += OG_PALETTE.length;
  chunkEnd(c);

  c = chunkStart('IDAT', idatLen);
  out[p++] = 0x78;
  out[p++] = 0x01;
  out.set(headZ, p);
  p += headZ.length;
  for (let i = 0; i < band.length; i += 65535) {
    const len = Math.min(65535, band.length - i);
    out[p++] = 0;
    out[p++] = len & 255;
    out[p++] = len >>> 8;
    out[p++] = ~len & 255;
    out[p++] = (~len >>> 8) & 255;
    out.set(band.subarray(i, i + len), p);
    p += len;
  }
  out.set(footZ, p);
  p += footZ.length;
  const footLen = (OG_H - BAND_BOTTOM) * ROW;
  u32(out, p, adlerCombine(adlerCombine(adlerOf(head), adler32(band), band.length), adlerOf(foot), footLen));
  p += 4;
  chunkEnd(c);

  c = chunkStart('IEND', 0);
  chunkEnd(c);
  return out;
}
