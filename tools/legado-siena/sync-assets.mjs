// Catalogues every remote asset used by the original site, downloads a local copy into
// public/assets with organised names, and writes:
//   - assets-manifest.json  (local path -> source URL, kind, owner, pages)
//   - reference/localized/*.html  (original pages with asset URLs pointing at the local copies)
//   - public/assets/{css,js}  (original bundles with remote URLs rewritten)
//   - each asset's origin response headers (content-type, cache-control, content-encoding), which
//     tools/lib/hosting.mjs replays so the local servers answer like the live CDNs
// Only missing files are downloaded (existing ones are kept); reference/original is never fetched.
// Usage: node tools/sync-assets.mjs [--no-download] [--refresh-headers]
import fs from 'node:fs';
import path from 'node:path';
import { parse } from 'parse5';

const ROOT = path.resolve(import.meta.dirname, '..');
const ORIG = path.join(ROOT, 'reference/original');
const PUBLIC = path.join(ROOT, 'public');
const download = !process.argv.includes('--no-download');
const refreshHeaders = process.argv.includes('--refresh-headers');

const SITE_FOLDER = '6728a72e769070a603d43c13';
const CMS_FOLDER = '673306db3b111afa559bc378';
const ASSET_HOSTS = ['cdn.prod.website-files.com', 'cdn.jsdelivr.net', 'siena-film-foundation.vercel.app', 'd3e54v103j8qbb.cloudfront.net'];

const pages = fs.readdirSync(ORIG).filter((f) => f.endsWith('.html'));
const bundles = {
  'bundles/siena-work-space.webflow.5a4c7c0c2.min.css': 'https://cdn.prod.website-files.com/6728a72e769070a603d43c13/css/siena-work-space.webflow.5a4c7c0c2.min.css',
  'bundles/main.css': 'https://siena-film-foundation.vercel.app/styles/main.css',
  'bundles/out.css': 'https://siena-film-foundation.vercel.app/styles/out.css',
  'bundles/app.js': 'https://siena-film-foundation.vercel.app/app.js',
  'bundles/webflow.schunk.7bfea9800fb08bae.js': 'https://cdn.prod.website-files.com/6728a72e769070a603d43c13/js/webflow.schunk.7bfea9800fb08bae.js',
  'bundles/webflow.a0aa6ca1.a7ed9526f3bd2ad7.js': 'https://cdn.prod.website-files.com/6728a72e769070a603d43c13/js/webflow.a0aa6ca1.a7ed9526f3bd2ad7.js',
};

// url -> { pages:Set, owners:Set, ctx:Set }
const found = new Map();
const isAsset = (u) => ASSET_HOSTS.some((h) => u.startsWith(`https://${h}/`) || u.startsWith(`http://${h}/`));
function add(u, page, owner, ctx) {
  u = u.trim();
  if (!isAsset(u)) return;
  if (!found.has(u)) found.set(u, { pages: new Set(), owners: new Set(), ctx: new Set() });
  const d = found.get(u);
  d.pages.add(page);
  if (owner) d.owners.add(owner);
  d.ctx.add(ctx);
}

const attr = (n, k) => n.attrs?.find((a) => a.name === k)?.value;
function filmSlugOf(node) {
  // Slug of a CMS item: data-id, data-case, or the first /films/<slug> link in its subtree
  const id = attr(node, 'data-id') || attr(node, 'data-case');
  if (id) return id;
  const cls = attr(node, 'class') || '';
  if (!/\bw-dyn-item\b/.test(cls)) return null;
  const stack = [node];
  while (stack.length) {
    const n = stack.pop();
    const h = attr(n, 'href');
    if (h && h.startsWith('/films/')) return h.slice(7);
    if (n.childNodes) stack.push(...n.childNodes);
    if (n.content?.childNodes) stack.push(...n.content.childNodes);
  }
  return null;
}

const URL_IN_CSS = /url\(\s*["']?(https?:\/\/[^"')]+?)["']?\s*\)/g;
function walk(node, page, owner) {
  if (node.nodeName && node.attrs) {
    owner = filmSlugOf(node) || owner;
    const tag = node.nodeName;
    const cls = (attr(node, 'class') || '').split(/\s+/)[0];
    for (const { name, value } of node.attrs) {
      const ctx = `${tag}${cls ? '.' + cls : ''}@${name}`;
      if (name === 'srcset' || name === 'data-srcset') value.split(',').forEach((p) => add(p.trim().split(/\s+/)[0], page, owner, ctx));
      else if (name === 'style') for (const m of value.matchAll(URL_IN_CSS)) add(m[1], page, owner, ctx);
      else if (/^https?:\/\//.test(value.trim())) add(value, page, owner, ctx);
    }
    if (tag === 'script' || tag === 'style') {
      let text = (node.childNodes || []).map((c) => c.value || '').join('');
      // Webflow x-wf-template scripts hold URI-encoded markup (https%3A%2F%2F...)
      const template = attr(node, 'type') === 'text/x-wf-template';
      if (template) text = decodeURIComponent(text);
      for (const m of text.matchAll(/https?:\/\/[^\s"'`<>]+/g)) add(m[0], page, owner, template ? 'script-wf-template' : `${tag}-inline`);
    }
  }
  if (node.nodeName === '#comment') return; // commented-out dev loaders are kept verbatim, not localised
  for (const c of node.childNodes || []) walk(c, page, owner);
  if (node.content) walk(node.content, page, owner);
}

for (const f of pages) {
  const html = fs.readFileSync(path.join(ORIG, f), 'utf8');
  walk(parse(html), f.replace(/\.html$/, ''), null);
}
for (const b of Object.keys(bundles)) {
  const s = fs.readFileSync(path.join(ORIG, b), 'utf8');
  if (b.endsWith('.css')) for (const m of s.matchAll(URL_IN_CSS)) add(m[1], b, null, 'css');
  else for (const m of s.matchAll(/https:\/\/cdn\.jsdelivr\.net\/[^"'`\s]+/g)) add(m[0], b, null, 'js');
  // webflow.schunk.js holds the "Made in Webflow" badge images (only injected on *.webflow.io; kept local too)
  if (b.endsWith('.js')) for (const m of s.matchAll(/https:\/\/d3e54v103j8qbb\.cloudfront\.net\/img\/[^"'`\s]+/g)) add(m[0], b, null, 'js');
  // app.js also loads its WebGL card mask texture straight from the Webflow CDN
  if (b === 'bundles/app.js') for (const m of s.matchAll(/https:\/\/cdn\.prod\.website-files\.com\/[^"'`\s]+/g)) add(m[0], b, null, 'js');
}

// ---------- local naming ----------
const kindOf = (u) => {
  const ext = decodeURIComponent(u.split('?')[0]).split('.').pop().toLowerCase();
  if (['mp4', 'webm', 'mov'].includes(ext)) return 'video';
  if (['mp3', 'wav', 'ogg'].includes(ext)) return 'audio';
  if (['ttf', 'otf', 'woff', 'woff2'].includes(ext)) return 'font';
  if (ext === 'css') return 'css';
  if (ext === 'js') return 'js';
  return 'image';
};
const clean = (name) =>
  decodeURIComponent(name)
    .replace(/^(?:[0-9a-f]{24}_)+/, '')
    .replace(/[\s()'"#?&,]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/-\./g, '.')
    .replace(/^-|-$/g, '');

const entries = [];
for (const [url, d] of found) {
  const kind = kindOf(url);
  const base = url.split('?')[0].split('/').pop();
  let dir;
  if (kind === 'video') dir = 'assets/video';
  else if (kind === 'audio') dir = 'assets/audio';
  else if (kind === 'font') dir = 'assets/fonts';
  else if (kind === 'css') dir = 'assets/css';
  else if (kind === 'js') dir = 'assets/js';
  else if (url.includes('cloudfront.net') || url.includes('/plugins/')) dir = 'assets/img/webflow'; // Webflow's own files
  else {
    const owners = [...d.owners];
    if (owners.length === 1) dir = `assets/img/films/${owners[0]}`;
    else if (owners.length > 1) dir = 'assets/img/films/_shared';
    else if (url.includes(`/${CMS_FOLDER}/`)) dir = 'assets/img/cms';
    else dir = 'assets/img/site';
  }
  let name = clean(base);
  if (kind === 'js' && url.includes('jquery')) name = 'jquery-3.5.1.min.js';
  entries.push({ url, kind, dir, name, hash: (base.match(/^([0-9a-f]{24})_/) || [])[1], ...d });
}
// disambiguate collisions inside a folder by keeping the Webflow id prefix (or a counter for
// files without one, so two of them can never end up with the same name)
const byPath = new Map();
for (const e of entries) {
  const k = `${e.dir}/${e.name}`.toLowerCase();
  byPath.set(k, (byPath.get(k) || 0) + 1);
}
const noHash = new Map();
for (const e of entries) {
  const k = `${e.dir}/${e.name}`.toLowerCase();
  if (byPath.get(k) > 1) {
    if (!e.hash) noHash.set(k, (noHash.get(k) || 0) + 1);
    e.name = `${e.hash ? e.hash.slice(0, 8) : `x${noHash.get(k)}`}-${e.name}`;
  }
  e.local = `/${e.dir}/${e.name}`;
}
// bundles get fixed local names
const bundleLocal = {
  'bundles/siena-work-space.webflow.5a4c7c0c2.min.css': '/assets/css/webflow.css',
  'bundles/main.css': '/assets/css/main.css',
  'bundles/out.css': '/assets/css/out.css',
  'bundles/app.js': '/assets/js/app.js',
  'bundles/webflow.schunk.7bfea9800fb08bae.js': '/assets/js/webflow.schunk.js',
  'bundles/webflow.a0aa6ca1.a7ed9526f3bd2ad7.js': '/assets/js/webflow.js',
};
for (const e of entries) {
  const b = Object.entries(bundles).find(([, u]) => u === e.url);
  if (b) e.local = bundleLocal[b[0]];
}

// ---------- download ----------
// URLs that answer 403 on the original CDN but are byte-identical on Webflow's other CDN
const ALT_SOURCE = {
  'https://cdn.prod.website-files.com/plugins/Basic/assets/placeholder.60f9b1840c.svg': 'https://d3e54v103j8qbb.cloudfront.net/plugins/Basic/assets/placeholder.60f9b1840c.svg',
};
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36';
async function fetchTo(url, dest) {
  if (fs.existsSync(dest) && fs.statSync(dest).size > 0) return 'cached';
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  for (let i = 0; i < 4; i++) {
    try {
      const r = await fetch(url, { headers: { 'user-agent': UA } });
      if (!r.ok) return `HTTP ${r.status}`;
      fs.writeFileSync(dest, Buffer.from(await r.arrayBuffer()));
      return 'ok';
    } catch (err) {
      if (i === 3) return `ERR ${err.message}`;
      await new Promise((res) => setTimeout(res, 1000 * (i + 1)));
    }
  }
}

const results = {};
if (download) {
  const queue = entries.filter((e) => !Object.values(bundles).includes(e.url));
  let i = 0;
  await Promise.all(
    Array.from({ length: 8 }, async () => {
      while (i < queue.length) {
        const e = queue[i++];
        results[e.url] = await fetchTo(ALT_SOURCE[e.url] || e.url, path.join(PUBLIC, e.local));
      }
    }),
  );
}

// ---------- origin headers ----------
// Kept from the previous manifest unless --refresh-headers; probed with the Accept-Encoding Edge sends.
const manifestFile = path.join(ROOT, 'assets-manifest.json');
const previous = new Map(fs.existsSync(manifestFile) ? JSON.parse(fs.readFileSync(manifestFile, 'utf8')).map((m) => [m.source, m]) : []);
async function probeHeaders(url) {
  for (let i = 0; i < 3; i++) {
    try {
      const r = await fetch(url, { method: 'HEAD', headers: { 'user-agent': UA, 'accept-encoding': 'gzip, deflate, br, zstd' } });
      if (!r.ok) return null;
      const h = (k) => r.headers.get(k) ?? undefined;
      return { contentType: h('content-type'), cacheControl: h('cache-control'), contentEncoding: h('content-encoding') };
    } catch {
      await new Promise((res) => setTimeout(res, 1000 * (i + 1)));
    }
  }
  return null;
}
const origin = {};
{
  const queue = entries.filter((e) => refreshHeaders || !previous.get(e.url)?.origin);
  let i = 0;
  await Promise.all(
    Array.from({ length: 8 }, async () => {
      while (i < queue.length) {
        const e = queue[i++];
        const h = await probeHeaders(ALT_SOURCE[e.url] || e.url);
        if (h) origin[e.url] = h;
      }
    }),
  );
  for (const e of entries) origin[e.url] ??= previous.get(e.url)?.origin;
}

// ---------- rewrite ----------
// longest first so no URL is a prefix-match of a longer one
const replacements = entries
  .map((e) => [e.url, e.local])
  .sort((a, b) => b[0].length - a[0].length);
function localize(text) {
  for (const [u, l] of replacements) {
    text = text.split(u).join(l);
    const amp = u.replace(/&/g, '&amp;');
    if (amp !== u) text = text.split(amp).join(l);
    // Webflow x-wf-template scripts hold URI-encoded markup
    text = text.split(encodeURIComponent(u)).join(encodeURIComponent(l));
  }
  return text;
}

// bundles -> public/assets
for (const [b, local] of Object.entries(bundleLocal)) {
  const src = fs.readFileSync(path.join(ORIG, b), 'utf8');
  const dest = path.join(PUBLIC, local);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, localize(src));
}

// localized reference pages (Google Analytics removed: a local replica must not report to the live property)
const GA = [
  /<script async="" src="https:\/\/www\.googletagmanager\.com\/gtag\/js\?id=[\w-]+"><\/script>/g,
  /<script type="text\/javascript">window\.dataLayer = window\.dataLayer \|\| \[\];function gtag\(\)\{[^<]*G-5SFTWJHZ12'\);<\/script>/g,
];
fs.mkdirSync(path.join(ROOT, 'reference/localized'), { recursive: true });
for (const f of pages) {
  // keep the HTML comments (dev loaders) byte-identical: localise only outside comments
  let html = fs.readFileSync(path.join(ORIG, f), 'utf8');
  for (const re of GA) html = html.replace(re, '');
  html = html
    .split(/(<!--[\s\S]*?-->)/)
    .map((chunk) => (chunk.startsWith('<!--') ? chunk : localize(chunk)))
    .join('');
  fs.writeFileSync(path.join(ROOT, 'reference/localized', f), html);
}

// ---------- manifest ----------
const manifest = entries
  .sort((a, b) => a.local.localeCompare(b.local))
  .map((e) => {
    const p = path.join(PUBLIC, e.local);
    return {
      local: e.local,
      source: e.url,
      kind: e.kind,
      owner: e.owners.size === 1 ? [...e.owners][0] : e.owners.size ? [...e.owners].sort() : null,
      usedOn: [...e.pages].sort(),
      context: [...e.ctx].sort(),
      bytes: fs.existsSync(p) ? fs.statSync(p).size : 0,
      status: results[e.url] || (fs.existsSync(p) ? 'present' : 'missing'),
      ...(origin[e.url] ? { origin: origin[e.url] } : {}),
      ...(ALT_SOURCE[e.url] ? { downloadedFrom: ALT_SOURCE[e.url], note: 'original URL answers 403 on the live site; identical file taken from Webflow cloudfront CDN' } : {}),
    };
  });
fs.writeFileSync(manifestFile, JSON.stringify(manifest, null, 1));
const missing = manifest.filter((m) => !m.bytes);
// anything still pointing at an asset host (outside HTML comments) is a localisation gap
for (const f of pages) {
  const html = fs.readFileSync(path.join(ROOT, 'reference/localized', f), 'utf8').replace(/<!--[\s\S]*?-->/g, '');
  // (a bare origin is the <link rel="preconnect"> hint, not a file)
  const left = (html.match(/(https?:\/\/|https%3A%2F%2F)(cdn\.prod\.website-files\.com|cdn\.jsdelivr\.net|siena-film-foundation\.vercel\.app|d3e54v103j8qbb\.cloudfront\.net)[^"'\s<)]*/g) || []).filter((u) => /\.(com|app|net)(\/|%2F)./.test(u));
  if (left.length) console.log('  UNLOCALIZED in', f, left.length, left.slice(0, 2));
}
console.log(`assets: ${manifest.length}, missing: ${missing.length}, without origin headers: ${manifest.filter((m) => !m.origin).length}`);
for (const m of missing) console.log('  MISSING', m.source, m.status);
const byKind = {};
for (const m of manifest) byKind[m.kind] = (byKind[m.kind] || 0) + 1;
console.log(byKind);
