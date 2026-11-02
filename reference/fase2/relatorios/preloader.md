# Home intro without the Siena mark: decision report

Scope: read-only on both projects. Every test ran headless on this PC (Edge 156, Chrome 151, Playwright WebKit), against the production build on 4322, with the page rewritten in flight. Scratch files are in this folder; `proto/` holds the working prototype.

## 1. Recommendation

**Option C: no video. Bars as CSS `transform` animations, plus a mask derived from `simbolo.png`.** Keep one empty `<video>` in `.preloader-w`, because `app.js` throws without it.

Why, in order of weight:

1. **It is the only option that leaves the path that stalled.** Every candidate file got `kVideoDecoderName=D3D11VideoDecoder`, `kIsPlatformVideoDecoder=true`: new H.264, VP8 and VP9, on Edge and Chrome (section 4). A and B do not get away from the hardware decoder. C uses no decoder.
2. **ENTER does not move.** Median clean visit 3,737 ms current against 3,751.5 ms prototype, n=8 each, Edge at 1440×900. `ll` drives ENTER from a `setTimeout`, not from the video.
3. **The rhythm is reproducible with numbers.** The bars follow a sine ease to within 0.34% of a period (RMS). The prototype's bar width is within 0.77 percentage points on average of the original's.
4. **It keeps moving when the main thread is blocked.** During a forced 1,200 ms block, CSS bars produced 103 distinct widths in 120 frames. A `requestAnimationFrame` control produced 2.
5. **Weight falls from 5.79 MB to about 18 KB.**

What C costs: 44 extra `<i>` elements, and a reveal that sweeps across the symbol instead of flipping letter by letter. It also has no real-iPhone or visible-window test yet (section 10).

## 2. What the videos do

Contact sheets: `intro-desktop.png`, `intro-mobile.png`, `intro-tutorial.png`, `intro-animated.png`. Close-ups: `intro-desktop-zoom.png`, `intro-mobile-zoom.png`, `intro-tutorial-zoom.png`. x-t diagram: `intro-kymo.png`. Measured frame by frame at 60 fps (`intro-timeline.json`, `intro-curves.json`, `intro-onset.json`).

| Beat | `logo_intro_desktop.mp4` (2160×1440, 60 fps, 4.05 s, 243 frames) | `intro_mobile.mp4` (1080×1920, 60 fps, 3.18 s, 191 frames) |
|---|---|---|
| Solid cream field (about 252/246/238) | 0.00–0.10 s | 0.00–0.10 s |
| Dark bars appear as hairlines | 0.10 s, black by 0.30 s | 0.10 s, black by 0.30 s |
| Bars widen in place | 0.10–2.45 s | 0.10–2.05 s |
| Bar geometry | 32 bars, period 67.5 px (3.125% of the video width) | about 20 bars, period 52.45 px (4.86%) |
| Bar width curve | sine in-out over 0.01–2.57 s, RMS 0.34% of a period, max 0.79% | sine in-out over 0.01–2.14 s, RMS 0.35%, max 1.19% |
| Mark appears, only by inverting the bars inside its shape | about 0.62–1.25 s | about 0.50–1.05 s |
| Mark grows | about 0.90 to 1.00 of final size, 0.7–2.5 s | about 0.905 to 1.00, 0.6–1.9 s |
| Last hairlines dim out | 2.30–2.48 s | 1.90–2.08 s |
| Pure black background, solid white mark | from 2.50 s | from 2.10 s |
| Second line ("FILM FOUNDATION") blurs in | 2.50–2.85 s, settled by 3.0 s | 2.20–2.45 s |
| Still hold | 3.0–4.05 s | about 2.5–3.18 s |
| Last frame | wordmark and second line on `#000` | same |

Share of bar width at sample times, desktop: 9% at 0.5 s, 33% at 1.0 s, 64% at 1.5 s, 89% at 2.0 s, 98% at 2.3 s.

Where the Siena text is:
- The wordmark is legible in fragments from about 0.7 s and in every later frame. The second line is there from 2.5 s. Trimming cannot save the rhythm, because the mark is inside about 85% of the running time.
- `animated_logo_black.mp4` (3840×2160, 6.77 s) is the same idea and also shows the wordmark. Only `data-src` names it, and `app.js` never reads that.

Correction to the docs: `docs/TEMA.md:64` and `tema-sinal.css:333-335` say the last frame is black. Its background is black (`0/0/0` measured), but the frame carries the white mark. The test card disappears because multiply over black is black, and the white window sits behind the mark.

**`tutorial-final.mp4` shows the brand and the films.** It is an 18.4 MB, 22.8 s screen recording of the Siena home:
- The Siena wordmark at top left in the full-page moments, for example at 0.2 s.
- Film frames and titles: ANA MAXIM, SAVOY, MOON IN THE 12TH HOUSE, TABOO, KAFKA'S LAST TRIAL, FREUD THE OUTSIDER.
- Review quotes with five-star rows, the film menu, and "©2024, SIENA FILM FOUNDATION" in the open nav at about 16–17.5 s.

It breaks three Fase 2 rules at once (brand, demo films, stars) and has to go too. See section 8.

## 3. What `app.js` needs

`public/assets/js/app.js:478`, class `ll`:

```js
this.video=this.wrapper.querySelector("video"),
this.btn=this.wrapper.querySelector('[data-preloader="btn"]'),
this.video.muted=!0,this.video.autoplay=!0,L.set(this.video,{opacity:0}),
this.shouldShowPreloader()?(L.to(this.video,{opacity:1,duration:.1}),setTimeout(()=>{this.showButton()},3500)):this.closePreloader()
```

- **A `<video>` must exist.** Tested with none: `TypeError: Cannot set properties of null (setting 'muted')`. It runs at module evaluation (`jm?new ll(jm):...`), before `ii` is defined, so the whole runtime dies. The watchdog logged `app-script-threw` at 370 ms and `fallback-enter` at 3,647 ms.
- **An empty `<video>` is enough.** Tested with no `src`: no page error, no console error, `networkState` 0, ENTER normal, click normal.
- **ENTER depends only on `app.js` running:** 3,500 ms, then GSAP's default 0.5 s `autoAlpha`. The video is not involved.
- **Only the first `video` is touched**, which is the desktop one. On phones the original never reset the mobile video.
- **With a fresh `preloader_shown` cookie** it closes at once with a 0.3 s fade, so a CSS intro must be hidden before first paint on that path.
- **`local-preloader.js` is safe:** `visibleVideo()` returns null when every video is `display:none`, and `watchVideo` returns at line 197. Its log stayed clean apart from `enter-accepted`.
- **`.preloader-video{mix-blend-mode:lighten}`** (`src/pages/index.astro:17`) exists only to keep the video out of the failing path. **`.preloader-video{filter:grayscale(1)}`** (`tema-sinal.css:336`) exists only to neutralise the cream. Neither has a job without a video.

## 4. Options: evidence

### Decoder path of each candidate

`proto/play.mjs`, real page with `app.js` booting, read through CDP `Media`. Results in `proto-play.txt`, `proto-play.json`; n=4 per file per browser.

| File | Bytes | Decoder in Edge | Decoder in Chrome | `DECODER_UNDERFLOW` |
|---|---|---|---|---|
| Original `logo_intro_desktop.mp4` | 4,997,829 | D3D11VideoDecoder 4/4 | D3D11VideoDecoder 4/4 | 0/8 |
| A: H.264 at 5 Mbps target | 1,516,940 | D3D11VideoDecoder 4/4 | D3D11VideoDecoder 4/4 | 1/8 (Edge, 177 frames dropped) |
| A: H.264 at 2 Mbps target | 1,226,411 | D3D11VideoDecoder 4/4 | D3D11VideoDecoder 4/4 | 0/8 |
| B: VP8 at 5 Mbps target | 1,536,387 | D3D11VideoDecoder 4/4 | D3D11VideoDecoder 4/4 | 0/8 |
| B: VP8 at 2 Mbps target | 713,896 | D3D11VideoDecoder 4/4 | D3D11VideoDecoder 3/3, one attempt gave no data | 1/7 (Chrome, 4 events, 17 frames dropped) |
| B: VP9 at 2 Mbps target | 796,222 | D3D11VideoDecoder 4/4 | D3D11VideoDecoder 4/4 | 0/8 |

Read this as a path result, not a ranking. The samples are small and two attempts are not a rate. An earlier, busier batch also gave a watchdog nudge on the original in Chrome. One cut-short VP8 load in that batch reported `VpxVideoDecoder` with 4 frames, so VP8's route may vary. It did not repeat in the 15 VP8 attempts with data above.

### A: new H.264 MP4, same size, duration and fps

- **ffmpeg route is closed.** `ffmpeg-1013` has only `libvpx-vp9` and `png` encoders. `ffmpeg-1011` has only `libvpx` (VP8) and `png`. Neither has H.264 or an MP4 muxer (the build configuration lists `--enable-muxer=webm` and `image2` only).
- **WebCodecs works.** `wc-probe.mjs`: `avc1.42E033`, `avc1.4D0033` and `avc1.640033` all report supported and really encode at 2160×1440 in headless Edge and Chrome. `prefer-hardware` is not supported, so this is software. All three labels gave byte-identical output in the 12-frame test (127,023 bytes); only the label in the config changes.
- **End to end works.** `proto/encode.mjs` produced 243 chunks with 5 key frames in 2.6 and 10.9 s of wall time. `mp4-info.cjs` reads it as 2160×1440, 60.00 fps, 4.050 s, level 5.1, POC type 2, 1 reference frame, no reordering. The original has 4 reference frames and reordering. The simpler stream might behave differently in the real failure, but nothing here shows it.
- **`mp4-muxer` is acceptable as a one-off tool, not a site dependency.** Version 5.2.2, MIT, 156 KB unpacked, only `@types` dependencies, marked deprecated in favour of Mediabunny (1.65.0, MPL-2.0, 11.3 MB unpacked). Estimate: about 80 lines of tool and 2–3 hours, plus a repeat of the whole real-browser validation.
- **Consequences.** It keeps `lighten`, the watchdog, the autoplay failure states, and two files to produce. The README already records `DECODER_UNDERFLOW` returning 6 of 6 with the current fix and the GPU busy at 1440 px.

### B: VP8 or VP9 WebM

- Encodes fine with Playwright's ffmpeg and needs no npm package: JPEG frames into `image2pipe`, 22–25 s for the file.
- It is the same decoder on this PC (table above), so it adds no stability.
- Safari is worse. caniuse lists WebM on iOS as partial from 12.2 to 17.3 and full from 17.4, and macOS Safari as full from 16.0. In practice that means an MP4 fallback too, which brings A's work back.

### C: no video

Prototype in `proto/lib.mjs`.

- **Stability.** With no media element playing there is no decoder state that can stall. Under a forced 1,200 ms main-thread block (`proto/block.mjs`, frames read from CDP screencast):

| Variant | Frames in the block | Distinct bar widths | Width at start → end |
|---|---|---|---|
| C: CSS transforms | 120 | 103 | 0.117 → 0.794 |
| Control: same bars from `requestAnimationFrame` | 120 | 2 | 0.168 → 0.171 |
| Current video | 72 | 60 | 0.013 → 0.606 |

  The control matters because real `app.js` long tasks land in the intro's first second. Clean attempts showed 130–300 ms tasks at about 120–640 ms. So a canvas or gradient-repaint version would visibly stutter. Bars must be `transform` on separate elements.
- **No throw.** No page or console errors in 30 full flows after the first batch: 24 in Edge, 6 in Chrome. Flows covered first visit, cached visit, ENTER and home. WebKit was only loaded for stills.
- **ENTER unchanged.** See section 5.
- **Late or missing mask is safe.** With the mask delayed 2 s or returning 404, Edge and Chrome draw the bars and no rectangle or inverted panel appears. WebKit with a 404 behaves the same. The only side effect of a 404 is a console resource error. `intro-c-mask.png`.

## 5. Comparison

Runs from `proto/rt.mjs`, real clock, 1440×900, only the HTML and mask replaced through raw CDP `Fetch` so the HTTP cache stays on. Current and prototype attempts interleaved.

| Median (range), ms | Current | C, no start delay |
|---|---|---|
| Edge, clean, n=8: ENTER starts | 3,737 (3,691–3,830) | 3,751.5 (3,702–3,812) |
| Edge, cached, n=8: ENTER starts | 3,756.5 (3,726–3,824) | 3,783.5 (3,735–3,828) |
| Edge, clean: home visible after click | 1,842.5 | 1,838.5 |
| Edge, cached: home visible after click | 1,828 | 1,845.5 |
| Edge, clean: intro starts | 433.5 (326–607) | 103.5 (91–127) |
| Edge, cached: intro starts | 1,017 (816–1,140) | 192 (168–236) |

C starts earlier, so a start delay is needed to keep ENTER in the same place within the intro. `--atraso:.33s` gives:

| Intro time when ENTER starts, median (range), ms | Current | C with 0.33 s delay |
|---|---|---|
| Edge, clean, n=4 | 3,290 (3,212–3,312) | 3,285 (3,266–3,348) |
| Chrome, clean, n=3 | 3,265 (3,073–3,306) | 3,293 (3,282–3,321) |
| Edge, cached, n=4 | 2,777 (2,673–2,803) | 3,248.5 (3,230–3,276) |
| Chrome, cached, n=3 | 2,788 (2,717–2,901) | 3,248 (3,231–3,276) |

So C matches the first visit. On a cached visit it is about 0.47 s further along than the current video, because the current video starts about 0.6 s later when cached. I matched the first visit deliberately.

A first batch while the machine was busy (other sessions, Brave, GPU at 59%) had outliers on both sides, up to 12.66 s current and 14.96 s prototype for ENTER. The second value equals the watchdog's 15 s limit, so `app.js` was late. I discarded that batch and did not investigate further; the 30 later attempts of C peaked at 3,832 ms.

| Criterion | A: new H.264 | B: VP8/VP9 WebM | C: CSS and mask |
|---|---|---|---|
| Stall on real Chrome and Brave | Same decoder measured; not tested in a real window | Same decoder measured; not tested in a real window | No decoder involved, so that failure cannot occur; not yet run in a real window |
| Keeps `lighten` and watchdog video code | Yes | Yes | No |
| Weight, desktop file | 1.2–1.5 MB | 0.7–1.5 MB, plus MP4 fallback | 16,766 B mask, 3,605 B CSS (1,272 gzip), 593 B markup |
| First-visit video bytes, for reference | 5,791,523 B measured today, because both variants download | same pattern | None |
| Black before first picture | Waits for video data | same | Fixed by the CSS delay; needs no media data |
| Safari and iOS | Plays, but autoplay is refused in Low Power Mode per WebKit bug 216887 (open, NEW) | Needs iOS 17.4+ for full support, else fallback | No media; rendered correctly in Playwright WebKit; not on a device |
| Reduced motion | Ignored today; needs extra code | same | One media query, tested |
| Resize across a breakpoint | Swaps to another file | same | CSS only |
| Maintenance when the mark changes | Re-encode two files | same | Replace one mask |
| Slow network | ENTER may arrive before the video | same | Only needs the CSS and 17 KB |

## 6. Reproducing the rhythm with the symbol

Stills: `intro-compare-1440.png`, `intro-compare-1920.png`, `intro-compare-390.png` (current on top, C below, same instants). `intro-c-quality.png` shows native pixels, `intro-c-viewports.png` eight sizes, `intro-c-webkit.png` WebKit.

| Beat | Desktop | Phone (≤991 px) | How |
|---|---|---|---|
| Start hold on black | 0.33 s | 0.33 s (not measured on phones) | `--atraso` |
| Field fades in | 0.1 s | 0.1 s | `ab-entra`, replaces `L.to(video,{opacity:1,duration:.1})` |
| Bars widen | 2.56 s from 0.01 s | 2.13 s from 0.01 s | `scaleX(0)` to `scaleX(1.02)`, `cubic-bezier(.37,0,.63,1)` |
| Bar period | 4.6875vw below 1800 px, 3.125vw from 1800 px | 5.9vw | Matches the video's displayed size: 150vw wide below 1800 px, 100vw from 1800 px |
| Mark revealed by inverted bars | sweep from 0.74 s, 0.50 s long | sweep from 0.60 s, 0.42 s long | Sliding window: two opposed `translateX` |
| Mark grows 0.90 to 1.00 | from 0.62 s, 1.83 s long | from 0.50 s, 1.41 s long | `scale` on the mask, inverse `scale` on the comb inside so bars stay aligned |
| Name blurs in | 2.50 s, 0.45 s long | 2.20 s, 0.45 s long | `opacity` and `filter:blur` |
| Hold | until ENTER | until ENTER | Nothing animates |

Why inside and outside stay locked: inside the mask the layer is black with white bars, using the **same keyframes and timing** as the outer black bars. The inside is therefore the exact inverse at every instant, with no per-frame calculation. Bars end at `scaleX(1.02)` to overlap, so no seam survives.

Measured against the original (`proto/rhythm.mjs`, `proto-rhythm.json`):

- Bar width error: desktop mean 0.77 points, max 1.86. Phone mean 1.39, max 4.20, mostly because a 23 px period at DPR 1 quantises the reading.
- Mark reveal, % of final:

| t (s) | 0.7 | 0.8 | 0.9 | 1.0 | 1.1 | 1.2 | 1.3 |
|---|---|---|---|---|---|---|---|
| Desktop, video | 2 | 12 | 23 | 46 | 70 | 82 | 88 |
| Desktop, C | 0 | 4 | 34 | 57 | 74 | 87 | 90 |
| Phone, video | 16 | 35 | 66 | 83 | 89 | 91 | 93 |
| Phone, C | 21 | 53 | 75 | 90 | 93 | 86 | 95 |

The real difference is in the shape. The original flips each letter in its own short wipe with a stagger; C sweeps once across the symbol. The dip in the phone C values (86 at 1.2 s) is probably a measuring artefact of 1 px bar steps; I did not isolate it.

Size: mask side `--s` gives a shape height of 0.78 `--s`: 22vw below 1800 px, 15vw from 1800 px, 46vw on phones. Those match the heights of the theme's current window. The shape is 639×798 in the 1024 file, centred within 1.2%.

**Mask, not a redraw.** `mask-make.cjs`: alpha is the source luminance with levels 24→0 and 232→255, RGB white. Mean difference against the source luminance is 0.60/255, and the antialiased edge stays. The file has noise at 1–8 (57,421 px), which the floor removes. Lossless WebP 16,766 B, round trip 0 difference; PNG 34,244 B. At DPR 2 the largest common draw is about 1,014 px, under its 1,024; it would upsample only at very wide CSS widths such as 3840 px.

## 7. Implementation outline

**1. Mask.** Copy the source to `reference/brand/simbolo.png`. Add `tools/make-simbolo-mask.cjs` from `mask-make.cjs` (levels 24/232, lossless WebP). Output `public/assets/img/site/simbolo-mascara.webp`.

**2. `src/data/home.ts:26-41`.** Remove `PreloaderVideo` and `videos`.

```ts
export const PRELOADER = {
  barrasFora: 33,   // covers 100vw at the smallest period
  barrasDentro: 11, // covers the symbol's width at any size
  nome: 'Filmes HD Online Grátis',
  enterLabel: 'ENTER',
};
```

The name is from the source project (`Projetos/FHDOG/src/lib/site.ts`). It takes the slot of the original's second line, and dropping it would remove a beat of the rhythm. Whether it stays is the owner's call.

**3. `src/components/home/Preloader.astro:12-22`.** Replace the two videos.

```astro
{/* app.js reads video.muted at construction: without this element the whole runtime stops. It has no source. */}
<video muted="" playsinline="true" class="preloader-video desktop"></video>
<div class="abertura" aria-hidden="true">
  <div class="ab-carta"></div>
  <div class="ab-comb ab-fora">{Array.from({ length: PRELOADER.barrasFora }, () => <i></i>)}</div>
  <div class="ab-simbolo"><div class="ab-janela"><div class="ab-contra">
    <div class="ab-comb ab-dentro">{Array.from({ length: PRELOADER.barrasDentro }, () => <i></i>)}</div>
  </div></div></div>
  <div class="ab-nome">{PRELOADER.nome}</div>
</div>
```

**4. `src/pages/index.astro:14-17`.** Remove the comment and the `lighten` style. Keep `local-preloader.js`. Add:

```astro
<link rel="preload" href="/assets/img/site/simbolo-mascara.webp" as="image" type="image/webp" data-local-replica />
<script is:inline data-local-replica>(function(){var m=/(?:^|; )preloader_shown=(\d+)/.exec(document.cookie);if(m&&Date.now()-m[1]<36e5)document.documentElement.classList.add('abertura-vista')})()</script>
```

The rule is the same as `shouldShowPreloader`. Tested: the class is set with a 60 s old cookie and not with a 2 h old one.

**5. `public/assets/css/tema-sinal.css:333-354`.** Replace block 7, and at line 376 change `.preloader-w::after` to `.abertura`. Tested CSS, with the real asset path:

```css
/* 7. Abertura sem vídeo: nenhum decodificador envolvido (ver README, "Inicialização da home"). */
.preloader-w { background-color: #000; }
.preloader-w .preloader-video { display: none; } /* vazio, só porque o app.js exige o elemento */
.preloader-cont { z-index: 1; }
.abertura-vista .abertura { display: none; }
.abertura { position: absolute; inset: 0; overflow: hidden; contain: strict;
  --p: 4.6875vw; --s: min(28.2vw, 64svh); --atraso: .33s; --ini: .01s; --fim: 2.56s; --rev: .74s; --revd: .5s; --cresce0: .62s; --cresce: 1.83s; --nome: 2.5s;
  --janela: 26vw;
  animation: ab-entra .1s linear var(--atraso) both; }
@media only screen and (min-width: 1800px) { .abertura { --p: 3.125vw; --s: 19.2vw; --janela: 18vw; } }
@media only screen and (max-width: 991px) { .abertura { --p: 5.9vw; --s: min(59vw, 74svh); --fim: 2.13s; --rev: .6s; --revd: .42s; --cresce0: .5s; --cresce: 1.41s; --nome: 2.2s; --janela: 54vw; } }
.ab-carta { position: absolute; inset: 0; background-repeat: no-repeat;
  background-image: linear-gradient(#fff, #fff), var(--faixa-smpte),
    linear-gradient(90deg, var(--smpte-azul) 0 14.2857%, #131313 0 28.5714%, var(--smpte-magenta) 0 42.8571%, #131313 0 57.1428%, var(--smpte-ciano) 0 71.4285%, #131313 0 85.7142%, var(--smpte-cinza) 0 100%),
    linear-gradient(90deg, #00214c 0 17.86%, #fff 0 35.71%, #32006a 0 53.57%, #131313 0 71.43%, #090909 0 76.2%, #131313 0 80.95%, #1d1d1d 0 85.7%, #131313 0 100%);
  background-size: var(--janela) var(--janela), 100% 67%, 100% 8%, 100% 25%;
  background-position: center, 0 0, 0 72.83%, 0 100%; }
.ab-comb { position: absolute; inset: 0; display: flex; justify-content: center; }
.ab-comb i { display: block; flex: none; width: var(--p); height: 100%; animation: ab-barra var(--fim) cubic-bezier(.37,0,.63,1) calc(var(--atraso) + var(--ini)) both; }
.ab-fora i { background: #000; }
.ab-dentro { background: #000; animation: ab-descresce var(--cresce) linear calc(var(--atraso) + var(--cresce0)) both; }
.ab-dentro i { background: #fff; }
.ab-simbolo { position: absolute; inset: 0;
  -webkit-mask: url(/assets/img/site/simbolo-mascara.webp) center / var(--s) var(--s) no-repeat;
  mask: url(/assets/img/site/simbolo-mascara.webp) center / var(--s) var(--s) no-repeat;
  animation: ab-cresce var(--cresce) linear calc(var(--atraso) + var(--cresce0)) both; }
.ab-janela { position: absolute; inset: 0; overflow: hidden; animation: ab-janela var(--revd) linear calc(var(--atraso) + var(--rev)) both; }
.ab-contra { position: absolute; inset: 0; animation: ab-contra var(--revd) linear calc(var(--atraso) + var(--rev)) both; }
.ab-nome { position: absolute; left: 0; right: 0; top: calc(50% + var(--s) * .39 + 1.5vw); text-align: center; white-space: nowrap;
  font-family: var(--font-rotulo); font-size: max(.9vw, 10px); letter-spacing: .42em; text-indent: .42em; color: #fff; text-transform: uppercase;
  animation: ab-nome .45s ease-out calc(var(--atraso) + var(--nome)) both; }
@keyframes ab-entra { from { opacity: 0 } to { opacity: 1 } }
@keyframes ab-barra { from { transform: scaleX(0) } to { transform: scaleX(1.02) } }
@keyframes ab-janela { from { transform: translateX(calc(-50% - var(--s) * .32)) } to { transform: translateX(calc(-50% + var(--s) * .32)) } }
@keyframes ab-contra { from { transform: translateX(calc(50% + var(--s) * .32)) } to { transform: translateX(calc(50% - var(--s) * .32)) } }
@keyframes ab-cresce { 0% { transform: scale(.9) } 25% { transform: scale(.94) } 50% { transform: scale(.97) } 75% { transform: scale(.99) } 100% { transform: scale(1) } }
@keyframes ab-descresce { 0% { transform: scale(1.11111) } 25% { transform: scale(1.06383) } 50% { transform: scale(1.03093) } 75% { transform: scale(1.0101) } 100% { transform: scale(1) } }
@keyframes ab-nome { from { opacity: 0; filter: blur(10px) } to { opacity: 1; filter: blur(0) } }
@media (prefers-reduced-motion: reduce) {
  .ab-carta, .ab-fora, .ab-janela { display: none; }
  .ab-simbolo { background: #fff; transform: none; animation: ab-entra .4s linear both; }
  .ab-nome { animation: ab-entra .4s linear both; }
}
```

The theme's `--janela` is a single value here; the prototype spelled it as two (`--janela-l`, `--janela-a`), which is a rename only. Worth adding, not tested: `min(19.2vw, 64svh)` from 1800 px, an `@supports` guard that hides `.ab-simbolo` where masks are missing, and `:nth-child` rules that hide off-screen outer bars below 1800 px.

**6. `public/assets/js/local-preloader.js`.** Remove the video parts: comment lines 6–7, constants at lines 18–21, `videoNudges` at line 32, the functions at lines 175–239, the call at line 272, and the `lastMove` reset at line 265. **Keep `var started` (line 187): `watchEnter` uses it.** Keep everything else: failed textures, WebGL loss, fallback ENTER, ENTER guard, home release. The README's failure table loses its first two rows.

**7. Files and docs.**
- Delete `logo_intro_desktop.mp4`, `intro_mobile.mp4`, `animated_logo_black.mp4`.
- **Trap:** `tools/sync-assets.mjs` catalogues the original site and downloads what is missing, so running it brings the Siena videos back. Remove them from its catalogue, `assets-manifest.json:8067,8085,8122,8212` and `ASSETS.md:115-123`.
- Update `docs/TEMA.md:61,64`, `docs/INVENTORY.md:206,355`, `docs/pages/home.md:567-568,593`, `README.md` ("Inicialização da home", line 480).
- `verify:dom` will flag `.preloader-w` by design.
- **Kit trap:** Playwright's fake clock does not drive CSS animations, and the scenarios seek `<video>` elements (`tools/scenarios/10-home.mjs`, `40-pages.mjs`, `62-motion.mjs`, the `home-intro` scenario in `tools/theme-snapshot.mjs`). Pin the intro with `document.querySelector('.abertura').getAnimations({subtree:true})`, as `seekAll` in `proto/lib.mjs` does.

## 8. Theme mapping and the tutorial

**Multiply test card.** Over a two-tone picture, multiply is the same as opaque black bars over the static card: white times C is C, black times C is black, and an antialiased edge `(1-a)C` is the same both ways. Measured (`proto/more.mjs multiply`), multiply layer against opaque layers at five instants at 1440×900: **0 of 1,296,000 pixels differ by more than 2/255, max difference 1.** So:

| Current | Option C |
|---|---|
| `.preloader-video{filter:grayscale(1)}` | Gone; bars are pure `#000` |
| `.preloader-w::after` with `mix-blend-mode:multiply` | `.ab-carta`, same gradients, no blend |
| Video luminance | `.ab-fora i`, black, over the card |
| `.preloader-video{mix-blend-mode:lighten}` | Gone |
| Neutral window 40×22vw, 27×15vw, 58×30vw | Same technique, square: 26vw, 18vw, 54vw |

C therefore has no blend mode and no filter in the bars phase. `intro-janelas.png` compares window shapes. I recommend the square window: the wide one leaves the symbol adrift, and with no window the symbol competes with the colour bars. This is a visual call for the owner.

**Tutorial.** It uses its own `<video>` (`Tutorial.astro`), hidden at ≤991 px, and `app.js` calls `this.video.play()` 2 s after ENTER. Tested with the `src` removed: no error, no unhandled rejection, `networkState` 0, hints and CLOSE work. The panel keeps an empty dark area (`intro-c-tutorial-empty.png`).

Recommended sequence:
1. In the same change, delete `tutorial-final.mp4` and leave the element without a source, so no Siena frame ships.
2. Once the new home exists, re-record a short demo for the panel, which is only about 340 px wide, using the option A pipeline (it is proven here) and put it through the real-browser gates.
3. If no recording is wanted, reduce the empty area in CSS.

The tutorial video's own stall behaviour was not part of this work.

## 9. Validation still required

These need visible windows, so they wait for the owner to allow them (`reference/captures/home-init/`, memory notes on window behaviour apply).
1. Chrome and Brave, real windows, 1440×925, 1536, 1920, 2560; 12 clean and 12 cached each. Gate: no errors, ENTER median within 50 ms of the table above, home visible within 50 ms. The "video until the end" columns are replaced with screencast evidence that the bars move.
2. Same, with the GPU busy (`gpu-hog.html`) when the owner is away. Expected: lower frame rate at worst, always reaching the final state. Not a freeze.
3. A real iPhone in Safari, with Low Power Mode on and off, plus a Mac Safari. Check the mask, the alignment of inner and outer bars, and memory.
4. `grep -r "logo_intro\|intro_mobile\|animated_logo\|tutorial-final" dist` returns nothing.

If iOS shows a problem with animated layers inside a mask, the fallback is simple: keep the outer bars and show the symbol as a plain fade at the reveal time, dropping the inner comb. Rhythm survives; the inversion does not.

## 10. Not verified

- **Real visible Chrome and Brave windows.** Excluded by the brief. C's "cannot stall" comes from having no decoder, not from a run in the conditions where the stall occurs. The stall's mechanism remains a hypothesis per the README.
- **A's and B's stall rate in real windows.** Their simpler stream structure might change it. Only the decoder path was measured.
- **Real Safari, iOS, Low Power Mode, device memory.** Playwright WebKit on Windows rendered it correctly at desktop and iPhone-emulated sizes. That is not iOS compositing, and the search found no source on whether Safari keeps an animated child on the compositor under a masked parent. WebM and autoplay statements come from caniuse and WebKit bug 216887.
- **Firefox.** Not installed here.
- **Hidden tab and busy GPU for C.** Hidden tab: Playwright's focus emulation would not prove it. Busy GPU: not run, to avoid slowing the owner's PC.
- **Other GPUs and drivers**, for the decoder path.
- **Visual quality of the A and B files.** They were only measured for size and path, since neither is recommended.
- **The 0.33 s start delay on phones.** Measured at 1440×900 only.
- **`tutorial-final.mp4` download size at load.** It appears as an aborted request when the page closes; I did not measure how much is fetched.

## 11. Files

Scratch folder `C:/Users/Usuario/AppData/Local/Temp/claude/C--Users-Usuario-Desktop-FHDOG/81789070-6ca0-404a-8dc3-8f2a84b50875/scratchpad/f2`:

- Prototype and tests: `proto/lib.mjs`, `proto/sheet.mjs`, `proto/zoom.mjs`, `proto/rt.mjs`, `proto/block.mjs`, `proto/ret.mjs`, `proto/more.mjs`, `proto/rhythm.mjs`, `proto/play.mjs`, `proto/encode.mjs`, `proto/sum.cjs`
- Measuring: `intro-extract.mjs`, `intro-timeline.mjs`, `intro-curves.mjs`, `intro-onset.mjs`, `intro-kymo.mjs`, `fit.cjs`, `wc-probe.mjs`, `tut-frames.mjs`, `mask-make.cjs`
- Mask candidates: `simbolo-1024.webp`, `simbolo-1024.png`
- Encoded samples: `enc/`
- Data: `proto-rt-msedge.json`, `proto-rt-msedge-atraso.json`, `proto-rt-chrome-atraso.json`, `proto-play.txt`, `proto-block.json`, `proto-rhythm.json`

Sources: [caniuse WebM](https://caniuse.com/webm), [WebKit bug 216887](https://bugs.webkit.org/show_bug.cgi?id=216887), [Chromium animation README](https://chromium.googlesource.com/chromium/src/+/2f7dfeb1/third_party/blink/renderer/core/animation), [web.dev on animation performance](https://web.dev/articles/animations-overview).
