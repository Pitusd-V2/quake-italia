/**
 * Dati dell'articolo «Le zone sismiche, spiegate» (contenuti/articoli/le-zone-sismiche.mdx).
 * Uso: node scripts/build-zone-data.mjs     (CACHE_DIR=<cartella> riusa i file già scaricati)
 *
 * Scarica cinque file ufficiali, li riassume e scrive src/data/learn/zone.json:
 * 1) Dipartimento della Protezione Civile (DPC): l'elenco dei comuni con la zona sismica, aggiornato a maggio 2025
 *    (CSV, licenza CC BY 4.0). È lo stesso elenco di src/data/zone-sismiche.json (lo controlliamo), ma ha in più la
 *    regione e il codice ISTAT, che servono per i conti per regione e per unire la popolazione.
 * 2) DPC: la tabella degli atti regionali di classificazione in vigore al 31 maggio 2025 (PDF di una pagina). Il PDF
 *    non si legge bene senza librerie: gli atti sono trascritti qui sotto (ATTI) e lo script salva l'impronta sha256
 *    del PDF, così si vede se il file è cambiato e la trascrizione va ricontrollata.
 * 3) ISTAT: la popolazione residente per comune al 1° gennaio 2025 (POSAS, licenza CC BY 4.0). Il totale di un
 *    comune è la riga con «Età» = 999, colonna «Totale». Non usiamo il 2026, che l'ISTAT segna come stima.
 * 4) OPCM 3274 del 20 marzo 2003, Allegato A: per ogni comune (codici ISTAT del 2001) la categoria dei decreti fino
 *    al 1984, la proposta del gruppo di lavoro del 1998 e la zona del 2003. Copia .xls pubblicata dall'INGV; il testo
 *    ufficiale è nella Gazzetta Ufficiale n. 105 dell'8 maggio 2003. Il file è nel vecchio formato Excel (BIFF8):
 *    lo leggiamo con un piccolo lettore scritto qui, senza librerie.
 * 5) INGV, mappa di pericolosità MPS04 (OPCM 3519/2006, Allegato 1B), griglia di 0,05°: ag con il 10% di probabilità
 *    di superamento in 50 anni, su roccia, con il 16° e l'84° percentile. Licenza CC BY 4.0; l'INGV chiede di non
 *    usarla per fini commerciali. Ci serve solo per tre cose: la distanza tra punti vicini della griglia, dove sono i
 *    valori più alti (con le coordinate) e un blocco di punti veri per il disegno «la zona e la griglia».
 *
 * Cosa calcoliamo noi (non è scritto nei file): conteggi per zona e per regione, unione con la popolazione sul codice
 * ISTAT, passaggi dalle categorie del 1984 alle zone del 2003, quanti comuni di ogni Regione hanno ancora la zona del
 * 2003 (unione sul nome), distanza tra i punti della griglia.
 *
 * La «zona principale» di un comune è la più pericolosa del suo codice (il numero più basso): «2A-3A-3B» → 2,
 * come fa il sito (src/lib/seismicZones.ts). I comuni divisi tra zone con numeri diversi li teniamo anche a parte.
 */
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import crypto from 'node:crypto';

const URL_PAGINA_DPC = 'https://rischi.protezionecivile.gov.it/it/sismico/attivita/classificazione-sismica/';
const URL_CSV_DPC = 'https://rischi.protezionecivile.gov.it/static/4717c6a369cdc298b69730c9d740e39a/classificazione-sismica-aggiornata-maggio-2025.csv';
const URL_ATTI_DPC = 'https://rischi.protezionecivile.gov.it/static/4f996d4ed8621daef1191b6955ff5c1b/normativa-regionale-di-classificazione-sismica-maggio-2025.pdf';
const URL_ISTAT = 'https://demo.istat.it/data/posas/POSAS_2025_it_Comuni.zip';
const URL_OPCM3274 = 'https://zonesismiche.mi.ingv.it/documenti/all_1_Com_Class.xls';
const URL_PAGINA_OPCM3274 = 'https://zonesismiche.mi.ingv.it/pcm3274.html';
const URL_MPS04 = 'https://zonesismiche.mi.ingv.it/elaborazioni/dati/OPCM3519_1B_ag_005_txt.zip';
const URL_PAGINA_MPS04 = 'https://zonesismiche.mi.ingv.it/elaborazioni/download.php';

const OUT = new URL('../src/data/learn/zone.json', import.meta.url);
const SITO = new URL('../src/data/zone-sismiche.json', import.meta.url);
const UA = 'QuakeItalia-data/1.0 (+https://github.com/Pitusd-V2/quake-italia)';
const CACHE = process.env.CACHE_DIR;

/** Atti regionali di classificazione in vigore al 31/05/2025, trascritti dalla tabella DPC (URL_ATTI_DPC). */
const ATTI = {
  Abruzzo: ['Delibera della Giunta regionale', '425', '2024-07-15'],
  Basilicata: ['Legge regionale', '9', '2011-06-07'],
  Calabria: ['Delibera della Giunta regionale', '47', '2004-02-10'],
  Campania: ['Delibera della Giunta regionale', '5447', '2002-11-07'],
  'Emilia-Romagna': ['Delibera della Giunta regionale', '1164', '2018-07-23'],
  'Friuli-Venezia Giulia': ['Delibera della Giunta regionale', '845', '2010-05-06'],
  Lazio: ['Delibera della Giunta regionale', '387', '2009-05-22'],
  Liguria: ['Delibera della Giunta regionale', '216', '2017-03-17'],
  Lombardia: ['Delibera della Giunta regionale', 'X/2129', '2014-07-11'],
  Marche: ['Delibera della Giunta regionale', '1142', '2022-09-19'],
  Molise: ['Delibera della Giunta regionale', '194', '2006-09-20'],
  Piemonte: ['Delibera della Giunta regionale', '17-8404', '2019-02-15'],
  Puglia: ['Delibera della Giunta regionale', '153', '2004-03-02'],
  Sardegna: ['Delibera della Giunta regionale', '15/31', '2004-03-30'],
  Sicilia: ['Delibera della Giunta regionale', '64', '2022-03-11'],
  Toscana: ['Delibera della Giunta regionale', '421', '2014-05-26'],
  'Provincia autonoma di Bolzano': ['Delibera della Giunta provinciale', '4047', '2006-11-06'],
  'Provincia autonoma di Trento': ['Delibera della Giunta provinciale', '1937', '2023-10-20'],
  Umbria: ['Delibera della Giunta regionale', '1111', '2012-09-18'],
  Veneto: ['Delibera del Consiglio regionale', '244', '2021-03-09'],
  "Valle d'Aosta": ['Delibera della Giunta regionale', '1603', '2013-10-04'],
};

/** Impronta sha256 del PDF da cui sono trascritti gli ATTI (controllato il 2026-11-07). */
const SHA_ATTI = '24ca0aebefc833894be0ca873ca35d117e2bb4b1da9ee9f1ac8e01a821a57470';

/** I comuni d'esempio del testo: [nome, sigla della provincia oggi]. */
const ESEMPI = [
  ['San Giuliano di Puglia', 'CB'],
  ["L'Aquila", 'AQ'],
  ['Mirandola', 'MO'],
  ['Roma', 'RM'],
  ['Cagliari', 'CA'],
];

/** Il blocco di punti MPS04 per il disegno: basso Molise, la zona di San Giuliano di Puglia (gradi). */
const BLOCCO = { minlat: 41.6, maxlat: 41.85, minlon: 14.8, maxlon: 15.06 };

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const sha256 = (buf) => crypto.createHash('sha256').update(buf).digest('hex');
const richieste = [];
const impronte = {};

/** Scarica un file (con calma, user-agent dichiarato). Con CACHE_DIR ogni file sta in una sua cartella. */
async function get(url, nome) {
  richieste.push(url);
  const file = CACHE ? path.join(CACHE, nome.replace(/\W+/g, '-'), nome) : null;
  let buf;
  if (file && fs.existsSync(file)) buf = fs.readFileSync(file);
  else {
    for (let tentativo = 0; tentativo < 3 && !buf; tentativo++) {
      const res = await fetch(url, { headers: { 'User-Agent': UA } }).catch(() => null);
      if (res?.ok) buf = Buffer.from(await res.arrayBuffer());
      else await sleep(3000);
    }
    if (!buf) throw new Error(`Non risponde: ${url}`);
    if (file) (fs.mkdirSync(path.dirname(file), { recursive: true }), fs.writeFileSync(file, buf));
    await sleep(400);
  }
  impronte[nome] = sha256(buf);
  return buf;
}

/** Legge i file di uno zip (metodo «stored» o «deflate»). */
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
 * Gestisce celle di testo (tabella SST, anche spezzata in record CONTINUE), numeri, RK e MULRK.
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
  // Tabella delle stringhe (SST), che può continuare nei record CONTINUE (0x003c).
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
    if (id === 0x0809 && body.readUInt16LE(2) === 0x0010 && ++foglio > 1) break; // solo il primo foglio
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

/** Zona principale (il numero più basso) e se il comune è diviso tra zone con numeri diversi. */
function leggiCodice(codice) {
  const numeri = (codice.match(/[1-4]/g) ?? []).map(Number);
  if (!numeri.length) throw new Error(`Codice di zona sconosciuto: ${codice}`);
  return { zona: Math.min(...numeri), diviso: new Set(numeri).size > 1, parti: codice.includes('-') };
}

/** Distanza in superficie tra due punti (km). */
function distanzaKm(lat1, lon1, lat2, lon2) {
  const rad = (d) => (d * Math.PI) / 180;
  const h = Math.sin(rad(lat2 - lat1) / 2) ** 2 + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(rad(lon2 - lon1) / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.min(1, Math.sqrt(h)));
}
const quantile = (xs, q) => {
  const s = [...xs].sort((a, b) => a - b);
  return s[Math.min(s.length - 1, Math.floor(q * (s.length - 1)))];
};
const arrot = (v, d) => Math.round(v * 10 ** d) / 10 ** d;

/* ---------- 1) Elenco DPC dei comuni con la zona (maggio 2025) ---------- */

const csvDpc = (await get(URL_CSV_DPC, 'classificazione-sismica-aggiornata-maggio-2025.csv')).toString('utf8').replace(/^﻿/, '');
const [testata, ...righeDpc] = csvDpc.trim().split(/\r?\n/);
const colonne = testata.split(';');
const atteso = ['REGIONE', 'PROV_CITTA_METROPOLITANA', 'SIGLA_PROV', 'COMUNE', 'COD_ISTAT_COMUNE', 'ZONA_SISMICA'];
if (colonne.join(';') !== atteso.join(';')) throw new Error(`Colonne del CSV DPC cambiate: ${testata}`);
const comuni = righeDpc.map((riga) => {
  const [regione, , sigla, comune, istat, codice] = riga.split(';').map((s) => s.trim());
  // Il Trentino-Alto Adige ha due atti, uno per Provincia autonoma.
  const ente = regione === 'Trentino-Alto Adige' ? (sigla === 'BZ' ? 'Provincia autonoma di Bolzano' : 'Provincia autonoma di Trento') : regione;
  return { regione, ente, sigla, comune, istat: istat.padStart(6, '0'), codice, ...leggiCodice(codice) };
});
if (new Set(comuni.map((c) => c.istat)).size !== comuni.length) throw new Error('Codici ISTAT ripetuti nel CSV DPC');

// Controllo: è lo stesso elenco che usa il sito?
const sito = JSON.parse(fs.readFileSync(SITO, 'utf8')).comuni;
const chiaveDpc = new Set(comuni.map((c) => `${c.comune};${c.sigla};${c.codice}`));
const diversiDalSito = sito.filter((r) => !chiaveDpc.has(r)).length + Math.abs(sito.length - comuni.length);

/* ---------- 2) Atti regionali (tabella DPC) ---------- */

await get(URL_ATTI_DPC, 'normativa-regionale-di-classificazione-sismica-maggio-2025.pdf');
const attiInvariati = impronte['normativa-regionale-di-classificazione-sismica-maggio-2025.pdf'] === SHA_ATTI;
if (!attiInvariati) console.warn('ATTENZIONE: la tabella DPC degli atti regionali è cambiata: ricontrolla la trascrizione ATTI.');
for (const ente of new Set(comuni.map((c) => c.ente))) if (!ATTI[ente]) throw new Error(`Manca l'atto di: ${ente}`);

/* ---------- 3) Popolazione ISTAT al 1° gennaio 2025 ---------- */

const zipIstat = unzip(await get(URL_ISTAT, 'POSAS_2025_it_Comuni.zip'));
const nomeCsvIstat = Object.keys(zipIstat).find((k) => k.toLowerCase().endsWith('.csv'));
const righeIstat = zipIstat[nomeCsvIstat].toString('utf8').replace(/^﻿/, '').split(/\r?\n/);
if (!/1° gennaio 2025/.test(righeIstat[0])) throw new Error(`Il file ISTAT non è quello del 1° gennaio 2025: ${righeIstat[0]}`);
const testataIstat = righeIstat[1].split(';').map((s) => s.replace(/"/g, ''));
const iCodice = testataIstat.indexOf('Codice comune');
const iEta = testataIstat.indexOf('Età');
const iTotale = testataIstat.indexOf('Totale');
const popolazione = new Map();
const nomiIstat = new Map();
for (const riga of righeIstat.slice(2)) {
  const c = riga.split(';').map((s) => s.replace(/"/g, ''));
  if (c[iEta] !== '999') continue;
  popolazione.set(c[iCodice], Number(c[iTotale]));
  nomiIstat.set(c[iCodice], c[iCodice + 1]);
}
const popIstatTotale = [...popolazione.values()].reduce((a, b) => a + b, 0);
const senzaPopolazione = comuni.filter((c) => !popolazione.has(c.istat)).map((c) => `${c.comune} (${c.sigla})`);
for (const c of comuni) c.pop = popolazione.get(c.istat) ?? 0;
const nomiDiversi = comuni.filter((c) => nomiIstat.has(c.istat) && nomiIstat.get(c.istat) !== c.comune).map((c) => `${c.comune} / ${nomiIstat.get(c.istat)}`);

/* ---------- 4) OPCM 3274/2003, Allegato A ---------- */

const xls = leggiXls(await get(URL_OPCM3274, 'all_1_Com_Class.xls'));
const allegato = xls
  .filter((r) => r && /^\d{7,8}$/.test(String(r[0] ?? '').trim()))
  .map((r) => ({
    istat2001: String(r[0]).trim().padStart(8, '0'),
    // «(1)» segna i comuni nati dopo il 1984 (senza categoria precedente): la nota si toglie dal nome.
    comune: String(r[1]).replace(/\s*\(\d\)\s*$/, '').trim(),
    nuovo: /\(\d\)\s*$/.test(String(r[1])),
    cat1984: String(r[2] ?? '').trim(),
    proposta1998: String(r[3] ?? '').trim(),
    zona2003: Number(r[4]),
  }));
const CATEGORIE = ['I', 'II', 'III', 'N.C.'];
const contaPer = (xs, k, valori) => valori.map((v) => xs.filter((x) => x[k] === v).length);
const cat1984 = contaPer(allegato, 'cat1984', CATEGORIE);
const proposta1998 = contaPer(allegato, 'proposta1998', CATEGORIE);
const zone2003 = contaPer(allegato, 'zona2003', [1, 2, 3, 4]);
const passaggi = Object.fromEntries(CATEGORIE.map((cat) => [cat, contaPer(allegato.filter((x) => x.cat1984 === cat), 'zona2003', [1, 2, 3, 4])]));
const senzaCategoria = allegato.filter((x) => !CATEGORIE.includes(x.cat1984));
if (zone2003.reduce((a, b) => a + b, 0) !== allegato.length) throw new Error('Allegato A: zone 2003 non valide');

/* ---------- 5) INGV MPS04: la griglia ---------- */

const zipMps = unzip(await get(URL_MPS04, 'OPCM3519_1B_ag_005_txt.zip'));
const nomeMps = Object.keys(zipMps).find((k) => k.toLowerCase().endsWith('.txt'));
const punti = zipMps[nomeMps]
  .toString('latin1')
  .trim()
  .split(/\r?\n/)
  .slice(1)
  .map((r) => r.trim().split(/\s+/).map(Number))
  .filter((r) => r.length >= 6 && r.every(Number.isFinite))
  .map(([id, lon, lat, ag, p16, p84]) => ({ id, lon, lat, ag, p16, p84 }));
// Distanza dal punto più vicino, per ogni punto (celle di 0,1° per non confrontare tutti con tutti).
const celle = new Map();
const cella = (lat, lon) => `${Math.floor(lat * 10)},${Math.floor(lon * 10)}`;
for (const p of punti) {
  const k = cella(p.lat, p.lon);
  if (!celle.has(k)) celle.set(k, []);
  celle.get(k).push(p);
}
const vicini = punti.map((p) => {
  let min = Infinity;
  const [a, b] = [Math.floor(p.lat * 10), Math.floor(p.lon * 10)];
  for (let i = -1; i <= 1; i++)
    for (let j = -1; j <= 1; j++)
      for (const q of celle.get(`${a + i},${b + j}`) ?? []) if (q !== p) min = Math.min(min, distanzaKm(p.lat, p.lon, q.lat, q.lon));
  return min;
});
// I punti di una stessa «riga» della griglia hanno latitudini quasi uguali (la griglia è a passo costante in km, e le
// righe scendono di poco verso est): li mettiamo in righe da nord a sud (nuova riga quando la latitudine scende di più
// di mezzo passo, 0,025°) e in ogni riga da ovest a est.
const righeBlocco = [];
for (const p of punti
  .filter((p) => p.lat >= BLOCCO.minlat && p.lat <= BLOCCO.maxlat && p.lon >= BLOCCO.minlon && p.lon <= BLOCCO.maxlon)
  .sort((a, b) => b.lat - a.lat)) {
  const ultima = righeBlocco.at(-1);
  if (ultima && ultima[0].lat - p.lat < 0.025) ultima.push(p);
  else righeBlocco.push([p]);
}
const colonneBlocco = righeBlocco[0]?.length ?? 0;
if (!colonneBlocco || righeBlocco.some((r) => r.length !== colonneBlocco)) throw new Error('Il blocco di punti MPS04 non è una griglia regolare: cambia BLOCCO');
const blocco = righeBlocco.flatMap((r) => r.sort((a, b) => a.lon - b.lon));

// I punti con i valori più alti della mappa (ag oltre 0,275 g, la soglia usata da Peruzza & Pessina 2016): per dire
// nel testo dove sono, con le coordinate.
const SOGLIA_ALTI = 0.275;
const piuAlti = punti.filter((p) => p.ag > SOGLIA_ALTI).sort((a, b) => b.ag - a.ag || b.lat - a.lat);

/* ---------- Elenchi regionali uguali a quello del 2003 ---------- */

// Per ogni ente, quanti comuni di oggi hanno ancora la zona dell'Allegato A del 2003. L'unione è sul nome del comune
// dentro la stessa regione (nell'Allegato A le prime due cifre del codice ISTAT sono la regione): i codici delle
// province sono cambiati dal 2001, i nomi quasi mai. I comuni che non si trovano (nati, uniti o rinominati) si contano a parte.
const norm = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z]/g, '');
const CODICE_REGIONE = {
  Piemonte: '01', "Valle d'Aosta": '02', Lombardia: '03', 'Trentino-Alto Adige': '04', Veneto: '05', 'Friuli-Venezia Giulia': '06',
  Liguria: '07', 'Emilia-Romagna': '08', Toscana: '09', Umbria: '10', Marche: '11', Lazio: '12', Abruzzo: '13', Molise: '14',
  Campania: '15', Puglia: '16', Basilicata: '17', Calabria: '18', Sicilia: '19', Sardegna: '20',
};
for (const c of comuni) if (!CODICE_REGIONE[c.regione]) throw new Error(`Regione sconosciuta: ${c.regione}`);
const allegatoPerChiave = new Map();
for (const x of allegato) {
  const k = `${x.istat2001.slice(0, 2)};${norm(x.comune)}`;
  allegatoPerChiave.set(k, allegatoPerChiave.has(k) ? null : x);
}
const confronto2003 = {};
for (const c of comuni) {
  const a = allegatoPerChiave.get(`${CODICE_REGIONE[c.regione]};${norm(c.comune)}`);
  const r = (confronto2003[c.ente] ??= { trovati: 0, uguali: 0, nonTrovati: 0 });
  if (!a) r.nonTrovati++;
  else {
    r.trovati++;
    if (!c.diviso && !c.parti && c.codice === String(a.zona2003)) r.uguali++;
  }
}

/* ---------- Riassunti ---------- */

const Z = [1, 2, 3, 4];
const somma = (xs) => xs.reduce((a, b) => a + b, 0);
const interi = comuni.filter((c) => !c.diviso);
const divisi = comuni.filter((c) => c.diviso);
const codici = Object.fromEntries(
  [...new Set(comuni.map((c) => c.codice))].sort((a, b) => a.localeCompare(b, 'it')).map((k) => [k, comuni.filter((c) => c.codice === k).length]),
);

const enti = [...new Set(comuni.map((c) => c.ente))].sort((a, b) => a.localeCompare(b, 'it'));
const regioni = enti.map((ente) => {
  const xs = comuni.filter((c) => c.ente === ente);
  const [tipo, numero, data] = ATTI[ente];
  const cod = {};
  for (const k of Object.keys(codici)) if (xs.some((c) => c.codice === k)) cod[k] = xs.filter((c) => c.codice === k).length;
  return {
    nome: ente,
    atto: { tipo, numero, data },
    comuni: xs.length,
    zone: Z.map((z) => xs.filter((c) => c.zona === z).length),
    pop: Z.map((z) => somma(xs.filter((c) => c.zona === z && !c.diviso).map((c) => c.pop))),
    popDivisi: somma(xs.filter((c) => c.diviso).map((c) => c.pop)),
    codici: cod,
    // Comuni ritrovati nell'Allegato A del 2003 e, tra questi, quanti hanno lo stesso codice di allora (solo numero).
    confronto2003: confronto2003[ente],
  };
});

const trovaAllegato = (nome) => {
  const xs = allegato.filter((x) => x.comune === nome);
  if (xs.length !== 1) throw new Error(`Allegato A: ${xs.length} comuni con il nome ${nome}`);
  return xs[0];
};
const esempi = ESEMPI.map(([nome, sigla]) => {
  const oggi = comuni.find((c) => c.comune === nome && c.sigla === sigla);
  if (!oggi) throw new Error(`CSV DPC: manca ${nome} (${sigla})`);
  const a = trovaAllegato(nome);
  return { comune: nome, sigla, regione: oggi.regione, cat1984: a.cat1984, proposta1998: a.proposta1998, zona2003: a.zona2003, codice2025: oggi.codice, zona2025: oggi.zona, pop2025: oggi.pop };
});

fs.writeFileSync(
  OUT,
  `${JSON.stringify({
    titolo: 'Zone sismiche dei comuni italiani: oggi (DPC, maggio 2025), nel 2003 (OPCM 3274) e nel 1984, con la popolazione ISTAT al 1° gennaio 2025',
    scaricato: new Date().toISOString().slice(0, 10),
    fonti: {
      zone: {
        nome: 'Dipartimento della Protezione Civile — Classificazione sismica aggiornata a maggio 2025 (elenco dei comuni)',
        url: URL_CSV_DPC,
        pagina: URL_PAGINA_DPC,
        licenza: 'CC BY 4.0 — Fonte: Dipartimento della Protezione Civile-Presidenza del Consiglio dei Ministri',
      },
      atti: { nome: 'Dipartimento della Protezione Civile — Normativa regionale di classificazione sismica (atti di recepimento al 31/05/2025)', url: URL_ATTI_DPC, pagina: URL_PAGINA_DPC },
      popolazione: { nome: 'ISTAT — Popolazione residente per comune al 1° gennaio 2025 (POSAS)', url: URL_ISTAT, licenza: 'CC BY 4.0' },
      opcm3274: {
        nome: 'OPCM 3274 del 20 marzo 2003, Allegato A «Classificazione sismica dei comuni italiani» (GU n. 105 dell’8 maggio 2003, S.O. 72; copia .xls pubblicata dall’INGV)',
        url: URL_OPCM3274,
        pagina: URL_PAGINA_OPCM3274,
      },
      mps04: {
        nome: 'INGV, Gruppo di Lavoro MPS (2004), Mappa di pericolosità sismica MPS04 (OPCM 3519/2006, Allegato 1B), griglia 0,05°',
        url: URL_MPS04,
        pagina: URL_PAGINA_MPS04,
        doi: 'https://doi.org/10.13127/sh/mps04/ag',
        licenza: 'CC BY 4.0 (l’INGV chiede di non usarla a fini commerciali)',
      },
    },
    richieste: [...new Set(richieste)],
    impronteSha256: impronte,
    controlli: {
      comuni: comuni.length,
      ugualeAlSito: diversiDalSito === 0,
      righeDiverseDalSito: diversiDalSito,
      senzaPopolazione,
      nomiDiversiIstat: nomiDiversi,
      // Comuni e abitanti nel file ISTAT: se coincidono con l'elenco DPC, l'unione non perde nessuno.
      comuniIstat: popolazione.size,
      popIstatTotale,
      attiInvariati,
    },
    oggi: {
      comuni: comuni.length,
      // Comuni per zona principale (la più pericolosa del codice), compresi i divisi.
      zone: Z.map((z) => comuni.filter((c) => c.zona === z).length),
      popTotale: somma(comuni.map((c) => c.pop)),
      // Popolazione per zona dei soli comuni con un'unica zona (anche con sottozone della stessa zona).
      pop: Z.map((z) => somma(interi.filter((c) => c.zona === z).map((c) => c.pop))),
      divisi: divisi.map((c) => ({ comune: c.comune, sigla: c.sigla, codice: c.codice, zona: c.zona, pop: c.pop })),
      // Comuni con più sottozone dello stesso numero (es. 2A-2B): contano nella loro zona.
      sottozoneStessaZona: comuni.filter((c) => c.parti && !c.diviso).map((c) => ({ comune: c.comune, sigla: c.sigla, codice: c.codice })),
      codici,
    },
    regioni,
    storia: {
      comuni: allegato.length,
      nuoviSenzaCategoria: senzaCategoria.length,
      categorie: CATEGORIE,
      cat1984,
      proposta1998,
      zone2003,
      // Da ogni categoria del 1984, quanti comuni sono finiti in zona 1, 2, 3, 4 nel 2003.
      passaggi,
    },
    esempi,
    griglia: {
      punti: punti.length,
      passoKmMediano: arrot(quantile(vicini, 0.5), 3),
      passoKmP05: arrot(quantile(vicini, 0.05), 3),
      passoKmP95: arrot(quantile(vicini, 0.95), 3),
      agMax: Math.max(...punti.map((p) => p.ag)),
      // I punti con ag oltre 0,275 g, dal più alto: [lon, lat, ag].
      sogliaAlti: SOGLIA_ALTI,
      piuAlti: piuAlti.map((p) => [p.lon, p.lat, p.ag]),
      blocco: {
        box: BLOCCO,
        luogo: 'basso Molise',
        righe: righeBlocco.length,
        colonne: colonneBlocco,
        legenda: ['lon', 'lat', 'ag', 'p16', 'p84'],
        punti: blocco.map((p) => [p.lon, p.lat, p.ag, p.p16, p.p84]),
      },
    },
  })}\n`,
);

console.log('Comuni DPC', comuni.length, 'uguale al sito:', diversiDalSito === 0, 'senza popolazione:', senzaPopolazione.length);
console.log('Zone oggi', Z.map((z) => comuni.filter((c) => c.zona === z).length), 'divisi', divisi.map((c) => c.comune));
console.log('Popolazione', Z.map((z) => somma(interi.filter((c) => c.zona === z).map((c) => c.pop))), 'divisi', somma(divisi.map((c) => c.pop)), 'totale', somma(comuni.map((c) => c.pop)));
console.log('Allegato A', allegato.length, '1984', cat1984, '1998', proposta1998, '2003', zone2003, 'N.C.→', passaggi['N.C.']);
console.log('Griglia', punti.length, 'passo mediano km', quantile(vicini, 0.5).toFixed(2), 'blocco', blocco.length);
console.log('Esempi', esempi);
console.log('Punti con ag oltre', SOGLIA_ALTI, piuAlti.map((p) => `${p.lat.toFixed(2)}N ${p.lon.toFixed(2)}E ${p.ag}`));
console.log('Uguali al 2003', confronto2003);
