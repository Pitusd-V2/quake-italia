/**
 * Prepara i pezzi fissi dell'immagine di anteprima delle scosse:
 *
 *   node scripts/build-quake-og.mjs
 *
 * Scrive in public/og-data la fascia alta per ogni magnitudo e livello, la fascia bassa e i caratteri, e in
 * src/preview/glyphs.json le misure dei caratteri. Va rilanciato solo se cambiano grafica, livelli o colori: i file
 * generati stanno nel repository perché su Cloudflare non c'è il carattere Arial usato qui.
 */
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import sharp from 'sharp';
import { createServer } from 'vite';

const ROOT = path.resolve(import.meta.dirname, '..');
const OUT = path.join(ROOT, 'public', 'og-data');
const FONT = 'font-family="Arial, Helvetica, sans-serif"';

const vite = await createServer({
  root: ROOT,
  configFile: false,
  appType: 'custom',
  server: { middlewareMode: true },
  optimizeDeps: { noDiscovery: true, include: [] },
  logLevel: 'error',
});
const { magLevel } = await vite.ssrLoadModule('/src/lib/describe.ts');
const { formatMag } = await vite.ssrLoadModule('/src/lib/format.ts');
const L = await vite.ssrLoadModule('/src/preview/ogLayout.ts');
await vite.close();

const { OG_W: W, OG_H: H, BAND_TOP, BAND_BOTTOM, OG_BG, OG_FOOT, OG_SOFT, OG_LEVELS, OG_PALETTE, headFile } = L;
const logo = fs.readFileSync(path.join(ROOT, 'public', 'logo.svg'), 'utf8');
const logoInner = logo.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');
const xml = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/* ---------- Da immagine a pezzo di PNG ---------- */

const nCol = OG_PALETTE.length / 3;
const memo = new Map();
function nearest(r, g, b) {
  const k = (r << 16) | (g << 8) | b;
  let best = memo.get(k);
  if (best !== undefined) return best;
  let d = Infinity;
  for (let i = 0; i < nCol; i++) {
    const dr = OG_PALETTE[i * 3] - r;
    const dg = OG_PALETTE[i * 3 + 1] - g;
    const db = OG_PALETTE[i * 3 + 2] - b;
    const e = 2 * dr * dr + 4 * dg * dg + 3 * db * db;
    if (e < d) {
      d = e;
      best = i;
    }
  }
  memo.set(k, best);
  return best;
}

function adler32(buf) {
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

/** Disegna l'SVG, lo riduce alla tavolozza e lo comprime: 4 byte di controllo (Adler-32), poi i dati. */
async function slice(svg, rows, last) {
  const { data } = await sharp(Buffer.from(svg)).flatten({ background: OG_BG }).raw().toBuffer({ resolveWithObject: true });
  const raw = Buffer.alloc(rows * (W + 1));
  let prev = null;
  for (let y = 0; y < rows; y++) {
    const row = new Uint8Array(W);
    for (let x = 0; x < W; x++) {
      const p = (y * W + x) * 3;
      row[x] = nearest(data[p], data[p + 1], data[p + 2]);
    }
    const at = y * (W + 1);
    // La prima riga di ogni fascia non dipende da quella sopra: le fasce si possono così montare in qualsiasi ordine.
    raw[at] = prev ? 2 : 0;
    for (let x = 0; x < W; x++) raw[at + 1 + x] = prev ? (row[x] - prev[x]) & 255 : row[x];
    prev = row;
  }
  const z = zlib.deflateRawSync(raw, { level: 9, finishFlush: last ? zlib.constants.Z_FINISH : zlib.constants.Z_SYNC_FLUSH });
  const head = Buffer.alloc(4);
  head.writeUInt32BE(adler32(raw));
  return Buffer.concat([head, z]);
}

/* ---------- Le fasce fisse ---------- */

const heading = (name) => (name === 'Microscossa' ? name : `Scossa ${name.toLowerCase()}`);

const headSvg = (mag, lvl) => {
  const [bg, on] = OG_LEVELS[lvl.level];
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${BAND_TOP}" viewBox="0 0 ${W} ${BAND_TOP}">
  <rect width="${W}" height="${BAND_TOP}" fill="${OG_BG}"/>
  <rect x="72" y="56" width="300" height="300" rx="36" fill="${bg}"/>
  <text x="222" y="232" text-anchor="middle" ${FONT} font-size="138" font-weight="700" fill="${on}">${formatMag(mag)}</text>
  <text x="222" y="302" text-anchor="middle" ${FONT} font-size="30" font-weight="700" letter-spacing="3" fill="${on}">MAGNITUDO</text>
  <g transform="translate(432 58) scale(0.9)">${logoInner}</g>
  <text x="502" y="100" ${FONT} font-size="38" font-weight="700" fill="#ffffff">Quake Italia</text>
  <text x="432" y="238" ${FONT} font-size="64" font-weight="700" fill="#ffffff">${heading(lvl.name)}</text>
  <text x="434" y="298" ${FONT} font-size="34" fill="${OG_SOFT}">Terremoto registrato dall’INGV</text>
</svg>`;
};

const footH = H - BAND_BOTTOM;
const footSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${footH}" viewBox="0 0 ${W} ${footH}">
  <rect width="${W}" height="${footH}" fill="${OG_BG}"/>
  <rect y="8" width="${W}" height="70" fill="${OG_FOOT}"/>
  <text x="600" y="53" text-anchor="middle" ${FONT} font-size="27" fill="${OG_SOFT}">Dati ufficiali INGV · non è un sistema di allerta: in emergenza chiama il 112</text>
</svg>`;

/* ---------- I caratteri ---------- */

const CHARS = [...Array.from({ length: 95 }, (_, i) => String.fromCharCode(32 + i)), ...'àèéìòùÀÈÉÌÒÙ’·…–'];
const FONTS = [
  { id: 'b58', size: 58, weight: 700 },
  { id: 'b42', size: 42, weight: 700 },
  { id: 'r30', size: 30, weight: 400 },
];

async function alpha(text, size, weight, width, height, x, y) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><text x="${x}" y="${y}" xml:space="preserve" ${FONT} font-size="${size}" font-weight="${weight}" fill="#000">${xml(text)}</text></svg>`;
  const { data, info } = await sharp(Buffer.from(svg)).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const out = new Uint8Array(width * height);
  for (let i = 0; i < out.length; i++) out[i] = data[i * info.channels + 3];
  return out;
}

/** Larghezza di un carattere, misurata in grande tra due stanghette (Arial non le avvicina con il kerning). */
const MEASURE = 400;
async function barDistance(text, weight) {
  const w = 1800;
  const h = 640;
  const a = await alpha(text, MEASURE, weight, w, h, 40, 480);
  const ink = (x) => {
    for (let y = 0; y < h; y++) if (a[y * w + x] > 128) return true;
    return false;
  };
  let first = 0;
  while (first < w && !ink(first)) first++;
  let last = w - 1;
  while (last > 0 && !ink(last)) last--;
  while (last > 0 && ink(last - 1)) last--;
  return last - first;
}

const advances = {};
for (const weight of [400, 700]) {
  const bar = await barDistance('||', weight);
  advances[weight] = {};
  for (const c of CHARS) advances[weight][c] = c === '|' ? bar : (await barDistance(`|${c}|`, weight)) - bar;
}

const glyphBytes = [];
let offset = 0;
const index = {};
for (const f of FONTS) {
  const box = Math.ceil(f.size * 2);
  const ox = Math.ceil(f.size * 0.4);
  const base = Math.ceil(f.size * 1.3);
  const glyphs = {};
  for (const c of CHARS) {
    const a = c === ' ' ? new Uint8Array(box * box) : await alpha(c, f.size, f.weight, box, box, ox, base);
    let [x0, y0, x1, y1] = [box, box, -1, -1];
    for (let y = 0; y < box; y++)
      for (let x = 0; x < box; x++)
        if (a[y * box + x] >= 9) {
          x0 = Math.min(x0, x);
          y0 = Math.min(y0, y);
          x1 = Math.max(x1, x);
          y1 = Math.max(y1, y);
        }
    const adv = Math.round((advances[f.weight][c] * f.size * 100) / MEASURE) / 100;
    if (x1 < 0) {
      glyphs[c] = [adv, 0, 0, 0, 0, 0];
      continue;
    }
    const [gw, gh] = [x1 - x0 + 1, y1 - y0 + 1];
    const px = Buffer.alloc(gw * gh);
    for (let y = 0; y < gh; y++)
      for (let x = 0; x < gw; x++) px[y * gw + x] = Math.round((a[(y0 + y) * box + x0 + x] / 255) * 15);
    glyphs[c] = [adv, x0 - ox, y0 - base, gw, gh, offset];
    glyphBytes.push(px);
    offset += px.length;
  }
  index[f.id] = glyphs;
}

/* ---------- Scrittura ---------- */

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });
let n = 0;
for (let key = 0; key <= 99; key++) {
  const mag = key / 10;
  // Lo stesso numero può avere due livelli: una scossa molto superficiale sale di uno.
  const levels = new Map([magLevel(mag, 10), magLevel(mag, 2)].map((l) => [l.level, l]));
  for (const lvl of levels.values()) {
    fs.writeFileSync(path.join(OUT, headFile(key, lvl.level)), await slice(headSvg(mag, lvl), BAND_TOP, false));
    n++;
  }
}
fs.writeFileSync(path.join(OUT, 'foot.bin'), await slice(footSvg, footH, true));
fs.writeFileSync(path.join(OUT, 'glyphs.bin'), Buffer.concat(glyphBytes));
fs.writeFileSync(path.join(ROOT, 'src', 'preview', 'glyphs.json'), `${JSON.stringify(index)}\n`);
const size = fs.readdirSync(OUT).reduce((s, f) => s + fs.statSync(path.join(OUT, f)).size, 0);
console.log(`Creati ${n} pezzi con la magnitudo, la fascia bassa e i caratteri: ${(size / 1024).toFixed(0)} KB in public/og-data.`);
