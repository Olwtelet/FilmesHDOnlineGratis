// Film (case-study) page scenarios: scroll-through of all 9 films, the trailer player, and the next-film transition.
// Helpers (Lenis wheel scrolling, asset-ready + frozen-video snapshots) come from 40-pages.mjs.
import { scenario, open, snap, scrollThrough, bringIntoView, hoverShot, visibleBox, freezeVideos, waitVisualReady, SETTLE, SHOT_OPTS } from './40-pages.mjs';

export const FILMS = [
  'savoy',
  'moon-in-the-12th-house',
  'taboo',
  'kafkas-last-trial',
  'my-project-x',
  'ana-maxim',
  'outsider-freud',
  'by-any-means',
  'thehousewife',
];

const PLAYER = '[data-videoplayer="wrapper"]';
const TRIGGER = '[data-videoplayer="trigger"]';
const PLAYER_VIDEO = 'video[data-videoplayer="video"]';

/** Pauses the trailer and pins it to `t` seconds; the UI keeps whatever play/pause class app.js gave it. */
async function freezeTrailer(ctx, t) {
  await ctx.page
    .waitForFunction(
      (sel) => {
        const v = document.querySelector(sel);
        return !v || v.error || !v.currentSrc || v.readyState >= 1;
      },
      PLAYER_VIDEO,
      { timeout: 15000 },
    )
    .catch(() => ctx.log.push('[scenario-note] trailer metadata not loaded within 15 s'));
  await freezeVideos(ctx, t);
}

/** Film scroll-through: settled hero, then Lenis steps of 0.85 x viewport through trailer, credits, footage,
 *  reviews, prizes, investors, next project and footer. */
function filmScroll(slug) {
  return scenario({
    async run(ctx) {
      await open(ctx, `/films/${slug}`, { settle: 4000 });
      await snap(ctx, '01-hero');
      await scrollThrough(ctx, { group: '02-scroll' });
    },
  });
}

/** Trailer player: trigger, hover, open (frozen frame), control hovers, sound toggle, close. No fullscreen control
 *  exists in the markup (only play/pause, scrubber, SOUND ON/OFF and close). */
function filmPlayer(slug) {
  return scenario({
    async run(ctx) {
      const { page } = ctx;
      await open(ctx, `/films/${slug}`, { settle: 3500 });
      const box = await bringIntoView(ctx, TRIGGER);
      if (!box) throw new Error(`no visible ${TRIGGER} on /films/${slug}`);
      await page.mouse.move(ctx.width - 2, Math.round(ctx.height / 2));
      await ctx.settle(600);
      await snap(ctx, '01-trigger');
      const cx = box.x + box.width / 2;
      const cy = box.y + box.height / 2;
      await page.mouse.move(cx, cy, { steps: 4 });
      await ctx.settle(900);
      await snap(ctx, '02-trigger-hover');
      await page.mouse.click(cx, cy);
      // openModal: Lenis scrolls the player to the centre (0.8 s), dialog/darken/video/UI fade in (<= ~1.4 s)
      await ctx.settle(3000);
      await freezeTrailer(ctx, 4);
      await waitVisualReady(ctx);
      await ctx.shot('03-open-playing', SHOT_OPTS); // video pinned at 00:04, UI still in its "playing" state
      const controls = [
        ['04-hover-playpause', '[data-vid="play"]'],
        ['05-hover-scrubber', '[data-videoplayer="scrub"]'],
        ['06-hover-sound', '[data-vid="sound"]'],
      ];
      for (const [label, sel] of controls) {
        const b = await visibleBox(ctx, sel);
        if (!b) {
          ctx.log.push(`[scenario-note] ${label}: ${sel} not visible`);
          continue;
        }
        await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2, { steps: 4 });
        await ctx.settle(800);
        await freezeTrailer(ctx, 4);
        await ctx.shot(label, SHOT_OPTS);
      }
      // SOUND ON -> SOUND OFF (the click also bubbles to the dialog's play/pause toggle: same on every base)
      const sound = await visibleBox(ctx, '[data-vid="sound"]');
      if (sound) {
        await page.mouse.click(sound.x + sound.width / 2, sound.y + sound.height / 2);
        await ctx.settle(800);
        await freezeTrailer(ctx, 4);
        await ctx.shot('07-sound-toggled', SHOT_OPTS);
      }
      const close = await visibleBox(ctx, '[data-videoplayer="close"]');
      if (close) {
        await page.mouse.move(close.x + close.width / 2, close.y + close.height / 2, { steps: 4 });
        await ctx.settle(800);
        await freezeTrailer(ctx, 4);
        await ctx.shot('08-hover-close', SHOT_OPTS);
        await page.mouse.click(close.x + close.width / 2, close.y + close.height / 2);
      } else {
        await page.keyboard.press('Escape');
      }
      await ctx.settle(1800);
      await page.mouse.move(ctx.width - 2, Math.round(ctx.height / 2));
      await ctx.settle(600);
      await snap(ctx, '09-closed');
    },
  });
}

const scenarios = {};
for (const slug of FILMS) scenarios[`film-${slug}`] = filmScroll(slug);

scenarios['film-player-savoy'] = filmPlayer('savoy');
scenarios['film-player-by-any-means'] = filmPlayer('by-any-means'); // its <video src> is a YouTube URL: no playback

// Next-project block on savoy -> click -> Taxi.js transition to /films/moon-in-the-12th-house.
scenarios['film-next-savoy'] = scenario({
  video: true,
  async run(ctx) {
    const { page } = ctx;
    await open(ctx, '/films/savoy', { settle: 3000 });
    const NEXT_ITEM = '[data-nextcms="w"] > .previousnext-item'; // app.js shows only the item after the current film
    await ctx.wheel(ctx.height * 12); // the block sits right above the footer: go to the bottom first...
    await ctx.settle(SETTLE);
    await bringIntoView(ctx, NEXT_ITEM); // ...then centre the visible next item
    await page.mouse.move(ctx.width - 2, Math.round(ctx.height / 2));
    await ctx.settle(600);
    await snap(ctx, '01-next-block');
    if (!ctx.mobile) await hoverShot(ctx, '02-hover-all-work', '.s.next-proj .all-work-cta-w');
    const link = await visibleBox(ctx, `${NEXT_ITEM} a.next-link`);
    if (!link) throw new Error('no visible next-project link');
    const lx = link.x + link.width / 2;
    const ly = link.y + link.height / 2;
    await page.mouse.move(lx, ly, { steps: 4 });
    await ctx.settle(1500); // hover zoom + Taxi prefetch of the next page
    await snap(ctx, '03-hover-next');
    // Warm the next page's hero images with the same src/srcset/sizes app.js will render, so the frames after the
    // swap do not depend on CDN latency (LIVE) vs disk (MIRROR/REPLICA); Taxi itself only prefetches the HTML.
    const href = await page.evaluate(
      (sel) => [...document.querySelectorAll(sel)].find((a) => a.getBoundingClientRect().width > 0)?.href, // visible item only
      `${NEXT_ITEM} a.next-link`,
    );
    await page
      .evaluate(async (href) => {
        const doc = new DOMParser().parseFromString(await (await fetch(href)).text(), 'text/html');
        const imgs = [...doc.querySelectorAll('[data-cs="herow"] img')];
        await Promise.all(
          imgs.map(
            (src) =>
              new Promise((res) => {
                const im = new Image();
                if (src.getAttribute('sizes')) im.sizes = src.getAttribute('sizes');
                if (src.getAttribute('srcset')) im.srcset = src.getAttribute('srcset');
                im.src = src.getAttribute('src');
                im.decode().then(res, res);
                setTimeout(res, 15000);
              }),
          ),
        );
      }, href)
      .catch((e) => ctx.log.push(`[scenario-note] next hero preload failed: ${e.message}`));
    const next = new URL(href).pathname.split('/').pop();
    await page.mouse.click(lx, ly);
    // Frames are anchored on the DOM swap (new view in, old view out), not on the click: the leave phase length
    // depends on how fast the cached Taxi fetch resolves, and every extra screenshot shifts later timestamps.
    await page
      .waitForFunction(
        (slug) => document.querySelectorAll('[data-taxi-view]').length === 1 && document.querySelector(`[data-taxi-view][data-case="${slug}"]`),
        next,
        { polling: 'raf', timeout: 20000 },
      )
      .catch(() => ctx.log.push('[scenario-error] Taxi swap to the next film not detected'));
    const t1 = Date.now();
    await ctx.shot('04-swapped', SHOT_OPTS); // old view gone, new view mounted while the wrapper is still hidden
    // the hidden plateau lasts ~600 ms (swap ~0.2 s after the click, fade-in from ~0.8 s): flag a late capture
    const opacityAfter = await page.evaluate(() => +getComputedStyle(document.querySelector('[data-taxi]')).opacity);
    if (opacityAfter > 0.02) ctx.log.push(`[scenario-note] 04-swapped may be late: wrapper opacity ${opacityAfter.toFixed(2)} right after the shot (machine under load?)`);
    // No frame is taken during the fade-in itself (wrapper autoAlpha 0 -> 1, delay .6 s, .8 s; hero/nav reveals):
    // GSAP lag-smoothing and screenshot latency vary with how many images the new view decodes at that moment
    // (all at once from disk on MIRROR/REPLICA, trickling in from the CDN on LIVE), so mid-fade frames measured
    // 0-95% apart between identical sites. The motion is covered by the video; the shots keep the stable plateaus.
    await page.waitForTimeout(Math.max(0, t1 + 4000 - Date.now()));
    await page.mouse.move(ctx.width - 2, Math.round(ctx.height / 2));
    await snap(ctx, '05-arrived');
    const url = new URL(page.url());
    ctx.log.push(`[scenario-note] after next click: ${url.pathname}`);
    if (url.pathname !== '/films/moon-in-the-12th-house') ctx.log.push(`[scenario-error] unexpected next URL ${url.pathname}`);
  },
});

// Short screen recording (< 20 s) of a savoy scroll-through at 1440x900; shots are the same states, faster cadence.
scenarios['film-scrollvideo-savoy'] = scenario({
  viewports: ['1440x900'],
  video: true,
  async run(ctx) {
    await open(ctx, '/films/savoy', { settle: 2500 });
    await scrollThrough(ctx, { group: '02-scroll', settle: 1100, shots: false });
    await snap(ctx, '03-bottom');
  },
});

export default scenarios;
