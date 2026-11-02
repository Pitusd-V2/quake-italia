/**
 * Crea public/og-image.png (1200×630): l'immagine che WhatsApp, Telegram e social mostrano quando si condivide un link.
 *   node scripts/build-og-image.mjs
 * Basta rilanciarlo se cambiano logo, nome o slogan.
 */
import fs from 'node:fs';
// sharp arriva con @vite-pwa/assets-generator (lo stesso che crea le icone).
import sharp from 'sharp';

const logo = fs.readFileSync(new URL('../public/logo.svg', import.meta.url), 'utf8');
const inner = logo.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="#0e5e7e"/>
  <rect x="0" y="560" width="1200" height="70" fill="#0a4a64"/>
  <g transform="translate(96 150) scale(5)">${inner}</g>
  <text x="460" y="285" font-family="Arial, Helvetica, sans-serif" font-size="96" font-weight="700" fill="#ffffff">Quake Italia</text>
  <text x="462" y="360" font-family="Arial, Helvetica, sans-serif" font-size="40" fill="#e3f1f6">Capire i terremoti,</text>
  <text x="462" y="412" font-family="Arial, Helvetica, sans-serif" font-size="40" fill="#e3f1f6">con i dati ufficiali INGV.</text>
  <text x="600" y="605" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="27" fill="#e3f1f6">Gratuito · senza registrazione · non è un sistema di allerta: in emergenza chiama il 112</text>
</svg>`;

await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toFile(new URL('../public/og-image.png', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'));
console.log('Creato public/og-image.png');
