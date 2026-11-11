/**
 * Usato solo al build (scripts/prerender.mjs): disegna una pagina in HTML, in Node, senza browser.
 * Il risultato va nell'HTML statico; nel browser l'app normale (main.tsx) lo sostituisce con la versione viva.
 */
import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SettingsProvider } from './state/settings';
import { App } from './App';
import { preloadAllArticles } from './learn/catalog';
import { loadGlossary } from './learn/glossary';

export { PAGES } from './seo/pages';

export async function render(url: string): Promise<string> {
  // Gli articoli si scaricano a parte: al build li prepariamo tutti prima di disegnare.
  await Promise.all([preloadAllArticles(), loadGlossary()]);
  // Al build non si scarica niente: le parti con dati dal vivo restano «in caricamento», come al primo istante nel browser.
  const queryClient = new QueryClient({ defaultOptions: { queries: { enabled: false, retry: false } } });
  return renderToString(
    <QueryClientProvider client={queryClient}>
      <SettingsProvider>
        <StaticRouter location={url}>
          <App />
        </StaticRouter>
      </SettingsProvider>
    </QueryClientProvider>,
  );
}
