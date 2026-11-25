/**
 * Dati strutturati (schema.org, in JSON-LD) per Google e Bing: righe invisibili a chi legge che dicono cosa è la pagina.
 *  - home: il sito e chi lo cura (Quake Italia);
 *  - articoli di «Capire»: titolo, descrizione, data dell'ultimo controllo delle fonti, percorso (Capire › percorso).
 * Le date sono solo quelle vere (`verificato` dell'articolo): nessuna data di pubblicazione inventata.
 * Il blocco `<script type="application/ld+json">` contiene dati, non codice: il browser non lo esegue e la CSP non lo blocca.
 */
import { CATALOG } from '../learn/catalog';
import { PERCORSI } from '../learn/percorsi';
import { HOME_DESCRIPTION } from './pages';

const NAME = 'Quake Italia';

type Json = Record<string, unknown>;

function organization(site: string): Json {
  return {
    '@type': 'Organization',
    '@id': `${site}/#organizzazione`,
    name: NAME,
    url: `${site}/`,
    logo: { '@type': 'ImageObject', url: `${site}/pwa-512x512.png`, width: 512, height: 512 },
  };
}

function website(site: string): Json {
  return {
    '@type': 'WebSite',
    '@id': `${site}/#sito`,
    name: NAME,
    url: `${site}/`,
    description: HOME_DESCRIPTION,
    inLanguage: 'it-IT',
    publisher: { '@id': `${site}/#organizzazione` },
  };
}

/** I blocchi JSON-LD per una pagina (vuoto se la pagina non ne ha). */
export function structuredData(path: string, site: string): Json[] {
  if (path === '/') return [{ '@context': 'https://schema.org', '@graph': [website(site), organization(site)] }];

  const m = path.match(/^\/capire\/([a-z0-9-]+)$/);
  const card = m ? CATALOG.find((c) => c.slug === m[1]) : undefined;
  if (!card) return [];

  const url = `${site}${path}`;
  const percorso = PERCORSI.find((p) => p.id === card.percorso);
  const crumbs = [
    { name: 'Quake Italia', item: `${site}/` },
    { name: 'Capire', item: `${site}/capire` },
    ...(percorso ? [{ name: percorso.titolo, item: `${site}/capire#percorso-${percorso.id}` }] : []),
    { name: card.titolo },
  ];

  const article: Json = {
    '@type': 'Article',
    '@id': `${url}#articolo`,
    headline: card.titolo,
    description: card.sottotitolo,
    inLanguage: 'it-IT',
    url,
    mainEntityOfPage: url,
    dateModified: card.verificato,
    image: [`${site}/og-image.png`],
    author: { '@id': `${site}/#organizzazione` },
    publisher: { '@id': `${site}/#organizzazione` },
    isPartOf: { '@id': `${site}/#sito` },
    isAccessibleForFree: true,
    ...(percorso ? { articleSection: percorso.titolo } : {}),
    ...(card.paroleChiave?.length ? { keywords: card.paroleChiave.join(', ') } : {}),
  };

  const breadcrumb: Json = {
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c.name, ...(c.item ? { item: c.item } : {}) })),
  };

  return [{ '@context': 'https://schema.org', '@graph': [article, breadcrumb, organization(site), website(site)] }];
}

/** Il JSON-LD pronto da mettere nell'HTML: `<` diventa \u003c, così il testo non può chiudere il tag script. */
export function structuredDataTags(path: string, site: string): string {
  return structuredData(path, site)
    .map((d) => `<script type="application/ld+json">${JSON.stringify(d).replace(/</g, '\\u003c')}</script>`)
    .join('\n    ');
}

/** Data dell'ultimo aggiornamento per la mappa del sito: solo per gli articoli, che hanno una data vera. */
export function lastModified(path: string): string | undefined {
  const m = path.match(/^\/capire\/([a-z0-9-]+)$/);
  return m ? CATALOG.find((c) => c.slug === m[1])?.verificato : undefined;
}
