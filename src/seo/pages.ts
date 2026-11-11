/**
 * Titolo e descrizione di ogni pagina: per la scheda del browser, per Google e per l'anteprima dei link (WhatsApp…).
 * Le descrizioni riprendono i testi già presenti nelle pagine (niente promesse nuove).
 *
 * `prerender`:
 *  - 'full': al build la pagina viene generata con il testo già dentro l'HTML (contenuti che non invecchiano);
 *  - 'meta': solo titolo e descrizione, il contenuto arriva dal vivo (dati che cambiano di minuto in minuto);
 *  - 'none': nessun file a parte (pagine personali o con indirizzo variabile).
 */
import { CATALOG } from '../learn/catalog';
import { TAGLINE } from '../lib/brand';

export interface PageMeta {
  path: string;
  title: string;
  description: string;
  prerender: 'full' | 'meta' | 'none';
  /** Da elencare nella mappa del sito per Google. */
  sitemap: boolean;
}

const SITE = 'Quake Italia';
export const HOME_TITLE = `${SITE} — Capire i terremoti, con i dati ufficiali INGV`;
export const HOME_DESCRIPTION =
  'Capire i terremoti in Italia, con i dati ufficiali INGV: le scosse vicino a te, la zona sismica del tuo comune, cosa fare e articoli con le fonti. Gratuito, senza pubblicità.';

const page = (path: string, title: string, description: string, prerender: PageMeta['prerender'], sitemap = true): PageMeta => ({
  path,
  title: `${title} — ${SITE}`,
  description,
  prerender,
  sitemap,
});

export const PAGES: PageMeta[] = [
  { path: '/', title: HOME_TITLE, description: HOME_DESCRIPTION, prerender: 'none', sitemap: true },
  page('/terremoti', 'Terremoti in Italia', 'Tutti i terremoti registrati dall’INGV in Italia e nei mari vicini, dal più recente, in elenco e sulla mappa.', 'meta'),
  page('/ho-sentito', 'Ho sentito una scossa', 'Hai sentito tremare? Cerchiamo tra i terremoti registrati dall’INGV quello che potresti aver sentito, e ti diciamo cosa fare.', 'meta'),
  page('/il-mio-comune', 'Il mio comune', 'La zona sismica ufficiale del tuo comune, i terremoti più forti nei dintorni dal 1985 e come preparare la casa.', 'meta'),
  page('/cosa-fare', 'Cosa fare in caso di terremoto', 'Pochi consigli semplici, prima, durante e dopo una scossa. Leggili con calma oggi: ti saranno utili se un giorno servirà.', 'full'),
  page('/danni-casa', 'La casa ha dei danni: cosa fare', 'Dopo una scossa forte: come capire se è meglio uscire, chi chiamare, come funziona il controllo della casa e quali aiuti esistono.', 'full'),
  page('/e-vero', 'È vero? Le voci sui terremoti', 'Dopo una scossa girano tanti messaggi, audio e «previsioni». Le voci più comuni, con la risposta degli scienziati e le fonti.', 'full'),
  page('/capire', 'Capire i terremoti', 'Brevi letture, in parole semplici ma con le parole giuste della scienza. Ogni articolo usa dati veri dell’INGV e fonti pubbliche.', 'full'),
  page('/capire/glossario', 'Le parole della scienza', 'Il glossario dei terremoti: ipocentro, magnitudo, faglia, replica… tutte le parole spiegate negli articoli, dalla A alla Z, ognuna con l’articolo da cui viene.', 'full'),
  ...CATALOG.map((a) => page(`/capire/${a.slug}`, a.titolo, a.sottotitolo, 'full')),
  page('/come-scriviamo', 'Come scriviamo gli articoli', 'Le fonti che usiamo, come le controlliamo, chi scrive gli articoli e come correggiamo gli errori.', 'full'),
  page('/informazioni', 'Informazioni', `${TAGLINE} Perché esiste Quake Italia, da dove arrivano i dati e come li usiamo.`, 'full'),
  page('/privacy', 'Privacy Policy', 'Come Quake Italia tratta i tuoi dati, in parole semplici: niente account, niente cookie, niente statistiche né pubblicità.', 'full'),
  page('/termini', 'Termini d’uso', 'Le regole per usare Quake Italia e, soprattutto, i suoi limiti: non prevede i terremoti e non è un sistema di allerta.', 'full'),
  page('/analisi', 'Analisi', 'Ricerca nel catalogo INGV con filtri avanzati, grafici, tabelle ed esportazione dei dati.', 'meta'),
  page('/impostazioni', 'Impostazioni', 'Comune, grandezza del testo, colori e avvisi. Tutto resta salvato solo sul tuo dispositivo.', 'meta', false),
];

const byPath = new Map(PAGES.map((p) => [p.path, p]));

/** I dati della pagina per un indirizzo; per le pagine senza voce (es. una singola scossa) quelli generali. */
export function metaFor(pathname: string): { title: string; description: string } {
  const clean = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname;
  return byPath.get(clean) ?? { title: HOME_TITLE, description: HOME_DESCRIPTION };
}
