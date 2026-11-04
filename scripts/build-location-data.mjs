/**
 * Dati dell'articolo «Come si trova un terremoto» (contenuti/articoli/come-si-trova-un-terremoto.mdx).
 * Uso: node scripts/build-location-data.mjs   (qualche minuto: una richiesta all'INGV per ogni scossa, con calma)
 *      CACHE_DIR=<cartella> riusa i file già scaricati.
 *
 * 1) Una scossa raccontata da vicino: Pietrapaola (Calabria), 1° agosto 2024. Tutte le localizzazioni che il
 *    catalogo INGV conserva (automatiche, della sala di sorveglianza, del Bollettino Sismico Italiano), con l'ora
 *    in cui sono state calcolate; e i tempi di arrivo delle onde P e S alle stazioni (localizzazione del Bollettino).
 * 2) Tutte le scosse di magnitudo 3 o più del 2024 e del 2025 in Italia e nei mari vicini: di quanto la prima
 *    localizzazione automatica e quella della sala differiscono da quella finale del Bollettino Sismico Italiano.
 */
import fs from 'node:fs';
import path from 'node:path';

const API = 'https://webservices.ingv.it/fdsnws/event/1/query';
const OUT = new URL('../src/data/learn/localizzazione.json', import.meta.url);
const UA = 'QuakeItalia-data/1.0 (+https://github.com/Pitusd-V2/quake-italia)';
const CACHE = process.env.CACHE_DIR;
if (CACHE) fs.mkdirSync(CACHE, { recursive: true });

const ESEMPIO = 39921481; // Pietrapaola (CS), 1 agosto 2024, Mw 5,0
const ANNI = ['2024', '2025'];
const AREA = { minlat: '35.5', maxlat: '47.2', minlon: '6.5', maxlon: '19' };

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const pick = (text, re) => text.match(re)?.[1];
const utc = (s) => Date.parse(/Z$/.test(s) ? s : `${s}Z`);
const round = (v, d = 1) => Math.round(v * 10 ** d) / 10 ** d;

/** Distanza in km tra due punti sulla Terra (formula dell'emisenoverso). */
function km(lat1, lon1, lat2, lon2) {
  const r = Math.PI / 180;
  const h = Math.sin(((lat2 - lat1) * r) / 2) ** 2 + Math.cos(lat1 * r) * Math.cos(lat2 * r) * Math.sin(((lon2 - lon1) * r) / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
}

async function get(url, cacheName) {
  const file = CACHE && cacheName ? path.join(CACHE, cacheName) : null;
  if (file && fs.existsSync(file)) return fs.readFileSync(file, 'utf8');
  for (let tentativo = 0; tentativo < 3; tentativo++) {
    const res = await fetch(url, { headers: { 'User-Agent': UA } }).catch(() => null);
    if (res?.ok) {
      const text = await res.text();
      if (file) fs.writeFileSync(file, text);
      await sleep(250); // una richiesta alla volta, con calma
      return text;
    }
    await sleep(3000);
  }
  throw new Error(`INGV non risponde: ${url}`);
}

function origini(xml) {
  return [...xml.matchAll(/<origin publicID="([^"]+)">([\s\S]*?)<\/origin>/g)].map(([, id, b]) => ({
    id,
    xml: b,
    tempo: utc(pick(b, /<time>\s*<value>([^<]+)</)),
    lat: Number(pick(b, /<latitude>\s*<value>([^<]+)</)),
    lon: Number(pick(b, /<longitude>\s*<value>([^<]+)</)),
    prof: Number(pick(b, /<depth>\s*<value>([^<]+)</)) / 1000,
    profInc: pick(b, /<depth>[\s\S]*?<uncertainty>([^<]+)</) ? Number(pick(b, /<depth>[\s\S]*?<uncertainty>([^<]+)</)) / 1000 : null,
    orizInc: pick(b, /<horizontalUncertainty>([^<]+)</) ? Number(pick(b, /<horizontalUncertainty>([^<]+)</)) / 1000 : null,
    modo: pick(b, /<evaluationMode>([^<]+)</),
    autore: pick(b, /<author>([^<]+)</) ?? '',
    creata: utc(pick(b, /<creationTime>([^<]+)</) ?? '1970-01-01T00:00:00'),
    stazioni: pick(b, /<usedStationCount>([^<]+)</) ? Number(pick(b, /<usedStationCount>([^<]+)</)) : null,
  }));
}

/** Che tipo di localizzazione è, a parole. */
function tipo(o) {
  if (o.modo === 'automatic') return 'automatica';
  if (o.autore.startsWith('BULLETIN')) return 'bollettino';
  if (o.autore.startsWith('tdmt')) return 'tensore';
  if (o.autore.startsWith('SURVEY')) return 'sala';
  return 'altro';
}

/* ---------- 1) Pietrapaola, da vicino ---------- */

const esempioUrl = `${API}?${new URLSearchParams({ eventid: String(ESEMPIO), includeallorigins: 'true', includearrivals: 'true' })}`;
const esempioXml = await get(esempioUrl, `${ESEMPIO}-arrivi.xml`);
const tutte = origini(esempioXml).sort((a, b) => a.creata - b.creata);
const finale = tutte.find((o) => tipo(o) === 'bollettino');
if (!finale) throw new Error('Manca la localizzazione del Bollettino per la scossa di esempio');

const picks = new Map();
for (const [, id, b] of esempioXml.matchAll(/<pick publicID="([^"]+)">([\s\S]*?)<\/pick>/g)) {
  const w = pick(b, /<waveformID([^>]*)\/?>/) ?? '';
  picks.set(id, { tempo: utc(pick(b, /<time>\s*<value>([^<]+)</)), stazione: `${pick(w, /networkCode="([^"]+)"/)}.${pick(w, /stationCode="([^"]+)"/)}` });
}
const perStazione = new Map();
for (const [, a] of finale.xml.matchAll(/<arrival publicID="[^"]+">([\s\S]*?)<\/arrival>/g)) {
  const p = picks.get(pick(a, /<pickID>([^<]+)</));
  const fase = pick(a, /<phase>([^<]+)</)?.[0]; // P o S
  if (!p || (fase !== 'P' && fase !== 'S')) continue;
  const s = perStazione.get(p.stazione) ?? { km: Number(pick(a, /<distance>([^<]+)</)) * 111.19 };
  const t = (p.tempo - finale.tempo) / 1000;
  if (s[fase] === undefined || t < s[fase]) s[fase] = t;
  perStazione.set(p.stazione, s);
}
const arrivi = [...perStazione.entries()]
  .map(([stazione, s]) => ({ stazione, km: round(s.km), P: s.P === undefined ? null : round(s.P, 2), S: s.S === undefined ? null : round(s.S, 2) }))
  .sort((a, b) => a.km - b.km);

// Il nome delle stazioni più vicina e più lontana, dal servizio stazioni dell'INGV.
const conP = arrivi.filter((a) => a.P !== null);
for (const a of [conP[0], conP[conP.length - 1]]) {
  const [rete, codice] = a.stazione.split('.');
  const url = `https://webservices.ingv.it/fdsnws/station/1/query?${new URLSearchParams({ network: rete, station: codice, level: 'station', format: 'text' })}`;
  a.nome = (await get(url, `stazione-${a.stazione}.txt`)).trim().split('\n')[1]?.split('|')[5]?.trim();
}

const prefMag = pick(esempioXml, /<preferredMagnitudeID>([^<]+)</);
const magXml = [...esempioXml.matchAll(/<magnitude publicID="([^"]+)">([\s\S]*?)<\/magnitude>/g)].find(([, id]) => id === prefMag)?.[2] ?? '';

const esempio = {
  id: ESEMPIO,
  luogo: pick(esempioXml, /<description>[\s\S]*?<text>([^<]+)</),
  magnitudo: { tipo: pick(magXml, /<type>([^<]+)</), valore: Number(pick(magXml, /<mag>\s*<value>([^<]+)</)) },
  tempo: new Date(finale.tempo).toISOString(),
  richiesta: esempioUrl,
  localizzazioni: tutte.map((o) => ({
    tipo: tipo(o),
    autore: o.autore,
    dopoSecondi: Math.round((o.creata - finale.tempo) / 1000),
    stazioni: o.stazioni,
    profKm: round(o.prof),
    profIncKm: o.profInc === null ? null : round(o.profInc),
    orizIncKm: o.orizInc === null ? null : round(o.orizInc, 2),
    spostamentoKm: round(km(o.lat, o.lon, finale.lat, finale.lon)),
  })),
  arrivi,
};

/* ---------- 2) Tutte le scosse di magnitudo 3 o più del 2024 e 2025 ---------- */

const richiesteElenco = [];
const scosse = [];
for (const anno of ANNI) {
  const url = `${API}?${new URLSearchParams({ starttime: `${anno}-01-01`, endtime: `${Number(anno) + 1}-01-01`, minmag: '3', ...AREA, format: 'text', orderby: 'time-asc' })}`;
  richiesteElenco.push(url);
  const righe = (await get(url, `elenco-${anno}.txt`)).trim().split('\n').slice(1);
  for (const r of righe) {
    const c = r.split('|');
    scosse.push({ id: c[0], magTipo: c[9], mag: Number(c[10]) });
  }
}

const confronti = [];
let i = 0;
for (const s of scosse) {
  const xml = await get(`${API}?${new URLSearchParams({ eventid: s.id, includeallorigins: 'true' })}`, `${s.id}.xml`);
  if (++i % 50 === 0) console.log(`${i} / ${scosse.length}`);
  const os = origini(xml).sort((a, b) => a.creata - b.creata);
  const fin = os.find((o) => tipo(o) === 'bollettino');
  if (!fin) continue; // il Bollettino non l'ha ancora rivista
  // Le stime automatiche fatte prima della revisione dei sismologi: la prima (pochi secondi, poche stazioni)
  // e l'ultima (qualche minuto, molte stazioni). Poi la prima localizzazione della sala di sorveglianza.
  const primaManuale = os.find((o) => o.modo === 'manual');
  const auto = os.filter((o) => tipo(o) === 'automatica' && (!primaManuale || o.creata <= primaManuale.creata));
  const sala = os.find((o) => tipo(o) === 'sala');
  const riga = { mag: s.mag, magTipo: s.magTipo };
  const misura = (o, chiave) => ({
    [`${chiave}S`]: Math.round((o.creata - fin.tempo) / 1000),
    [`${chiave}Km`]: round(km(o.lat, o.lon, fin.lat, fin.lon)),
    [`${chiave}ProfKm`]: round(Math.abs(o.prof - fin.prof)),
    [`${chiave}Staz`]: o.stazioni,
  });
  if (auto.length) Object.assign(riga, misura(auto[0], 'prima'), misura(auto[auto.length - 1], 'auto'));
  if (sala) Object.assign(riga, misura(sala, 'sala'));
  confronti.push(riga);
}

fs.writeFileSync(
  OUT,
  `${JSON.stringify({
    titolo: 'Come si trova un terremoto: una scossa da vicino e il confronto tra prime stime e Bollettino (2024–2025)',
    fonte: 'INGV — webservices.ingv.it (FDSN), licenza CC BY 4.0',
    scaricato: new Date().toISOString().slice(0, 10),
    esempio,
    statistica: { anni: ANNI, magnitudoMinima: 3, area: AREA, richieste: richiesteElenco, scosse: scosse.length, confronti },
  })}\n`,
);
console.log(`Pietrapaola: ${esempio.localizzazioni.length} localizzazioni, ${arrivi.length} stazioni. Scosse: ${scosse.length}, confrontabili con il Bollettino: ${confronti.length}.`);
