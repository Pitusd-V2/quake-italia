/**
 * Build «da server», usato solo per generare le pagine HTML (scripts/prerender.mjs).
 * Niente service worker né header: servono solo al sito vero (vite.config.ts).
 */
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { mdxPlugins } from './vite.config.ts';

export default defineConfig({
  plugins: [...mdxPlugins(), react()],
  build: {
    ssr: 'src/entry-server.tsx',
    outDir: 'dist-ssr',
    emptyOutDir: true,
    sourcemap: false,
  },
});
