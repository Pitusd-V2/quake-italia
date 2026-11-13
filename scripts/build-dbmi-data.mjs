/**
 * Prepara la «storia sismica» dei comuni per la pagina «Il mio comune», dal Database Macrosismico Italiano DBMI15
 * dell'INGV (versione 4.0).
 *
 *   node scripts/build-dbmi-data.mjs percorso/DBMI15_v4.0.ods
 *
 * Il file si scarica da https://emidius.mi.ingv.it/CPTI15-DBMI15/download_DBMI15.htm dopo aver accettato le note d'uso
 * (non è nel progetto: pesa 468 MB una volta aperto). Licenza dei dati: CC BY 4.0. Citazione obbligatoria, anche per
 * un uso parziale: è scritta in src/lib/dbmi.ts e compare nel sito accanto ai dati.
 *
 * Cosa fa: per ogni comune sceglie la località principale (quella con il nome del comune, altrimenti quella con più
 * osservazioni) e tiene i terremoti che lì si sono sentiti di più. Non copia il database: per la storia completa di una
 * località il sito rimanda alla pagina dell'INGV.
 *
 * Scrive src/data/dbmi/dbmi-<iniziale>.json: un file per iniziale del nome del comune, così il sito scarica solo
 * quello che serve (il nome «dbmi-» serve a vite.config.ts per non scaricarli in anticipo). Non usa librerie: legge
 * il file .ods (uno zip) con gli strumenti di Node.
 */
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { StringDecoder } from 'node:string_decoder';

const SRC = process.argv[2];
if (!SRC || !fs.existsSync(SRC)) {
  console.error('Uso: node scripts/build-dbmi-data.mjs <percorso di DBMI15_v4.0.ods>');
  process.exit(2);
}
const OUT = path.resolve(import.meta.dirname, '..', 'src', 'data', 'dbmi');

/** Come `norm` in src/lib/seismicZones.ts: i nomi dei comuni devono combaciare con quelli delle zone sismiche. */
const norm = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

/* ---------- Lettura di content.xml dentro lo zip ---------- */

function contentStream(file) {
  if (file.endsWith('.xml')) return fs.createReadStream(file);
  const fd = fs.openSync(file, 'r');
  const size = fs.fstatSync(fd).size;
  const tail = Buffer.alloc(Math.min(size, 65_557));
  fs.readSync(fd, tail, 0, tail.length, size - tail.length);
  const eocd = tail.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06]));
  if (eocd < 0) throw new Error('Non è un file .ods valido (manca l’indice dello zip).');
  const dirSize = tail.readUInt32LE(eocd + 12);
  const dirStart = tail.readUInt32LE(eocd + 16);
  const dir = Buffer.alloc(dirSize);
  fs.readSync(fd, dir, 0, dirSize, dirStart);
  for (let p = 0; p + 46 <= dir.length; ) {
    if (dir.readUInt32LE(p) !== 0x02014b50) break;
    const method = dir.readUInt16LE(p + 10);
    const packed = dir.readUInt32LE(p + 20);
    const nameLen = dir.readUInt16LE(p + 28);
    const extraLen = dir.readUInt16LE(p + 30);
    const commentLen = dir.readUInt16LE(p + 32);
    const offset = dir.readUInt32LE(p + 42);
    const name = dir.toString('utf8', p + 46, p + 46 + nameLen);
    if (name === 'content.xml') {
      if (packed === 0xffffffff || offset === 0xffffffff) throw new Error('File zip troppo grande per questo lettore.');
      const head = Buffer.alloc(30);
      fs.readSync(fd, head, 0, 30, offset);
      const start = offset + 30 + head.readUInt16LE(26) + head.readUInt16LE(28);
      fs.closeSync(fd);
      const raw = fs.createReadStream(file, { start, end: start + packed - 1 });
      if (method === 0) return raw;
      if (method !== 8) throw new Error(`Compressione non prevista (${method}).`);
      return raw.pipe(zlib.createInflateRaw());
    }
    p += 46 + nameLen + extraLen + commentLen;
  }
  throw new Error('Nel file non trovo content.xml.');
}

const ENT = { '&apos;': "'", '&quot;': '"', '&amp;': '&', '&lt;': '<', '&gt;': '>' };
const text = (xml) => xml.replace(/<[^>]+>/g, '').replace(/&(?:apos|quot|amp|lt|gt);/g, (e) => ENT[e]).trim();

function cells(row) {
  const out = [];
  for (const m of row.matchAll(/<table:table-cell([^>]*?)(?:\/>|>([\s\S]*?)<\/table:table-cell>)/g)) {
    const rep = Math.min(Number(/number-columns-repeated="(\d+)"/.exec(m[1])?.[1] ?? 1), 64);
    const value = m[2] ? text(m[2]) : '';
    for (let i = 0; i < rep; i++) out.push(value);
  }
  return out;
}

/* ---------- Lettura delle osservazioni ---------- */

/** comune (codice ISTAT) → { nome, sigla, località: Map(id → { nome, sc, oss: [...] }) } */
const towns = new Map();
let col = null;
let rows = 0;
let inSheet = false;

function onRow(c) {
  if (!col) {
    col = Object.fromEntries(c.map((name, i) => [name, i]));
    for (const need of ['Year', 'Ax', 'Imax', 'MDPplaceID', 'MDPplaceName', 'MDPsc', 'MDPint', 'MDPintNum', 'MDPcountry', 'MDPprovince', 'MDPmunicipality2015', 'MDPistat2015'])
      if (!(need in col)) throw new Error(`Nel foglio manca la colonna ${need}: il formato del file è cambiato.`);
    return;
  }
  rows++;
  const istat = c[col.MDPistat2015];
  const placeId = c[col.MDPplaceID];
  const num = Number(c[col.MDPintNum]);
  if (c[col.MDPcountry] !== 'IT' || !istat || !placeId || !Number.isFinite(num)) return;
  let town = towns.get(istat);
  if (!town) towns.set(istat, (town = { nome: c[col.MDPmunicipality2015], sigla: c[col.MDPprovince], places: new Map() }));
  let place = town.places.get(placeId);
  if (!place) town.places.set(placeId, (place = { id: placeId, nome: c[col.MDPplaceName], sc: c[col.MDPsc], oss: [] }));
  // `max`: l'intensità più alta raggiunta da quel terremoto in qualunque località (dice quanto è stato grande).
  place.oss.push({ y: Number(c[col.Year]), m: Number(c[col.Mo]) || 0, d: Number(c[col.Da]) || 0, i: c[col.MDPint], n: num, ax: c[col.Ax], max: c[col.Imax] ?? '' });
}

const decoder = new StringDecoder('utf8');
let buf = '';
for await (const chunk of contentStream(SRC)) {
  buf += decoder.write(chunk);
  for (;;) {
    const t = buf.indexOf('<table:table ');
    const r = buf.indexOf('<table:table-row');
    if (t >= 0 && (r < 0 || t < r)) {
      const end = buf.indexOf('>', t);
      if (end < 0) break;
      inSheet = /table:name="DBMI15 v4"/.test(buf.slice(t, end));
      buf = buf.slice(end + 1);
      continue;
    }
    if (r < 0) break;
    const end = buf.indexOf('</table:table-row>', r);
    if (end < 0) break;
    if (inSheet) {
      const c = cells(buf.slice(r, end));
      if (c.some(Boolean)) onRow(c);
    }
    buf = buf.slice(end + 18);
  }
}
if (rows < 100_000) throw new Error(`Ho letto solo ${rows} osservazioni: me ne aspettavo più di 120.000.`);

/* ---------- Scelta della località e dei terremoti da tenere ---------- */

/** Le sigle dei «casi particolari» che non sono un centro abitato vero (territori, edifici isolati, ruderi…). */
const NOT_A_TOWN = new Set(['TE', 'IB', 'SS', 'DL', 'AL', 'CQ', 'UL']);
/** Da «sentito» (F = 3,9) in su: sotto, l'effetto in quel posto è stato minimo o nullo. */
const MIN = 3.9;

const files = new Map();
let kept = 0;
for (const town of towns.values()) {
  const places = [...town.places.values()].filter((p) => !NOT_A_TOWN.has(p.sc));
  if (!places.length) continue;
  const main = places.find((p) => norm(p.nome) === norm(town.nome)) ?? places.reduce((a, b) => (b.oss.length > a.oss.length ? b : a));
  const strong = main.oss.filter((o) => o.n >= MIN).sort((a, b) => b.n - a.n || b.y - a.y);
  const pick = new Set([...strong.slice(0, 6), ...strong.filter((o) => o.y >= 1900).slice(0, 3)]);
  const top = [...pick].sort((a, b) => b.n - a.n || a.y - b.y).map((o) => [o.y, o.m, o.d, o.i, o.ax, o.max]);
  const key = `${norm(town.nome)}|${town.sigla}`;
  const letter = /^[a-z]/.test(key) ? key[0] : '_';
  if (!files.has(letter)) files.set(letter, {});
  // [comune, località, identificativo INGV, osservazioni, primo anno, altre località del comune, terremoti]
  files.get(letter)[key] = [town.nome, main.nome, main.id, main.oss.length, Math.min(...main.oss.map((o) => o.y)), places.length - 1, top];
  kept++;
}

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });
let bytes = 0;
for (const [letter, data] of [...files].sort()) {
  const json = JSON.stringify(Object.fromEntries(Object.entries(data).sort()));
  fs.writeFileSync(path.join(OUT, `dbmi-${letter}.json`), json);
  bytes += json.length;
}
console.log(`Osservazioni lette: ${rows}. Comuni con una storia: ${kept}. File scritti: ${files.size} (${Math.round(bytes / 1024)} KB in tutto) in src/data/dbmi/.`);
