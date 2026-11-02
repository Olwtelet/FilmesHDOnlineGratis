# Runtime of the home roll, Work slider, nav menus and page transitions (Fase 2)

Source: `public/assets/js/app.js`, cited as `offset (line:col)`. The bundle differs from `reference/original/bundles/app.js` in only two places (mask URL and audio URLs, measured with a diff), so everything below is the original behaviour.

Method: static reading plus headless Edge against the production build on :4322, with HTML rewritten in flight (`page.route`). Nothing on disk was changed in either project. N=21 was emulated by cloning the 9 Siena children in every list, each tagged `data-rr=<k>`. Test scripts and outputs are in `scratchpad/f2/rr/` (appendix).

## What this changes in the plan

| # | Finding | Status |
|---|---|---|
| 1 | The first highlight is `items[60 % N]` on home and `items[100 % N]` on Work: 18 and 16 with N=21. Nothing places "next session" at index 0 by itself. | measured |
| 2 | Rotating the DOM works, but it also rotates the visible small panel (row 18 of 21, below the fold at 720 px). A two-point patch of `-60`/`-100` to a multiple of N lands on index 0 and keeps one order everywhere. | both measured |
| 3 | An inline `<script data-taxi-reload>` runs synchronously after the DOM swap and before modules are created, on every Taxi navigation, including pages from the Taxi cache. It is better than wrapping `fetch`, which never sees cached pages. | measured |
| 4 | The bundle has no route strings. `/programacao`, `/sobre`, `/contato` and `/sessoes/<slug>` work if `data-page` and `data-case` stay. | measured |
| 5 | A failed image on `/work` leaves the page hidden forever on a direct load. `local-preloader.js` guards home only. | measured |
| 6 | If an empty lightbox (`w-dyn-bind-empty`) is the first child of `.work-overl-w`, Footage mode goes blank for all films. | measured |
| 7 | Home titles: Ç loses its cedilla ("VINGANCA"), the clone's Ã tilde shows inside the A, and words of 9+ letters break mid-word ("BASTARDO/S" at 1440 px). | measured |
| 8 | The small panel with 21 rows runs past the viewport with no scroll. Making it scroll collides with the panel-closes-while-moving logic. | measured |
| 9 | `app.js` dies at top level if `[data-preloader="w"]` exists without a `<video>` inside. | measured |

---

## 1. Count, spin, index mapping

### 1.1 Everything that assumes a count, slug or title

No film slug, title or brand string exists in the bundle (0 matches for savoy, taboo, kafka, moon-in, my-project, outsider, freud, housewife, by-any, ana-maxim, siena, `/work`, `/about`, `/contact`, `/films`). There is no literal 9 tied to the film list.

| Where | Code | Depends on | Effect with new data |
|---|---|---|---|
| 349635 (470:17297) | `move.children[1].textContent.length>9?60:100` | title length | mobile Footage toggle: `yPercent` of the title block |
| 350150 (470:17812) | `let e=s[1].querySelector("h2").textContent.length;e<10&&(ka=!0,bm=e,...y:"2.5rem")`, then `let t=10-bm;...xPercent:-t*10` | title length | desktop Footage toggle: nudges titles under 10 chars |
| 366588 (470:34250) | `e.dataset.case.length<13&&(this.heroLines[2].style.display="none")` | **slug** length (`data-case`) | third hero line follows the slug, not the title: `the-lobster-2015` shows it although "O Lagosta" is short |
| 368234 (470:35896) | `this.current=B.scroll.percent*8` | not N: case gallery strip | travels 8 slides for any gallery size |
| 372362 (473:2798) | `stagger:{amount:.15,from:"center",grid:[4,9]}` | about grid (36 items), not N | none, unless that grid changes size |
| 382817 (478:3965) | `i>14?setAttribute("data-marquee-active",14)` | prizes list, CSS has 1..14 | none (no prizes) |
| `main.css` | `.moon{...}.kafka{...}.my,.ana{...}.freud{...}` inside `@media (min-width:767px)` | first word of the title | see section 5 |
| `webflow.css` | `.menu-row-film-item:first-child`, `.menu-footage-item:first-child`, `.collection-item:first-child` | position | see section 2.3 |
| `main.css` | `.menu-film:first-of-type`, `:last-of-type` (clip-path) | DOM position | fine with a DOM reorder, wrong with CSS `order` |

### 1.2 How N is derived

Always the live length of a `querySelectorAll` taken at create time:

```js
// Kn, roll base, 47649 (1:47650); Fa, slider base, same line
this.items=[...document.querySelectorAll(t)]
```

Used through `this.items.length` (roll, slider, WebGL) and `xi(r,N/2)`. Helpers at 43191 (1:43192):

```js
function $s(s,e){return(s%e+e)%e}                               // positive modulus
function xi(s,e){let t=$s(s,2*e);return t>=e?t-=2*e:t}          // wraps to [-e, e)
```

`gl`/`Ih` (52194, 346037) give the index: `$s(Math.round(-current),N)`.

### 1.3 Intro spin

```js
// Qn (home) 52636 (1:52637); setup() starts at -160 (52858)
this.current=this.target=-60,setTimeout(()=>{B.isMobile||(this.speed=this.lspeed=10),this.current=0},200)
// Pa (Work) 346938 (470:14600)
this.current=this.target=-100,B.isMobile||(this.speed=this.lspeed=5),setTimeout(()=>{this.current=0},200)
```

`target` stays at -60/-100 and `current` eases from 0 to it, so the rest index is `60 mod N` / `100 mod N`. The update loop only rounds `target` to the nearest integer, which leaves these values alone. It is wrap-safe for any N (`$s` and `xi` handle every value).

| N | home `60%N` | Work `100%N` | Measured |
|---|---|---|---|
| 9 | 6 (`outsider-freud`) | 1 (`moon-in-the-12th-house`) | centred item, `.current` row, ticket and footage card all 6 / 1 |
| 21 | 18 | 16 | all four agree |
| 20 | 0 | 0 | formula only |
| 22 | 16 | 12 | formula only |

Any code that rotates lists must compute this from N, never hard-code 18 or 16. N=21 turns fewer full circles (2.9 instead of 6.7) at the same slide speed.

### 1.4 Direction of "next"

Next is always the next DOM child, with wrap.

```js
goToNextSlide(){this.target-=1}                         // roll, 51670
goToNextSlide(){...let e=Math.round(this.target);this.target=e-1...}   // slider, 344819
```

Keys: ArrowDown/Space (roll), ArrowRight/Space (slider). The NEXT hitbox calls the same methods. Wheel down lowers `target`. Measured at N=21, home: 18 → 19 → 20 → 0, then back 20 → 19 → 18 → 17 → 16. Work: 16 → 17 → 18, back to 17.

So "future sessions chronologically, then past newest first" reads correctly if DOM order is that order.

### 1.5 `goToIndex` and `[data-roll="menuItem"]`

```js
// 51732 (1:51733); slider 345111 is identical plus this.isActive&&
goToIndex(e){let t=this.items.length,i=-Math.round(this.target)%t,n=e%t-i;
  Math.abs(n)>t/2&&(n=n>0?n+t:n-t),this.target-=n}
// Qn 53015 (1:53016); Pa has the same binding
this.triggers.forEach((t,i)=>{t.addEventListener("click",()=>{this.goToIndex(i)})})
this.trimTriggers=this.triggers.slice(this.triggers.length/2)        // 52858
```

- It is literally `i % N`, with N taken from the roll. `triggers` holds every `[data-roll="menuItem"]` in document order: footage panel first (N), then small panel (N). So `i` runs 0..2N-1.
- `.current` goes only to `trimTriggers`, the second half (small panel), by `r===t`.
- `n>0?n+t:n-t` has the sign inverted, so a long jump takes the long way round. It lands correctly: at N=21 from 18 to 3 it travels 36 slides instead of 6. It is the same exponential ease, only faster, with no added blur. Measured landings at N=21: small[3] → 3, footage[7] → 7, small[20] → 20.

**Lists with lengths different from the roll** (measured with roll=21, lists 9+9):

| Action | Result |
|---|---|
| Click small panel row 3 (`i`=12) | lands on 12, wrong film |
| Click footage card 3 (`i`=3) | lands on 3 |
| Settle on 18 | no `.current` row at all (`trimTriggers` has 9) |
| Ticket | stays on child 0: `processQueue` requires `this.films[e]` |

If footage and small lists differ from each other, `slice(len/2)` cuts in the wrong place too. All three lists must have exactly N children in the same order. (`[data-menu=films]`, footage and small panel are all built from `FILMS`, so a single data source guarantees it.)

### 1.6 Two ways to make the next session the first highlight

Both tested at N=21 on home and Work, no page errors.

**A. Patch the spin (recommended).** DOM order = display order everywhere, index 0 is the next session.

```js
// 52636: this.current=this.target=-60,   becomes
this.current=this.target=-Math.round(60/this.items.length)*this.items.length,
// 346938: same with 100
```

Measured via an in-flight patch: N=21 settles on 0 (spins to -63 / -105), N=9 settles on 0 (-63 / -99), next goes to 1, Explore link correct. Both anchor strings are unique in the file. The ticket, footage card and Explore link are right from the first frame, because CSS `:first-child` and `this.links[0]` already point at child 0. This adds a third local edit to the bundle (the first two are the URL changes), which is a decision for the owner of the replica policy.

**B. No bundle edit: rotate.** Place `D[j]` at DOM position `(k+j)%N`, `k=60%N` on home, `100%N` on Work, `0` on every other page. Measured: tag 5 at position 18 / 16 is what settles, with ticket, footage card and `.current` agreeing. Costs:

- The small panel is visibly rotated: it starts at `D[3]` on home and `D[5]` on Work, with the next session on row 18 / 16. At 1280x720 only 13 rows fit.
- Fixing that with CSS `order` breaks `.menu-film:first-of-type` / `:last-of-type` clip-paths, which would need overrides.
- The ticket shows child 0 (`D[3]`) until `processQueue` runs, 800 ms after the spin settles.

---

## 2. When modules read the DOM; can lists be reordered

### 2.1 Read times

Boot order (425361, 425410): `new ll` preloader at top level, then the static init of `B` builds Taxi synchronously, then a microtask does `ii.dom=new tl,ii.init()`, then another microtask does `gl.init()`.

| Module | Reads the DOM |
|---|---|
| Preloader `ll` | once, at app.js execution, first document only |
| Taxi `al` | constructor once: `document.cloneNode(!0)` is the cache entry of the first page (411526) |
| `tl.create()` (385736): menu `Hn`, roll `Qn`, slider `Pa`, footage `za`, table `zv` (384461) | at first load **and on every Taxi enter** (`B.dom.transitionIn`) |
| WebGL scene `Sa.create()` (330289): `createHome`/`createWork` | at first load **and on every Taxi enter**, after the DOM modules |
| Sounds | `[data-sound-hover]` on every page change |

Nothing keeps list references across pages, except leftovers: the first `Hn` from the `tl` field initializer is never destroyed, and stale meshes (section 4.5). Nav is inside `[data-taxi-view]`, so nav lists are swapped per page and can be ordered per page.

### 2.2 Is a deferred script before `app.js` safe?

**Yes.** Deferred scripts run in document order after parsing, and `app.js` reads nothing until its own turn. `<slot name="head-local"/>` in `BaseLayout.astro` already sits before `app.js`, and `local-preloader.js` uses it. An inline script at the end of `<body>` is equally safe (measured: `readyState: loading`, no module has run). The Taxi snapshot is taken later, so it contains the sorted order. No race with WebGL exists: `createHome` reads `querySelectorAll('[data-roll="item"]')` only after this. Measured with permutations at N=9 and N=21: 0 page errors. Webflow's own init runs at DOM ready and binds per element.

A sort at load does not cover Taxi navigations, see section 3.5.

### 2.3 Positional links between lists

Everything below is by index, not by id. All these lists need the same permutation.

| Link | Code | Note |
|---|---|---|
| roll/slider index → ticket | `onSlideChange(e)`, `processQueue` (354994): `this.films[this.filmIndex].animateOut();this.filmIndex=e;this.films[e].animateIn()` | **Not `data-id`.** 800 ms debounce |
| ticket → footage card | 352864: `new Bh(e,t,{footage:this.footagesWrapper.children[t]})` | |
| trigger index → item | section 1.5 | footage + small |
| index → small panel `.current` | `trimTriggers[r]`, `r===t` | |
| slider index → lightbox | `P.work.FOOTAGE=this.currentIndex` (349386), `e===this.i` (330009), `this.i` = DOM order of `[data-frames='lightbox']` (331425) | `.work-overl-w` must match `.work-roll-w`. Measured: with all lists permuted, Kafka's frames still appear for Kafka (`align-baseline-kafka.png`, `align-rotated-kafka.png`) |
| index → home title roll-over | `w(this,"index",Sm++)` per `h2.roll-cont-he`, compared with `P.SLIDER_SETTLED` | exactly one such h2 per card |
| index → Explore link | `this.links=this.items.map(t=>t.querySelector("a").href)` (348022), `this.link.href=this.links[t]` | inside the item, safe |

`data-id` is used only on case pages: `P.pageRef.case!==this.item.dataset.id` (`Bh`, 356141) and `[data-nextCMS]` (`Va`, 369577), which shows the child after the current id, wrapping to 0. So the "next session" card on a case page is DOM order too: sort `[data-nextcms="w"]` as well.

**`[data-slider=lines]` is not indexed.** `this.lines` is assigned at 339427 and never read. The marker moves only with drag direction (`translateX(lDragDirection*500%)`). `.lines-scroll-w` is 9em wide with `overflow:clip` and centred, so 9 groups already overflow. 21x5 ticks change nothing visible, and odd N keeps a centre tick in the middle. It needs no sort.

Traps when reordering:

1. **First lightbox gives the geometry of all frames.** `Ta.el=document.querySelector('[data-frames="lightbox"]')` and `resize(){let e=ds(this.el);...}`, combined with `.collection-item{display:none}`, `.collection-item:first-child{display:block}` and `.w-dyn-bind-empty{display:none!important}`. With the empty lightbox moved first: rect 0x0, Footage mode blank for every film, no error (captures `lightbox-normal.png`, `lightbox-emptyfirst.png`). `WorkLightbox.astro` adds that class when `frames.length===0`. Drop the class for empty galleries.
2. `.menu-footage-item:first-child{position:relative}` makes child 0 the height sizer of the footage panel. Cards with longer text in other positions may overflow.
3. `this.parallaxItems=...filter(Boolean)` shifts indexes if an item has no `[data-parallax]`. Keep one per card (`.roll-content-w`, `.work-roll-c`).
4. Every `[data-frames]` needs its JSON `<script>`, even with `items:[]`, or `createWork` throws before `LOADED_WEBGL`.

---

## 3. Taxi.js

### 3.1 Fetch

```js
// 415177 (478:36325)
fetch(e,t=!0){if(this.activePromises.has(e))return this.activePromises.get(e);
 let i=new Promise((r,n)=>{let o;fetch(e,{mode:"same-origin",method:"GET",headers:{"X-Requested-With":"Taxi"},credentials:"same-origin"})
 .then(l=>(l.ok||(n("Taxi encountered a non 2xx HTTP status code"),t&&(window.location.href=e)),o=l.url,l.text()))
 .then(l=>{r({html:Vm(l),url:o})})...
```

The inner `fetch` is the global, resolved at call time. `Vm` is `DOMParser`. Only `[data-taxi-view]`, the title, `data-taxi-reload` scripts and stylesheets are used from the response.

### 3.2 Wrapping `window.fetch`

Works (measured, before `app.js`; order within the bundle does not matter because the name resolves at call time). Filter on `o.headers['X-Requested-With']==='Taxi'`, return `new Response(html,{status,statusText,headers})`. `Response.url` is then `""`: `afterFetch` calls `replaceState({},"","")`, which is harmless (measured with and without `defineProperty(nr,'url',...)`).

Limit: it only ever sees the first fetch of each URL, and never the first page. See 3.5.

### 3.3 Cache

- **Prefetch is cached.** `onPrefetch` on delegated `mouseenter focus` calls `preload` (411947): `this.cache.has(e)?Promise.resolve():this.fetch(e,!1).then(i=>{this.cache.set(e,this.createCacheEntry(i.html,i.url))...`. Measured: hover → one fetch with the header, second hover → none, click → none.
- Entries live for the page's lifetime, keyed by full `href` including the query, without the hash. No expiry. `updateCache` and `clearCache` exist, but the instance is not reachable: nothing on `window` except Howler globals and `lenisVersion`.
- `renderer.createDom()` rebuilds the DOM from `_contentString`, the `outerHTML` captured when the entry was created, so a cached page returns as it was then.
- `data-taxi-nocache` on the view forces a re-fetch on navigation (`skipCache`, 415867). Useless here: the static HTML does not change.
- Separate from this, `<link rel="prefetch">` makes the browser fetch one document per film on every page (10 unique URLs on each of the 4 pages counted: 9 films plus `/`). With N=21 that is 22 documents, each larger because the nav lists grow (home is 147 KB now, up to about 340 KB by proportion, before compression). Consider dropping them.

### 3.4 Same URL; same-page refresh

```js
// onClick 409808
if(this.currentLocation.host!==t.host)return;
if(this.currentLocation.href!==t.href||this.currentLocation.hasHash&&!t.hasHash){e.preventDefault(),this.navigateTo(t.raw,...);return}
!this.currentLocation.hasHash&&!t.hasHash&&e.preventDefault()
```

A link to the current URL does nothing (measured: no request, `history.length` unchanged). `navigateTo` cannot be called from outside. Two ways that work, both measured:

| Method | Result |
|---|---|
| **Hash trick** (below) | same URL, **no fetch** (uses the cache), full leave/enter, new DOM, spin replays, `data-taxi-reload` runs, `history.length` +1. Back goes to `/#r` and does nothing (`onPopstate` returns false for the same path) |
| `<a href="/?r=1">` clicked | fetches, new cache entry, URL stays `/?r=1`, `history.length` +1 |

```js
history.replaceState(history.state,'',location.pathname+location.search+'#r');
const a=document.createElement('a');a.href=location.pathname+location.search;
document.body.appendChild(a);a.click();a.remove();
```

The owner's rule is "decided at load time", so neither is needed unless a live refresh at session start is wanted. Rejected during a transition (`allowInterruption:false`). `location.reload()` plus the cookie (section 6) is the plain alternative.

### 3.5 Keeping the order right across navigations

Sequence in `afterFetch` (413744):

```js
i.renderer.update();                               // new view inserted, old one already removed
er.emit("NAVIGATE_IN",...);                        // bus not reachable from outside
this.reloadJsFilter&&this.loadScripts(i.scripts);  // reinserts [data-taxi-reload] scripts
this.reloadCssFilter&&this.loadStyles(i.styles);
... i.renderer.enter(t,r)                          // transitionIn → tl.create() + Sa.create()
```

`loadScripts` (414295) replaces each `script[data-taxi-reload]` whose `outerHTML` matches, using a new element (`jh`/`Hm`). Inline code runs synchronously at that point. **A `src=` script would load asynchronously and race `tl.create()`, so it has to be inline.**

Measured with an inline `<script data-taxi-reload>` right after `<div data-gl="c">`, with a different "next session" on each run:

| Step | `readyState` | First item transform (empty = modules not created yet) | Taxi fetch | Settled tag |
|---|---|---|---|---|
| first load home | loading | "" | - | wanted one |
| → Work | complete | "" | `/work` | wanted one |
| → home, **from Taxi cache** | complete | "" | none | wanted one (changed since first load) |
| back → Work, popstate | - | - | none | hook ran (4th run). Spin was still under way when sampled, see section 7 |

So one inline script in `BaseLayout` covers first load, fetched pages, cached pages and history, and re-evaluates the clock each time. A fetch wrapper would freeze the order at the first fetch of each URL. `CSP` of the source project's `vercel.json` has `script-src 'self' 'unsafe-inline'`, so inline is allowed if that file is reused.

Sketch (each list child carries `data-at`, epoch ms computed at build from the session's date and time in America/Sao_Paulo, so the viewer's time zone never enters):

```html
<script is:inline data-taxi-reload>
(function(){var now=Date.now();
 function rank(a,b){var x=+a.dataset.at,y=+b.dataset.at,fx=x>=now,fy=y>=now;
  return fx!==fy?(fx?-1:1):(fx?x-y:y-x)}
 ['[data-roll="container"]','.work-roll-w','.work-overl-w','[data-menu="films"]','[data-menu="footages"]','.menu-films-w','[data-nextcms="w"]']
 .forEach(function(s){var l=document.querySelector(s);if(!l)return;
  [].slice.call(l.children).sort(rank).forEach(function(c){l.appendChild(c)})})})();
</script>
```

Whether a session stays "next" until its start or until its end is a product decision; the comparison above uses the start. Option B of 1.6 would add the rotation here.

### 3.6 History and popstate

`onPopstate` (410255) calls `navigateTo(location.href,!1,"popstate")`, which uses the cached entry. Measured: back and forward, no fetch. During a transition it pushes the previous URL back and warns. `history.scrollRestoration="manual"` is set in `BaseLayout`. A bfcache restore keeps whatever order the page had (not tested).

### 3.7 Routes

**Every string that starts with `/` in the bundle:**

| String | Use |
|---|---|
| `/assets/img/site/all-masks.webp` | mask texture |
| `/assets/audio/cta_in.mp3`, `cta_out.mp3`, `menu_IN.mp3`, `menu_OUT.mp3` | sounds |
| `"/"` (4 times, offsets 8466, 115445-115472) | path handling inside libraries |

`pathname` appears only inside Taxi (`tr`, the router's `findMatch`, `onPopstate`). `addRoute` is never called. Page logic comes from `[data-page]`:

```
P.page: "home", "work" (WebGL, delays) · "case" (menu, Bh, Va) · "contact" (on-dark, delay) · "404" (delay)
```

**Renaming routes does not matter to the runtime.** Measured with links rewritten in flight and new paths served: `/programacao`, `/sobre`, `/contato`, `/sessoes/savoy`, `/` all navigate, with `P.page` correct, spin on the right index, Explore link at `/sessoes/...`, no errors.

Constraints:

- Keep `data-page="work"` etc. and `data-case`. Only URLs change. Also keep CSS classes `.home`, `.work`.
- Links must be in the exact canonical form. Taxi compares strings: with a redirect from `/programacao` to `/programacao/`, a link to `/programacao` on that page counts as a different URL and re-navigates. The replica uses `trailingSlash:'never'` with `format:'file'`; the source project uses `trailingSlash:'always'` in Astro and `true` in `vercel.json`.
- Places that hold routes: `src/data/site.ts` (`ROUTES`), `filmHref` (`src/data/films.ts:152`), `src/data/work-page.ts`, file names in `src/pages`, `public/sitemap.xml`. `<link rel="prerender">` follows `NAV_MAIN_LINKS`. No local JS or CSS selector uses a route (`local-forms.js`, `local-preloader.js`, 4 CSS files: 0 href selectors).

---

## 4. Textures

### 4.1 What loads at start

Loader (126328, 34:15961):

```js
async function or(s,e){return new Promise(t=>{let i=new Image;i.src=e,i.crossOrigin="anonymous",
 i.onload=()=>{let r=new Fe(s,{image:i,wrapS:s.REPEAT,wrapT:s.REPEAT});r.a=[i.naturalWidth,i.naturalHeight],t(r)}})}
```

No `onerror`.

- **Home:** one per `[data-roll="item"] img` from `.src` (the `src` attribute, not `currentSrc`, so the largest file, on top of what the `<img>`'s `srcset` already downloaded), plus the mask. Measured: 10 `new Image` at N=9, 22 at N=21.
- **Work:** one per `[data-slider="item"] img`, **all frames of all lightboxes** from their JSON, plus the mask. Measured: 154 at N=9 (9+144+1).

### 4.2 Gate

```js
// 330855
async createHome(){this.doms=[...].map(...),await Promise.all([...this.doms.map(t=>t.load())]),P.LOADED_WEBGL=!0,
  P.PRELOADER_CLICKED===!0?L.to(Di,{alpha:1,delay:.4}):P.on("PRELOADER_CLICKED",this.animateIn)}
```

- Gate = all roll/slider images. Lightbox frames (`Ea.load`, not awaited) and the mask (`this.load()`) do not gate. The mask only sets a uniform when it arrives.
- `animateIn` of the roll: `LOADED_WEBGL` then `PRELOADER_CLICKED`, in either order (`onWebglLoaded`, 52457).
- Page reveal, first load: `checkLoadState` (417820) needs both on home/work, only `PRELOADER_CLICKED` elsewhere.
- Taxi enter: `transitionIn` calls `animateIn()` directly, so the page shows regardless of textures. The roll still waits for `LOADED_WEBGL`.

### 4.3 If an image fails

`onload` never fires, `Promise.all` never resolves, `LOADED_WEBGL` is never set.

| Scenario (measured) | Result |
|---|---|
| Home, one film image aborted, with `local-preloader.js` | fine: its `Image` proxy swaps in a pixel, the page shows, `failedImages` logged |
| Home, same, without `local-preloader.js` | `[data-taxi]` hidden, roll frozen at -160, after 21 s |
| **`/work` direct load, one film image aborted** | **hidden, frozen, after 21 s.** `local-preloader.js` is loaded on home only and exits if there is no preloader wrapper |
| Mask 404 | not gating by code; samples were inconclusive under load. On home `local-preloader.js` shows the DOM images instead |

From code, not run: a failed image after a Taxi enter leaves the page visible with `<img>` at opacity 0 and the roll frozen at -160.

The `Image` proxy must become global, in a small script on all pages before `app.js`. `crossOrigin` also means any external host needs CORS, and the source project's CSP `img-src` allows only a few hosts.

### 4.4 Cost with 21

Nothing is sized for 9: no array, no constant, no texture limit in app code. Each mesh binds 2 textures (`u_diff`, `u_mask`). Measured: `webgl2`, `MAX_TEXTURE_SIZE` 16384, 16 units on this machine.

| Page | Films/frames | `new Image` | Programs linked | Textures created | Image RGBA, no mips | Draws per frame |
|---|---|---|---|---|---|---|
| Home | 9 | 10 | 10 | 30 | 118 MB | 10 |
| Home | 21 (clones) | 22 | 22 | 66 | 251 MB | 22 |
| Work | 9 / 144 | 154 | 154 | 462 | 364 MB | 154 |
| Work | 21 / ~336 (clones) | 380 | 380 | 1140 | 767 MB | 380 |

Every mesh compiles its own program and draws every frame, including lightbox frames while inactive. Those are pushed about 10 units off screen by `pos.x+=(direction-.5)*(1.-u_a_in)*20.`, so they cost vertices and state changes, not fragments.

**Real FHDOG data is lighter than this.** The 21 posters in `src/assets/films` total 1195 KB and about 51 MB on the GPU with mips, against 5.6 MB of files and 142 MB for today's 9 home images. Sizes range from 306x150 (`truth-treachery-2026.webp`) and 500 px wide (three files) to 1200x796. A roll card is about 765 px tall at 1440x900, so the small ones will be strongly enlarged. Work cost depends on how many stills exist; each still adds 1 program, 3 textures and 1 draw per frame.

DOM cost is linear: 21 transforms and blur writes per frame, 21 `clientHeight` reads (roll), and on home about 21 SplitTexts with one GSAP timeline per character. `--delay` staggers in the panels grow too: `t*.02s` per `[data-animation-delay="stagger"]`, 3 per row, so up to 1.26 s against 0.54 s today.

### 4.5 Leak inherited from the original

Measured at N=9, home ↔ about, 3 round trips:

| Visit | `clientHeight` reads per frame | Textures | Programs | Deleted |
|---|---|---|---|---|
| home #1 | 9.3 | 30 | 10 | 0 |
| home #2 | 14.4 | 57 | 19 | 0 |
| home #3 | 27.9 | 84 | 28 | 0 |
| home #4 | 37.2 | 111 | 37 | 0 |

`transitionOut` only does `setParent(null)`. Textures and programs are never deleted, and the per-frame subscription stays: `ps.subscribe` returns an unsubscribe that compares `t.id`, which never matches, and `dispose` is never called. At N=21 that is +21 programs, +63 textures and +21 reads per visit (by proportion; first-load figures at N=21 agree). Not a blocker for short sessions, but 2.3 times faster than today.

### 4.6 Small panel with 21 rows

Measured: rows 43 px, panel from y=135 to y=1046 with `overflow:hidden`. 17 rows reachable at 900 px height, 13 at 720 (`panel-1280.png`). A list scroll needs `max-height`/`overflow-y:auto` on `.menu-films-w` **and** `stopPropagation` of `wheel` on it: VirtualScroll listens on `window`, the wheel would spin the roll and set `body.moving`, and `Hn.setupObserver` closes the open panel on that class. Not implemented or tested here.

---

## 5. Title roll-over (`Xa`, 374523, 473:4959)

```js
// 375755; selector h2.roll-cont-he; create() only when P.page==="home"
create(){let e=this.el.textContent.toLowerCase().split(" ")[0].split("'");
 this.el.classList.add("split-line-wrapper"),this.el.classList.add(e[0]),
 this.split=new Gt(this.el,{type:"lines",linesClass:"split-line-move"}),this.createHomeRollover()}
```

### 5.1 The class

`DOMTokenList.add` rejects only empty tokens and ASCII whitespace. Accents and punctuation are fine.

| Title | Class | |
|---|---|---|
| O Lagosta, O Mistério de Silver Lake, O Senhor das Armas | `o` | measured for the first |
| De Olhos Bem Fechados | `de` | measured |
| Pulp Fiction: Tempo de Violência | `pulp` | measured |
| Obsessão | `obsessão` | measured, valid |
| V de Vingança | `v` | measured |
| The Long Walk, The Running Man, The Menu | `the` | by rule |
| Others | `vivarium`, `bastardos`, `aquilo`, `bugonia`, `casamento`, `verdade`, `manual`, `sem`, `django`, `doutor`, `os` | by rule |

**None of them matches a selector in the 4 CSS files.** The class only matters for `.moon`, `.kafka`, `.my`, `.ana`, `.freud`, which shift line 2 per title (`translate(20%)`, `-15%`, `10%`), desktop only. Measured "Moon Walker": 60.9 px on line 2. None of the 21 titles starts with those words. Per-title tuning through this class is impossible for `o` and `the`, which are shared.

**What throws**, killing the runtime on home because `new tl` fails before `ii.init()` (measured, no transforms, only the local-preloader's reveal remains):

| Title text | Error |
|---|---|
| `'Round Midnight` (leading apostrophe) | SyntaxError, empty token |
| ` O Lagosta` (leading space) | SyntaxError, empty token |
| `\n  O Lagosta` (template whitespace) | InvalidCharacterError |
| empty | SyntaxError |

Harmless: NBSP inside (class contains it), curly quotes, `D'Artagnan` → `d`. Rule: render `<h2>{title}</h2>` with nothing around it, trimmed, as `HomeRollItem.astro` does today. None of the 21 titles triggers it. On Work `create()` is not called (measured, no error).

### 5.2 SplitText with long titles

Measured at 1440x900: font 89.6 px, column 395 px, 72.5 px per row.

| Title | `lines` | Rows | Box height |
|---|---|---|---|
| O Lagosta | O / Lagosta | 2 | 145 |
| De Olhos Bem Fechados | De Olhos / Bem / Fechados | 3 | 217 |
| Pulp Fiction: Tempo de Violência | Pulp / Fiction: / Tempo de / Violência | 4 | 290 |
| Bastardos Inglórios | Bastardos / Inglórios | **3** | 217 |
| Casamento Sangrento + Casamento Sangrento: A Viúva | 6 lines | **10** | **725** |

The column height is 573 px and the card 765 px (parallel titles run, `f2/titles.jsonl`), so the last one overflows its card area. All multi-line titles work mechanically; line masks are per character, so nothing throws in the module.

**Mid-word breaks.** SplitText cannot break a word wider than the column at the `lines` stage, but the `chars` stage turns letters into inline-blocks, and the browser then wraps between letters: "BASTARDO/S" (`rest-1440-0.png`). Measured line by line at this size: `Bastardos`, `Casamento`, `Sangrento`, `Sangrento:` wrap; `Inglórios` and `Violência` fit, because they have narrow letters. `Manual Prático da Vingança Lucrativa` has 5 lines in 6 rows in the parallel titles run, so one of its lines wraps too (not checked by eye). A fix needs a font-size tier from longest word and total length, set at build (an attribute on the h2, read by CSS), because SplitText measures only once. `white-space:nowrap` on `.split-line-move` avoids the break but overflows.

**Accents.** `.split-line-move>div{overflow:hidden;line-height:.8em}` clips each letter, and `L.set(e.children,{y:"18%"})` pushes it down:

- Cedilla is cut: "VINGANÇA" reads "VINGANCA" (`rest2x-1.png`). This changes the word. Also affects `Traição`.
- Tilde and acute: the clone sits at `top:100%`, and its accent rises into the visible box, showing a ghost tilde inside the A of "OBSESSÃO" (`rest2x-0.png`). Same mechanism for `Ó`, `É`, `Ê`, `Á`, `Ú`, `Ã`.

Siena's English titles never showed this. It needs a CSS change on those two rules with real titles as the check. Not attempted here.

**No re-split.** There is no `document.fonts` wait in the bundle (0 matches) and no re-split on resize. Lines are fixed at create. The theme's `Sinal Reserva` fallback was tuned for Siena's titles; breaks for long Portuguese titles on a slow font load were not tested.

Other SplitText users: `Ga` (377620), case `[data-cs='title']`, splits lines after 300 ms and handles multi-line. `$a` for `[data-an='rollover']` (contact, 404).

---

## 6. Cookies

```js
// ll, 423524: COOKIE_NAME "preloader_shown", 1 h
shouldShowPreloader(){let e=this.getCookie(this.COOKIE_NAME);return e?Date.now()-parseInt(e)>this.COOKIE_DURATION:!0}
closePreloader(){this.setCookie(...Date.now()...),L.to(this.wrapper,{autoAlpha:0,duration:.3,onComplete:()=>{this.wrapper.remove(),P.PRELOADER_CLICKED=!0}})}
// 424648
var jm=document.querySelector('[data-preloader="w"]');jm?new ll(jm):P.PRELOADER_CLICKED=!0;
// Ya, 378865: "tutorial_shown", 48 h; set in play(), 2 s after PRELOADER_CLICKED
shouldShowTutorial(){return!document.cookie.split("; ").find(t=>t.startsWith(Mm))}
```

- `preloader_shown` holds epoch ms. With a valid cookie the overlay closes at once and the cookie is rewritten, so the hour is rolling. A non-numeric value also skips: `NaN>3600000` is false (measured with `true`).
- `tutorial_shown`: any value. At 991 px or less the tutorial is display:none and removed without a cookie.
- Both overlays live outside `[data-taxi-view]`, first document only.

**Skipping on a programmatic reload** (measured, all with no pre-existing cookie):

| Method | Result |
|---|---|
| Write both cookies, then `location.reload()` | overlay and tutorial gone, home revealed |
| Deferred script before `app.js` writes the cookies | same, first visit included |
| Deferred script removes `[data-preloader="w"]` | `PRELOADER_CLICKED=true` immediately, no cookie written, home revealed; tutorial needs its cookie |

```js
document.cookie='preloader_shown='+Date.now()+'; path=/; max-age=3600';
document.cookie='tutorial_shown=true; path=/; max-age=172800';
location.reload();
```

The hash trick (3.4) avoids all of this, as no reload happens.

**For the "no Siena frame" work:** `this.video=this.wrapper.querySelector("video");...this.video.muted=!0` runs at top level, before `B` exists. Wrapper without `<video>` = `TypeError` and no runtime at all (measured). Keep a `<video>` (only the first gets the opacity handling; ENTER appears after a fixed 3500 ms), or remove the whole wrapper. `[data-preloader="btn"]` is needed by the same class, and by `local-preloader.js`. The tutorial's video is a separate element and file (`[data-tutorial='video']`).

---

## 7. What could not be verified

- **No visible browser, no real user GPU session.** Every run was headless Edge while other agents were using the machine, so timings are unreliable. Counts (programs, textures, draws, indexes) are reliable. No frame-rate conclusion for N=21 can be drawn from this.
- N=21 was emulated with cloned Siena items. No build with the real 21 sessions exists yet.
- The last line of the 3.5 table (back to Work) was still spinning when sampled, in a run with a slow frame rate. The same path reached index 1 in the plain navigation test (section 3.6, forward) and the hook's run count was correct, but the final tag of that single step was not observed at rest.
- Mobile and touch: code read only (`B.isMobile` branches, `toggleMode`). With the checkbox forced at 390 px the small panel measured 0 height, so its mobile path was not exercised.
- Mask failure: inconclusive sample, conclusion comes from code.
- Failed image after a Taxi enter: from code, not run.
- bfcache restore and session-start crossing in an open tab: not tested. The accent and mid-word fixes, and a scrollable small panel: proposed, not built.

## Appendix: evidence in `scratchpad/f2/rr/`

Full path: `C:/Users/Usuario/AppData/Local/Temp/claude/C--Users-Usuario-Desktop-FHDOG/81789070-6ca0-404a-8dc3-8f2a84b50875/scratchpad/f2/rr/`

| File | Covers |
|---|---|
| `lib.cjs` | harness (clones, rotation, state reader, route rewriter) |
| `t1-spin.cjs`, `t1b.cjs`, `t1c.cjs` | spin, next/prev, rotation, menu clicks, GL counts |
| `t2-taxi.cjs` | A network, B fetch wrap, C `data-taxi-reload`, D same-page refresh |
| `t3-fail.cjs`, `ck.out` | image failures, cookies |
| `t5-title.cjs`, `t5.out`, `t5b.cjs`, `t5s.out` | classes, errors, SplitText, `title-1440-*.png`, `rest-1440-*.png`, `rest2x-*.png` |
| `t6-leak.cjs`, `t6.out`, `t7.out` | per-frame growth, panels, `panel-*.png` |
| `t8-lightbox.cjs`, `lightbox-*.png` | first-lightbox geometry |
| `t9-patch.cjs`, `t9.out` | in-flight spin patch |
| `t10-routes.cjs`, `t10.out` | renamed routes |
| `t11-align.cjs`, `align-*.png` | frames follow the film after a permutation |
| `dims.cjs`, `cls.cjs`, `loc.cjs` | image sizes, class collisions, offsets |
