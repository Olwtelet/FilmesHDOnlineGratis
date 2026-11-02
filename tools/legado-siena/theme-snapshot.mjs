// Before/after snapshots for visual re-theming. Runs the deterministic scenarios of tools/scenarios and, at every
// state, saves the screenshot plus the geometry of each visible element (position, size, visibility, opacity).
// tools/theme-diff.mjs then compares two labels: colors may change, geometry and behaviour must not.
// Elements tagged data-local-replica are left out, so decorative additions never count as structure.
//
// Usage: node tools/theme-snapshot.mjs --label=antes [--base=http://localhost:4322] [--out=reference/captures/tema-fase1]
//                                      [--only=substr[,substr]] [--viewports=1440x900,...] [--jobs=3] [--no-theme]
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { loadScenarios, runScenario, closeBrowser } from './lib/runner.mjs';

const opt = (k) => process.argv.find((a) => a.startsWith(`--${k}=`))?.slice(k.length + 3);
const LABEL = opt('label');
if (!LABEL) throw new Error('--label is required');
const BASE = opt('base') ?? 'http://localhost:4322';
const OUT = path.resolve(opt('out') ?? 'reference/captures/tema-fase1', LABEL);
const JOBS = +(opt('jobs') ?? 3);
const only = opt('only')?.split(',');
const vpOverride = opt('viewports')?.split(',');

// The states that matter for this comparison: every page, the intro, the menus and Work in both modes.
const MAIN = ['home-intro', 'home-roll', 'home-explore', 'nav-menus', 'nav-to-work', 'work-roll', 'page-about', 'page-contact', 'page-cookies', 'page-terms', 'page-privacy', 'page-404', 'rotate-notice', 'film-savoy', 'film-moon-in-the-12th-house', 'film-taboo', 'film-kafkas-last-trial', 'film-my-project-x', 'film-ana-maxim', 'film-outsider-freud', 'film-by-any-means', 'film-thehousewife', 'film-player-savoy', 'film-next-savoy', 'motion-preloader', 'motion-work-footage', 't61-menu-home', 't61-menu-film', 't61-footer', 'ixd-film-footage-hover', 'ixd-film-footer-hover'];

const GEOMETRY = () => {
  const round = (v) => Math.round(v * 10) / 10;
  const els = [];
  const W = innerWidth, H = innerHeight;
  const walk = (el, at) => {
    if (el.hasAttribute('data-local-replica')) return;
    const c = getComputedStyle(el);
    if (c.display === 'none') return;
    const r = el.getBoundingClientRect();
    if (r.width > 0 && r.height > 0 && r.right > 0 && r.bottom > 0 && r.left < W && r.top < H) {
      els.push([at, el.tagName.toLowerCase(), String(el.getAttribute('class') || '').slice(0, 50), round(r.x), round(r.y), round(r.width), round(r.height), c.visibility === 'hidden' ? 0 : 1, +(+c.opacity).toFixed(2)]);
    }
    let i = 0;
    // the theme's stylesheet tag sits in the body: it must not shift the position of the elements after it
    for (const k of el.children) if (!k.matches('link[href*="tema-sinal"]')) walk(k, `${at}/${i++}`);
  };
  walk(document.body, 'b');
  return { url: location.pathname, sw: document.documentElement.scrollWidth, sh: document.documentElement.scrollHeight, y: Math.round(window.scrollY), inner: [W, H], els };
};

const all = await loadScenarios();
const names = Object.keys(all).filter((n) => (only ? only.some((o) => n.includes(o)) : MAIN.includes(n)));
const jobs = names.flatMap((name) => (vpOverride ?? all[name].viewports).map((vp) => ({ name, vp })));
console.log(`${LABEL}: ${names.length} scenarios, ${jobs.length} runs, base ${BASE}`);

let next = 0, done = 0, states = 0;
const t0 = Date.now();
async function worker() {
  while (next < jobs.length) {
    const { name, vp } = jobs[next++];
    const outDir = path.join(OUT, name, vp);
    fs.rmSync(outDir, { recursive: true, force: true });
    fs.mkdirSync(outDir, { recursive: true });
    const original = all[name];
    const geometry = {};
    const wrapped = {
      ...original,
      run: async (ctx) => {
        // --no-theme: control baseline on the current build, to tell the theme's effect from run-to-run variation
        if (process.argv.includes('--no-theme')) await ctx.page.route(/tema-sinal\.css|fonts\/tema\//, (r) => r.abort());
        const shot = ctx.shot;
        ctx.shot = async (label, opts) => {
          geometry[label] = await ctx.page.evaluate(GEOMETRY).catch((e) => ({ error: String(e) }));
          await shot(label, opts);
        };
        await original.run(ctx);
      },
    };
    const r = await runScenario(wrapped, { base: BASE, viewport: vp, outDir, video: false });
    fs.writeFileSync(path.join(outDir, 'geometry.json.gz'), zlib.gzipSync(JSON.stringify(geometry)));
    states += r.shots.length;
    done++;
    console.log(`${String(done).padStart(3)}/${jobs.length} ${name} @${vp}: ${r.shots.length} states, ${r.problems.length} problems (${Math.round((Date.now() - t0) / 1000)} s)`);
    for (const p of r.problems.slice(0, 3)) console.log(`      ${p.slice(0, 160)}`);
  }
}
await Promise.all(Array.from({ length: JOBS }, worker));
console.log(`${LABEL}: done, ${states} states in ${Math.round((Date.now() - t0) / 1000)} s`);
await closeBrowser();
process.exit(0);
