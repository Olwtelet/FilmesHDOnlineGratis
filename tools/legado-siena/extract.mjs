// Prints the outerHTML of the first element matching a simple selector (tag.class or [attr=value])
// in a reference page. Usage: node tools/extract.mjs <page> <selector> [--index=n]
import fs from 'node:fs';
import path from 'node:path';
import { parse, serializeOuter } from 'parse5';

const [page, sel] = process.argv.slice(2);
const idx = +(process.argv.find((a) => a.startsWith('--index='))?.slice(8) ?? 0);
const doc = parse(fs.readFileSync(path.resolve(import.meta.dirname, '../reference/localized', `${page}.html`), 'utf8'));
const m = sel.match(/^(\w+)?((?:\.[\w-]+)*)(?:\[([\w-]+)(?:=['"]?([^'"\]]*)['"]?)?\])?$/);
const [, tag, classes, attrName, attrVal] = m;
const want = classes ? classes.split('.').filter(Boolean) : [];
const hits = [];
(function walk(n) {
  if (n.attrs) {
    const cls = (n.attrs.find((a) => a.name === 'class')?.value || '').split(/\s+/);
    const a = attrName && n.attrs.find((x) => x.name === attrName);
    if ((!tag || n.tagName === tag) && want.every((c) => cls.includes(c)) && (!attrName || (a && (attrVal === undefined || a.value === attrVal)))) hits.push(n);
  }
  (n.childNodes || []).forEach(walk);
  if (n.content) walk(n.content);
})(doc);
if (!hits[idx]) process.exit(2);
process.stdout.write(serializeOuter(hits[idx]));
