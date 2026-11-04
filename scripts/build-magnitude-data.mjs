/**
 * Scarica dal catalogo INGV tutte le stime della magnitudo di alcuni terremoti italiani, per l'articolo
 * «Una scossa, tante magnitudo» (contenuti/articoli/perche-la-magnitudo-cambia.mdx).
 * Uso: node scripts/build-magnitude-data.mjs
 *
 * Per ogni terremoto il catalogo conserva più magnitudo: calcolate in momenti diversi, con metodi diversi
 * (ML, Mw, Mwp, Md…) e con un numero diverso di stazioni. Le teniamo tutte, così come sono, con il link
 * alla richiesta per rifarla.
 */
import fs from 'node:fs';

const API = 'https://webservices.ingv.it/fdsnws/event/1/query';
const OUT = new URL('../src/data/learn/magnitudo.json', import.meta.url);
const UA = 'QuakeItalia-data/1.0 (+https://github.com/Pitusd-V2/quake-italia)';

/** I terremoti dell'articolo (identificativo dell'evento nel catalogo INGV) e il nome con cui sono conosciuti. */
const EVENTI = [
  { id: 8863681, nome: 'Norcia' },
  { id: 1895389, nome: 'L’Aquila' },
  { id: 7073641, nome: 'Amatrice' },
  { id: 8669321, nome: 'Visso' },
  { id: 772691, nome: 'Emilia' },
  { id: 33301831, nome: 'Costa marchigiana' },
  { id: 41908352, nome: 'Campi Flegrei' },
];

const pick = (text, re) => text.match(re)?.[1];
const num = (s) => (s === undefined || s === '' ? null : Number(s));

async function evento({ id, nome }) {
  const richiesta = `${API}?${new URLSearchParams({ eventid: String(id), includeallmagnitudes: 'true' })}`;
  const res = await fetch(richiesta, { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error(`INGV ${res.status} per ${richiesta}`);
  const xml = await res.text();

  const prefOrigin = pick(xml, /<preferredOriginID>([^<]+)</);
  const prefMag = pick(xml, /<preferredMagnitudeID>([^<]+)</);
  const origins = [...xml.matchAll(/<origin publicID="([^"]+)">([\s\S]*?)<\/origin>/g)];
  const origin = (origins.find(([, pid]) => pid === prefOrigin) ?? origins[0])?.[2] ?? '';
  const tempo = pick(origin, /<time>\s*<value>([^<]+)</);
  const descr = pick(xml, /<description>([\s\S]*?)<\/description>/) ?? '';
  const luogo = pick(descr, /<text>([^<]+)</);

  const stime = [...xml.matchAll(/<magnitude publicID="([^"]+)">([\s\S]*?)<\/magnitude>/g)].map(([, pid, b]) => {
    const mag = pick(b, /<mag>([\s\S]*?)<\/mag>/) ?? '';
    return {
      tipo: pick(b, /<type>([^<]+)</),
      valore: Number(pick(mag, /<value>([^<]+)</)),
      incertezza: num(pick(mag, /<uncertainty>([^<]+)</)),
      stazioni: num(pick(b, /<stationCount>([^<]+)</)),
      preferita: pid === prefMag,
    };
  });
  if (!tempo || !stime.length || stime.some((s) => !s.tipo || !Number.isFinite(s.valore))) {
    throw new Error(`Risposta INGV inattesa per ${nome} (${richiesta})`);
  }
  // Ordine stabile: prima la magnitudo principale, poi per tipo e per numero di stazioni.
  stime.sort(
    (a, b) => Number(b.preferita) - Number(a.preferita) || a.tipo.localeCompare(b.tipo) || (b.stazioni ?? -1) - (a.stazioni ?? -1) || b.valore - a.valore,
  );
  // L'ora del catalogo è in UTC (a volte senza la «Z» finale).
  return { id, nome, tempo: new Date(/Z$/.test(tempo) ? tempo : `${tempo}Z`).toISOString(), luogo, richiesta, stime };
}

const eventi = [];
for (const e of EVENTI) {
  eventi.push(await evento(e));
  await new Promise((r) => setTimeout(r, 300)); // una richiesta alla volta, con calma
}

fs.writeFileSync(
  OUT,
  `${JSON.stringify(
    {
      titolo: 'Tutte le stime della magnitudo di sette terremoti italiani nel catalogo INGV',
      fonte: 'INGV — webservices.ingv.it (FDSN), licenza CC BY 4.0',
      scaricato: new Date().toISOString().slice(0, 10),
      eventi,
    },
    null,
    1,
  )}\n`,
);
for (const e of eventi) console.log(e.nome.padEnd(18), e.tempo, e.stime.map((s) => `${s.tipo} ${s.valore}`).join(', '));
