/**
 * Dati dell'articolo «Casa antisismica: cosa vuol dire davvero» (contenuti/bozze/casa-antisismica.mdx).
 * Uso: node scripts/build-antisismica-data.mjs     (CACHE_DIR=<cartella> riusa i file già scaricati)
 *
 * Fonti scaricate:
 * 1) ISTAT, 15° Censimento della popolazione e delle abitazioni 2011, «Edifici residenziali» (DICA_EDIFICIRES,
 *    licenza CC BY 4.0): edifici per epoca di costruzione e materiale, per Italia e comuni (codici ISTAT del 2011).
 * 2) OPCM 3274 del 20 marzo 2003, Allegato A (copia .xls pubblicata dall'INGV): per ogni comune (codici del 2001) la
 *    categoria dei decreti fino al 1984 e la zona del 2003. È lo stesso file letto da scripts/build-zone-data.mjs.
 *
 * Cosa calcoliamo noi (non è scritto nei file):
 * - le quote e le somme per epoca;
 * - l'unione dei due elenchi, comune per comune (prima codice e nome, poi solo il nome: tra il 2001 e il 2011 molti
 *   comuni hanno cambiato provincia e codice). I comuni che non si ritrovano sono contati ed elencati;
 * - i periodi di ritorno, con la formula [3.2.0] delle NTC 2018: TR = −VR / ln(1 − PVR).
 *
 * In fondo (PUBBLICATI) ci sono i numeri copiati da norme e studi, ognuno con la fonte esatta: non sono calcoli nostri.
 */
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import crypto from 'node:crypto';

const URL_ISTAT = 'https://esploradati.istat.it/databrowser/DWL/censtatv5db/Popolazione/DICA_EDIFICIRES-data.zip';
const URL_OPCM3274 = 'https://zonesismiche.mi.ingv.it/documenti/all_1_Com_Class.xls';
const OUT = new URL('../src/data/learn/antisismica.json', import.meta.url);
const UA = 'QuakeItalia-data/1.0 (+https://github.com/Pitusd-V2/quake-italia)';
const CACHE = process.env.CACHE_DIR;

/** Le classi di epoca del censimento, nell'ordine. «2006_F» arriva alla data del censimento (9 ottobre 2011). */
const EPOCHE = [
  ['1918_P', '1918 e prima'],
  ['1919-1945', '1919–1945'],
  ['1946-1960', '1946–1960'],
  ['1961-1970', '1961–1970'],
  ['1971-1980', '1971–1980'],
  ['1981-1990', '1981–1990'],
  ['1991-2000', '1991–2000'],
  ['2001-2005', '2001–2005'],
  ['2006_F', '2006 e dopo'],
];
const MATERIALI = { LBW: 'muratura', RC: 'ca', OTH: 'altro', ALL: 'tutti' };
const CATEGORIE = ['I', 'II', 'III', 'N.C.'];
/** Il comune del caso raccontato nell'articolo. */
const MIRANDOLA = '036022';
/** Le province nate dopo il 2001 (codice ISTAT 2011 → regione), che non si possono dedurre dai codici del 2001. */
const PROVINCE_NUOVE = { 104: '20', 105: '20', 106: '20', 107: '20', 108: '03', 109: '11', 110: '16' };
const CAMPANIA = '15';
/** Comuni con lo stesso codice nei due elenchi ma un nome troppo diverso per il confronto automatico. */
const RINOMINATI = { '030013': ['Buia', 'Buja'], '035018': ["Ciano d'Enza", 'Canossa'] };

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const somma = (xs) => xs.reduce((a, b) => a + b, 0);
const impronte = {};
const dateFile = {};

/** Scarica un file (con calma, user-agent dichiarato). Con CACHE_DIR ogni file sta in una sua cartella. */
async function get(url, nome, sottocartella) {
  const file = CACHE ? path.join(CACHE, sottocartella, nome) : null;
  let buf;
  if (file && fs.existsSync(file)) {
    buf = fs.readFileSync(file);
    dateFile[nome] = fs.statSync(file).mtime.toISOString().slice(0, 10);
  } else {
    for (let tentativo = 0; tentativo < 3 && !buf; tentativo++) {
      const res = await fetch(url, { headers: { 'User-Agent': UA } }).catch(() => null);
      if (res?.ok) buf = Buffer.from(await res.arrayBuffer());
      else await sleep(3000);
    }
    if (!buf) throw new Error(`Non risponde: ${url}`);
    if (file) (fs.mkdirSync(path.dirname(file), { recursive: true }), fs.writeFileSync(file, buf));
    dateFile[nome] = new Date().toISOString().slice(0, 10);
    await sleep(400);
  }
  impronte[nome] = crypto.createHash('sha256').update(buf).digest('hex');
  return buf;
}

/** Legge i file di uno zip (metodo «stored» o «deflate»). Uguale a scripts/build-zone-data.mjs. */
function unzip(buf) {
  let end = buf.length - 22;
  while (end >= 0 && buf.readUInt32LE(end) !== 0x06054b50) end--;
  if (end < 0) throw new Error('Zip non valido');
  const voci = buf.readUInt16LE(end + 10);
  let p = buf.readUInt32LE(end + 16);
  const files = {};
  for (let i = 0; i < voci; i++) {
    if (buf.readUInt32LE(p) !== 0x02014b50) throw new Error('Directory centrale non valida');
    const metodo = buf.readUInt16LE(p + 10);
    const compresso = buf.readUInt32LE(p + 20);
    const nLen = buf.readUInt16LE(p + 28);
    const eLen = buf.readUInt16LE(p + 30);
    const cLen = buf.readUInt16LE(p + 32);
    const locale = buf.readUInt32LE(p + 42);
    const nome = buf.toString('utf8', p + 46, p + 46 + nLen);
    const inizio = locale + 30 + buf.readUInt16LE(locale + 26) + buf.readUInt16LE(locale + 28);
    const dati = buf.subarray(inizio, inizio + compresso);
    if (metodo === 0) files[nome] = dati;
    else if (metodo === 8) files[nome] = zlib.inflateRawSync(dati);
    else throw new Error(`Metodo di compressione ${metodo} non gestito (${nome})`);
    p += 46 + nLen + eLen + cLen;
  }
  return files;
}

/**
 * Lettore minimo di file .xls (contenitore OLE2 + record BIFF8): restituisce le righe del primo foglio.
 * Uguale a scripts/build-zone-data.mjs.
 */
function leggiXls(buf) {
  const secSize = 1 << buf.readUInt16LE(30);
  const miniSize = 1 << buf.readUInt16LE(32);
  const nFat = buf.readUInt32LE(44);
  const dirStart = buf.readInt32LE(48);
  const miniCutoff = buf.readUInt32LE(56);
  const miniFatStart = buf.readInt32LE(60);
  let difStart = buf.readInt32LE(68);
  const sec = (i) => buf.subarray(512 + i * secSize, 512 + (i + 1) * secSize);
  const fatSecs = [];
  for (let i = 0; i < 109 && fatSecs.length < nFat; i++) fatSecs.push(buf.readInt32LE(76 + i * 4));
  while (fatSecs.length < nFat && difStart >= 0) {
    const s = sec(difStart);
    for (let i = 0; i < secSize / 4 - 1 && fatSecs.length < nFat; i++) fatSecs.push(s.readInt32LE(i * 4));
    difStart = s.readInt32LE(secSize - 4);
  }
  const fat = [];
  for (const f of fatSecs) for (let i = 0, s = sec(f); i < secSize / 4; i++) fat.push(s.readInt32LE(i * 4));
  const catena = (start) => {
    const out = [];
    for (let c = start; c >= 0 && out.length < 1e6; c = fat[c]) out.push(c);
    return out;
  };
  const flusso = (start) => Buffer.concat(catena(start).map(sec));
  const dir = flusso(dirStart);
  const voci = [];
  for (let o = 0; o + 128 <= dir.length; o += 128) {
    const nLen = dir.readUInt16LE(o + 64);
    voci.push({ nome: dir.subarray(o, o + Math.max(0, nLen - 2)).toString('utf16le'), start: dir.readInt32LE(o + 116), size: dir.readUInt32LE(o + 120) });
  }
  const wb = voci.find((v) => /^(Workbook|Book)$/.test(v.nome));
  if (!wb) throw new Error('Nel file .xls non c’è il foglio di lavoro');
  let data;
  if (wb.size < miniCutoff) {
    const mini = flusso(voci[0].start);
    const miniFat = [];
    for (const c of catena(miniFatStart)) for (let i = 0, s = sec(c); i < secSize / 4; i++) miniFat.push(s.readInt32LE(i * 4));
    const parti = [];
    for (let c = wb.start; c >= 0; c = miniFat[c]) parti.push(mini.subarray(c * miniSize, (c + 1) * miniSize));
    data = Buffer.concat(parti).subarray(0, wb.size);
  } else data = flusso(wb.start).subarray(0, wb.size);

  const recs = [];
  for (let o = 0; o + 4 <= data.length; ) {
    const id = data.readUInt16LE(o);
    const len = data.readUInt16LE(o + 2);
    recs.push({ id, body: data.subarray(o + 4, o + 4 + len) });
    o += 4 + len;
  }
  const sst = [];
  const r0 = recs.findIndex((r) => r.id === 0x00fc);
  if (r0 >= 0) {
    const pezzi = [recs[r0].body];
    for (let k = r0 + 1; recs[k]?.id === 0x003c; k++) pezzi.push(recs[k].body);
    let pi = 0;
    let p = pezzi[0];
    let o = 8;
    const n = p.readUInt32LE(4);
    for (let i = 0; i < n; i++) {
      if (o >= p.length) (p = pezzi[++pi]), (o = 0);
      const cch = p.readUInt16LE(o);
      o += 2;
      let flags = p[o++];
      let rt = 0;
      let sz = 0;
      if (flags & 8) (rt = p.readUInt16LE(o)), (o += 2);
      if (flags & 4) (sz = p.readUInt32LE(o)), (o += 4);
      let s = '';
      for (let resto = cch; resto > 0; ) {
        if (o >= p.length) (p = pezzi[++pi]), (o = 0), (flags = p[o++]);
        const largo = flags & 1;
        const prendi = Math.min(resto, Math.floor((p.length - o) / (largo ? 2 : 1)));
        s += largo ? p.subarray(o, o + prendi * 2).toString('utf16le') : p.subarray(o, o + prendi).toString('latin1');
        o += prendi * (largo ? 2 : 1);
        resto -= prendi;
      }
      for (let salta = rt * 4 + sz; salta > 0; ) {
        if (o >= p.length) (p = pezzi[++pi]), (o = 0);
        const t = Math.min(salta, p.length - o);
        o += t;
        salta -= t;
      }
      sst.push(s);
    }
  }
  const rk = (v) => {
    let x;
    if (v & 2) x = v >> 2;
    else {
      const b = Buffer.alloc(8);
      b.writeInt32LE(v & 0xfffffffc, 4);
      x = b.readDoubleLE(0);
    }
    return v & 1 ? x / 100 : x;
  };
  const righe = new Map();
  const metti = (r, c, v) => {
    if (!righe.has(r)) righe.set(r, []);
    righe.get(r)[c] = v;
  };
  let foglio = 0;
  for (const { id, body } of recs) {
    if (id === 0x0809 && body.readUInt16LE(2) === 0x0010 && ++foglio > 1) break;
    if (foglio !== 1) continue;
    if (id === 0x00fd) metti(body.readUInt16LE(0), body.readUInt16LE(2), sst[body.readUInt32LE(6)]);
    else if (id === 0x0203) metti(body.readUInt16LE(0), body.readUInt16LE(2), body.readDoubleLE(6));
    else if (id === 0x027e) metti(body.readUInt16LE(0), body.readUInt16LE(2), rk(body.readInt32LE(6)));
    else if (id === 0x00bd) {
      const r = body.readUInt16LE(0);
      let c = body.readUInt16LE(2);
      for (let o = 4; o + 6 <= body.length - 2; o += 6) metti(r, c++, rk(body.readInt32LE(o + 2)));
    } else if (id === 0x0204) metti(body.readUInt16LE(0), body.readUInt16LE(2), body.subarray(8, 8 + body.readUInt16LE(6)).toString('latin1'));
  }
  return [...righe.keys()].sort((a, b) => a - b).map((r) => righe.get(r));
}

/* ---------- 1) ISTAT: edifici per epoca e materiale ---------- */

const zip = unzip(await get(URL_ISTAT, 'DICA_EDIFICIRES-data.zip', 'istat'));
const nomeCsv = Object.keys(zip).find((k) => k.endsWith('DICA_EDIFICIRES-data-it.csv'));
if (!nomeCsv) throw new Error('Nello zip ISTAT manca il CSV in italiano');
const [testata, ...righeCsv] = zip[nomeCsv].toString('utf8').replace(/^﻿/, '').trim().split(/\r?\n/);
const col = testata.split('|');
const idx = Object.fromEntries(
  ['ITTER107', 'Territorio', 'TIPO_DATO_CENS_POP', 'PERCENTUALI', 'NUMEROSITA_A', 'NUMEROSITA_B', 'NUMEROSITA_C', 'SI_NO', 'NUMEROSITA_D', 'MATERIALE', 'VOTO_ALFAB', 'T_BIS', 'Value'].map((c) => {
    const i = col.indexOf(c);
    if (i < 0) throw new Error(`Manca la colonna ${c} nel CSV ISTAT`);
    return [c, i];
  }),
);
// Il filtro dei «totali»: numero di edifici, senza dividere per abitazioni, scale, ascensore, piani, stato di conservazione.
const FILTRO = { TIPO_DATO_CENS_POP: 'NRB', PERCENTUALI: 'TOT', NUMEROSITA_A: 'TOT', NUMEROSITA_B: 'TOT', NUMEROSITA_C: 'TOT', SI_NO: '9', NUMEROSITA_D: 'TOT', VOTO_ALFAB: 'TOT' };
const voceEpoca = new Map(EPOCHE.map(([k], i) => [k, i]));
const vuoto = () => ({ muratura: Array(9).fill(0), ca: Array(9).fill(0), altro: Array(9).fill(0), tutti: Array(9).fill(0) });
const italia = vuoto();
const totaliItalia = {};
const comuniIstat = new Map();
for (const riga of righeCsv) {
  const c = riga.split('|');
  if (!Object.entries(FILTRO).every(([k, v]) => c[idx[k]] === v)) continue;
  const terr = c[idx.ITTER107];
  const eCod = c[idx.T_BIS];
  const mat = MATERIALI[c[idx.MATERIALE]];
  const v = Number(c[idx.Value]);
  if (!mat || !Number.isFinite(v)) throw new Error(`Riga ISTAT inattesa: ${riga}`);
  if (terr === 'IT') {
    if (eCod === 'ALL') totaliItalia[mat] = v;
    else italia[mat][voceEpoca.get(eCod)] = v;
  } else if (/^\d{6}$/.test(terr) && mat === 'tutti') {
    if (!comuniIstat.has(terr)) comuniIstat.set(terr, { codice: terr, nome: c[idx.Territorio], epoche: Array(9).fill(0), totale: 0 });
    const com = comuniIstat.get(terr);
    if (eCod === 'ALL') com.totale = v;
    else com.epoche[voceEpoca.get(eCod)] = v;
  }
}
// I conti devono tornare: per ogni epoca i materiali sommano al totale, e le epoche sommano al totale nazionale.
for (let e = 0; e < 9; e++) {
  if (italia.muratura[e] + italia.ca[e] + italia.altro[e] !== italia.tutti[e]) throw new Error(`Materiali che non tornano per l'epoca ${EPOCHE[e][0]}`);
}
for (const m of ['muratura', 'ca', 'altro', 'tutti']) if (somma(italia[m]) !== totaliItalia[m]) throw new Error(`Epoche che non tornano per ${m}`);
for (const c of comuniIstat.values()) if (somma(c.epoche) !== c.totale) throw new Error(`Epoche che non tornano per il comune ${c.codice}`);
const edificiComuni = somma([...comuniIstat.values()].map((c) => c.totale));
if (edificiComuni !== totaliItalia.tutti) throw new Error(`I comuni sommano a ${edificiComuni}, l'Italia a ${totaliItalia.tutti}`);

/* ---------- 2) OPCM 3274/2003, Allegato A, e unione con l'ISTAT ---------- */

const xls = leggiXls(await get(URL_OPCM3274, 'all_1_Com_Class.xls', 'ingv'));
const allegato = xls
  .filter((r) => r && /^\d{7,8}$/.test(String(r[0] ?? '').trim()))
  .map((r) => ({
    istat2001: String(r[0]).trim().padStart(8, '0'),
    comune: String(r[1]).replace(/\s*\(\d\)\s*$/, '').trim(),
    cat1984: String(r[2] ?? '').trim(),
    zona2003: Number(r[4]),
  }));

// Del nome si tiene la parte italiana: «Bolzano/Bozen» nell'ISTAT, «Bolzano - Bozen» nell'Allegato.
const norm = (s) =>
  s
    .split(/\/| - /)[0]
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z]/g, '');

// La regione di ogni provincia del 2011: dai comuni che hanno lo stesso codice nei due elenchi, più le province nuove.
const regioneProvincia = new Map(Object.entries(PROVINCE_NUOVE));
for (const a of allegato) {
  const com = comuniIstat.get(a.istat2001.slice(2));
  if (com && norm(com.nome) === norm(a.comune)) regioneProvincia.set(String(Number(a.istat2001.slice(2, 5))), a.istat2001.slice(0, 2));
}
const regioneDi = (com) => regioneProvincia.get(String(Number(com.codice.slice(0, 3))));

const uniti = new Map(); // comune dell'Allegato → comune ISTAT
const usati = new Set();
const lega = (a, com) => (uniti.set(a, com), usati.add(com.codice));
const passi = { codiceENome: 0, codiceENomeSimile: 0, nomeNellaRegione: 0, nomeInItalia: 0 };
/** Due nomi «simili» (coppie di lettere in comune, indice di Dice), o uno che comincia con l'altro: «Bastia» e «Bastia Umbra». */
function simili(a, b) {
  const x = norm(a);
  const y = norm(b);
  if (x.startsWith(y) || y.startsWith(x)) return true;
  const coppie = (t) => Array.from({ length: t.length - 1 }, (_, i) => t.slice(i, i + 2));
  const cx = coppie(x);
  const cy = coppie(y);
  const resto = [...cy];
  let comuni = 0;
  for (const c of cx) {
    const i = resto.indexOf(c);
    if (i >= 0) (comuni++, resto.splice(i, 1));
  }
  return (2 * comuni) / (cx.length + cy.length) >= 0.6;
}

// Passo 1: stesso codice (ultime 6 cifre) e stesso nome.
for (const a of allegato) {
  const com = comuniIstat.get(a.istat2001.slice(2));
  if (com && !usati.has(com.codice) && norm(com.nome) === norm(a.comune)) (lega(a, com), passi.codiceENome++);
}
// Passo 1 bis: stesso codice e nome simile (comuni che hanno solo cambiato nome: Iesolo/Jesolo, Bastia/Bastia Umbra).
const codiceNomeDiverso = [];
for (const a of allegato) {
  if (uniti.has(a)) continue;
  const com = comuniIstat.get(a.istat2001.slice(2));
  if (!com || usati.has(com.codice)) continue;
  const rinominato = RINOMINATI[com.codice]?.[0] === a.comune && RINOMINATI[com.codice]?.[1] === com.nome;
  if (rinominato || simili(com.nome, a.comune)) (lega(a, com), passi.codiceENomeSimile++, codiceNomeDiverso.push(`${a.comune} = ${com.nome}`));
}
// Passo 2: stesso nome nella stessa regione, se è uno solo (comuni passati a una provincia nuova).
const unicoPerChiave = (chiave) => {
  const m = new Map();
  for (const com of comuniIstat.values()) {
    if (usati.has(com.codice)) continue;
    const k = chiave(com);
    m.set(k, m.has(k) ? null : com);
  }
  return m;
};
{
  const m = unicoPerChiave((com) => `${regioneDi(com)};${norm(com.nome)}`);
  for (const a of allegato) {
    if (uniti.has(a)) continue;
    const com = m.get(`${a.istat2001.slice(0, 2)};${norm(a.comune)}`);
    if (com && !usati.has(com.codice)) (lega(a, com), passi.nomeNellaRegione++);
  }
}
// Passo 3: stesso nome in tutta Italia, se è uno solo (comuni passati a un'altra regione, come l'Alta Valmarecchia).
{
  const m = unicoPerChiave((com) => norm(com.nome));
  const contaAllegato = new Map();
  for (const a of allegato) if (!uniti.has(a)) contaAllegato.set(norm(a.comune), (contaAllegato.get(norm(a.comune)) ?? 0) + 1);
  for (const a of allegato) {
    if (uniti.has(a) || contaAllegato.get(norm(a.comune)) !== 1) continue;
    const com = m.get(norm(a.comune));
    if (com && !usati.has(com.codice)) (lega(a, com), passi.nomeInItalia++);
  }
}
const nonUnitiAllegato = allegato.filter((a) => !uniti.has(a));
const nonUnitiIstat = [...comuniIstat.values()].filter((c) => !usati.has(c.codice));

/* ---------- 3) Quanto è vecchio il patrimonio, secondo la classificazione del comune ---------- */

const nuovoGruppo = () => ({ comuni: 0, edifici: 0, epoche: Array(9).fill(0) });
const aggiungi = (g, com) => {
  g.comuni++;
  g.edifici += com.totale;
  com.epoche.forEach((v, i) => (g.epoche[i] += v));
};
const passaggi = {}; // «N.C.→3»
const nonClassificati = nuovoGruppo();
const nonClassificatiSenzaCampania = nuovoGruppo();
const classificati = nuovoGruppo();
const altriSenzaCategoria = nuovoGruppo();
for (const [a, com] of uniti) {
  if (CATEGORIE.includes(a.cat1984)) {
    const k = `${a.cat1984}→${a.zona2003}`;
    aggiungi((passaggi[k] ??= nuovoGruppo()), com);
    if (a.cat1984 === 'N.C.') {
      aggiungi(nonClassificati, com);
      if (a.istat2001.slice(0, 2) !== CAMPANIA) aggiungi(nonClassificatiSenzaCampania, com);
    } else aggiungi(classificati, com);
  } else aggiungi(altriSenzaCategoria, com);
}

const allegatoMirandola = allegato.find((a) => uniti.get(a)?.codice === MIRANDOLA);
const istatMirandola = comuniIstat.get(MIRANDOLA);
if (!allegatoMirandola || !istatMirandola) throw new Error('Mirandola non trovata');

/* ---------- 4) Periodi di ritorno (NTC 2018, formula [3.2.0]) ---------- */

const STATI = [
  { id: 'SLO', nome: 'Operatività', pvr: 0.81 },
  { id: 'SLD', nome: 'Danno', pvr: 0.63 },
  { id: 'SLV', nome: 'Salvaguardia della vita', pvr: 0.1 },
  { id: 'SLC', nome: 'Prevenzione del collasso', pvr: 0.05 },
];
/** Tab. 2.4.II: coefficiente d'uso; qui con vita nominale 50 anni (costruzioni con prestazioni ordinarie, Tab. 2.4.I). */
const CLASSI = [
  { classe: 'II', cu: 1, vr: 50 },
  { classe: 'III', cu: 1.5, vr: 75 },
  { classe: 'IV', cu: 2, vr: 100 },
];
const periodiRitorno = CLASSI.map((c) => ({
  ...c,
  tr: Object.fromEntries(STATI.map((s) => [s.id, Math.round(-c.vr / Math.log(1 - s.pvr))])),
}));

/* ---------- 5) Numeri pubblicati, copiati dalla fonte ---------- */

const PUBBLICATI = {
  ntc: {
    fonte: 'DM 17 gennaio 2018 (NTC 2018), GU n. 42 del 20/2/2018, S.O. n. 8',
    statiLimite: { fonte: '§3.2.1, Tab. 3.2.I, pp. 45-46', pvr: Object.fromEntries(STATI.map((s) => [s.id, s.pvr])) },
    vitaNominaleAnni: { fonte: '§2.4.1, Tab. 2.4.I', temporanee: 10, ordinarie: 50, elevate: 100 },
    coefficienteUso: { fonte: '§2.4.3, Tab. 2.4.II', I: 0.7, II: 1, III: 1.5, IV: 2 },
    fattoreComportamentoTelaioCa: { fonte: '§7.3.1, Tab. 7.3.II: q0 = valore · αu/α1', CDA: 4.5, CDB: 3 },
    fattoreComportamentoPrefabbricati: { fonte: '§7.3.1, Tab. 7.3.II: pilastri incastrati e orizzontamenti incernierati', CDA: 3.5, CDB: 2.5 },
    gammaRdMin: { fonte: '§7.2.2: fattore di sovraresistenza per i meccanismi globali fragili', valore: 1.25 },
    miglioramento: { fonte: '§8.4.2: classe II e classe III non scolastica, ζE da aumentare di almeno 0,1; classe III scolastica e classe IV, ζE non minore di 0,6', classeII: 0.1, scuoleEClasseIV: 0.6 },
    adeguamento: { fonte: '§8.4.3: ζE dopo l’intervento', casiABD: 1, casiCE: 0.8 },
  },
  classificazione1984: { fonte: 'DPC, «Classificazione sismica»', comuniClassificati: 2965, comuniTotali: 8102, quotaTerritorio: 0.45, quotaPopolazione: 0.4 },
  dpcNonStrutturali: { fonte: 'DPC, «Esposizione»: «alcune statistiche», terremoti principali nel mondo, danni non strutturali e fenomeni indotti', quotaMorti: 0.25 },
  emilia: {
    ingv: {
      fonte: 'INGV, webservices.ingv.it/fdsnws/event/1/query, eventi 772691 e 841091 (magnitudo preferita, letta il 21/11/2026)',
      scossa20: { evento: 772691, mw: 5.8 },
      scossa29: { evento: 841091, mw: 5.6 },
    },
    paginaDpc: {
      fonte: 'DPC, «The earthquake in Northern Italy» (bilancio complessivo delle vittime e magnitudo indicate nella pagina)',
      url: 'https://servizio-nazionale.protezionecivile.gov.it/en/pagina-base/earthquake-northern-italy/',
      vittime: 28,
      magnitudo20: 5.9,
      magnitudo29: 5.8,
    },
    rapportoDpc: {
      fonte: 'Galli, Castenetto e Peronace (2012), rapporto DPC del 15 giugno 2012, p. 1 e Tab. 1 (Ml CNT e Mw RCMT; vittime contate a quella data)',
      scossa20: { mwRcmt: 6.11, ml: 5.9, ora: '04:03' },
      scossa29: { mwRcmt: 5.96, ml: 5.8, ora: '09:00' },
      vittime20: 7,
      vittime29: 19,
      localita: 190,
      comuni: 87,
      province: 6,
    },
    magliulo: {
      fonte: 'Magliulo e altri (2014), Earthquake Spectra 30(2), versione accettata',
      pgaMirandolaNS: 0.264,
      pgaMirandolaEO: 0.261,
      pgaRiferimentoRoccia475: 0.14,
      attritoMisurato: [0.09, 0.13],
      attritoCircolare1965: 0.35,
      attritoCaltrans: [0.2, 0.4],
      quotaPrefabbricatiEpicentro: 0.09,
      quotaPrefabbricatiItalia: 0.0365,
      danniDirettiMiliardi: 1,
      danniIndirettiMiliardi: 5,
    },
    dl74: { fonte: 'DL 74/2012, art. 3, commi 9-10', verificaMesi: 24, sogliaSicurezza: 0.6 },
  },
  rintc: {
    fonte: 'RINTC Workgroup (2018), ReLUIS, §1.1 Tab. 1.1.1; L’Aquila suolo C: Tab. 7.2.1 (muratura), 7.3.1 (prefabbricati), 7.4.1 (telai in c.a.), 7.6.1 (isolati); Napoli suolo C: Tab. 7.4.3 (telai); §7.8',
    pga475Roccia: { Milano: 0.0495, Caltanissetta: 0.0762, Roma: 0.1204, Napoli: 0.1668, LAquila: 0.2607 },
    tassoCollassoAquilaC: [3.1e-5, 2.1e-4],
    tassoDannoAquilaC: [2.4e-3, 2.7e-2],
    tassoCollassoNapoliC: [1e-5, 3.85e-5],
    tassoCollassoMuraturaRegolareAquilaC: [3.83e-4, 9.27e-4],
    tassoCollassoMuraturaIrregolareAquilaCMax: 2.24e-3,
    tassoCollassoPrefabbricatiAquilaCMax: 1.35e-3,
    // Tab. 7.3.1: i tre prefabbricati diversi dal caso massimo (8,80E-05; 1,32E-04; 1,42E-04): minimo e massimo.
    tassoCollassoPrefabbricatiAquilaCAltri: [8.8e-5, 1.42e-4],
    tassoCollassoIsolatiAquilaCMax: 1.11e-3,
    // Tab. 7.6.1: il minimo delle 14 righe.
    tassoCollassoIsolatiAquilaCMin: 1.55e-4,
  },
  rischioNazionale: {
    fonte: 'Dolce e altri (2021), Bulletin of Earthquake Engineering 19(8), media dei modelli',
    abitazioniCrollateAnno: 2100,
    abitazioniCrollate50Anni: 100000,
    abitazioniInagibiliAnno: 36000,
    senzatettoAnno: 80000,
    perditeMiliardiAnno: 2,
    differenzaModelli: 0.5,
  },
  norcia: {
    fonte: 'Sisti e altri (2022), Bulletin of Earthquake Engineering 20(1): esiti AeDES; a Campi Alto 44 unità residenziali e 5 magazzini',
    norcia: { agibili: 0.26, parziali: 0.42, inagibili: 0.32 },
    campiAlto: { unitaInagibili: 45, unitaTotali: 49, inagibili: 0.92, parziali: 0.08 },
  },
};

/* ---------- Scrittura ---------- */

fs.writeFileSync(
  OUT,
  `${JSON.stringify({
    titolo: 'Edifici residenziali italiani per epoca di costruzione e materiale (censimento 2011), classificazione sismica dei comuni e periodi di ritorno delle norme',
    scaricato: dateFile['DICA_EDIFICIRES-data.zip'],
    fonti: {
      istat: {
        nome: 'ISTAT, 15° Censimento generale della popolazione e delle abitazioni 2011, Edifici residenziali (DICA_EDIFICIRES)',
        url: URL_ISTAT,
        licenza: 'CC BY 4.0',
        file: nomeCsv,
        filtro: FILTRO,
      },
      opcm3274: {
        nome: 'OPCM 3274 del 20 marzo 2003, Allegato A, classificazione sismica dei comuni italiani (GU n. 105 dell’8 maggio 2003, S.O. 72; copia .xls pubblicata dall’INGV)',
        url: URL_OPCM3274,
      },
    },
    richieste: [URL_ISTAT, URL_OPCM3274],
    impronteSha256: impronte,
    epoche: EPOCHE.map(([id, nome]) => ({ id, nome })),
    italia: { ...italia, totale: totaliItalia.tutti, totaliMateriale: { muratura: totaliItalia.muratura, ca: totaliItalia.ca, altro: totaliItalia.altro } },
    unione: {
      comuniAllegato: allegato.length,
      comuniIstat: comuniIstat.size,
      uniti: uniti.size,
      passi,
      edificiUniti: somma([...uniti.values()].map((c) => c.totale)),
      edificiTotali: totaliItalia.tutti,
      nonUnitiAllegato: nonUnitiAllegato.map((a) => `${a.comune} (${a.cat1984 || 's.c.'}→${a.zona2003})`),
      nonUnitiIstat: nonUnitiIstat.map((c) => `${c.nome} (${c.totale})`),
      edificiNonUniti: somma(nonUnitiIstat.map((c) => c.totale)),
    },
    gruppi: { nonClassificati, nonClassificatiSenzaCampania, classificati, senzaCategoria: altriSenzaCategoria },
    passaggi,
    mirandola: { codice: MIRANDOLA, nome: istatMirandola.nome, cat1984: allegatoMirandola.cat1984, zona2003: allegatoMirandola.zona2003, totale: istatMirandola.totale, epoche: istatMirandola.epoche },
    statiLimite: STATI,
    periodiRitorno,
    pubblicati: PUBBLICATI,
  })}\n`,
);

console.log('Italia', totaliItalia);
console.log('Comuni ISTAT', comuniIstat.size, 'Allegato', allegato.length, 'uniti', uniti.size, passi);
console.log('Stesso codice, nome diverso:', codiceNomeDiverso.filter((t) => !/ - /.test(t)).join('; '));
console.log('Non uniti Allegato', nonUnitiAllegato.length, nonUnitiAllegato.map((a) => a.comune).join(', '));
console.log('Non uniti ISTAT', nonUnitiIstat.length, nonUnitiIstat.map((c) => `${c.nome} ${c.totale}`).join(', '));
const quota2001 = (g) => (somma(g.epoche.slice(0, 7)) / g.edifici).toFixed(4);
const quota1981 = (g) => (somma(g.epoche.slice(0, 5)) / g.edifici).toFixed(4);
for (const [k, g] of [['N.C.', nonClassificati], ['N.C. senza Campania', nonClassificatiSenzaCampania], ['classificati', classificati], ['senza categoria', altriSenzaCategoria], ...Object.entries(passaggi).sort()])
  console.log(k, 'comuni', g.comuni, 'edifici', g.edifici, 'prima del 2001', quota2001(g), 'prima del 1981', quota1981(g));
console.log('Mirandola', allegatoMirandola.cat1984, allegatoMirandola.zona2003, istatMirandola.totale, istatMirandola.epoche);
console.log('Periodi di ritorno', JSON.stringify(periodiRitorno));
