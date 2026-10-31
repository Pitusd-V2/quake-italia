/**
 * Difese sui dati che arrivano da fuori (INGV, Photon, barra degli indirizzi, localStorage).
 *
 * React mostra già i testi come testo (niente HTML eseguito), ma qui andiamo oltre:
 * se un servizio esterno venisse manomesso, non deve riuscire a farci mostrare
 * link, testi lunghissimi, caratteri invisibili o testo "girato" per ingannare.
 */

// Caratteri di controllo, invisibili (zero-width) e di direzione del testo (usati per mascherare link).
const BAD_CHARS = /[\u0000-\u001F\u007F-\u009F​-‏‪-‮⁠-⁩﻿]/g;
// Indirizzi web dentro a un testo che dovrebbe essere solo un nome di luogo.
const URL_LIKE = /\b(?:https?:\/\/|www\.)\S+|\b[\w-]+\.(?:com|net|org|io|xyz|top|ru|cn|info|biz|link|click)\b\S*/gi;

/** Testo pulito, senza link, di lunghezza massima `max`. */
export function cleanText(value: unknown, max = 120): string {
  if (value == null) return '';
  return String(value)
    .normalize('NFC')
    .replace(BAD_CHARS, '')
    // Pezzi di HTML: React non li eseguirebbe comunque, ma un nome di luogo non li contiene mai.
    .replace(/<[^>]*>?/g, '')
    .replace(/[<>]/g, '')
    .replace(URL_LIKE, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max);
}

/** Identificativi degli eventi: solo lettere, numeri, "-" e "_". */
export const isSafeId = (id: unknown): id is string => typeof id === 'string' && /^[A-Za-z0-9_-]{1,40}$/.test(id);

export const inRange = (n: number, min: number, max: number) => Number.isFinite(n) && n >= min && n <= max;

export const isLat = (n: number) => inRange(n, -90, 90);
export const isLon = (n: number) => inRange(n, -180, 180);

/**
 * Gli unici siti verso cui Quake Italia mette link. Un link verso un altro dominio
 * (o non https) non viene mostrato come link: è una rete di sicurezza contro errori o manomissioni.
 */
export const ALLOWED_LINK_HOSTS = new Set([
  'terremoti.ingv.it',
  'webservices.ingv.it',
  'ingvterremoti.com',
  'emidius.mi.ingv.it',
  'www.hsit.it',
  'rischi.protezionecivile.gov.it',
  'iononrischio.protezionecivile.it',
  'www.it-alert.gov.it',
  'creativecommons.org',
  'openfreemap.org',
  'www.openmaptiles.org',
  'www.openstreetmap.org',
  'photon.komoot.io',
  'www.google.com',
  // Pagine legali (privacy)
  'www.garanteprivacy.it',
  'eur-lex.europa.eu',
  'www.ingv.it',
  'www.komoot.com',
  'www.cloudflare.com',
  'www.netlify.com',
  'docs.github.com',
  // Fonti di «Capire i terremoti»
  'www.usgs.gov',
  'doi.org',
  'dfm.ingv.it',
  'zonesismiche.mi.ingv.it',
  'www.earth-prints.org',
  // Fonti degli articoli su storia e vulcani
  'www.ov.ingv.it',
  'storing.ingv.it',
  'cfti.ingv.it',
  'collane-editoriali.ingv.it',
  'servizio-nazionale.protezionecivile.gov.it',
  'iononrischio.protezionecivile.gov.it',
  // Fonti della pagina «La casa ha dei danni»
  'www.protezionecivile.gov.it',
  'emergenze.protezionecivile.gov.it',
  'domande-risposte.protezionecivile.gov.it',
  // Fonti della pagina «È vero?»
  'www.ilpost.it',
  'www.focus.it',
  // Fonte dei paragoni «Così si è sentita» (scala EMS-98)
  'quakes.bgs.ac.uk',
  // Fonti di «Esiste il tempo da terremoto?» (testi antichi, giornale con l'intervista INGV, dati meteo)
  'classics.mit.edu',
  'www.perseus.tufts.edu',
  'www.lanazione.it',
  'open-meteo.com',
  'archive-api.open-meteo.com',
  // Fonte di «Il mal da terremoto» (segni dell'ictus)
  'www.issalute.it',
  // Fonte dell'articolo sui Campi Flegrei (fase 2 dell'allerta gialla)
  'www.agi.it',
  // Il codice aperto del sito
  'github.com',
  'www.gnu.org',
]);

export function isAllowedLink(href: string): boolean {
  try {
    const u = new URL(href);
    return u.protocol === 'https:' && ALLOWED_LINK_HOSTS.has(u.hostname) && !u.username && !u.password;
  } catch {
    return false;
  }
}
