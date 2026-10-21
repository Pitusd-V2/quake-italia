import { defineConfig, minimal2023Preset } from '@vite-pwa/assets-generator/config';

// Icone dell'app da public/logo.svg (npm run icons). Le icone «maskable» (Android) e Apple
// hanno lo sfondo pieno nel colore del logo, così sulla schermata Home non c'è la cornice bianca.
const background = '#0e5e7e';

export default defineConfig({
  headLinkOptions: { preset: '2023' },
  preset: {
    ...minimal2023Preset,
    maskable: { ...minimal2023Preset.maskable, resizeOptions: { background } },
    apple: { ...minimal2023Preset.apple, resizeOptions: { background } },
  },
  images: ['public/logo.svg'],
});
