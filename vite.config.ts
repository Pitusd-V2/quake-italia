import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { headersFile, SECURITY_HEADERS } from './security/headers.ts';
import { readFileSync } from 'node:fs';

export default defineConfig({
  plugins: [
    react(),
    {
      // Scrive dist/_headers con CSP e header di sicurezza (Cloudflare Pages / Netlify).
      name: 'quakeitalia-security-headers',
      apply: 'build',
      generateBundle() {
        this.emitFile({ type: 'asset', fileName: '_headers', source: headersFile() });
        // Promemoria: le pagine legali hanno ancora campi da compilare (src/legal/config.ts).
        const legal = readFileSync('src/legal/config.ts', 'utf8');
        if (/^\s+(name|place|email|siteUrl): '\[DA COMPLETARE/m.test(legal) || legal.includes("hosting: 'da-scegliere'")) {
          this.warn('ATTENZIONE: Privacy Policy e Termini hanno campi [DA COMPLETARE] in src/legal/config.ts. Compilali prima di pubblicare.');
        }
      },
    },
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'logo.svg', 'apple-touch-icon-180x180.png'],
      manifest: {
        name: 'Quake Italia — Capire i terremoti',
        short_name: 'Quake Italia',
        description: 'Capire i terremoti in Italia, con i dati ufficiali INGV.',
        lang: 'it',
        start_url: '/',
        display: 'standalone',
        background_color: '#f5f7f9',
        theme_color: '#0e5e7e',
        icons: [
          { src: 'pwa-64x64.png', sizes: '64x64', type: 'image/png' },
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,mjs,css,html,svg,png,ico,woff2}'],
        // La mappa (~1 MB) non viene scaricata in anticipo: la salviamo solo quando serve
        // (vedi runtimeCaching), così la prima visita resta leggera anche col telefono.
        globIgnores: ['**/QuakeMap-*', '**/maplibre-gl-worker-*'],
        navigateFallback: '/index.html',
        importScripts: ['sw-notifications.js'],
        runtimeCaching: [
          {
            // File della mappa: hanno l'impronta nel nome, quindi non cambiano mai.
            urlPattern: ({ url, sameOrigin }) =>
              sameOrigin && /\/assets\/(QuakeMap|maplibre-gl-worker)-/.test(url.pathname),
            handler: 'CacheFirst',
            options: { cacheName: 'map-code', expiration: { maxEntries: 10 } },
          },
          {
            // Dati INGV: prima la rete (dati freschi), se offline l'ultima copia salvata.
            urlPattern: ({ url }) => url.hostname === 'webservices.ingv.it',
            handler: 'NetworkFirst',
            options: {
              cacheName: 'ingv-data',
              networkTimeoutSeconds: 10,
              expiration: { maxEntries: 30, maxAgeSeconds: 7 * 24 * 3600 },
            },
          },
          {
            urlPattern: ({ url }) => url.hostname === 'tiles.openfreemap.org',
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'map-tiles',
              expiration: { maxEntries: 600, maxAgeSeconds: 14 * 24 * 3600 },
            },
          },
        ],
      },
    }),
  ],
  build: {
    // MapLibre da solo pesa ~1 MB ed è già caricato a parte, solo quando si apre una mappa.
    chunkSizeWarningLimit: 1200,
    // Niente mappe dei sorgenti in produzione: non serve esporre il codice originale.
    sourcemap: false,
  },
  // `npm run preview` usa gli stessi header della produzione: così la CSP si prova in locale.
  preview: {
    headers: SECURITY_HEADERS,
  },
});
