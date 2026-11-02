// Every element with its own text, on every route, original against themed: same box height and same number of lines?
// Runs with app.js held until the fonts are in, so the split uses the real font on both sides, like the kit.
// With the same base for --orig and --theme (the default), the original side is that base with the theme blocked.
// Usage: node tools/theme-textwrap.mjs [--orig=url] [--theme=url] [--vps=1440x900,...] [--routes=/,/work] [--show=12]
import { chromium } from 'playwright';
const arg = (n, d) => { const a = process.argv.find((x) => x.startsWith(`--${n}=`)); return a ? a.slice(n.length + 3) : d; };
const VPS = arg('vps', '1440x900,1920x1080,390x844').split(',').map((s) => s.split('x').map(Number));
const ROUTES = arg('routes', '/,/work,/about,/contact,/terms,/privacy,/cookies,/404,/films/savoy,/films/ana-maxim,/films/by-any-means,/films/kafkas-last-trial,/films/moon-in-the-12th-house,/films/my-project-x,/films/outsider-freud,/films/taboo,/films/thehousewife').split(',');
const ORIG = arg('orig', 'http://localhost:4322'), THEME = arg('theme', ORIG);
const LIMIT = +arg('show', 12);
const b = await chromium.launch({ channel: 'msedge' });
const read = async (base, route, width, height, blockTheme) => {
  const ctx = await b.newContext({ viewport: { width, height } });
  await ctx.addCookies(['preloader_shown', 'tutorial_shown'].map((name) => ({ name, value: String(Date.now()), domain: 'localhost', path: '/', expires: Date.now() / 1000 + 3000 })));
  const page = await ctx.newPage();
  if (blockTheme) await page.route(/tema-sinal\.css|fonts\/tema\//, (r) => r.abort());
  await page.route('**/assets/js/app.js', async (r) => { await new Promise((s) => setTimeout(s, 1500)); await r.continue(); });
  await page.goto(`${base}${route}`, { waitUntil: 'load' });
  await page.waitForTimeout(3500);
  const out = await page.evaluate(() => {
    const res = [];
    const all = document.body.querySelectorAll('*');
    let i = -1;
    for (const el of all) {
      i++;
      if (el.closest('[data-local-replica],script,style,svg,noscript')) continue;
      const own = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
      if (!own) continue;
      if (el.closest('.cloneText2,.cloneText')) continue;
      const r = el.getBoundingClientRect();
      if (!r.width && !r.height) continue;
      const c = getComputedStyle(el);
      if (c.display === 'none') continue;
      const range = document.createRange(); range.selectNodeContents(el);
      const tops = new Set([...range.getClientRects()].filter((x) => x.width > 1).map((x) => Math.round(x.top)));
      res.push({ i, cls: (el.className.baseVal ?? el.className).slice(0, 34), t: el.textContent.trim().replace(/\s+/g, ' ').slice(0, 34), w: +r.width.toFixed(1), h: +r.height.toFixed(1), lines: tops.size, fs: c.fontSize, sw: el.scrollWidth, cw: el.clientWidth });
    }
    return { res, doc: document.documentElement.scrollHeight };
  });
  await ctx.close();
  return out;
};
let total = 0;
for (const route of ROUTES) {
  for (const [width, height] of VPS) {
    const [A, B] = [await read(ORIG, route, width, height, ORIG === THEME), await read(THEME, route, width, height, false)];
    // the dev server adds its own nodes, so elements pair up by class, text and order of appearance instead of by raw index
    const keyed = (list) => { const seen = {}; return list.map((x) => { const k = `${x.cls}|${x.t}`; seen[k] = (seen[k] || 0) + 1; return [`${k}|${seen[k]}`, x]; }); };
    const mapB = new Map(keyed(B.res));
    const bad = [];
    for (const [key, a] of keyed(A.res)) {
      const t = mapB.get(key);
      if (!t) { bad.push(`missing ${a.cls} "${a.t}"`); continue; }
      if (a.lines !== t.lines || Math.abs(a.h - t.h) > 1) bad.push(`${a.lines}L ${a.w}x${a.h} -> ${t.lines}L ${t.w}x${t.h}  fs ${a.fs}  .${a.cls}  "${a.t}"`);
    }
    total += bad.length;
    console.log(`${route} ${width}: ${A.res.length} texts, ${bad.length} differ, doc ${A.doc} -> ${B.doc}`);
    bad.slice(0, LIMIT).forEach((x) => console.log('    ', x));
    if (bad.length > LIMIT) console.log(`     ... ${bad.length - LIMIT} more`);
  }
}
console.log(`TOTAL differing: ${total}`);
await b.close(); process.exit(0);
