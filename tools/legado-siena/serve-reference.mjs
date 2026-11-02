// Serves reference/localized/*.html (the original pages pointing at local assets) on the
// original routes, plus public/assets and the original sitemap.xml, with the same hosting
// behaviour as tools/serve.mjs (tools/lib/hosting.mjs). Used as the "ground truth" when comparing
// the Astro build: a difference that also shows against this mirror comes from the environment.
// Usage: node tools/serve-reference.mjs [port]
import fs from 'node:fs';
import path from 'node:path';
import { startHosting, exactFile } from './lib/hosting.mjs';

const ROOT = fs.realpathSync.native(path.resolve(import.meta.dirname, '..'));
const LOCALIZED = path.join(ROOT, 'reference/localized');
const PUBLIC = path.join(ROOT, 'public');

/** Route of a reference page file: home.html -> /, films_savoy.html -> /films/savoy, about.html -> /about. */
export function routeOf(file) {
  const name = file.replace(/\.html$/, '');
  if (name === 'home') return '/';
  return name.startsWith('films_') ? `/films/${name.slice(6)}` : `/${name}`;
}

const ROUTES = new Map(
  fs
    .readdirSync(LOCALIZED)
    .filter((f) => f.endsWith('.html'))
    .map((f) => [routeOf(f), path.join(LOCALIZED, f)]),
);

startHosting({
  name: 'reference mirror',
  port: +(process.argv[2] || 4400),
  notFoundFile: path.join(LOCALIZED, '404.html'),
  resolve(urlPath) {
    if (ROUTES.has(urlPath)) return { file: ROUTES.get(urlPath), kind: 'page' };
    if (urlPath === '/sitemap.xml') return { file: path.join(ROOT, 'reference/original/sitemap.xml'), kind: 'sitemap' };
    const asset = urlPath.startsWith('/assets/') && exactFile(PUBLIC, urlPath);
    return asset ? { file: asset, kind: 'asset' } : null;
  },
});
