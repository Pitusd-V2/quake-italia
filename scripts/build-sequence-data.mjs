/**
 * Scarica dal catalogo INGV i dati delle sequenze da rivedere sulla mappa (sezione «Capire»).
 * Uso: node scripts/build-sequence-data.mjs
 *
 * Ogni scossa diventa [minuti dall'inizio, lat×1000, lon×1000, profondità×10, magnitudo×10]: interi piccoli,
 * così i file restano leggeri e si scaricano solo quando qualcuno apre l'animazione.
 * Le richieste sono le stesse dei grafici già presenti negli articoli, per avere numeri coerenti.
 */
import fs from 'node:fs';

const API = 'https://webservices.ingv.it/fdsnws/event/1/query';
const OUT = new URL('../src/data/learn/', import.meta.url);

async function query(params) {
  const url = `${API}?${new URLSearchParams({ format: 'text', orderby: 'time-asc', limit: '20000', ...params })}`;
  const res = await fetch(url);
  if (!res.ok && res.status !== 204) throw new Error(`INGV ${res.status} per ${url}`);
  const rows = res.status === 204 ? [] : (await res.text()).trim().split('\n').slice(1);
  const events = rows.map((r) => {
    const c = r.split('|');
    return { time: Date.parse(`${c[1]}Z`), lat: +c[2], lon: +c[3], depth: +c[4], mag: +c[10] };
  });
  return { url, events };
}

function pack(events, start) {
  return events.map((e) => [
    // Il minuto com'è nel catalogo (01:36:32 resta 01:36): niente arrotondamenti al minuto dopo.
    Math.floor((e.time - start) / 60_000),
    Math.round(e.lat * 1000),
    Math.round(e.lon * 1000),
    Math.round(e.depth * 10),
    Math.round(e.mag * 10),
  ]);
}

function save(name, data) {
  fs.writeFileSync(
    new URL(name, OUT),
    `${JSON.stringify({ ...data, scaricato: new Date().toISOString().slice(0, 10), fonte: 'INGV — webservices.ingv.it (FDSN), licenza CC BY 4.0' })}\n`,
  );
  console.log(name, data.eventi.length, 'scosse');
}

// 1) Centro Italia 2016–2017: stessa richiesta del grafico di «Repliche e sequenze».
{
  const params = { starttime: '2016-08-20', endtime: '2017-03-01', minmag: '2.5', lat: '42.8', lon: '13.2', maxradiuskm: '40' };
  const start = Date.parse('2016-08-20T00:00:00Z');
  const { url, events } = await query(params);
  save('seq-centro-italia.json', {
    titolo: 'Sequenza del Centro Italia 2016–2017: terremoti di magnitudo ≥ 2,5 entro 40 km (20 ago 2016 – 28 feb 2017)',
    richieste: [url],
    inizio: '2016-08-20T00:00:00Z',
    fine: '2017-03-01T00:00:00Z',
    sogliaMag: 2.5,
    eventi: pack(events, start),
  });
}

// 2) Campi Flegrei dal 2023: stessa area del grafico dell'articolo, tutte le magnitudo del catalogo nazionale.
//    Fine fissa al 1° ottobre 2026, come il bollettino di settembre 2026 citato nell'articolo.
{
  const area = { lat: '40.827', lon: '14.139', maxradiuskm: '8' };
  const years = [
    ['2023-01-01', '2024-01-01'],
    ['2024-01-01', '2025-01-01'],
    ['2025-01-01', '2026-01-01'],
    ['2026-01-01', '2026-10-01'],
  ];
  const start = Date.parse('2023-01-01T00:00:00Z');
  const all = [];
  const urls = [];
  for (const [from, to] of years) {
    const { url, events } = await query({ starttime: from, endtime: to, ...area });
    all.push(...events);
    urls.push(url);
  }
  save('seq-campi-flegrei.json', {
    titolo: 'Campi Flegrei: terremoti localizzati entro 8 km da Pozzuoli (1 gen 2023 – 30 set 2026)',
    richieste: urls,
    inizio: '2023-01-01T00:00:00Z',
    fine: '2026-10-01T00:00:00Z',
    sogliaMag: Math.min(...all.map((e) => e.mag)),
    eventi: pack(all, start),
  });
}
