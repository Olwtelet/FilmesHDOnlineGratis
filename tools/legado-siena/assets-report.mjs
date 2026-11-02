// Turns assets-manifest.json into ASSETS.md and verifies the local copies.
//
//   node tools/assets-report.mjs            -> writes ASSETS.md, prints a summary
//   node tools/assets-report.mjs --check    -> same checks, does not write (exit 1 on problems)
//
// Checks performed:
//   1. every manifest entry exists under public/ with size > 0 (and the size recorded in the manifest)
//   2. every local /assets/... reference in reference/localized/*.html (src, srcset, data-src, inline
//      style url(), lightbox JSON, URI-encoded wf-templates) resolves to a file on disk
//   3. remote asset URLs that are still referenced at runtime (original hosts) in the localized pages and
//      in the shipped bundles under public/assets/{css,js} - i.e. assets the manifest does not cover
//   4. files under public/assets that are not in the manifest (replica-only additions)
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const PUBLIC = path.join(ROOT, 'public');
const write = !process.argv.includes('--check');
const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'assets-manifest.json'), 'utf8'));
const PAGES = fs.readdirSync(path.join(ROOT, 'reference/localized')).filter((f) => f.endsWith('.html')).map((f) => f.slice(0, -5)).sort();
const ASSET_HOSTS = ['cdn.prod.website-files.com', 'uploads-ssl.webflow.com', 'cdn.jsdelivr.net', 'siena-film-foundation.vercel.app', 'd3e54v103j8qbb.cloudfront.net'];

// Known consequences of a remote/missing asset (keyed by a substring of the URL)
const EFFECTS = {
  'all-masks.webp':
    'WebGL mask texture loaded by app.js (`Ef.mask_desk`, used as the alpha channel of every textured plane on `/` and `/work`). It is fetched from the Webflow CDN at runtime (CORS `*`). If it cannot be fetched (offline / CDN blocked) the promise never resolves, `u_mask` stays an empty texture and the film stills of the home roll and of the work slider are NOT drawn at all (black page with only the HTML text; verified by blocking the host in Playwright). Remedy (owner of app.js/public): download it to e.g. `/assets/img/webgl/all-masks.webp` (12 114 bytes) and rewrite the URL in `public/assets/js/app.js`.',
  'webflow-badge':
    'Webflow "Made in Webflow" badge images referenced inside webflow.schunk.js. The badge is only injected on *.webflow.io staging domains, never on the custom domain, so nothing is rendered on the live site or locally. No visual effect.',
  'youtu.be':
    'Not an asset: `<video data-videoplayer="video" src>` of /films/by-any-means points at a YouTube page URL (same on the live site). The browser cannot decode it, so the custom trailer player opens on a black frame and the static "6:29" duration stays. Must be reproduced verbatim, not "fixed".',
};
const effectOf = (u) =>
  /^https?:\/\/[^/]+\/?$/.test(u)
    ? 'Bare origin, not an asset: the `<link href="https://cdn.prod.website-files.com" rel="preconnect" crossorigin="anonymous">` hint in `<head>`. Kept verbatim for DOM parity; nothing is downloaded from it.'
    : Object.entries(EFFECTS).find(([k]) => u.includes(k))?.[1] || 'Unknown - check where it is used.';

const fmt = (b) => (b >= 1048576 ? `${(b / 1048576).toFixed(2)} MB` : b >= 1024 ? `${(b / 1024).toFixed(1)} KB` : `${b} B`);
const fileOf = (local) => {
  for (const p of [local, decodeURIComponent(local)]) {
    const f = path.join(PUBLIC, p);
    if (fs.existsSync(f)) return f;
  }
  return null;
};
const sizeOf = (local) => {
  const f = fileOf(local);
  return f ? fs.statSync(f).size : 0;
};
const esc = (s) => String(s).replace(/\|/g, '\\|');
const pageRoute = (p) => (p === 'home' ? '/' : p.startsWith('films_') ? `/films/${p.slice(6)}` : p.startsWith('bundles/') ? p.slice(8) : `/${p}`);
function pagesCell(usedOn) {
  const pages = usedOn.filter((u) => PAGES.includes(u));
  const other = usedOn.filter((u) => !PAGES.includes(u)).map(pageRoute);
  const parts = [];
  if (pages.length === PAGES.length) parts.push(`all ${PAGES.length} pages`);
  else if (pages.length === PAGES.length - 1) parts.push(`all pages except ${PAGES.filter((p) => !pages.includes(p)).map(pageRoute).join(', ')}`);
  else parts.push(...pages.map(pageRoute));
  parts.push(...other);
  return parts.map((p) => (p.startsWith('/') ? `\`${p}\`` : p)).join(', ');
}
const ownerCell = (o) => (o == null ? 'site-wide' : Array.isArray(o) ? `shared: ${o.join(', ')}` : o);

// ---------- 1. manifest entries on disk ----------
const missing = [];
const sizeMismatch = [];
for (const e of manifest) {
  const size = sizeOf(e.local);
  e._size = size;
  if (!size) missing.push(e);
  else if (e.bytes && size !== e.bytes) sizeMismatch.push(e);
}

// ---------- 2. local references in the localized pages ----------
const localRefs = new Map(); // local path -> Set(pages)
const addRef = (u, page) => {
  u = u.trim().replace(/&amp;/g, '&');
  if (!u.startsWith('/assets/')) return;
  if (!localRefs.has(u)) localRefs.set(u, new Set());
  localRefs.get(u).add(page);
};
const stripComments = (s) => s.replace(/<!--[\s\S]*?-->/g, '');
for (const p of PAGES) {
  const html = stripComments(fs.readFileSync(path.join(ROOT, 'reference/localized', `${p}.html`), 'utf8'));
  for (const m of html.matchAll(/(?:src|href|data-src|content)="(\/assets\/[^"]+)"/g)) addRef(m[1], p);
  for (const m of html.matchAll(/srcset="([^"]+)"/g)) m[1].split(',').forEach((c) => addRef(c.trim().split(/\s+/)[0], p));
  for (const m of html.matchAll(/url\((?:&quot;|["'])?(\/assets\/[^"')&]+)/g)) addRef(m[1], p);
  for (const m of html.matchAll(/"url":\s*"(\/assets\/[^"]+)"/g)) addRef(m[1], p);
  for (const m of html.matchAll(/%2Fassets%2F[^%"]+(?:%[0-9A-F]{2}[^%"]*)*?(?=%22|%20|"|%2C)/g)) addRef(decodeURIComponent(m[0]), p);
}
const brokenRefs = [...localRefs].filter(([u]) => !sizeOf(u));

// ---------- 3. remote asset URLs still referenced ----------
const remote = new Map(); // url -> Set(files)
const hostRe = new RegExp(`https?:(?:\\/\\/|%2F%2F)(?:${ASSET_HOSTS.map((h) => h.replace(/\./g, '\\.')).join('|')})[^"'\`\\s<>)]*`, 'g');
function scanRemote(file, text) {
  for (const m of text.matchAll(hostRe)) {
    const u = m[0].replace(/[,;]+$/, '');
    if (!remote.has(u)) remote.set(u, new Set());
    remote.get(u).add(file);
  }
}
for (const p of PAGES) scanRemote(`reference/localized/${p}.html`, stripComments(fs.readFileSync(path.join(ROOT, 'reference/localized', `${p}.html`), 'utf8')));
for (const dir of ['assets/css', 'assets/js']) {
  for (const f of fs.readdirSync(path.join(PUBLIC, dir))) scanRemote(`public/${dir}/${f}`, fs.readFileSync(path.join(PUBLIC, dir, f), 'utf8'));
}
// non-asset remote media (e.g. a <video> pointing at a web page)
const remoteMedia = [];
for (const p of PAGES) {
  const html = stripComments(fs.readFileSync(path.join(ROOT, 'reference/localized', `${p}.html`), 'utf8'));
  for (const m of html.matchAll(/<(video|img|source|audio)\b[^>]*?\ssrc="(https?:[^"]+)"/g)) remoteMedia.push({ page: p, tag: m[1], url: m[2] });
}

// ---------- 4. files on disk that the manifest does not list ----------
const inManifest = new Set(manifest.map((e) => e.local));
const onDisk = [];
(function walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p);
    else onDisk.push('/' + path.relative(PUBLIC, p).split(path.sep).join('/'));
  }
})(path.join(PUBLIC, 'assets'));
const extra = onDisk.filter((f) => !inManifest.has(f));
const firstLine = (f) => {
  if (!/\.(css|js)$/.test(f)) return '(binary)';
  try {
    return fs.readFileSync(path.join(PUBLIC, f), 'utf8').split('\n')[0].replace(/^\/\/\s*|^\/\*\s*|\s*\*\/$/g, '').slice(0, 160);
  } catch {
    return '';
  }
};

// ---------- markdown ----------
function filesCell(files) {
  const pages = files.filter((f) => f.startsWith('reference/localized/')).map((f) => f.slice(20, -5));
  const rest = files.filter((f) => !f.startsWith('reference/localized/')).map((f) => '`' + f + '`');
  return [...(pages.length ? [`reference pages: ${pagesCell(pages)}`] : []), ...rest].join(', ');
}
const KIND_ORDER = ['css', 'js', 'font', 'audio', 'video', 'image'];
const KIND_TITLE = { css: 'Stylesheets', js: 'Scripts', font: 'Fonts', audio: 'Audio (UI sounds, loaded by app.js)', video: 'Video', image: 'Images' };
const totals = {};
for (const e of manifest) {
  totals[e.kind] ??= { n: 0, b: 0 };
  totals[e.kind].n++;
  totals[e.kind].b += e._size;
}
const totalBytes = manifest.reduce((s, e) => s + e._size, 0);
const md = [];
md.push('# Assets inventory\n');
md.push(`Generated by \`node tools/assets-report.mjs\` from \`assets-manifest.json\` (${manifest.length} entries) and the files under \`public/\`. Do not edit by hand: re-run the script after \`tools/sync-assets.mjs\`.\n`);
md.push('All assets are served locally from `public/assets/**`; the *origin URL* column is where each file was downloaded from on the live site (www.siena.film / Webflow CDN / jsDelivr / Vercel).\n');
md.push('## Verification\n');
md.push(`- Manifest entries present on disk with size > 0: **${manifest.length - missing.length} / ${manifest.length}**${missing.length ? '' : ' — no manifest asset is missing.'}`);
md.push(`- Size on disk equals the size recorded in the manifest: ${sizeMismatch.length ? `**${sizeMismatch.length} mismatches** (see below)` : 'yes, for every entry'}.`);
md.push(`- Local \`/assets/…\` references found in \`reference/localized/*.html\` (src, srcset, data-src, meta content, inline \`url()\`, lightbox JSON, URI-encoded wf-templates): **${localRefs.size}** distinct paths, **${brokenRefs.length}** unresolved.`);
md.push(`- Remote URLs still referenced at runtime (not covered by the manifest): **${remote.size + remoteMedia.length}** (${remote.size} in the bundles/pages, ${remoteMedia.length} media source${remoteMedia.length === 1 ? "" : "s"}; see next section).`);
md.push(`- Files under \`public/assets\` that are not in the manifest: **${extra.length}**.`);
md.push(`- Total size of the manifest assets: **${fmt(totalBytes)}**.\n`);
if (missing.length) {
  md.push('### Missing manifest entries\n');
  md.push('| local path | origin URL | status in manifest | used on |\n|---|---|---|---|');
  for (const e of missing) md.push(`| \`${e.local}\` | ${e.source} | ${e.status} | ${pagesCell(e.usedOn)} |`);
  md.push('');
}
if (sizeMismatch.length) {
  md.push('### Size mismatches\n');
  md.push('| local path | manifest bytes | on disk |\n|---|---|---|');
  for (const e of sizeMismatch) md.push(`| \`${e.local}\` | ${e.bytes} | ${e._size} |`);
  md.push('');
}
if (brokenRefs.length) {
  md.push('### Unresolved local references in the reference pages\n');
  md.push('| path | pages |\n|---|---|');
  for (const [u, ps] of brokenRefs) md.push(`| \`${u}\` | ${[...ps].map(pageRoute).join(', ')} |`);
  md.push('');
}
md.push('## Not localized: remote URLs still used at runtime\n');
if (!remote.size && !remoteMedia.length) md.push('None.\n');
else {
  md.push('These are referenced by the original bundles/pages but are **not** in `assets-manifest.json` (none of them is a file the pages need: a preconnect hint, badge images Webflow never injects on the custom domain, and a YouTube page URL used as a video source). They are listed with their visual effect if they cannot be fetched.\n');
  md.push('| URL | referenced in | effect if unavailable |\n|---|---|---|');
  for (const [u, files] of remote) md.push(`| ${u} | ${filesCell([...files])} | ${esc(effectOf(u))} |`);
  for (const r of remoteMedia) md.push(`| ${r.url} | \`<${r.tag}>\` on \`${pageRoute(r.page)}\` | ${esc(effectOf(r.url))} |`);
  md.push('');
}
md.push('## Replica-only files (in `public/assets`, not from the original site)\n');
if (!extra.length) md.push('None.\n');
else {
  md.push('| path | size | first line |\n|---|---|---|');
  for (const f of extra) md.push(`| \`${f}\` | ${fmt(sizeOf(f))} | ${esc(firstLine(f))} |`);
  md.push('');
}
md.push('## Summary by kind\n');
md.push('| kind | files | size |\n|---|---|---|');
for (const k of KIND_ORDER.filter((k) => totals[k])) md.push(`| ${k} | ${totals[k].n} | ${fmt(totals[k].b)} |`);
md.push('');
md.push('## Origin response headers (replayed by the local servers)\n');
md.push('Recorded per asset in `assets-manifest.json` (`origin`) by `tools/sync-assets.mjs` from a HEAD request to the origin URL with the `Accept-Encoding` Edge sends; `tools/lib/hosting.mjs` answers each local copy with the same values.\n');
md.push('| origin host | content-type | cache-control | content-encoding | files |\n|---|---|---|---|---|');
const headerGroups = new Map();
for (const e of manifest) {
  const k = [new URL(e.downloadedFrom || e.source).host, e.origin?.contentType ?? '—', e.origin?.cacheControl ?? '—', e.origin?.contentEncoding ?? 'none'].join(' | ');
  headerGroups.set(k, (headerGroups.get(k) || 0) + 1);
}
for (const [k, n] of [...headerGroups].sort()) md.push(`| ${k} | ${n} |`);
md.push('');
md.push('Columns below: **local path** (served path under `public/`), **origin URL**, **owner** (film slug the asset belongs to, `shared: …` when used by several films, `site-wide` otherwise), **used on** (pages from the reference HTML, or the bundle that references it), **context** (element/attribute where it appears), **size** (on disk).\n');
for (const kind of KIND_ORDER) {
  const entries = manifest.filter((e) => e.kind === kind);
  if (!entries.length) continue;
  md.push(`## ${KIND_TITLE[kind]} (${entries.length})\n`);
  const folders = [...new Set(entries.map((e) => path.posix.dirname(e.local)))].sort();
  for (const folder of folders) {
    const list = entries.filter((e) => path.posix.dirname(e.local) === folder).sort((a, b) => a.local.localeCompare(b.local));
    if (folders.length > 1 || kind === 'image') md.push(`### \`${folder}/\` (${list.length} files, ${fmt(list.reduce((s, e) => s + e._size, 0))})\n`);
    md.push('| local path | origin URL | owner | used on | context | size |\n|---|---|---|---|---|---|');
    for (const e of list) {
      const note = e.note ? ` (${e.note}; downloaded from ${e.downloadedFrom})` : '';
      md.push(`| \`${e.local}\` | ${esc(e.source)}${esc(note)} | ${esc(ownerCell(e.owner))} | ${pagesCell(e.usedOn)} | ${esc(e.context.join(', '))} | ${e._size ? fmt(e._size) : '**MISSING**'} |`);
    }
    md.push('');
  }
}
if (write) fs.writeFileSync(path.join(ROOT, 'ASSETS.md'), md.join('\n'));

console.log(`assets: ${manifest.length} in manifest, ${missing.length} missing, ${sizeMismatch.length} size mismatches, ${fmt(totalBytes)} total`);
console.log(`local references in reference pages: ${localRefs.size}, unresolved: ${brokenRefs.length}`);
for (const [u, ps] of brokenRefs) console.log(`  UNRESOLVED ${u} (${[...ps].join(', ')})`);
console.log(`remote URLs still referenced: ${remote.size + remoteMedia.length}`);
for (const [u, files] of remote) console.log(`  REMOTE ${u}  <- ${[...files].join(', ')}`);
for (const r of remoteMedia) console.log(`  REMOTE MEDIA <${r.tag}> ${r.url} on ${r.page}`);
console.log(`replica-only files: ${extra.join(', ') || 'none'}`);
if (write) console.log('wrote ASSETS.md');
if (missing.length || brokenRefs.length) process.exitCode = 1;
