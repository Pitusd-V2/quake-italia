/**
 * L'anteprima di una scossa quando il link viene condiviso (WhatsApp, Telegram, social): titolo, descrizione e immagine.
 * Usa le stesse funzioni delle pagine del sito, così l'anteprima dice le stesse cose della scheda.
 */
import { depthText, magLevel, placeText } from '../lib/describe';
import { formatMag, formatTime, TZ } from '../lib/format';
import { INGV_EVENT_API, parseCollection } from '../lib/ingv';
import type { Quake } from '../lib/types';
import type { OgLine } from './ogImage';
import { magKey } from './ogLayout';

/** Solo questi programmi leggono le anteprime: chi apre il link in un browser non aspetta nessuna richiesta in più. */
const PREVIEW_CLIENTS =
  /whatsapp|facebookexternalhit|facebot|telegrambot|twitterbot|slackbot|slack-imgproxy|discordbot|linkedinbot|skypeuripreview|pinterest|viber|redditbot|mastodon|bluesky|cardyb|embedly|iframely|vkshare|signal/i;

export const isPreviewClient = (userAgent: string | null) => !!userAgent && PREVIEW_CLIENTS.test(userAgent);
export const isQuakeId = (id: string) => /^\d{1,12}$/.test(id);

const dayFmt = new Intl.DateTimeFormat('it-IT', { timeZone: TZ, day: 'numeric', month: 'long', year: 'numeric' });

export interface QuakePreview {
  id: string;
  key: number;
  level: number;
  title: string;
  description: string;
  alt: string;
  lines: OgLine[];
}

/** I dati dell'anteprima; null se non è un terremoto o se la magnitudo non ha un'immagine pronta. */
export function previewOf(q: Quake): QuakePreview | null {
  const key = magKey(q.mag);
  if (key === null || q.type !== 'earthquake') return null;
  const mag = key / 10;
  const level = magLevel(mag, q.depthKm);
  const place = placeText(q.place);
  const province = /\(([A-Za-z]{2})\)\s*$/.exec(q.place)?.[1]?.toUpperCase();
  const name = province ? `${place.main} (${province})` : place.main;
  const when = `${dayFmt.format(q.time)}, ore ${formatTime(q.time)}`;
  const depth = depthText(q.depthKm);
  const m = formatMag(mag);
  // Le scosse in mare o all'estero non hanno distanza e provincia: quella riga semplicemente non c'è.
  const details: OgLine[] = place.sub
    ? [
        { text: place.sub, fonts: ['r30'], baseline: 104, shade: 14 },
        { text: `${when} · ${depth}`, fonts: ['r30'], baseline: 144, shade: 14 },
      ]
    : [{ text: `${when} · ${depth}`, fonts: ['r30'], baseline: 112, shade: 14 }];
  return {
    id: q.id,
    key,
    level: level.level,
    title: `Magnitudo ${m} · ${name}`,
    description: `${[when, place.sub, depth].filter(Boolean).join(' · ')}. Dati ufficiali INGV.`,
    alt: `Terremoto di magnitudo ${m} (${level.name.toLowerCase()}): ${place.full}, ${when}.`,
    lines: [{ text: name, fonts: ['b58', 'b42'], baseline: 56, shade: 15 }, ...details],
  };
}

export const quakeUrl = (id: string) => `${INGV_EVENT_API}?eventid=${id}&format=geojson`;

/** La scossa dall'INGV, o null se non c'è. La risposta è tenuta un minuto: un link condiviso da tanti pesa una volta sola. */
export async function loadQuake(id: string): Promise<Quake | null> {
  if (!isQuakeId(id)) return null;
  const res = await fetch(quakeUrl(id), {
    headers: { Accept: 'application/json', 'User-Agent': 'QuakeItalia-preview/1.0 (+https://quakeitalia.it)' },
    signal: AbortSignal.timeout(2500),
    cf: { cacheTtl: 60, cacheEverything: true },
  } as RequestInit);
  if (!res.ok || res.status === 204) return null;
  return parseCollection(await res.json()).find((q) => q.id === id) ?? null;
}

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** La pagina con titolo, descrizione e immagine della scossa al posto di quelli generici. */
export function withPreviewMeta(html: string, p: QuakePreview, origin: string): string {
  const url = `${origin}/terremoto/${p.id}`;
  // og:url con la magnitudo: alcune app salvano l'anteprima in base a questo indirizzo.
  const shared = `${url}?m=${p.key}`;
  const image = `${origin}/og/terremoto/${p.id}.png?m=${p.key}`;
  const meta = (attr: string, name: string, value: string, doc: string) =>
    doc.replace(new RegExp(`<meta ${attr}="${name}"[^>]*>`), () => `<meta ${attr}="${name}" content="${esc(value)}" />`);
  let out = html.replace(/<title>[^<]*<\/title>/, () => `<title>${esc(p.title)} — Quake Italia</title>`);
  out = out.replace(/<link rel="canonical"[^>]*>/, () => `<link rel="canonical" href="${esc(url)}" />`);
  for (const [attr, name, value] of [
    ['name', 'description', p.description],
    ['property', 'og:title', p.title],
    ['property', 'og:description', p.description],
    ['property', 'og:url', shared],
    ['property', 'og:image', image],
    ['property', 'og:image:alt', p.alt],
  ]) {
    out = meta(attr, name, value, out);
  }
  return out;
}
