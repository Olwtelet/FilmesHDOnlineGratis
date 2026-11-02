# Fase 2: runtime of preloader, trailer, case and about modules, sounds

Read-only investigation. Nothing in either project was changed and no server was started or stopped. Tests ran in headless Edge (Playwright 1.64, SwiftShader) against the production build on `localhost:4322`. DOM variations were injected by rewriting responses in the browser (`page.route`). Scripts, prototypes and screenshots: `scratchpad/f2/runtime-case-scratch/` (`t1`..`t14`, `proto-trailer-3.js`, `proto-trailer-3.css`).

Each claim is marked **[measured]** (seen at runtime) or **[code]** (read from the bundle, not run). Bundle locations are `app.js:line:column`; the bundle has very long lines. `webflow.css` and `main.css` are one line each, so they are cited by selector.

---

## 0. The findings that change the plan

1. **Without a source, the `<video>` must have no `src` attribute at all.** `src=""` makes `video.src` return the page URL, which is truthy, so `play()` rejects. With no attribute, app.js never calls `play()` on the trailer. No script is needed to stop errors. [measured]
2. **With no source, `setupVideo()` never runs, so the darken layer does not close the dialog.** A local script has to bind it. [measured]
3. **Escape is broken in the original.** While open, it leaves the nav hidden and `isOpen` wrong. While closed, it inverts `.open`, and the next open shows no player, with darken on and scroll stopped. [measured]
4. **An empty gallery kills the whole page runtime.** `/films/thehousewife` already crashes this way today. So does removing the caption element from strip 2, randomly. [measured]
5. **The fake critic captions and the DIRECTOR'S CUT badge are never visible.** They are `display:none` in `webflow.css`, but the caption element has to stay, empty, or the runtime crashes. [measured]
6. **The theme's `body::after` (scanlines and vignette, z-index 2147483645) sits in front of the player.** It must be off while the dialog is open, or it is exactly the overlay the YouTube policy forbids. [measured]
7. **Hero rules depend on slug length, not on title lines.** Five real titles would get a rule through the middle of the text. Rules = lines + 1 aligns exactly, and line counts are stable across breakpoints, so a build-time value works. [measured]
8. **`sg()` uses `<figure` as the delimiter of the home review chunks.** Removing the star images must keep an empty `<figure>`, or the parallax chunks are lost. [measured]
9. **The only SVGs with words are two logos.** `svg-logo` says SIENA / FILM FOUNDATION and `LOGO_MARK_D` says SIENA. Ticket headings, the DIRECTOR'S CUT label and everything on /about are real HTML text. `dc-svg` and `collab-svg` hold no words. [measured]
10. **The intro and tutorial videos carry Siena in the frames.** The intro from 0.9 s to the end, including the last frame. The tutorial is a screen recording of the Siena site. The theme's bars need bright pixels under them, so removing the video also removes the bars. [measured]

---

## 1. Preloader and tutorial

### 1.1 Module `ll` (`app.js:478:44668`), created at `app.js:478:45796`

```js
// pretty-printed
constructor() {
  wrapper = document.querySelector('[data-preloader="w"]');
  this.video = wrapper.querySelector("video");           // first video only
  this.btn = wrapper.querySelector('[data-preloader="btn"]');
  this.video.muted = true; this.video.autoplay = true;
  L.set(this.video, {opacity: 0});
  shouldShowPreloader()                                  // cookie preloader_shown older than 1 h, or absent
    ? (L.to(this.video, {opacity: 1, duration: .1}), setTimeout(() => this.showButton(), 3500))
    : this.closePreloader();
}
showButton()     { this.btn.onclick = () => this.closePreloader(); L.to(this.btn, {autoAlpha: 1}); }
closePreloader() { setCookie(...1 h); L.to(wrapper, {autoAlpha: 0, duration: .3, onComplete() { wrapper.remove(); P.PRELOADER_CLICKED = true; }}); }

var jm = document.querySelector('[data-preloader="w"]');
jm ? new ll(jm) : P.PRELOADER_CLICKED = true;
```

What it does with the videos:
- It touches only the **first** `<video>`: `muted`, `autoplay`, and an opacity tween of 0.1 s.
- It never calls `play()`. It has no `ended`, `canplay`, `error` or `display` logic, and it does not read `data-src`.
- The second video relies on its own `muted autoplay` attributes. It plays and downloads even while hidden by CSS: at 1440 px it was at `t=2.69` with `display:none`. [measured]
- Playback is independent of ENTER: the button appears on a fixed timer.

Videos [measured]:

| File | Size | Duration | Dimensions | Note |
|---|---|---|---|---|
| `logo_intro_desktop.mp4` | 5.0 MB | 4.05 s | 2160x1440 | cream, stripes, SIENA + FILM FOUNDATION from 0.9 s to the last frame |
| `intro_mobile.mp4` | 0.8 MB | 3.18 s | 1080x1920 | same sequence, vertical, SIENA + FILM FOUNDATION off-centre to the right, until the last frame (`t5-intro_mobile.png`) |
| `animated_logo_black.mp4` | 1.5 MB | 6.77 s | 3840x2160 | SIENA logo animation; only in `data-src`, never loaded by the page (`t5-animated_logo_black.png`) |

The last frame is **not** black: it holds the logo. `docs/TEMA.md:64` and `tema-sinal.css:333` say otherwise. It is black only outside the logo.

### 1.2 Timeline of ENTER

| Moment | Event | Effect |
|---|---|---|
| t0 | app.js runs (deferred) | video opacity 0→1 in 0.1 s |
| t0 + 3.5 s | `showButton()` | handler set, then `autoAlpha 0→1` (default 0.5 s). `.preloader-btn-w{visibility:hidden}` until then |
| click | `closePreloader()` | cookie, wrapper fades 0.3 s |
| click + 0.3 s | `wrapper.remove()`, then `P.PRELOADER_CLICKED = true` | event goes to the four listeners below |

Listeners of `PRELOADER_CLICKED` (`P` is a Proxy at `app.js:1:46478`, and every assignment emits):
- Page transition `al.checkLoadState` (`app.js:478:38604`): on home and work it also waits for `LOADED_WEBGL`, then fades `[data-taxi]` in over 0.8 s after a 1.4 s delay.
- Roll `Qn.onWebglLoaded` (`app.js:1:52284`): the spin.
- WebGL `Sa.animateIn`: canvas alpha to 1 with a 0.4 s delay.
- Tutorial `Ya.play`: 2 s later.

Measured in `nosrc`: handler at 4739 ms, visible at 5135 ms; the handler time includes page load, so it is only consistent with the 3.5 s timer. On the first cold load the machine was busy and the handler came at 23 s. It is a timer on a loaded main thread, not a guarantee.

### 1.3 Minimal DOM and failure cases [measured unless noted]

| Variation | Result |
|---|---|
| Both `<video>` without `src` | **No errors.** ENTER, close, cookie, home reveal and tutorial all normal. Black screen with ENTER only (`t4-nosrc-pre.png`) |
| No `<video>` in the wrapper | **`TypeError: Cannot set properties of null (setting 'muted')` at load: the bundle dies.** The `local-preloader.js` fallback shows ENTER and reveals the home without runtime |
| No `[data-preloader="w"]` at all | No errors. Home appears directly, tutorial 2 s after load, no `preloader_shown` cookie |
| No `[data-preloader="btn"]` | [code] `this.btn.onclick` throws inside the 3.5 s timer and nothing closes the overlay. `local-preloader.js` also dereferences `btn` on every click |

**Minimal DOM:** `[data-preloader="w"]` holding one `<video>` (it can have no source and be hidden) and one `[data-preloader="btn"]`. `.preloader-cont` and the two ENTER buttons are only visual.

### 1.4 What `local-preloader.js` watches

The script runs only if the wrapper exists (`:14-15`). What it does:
- **Texture images:** wraps `window.Image` in a Proxy so a failed texture becomes a transparent pixel, which lets app.js's `onload` run (`:41-57`).
- **`app.js` load and error:** `:63-79`.
- **Bundle errors at start-up:** `window` `error` events from `app.js` before its load event mean the runtime is dead (`:89-95`).
- **WebGL:** `webglcontextlost` shows the DOM images (`:88`).
- **ENTER:** a capture-phase guard so only the first click reaches the handler (`:98-109`).
- **Video, every 250 ms** (`watchVideo`, `:195-239`), on the first `<video>` with computed `display` other than `none`, across resizes:
  - `ended` or `error`: done.
  - Paused: one `play()` retry after 2.5 s, only if `readyState>=2` and not loading.
  - Playing but `currentTime` frozen 0.7 s with data ahead: two nudges, then a jump to the final frame.
- **ENTER timing** (`watchEnter`, `:241-254`): reveals the button at 6 s if its fade never finished, and shows a fallback ENTER if the runtime is dead or absent.
- **Home:** forces the reveal 12 s after ENTER (`HOME_LIMIT_MS`), or 120 s if a request never ends.

**Effect of a video without source [measured]:** `readyState` is 0, so the retry never fires and `visibleVideo` just keeps returning it. A hidden video makes `visibleVideo()` return null and the function returns. Either way the log had only `enter-accepted`. **The script needs no change.** `.preloader-video{mix-blend-mode:lighten}` in `index.astro:17` becomes dead code.

### 1.5 Removing every Siena frame: options

The Fase 1 pipeline is grayscale video + `.preloader-w::after` in `multiply` (`tema-sinal.css:338-348`). Multiply over black is black, so with no video **the SMPTE card disappears too** (`t4-nosrc-pre.png`).

| Option | Result | Cost |
|---|---|---|
| **A. CSS intro (recommended).** Keep `<video class="preloader-video" hidden-by-css>` with no `src` for `ll`. Add a bright striped layer under `::after`, animated with the same beats as the video: solid to 0.45 s, stripes narrowing to 2.24 s, black at 2.69 s. Put the FHDOG wordmark in the neutral window | Same pipeline and same SMPTE look. No frame of Siena. No 5.8 MB download. The stall that `local-preloader.js` fights in real Chrome and Brave has no video to stall on | Must be built. The mobile window `background-position:56% 50%` (`tema-sinal.css:353`) exists because the Siena mobile video was off-centre, so it goes back to centre |
| B. New MP4 or WebM with the same beats | Pipeline untouched | No `ffmpeg` on this machine (`which` found none). A headless `MediaRecorder` could make WebM. The stall problem stays |
| C. Keep the video and mask the logo with a black window | Rejected: the frames stay in the file, and `@media print` already shows that `::after` can be disabled | |
| D. Remove the wrapper | Works without errors, but loses ENTER and the first click that unlocks sound | Changes the structure |

Delete `logo_intro_desktop.mp4`, `intro_mobile.mp4` and `animated_logo_black.mp4`, and the `PRELOADER.videos` paths in `src/data/home.ts:37-38`.

### 1.6 Tutorial `Ya` (`app.js:478:53`)

Flow:
1. Constructor: if computed `display` is `none` (≤991 px, `.tutorial-wrapper`), the element is removed.
2. If cookie `tutorial_shown` exists, removed. Otherwise `yPercent:100`, `visibility:visible`, and it reads `close`, `texts` children, `video`.
3. `PRELOADER_CLICKED` calls `play()`: after 2 s, in this order: `animateIn()`, `setCookie()` (48 h), `this.video.play()`, `setInterval(playStep, 4800)`, first text to `yPercent:-100`.
4. Each step moves the current text to −200 and the next to −100. After the last text: `animateOut()` (1.8 s) and remove. Total on screen ≈ 4.8 s × number of texts.

Depends on: `[data-tutorial='w' | 'close' | 'texts' | 'video']`, `P.PRELOADER_CLICKED`, the cookie, and computed display. Nothing listens to the video, so its length does not matter (22.83 s for 5 × 4.8 s is coincidence by design).

| Variation [measured] | Result |
|---|---|
| `<video>` without `src` | **No error.** `play()` stays pending (`paused:false`, no rejection). Tips rotate normally. The box goes from 327x212 to 327x150, because the default ratio is 2:1 |
| `<video>` absent | `TypeError: reading 'play'` inside the timeout. `setInterval` and the first text never run, so **tips stay dead**. CLOSE still works |

`tutorial-final.mp4` (18.4 MB, 1668x1080) is a screen recording of the Siena site: logo, film titles, critics, stars, menus (`t5-tutorial-final.png`). It has to go.
- **Interim:** `<video poster="…">` with no `src`, and `.video-2{aspect-ratio:1668/1080}` so the card keeps its height. Zero risk.
- **Final:** record the finished FHDOG home with Playwright `recordVideo` in headless. WebM is enough, because the tutorial only exists above 991 px. It can only be done at the end, since it depends on the final UI.

---

## 2. Trailer player `Ia` (`app.js:470:29719`, selector `[data-videoplayer="wrapper"]`)

### 2.1 Elements

All are looked up with `document.querySelector`, so with `document` scope, in the class fields.

| Selector | Use | Required |
|---|---|---|
| `trigger` | `onclick = toggleState` | yes |
| `close` | `onclick`: unless `isOpening`, `toggleState` | yes |
| `dialog` | class `.open`, autoAlpha, later `onclick` | yes |
| `image` | poster: `render()` scale, needs an inner `img` | yes |
| `ui` | **`.children` read at field time**, so absent = TypeError that kills the runtime | yes |
| `video` | **first match in DOM order**: the `<video>` in the dialog | see trap |
| `darken` | autoAlpha, later `onclick` | yes |
| `bg`, `mask` | queried, never used | no |
| `scrub`, `data-vid=*` | only inside `setupVideo()`, except `play.classList` inside the `src` guard | no |

**Trap [code]:** `CaseTrailer.astro:87` has a second `data-videoplayer="video"` on `div.video-el`. If the `<video>` is removed, `this.video` becomes that div, and `closeModal()` calls `this.video.pause()` unguarded. The TypeError comes right after `B.scroll.start()` and stops the rest of the close. Keep the `<video>`.

### 2.2 Behaviour

```js
// constructor
this.video.src && (this.video.readyState === 4 ? this.setupVideo() : this.video.oncanplay = () => this.setupVideo());
document.addEventListener("keydown", t => { t.key === "Escape" && this.closeModal() });  // never removed; no destroy()

// toggleState
this.isOpen = !this.isOpen;
this.isOpen ? (openModal(), to(B.dom.menu.element, {autoAlpha: 0, duration: .6}))
            : (closeModal(), to(B.dom.menu.element, {autoAlpha: 1}));

// openModal
isOpening = true;
B.scroll.to(centre of wrapper); setTimeout(() => B.scroll.stop(), 500);
to(trigger, {autoAlpha: 0, duration: .2}); to(dialog, {autoAlpha: 1}); to(video, {autoAlpha: 1, delay: .6});
to(ui, {autoAlpha: 1, yPercent: 0, stagger: .12, duration: .5, delay: .4}); to(a, {scale: 1});
video.src && (video.play(), controls.play.classList.add("pause"));
dialog.classList.toggle("open");
await to(darken, {autoAlpha: .9, delay: .2}); isOpening = false;

// closeModal (returns at once while isOpening)
B.scroll.start(); video.pause(); to(video, {autoAlpha: 0}); to(trigger, {autoAlpha: 1});
to(ui, {autoAlpha: 0, yPercent: 150, duration: .4}); to(a, {scale: 0}); to(darken, {autoAlpha: 0, duration: 0});
await to(dialog, {autoAlpha: 0, duration: .02}); dialog.classList.toggle("open");
```

`.open` is **toggled, not set**. `isOpen` is only changed by `toggleState`, and Escape bypasses it.

Calls on the `<video>`:

| Call | Where | Guarded by `video.src`? |
|---|---|---|
| `src` (read), `readyState`, `oncanplay` | constructor, `oncanplay` fires `setupVideo` again on every re-buffer | it is the guard |
| `play()` | `openModal` | yes |
| `play()`, `pause()`, `paused` | toggle in `setupVideo` (controls and `dialog.onclick`) | runs only after `setupVideo` |
| `pause()` | `closeModal` | **no**, harmless on an empty video |
| `duration`, `currentTime`, `muted`, `ontimeupdate` | `setupVideo` (labels, scrub, sound, progress) | runs only after `setupVideo` |
| `ended`, `onerror` | never | |

`darken.onclick` and `dialog.onclick` (toggle play) are bound **only inside `setupVideo()`**.

### 2.3 Source states [measured on real pages]

| | `video.src` | `setupVideo` | Labels | On open | Darken click | X | Console |
|---|---|---|---|---|---|---|---|
| MP4 (`ana-maxim`) | file URL | yes | `00:26` | plays | closes | closes | clean |
| Empty: Astro prints bare `<video src …>` (`outsider-freud`) | **page URL** | no, error 4 | placeholder `6:29`, `00:10` | black, `play()` rejects | **nothing** | closes | `NotSupportedError: The element has no supported sources.` |
| YouTube URL as `src` (`by-any-means`) | that URL | no, error 4 | placeholder | same | **nothing** | closes | same |
| No `src` attribute | `""` | no | placeholder | black, no call | **nothing** | closes | **clean** |

So `CaseTrailer.astro:73` must emit `src={file || undefined}`. Today `src={trailer}` prints the bare attribute for `""`.

**Answer to "what must a local script do to stop errors from `play()`": nothing, if the attribute is absent.** Do not stub `HTMLMediaElement.prototype.play`.

### 2.4 Original bugs to neutralize [measured]

| Sequence | Result |
|---|---|
| Open, Escape | Dialog closes, **nav stays hidden**, `isOpen` stays true. Next trigger click only "closes" (state restored, nothing visible). The click after that opens |
| Escape with the dialog closed (any time, any page) | `.open` toggled on a closed dialog. **Next open: `display:none`, no visible player, darken on, Lenis stopped, trigger hidden, video playing.** With MP4 a darken click recovers. Without a source only Escape does |
| Open, click the logo (clickable while open: `elementFromPoint` hits its hitbox) | Taxi navigates and **`lenis-stopped` stays on the next page** |
| Taxi | [code] each `Ia` leaves its `keydown` listener on `document`, and there is no `destroy()` |

### 2.5 Design: YouTube inside the existing dialog, without editing the bundle

**Decisions:**
- **Mount:** a lazily created iframe in `.video-mask-w`, next to the `<video>`, which stays with no `src` and `display:none`.
- **Custom bar:** dropped, with `.video-bar:not(.top){display:none}`. It stays in the DOM because `[data-videoplayer='ui']` is required. A cross-origin player cannot be driven by it without the IFrame API, and it would sit over the player.
- **Keep from Siena:** open and close tweens, trigger fade, nav fade, darken, centred scroll, scroll stop, close button.
- **Close button outside the player rectangle:** beside it at ≥768 px, above it below that. In the served player, title, volume, CC and settings live at the **top right**, exactly where Siena's button sits. [measured, `t11-controls.png`]
- **Mask:** on desktop the film frame stays as a **black mat**, and the player is inset 3% so no pixel of it is cut. At inset 0 the frame cuts 33-38 px of the top row, 356-380 px of the bottom row (the edge is wavy), and 8-12 px at the control row. The minimum uniform inset is 2.0% (`isPointInFill` on the path). [measured]
- **Phones (≤767 px):** the mask goes. The player takes 100vw with `height:max(200px,56.25vw)`, because with the mask 390 px gave 334x188, below the 200 px minimum I recall from the IFrame API docs.
- **`body::after` off while open.** It paints scanlines, a vignette and noise over the player. `body::before` (the 3 px strip) stays, outside the player.
- **Logo not clickable while open.** It does not overlap the player at any tested size.
- **Delegated listeners:** Taxi swaps only `[data-taxi-view]` and does not re-run scripts unless they carry `data-taxi-reload` (`reloadJsFilter`, `app.js:478`), so listeners live on `document` and `window` and look nodes up at event time.
- **The iframe is removed on close** instead of paused: no JS API, audio always stops, and YouTube gets no request until someone clicks.

**Traps the iframe hits, both handled by the CSS:**
- `.abs{pointer-events:none}` is inherited through `.abs.videoplayer-video`.
- `main.css` has `.lenis.lenis-smooth iframe{pointer-events:none}`, active during smooth scroll. `lenis-smooth` is added while `isScrolling==="smooth"` (Lenis class, `app.js:478`).

**Astro side (`CaseTrailer.astro`):**
- `data-youtube={id}` on `[data-videoplayer="wrapper"]`, no `src` on the video.
- A film with neither a file nor an id must not show the CTA. Otherwise it opens an empty black dialog with the placeholder times (as `outsider-freud` does today).
- Load `local-trailer.js` on every page, from `BaseLayout`, since Taxi can arrive from any page.

**`local-trailer.js`** (tested; file `proto-trailer-3.js`):

```js
(function () {
  var q = function (s) { return document.querySelector(s); };
  var lastKeyWasTab = false;

  function mount() {
    var wrap = q("[data-videoplayer='wrapper']");
    var id = wrap && wrap.dataset.youtube;
    if (!id || wrap.querySelector('iframe')) return;
    var f = document.createElement('iframe');
    f.className = 'yt-trailer';
    f.title = wrap.dataset.youtubeTitle || 'Trailer';
    f.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
    f.referrerPolicy = 'strict-origin-when-cross-origin';
    f.src = 'https://www.youtube-nocookie.com/embed/' + encodeURIComponent(id) + '?autoplay=1&rel=0&playsinline=1';
    wrap.querySelector('.video-mask-w').appendChild(f);
  }
  function isOpen() { var d = q("[data-videoplayer='dialog']"); return !!d && d.classList.contains('open'); }
  function closeIfOpen() { if (isOpen()) q("[data-videoplayer='close']").click(); } // through toggleState: isOpen and nav stay in sync

  document.addEventListener('click', function (e) {
    if (e.target.closest("[data-videoplayer='trigger']")) mount();
    else if (e.target.closest("[data-videoplayer='close']")) {
      // app.js ignores this click during its 0.7 s opening; the player goes only when the dialog really closed
      setTimeout(function () { var f = q('iframe.yt-trailer'); if (f && !isOpen()) f.remove(); }, 150);
    } else if (e.target.closest("[data-videoplayer='darken']")) closeIfOpen();
  }, true);

  window.addEventListener('keydown', function (e) {
    lastKeyWasTab = e.key === 'Tab';
    if (e.key !== 'Escape' || !q("[data-videoplayer='dialog']")) return;
    e.stopImmediatePropagation();   // window capture runs first, so no Ia listener (current or stale) sees it
    closeIfOpen();
  }, true);

  window.addEventListener('popstate', closeIfOpen, true); // leaving while open would leave Lenis stopped

  window.addEventListener('blur', function () {           // see 2.6
    if (lastKeyWasTab) return;
    setTimeout(function () {
      var f = q('iframe.yt-trailer');
      if (!f || document.activeElement !== f || document.fullscreenElement) return;
      var d = q("[data-videoplayer='dialog']");
      d.setAttribute('tabindex', '-1');
      d.focus({ preventScroll: true });
    }, 400);
  });
})();
```

**Theme rules** (file `proto-trailer-3.css`):

```css
[data-youtube] .video-bar:not(.top) { display: none; }
[data-youtube] video[data-videoplayer='video'] { display: none; }
[data-youtube] .video-mask-w { position: relative; background: #000; }
iframe.yt-trailer { position: absolute; inset: 3%; width: 94%; height: 94%; border: 0; pointer-events: auto !important; }
[data-youtube] .video-bar.top { inset: 0 auto auto 100%; width: auto; height: auto; padding: 0 0 0 .75rem; }
[data-youtube] .close-btn { top: 0; }
.video-player-dialog.open:focus { outline: none; }
body:has(.video-player-dialog.open)::after { display: none; }
body:has(.video-player-dialog.open) .nav-link.logo { pointer-events: none; }
@media screen and (max-width: 767px) {
  [data-youtube] .video-mask-w { -webkit-clip-path: none; clip-path: none; background: transparent; }
  iframe.yt-trailer { inset: auto; left: calc(var(--sgx) * -1); top: 50%; transform: translateY(-50%); width: 100vw; height: max(200px, 56.25vw); }
  [data-youtube] .video-bar.top { inset: auto 0 calc(50% + max(100px, 28.125vw)) auto; padding: 0 0 .75rem 0; }
}
```

### 2.6 Focus and Escape in a cross-origin iframe [measured with the real player]

Key events inside the iframe never reach the page. A click moves focus into the iframe, and after that Escape is lost.

| Variant | Click on player | Escape after a click | Space after a click |
|---|---|---|---|
| No focus handling | pauses and plays | **does not close** | pauses (YouTube) |
| Refocus at 0 ms | **click lost** (`paused` unchanged) | closes | n/a |
| Refocus at 400 ms on the close button | works | closes | **closes the dialog**, because Space activates the button |
| **Refocus at 400 ms on the dialog (`tabindex=-1`), chosen** | works: each click toggles play and pause | closes | nothing happens |

Also measured with the chosen variant: the player's settings menu stays open 1.45 s after the click, so the focus move does not close it (`t11-settings.png`).

**Trade-off:** a mouse user loses YouTube's keyboard shortcuts until they Tab into the player. A keyboard user who Tabs in keeps them (`lastKeyWasTab`), but Escape does not work from inside; they Shift+Tab out to the close button. The stub-based test said a 0 ms refocus was fine; only the real player showed the lost click, so keep testing this against the real embed.

### 2.7 Prototype results

Real player (`ej8pjisr0Pc`, the By Any Means trailer already in the replica's data):
- At 1440 px it loads and plays inside the dialog with the mask, `muted:false` (`t3b-dialog-click.png`, `t11-controls.png`). This run used a permissive autoplay flag.
- At 390 px the player element loaded and was unpaused at `t=0` when sampled, but the screenshot was still black, so playback on the phone layout is **not confirmed**.
- No page errors or rejections.

Stub player, cross-origin [measured]:

| Viewport | Dialog | Iframe | Close button |
|---|---|---|---|
| 1440x900 | 1098x618 at (171,141) | 1032x581 | 48 px at x=1281 |
| 1366x650 | 1039x584 at (163,33) | 977x549 | 48 px at x=1215 |
| 768x1024 | 561x315 | 527x296 | 48 px at x=676 |
| 390x844 | 355x200 | 390x219, full width (real-player run) | 40 px above it |

- `elementFromPoint` at the four corners and at the bottom-left control area returns the iframe; at the close button it returns the button.
- Close during the opening window: ignored, iframe kept, state consistent.
- Escape, darken and X all restore: `.open` off, iframe gone, nav visible, Lenis running, `body::after` back.
- Escape on a closed dialog: `.open` stays off.
- Taxi to the next film: everything works on the second page.
- Browser back with the dialog open: closes, and the page scrolls afterwards.

### 2.8 Deployment note

`C:/Users/Usuario/Desktop/Projetos/FHDOG/vercel.json:21` has `frame-src https://open.spotify.com`. If the replica inherits this CSP, the embed is blocked until `https://www.youtube-nocookie.com` is added. The `Referrer-Policy` at `:13` is already the right one. Trailer URLs exist as `trailer_url` in the admin and DB layer (`src/lib/db/types.ts:55`, `src/lib/admin.ts:20`), not in `src/content/films/*.md`: no `trailer` field in the content schema.

---

## 3. Case page modules

### 3.1 Table

| Module | Location | Needs from data | Empty or odd input |
|---|---|---|---|
| `Ra` hero lines | `app.js:470:34246` | `data-case` length | `length<13` → `heroLines[2].style.display="none"`. **Fewer than 3 `.line` children and a short slug = crash** [code] |
| `Ga` title | `app.js:476:13` | `[data-cs=title]` plain text; `[data-cs=herow]`, `[data-a=casetitle]`, `.cs-main-img` | SplitText by lines 300 ms after init, once. Parallax only with more than 1 line |
| `Na` parallax image | `app.js:470:36749` | one `img` per `[data-a="parallaxImg"]` | no `img` → crash [code]. Runs on all next-film cards, hidden or not |
| `za`/`Nh` footage | `app.js:470:34409`, created in `tl.create` | `[data-footage=w]`, `item`, `item2`, same count, every item with `[data-parallax]` and `[data-imgParallax]` | see 3.3 |
| `La`/`zh` reviews | `app.js:470:27275` | `[data-reviews=wrapper]`, slides, `prevnext` (2 children), `progress` | list empty: wrapper not rendered, no module, section hidden. Wrapper with 0 slides → `items[0]` crash [code] |
| `Za` marquee | `app.js:478:3965` | `[data-marquee=vertical]` with ≥1 child | see 3.4 |
| `Va` next | `app.js:473:9` | children with `data-id` = slug | see 3.5 |
| `el` logo colour | `app.js:478:4993` | `[data-color]` on sections | no film data. The theme forces the colour anyway |
| `qa` reveal | `app.js:473:3379` | `[data-a=group]` | no film data |

`tl.create` (`app.js:478:6465`) builds `caseFootage` first and then all the children, and any exception in a constructor stops the entire runtime: `ii.dom = new tl, ii.init()`.

### 3.2 Hero lines

The three rules sit at `justify-content:space-between` over the title block. The right count is **title lines + 1**. Measured with a 4-line title and 5 rules: rule tops 553/621/689/757/825, text-line tops 563/631/699/768. So N+1 rules line up exactly. [measured]

Slug length is unrelated to line count. Only `bugonia-2025` is below 13, and it happens to be right.

Lines measured with the theme font at 1920/1440/1024/768/390/360: **identical at every width**, so a static per-film value works. `.cs-title` max-width is in `ch`.

| Lines | Titles (rules needed = lines + 1) |
|---|---|
| 1 | Bugonia, Sem Limites, Obsessão, O Lagosta, The Menu, Vivarium |
| 2 | Django Livre, Doutor Sono, Bastardos Inglórios, O Senhor das Armas, Os Oito Odiados, The Long Walk, The Running Man, Verdade e Traição, V de Vingança, Aquilo que Você Deseja, Casamento Sangrento |
| 3 | De Olhos Bem Fechados, Pulp Fiction: Tempo de Violência, O Mistério de Silver Lake |
| 4 | Manual Prático da Vingança Lucrativa |
| 5 | Casamento Sangrento + Casamento Sangrento: A Viúva |

Today's markup would give: five of the 1-line films a rule through the text (Vivarium: rule at 792 inside the line 768-836), and 3-5 line films too few rules.

**Fix:** render `max(3, lines+1)` `.line` divs in `CaseHero.astro`, with those beyond `lines+1` hidden by inline `display:none`, so `heroLines[2]` always exists. Bugonia's index 2 gets hidden by `Ra` as well, which agrees. `lines` can come from a build-time table or a measuring script; re-measure if a title or `.cs-title` changes.

### 3.3 Footage strips

`Nh.update` moves each item to `translateX((wrap(current+t,N) - t) * w + margin)`, with `current = B.scroll.percent * 8`.

Desktop only: `blur(|wrap(i,N/2)|*2 px)` on strip 1. Strip 2's expression has a precedence quirk (`i+B.isMobile?0:3.5`), so its blur is always 0 [measured].

| Case | Result |
|---|---|
| `gallery=[]`, `[data-footage=w]` present (`/films/thehousewife`, today) | **`TypeError: reading 'clientWidth'`: runtime dead.** Hero rules not hidden, title not split, **all next-film cards visible**, no marquee, plus two visible "No items found." blocks [measured] |
| Caption removed from every item | Strip 2 keeps `null` entries, so `Math.random()<.4 && e[0]` throws **at random**: `TypeError: reading '0'`, runtime dead (forced with `Math.random=.1`). With luck it passes, but strip 1's blur is gone because the blur is gated by `parallaxItems[t]` [measured] |
| **Empty `<div data-parallax="2" class="abs cs-footage-cont"></div>` kept** | No crash, blur intact, nothing visible [measured] |
| Different counts in the two strips | `items2[t].style` throws every frame [code] |

**Fewest stills:** coverage needs `N*w ≥ W+w`, with item width `max(22vw,20rem)` on desktop, 60vw on mobile. Measured coverage of the viewport:

| Stills | 1440 px | 1920 px | 390 px |
|---|---|---|---|
| 2 | | | 80-96% |
| 3 | **60-67%, big gaps** | | 100% |
| 5 | 99-100%, pops at the edge | | |
| 6 | 100% | 100% | |

**Rule: at least 6 items per strip, repeating stills when a film has fewer, and never 0.**

The caption text (`VARIETY`, a fake quote, stars) is never visible: `.abs.cs-footage-cont{display:none}`, 0 of 50 captions displayed. It still has to leave the DOM and the encoded `x-wf-template` (`WfTemplate` serializes `FootageItem`), since it is invented content. [measured]

### 3.4 Reviews and marquee

**Reviews:**
- Same wrap logic: `.review-slider-slide` is 34rem, 100vw at ≤479 px. Minimum without gaps ≈ 4-5 slides on desktop, 2 on phones [code, derived, not run].
- **"1/12" is static text: it never changes**, including after clicking next [measured]. The only code touching the bar is `progressBar.style.transform = translateX(progress*500%)`. Replace it with something true such as the total.
- The progress bar works for any N: `.fill-bar` is 20% wide, and with N≠5 it just ends short or clips.
- `mouseup`/`touchmove` listeners on `window` are not removed by `destroy()` (it passes different function references) [code]. Existing behaviour.

**Marquee `Za`:**
```js
let t = this.el.children[0].cloneNode(true);
this.el.appendChild(t) /* 5 times, same node, so one clone */;
let i = this.el.children[0].children[0].children.length;
i > 14 ? setAttribute("data-marquee-active", 14) : setAttribute("data-marquee-active", i);
```
- Measured: 7 copies + 1 clone = 8. `main.css` gives `[data-marquee-active="N"]>div` a duration of 2N s for N = 1..14.
- Savoy: 14 items, 28 s. Moon: 5 items, 10 s. More than 14 items: 28 s regardless, so faster per item.
- Empty list: `children[0].children[0]` is `.w-dyn-empty`, with 1 child, so the value is `1` and 2 s, in a hidden section. Harmless [measured].
- **No children at all: `TypeError: reading 'cloneNode'`, runtime dead** [measured]. Keep the 7 `DynList` copies.

### 3.5 Next film `Va`

`data-nextCMS` matches `data-nextcms` (attribute names are case-insensitive in HTML). It finds the child with `dataset.id === P.pageRef.case`, picks the next (wrapping to the first), and sets `display:flex` on it and `none` on the rest [measured: moon→taboo, by-any-means→thehousewife]. Unknown slug: index 0 is "current", so it shows index 1.

**So next = DOM order at build.** Reordering at load for the session logic needs to happen before app.js creates `Va`, and also on Taxi swaps, because the fetched HTML is what goes in.

**Weight to watch:** each card and `SmallPanel` print `<link rel="prefetch">`. A case page today has 19 prefetch links for 9 distinct film URLs and weighs 231 KB. With 21 films the nav lists grow and every page prefetches 21 documents [counted today; the 21-film size is not measured].

### 3.6 Other empties that stay visible

`DynList` prints `<div class="w-dyn-empty">No items found.</div>`. Reviews and prizes are inside hidden sections. **In `CaseCredits.astro` nothing hides it**, so an empty `keyCrew`, `producers` or `crew` shows that English text in the credits grid. FHDOG has no crew data, only director, year, runtime, genres, rating. The block needs its own conditions. [code; `.w-dyn-empty` visible at 46 px height measured on the gallery of `thehousewife`]

Also static invented text in markup: `FootagePanel.astro:29-30,36` (a fixed headline and a fixed producer name on every card).

### 3.7 Logo colour

`el` observes each `[data-color]` with `rootMargin:"0% 0% -90% 0%"`: `white` sets `.nav-link` to black, anything else to white. `tema-sinal.css:368` overrides it with `!important`, and `:370` dims it while the dialog is open. No film data, and the theme makes it nearly irrelevant.

### 3.8 Every star in `src/`

| Where | What | Visible? | Effect of removing |
|---|---|---|---|
| `components/nav/RatingStars.astro` | the inline SVG, classes `footagemenu-stars[ larger]` | | delete with its uses |
| `components/case/FootageItem.astro:7,38` | `<RatingStars larger />` in the caption | **never** (`display:none`) | no layout effect. Keep the `[data-parallax]` div, see 3.3 |
| `components/nav/CasePanel.astro:5,28` + `:29` text `5/5` | ticket bottom row | yes | panel stays 141 px (`.casemenu-bottom-w` fixed at 42 px), `.rating-w` goes from 104 to 26 px [measured]. `5/5` is a rating too, so it must go. Empty, `.rating-w` still draws its dashed border. Reuse it for real data (the classification `rating: "18"` is not a score) or hide it |
| `components/nav/FootagePanel.astro:6,28` | above `HEADLINE`, on every card | yes | list height stays 151 px, the right column decides it [measured]. See the note below |
| `components/home/RollReviews.astro:8,20-23` | `<figure><img stars.svg>` | yes | see below |
| `data/home.ts:17-18` | `REVIEW_STARS_SRC` | | delete |
| `data/home-roll.ts:14` and 27 `{"type":"stars"}` blocks (lines 40-182) | 3 per film | | data of the Siena films, replaced with the data source |
| `public/assets/img/films/_shared/stars.svg` | asset, 108x18 | | delete |
| `webflow.css` `.footagemenu-stars{width:50px}`, `.larger{width:70px}`; `main.css` `.awards-w>div>figure>div>img` rules | | | dead CSS, harmless |
| `tutorial-final.mp4` | recorded on screen | yes | goes with the video |

Built counts of `footagemenu-stars`: `index.html` 10, `about.html` 10, `films/ana-maxim.html` 38. The bundle never mentions stars, except indirectly in `sg()`.

**Home reviews and `sg()` (`app.js:1:53443`):**
```js
e.innerHTML.split(/(?=<figure)/).map((n, o) => n.includes("<figure") && n.includes("<p") && n.includes("<h3")
  ? `<div data-parallax="${15 + o * 8}">${n}</div>` : n).join("")
```
Measured on the home desktop column (573 px):

| Markup | Children of `.awards-w` | Height |
|---|---|---|
| Today | `DIV[15] DIV[23] DIV[31]` | 589 px |
| No figure | `P H3 P P H3 P P H3 P`, **no parallax chunks** | 460 px |
| **Empty `<figure></figure>`** | `DIV[15] DIV[23] DIV[31]`, parallax kept | 460 px |

So keep an empty `<figure>` per block, each with a `<p>` and an `<h3>`. The 129 px saved causes no overlap; give the figure a margin if the old rhythm is wanted. `main.css` hides the third chunk on phones through `div:nth-child(3)`, which also relies on the wrappers.

**Footage panel with real headlines [measured]:** only the **first** item sets the list height (`.menu-footage-item:first-child{position:relative}`, the rest absolute). With the real headlines the item height ranges from 136 to 210 px, so longer ones get clipped by the panel. Fix with a grid stack: all items in the same cell, `position:relative`. The bundle only sets `autoAlpha` on them.

The real summaries (64-151 chars) fit the case panel: 29-72 px in a 209 px column. [measured]

---

## 4. About page

### 4.1 Modules

| Selector | Class | Structural needs | Crash? |
|---|---|---|---|
| `[data-a="abouttext"]` | `Ha` `app.js:473:268` | Exactly positional, see below | yes |
| `[data-a="aboutgrid"]` | `Ua` `app.js:473:2073` | `t.children[0]` holds cells. Stagger is hard-coded `grid:[4,9]` | no crash with 21 cells [measured] |
| `.tall-arch-ratio` | `Wa` `app.js:473:7418` | each needs `img` and `svg`; `.reveal` strokes optional (`.mobile-bg` has 0) | no `img` or no `svg` → crash [code] |
| `[data-track='abouthero']` | `Ka` `app.js:478:2832` | `[data-reveal='svg'] rect.reveal`; each `[data-a="item"]` moves its parent | 4 words fine [measured]; missing rect → GSAP warning [code] |
| `[data-svg='resizer']` | `Qa` `app.js:478:3322` | `[data-svg='resize']` with `rect`s | missing → crash [code] |
| `[data-a="group"]` | `qa` | `data-a="line|alpha|item"` | |
| Team, services, collaborators | none | static | free |

**`Ha` reads fixed positions** [code; crashes measured]:
```js
sections = t.children;                                   // 4: titles, statement, formats, xl
sections[0].children                                     // titles: any count
sections[1].children[0].children[0..3].children[1]       // 4 statement rows, 2nd cell of each
sections[2].children[0].children[0].children[0..1]       // 1st column: 2 words
sections[2].children[0].children[1].children[0..1]       // 2nd column: ._5-line + word
sections[3].children[0]                                  // xl word
sections[3].children[1].children[0].children[0..2]       // 3 xl titles
sections[3].children[2]                                  // colophon
```

| Change | Result [measured] |
|---|---|
| 3 statement rows | `TypeError: reading 'children'`: runtime dead, hero unanimated, grid still |
| 1 format column | same crash |
| 2 xl titles | GSAP warning only |
| 21 grid cells | no error, but 9x4 no longer fills |

**So: keep 4 statement rows, 2 format columns and 3 xl titles.**

**Grid:** `.about-grid-w` is 9 columns x 4 rows, `.about-grid-item` height 25svh; a cell is 136x191 px on screen at 1440x900, after the `.about-grid-coll{transform:scale(.85)}`. `background-image` inline, cover. Each cell needs an image: **36 cells with 21 films means 15 repeats.** Today's 36 images weigh 1.86 MB.

FHDOG images are landscape stills (500x334, 1200x771; the smallest are 306x150 and 500x281), so the cover crop is heavy in portrait cells, and the same applies to the tall arches and to the full-bleed `.cs-main-img` hero: the 306 px wide `truth-treachery-2026.webp` will look soft there.

`.about-title-tx._2/_3/_4/_5/_6` use `translate(80/140/70/-10/20 %)` of their **own width**, so long titles in `_3` go off-screen on phones. Put short titles there (Siena has TABOO and SAVOY in `_2`, `_3`).

### 4.2 Real text or SVG

**Everything readable on /about is real HTML text except the logo square** [measured].

| Text | Element | Type | Source |
|---|---|---|---|
| SIENA FILM / FOUNDATION IS A, DEDICATED TO… | `.about-he-sm-tx` | text | `about.ts:54-83` |
| FILM PRODUCTION HOUSE | `h1.about-he .span-move` | text | `about.ts:66-70` |
| MOON…, TABOO, SAVOY, PRISONER X | `.about-title-tx` | text | `about.ts:99-116` |
| Mission statement, 4 x 3 cells | `.about-small-text-line > div` | text | `about.ts:117-138` |
| TELEVISION, FILMS, DOCUMENTARY | `.text-block-12` | text | `about.ts:139-147` |
| **SIENA** (23vw, 49vw on phones) | `.text-block-9` | **text** | `about.ts:148`. FHDOG has the same 5 letters |
| ANA MAXIM… | `.about-title-tx` | text | `about.ts:149-162` |
| Colophon (ISBN, HARDCOVER…) | `.about-small-struct > div` | text, invented for layout | `about.ts:163-168` |
| WHO WE ARE, Our Services, COLLABORATEUR | `h2.ticket-btn-tx` | **text** | `AboutArticle.astro:23` |
| GALLERY, REVIEWS | `h2.ticket-btn-tx` | **text** | `TicketHeading.astro:12` |
| Team roles, names, bios | `.team-*` | text | `about.ts:221-245` |
| Service 1, FILM FINANCING… | `.service-*` | text | `about.ts:247-265` |
| Our Films, EXPLORE | `.cta-he`, button | text | `about.ts:288-297` |
| SIENA / ADMIT ONE / 004 (nav stub) | `.about-menu-tx` | text | `AboutMenu.astro:8,11,14` |

Hidden: the COLLABORATEUR article: `.s.h-auto.flex-center.pt-lg{display:none}` at every width, so the A24 logos are never seen [measured].

`svg-paths.ts` in `about/` has only shapes: `ARCH_CLIP_D`, `COLLAB_MASK_D`, `COLLAB_FRAME_D`. No words.

### 4.3 Every SVG on the site, by inspection

All 66 distinct inline SVGs in `dist` were rendered (`svgs.png`, `t13-svgs.png`). The ones blank in the sheet are clipPath definitions or very short shapes, read in the markup. Words appear in exactly two (the logo square has two copies that differ only in a class):

| SVG | Says | Used in | Replacement |
|---|---|---|---|
| `svg.svg-logo`, viewBox 131x63, bbox 130.5x61.9, one path | **SIENA** + **FILM FOUNDATION** | `Nav.astro:35`, 16 pages (all but 404) | see below |
| `svg.logo-footer`, viewBox 89x88, `LOGO_MARK_D` (`ui/svg-paths.ts:16`), mark bbox x17 y53 w53.8 h20.8 | **SIENA** inside the dashed arch frame | `LogoSquare.astro` → `Footer.astro:42` (13 pages), `AboutHero.astro:26` | swap only `LOGO_MARK_D`, keep `FRAME` |

No words, despite the name or size:
- `DirectorsCutSvg.astro` (45 KB): ticket with a slot, two 616-char shapes and a 43,856-char dashed outline. The words DIRECTOR'S CUT are HTML (`CaseShowcase.astro:30`), and the whole block is `.abs.sticky-c{display:none}`, never visible [measured]. It is only heavy: 45 KB on every case page, for nothing.
- `collab-svg` (14 KB): dashed frame.
- `switch-svg`, cursor arrows, tickets, social icons.

**Words in raster or other files** (for the brand pass, not in my scope in detail): intro and tutorial videos, festival logos in `img/films/_shared/` and CMS prizes, `a24logo.png`. I did not inspect the favicon, `web-clip.png` or `open-graph.webp`.

**How to replace the two logos:**

| Option | For | Against |
|---|---|---|
| **A. Regenerated paths from the theme font (recommended for both)** | Same element, classes and CSS (`.svg-logo{width:6.15rem}`, `.svg-logo path{mix-blend-mode:difference}`). No flash while the font loads. No dependency on `Sinal Display` being ready. Same pattern for the footer mark | Needs a dev-only script. **Not available here:** `fontkitten` in `node_modules` reads default-instance outlines only (it gave `F` at wght 600/wdth 100) and fails on `getVariation` with this WOFF2; no Python or fontTools. Would need `fontkit` or fontTools installed, as a dev step. The font (Archivo, OFL) allows it |
| B. SVG `<text>` in the theme font | No tool. Tested in viewBox 131x63: `FHDOG` in `Sinal Display` fits at font-size 43.6 and `FILMES HD ONLINE GRÁTIS` in `Sinal Rotulo` at 9.49 (`t13-svgs.png`). Use `textLength` to lock the width | `font-display:swap` makes the logo jump. `.svg-logo path` no longer matches, so the blend rule must be re-pointed |
| C. HTML text replacing the SVG | Simplest. The bundle has no reference to `svg-logo` or `logo-footer` (0 occurrences), so nothing breaks | Same flash. `.svg-logo` CSS must move to the new element. Loses the 131x63 composition guarantee |

The nav logo keeps its link, `data-a="logo"` (animated by `Ja`) and the hitbox `.cursor-hide-hitbox.logo-sized` in any option. Those are outside the SVG.

### 4.4 Real content available, nothing invented

From `Projetos/FHDOG/src/lib/site.ts` and `src/pages/sobre.astro`: name, short name, author `Olwtelet`, tagline, description, `foundingDate 2024-11-29`, "Uma sessão por sábado", the statement that the site does not host films, the SMPTE explanation, Discord, YouTube, Steam, email.

I found no team bios or photos in `sobre.astro`: a grep for fundador, curador and equipe found only the word "curadoria". The team block has no real data unless the owner gives some; two cards are not required by any module, so it can be hidden or reduced freely.

---

## 5. Sounds and tutorial texts

### 5.1 Sounds `Pi` (`app.js:478:37752`)

- Hard-coded list: `/assets/audio/{cta_in,cta_out,menu_IN,menu_OUT}.mp3` (0.34, 0.34, 0.508, 0.508 s; 21-27 KB), Howler, volume 0.5.
- Loaded on the **first click anywhere** (`document` click, once): `loadSounds()` then `onPageChange()`. All 4 are requested on that click, whatever the page has [measured]. On home that click is usually ENTER.
- `onPageChange()` runs again on each Taxi `transitionIn`.
- `[data-sound-hover="0"]` (`ExploreButton.astro:101`): `mouseenter` plays `cta_in`.
- `[data-sound-hover="1"]` (`.menu-w`, `Nav.astro:41`): `onclick` plays `menu_IN` on every other click. The flag `e` alternates.
- **`cta_out` and `menu_OUT` are downloaded and never played** [code]. No sound on mobile (`B.isMobile`).
- ExploreButton does not appear on case pages (per the component's header comment), so there only the menu sounds.

Files missing: 4 console 404 errors on the first click, no exception, no rejection, page normal [measured]. So keep the paths: removing the files makes console noise, and removing the attributes still requests them. To replace: new short files with the **same names**. I could not listen to them. Their metadata is only an XMP packet with a 2025 date, with no text about Siena in the first bytes.

### 5.2 Tutorial texts

Mechanism: `.tut-tx-w` is `overflow:clip`, width 60% (196 px), and **its height is the first text's height**, line-height 1em, 10 px uppercase. The others are `position:absolute`, each starting at `translateY(100%)` of its own height.

**Trap [code]:** all texts must have the **same number of lines** as the first. A 1-line text in the 2-line window would show its idle position in the second line, and a 3-line one is cut.

Measured [all 2 lines, window 196x20]:

| Original | PT-BR draft | Lines |
|---|---|---|
| Hold and drag to navigate the content | Segure e arraste para navegar pelo conteúdo | 2 |
| Scroll to unlock the immersive film experience | Role a página para entrar no clima de cada sessão | 2 |
| Click on left-side menu to Quick navigate Films | Clique no menu à esquerda para ir direto a um filme | 2 |
| Use the right menu for seamless navigation | Use o menu à direita para navegar pelo site | 2 |
| Click 'Explore' to view detailed case studies | Clique em 'Explorar' para ver a página do filme | 2 |

The texts live in `src/data/home.ts:45-51`. The number of texts is free, and total time is 4.8 s each.

Button labels fit [measured on the desktop ticket only, text width in a fixed 93 px column, 74 px on CLOSE]: ENTRAR 53, EXPLORAR 70, VER FILME 70, FECHAR 42. `.footagemenu-cta-tx` needs `data-after` updated together with the text, because the hover copy comes from that attribute.

English also lives here: `CaseTrailer.astro` (ACTION!, WATCH Trailer, SOUND ON, placeholder times), `CaseHero.astro` (All Work), `CaseGallery.astro`/`CaseReviews.astro` (GALLERY, REVIEWS, DRAG TO DISCOVER), `CaseCredits.astro` (DIRECTOR, PRODUCErS, Main Crew, CAST), `CaseInvestors.astro:15`, `CaseNextProject.astro` (Showcase, ALL WORK, Explore, NEXT), `FootagePanel.astro` (HEADLINE, DIRECTOR, PRODUCERS, SEE CASE STUDY, `data-after="EXPLORE"`), `CasePanel.astro:13,29`, `MenuFilmRows.astro:39` (MIN.), `ContactMenu.astro` (LET'S TALK, EMAIL US), `RotateNotice.astro`. The bundle writes `SOUND ON`/`SOUND OFF` only inside `setupVideo`, so never with YouTube. I found no Siena string in `app.js` (0 occurrences of siena, Siena, SIENA).

---

## 6. Checklist for the implementers

- [ ] `<video>` in preloader, tutorial and trailer always exists. No `src` attribute when there is no file, never `src=""`.
- [ ] Never an empty `[data-footage=w]`: ≥6 items per strip, same count in both, every item with an empty `[data-parallax]`.
- [ ] ≥3 `.line` in `[data-cs=lines]`, shown count = title lines + 1.
- [ ] `[data-reviews=wrapper]` only with ≥1 slide. Static "1/12" replaced.
- [ ] `[data-marquee=vertical]` keeps its copies even when the list is empty.
- [ ] `CaseCredits` must not print "No items found."
- [ ] `[data-videoplayer='ui']` stays in the DOM. Close button outside the player. Theme `body::after` off while open. Film without a trailer: no CTA.
- [ ] `local-trailer.js` on every page. CSP `frame-src` if `vercel.json` is reused.
- [ ] About: 4 statement rows, 2 format columns, 3 xl titles, 36 cells. Short titles in `_2`, `_3`.
- [ ] Home reviews: empty `<figure>` before each `<p>` + `<h3>`.
- [ ] Footage panel items in a grid stack.
- [ ] Tutorial texts all with the same line count, and `data-after` in step with button labels.
- [ ] Keep the 4 audio file names. Remove the 3 intro videos, `tutorial-final.mp4` and the 6 trailer MP4s.

---

## 7. What I could not verify

- **Browsers:** all runs were headless Edge with software GL. Nothing in real Chrome, Brave, Safari or on a real phone. The touch path of the player ran in emulation only, and its one tap test was inconclusive (`paused:false, t:0`).
- **Autoplay with sound under the stock policy:** inconclusive. With a permissive flag it played unmuted. Without it, desktop stayed `paused,t=0` for 45 s, and then the state jumped after a click and a slow screenshot. Do not rely on it; YouTube's own play button is the fallback.
- **YouTube fullscreen with the focus handback:** the served UI did not expose `.ytp-fullscreen-button`, so the `document.fullscreenElement` guard was never exercised. The UI served to headless may differ from desktop Chrome's.
- **Policy text:** the overlay rule is as stated in the task; the 200 px minimum and the need for a Referer are from my memory of the docs, not re-read now. The `no-referrer` run stayed blank for 25 s, but normal runs were sometimes that slow here, so it proves nothing.
- **Regenerated logo paths:** not generated, for lack of a tool here. Only the SVG `<text>` fit was measured.
- **Audio content:** not heard.
- **Next session order, WebGL race, home spin with 21 films:** not looked at; outside this report. `goToIndex` uses `items.length`, not a fixed 9, so menu triggers scale [code].
- **Reviews minimum and all [code] crash claims:** read, not run. The 21-film page weight is an estimate from today's counts.
