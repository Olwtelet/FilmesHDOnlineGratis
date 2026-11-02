// Phone / touch interactions not covered by the baseline scenarios (adversarial lens "interactions-touch").
// Viewports: 390x844 and 360x740; the runner gives them isMobile/hasTouch and the kit an Android UA.
// Everything runs on the deterministic kit from 10-home.mjs (paused fake clock, seeded PRNG, synced input).
//
//  - t61-menu-*      mobile main menu on /, /work, /about, /contact, /films/savoy: open (mid + settled),
//                    close by tapping outside (.menu-close-trig) and by the X, reopen, tap a link inside it
//                    (Taxi transition frames), browser Back (popstate transition frames). The film page also
//                    checks that a touch scroll with the menu open closes it (Hn unchecks panels on scroll).
//  - t61-home-explore   / : swipe to the next film, tap its mobile EXPLORE, transition, Back.
//  - t61-work-explore   /work : swipe, Footage on, swipe in Footage, Poster, tap EXPLORE (.btn-yes-mb), Back.
//  - t61-film-player    /films/savoy : touch-scroll to the trailer, tap it open, tap the video (dialog),
//                       the play/pause control, SOUND, the X, reopen + tap the darkened area, then touch-scroll
//                       to the next-project card, tap it (transition to moon), Back.
//  - t61-film-scroll    /films/moon-in-the-12th-house : native touch scroll-through (credits, gallery,
//                       reviews, prizes, next project, footer) with the reviews slider swiped and its
//                       prev/next buttons tapped, then the footer HOME link (home reached through Taxi), Back.
//  - t61-footer         /terms : footer sitemap link + legal link taps, Back.
//  - t61-404            /404 : GO BACK tap (Taxi to /), Back.
//  - t61-rotate         portrait -> landscape -> portrait inside one document on /, /work, /about and a
//                       film page (390x844 -> 844x390: tablet layout, no notice; 360x740 -> 740x360: the
//                       "Rotate your device" notice, 480-767 px).
//
// Touch scrolling: native scroll (Lenis smoothTouch:false) driven by CDP touch events; the finger is held
// still for ~160 ms real time before touchend so no fling starts (fling velocity would depend on real time).
// Chrome's touch slop (15 px) is added to the finger travel, and the remaining distance is re-measured after
// every swipe, so both bases end on the same scrollY whenever their layouts match.
// Shots never submit anything; no external link is tapped.
//
// Measured 2026-10-29 (reference/captures/compare/adv-interactions-touch*): LIVE vs REPLICA 431 states, 428
// identical. Known harness artefact: t61-rotate@390x844 '22-film-portrait-after-menu' (logo colour after
// landscape -> portrait, set by the [data-color] IntersectionObservers) depends on the compare.mjs SLOT, not the
// site: slot A renders the logo white, slot B and a solo run black (LIVE vs LIVE and REPLICA-in-A vs LIVE-in-B
// show the same 0.3236 % box). The /work "back+2.0" frame is occasionally sub-pixel off on local bases (also
// LIVE vs MIRROR, not reproducible on rerun).
import { kit, enterHome } from './10-home.mjs';

const VIEWPORTS = ['390x844', '360x740'];
const MAIN = '[data-menu="maintrigger"]';
const LINK = (href) => `[data-menu="mainpanel"] a.menu-link[href="${href}"]`;
const HOME_EXPLORE = '[data-roll="item"] a.explore-w.mobile';
const WORK_TOGGLE = '[data-work="toggle"] button.work-toggle:not(.inactive)';
const WORK_EXPLORE = '[data-slider="link"] .btn-yes-mb .explore-btn-w';
const TRIGGER = '[data-videoplayer="trigger"]';
const SLOP = 15; // Chrome touch slop (px of finger travel before scrolling starts)

const scrollY = (page) => page.evaluate(() => Math.round(window.scrollY)).catch(() => -1);

/** state line in console.txt (kit note + path + scroll + player state) */
async function state(k, ctx, label) {
  await k.note(label);
  const s = await ctx.page
    .evaluate(() => {
      const v = document.querySelector('video[data-videoplayer="video"]');
      return {
        path: location.pathname,
        y: Math.round(scrollY),
        vw: innerWidth + 'x' + innerHeight,
        views: document.querySelectorAll('[data-taxi-view]').length,
        player: v ? { paused: v.paused, muted: v.muted, rs: v.readyState, play: document.querySelector('[data-vid="play"]')?.className, sound: document.querySelector('[data-vid="sound"]')?.textContent } : null,
      };
    })
    .catch((e) => ({ err: e.message }));
  ctx.log.push(`[t61] ${label} ${JSON.stringify(s)}`);
}

/** tap at a point (touch), synchronised on the page's click */
async function tapAt(k, ctx, x, y) {
  await k.sync('click', () => ctx.page.touchscreen.tap(Math.round(x), Math.round(y)));
}

/** touch drag a -> b through CDP; `hold` keeps the finger still before lifting it (no fling) */
async function tswipe(k, ctx, a, b, { steps = 10, hold = true, mid } = {}) {
  const touch = (type, touchPoints) => k.cdp.send('Input.dispatchTouchEvent', { type, touchPoints });
  await k.sync('touchstart', () => touch('touchStart', [{ x: a.x, y: a.y }]));
  await k.frames(32);
  for (let i = 1; i <= steps; i++) {
    await touch('touchMove', [{ x: a.x + ((b.x - a.x) * i) / steps, y: a.y + ((b.y - a.y) * i) / steps }]);
    await k.frames(32);
  }
  if (mid) await mid();
  if (hold)
    for (let i = 0; i < 4; i++) {
      await touch('touchMove', [{ x: b.x, y: b.y }]);
      await ctx.page.waitForTimeout(40);
    }
  await k.sync('touchend', () => touch('touchEnd', []));
  await k.frames(32);
}

/** native touch scroll by dy px (dy > 0 = towards the bottom); returns the distance actually scrolled */
async function tscroll(k, ctx, dy) {
  const { page } = ctx;
  const { width: W, height: H } = page.viewportSize();
  let left = Math.round(dy);
  for (let guard = 0; guard < 40 && Math.abs(left) > 3; guard++) {
    const dir = Math.sign(left);
    const want = Math.min(Math.abs(left), Math.round(H * 0.55));
    // start the finger where no touch-handling widget (the sliders call preventDefault on touchstart) sits
    const y0 = await page.evaluate(
      ([dir, W, H]) => {
        const bad = (y) => {
          const el = document.elementFromPoint(W / 2, y);
          return !el || !!el.closest('[data-reviews="wrapper"],[data-slider="wrapper"],[data-roll="wrapper"]');
        };
        const c = [0.9, 0.84, 0.78, 0.72, 0.66, 0.6, 0.54, 0.48, 0.42, 0.36, 0.3].map((f) => (dir > 0 ? f : 1 - f));
        for (const f of c) if (!bad(Math.round(H * f))) return Math.round(H * f);
        return Math.round(H * c[0]);
      },
      [dir, W, H],
    );
    const travel = Math.min(want + SLOP, dir > 0 ? y0 - 8 : H - y0 - 8);
    const before = await scrollY(page);
    await tswipe(k, ctx, { x: Math.round(W / 2), y: y0 }, { x: Math.round(W / 2), y: y0 - dir * travel });
    const moved = (await scrollY(page)) - before;
    if (!moved) break;
    left -= moved;
  }
  return Math.round(dy) - left;
}

/** viewport-relative top of the first visible match (null if none) */
const topOf = (page, sel) =>
  page.evaluate((sel) => {
    const el = [...document.querySelectorAll(sel)].find((e) => {
      const r = e.getBoundingClientRect();
      const cs = getComputedStyle(e);
      return r.width > 0 && r.height > 0 && cs.display !== 'none' && cs.visibility !== 'hidden';
    });
    return el ? Math.round(el.getBoundingClientRect().top) : null;
  }, sel);

/** touch-scroll until the element's top sits at `at` px from the viewport top */
async function bringTo(k, ctx, sel, at) {
  const t = await topOf(ctx.page, sel);
  if (t === null) {
    ctx.log.push(`[t61] bringTo: no visible ${sel}`);
    return false;
  }
  await tscroll(k, ctx, t - at);
  return true;
}

/** tap a link-ish element and wait (real time) for Taxi's fetch before the fake clock moves on */
async function navTap(k, ctx, sel, pick) {
  const b = await k.click(sel, pick);
  if (!b) throw new Error(`navTap: nothing visible for ${sel}`);
  await ctx.page.waitForTimeout(120);
  await k.idle({ quiet: 150, timeout: 20000 });
  ctx.log.push(`[t61] tapped ${sel} -> ${b.href}`);
  return b;
}

/** browser Back (Taxi popstate), then wait for any fetch it starts */
async function back(k, ctx) {
  await ctx.page.goBack({ waitUntil: 'commit', timeout: 15000 }).catch((e) => ctx.log.push(`[t61] goBack: ${e.message}`));
  await ctx.page.waitForTimeout(120);
  await k.idle({ quiet: 150, timeout: 20000 });
}

/** transition frames after a navigation tap / Back; returns the next shot number */
async function transition(k, ctx, n, tag, settle) {
  const id = () => String(n++).padStart(2, '0');
  await k.frames(100);
  await k.shot(`${id()}-${tag}+0.1`);
  await k.frames(500);
  await k.shot(`${id()}-${tag}+0.6`);
  await k.frames(800);
  await k.shot(`${id()}-${tag}+1.4`);
  await k.frames(600);
  await k.shot(`${id()}-${tag}+2.0`);
  await k.frames(settle);
  await state(k, ctx, `${tag} settled`);
  await k.shot(`${id()}-${tag}-settled`);
  return n;
}

/** Menu open/close/reopen + tap a link inside it + Back, on one route. */
function menuScenario(route, linkSel, { settle = 3, arrive = 3000, home = false, scrollClose = false } = {}) {
  return {
    viewports: VIEWPORTS,
    async run(ctx) {
      const { width: W, height: H } = ctx;
      const k = home ? await enterHome(ctx) : await kit(ctx);
      if (!home) {
        await k.goto(route);
        await k.at(settle);
      }
      await state(k, ctx, 'page');
      await k.shot('01-page');
      await k.click(MAIN);
      await k.frames(400);
      await k.shot('02-menu-opening');
      await k.frames(1000);
      await state(k, ctx, 'menu open');
      await k.shot('03-menu-open');
      // tap outside the panel: the full-screen .menu-close-trig closes every panel
      await tapAt(k, ctx, W / 2, H * 0.92);
      await k.frames(400);
      await k.shot('04-outside-closing');
      await k.frames(1000);
      await state(k, ctx, 'closed by outside tap');
      await k.shot('05-outside-closed');
      await k.click(MAIN);
      await k.frames(1400);
      await k.click(MAIN); // the burger, now an X
      await k.frames(400);
      await k.shot('06-x-closing');
      await k.frames(1000);
      await state(k, ctx, 'closed by X');
      await k.shot('07-x-closed');
      let n = 8;
      if (scrollClose) {
        // touch scroll while the menu is open: Hn unchecks the panels on document scroll
        await k.click(MAIN);
        await k.frames(1400);
        await tscroll(k, ctx, Math.round(H * 0.4));
        await k.frames(400);
        await k.shot('08-scroll-while-open+0.4');
        await k.frames(2200);
        await state(k, ctx, 'after scroll with menu open');
        await k.shot('09-scroll-while-open+2.6');
        n = 10;
      }
      await k.click(MAIN);
      await k.frames(1400);
      await k.shot(`${String(n++).padStart(2, '0')}-menu-reopened`);
      await navTap(k, ctx, linkSel);
      n = await transition(k, ctx, n, 'link', arrive);
      await back(k, ctx);
      await transition(k, ctx, n, 'back', home ? 4000 : arrive);
    },
  };
}

const scenarios = {
  't61-menu-home': menuScenario('/', LINK('/about'), { home: true, arrive: 3000 }),
  't61-menu-work': menuScenario('/work', LINK('/contact'), { settle: 4.5, arrive: 3000 }),
  't61-menu-about': menuScenario('/about', LINK('/terms'), { settle: 3, arrive: 2500 }),
  't61-menu-contact': menuScenario('/contact', LINK('/privacy'), { settle: 3, arrive: 2500 }),
  't61-menu-film': menuScenario('/films/savoy', LINK('/work'), { settle: 3.5, arrive: 4500, scrollClose: true }),

  // Home: swipe to the next film and tap its EXPLORE; Back returns to the home roll.
  't61-home-explore': {
    viewports: VIEWPORTS,
    async run(ctx) {
      const { width: W, height: H } = ctx;
      const k = await enterHome(ctx);
      await state(k, ctx, 'home');
      await k.shot('01-home');
      await k.swipe({ x: W / 2, y: H * 0.7 }, { x: W / 2, y: H * 0.35 });
      await k.frames(2000);
      await state(k, ctx, 'swiped');
      await k.shot('02-swiped-next');
      await navTap(k, ctx, HOME_EXPLORE, 'center');
      const n = await transition(k, ctx, 3, 'explore', 3000);
      await back(k, ctx);
      await transition(k, ctx, n, 'back', 4000);
    },
  },

  // Work: swipe, Footage on/off, tap EXPLORE (.btn-yes-mb variant), Back.
  't61-work-explore': {
    viewports: VIEWPORTS,
    async run(ctx) {
      const { width: W, height: H } = ctx;
      const k = await kit(ctx);
      await k.goto('/work');
      await k.at(4.5);
      await state(k, ctx, 'work');
      await k.shot('01-work');
      await k.swipe({ x: W * 0.8, y: H * 0.5 }, { x: W * 0.2, y: H * 0.5 });
      await k.frames(2000);
      await state(k, ctx, 'swiped');
      await k.shot('02-swiped');
      await k.click(WORK_TOGGLE);
      await k.frames(2200);
      await state(k, ctx, 'footage');
      await k.shot('03-footage');
      await k.swipe({ x: W * 0.2, y: H * 0.5 }, { x: W * 0.8, y: H * 0.5 });
      await k.frames(1500);
      await k.shot('04-footage-swiped');
      ctx.log.push(`[t61] EXPLORE visible in footage mode: ${!!(await k.box(WORK_EXPLORE))}`);
      await k.click(WORK_TOGGLE);
      await k.frames(2200);
      await state(k, ctx, 'poster');
      await k.shot('05-poster');
      await navTap(k, ctx, WORK_EXPLORE);
      const n = await transition(k, ctx, 6, 'explore', 3000);
      await back(k, ctx);
      await transition(k, ctx, n, 'back', 4000);
    },
  },

  // Trailer player on a phone (taps) + next-project tap + Back.
  't61-film-player': {
    viewports: VIEWPORTS,
    async run(ctx) {
      const { page } = ctx;
      const k = await kit(ctx);
      await k.goto('/films/savoy');
      await k.at(3.5);
      const { height: H } = page.viewportSize();
      const tb = await page.evaluate((s) => document.querySelector(s).getBoundingClientRect().height, TRIGGER);
      await bringTo(k, ctx, TRIGGER, Math.round(H / 2 - tb / 2));
      await k.frames(1200);
      await state(k, ctx, 'trigger');
      await k.shot('01-trigger');
      await k.click(TRIGGER);
      await k.frames(400);
      await k.shot('02-opening', { videoTime: 0.2 });
      await k.frames(1400);
      await state(k, ctx, 'open');
      await k.shot('03-open', { videoTime: 1 });
      await k.click('video[data-videoplayer="video"]'); // dialog click = play/pause toggle
      await k.frames(600);
      await state(k, ctx, 'video tapped');
      await k.shot('04-video-tapped', { videoTime: 1 });
      await k.click('[data-vid="play"]');
      await k.frames(600);
      await state(k, ctx, 'play tapped');
      await k.shot('05-play-tapped', { videoTime: 1 });
      await k.click('[data-vid="sound"]');
      await k.frames(600);
      await state(k, ctx, 'sound tapped');
      await k.shot('06-sound-tapped', { videoTime: 1 });
      await k.click('[data-videoplayer="close"]');
      await k.frames(300);
      await k.shot('07-closing+0.3', { videoTime: 1 });
      await k.frames(1500);
      await state(k, ctx, 'closed');
      await k.shot('08-closed');
      await k.click(TRIGGER);
      await k.frames(1800);
      await k.shot('09-reopened', { videoTime: 1 });
      // tap the darkened area around the player (darken.onclick closes it), if it is reachable anywhere
      const W = page.viewportSize().width;
      const dk = await page.evaluate(([W, H]) => {
        const d = document.querySelector('[data-videoplayer="darken"]');
        for (let y = Math.round(H * 0.97); y > H * 0.03; y -= 8)
          for (const x of [Math.round(W / 2), 12, W - 12]) {
            const el = document.elementFromPoint(x, y);
            if (el && d && (el === d || d.contains(el))) return { x, y };
          }
        const el = document.elementFromPoint(W / 2, H * 0.9);
        return { miss: el ? `${el.tagName}.${el.className?.baseVal ?? el.className}` : null };
      }, [W, H]);
      ctx.log.push(`[t61] darken tap point: ${JSON.stringify(dk)}`);
      await tapAt(k, ctx, dk.x ?? W / 2, dk.y ?? H * 0.9);
      await k.frames(1500);
      await state(k, ctx, 'outside tapped');
      await k.shot('10-outside-tapped', { videoTime: 1 });
      if (await k.box('[data-videoplayer="close"]')) {
        await k.click('[data-videoplayer="close"]');
        await k.frames(1500);
      }
      // next project card (only the item after the current film is displayed)
      const NEXT = '[data-nextcms="w"] > .previousnext-item a.next-link';
      await bringTo(k, ctx, NEXT, Math.round(H * 0.2));
      await k.frames(1500);
      await state(k, ctx, 'next card');
      await k.shot('11-next-card');
      await navTap(k, ctx, NEXT);
      const n = await transition(k, ctx, 12, 'next', 3500);
      await back(k, ctx);
      await transition(k, ctx, n, 'back', 3500);
    },
  },

  // Native touch scroll-through of a film with the reviews slider, then footer HOME (Taxi into /), Back.
  't61-film-scroll': {
    viewports: VIEWPORTS,
    async run(ctx) {
      const { page } = ctx;
      const k = await kit(ctx);
      await k.goto('/films/moon-in-the-12th-house');
      await k.at(3.5);
      await k.shot('01-hero');
      const { width: W, height: H } = page.viewportSize();
      const REV = '[data-reviews="wrapper"]';
      let n = 2;
      const id = () => String(n++).padStart(2, '0');
      let reviewsDone = false;
      for (let i = 0; i < 30; i++) {
        const rt = reviewsDone ? null : await topOf(page, REV);
        if (rt !== null && rt < H * 0.9) {
          await bringTo(k, ctx, REV, Math.round(H * 0.12));
          await k.frames(1600);
          await state(k, ctx, 'reviews');
          await k.shot(`${id()}-reviews`);
          const r = await page.evaluate((s) => {
            const b = document.querySelector(s).getBoundingClientRect();
            return { y: Math.round(b.top + b.height / 2) };
          }, REV);
          await tswipe(k, ctx, { x: Math.round(W * 0.8), y: r.y }, { x: Math.round(W * 0.25), y: r.y }, {
            hold: false,
            mid: async () => {
              await k.frames(100);
              await k.shot(`${id()}-reviews-dragging`);
            },
          });
          await k.frames(1600);
          await state(k, ctx, 'reviews swiped');
          await k.shot(`${id()}-reviews-swiped`);
          await k.click('[data-reviews="prevnext"] > *', 1);
          await k.frames(1600);
          await k.shot(`${id()}-reviews-next-tapped`);
          await k.click('[data-reviews="prevnext"] > *', 0);
          await k.frames(400);
          await k.shot(`${id()}-reviews-prev-tapped+0.4`);
          await k.frames(1200);
          await state(k, ctx, 'reviews prev');
          await k.shot(`${id()}-reviews-prev-tapped`);
          reviewsDone = true;
          continue;
        }
        const moved = await tscroll(k, ctx, Math.round(H * 0.85));
        if (moved <= 0) break;
        await k.frames(1600);
        await k.shot(`${id()}-scroll`);
      }
      await state(k, ctx, 'bottom');
      await navTap(k, ctx, 'footer.footer .ft-sitemap-lk[href="/"]');
      n = await transition(k, ctx, n, 'footer-home', 4000);
      await back(k, ctx);
      await transition(k, ctx, n, 'back', 3500);
    },
  },

  // Footer links on a policy page: sitemap link, Back, legal link.
  't61-footer': {
    viewports: VIEWPORTS,
    async run(ctx) {
      const { page } = ctx;
      const k = await kit(ctx);
      await k.goto('/terms');
      await k.at(2.5);
      const { height: H } = page.viewportSize();
      await tscroll(k, ctx, 40000);
      await k.frames(1800);
      await state(k, ctx, 'terms bottom');
      await k.shot('01-footer');
      await navTap(k, ctx, 'footer.footer .ft-sitemap-lk[href="/about"]');
      let n = await transition(k, ctx, 2, 'sitemap', 3000);
      await back(k, ctx);
      n = await transition(k, ctx, n, 'back', 2500);
      await tscroll(k, ctx, 40000);
      await k.frames(1800);
      await k.shot(`${String(n++).padStart(2, '0')}-footer-again`);
      await navTap(k, ctx, 'footer.footer .ft-small-lk[href="/privacy"]');
      await transition(k, ctx, n, 'legal', 2500);
      void H;
    },
  },

  // 404: GO BACK (Taxi into the home view), then browser Back.
  't61-404': {
    viewports: VIEWPORTS,
    async run(ctx) {
      const k = await kit(ctx);
      await k.goto('/404');
      await k.at(4.5);
      await state(k, ctx, '404');
      await k.shot('01-404');
      await navTap(k, ctx, 'a[href="/"] > button.explore-btn-w');
      const n = await transition(k, ctx, 2, 'goback', 4000);
      await back(k, ctx);
      await transition(k, ctx, n, 'back', 4500);
    },
  },

  // Rotation inside one document (phone UA kept): portrait -> landscape -> portrait.
  't61-rotate': {
    viewports: VIEWPORTS,
    async run(ctx) {
      const { page, width: W, height: H } = ctx;
      let n = 1;
      const id = () => String(n++).padStart(2, '0');
      const rotate = async (w, h) => {
        await page.setViewportSize({ width: w, height: h });
        await page.waitForTimeout(250); // resize / orientationchange are delivered in real time
        await k.idle({ quiet: 150 });
      };
      const cycle = async (tag) => {
        await state(k, ctx, `${tag} portrait`);
        await k.shot(`${id()}-${tag}-portrait`);
        await rotate(H, W);
        await k.frames(300);
        await k.shot(`${id()}-${tag}-landscape+0.3`);
        await k.frames(1700);
        await state(k, ctx, `${tag} landscape`);
        await k.shot(`${id()}-${tag}-landscape`);
        await rotate(W, H);
        await k.frames(300);
        await k.shot(`${id()}-${tag}-portrait-again+0.3`);
        await k.frames(1700);
        await state(k, ctx, `${tag} portrait again`);
        await k.shot(`${id()}-${tag}-portrait-again`);
      };
      const k = await enterHome(ctx);
      await cycle('home');
      await k.goto('/work');
      await k.at(4.5);
      await cycle('work');
      await k.goto('/about');
      await k.at(3);
      await cycle('about');
      await k.goto('/films/savoy');
      await k.at(3.5);
      await tscroll(k, ctx, Math.round(H * 1.2));
      await k.frames(1500);
      await cycle('film');
      // menu opened in landscape (tablet layout at 844x390; under the notice at 740x360)
      await rotate(H, W);
      await k.frames(1500);
      await k.click(MAIN);
      await k.frames(1400);
      await state(k, ctx, 'landscape menu');
      await k.shot(`${id()}-film-landscape-menu`);
      await rotate(W, H);
      await k.frames(1500);
      await state(k, ctx, 'portrait after landscape menu');
      await k.shot(`${id()}-film-portrait-after-menu`);
    },
  },
};

export default scenarios;
