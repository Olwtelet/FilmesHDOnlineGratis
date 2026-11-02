// Serve o build de produção (dist/) como a hospedagem final responde, com a barra final nas páginas:
//   /programacao/ -> dist/programacao/index.html, /programacao -> 308 /programacao/, / e /index.html -> dist/index.html,
//   desconhecido -> a página 404 com HTTP 404. Os cabeçalhos vêm de vercel.json (ver tools/lib/hosting.mjs).
// Uso: node tools/serve.mjs [porta]   (rode `npm run build` antes; porta padrão 4322)
import fs from 'node:fs';
import path from 'node:path';
import { startHosting, exactFile } from './lib/hosting.mjs';

const BUILD = path.resolve(import.meta.dirname, '../dist');
if (!fs.existsSync(path.join(BUILD, 'index.html'))) {
  console.error('dist/ não encontrado: rode `npm run build` antes');
  process.exit(1);
}
const DIST = fs.realpathSync.native(BUILD);

startHosting({
  name: 'Filmes HD Online Grátis (dist/)',
  port: +(process.argv[2] || 4322),
  notFoundFile: path.join(DIST, '404.html'),
  resolve(urlPath) {
    if (urlPath === '/') return { file: path.join(DIST, 'index.html') };
    if (urlPath.endsWith('/')) {
      const page = exactFile(DIST, `${urlPath}index.html`);
      return page ? { file: page } : null;
    }
    const direct = exactFile(DIST, urlPath);
    if (direct) return { file: direct };
    return exactFile(DIST, `${urlPath}/index.html`) ? { redirect: `${urlPath}/` } : null;
  },
});
