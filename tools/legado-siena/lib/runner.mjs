// Shared Playwright runner for scenario modules in tools/scenarios/*.mjs.
// A scenario module default-exports { [name]: { viewports?: string[], video?: boolean, run(ctx) } }.
// ctx = { page, base, shot(label, opts?), at(seconds), settle(ms?), wheel(dy, steps?), width, height, mobile, log }
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

export const DEFAULT_VIEWPORTS = ['1440x900', '1920x1080', '390x844'];
// app.js decides B.isMobile from navigator.userAgent alone, so phone viewports need a phone UA too
export const ANDROID_UA =
  'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36';
// console lines that also appear on the live site and say nothing about the replica
const BENIGN = [
  /Images loaded lazily/,
  /\[requestfailed\] \S+\.(mp4|webm) net::ERR_ABORTED/, // media range requests cancelled on seek/pause
  /Unable to preventDefault inside passive event listener/, // the site's own virtual-scroll
];

export async function loadScenarios() {
  const dir = path.resolve(import.meta.dirname, '../scenarios');
  const all = {};
  for (const f of fs.readdirSync(dir).filter((f) => f.endsWith('.mjs')).sort()) {
    const mod = (await import(pathToFileURL(path.join(dir, f)).href)).default || {};
    for (const [k, v] of Object.entries(mod)) all[k] = { viewports: DEFAULT_VIEWPORTS, ...v, file: f };
  }
  return all;
}

let browserPromise;
export function getBrowser() {
  browserPromise ??= chromium.launch({
    channel: process.env.PW_CHANNEL ?? 'msedge', // Edge plays the H.264 mp4s; bundled Chromium does not
    args: ['--autoplay-policy=no-user-gesture-required'],
  });
  return browserPromise;
}

/** Runs one scenario at one viewport against one base URL; writes PNGs (+ video) and console.txt into outDir. */
export async function runScenario(scenario, { base, viewport, outDir, video = scenario.video }) {
  const [width, height] = viewport.split('x').map(Number);
  const mobile = width < 768;
  fs.mkdirSync(outDir, { recursive: true });
  const browser = await getBrowser();
  const ctx = await browser.newContext({
    viewport: { width, height },
    deviceScaleFactor: 1,
    isMobile: mobile,
    hasTouch: mobile,
    ...(mobile ? { userAgent: ANDROID_UA } : {}),
    ...(video ? { recordVideo: { dir: outDir, size: { width, height } } } : {}),
  });
  // app.js randomises some visuals (e.g. case-study footage parallax items hidden with
  // Math.random() < .4); a seeded PRNG makes both sides of an A/B run draw the same numbers.
  if (process.env.PW_SEED !== 'off') {
    await ctx.addInitScript((seed) => {
      let s = seed % 2147483647 || 1;
      Math.random = () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
    }, +(process.env.PW_SEED || 20251029));
  }
  const page = await ctx.newPage();
  const log = [];
  page.on('console', (m) => log.push(`[${m.type()}] ${m.text()}`));
  page.on('pageerror', (e) => log.push(`[pageerror] ${e.message}`));
  page.on('requestfailed', (r) => log.push(`[requestfailed] ${r.url()} ${r.failure()?.errorText}`));
  page.on('response', (r) => r.status() >= 400 && log.push(`[http ${r.status()}] ${r.url()}`));
  const t0 = Date.now();
  const shots = [];
  const c = {
    page,
    base: base.replace(/\/$/, ''),
    width,
    height,
    mobile,
    log,
    shot: async (label, opts = {}) => {
      await page.screenshot({ path: path.join(outDir, `${label}.png`), ...opts });
      shots.push(label); // only states whose PNG was really written in this run
    },
    at: async (sec) => {
      const wait = sec * 1000 - (Date.now() - t0);
      if (wait > 0) await page.waitForTimeout(wait);
    },
    settle: (ms = 1200) => page.waitForTimeout(ms),
    wheel: async (dy, steps = 6) => {
      await page.mouse.move(width / 2, height / 2);
      for (let i = 0; i < steps; i++) {
        await page.mouse.wheel(0, dy / steps);
        await page.waitForTimeout(40);
      }
    },
  };
  try {
    await scenario.run(c);
  } catch (err) {
    log.push(`[scenario-error] ${err.stack}`);
  }
  fs.writeFileSync(path.join(outDir, 'console.txt'), log.join('\n'));
  const vid = page.video();
  await ctx.close();
  if (vid) {
    try {
      fs.renameSync(await vid.path(), path.join(outDir, 'video.webm'));
    } catch {}
  }
  return { shots, log, problems: log.filter((l) => /error|failed|http [45]/.test(l) && !BENIGN.some((re) => re.test(l))) };
}

export async function closeBrowser() {
  if (browserPromise) await (await browserPromise).close();
  browserPromise = undefined;
}
