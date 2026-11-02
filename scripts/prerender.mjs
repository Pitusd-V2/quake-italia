/**
 * Dopo `vite build`: crea un file HTML per ogni pagina, con titolo, descrizione e anteprima per i link,
 * e, per le pagine che non invecchiano (articoli, consigli, pagine legali), con il testo già dentro.
 * Così Google legge i contenuti e WhatsApp mostra un'anteprima giusta. Nel browser l'app parte come sempre
 * e sostituisce l'HTML con la versione viva.
 *
 * Indirizzo del sito: variabile SITE_URL oppure `siteUrl` in src/legal/config.ts. Finché non è un indirizzo
 * https vero, niente link canonici, mappa del sito e immagine di anteprima (servono indirizzi completi).
 *
 * Controlli: se una pagina contiene uno script in linea o uno stile in linea (vietati dalla CSP), il build si ferma.
 */
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const root = path.resolve(import.meta.dirname, '..');
const dist = path.join(root, 'dist');
const { render, PAGES } = await import(pathToFileURL(path.join(root, 'dist-ssr', 'entry-server.js')).href);

const config = fs.readFileSync(path.join(root, 'src', 'legal', 'config.ts'), 'utf8');
const configured = process.env.SITE_URL ?? config.match(/siteUrl:\s*'([^']*)'/)?.[1] ?? '';
const site = /^https:\/\/[a-z0-9.-]+\.[a-z]{2,}$/i.test(configured.replace(/\/$/, '')) ? configured.replace(/\/$/, '') : null;
if (!site) console.warn('⚠ Indirizzo del sito non ancora impostato: niente link canonici, mappa del sito e immagine di anteprima.');

// Il modello è dist/index.html; se lo script viene rilanciato, toglie prima i tag che aveva aggiunto.
const template = fs
  .readFileSync(path.join(dist, 'index.html'), 'utf8')
  .replace(/\s*<meta property="og:[^>]*>|\s*<meta name="twitter:[^>]*>|\s*<meta name="robots"[^>]*>|\s*<link rel="canonical"[^>]*>/g, '');
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function head(page) {
  const tags = [
    `<meta name="description" content="${esc(page.description)}" />`,
    `<meta property="og:site_name" content="Quake Italia" />`,
    `<meta property="og:locale" content="it_IT" />`,
    `<meta property="og:type" content="${page.path.startsWith('/capire/') ? 'article' : 'website'}" />`,
    `<meta property="og:title" content="${esc(page.title)}" />`,
    `<meta property="og:description" content="${esc(page.description)}" />`,
  ];
  if (site) {
    const url = `${site}${page.path === '/' ? '/' : page.path}`;
    tags.push(
      `<link rel="canonical" href="${esc(url)}" />`,
      `<meta property="og:url" content="${esc(url)}" />`,
      `<meta property="og:image" content="${site}/og-image.png" />`,
      `<meta property="og:image:width" content="1200" />`,
      `<meta property="og:image:height" content="630" />`,
      `<meta property="og:image:alt" content="Quake Italia: capire i terremoti, con i dati ufficiali INGV." />`,
      `<meta name="twitter:card" content="summary_large_image" />`,
    );
  }
  return tags.join('\n    ');
}

function build(page, body, extraHead = '') {
  let html = template
    .replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(page.title)}</title>`)
    .replace(/<meta\s+name="description"[\s\S]*?\/>/, head(page) + extraHead);
  if (!html.includes(`<title>${esc(page.title)}</title>`) || !html.includes('property="og:title"')) {
    throw new Error(`Modello HTML inatteso: non riesco a inserire titolo e descrizione (${page.path})`);
  }
  return html.replace('<div id="root"></div>', `<div id="root">${body}</div>`);
}

/** Il disegno della pagina, senza stili in linea (la CSP li bloccherebbe: l'app li rimette appena parte). */
function content(page) {
  const html = render(page.path).replace(/\sstyle="[^"]*"/g, '');
  if (/<script/i.test(html)) throw new Error(`Script in linea nella pagina ${page.path}`);
  if (/\sstyle=/i.test(html)) throw new Error(`Stile in linea rimasto nella pagina ${page.path}`);
  if (!html.includes('<h1')) throw new Error(`La pagina ${page.path} non ha un titolo <h1>: qualcosa non è stato disegnato`);
  return html;
}

const fileFor = (p) => path.join(dist, `${p.slice(1)}.html`); // /capire/x → dist/capire/x.html (indirizzo /capire/x)

let full = 0;
let meta = 0;
for (const page of PAGES) {
  if (page.path === '/') {
    fs.writeFileSync(path.join(dist, 'index.html'), build(page, ''));
    continue;
  }
  if (page.prerender === 'none') continue;
  const body = page.prerender === 'full' ? content(page) : '';
  fs.mkdirSync(path.dirname(fileFor(page.path)), { recursive: true });
  fs.writeFileSync(fileFor(page.path), build(page, body));
  if (page.prerender === 'full') full++;
  else meta++;
}

// Pagina per gli indirizzi che non esistono: stessa app (mostra «pagina non trovata»), ma Google non la indicizza.
fs.writeFileSync(
  path.join(dist, '404.html'),
  build({ path: '/404', title: 'Pagina non trovata — Quake Italia', description: 'Questa pagina non esiste.' }, '', '\n    <meta name="robots" content="noindex" />'),
);

// Robot e mappa del sito.
const indexable = PAGES.filter((p) => p.sitemap);
fs.writeFileSync(path.join(dist, 'robots.txt'), `User-agent: *\nAllow: /\n${site ? `\nSitemap: ${site}/sitemap.xml\n` : ''}`);
if (site) {
  const urls = indexable.map((p) => `  <url><loc>${esc(`${site}${p.path}`)}</loc></url>`).join('\n');
  fs.writeFileSync(path.join(dist, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`);
}

console.log(`Pagine generate: ${full} con il testo, ${meta} con solo titolo e descrizione, più 404.html e robots.txt${site ? ' e sitemap.xml' : ''}.`);
