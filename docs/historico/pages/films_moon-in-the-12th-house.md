# /films/moon-in-the-12th-house — `films_moon-in-the-12th-house`

Generated from `reference/localized/films_moon-in-the-12th-house.html` (Last Published: Sun Mar 09 2025). Conventions: see [INVENTORY.md](../INVENTORY.md#conventions-used-in-docspages).

## Document / head

| field | value |
|---|---|
| route | `/films/moon-in-the-12th-house` |
| `<title>` | Siena Film Foundation \| Moon in the 12th House |
| html attributes | `data-wf-domain="www.siena.film"` `data-wf-page="673306dca8fcb48d30953c00"` `data-wf-site="6728a72e769070a603d43c13"` `lang="en"` `data-wf-collection="673306dba8fcb48d30953be7"` `data-wf-item-slug="moon-in-the-12th-house"` |
| meta description | When estranged sisters Lenny, who stayed to care for their ailing father, and Mira, who left for a new life in Tel Aviv, are reunited, they must confront the circumstances that drove them apart. Their bond of love and affection leads them toward fragile redemption. |
| og:title / og:image | Siena Film Foundation \| Moon in the 12th House / `/assets/img/films/moon-in-the-12th-house/moon.jpg` |
| twitter:* attribute | `name=` |
| preconnect link | yes |
| body children (order) | `div.w-embed` → `div.w` → `div.canvas` → `div.div-block-44` → `script[src=/assets/js/jquery-3.5.1.min.js]` → `script[src=/assets/js/webflow.schunk.js]` → `script[src=/assets/js/webflow.js]` → `script(inline)` |
| page view element | `<div data-case="moon-in-the-12th-house" data-taxi-view="" data-page="case" class="pw cs">` |
| scripts (src) | `/assets/js/jquery-3.5.1.min.js`, `/assets/js/webflow.schunk.js`, `/assets/js/webflow.js` |

**Navigation:** Rendered by `<Nav currentPath="/films/moon-in-the-12th-house" />`. Elements carrying `w--current` + `aria-current="page"` here: `a.footagemenu-cta-w.w-inline-block.w--current` → `/films/moon-in-the-12th-house`, `a.menu-film-direct-link.w-inline-block.w--current` → `/films/moon-in-the-12th-house`. Case-panel text (`.case-menu-tx`): “When estranged sisters Lenny, who stayed to care for their ailing father, and Mira, who left for a new life in Tel Aviv, are reunited, they must confront the circumstances that drove them apart. Their bond of love and affection leads them toward fragile redemption.␠”.

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
div.roll-cont-eyeb.parish.larger.is-cs [data-a="alpha"]: Feature Film
h1.cs-title [data-cs="title"]: Moon in the 12th House
```

### Links

| text | href | type | target | element / notes |
|---|---|---|---|---|
| All Work | `/work` | internal |  | work-back-btn.w-inline-block |
| (icon) | `#second` | anchor |  | arrow-link-w.w-inline-block data-a="alpha" |

### Media

| kind | local path | element | details | on disk |
|---|---|---|---|---|
| img | `/assets/img/films/moon-in-the-12th-house/moon.jpg` | cs-main-img | srcset 500w 800w 1080w 1600w 1920w; sizes="100vw"; loading=lazy; alt="" | 1050 KB |

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
| img | `/assets/img/films/moon-in-the-12th-house/moon.jpg` | image-2 | srcset 500w 800w 1080w 1600w 1920w; sizes="(max-width: 767px) 100vw, 80vw"; loading=eager; alt="" | 1050 KB |
| video | `/assets/video/Moon.mp4` | videoplayer-vieo-comp | playsinline=true data-videoplayer=video | 16361 KB |

## 4. `div.s.cs-credits-w.bg-white`

Credits: DIRECTOR + poster image, credit grid (main row, producers row, Main Crew rows incl. dot-separated names list)

### Copy (verbatim)

```text
div.roll-cont-eyeb.parish: DIRECTOR
div.credit-name: Dorit Hakim Kramer
┄ div.credit-text.dash.white.w-dyn-item:
  div.roll-cont-eyeb.parish.mb-0: DOP
  div.credit-name: Amit Yasour
┄ div.credit-text.dash.white.w-dyn-item:
  div.roll-cont-eyeb.parish.mb-0: Editor
  div.credit-name: Tali Halter Shenkar
┄ div.credit-main-row-item.w-dyn-item:
  div.roll-cont-eyeb.parish.mb-0.credit-row-title [data-role="inherit"]: Producer
┄ 2× identical div.credit-main-row-item.w-dyn-item:
  div.roll-cont-eyeb.parish.mb-0.credit-row-title [data-role="inherit"]: Executive Producer
div.roll-cont-eyeb.parish.mb-0.credit-row-title: PRODUCErS
┄ div.credit-text.dash.w-dyn-item:
  div.roll-cont-eyeb.parish.is-role.is-main: Producer
  div.credit-name.smaller [data-role="Producer"]: David Mandil
┄ div.credit-text.dash.w-dyn-item:
  div.roll-cont-eyeb.parish.is-role.is-main: Executive Producer
  div.credit-name.smaller [data-role="Executive Producer"]: Michal Graidy
┄ div.credit-text.dash.w-dyn-item:
  div.roll-cont-eyeb.parish.is-role.is-main: Executive Producer
  div.credit-name.smaller [data-role="Executive Producer"]: Lee Shira
div.roll-cont-eyeb.parish.mb-0.credit-row-title: Main Crew
┄ div.credit-text.grow.last.w-dyn-item:
  div.roll-cont-eyeb.parish.is-role: Lead Actor
  div.credit-name.smallest: Gal Toren
┄ div.credit-text.grow.last.w-dyn-item:
  div.roll-cont-eyeb.parish.is-role: Lead Actor
  div.credit-name.smallest: Gefen Barkai
┄ div.credit-text.grow.last._1-4.w-dyn-item:
  div.roll-cont-eyeb.parish.is-role: Lead Actor
  div.roll-cont-eyeb.parish.is-role.w-condition-invisible {HIDDEN:w-condition-invisible}: CAST⏎
  div.credit-name.smallest: Gal Toren
┄ div.credit-text.grow.last._1-4.w-dyn-item:
  div.roll-cont-eyeb.parish.is-role: Lead Actor
  div.roll-cont-eyeb.parish.is-role.w-condition-invisible {HIDDEN:w-condition-invisible}: CAST⏎
  div.credit-name.smallest: Gefen Barkai
┄ div.credit-text.grow.last._1-4.w-dyn-item:
  div.roll-cont-eyeb.parish.is-role: Lead Actress
  div.roll-cont-eyeb.parish.is-role.w-condition-invisible {HIDDEN:w-condition-invisible}: CAST⏎
  div.credit-name.smallest: Yaara Pelzig
┄ div.credit-text.grow.last._1-4.w-dyn-item:
  div.roll-cont-eyeb.parish.is-role: Lead Actress
  div.roll-cont-eyeb.parish.is-role.w-condition-invisible {HIDDEN:w-condition-invisible}: CAST⏎
  div.credit-name.smallest: Yuval Schrf
┄ div.credit-text.grow.last.small.w-dyn-item:
  div.credit-name.smallest.last: Gal Toren
┄ div.credit-text.grow.last.small.w-dyn-item:
  div.credit-name.smallest.last: Gefen Barkai
┄ div.credit-text.grow.last.small.w-dyn-item:
  div.credit-name.smallest.last: Yaara Pelzig
┄ div.credit-text.grow.last.small.w-dyn-item:
  div.credit-name.smallest.last: Yuval Schrf
```

### Links

_No links._

### Media

| kind | local path | element | details | on disk |
|---|---|---|---|---|
| img | `/assets/img/films/moon-in-the-12th-house/moon-12-house.webp` | credit-main-img | srcset 500w 800w 1080w 1211w; sizes="(max-width: 991px) 100vw, 25vw"; loading=lazy; alt="" | 32 KB |

## 5. `div.section-w`

Sticky DIRECTOR’S CUT badge, GALLERY (two CMS footage strips moving in opposite directions with scroll) and REVIEWS drag slider

### Copy (verbatim)

```text
▸ div.dc-el {desktop-only(data-hide=mobile)}:
  div.dc-tx: DIRECTOR'S{nbsp}CUT
h2.ticket-btn-tx: GALLERY
┄ 2× identical div.cs-footage-c.w-dyn-list:
  ┄ 25× identical div.cs-footage-it.w-dyn-item.w-dyn-repeater-item:
    div.roll-cont-eyeb.parish.mb-0: VARIETY
    div.cs-footage-cont-he: "A cinematic triumph"
  ▸ div.w-dyn-hide.w-dyn-empty {Webflow empty-state, hidden via w-dyn-hide}:
    div: No items found.
h2.ticket-btn-tx: REVIEWS
┄ div.review-slider-slide.w-dyn-item:
  div.roll-cont-eyeb.parish.mobile-mb: Albert Gabai, Channel 1
  div.review-he: "A well-constructed drama with exquisite direction and performances."
┄ div.review-slider-slide.w-dyn-item:
  div.roll-cont-eyeb.parish.mobile-mb: Jury Statement, SIFF
  div.review-he: "An ordinary story becomes pure cinema with originality and elegance."
┄ div.review-slider-slide.w-dyn-item:
  div.roll-cont-eyeb.parish.mobile-mb: Marilyn Wang, Salona
  div.review-he: "Each shot in 'Moon in the 12th House' is an artistic composition."
┄ div.review-slider-slide.w-dyn-item:
  div.roll-cont-eyeb.parish.mobile-mb: Nahum Mochiah
  div.review-he: "An ambient film by Dorit Hakim, well worth looking into."
┄ div.review-slider-slide.w-dyn-item:
  div.roll-cont-eyeb.parish.mobile-mb: Yair Raveh, Cinemascope
  div.review-he: "The film is unmatched in beauty, mood, and every cinematic aspect."
┄ div.review-slider-slide.w-dyn-item:
  div.roll-cont-eyeb.parish.mobile-mb: Yair Raveh, Cinemascope
  div.review-he: "Visually stunning, magnetic leads, and outstanding cinematography."
┄ div.review-slider-slide.w-dyn-item:
  div.roll-cont-eyeb.parish.mobile-mb: Zohar Wagner, HaBama
  div.review-he: "A delicate, moving coming-of-age film that plucks at your heartstrings."
div.roll-cont-eyeb.parish.mb-0.darker.slider: 1/12
▸ div.div-block-34 {desktop-only(data-hide=mobile)}:
  div.roll-cont-eyeb.parish.mb-0.darker: DRAG{nbsp}TO{nbsp}DISCOVER
```

### Links

_No links._

### Media

| kind | local path | element | details | on disk |
|---|---|---|---|---|
| img | `/assets/img/films/moon-in-the-12th-house/moon.jpg` | dc-bg-img | srcset 500w 800w 1080w 1600w 1920w; sizes="100vw"; loading=lazy; alt="" | 1050 KB |
| img | `/assets/img/films/moon-in-the-12th-house/Moon12-Prores422hq-Lt-Rt-02.06.16-0-01-02-01.webp` | cs-footage-img [data-imgparallax="1"] | loading=eager; alt="" | 17 KB |
| img | `/assets/img/films/moon-in-the-12th-house/Moon12-Prores422hq-Lt-Rt-02.06.16-0-01-40-19.webp` | cs-footage-img [data-imgparallax="1"] | loading=eager; alt="" | 6 KB |
| img | `/assets/img/films/moon-in-the-12th-house/Moon12-Prores422hq-Lt-Rt-02.06.16-0-03-52-15.webp` | cs-footage-img [data-imgparallax="1"] | loading=eager; alt="" | 23 KB |
| img | `/assets/img/films/moon-in-the-12th-house/Moon12-Prores422hq-Lt-Rt-02.06.16-0-04-23-15.webp` | cs-footage-img [data-imgparallax="1"] | loading=eager; alt="" | 15 KB |
| img | `/assets/img/films/moon-in-the-12th-house/Moon12-Prores422hq-Lt-Rt-02.06.16-0-05-02-10.webp` | cs-footage-img [data-imgparallax="1"] | loading=eager; alt="" | 8 KB |
| img | `/assets/img/films/moon-in-the-12th-house/Moon12-Prores422hq-Lt-Rt-02.06.16-0-05-56-16.webp` | cs-footage-img [data-imgparallax="1"] | loading=eager; alt="" | 10 KB |
| img | `/assets/img/films/moon-in-the-12th-house/Moon12-Prores422hq-Lt-Rt-02.06.16-0-14-36-05.webp` | cs-footage-img [data-imgparallax="1"] | loading=eager; alt="" | 15 KB |
| img | `/assets/img/films/moon-in-the-12th-house/Moon12-Prores422hq-Lt-Rt-02.06.16-0-16-01-12.webp` | cs-footage-img [data-imgparallax="1"] | srcset 500w 600w; sizes="(max-width: 767px) 54vw, (max-width: 991px) 288px, 29vw"; loading=eager; alt="" | 33 KB |
| img | `/assets/img/films/moon-in-the-12th-house/Moon12-Prores422hq-Lt-Rt-02.06.16-0-17-03-13.webp` | cs-footage-img [data-imgparallax="1"] | loading=eager; alt="" | 25 KB |
| img | `/assets/img/films/moon-in-the-12th-house/Moon12-Prores422hq-Lt-Rt-02.06.16-0-17-26-19.webp` | cs-footage-img [data-imgparallax="1"] | loading=eager; alt="" | 14 KB |
| img | `/assets/img/films/moon-in-the-12th-house/Moon12-Prores422hq-Lt-Rt-02.06.16-0-21-42-16.webp` | cs-footage-img [data-imgparallax="1"] | loading=eager; alt="" | 14 KB |
| img | `/assets/img/films/moon-in-the-12th-house/Moon12-Prores422hq-Lt-Rt-02.06.16-0-22-21-11.webp` | cs-footage-img [data-imgparallax="1"] | loading=eager; alt="" | 11 KB |
| img | `/assets/img/films/moon-in-the-12th-house/Moon12-Prores422hq-Lt-Rt-02.06.16-0-26-14-02.webp` | cs-footage-img [data-imgparallax="1"] | loading=eager; alt="" | 5 KB |
| img | `/assets/img/films/moon-in-the-12th-house/Moon12-Prores422hq-Lt-Rt-02.06.16-0-28-33-15.webp` | cs-footage-img [data-imgparallax="1"] | loading=eager; alt="" | 12 KB |
| img | `/assets/img/films/moon-in-the-12th-house/Moon12-Prores422hq-Lt-Rt-02.06.16-0-30-29-23.webp` | cs-footage-img [data-imgparallax="1"] | loading=eager; alt="" | 13 KB |
| img | `/assets/img/films/moon-in-the-12th-house/Moon12-Prores422hq-Lt-Rt-02.06.16-0-38-38-11.webp` | cs-footage-img [data-imgparallax="1"] | loading=eager; alt="" | 8 KB |
| img | `/assets/img/films/moon-in-the-12th-house/Moon12-Prores422hq-Lt-Rt-02.06.16-0-39-48-06.webp` | cs-footage-img [data-imgparallax="1"] | loading=eager; alt="" | 10 KB |
| img | `/assets/img/films/moon-in-the-12th-house/Moon12-Prores422hq-Lt-Rt-02.06.16-0-42-46-14.webp` | cs-footage-img [data-imgparallax="1"] | loading=eager; alt="" | 10 KB |
| img | `/assets/img/films/moon-in-the-12th-house/Moon12-Prores422hq-Lt-Rt-02.06.16-0-56-51-19.webp` | cs-footage-img [data-imgparallax="1"] | loading=eager; alt="" | 11 KB |
| img | `/assets/img/films/moon-in-the-12th-house/Moon12-Prores422hq-Lt-Rt-02.06.16-0-58-40-08.webp` | cs-footage-img [data-imgparallax="1"] | loading=eager; alt="" | 32 KB |
| img | `/assets/img/films/moon-in-the-12th-house/Moon12-Prores422hq-Lt-Rt-02.06.16-1-01-15-10.webp` | cs-footage-img [data-imgparallax="1"] | loading=eager; alt="" | 15 KB |
| img | `/assets/img/films/moon-in-the-12th-house/Moon12-Prores422hq-Lt-Rt-02.06.16-1-01-23-04.webp` | cs-footage-img [data-imgparallax="1"] | loading=eager; alt="" | 25 KB |
| img | `/assets/img/films/moon-in-the-12th-house/Moon12-Prores422hq-Lt-Rt-02.06.16-1-06-48-20.webp` | cs-footage-img [data-imgparallax="1"] | loading=eager; alt="" | 8 KB |
| img | `/assets/img/films/moon-in-the-12th-house/Moon12-Prores422hq-Lt-Rt-02.06.16-1-07-04-08.webp` | cs-footage-img [data-imgparallax="1"] | loading=eager; alt="" | 18 KB |
| img | `/assets/img/films/moon-in-the-12th-house/Moon12-Prores422hq-Lt-Rt-02.06.16-1-10-25-23.webp` | cs-footage-img [data-imgparallax="1"] | loading=eager; alt="" | 15 KB |
| img | `/assets/img/films/moon-in-the-12th-house/Moon12-Prores422hq-Lt-Rt-02.06.16-0-01-02-01.webp` | cs-footage-img [data-imgparallax="1"] | loading=lazy; alt="" | 17 KB |
| img | `/assets/img/films/moon-in-the-12th-house/Moon12-Prores422hq-Lt-Rt-02.06.16-0-01-40-19.webp` | cs-footage-img [data-imgparallax="1"] | loading=lazy; alt="" | 6 KB |
| img | `/assets/img/films/moon-in-the-12th-house/Moon12-Prores422hq-Lt-Rt-02.06.16-0-03-52-15.webp` | cs-footage-img [data-imgparallax="1"] | loading=lazy; alt="" | 23 KB |
| img | `/assets/img/films/moon-in-the-12th-house/Moon12-Prores422hq-Lt-Rt-02.06.16-0-04-23-15.webp` | cs-footage-img [data-imgparallax="1"] | loading=lazy; alt="" | 15 KB |
| img | `/assets/img/films/moon-in-the-12th-house/Moon12-Prores422hq-Lt-Rt-02.06.16-0-05-02-10.webp` | cs-footage-img [data-imgparallax="1"] | loading=lazy; alt="" | 8 KB |
| img | `/assets/img/films/moon-in-the-12th-house/Moon12-Prores422hq-Lt-Rt-02.06.16-0-05-56-16.webp` | cs-footage-img [data-imgparallax="1"] | loading=lazy; alt="" | 10 KB |
| img | `/assets/img/films/moon-in-the-12th-house/Moon12-Prores422hq-Lt-Rt-02.06.16-0-14-36-05.webp` | cs-footage-img [data-imgparallax="1"] | loading=lazy; alt="" | 15 KB |
| img | `/assets/img/films/moon-in-the-12th-house/Moon12-Prores422hq-Lt-Rt-02.06.16-0-16-01-12.webp` | cs-footage-img [data-imgparallax="1"] | srcset 500w 600w; sizes="(max-width: 767px) 54vw, (max-width: 991px) 288px, 29vw"; loading=lazy; alt="" | 33 KB |
| img | `/assets/img/films/moon-in-the-12th-house/Moon12-Prores422hq-Lt-Rt-02.06.16-0-17-03-13.webp` | cs-footage-img [data-imgparallax="1"] | loading=lazy; alt="" | 25 KB |
| img | `/assets/img/films/moon-in-the-12th-house/Moon12-Prores422hq-Lt-Rt-02.06.16-0-17-26-19.webp` | cs-footage-img [data-imgparallax="1"] | loading=lazy; alt="" | 14 KB |
| img | `/assets/img/films/moon-in-the-12th-house/Moon12-Prores422hq-Lt-Rt-02.06.16-0-21-42-16.webp` | cs-footage-img [data-imgparallax="1"] | loading=lazy; alt="" | 14 KB |
| img | `/assets/img/films/moon-in-the-12th-house/Moon12-Prores422hq-Lt-Rt-02.06.16-0-22-21-11.webp` | cs-footage-img [data-imgparallax="1"] | loading=lazy; alt="" | 11 KB |
| img | `/assets/img/films/moon-in-the-12th-house/Moon12-Prores422hq-Lt-Rt-02.06.16-0-26-14-02.webp` | cs-footage-img [data-imgparallax="1"] | loading=lazy; alt="" | 5 KB |
| img | `/assets/img/films/moon-in-the-12th-house/Moon12-Prores422hq-Lt-Rt-02.06.16-0-28-33-15.webp` | cs-footage-img [data-imgparallax="1"] | loading=lazy; alt="" | 12 KB |
| img | `/assets/img/films/moon-in-the-12th-house/Moon12-Prores422hq-Lt-Rt-02.06.16-0-30-29-23.webp` | cs-footage-img [data-imgparallax="1"] | loading=lazy; alt="" | 13 KB |
| img | `/assets/img/films/moon-in-the-12th-house/Moon12-Prores422hq-Lt-Rt-02.06.16-0-38-38-11.webp` | cs-footage-img [data-imgparallax="1"] | loading=lazy; alt="" | 8 KB |
| img | `/assets/img/films/moon-in-the-12th-house/Moon12-Prores422hq-Lt-Rt-02.06.16-0-39-48-06.webp` | cs-footage-img [data-imgparallax="1"] | loading=lazy; alt="" | 10 KB |
| img | `/assets/img/films/moon-in-the-12th-house/Moon12-Prores422hq-Lt-Rt-02.06.16-0-42-46-14.webp` | cs-footage-img [data-imgparallax="1"] | loading=lazy; alt="" | 10 KB |
| img | `/assets/img/films/moon-in-the-12th-house/Moon12-Prores422hq-Lt-Rt-02.06.16-0-56-51-19.webp` | cs-footage-img [data-imgparallax="1"] | loading=lazy; alt="" | 11 KB |
| img | `/assets/img/films/moon-in-the-12th-house/Moon12-Prores422hq-Lt-Rt-02.06.16-0-58-40-08.webp` | cs-footage-img [data-imgparallax="1"] | loading=lazy; alt="" | 32 KB |
| img | `/assets/img/films/moon-in-the-12th-house/Moon12-Prores422hq-Lt-Rt-02.06.16-1-01-15-10.webp` | cs-footage-img [data-imgparallax="1"] | loading=lazy; alt="" | 15 KB |
| img | `/assets/img/films/moon-in-the-12th-house/Moon12-Prores422hq-Lt-Rt-02.06.16-1-01-23-04.webp` | cs-footage-img [data-imgparallax="1"] | loading=lazy; alt="" | 25 KB |
| img | `/assets/img/films/moon-in-the-12th-house/Moon12-Prores422hq-Lt-Rt-02.06.16-1-06-48-20.webp` | cs-footage-img [data-imgparallax="1"] | loading=lazy; alt="" | 8 KB |
| img | `/assets/img/films/moon-in-the-12th-house/Moon12-Prores422hq-Lt-Rt-02.06.16-1-07-04-08.webp` | cs-footage-img [data-imgparallax="1"] | loading=lazy; alt="" | 18 KB |
| img | `/assets/img/films/moon-in-the-12th-house/Moon12-Prores422hq-Lt-Rt-02.06.16-1-10-25-23.webp` | cs-footage-img [data-imgparallax="1"] | loading=lazy; alt="" | 15 KB |
| wf-template | (none) | script#wf-template-21c246c0-e275-2dd4-39f0-f75587b6455a | URI-encoded Webflow repeater template (type=text/x-wf-template), must be copied byte-exact | ok |
| wf-template | (none) | script#wf-template-dd5cf285-f6f9-d6ef-19b7-efdc14d5f7a1 | URI-encoded Webflow repeater template (type=text/x-wf-template), must be copied byte-exact | ok |

## 6. `div.s.prizes.bg-white`

Festivals / prizes: vertical CSS marquee built from 7 identical copies of the CMS list (app.js appends one more clone at runtime) + parallax still

### Copy (verbatim)

```text
┄ 7× identical div.w-dyn-list:
  ┄ div.prize-coll-it.w-dyn-item:
    div.roll-cont-eyeb.parish.mb-0: International Competition
    h3.prize-he: Jerusalem Film Festival
  ┄ div.prize-coll-it.w-dyn-item:
    div.roll-cont-eyeb.parish.mb-0: International Competition
    h3.prize-he: Warsaw Film Festival
  ┄ div.prize-coll-it.w-dyn-item:
    div.roll-cont-eyeb.parish.mb-0: International Competition
    h3.prize-he: Seattle Film Festival
  ┄ div.prize-coll-it.w-dyn-item:
    div.roll-cont-eyeb.parish.mb-0: International Competition
    h3.prize-he: Seret Film Festival
  ┄ div.prize-coll-it.w-dyn-item:
    div.roll-cont-eyeb.parish.mb-0: International Competition
    h3.prize-he: Chicago Film Festival
```

### Links

_No links._

### Media

| kind | local path | element | details | on disk |
|---|---|---|---|---|
| img | `/assets/img/films/_shared/JIFF.png` | prize-it-img | loading=eager; alt="" | 9 KB |
| img | `/assets/img/films/_shared/Warsaw-Film-Festival.png` | prize-it-img | loading=eager; alt="" | 15 KB |
| img | `/assets/img/films/moon-in-the-12th-house/Seatle-Film-Festival.png` | prize-it-img | loading=eager; alt="" | 12 KB |
| img | `/assets/img/films/moon-in-the-12th-house/SERET.png` | prize-it-img | loading=eager; alt="" | 34 KB |
| img | `/assets/img/films/moon-in-the-12th-house/The-Chicago-International-Film-Festival.png` | prize-it-img | loading=eager; alt="" | 13 KB |
| img | `/assets/img/films/_shared/JIFF.png` | prize-it-img | loading=lazy; alt="" | 9 KB |
| img | `/assets/img/films/_shared/Warsaw-Film-Festival.png` | prize-it-img | loading=lazy; alt="" | 15 KB |
| img | `/assets/img/films/moon-in-the-12th-house/Seatle-Film-Festival.png` | prize-it-img | loading=lazy; alt="" | 12 KB |
| img | `/assets/img/films/moon-in-the-12th-house/SERET.png` | prize-it-img | loading=lazy; alt="" | 34 KB |
| img | `/assets/img/films/moon-in-the-12th-house/The-Chicago-International-Film-Festival.png` | prize-it-img | loading=lazy; alt="" | 13 KB |
| img | `/assets/img/films/_shared/JIFF.png` | prize-it-img | loading=lazy; alt="" | 9 KB |
| img | `/assets/img/films/_shared/Warsaw-Film-Festival.png` | prize-it-img | loading=lazy; alt="" | 15 KB |
| img | `/assets/img/films/moon-in-the-12th-house/Seatle-Film-Festival.png` | prize-it-img | loading=lazy; alt="" | 12 KB |
| img | `/assets/img/films/moon-in-the-12th-house/SERET.png` | prize-it-img | loading=lazy; alt="" | 34 KB |
| img | `/assets/img/films/moon-in-the-12th-house/The-Chicago-International-Film-Festival.png` | prize-it-img | loading=lazy; alt="" | 13 KB |
| img | `/assets/img/films/_shared/JIFF.png` | prize-it-img | loading=eager; alt="" | 9 KB |
| img | `/assets/img/films/_shared/Warsaw-Film-Festival.png` | prize-it-img | loading=eager; alt="" | 15 KB |
| img | `/assets/img/films/moon-in-the-12th-house/Seatle-Film-Festival.png` | prize-it-img | loading=eager; alt="" | 12 KB |
| img | `/assets/img/films/moon-in-the-12th-house/SERET.png` | prize-it-img | loading=eager; alt="" | 34 KB |
| img | `/assets/img/films/moon-in-the-12th-house/The-Chicago-International-Film-Festival.png` | prize-it-img | loading=eager; alt="" | 13 KB |
| img | `/assets/img/films/_shared/JIFF.png` | prize-it-img | loading=lazy; alt="" | 9 KB |
| img | `/assets/img/films/_shared/Warsaw-Film-Festival.png` | prize-it-img | loading=lazy; alt="" | 15 KB |
| img | `/assets/img/films/moon-in-the-12th-house/Seatle-Film-Festival.png` | prize-it-img | loading=lazy; alt="" | 12 KB |
| img | `/assets/img/films/moon-in-the-12th-house/SERET.png` | prize-it-img | loading=lazy; alt="" | 34 KB |
| img | `/assets/img/films/moon-in-the-12th-house/The-Chicago-International-Film-Festival.png` | prize-it-img | loading=lazy; alt="" | 13 KB |
| img | `/assets/img/films/_shared/JIFF.png` | prize-it-img | loading=lazy; alt="" | 9 KB |
| img | `/assets/img/films/_shared/Warsaw-Film-Festival.png` | prize-it-img | loading=lazy; alt="" | 15 KB |
| img | `/assets/img/films/moon-in-the-12th-house/Seatle-Film-Festival.png` | prize-it-img | loading=lazy; alt="" | 12 KB |
| img | `/assets/img/films/moon-in-the-12th-house/SERET.png` | prize-it-img | loading=lazy; alt="" | 34 KB |
| img | `/assets/img/films/moon-in-the-12th-house/The-Chicago-International-Film-Festival.png` | prize-it-img | loading=lazy; alt="" | 13 KB |
| img | `/assets/img/films/_shared/JIFF.png` | prize-it-img | loading=lazy; alt="" | 9 KB |
| img | `/assets/img/films/_shared/Warsaw-Film-Festival.png` | prize-it-img | loading=lazy; alt="" | 15 KB |
| img | `/assets/img/films/moon-in-the-12th-house/Seatle-Film-Festival.png` | prize-it-img | loading=lazy; alt="" | 12 KB |
| img | `/assets/img/films/moon-in-the-12th-house/SERET.png` | prize-it-img | loading=lazy; alt="" | 34 KB |
| img | `/assets/img/films/moon-in-the-12th-house/The-Chicago-International-Film-Festival.png` | prize-it-img | loading=lazy; alt="" | 13 KB |
| img | `/assets/img/films/moon-in-the-12th-house/moon.jpg` | image-2 | srcset 500w 800w 1080w 1600w 1920w; sizes="100vw"; loading=eager; alt="" | 1050 KB |

## 7. `div.s.investor.bg-white`

Investors & Broadcast heading + rich text

### Copy (verbatim)

```text
h2.investor-he: Investors & Broadcast
div.investor-rt.w-richtext (rich text):
  <h4> Israel Fund for Film Production, Movie Plus Productions, United King Films
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
| (empty) | `/films/savoy` | internal |  | abs.next-link.w-inline-block data-pnext="hover" |
| (empty) | `/films/moon-in-the-12th-house` | internal |  | abs.next-link.w-inline-block.w--current aria-current=page data-pnext="hover" |
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
