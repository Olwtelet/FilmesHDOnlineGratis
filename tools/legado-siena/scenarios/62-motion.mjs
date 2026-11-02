// Media & motion fidelity (adversarial lens "media-motion"): frames sampled at fixed fake-clock times so motion
// can be compared pixel by pixel between two bases (compare.mjs). Built on the deterministic kit of 10-home.mjs
// (paused fake clock, frame stepping, input sync, videos paused+seeked before every shot).
//   motion-preloader     /            preloader every 0.25 s for the first 4 s (videos seeked to the same nominal time)
//   motion-tutorial      /            after ENTER: preloader fade + intro spin every 0.1 s, then the 5 tutorial tips
//                                     (desktop) sampled every 0.2 s around each 4.8 s step and the slide-out
//   motion-roll-inertia  /            one short wheel burst (desktop) / one swipe (phone), every 0.1 s for 1.5 s
//   motion-work-drag     /work        drag (desktop) / swipe (phone) release inertia, every 0.1 s for 1.5 s
//   motion-work-footage  /work        Poster -> Footage WebGL transition every 0.1 s for 2 s, and back for 1.5 s
//   motion-nav-transition /about->/work via the main menu, every 0.1 s for 4 s
//   motion-film-hero-*   /films/...   hero entrance (split title lines) every 0.1 s for 2 s (+2.5 / 3 s)
//   motion-marquee-*     /films/...   prizes marquee: CSS animation pinned at 1 s and 3 s (real-time page, 40-pages helpers)
// Labels carry a running index so the report sorts them in time order.
import { kit, enterHome } from './10-home.mjs';
import { scenario, open, bringIntoView, waitVisualReady, freezeVideos } from './40-pages.mjs';

const VP = ['1440x900', '390x844'];
const ENTER = '[data-preloader="btn"] .explore-btn-w';
const TOGGLE = '[data-work="toggle"] button.work-toggle:not(.inactive)';
const MAIN = '[data-menu="maintrigger"]';
const MAIN_LINKS = '[data-menu="mainpanel"] a.menu-link.large';

const pad = (n, w = 2) => String(n).padStart(w, '0');
const lbl = (i, prefix, t) => `${pad(i, 3)}-${prefix}${t.toFixed(2)}`;

/**
 * k.goto() for pages whose intro is NOT gated by an input or by WebGL textures (film pages): app.js runs at fake
 * t = 1..4 ms depending on the document's clock replay, so a setTimeout(300) in the bundle (case hero split) fires at
 * 301..304, i.e. sometimes exactly on the 304 rAF boundary, and the GSAP tweens then start one frame apart from run
 * to run (measured: replica vs replica up to 1.27 %; same race for the preloader ENTER fade, setTimeout(3500)). Holding app.js and moving the fake clock to mid-frame (t = 8) before
 * handing it to the kit's own app.js route makes every timer of the bundle land inside a frame.
 */
async function gotoMidFrame(k, ctx, route, phase = 8) {
  await ctx.page.route(/\/app\.js(\?.*)?$/, async (r) => {
    // registered after the kit's handler, so it runs first; fallback() then hands over to the kit (font hold)
    const now = await ctx.page.evaluate(() => performance.now()).catch(() => null);
    if (now != null && now < phase) await ctx.page.clock.runFor(Math.round(phase - now));
    await r.fallback();
  });
  await k.goto(route);
}

/** state probe (no screenshot) logged as JSON into console.txt, for numeric LIVE/REPLICA comparison */
async function probe(k, ctx, label, fn) {
  const s = await ctx.page.evaluate(fn).catch((e) => ({ error: e.message }));
  ctx.log.push(`[probe] t=${k.t.toFixed(3)} ${label} ${JSON.stringify(s)}`);
}

const tutorialState = () => {
  const w = document.querySelector('[data-tutorial="w"]');
  const v = w?.querySelector('[data-tutorial="video"]');
  return {
    present: !!w,
    wT: w?.style.transform ?? null,
    texts: w ? [...w.querySelector('[data-tutorial="texts"]').children].map((t) => t.style.transform) : null,
    video: v ? { paused: v.paused, rs: v.readyState } : null,
    preloader: !!document.querySelector('[data-preloader="w"]'),
    cookies: document.cookie.split('; ').map((c) => c.split('=')[0]).sort(),
  };
};

export default {
  'motion-preloader': {
    viewports: VP,
    async run(ctx) {
      const k = await kit(ctx);
      await gotoMidFrame(k, ctx, '/'); // ENTER fade-in = setTimeout(3500) from app.js: same 1-frame race as the hero
      let i = 0;
      await k.shot(lbl(i++, 'pre-t', 0), { videoTime: 0.04 });
      for (let t = 0.25; t <= 4.001; t += 0.25) {
        await k.at(t);
        await k.shot(lbl(i++, 'pre-t', t), { videoTime: t });
      }
      await probe(k, ctx, 'preloader@4s', () => {
        const b = document.querySelector('[data-preloader="btn"]');
        const v = [...document.querySelectorAll('[data-preloader="w"] video')].map((v) => ({
          src: v.currentSrc.split('/').pop(),
          dur: v.duration,
          w: v.videoWidth,
          h: v.videoHeight,
          op: getComputedStyle(v).opacity,
          disp: getComputedStyle(v).display,
        }));
        return { btnOpacity: b && getComputedStyle(b).opacity, btnVis: b && getComputedStyle(b).visibility, v };
      });
    },
  },

  'motion-tutorial': {
    viewports: VP,
    async run(ctx) {
      const k = await kit(ctx);
      await k.goto('/');
      await k.at(4.2);
      await k.idle();
      await k.click(ENTER);
      const c = k.t; // fake time of the ENTER click
      await probe(k, ctx, 'after ENTER', tutorialState);
      let i = 0;
      // preloader fade-out (0.3 s), PRELOADER_CLICKED, intro spin of the roll, nav/page reveal: every 0.1 s for 2 s
      for (let d = 0.1; d <= 2.001; d += 0.1) {
        await k.at(c + d);
        await k.shot(lbl(i++, 'enter+', d), { videoTime: 1 });
      }
      await probe(k, ctx, 'enter+2.0', tutorialState);
      if (ctx.mobile) {
        // the tutorial is removed at <= 991 px: keep sampling the intro settle instead
        for (let d = 2.5; d <= 6.001; d += 0.5) {
          await k.at(c + d);
          await k.shot(lbl(i++, 'enter+', d), { videoTime: 1 });
        }
        await probe(k, ctx, 'enter+6.0', tutorialState);
        return;
      }
      // tutorial slide-in (2 s after PRELOADER_CLICKED, 0.4 s) + first tip (1 s): every 0.1 s
      for (let d = 2.1; d <= 3.601; d += 0.1) {
        await k.at(c + d);
        await k.shot(lbl(i++, 'tut+', d), { videoTime: 1 });
      }
      await probe(k, ctx, 'tut in', tutorialState);
      // tips change every 4.8 s (tween 1.2 s, next tip delay .1); the 5th step slides the panel out (1.8 s)
      const play = c + 0.3 + 2.0; // closePreloader tween (0.3 s) -> PRELOADER_CLICKED -> setTimeout 2 s
      for (let n = 1; n <= 5; n++) {
        const b = play + 4.8 * n;
        const end = n === 5 ? 2.2 : 1.4;
        for (let d = -0.2; d <= end + 0.001; d += 0.2) {
          await k.at(b + d);
          await k.shot(`${pad(i++, 3)}-step${n}${d < 0 ? '-' : '+'}${Math.abs(d).toFixed(2)}`, { videoTime: 1 });
        }
        await probe(k, ctx, `step ${n} done`, tutorialState);
      }
    },
  },

  'motion-roll-inertia': {
    viewports: VP,
    async run(ctx) {
      const k = await enterHome(ctx);
      const { width: W, height: H } = ctx;
      if (!ctx.mobile) await k.move(W / 2, H * 0.6);
      await k.frames(600);
      await k.note('before burst');
      await k.shot('000-before');
      if (ctx.mobile) await k.swipe({ x: W / 2, y: H * 0.7 }, { x: W / 2, y: H * 0.45 }, { steps: 6 });
      else await k.wheel(960, { steps: 8, at: { x: W / 2, y: H * 0.6 } }); // one burst: 8 wheel events, 1 frame apart
      const c = k.t;
      let i = 1;
      for (let d = 0; d <= 1.501; d += 0.1) {
        await k.at(c + d);
        if (d > 0.75 && d < 0.85) await k.note('burst+0.8');
        await k.shot(lbl(i++, 'burst+', d));
      }
      await k.note('burst+1.5');
    },
  },

  'motion-work-drag': {
    viewports: VP,
    async run(ctx) {
      const { width: W, height: H, mobile } = ctx;
      const k = await kit(ctx);
      await k.goto('/work');
      await k.at(4.5);
      if (!mobile) await k.move(W * 0.5, H * 0.5, 1);
      await k.frames(500);
      await k.note('settled');
      await k.shot('000-settled');
      const cy = H * 0.5;
      if (mobile) await k.swipe({ x: W * 0.8, y: cy }, { x: W * 0.3, y: cy }, { steps: 8 });
      else await k.drag({ x: W * 0.6, y: cy }, { x: W * 0.6 - 260, y: cy }, { steps: 8 });
      const c = k.t; // release
      let i = 1;
      for (let d = 0; d <= 1.501; d += 0.1) {
        await k.at(c + d);
        if (d > 0.75 && d < 0.85) await k.note('release+0.8');
        await k.shot(lbl(i++, 'release+', d));
      }
      await k.note('release+1.5');
    },
  },

  'motion-work-footage': {
    viewports: VP,
    async run(ctx) {
      const { width: W, height: H, mobile } = ctx;
      const k = await kit(ctx);
      await k.goto('/work');
      await k.at(4.5);
      if (!mobile) await k.move(W * 0.5, H * 0.5, 1);
      await k.frames(500);
      await k.shot('000-poster');
      await k.click(TOGGLE);
      let c = k.t;
      let i = 1;
      for (let d = 0.1; d <= 2.001; d += 0.1) {
        await k.at(c + d);
        await k.shot(lbl(i++, 'footage+', d));
      }
      await k.note('footage on');
      await k.click(TOGGLE);
      c = k.t;
      for (let d = 0.1; d <= 1.501; d += 0.1) {
        await k.at(c + d);
        await k.shot(lbl(i++, 'poster+', d));
      }
      await k.note('poster again');
    },
  },

  'motion-nav-transition': {
    viewports: VP,
    async run(ctx) {
      const k = await kit(ctx);
      await k.goto('/about');
      await k.at(2.5);
      await k.click(MAIN);
      await k.frames(1400);
      await k.shot('000-menu-open');
      await k.navClick(`${MAIN_LINKS}[href="/work"]`);
      const c = k.t;
      let i = 1;
      for (let d = 0.1; d <= 4.001; d += 0.1) {
        await k.at(c + d);
        await k.shot(lbl(i++, 'nav+', d));
      }
      await k.note('work after transition');
    },
  },

  ...Object.fromEntries(
    ['savoy', 'moon-in-the-12th-house'].map((slug) => [
      `motion-film-hero-${slug}`,
      {
        viewports: VP,
        async run(ctx) {
          const k = await kit(ctx);
          await gotoMidFrame(k, ctx, `/films/${slug}`);
          let i = 0;
          await k.shot(lbl(i++, 'hero-t', 0));
          for (let t = 0.1; t <= 2.001; t += 0.1) {
            await k.at(t);
            await k.shot(lbl(i++, 'hero-t', t));
          }
          for (const t of [2.5, 3.0]) {
            await k.at(t);
            await k.shot(lbl(i++, 'hero-t', t));
          }
          await probe(k, ctx, 'hero lines', () =>
            [...document.querySelectorAll('[data-cs="herow"] .split-line-move-case, [data-cs="herow"] [data-cs="lines"] > *')].map((e) => [
              e.className,
              e.style.transform,
              getComputedStyle(e).display,
            ]),
          );
        },
      },
    ]),
  ),

  ...Object.fromEntries(
    ['savoy', 'kafkas-last-trial'].map((slug) => [
      `motion-marquee-${slug}`,
      scenario({
        viewports: VP,
        async run(ctx) {
          const { page } = ctx;
          await open(ctx, `/films/${slug}`, { settle: 3500 });
          const box = await bringIntoView(ctx, '[data-marquee="vertical"]');
          if (!box) ctx.log.push('[scenario-note] marquee not visible');
          await page.mouse.move(ctx.width - 2, Math.round(ctx.height / 2));
          await ctx.settle(2500);
          const info = await page.evaluate(() =>
            [...document.querySelectorAll('[data-marquee="vertical"]')].map((m) => ({
              active: m.getAttribute('data-marquee-active'),
              lists: m.children.length,
              items: m.children[0]?.children[0]?.children.length,
              visible: m.getBoundingClientRect().height > 0,
              anims: [...m.children].map((d) => d.getAnimations().map((a) => [a.animationName, a.effect.getComputedTiming().duration, a.effect.getComputedTiming().easing, a.playState])),
            })),
          );
          ctx.log.push(`[probe] marquee ${JSON.stringify(info)}`);
          for (const T of [1000, 3000]) {
            await waitVisualReady(ctx);
            await freezeVideos(ctx, 4);
            await page.evaluate((T) => {
              for (const a of document.getAnimations()) {
                const end = a.effect?.getComputedTiming().endTime;
                if (end === Infinity) {
                  a.pause();
                  a.currentTime = T; // every infinite CSS animation (marquee lists, about arrow) at the same nominal time
                } else
                  try {
                    a.finish();
                  } catch {}
              }
            }, T);
            await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
            await ctx.shot(`marquee-at-${T / 1000}s`);
          }
        },
      }),
    ]),
  ),
};
