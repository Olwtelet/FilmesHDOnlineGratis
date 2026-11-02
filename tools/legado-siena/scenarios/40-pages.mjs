// Content-page scenarios (about, contact, policy pages, 404) + the "rotate your device" notice.
// Also exports the deterministic helpers shared with 50-films.mjs.
//
// Determinism rules applied everywhere:
//  - scrolling only through Lenis (wheel events), fixed step = 0.85 x viewport height, then a fixed settle;
//  - before every shot: web fonts ready + every <img> intersecting the viewport loaded/decoded
//    (LIVE loads from the CDN, MIRROR/REPLICA from disk) and every <video> paused at a fixed time;
//  - screenshots use animations:'disabled' (CSS transitions finished, infinite CSS animations such as the
//    prizes marquee reset to their first frame); GSAP/Lenis (JS) animations get the settle time instead;
//  - nothing is ever submitted (newsletter is only focused + typed into).

export const STEP = 0.85; // scroll step as a fraction of the viewport height
export const SETTLE = 2200; // ms after a wheel step (Lenis duration 1 s + group reveal 1.2 s)
export const SHOT_OPTS = { animations: 'disabled' };

// Same phone UA / analytics block / PRNG as the kit in 10-home.mjs, so every scenario sees the same app.js paths.
const ANDROID_UA =
  'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36';
const BLOCK = /google-analytics\.com|googletagmanager\.com|doubleclick\.net/;
// app.js uses Math.random() at runtime, e.g. the film footage strip hides ~40% of its parallax items at random
// (Nh.setupParallaxItems): a seeded PRNG makes that choice identical on every base and every run.
const SEED_RANDOM = `(() => {
  let s = 0x2f6b9d3a;
  Math.random = function () {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
})();`;

/**
 * Per-context setup, before the first navigation: seeded Math.random, analytics blocked (the localized pages have
 * no GA; on LIVE it only adds requests), and a real phone UA for phone viewports. app.js decides B.isMobile from
 * navigator.userAgent only, while the runner sets isMobile/hasTouch (width < 768) but keeps the desktop Edge UA.
 * `phone: true` on a width >= 768 viewport (e.g. 844x390 landscape) also emulates the mobile device metrics + touch.
 */
export async function prepare(ctx, { phone = ctx.mobile, landscape = ctx.width > ctx.height } = {}) {
  const { page } = ctx;
  await page.addInitScript(SEED_RANDOM);
  await page.route(BLOCK, (r) => r.fulfill({ status: 204, body: '' }));
  // app.js measures layout once at start-up (the scroll trackers behind every parallax image keep the bounds
  // computed in a microtask after construction and never recompute them). If web fonts / eager images are not in
  // yet, those bounds are off by the fallback-font reflow (~40 px on /films/taboo), which then shows up as a
  // different parallax offset for the rest of the visit. Local servers win that race, the CDN often does not, so
  // the deferred app.js request (vercel.app/app.js on LIVE, /assets/js/app.js locally) is held until fonts and
  // non-lazy images are done: every base then initialises on the final layout.
  await page.route(/\/app\.js(\?.*)?$/, async (route) => {
    const t0 = Date.now();
    const ok = await page
      .evaluate(async () => {
        // parsing must be finished (all stylesheets/text known; the held deferred script only blocks DCL), then
        // fonts + eager images must be done on two consecutive checks
        let stable = 0;
        for (let i = 0; i < 200; i++) {
          void document.body?.offsetHeight; // style + layout => triggers the @font-face loads
          await new Promise((r) => requestAnimationFrame(() => setTimeout(r, 50)));
          await document.fonts.ready;
          const eager = [...document.images].filter((im) => im.loading !== 'lazy');
          const done =
            document.readyState !== 'loading' && document.fonts.status === 'loaded' && eager.every((im) => im.complete);
          stable = done ? stable + 1 : 0;
          if (stable >= 2) return true;
        }
        return false;
      })
      .catch(() => null);
    if (ok !== true) ctx.log.push(`[scenario-note] app.js released without settled fonts/images (${ok}) after ${Date.now() - t0} ms`);
    await route.continue().catch(() => {});
  });
  if (!phone) return;
  const cdp = await page.context().newCDPSession(page);
  ctx.cdp = cdp; // keep the session (and its overrides) alive for the whole run
  await cdp.send('Emulation.setUserAgentOverride', { userAgent: ANDROID_UA, platform: 'Linux armv8l' });
  if (!ctx.mobile) {
    await cdp.send('Emulation.setDeviceMetricsOverride', {
      width: ctx.width,
      height: ctx.height,
      deviceScaleFactor: 1,
      mobile: true,
      screenOrientation: landscape ? { type: 'landscapePrimary', angle: 90 } : { type: 'portraitPrimary', angle: 0 },
    });
    await cdp.send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
  }
}

/** Wraps a scenario so prepare() always runs first. `prep` = options for prepare(). */
export function scenario({ prep, run, ...rest }) {
  return {
    ...rest,
    async run(ctx) {
      await prepare(ctx, prep);
      await run(ctx);
    },
  };
}

/** Waits for fonts, for every visible <img> to be decoded, and for videos to have metadata. */
export async function waitVisualReady({ page, log }, timeout = 10000) {
  await page
    .evaluate(async (timeout) => {
      const vis = (el) => {
        const r = el.getBoundingClientRect();
        return r.width > 0 && r.height > 0 && r.bottom > -100 && r.top < innerHeight + 100 && r.right > 0 && r.left < innerWidth;
      };
      // IntersectionObserver also accounts for overflow clipping: lazy images inside the closed menu panels
      // have on-screen rects but are never loaded by the browser, so they must not be waited for.
      const candidates = [...document.images].filter(vis);
      const imgs = candidates.length
        ? await new Promise((res) => {
            const obs = new IntersectionObserver((entries) => {
              obs.disconnect();
              res(entries.filter((e) => e.isIntersecting).map((e) => e.target));
            });
            candidates.forEach((i) => obs.observe(i));
          })
        : [];
      const waitImg = (img) =>
        img.complete
          ? img.decode?.().catch(() => {})
          : new Promise((res) => {
              img.addEventListener('load', () => img.decode?.().catch(() => {}).then(res), { once: true });
              img.addEventListener('error', res, { once: true });
            });
      // visible videos only need metadata here: freezeVideos() seeks them and waits for the frame
      const vids = [...document.querySelectorAll('video')].filter((v) => v.currentSrc && !v.error && vis(v));
      const waitVid = (v) =>
        v.readyState >= 1
          ? null
          : new Promise((res) => {
              v.addEventListener('loadedmetadata', res, { once: true });
              v.addEventListener('error', res, { once: true });
            });
      const ok = await Promise.race([
        Promise.all([document.fonts.ready, ...imgs.map(waitImg), ...vids.map(waitVid)]).then(() => true),
        new Promise((r) => setTimeout(() => r(false), timeout)),
      ]);
      return ok ? null : imgs.filter((i) => !i.complete).map((i) => i.currentSrc || i.getAttribute('src'));
    }, timeout)
    .then((pending) => pending && log.push(`[scenario-note] visual-ready timeout, pending: ${pending.join(' ')}`))
    .catch(() => {});
}

/** Pauses every <video>; the visible ones are also seeked to a fixed time (clamped to their duration) so the
 *  painted frame is reproducible. Hidden videos (e.g. the trailer before its dialog opens) are only paused. */
export async function freezeVideos({ page }, t = 4) {
  await page
    .evaluate(async (t) => {
      const vids = [...document.querySelectorAll('video')];
      const shown = (v) => {
        const r = v.getBoundingClientRect();
        return r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < innerHeight && getComputedStyle(v).visibility !== 'hidden';
      };
      await Promise.all(
        vids.map(
          (v) =>
            new Promise((res) => {
              try {
                v.pause();
              } catch {}
              if (!shown(v) || v.error || !v.currentSrc || !(v.readyState >= 1) || !isFinite(v.duration)) return res();
              const target = Math.min(t, Math.max(0, v.duration - 0.05));
              if (Math.abs(v.currentTime - target) < 0.01 && v.readyState >= 2) return res();
              const to = setTimeout(res, 10000);
              v.addEventListener('seeked', () => (clearTimeout(to), res()), { once: true });
              v.currentTime = target;
            }),
        ),
      );
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    }, t)
    .catch(() => {});
  await page.waitForTimeout(200);
}

/** Deterministic screenshot: assets ready, videos frozen, CSS animations disabled. */
export async function snap(ctx, label, { videoTime = 4 } = {}) {
  await waitVisualReady(ctx);
  await freezeVideos(ctx, videoTime);
  await ctx.shot(label, SHOT_OPTS);
}

/** Loads a route and waits for the intro animations (view fade-in 0.6 s + 0.8 s, hero reveals). */
export async function open(ctx, route, { settle = 3500 } = {}) {
  await ctx.page.goto(ctx.base + route, { waitUntil: 'load', timeout: 60000 });
  await waitVisualReady(ctx);
  await ctx.settle(settle);
}

export const scrollY = ({ page }) => page.evaluate(() => Math.round(window.scrollY));

/**
 * Scrolls down with Lenis wheel steps of STEP x viewport height until the page stops moving,
 * taking `${group}-NN` after every step that moved the page.
 */
export async function scrollThrough(ctx, { group = '02-scroll', max = 30, settle = SETTLE, step = STEP, shots = true } = {}) {
  const dy = Math.round(ctx.height * step);
  let n = 0;
  let native = false;
  for (let i = 1; i <= max; i++) {
    const before = await scrollY(ctx);
    if (native) await ctx.page.evaluate((dy) => window.scrollBy(0, dy), dy);
    else await ctx.wheel(dy);
    await ctx.settle(settle);
    if ((await scrollY(ctx)) === before) {
      // Fallback for pages where app.js crashed during start-up: Lenis still swallows wheel events but never
      // scrolls (e.g. /films/thehousewife: no footage items -> "reading 'clientWidth'" in the footage strip).
      const scrollable = await ctx.page.evaluate(() => document.documentElement.scrollHeight > innerHeight + 1);
      if (i === 1 && !native && before === 0 && scrollable) {
        ctx.log.push('[scenario-note] wheel does not scroll this page (app.js start-up failed?): native window.scrollBy fallback');
        native = true;
        i--;
        continue;
      }
      break;
    }
    n++;
    if (shots) await snap(ctx, `${group}-${String(i).padStart(2, '0')}`);
  }
  return n;
}

/** Bounding box of the first *visible* element matching selector (index-th among visible ones), or null. */
export async function visibleBox({ page }, selector, index = 0) {
  return page.evaluate(
    ([selector, index]) => {
      const els = [...document.querySelectorAll(selector)].filter((el) => {
        const r = el.getBoundingClientRect();
        const cs = getComputedStyle(el);
        return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none';
      });
      const el = els[index];
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { x: r.x, y: r.y, width: r.width, height: r.height };
    },
    [selector, index],
  );
}

/** Brings an element to the vertical centre of the viewport using Lenis wheel steps (never window.scrollTo). */
export async function bringIntoView(ctx, selector, { index = 0, settle = SETTLE, margin = 60 } = {}) {
  for (let attempt = 0; attempt < 3; attempt++) {
    const box = await visibleBox(ctx, selector, index);
    if (!box) return null;
    if (box.y >= margin && box.y + box.height <= ctx.height - margin) return box;
    const dy = Math.round(box.y + box.height / 2 - ctx.height / 2);
    if (Math.abs(dy) < 4) return box;
    const before = await scrollY(ctx);
    await ctx.wheel(dy);
    await ctx.settle(settle);
    if ((await scrollY(ctx)) === before) break; // clamped at top/bottom
  }
  return visibleBox(ctx, selector, index);
}

/** Moves the mouse onto an element (brought into view first) and takes a shot once the hover has settled. */
export async function hoverShot(ctx, label, selector, { index = 0, wait = 900, dx = 0.5, dy = 0.5 } = {}) {
  const box = await bringIntoView(ctx, selector, { index });
  if (!box) {
    ctx.log.push(`[scenario-note] ${label}: no visible element for ${selector}`);
    return false;
  }
  await ctx.page.mouse.move(box.x + box.width * dx, box.y + box.height * dy, { steps: 4 });
  await ctx.settle(wait);
  await snap(ctx, label);
  return true;
}

/** Moves the pointer to a neutral spot (top-right corner area of the viewport, outside the nav) without scrolling. */
export async function parkMouse(ctx) {
  await ctx.page.mouse.move(ctx.width - 2, Math.round(ctx.height / 2));
}

/** Footer: sitemap links, contact rows, legal links and the newsletter field (focused and typed, never submitted). */
export async function footerStates(ctx, prefix = '04', { newsletter = true } = {}) {
  let k = 0;
  const id = () => `${prefix}-${String.fromCharCode(97 + k++)}`;
  if (!ctx.mobile) {
    await hoverShot(ctx, `${id()}-hover-sitemap-work`, 'footer.footer .ft-sitemap-lk[href="/work"]');
    await hoverShot(ctx, `${id()}-hover-contact-row`, 'footer.footer .ft-contact-li-it');
    await hoverShot(ctx, `${id()}-hover-legal-link`, 'footer.footer .ft-small-lk');
  }
  if (newsletter && (await visibleBox(ctx, 'footer.footer input.ft-newsletter-input'))) {
    await bringIntoView(ctx, 'footer.footer input.ft-newsletter-input');
    await ctx.page.locator('footer.footer input.ft-newsletter-input').first().click();
    await ctx.settle(700);
    await snap(ctx, `${id()}-newsletter-focus`);
    await ctx.page.keyboard.type('name@example.com', { delay: 20 }); // typed only: never press Enter / submit
    await ctx.settle(500);
    await snap(ctx, `${id()}-newsletter-typed`);
  }
}

const isShown = (ctx, selector) =>
  ctx.page.evaluate((s) => {
    const el = document.querySelector(s);
    if (!el) return false;
    const cs = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    return cs.display !== 'none' && cs.visibility !== 'hidden' && +cs.opacity > 0 && r.width > 0 && r.height > 0;
  }, selector);

/**
 * Home entry: preloader video -> ENTER (shown after 3.5 s) -> tutorial -> CLOSE.
 * When the rotate notice covers the page the clicks are dispatched on the elements instead of the pointer.
 */
export async function enterHome(ctx, { shots = false, prefix = '00' } = {}) {
  const { page } = ctx;
  await page.goto(ctx.base + '/', { waitUntil: 'load', timeout: 60000 });
  await page
    .waitForFunction(
      () => {
        const b = document.querySelector('[data-preloader="btn"]');
        return b && getComputedStyle(b).visibility !== 'hidden' && +getComputedStyle(b).opacity >= 0.99;
      },
      null,
      { timeout: 20000 },
    )
    .catch(() => ctx.log.push('[scenario-note] preloader button never became visible'));
  await ctx.settle(600);
  const covered = await isShown(ctx, '.div-block-44');
  if (shots) await snap(ctx, `${prefix}-a-preloader`, { videoTime: 3 });
  const enterSel = (await isShown(ctx, '.preloader-btn-w .explore-btn-w.desktop'))
    ? '.preloader-btn-w .explore-btn-w.desktop'
    : '.preloader-btn-w .explore-btn-w.mobile';
  if (covered) await page.locator(enterSel).first().dispatchEvent('click');
  else await page.locator(enterSel).first().click({ timeout: 5000 }).catch(() => page.locator(enterSel).first().dispatchEvent('click'));
  // tutorial (removed by app.js when display:none, e.g. on mobile)
  await page
    .waitForFunction(() => !document.querySelector('[data-preloader="w"]'), null, { timeout: 5000 })
    .catch(() => ctx.log.push('[scenario-note] preloader was not removed after ENTER'));
  await ctx.settle(2500);
  if (await page.$('[data-tutorial="w"]')) {
    if (shots) await snap(ctx, `${prefix}-b-tutorial`, { videoTime: 2 });
    const close = page.locator('[data-tutorial="close"]').first();
    if (covered || !(await isShown(ctx, '[data-tutorial="close"]'))) await close.dispatchEvent('click');
    else await close.click({ timeout: 5000 }).catch(() => close.dispatchEvent('click'));
    await page
      .waitForFunction(() => !document.querySelector('[data-tutorial="w"]'), null, { timeout: 8000 })
      .catch(() => ctx.log.push('[scenario-note] tutorial still present after CLOSE'));
  }
  await ctx.settle(3000); // the home roll eases into place after the preloader/tutorial are gone
}

// ---------------------------------------------------------------------------------------------------------------

/** Generic content page: settled hero, Lenis scroll-through to the footer, page hovers, footer states. */
function contentPage(route, { hovers = [], newsletter = true, footer = true } = {}) {
  return scenario({
    async run(ctx) {
      await open(ctx, route);
      await snap(ctx, '01-settled');
      await scrollThrough(ctx, { group: '02-scroll' });
      if (!ctx.mobile) {
        let k = 0;
        for (const [name, selector, opts] of hovers) {
          await hoverShot(ctx, `03-${String.fromCharCode(97 + k++)}-hover-${name}`, selector, opts);
        }
      }
      if (footer) {
        await ctx.wheel(ctx.height * 6); // back to the very bottom (footer fully revealed)
        await ctx.settle(SETTLE);
        await footerStates(ctx, '04', { newsletter });
      }
    },
  });
}

export default {
  'page-about': contentPage('/about', {
    hovers: [
      ['hero-arrow', 'header.about-hero a.arrow-link-w'],
      ['explore-white', '.cta-comp-w button.explore-btn-w'],
    ],
  }),
  'page-contact': scenario({
    async run(ctx) {
      await open(ctx, '/contact');
      await snap(ctx, '01-settled');
      await scrollThrough(ctx, { group: '02-scroll' });
      if (!ctx.mobile) {
        await hoverShot(ctx, '03-a-hover-row-mail', '.contact-li-w .div-block-23', { index: 0 });
        await hoverShot(ctx, '03-b-hover-row-phone', '.contact-li-w .div-block-23', { index: 1 });
        // the 3rd row (address, a plain div) is hidden on desktop layouts
        await hoverShot(ctx, '03-c-hover-heading', '.contact-main-he-w .contact-h-of', { index: 1 });
      }
    },
  }),
  'page-cookies': contentPage('/cookies'),
  'page-terms': contentPage('/terms'),
  'page-privacy': contentPage('/privacy'),
  'page-404': scenario({
    async run(ctx) {
      await open(ctx, '/404', { settle: 4500 }); // 404 digits roll in with delays .3/.4/.5 s
      await snap(ctx, '01-settled');
      await scrollThrough(ctx, { group: '02-scroll' });
      if (!ctx.mobile) {
        await hoverShot(ctx, '03-a-hover-go-back', '._404 button.explore-btn-w');
        await hoverShot(ctx, '03-b-hover-social', 'footer.footer .footer-social-icon-w');
        await hoverShot(ctx, '03-c-hover-legal-link', 'footer.footer .ft-small-lk');
      }
    },
  }),
  // Webflow shows .div-block-44 ("Rotate your device") only for 480px <= width <= 767px, so 844x390
  // (iPhone 12-15 landscape) does NOT show it; 667x375 (iPhone SE landscape) does. Both are captured.
  'rotate-notice': scenario({
    viewports: ['844x390', '667x375'],
    prep: { phone: true, landscape: true },
    async run(ctx) {
      await enterHome(ctx, { shots: true, prefix: '01' });
      await snap(ctx, '01-c-home');
      await open(ctx, '/about');
      await snap(ctx, '02-about');
    },
  }),
};
