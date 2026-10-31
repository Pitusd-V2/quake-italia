/**
 * «Esiste il tempo da terremoto?» — i dati dell'articolo di «Capire».
 *
 *   node scripts/build-weather-myth-data.mjs
 *
 * Cosa fa, in ordine:
 *  1. scarica dal catalogo INGV i terremoti 1985–2024 (Italia e mari intorno);
 *  2. toglie le repliche (declustering di Gardner e Knopoff, 1974), per contare i terremoti «indipendenti»;
 *  3. conta le scosse per mese e per ora (ora italiana) e controlla se sono distribuite a caso, con un test
 *     «a rotazione» che sposta il calendario a caso ma tiene interi i grappoli di scosse;
 *  4. per i terremoti indipendenti di magnitudo ≥ 4 chiede a Open-Meteo (rianalisi ERA5) il tempo delle 24 ore
 *     prima della scossa e lo confronta con le stesse 24 ore dei 15 giorni prima e dopo, nello stesso punto:
 *     se il «tempo da terremoto» esistesse, prima delle scosse farebbe più caldo e ci sarebbe meno vento del solito.
 *
 * Il file prodotto (src/data/learn/tempo-terremoto.json) contiene le richieste, i parametri e la data di download:
 * chiunque può rifare i conti. Con CACHE_DIR=<cartella> i download vengono salvati e riusati.
 */
import fs from 'node:fs';
import path from 'node:path';

const INGV = 'https://webservices.ingv.it/fdsnws/event/1/query';
const METEO = 'https://archive-api.open-meteo.com/v1/archive';
const OUT = new URL('../src/data/learn/tempo-terremoto.json', import.meta.url);
const CACHE = process.env.CACHE_DIR;
const LIMIT = 20000;
const BOX = { minlat: '35', maxlat: '48', minlon: '6', maxlon: '19' };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const mean = (xs) => xs.reduce((a, b) => a + b, 0) / xs.length;

async function cachedText(key, url) {
  const file = CACHE && path.join(CACHE, `${key}.txt`);
  if (file && fs.existsSync(file)) return fs.readFileSync(file, 'utf8');
  for (let attempt = 1; ; attempt++) {
    const res = await fetch(url);
    if (res.ok || res.status === 204) {
      const text = res.status === 204 ? '' : await res.text();
      if (file) {
        fs.mkdirSync(CACHE, { recursive: true });
        fs.writeFileSync(file, text);
      }
      return text;
    }
    if (attempt >= 4) throw new Error(`${res.status} per ${url}`);
    await sleep(2000 * attempt);
  }
}

/* ---------- 1. Catalogo INGV ---------- */

/** Scarica un intervallo; se tocca il limite di 20.000 righe lo divide a metà. */
async function fetchRange(from, to, minmag, urls) {
  const params = { format: 'text', orderby: 'time-asc', limit: String(LIMIT), starttime: from, endtime: to, ...BOX };
  if (minmag != null) params.minmag = String(minmag);
  const url = `${INGV}?${new URLSearchParams(params)}`;
  const text = await cachedText(`ingv_${from}_${to}_${minmag ?? 'all'}`.replace(/[:]/g, ''), url);
  const rows = text.trim() ? text.trim().split('\n').slice(1) : [];
  if (rows.length >= LIMIT) {
    const mid = new Date((Date.parse(`${from}Z`) + Date.parse(`${to}Z`)) / 2).toISOString().slice(0, 19);
    return [...(await fetchRange(from, mid, minmag, urls)), ...(await fetchRange(mid, to, minmag, urls))];
  }
  urls.push(url);
  return rows;
}

function parseRow(r) {
  const c = r.split('|');
  return { id: c[0], time: Date.parse(`${c[1]}Z`), lat: +c[2], lon: +c[3], depth: +c[4], magType: c[9], mag: +c[10], place: c[12] ?? '' };
}

/**
 * Teniamo l'Italia e i suoi mari: nel catalogo INGV le località italiane finiscono con la sigla della provincia
 * («(PG)») o con «(MARE)»; quelle estere con il nome del Paese («(Croazia)», «(Albania)»…).
 */
const isItalian = (place) => /\((?:[A-Z]{2}|MARE)\)\s*$/.test(place.trim());

async function loadCatalog() {
  const urls = [];
  const rows = [];
  // Fino al 2014 bastano le magnitudo ≥ 2.
  for (let y = 1985; y < 2015; y++) rows.push(...(await fetchRange(`${y}-01-01T00:00:00`, `${y + 1}-01-01T00:00:00`, 2, urls)));
  // Dal 2015 tutte le magnitudo, per confrontare scosse piccole e grandi registrate dalla stessa rete di stazioni.
  for (let y = 2015; y < 2025; y++) {
    for (let m = 1; m <= 12; m++) {
      const a = `${y}-${String(m).padStart(2, '0')}-01T00:00:00`;
      const b = m === 12 ? `${y + 1}-01-01T00:00:00` : `${y}-${String(m + 1).padStart(2, '0')}-01T00:00:00`;
      rows.push(...(await fetchRange(a, b, null, urls)));
    }
  }
  const seen = new Set();
  const events = [];
  for (const r of rows) {
    const e = parseRow(r);
    if (!Number.isFinite(e.mag) || !Number.isFinite(e.time) || seen.has(e.id)) continue;
    seen.add(e.id);
    events.push(e);
  }
  events.sort((a, b) => a.time - b.time);
  return { events, urls };
}

/* ---------- 2. Repliche: declustering di Gardner e Knopoff (1974) ---------- */

/** Finestre spazio-tempo di Gardner e Knopoff, nella forma usata da van Stiphout e altri (2012, CORSSA). */
const gkKm = (m) => 10 ** (0.1238 * m + 0.983);
const gkDays = (m) => (m >= 6.5 ? 10 ** (0.032 * m + 2.7389) : 10 ** (0.5409 * m - 0.547));

function haversineKm(a, b) {
  const r = (d) => (d * Math.PI) / 180;
  const h = Math.sin(r(b.lat - a.lat) / 2) ** 2 + Math.cos(r(a.lat)) * Math.cos(r(b.lat)) * Math.sin(r(b.lon - a.lon) / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
}

/**
 * Dalla scossa più forte alla più debole: tutto quello che cade nella sua finestra (prima o dopo, entro la stessa
 * distanza e lo stesso tempo) è una replica o un foreshock di quella scossa. Restano le scosse «principali».
 * `events` è ordinato per tempo.
 */
function decluster(events) {
  const dependent = new Uint8Array(events.length);
  const order = events.map((_, i) => i).sort((a, b) => events[b].mag - events[a].mag);
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
    if (dependent[i]) continue;
    const e = events[i];
    const dt = gkDays(e.mag) * 86_400_000;
    const km = gkKm(e.mag);
    for (let j = lowerBound(e.time - dt); j < events.length && times[j] <= e.time + dt; j++) {
      if (j === i || dependent[j] || events[j].mag > e.mag) continue;
      if (haversineKm(e, events[j]) <= km) dependent[j] = 1;
    }
  }
  return events.filter((_, i) => !dependent[i]);
}

/* ---------- 3. Mesi, ore e test statistico ---------- */

const romeParts = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Rome', year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', hourCycle: 'h23' });
function romeTime(ms) {
  const p = Object.fromEntries(romeParts.formatToParts(new Date(ms)).map((x) => [x.type, x.value]));
  return { year: +p.year, month: +p.month, day: +p.day, hour: +p.hour, minute: +p.minute };
}
const isLeap = (y) => (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
const dayOfYear = (t) => Math.round((Date.UTC(t.year, t.month - 1, t.day) - Date.UTC(t.year, 0, 1)) / 86_400_000);
const monthOfDay = (y, d) => new Date(Date.UTC(y, 0, 1 + d)).getUTCMonth();

/** Generatore pseudo-casuale con seme fisso (mulberry32): chi rilancia lo script ottiene gli stessi numeri. */
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Chi quadro fra conteggi osservati e attesi (attesi in proporzione ai pesi). */
function chi2(observed, weights) {
  const n = observed.reduce((a, b) => a + b, 0);
  const wsum = weights.reduce((a, b) => a + b, 0);
  return observed.reduce((s, o, i) => {
    const e = (n * weights[i]) / wsum;
    return s + (o - e) ** 2 / e;
  }, 0);
}

/** Giorni di ciascun mese fra due anni compresi (i febbraio bisestili contano 29). */
function daysPerMonth(from, to) {
  const d = Array(12).fill(0);
  for (let y = from; y <= to; y++) for (let m = 0; m < 12; m++) d[m] += new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
  return d;
}

const ROUNDS = 5000;

/**
 * Mesi. Test a rotazione: per ogni anno il calendario viene fatto «scorrere» di un numero di giorni a caso.
 * Così i grappoli di scosse restano interi (le repliche non si separano), ma il legame con le stagioni si rompe.
 * p = quante volte, su 5000 calendari rimescolati, lo squilibrio fra i mesi è grande almeno quanto quello vero.
 */
function monthTest(list, from, to) {
  const weights = daysPerMonth(from, to);
  const counts = Array(12).fill(0);
  const byYear = new Map();
  for (const e of list) {
    const t = romeTime(e.time);
    counts[t.month - 1]++;
    if (!byYear.has(t.year)) byYear.set(t.year, []);
    byYear.get(t.year).push(dayOfYear(t));
  }
  const observed = chi2(counts, weights);
  const random = rng(1985);
  let atLeast = 0;
  for (let r = 0; r < ROUNDS; r++) {
    const c = Array(12).fill(0);
    for (const [y, days] of byYear) {
      const n = isLeap(y) ? 366 : 365;
      const shift = Math.floor(random() * n);
      for (const d of days) c[monthOfDay(y, (d + shift) % n)]++;
    }
    if (chi2(c, weights) >= observed) atLeast++;
  }
  const n = list.length;
  const wsum = weights.reduce((a, b) => a + b, 0);
  return { conteggi: counts, attesi: weights.map((w) => +((n * w) / wsum).toFixed(1)), chi2: +observed.toFixed(1), p: +(atLeast / ROUNDS).toFixed(3), n };
}

/** Ore. Stessa idea: dentro ogni settimana le ore vengono fatte scorrere tutte insieme di un numero di ore a caso. */
function hourTest(list) {
  const counts = Array(24).fill(0);
  const byWeek = new Map();
  for (const e of list) {
    const t = romeTime(e.time);
    counts[t.hour]++;
    const k = `${t.year}-${Math.floor(dayOfYear(t) / 7)}`;
    if (!byWeek.has(k)) byWeek.set(k, []);
    byWeek.get(k).push(t.hour);
  }
  const flat = Array(24).fill(1);
  const observed = chi2(counts, flat);
  const random = rng(2005);
  let atLeast = 0;
  for (let r = 0; r < ROUNDS; r++) {
    const c = Array(24).fill(0);
    for (const hours of byWeek.values()) {
      const shift = Math.floor(random() * 24);
      for (const h of hours) c[(h + shift) % 24]++;
    }
    if (chi2(c, flat) >= observed) atLeast++;
  }
  return { conteggi: counts, chi2: +observed.toFixed(1), p: +(atLeast / ROUNDS).toFixed(3), n: list.length };
}

/** Quante scosse in inverno (dic–feb) e in estate (giu–ago) rispetto a quante ce ne aspetteremmo (1 = come atteso). */
function seasonRatios(list, from, to) {
  const w = daysPerMonth(from, to);
  const c = Array(12).fill(0);
  for (const e of list) c[romeTime(e.time).month - 1]++;
  const n = c.reduce((a, b) => a + b, 0);
  const wsum = w.reduce((a, b) => a + b, 0);
  const ratio = (ms) => ms.reduce((s, m) => s + c[m], 0) / ms.reduce((s, m) => s + (n * w[m]) / wsum, 0);
  return { n, inverno: +ratio([11, 0, 1]).toFixed(2), estate: +ratio([5, 6, 7]).toFixed(2) };
}

const magTypes = (list) =>
  Object.entries(list.reduce((a, e) => ({ ...a, [e.magType]: (a[e.magType] ?? 0) + 1 }), {}))
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

/* ---------- 4. Il tempo prima della scossa (Open-Meteo, ERA5) ---------- */

const WINDOW = 15; // giorni di confronto prima e dopo
const HOUR = 3_600_000;
const isoDate = (ms) => new Date(ms).toISOString().slice(0, 10);

/**
 * Dati orari (in UTC) attorno alla scossa. Per ognuno dei 31 «istanti di confronto» (l'ora della scossa e la stessa
 * ora nei 15 giorni prima e dopo) calcoliamo le 24 ore precedenti: temperatura massima, vento medio, pioggia totale.
 */
async function weatherBefore(e) {
  const t0 = Math.floor(e.time / HOUR) * HOUR;
  const params = {
    latitude: e.lat.toFixed(2),
    longitude: e.lon.toFixed(2),
    start_date: isoDate(t0 - (WINDOW + 2) * 86_400_000),
    end_date: isoDate(t0 + (WINDOW + 1) * 86_400_000),
    hourly: 'temperature_2m,wind_speed_10m,precipitation',
    timezone: 'GMT',
  };
  const url = `${METEO}?${new URLSearchParams(params)}`;
  const key = `meteoh_${e.id}`;
  const cached = CACHE && fs.existsSync(path.join(CACHE, `${key}.txt`));
  const json = JSON.parse(await cachedText(key, url));
  if (!cached) await sleep(250);
  if (!json.hourly?.time) throw new Error(`Open-Meteo senza dati: ${url}`);
  const index = new Map(json.hourly.time.map((s, i) => [Date.parse(`${s}:00Z`), i]));
  const metrics = [];
  for (let k = -WINDOW; k <= WINDOW; k++) {
    const end = t0 + k * 86_400_000;
    const temps = [];
    const winds = [];
    const rains = [];
    for (let h = 0; h < 24; h++) {
      const i = index.get(end - h * HOUR);
      if (i == null) continue;
      if (json.hourly.temperature_2m[i] != null) temps.push(json.hourly.temperature_2m[i]);
      if (json.hourly.wind_speed_10m[i] != null) winds.push(json.hourly.wind_speed_10m[i]);
      if (json.hourly.precipitation[i] != null) rains.push(json.hourly.precipitation[i]);
    }
    const complete = temps.length === 24 && winds.length === 24 && rains.length === 24;
    metrics.push(complete ? { tmax: Math.max(...temps), wind: mean(winds), rain: rains.reduce((a, b) => a + b, 0) } : null);
  }
  return { url, metrics };
}

/** Posizione dell'istante della scossa fra i 31 (0 = il valore più basso, 1 = il più alto); i pari merito contano a metà. */
function rankOf(values) {
  const v = values[WINDOW];
  const others = values.filter((x, k) => k !== WINDOW && x != null);
  if (v == null || others.length < 20) return null;
  return (others.filter((x) => x < v).length + others.filter((x) => x === v).length / 2) / others.length;
}

const fifths = (ps) => {
  const bins = [0, 0, 0, 0, 0];
  for (const p of ps) bins[Math.min(4, Math.floor(p * 5))]++;
  return bins;
};
const half95 = (n) => +(1.96 / Math.sqrt(12 * n)).toFixed(3); // incertezza (95%) della media di n valori uniformi fra 0 e 1

async function weatherRow(e) {
  const w = await weatherBefore(e);
  const at = w.metrics[WINDOW];
  if (!at) return { url: w.url, row: null };
  const rainy = w.metrics.map((m) => (m ? m.rain >= 1 : null));
  return {
    url: w.url,
    row: {
      e,
      tmax: +at.tmax.toFixed(1),
      wind: +at.wind.toFixed(1),
      rain: +at.rain.toFixed(1),
      pT: rankOf(w.metrics.map((m) => m?.tmax ?? null)),
      pW: rankOf(w.metrics.map((m) => m?.wind ?? null)),
      rainy: rainy[WINDOW],
      rainShare: mean(rainy.filter((x, k) => k !== WINDOW && x != null).map(Number)),
    },
  };
}

/* ---------- Esecuzione ---------- */

const { events, urls } = await loadCatalog();
const italian = events.filter((e) => isItalian(e.place));
console.log(`catalogo: ${events.length} eventi, di cui ${italian.length} in Italia e nei mari intorno`);
const since2005 = Date.parse('2005-01-01T00:00:00Z');
const since2015 = Date.parse('2015-01-01T00:00:00Z');

// A. Rete di stazioni moderna (2005–2024), magnitudo ≥ 2,5, repliche tolte: il confronto principale.
const modern = decluster(italian.filter((e) => e.time >= since2005 && e.mag >= 2.5));
console.log(`2005–2024, M ≥ 2,5: ${modern.length} terremoti indipendenti`);
const mesi = monthTest(modern, 2005, 2024);
const ore = hourTest(modern);

// B. 40 anni, magnitudo ≥ 3: nel catalogo vecchio (1985–2004, quasi tutto in magnitudo di durata Md) compare un
//    «effetto estate» che con la rete moderna sparisce.
const main3 = decluster(italian.filter((e) => e.mag >= 3));
const old = main3.filter((e) => e.time < since2005);
const recent3 = main3.filter((e) => e.time >= since2005);
const catalogoVecchio = {
  vecchio: {
    periodo: '1985–2004',
    tipiMagnitudo: magTypes(old),
    da3a35: seasonRatios(old.filter((e) => e.mag < 3.5), 1985, 2004),
    da35: seasonRatios(old.filter((e) => e.mag >= 3.5), 1985, 2004),
    test: monthTest(old, 1985, 2004),
  },
  nuovo: {
    periodo: '2005–2024',
    tipiMagnitudo: magTypes(recent3),
    da3a35: seasonRatios(recent3.filter((e) => e.mag < 3.5), 2005, 2024),
    da35: seasonRatios(recent3.filter((e) => e.mag >= 3.5), 2005, 2024),
    test: monthTest(recent3, 2005, 2024),
  },
};

// C. Tutte le scosse 2015–2024, anche minuscole (repliche comprese): di notte gli strumenti «sentono» meglio.
const recentAll = italian.filter((e) => e.time >= since2015);
const NIGHT = [0, 1, 2, 3, 4, 5];
const DAY = [9, 10, 11, 12, 13, 14, 15, 16, 17];
const fasce = [
  { label: 'meno di 1', min: -Infinity, max: 1 },
  { label: 'da 1 a 2', min: 1, max: 2 },
  { label: 'da 2 a 3', min: 2, max: 3 },
  { label: '3 e più', min: 3, max: Infinity },
].map((b) => {
  const h = Array(24).fill(0);
  for (const e of recentAll) if (e.mag >= b.min && e.mag < b.max) h[romeTime(e.time).hour]++;
  const per = (hs) => mean(hs.map((x) => h[x]));
  return { fascia: b.label, scosse: h.reduce((a, x) => a + x, 0), rapportoNotteGiorno: +(per(NIGHT) / per(DAY)).toFixed(2), ore: h };
});

// D. Il tempo prima dei terremoti indipendenti di magnitudo ≥ 4, fino a 40 km di profondità (quelli che si sentono).
const strong = main3.filter((e) => e.mag >= 4 && e.depth <= 40);
console.log(`meteo: ${strong.length} terremoti indipendenti M ≥ 4 entro 40 km di profondità`);
const meteoUrls = [];
const rows = [];
for (const e of strong) {
  const { url, row } = await weatherRow(e);
  meteoUrls.push(url);
  if (row) rows.push(row);
}
const pT = rows.map((r) => r.pT).filter((x) => x != null);
const pW = rows.map((r) => r.pW).filter((x) => x != null);
const rainRows = rows.filter((r) => r.rainy != null);

// E. I grandi terremoti (M ≥ 5,8) presi dal catalogo così com'è, repliche comprese (Amatrice, Visso e Norcia separati).
const grandi = [];
for (const e of italian.filter((x) => x.mag >= 5.8 && x.depth <= 40)) {
  const { url, row } = await weatherRow(e);
  meteoUrls.push(url);
  const t = romeTime(e.time);
  grandi.push({
    data: isoDate(Date.UTC(t.year, t.month - 1, t.day)),
    ora: `${String(t.hour).padStart(2, '0')}:${String(t.minute).padStart(2, '0')}`,
    luogo: e.place,
    mag: e.mag,
    tipoMag: e.magType,
    tmax24h: row?.tmax ?? null,
    ventoMedio24h: row?.wind ?? null,
    pioggia24h: row?.rain ?? null,
    caldo: row?.pT == null ? null : +row.pT.toFixed(2),
    vento: row?.pW == null ? null : +row.pW.toFixed(2),
  });
}

const data = {
  titolo: 'Esiste il tempo da terremoto? Terremoti INGV 1985–2024 per mese, ora e tempo meteorologico',
  periodo: { da: '1985-01-01', a: '2024-12-31' },
  area: 'Italia e mari intorno: località del catalogo INGV con sigla di provincia o «(MARE)», nel riquadro 35–48°N, 6–19°E',
  metodo: {
    declustering: 'Gardner e Knopoff (1974), finestre nella forma di van Stiphout et al. (2012), uguali prima e dopo la scossa più forte',
    test: `chi quadro con p calcolato a rotazione (${ROUNDS} calendari rimescolati: anni per i mesi, settimane per le ore)`,
    meteo: `Open-Meteo (rianalisi ERA5): 24 ore prima della scossa contro le stesse 24 ore dei ${WINDOW} giorni prima e dopo, nello stesso punto`,
  },
  mesi: { periodo: '2005–2024', soglia: 2.5, ...mesi },
  ore: { periodo: '2005–2024', soglia: 2.5, ...ore },
  catalogoVecchio,
  rilevamento: { periodo: '2015–2024', notte: '00–06', giorno: '09–18', fasce },
  meteo: {
    terremoti: rows.length,
    caldo: { media: +mean(pT).toFixed(3), incertezza95: half95(pT.length), quinti: fifths(pT), n: pT.length },
    vento: { media: +mean(pW).toFixed(3), incertezza95: half95(pW.length), quinti: fifths(pW), n: pW.length },
    pioggia: {
      primaDellaScossa: +mean(rainRows.map((r) => Number(r.rainy))).toFixed(3),
      giorniDiConfronto: +mean(rainRows.map((r) => r.rainShare)).toFixed(3),
      n: rainRows.length,
    },
    grandi,
  },
  richieste: { ingv: urls, meteoEsempio: meteoUrls.slice(0, 3), meteoTotale: meteoUrls.length },
  scaricato: new Date().toISOString().slice(0, 10),
  fonti: [
    'INGV — webservices.ingv.it (FDSN), licenza CC BY 4.0',
    'Open-Meteo (open-meteo.com), licenza CC BY 4.0, con dati ERA5 del Copernicus Climate Change Service',
  ],
};

fs.writeFileSync(OUT, `${JSON.stringify(data)}\n`);
const { richieste: _r, ...rest } = data;
console.log(JSON.stringify({ ...rest, rilevamento: { ...rest.rilevamento, fasce: fasce.map(({ ore: _o, ...b }) => b) } }, null, 1));
