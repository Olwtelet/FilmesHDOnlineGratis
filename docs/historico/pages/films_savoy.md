# /films/savoy — `films_savoy`

Generated from `reference/localized/films_savoy.html` (Last Published: Sun Mar 09 2025). Conventions: see [INVENTORY.md](../INVENTORY.md#conventions-used-in-docspages).

## Document / head

| field | value |
|---|---|
| route | `/films/savoy` |
| `<title>` | Siena Film Foundation \| Savoy |
| html attributes | `data-wf-domain="www.siena.film"` `data-wf-page="673306dca8fcb48d30953c00"` `data-wf-site="6728a72e769070a603d43c13"` `lang="en"` `data-wf-collection="673306dba8fcb48d30953be7"` `data-wf-item-slug="savoy"` |
| meta description | In a hybrid fiction-docu film, Zohar Wagner recounts the story of Kochava Levy, the forgotten heroine of the 1975 Hotel Savoy terror attack in Tel Aviv. Held hostage, Levy became a fearless mediator between terrorists and the IDF, as the film blends rare archives and reenactments. |
| og:title / og:image | Siena Film Foundation \| Savoy / `/assets/img/films/savoy/675eb91e-savoy.webp` |
| twitter:* attribute | `name=` |
| preconnect link | yes |
| body children (order) | `div.w-embed` → `div.w` → `div.canvas` → `div.div-block-44` → `script[src=/assets/js/jquery-3.5.1.min.js]` → `script[src=/assets/js/webflow.schunk.js]` → `script[src=/assets/js/webflow.js]` → `script(inline)` |
| page view element | `<div data-case="savoy" data-taxi-view="" data-page="case" class="pw cs">` |
| scripts (src) | `/assets/js/jquery-3.5.1.min.js`, `/assets/js/webflow.schunk.js`, `/assets/js/webflow.js` |

**Navigation:** Rendered by `<Nav currentPath="/films/savoy" />`. Elements carrying `w--current` + `aria-current="page"` here: `a.footagemenu-cta-w.w-inline-block.w--current` → `/films/savoy`, `a.menu-film-direct-link.w-inline-block.w--current` → `/films/savoy`. Case-panel text (`.case-menu-tx`): “In a hybrid fiction-docu film, Zohar Wagner recounts the story of Kochava Levy, the forgotten heroine of the 1975 Hotel Savoy terror attack in Tel Aviv. Held hostage, Levy became a fearless mediator between terrorists and the IDF, as the film blends rare archives and reenactments.␠”.

**Footer:** `footer.s.footer` variant `base`; current links: none; newsletter form `data-wf-page-id`: `673306dca8fcb48d30953c00`

## Section outline (in DOM order)

| # | element | data-* | description |
|---|---|---|---|
| 1 | `div.nav-w` |  | Shared navigation component — see [_shared-nav.md](./_shared-nav.md) |
| 2 | `header.s.fullbleed.cs-hero.bg-white` | data-cs="herow" | Case hero: full-bleed still (parallax) with “All Work” back link, category eyebrow, H1 title with 3 decorative lines, arrow to #second |
| 3 | `div#second.s.h-auto.bg-white.relative` | data-color="white" | Trailer player: “ACTION! / WATCH Trailer” CTA over a masked poster; dialog with custom controls (play/pause, scrub bar, current/total time, SOUND ON/OFF) and close button |
| 4 | `div.s.cs-credits-w.bg-white` | data-color="white" | Credits: DIRECTOR + poster image, credit grid (main row, producers row, Main Crew rows incl. dot-separated names list) |
| 5 | `div.section-w` |  | Sticky DIRECTOR’S CUT badge, GALLERY (two CMS footage strips moving in opposite directions with scroll) and REVIEWS drag slider |
| 6 | `div.s.prizes.bg-white` | data-color="white" | Festivals / prizes: vertical CSS marquee built from 7 identical copies of the CMS list (app.js appends one more clone at runtime) + parallax still |
| 7 | `div.s.investor.bg-white` | data-color="white" | Investors & Broadcast heading + rich text |
| 8 | `div.s.next-proj.bg-white` | data-color="white" | ALL WORK CTA (→ /work) + next-film card: all 9 films are rendered, app.js keeps only the one after the current film (wraps to the first) |
| 9 | `footer.s.footer` | data-once="true" data-a="group" data-s="footer" data-wf--footer--variant="base" | Shared footer component — see [_shared-footer.md](./_shared-footer.md) |
| 10 | `div.div-block-44` |  | Rotate-your-device notice (CSS: visible only 480–767px wide; see INVENTORY §e) |

## 1. `div.nav-w`

Shared navigation component — see [_shared-nav.md](./_shared-nav.md)

Copy, links and media are documented once in the shared component docs.

## 2. `header.s.fullbleed.cs-hero.bg-white`

Case hero: full-bleed still (parallax) with “All Work” back link, category eyebrow, H1 title with 3 decorative lines, arrow to #second

### Copy (verbatim)

```text
div.roll-cont-eyeb.parish.mb-0: All Work
div.roll-cont-eyeb.parish.larger.is-cs [data-a="alpha"]: Documentary
h1.cs-title [data-cs="title"]: Savoy
```

### Links

| text | href | type | target | element / notes |
|---|---|---|---|---|
| All Work | `/work` | internal |  | work-back-btn.w-inline-block |
| (icon) | `#second` | anchor |  | arrow-link-w.w-inline-block data-a="alpha" |

### Media

| kind | local path | element | details | on disk |
|---|---|---|---|---|
| img | `/assets/img/films/savoy/675eb91e-savoy.webp` | cs-main-img | srcset 500w 800w 1080w 1600w 1920w; sizes="100vw"; loading=lazy; alt="" | 210 KB |

## 3. `div#second.s.h-auto.bg-white.relative`

Trailer player: “ACTION! / WATCH Trailer” CTA over a masked poster; dialog with custom controls (play/pause, scrub bar, current/total time, SOUND ON/OFF) and close button

### Copy (verbatim)

```text
div.roll-cont-eyeb.parish.mb-2: ACTION!
h2.heading-5: WATCH⏎Trailer
div.video_plr-text [data-vid="curr"]: 00:10
div.video_plr-text [data-vid="total"]: 6:29
div.sound-toggle-tx [data-vid="sound"]: SOUND{nbsp}ON
```

### Links

_No links._

### Media

| kind | local path | element | details | on disk |
|---|---|---|---|---|
| img | `/assets/img/films/savoy/675eb91e-savoy.webp` | image-2 | srcset 500w 800w 1080w 1600w 1920w; sizes="(max-width: 767px) 100vw, 80vw"; loading=eager; alt="" | 210 KB |
| video | `/assets/video/Savoy-01.mp4` | videoplayer-vieo-comp | playsinline=true data-videoplayer=video | 15662 KB |

## 4. `div.s.cs-credits-w.bg-white`

Credits: DIRECTOR + poster image, credit grid (main row, producers row, Main Crew rows incl. dot-separated names list)

### Copy (verbatim)

```text
div.roll-cont-eyeb.parish: DIRECTOR
div.credit-name: Zohar Wagner
┄ div.credit-text.dash.white.w-dyn-item:
  div.roll-cont-eyeb.parish.mb-0: Director - Producer
  div.credit-name: Zohar Wagner
┄ div.credit-text.dash.white.w-dyn-item:
  div.roll-cont-eyeb.parish.mb-0: DOP
  div.credit-name: Moshe Mishaly
┄ div.credit-main-row-item.w-dyn-item:
  div.roll-cont-eyeb.parish.mb-0.credit-row-title [data-role="inherit"]: Executive Producer␠
┄ div.credit-main-row-item.w-dyn-item:
  div.roll-cont-eyeb.parish.mb-0.credit-row-title [data-role="inherit"]: Co-Producer
div.roll-cont-eyeb.parish.mb-0.credit-row-title: PRODUCErS
┄ div.credit-text.dash.w-dyn-item:
  div.roll-cont-eyeb.parish.is-role.is-main: Executive Producer␠
  div.credit-name.smaller [data-role="Executive Producer "]: Dorit Hakim Kramer
┄ div.credit-text.dash.w-dyn-item:
  div.roll-cont-eyeb.parish.is-role.is-main: Co-Producer
  div.credit-name.smaller [data-role="Co-Producer"]: Itay Akirav
div.roll-cont-eyeb.parish.mb-0.credit-row-title: Main Crew
┄ div.credit-text.grow.last.w-dyn-item:
  div.roll-cont-eyeb.parish.is-role: Editor
  div.credit-name.smallest: Nili Feller
┄ div.credit-text.grow.last.w-dyn-item:
  div.roll-cont-eyeb.parish.is-role: Editor
  div.credit-name.smallest: Shauly Melamed
┄ div.credit-text.grow.last._1-4.w-dyn-item:
  div.roll-cont-eyeb.parish.is-role: Editor
  div.roll-cont-eyeb.parish.is-role.w-condition-invisible {HIDDEN:w-condition-invisible}: CAST⏎
  div.credit-name.smallest: Nili Feller
┄ div.credit-text.grow.last._1-4.w-dyn-item:
  div.roll-cont-eyeb.parish.is-role: Editor
  div.roll-cont-eyeb.parish.is-role.w-condition-invisible {HIDDEN:w-condition-invisible}: CAST⏎
  div.credit-name.smallest: Shauly Melamed
┄ div.credit-text.grow.last._1-4.w-dyn-item:
  div.roll-cont-eyeb.parish.is-role: Lead Actor
  div.roll-cont-eyeb.parish.is-role.w-condition-invisible {HIDDEN:w-condition-invisible}: CAST⏎
  div.credit-name.smallest: Ala Dakka
┄ div.credit-text.grow.last._1-4.w-dyn-item:
  div.roll-cont-eyeb.parish.is-role: Lead Actress
  div.roll-cont-eyeb.parish.is-role.w-condition-invisible {HIDDEN:w-condition-invisible}: CAST⏎
  div.credit-name.smallest: Dana Ivgy
┄ div.credit-text.grow.last.small.w-dyn-item:
  div.credit-name.smallest.last: Nili Feller
┄ div.credit-text.grow.last.small.w-dyn-item:
  div.credit-name.smallest.last: Shauly Melamed
┄ div.credit-text.grow.last.small.w-dyn-item:
  div.credit-name.smallest.last: Ala Dakka
┄ div.credit-text.grow.last.small.w-dyn-item:
  div.credit-name.smallest.last: Dana Ivgy
```

### Links

_No links._

### Media

| kind | local path | element | details | on disk |
|---|---|---|---|---|
| img | `/assets/img/films/savoy/678fa9d3-savoy.webp` | credit-main-img | srcset 500w 800w 1080w 1212w; sizes="(max-width: 991px) 100vw, 25vw"; loading=lazy; alt="" | 108 KB |

## 5. `div.section-w`

Sticky DIRECTOR’S CUT badge, GALLERY (two CMS footage strips moving in opposite directions with scroll) and REVIEWS drag slider

### Copy (verbatim)

```text
▸ div.dc-el {desktop-only(data-hide=mobile)}:
  div.dc-tx: DIRECTOR'S{nbsp}CUT
h2.ticket-btn-tx: GALLERY
┄ 2× identical div.cs-footage-c.w-dyn-list:
  ┄ 22× identical div.cs-footage-it.w-dyn-item.w-dyn-repeater-item:
    div.roll-cont-eyeb.parish.mb-0: VARIETY
    div.cs-footage-cont-he: "A cinematic triumph"
  ▸ div.w-dyn-hide.w-dyn-empty {Webflow empty-state, hidden via w-dyn-hide}:
    div: No items found.
h2.ticket-btn-tx: REVIEWS
┄ div.review-slider-slide.w-dyn-item:
  div.roll-cont-eyeb.parish.mobile-mb: E-Walla
  div.review-he: "Savoy is 'Die Hard' with feminist and ethnic consciousness. Groundbreaking."
┄ div.review-slider-slide.w-dyn-item:
  div.roll-cont-eyeb.parish.mobile-mb: Film Threat
  div.review-he: "Honest storytelling gives Kochava Levy the biopic she deserves."
┄ div.review-slider-slide.w-dyn-item:
  div.roll-cont-eyeb.parish.mobile-mb: Jerusalem Post
  div.review-he: "Savoy examines class, ethnicity, and change since the 1975 siege."
┄ div.review-slider-slide.w-dyn-item:
  div.roll-cont-eyeb.parish.mobile-mb: Krakow Film Festival
  div.review-he: "Blends archives and staging to keep the audience tense throughout."
┄ div.review-slider-slide.w-dyn-item:
  div.roll-cont-eyeb.parish.mobile-mb: Jewish Exponent
  div.review-he: "A female-empowering film showing media's unfair treatment of the heroine."
┄ div.review-slider-slide.w-dyn-item:
  div.roll-cont-eyeb.parish.mobile-mb: Loud And Clear Reviews
  div.review-he: "A historical drama with relevance to today's social and political issues."
div.roll-cont-eyeb.parish.mb-0.darker.slider: 1/12
▸ div.div-block-34 {desktop-only(data-hide=mobile)}:
  div.roll-cont-eyeb.parish.mb-0.darker: DRAG{nbsp}TO{nbsp}DISCOVER
```

### Links

_No links._

### Media

| kind | local path | element | details | on disk |
|---|---|---|---|---|
| img | `/assets/img/films/savoy/675eb91e-savoy.webp` | dc-bg-img | srcset 500w 800w 1080w 1600w 1920w; sizes="100vw"; loading=lazy; alt="" | 210 KB |
| img | `/assets/img/films/savoy/Savoy-0-01-02-06.webp` | cs-footage-img [data-imgparallax="1"] | loading=eager; alt="" | 14 KB |
| img | `/assets/img/films/savoy/Savoy-0-02-12-07.webp` | cs-footage-img [data-imgparallax="1"] | loading=eager; alt="" | 5 KB |
| img | `/assets/img/films/savoy/Savoy-0-02-20-02.webp` | cs-footage-img [data-imgparallax="1"] | loading=eager; alt="" | 7 KB |
| img | `/assets/img/films/savoy/Savoy-0-02-35-15.webp` | cs-footage-img [data-imgparallax="1"] | loading=eager; alt="" | 8 KB |
| img | `/assets/img/films/savoy/Savoy-0-02-51-05.webp` | cs-footage-img [data-imgparallax="1"] | loading=eager; alt="" | 10 KB |
| img | `/assets/img/films/savoy/Savoy-0-03-53-11.webp` | cs-footage-img [data-imgparallax="1"] | loading=eager; alt="" | 10 KB |
| img | `/assets/img/films/savoy/Savoy-0-05-03-12.webp` | cs-footage-img [data-imgparallax="1"] | loading=eager; alt="" | 9 KB |
| img | `/assets/img/films/savoy/Savoy-0-06-29-02.webp` | cs-footage-img [data-imgparallax="1"] | loading=eager; alt="" | 4 KB |
| img | `/assets/img/films/savoy/Savoy-0-11-01-11.webp` | cs-footage-img [data-imgparallax="1"] | loading=eager; alt="" | 7 KB |
| img | `/assets/img/films/savoy/Savoy-0-12-11-12.webp` | cs-footage-img [data-imgparallax="1"] | loading=eager; alt="" | 6 KB |
| img | `/assets/img/films/savoy/Savoy-0-14-39-08.webp` | cs-footage-img [data-imgparallax="1"] | loading=eager; alt="" | 13 KB |
| img | `/assets/img/films/savoy/Savoy-0-14-47-03.webp` | cs-footage-img [data-imgparallax="1"] | loading=eager; alt="" | 11 KB |
| img | `/assets/img/films/savoy/Savoy-0-17-22-18.webp` | cs-footage-img [data-imgparallax="1"] | loading=eager; alt="" | 6 KB |
| img | `/assets/img/films/savoy/Savoy-0-20-37-07.webp` | cs-footage-img [data-imgparallax="1"] | loading=eager; alt="" | 6 KB |
| img | `/assets/img/films/savoy/Savoy-0-24-07-10.webp` | cs-footage-img [data-imgparallax="1"] | loading=eager; alt="" | 12 KB |
| img | `/assets/img/films/savoy/Savoy-0-25-09-16.webp` | cs-footage-img [data-imgparallax="1"] | loading=eager; alt="" | 9 KB |
| img | `/assets/img/films/savoy/Savoy-0-26-58-14.webp` | cs-footage-img [data-imgparallax="1"] | loading=eager; alt="" | 27 KB |
| img | `/assets/img/films/savoy/Savoy-0-30-59-20.webp` | cs-footage-img [data-imgparallax="1"] | loading=eager; alt="" | 6 KB |
| img | `/assets/img/films/savoy/Savoy-0-32-25-10.webp` | cs-footage-img [data-imgparallax="1"] | loading=eager; alt="" | 5 KB |
| img | `/assets/img/films/savoy/Savoy-0-32-56-13.webp` | cs-footage-img [data-imgparallax="1"] | loading=eager; alt="" | 14 KB |
| img | `/assets/img/films/savoy/Savoy-0-36-18-21.webp` | cs-footage-img [data-imgparallax="1"] | loading=eager; alt="" | 7 KB |
| img | `/assets/img/films/savoy/Savoy-0-42-24-15.webp` | cs-footage-img [data-imgparallax="1"] | loading=eager; alt="" | 8 KB |
| img | `/assets/img/films/savoy/Savoy-0-01-02-06.webp` | cs-footage-img [data-imgparallax="1"] | loading=lazy; alt="" | 14 KB |
| img | `/assets/img/films/savoy/Savoy-0-02-12-07.webp` | cs-footage-img [data-imgparallax="1"] | loading=lazy; alt="" | 5 KB |
| img | `/assets/img/films/savoy/Savoy-0-02-20-02.webp` | cs-footage-img [data-imgparallax="1"] | loading=lazy; alt="" | 7 KB |
| img | `/assets/img/films/savoy/Savoy-0-02-35-15.webp` | cs-footage-img [data-imgparallax="1"] | loading=lazy; alt="" | 8 KB |
| img | `/assets/img/films/savoy/Savoy-0-02-51-05.webp` | cs-footage-img [data-imgparallax="1"] | loading=lazy; alt="" | 10 KB |
| img | `/assets/img/films/savoy/Savoy-0-03-53-11.webp` | cs-footage-img [data-imgparallax="1"] | loading=lazy; alt="" | 10 KB |
| img | `/assets/img/films/savoy/Savoy-0-05-03-12.webp` | cs-footage-img [data-imgparallax="1"] | loading=lazy; alt="" | 9 KB |
| img | `/assets/img/films/savoy/Savoy-0-06-29-02.webp` | cs-footage-img [data-imgparallax="1"] | loading=lazy; alt="" | 4 KB |
| img | `/assets/img/films/savoy/Savoy-0-11-01-11.webp` | cs-footage-img [data-imgparallax="1"] | loading=lazy; alt="" | 7 KB |
| img | `/assets/img/films/savoy/Savoy-0-12-11-12.webp` | cs-footage-img [data-imgparallax="1"] | loading=lazy; alt="" | 6 KB |
| img | `/assets/img/films/savoy/Savoy-0-14-39-08.webp` | cs-footage-img [data-imgparallax="1"] | loading=lazy; alt="" | 13 KB |
| img | `/assets/img/films/savoy/Savoy-0-14-47-03.webp` | cs-footage-img [data-imgparallax="1"] | loading=lazy; alt="" | 11 KB |
| img | `/assets/img/films/savoy/Savoy-0-17-22-18.webp` | cs-footage-img [data-imgparallax="1"] | loading=lazy; alt="" | 6 KB |
| img | `/assets/img/films/savoy/Savoy-0-20-37-07.webp` | cs-footage-img [data-imgparallax="1"] | loading=lazy; alt="" | 6 KB |
| img | `/assets/img/films/savoy/Savoy-0-24-07-10.webp` | cs-footage-img [data-imgparallax="1"] | loading=lazy; alt="" | 12 KB |
| img | `/assets/img/films/savoy/Savoy-0-25-09-16.webp` | cs-footage-img [data-imgparallax="1"] | loading=lazy; alt="" | 9 KB |
| img | `/assets/img/films/savoy/Savoy-0-26-58-14.webp` | cs-footage-img [data-imgparallax="1"] | loading=lazy; alt="" | 27 KB |
| img | `/assets/img/films/savoy/Savoy-0-30-59-20.webp` | cs-footage-img [data-imgparallax="1"] | loading=lazy; alt="" | 6 KB |
| img | `/assets/img/films/savoy/Savoy-0-32-25-10.webp` | cs-footage-img [data-imgparallax="1"] | loading=lazy; alt="" | 5 KB |
| img | `/assets/img/films/savoy/Savoy-0-32-56-13.webp` | cs-footage-img [data-imgparallax="1"] | loading=lazy; alt="" | 14 KB |
| img | `/assets/img/films/savoy/Savoy-0-36-18-21.webp` | cs-footage-img [data-imgparallax="1"] | loading=lazy; alt="" | 7 KB |
| img | `/assets/img/films/savoy/Savoy-0-42-24-15.webp` | cs-footage-img [data-imgparallax="1"] | loading=lazy; alt="" | 8 KB |
| wf-template | (none) | script#wf-template-21c246c0-e275-2dd4-39f0-f75587b6455a | URI-encoded Webflow repeater template (type=text/x-wf-template), must be copied byte-exact | ok |
| wf-template | (none) | script#wf-template-dd5cf285-f6f9-d6ef-19b7-efdc14d5f7a1 | URI-encoded Webflow repeater template (type=text/x-wf-template), must be copied byte-exact | ok |

## 6. `div.s.prizes.bg-white`

Festivals / prizes: vertical CSS marquee built from 7 identical copies of the CMS list (app.js appends one more clone at runtime) + parallax still

### Copy (verbatim)

```text
┄ 7× identical div.w-dyn-list:
  ┄ div.prize-coll-it.w-dyn-item:
    div.roll-cont-eyeb.parish.mb-0: International Competition
    h3.prize-he: Fipadoc Biarritz
  ┄ div.prize-coll-it.w-dyn-item:
    div.roll-cont-eyeb.parish.mb-0: Documentary Competition
    h3.prize-he: Israeli Film Festival of Paris
  ┄ div.prize-coll-it.w-dyn-item:
    div.roll-cont-eyeb.parish.mb-0: International Competition
    h3.prize-he: Santa Barbara International Film Festival
  ┄ div.prize-coll-it.w-dyn-item:
    div.roll-cont-eyeb.parish.mb-0: International Competition
    h3.prize-he: Human Rights Film Festival Of Catalonia
  ┄ div.prize-coll-it.w-dyn-item:
    div.roll-cont-eyeb.parish.mb-0: Official Selection
    h3.prize-he: Krakow Film Festival
  ┄ div.prize-coll-it.w-dyn-item:
    div.roll-cont-eyeb.parish.mb-0: International Competition
    h3.prize-he: Israeli and Jewish Film Festival of Roma
  ┄ div.prize-coll-it.w-dyn-item:
    div.roll-cont-eyeb.parish.mb-0: International Competition
    h3.prize-he: JIFF Jewish International Film Festival
  ┄ div.prize-coll-it.w-dyn-item:
    div.roll-cont-eyeb.parish.mb-0: International Competition
    h3.prize-he: U.K. Jewish Film Festival
  ┄ div.prize-coll-it.w-dyn-item:
    div.roll-cont-eyeb.parish.mb-0: International Competition
    h3.prize-he: Warsaw Film Festival
  ┄ div.prize-coll-it.w-dyn-item:
    div.roll-cont-eyeb.parish.mb-0: International Competition
    h3.prize-he: Atlanta Jewish Film Festival
  ┄ div.prize-coll-it.w-dyn-item:
    div.roll-cont-eyeb.parish.mb-0: International Competition
    h3.prize-he: Seattle Jewish Film Festival
  ┄ div.prize-coll-it.w-dyn-item:
    div.roll-cont-eyeb.parish.mb-0: International Competition
    h3.prize-he: Boca Raton Jewish Film Festival
  ┄ div.prize-coll-it.w-dyn-item:
    div.roll-cont-eyeb.parish.mb-0: Best Editing Award, Best Art Direction
    h3.prize-he: Ophir Awards
  ┄ div.prize-coll-it.w-dyn-item:
    div.roll-cont-eyeb.parish.mb-0: International Competition
    h3.prize-he: Jerusalem Film Festival
```

### Links

_No links._

### Media

| kind | local path | element | details | on disk |
|---|---|---|---|---|
| img | `/assets/img/films/savoy/FIPADOC.png` | prize-it-img | loading=eager; alt="" | 11 KB |
| img | `/assets/img/webflow/placeholder.60f9b1840c.svg` | prize-it-img.w-dyn-bind-empty | loading=eager; alt="" | 0 KB |
| img | `/assets/img/films/savoy/Santa-Barbara-International-Film-Festival.png` | prize-it-img | loading=eager; alt="" | 23 KB |
| img | `/assets/img/webflow/placeholder.60f9b1840c.svg` | prize-it-img.w-dyn-bind-empty | loading=eager; alt="" | 0 KB |
| img | `/assets/img/films/savoy/Krakow-Film-Festival.png` | prize-it-img | loading=eager; alt="" | 35 KB |
| img | `/assets/img/webflow/placeholder.60f9b1840c.svg` | prize-it-img.w-dyn-bind-empty | loading=eager; alt="" | 0 KB |
| img | `/assets/img/films/_shared/JIFF.png` | prize-it-img | loading=eager; alt="" | 9 KB |
| img | `/assets/img/films/savoy/UK-Jewish-Film-Festival.png` | prize-it-img | loading=eager; alt="" | 8 KB |
| img | `/assets/img/films/_shared/Warsaw-Film-Festival.png` | prize-it-img | loading=eager; alt="" | 15 KB |
| img | `/assets/img/films/savoy/Atlanta-Jewish-Film-Festival.png` | prize-it-img | loading=eager; alt="" | 18 KB |
| img | `/assets/img/films/savoy/Seattle-Jewish-Film-Festival.png` | prize-it-img | loading=eager; alt="" | 20 KB |
| img | `/assets/img/films/savoy/Boca-International-Jewish-Film-Festival.png` | prize-it-img | loading=eager; alt="" | 26 KB |
| img | `/assets/img/films/savoy/Ophir-Awards.png` | prize-it-img | loading=eager; alt="" | 17 KB |
| img | `/assets/img/films/_shared/JIFF.png` | prize-it-img | loading=eager; alt="" | 9 KB |
| img | `/assets/img/films/savoy/FIPADOC.png` | prize-it-img | loading=lazy; alt="" | 11 KB |
| img | `/assets/img/webflow/placeholder.60f9b1840c.svg` | prize-it-img.w-dyn-bind-empty | loading=lazy; alt="" | 0 KB |
| img | `/assets/img/films/savoy/Santa-Barbara-International-Film-Festival.png` | prize-it-img | loading=lazy; alt="" | 23 KB |
| img | `/assets/img/webflow/placeholder.60f9b1840c.svg` | prize-it-img.w-dyn-bind-empty | loading=lazy; alt="" | 0 KB |
| img | `/assets/img/films/savoy/Krakow-Film-Festival.png` | prize-it-img | loading=lazy; alt="" | 35 KB |
| img | `/assets/img/webflow/placeholder.60f9b1840c.svg` | prize-it-img.w-dyn-bind-empty | loading=lazy; alt="" | 0 KB |
| img | `/assets/img/films/_shared/JIFF.png` | prize-it-img | loading=lazy; alt="" | 9 KB |
| img | `/assets/img/films/savoy/UK-Jewish-Film-Festival.png` | prize-it-img | loading=lazy; alt="" | 8 KB |
| img | `/assets/img/films/_shared/Warsaw-Film-Festival.png` | prize-it-img | loading=lazy; alt="" | 15 KB |
| img | `/assets/img/films/savoy/Atlanta-Jewish-Film-Festival.png` | prize-it-img | loading=lazy; alt="" | 18 KB |
| img | `/assets/img/films/savoy/Seattle-Jewish-Film-Festival.png` | prize-it-img | loading=lazy; alt="" | 20 KB |
| img | `/assets/img/films/savoy/Boca-International-Jewish-Film-Festival.png` | prize-it-img | loading=lazy; alt="" | 26 KB |
| img | `/assets/img/films/savoy/Ophir-Awards.png` | prize-it-img | loading=lazy; alt="" | 17 KB |
| img | `/assets/img/films/_shared/JIFF.png` | prize-it-img | loading=lazy; alt="" | 9 KB |
| img | `/assets/img/films/savoy/FIPADOC.png` | prize-it-img | loading=lazy; alt="" | 11 KB |
| img | `/assets/img/webflow/placeholder.60f9b1840c.svg` | prize-it-img.w-dyn-bind-empty | loading=lazy; alt="" | 0 KB |
| img | `/assets/img/films/savoy/Santa-Barbara-International-Film-Festival.png` | prize-it-img | loading=lazy; alt="" | 23 KB |
| img | `/assets/img/webflow/placeholder.60f9b1840c.svg` | prize-it-img.w-dyn-bind-empty | loading=lazy; alt="" | 0 KB |
| img | `/assets/img/films/savoy/Krakow-Film-Festival.png` | prize-it-img | loading=lazy; alt="" | 35 KB |
| img | `/assets/img/webflow/placeholder.60f9b1840c.svg` | prize-it-img.w-dyn-bind-empty | loading=lazy; alt="" | 0 KB |
| img | `/assets/img/films/_shared/JIFF.png` | prize-it-img | loading=lazy; alt="" | 9 KB |
| img | `/assets/img/films/savoy/UK-Jewish-Film-Festival.png` | prize-it-img | loading=lazy; alt="" | 8 KB |
| img | `/assets/img/films/_shared/Warsaw-Film-Festival.png` | prize-it-img | loading=lazy; alt="" | 15 KB |
| img | `/assets/img/films/savoy/Atlanta-Jewish-Film-Festival.png` | prize-it-img | loading=lazy; alt="" | 18 KB |
| img | `/assets/img/films/savoy/Seattle-Jewish-Film-Festival.png` | prize-it-img | loading=lazy; alt="" | 20 KB |
| img | `/assets/img/films/savoy/Boca-International-Jewish-Film-Festival.png` | prize-it-img | loading=lazy; alt="" | 26 KB |
| img | `/assets/img/films/savoy/Ophir-Awards.png` | prize-it-img | loading=lazy; alt="" | 17 KB |
| img | `/assets/img/films/_shared/JIFF.png` | prize-it-img | loading=lazy; alt="" | 9 KB |
| img | `/assets/img/films/savoy/FIPADOC.png` | prize-it-img | loading=eager; alt="" | 11 KB |
| img | `/assets/img/webflow/placeholder.60f9b1840c.svg` | prize-it-img.w-dyn-bind-empty | loading=eager; alt="" | 0 KB |
| img | `/assets/img/films/savoy/Santa-Barbara-International-Film-Festival.png` | prize-it-img | loading=eager; alt="" | 23 KB |
| img | `/assets/img/webflow/placeholder.60f9b1840c.svg` | prize-it-img.w-dyn-bind-empty | loading=eager; alt="" | 0 KB |
| img | `/assets/img/films/savoy/Krakow-Film-Festival.png` | prize-it-img | loading=eager; alt="" | 35 KB |
| img | `/assets/img/webflow/placeholder.60f9b1840c.svg` | prize-it-img.w-dyn-bind-empty | loading=eager; alt="" | 0 KB |
| img | `/assets/img/films/_shared/JIFF.png` | prize-it-img | loading=eager; alt="" | 9 KB |
| img | `/assets/img/films/savoy/UK-Jewish-Film-Festival.png` | prize-it-img | loading=eager; alt="" | 8 KB |
| img | `/assets/img/films/_shared/Warsaw-Film-Festival.png` | prize-it-img | loading=eager; alt="" | 15 KB |
| img | `/assets/img/films/savoy/Atlanta-Jewish-Film-Festival.png` | prize-it-img | loading=eager; alt="" | 18 KB |
| img | `/assets/img/films/savoy/Seattle-Jewish-Film-Festival.png` | prize-it-img | loading=eager; alt="" | 20 KB |
| img | `/assets/img/films/savoy/Boca-International-Jewish-Film-Festival.png` | prize-it-img | loading=eager; alt="" | 26 KB |
| img | `/assets/img/films/savoy/Ophir-Awards.png` | prize-it-img | loading=eager; alt="" | 17 KB |
| img | `/assets/img/films/_shared/JIFF.png` | prize-it-img | loading=eager; alt="" | 9 KB |
| img | `/assets/img/films/savoy/FIPADOC.png` | prize-it-img | loading=lazy; alt="" | 11 KB |
| img | `/assets/img/webflow/placeholder.60f9b1840c.svg` | prize-it-img.w-dyn-bind-empty | loading=lazy; alt="" | 0 KB |
| img | `/assets/img/films/savoy/Santa-Barbara-International-Film-Festival.png` | prize-it-img | loading=lazy; alt="" | 23 KB |
| img | `/assets/img/webflow/placeholder.60f9b1840c.svg` | prize-it-img.w-dyn-bind-empty | loading=lazy; alt="" | 0 KB |
| img | `/assets/img/films/savoy/Krakow-Film-Festival.png` | prize-it-img | loading=lazy; alt="" | 35 KB |
| img | `/assets/img/webflow/placeholder.60f9b1840c.svg` | prize-it-img.w-dyn-bind-empty | loading=lazy; alt="" | 0 KB |
| img | `/assets/img/films/_shared/JIFF.png` | prize-it-img | loading=lazy; alt="" | 9 KB |
| img | `/assets/img/films/savoy/UK-Jewish-Film-Festival.png` | prize-it-img | loading=lazy; alt="" | 8 KB |
| img | `/assets/img/films/_shared/Warsaw-Film-Festival.png` | prize-it-img | loading=lazy; alt="" | 15 KB |
| img | `/assets/img/films/savoy/Atlanta-Jewish-Film-Festival.png` | prize-it-img | loading=lazy; alt="" | 18 KB |
| img | `/assets/img/films/savoy/Seattle-Jewish-Film-Festival.png` | prize-it-img | loading=lazy; alt="" | 20 KB |
| img | `/assets/img/films/savoy/Boca-International-Jewish-Film-Festival.png` | prize-it-img | loading=lazy; alt="" | 26 KB |
| img | `/assets/img/films/savoy/Ophir-Awards.png` | prize-it-img | loading=lazy; alt="" | 17 KB |
| img | `/assets/img/films/_shared/JIFF.png` | prize-it-img | loading=lazy; alt="" | 9 KB |
| img | `/assets/img/films/savoy/FIPADOC.png` | prize-it-img | loading=lazy; alt="" | 11 KB |
| img | `/assets/img/webflow/placeholder.60f9b1840c.svg` | prize-it-img.w-dyn-bind-empty | loading=lazy; alt="" | 0 KB |
| img | `/assets/img/films/savoy/Santa-Barbara-International-Film-Festival.png` | prize-it-img | loading=lazy; alt="" | 23 KB |
| img | `/assets/img/webflow/placeholder.60f9b1840c.svg` | prize-it-img.w-dyn-bind-empty | loading=lazy; alt="" | 0 KB |
| img | `/assets/img/films/savoy/Krakow-Film-Festival.png` | prize-it-img | loading=lazy; alt="" | 35 KB |
| img | `/assets/img/webflow/placeholder.60f9b1840c.svg` | prize-it-img.w-dyn-bind-empty | loading=lazy; alt="" | 0 KB |
| img | `/assets/img/films/_shared/JIFF.png` | prize-it-img | loading=lazy; alt="" | 9 KB |
| img | `/assets/img/films/savoy/UK-Jewish-Film-Festival.png` | prize-it-img | loading=lazy; alt="" | 8 KB |
| img | `/assets/img/films/_shared/Warsaw-Film-Festival.png` | prize-it-img | loading=lazy; alt="" | 15 KB |
| img | `/assets/img/films/savoy/Atlanta-Jewish-Film-Festival.png` | prize-it-img | loading=lazy; alt="" | 18 KB |
| img | `/assets/img/films/savoy/Seattle-Jewish-Film-Festival.png` | prize-it-img | loading=lazy; alt="" | 20 KB |
| img | `/assets/img/films/savoy/Boca-International-Jewish-Film-Festival.png` | prize-it-img | loading=lazy; alt="" | 26 KB |
| img | `/assets/img/films/savoy/Ophir-Awards.png` | prize-it-img | loading=lazy; alt="" | 17 KB |
| img | `/assets/img/films/_shared/JIFF.png` | prize-it-img | loading=lazy; alt="" | 9 KB |
| img | `/assets/img/films/savoy/FIPADOC.png` | prize-it-img | loading=lazy; alt="" | 11 KB |
| img | `/assets/img/webflow/placeholder.60f9b1840c.svg` | prize-it-img.w-dyn-bind-empty | loading=lazy; alt="" | 0 KB |
| img | `/assets/img/films/savoy/Santa-Barbara-International-Film-Festival.png` | prize-it-img | loading=lazy; alt="" | 23 KB |
| img | `/assets/img/webflow/placeholder.60f9b1840c.svg` | prize-it-img.w-dyn-bind-empty | loading=lazy; alt="" | 0 KB |
| img | `/assets/img/films/savoy/Krakow-Film-Festival.png` | prize-it-img | loading=lazy; alt="" | 35 KB |
| img | `/assets/img/webflow/placeholder.60f9b1840c.svg` | prize-it-img.w-dyn-bind-empty | loading=lazy; alt="" | 0 KB |
| img | `/assets/img/films/_shared/JIFF.png` | prize-it-img | loading=lazy; alt="" | 9 KB |
| img | `/assets/img/films/savoy/UK-Jewish-Film-Festival.png` | prize-it-img | loading=lazy; alt="" | 8 KB |
| img | `/assets/img/films/_shared/Warsaw-Film-Festival.png` | prize-it-img | loading=lazy; alt="" | 15 KB |
| img | `/assets/img/films/savoy/Atlanta-Jewish-Film-Festival.png` | prize-it-img | loading=lazy; alt="" | 18 KB |
| img | `/assets/img/films/savoy/Seattle-Jewish-Film-Festival.png` | prize-it-img | loading=lazy; alt="" | 20 KB |
| img | `/assets/img/films/savoy/Boca-International-Jewish-Film-Festival.png` | prize-it-img | loading=lazy; alt="" | 26 KB |
| img | `/assets/img/films/savoy/Ophir-Awards.png` | prize-it-img | loading=lazy; alt="" | 17 KB |
| img | `/assets/img/films/_shared/JIFF.png` | prize-it-img | loading=lazy; alt="" | 9 KB |
| img | `/assets/img/films/savoy/675eb91e-savoy.webp` | image-2 | srcset 500w 800w 1080w 1600w 1920w; sizes="100vw"; loading=eager; alt="" | 210 KB |

## 7. `div.s.investor.bg-white`

Investors & Broadcast heading + rich text

### Copy (verbatim)

```text
h2.investor-he: Investors & Broadcast
div.investor-rt.w-richtext (rich text):
  <h3> <strong>Kan - Israeli Public Broadcast Corporation, ORF,RBB, ARTE, SVTGesher Multicultural Film Fund, The New Fundfor Cinema and TV, Siena Film Foundation, KGP Vienna</strong>
```

### Links

_No links._

### Media

_No media._

## 8. `div.s.next-proj.bg-white`

ALL WORK CTA (→ /work) + next-film card: all 9 films are rendered, app.js keeps only the one after the current film (wraps to the first)

### Copy (verbatim)

```text
div.roll-cont-eyeb.parish.mb-2: Showcase
div.previousnext-he: ALL WORK
div.text-block-10: Explore
┄ div.previousnext-item.w-dyn-item data-id/url=savoy:
  div.roll-cont-eyeb.parish.mb-2: Showcase
  div.previousnext-he: Savoy
  div.text-block-10: NEXT
┄ div.previousnext-item.w-dyn-item data-id/url=moon-in-the-12th-house:
  div.roll-cont-eyeb.parish.mb-2: Showcase
  div.previousnext-he: Moon in the 12th House
  div.text-block-10: NEXT
┄ div.previousnext-item.w-dyn-item data-id/url=taboo:
  div.roll-cont-eyeb.parish.mb-2: Showcase
  div.previousnext-he: Taboo
  div.text-block-10: NEXT
┄ div.previousnext-item.w-dyn-item data-id/url=kafkas-last-trial:
  div.roll-cont-eyeb.parish.mb-2: Showcase
  div.previousnext-he: Kafka's Last Trial
  div.text-block-10: NEXT
┄ div.previousnext-item.w-dyn-item data-id/url=my-project-x:
  div.roll-cont-eyeb.parish.mb-2: Showcase
  div.previousnext-he: My Project X
  div.text-block-10: NEXT
┄ div.previousnext-item.w-dyn-item data-id/url=ana-maxim:
  div.roll-cont-eyeb.parish.mb-2: Showcase
  div.previousnext-he: Ana Maxim
  div.text-block-10: NEXT
┄ div.previousnext-item.w-dyn-item data-id/url=outsider-freud:
  div.roll-cont-eyeb.parish.mb-2: Showcase
  div.previousnext-he: Outsider Freud
  div.text-block-10: NEXT
┄ div.previousnext-item.w-dyn-item data-id/url=by-any-means:
  div.roll-cont-eyeb.parish.mb-2: Showcase
  div.previousnext-he: By Any Means
  div.text-block-10: NEXT
┄ div.previousnext-item.w-dyn-item data-id/url=thehousewife:
  div.roll-cont-eyeb.parish.mb-2: Showcase
  div.previousnext-he: The Housewife
  div.text-block-10: NEXT
```

### Links

| text | href | type | target | element / notes |
|---|---|---|---|---|
| Showcase · ALL WORK · Explore | `/work` | internal |  | all-work-cta-w.w-inline-block |
| (empty) | `/films/savoy` | internal |  | abs.next-link.w-inline-block.w--current aria-current=page data-pnext="hover" |
| (empty) | `/films/moon-in-the-12th-house` | internal |  | abs.next-link.w-inline-block data-pnext="hover" |
| (empty) | `/films/taboo` | internal |  | abs.next-link.w-inline-block data-pnext="hover" |
| (empty) | `/films/kafkas-last-trial` | internal |  | abs.next-link.w-inline-block data-pnext="hover" |
| (empty) | `/films/my-project-x` | internal |  | abs.next-link.w-inline-block data-pnext="hover" |
| (empty) | `/films/ana-maxim` | internal |  | abs.next-link.w-inline-block data-pnext="hover" |
| (empty) | `/films/outsider-freud` | internal |  | abs.next-link.w-inline-block data-pnext="hover" |
| (empty) | `/films/by-any-means` | internal |  | abs.next-link.w-inline-block data-pnext="hover" |
| (empty) | `/films/thehousewife` | internal |  | abs.next-link.w-inline-block data-pnext="hover" |

Resource hints inside this block (`<link>` elements): `prefetch:/films/savoy`, `prefetch:/films/moon-in-the-12th-house`, `prefetch:/films/taboo`, `prefetch:/films/kafkas-last-trial`, `prefetch:/films/my-project-x`, `prefetch:/films/ana-maxim`, `prefetch:/films/outsider-freud`, `prefetch:/films/by-any-means`, `prefetch:/films/thehousewife` (9 total)

### Media

| kind | local path | element | details | on disk |
|---|---|---|---|---|
| img | `/assets/img/films/savoy/675eb91e-savoy.webp` | prevnext-img [data-pnext="img"] | srcset 500w 800w 1080w 1600w 1920w; sizes="(max-width: 767px) 100vw, (max-width: 991px) 73vw, 74vw"; loading=lazy; alt="" | 210 KB |
| img | `/assets/img/films/moon-in-the-12th-house/moon.jpg` | prevnext-img [data-pnext="img"] | srcset 500w 800w 1080w 1600w 1920w; sizes="(max-width: 767px) 100vw, (max-width: 991px) 73vw, 74vw"; loading=lazy; alt="" | 1050 KB |
| img | `/assets/img/films/taboo/675eb903-taboo.webp` | prevnext-img [data-pnext="img"] | srcset 500w 800w 1080w 1600w 1920w; sizes="(max-width: 767px) 100vw, (max-width: 991px) 73vw, 74vw"; loading=lazy; alt="" | 282 KB |
| img | `/assets/img/films/kafkas-last-trial/kafka.jpg` | prevnext-img [data-pnext="img"] | srcset 500w 800w 1080w 1600w 1920w; sizes="(max-width: 767px) 100vw, (max-width: 991px) 73vw, 74vw"; loading=lazy; alt="" | 659 KB |
| img | `/assets/img/films/my-project-x/project.jpg` | prevnext-img [data-pnext="img"] | srcset 500w 800w 1080w 1600w 1920w; sizes="(max-width: 767px) 100vw, (max-width: 991px) 73vw, 74vw"; loading=lazy; alt="" | 987 KB |
| img | `/assets/img/films/ana-maxim/ana.jpg` | prevnext-img [data-pnext="img"] | srcset 500w 800w 1080w 1600w 1920w; sizes="(max-width: 767px) 100vw, (max-width: 991px) 73vw, 74vw"; loading=lazy; alt="" | 1085 KB |
| img | `/assets/img/films/outsider-freud/freud.jpg` | prevnext-img [data-pnext="img"] | srcset 500w 800w 1080w 1600w 1920w; sizes="(max-width: 767px) 100vw, (max-width: 991px) 73vw, 74vw"; loading=lazy; alt="" | 910 KB |
| img | `/assets/img/films/by-any-means/6a57521a-BYANYMEANS_2024-04-28_EJA-02511_R1.webp` | prevnext-img [data-pnext="img"] | srcset 500w 800w 1080w 1600w 2000w 2600w 3200w 3900w; sizes="(max-width: 767px) 100vw, (max-width: 991px) 73vw, 74vw"; loading=lazy; alt="" | 399 KB |
| img | `/assets/img/films/thehousewife/housewife2.jpg` | prevnext-img [data-pnext="img"] | loading=lazy; alt="" | 20 KB |

## 9. `footer.s.footer`

Shared footer component — see [_shared-footer.md](./_shared-footer.md)

Copy, links and media are documented once in the shared component docs.

## 10. `div.div-block-44`

Rotate-your-device notice (CSS: visible only 480–767px wide; see INVENTORY §e)

### Copy (verbatim)

```text
div.paragraph: Rotate your device⏎to ensure a better experience
```

### Links

_No links._

### Media

_No media._
