/**
 * Dati dell'articolo «Magnitudo e intensità» (contenuti/articoli/magnitudo-e-intensita.mdx).
 * Uso: node scripts/build-intensita-data.mjs     (CACHE_DIR=<cartella> riusa lo zip già scaricato)
 *
 * 1) Dal database «Hai Sentito Il Terremoto» dell'INGV (HSIT, versione 4, 2007–2024, licenza CC BY 4.0):
 *    le intensità MCS stimate per ogni comune dai questionari dei cittadini. Lo zip contiene un CSV e un readme;
 *    lo apriamo con zlib, senza librerie.
 * 2) Dal catalogo INGV (webservice FDSN): i parametri delle quattro scosse del grafico, solo per controllo e per il nome
 *    del luogo. I calcoli usano i parametri scritti nel database HSIT (che vengono da ISIDe).
 *
 * Cosa calcoliamo noi (non è nel database):
 * - la distanza di ogni comune (municipio, coordinate ISTAT) dall'epicentro, con la formula dell'haversine;
 * - l'intensità prevista dalla formula che il sito usa per «Si è sentita qui?» (Allen, Wald & Worden 2012, versione con
 *   distanza ipocentrale, la stessa di src/lib/impact.ts: un test controlla che restino uguali);
 * - le mediane per fasce di distanza e lo scarto tra intensità HSIT e formula.
 *
 * Nel database l'intensità 1 vuol dire «non sentito» (nessuno, o quasi, l'ha avvertita), −9 «nessun dato valido».
 * Il confronto con la formula tiene anche i comuni «non sentito»: per le scosse sotto magnitudo 5 toglierli farebbe
 * sembrare che la formula stimi troppo poco, perché resterebbero solo i comuni dove qualcuno l'ha sentita (lo mostriamo
 * a parte, in «soloSentiti»; per le scosse più forti cambia poco).
 */
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

const ZIP_URL = 'https://www.hsit.it/DOI/MacroseismicIntensities_2007-2024_HSIT_I.4.zip';
const FDSN = 'https://webservices.ingv.it/fdsnws/event/1/query';
const OUT = new URL('../src/data/learn/intensita.json', import.meta.url);
const UA = 'QuakeItalia-data/1.0 (+https://github.com/Pitusd-V2/quake-italia)';
const CACHE = process.env.CACHE_DIR;
if (CACHE) fs.mkdirSync(CACHE, { recursive: true });

/** Le quattro scosse del grafico: identificativi del catalogo INGV (gli stessi del database HSIT). */
const EVENTI = [
  { id: '16796811', chiave: 'ischia', nome: 'Ischia, 21 agosto 2017' },
  { id: '772691', chiave: 'emilia', nome: 'Emilia, 20 maggio 2012' },
  { id: '8863681', chiave: 'norcia', nome: 'Norcia, 30 ottobre 2016' },
  { id: '33239591', chiave: 'policastro', nome: 'Golfo di Policastro, 31 ottobre 2022' },
];
/** Per i punti e le mediane: solo i comuni con almeno 3 questionari (con 1 o 2 il valore è troppo incerto). */
const Q_MIN = 3;
/** Il confronto con la formula: scosse nella crosta, comuni a non più di 300 km dall'ipocentro. */
const PROF_MAX = 40;
const DIST_MAX = 300;
/** Fasce di distanza dall'epicentro (km) per le mediane del grafico. */
const FASCE = [0, 3, 6, 10, 15, 20, 30, 50, 75, 100, 150, 200, 300, 450, 700, 1000];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Il giorno in cui i dati sono stati scaricati davvero: oggi, oppure la data del file già in cache. */
let scaricato = new Date().toISOString().slice(0, 10);

async function get(url, cacheName, binary = false) {
  const file = CACHE && cacheName ? path.join(CACHE, cacheName) : null;
  if (file && fs.existsSync(file)) {
    const giorno = fs.statSync(file).mtime.toISOString().slice(0, 10);
    if (giorno < scaricato) scaricato = giorno;
    return binary ? fs.readFileSync(file) : fs.readFileSync(file, 'utf8');
  }
  for (let tentativo = 0; tentativo < 3; tentativo++) {
    const res = await fetch(url, { headers: { 'User-Agent': UA } }).catch(() => null);
    if (res?.ok) {
      const body = binary ? Buffer.from(await res.arrayBuffer()) : await res.text();
      if (file) fs.writeFileSync(file, body);
      await sleep(400); // una richiesta alla volta, con calma
      return body;
    }
    await sleep(3000);
  }
  throw new Error(`Non risponde: ${url}`);
}

/** Legge i file di uno zip (solo metodo «stored» o «deflate», come quello dell'INGV). */
function unzip(buf) {
  // La directory centrale si trova partendo dal record finale (firma 0x06054b50), in fondo al file.
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

/** Distanza in superficie tra due punti (km), come distanceKm di src/lib/geo.ts. */
function distanzaKm(lat1, lon1, lat2, lon2) {
  const rad = (d) => (d * Math.PI) / 180;
  const h = Math.sin(rad(lat2 - lat1) / 2) ** 2 + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(rad(lon2 - lon1) / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.min(1, Math.sqrt(h)));
}

/**
 * La formula del sito (src/lib/impact.ts, intensityAt): Allen, Wald & Worden (2012), distanza ipocentrale r in km.
 * Ricopiata qui perché lo script gira senza TypeScript; src/learn/facts/intensita.test.ts controlla che coincida.
 */
export function formula(mag, r) {
  const rm = -0.209 + 2.042 * Math.exp(mag - 5);
  let i = 2.085 + 1.428 * mag - 1.402 * Math.log(Math.sqrt(r * r + rm * rm));
  if (r > 50) i += 0.078 * Math.log(r / 50);
  return Math.max(1, i);
}

const r1 = (v) => Math.round(v * 10) / 10;
const r2 = (v) => Math.round(v * 100) / 100;
function mediana(xs) {
  const s = [...xs].sort((a, b) => a - b);
  const m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}
function statistiche(scarti) {
  const n = scarti.length;
  const media = scarti.reduce((a, b) => a + b, 0) / n;
  const sd = Math.sqrt(scarti.reduce((a, b) => a + (b - media) ** 2, 0) / n);
  return { n, mediana: r2(mediana(scarti)), media: r2(media), sd: r2(sd), entro1: r1((100 * scarti.filter((x) => Math.abs(x) <= 1).length) / n) };
}

/* ---------- 1) Il database HSIT ---------- */

const zip = unzip(await get(ZIP_URL, 'hsit-I4.zip', true));
const nomeCsv = Object.keys(zip).find((k) => k.toLowerCase().endsWith('.csv'));
const nomeReadme = Object.keys(zip).find((k) => k.toLowerCase().endsWith('.pdf'));
const righe = zip[nomeCsv].toString('utf8').trim().split(/\r?\n/);
const intest = righe.shift().split(',');
const col = Object.fromEntries(intest.map((c, i) => [c, i]));
for (const c of ['IntensityMCS', 'QuestsNumberMCS', 'IntensityEMS', 'QuestsNumberEMS', 'MunicipalityName', 'MunicipalityLatitude', 'MunicipalityLongitude', 'EventID', 'PreferredMagnitudeType', 'PreferredMagnitudeValue', 'EventDepth', 'EventUTCDateTime', 'EventLatitude', 'EventLongitude'])
  if (!(c in col)) throw new Error(`Manca la colonna ${c}`);

const dati = righe.map((riga) => {
  const f = riga.split(',');
  if (f.length !== intest.length) throw new Error(`Riga con ${f.length} campi: ${riga}`);
  const ev = { lat: Number(f[col.EventLatitude]), lon: Number(f[col.EventLongitude]) };
  const lat = Number(f[col.MunicipalityLatitude]);
  const lon = Number(f[col.MunicipalityLongitude]);
  const prof = Number(f[col.EventDepth]);
  const d = distanzaKm(ev.lat, ev.lon, lat, lon);
  return {
    I: Number(f[col.IntensityMCS]),
    q: Number(f[col.QuestsNumberMCS]),
    E: Number(f[col.IntensityEMS]),
    qE: Number(f[col.QuestsNumberEMS]),
    comune: f[col.MunicipalityName],
    comLat: lat,
    id: f[col.EventID],
    magTipo: f[col.PreferredMagnitudeType],
    mag: Number(f[col.PreferredMagnitudeValue]),
    prof,
    tempo: f[col.EventUTCDateTime],
    evLat: ev.lat,
    evLon: ev.lon,
    d,
    r: Math.sqrt(d * d + Math.max(0, prof) ** 2),
  };
});
const valide = dati.filter((x) => x.I >= 1);
const idEventi = new Set(dati.map((x) => x.id));
const database = {
  righe: dati.length,
  terremoti: idEventi.size,
  conIntensita: valide.length,
  nonSentito: valide.filter((x) => x.I === 1).length,
  sentito: valide.filter((x) => x.I >= 2).length,
  questionari: dati.reduce((a, x) => a + Math.max(0, x.q), 0),
  primo: dati.reduce((a, x) => (x.tempo < a ? x.tempo : a), '9999'),
  ultimo: dati.reduce((a, x) => (x.tempo > a ? x.tempo : a), '0000'),
  intensitaMassima: valide.reduce((a, x) => Math.max(a, x.I), 0),
};
console.log('Database:', database);

/* ---------- 2) Le quattro scosse ---------- */

const richieste = [ZIP_URL];
const eventi = [];
for (const e of EVENTI) {
  const xs = dati.filter((x) => x.id === e.id);
  if (!xs.length) throw new Error(`Scossa ${e.id} assente dal database`);
  const p = xs[0];
  // Controllo con il catalogo INGV: nome del luogo e parametri attuali.
  const url = `${FDSN}?${new URLSearchParams({ eventid: e.id, format: 'text' })}`;
  richieste.push(url);
  const txt = await get(url, `fdsn-${e.id}.txt`);
  const campi = txt.trim().split(/\r?\n/)[1]?.split('|') ?? [];
  const ingv = { tempo: campi[1]?.slice(0, 19), lat: Number(campi[2]), lon: Number(campi[3]), prof: Number(campi[4]), magTipo: campi[9], mag: Number(campi[10]), luogo: campi[12] };

  const usati = xs.filter((x) => x.I >= 1 && x.q >= Q_MIN);
  // Ogni punto: [distanza dall'epicentro in km, intensità MCS, 1 se il comune è più a sud dell'epicentro].
  const punti = usati
    .map((x) => [x.d < 20 ? r1(x.d) : Math.round(x.d), x.I, x.comLat < p.evLat ? 1 : 0])
    .sort((a, b) => a[0] - b[0] || a[1] - b[1] || a[2] - b[2]);
  // A sud o a nord dell'epicentro: per le scosse profonde sotto il Tirreno conta (le onde viaggiano lungo la placca).
  const lato = (sud, da, a) => {
    const xs2 = usati.filter((x) => x.d >= da && x.d < a && x.comLat < p.evLat === sud);
    return xs2.length ? { n: xs2.length, mediana: r1(mediana(xs2.map((x) => x.I))), sentito: r1((100 * xs2.filter((x) => x.I >= 2).length) / xs2.length) } : null;
  };
  const asimmetria = [[0, 100], [100, 200], [200, 300]].map(([da, a]) => ({ da, a, sud: lato(true, da, a), nord: lato(false, da, a) }));
  const mediane = [];
  for (let k = 0; k < FASCE.length - 1; k++) {
    const dentro = usati.filter((x) => x.d >= FASCE[k] && x.d < FASCE[k + 1]);
    if (dentro.length >= 3) {
      const I = dentro.map((x) => x.I);
      mediane.push({ da: FASCE[k], a: FASCE[k + 1], n: dentro.length, mediana: r1(mediana(I)), sentito: r1((100 * I.filter((v) => v >= 2).length) / I.length) });
    }
  }
  // La curva della formula, in funzione della distanza dall'epicentro (la profondità entra nella distanza ipocentrale).
  const curva = [];
  for (let k = 0; k <= 60; k++) {
    const d = 10 ** (k / 20); // da 1 a 1000 km
    curva.push([r2(d), r2(formula(p.mag, Math.sqrt(d * d + p.prof * p.prof)))]);
  }
  const top = [...usati].sort((a, b) => b.I - a.I || b.q - a.q)[0];
  const sentiti = usati.filter((x) => x.I >= 2);
  const vicini = usati.filter((x) => x.r <= DIST_MAX);
  eventi.push({
    ...e,
    tempo: p.tempo,
    magTipo: p.magTipo,
    mag: p.mag,
    prof: p.prof,
    lat: p.evLat,
    lon: p.evLon,
    ingv,
    comuni: xs.filter((x) => x.I >= 1).length,
    comuniUsati: usati.length,
    questionari: xs.reduce((a, x) => a + Math.max(0, x.q), 0),
    massimo: { comune: top.comune, I: top.I, q: top.q, dKm: r1(top.d) },
    // Il comune più lontano dove l'ha sentita più di qualcuno (intensità 2 o più, almeno 3 questionari).
    distMaxSentito: Math.round(Math.max(...sentiti.map((x) => x.d))),
    formulaEpicentro: r2(formula(p.mag, Math.max(0, p.prof))),
    // Scarto HSIT − formula, comuni entro 300 km dall'ipocentro (anche i «non sentito»).
    scarto: vicini.length ? statistiche(vicini.map((x) => x.I - formula(x.mag, x.r))) : null,
    mediane,
    asimmetria,
    curva,
    punti,
  });
  console.log(e.nome, p.magTipo, p.mag, `${p.prof} km`, `comuni ${usati.length}`, 'INGV oggi:', ingv.magTipo, ingv.mag, ingv.luogo);
}

/* ---------- 3) Quanto sbaglia la formula del sito ---------- */

const CLASSI = [2, 3, 4, 5, 6];
function confronto(filtro) {
  return CLASSI.map((m) => {
    const xs = valide.filter((x) => x.prof <= PROF_MAX && x.r <= DIST_MAX && x.mag >= m && x.mag < m + 1 && filtro(x));
    const st = statistiche(xs.map((x) => x.I - formula(x.mag, x.r)));
    // Accordo «facile»: il comune dice «non sentito» e anche la formula dà grado I (meno di 1,5). Percentuale.
    const nonSentitoEntrambi = r1((100 * xs.filter((x) => x.I === 1 && formula(x.mag, x.r) < 1.5).length) / xs.length);
    // Che magnitudo usa il database (quella «preferita» dell'INGV: ML, Mw, Md...), in percentuale dei comuni.
    const tipi = {};
    for (const x of xs) tipi[x.magTipo] = (tipi[x.magTipo] ?? 0) + 1;
    const tipiMagnitudo = Object.fromEntries(Object.entries(tipi).sort((a, b) => b[1] - a[1]).map(([k, v]) => [k, r1((100 * v) / xs.length)]));
    // Quota dei comuni «non sentito» e distanza mediana dall'ipocentro: scegliere i comuni con più questionari cambia
    // anche questi due numeri (restano soprattutto i comuni vicini, dove la scossa si è sentita).
    const nonSentito = r1((100 * xs.filter((x) => x.I === 1).length) / xs.length);
    const rMediana = Math.round(mediana(xs.map((x) => x.r)));
    return { da: m, a: m + 1, terremoti: new Set(xs.map((x) => x.id)).size, ...st, nonSentitoEntrambi, nonSentito, rMediana, tipiMagnitudo };
  });
}
const crostali = valide.filter((x) => x.prof <= PROF_MAX);
const confrontoOut = {
  profMax: PROF_MAX,
  distMax: DIST_MAX,
  qMin: Q_MIN,
  // Tutti i comuni con almeno 3 questionari, anche quelli dove nessuno l'ha sentita (intensità 1).
  classi: confronto((x) => x.q >= Q_MIN),
  // Solo i comuni con almeno 10 questionari: stime più solide, ma meno comuni.
  q10: confronto((x) => x.q >= 10),
  // L'errore da non fare: tenere solo i comuni dove qualcuno l'ha sentita.
  soloSentiti: confronto((x) => x.q >= Q_MIN && x.I >= 2),
  // Che parte dei dati sono scosse profonde (più di 40 km).
  righeProfonde: valide.length - crostali.length,
  // Le scosse profonde escluse dal confronto: quante, e quante forti (per evento, magnitudo del database).
  profonde: (() => {
    const mag = new Map(valide.filter((x) => x.prof > PROF_MAX).map((x) => [x.id, x.mag]));
    return { terremoti: mag.size, m4: [...mag.values()].filter((v) => v >= 4).length, m5: [...mag.values()].filter((v) => v >= 5).length };
  })(),
};

/* ---------- 4) MCS ed EMS-98 negli stessi comuni ---------- */

// Il database dà per ogni comune sia l'intensità MCS sia quella EMS-98, calcolate dagli stessi questionari con soglie di
// percentuale diverse (readme, tabella 2). Quale scala dà valori più alti? Comuni con almeno 3 questionari in entrambe.
function mcsEms(xs) {
  const d = xs.map((x) => x.E - x.I);
  return {
    n: d.length,
    media: r2(d.reduce((a, b) => a + b, 0) / d.length),
    emsPiuAlta: r1((100 * d.filter((v) => v > 0).length) / d.length),
    emsPiuBassa: r1((100 * d.filter((v) => v < 0).length) / d.length),
  };
}
const dueScale = valide.filter((x) => x.E >= 1 && x.q >= Q_MIN && x.qE >= Q_MIN);
const scale = { tutti: mcsEms(dueScale), soloSentiti: mcsEms(dueScale.filter((x) => x.I >= 2)) };
console.log('MCS ed EMS:', scale);
for (const [k, v] of Object.entries(confrontoOut)) if (Array.isArray(v)) console.log(k, v.map((c) => `M${c.da}-${c.a} n=${c.n} med=${c.mediana} ±1=${c.entro1}%`).join(' | '));

fs.writeFileSync(
  OUT,
  `${JSON.stringify({
    titolo: 'Intensità macrosismiche per comune dai questionari «Hai Sentito Il Terremoto», 2007–2024, e confronto con la formula del sito',
    fonte: 'INGV — Hai Sentito Il Terremoto (HSIT), database delle intensità macrosismiche 2007–2024, versione 4',
    citazione:
      'Tosi, P., De Rubeis, V., Sbarra, P. & Sorrentino, D. (2026). Hai Sentito Il Terremoto (HSIT) – Macroseismic intensity database 2007-2024, version 4. INGV.',
    doi: 'https://doi.org/10.13127/HSIT/I.4',
    licenza: 'CC BY 4.0',
    file: { csv: nomeCsv, readme: nomeReadme },
    scaricato,
    richieste,
    script: 'scripts/build-intensita-data.mjs',
    formula: 'Allen, Wald & Worden (2012), distanza ipocentrale, come src/lib/impact.ts (intensityAt)',
    database,
    eventi,
    confronto: confrontoOut,
    scale,
  })}\n`,
);
console.log(`Scritto ${OUT.pathname} (${Math.round(fs.statSync(OUT).size / 1024)} KB)`);
