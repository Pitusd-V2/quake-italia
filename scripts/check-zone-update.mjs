/**
 * Controlla se la Protezione Civile ha pubblicato una classificazione sismica diversa da quella usata dal sito.
 *
 *   node scripts/check-zone-update.mjs            controlla e basta
 *   node scripts/check-zone-update.mjs --update   riscrive src/data/zone-sismiche.json con i dati ufficiali
 *
 * Esce con 0 se i dati coincidono, 1 se c'è qualcosa di nuovo, 2 se il controllo non è riuscito
 * (sito irraggiungibile o pagina cambiata). Il riassunto viene scritto anche in zone-check.md,
 * che il controllo settimanale di GitHub usa come testo della segnalazione.
 */
import fs from 'node:fs';

const PAGE = 'https://rischi.protezionecivile.gov.it/it/sismico/attivita/classificazione-sismica/';
const ORIGIN = 'https://rischi.protezionecivile.gov.it';
const DATA = new URL('../src/data/zone-sismiche.json', import.meta.url);
const REPORT = 'zone-check.md';
const update = process.argv.includes('--update');

function report(code, title, lines) {
  const text = [`## ${title}`, '', ...lines, '', `Pagina ufficiale: ${PAGE}`].join('\n');
  fs.writeFileSync(REPORT, `${text}\n`);
  console.log(text);
  process.exit(code);
}

async function get(url) {
  const res = await fetch(url, { headers: { 'User-Agent': 'quake-italia (controllo classificazione sismica)' } });
  if (!res.ok) throw new Error(`${res.status} per ${url}`);
  return res.text();
}

/** "maggio 2025" dal testo della fonte o dal nome del file ufficiale. */
const versionOf = (s) => (s.match(/aggiornata[- ](?:a[- ])?([a-z]+)[- ](\d{4})/i) ?? []).slice(1, 3).join(' ').toLowerCase();

let page;
let csv;
let csvUrl;
try {
  page = await get(PAGE);
  const links = [...page.matchAll(/href="([^"]*classificazione-sismica[^"]*\.csv)"/gi)].map((m) => m[1]);
  if (links.length !== 1) throw new Error(`trovati ${links.length} file CSV invece di 1`);
  csvUrl = links[0].startsWith('http') ? links[0] : `${ORIGIN}${links[0]}`;
  csv = (await get(csvUrl)).replace(/^﻿/, '');
} catch (e) {
  report(2, 'Classificazione sismica: controllo non riuscito', [
    `Non sono riuscito a leggere i dati ufficiali (${e.message}).`,
    'Può essere un problema temporaneo del sito o un cambio della sua struttura: se si ripete, va aggiornato lo script `scripts/check-zone-update.mjs`.',
  ]);
}

// Dati ufficiali: REGIONE;PROV_CITTA_METROPOLITANA;SIGLA_PROV;COMUNE;COD_ISTAT_COMUNE;ZONA_SISMICA
const [header, ...rows] = csv.trim().split(/\r?\n/);
const cols = header.split(';');
const at = (name) => cols.indexOf(name);
if (['SIGLA_PROV', 'COMUNE', 'ZONA_SISMICA'].some((c) => at(c) < 0)) {
  report(2, 'Classificazione sismica: formato del file cambiato', [`Intestazione trovata: \`${header}\`.`, `File: ${csvUrl}`]);
}
const official = rows.map((r) => {
  const c = r.split(';').map((x) => x.trim());
  return `${c[at('COMUNE')]};${c[at('SIGLA_PROV')]};${c[at('ZONA_SISMICA')]}`;
});

const ours = JSON.parse(fs.readFileSync(DATA, 'utf8'));
const officialVersion = versionOf(decodeURIComponent(csvUrl));
const ourVersion = versionOf(ours.fonte);

if (update) {
  const fonte = `Dipartimento della Protezione Civile - Classificazione sismica aggiornata a ${officialVersion}`;
  fs.writeFileSync(DATA, JSON.stringify({ fonte, comuni: official }));
  console.log(`Scritto ${official.length} comuni (${officialVersion}). Ricorda di aggiornare la data anche in src/lib/seismicZones.ts.`);
  process.exit(0);
}

const key = (r) => r.split(';').slice(0, 2).join(';');
const mine = new Map(ours.comuni.map((r) => [key(r), r]));
const theirs = new Map(official.map((r) => [key(r), r]));
const added = [...theirs.keys()].filter((k) => !mine.has(k));
const removed = [...mine.keys()].filter((k) => !theirs.has(k));
const changed = [...theirs.keys()].filter((k) => mine.has(k) && mine.get(k) !== theirs.get(k));
const show = (list, fmt) => list.slice(0, 15).map((k) => `- ${fmt(k)}`).concat(list.length > 15 ? [`- … e altri ${list.length - 15}`] : []);

if (officialVersion === ourVersion && !added.length && !removed.length && !changed.length) {
  console.log(`Nessuna novità: ${official.length} comuni, classificazione aggiornata a ${officialVersion}.`);
  process.exit(0);
}

const title =
  officialVersion === ourVersion
    ? `Classificazione sismica: i dati ufficiali (${officialVersion}) sono cambiati`
    : `Classificazione sismica: nuova versione (${officialVersion || 'data non riconosciuta'})`;
report(1, title, [
  `Il sito usa la versione «${ourVersion}», la Protezione Civile pubblica «${officialVersion}».`,
  `Comuni: ${official.length} ufficiali, ${ours.comuni.length} nel sito.`,
  '',
  `**Zona cambiata (${changed.length})**`,
  ...show(changed, (k) => `${k.replace(';', ' (')}): ${mine.get(k).split(';')[2]} → ${theirs.get(k).split(';')[2]}`),
  '',
  `**Comuni nuovi (${added.length})**`,
  ...show(added, (k) => k.replace(';', ' (') + ')'),
  '',
  `**Comuni non più in elenco (${removed.length})**`,
  ...show(removed, (k) => k.replace(';', ' (') + ')'),
  '',
  'Per aggiornare: `node scripts/check-zone-update.mjs --update`, poi la data in `src/lib/seismicZones.ts`, poi `npm run build`.',
  `File ufficiale: ${csvUrl}`,
]);
