// Desktop interactions not covered by 10-50 (adversarial pass "interactions-desktop").
// Everything runs on the deterministic kit from 10-home.mjs (paused fake clock, frame stepping, input sync,
// network-idle between frames), so mid-transition frames and Lenis scroll positions are frame-exact on every base.
// Film pages loaded directly additionally hold app.js until the eager images are complete (same reason as
// prepare() in 40-pages.mjs: the scroll trackers measure the layout once at start-up).
// Every scenario writes `[ix-state]` lines (URL, title, scrollY, open panels, ...) into console.txt so that the
// two bases can be compared beyond pixels (history Back/Forward, Taxi transitions).
//
// Findings while writing it (true on LIVE, MIRROR and REPLICA alike):
//  - the DIRECTOR'S CUT sticky badge (.dc-el, position:sticky top:70vh) sits in `.abs.sticky-c`, which webflow.css
//    hides (`.abs.sticky-c{display:none}`) on every film: it never shows, the sticky scroll states only prove that;
//  - only savoy and moon-in-the-12th-house render the REVIEWS slider (the other 7 have no [data-reviews] list);
//  - footage gallery items are pointer-events:none (no hover state of their own);
//  - the quick menu (ticket) cannot be opened on /about and /contact (main.css: .checkbox-w{pointer-events:none}),
//    so "a film row of the quick menu" is clicked from /work instead, after proving the /about click is a no-op.
//
// Measured (reference/captures/compare/adv-interactions-desktop, LIVE vs REPLICA, 1440x900 + 1920x1080): 412 states,
// 397 pixel-identical; the rest are 1-34 px sub-pixel states that also flip between two LIVE runs (see checks/).
// [ix-state] lines: 140/140 identical. Run: node tools/compare.mjs --a=https://www.siena.film --b=http://localhost:4322
//   --out=reference/captures/compare/adv-interactions-desktop --only=ixd- --viewports=1440x900,1920x1080
// `ixKit` is exported only for diagnostics scripts; the runner reads the default export.
import { kit, enterHome } from './10-home.mjs';

const QUICK = '.menu-w .checkbox-w';
const MAIN = '[data-menu="maintrigger"]';
const MAIN_LINKS = '[data-menu="mainpanel"] a.menu-link.large';
const LEGAL_LINKS = '[data-menu="mainpanel"] .menu-link-list.legal a';
const ROWS = '[data-menu="smallpanel"] .menu-film-item';
const DIRECT = '[data-menu="smallpanel"] .menu-film-direct-link';
const LOGO = '.nav-w a.nav-link.logo';
const WORK_EXPLORE = '[data-slider="link"] .btn-no-mob .explore-btn-w';
const BOTH = ['1440x900', '1920x1080'];
const DESK = ['1440x900'];

/** kit + (direct loads of content pages) app.js held until eager images are complete */
export async function ixKit(ctx) {
  const k = await kit(ctx);
  const { page, log } = ctx;
  // registered after the kit's own app.js route, so it runs first and then falls back to the kit's font hold
  await page.route(/\/app\.js(\?.*)?$/, async (route) => {
    const t0 = Date.now();
    while (Date.now() - t0 < 15000) {
      const ok = await page
        .evaluate(() => document.readyState !== 'loading' && [...document.images].filter((i) => i.loading !== 'lazy').every((i) => i.complete))
        .catch(() => false);
      if (ok) break;
      await page.waitForTimeout(25);
    }
    if (Date.now() - t0 >= 15000) log.push('[ix] eager images not complete before app.js');
    await route.fallback();
  });
  // The film thumbnails of the nav panels are loading="lazy": the browser only requests them once the opening
  // panel (CSS grid-rows transition, real time) shows them, so whether they are painted at the next shot depended
  // on real-time scheduling (measured: 1 of 2 LIVE-vs-REPLICA runs showed 8 empty 16x16 thumbnails, 0 of 1
  // LIVE-vs-MIRROR, 0 of 1 repeat). Before every shot, wait (real time) for the images of the open panels.
  const shot = k.shot;
  k.shot = async (label, opts) => {
    const t0 = Date.now();
    let pending = 0;
    while (Date.now() - t0 < 8000) {
      pending = await page
        .evaluate(() => {
          const sels = ['.menu-w .open img'];
          if (document.querySelector('.menu-w #smallpanel:checked')) sels.push('[data-menu="smallpanel"] img');
          if (document.querySelector('.menu-w #mainpanel:checked')) sels.push('[data-menu="mainpanel"] img');
          return [...document.querySelectorAll(sels.join(','))].filter((i) => {
            const r = i.getBoundingClientRect();
            const shown = r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < innerHeight && getComputedStyle(i).visibility !== 'hidden';
            return shown && !(i.complete && i.naturalWidth);
          }).length;
        })
        .catch(() => 0);
      if (!pending) break;
      await page.waitForTimeout(50);
    }
    if (pending) log.push(`[ix] ${label}: ${pending} panel images still loading`);
    return shot(label, opts);
  };
  return k;
}

async function state(k, ctx, label) {
  const s = await ctx.page
    .evaluate(() => ({
      url: location.pathname,
      title: document.title,
      y: Math.round(scrollY),
      views: document.querySelectorAll('[data-taxi-view]').length,
      page: document.querySelector('[data-taxi-view]')?.dataset.page ?? null,
      checked: [...document.querySelectorAll('.menu-w input')].filter((i) => i.checked).map((i) => i.id),
      open: [...document.querySelectorAll('.menu-w .open')].map((e) => e.dataset.menu),
      dark: !!document.querySelector('.nav-w.on-dark'),
      preloader: !!document.querySelector('[data-preloader="w"]'),
      tutorial: !!document.querySelector('[data-tutorial="w"]'),
      canvas: document.querySelectorAll('[data-gl="c"] canvas').length,
      cursor: document.querySelector('[data-cursor="home"]')?.className ?? null,
      hist: history.length,
    }))
    .catch((e) => ({ error: e.message }));
  ctx.log.push(`[ix-state] ${label} ${JSON.stringify(s)}`);
  return s;
}

/** Lenis scroll by `dy` px through wheel events (one per fake frame), then `settle` ms of fake time.
 *  The wheel is sent at the parking spot (right edge), so no hover state is left behind on the content. */
async function scrollBy(k, ctx, dy, settle = 2200) {
  const steps = Math.max(6, Math.min(40, Math.ceil(Math.abs(dy) / 80)));
  await k.wheel(dy, { steps, at: { x: ctx.width - 2, y: Math.round(ctx.height / 2) } });
  await k.frames(settle);
}

const rectOf = (page, sel, index = 0) =>
  page.evaluate(
    ([sel, index]) => {
      const els = [...document.querySelectorAll(sel)].filter((e) => {
        const r = e.getBoundingClientRect();
        const cs = getComputedStyle(e);
        return r.width > 0 && r.height > 0 && cs.display !== 'none' && cs.visibility !== 'hidden';
      });
      const e = els[index];
      if (!e) return null;
      const r = e.getBoundingClientRect();
      return { x: r.x, y: r.y, w: r.width, h: r.height };
    },
    [sel, index],
  );

/** brings the element to the viewport centre (or top + `top` px) with Lenis wheel steps */
async function bring(k, ctx, sel, { index = 0, top = null, settle = 2200, margin = 60 } = {}) {
  for (let i = 0; i < 3; i++) {
    const r = await rectOf(ctx.page, sel, index);
    if (!r) {
      ctx.log.push(`[ix] no visible ${sel}`);
      return null;
    }
    const dy = Math.round(top === null ? r.y + r.h / 2 - ctx.height / 2 : r.y - top);
    if (top === null ? r.y >= margin && r.y + r.h <= ctx.height - margin : Math.abs(dy) < 4) return r;
    const y0 = await ctx.page.evaluate(() => scrollY);
    await scrollBy(k, ctx, dy, settle);
    if ((await ctx.page.evaluate(() => scrollY)) === y0) break;
  }
  return rectOf(ctx.page, sel, index);
}

const park = (k, ctx) => k.move(ctx.width - 2, Math.round(ctx.height / 2), 3);

/**
 * CSS transitions run on real time (the fake clock only drives JS). A mousedown on the home roll / work slider adds
 * body.moving and will-change:transform to the slide while e.g. the EXPLORE label's hover-out transition
 * (.1 s + .8 s) may still be running; the label then rasterises at one of two sub-pixel positions (264 px apart at
 * 1920x1080), and which one depends only on that real-time race (seen on LIVE, MIRROR and REPLICA alike). Waiting
 * (real time) for running CSS transitions before pressing makes the pressed state single-valued.
 */
async function cssSettle(ctx, timeout = 3000) {
  const t0 = Date.now();
  while (Date.now() - t0 < timeout) {
    const n = await ctx.page
      .evaluate(() => document.getAnimations().filter((a) => a.playState === 'running' && a.constructor.name === 'CSSTransition').length)
      .catch(() => 0);
    if (!n) return;
    await ctx.page.waitForTimeout(20);
  }
  ctx.log.push('[ix] CSS transitions still running before mousedown');
}

async function setCookies(ctx) {
  const now = String(Date.now());
  await ctx.page.context().addCookies([
    { name: 'preloader_shown', value: now, url: ctx.base + '/' },
    { name: 'tutorial_shown', value: 'true', url: ctx.base + '/' },
  ]);
}

/** Taxi navigation by click. Like k.navClick, but also works for absolute hrefs (the /work EXPLORE link gets
 *  `location.origin + path` from app.js, which k.navClick's pathname lookup misses): waits for the network instead. */
async function nav(k, ctx, sel, pick) {
  const b = await k.click(sel, pick);
  if (!b) return null;
  await ctx.page.waitForTimeout(150);
  await k.idle({ quiet: 150, timeout: 20000 });
  ctx.log.push(`[ix] clicked ${sel} -> ${b.href}`);
  return b;
}

/** Taxi transition frames after nav() (same cadence as home-explore) */
async function transitionFrames(k, ctx, prefix, { settleShot = 'settled', tail = 3000 } = {}) {
  await k.frames(100);
  await k.shot(`${prefix}a-leave+0.1`);
  await k.frames(500);
  await k.shot(`${prefix}b-leave+0.6`);
  await k.frames(500);
  await k.shot(`${prefix}c-enter+1.1`);
  await k.frames(400);
  await k.shot(`${prefix}d-enter+1.5`);
  await k.frames(800);
  await k.shot(`${prefix}e-enter+2.3`);
  await k.frames(tail);
  await park(k, ctx);
  await k.frames(300);
  await state(k, ctx, settleShot);
  await k.shot(`${prefix}f-${settleShot}`);
}

export default {
  // REVIEWS slider on the two films that show it: prev/next buttons (hover, click, mid-slide), slide hover, drag.
  ...Object.fromEntries(
    [
      ['savoy', BOTH],
      ['moon-in-the-12th-house', DESK],
    ].map(([slug, viewports]) => [
      `ixd-reviews-${slug}`,
      {
        viewports,
        async run(ctx) {
          const k = await ixKit(ctx);
          await k.goto(`/films/${slug}`);
          await k.at(4);
          await park(k, ctx);
          const box = await bring(k, ctx, '[data-reviews="wrapper"]', { top: Math.round(ctx.height * 0.12) });
          await park(k, ctx); // k.wheel leaves the pointer at the viewport centre (= over a slide)
          await k.frames(1000);
          await state(k, ctx, 'reviews');
          await k.shot('01-reviews');
          await k.hover('[data-reviews="prevnext"] button', 0);
          await k.frames(800);
          await k.shot('02-hover-prev');
          await k.click('[data-reviews="prevnext"] button', 0);
          await k.frames(250);
          await k.shot('03-prev+0.25');
          await k.frames(1500);
          await k.shot('04-prev-settled');
          await k.hover('[data-reviews="prevnext"] button', 1);
          await k.frames(800);
          await k.shot('05-hover-next');
          await k.click('[data-reviews="prevnext"] button', 1);
          await k.frames(250);
          await k.shot('06-next+0.25');
          await k.frames(1500);
          await k.shot('07-next-settled');
          await k.click('[data-reviews="prevnext"] button', 1);
          await k.frames(150);
          await k.click('[data-reviews="prevnext"] button', 1);
          await k.frames(1800);
          await k.shot('08-next-x2');
          await k.hover('.review-slide-cont', 'center');
          await k.frames(1000);
          await k.shot('09-hover-slide');
          if (box) {
            const y = Math.round(ctx.height * 0.12 + Math.min(box.h, ctx.height * 0.6) / 2);
            await cssSettle(ctx);
            await k.drag({ x: ctx.width * 0.6, y }, { x: ctx.width * 0.6 - 300, y }, {
              mid: async () => {
                await k.frames(100);
                await k.shot('10-dragging');
              },
            });
            await k.frames(1800);
            await k.shot('11-dragged');
          }
          await park(k, ctx);
          await k.frames(1000);
          await k.shot('12-parked');
        },
      },
    ]),
  ),

  // DIRECTOR'S CUT badge region (credits -> gallery) in 0.35 x viewport Lenis steps, plus mid-scroll frames.
  'ixd-film-dc-sticky': {
    viewports: BOTH,
    async run(ctx) {
      const k = await ixKit(ctx);
      await k.goto('/films/savoy');
      await k.at(4);
      await park(k, ctx);
      await bring(k, ctx, '.section-w', { top: Math.round(ctx.height * 0.5) });
      await k.shot('01-section-start');
      for (let i = 1; i <= 6; i++) {
        await k.wheel(Math.round(ctx.height * 0.35), { steps: 8 });
        if (i % 3 === 1) {
          await k.frames(200);
          await k.shot(`0${i + 1}a-mid-scroll`);
        }
        await k.frames(1800);
        await state(k, ctx, `dc step ${i}`);
        await k.shot(`0${i + 1}b-step`);
      }
    },
  },

  // GALLERY strips: hover items of both rows, then scroll while hovering (strips translate with the scroll).
  'ixd-film-footage-hover': {
    viewports: BOTH,
    async run(ctx) {
      const k = await ixKit(ctx);
      await k.goto('/films/savoy');
      await k.at(4);
      await park(k, ctx);
      await bring(k, ctx, '[data-footage="w"]');
      await k.shot('01-gallery');
      await k.hover('[data-footage="item"]', 'center');
      await k.frames(900);
      await k.shot('02-hover-item-row1');
      await k.hover('[data-footage="item2"]', 'center');
      await k.frames(900);
      await k.shot('03-hover-item-row2');
      await k.wheel(Math.round(ctx.height * 0.3), { steps: 8, at: { x: ctx.width / 2, y: ctx.height / 2 } });
      await k.frames(250);
      await k.shot('04-scrolling-hovered');
      await k.frames(1800);
      await k.shot('05-scrolled-hovered');
      await k.wheel(-Math.round(ctx.height * 0.3), { steps: 8 });
      await k.frames(2000);
      await k.shot('06-scrolled-back');
    },
  },

  // Nav on a film page: ticket (case panel / synopsis), main panel, switch, close trigger, scroll closes panels.
  'ixd-nav-film': {
    viewports: BOTH,
    async run(ctx) {
      const k = await ixKit(ctx);
      await k.goto('/films/savoy');
      await k.at(4);
      await park(k, ctx);
      await k.shot('01-settled');
      await k.hover(QUICK);
      await k.frames(800);
      await k.shot('02-hover-ticket');
      await k.click(QUICK);
      await k.frames(1200);
      await state(k, ctx, 'case panel');
      await k.shot('03-casepanel-open');
      await k.click(QUICK);
      await k.frames(1200);
      await park(k, ctx);
      await k.frames(300);
      await k.shot('04-casepanel-closed');
      await k.click(MAIN);
      await k.frames(1400);
      await state(k, ctx, 'main');
      await k.shot('05-main-open');
      await k.hover(MAIN_LINKS, 0);
      await k.frames(700);
      await k.shot('06-main-hover-work');
      await k.hover(LEGAL_LINKS, 1);
      await k.frames(700);
      await k.shot('07-main-hover-legal');
      await k.click(QUICK);
      await k.frames(1500);
      await state(k, ctx, 'switched');
      await k.shot('08-switch-to-case');
      if (await k.box('.menu-close-trig')) {
        await k.click('.menu-close-trig');
        await k.frames(1200);
      }
      await park(k, ctx);
      await k.frames(300);
      await state(k, ctx, 'closed');
      await k.shot('09-closed');
      await scrollBy(k, ctx, Math.round(ctx.height * 1.2));
      await k.click(MAIN);
      await k.frames(1400);
      await k.shot('10-scrolled-main-open');
      await k.wheel(Math.round(ctx.height * 0.4), { steps: 8, at: { x: ctx.width * 0.3, y: ctx.height * 0.6 } });
      await k.frames(2500);
      await state(k, ctx, 'after scroll with main open');
      await k.shot('11-scroll-closes-main');
      await k.click(QUICK);
      await k.frames(1200);
      await k.shot('12-scrolled-casepanel-open');
    },
  },

  // Nav on /contact (dark nav variant, ticket disabled by main.css).
  'ixd-nav-contact': {
    viewports: BOTH,
    async run(ctx) {
      const k = await ixKit(ctx);
      await k.goto('/contact');
      await k.at(3.5);
      await park(k, ctx);
      await state(k, ctx, 'contact');
      await k.shot('01-settled');
      await k.click(QUICK);
      await k.frames(1200);
      await state(k, ctx, 'ticket click');
      await k.shot('02-ticket-click-noop');
      await k.click(MAIN);
      await k.frames(1400);
      await state(k, ctx, 'main');
      await k.shot('03-main-open');
      await k.hover(MAIN_LINKS, 1);
      await k.frames(700);
      await k.shot('04-main-hover-about');
      await k.hover(LEGAL_LINKS, 2);
      await k.frames(700);
      await k.shot('05-main-hover-legal');
      await k.click(MAIN);
      await k.frames(1400);
      await park(k, ctx);
      await k.frames(300);
      await k.shot('06-main-closed');
    },
  },

  // Nav on a legal page (policy variant: no film row, #smallpanel hidden).
  'ixd-nav-legal': {
    viewports: BOTH,
    async run(ctx) {
      const k = await ixKit(ctx);
      await k.goto('/terms');
      await k.at(3);
      await park(k, ctx);
      await k.shot('01-settled');
      await k.click(QUICK);
      await k.frames(1200);
      await state(k, ctx, 'ticket click');
      await k.shot('02-ticket-click');
      if (await k.box('.menu-close-trig')) {
        await k.click('.menu-close-trig');
        await k.frames(1200);
      }
      await k.click(MAIN);
      await k.frames(1400);
      await state(k, ctx, 'main');
      await k.shot('03-main-open');
      await k.hover(LEGAL_LINKS, 1);
      await k.frames(700);
      await k.shot('04-main-hover-terms-current');
      await k.hover(LEGAL_LINKS, 2);
      await k.frames(700);
      await k.shot('05-main-hover-privacy');
      await k.click(MAIN);
      await k.frames(1400);
      await park(k, ctx);
      await scrollBy(k, ctx, Math.round(ctx.height * 1.5));
      await k.click(MAIN);
      await k.frames(1400);
      await k.shot('06-scrolled-main-open');
      await k.click(MAIN);
      await k.frames(1400);
      await park(k, ctx);
      await k.frames(300);
      await k.shot('07-scrolled-main-closed');
    },
  },

  // /about ticket click (no-op) then a quick-menu film row from /work: row click, direct-link hover + navigation.
  'ixd-quick-row-nav': {
    viewports: BOTH,
    async run(ctx) {
      const k = await ixKit(ctx);
      await k.goto('/about');
      await k.at(3);
      await park(k, ctx);
      await k.hover(QUICK);
      await k.frames(800);
      await k.shot('01-about-hover-ticket');
      await k.click(QUICK);
      await k.frames(1200);
      await state(k, ctx, 'about ticket click');
      await k.shot('02-about-ticket-click-noop');
      await k.goto('/work');
      await k.at(4.5);
      await k.move(ctx.width * 0.5, ctx.height * 0.5, 1);
      await k.frames(300);
      await k.click(QUICK);
      await k.frames(1200);
      await state(k, ctx, 'work quick');
      await k.shot('03-work-quick-open');
      await k.click(ROWS, 5);
      await k.frames(2500);
      await state(k, ctx, 'work row 6 clicked');
      await k.shot('04-work-row6-click');
      if (!(await state(k, ctx, 'probe')).checked?.includes('smallpanel')) {
        await k.click(QUICK);
        await k.frames(1200);
      }
      await k.hover(ROWS, 2);
      await k.frames(700);
      await k.shot('05-hover-row3');
      await k.hover(DIRECT, 2);
      await k.frames(700);
      await k.shot('06-hover-direct-link');
      await nav(k, ctx, DIRECT, 2);
      await transitionFrames(k, ctx, '07', { settleShot: 'film-settled' });
    },
  },

  // /work: EXPLORE on the current slide -> film page.
  'ixd-work-explore': {
    viewports: BOTH,
    async run(ctx) {
      const k = await ixKit(ctx);
      await k.goto('/work');
      await k.at(4.5);
      await k.move(ctx.width * 0.5, ctx.height * 0.5, 1);
      await k.frames(500);
      await k.shot('01-settled');
      await k.hover(WORK_EXPLORE);
      await k.frames(800);
      await k.shot('02-hover-explore');
      await nav(k, ctx, WORK_EXPLORE);
      await transitionFrames(k, ctx, '03', { settleShot: 'film-settled' });
    },
  },

  // Film page "ALL WORK" -> /work.
  'ixd-film-allwork': {
    viewports: BOTH,
    async run(ctx) {
      const k = await ixKit(ctx);
      await k.goto('/films/savoy');
      await k.at(4);
      await park(k, ctx);
      await scrollBy(k, ctx, 9000, 2500);
      await bring(k, ctx, '.all-work-cta-w');
      await k.shot('01-next-block');
      await k.hover('.all-work-cta-w');
      await k.frames(900);
      await k.shot('02-hover-all-work');
      await nav(k, ctx, '.all-work-cta-w');
      await transitionFrames(k, ctx, '03', { settleShot: 'work-settled', tail: 3500 });
    },
  },

  // Logo on a film page -> / (Taxi), without and with the preloader_shown/tutorial_shown cookies.
  ...Object.fromEntries(
    [
      ['nocookie', false],
      ['cookie', true],
    ].map(([tag, cookie]) => [
      `ixd-logo-home-${tag}`,
      {
        viewports: BOTH,
        async run(ctx) {
          const k = await ixKit(ctx);
          if (cookie) await setCookies(ctx);
          await k.goto('/films/savoy');
          await k.at(4);
          await park(k, ctx);
          await scrollBy(k, ctx, Math.round(ctx.height * 0.8));
          await k.hover(LOGO);
          await k.frames(800);
          await state(k, ctx, 'film');
          await k.shot('01-hover-logo');
          await nav(k, ctx, LOGO);
          await transitionFrames(k, ctx, '02', { settleShot: 'home-settled', tail: 4000 });
          await k.frames(3000);
          await state(k, ctx, 'home +3s');
          await k.shot('03-home+3s');
        },
      },
    ]),
  ),

  // Direct load of / with both cookies: the preloader closes at once and the tutorial is removed.
  'ixd-home-cookie-direct': {
    viewports: BOTH,
    async run(ctx) {
      const k = await ixKit(ctx);
      await setCookies(ctx);
      await k.goto('/');
      await k.at(0.5);
      await k.shot('01-t0.5');
      await k.at(1.5);
      await k.shot('02-t1.5');
      await k.at(3);
      await k.shot('03-t3');
      await k.at(6);
      await k.move(ctx.width / 2, ctx.height * 0.62);
      await k.frames(500);
      await state(k, ctx, 'home direct with cookies');
      await k.shot('04-t6.5');
    },
  },

  // /404 GO BACK -> / (Taxi from a document whose body has no preloader/tutorial/rotate notice).
  'ixd-404-goback': {
    viewports: BOTH,
    async run(ctx) {
      const k = await ixKit(ctx);
      await k.goto('/404');
      await k.at(4.5);
      await park(k, ctx);
      await state(k, ctx, '404');
      await k.shot('01-settled');
      await k.hover('._404 a.flex-center');
      await k.frames(900);
      await k.shot('02-hover-go-back');
      await nav(k, ctx, '._404 a.flex-center');
      await transitionFrames(k, ctx, '03', { settleShot: 'home-settled', tail: 4000 });
      await k.frames(3000);
      await state(k, ctx, 'home +3s');
      await k.shot('04-home+3s');
    },
  },

  // Main-menu navigation chain from a film page: -> /contact (nav switches to the on-dark variant inside the swapped
  // view) -> /privacy (legal link, policy nav variant) -> logo -> /.
  'ixd-menu-nav-chain': {
    viewports: BOTH,
    async run(ctx) {
      const k = await ixKit(ctx);
      await k.goto('/films/savoy');
      await k.at(4);
      await park(k, ctx);
      await k.click(MAIN);
      await k.frames(1400);
      await k.hover(`${MAIN_LINKS}[href="/contact"]`);
      await k.frames(700);
      await k.shot('01-film-main-hover-contact');
      await nav(k, ctx, `${MAIN_LINKS}[href="/contact"]`);
      await transitionFrames(k, ctx, '02', { settleShot: 'contact-settled' });
      await k.click(MAIN);
      await k.frames(1400);
      await k.shot('03-contact-main-open');
      await nav(k, ctx, `${LEGAL_LINKS}[href="/privacy"]`);
      await transitionFrames(k, ctx, '04', { settleShot: 'privacy-settled' });
      await k.click(MAIN);
      await k.frames(1400);
      await k.shot('05-privacy-main-open');
      await k.click(MAIN);
      await k.frames(1400);
      await nav(k, ctx, LOGO);
      await transitionFrames(k, ctx, '06', { settleShot: 'home-settled', tail: 4000 });
    },
  },

  // Browser Back / Forward after Taxi transitions: URL, title, scroll position and pixels.
  'ixd-history': {
    viewports: BOTH,
    async run(ctx) {
      const k = await ixKit(ctx);
      const { page, log } = ctx;
      const hist = async (label, fn) => {
        await fn().catch((e) => log.push(`[ix] ${label}: ${e.message.split('\n')[0]}`));
        await k.frames(100);
        await k.shot(`${label}-a+0.1`);
        await k.frames(600);
        await k.shot(`${label}-b+0.7`);
        await k.frames(4000);
        await park(k, ctx);
        await k.frames(300);
        await state(k, ctx, label);
        await k.shot(`${label}-c-settled`);
      };
      await k.goto('/about');
      await k.at(3);
      await park(k, ctx);
      await scrollBy(k, ctx, Math.round(ctx.height * 1.7));
      await state(k, ctx, 'about scrolled');
      await k.shot('01-about-scrolled');
      await k.click(MAIN);
      await k.frames(1400);
      await nav(k, ctx, `${MAIN_LINKS}[href="/work"]`);
      await k.frames(5000);
      await park(k, ctx);
      await state(k, ctx, 'work');
      await k.shot('02-work');
      await hist('03-back', () => page.goBack({ waitUntil: 'commit', timeout: 10000 }));
      await hist('04-forward', () => page.goForward({ waitUntil: 'commit', timeout: 10000 }));
      // work -> film (EXPLORE) -> back -> forward
      await k.move(ctx.width * 0.5, ctx.height * 0.5, 1);
      await nav(k, ctx, WORK_EXPLORE);
      await k.frames(5000);
      await scrollBy(k, ctx, Math.round(ctx.height * 1.3));
      await state(k, ctx, 'film scrolled');
      await k.shot('05-film-scrolled');
      await hist('06-back', () => page.goBack({ waitUntil: 'commit', timeout: 10000 }));
      await hist('07-forward', () => page.goForward({ waitUntil: 'commit', timeout: 10000 }));
      await hist('08-back2', () => page.goBack({ waitUntil: 'commit', timeout: 10000 }));
      await hist('09-back3', () => page.goBack({ waitUntil: 'commit', timeout: 10000 }));
    },
  },

  // Footer of a film page (base variant): every sitemap link, contact row, social icon and legal link hovered.
  'ixd-film-footer-hover': {
    viewports: BOTH,
    async run(ctx) {
      const k = await ixKit(ctx);
      await k.goto('/films/savoy');
      await k.at(4);
      await park(k, ctx);
      await scrollBy(k, ctx, 9000, 3000);
      await state(k, ctx, 'footer');
      await k.shot('01-footer');
      const groups = [
        ['02', 'footer.footer .ft-sitemap-lk', 4],
        ['03', 'footer.footer .ft-contact-li-it', 1],
        ['04', 'footer.footer .footer-social-icon-w', 3],
        ['05', 'footer.footer .ft-small-lk', 3],
      ];
      for (const [p, sel, n] of groups) {
        for (let i = 0; i < n; i++) {
          if (!(await k.hover(sel, i))) continue;
          await k.frames(900);
          await k.shot(`${p}-${String.fromCharCode(97 + i)}-hover`);
        }
      }
      await park(k, ctx);
      await k.frames(900);
      await k.shot('06-parked');
    },
  },

  // Custom cursor over the home roll: lerp trail frames, hide zones (nav, logo, EXPLORE), pressed, PREV/NEXT sweep.
  'ixd-cursor-home': {
    viewports: BOTH,
    async run(ctx) {
      const k = await enterHome(ctx, await ixKit(ctx));
      const { page, width: W, height: H } = ctx;
      await k.move(W * 0.5, H * 0.55, 1);
      await k.frames(800);
      await k.shot('01-start');
      await k.move(W * 0.25, H * 0.3, 1);
      await k.frames(16);
      await k.shot('02-trail+1f');
      await k.frames(64);
      await k.shot('03-trail+5f');
      await k.frames(600);
      await k.shot('04-trail-settled');
      await k.move(W * 0.8, H * 0.12, 6); // over the nav (data-cursor=hide)
      await k.frames(500);
      await state(k, ctx, 'over nav');
      await k.shot('05-over-nav');
      await k.move(80, 70, 6); // logo hide hitbox
      await k.frames(500);
      await k.shot('06-over-logo');
      await k.hover('[data-roll="item"] .roll-cont-col.reviews a.explore-w', 'center');
      await k.frames(500);
      await state(k, ctx, 'over explore');
      await k.shot('07-over-explore');
      await k.move(W * 0.45, H * 0.5, 6);
      await k.frames(500);
      await cssSettle(ctx);
      await k.sync('mousedown', () => page.mouse.down());
      await k.frames(300);
      await state(k, ctx, 'pressed');
      await k.shot('08-pressed-card');
      await k.sync('mouseup', () => page.mouse.up());
      await k.frames(800);
      await k.shot('09-released');
      for (const [i, hb] of [['10', 'PREV'], ['11', 'NEXT']]) {
        const b = await k.box(`[data-hitbox="${hb}"]`);
        if (!b) continue;
        await k.move(b.x - b.w * 0.35, b.y, 4);
        await k.frames(500);
        await k.shot(`${i}a-${hb.toLowerCase()}-left`);
        await k.move(b.x + b.w * 0.35, b.y, 8);
        await k.frames(30);
        await k.shot(`${i}b-${hb.toLowerCase()}-moving`);
        await k.frames(500);
        await state(k, ctx, `over ${hb}`);
        await k.shot(`${i}c-${hb.toLowerCase()}-right`);
      }
      await k.move(W * 0.5, H * 0.5, 6);
      await k.frames(800);
      await k.shot('12-back-center');
    },
  },

  // Custom cursor on /work: trail, toggle, EXPLORE, PREV/NEXT hitboxes, pressed.
  'ixd-cursor-work': {
    viewports: BOTH,
    async run(ctx) {
      const k = await ixKit(ctx);
      const { page, width: W, height: H } = ctx;
      await k.goto('/work');
      await k.at(4.5);
      await k.move(W * 0.5, H * 0.5, 1);
      await k.frames(500);
      await k.shot('01-start');
      await k.move(W * 0.2, H * 0.7, 1);
      await k.frames(16);
      await k.shot('02-trail+1f');
      await k.frames(64);
      await k.shot('03-trail+5f');
      await k.frames(600);
      await k.shot('04-trail-settled');
      await k.hover('[data-work="toggle"] button.work-toggle', 0);
      await k.frames(500);
      await state(k, ctx, 'over toggle');
      await k.shot('05-over-toggle');
      await k.hover(WORK_EXPLORE);
      await k.frames(500);
      await state(k, ctx, 'over explore');
      await k.shot('06-over-explore');
      for (const [i, hb] of [['07', 'PREV'], ['08', 'NEXT']]) {
        const b = await k.box(`[data-hitbox="${hb}"]`);
        if (!b) continue;
        await k.move(b.x, b.y - b.h * 0.3, 4);
        await k.frames(500);
        await state(k, ctx, `over ${hb}`);
        await k.shot(`${i}a-${hb.toLowerCase()}`);
        await cssSettle(ctx);
        await k.sync('mousedown', () => page.mouse.down());
        await k.frames(200);
        await k.shot(`${i}b-${hb.toLowerCase()}-pressed`);
        await k.sync('mouseup', () => page.mouse.up());
        await k.frames(2000);
        await k.shot(`${i}c-${hb.toLowerCase()}-clicked`);
      }
      await k.move(W * 0.5, H * 0.45, 6);
      await k.frames(500);
      await cssSettle(ctx);
      await k.sync('mousedown', () => page.mouse.down());
      await k.frames(300);
      await k.shot('09-pressed-card');
      await k.sync('mouseup', () => page.mouse.up());
      await k.frames(1500);
      await k.shot('10-released');
    },
  },
};
