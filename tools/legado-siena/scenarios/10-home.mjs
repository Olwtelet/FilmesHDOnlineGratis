// Home page scenarios (+ the deterministic "kit" shared by 20-nav.mjs and 30-work.mjs).
//
// Determinism strategy (so that two identical sites diff at ~0%):
//  - Playwright fake clock, paused: timers, rAF, Date and performance.now only advance when the
//    scenario calls k.frames(ms) / k.at(sec). GSAP, Lenis, the roll/slider lerps and the WebGL
//    time uniform ($.time += .1 per frame) are therefore frame-exact, whatever the CPU load.
//  - Network never runs "during" fake time: k.frames() steps one frame at a time and, whenever the
//    page started a request in that frame, waits in REAL time (k.idle) for the network to settle
//    before the next frame. A slow CDN (live) and a local server (mirror/replica) therefore reach
//    the same state at the same fake time (e.g. LOADED_WEBGL gating the /work and / intros).
//  - Input is synchronised: after each synthetic mouse/wheel/touch/key event the kit waits until
//    the page has actually dispatched it (counters installed by an init script) before advancing
//    the clock, because the bundle throttles input on Date.now and passive/rAF-aligned events are
//    otherwise delivered at a random point of the fake timeline.
//  - Before every screenshot (k.shot): CSS transitions are finished, infinite CSS animations are
//    pinned at t=0, every <video> with data is paused and seeked to a fixed time.
//  - The new document's fake clock is snapped onto the 16-tick rAF grid after each k.goto() and
//    k.frames() only advances whole frames (otherwise frame counts depend on the clock phase).
//  - app.js is held (route) until every declared webfont is loaded: the bundle freezes SplitText
//    line breaks when it runs and the fonts use font-display:swap (titles wrapped differently
//    depending on who won the race).
//  - Math.random is seeded with one stream per call site; analytics hosts are stubbed (204);
//    viewports < 768px get an Android UA (the bundle's B.isMobile is UA-sniffed) and touch input.
//  - Before the screenshot the WebGL queue is drained (gl.finish) so a loaded machine cannot show a
//    stale canvas frame.
//  - KIT_DEBUG=1 logs the input events and network-triggered pauses into console.txt; k.note()
//    logs page state incl. the raw lerp position and the Math.random call count.
// Measured: live vs mirror 229/229 states <= 0.0002% diff, two live runs 0.000% (see report in
// reference/captures/compare/live-vs-mirror-a/).
// Real time per fake second is roughly 1:1 (PACE), so recorded clips still show natural motion.
//
// Kit usage: const k = await kit(ctx); await k.goto('/'); await k.frames(500); await k.shot('01-x');

const ANDROID_UA =
  'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36';
const BLOCK = /google-analytics\.com|googletagmanager\.com|doubleclick\.net/;
const CHUNK = 16; // fake ms per clock step (one rAF frame)
const PACE = 10; // real ms slept per step (observers/compositor get a turn; clips stay watchable)
const INPUTS = ['mousemove', 'mousedown', 'mouseup', 'click', 'wheel', 'touchstart', 'touchmove', 'touchend', 'keydown', 'keyup'];
const COUNT_INPUT = `(() => {
  const c = (window.__kitIn = {});
  for (const t of ${JSON.stringify(INPUTS)})
    addEventListener(t, (e) => {
      c[t] = (c[t] || 0) + 1;
      if (window.__kitDbg) window.__kitDbg.push([t, e.clientX | 0, e.clientY | 0, Date.now() % 100000]);
    }, { capture: true, passive: true });
  if (${!!process.env.KIT_DEBUG}) window.__kitDbg = [];
})();`;

// One seeded stream PER CALL SITE (caller line:col): extra calls from one consumer (e.g. jQuery/Sizzle
// "dirruns", whose count differs because the localized pages have no GA <script> tags) must not shift
// the values seen by another consumer (GSAP stagger from:"random" shuffles of the title rollovers).
const SEED_RANDOM = `(() => {
  const streams = new Map();
  const stream = (seed) => {
    let s = seed | 0;
    return () => {
      s = (s + 0x6d2b79f5) | 0;
      let t = Math.imul(s ^ (s >>> 15), 1 | s);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };
  const hash = (str) => {
    let h = 0x2f6b9d3a;
    for (let i = 0; i < str.length; i++) h = Math.imul(h ^ str.charCodeAt(i), 0x5bd1e995) ^ (h >>> 13);
    return h;
  };
  window.__kitRnd = 0;
  Math.random = function () {
    window.__kitRnd++;
    const caller = (new Error().stack || '').split('\\n')[2] || '';
    const m = caller.match(/:(\\d+:\\d+)\\)?\\s*$/);
    const key = m ? m[1] : '?';
    let g = streams.get(key);
    if (!g) streams.set(key, (g = stream(hash(key))));
    return g();
  };
})();`;

export async function kit(ctx) {
  const { page, base, mobile, log } = ctx;
  const cdp = await page.context().newCDPSession(page);
  if (mobile) await cdp.send('Emulation.setUserAgentOverride', { userAgent: ANDROID_UA, platform: 'Linux armv8l' });
  await page.addInitScript(SEED_RANDOM);
  await page.addInitScript(COUNT_INPUT);
  await page.route(BLOCK, (r) => r.fulfill({ status: 204, body: '' })); // analytics never render; keep the console clean
  // The bundle splits titles into fixed lines (GSAP SplitText type:"lines") as soon as it runs, and the
  // webfonts use font-display:swap, so line breaks depend on whether the fonts won the race. Hold the
  // deferred app.js until every declared webfont is loaded (= a warm-cache visit), on every base.
  await page.route(/\/app\.js(\?.*)?$/, async (route) => {
    const resp = await route.fetch().catch(() => null);
    const t0 = Date.now();
    while (Date.now() - t0 < 15000) {
      const ready = await page
        .evaluate(() => {
          const faces = [...document.fonts].filter((f) => !/icons/i.test(f.family));
          faces.forEach((f) => f.status === 'unloaded' && f.load().catch(() => {}));
          return faces.length > 0 && faces.every((f) => f.status === 'loaded' || f.status === 'error');
        })
        .catch(() => false);
      if (ready) break;
      await page.waitForTimeout(25);
    }
    if (Date.now() - t0 >= 15000) log.push('[kit] fonts not ready before app.js');
    if (resp) await route.fulfill({ response: resp });
    else await route.continue();
  });
  const now = Date.now();
  await page.clock.install({ time: now });
  await page.clock.pauseAt(now + 1000);

  // in-flight request tracking (media streams and blocked hosts excluded)
  const inflight = new Map(); // request -> real start time
  let started = 0;
  const track = (r) => !BLOCK.test(r.url()) && !['media', 'websocket', 'eventsource'].includes(r.resourceType()) && !r.url().startsWith('data:');
  page.on('request', (r) => {
    if (!track(r)) return;
    inflight.set(r, Date.now());
    started++;
  });
  page.on('requestfinished', (r) => inflight.delete(r));
  page.on('requestfailed', (r) => inflight.delete(r));
  const inputCount = (t) => page.evaluate((t) => window.__kitIn?.[t] ?? 0, t).catch(() => 0);
  /** run `fn` (which dispatches input) and wait until the page has dispatched >= 1 `type` event */
  async function sync(type, fn) {
    const n0 = await inputCount(type);
    await fn();
    const t0 = Date.now();
    while (Date.now() - t0 < 2000) {
      if ((await inputCount(type)) > n0) return true;
      await page.waitForTimeout(4);
    }
    log.push(`[kit] ${type} not observed by the page`);
    return false;
  }
  // Taxi page fetches (prefetched on mouseenter, or fetched on click): pathname -> settled promise
  const taxi = new Map();
  page.on('request', (r) => {
    if (r.resourceType() !== 'fetch') return;
    let done;
    const p = new Promise((res) => (done = res));
    taxi.set(new URL(r.url()).pathname, p);
    r.response().then((resp) => (resp ? resp.finished() : null)).catch(() => {}).finally(done);
  });

  let fake = 0; // fake ms elapsed since k.goto()
  const k = {
    page,
    mobile,
    cdp,
    sync,
    get t() {
      return fake / 1000;
    },
    /** advance animation time by `ms` (fake clock), one frame at a time; any request started in a
     *  frame is completed (real time) before the next frame */
    async frames(ms) {
      // whole frames only: the fake clock fires rAF on multiples of 16 ticks, so partial chunks
      // would make the frame count depend on the clock phase
      const n = Math.max(1, Math.round(ms / CHUNK));
      for (let i = 0; i < n; i++) {
        const before = started;
        await page.clock.runFor(CHUNK);
        await page.waitForTimeout(PACE);
        if (started !== before || inflight.size) {
          if (process.env.KIT_DEBUG) log.push(`[dbg] t=${((fake + i * CHUNK) / 1000).toFixed(3)} net ${[...inflight.keys()].map((r) => r.url().slice(-60)).join(' ')}`);
          await k.idle({ quiet: 120, timeout: 15000 });
        }
      }
      fake += n * CHUNK;
    },
    /** advance fake time until `sec` seconds after the last k.goto() */
    async at(sec) {
      const d = Math.round(sec * 1000 - fake);
      if (d > 0) await k.frames(d);
    },
    /** wait (real time) until no tracked request is in flight, fonts are loaded and every image in the viewport is complete */
    async idle({ timeout = 20000, quiet = 300 } = {}) {
      const t0 = Date.now();
      let since = null;
      while (Date.now() - t0 < timeout) {
        const ok =
          inflight.size === 0 &&
          (await page
            .evaluate(() => {
              if (document.fonts && document.fonts.status !== 'loaded') return false;
              // lazy images are only awaited through the in-flight set (the browser may never start them)
              return [...document.images].every((i) => {
                if (i.complete || i.loading === 'lazy') return true;
                if (i.checkVisibility && !i.checkVisibility({ visibilityProperty: true })) return true;
                const r = i.getBoundingClientRect();
                return !(r.width && r.height && r.bottom > 0 && r.right > 0 && r.top < innerHeight && r.left < innerWidth);
              });
            })
            .catch(() => false));
        if (ok) {
          since ??= Date.now();
          if (Date.now() - since >= quiet) return true;
        } else since = null;
        await page.waitForTimeout(50);
      }
      log.push(`[idle-timeout] ${[...inflight.keys()].map((r) => r.url()).slice(0, 5).join(' ')}`);
      for (const [r, t] of inflight) if (Date.now() - t > 30000) inflight.delete(r); // never block forever on a hung request
      return false;
    },
    async goto(path, { waitFor = 'load' } = {}) {
      fake = 0;
      await page.goto(base + path, { waitUntil: waitFor });
      // the new document's fake clock starts at 1-3 ticks (replay jitter): snap it onto the 16-tick
      // rAF grid so every later frames() call crosses exactly the same frame boundaries
      const p = Math.round(await page.evaluate(() => performance.now()));
      if (p % CHUNK) await page.clock.runFor(CHUNK - (p % CHUNK));
      await k.idle();
    },
    /** pause/seek videos, settle CSS, take the screenshot through ctx.shot, then resume */
    async shot(label, { videoTime = 1, idle = true } = {}) {
      if (idle) await k.idle({ quiet: 150, timeout: 15000 });
      // videos: wait for metadata on the ones that matter, then pause + seek to a fixed time
      const vt0 = Date.now();
      while (Date.now() - vt0 < 8000) {
        const waiting = await page.evaluate(() =>
          [...document.querySelectorAll('video')].filter((v) => {
            const r = v.getBoundingClientRect();
            const shown = r.width > 0 && r.bottom > 0 && r.top < innerHeight && getComputedStyle(v).display !== 'none';
            return shown && (v.autoplay || !v.paused) && v.readyState < 2 && v.networkState !== 3;
          }).length,
        );
        if (!waiting) break;
        await page.waitForTimeout(100);
      }
      await page.evaluate((vt) => {
        window.__kitResume = [];
        for (const v of document.querySelectorAll('video')) {
          if (v.readyState < 1) continue;
          if (!v.paused) window.__kitResume.push(v);
          v.pause();
          const dur = Number.isFinite(v.duration) ? v.duration : vt;
          const target = Math.max(0, Math.min(vt, dur - 0.04));
          if (Math.abs(v.currentTime - target) > 0.01) v.currentTime = target;
        }
      }, videoTime);
      const st0 = Date.now();
      while (Date.now() - st0 < 8000) {
        const seeking = await page.evaluate(() => [...document.querySelectorAll('video')].some((v) => v.readyState >= 1 && (v.seeking || v.readyState < 2)));
        if (!seeking) break;
        await page.waitForTimeout(50);
      }
      await k.frames(CHUNK); // let WebGL upload the seeked video frames
      await page.evaluate(() => {
        window.__kitAnims = [];
        for (const a of document.getAnimations()) {
          try {
            const end = a.effect?.getComputedTiming().endTime;
            if (end === Infinity) {
              a.pause();
              a.currentTime = 0;
              window.__kitAnims.push(a);
            } else a.finish();
          } catch {}
        }
      });
      // drain the (software) GPU queue so the screenshot cannot show a stale WebGL frame under load
      await page.evaluate(() => {
        const c = document.querySelector('[data-gl="c"] canvas');
        if (!c) return;
        const gl = c.getContext('webgl2') || c.getContext('webgl');
        gl?.finish?.();
      });
      await page.waitForTimeout(60); // compositor catches up
      await ctx.shot(label);
      await page.evaluate(() => {
        (window.__kitResume || []).forEach((v) => v.play().catch(() => {}));
        (window.__kitAnims || []).forEach((a) => a.play());
      });
    },
    /** center of the matching element that is visible; pick 'first' | 'center' (closest to viewport center) | index */
    async box(selector, pick = 'first') {
      const b = await page.evaluate(
        ([sel, pick]) => {
          const vis = [...document.querySelectorAll(sel)]
            .map((el) => ({ el, r: el.getBoundingClientRect() }))
            .filter(({ el, r }) => {
              if (!(r.width > 0 && r.height > 0 && r.bottom > 0 && r.right > 0 && r.top < innerHeight && r.left < innerWidth)) return false;
              const cs = getComputedStyle(el);
              return cs.visibility !== 'hidden' && cs.display !== 'none';
            });
          if (!vis.length) return null;
          let hit = vis[0];
          if (pick === 'center') {
            const d = ({ r }) => Math.hypot(r.left + r.width / 2 - innerWidth / 2, r.top + r.height / 2 - innerHeight / 2);
            hit = vis.reduce((a, b) => (d(b) < d(a) ? b : a));
          } else if (typeof pick === 'number') hit = vis[pick] ?? null;
          if (!hit) return null;
          const { r } = hit;
          const x = Math.max(1, Math.min(innerWidth - 2, r.left + r.width / 2));
          const y = Math.max(1, Math.min(innerHeight - 2, r.top + r.height / 2));
          return { x, y, w: r.width, h: r.height, href: hit.el.closest('a')?.getAttribute('href') ?? null };
        },
        [selector, pick],
      );
      if (!b) log.push(`[kit] no visible element for ${selector} (${pick})`);
      return b;
    },
    async hover(selector, pick) {
      const b = await k.box(selector, pick);
      if (b) await k.move(b.x, b.y);
      return b;
    },
    /** pointer move (several steps), synchronised with the page */
    async move(x, y, steps = 4) {
      await sync('mousemove', () => page.mouse.move(x, y, { steps }));
    },
    /** click (mouse) or tap (touch on mobile) the visible element */
    async click(selector, pick) {
      const b = await k.box(selector, pick);
      if (!b) return null;
      if (mobile) await sync('click', () => page.touchscreen.tap(b.x, b.y));
      else {
        await k.move(b.x, b.y);
        await sync('mousedown', () => page.mouse.down());
        await k.frames(CHUNK * 4);
        await sync('mouseup', () => page.mouse.up());
      }
      return b;
    },
    /** wheel events one fake frame apart (like a trackpad). NB: the bundle's virtual-scroll reads
     *  wheelDeltaY, which Chromium fixes at +-120 per event, so the event COUNT sets the distance. */
    async wheel(dy, { steps = 24, dx = 0, at, every = 16 } = {}) {
      const p = at ?? { x: ctx.width / 2, y: ctx.height / 2 };
      await k.move(p.x, p.y, 1);
      for (let i = 0; i < steps; i++) {
        await sync('wheel', () => page.mouse.wheel(dx / steps, dy / steps));
        await k.frames(every);
      }
    },
    /** mouse drag from a to b, one synchronised move every 2 frames; `mid` = callback while still pressed */
    async drag(a, b, { steps = 12, mid } = {}) {
      await k.move(a.x, a.y, 1);
      await sync('mousedown', () => page.mouse.down());
      await k.frames(CHUNK * 2);
      for (let i = 1; i <= steps; i++) {
        await sync('mousemove', () => page.mouse.move(a.x + ((b.x - a.x) * i) / steps, a.y + ((b.y - a.y) * i) / steps));
        await k.frames(CHUNK * 2);
      }
      if (mid) await mid();
      await sync('mouseup', () => page.mouse.up());
    },
    /** touch swipe through CDP (touchStart / touchMove* / touchEnd), each event awaited in the page */
    async swipe(a, b, { steps = 10 } = {}) {
      const touch = (type, touchPoints) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints });
      await sync('touchstart', () => touch('touchStart', [{ x: a.x, y: a.y }]));
      await k.frames(CHUNK * 2);
      for (let i = 1; i <= steps; i++) {
        const p = { x: a.x + ((b.x - a.x) * i) / steps, y: a.y + ((b.y - a.y) * i) / steps };
        await sync('touchmove', () => touch('touchMove', [p]));
        await k.frames(CHUNK * 2);
      }
      await sync('touchend', () => touch('touchEnd', []));
    },
    async key(code) {
      await sync('keyup', () => page.keyboard.press(code));
      await k.frames(CHUNK);
    },
    /** Taxi navigation: click, then wait (real time) for the fetched page before advancing fake time */
    async navClick(selector, pick) {
      const b = await k.box(selector, pick);
      if (!b) return null;
      await k.click(selector, pick);
      // Taxi fetches the page on mouseenter (prefetch) or on click; wait for it in real time
      const t0 = Date.now();
      while (!taxi.has(b.href) && Date.now() - t0 < 3000) await page.waitForTimeout(50);
      if (taxi.has(b.href)) await Promise.race([taxi.get(b.href), page.waitForTimeout(20000)]);
      else log.push(`[kit] no Taxi fetch seen for ${b.href}`);
      await page.waitForTimeout(150);
      log.push(`[kit] navigated via ${selector} -> ${b.href}`);
      return b;
    },
    /** state probe written to console.txt */
    async note(label) {
      if (process.env.KIT_DEBUG) log.push(`[dbg] ${label} ${await page.evaluate(() => JSON.stringify((window.__kitDbg || []).splice(0)))}`);
      const s = await page.evaluate(() => ({
        page: document.querySelector('[data-page]')?.dataset.page,
        film: document.querySelector('.menu-film.current a')?.getAttribute('href') ?? null,
        slider: document.querySelector('[data-slider="link"]')?.pathname ?? null,
        moving: document.body.classList.contains('moving'),
        open: [...document.querySelectorAll('.menu-w input')].filter((i) => i.checked).map((i) => i.id),
        panels: [...document.querySelectorAll('.menu-w .open')].map((e) => e.dataset.menu),
        // raw lerp state (first roll / slider item) to spot timeline divergence between bases
        pos: (document.querySelector('[data-roll="item"], [data-slider="item"]')?.style.transform || '').replace(/\s+/g, ''),
        rnd: window.__kitRnd,
      }));
      log.push(`[note] t=${k.t.toFixed(2)} ${label} ${JSON.stringify(s)}`);
    },
  };
  return k;
}

const ENTER = '[data-preloader="btn"] .explore-btn-w';

/** Full home entry: preloader -> ENTER -> tutorial -> close -> settled. Returns the kit. */
export async function enterHome(ctx, k) {
  k ??= await kit(ctx);
  await k.goto('/');
  await k.at(4.2);
  await k.idle();
  await k.click(ENTER);
  await k.frames(2800);
  if (await k.box('[data-tutorial="close"] .explore-btn-w')) {
    await k.click('[data-tutorial="close"] .explore-btn-w');
    await k.frames(2600);
  } else await k.frames(1800);
  await k.idle();
  await k.frames(800);
  return k;
}

const CUR_EXPLORE_DESKTOP = '[data-roll="item"] .roll-cont-col.reviews a.explore-w';
const CUR_EXPLORE_MOBILE = '[data-roll="item"] a.explore-w.mobile';

export default {
  // Preloader + intro video, ENTER hover/click, tutorial, tutorial close, settled home.
  // (the matching motion clip is 'home-intro-clip', kept separate so it stays < 20 s)
  'home-intro': {
    async run(ctx) {
      const k = await kit(ctx);
      await k.goto('/');
      await k.at(0.5);
      await k.shot('01-t0.5', { videoTime: 0.5 });
      await k.at(1.5);
      await k.shot('02-t1.5', { videoTime: 1.5 });
      await k.at(3);
      await k.shot('03-t3', { videoTime: 3 });
      await k.at(5);
      await k.shot('04-t5', { videoTime: 5 });
      if (!ctx.mobile) {
        await k.hover(ENTER);
        await k.frames(800);
        await k.shot('05-enter-hover', { videoTime: 5 });
      }
      await k.idle();
      await k.click(ENTER);
      await k.note('enter clicked');
      await k.frames(300);
      await k.shot('06-click+0.3');
      await k.frames(700);
      await k.shot('07-click+1.0');
      await k.frames(1250);
      await k.shot('08-click+2.25');
      await k.frames(750);
      await k.shot('09-tutorial', { videoTime: 2 });
      await k.frames(5000);
      await k.shot('10-tutorial-text2', { videoTime: 4 });
      if (await k.box('[data-tutorial="close"] .explore-btn-w')) {
        if (!ctx.mobile) {
          await k.hover('[data-tutorial="close"] .explore-btn-w');
          await k.frames(600);
          await k.shot('11-close-hover', { videoTime: 4 });
        }
        await k.click('[data-tutorial="close"] .explore-btn-w');
        await k.frames(600);
        await k.shot('12-close+0.6', { videoTime: 4 });
        await k.frames(2000);
      }
      if (!ctx.mobile) await k.move(ctx.width / 2, ctx.height * 0.62);
      await k.frames(1000);
      await k.note('settled');
      await k.shot('13-settled');
    },
  },

  // Short video of the same intro (preloader -> ENTER -> tutorial -> close), few shots.
  'home-intro-clip': {
    video: true,
    viewports: ['1440x900', '390x844'], // at 1920 the software-WebGL clip runs > 20 s
    async run(ctx) {
      const k = await kit(ctx);
      await k.goto('/');
      await k.at(3);
      await k.shot('01-t3', { videoTime: 3 });
      await k.at(4.2);
      if (!ctx.mobile) {
        await k.hover(ENTER);
        await k.frames(500);
      }
      await k.click(ENTER);
      await k.frames(3000);
      await k.shot('02-tutorial', { videoTime: 1 });
      if (await k.box('[data-tutorial="close"] .explore-btn-w')) {
        await k.click('[data-tutorial="close"] .explore-btn-w');
        await k.frames(2200);
      }
      await k.shot('03-settled');
    },
  },

  // Navigation between the film cards: wheel, drag, keyboard, hover states, PREV/NEXT hitboxes, swipe.
  'home-roll': {
    async run(ctx) {
      const k = await enterHome(ctx);
      const { page, width: W, height: H } = ctx;
      if (!ctx.mobile) await k.move(W / 2, H * 0.6);
      await k.frames(600);
      await k.note('settled');
      await k.shot('01-settled');
      if (ctx.mobile) {
        await k.swipe({ x: W / 2, y: H * 0.7 }, { x: W / 2, y: H * 0.35 });
        await k.frames(250);
        await k.shot('02-swiping');
        await k.frames(1800);
        await k.note('swipe up');
        await k.shot('03-swipe-up');
        await k.swipe({ x: W / 2, y: H * 0.35 }, { x: W / 2, y: H * 0.7 });
        await k.frames(2000);
        await k.note('swipe down');
        await k.shot('04-swipe-down');
        await k.swipe({ x: W / 2, y: H * 0.35 }, { x: W / 2, y: H * 0.7 });
        await k.frames(2000);
        await k.note('swipe down 2');
        await k.shot('05-swipe-down-2');
        return;
      }
      // wheel down / up
      await k.wheel(2400);
      await k.frames(250);
      await k.shot('02-wheel-down-moving');
      await k.frames(1800);
      await k.note('wheel down');
      await k.shot('03-wheel-down');
      await k.wheel(-2400);
      await k.frames(2000);
      await k.wheel(-2400);
      await k.frames(2000);
      await k.note('wheel up x2');
      await k.shot('04-wheel-up');
      // drag (vertical, the roll follows clientY)
      await k.note('before drag');
      await k.drag({ x: W / 2, y: H * 0.65 }, { x: W / 2, y: H * 0.65 - 220 }, {
        mid: async () => {
          await k.frames(100);
          await k.note('dragging');
          await k.shot('05-dragging');
        },
      });
      await k.frames(2000);
      await k.note('drag up');
      await k.shot('06-drag-up');
      await k.drag({ x: W / 2, y: H * 0.35 }, { x: W / 2, y: H * 0.35 + 220 });
      await k.frames(2000);
      await k.note('drag down');
      await k.shot('07-drag-down');
      // keyboard
      await k.key('ArrowDown');
      await k.frames(1800);
      await k.note('ArrowDown');
      await k.shot('08-key-down');
      await k.key('ArrowUp');
      await k.frames(400);
      await k.key('ArrowUp');
      await k.frames(1800);
      await k.note('ArrowUp x2');
      await k.shot('09-key-up');
      // hovers: card (custom cursor), Explore button, reviews
      await k.move(W * 0.45, H * 0.45, 6);
      await k.frames(900);
      await k.shot('10-hover-card');
      await k.hover(CUR_EXPLORE_DESKTOP, 'center');
      await k.frames(900);
      await k.shot('11-hover-explore');
      await k.hover('[data-roll="item"] .roll-cont-col.reviews [data-roll="reviews"] h3', 'center');
      await k.frames(900);
      await k.shot('12-hover-reviews');
      // PREV / NEXT hitboxes and cursor states
      await k.hover('[data-hitbox="PREV"]');
      await k.frames(900);
      await k.shot('13-hover-prev');
      await k.click('[data-hitbox="PREV"]');
      await k.frames(1800);
      await k.note('click PREV');
      await k.shot('14-click-prev');
      await k.hover('[data-hitbox="NEXT"]');
      await k.frames(900);
      await k.shot('15-hover-next');
      await k.sync('mousedown', () => page.mouse.down());
      await k.frames(200);
      await k.shot('16-next-pressed');
      await k.sync('mouseup', () => page.mouse.up());
      await k.frames(1800);
      await k.note('click NEXT');
      await k.shot('17-click-next');
    },
  },

  // Explore on the current home card -> film page (Taxi transition), mid-transition frames + settled.
  'home-explore': {
    async run(ctx) {
      const k = await enterHome(ctx);
      await k.shot('01-settled');
      const sel = ctx.mobile ? CUR_EXPLORE_MOBILE : CUR_EXPLORE_DESKTOP;
      if (!ctx.mobile) {
        await k.hover(sel, 'center');
        await k.frames(700);
        await k.shot('02-explore-hover');
      }
      await k.navClick(sel, 'center');
      await k.frames(100);
      await k.shot('03-leave+0.1');
      await k.frames(500);
      await k.shot('04-leave+0.6');
      await k.frames(500);
      await k.shot('05-enter+1.1');
      await k.frames(400);
      await k.shot('06-enter+1.5');
      await k.frames(3000);
      await k.note('film settled');
      await k.shot('07-film-settled');
    },
  },
};
