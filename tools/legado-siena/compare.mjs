// A/B visual comparison: runs every scenario against two base URLs at the same viewports and
// writes side-by-side images (A | B), diff masks and a pixel-diff report.
// Usage: node tools/compare.mjs --a=https://www.siena.film --b=http://localhost:4322 --out=reference/captures/compare/run1
//                               [--only=substr[,substr]] [--viewports=1440x900,1920x1080,390x844] [--threshold=0.1]
// Re-running with --only into an existing --out keeps the other scenarios' rows in the report
// (only when that report was made with the same --a, --b and --threshold).
// Side-by-side and diff images are written only for states that differ (diff > 0 or size mismatch).
import fs from 'node:fs';
import path from 'node:path';
import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';
import { loadScenarios, runScenario, closeBrowser } from './lib/runner.mjs';

const opt = (k) => process.argv.find((a) => a.startsWith(`--${k}=`))?.slice(k.length + 3);
const A = opt('a') ?? 'https://www.siena.film';
const B = opt('b') ?? 'http://localhost:4322';
const OUT = path.resolve(opt('out') ?? 'reference/captures/compare/latest');
const only = opt('only')?.split(',');
const vpOverride = opt('viewports')?.split(',');
const threshold = +(opt('threshold') ?? 0.1);

function sideBySide(a, b) {
  const o = new PNG({ width: a.width + b.width + 6, height: Math.max(a.height, b.height) });
  for (let i = 0; i < o.data.length; i += 4) o.data.set([255, 0, 255, 255], i);
  PNG.bitblt(a, o, 0, 0, a.width, a.height, 0, 0);
  PNG.bitblt(b, o, 0, 0, b.width, b.height, a.width + 6, 0);
  return o;
}

const all = await loadScenarios();
const reportJson = path.join(OUT, 'report.json');
const prev = only && fs.existsSync(reportJson) ? JSON.parse(fs.readFileSync(reportJson, 'utf8')) : null;
if (prev && (prev.a !== A || prev.b !== B || prev.threshold !== threshold)) {
  console.error(`${reportJson} was made with --a=${prev.a} --b=${prev.b} --threshold=${prev.threshold}: use another --out`);
  process.exit(1);
}
const ran = new Set();
const rows = [];
const problems = [];
for (const name of Object.keys(all).filter((n) => !only || only.some((o) => n.includes(o)))) {
  for (const vp of vpOverride ?? all[name].viewports) {
    ran.add(`${name}@${vp}`);
    const dirA = path.join(OUT, 'a', name, vp);
    const dirB = path.join(OUT, 'b', name, vp);
    const sbsDir = path.join(OUT, 'sbs', name, vp);
    // stale PNGs from an earlier run must never be compared as if they were fresh
    for (const d of [dirA, dirB, sbsDir]) fs.rmSync(d, { recursive: true, force: true });
    const [ra, rb] = await Promise.all([
      runScenario(all[name], { base: A, viewport: vp, outDir: dirA }),
      runScenario(all[name], { base: B, viewport: vp, outDir: dirB }),
    ]);
    for (const label of ra.shots) {
      const fa = path.join(dirA, `${label}.png`);
      const fb = path.join(dirB, `${label}.png`);
      if (!rb.shots.includes(label)) {
        rows.push({ name, vp, label, diff: null, note: 'missing in B' });
        continue;
      }
      const pa = PNG.sync.read(fs.readFileSync(fa));
      const pb = PNG.sync.read(fs.readFileSync(fb));
      let diff = null;
      let mask = null;
      if (pa.width === pb.width && pa.height === pb.height) {
        mask = new PNG({ width: pa.width, height: pa.height });
        diff = pixelmatch(pa.data, pb.data, mask.data, pa.width, pa.height, { threshold }) / (pa.width * pa.height);
      }
      if (diff !== 0) {
        fs.mkdirSync(sbsDir, { recursive: true });
        if (mask) fs.writeFileSync(path.join(sbsDir, `${label}.diff.png`), PNG.sync.write(mask));
        fs.writeFileSync(path.join(sbsDir, `${label}.png`), PNG.sync.write(sideBySide(pa, pb)));
      }
      rows.push({ name, vp, label, diff, note: diff === null ? 'size mismatch' : '' });
    }
    for (const label of rb.shots.filter((l) => !ra.shots.includes(l))) rows.push({ name, vp, label, diff: null, note: 'missing in A' });
    console.log(`${name} @${vp}: A ${ra.problems.length} problems, B ${rb.problems.length} problems`);
    for (const [side, r] of [['A', ra], ['B', rb]]) for (const p of r.problems) problems.push({ name, vp, side, line: p });
    if (rb.problems.length) console.log('   B: ' + rb.problems.slice(0, 5).join('\n   B: '));
  }
}
await closeBrowser();

// keep rows of scenarios not re-run in this invocation
if (prev) {
  rows.push(...prev.rows.filter((r) => !ran.has(`${r.name}@${r.vp}`)));
  if (prev.problems) problems.push(...prev.problems.filter((p) => !ran.has(`${p.name}@${p.vp}`)));
}
rows.sort((x, y) => (y.diff ?? 1) - (x.diff ?? 1) || x.name.localeCompare(y.name) || x.vp.localeCompare(y.vp) || x.label.localeCompare(y.label));
const pct = (d) => (d === null ? '—' : (d * 100).toFixed(4));
const md = [
  `# Visual comparison\n\nA = ${A}  \nB = ${B}  \nthreshold = ${threshold}  \nstates = ${rows.length}, identical = ${rows.filter((r) => r.diff === 0).length}\n`,
  '| scenario | viewport | state | diff % | note |',
  '|---|---|---|---|---|',
  ...rows.map((r) => `| ${r.name} | ${r.vp} | ${r.label} | ${pct(r.diff)} | ${r.note} |`),
  '',
  `## Console problems (${problems.length})\n`,
  ...problems.map((p) => `- ${p.side} ${p.name} @${p.vp}: \`${p.line.slice(0, 300).replace(/`/g, "'")}\``),
];
fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(path.join(OUT, 'report.md'), md.join('\n') + '\n');
fs.writeFileSync(reportJson, JSON.stringify({ a: A, b: B, threshold, rows, problems }, null, 1));
console.log(`report: ${path.join(OUT, 'report.md')}`);
