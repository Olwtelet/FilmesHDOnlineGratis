// Compares two snapshots made by tools/theme-snapshot.mjs. Colors may change between them; structure, geometry and behaviour
// must not. Besides the report it can write before/after montages of the states named in --sheet.
//
// What is compared, state by state:
//   structure   the same elements, at the same place in the tree, with the same classes
//   layout      position and height of each element, and the size of the page
//   text fit    elements that only changed width or x, the expected effect of a different font on shrink-to-fit text
//   visibility  visibility and opacity of each element
//   behaviour   the state lines of each scenario ([note]): page, film, slider, open panels, transform
//
// Usage: node tools/theme-diff.mjs --a=antes --b=depois [--out=reference/captures/tema-fase1] [--only=substr,...] [--tol=2]
//                                  [--show=8] [--report=file.md]
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

const opt = (k, d) => process.argv.find((a) => a.startsWith(`--${k}=`))?.slice(k.length + 3) ?? d;
const ROOT = path.resolve(opt('out', 'reference/captures/tema-fase1'));
const A = path.join(ROOT, opt('a', 'antes')), B = path.join(ROOT, opt('b', 'depois'));
const TOL = +opt('tol', 2), SHOW = +opt('show', 8);
const only = opt('only')?.split(',');

const readGeo = (dir) => JSON.parse(zlib.gunzipSync(fs.readFileSync(path.join(dir, 'geometry.json.gz'))).toString());
const readNotes = (dir) => {
  const f = path.join(dir, 'console.txt');
  if (!fs.existsSync(f)) return [];
  return fs.readFileSync(f, 'utf8').split('\n').filter((l) => l.startsWith('[note]')).map((l) => {
    const m = l.match(/^\[note\] t=[\d.]+ (.*?) (\{.*\})\s*$/);
    if (!m) return { label: l.slice(7), state: null };
    try { return { label: m[1], state: JSON.parse(m[2]) }; } catch { return { label: m[1], state: null }; }
  });
};
const errors = (dir) => {
  const f = path.join(dir, 'console.txt');
  return fs.existsSync(f) ? fs.readFileSync(f, 'utf8').split('\n').filter((l) => l.startsWith('[pageerror]')).map((l) => l.slice(0, 160)) : [];
};
const near = (a, b, t = TOL) => Math.abs(a - b) <= t;

const totals = { states: 0, compared: 0, missing: 0, extra: 0, classes: 0, layout: 0, fit: 0, vis: 0, page: 0, routes: 0, notes: 0, newErrors: 0 };
const lines = [];
const rows = [];
for (const name of fs.readdirSync(A).filter((n) => fs.statSync(path.join(A, n)).isDirectory()).sort()) {
  if (only && !only.some((o) => name.includes(o))) continue;
  if (!fs.existsSync(path.join(B, name))) { lines.push(`${name}: not in ${path.basename(B)}`); continue; }
  for (const vp of fs.readdirSync(path.join(A, name)).sort()) {
    const da = path.join(A, name, vp), db = path.join(B, name, vp);
    if (!fs.existsSync(path.join(db, 'geometry.json.gz'))) { lines.push(`${name} @${vp}: no geometry in ${path.basename(B)}`); continue; }
    const ga = readGeo(da), gb = readGeo(db);
    const row = { name, vp, states: 0, els: 0, missing: 0, extra: 0, classes: 0, layout: 0, fit: 0, vis: 0, page: [], worst: [] };
    for (const label of Object.keys(ga)) {
      const a = ga[label], b = gb[label];
      if (!b) { row.page.push(`${label}: state missing`); totals.page++; continue; }
      row.states++;
      if (a.url !== b.url) { row.page.push(`${label}: route ${a.url} -> ${b.url}`); totals.routes++; }
      if (!near(a.sh, b.sh) || !near(a.sw, b.sw) || !near(a.y, b.y)) { row.page.push(`${label}: page ${a.sw}x${a.sh} y${a.y} -> ${b.sw}x${b.sh} y${b.y}`); totals.page++; }
      const mb = new Map(b.els.map((e) => [e[0], e]));
      const seen = new Set();
      for (const e of a.els) {
        const t = mb.get(e[0]);
        row.els++;
        if (!t) { row.missing++; row.worst.push({ k: 1e4, s: `${label} gone: ${e[1]}.${e[2]} ${e[5]}x${e[6]}` }); continue; }
        seen.add(e[0]);
        if (e[1] !== t[1] || e[2] !== t[2]) { row.classes++; row.worst.push({ k: 9e3, s: `${label} class: ${e[1]}.${e[2]} -> ${t[1]}.${t[2]}` }); }
        const [dx, dy, dw, dh] = [t[3] - e[3], t[4] - e[4], t[5] - e[5], t[6] - e[6]].map((v) => Math.round(v * 10) / 10);
        if (!near(dy, 0) || !near(dh, 0)) { row.layout++; row.worst.push({ k: Math.abs(dy) + Math.abs(dh), s: `${label} .${e[2]} y${e[4]} h${e[6]} -> y${t[4]} h${t[6]} (dy ${dy}, dh ${dh})` }); }
        else if (!near(dx, 0) || !near(dw, 0)) row.fit++;
        if (e[7] !== t[7] || !near(e[8], t[8], .05)) { row.vis++; row.worst.push({ k: 5e3 * Math.abs(e[8] - t[8]) + 1, s: `${label} .${e[2]} opacity ${e[8]} -> ${t[8]}, visible ${e[7]} -> ${t[7]}` }); }
      }
      for (const t of b.els) if (!seen.has(t[0])) { row.extra++; row.worst.push({ k: 8e3, s: `${label} new: ${t[1]}.${t[2]} ${t[5]}x${t[6]}` }); }
    }
    const na = readNotes(da), nb = readNotes(db);
    const noteDiffs = [];
    na.forEach((n, i) => {
      const m = nb[i];
      if (!m) { noteDiffs.push(`missing "${n.label}"`); return; }
      if (n.label !== m.label) { noteDiffs.push(`"${n.label}" -> "${m.label}"`); return; }
      if (!n.state || !m.state) return;
      for (const k of Object.keys(n.state)) if (JSON.stringify(n.state[k]) !== JSON.stringify(m.state[k])) noteDiffs.push(`"${n.label}" ${k}: ${JSON.stringify(n.state[k])?.slice(0, 44)} -> ${JSON.stringify(m.state[k])?.slice(0, 44)}`);
    });
    const ea = errors(da), eb = errors(db).filter((e) => !ea.includes(e));
    Object.assign(row, { noteDiffs, newErrors: eb });
    totals.states += row.states; totals.compared += row.els; totals.missing += row.missing; totals.extra += row.extra; totals.classes += row.classes;
    totals.layout += row.layout; totals.fit += row.fit; totals.vis += row.vis; totals.notes += noteDiffs.length; totals.newErrors += eb.length;
    rows.push(row);
  }
}
const pct = (n, d) => (d ? ((100 * n) / d).toFixed(2) : '0.00');
lines.push('| scenario | viewport | states | elements | gone | new | class | layout | text fit | visibility | page | notes | new errors |');
lines.push('|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|');
for (const r of rows) lines.push(`| ${r.name} | ${r.vp} | ${r.states} | ${r.els} | ${r.missing} | ${r.extra} | ${r.classes} | ${r.layout} (${pct(r.layout, r.els)}%) | ${r.fit} | ${r.vis} | ${r.page.length} | ${r.noteDiffs.length} | ${r.newErrors.length} |`);
lines.push('', `**Total:** ${totals.states} states, ${totals.compared} element measurements; gone ${totals.missing}, new ${totals.extra}, class ${totals.classes}, layout ${totals.layout} (${pct(totals.layout, totals.compared)}%), text fit ${totals.fit} (${pct(totals.fit, totals.compared)}%), visibility ${totals.vis} (${pct(totals.vis, totals.compared)}%), page size/scroll ${totals.page}, route ${totals.routes}, state lines ${totals.notes}, new page errors ${totals.newErrors}.`, '');
for (const r of rows) {
  if (!(r.page.length || r.noteDiffs.length || r.newErrors.length || r.worst.length)) continue;
  lines.push(`### ${r.name} @${r.vp}`);
  r.page.slice(0, SHOW).forEach((x) => lines.push(`- page: ${x}`));
  r.noteDiffs.slice(0, SHOW).forEach((x) => lines.push(`- state: ${x}`));
  r.newErrors.slice(0, SHOW).forEach((x) => lines.push(`- error: ${x}`));
  const uniq = new Map();
  for (const w of r.worst.sort((p, q) => q.k - p.k)) { const k = w.s.replace(/^\S+ /, '').replace(/[-\d.]+/g, '#'); if (!uniq.has(k)) uniq.set(k, w.s); }
  [...uniq.values()].slice(0, SHOW).forEach((x) => lines.push(`- ${x}`));
  lines.push('');
}
const text = lines.join('\n');
const report = opt('report');
if (report) fs.writeFileSync(report, text);
console.log(report ? lines.filter((l) => l.startsWith('**Total')).join('\n') : text);
process.exit(0);
