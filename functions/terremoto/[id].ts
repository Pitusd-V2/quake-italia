/**
 * Pagina di una scossa. Per chi la apre nel browser è la pagina statica di sempre. Ai programmi che creano l'anteprima
 * dei link (WhatsApp, Telegram…) dà titolo, descrizione e immagine della scossa. Se qualcosa va storto resta l'anteprima
 * generica: la pagina non deve mai dipendere da questo.
 */
import { withSecurityHeaders, type PagesContext } from '../../src/preview/pagesTypes';
import { isPreviewClient, isQuakeId, loadQuake, previewOf, withPreviewMeta } from '../../src/preview/quakePreview';

export async function onRequestGet(ctx: PagesContext): Promise<Response> {
  ctx.passThroughOnException();
  const url = new URL(ctx.request.url);
  // La scheda di una scossa è l'app, cioè la pagina iniziale: la stessa che dà la regola in _redirects.
  const page = withSecurityHeaders(await ctx.env.ASSETS.fetch(new URL('/', url.origin)));
  const id = String(ctx.params.id);
  // I link del pulsante «Condividi» hanno ?m=43: l'anteprima deve esserci anche se l'app non si fa riconoscere.
  const shared = /^\d{1,2}$/.test(url.searchParams.get('m') ?? '');
  const wanted = shared || isPreviewClient(ctx.request.headers.get('user-agent')) || url.searchParams.has('anteprima');
  if (!wanted || !page.ok || !isQuakeId(id)) return page;

  try {
    const quake = await loadQuake(id);
    const preview = quake && previewOf(quake);
    if (!preview) return page;
    const html = withPreviewMeta(await page.clone().text(), preview, url.origin);
    const headers = new Headers(page.headers);
    headers.delete('content-length');
    headers.delete('etag');
    // La cache resta quella della pagina: anche le persone aprono questi link e devono ricevere sempre l'ultima versione.
    return new Response(html, { status: 200, headers });
  } catch {
    return page;
  }
}
