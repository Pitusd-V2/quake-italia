/**
 * HEADER DI SICUREZZA — un'unica fonte per:
 *   - il file `_headers` generato nel build (Cloudflare Pages / Netlify),
 *   - il server `npm run preview`, per provarli in locale.
 *
 * Se aggiungi un servizio esterno (API, mappe, font...), va aggiunto qui in `connect-src`
 * (o nella direttiva giusta), altrimenti il browser lo blocca: è voluto.
 */

/** Gli unici domini esterni con cui il sito può parlare. */
export const ALLOWED_CONNECT = [
  'https://webservices.ingv.it', // dati sui terremoti
  'https://photon.komoot.io', // ricerca dei comuni
  'https://tiles.openfreemap.org', // mappe (stile, tasselli, caratteri, icone)
];

const csp = [
  "default-src 'self'",
  // Solo i nostri file JS: niente script in linea, niente eval, niente CDN.
  "script-src 'self'",
  // Il worker della mappa è un nostro file; blob: serve a MapLibre in alcuni browser.
  "worker-src 'self' blob:",
  // Fogli di stile solo nostri. Gli stili impostati da JavaScript (React, MapLibre) restano permessi.
  "style-src 'self'",
  "img-src 'self' data: blob:",
  "font-src 'self'",
  `connect-src 'self' ${ALLOWED_CONNECT.join(' ')}`,
  "manifest-src 'self'",
  // Nessun contenuto incorporato e nessun plugin.
  "object-src 'none'",
  "frame-src 'none'",
  // Impedisce di cambiare la base degli URL relativi (attacco con <base href>).
  "base-uri 'none'",
  "form-action 'self'",
  // Il sito non può essere messo dentro un iframe altrui (clickjacking).
  "frame-ancestors 'none'",
  'upgrade-insecure-requests',
].join('; ');

export const SECURITY_HEADERS: Record<string, string> = {
  'Content-Security-Policy': csp,
  // Solo HTTPS per 2 anni (attivo solo quando il sito è servito in HTTPS).
  'Strict-Transport-Security': 'max-age=63072000; includeSubDomains',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  // Il sito può chiedere solo la posizione (per "Usa la mia posizione"); tutto il resto è spento.
  'Permissions-Policy':
    'geolocation=(self), camera=(), microphone=(), payment=(), usb=(), bluetooth=(), serial=(), hid=(), midi=(), magnetometer=(), gyroscope=(), accelerometer=(), display-capture=(), browsing-topics=()',
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Resource-Policy': 'same-origin',
  'X-Permitted-Cross-Domain-Policies': 'none',
};

/** Contenuto del file `_headers` (Cloudflare Pages / Netlify). */
export function headersFile(): string {
  const lines = ['/*', ...Object.entries(SECURITY_HEADERS).map(([k, v]) => `  ${k}: ${v}`)];
  // Il service worker e la pagina non vanno tenuti in cache a lungo: gli aggiornamenti (anche di sicurezza) arrivano subito.
  lines.push('', '/sw.js', '  Cache-Control: no-cache', '', '/index.html', '  Cache-Control: no-cache');
  // I file con l'impronta nel nome non cambiano mai: cache lunga.
  lines.push('', '/assets/*', '  Cache-Control: public, max-age=31536000, immutable');
  return `${lines.join('\n')}\n`;
}
