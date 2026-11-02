// Structural DOM comparison between the replica and the localized original pages
// (reference/localized/). Both are parsed with parse5 (the HTML spec parser browsers use).
// Normalisation: comments dropped, attributes sorted, whitespace runs collapsed, whitespace-only
// text dropped inside <head> and at the start/end of an element, elements tagged
// data-local-replica ignored, Astro/Vite dev-server injections ignored.
// Everything else (tags, order, attributes, text) must match.
//
// Usage: node tools/dom-diff.mjs [page ...] [--url=http://localhost:4322] [--dist=dist]
//                                [--only=<selector>] [--max=30]
//   page     = home | work | about | contact | cookies | terms | privacy | 404 | films_<slug>
//              (no pages -> every page in reference/localized)
//   --url    = fetch the replica HTML from a running server (astro dev / preview) instead of dist/
//   --only   = compare just the first element matching a simple selector in both documents,
//              e.g. --only=div.nav-w  --only=footer.footer  --only=[data-tutorial=w]
import fs from 'node:fs';
import path from 'node:path';
import { parse } from 'parse5';

const ROOT = path.resolve(import.meta.dirname, '..');
const args = process.argv.slice(2);
const opt = (k) => args.find((a) => a.startsWith(`--${k}=`))?.slice(k.length + 3);
const MAX = +(opt('max') ?? 30);
const DIST = path.join(ROOT, opt('dist') ?? 'dist');
const URL_BASE = opt('url')?.replace(/\/$/, '');
const ONLY = opt('only');
// --strict also compares whitespace-only text at the start/end of an element (normally collapsible)
// and the HTML comments, in document order
const STRICT = args.includes('--strict');
let pages = args.filter((a) => !a.startsWith('--'));
if (!pages.length) pages = fs.readdirSync(path.join(ROOT, 'reference/localized')).filter((f) => f.endsWith('.html')).map((f) => f.slice(0, -5));

export const routeOf = (page) => (page === 'home' ? '/' : page.startsWith('films_') ? `/films/${page.slice(6)}` : `/${page}`);
export function distFile(page) {
  if (page === 'home') return path.join(DIST, 'index.html');
  if (page.startsWith('films_')) return path.join(DIST, 'films', `${page.slice(6)}.html`);
  return path.join(DIST, `${page}.html`);
}

const attrOf = (n, k) => n.attrs?.find((a) => a.name === k)?.value;
const isDevInjection = (n) =>
  attrOf(n, 'data-vite-dev-id') !== undefined ||
  /^\/(@vite|@id|@fs|node_modules)\//.test(attrOf(n, 'src') || '') ||
  (n.tagName || '').startsWith('astro-dev') ||
  (n.tagName === 'script' && attrOf(n, 'type') === 'module' && /\/@vite\/client|astro\/dist|dev-toolbar/.test((n.childNodes || []).map((c) => c.value || '').join('') + (attrOf(n, 'src') || '')));

const ws = (s) => s.replace(/\s+/g, ' ');
function norm(node, inHead = false) {
  if (node.nodeName === '#comment' || node.nodeName === '#documentType') return null;
  if (node.nodeName === '#text') {
    const v = ws(node.value);
    if (inHead && !v.trim()) return null;
    return { t: '#text', v };
  }
  const tag = node.tagName || node.nodeName;
  // additions that exist only in the replica (documented in README) are tagged data-local-replica
  if (node.attrs?.some((a) => a.name === 'data-local-replica')) return null;
  if (isDevInjection(node)) return null;
  const attrs = (node.attrs || []).map((a) => [a.name, ws(a.value).trim()]).sort((a, b) => (a[0] < b[0] ? -1 : 1));
  const head = inHead || tag === 'head';
  let kids = [...(node.childNodes || []), ...(node.content?.childNodes || [])].map((c) => norm(c, head)).filter(Boolean);
  // merge adjacent text nodes produced by dropped comments
  kids = kids.reduce((acc, k) => {
    const prev = acc[acc.length - 1];
    if (k.t === '#text' && prev?.t === '#text') prev.v = ws(prev.v + k.v);
    else acc.push(k);
    return acc;
  }, []);
  // leading/trailing whitespace-only text inside an element never renders (collapsible)
  if (!STRICT || head) {
    while (kids[0]?.t === '#text' && !kids[0].v.trim()) kids.shift();
    while (kids.length && kids[kids.length - 1].t === '#text' && !kids[kids.length - 1].v.trim()) kids.pop();
  }
  if (tag === 'script' || tag === 'style') kids = kids.map((k) => (k.t === '#text' ? { ...k, v: k.v.trim() } : k));
  return { t: tag, a: attrs, k: kids };
}

function select(n, sel) {
  const m = sel.match(/^(\w+)?((?:\.[\w-]+)*)(?:\[([\w-]+)(?:=['"]?([^'"\]]*)['"]?)?\])?$/);
  if (!m) throw new Error(`unsupported selector ${sel}`);
  const [, tag, classes, an, av] = m;
  const want = classes ? classes.split('.').filter(Boolean) : [];
  const stack = [n];
  while (stack.length) {
    const x = stack.shift();
    if (x.t && x.t !== '#text') {
      const cls = (x.a.find(([k]) => k === 'class')?.[1] || '').split(' ');
      const a = an && x.a.find(([k]) => k === an);
      if ((!tag || x.t === tag) && want.every((c) => cls.includes(c)) && (!an || (a && (av === undefined || a[1] === av)))) return x;
      stack.unshift(...x.k);
    }
  }
  return null;
}

const label = (n) => {
  if (!n) return '∅';
  if (n.t === '#text') return JSON.stringify(n.v.length > 70 ? n.v.slice(0, 70) + '…' : n.v);
  const cls = n.a.find(([k]) => k === 'class')?.[1];
  const id = n.a.find(([k]) => k === 'data-taxi-view' || k === 'id')?.[1];
  return n.t + (cls ? '.' + cls.split(' ').join('.') : '') + (id ? `#${id.slice(0, 30)}` : '');
};
const ser = (n) => JSON.stringify(n);

function commentsOf(node, out = []) {
  if (node.nodeName === '#comment') out.push(node.data);
  for (const c of [...(node.childNodes || []), ...(node.content?.childNodes || [])]) commentsOf(c, out);
  return out;
}

function diff(a, b, where, out) {
  if (out.length >= MAX) return;
  if (ser(a) === ser(b)) return;
  if (!a || !b || a.t !== b.t || (a.t === '#text' && a.v !== b.v)) {
    out.push(`${where}\n    expected ${label(a)}\n    actual   ${label(b)}`);
    return;
  }
  if (ser(a.a) !== ser(b.a)) {
    const ea = Object.fromEntries(a.a), eb = Object.fromEntries(b.a);
    const keys = [...new Set([...Object.keys(ea), ...Object.keys(eb)])].filter((k) => ea[k] !== eb[k]);
    out.push(`${where} > ${label(a)}  attributes differ:\n` + keys.map((k) => `    ${k}: expected ${JSON.stringify(ea[k]?.slice(0, 120))} actual ${JSON.stringify(eb[k]?.slice(0, 120))}`).join('\n'));
  }
  const here = `${where} > ${label(a)}`;
  if (a.k.length !== b.k.length) {
    // find first divergence by aligning from both ends
    let i = 0;
    while (i < a.k.length && i < b.k.length && ser(a.k[i]) === ser(b.k[i])) i++;
    let j = 0;
    while (j < a.k.length - i && j < b.k.length - i && ser(a.k[a.k.length - 1 - j]) === ser(b.k[b.k.length - 1 - j])) j++;
    const ea = a.k.slice(i, a.k.length - j).map(label), eb = b.k.slice(i, b.k.length - j).map(label);
    out.push(`${here}  child count ${a.k.length} vs ${b.k.length}; from child #${i}:\n    expected [${ea.slice(0, 6).join(', ')}${ea.length > 6 ? ', …' : ''}]\n    actual   [${eb.slice(0, 6).join(', ')}${eb.length > 6 ? ', …' : ''}]`);
    if (ea.length === 1 && eb.length === 1) diff(a.k[i], b.k[i], here, out);
    return;
  }
  for (let i = 0; i < a.k.length; i++) diff(a.k[i], b.k[i], here, out);
}

async function actualHtml(page) {
  if (URL_BASE) {
    const r = await fetch(URL_BASE + routeOf(page));
    if (!r.ok && !(page === '404' && r.status === 404)) throw new Error(`HTTP ${r.status} for ${URL_BASE + routeOf(page)}`);
    return r.text();
  }
  const f = distFile(page);
  if (!fs.existsSync(f)) throw new Error(`missing ${path.relative(ROOT, f)}`);
  return fs.readFileSync(f, 'utf8');
}

let failed = 0;
for (const page of pages) {
  let html;
  try {
    html = await actualHtml(page);
  } catch (err) {
    console.log(`✗ ${page}: ${err.message}`);
    failed++;
    continue;
  }
  const original = parse(fs.readFileSync(path.join(ROOT, 'reference/localized', `${page}.html`), 'utf8'));
  const replica = parse(html);
  let A = norm(original);
  let B = norm(replica);
  if (ONLY) {
    A = select(A, ONLY);
    B = select(B, ONLY);
    if (!A) {
      console.log(`- ${page}: reference has no ${ONLY}`);
      continue;
    }
  }
  const out = [];
  diff(A, B, ONLY ? `[${ONLY}]` : '', out);
  if (STRICT && !ONLY) {
    const [ca, cb] = [commentsOf(original), commentsOf(replica)];
    if (ser(ca) !== ser(cb)) out.push(`HTML comments differ (${ca.length} vs ${cb.length}), first at #${ca.findIndex((c, i) => c !== cb[i])}`);
  }
  const what = ONLY ? `${ONLY} in ${page}` : page;
  if (out.length) {
    failed++;
    console.log(`✗ ${what}: ${out.length >= MAX ? `${MAX}+` : out.length} difference(s)`);
    for (const o of out) console.log('  ' + o);
  } else console.log(`✓ ${what}: DOM identical`);
}
process.exitCode = failed ? 1 : 0;
