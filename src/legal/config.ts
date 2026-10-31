/**
 * DATI LEGALI DI QUAKE ITALIA — da compilare una volta sola.
 * Privacy Policy e Termini d'uso leggono tutto da qui.
 *
 * I campi che iniziano con "[DA COMPLETARE" vanno sostituiti prima della pubblicazione:
 * finché ci sono, le pagine legali mostrano un avviso (solo in sviluppo).
 */

export type Hosting = 'cloudflare' | 'netlify' | 'github' | 'da-scegliere';

export const LEGAL = {
  siteName: 'Quake Italia',
  siteUrl: '[DA COMPLETARE: indirizzo del sito, es. https://quakeitalia.it]',

  /** Chi pubblica il sito ed è responsabile dei dati (il "titolare del trattamento"). */
  owner: {
    name: 'Quake Italia',
    email: 'quakeitalia@gmail.com',
  },

  hosting: 'da-scegliere' as Hosting,

  /** Data dell'ultima modifica delle pagine legali (da aggiornare a ogni cambiamento). */
  lastUpdated: '31 ottobre 2026',
};

/** Formula prudente: le garanzie esatte (DPF e/o clausole standard) vanno verificate nell'informativa del fornitore. */
const TRANSFER_US =
  'Il fornitore ha sede negli Stati Uniti: per il trasferimento dei dati dichiara di applicare le garanzie previste dal GDPR (EU-U.S. Data Privacy Framework e/o clausole contrattuali standard della Commissione europea), descritte nella sua informativa.';

export const HOSTING_INFO: Record<Hosting, { name: string; company: string; privacyUrl: string | null; transfer: string }> = {
  cloudflare: {
    name: 'Cloudflare Pages',
    company: 'Cloudflare, Inc. (Stati Uniti)',
    privacyUrl: 'https://www.cloudflare.com/privacypolicy/',
    transfer: TRANSFER_US,
  },
  netlify: {
    name: 'Netlify',
    company: 'Netlify, Inc. (Stati Uniti)',
    privacyUrl: 'https://www.netlify.com/privacy/',
    transfer: TRANSFER_US,
  },
  github: {
    name: 'GitHub Pages',
    company: 'GitHub, Inc. (Stati Uniti)',
    privacyUrl: 'https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement',
    transfer: TRANSFER_US,
  },
  'da-scegliere': {
    name: '[DA COMPLETARE: servizio di hosting]',
    company: '[DA COMPLETARE: società di hosting]',
    privacyUrl: null,
    transfer: '[DA COMPLETARE: eventuale trasferimento extra UE e relative garanzie]',
  },
};

export const hasPlaceholders = () => JSON.stringify(LEGAL).includes('[DA COMPLETARE');
