# /work — `work`

Generated from `reference/localized/work.html` (Last Published: Sun Mar 09 2025). Conventions: see [INVENTORY.md](../INVENTORY.md#conventions-used-in-docspages).

## Document / head

| field | value |
|---|---|
| route | `/work` |
| `<title>` | Siena Film Foundation \| Work |
| html attributes | `data-wf-domain="www.siena.film"` `data-wf-page="67403621759d4ba06053a7be"` `data-wf-site="6728a72e769070a603d43c13"` `lang="en"` |
| meta description | Siena Film Foundation is a boutique production house dedicated to crafting groundbreaking narratives that push the boundaries of cinematic storytelling. |
| og:title / og:image | Siena Film Foundation \| Work / `/assets/img/site/open-graph.webp` |
| twitter:* attribute | `name=` |
| preconnect link | yes |
| body children (order) | `div.w-embed` → `div.w` → `div.canvas` → `div.div-block-44` → `script[src=/assets/js/jquery-3.5.1.min.js]` → `script[src=/assets/js/webflow.schunk.js]` → `script[src=/assets/js/webflow.0a91112a.bed7af5b8ef7aa34.js]` → `script(inline)` |
| page view element | `<div data-page="work" data-taxi-view="" class="pw h-screen work">` |
| scripts (src) | `/assets/js/jquery-3.5.1.min.js`, `/assets/js/webflow.schunk.js`, `/assets/js/webflow.0a91112a.bed7af5b8ef7aa34.js` |

**Navigation:** Rendered by `<Nav currentPath="/work" />`. Elements carrying `w--current` + `aria-current="page"` here: `a.menu-link.large.w-inline-block.w--current` → `/work`. Case-panel text (`.case-menu-tx`): “This is some text inside of a div block.”.

**Footer:** none

## Section outline (in DOM order)

| # | element | data-* | description |
|---|---|---|---|
| 1 | `div.nav-w` |  | Shared navigation component — see [_shared-nav.md](./_shared-nav.md) |
| 2 | `div.work-edge.top` | data-cursor="hide" | Mode switch FOOTAGE / POSTER (toggle-switch) |
| 3 | `div.work-roll` |  | Horizontal infinite poster slider (CMS list of 9 films: eyebrow+title and YEAR/Location/CATEGORY callouts, each duplicated as a FLIP copy, mobile EXPLORE link, poster image redrawn in WebGL) followed by 9 Webflow-lightbox JSON blocks holding each film's frames for FOOTAGE mode |
| 4 | `div.work-edge.bottom` | data-slider="additionaltrigger" data-cursor="hide" | Bottom bar: 9 groups of vertical tick lines + drag-direction marker, FLIP targets for the footage title, EXPLORE link (href set by app.js to the centred film) |
| 5 | `div.cursor-box.out` |  | Custom cursor (label + circle + arrows, follows the mouse) and two invisible PREV/NEXT hitboxes |
| 6 | `div.work-vert-line` |  | Central vertical hairline |
| 7 | `div.div-block-44` |  | Rotate-your-device notice (CSS: visible only 480–767px wide; see INVENTORY §e) |

## 1. `div.nav-w`

Shared navigation component — see [_shared-nav.md](./_shared-nav.md)

Copy, links and media are documented once in the shared component docs.

## 2. `div.work-edge.top`

Mode switch FOOTAGE / POSTER (toggle-switch)

### Copy (verbatim)

```text
div.swap-tx: FOOTAGE
div.swap-tx: POSTER
div.opacity-30: MODE
```

### Links

_No links._

### Media

_No media._

## 3. `div.work-roll`

Horizontal infinite poster slider (CMS list of 9 films: eyebrow+title and YEAR/Location/CATEGORY callouts, each duplicated as a FLIP copy, mobile EXPLORE link, poster image redrawn in WebGL) followed by 9 Webflow-lightbox JSON blocks holding each film's frames for FOOTAGE mode

### Copy (verbatim)

```text
┄ div.work-roll-item.w-dyn-item data-id/url=savoy:
  a.hidden-link: Text Link
  div.roll-cont-eyeb.parish.work: Documentary
  h2.roll-cont-he.work: Savoy
  div.roll-cont-eyeb.parish.work: Documentary
  h2.roll-cont-he.work: Savoy
  div: YEAR
  div: 2022
  div: Location
  div: Tel Aviv
  div: CATEGORY
  div: Documentary
  div: YEAR
  div: 2022
  div: Location
  div: Tel Aviv
  div: CATEGORY
  div: Documentary
  ▸ a.explore-link-w.mobile.w-inline-block {mobile-only(data-hide=desktop)}:
    div.footagemenu-cta-tx {::after="EXPLORE"}: EXPLORE
┄ div.work-roll-item.w-dyn-item data-id/url=moon-in-the-12th-house:
  a.hidden-link: Text Link
  div.roll-cont-eyeb.parish.work: Feature Film
  h2.roll-cont-he.work: Moon in the 12th House
  div.roll-cont-eyeb.parish.work: Feature Film
  h2.roll-cont-he.work: Moon in the 12th House
  div: YEAR
  div: 2014
  div: Location
  div: Tel Aviv
  div: CATEGORY
  div: Feature Film
  div: YEAR
  div: 2014
  div: Location
  div: Tel Aviv
  div: CATEGORY
  div: Feature Film
  ▸ a.explore-link-w.mobile.w-inline-block {mobile-only(data-hide=desktop)}:
    div.footagemenu-cta-tx {::after="EXPLORE"}: EXPLORE
┄ div.work-roll-item.w-dyn-item data-id/url=taboo:
  a.hidden-link: Text Link
  div.roll-cont-eyeb.parish.work: Documentary
  h2.roll-cont-he.work: Taboo
  div.roll-cont-eyeb.parish.work: Documentary
  h2.roll-cont-he.work: Taboo
  div: YEAR
  div: 2024
  div: Location
  div: Tel Aviv
  div: CATEGORY
  div: Documentary
  div: YEAR
  div: 2024
  div: Location
  div: Tel Aviv
  div: CATEGORY
  div: Documentary
  ▸ a.explore-link-w.mobile.w-inline-block {mobile-only(data-hide=desktop)}:
    div.footagemenu-cta-tx {::after="EXPLORE"}: EXPLORE
┄ div.work-roll-item.w-dyn-item data-id/url=kafkas-last-trial:
  a.hidden-link: Text Link
  div.roll-cont-eyeb.parish.work: Documentary
  h2.roll-cont-he.work: Kafka's Last Trial
  div.roll-cont-eyeb.parish.work: Documentary
  h2.roll-cont-he.work: Kafka's Last Trial
  div: YEAR
  div: 2024
  div: Location
  div: Tel Aviv
  div: CATEGORY
  div: Documentary
  div: YEAR
  div: 2024
  div: Location
  div: Tel Aviv
  div: CATEGORY
  div: Documentary
  ▸ a.explore-link-w.mobile.w-inline-block {mobile-only(data-hide=desktop)}:
    div.footagemenu-cta-tx {::after="EXPLORE"}: EXPLORE
┄ div.work-roll-item.w-dyn-item data-id/url=my-project-x:
  a.hidden-link: Text Link
  div.roll-cont-eyeb.parish.work: Documentary
  h2.roll-cont-he.work: My Project X
  div.roll-cont-eyeb.parish.work: Documentary
  h2.roll-cont-he.work: My Project X
  div: YEAR
  div: 2024
  div: Location
  div: Tel Aviv
  div: CATEGORY
  div: Documentary
  div: YEAR
  div: 2024
  div: Location
  div: Tel Aviv
  div: CATEGORY
  div: Documentary
  ▸ a.explore-link-w.mobile.w-inline-block {mobile-only(data-hide=desktop)}:
    div.footagemenu-cta-tx {::after="EXPLORE"}: EXPLORE
┄ div.work-roll-item.w-dyn-item data-id/url=ana-maxim:
  a.hidden-link: Text Link
  div.roll-cont-eyeb.parish.work: Short Film
  h2.roll-cont-he.work: Ana Maxim
  div.roll-cont-eyeb.parish.work: Short Film
  h2.roll-cont-he.work: Ana Maxim
  div: YEAR
  div: 2024
  div: Location
  div: Tel Aviv
  div: CATEGORY
  div: Short Film
  div: YEAR
  div: 2024
  div: Location
  div: Tel Aviv
  div: CATEGORY
  div: Short Film
  ▸ a.explore-link-w.mobile.w-inline-block {mobile-only(data-hide=desktop)}:
    div.footagemenu-cta-tx {::after="EXPLORE"}: EXPLORE
┄ div.work-roll-item.w-dyn-item data-id/url=outsider-freud:
  a.hidden-link: Text Link
  div.roll-cont-eyeb.parish.work: Documentary
  h2.roll-cont-he.work: Outsider Freud
  div.roll-cont-eyeb.parish.work: Documentary
  h2.roll-cont-he.work: Outsider Freud
  div: YEAR
  div: 2024
  div: Location
  div: Tel Aviv
  div: CATEGORY
  div: Documentary
  div: YEAR
  div: 2024
  div: Location
  div: Tel Aviv
  div: CATEGORY
  div: Documentary
  ▸ a.explore-link-w.mobile.w-inline-block {mobile-only(data-hide=desktop)}:
    div.footagemenu-cta-tx {::after="EXPLORE"}: EXPLORE
┄ div.work-roll-item.w-dyn-item data-id/url=by-any-means:
  a.hidden-link: Text Link
  div.roll-cont-eyeb.parish.work: Feature Film
  h2.roll-cont-he.work: By Any Means
  div.roll-cont-eyeb.parish.work: Feature Film
  h2.roll-cont-he.work: By Any Means
  div: YEAR
  div: 2026
  div: Location
  div: USA
  div: CATEGORY
  div: Feature Film
  div: YEAR
  div: 2026
  div: Location
  div: USA
  div: CATEGORY
  div: Feature Film
  ▸ a.explore-link-w.mobile.w-inline-block {mobile-only(data-hide=desktop)}:
    div.footagemenu-cta-tx {::after="EXPLORE"}: EXPLORE
┄ div.work-roll-item.w-dyn-item data-id/url=thehousewife:
  a.hidden-link: Text Link
  div.roll-cont-eyeb.parish.work: Feature Film
  h2.roll-cont-he.work: The Housewife
  div.roll-cont-eyeb.parish.work: Feature Film
  h2.roll-cont-he.work: The Housewife
  div: YEAR
  div: 2026
  div: Location
  div: USA
  div: CATEGORY
  div: Feature Film
  div: YEAR
  div: 2026
  div: Location
  div: USA
  div: CATEGORY
  div: Feature Film
  ▸ a.explore-link-w.mobile.w-inline-block {mobile-only(data-hide=desktop)}:
    div.footagemenu-cta-tx {::after="EXPLORE"}: EXPLORE
┄ div.collection-item.w-dyn-item:
  a.footage-img-sizer.w-inline-block.w-dyn-bind-empty.w-lightbox [data-frames="lightbox"] {w-dyn-bind-empty}: (empty)
```

### Links

| text | href | type | target | element / notes |
|---|---|---|---|---|
| Text Link | `/films/savoy` | internal |  | hidden-link |
| EXPLORE | `/films/savoy` | internal |  | explore-link-w.mobile.w-inline-block data-hide="desktop" |
| Text Link | `/films/moon-in-the-12th-house` | internal |  | hidden-link |
| EXPLORE | `/films/moon-in-the-12th-house` | internal |  | explore-link-w.mobile.w-inline-block data-hide="desktop" |
| Text Link | `/films/taboo` | internal |  | hidden-link |
| EXPLORE | `/films/taboo` | internal |  | explore-link-w.mobile.w-inline-block data-hide="desktop" |
| Text Link | `/films/kafkas-last-trial` | internal |  | hidden-link |
| EXPLORE | `/films/kafkas-last-trial` | internal |  | explore-link-w.mobile.w-inline-block data-hide="desktop" |
| Text Link | `/films/my-project-x` | internal |  | hidden-link |
| EXPLORE | `/films/my-project-x` | internal |  | explore-link-w.mobile.w-inline-block data-hide="desktop" |
| Text Link | `/films/ana-maxim` | internal |  | hidden-link |
| EXPLORE | `/films/ana-maxim` | internal |  | explore-link-w.mobile.w-inline-block data-hide="desktop" |
| Text Link | `/films/outsider-freud` | internal |  | hidden-link |
| EXPLORE | `/films/outsider-freud` | internal |  | explore-link-w.mobile.w-inline-block data-hide="desktop" |
| Text Link | `/films/by-any-means` | internal |  | hidden-link |
| EXPLORE | `/films/by-any-means` | internal |  | explore-link-w.mobile.w-inline-block data-hide="desktop" |
| Text Link | `/films/thehousewife` | internal |  | hidden-link |
| EXPLORE | `/films/thehousewife` | internal |  | explore-link-w.mobile.w-inline-block data-hide="desktop" |
| (×8) (empty) | `#` | anchor |  | footage-img-sizer.w-inline-block.w-lightbox data-frames="lightbox" |
| (empty) | `#` | anchor |  | footage-img-sizer.w-inline-block.w-dyn-bind-empty.w-lightbox data-frames="lightbox" |

### Media

| kind | local path | element | details | on disk |
|---|---|---|---|---|
| img | `/assets/img/films/savoy/678fa9d3-savoy.webp` | image [data-roll="img"] | srcset 500w 800w 1080w 1212w; sizes="(max-width: 767px) 75vw, (max-width: 991px) 41vw, 32vw"; loading=eager; alt="" | 108 KB |
| img | `/assets/img/films/moon-in-the-12th-house/moon-12-house.webp` | image [data-roll="img"] | srcset 500w 800w 1080w 1211w; sizes="(max-width: 767px) 75vw, (max-width: 991px) 41vw, 32vw"; loading=eager; alt="" | 32 KB |
| img | `/assets/img/films/taboo/678fa9e1-taboo.webp` | image [data-roll="img"] | srcset 500w 800w 1080w 1212w; sizes="(max-width: 767px) 75vw, (max-width: 991px) 41vw, 32vw"; loading=eager; alt="" | 74 KB |
| img | `/assets/img/films/kafkas-last-trial/kafka.webp` | image [data-roll="img"] | srcset 500w 800w 1080w 1211w; sizes="(max-width: 767px) 75vw, (max-width: 991px) 41vw, 32vw"; loading=eager; alt="" | 39 KB |
| img | `/assets/img/films/my-project-x/project_x.webp` | image [data-roll="img"] | srcset 500w 800w 1080w 1212w; sizes="(max-width: 767px) 75vw, (max-width: 991px) 41vw, 32vw"; loading=eager; alt="" | 42 KB |
| img | `/assets/img/films/ana-maxim/ana-maxim.webp` | image [data-roll="img"] | srcset 500w 800w 1080w 1211w; sizes="(max-width: 767px) 75vw, (max-width: 991px) 41vw, 32vw"; loading=eager; alt="" | 59 KB |
| img | `/assets/img/films/outsider-freud/freud-the-outsider.webp` | image [data-roll="img"] | srcset 500w 800w 1080w 1211w; sizes="(max-width: 767px) 75vw, (max-width: 991px) 41vw, 32vw"; loading=eager; alt="" | 95 KB |
| img | `/assets/img/films/by-any-means/BYANYMEANS_2024-04-28_EJA-02511_R2.webp` | image [data-roll="img"] | srcset 500w 800w 1080w 1600w 1997w; sizes="(max-width: 767px) 75vw, (max-width: 991px) 41vw, 32vw"; loading=eager; alt="" | 104 KB |
| img | `/assets/img/films/thehousewife/images.jpg` | image [data-roll="img"] | loading=eager; alt="" | 8 KB |
| lightbox JSON (×9) | empty (`{"items": [], "group": ""}`) | script.w-json | Webflow lightbox data read by app.js (FOOTAGE mode) | all on disk |

## 4. `div.work-edge.bottom`

Bottom bar: 9 groups of vertical tick lines + drag-direction marker, FLIP targets for the footage title, EXPLORE link (href set by app.js to the centred film)

### Copy (verbatim)

```text
div.footagemenu-cta-tx {::after="EXPLORE"}: EXPLORE
div.footagemenu-cta-tx {::after="EXPLORE"}: EXPLORE
```

### Links

| text | href | type | target | element / notes |
|---|---|---|---|---|
| EXPLORE · EXPLORE | `#` | anchor |  | explore-link-w.w-inline-block data-slider="link" |

### Media

_No media._

## 5. `div.cursor-box.out`

Custom cursor (label + circle + arrows, follows the mouse) and two invisible PREV/NEXT hitboxes

### Copy (verbatim)

```text
div.text-block-4 [data-cursor="text"]: EXPLORE
```

### Links

_No links._

### Media

_No media._

## 6. `div.work-vert-line`

Central vertical hairline

### Copy (verbatim)

```text
(no visible copy)
```

### Links

_No links._

### Media

_No media._

## 7. `div.div-block-44`

Rotate-your-device notice (CSS: visible only 480–767px wide; see INVENTORY §e)

### Copy (verbatim)

```text
div.paragraph: Rotate your device⏎to ensure a better experience
```

### Links

_No links._

### Media

_No media._
