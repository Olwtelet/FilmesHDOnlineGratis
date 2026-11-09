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
  // O watcher do servidor de desenvolvimento não olha reference/. Ali ficam o histórico e os insumos das ferramentas em
  // tools/, nunca módulos do site. Fora do git, reference/captures (gravada pelo kit de tools/legado-siena) tinha 33 mil
  // arquivos, e o chokidar do Vite abre um fs.watch e faz um stat para cada arquivo e pasta: cerca de 40 mil ao subir.
  // Isso ocupava o processo, e a criação do app de desenvolvimento passava do limite de 60 s ("transport invoke timed
  // out"). O build não usa watcher. O padrão vale para qualquer pasta chamada reference; hoje só existe esta.
  vite: { server: { watch: { ignored: ['**/reference/**'] } } },
});
