// Keyboard navigation A/B: on each route, presses Tab repeatedly on both sites and compares the
// focus order (element, label, href, on-screen box), then checks that Enter on a focused internal
// link navigates to the same route on both. The preloader/tutorial cookies are pre-set so Tab
// starts on the page itself.
// --settle is the wait between the load event and the first Tab: the nav ticket slides in for about
// 1.2 s and stops up to about 3.8 s after load (on the live site too), so an earlier measurement
// reads a moving element and differs from run to run, even between two copies of the live site.
// Usage: node tools/check-keyboard.mjs [--a=https://www.siena.film] [--b=http://localhost:4322] [--tabs=30]
//                                     [--settle=6000 (ms before the Tabs)] [--wait=3500 (ms after Enter)] [--routes=/,/work]
import { chromium } from 'playwright';

const opt = (k) => process.argv.find((a) => a.startsWith(`--${k}=`))?.slice(k.length + 3);
const A = (opt('a') ?? 'https://www.siena.film').replace(/\/$/, '');
const B = (opt('b') ?? 'http://localhost:4322').replace(/\/$/, '');
const TABS = +(opt('tabs') ?? 30);
const SETTLE = +(opt('settle') ?? 6000);
const WAIT = +(opt('wait') ?? 3500);
const ROUTES = opt('routes')?.split(',') ?? ['/', '/work', '/about', '/contact', '/cookies', '/films/savoy', '/films/thehousewife', '/404'];

const browser = await chromium.launch({ channel: process.env.PW_CHANNEL ?? 'msedge' });

async function focusOrder(base, route) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const now = String(Date.now());
  await ctx.addCookies(['preloader_shown', 'tutorial_shown'].map((name) => ({ name, value: now, url: base })));
  await ctx.route(/googletagmanager|google-analytics/, (r) => r.fulfill({ status: 204 }));
  const page = await ctx.newPage();
  await page.goto(base + route, { waitUntil: 'load' });
  await page.waitForTimeout(SETTLE);
  const seq = [];
  for (let i = 0; i < TABS; i++) {
    await page.keyboard.press('Tab');
    seq.push(
      await page.evaluate(() => {
        const el = document.activeElement;
        if (!el || el === document.body) return 'body';
        const r = el.getBoundingClientRect();
        const label = (el.getAttribute('aria-label') || el.textContent || el.value || '').replace(/\s+/g, ' ').trim().slice(0, 40);
        const href = el.getAttribute('href');
        return `${el.tagName.toLowerCase()}.${[...el.classList].slice(0, 2).join('.')} "${label}"${href ? ` -> ${href}` : ''} @${Math.round(r.x)},${Math.round(r.y)} ${Math.round(r.width)}x${Math.round(r.height)}`;
      }),
    );
  }
  // Enter on the first focused internal link
  await page.goto(base + route, { waitUntil: 'load' });
  await page.waitForTimeout(SETTLE);
  let entered = null;
  for (let i = 0; i < TABS; i++) {
    await page.keyboard.press('Tab');
    const href = await page.evaluate(() => document.activeElement?.getAttribute('href'));
    if (href && href.startsWith('/') && href !== route) {
      await page.keyboard.press('Enter');
      await page.waitForTimeout(WAIT);
      entered = `${href} => ${new URL(page.url()).pathname}`;
      break;
    }
  }
  await ctx.close();
  return { seq, entered };
}

let failures = 0;
for (const route of ROUTES) {
  const [a, b] = await Promise.all([focusOrder(A, route), focusOrder(B, route)]);
  const diffs = a.seq.map((s, i) => (s === b.seq[i] ? null : `   #${i + 1}\n     A ${s}\n     B ${b.seq[i]}`)).filter(Boolean);
  const same = !diffs.length && a.entered === b.entered;
  if (!same) failures++;
  console.log(`${same ? '✓' : '✗'} ${route}: ${TABS} Tab stops ${diffs.length ? `(${diffs.length} differ)` : 'identical'}; Enter: A ${a.entered} | B ${b.entered}`);
  if (diffs.length) console.log(diffs.join('\n'));
  if (route === '/') console.log('   first stops: ' + a.seq.slice(0, 4).join(' | '));
}
await browser.close();
process.exitCode = failures ? 1 : 0;
