/**
 * Dati dell'articolo «Il terreno amplifica: gli effetti di sito» (contenuti/bozze/effetti-di-sito.mdx).
 * Uso: node scripts/build-sito-data.mjs     (CACHE_DIR=<cartella> riusa il file già scaricato)
 *
 * Fonte: il flatfile del database accelerometrico europeo ESM (Engineering Strong-Motion database, INGV e ORFEUS),
 * licenza CC BY 4.0. Ogni riga è una registrazione: un terremoto visto da una stazione, con la distanza, la categoria
 * di sottosuolo della stazione (EC8, da A roccia a E) e i valori di picco dello scuotimento.
 *
 * Cosa calcoliamo noi (non è un risultato pubblicato):
 * 1) scegliamo le registrazioni (terremoti superficiali in Italia di magnitudo 4,5 o più dal 2008, stazioni entro
 *    150 km, categoria nota, sensori non dentro edifici, una registrazione per stazione e terremoto);
 * 2) con una regressione togliamo l'effetto del terremoto (un termine per ognuno) e della distanza, e stimiamo un
 *    termine per ogni categoria di sottosuolo rispetto alla roccia (A):
 *        ln Y = a_terremoto + b·ln√(R² + h²) + c·R + s_categoria,   R = distanza Joyner-Boore, h = 6 km, s_A = 0;
 *    il «fattore» di una categoria è exp(s): quante volte, in media, lo scuotimento è più forte che su roccia;
 * 3) l'incertezza: bootstrap per stazioni (ricampioniamo le stazioni, non le singole registrazioni), intervallo al 90%;
 * 4) la dispersione: per ogni stazione con almeno 3 registrazioni, il fattore medio rispetto alla «roccia media»;
 * 5) alcune prove di robustezza (sottoinsiemi dei dati);
 * 6) per una sola scossa ben registrata (24 agosto 2016, Mw 6,0) i punti distanza–accelerazione per il grafico.
 */
import fs from 'node:fs';
import path from 'node:path';

const API = 'https://esm-db.eu/esmws/flatfile/1/query';
const OUT = new URL('../src/data/learn/sito.json', import.meta.url);
const UA = 'QuakeItalia-data/1.0 (+https://github.com/Pitusd-V2/quake-italia)';
const CACHE = process.env.CACHE_DIR;
if (CACHE) fs.mkdirSync(CACHE, { recursive: true });

const CAMPI = [
  'esm_event_id', 'event_time', 'ev_latitude', 'ev_longitude', 'ev_depth_km', 'mw', 'ml', 'fm_type_code',
  'network_code', 'station_code', 'location_code', 'channel_code', 'st_latitude', 'st_longitude',
  'preferred_ec8_code', 'preferred_vs30_m_s', 'preferred_estimation_method_vs30_ec8', 'vs30_meas_type', 'reference_site',
  'proximity', 'housing', 'epi_dist', 'jb_dist', 'rup_dist', 'rotd50_pga', 'rotd50_pgv', 'rotd50_t0_200', 'rotd50_t1_000',
];
const RICHIESTA = {
  'event-country': 'IT',
  'min-magnitude': '5.0',
  starttime: '2008-01-01',
  endtime: '2026-10-31',
  'include-fields': CAMPI.join(','),
};

const FILTRI = { profMaxKm: 30, magMin: 4.5, rjbMaxKm: 150, hKm: 6, minRegStazione: 3 };
const CAT = ['A', 'B', 'C', 'D', 'E'];
const ALTRE = CAT.slice(1); // A è il riferimento
const BOOT = 500;
const SCOSSA = 'EMSC-20160824_0000006'; // 24 agosto 2016, 03:36 ora italiana, Mw 6,0 (Amatrice–Accumoli)
const G = 980.665; // 1 g in cm/s²

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
/** La data del giorno in cui il flatfile è stato scaricato (con CACHE_DIR: la data del file in cache, non quella di oggi). */
let dataScarico = new Date().toISOString().slice(0, 10);

async function get(url, cacheName) {
  const file = CACHE && cacheName ? path.join(CACHE, cacheName) : null;
  if (file && fs.existsSync(file)) {
    dataScarico = fs.statSync(file).mtime.toISOString().slice(0, 10);
    return fs.readFileSync(file, 'utf8');
  }
  for (let tentativo = 0; tentativo < 3; tentativo++) {
    const res = await fetch(url, { headers: { 'User-Agent': UA } }).catch(() => null);
    if (res?.ok) {
      const text = await res.text();
      if (file) fs.writeFileSync(file, text);
      return text;
    }
    await sleep(5000);
  }
  throw new Error(`Non risponde: ${url}`);
}

/* ---------- 1) Scarico e lettura ---------- */

const url = `${API}?${new URLSearchParams(RICHIESTA)}`;
const csv = (await get(url, 'esm-flatfile-it-m5.csv')).trim().split(/\r?\n/);
const head = csv[0].split(';').map((h) => h.trim().toLowerCase());
for (const c of CAMPI) if (!head.includes(c)) throw new Error(`Manca il campo ${c} nel flatfile`);
const righe = csv.slice(1).map((l) => Object.fromEntries(l.split(';').map((v, i) => [head[i], v])));
console.log(`Righe del flatfile: ${righe.length}`);

const metodoTutte = conta(righe.map((r) => r.preferred_estimation_method_vs30_ec8 || 'nessuno'));

function conta(xs) {
  const m = {};
  for (const x of xs) m[x] = (m[x] ?? 0) + 1;
  return m;
}

/* ---------- 2) Scelta delle registrazioni ---------- */

const mag = (r) => Number(r.mw || r.ml);
// Una registrazione per stazione e terremoto. Se ce n'è più d'una (sensori diversi nella stessa stazione), scegliamo
// in modo ripetibile: prima i sensori dichiarati «free-field», poi in ordine di canale e codice di posizione.
const PREF_PROX = ['Free-field', 'Structure related free-field', 'Close to structure', '', 'No information'];
const ordinate = [...righe].sort(
  (a, b) =>
    (PREF_PROX.indexOf(a.proximity) + 9) % 9 - (PREF_PROX.indexOf(b.proximity) + 9) % 9 ||
    a.channel_code.localeCompare(b.channel_code) ||
    a.location_code.localeCompare(b.location_code),
);
const visti = new Set();
const dati = [];
const motivi = { profondita: 0, magnitudo: 0, distanza: 0, categoria: 0, dentroEdificio: 0, doppione: 0, valore: 0 };
for (const r of ordinate) {
  const m = mag(r);
  const prof = Number(r.ev_depth_km);
  const R = Number(r.jb_dist);
  if (!(prof <= FILTRI.profMaxKm)) { motivi.profondita++; continue; }
  if (!(m >= FILTRI.magMin)) { motivi.magnitudo++; continue; }
  if (!(R <= FILTRI.rjbMaxKm)) { motivi.distanza++; continue; }
  if (!CAT.includes(r.preferred_ec8_code)) { motivi.categoria++; continue; }
  if (r.proximity === 'Inside structure') { motivi.dentroEdificio++; continue; }
  const pga = Number(r.rotd50_pga);
  const sa1 = Number(r.rotd50_t1_000);
  if (!(pga > 0) || !(sa1 > 0)) { motivi.valore++; continue; }
  const st = `${r.network_code}.${r.station_code}`;
  const k = `${r.esm_event_id}|${st}`;
  if (visti.has(k)) { motivi.doppione++; continue; }
  visti.add(k);
  dati.push({
    ev: r.esm_event_id,
    t: r.event_time,
    lat: Number(r.ev_latitude),
    lon: Number(r.ev_longitude),
    prof,
    m,
    st,
    R,
    cat: r.preferred_ec8_code,
    metodo: r.preferred_estimation_method_vs30_ec8 || 'nessuno',
    rif: r.reference_site,
    pga,
    sa1,
  });
}
// Per avere risultati ripetibili, ordiniamo per terremoto e stazione.
dati.sort((a, b) => a.ev.localeCompare(b.ev) || a.st.localeCompare(b.st));
console.log(`Registrazioni scelte: ${dati.length}`, motivi);

/* ---------- 3) Regressione ---------- */

/**
 * Minimi quadrati: un termine per ogni terremoto, b e c per la distanza, un termine per ogni categoria tranne A.
 * Risolve le equazioni normali con l'eliminazione di Gauss (pochi parametri: va benissimo).
 */
function regressione(sample, chiave) {
  const evs = [...new Set(sample.map((d) => d.ev))].sort();
  const iev = new Map(evs.map((e, i) => [e, i]));
  const P = evs.length + 2 + ALTRE.length;
  const A = Array.from({ length: P }, () => new Float64Array(P));
  const y = new Float64Array(P);
  for (const d of sample) {
    const r = Math.hypot(d.R, FILTRI.hKm);
    const idx = [iev.get(d.ev), evs.length, evs.length + 1];
    const val = [1, Math.log(r), r];
    const ci = ALTRE.indexOf(d.cat);
    if (ci >= 0) (idx.push(evs.length + 2 + ci), val.push(1));
    const obs = Math.log(d[chiave]);
    for (let i = 0; i < idx.length; i++) {
      y[idx[i]] += val[i] * obs;
      for (let j = 0; j < idx.length; j++) A[idx[i]][idx[j]] += val[i] * val[j];
    }
  }
  for (let i = 0; i < P; i++) A[i][i] += 1e-9; // categorie assenti in un campione: il termine resta 0
  for (let i = 0; i < P; i++) {
    let p = i;
    for (let k = i + 1; k < P; k++) if (Math.abs(A[k][i]) > Math.abs(A[p][i])) p = k;
    [A[i], A[p]] = [A[p], A[i]];
    [y[i], y[p]] = [y[p], y[i]];
    for (let k = i + 1; k < P; k++) {
      const f = A[k][i] / A[i][i];
      if (!f) continue;
      for (let j = i; j < P; j++) A[k][j] -= f * A[i][j];
      y[k] -= f * y[i];
    }
  }
  const x = new Float64Array(P);
  for (let i = P - 1; i >= 0; i--) {
    let s = y[i];
    for (let j = i + 1; j < P; j++) s -= A[i][j] * x[j];
    x[i] = s / A[i][i];
  }
  const presenti = new Set(sample.map((d) => d.cat));
  return {
    eventi: Object.fromEntries(evs.map((e, i) => [e, x[i]])),
    b: x[evs.length],
    c: x[evs.length + 1],
    s: Object.fromEntries(ALTRE.map((k, i) => [k, presenti.has(k) ? x[evs.length + 2 + i] : null])),
  };
}

const perStazione = new Map();
for (const d of dati) {
  if (!perStazione.has(d.st)) perStazione.set(d.st, []);
  perStazione.get(d.st).push(d);
}
const stazioni = [...perStazione.keys()];

// Generatore pseudocasuale con seme fisso (mulberry32): chi rifà il calcolo ottiene gli stessi numeri.
function generatore(seme) {
  let a = seme >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const quantile = (ordinati, p) => {
  const i = p * (ordinati.length - 1);
  const lo = Math.floor(i);
  const hi = Math.ceil(i);
  return ordinati[lo] + (ordinati[hi] - ordinati[lo]) * (i - lo);
};
const r3 = (v) => Math.round(v * 1000) / 1000;
const r2 = (v) => Math.round(v * 100) / 100;

function modello(chiave) {
  const fit = regressione(dati, chiave);
  const rnd = generatore(20161030);
  const boot = Object.fromEntries(ALTRE.map((k) => [k, []]));
  for (let k = 0; k < BOOT; k++) {
    const campione = [];
    for (let i = 0; i < stazioni.length; i++) campione.push(...perStazione.get(stazioni[Math.floor(rnd() * stazioni.length)]));
    const fb = regressione(campione, chiave);
    for (const c of ALTRE) if (fb.s[c] !== null) boot[c].push(fb.s[c]);
  }
  const fattori = { A: { f: 1, lo: 1, hi: 1 } };
  for (const c of ALTRE) {
    const s = boot[c].sort((a, b) => a - b);
    fattori[c] = { f: r3(Math.exp(fit.s[c])), lo: r3(Math.exp(quantile(s, 0.05))), hi: r3(Math.exp(quantile(s, 0.95))) };
  }
  return { fit, fattori };
}

const pga = modello('pga');
const sa1 = modello('sa1');
console.log('PGA', pga.fattori, 'b', pga.fit.b.toFixed(3), 'c', pga.fit.c.toFixed(5));
console.log('SA(1 s)', sa1.fattori);

/* ---------- 4) Dispersione tra stazioni (PGA) ---------- */

// Per ogni stazione: la media dei residui rispetto alla previsione «su roccia» (senza termine di categoria).
const dispersione = {};
{
  const { fit } = pga;
  const medie = [];
  for (const [st, ds] of perStazione) {
    if (ds.length < FILTRI.minRegStazione) continue;
    const res = ds.map((d) => Math.log(d.pga) - (fit.eventi[d.ev] + fit.b * Math.log(Math.hypot(d.R, FILTRI.hKm)) + fit.c * Math.hypot(d.R, FILTRI.hKm)));
    medie.push({ st, cat: ds[0].cat, f: Math.exp(res.reduce((a, b) => a + b, 0) / res.length) });
  }
  for (const c of CAT) {
    const v = medie.filter((m) => m.cat === c).map((m) => m.f).sort((a, b) => a - b);
    dispersione[c] = v.length ? { n: v.length, p10: r2(quantile(v, 0.1)), p50: r2(quantile(v, 0.5)), p90: r2(quantile(v, 0.9)) } : { n: 0 };
  }
}
console.log('Dispersione', dispersione);

/* ---------- 5) Robustezza: lo stesso calcolo su parti dei dati (solo stima, PGA e SA a 1 s) ---------- */

const dentro = (d, [t0, t1, la0, la1, lo0, lo1]) => d.t >= t0 && d.t <= t1 && d.lat >= la0 && d.lat <= la1 && d.lon >= lo0 && d.lon <= lo1;
// Riquadri semplici (tempo, latitudine, longitudine) per riconoscere le sequenze principali.
const SEQUENZE = {
  aquila2009: ['2009-04-01', '2009-12-31', 42.0, 42.7, 13.0, 13.8],
  emilia2012: ['2012-05-01', '2012-12-31', 44.6, 45.1, 10.6, 11.7],
  centroItalia2016: ['2016-08-24', '2017-12-31', 42.2, 43.3, 12.8, 13.6],
};
const PROVE = [
  { id: 'vsMisurato', nome: 'solo stazioni con la velocità delle onde S misurata', f: (d) => d.metodo === 'vs_profile' },
  { id: 'centroItalia', nome: 'solo la sequenza dell’Italia centrale 2016–2017', f: (d) => dentro(d, SEQUENZE.centroItalia2016) },
  { id: 'senzaEmilia', nome: 'senza la sequenza dell’Emilia 2012', f: (d) => !dentro(d, SEQUENZE.emilia2012) },
  { id: 'forti', nome: 'solo terremoti di magnitudo 5,5 o più', f: (d) => d.m >= 5.5 },
  { id: 'vicine', nome: 'solo stazioni entro 30 km', f: (d) => d.R <= 30 },
];
const robustezza = PROVE.map(({ id, nome, f }) => {
  const sub = dati.filter(f);
  const a = regressione(sub, 'pga');
  const b = regressione(sub, 'sa1');
  const n = conta(sub.map((d) => d.cat));
  return {
    id,
    nome,
    registrazioni: sub.length,
    terremoti: new Set(sub.map((d) => d.ev)).size,
    stazioniA: new Set(sub.filter((d) => d.cat === 'A').map((d) => d.st)).size,
    perCategoria: n,
    pga: Object.fromEntries(ALTRE.map((c) => [c, a.s[c] === null ? null : r3(Math.exp(a.s[c]))])),
    sa1: Object.fromEntries(ALTRE.map((c) => [c, b.s[c] === null ? null : r3(Math.exp(b.s[c]))])),
  };
});
for (const p of robustezza) console.log(p.id, p.registrazioni, 'C pga', p.pga.C, 'C 1s', p.sa1.C);

/* ---------- 6) Una scossa per il grafico ---------- */

const scossaDati = dati.filter((d) => d.ev === SCOSSA);
const rigaScossa = righe.find((r) => r.esm_event_id === SCOSSA);
if (!scossaDati.length || !rigaScossa) throw new Error(`Scossa ${SCOSSA} non trovata`);

/* ---------- Riepiloghi ---------- */

const perCategoria = Object.fromEntries(
  CAT.map((c) => [c, { registrazioni: dati.filter((d) => d.cat === c).length, stazioni: new Set(dati.filter((d) => d.cat === c).map((d) => d.st)).size }]),
);
const stazioniUniche = [...perStazione.values()].map((ds) => ds[0]);
const metodoStazioni = conta(stazioniUniche.map((d) => d.metodo));
const rifA = conta(stazioniUniche.filter((d) => d.cat === 'A').map((d) => d.rif || 'nessuna informazione'));
const sequenze = Object.fromEntries(Object.entries(SEQUENZE).map(([k, box]) => [k, { registrazioni: dati.filter((d) => dentro(d, box)).length, terremoti: new Set(dati.filter((d) => dentro(d, box)).map((d) => d.ev)).size }]));
const magnitudini = [...new Set(dati.map((d) => `${d.ev}|${d.m}`))].map((s) => Number(s.split('|')[1]));

fs.writeFileSync(
  OUT,
  `${JSON.stringify({
    titolo: 'Accelerazioni registrate in Italia per categoria di sottosuolo: terremoti dal 2008, flatfile ESM',
    fonte: 'Engineering Strong-Motion database (ESM), flatfile: INGV e ORFEUS, licenza CC BY 4.0',
    doi: ['https://doi.org/10.13127/esm/flatfile.1.0', 'https://doi.org/10.13127/esm.2'],
    scaricato: dataScarico,
    richiesta: url,
    righe: righe.length,
    // Come è stata stabilita la categoria di sottosuolo, su tutte le righe scaricate (vs_profile = misura della velocità).
    metodoCategoriaRighe: metodoTutte,
    filtri: FILTRI,
    esclusioni: motivi,
    selezione: {
      registrazioni: dati.length,
      terremoti: new Set(dati.map((d) => d.ev)).size,
      stazioni: perStazione.size,
      magnitudo: [Math.min(...magnitudini), Math.max(...magnitudini)],
      anni: [Math.min(...dati.map((d) => Number(d.t.slice(0, 4)))), Math.max(...dati.map((d) => Number(d.t.slice(0, 4))))],
      perCategoria,
      metodoCategoriaStazioni: metodoStazioni,
      // Stazioni di categoria A, secondo la classificazione «sito di riferimento» di Lanzano e altri (2022) riportata da ESM.
      riferimentoStazioniA: rifA,
      sequenze,
    },
    bootstrap: { repliche: BOOT, livello: 0.9, per: 'stazioni' },
    modello: {
      formula: 'ln Y = a_terremoto + b·ln√(R² + h²) + c·R + s_categoria (A = 0)',
      pga: { b: r3(pga.fit.b), c: Math.round(pga.fit.c * 1e5) / 1e5, fattori: pga.fattori },
      sa1: { b: r3(sa1.fit.b), c: Math.round(sa1.fit.c * 1e5) / 1e5, fattori: sa1.fattori },
    },
    dispersione,
    robustezza,
    scossa: {
      id: SCOSSA,
      tempo: rigaScossa.event_time,
      mw: Number(rigaScossa.mw),
      ml: Number(rigaScossa.ml),
      lat: Number(rigaScossa.ev_latitude),
      lon: Number(rigaScossa.ev_longitude),
      profKm: Number(rigaScossa.ev_depth_km),
      // Termine del terremoto nella regressione della PGA: con b, c e il fattore di categoria dà la curva media.
      a: r3(pga.fit.eventi[SCOSSA]),
      // Ogni punto: [distanza Joyner-Boore in km, PGA in cm/s², categoria].
      legenda: ['rjbKm', 'pgaCmS2', 'categoria'],
      punti: scossaDati.map((d) => [Math.round(d.R * 10) / 10, Number(d.pga.toPrecision(3)), d.cat]),
    },
    g: G,
  })}\n`,
);
console.log(`Scritto ${OUT.pathname}: scossa con ${scossaDati.length} registrazioni`);
