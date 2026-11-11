/**
 * Gli articoli di «Capire».
 *  - CATALOG: titoli, percorsi, date… (leggero, sempre nell'app): per elenchi, ricerca e Google.
 *  - loadArticle: il testo vero, scaricato solo quando qualcuno apre l'articolo.
 * I file sono in contenuti/articoli/*.mdx; al build plugins/articoli.ts li controlla tutti.
 */
import type { ComponentType } from 'react';
import cards from 'virtual:articoli';
import type { ArticleCard, ArticleData } from './articleTypes';
import { loadGlossary } from './glossary';

export const CATALOG: ArticleCard[] = cards;
export const findCard = (slug: string | undefined) => CATALOG.find((c) => c.slug === slug);

export interface ArticleModule {
  default: ComponentType<{ components?: Record<string, unknown> }>;
  frontmatter: Omit<ArticleData, 'slug'>;
}

const files = import.meta.glob<ArticleModule>('../../contenuti/articoli/*.mdx');
const loaders = new Map(Object.entries(files).map(([file, load]) => [file.slice(file.lastIndexOf('/') + 1, -'.mdx'.length), load]));

/** Promessa che ricorda il suo stato: così `use()` di React la legge subito se è già pronta (anche al build). */
type Tracked<T> = Promise<T> & { status?: 'pending' | 'fulfilled' | 'rejected'; value?: T; reason?: unknown };
const cache = new Map<string, Tracked<ArticleModule>>();

export function loadArticle(slug: string): Tracked<ArticleModule> {
  let p = cache.get(slug);
  if (!p) {
    const load = loaders.get(slug);
    if (!load) throw new Error(`Articolo sconosciuto: ${slug}`);
    const tracked: Tracked<ArticleModule> = load();
    tracked.status = 'pending';
    tracked.then(
      (value) => {
        tracked.status = 'fulfilled';
        tracked.value = value;
      },
      (reason) => {
        tracked.status = 'rejected';
        tracked.reason = reason;
        cache.delete(slug); // un errore di rete non resta per sempre: al prossimo tentativo si riprova
      },
    );
    cache.set(slug, tracked);
    p = tracked;
  }
  return p;
}

export const hasArticleFile = (slug: string) => loaders.has(slug);

/** Al build: tutti gli articoli pronti prima di generare le pagine. */
export const preloadAllArticles = () => Promise.all(CATALOG.map((c) => loadArticle(c.slug)));

/** All'apertura del sito su un articolo: lo scarica prima di disegnare, così il testo già nella pagina non «lampeggia». */
export function preloadForPath(pathname: string): Promise<void> {
  const m = pathname.match(/^\/capire\/([a-z0-9-]+)\/?$/);
  // Lo stesso per il glossario generale.
  if (m?.[1] === 'glossario') return loadGlossary().then(() => undefined, () => undefined);
  if (!m || !loaders.has(m[1])) return Promise.resolve();
  return loadArticle(m[1]).then(
    () => undefined,
    () => undefined,
  );
}
