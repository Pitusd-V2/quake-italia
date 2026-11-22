/**
 * L'immagine di anteprima di una scossa: /og/terremoto/48036792.png?m=43
 * Il parametro «m» è la magnitudo in decimi: se l'INGV la corregge cambia l'indirizzo, e i programmi non riusano la vecchia.
 * Se qualcosa va storto si passa all'immagine generica del sito.
 */
import { composeOgPng } from '../../../src/preview/ogImage';
import { headFile, OG_DATA_PATH } from '../../../src/preview/ogLayout';
import type { PagesContext } from '../../../src/preview/pagesTypes';
import { loadQuake, previewOf } from '../../../src/preview/quakePreview';

const edgeCache = () => (caches as unknown as { default: Cache }).default;

export async function onRequestGet(ctx: PagesContext): Promise<Response> {
  const url = new URL(ctx.request.url);
  const match = /^(\d{1,12})\.png$/.exec(String(ctx.params.file));
  if (!match) return new Response('Immagine non trovata', { status: 404 });
  const generic = () => Response.redirect(`${url.origin}/og-image.png`, 302);

  // Parametri inventati non creano copie nuove: nella chiave entra solo una magnitudo valida.
  const m = url.searchParams.get('m') ?? '';
  const key = new Request(`${url.origin}/og/terremoto/${match[1]}.png${/^\d{1,2}$/.test(m) ? `?m=${m}` : ''}`);
  try {
    const cached = await edgeCache().match(key);
    if (cached) return cached;

    const quake = await loadQuake(match[1]);
    const preview = quake && previewOf(quake);
    if (!preview) return generic();

    const asset = async (name: string) => {
      const res = await ctx.env.ASSETS.fetch(new URL(`${OG_DATA_PATH}/${name}`, url.origin));
      if (!res.ok) throw new Error(`Manca ${name}`);
      return new Uint8Array(await res.arrayBuffer());
    };
    const [head, foot, glyphs] = await Promise.all([
      asset(headFile(preview.key, preview.level)),
      asset('foot.bin'),
      asset('glyphs.bin'),
    ]);
    const png = composeOgPng(head, foot, glyphs, preview.lines);
    const res = new Response(png, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=3600',
        'X-Content-Type-Options': 'nosniff',
        // Le app che creano l'anteprima la scaricano da un altro sito.
        'Cross-Origin-Resource-Policy': 'cross-origin',
      },
    });
    ctx.waitUntil(edgeCache().put(key, res.clone()));
    return res;
  } catch {
    return generic();
  }
}
