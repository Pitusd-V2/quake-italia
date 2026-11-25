/**
 * Dati dell'articolo «I terremoti sono aumentati?» (contenuti/bozze/i-terremoti-sono-aumentati.mdx).
 * Uso: node scripts/build-aumentati-data.mjs     (CACHE_DIR=<cartella> riusa i file già scaricati)
 *
 * Due fonti, entrambe con licenza CC BY 4.0:
 *  A) il catalogo dell'INGV (ISIDe, servizio FDSN), 1985-2025, tutte le magnitudo, nel riquadro 35-48 N, 6-19 E
 *     (lo stesso di gr-italia.json e tempo-terremoto.json): una richiesta per anno, divisa a metà se tocca il limite
 *     di 20.000 righe; una richiesta alla volta, con una pausa tra l'una e l'altra;
 *  B) il catalogo omogeneo HORUS (Lolli e altri 2020), 1960-oggi, con tutte le magnitudo convertite in magnitudo
 *     momento (Mw): un solo file zip.
 *
 * Cosa calcoliamo noi (non è un risultato pubblicato):
 *  1) per ogni anno del catalogo INGV: il totale, i conteggi sopra alcune soglie di magnitudo, il tipo di magnitudo
 *     (Md, ML, Mw, altre), le scosse ai Campi Flegrei (entro 8 km dal centro della caldera) e quelle delle quattro grandi
 *     sequenze con scosse di magnitudo 6 o quasi (Umbria-Marche 1997, L'Aquila 2009, Emilia 2012, Italia centrale
 *     2016-2017: entro 30 km e 365 giorni dopo le scosse principali, prese dal catalogo stesso);
 *  2) dal 16 aprile 2005 (nuova rete e magnitudo ML), i terremoti «indipendenti» di magnitudo 2,5 o più: togliamo le
 *     repliche con il metodo di Gardner e Knopoff (1974), come in build-weather-myth-data.mjs;
 *  3) per HORUS, solo terraferma italiana (colonna Geo-Ita), esclusi gli eventi segnati come non terremoti: i conteggi
 *     per anno a Mw 2,5, 3, 3,5, 4, 4,5 e 5 o più, tutti e senza repliche (stesso metodo), e quelli ai Campi Flegrei.
 *     Le soglie di completezza (quando un conteggio è affidabile) sono quelle pubblicate dagli autori: le applica
 *     src/learn/facts/aumentati.ts, non questo script.
 */
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

const INGV = 'https://webservices.ingv.it/fdsnws/event/1/query';
const HORUS_URL = 'https://horus.bo.ingv.it/DataFolder/HORUS_Ita_Catalog.zip';
const HORUS_FILE = 'HORUS_Ita_Catalog.txt'; // la versione principale (con la seconda cifra decimale casuale: vedi README)
const OUT = new URL('../src/data/learn/aumentati.json', import.meta.url);
const UA = 'QuakeItalia-data/1.0 (+https://github.com/Pitusd-V2/quake-italia)';
const CACHE = process.env.CACHE_DIR;
if (CACHE) fs.mkdirSync(CACHE, { recursive: true });

const LIMIT = 20000;
const BOX = { minlat: '35', maxlat: '48', minlon: '6', maxlon: '19' };
const ANNI = [1985, 2025]; // solo anni completi
const HORUS_ANNI = [1960, 2025];
const PAUSA_MS = 5000;
const CF = { lat: 40.827, lon: 14.139, raggioKm: 8 }; // come la fonte FDSN di campi-flegrei.mdx
const SEQ = { raggioKm: 30, giorni: 365 };
const NUOVA_RETE = Date.parse('2005-04-16T00:00:00Z');
const SOGLIE_H = [2.5, 3, 3.5, 4, 4.5, 5];

/**
 * Le grandi sequenze. Per ogni scossa principale scriviamo solo il giorno (UTC) e un riquadro largo dove cercarla:
 * coordinate, ora e magnitudo si prendono dal catalogo (la scossa più forte di quel giorno nel riquadro).
 */
const SEQUENZE = [
  // Umbria-Marche 1997: scosse principali del 26 settembre (due, la più forte la seconda).
  { id: 'umbriaMarche1997', nome: 'Umbria-Marche 1997', principali: [['1997-09-26', [42.7, 43.4, 12.5, 13.2]]] },
  { id: 'aquila2009', nome: 'L’Aquila 2009', principali: [['2009-04-06', [41.8, 42.8, 12.8, 14.0]]] },
  {
    id: 'emilia2012',
    nome: 'Emilia 2012',
    principali: [
      ['2012-05-20', [44.5, 45.2, 10.5, 11.8]],
      ['2012-05-29', [44.5, 45.2, 10.5, 11.8]],
    ],
  },
  {
    id: 'centroItalia2016',
    nome: 'Italia centrale 2016-2017',
    principali: [
      ['2016-08-24', [42.3, 43.2, 12.7, 13.7]],
      ['2016-10-26', [42.3, 43.2, 12.7, 13.7]],
      ['2016-10-30', [42.3, 43.2, 12.7, 13.7]],
      ['2017-01-18', [42.3, 43.2, 12.7, 13.7]],
    ],
  },
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const oggi = new Date().toISOString().slice(0, 10);
const scaricato = { fdsn: null, horus: null };
const piuRecente = (a, b) => (!a || b > a ? b : a);
let ultimaRichiesta = 0;

/** Una richiesta alla volta, con la pausa; su 429 e 5xx aspetta a lungo. Con CACHE_DIR salva e riusa. */
async function get(url, cacheName, { binario = false, chiave } = {}) {
  const file = CACHE ? path.join(CACHE, cacheName) : null;
  if (file && fs.existsSync(file)) {
    scaricato[chiave] = piuRecente(scaricato[chiave], fs.statSync(file).mtime.toISOString().slice(0, 10));
    return binario ? fs.readFileSync(file) : fs.readFileSync(file, 'utf8');
  }
  for (let tentativo = 1; tentativo <= 4; tentativo++) {
    const attesa = ultimaRichiesta + PAUSA_MS - Date.now();
    if (attesa > 0) await sleep(attesa);
    ultimaRichiesta = Date.now();
    const res = await fetch(url, { headers: { 'User-Agent': UA } }).catch(() => null);
    if (res && (res.ok || res.status === 204)) {
      const body = res.status === 204 ? Buffer.alloc(0) : Buffer.from(await res.arrayBuffer());
      if (file) fs.writeFileSync(file, body);
      scaricato[chiave] = piuRecente(scaricato[chiave], oggi);
      return binario ? body : body.toString('utf8');
    }
    const lunga = !res || res.status === 429 || res.status >= 500;
    console.warn(`Risposta ${res?.status ?? 'assente'} per ${url}: riprovo`);
    await sleep(lunga ? 60000 * tentativo : 5000);
  }
  throw new Error(`Non risponde: ${url}`);
}

function haversineKm(a, b) {
  const r = (d) => (d * Math.PI) / 180;
  const h = Math.sin(r(b.lat - a.lat) / 2) ** 2 + Math.cos(r(a.lat)) * Math.cos(r(b.lat)) * Math.sin(r(b.lon - a.lon) / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
}

/* ---------- Repliche: declustering di Gardner e Knopoff (1974), come in build-weather-myth-data.mjs ---------- */

/** Finestre spazio-tempo di Gardner e Knopoff, nella forma usata da van Stiphout e altri (2012, CORSSA). */
const gkKm = (m) => 10 ** (0.1238 * m + 0.983);
const gkDays = (m) => (m >= 6.5 ? 10 ** (0.032 * m + 2.7389) : 10 ** (0.5409 * m - 0.547));

/**
 * Dalla scossa più forte alla più debole: tutto quello che cade nella sua finestra è una replica (o un foreshock).
 * Lo stato di una scossa di magnitudo M dipende solo dalle scosse di magnitudo ≥ M: un solo calcolo sugli eventi
 * sopra 2,5 vale per tutte le soglie da 2,5 in su. `events` è ordinato per tempo; restituisce un array di 0/1.
 */
function dipendenti(events) {
  const dep = new Uint8Array(events.length);
  const order = events.map((_, i) => i).sort((a, b) => events[b].mag - events[a].mag || events[a].time - events[b].time);
  const times = events.map((e) => e.time);
  const lowerBound = (t) => {
    let lo = 0;
    let hi = times.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (times[mid] < t) lo = mid + 1;
      else hi = mid;
    }
    return lo;
  };
  for (const i of order) {
    if (dep[i]) continue;
    const e = events[i];
    const dt = gkDays(e.mag) * 86_400_000;
    const km = gkKm(e.mag);
    for (let j = lowerBound(e.time - dt); j < events.length && times[j] <= e.time + dt; j++) {
      if (j === i || dep[j] || events[j].mag > e.mag) continue;
      if (haversineKm(e, events[j]) <= km) dep[j] = 1;
    }
  }
  return dep;
}

/* ---------- A) Catalogo INGV (servizio FDSN) ---------- */

const richieste = [];

/** Scarica un intervallo; se tocca il limite di 20.000 righe lo divide a metà. */
async function fetchRange(from, to) {
  const params = { format: 'text', orderby: 'time-asc', limit: String(LIMIT), ...BOX, starttime: from, endtime: to };
  const url = `${INGV}?${new URLSearchParams(params)}`;
  const text = await get(url, `ingv_${from}_${to}.txt`.replace(/:/g, ''), { chiave: 'fdsn' });
  const rows = text.trim() ? text.trim().split(/\r?\n/).filter((l) => !l.startsWith('#')) : [];
  if (rows.length >= LIMIT) {
    const mid = new Date((Date.parse(`${from}Z`) + Date.parse(`${to}Z`)) / 2).toISOString().slice(0, 19);
    return [...(await fetchRange(from, mid)), ...(await fetchRange(mid, to))];
  }
  richieste.push(url);
  console.log(`${from} → ${to}: ${rows.length} righe`);
  return rows;
}

const tipoMag = (t) => {
  const s = (t ?? '').trim().toLowerCase();
  if (s === 'md') return 'md';
  if (s === 'ml') return 'ml';
  if (s.startsWith('mw')) return 'mw';
  return 'altre';
};

const visti = new Set();
const eventi = [];
const nonTerremotiAnno = {};
for (let y = ANNI[0]; y <= ANNI[1]; y++) {
  for (const r of await fetchRange(`${y}-01-01T00:00:00`, `${y + 1}-01-01T00:00:00`)) {
    const c = r.split('|');
    const time = Date.parse(`${c[1]}Z`);
    if (!Number.isFinite(time) || visti.has(c[0])) continue;
    const anno = new Date(time).getUTCFullYear();
    if (anno < ANNI[0] || anno > ANNI[1]) continue;
    visti.add(c[0]);
    // Esplosioni, cave e simili: il catalogo le segna (EventType); non le contiamo tra i terremoti.
    const tipo = (c[13] ?? '').trim();
    if (tipo && tipo !== 'earthquake') {
      nonTerremotiAnno[anno] = (nonTerremotiAnno[anno] ?? 0) + 1;
      continue;
    }
    eventi.push({ id: c[0], time, anno, lat: +c[2], lon: +c[3], magType: c[9], mag: c[10] === '' ? NaN : +c[10] });
  }
}
eventi.sort((a, b) => a.time - b.time);
console.log(`Terremoti INGV ${ANNI[0]}-${ANNI[1]}: ${eventi.length} (esclusi ${Object.values(nonTerremotiAnno).reduce((a, b) => a + b, 0)} eventi di altro tipo)`);

/* Scosse principali delle sequenze, prese dal catalogo. */
const giorno = 86_400_000;
const sequenze = SEQUENZE.map((s) => ({
  id: s.id,
  nome: s.nome,
  principali: s.principali.map(([g, [la0, la1, lo0, lo1]]) => {
    const t0 = Date.parse(`${g}T00:00:00Z`);
    const cand = eventi.filter((e) => e.time >= t0 && e.time < t0 + giorno && e.lat >= la0 && e.lat <= la1 && e.lon >= lo0 && e.lon <= lo1 && Number.isFinite(e.mag));
    if (!cand.length) throw new Error(`Nessuna scossa il ${g} nel riquadro`);
    const m = cand.reduce((a, b) => (b.mag > a.mag ? b : a));
    return { id: m.id, tempo: new Date(m.time).toISOString().slice(0, 19), lat: m.lat, lon: m.lon, mag: m.mag, tipoMag: m.magType };
  }),
}));
const principali = sequenze.flatMap((s) => s.principali.map((p) => ({ ...p, seq: s.id, time: Date.parse(`${p.tempo}Z`) })));
/** A quale grande sequenza appartiene una scossa (o null). */
function inSequenza(e) {
  for (const p of principali) {
    if (e.time >= p.time && e.time <= p.time + SEQ.giorni * giorno && haversineKm(e, p) <= SEQ.raggioKm) return p.seq;
  }
  return null;
}
const aiCampiFlegrei = (e) => haversineKm(e, CF) <= CF.raggioKm;

/* Repliche dal 16 aprile 2005, sopra 2,5. */
const dal2005 = eventi.filter((e) => e.time >= NUOVA_RETE && e.mag >= 2.5);
const depFdsn = dipendenti(dal2005);
const indip = new Set(dal2005.filter((_, i) => !depFdsn[i]).map((e) => e.id));

const LEG_FDSN = [
  'anno', 'totale', 'm15', 'm2', 'm25', 'm3', 'm4', 'm5', 'md', 'ml', 'mw', 'altre', 'senzaMag', 'nonTerremoti',
  'cf', 'cf25', 'seq', 'seq25', 'seq4', 'resto', 'resto25', 'resto4', 'ind25', 'ind3', 'ind4', 'magMax',
];
const perSeqAnno = {};
const righeFdsn = [];
for (let y = ANNI[0]; y <= ANNI[1]; y++) {
  const r = Object.fromEntries(LEG_FDSN.map((k) => [k, 0]));
  r.anno = y;
  r.nonTerremoti = nonTerremotiAnno[y] ?? 0;
  r.magMax = -Infinity;
  if (y < 2005) r.ind25 = r.ind3 = r.ind4 = null;
  righeFdsn.push(r);
}
for (const e of eventi) {
  const r = righeFdsn[e.anno - ANNI[0]];
  const m = e.mag;
  r.totale++;
  if (!Number.isFinite(m)) r.senzaMag++;
  if (m >= 1.5) r.m15++;
  if (m >= 2) r.m2++;
  if (m >= 2.5) r.m25++;
  if (m >= 3) r.m3++;
  if (m >= 4) r.m4++;
  if (m >= 5) r.m5++;
  if (m > r.magMax) r.magMax = m;
  r[tipoMag(e.magType)]++;
  const cf = aiCampiFlegrei(e);
  const sq = cf ? null : inSequenza(e);
  if (cf) {
    r.cf++;
    if (m >= 2.5) r.cf25++;
  } else if (sq) {
    r.seq++;
    if (m >= 2.5) r.seq25++;
    if (m >= 4) r.seq4++;
    perSeqAnno[sq] ??= {};
    perSeqAnno[sq][e.anno] = (perSeqAnno[sq][e.anno] ?? 0) + 1;
  } else {
    r.resto++;
    if (m >= 2.5) r.resto25++;
    if (m >= 4) r.resto4++;
  }
  if (indip.has(e.id) && e.anno >= 2005) {
    r.ind25++;
    if (m >= 3) r.ind3++;
    if (m >= 4) r.ind4++;
  }
}
for (const r of righeFdsn) r.magMax = Number.isFinite(r.magMax) ? r.magMax : null;
for (const s of sequenze) s.perAnno = perSeqAnno[s.id] ?? {};
// Il 2005 a metà: dal 16 aprile (nuova rete) a fine anno, per non confondere i due periodi.
const meta2005 = { daNuovaRete: eventi.filter((e) => e.anno === 2005 && e.time >= NUOVA_RETE).length, primaNuovaRete: eventi.filter((e) => e.anno === 2005 && e.time < NUOVA_RETE).length };

/* ---------- B) HORUS ---------- */

/** Legge un file da uno zip (solo il metodo «deflate» o nessuna compressione: basta per questo archivio). */
function leggiDaZip(buf, nome) {
  let eocd = -1;
  for (let i = buf.length - 22; i >= Math.max(0, buf.length - 65_557); i--) {
    if (buf.readUInt32LE(i) === 0x06054b50) {
      eocd = i;
      break;
    }
  }
  if (eocd < 0) throw new Error('Zip non valido');
  const voci = buf.readUInt16LE(eocd + 10);
  let p = buf.readUInt32LE(eocd + 16);
  for (let k = 0; k < voci; k++) {
    if (buf.readUInt32LE(p) !== 0x02014b50) throw new Error('Indice dello zip non valido');
    const metodo = buf.readUInt16LE(p + 10);
    const dim = buf.readUInt32LE(p + 20);
    const lNome = buf.readUInt16LE(p + 28);
    const lExtra = buf.readUInt16LE(p + 30);
    const lComm = buf.readUInt16LE(p + 32);
    const off = buf.readUInt32LE(p + 42);
    const n = buf.toString('utf8', p + 46, p + 46 + lNome);
    if (n === nome) {
      const inizio = off + 30 + buf.readUInt16LE(off + 26) + buf.readUInt16LE(off + 28);
      const dati = buf.subarray(inizio, inizio + dim);
      if (metodo === 0) return dati.toString('latin1');
      if (metodo === 8) return zlib.inflateRawSync(dati).toString('latin1');
      throw new Error(`Compressione ${metodo} non gestita`);
    }
    p += 46 + lNome + lExtra + lComm;
  }
  throw new Error(`${nome} non trovato nello zip`);
}

const zip = await get(HORUS_URL, 'HORUS_Ita_Catalog.zip', { binario: true, chiave: 'horus' });
const testo = leggiDaZip(zip, HORUS_FILE);
const righeH = testo.split(/\r?\n/);
const intest = righeH[0].split('\t').map((s) => s.trim());
const ATTESE = ['Year', 'Mo', 'Da', 'Ho', 'Mi', 'Se', 'Lat', 'Lon', 'Depth', 'Mw', 'sigMw', 'Geo-Ita', 'Geo-CPTI15', 'Ev. type', 'Iside n.'];
ATTESE.forEach((c, i) => {
  if (intest[i] !== c) throw new Error(`Colonna ${i + 1} di HORUS: attesa «${c}», trovata «${intest[i]}»`);
});
const hEventi = [];
let hUltimo = 0;
let hNonTerremoti = 0;
for (const l of righeH.slice(1)) {
  if (!l.trim()) continue;
  const c = l.split('\t');
  const v = (i) => Number(c[i]);
  const anno = Math.round(v(0));
  const sec = v(5);
  const time = Date.UTC(anno, Math.round(v(1)) - 1, Math.round(v(2)), Math.round(v(3)), Math.round(v(4))) + sec * 1000;
  hUltimo = Math.max(hUltimo, time);
  if (anno < HORUS_ANNI[0] || anno > HORUS_ANNI[1]) continue;
  if ((c[13] ?? '').trim() === 'x') {
    hNonTerremoti++;
    continue;
  }
  const mag = v(9);
  if (!Number.isFinite(mag)) continue;
  hEventi.push({ time, anno, lat: v(6), lon: v(7), mag, ita: (c[11] ?? '').trim() === '*' });
}
hEventi.sort((a, b) => a.time - b.time);
console.log(`HORUS ${HORUS_ANNI[0]}-${HORUS_ANNI[1]}: ${hEventi.length} terremoti (esclusi ${hNonTerremoti} non terremoti)`);

// Repliche: su tutti gli eventi sopra 2,5 (anche in mare e fuori dalla terraferma, perché anche lì cadono repliche).
const hSopra = hEventi.filter((e) => e.mag >= 2.5);
const depH = dipendenti(hSopra);
const chiaveS = (s) => String(s).replace('.', '');
const LEG_H = ['anno', ...SOGLIE_H.map((s) => `w${chiaveS(s)}`), ...SOGLIE_H.map((s) => `ind${chiaveS(s)}`), 'cf25', 'cf3', 'cf4', 'tutteIta'];
const righeHorus = [];
for (let y = HORUS_ANNI[0]; y <= HORUS_ANNI[1]; y++) righeHorus.push({ ...Object.fromEntries(LEG_H.map((k) => [k, 0])), anno: y });
for (const e of hEventi) if (e.ita) righeHorus[e.anno - HORUS_ANNI[0]].tutteIta++;
hSopra.forEach((e, i) => {
  if (!e.ita) return;
  const r = righeHorus[e.anno - HORUS_ANNI[0]];
  for (const s of SOGLIE_H) {
    if (e.mag < s) continue;
    r[`w${chiaveS(s)}`]++;
    if (!depH[i]) r[`ind${chiaveS(s)}`]++;
  }
  if (aiCampiFlegrei(e)) {
    r.cf25++;
    if (e.mag >= 3) r.cf3++;
    if (e.mag >= 4) r.cf4++;
  }
});

/* ---------- Scrittura ---------- */

const compatta = (righe, leg) => righe.map((r) => leg.map((k) => r[k]));
fs.writeFileSync(
  OUT,
  `${JSON.stringify({
    titolo: 'Terremoti per anno nel catalogo INGV (1985-2025) e nel catalogo omogeneo HORUS (1960-2025)',
    fonti: {
      fdsn: {
        nome: 'INGV, Italian Seismological Instrumental and Parametric Database (ISIDe), servizio FDSN degli eventi',
        doi: 'https://doi.org/10.13127/ISIDe',
        licenza: 'CC BY 4.0',
      },
      horus: {
        nome: 'HORUS, Homogenized instRUmental Seismic catalog of Italy (Lolli, Randazzo, Vannucci e Gasperini 2020)',
        doi: 'https://doi.org/10.13127/HORUS',
        studio: 'https://doi.org/10.1785/0220200148',
        licenza: 'CC BY 4.0',
        file: `${HORUS_URL} → ${HORUS_FILE}`,
        ultimoEvento: new Date(hUltimo).toISOString().slice(0, 10),
      },
    },
    scaricato,
    richieste,
    parametri: {
      riquadro: BOX,
      anniFdsn: ANNI,
      anniHorus: HORUS_ANNI,
      campiFlegrei: CF,
      sequenze: SEQ,
      nuovaRete: '2005-04-16',
      repliche: 'Gardner e Knopoff (1974), finestre di van Stiphout e altri (2012); FDSN dal 16/4/2005 sopra M 2,5; HORUS sopra Mw 2,5',
      horus: 'solo terraferma italiana (colonna Geo-Ita), esclusi gli eventi di tipo «x» (non terremoti)',
      anno: 'anno UTC dell’ora origine',
    },
    sequenze,
    meta2005,
    fdsn: { legenda: LEG_FDSN, anni: compatta(righeFdsn, LEG_FDSN) },
    horus: { legenda: LEG_H, nonTerremoti: hNonTerremoti, anni: compatta(righeHorus, LEG_H) },
  })}\n`,
);

for (const r of righeFdsn) console.log(r.anno, r.totale, 'M≥2,5', r.m25, 'M≥4', r.m4, 'CF', r.cf, 'seq', r.seq, 'ind≥2,5', r.ind25, 'ind≥4', r.ind4, `Md ${r.md} ML ${r.ml}`);
for (const r of righeHorus) console.log('HORUS', r.anno, 'Mw≥3', r.w3, 'Mw≥4', r.w4, 'ind≥4', r.ind4, 'ind≥3', r.ind3, 'ind≥2,5', r.ind25);
console.log(JSON.stringify(sequenze, null, 1));
console.log(`Scritto ${OUT.pathname}: ${richieste.length} richieste al servizio FDSN`);
