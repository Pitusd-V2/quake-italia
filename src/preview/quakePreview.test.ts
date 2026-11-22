import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { inflateSync } from 'node:zlib';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { onRequestGet as imageRoute } from '../../functions/og/terremoto/[file]';
import { onRequestGet as pageRoute } from '../../functions/terremoto/[id]';
import { magLevel } from '../lib/describe';
import type { Quake } from '../lib/types';
import { composeOgPng, fitLine } from './ogImage';
import { BAND_BOTTOM, BAND_TOP, headFile, magKey, OG_H, OG_PALETTE, OG_W, TEXT_MAX } from './ogLayout';
import { isPreviewClient, isQuakeId, previewOf, quakeUrl, withPreviewMeta } from './quakePreview';

const DATA = join(process.cwd(), 'public', 'og-data');
const read = (name: string) => new Uint8Array(readFileSync(join(DATA, name)));

const quake = (over: Partial<Quake> = {}): Quake => ({
  id: '48036792',
  time: new Date(Date.UTC(2026, 10, 21, 21, 58, 53)),
  lat: 38.6875,
  lon: 16.3353,
  depthKm: 38,
  mag: 4.3,
  magType: 'ML',
  place: '4 km E Capistrano (VV)',
  author: 'SURVEY-INGV',
  version: 100,
  type: 'earthquake',
  ...over,
});

/** Legge il PNG come farebbe un programma: controlla la struttura e restituisce i pixel come indici di colore. */
function decode(png: Uint8Array) {
  const view = new DataView(png.buffer, png.byteOffset, png.byteLength);
  expect([...png.subarray(0, 8)]).toEqual([137, 80, 78, 71, 13, 10, 26, 10]);
  const crcTable = Array.from({ length: 256 }, (_, n) => {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    return c >>> 0;
  });
  const crc = (from: number, to: number) => {
    let c = 0xffffffff;
    for (let i = from; i < to; i++) c = crcTable[(c ^ png[i]) & 255] ^ (c >>> 8);
    return (c ^ 0xffffffff) >>> 0;
  };
  const chunks: Record<string, Uint8Array> = {};
  for (let p = 8; p < png.length; ) {
    const len = view.getUint32(p);
    const type = String.fromCharCode(...png.subarray(p + 4, p + 8));
    expect(view.getUint32(p + 8 + len), `CRC di ${type}`).toBe(crc(p + 4, p + 8 + len));
    chunks[type] = png.subarray(p + 8, p + 8 + len);
    p += 12 + len;
  }
  // inflateSync controlla anche il codice Adler-32 in fondo ai dati.
  const raw = inflateSync(chunks.IDAT);
  expect(raw.length).toBe(OG_H * (OG_W + 1));
  const pixels = new Uint8Array(OG_H * OG_W);
  for (let y = 0; y < OG_H; y++) {
    const at = y * (OG_W + 1);
    const filter = raw[at];
    expect([0, 2]).toContain(filter);
    for (let x = 0; x < OG_W; x++) {
      const up = filter === 2 ? pixels[(y - 1) * OG_W + x] : 0;
      pixels[y * OG_W + x] = (raw[at + 1 + x] + up) & 255;
    }
  }
  return { chunks, pixels };
}

describe('anteprima di una scossa: i testi', () => {
  it('dice magnitudo, luogo, data in ora italiana e profondità', () => {
    const p = previewOf(quake())!;
    expect(p.title).toBe('Magnitudo 4,3 · Capistrano (VV)');
    expect(p.description).toBe('21 novembre 2026, ore 22:58 · 4 km a est · provincia di Vibo Valentia · 38 km di profondità. Dati ufficiali INGV.');
    expect(p.lines.map((l) => l.text)).toEqual([
      'Capistrano (VV)',
      '4 km a est · provincia di Vibo Valentia',
      '21 novembre 2026, ore 22:58 · 38 km di profondità',
    ]);
  });

  it('usa il livello del sito, anche per le scosse molto superficiali', () => {
    expect(previewOf(quake({ mag: 4.4, depthKm: 2.6 }))!.level).toBe(magLevel(4.4, 2.6).level);
    expect(previewOf(quake({ mag: 4.4, depthKm: 20 }))!.level).toBe(3);
  });

  it('per le scosse in mare non inventa una riga con il luogo', () => {
    const p = previewOf(quake({ place: 'Tirreno Meridionale (MARE)' }))!;
    expect(p.title).toBe('Magnitudo 4,3 · Tirreno Meridionale (MARE)');
    expect(p.description).toBe('21 novembre 2026, ore 22:58 · 38 km di profondità. Dati ufficiali INGV.');
    expect(p.lines).toHaveLength(2);
  });

  it('non crea anteprime per eventi che non sono terremoti o con magnitudo fuori scala', () => {
    expect(previewOf(quake({ type: 'quarry blast' }))).toBeNull();
    expect(previewOf(quake({ mag: -0.4 }))).toBeNull();
    expect(previewOf(quake({ mag: 10 }))).toBeNull();
  });

  it('scrive in sicurezza i dati nella pagina', () => {
    const page = readFileSync(join(process.cwd(), 'index.html'), 'utf8');
    const html = `<title>x</title><meta name="description" content="a" /><link rel="canonical" href="b" /><meta property="og:title" content="c" /><meta property="og:description" content="d" /><meta property="og:url" content="e" /><meta property="og:image" content="f" /><meta property="og:image:alt" content="g" />${page.slice(0, 0)}`;
    const evil = previewOf(quake({ place: 'Paese "><script>alert(1)</script>' }))!;
    const out = withPreviewMeta(html, evil, 'https://quakeitalia.it');
    expect(out).not.toContain('<script>');
    expect(out).toContain('&quot;&gt;&lt;script&gt;');
    expect(out).toContain('content="https://quakeitalia.it/og/terremoto/48036792.png?m=43"');
    expect(out).toContain('<link rel="canonical" href="https://quakeitalia.it/terremoto/48036792" />');
  });

  it('chiede all’INGV solo numeri di evento validi', () => {
    expect(isQuakeId('48036792')).toBe(true);
    for (const bad of ['', 'abc', '1&format=text', '../x', '1234567890123']) expect(isQuakeId(bad)).toBe(false);
    expect(quakeUrl('48036792')).toBe('https://webservices.ingv.it/fdsnws/event/1/query?eventid=48036792&format=geojson');
  });

  it('riconosce chi crea le anteprime, non i browser', () => {
    for (const ua of ['WhatsApp/2.24.1 A', 'TelegramBot (like TwitterBot)', 'facebookexternalhit/1.1']) expect(isPreviewClient(ua)).toBe(true);
    expect(isPreviewClient('Mozilla/5.0 (Linux; Android 14) Chrome/130 Mobile Safari/537.36')).toBe(false);
    expect(isPreviewClient(null)).toBe(false);
  });
});

describe('anteprima di una scossa: l’immagine', () => {
  it('ha un pezzo pronto per ogni magnitudo e ogni livello possibile', () => {
    for (let k = 0; k <= 99; k++) {
      for (const depth of [10, 2]) {
        const level = magLevel(k / 10, depth).level;
        expect(existsSync(join(DATA, headFile(k, level))), `manca ${headFile(k, level)}`).toBe(true);
      }
    }
    expect(magKey(4.3)).toBe(43);
    expect(magKey(9.95)).toBeNull();
  });

  it('è un PNG valido, 1200×630, con il testo nella fascia centrale', () => {
    const p = previewOf(quake())!;
    const png = composeOgPng(read(headFile(p.key, p.level)), read('foot.bin'), read('glyphs.bin'), p.lines);
    const { chunks, pixels } = decode(png);
    const ihdr = new DataView(chunks.IHDR.buffer, chunks.IHDR.byteOffset);
    expect([ihdr.getUint32(0), ihdr.getUint32(4)]).toEqual([OG_W, OG_H]);
    expect(chunks.PLTE.length).toBe(OG_PALETTE.length);
    expect(OG_PALETTE.length / 3).toBeLessThanOrEqual(256);
    let ink = 0;
    for (let y = BAND_TOP; y < BAND_BOTTOM; y++) for (let x = 0; x < OG_W; x++) if (pixels[y * OG_W + x] === 15) ink++;
    expect(ink).toBeGreaterThan(2000);
    expect(png.length).toBeLessThan(300 * 1024);
  });

  it('accorcia i nomi troppo lunghi senza uscire dall’immagine', () => {
    const long = 'Costa Calabra sud-orientale e Mar Ionio settentrionale al largo di una località con un nome lunghissimo (Reggio di Calabria)';
    const line = { text: long, fonts: ['b58', 'b42'] as ('b58' | 'b42')[], baseline: 56, shade: 15 };
    const fit = fitLine(line);
    expect(fit.font).toBe('b42');
    expect(fit.chars[fit.chars.length - 1]).toBe('…');
    expect(TEXT_MAX).toBeGreaterThan(0);
    const p = previewOf(quake({ place: long }))!;
    decode(composeOgPng(read(headFile(p.key, p.level)), read('foot.bin'), read('glyphs.bin'), p.lines));
  });
});

describe('anteprima di una scossa: le funzioni su Cloudflare', () => {
  const SHELL =
    '<title>Quake Italia</title><meta name="description" content="generica" /><link rel="canonical" href="https://quakeitalia.it/" /><meta property="og:title" content="generica" /><meta property="og:description" content="generica" /><meta property="og:url" content="https://quakeitalia.it/" /><meta property="og:image" content="https://quakeitalia.it/og-image.png" /><meta property="og:image:alt" content="generica" />';
  const GEOJSON = {
    features: [
      {
        properties: { eventId: 48036792, time: '2026-11-21T21:58:53.020000', author: 'SURVEY-INGV', magType: 'ML', mag: 4.3, type: 'earthquake', place: '4 km E Capistrano (VV)', version: 100 },
        geometry: { coordinates: [16.3353, 38.6875, 38] },
      },
    ],
  };

  function context(path: string, userAgent: string, params: Record<string, string>) {
    const assets = vi.fn(async (input: string | URL | Request) => {
      const pathname = new URL(String(input instanceof Request ? input.url : input)).pathname;
      if (pathname === '/') return new Response(SHELL, { headers: { 'content-type': 'text/html', 'content-security-policy': "script-src 'self'" } });
      const name = pathname.replace('/og-data/', '');
      return existsSync(join(DATA, name)) ? new Response(read(name)) : new Response('', { status: 404 });
    });
    return {
      request: new Request(`https://quakeitalia.it${path}`, { headers: { 'user-agent': userAgent } }),
      params,
      env: { ASSETS: { fetch: assets } },
      next: vi.fn(async () => new Response('non usato')),
      waitUntil: vi.fn(),
      passThroughOnException: vi.fn(),
    };
  }

  function mockIngv(res: () => Response | Promise<Response>) {
    const f = vi.fn(async () => res());
    vi.stubGlobal('fetch', f);
    vi.stubGlobal('caches', { default: { match: vi.fn(async () => undefined), put: vi.fn(async () => undefined) } });
    return f;
  }

  afterEach(() => vi.unstubAllGlobals());

  it('chi apre il link nel browser riceve la pagina di sempre, senza chiamare l’INGV', async () => {
    const ingv = mockIngv(() => Response.json(GEOJSON));
    const res = await pageRoute(context('/terremoto/48036792', 'Mozilla/5.0 Chrome/130', { id: '48036792' }));
    expect(await res.text()).toBe(SHELL);
    expect(res.headers.get('content-security-policy')).toContain('script-src');
    expect(ingv).not.toHaveBeenCalled();
  });

  it('WhatsApp riceve titolo, descrizione e immagine della scossa, con le protezioni', async () => {
    const ingv = mockIngv(() => Response.json(GEOJSON));
    const res = await pageRoute(context('/terremoto/48036792', 'WhatsApp/2.24', { id: '48036792' }));
    const html = await res.text();
    expect(html).toContain('<meta property="og:title" content="Magnitudo 4,3 · Capistrano (VV)" />');
    expect(html).toContain('content="https://quakeitalia.it/og/terremoto/48036792.png?m=43"');
    expect(html).toContain('<link rel="canonical" href="https://quakeitalia.it/terremoto/48036792" />');
    expect(res.headers.get('content-security-policy')).toContain('script-src');
    expect(String(ingv.mock.calls[0]?.[0 as never])).toContain('eventid=48036792');
  });

  it('se l’INGV non risponde la pagina funziona lo stesso, con l’anteprima generica', async () => {
    mockIngv(() => {
      throw new Error('rete');
    });
    const res = await pageRoute(context('/terremoto/48036792', 'WhatsApp/2.24', { id: '48036792' }));
    expect(res.status).toBe(200);
    expect(await res.text()).toBe(SHELL);
  });

  it('con un indirizzo non valido non chiede niente all’INGV', async () => {
    const ingv = mockIngv(() => Response.json(GEOJSON));
    const res = await pageRoute(context('/terremoto/abc', 'WhatsApp/2.24', { id: 'abc' }));
    expect(await res.text()).toBe(SHELL);
    expect(ingv).not.toHaveBeenCalled();
  });

  it('crea l’immagine PNG della scossa e la mette in cache', async () => {
    mockIngv(() => Response.json(GEOJSON));
    const ctx = context('/og/terremoto/48036792.png?m=43', 'WhatsApp/2.24', { file: '48036792.png' });
    const res = await imageRoute(ctx);
    expect(res.headers.get('content-type')).toBe('image/png');
    decode(new Uint8Array(await res.arrayBuffer()));
    expect(ctx.waitUntil).toHaveBeenCalledOnce();
  });

  it('se l’immagine non si può fare porta a quella generica', async () => {
    mockIngv(() => new Response('', { status: 503 }));
    const res = await imageRoute(context('/og/terremoto/48036792.png', 'WhatsApp/2.24', { file: '48036792.png' }));
    expect(res.status).toBe(302);
    expect(res.headers.get('location')).toBe('https://quakeitalia.it/og-image.png');
    mockIngv(() => Response.json(GEOJSON));
    const bad = await imageRoute(context('/og/terremoto/x.png', 'WhatsApp/2.24', { file: 'x.png' }));
    expect(bad.status).toBe(404);
  });
});
