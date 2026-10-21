/**
 * Scarica dal catalogo INGV i dati veri usati nei grafici di "Capire i terremoti"
 * e li salva, già riassunti, in src/data/learn/*.json.
 *
 *   node scripts/build-learn-data.mjs
 *
 * I file prodotti contengono anche la richiesta esatta (URL) e la data di download:
 * chiunque può rifare la stessa interrogazione e controllare i numeri.
 */
import fs from 'node:fs';

const API = 'https://webservices.ingv.it/fdsnws/event/1/query';
const OUT = new URL('../src/data/learn/', import.meta.url);
fs.mkdirSync(OUT, { recursive: true });

async function query(params) {
  const url = `${API}?${new URLSearchParams({ format: 'text', orderby: 'time-asc', limit: '20000', ...params })}`;
  const res = await fetch(url);
  if (res.status === 204) return { url, events: [] };
  if (!res.ok) throw new Error(`INGV ${res.status} per ${url}`);
  const rows = (await res.text()).trim().split('\n').slice(1);
  const events = rows.map((r) => {
    const c = r.split('|');
    return { id: c[0], time: new Date(`${c[1]}Z`), lat: +c[2], lon: +c[3], depth: +c[4], magType: c[9], mag: +c[10], place: c[12] };
  }).filter((e) => Number.isFinite(e.mag) && Number.isFinite(e.depth));
  console.log(`${events.length} eventi ← ${url}`);
  return { url, events };
}

const save = (name, data) => {
  fs.writeFileSync(new URL(name, OUT), `${JSON.stringify({ ...data, scaricato: new Date().toISOString().slice(0, 10), fonte: 'INGV — webservices.ingv.it (FDSN), licenza CC BY 4.0' })}\n`);
};

const R = 6371;
const rad = (d) => (d * Math.PI) / 180;
/** Proiezione semplice (equirettangolare) in km attorno a un punto: va bene su poche centinaia di km. */
const toXY = (p, o) => ({ x: rad(p.lon - o.lon) * R * Math.cos(rad(o.lat)), y: rad(p.lat - o.lat) * R });

// 1) La placca ionica sotto Calabria e Tirreno: sezione da SE (Ionio) verso NW (Tirreno).
{
  const A = { lat: 38.2, lon: 17.0 }; // mar Ionio, al largo della Calabria
  const B = { lat: 40.4, lon: 13.6 }; // Tirreno centro-meridionale
  const { url, events } = await query({ starttime: '2005-01-01', endtime: '2026-01-01', minmag: '2.5', minlat: '37', maxlat: '41.5', minlon: '13', maxlon: '18' });
  const b = toXY(B, A);
  const len = Math.hypot(b.x, b.y);
  const ux = b.x / len;
  const uy = b.y / len;
  const points = [];
  for (const e of events) {
    const p = toXY(e, A);
    const along = p.x * ux + p.y * uy; // distanza lungo la sezione
    const across = Math.abs(-p.x * uy + p.y * ux); // distanza dalla linea
    if (along >= -20 && along <= len + 20 && across <= 60) points.push([Math.round(along), Math.round(e.depth), +e.mag.toFixed(1)]);
  }
  const deep = points.filter((p) => p[1] >= 100);
  save('slab.json', {
    titolo: 'Ipocentri lungo una sezione Ionio → Tirreno (2005–2025, M ≥ 2,5, entro 60 km dalla linea)',
    richiesta: url,
    sezione: { da: A, a: B, lunghezzaKm: Math.round(len), larghezzaKm: 120 },
    punti: points,
    statistiche: { totale: points.length, oltre100km: deep.length, maxProfonditaKm: Math.max(...points.map((p) => p[1])) },
  });
}

// 2) La sequenza di Amatrice–Visso–Norcia (2016–2017): numero di scosse al giorno.
{
  const { url, events } = await query({ starttime: '2016-08-20', endtime: '2017-03-01', minmag: '2.5', lat: '42.8', lon: '13.2', maxradiuskm: '40' });
  const day0 = Date.UTC(2016, 7, 20);
  const days = {};
  for (const e of events) {
    const d = Math.floor((e.time.getTime() - day0) / 86_400_000);
    days[d] = (days[d] ?? 0) + 1;
  }
  const nDays = Math.ceil((Date.UTC(2017, 2, 1) - day0) / 86_400_000);
  const giornaliero = Array.from({ length: nDays }, (_, i) => days[i] ?? 0);
  const principali = events
    .filter((e) => e.mag >= 5.0)
    .map((e) => ({ data: e.time.toISOString().slice(0, 16).replace('T', ' '), mag: e.mag, tipo: e.magType, luogo: e.place, giorno: Math.floor((e.time.getTime() - day0) / 86_400_000) }));
  save('norcia2016.json', {
    titolo: 'Sequenza di Amatrice–Visso–Norcia: terremoti di magnitudo ≥ 2,5 al giorno entro 40 km (20 ago 2016 – 28 feb 2017)',
    richiesta: url,
    inizio: '2016-08-20',
    giornaliero,
    principali,
    totale: events.length,
  });
}

// 3) Legge di Gutenberg-Richter: tutti i terremoti in Italia in un anno.
{
  const { url, events } = await query({ starttime: '2025-01-01', endtime: '2026-01-01', minlat: '35', maxlat: '48', minlon: '6', maxlon: '19' });
  const bins = {};
  for (const e of events) {
    const m = Math.round(e.mag * 10) / 10;
    bins[m] = (bins[m] ?? 0) + 1;
  }
  const mags = Object.keys(bins).map(Number).sort((a, b) => a - b);
  const classi = [];
  for (let m = mags[0]; m <= mags.at(-1) + 1e-9; m = Math.round((m + 0.1) * 10) / 10) classi.push([m, bins[m] ?? 0]);
  let cum = 0;
  const cumulativo = classi.map(([m]) => m).reverse().map((m) => [m, (cum += bins[m] ?? 0)]).reverse();
  // Magnitudo di completezza: massima curvatura + 0,2. b-value: Aki-Utsu.
  const peak = classi.reduce((a, b) => (b[1] > a[1] ? b : a));
  const mc = Math.round((peak[0] + 0.2) * 10) / 10;
  const above = events.map((e) => Math.round(e.mag * 10) / 10).filter((m) => m >= mc - 1e-9);
  const mean = above.reduce((s, m) => s + m, 0) / above.length;
  const bValue = Math.LOG10E / (mean - (mc - 0.05));
  const perUnita = [1, 2, 3, 4, 5].map((m) => [m, events.filter((e) => e.mag >= m).length]);
  save('gr-italia.json', {
    titolo: 'Terremoti nell’area italiana nel 2025, contati per magnitudo',
    richiesta: url,
    totale: events.length,
    classi,
    cumulativo,
    mc,
    bValue: +bValue.toFixed(2),
    nSopraMc: above.length,
    almeno: perUnita,
  });
}

// 4) Campi Flegrei: terremoti al mese dal 2000 (area della caldera) e scosse di magnitudo ≥ 4.
{
  const area = { lat: '40.827', lon: '14.139', maxradiuskm: '8' };
  const all = [];
  const urls = [];
  // Una richiesta per anno, per non superare il limite del servizio.
  for (let y = 2000; y <= new Date().getUTCFullYear(); y++) {
    const { url, events } = await query({ starttime: `${y}-01-01`, endtime: `${y + 1}-01-01`, ...area });
    all.push(...events);
    urls.push(url);
  }
  const months = {};
  for (const e of all) {
    const k = e.time.toISOString().slice(0, 7);
    months[k] = (months[k] ?? 0) + 1;
  }
  const keys = [];
  for (let y = 2000; y <= new Date().getUTCFullYear(); y++) for (let m = 1; m <= 12; m++) keys.push(`${y}-${String(m).padStart(2, '0')}`);
  const lastKey = new Date().toISOString().slice(0, 7);
  const mensile = keys.filter((k) => k <= lastKey).map((k) => [k, months[k] ?? 0]);
  const forti = all
    .filter((e) => e.mag >= 4)
    .map((e) => ({ data: e.time.toISOString().slice(0, 16).replace('T', ' '), mag: e.mag, tipo: e.magType, profonditaKm: e.depth }));
  const depths = all.map((e) => e.depth).sort((a, b) => a - b);
  const perAnno = {};
  for (const e of all) {
    const y = e.time.getUTCFullYear();
    perAnno[y] = perAnno[y] ?? { n: 0, max: -9 };
    perAnno[y].n++;
    perAnno[y].max = Math.max(perAnno[y].max, e.mag);
  }
  save('campi-flegrei.json', {
    titolo: 'Campi Flegrei: terremoti localizzati al mese entro 8 km da Pozzuoli (dal 2000)',
    richiesta: urls.at(-1),
    nota: 'Una richiesta per anno: stessa area (lat 40,827, lon 14,139, raggio 8 km), tutte le magnitudo.',
    mensile,
    perAnno: Object.entries(perAnno).map(([y, v]) => [Number(y), v.n, v.max]),
    forti,
    totale: all.length,
    profonditaMediana: depths[Math.floor(depths.length / 2)],
    oltre3km: Math.round((depths.filter((d) => d > 3).length / depths.length) * 100),
  });
}
