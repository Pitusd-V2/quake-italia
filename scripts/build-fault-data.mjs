/**
 * Dati dell'articolo «Le faglie» (contenuti/articoli/le-faglie.mdx).
 * Uso: node scripts/build-fault-data.mjs     (CACHE_DIR=<cartella> riusa i file già scaricati)
 *
 * 1) Dal catalogo INGV: le scosse di magnitudo 3,5 o più dal 2006 al 2025 in Italia e nei mari vicini che hanno un
 *    meccanismo focale (il tensore momento calcolato dall'INGV). Per ognuna: posizione, profondità, magnitudo e i due
 *    piani nodali (direzione, inclinazione, verso dello scorrimento).
 * 2) Da Natural Earth (pubblico dominio): le linee di costa della zona, per disegnare la mappa.
 *
 * Il tipo di faglia si ricava dall'angolo di scorrimento (rake) del primo piano nodale, con la convenzione di Aki e
 * Richards: intorno a −90° faglia normale, intorno a +90° inversa, intorno a 0° o 180° trascorrente.
 */
import fs from 'node:fs';
import path from 'node:path';

const API = 'https://webservices.ingv.it/fdsnws/event/1/query';
const COSTE = 'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/v5.1.2/geojson/ne_50m_coastline.geojson';
const OUT = new URL('../src/data/learn/faglie.json', import.meta.url);
const UA = 'QuakeItalia-data/1.0 (+https://github.com/Pitusd-V2/quake-italia)';
const CACHE = process.env.CACHE_DIR;
if (CACHE) fs.mkdirSync(CACHE, { recursive: true });

const AREA = { minlat: 35.5, maxlat: 47.2, minlon: 6.5, maxlon: 19 };
const ANNI = Array.from({ length: 20 }, (_, i) => 2006 + i); // 2006–2025
const MAG_MIN = 3.5;
const TIPI = ['normale', 'inversa', 'trascorrente'];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const pick = (text, re) => text.match(re)?.[1];

async function get(url, cacheName) {
  const file = CACHE && cacheName ? path.join(CACHE, cacheName) : null;
  if (file && fs.existsSync(file)) return fs.readFileSync(file, 'utf8');
  for (let tentativo = 0; tentativo < 3; tentativo++) {
    const res = await fetch(url, { headers: { 'User-Agent': UA } }).catch(() => null);
    if (res?.ok || res?.status === 204) {
      const text = res.status === 204 ? '' : await res.text();
      if (file) fs.writeFileSync(file, text);
      await sleep(400); // una richiesta alla volta, con calma
      return text;
    }
    await sleep(3000);
  }
  throw new Error(`Non risponde: ${url}`);
}

/** Il tipo di faglia dal rake (gradi, da −180 a 180). */
export function tipoDaRake(rake) {
  if (rake > -150 && rake < -30) return 'normale';
  if (rake > 30 && rake < 150) return 'inversa';
  return 'trascorrente';
}

/* ---------- 1) Meccanismi focali INGV ---------- */

const richieste = [];
const scosse = [];
for (const anno of ANNI) {
  const params = new URLSearchParams({ starttime: `${anno}-01-01`, endtime: `${anno + 1}-01-01`, minmag: String(MAG_MIN), ...Object.fromEntries(Object.entries(AREA).map(([k, v]) => [k, String(v)])) });
  const url = `${API}?${params}`;
  richieste.push(url);
  const xml = await get(url, `faglie-${anno}.xml`);
  for (const [, ev] of xml.matchAll(/<event publicID="[^"]+">([\s\S]*?)<\/event>/g)) {
    const fm = pick(ev, /<focalMechanism publicID="[^"]+">([\s\S]*?)<\/focalMechanism>/);
    if (!fm) continue;
    const prefO = pick(ev, /<preferredOriginID>([^<]+)</);
    const prefM = pick(ev, /<preferredMagnitudeID>([^<]+)</);
    const origine = [...ev.matchAll(/<origin publicID="([^"]+)">([\s\S]*?)<\/origin>/g)].find(([, id]) => id === prefO)?.[2] ?? '';
    const magnitudo = [...ev.matchAll(/<magnitude publicID="([^"]+)">([\s\S]*?)<\/magnitude>/g)].find(([, id]) => id === prefM)?.[2] ?? '';
    const piano = (n) => {
      const b = pick(fm, new RegExp(`<nodalPlane${n}>([\\s\\S]*?)<\\/nodalPlane${n}>`)) ?? '';
      return [Number(pick(b, /<strike>\s*<value>([^<]+)</)), Number(pick(b, /<dip>\s*<value>([^<]+)</)), Number(pick(b, /<rake>\s*<value>([^<]+)</))];
    };
    const p1 = piano(1);
    const p2 = piano(2);
    if (!p1.every(Number.isFinite)) continue;
    scosse.push({
      tempo: pick(origine, /<time>\s*<value>([^<]+)</)?.slice(0, 19),
      lat: Math.round(Number(pick(origine, /<latitude>\s*<value>([^<]+)</)) * 1000) / 1000,
      lon: Math.round(Number(pick(origine, /<longitude>\s*<value>([^<]+)</)) * 1000) / 1000,
      prof: Math.round(Number(pick(origine, /<depth>\s*<value>([^<]+)</)) / 100) / 10,
      mag: Number(pick(magnitudo, /<mag>\s*<value>([^<]+)</)),
      magTipo: pick(magnitudo, /<type>([^<]+)</),
      luogo: pick(ev, /<description>[\s\S]*?<text>([^<]+)</),
      p1,
      p2,
      tipo: tipoDaRake(p1[2]),
      metodo: /TDMT/i.test(fm) ? 'TDMT' : (pick(fm, /<author>([^<|]+)/)?.trim() ?? ''),
    });
  }
  console.log(anno, scosse.length);
}

/* ---------- 2) Coste (Natural Earth, 1:50 milioni) ---------- */

const bbox = { minlon: AREA.minlon - 0.5, maxlon: AREA.maxlon + 0.5, minlat: AREA.minlat - 0.5, maxlat: AREA.maxlat + 0.5 };
const dentro = ([lon, lat]) => lon >= bbox.minlon && lon <= bbox.maxlon && lat >= bbox.minlat && lat <= bbox.maxlat;
const geo = JSON.parse(await get(COSTE, 'ne_50m_coastline.geojson'));
const coste = [];
for (const f of geo.features) {
  const linee = f.geometry.type === 'LineString' ? [f.geometry.coordinates] : f.geometry.coordinates;
  for (const linea of linee) {
    // Spezza la linea dove esce dal riquadro: teniamo solo i tratti dentro.
    let tratto = [];
    for (const p of linea) {
      if (dentro(p)) tratto.push([Math.round(p[0] * 100) / 100, Math.round(p[1] * 100) / 100]);
      else if (tratto.length) (tratto.length > 1 && coste.push(tratto), (tratto = []));
    }
    if (tratto.length > 1) coste.push(tratto);
  }
}

fs.writeFileSync(
  OUT,
  `${JSON.stringify({
    titolo: `Meccanismi focali INGV delle scosse di magnitudo ${MAG_MIN} o più, ${ANNI[0]}–${ANNI[ANNI.length - 1]}, Italia e mari vicini`,
    fonte: 'INGV — webservices.ingv.it (FDSN), licenza CC BY 4.0; coste: Natural Earth (pubblico dominio)',
    scaricato: new Date().toISOString().slice(0, 10),
    area: AREA,
    magnitudoMinima: MAG_MIN,
    anni: [ANNI[0], ANNI[ANNI.length - 1]],
    richieste,
    fonteCoste: COSTE,
    tipi: TIPI,
    // Ogni scossa: [lat, lon, profondità km, magnitudo, tipo (indice in «tipi»), rake del primo piano, anno].
    legenda: ['lat', 'lon', 'profKm', 'mag', 'tipo', 'rake', 'anno'],
    scosse: scosse.map((x) => [x.lat, x.lon, x.prof, x.mag, TIPI.indexOf(x.tipo), x.p1[2], Number(x.tempo.slice(0, 4))]),
    // Le più forti (magnitudo 5,5 o più), con il nome e i due piani nodali [direzione, inclinazione, rake].
    notevoli: scosse
      .filter((x) => x.mag >= 5.5)
      .map(({ tempo, luogo, mag, magTipo, prof, tipo, p1, p2 }) => ({ tempo, luogo, mag, magTipo, prof, tipo, p1, p2 })),
    coste,
  })}\n`,
);
const conta = scosse.reduce((m, s) => ((m[s.tipo] = (m[s.tipo] ?? 0) + 1), m), {});
console.log(`Scosse con meccanismo: ${scosse.length}`, conta, `tratti di costa: ${coste.length}`);
