// Link and asset check of a running copy of the site (default: the production build served by
// tools/serve.mjs on 4322; the 17 pages are fetched from --url, so any base URL can be checked):
//   - every local URL in the pages (href, src, srcset, poster, data-src, inline style url(),
//     lightbox JSON, URI-encoded x-wf-template markup) and in every CSS/JS bundle answers 200;
//   - every in-page anchor (#id) has a target;
//   - every external URL in a page also appears on the same page of the original download;
//   - no bundle still points at one of the original asset hosts;
//   - hosting answers like the live site: /sitemap.xml, trailing-slash 301, /404 (200), unknown paths (404).
// Usage: node tools/check-site.mjs [--url=http://localhost:4322]
import fs from 'node:fs';
import path from 'node:path';
import { parse } from 'parse5';

const ROOT = path.resolve(import.meta.dirname, '..');
const BASE = (process.argv.find((a) => a.startsWith('--url='))?.slice(6) ?? 'http://localhost:4322').replace(/\/$/, '');
const routeOf = (page) => (page === 'home' ? '/' : page.startsWith('films_') ? `/films/${page.slice(6)}` : `/${page}`);
const pages = fs.readdirSync(path.join(ROOT, 'reference/original')).filter((f) => f.endsWith('.html')).map((f) => f.slice(0, -5));
async function get(u) {
  const r = await fetch(BASE + u, { redirect: 'manual' });
  return { status: r.status, type: r.headers.get('content-type'), location: r.headers.get('location'), text: await r.text() };
}

const URL_RE = /(?:https?:\/\/|\/assets\/)[^\s"'`<>)\\]+/g;
const ASSET_HOST_RE = /https:\/\/(?:cdn\.prod\.website-files\.com|cdn\.jsdelivr\.net|siena-film-foundation\.vercel\.app|d3e54v103j8qbb\.cloudfront\.net)[^"'`)\s]*/g;
const attr = (n, k) => n.attrs?.find((a) => a.name === k)?.value;

function collect(html) {
  const urls = new Set();
  const ids = new Set();
  const anchors = new Set();
  const addUrl = (u) => {
    u = u.trim().replace(/&amp;/g, '&');
    if (!u || u.startsWith('data:') || u.startsWith('mailto:') || u.startsWith('tel:') || u.startsWith('javascript:')) return;
    if (u.startsWith('#')) return u.length > 1 && anchors.add(u.slice(1));
    urls.add(u);
  };
  (function walk(n) {
    if (attr(n, 'id')) ids.add(attr(n, 'id'));
    for (const k of ['href', 'src', 'poster', 'data-src', 'action']) if (attr(n, k) && !(n.tagName === 'link' && attr(n, 'rel') === 'preconnect')) addUrl(attr(n, k));
    for (const k of ['srcset', 'data-srcset']) if (attr(n, k)) for (const part of attr(n, k).split(',')) addUrl(part.trim().split(/\s+/)[0]);
    const style = attr(n, 'style');
    if (style) for (const m of style.matchAll(/url\(\s*(?:&quot;|["'])?([^"')&]+)/g)) addUrl(m[1]);
    if (n.nodeName === '#text' && n.parentNode?.tagName === 'script') {
      let t = n.value;
      if (attr(n.parentNode, 'type') === 'text/x-wf-template') t = decodeURIComponent(t);
      for (const m of t.matchAll(URL_RE)) addUrl(m[0]);
    }
    for (const c of n.childNodes || []) walk(c);
    if (n.content) walk(n.content);
  })(parse(html));
  return { urls, ids, anchors };
}

const local = new Map(); // url -> pages
const problems = [];
let externalCount = 0;
for (const page of pages) {
  const res = await get(routeOf(page));
  if (res.status !== 200) problems.push(`${page}: ${routeOf(page)} answered HTTP ${res.status}`);
  const { urls, ids, anchors } = collect(res.text);
  const orig = collect(fs.readFileSync(path.join(ROOT, 'reference/original', `${page}.html`), 'utf8')).urls;
  for (const a of anchors) if (!ids.has(a)) problems.push(`${page}: anchor #${a} has no target`);
  for (const u of urls) {
    if (/^https?:\/\//.test(u)) {
      externalCount++;
      if (!orig.has(u)) problems.push(`${page}: external URL not on the original page: ${u}`);
    } else if (u.startsWith('/')) local.set(u.split('#')[0], [...(local.get(u.split('#')[0]) || []), page]);
    else problems.push(`${page}: relative URL ${u}`);
  }
}
const bundles = ['css', 'js'].flatMap((d) => fs.readdirSync(path.join(ROOT, 'public/assets', d)).map((f) => `/assets/${d}/${f}`));
for (const f of bundles) {
  const t = (await get(f)).text;
  for (const m of t.matchAll(/url\(\s*["']?(\/[^"')]+)/g)) local.set(m[1], [...(local.get(m[1]) || []), f]);
  for (const m of t.matchAll(/["'`](\/assets\/[^"'`]+)["'`]/g)) local.set(m[1], [...(local.get(m[1]) || []), f]);
  for (const m of t.matchAll(ASSET_HOST_RE)) problems.push(`${f}: remote asset URL left: ${m[0]}`);
}

// hosting behaviour (as measured on www.siena.film)
const sitemap = await get('/sitemap.xml');
if (sitemap.status !== 200 || sitemap.type !== 'application/rss+xml; charset=utf-8' || sitemap.text !== fs.readFileSync(path.join(ROOT, 'reference/original/sitemap.xml'), 'utf8'))
  problems.push(`/sitemap.xml: HTTP ${sitemap.status} ${sitemap.type} (expected the original file, application/rss+xml; charset=utf-8)`);
const slash = await get('/work/?a=1');
if (slash.status !== 301 || slash.location !== '/work?a=1') problems.push(`/work/?a=1: HTTP ${slash.status} -> ${slash.location} (expected 301 -> /work?a=1)`);
if ((await get('/404')).status !== 200) problems.push('/404 does not answer 200');
for (const u of ['/this-page-does-not-exist', '/WORK', '/index']) if ((await get(u)).status !== 404) problems.push(`${u} does not answer 404`);

let ok = 0;
const queue = [...local.keys()];
await Promise.all(
  Array.from({ length: 8 }, async () => {
    while (queue.length) {
      const u = queue.shift();
      const r = await fetch(BASE + u, { method: 'GET', redirect: 'manual' });
      await r.arrayBuffer();
      if (r.status === 200) ok++;
      else problems.push(`HTTP ${r.status} ${u} (used by ${[...new Set(local.get(u))].slice(0, 3).join(', ')})`);
    }
  }),
);
console.log(`pages: ${pages.length}, bundles: ${bundles.length}, local URLs checked: ${local.size} (${ok} OK), external URL uses: ${externalCount}`);
console.log(`internal routes linked: ${[...local.keys()].filter((u) => !u.startsWith('/assets/')).sort().join(' ')}`);
if (problems.length) {
  console.log(`✗ ${problems.length} problem(s):\n  ` + problems.join('\n  '));
  process.exitCode = 1;
} else console.log('✓ no broken links or assets; hosting answers like the live site');
