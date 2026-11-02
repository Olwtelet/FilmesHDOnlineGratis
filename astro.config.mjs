// @ts-check
import { defineConfig } from 'astro/config';

// Build estático com as URLs públicas do site atual (/programacao/, /sessoes/<slug>/), sempre com a barra final.
// O Taxi compara URLs como texto, então os links internos usam exatamente essa forma (src/data/site.ts).
export default defineConfig({
  site: 'https://filmeshdonlinegratis.vercel.app',
  output: 'static',
  trailingSlash: 'always',
  build: { format: 'directory', assets: '_astro' },
  // JSX whitespace rules: line breaks between tags vanish, same-line spaces stay (matches Webflow's minified markup)
  compressHTML: 'jsx',
  devToolbar: { enabled: false },
  server: { port: 4321 },
});
