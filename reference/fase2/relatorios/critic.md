# Fase 2: completeness critic

Read-only on both projects. Tests ran in headless Edge against the build on :4322, with responses rewritten in the test browser. Scripts and captures are in `scratchpad/f2/critic-scratch/`. Offsets are into `public/assets/js/app.js`.

Two of my first runs were invalid: they changed the DOM at `DOMContentLoaded`, after `app.js` had already read it (`exp2.cjs` part F, `rev.cjs`). Both were redone with a deferred script before `app.js` (`rev2.cjs`, `d2.cjs`). Only the redone numbers appear below.

## 1. Gaps, most dangerous first

### G1. Real stills break the Work page budget. No report connects the image list to `createWork`

**The code loads every still of every film when /work opens.** `createWork` (331186) builds one `Ta` per film, and `Ta.create` (329465) runs `this.arr.map(... new Ea ...)`. Each `Ea` loads its image and creates a program straight away. There is no mobile branch, and Footage mode does not have to be open.

**Today's baseline, measured:**

- 144 frames, median width **300 px**, 272 MB RGBA.
- Whole page: 174 images, 4.5 MB downloaded, 364 MB of textures.

**What runtime-roll 4.4 missed.** "Real FHDOG data is lighter" counts only the 21 repo stills. It does not count the backdrops in `films-tmdb.json`:

| Set | Frames | Download | RGBA per visit, no mips | With mips |
|---|---:|---:|---:|---:|
| Today (Siena) | 144 | under 4.5 MB | 272 MB | not measured |
| `films-tmdb.json`, all, `w1280` | 343 | **53 MB** | **1206 MB** | **1607 MB** |
| Same, `w780` | 343 | not measured | 448 MB | 597 MB |
| Proposed: 14 per feature, 640x360 | 308 | not measured | 271 MB | 361 MB |

**The leak is worse on this path, and it was only measured on home ↔ about** (runtime-roll 4.5). I measured the normal browsing path, Work → film → Work (`leak.cjs`, N=9):

| Visit | Textures | Programs | Deleted | Texture MB |
|---|---:|---:|---:|---:|
| work 1 | 462 | 154 | 0 | 364 |
| work 2 | 921 | 307 | 0 | 716 |
| work 3 | 1380 | 460 | 0 | 1068 |

With all stills at `w1280`, each return to Work adds about 1.2 GB (arithmetic, not run). All of it uploads on the main thread during the entry spin, and every frame's mesh draws on every frame.

**Sizing evidence.** A lightbox cell is 225x225 at 1440 and 270x270 at 1920, with a .8 UV zoom, so 640 px wide is enough at DPR 1.

**Decision needed.** Pick one:

- Cap to 14 frames per feature at about 640 px. That matches today's GPU budget.
- Patch `Ta` to build its frames on first `FOOTAGE`. This is another bundle edit, and it has to set `u_mask` itself, because `Sa.load` only sets it for meshes that exist at load (330518). Not run.

**Related: ticket thumbnails.** `MenuFilmRows.astro:20` has `sizes="100vw"` on a 38 px thumbnail. Measured `currentSrc`: `savoy-p-1600.webp`, natural width 1440, on /, /work and /films/savoy. With N=21 that is 21 hero-size downloads on each of those page loads.

### G2. The Work lightbox has its own count rule, which no report states

The "at least 6" in runtime-case 3.3 is for the case gallery strips only. The shader at 325922:

```glsl
float direction=mod(u_index,2.);
float x=(mod(u_index+u_x*(direction-.5)*SPEED_MULT,u_TOTAL)-u_TOTAL/2.)*(scale.x+SPACING)/2.;
```

- **Odd totals break the seam.** One row overlaps two frames and the other row has a gap. Seen in `K3-1440.png` and `K13-1440.png`.
- **Low totals leave a small centred cluster.** Up to K=8 both sides stay empty at 1440, and K=13 is about the point where the row fills (`sheet.png`, K=3 to 13).
- **Odd counts today:** 11 of 21 `films-tmdb.json` entries, including Bugonia 17, Pulp Fiction 19, Vivarium 13 and What You Wish For 9.
- **Rule:** an even count of about 14 or more, with a stated exception for short films.

### G3. The double feature has no trailer design, and a naive second player visibly breaks

There are 22 trailers for 21 pages. `local-trailer.js` mounts a single `data-youtube`, and `Ia` (362057) finds everything with `document.querySelector`. Tested with two `[data-videoplayer="wrapper"]` present before `app.js`:

- The second trigger has no `onclick`.
- The second dialog keeps the `open` class from `CaseTrailer.astro:36` and gets no `autoAlpha:0`. It renders `display:flex`, 1098x618, in the page flow at y=1566, with no console error (`F-two-wrappers.png`).

No report proposes a solution. Options to test: one wrapper with `embed/ID1?playlist=ID2` (not run), or a two-item choice inside the dialog. Without this, "every film has a working trailer" fails for *Casamento Sangrento: A Viúva*.

### G4. Case-hero accents are still broken and no fix covers them. The reports contradict each other

- `slots.md` section 1 lists the case hero as "Not affected".
- `brand.md:237` says the tilde is lost.
- Block 3d in `slots.md` 6.1 has no `.cs-title` rule.

Measured with "Verdade e Traição" at 1440 (`D-cs-title.png`): the tilde lands inside the E of the line above, in the same colour, and the cedilla falls below the bottom rule. The line pitch is 68 px on a 97.6 px font.

By the line breaks in `slots.md` 5.3, these titles have an upward accent on a line after the first (only Traição was rendered): Inglórios, Traição, Violência, Prático, Você, Viúva.

### G5. The review slider minimum contradicts both proposed sources

Coverage of the viewport, in % (`rev2.cjs`, measured at rest and after five drags, lowest seen):

| Slides | 1440 | 1920 | 2560 |
|---:|---:|---:|---:|
| 3 | 88 | 78 | 64 |
| 4 | 100 | 92 | 82 |
| 5 | 100 | 100 | 92 |
| 6 | 100 | 100 | 100 |

- `catalog.md` section 8 maps the slides to 3 `###` blocks.
- `brand.md` maps them to 5 sections, and to 4 for `the-running-man-2026`.
- `runtime-case.md` 3.4 says "4-5", read from code only.

Needed: repeat slides up to 6, or accept the gaps. Decide this before writing the static `1/12` replacement.

### G6. The image data has traps for a plain loop

- `poster.primary` of `inglourious-basterds-2009` and `truth-treachery-2026` is a pt-BR poster that `images-credits.md` section 4 says shows a swastika. The entries carry no flag; only a side `note` exists.
- `truth-treachery-2026.backdrops` includes the two entries flagged `swastika:large`. Iterating `backdrops` publishes them.
- That film has only **2 clean stills** for home, poster fallback, hero, gallery, lightbox and next card. No report says what fills those slots.
- `ready-or-not-double-feature-2026` is an array, so `F[slug].poster` is undefined. Nobody has chosen its single hero, poster or still set.

This needs an explicit per-film override table in the data, not a filter.

### G7. Nobody has reconciled what the mark is

| Report | Mark |
|---|---|
| `preloader.md` | `C:/Users/Usuario/Downloads/simbolo.png`, an angular symbol (`sim.png`). It is in neither repo, and only the preloader work uses it |
| `brand.md` 5.1 | 7-bar `Wordmark` for the logo, favicon, ticket and review figure. It never mentions the symbol |
| `runtime-case.md` 4.3 | "FHDOG" as text or paths |

The preloader's whole reveal depends on this choice. Owner decision, before the logos are built.

### G8. The ordering sketch demotes a session that has started, and labels have no design

The `data-at` sketch in `runtime-roll.md` 3.5 uses `x>=now` on the start time. Once a session starts, it joins the past group, **behind every future session**, so the highlight jumps to next week while the film is on air. `catalog.md` 2.2 puts on-air first, which needs an end time on each item. The two designs conflict and the sketch does not implement the catalogue's rule.

Also missing:

- **Who writes the next / on air / last shown label.** It has to run in the same inline hook, because Taxi only re-runs `data-taxi-reload` scripts, so an Astro component script runs once, on the first document. It must write only to nodes that `Xa` and `Ga` do not split.
- **Test clock.** The kit uses the real time, `page.clock.install({ time: now })` (`tools/scenarios/10-home.mjs:110`). After tonight every run sees all sessions as past, so fixtures need a time per scenario.

### G9. The deploy combination was not examined

- The replica has `build.format:'file'` and `trailingSlash:'never'`, so it emits `work.html`.
- The source `vercel.json` has `trailingSlash:true` and no `cleanUrls`.
- From memory of Vercel's defaults, not run: `/work` redirects to `/work/`, which then 404s, breaking every Taxi fetch.
- The local gates cannot see this, because `tools/lib/hosting.mjs` replays Webflow's hosting.
- `runtime-roll.md` 3.7 and `brand.md` section 8 raise the link string and the trailing slash, not the file layout.
- Keeping the live `/sessoes/<slug>/` URLs implies `format:'directory'` and `trailingSlash:'always'`. All of that needs a real deploy preview.

### G10. Smaller traps not stated elsewhere

- **Hero rule fix.** The `max(3, lines+1)` fix in `runtime-case.md` 3.2 fails for any slug under 13 characters on a title of 2 or more lines, because `Ra` (366588) hides index 2 inline. A rename under the slug policy, such as `django-livre` (12), hits this. The `!important` rule in `slots.md` 6.3 survives it. Prefer that.
- **Absorbed features.**
  - `Hn.setup` (352671) collects every `input` under `[data-menu='w']` and addresses them by position. A search field in the nav breaks the panel logic.
  - `catalog.md` calls SearchPalette cheap. Its module script would also run only on the first document unless it lives in `BaseLayout`.
- **Age rating in the `5/5` slot** (`brand.md` 2.7). `images-credits.md` 3.5 shows The Long Walk 16 vs 18, The Running Man 16 vs 18 and Vivarium 14 vs 16, and nothing is checked against ClassInd. Promoting this field publishes an unverified fact.
- **Title spelling.** `images-credits.md` found "Verdade e Traição" only on TMDB. The oEmbed title of the ParisFilmes trailer `M0lWlRGVF1M` reads "Verdade & Traição". Owner's call.
- **TMDB terms and attribution** were not reviewed by anyone, yet 343 files plus posters are the plan. Self-host them. `or()` has no `onerror`, so a CDN failure hangs the gate, even though CORS itself is fine (`Access-Control-Allow-Origin: *`, checked).

## 2. Conflicts the lead must settle

| Topic | Positions | Note |
|---|---|---|
| Credits | `brand.md` 5.6 "only the director is known"; `images-credits.md` has verified crew and cast | Is external data allowed under "nothing invented"? Composer empty on 4 features, one producer on 3 |
| Home review figure | `brand.md`: 7-bar mark; `slots.md`, `runtime-case.md`: empty `<figure>` | Budget is 36 characters with a figure, 50 without. The `headline` mapping in `catalog.md` fails on 10 of 21 either way |
| Hero rules | `brand.md`: derived `data-case`; `slots.md`: attribute and CSS; `runtime-case.md`: extra hidden lines | See G10 |
| Legal pages | `catalog.md`: owner text or remove; `brand.md`: drafts behaviour-only text | |
| Contact rows | `catalog.md`: remove; `brand.md`: repurpose | |
| Preloader | `brand.md` 5.5 still says new video with a black last frame; `runtime-case.md` gives other beat timings | `preloader.md` supersedes both |
| Siena code licence | `brand.md` section 8 asks the owner | The project memory says the owner states he owns the site and authorised reuse, so this may only need confirming |

## 3. Checked, and it holds

- **No other film-count constant.** Numeric scan of the app code in the bundle (`nums.cjs`): only the known `grid:[4,9]`, `*8`, `>9` and `<10`.
- **The hook's selectors are complete.** All exist with clean children on the 6 page types read, with no direct `<link>` children. The only other film-parallel list is `.collection-list` (scroll ticks, not indexed). The remaining 9-child parents are coincidences (`.panel-content`, `.awards-w`, page wrappers).
- **Moving nodes does not re-fire `<link rel=prefetch>`:** 9 requests with or without the sort.
- **Index 0 under the spin patch works.** `.current` and Explore are correct, Footage turns on and off, the footage panel opens, and previous wraps to the last film, with 0 errors. The bundle uses `!==!1`, so 0 is not treated as false.
- **Mobile user agent (iPhone and Android, emulated), N=21 clones with the patch:** settles on 0 on / and /work, Footage toggles, 0 errors. This partly closes an item others left open, in emulation only.
- **Card size does not depend on the first title:** 765 and 567 px tall at 1440, and constant at 1280 and 390, with the longest titles.
- **Late fonts (14 s delay), with the width and nowrap rules from block 3d and the size tiers:** 1 of 21 titles breaks differently, same height, no mid-word break.
- **Removing `data-wf-*` from `<html>` and the Webflow `preconnect`:** 0 errors on 5 routes, page revealed. Forms were not removed in this test.
- **All 22 primary trailer IDs** resolve on oEmbed today with the right film, and slugs match the catalogue.
- **Text data:** the md files are NFC. Beyond Latin-1 there are only dashes and curly quotes (both inside the fonts' `latin` range, not checked against the font file) and 2 clock emoji.
- **Brand sweep:** I found no new visible string, and `rg -a` finds no brand name in the kept audio, mask, fonts, CSS or JS.

## 4. Not verified

- Real Chrome, Brave, Safari or phones. All headless, with software GL, so no GPU limit or frame-rate threshold was found. The memory figures are arithmetic from image sizes, except the three measured visits at N=9.
- Vercel's behaviour in G9 comes from memory, not a deployment.
- `playlist=` for two trailers, the lazy `Ta` patch, and 640 px quality on screen were not run.
- bfcache restore and a session starting while a tab stays open.
- Only one title (Verdade e Traição) was rendered in the case hero. The other titles in G4 are inferred from the line breaks.
- The lightbox count rule comes from stills at 1440 and 1920 on the current theme, at one moment of the drift.
