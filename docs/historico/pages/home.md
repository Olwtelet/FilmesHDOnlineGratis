# / — `home`

Generated from `reference/localized/home.html` (Last Published: Sun Mar 09 2025). Conventions: see [INVENTORY.md](../INVENTORY.md#conventions-used-in-docspages).

## Document / head

| field | value |
|---|---|
| route | `/` |
| `<title>` | Siena Film Foundation |
| html attributes | `data-wf-domain="www.siena.film"` `data-wf-page="6728a72e769070a603d43c19"` `data-wf-site="6728a72e769070a603d43c13"` `lang="en"` |
| meta description | Siena Film Foundation is a boutique production house dedicated to crafting groundbreaking narratives that push the boundaries of cinematic storytelling. |
| og:title / og:image | Siena Film Foundation / `/assets/img/site/open-graph.webp` |
| twitter:* attribute | `name=` |
| preconnect link | yes |
| body children (order) | `div.w-embed` → `div.div-block-44` → `div.w` → `div.canvas` → `div.preloader-w` → `div.tutorial-wrapper.visible` → `script[src=/assets/js/jquery-3.5.1.min.js]` → `script[src=/assets/js/webflow.schunk.js]` → `script[src=/assets/js/webflow.js]` → `script(inline)` |
| page view element | `<div data-page="home" data-taxi-view="" class="pw h-screen home">` |
| scripts (src) | `/assets/js/jquery-3.5.1.min.js`, `/assets/js/webflow.schunk.js`, `/assets/js/webflow.js` |

**Navigation:** Rendered by `<Nav currentPath="/" />`. Elements carrying `w--current` + `aria-current="page"` here: `a.nav-link.logo.w-inline-block.w--current` → `/`. Case-panel text (`.case-menu-tx`): “This is some text inside of a div block.”.

**Footer:** none

## Section outline (in DOM order)

| # | element | data-* | description |
|---|---|---|---|
| 1 | `div.div-block-44` |  | Rotate-your-device notice (CSS: visible only 480–767px wide; see INVENTORY §e) |
| 2 | `div.nav-w` |  | Shared navigation component — see [_shared-nav.md](./_shared-nav.md) |
| 3 | `div.home-roll-coll.w-dyn-list` | data-roll="wrapper" | Film roll: CMS list of the 9 films as a vertical infinite slider (drag/wheel/arrow keys). The still image is hidden and redrawn in WebGL; each item has award block, review rich text (desktop + mobile copies), eyebrow/title/credit callouts and EXPLORE buttons |
| 4 | `div.cursor-box.out` |  | Custom cursor (label + circle + arrows, follows the mouse) and two invisible PREV/NEXT hitboxes |
| 5 | `div.grad-bg` |  | Top gradient overlay |
| 6 | `div.grad-bg.bottom` |  | Bottom gradient overlay |
| 7 | `div.preloader-w` | data-preloader="w" | Intro preloader (home only): logo video (desktop/mobile sources) and ENTER buttons. app.js shows ENTER after 3.5 s; cookie `preloader_shown` skips it for 1 h |
| 8 | `div.tutorial-wrapper.visible` | data-tutorial="w" | First-visit tutorial overlay (home only): muted tutorial video (played by app.js), 5 tips rotated every 4.8 s, CLOSE button. Cookie `tutorial_shown` (48 h). Removed by app.js when hidden by CSS (≤991px) |

## 1. `div.div-block-44`

Rotate-your-device notice (CSS: visible only 480–767px wide; see INVENTORY §e)

### Copy (verbatim)

```text
div.paragraph: Rotate your device⏎to ensure a better experience
```

### Links

_No links._

### Media

_No media._

## 2. `div.nav-w`

Shared navigation component — see [_shared-nav.md](./_shared-nav.md)

Copy, links and media are documented once in the shared component docs.

## 3. `div.home-roll-coll.w-dyn-list`

Film roll: CMS list of the 9 films as a vertical infinite slider (drag/wheel/arrow keys). The still image is hidden and redrawn in WebGL; each item has award block, review rich text (desktop + mobile copies), eyebrow/title/credit callouts and EXPLORE buttons

### Copy (verbatim)

```text
┄ div.home-roll-item.w-dyn-item:
  ▸ div.roll-cont-item.award [data-parallax="12"] {desktop-only(data-hide=mobile)}:
    div.award-year: 2022
    div.award_headline: Best Director & Editing Award
  ▸ div.mobile-reviews {mobile-only(data-hide=desktop)}:
    div.awards-w.mobile.w-richtext [data-roll="reviews" data-parallax="2"] (rich text):
      <figure> image /assets/img/films/_shared/stars.svg
      <p> Weizman National Museum
      <h3> "Fast-paced and engrossing"
      <figure> image /assets/img/films/_shared/stars.svg
      <p> {zwj}
      <p> SF Jewish Film Festival
      <h3> "History through a heroine"
      <figure> image /assets/img/films/_shared/stars.svg
      <p> {zwj}
      <p> E-Walla
      <h3> "Brave, poetic, liberated"
      <p> {zwj}
  div.roll-cont-eyeb.parish: Documentary
  h2.roll-cont-he.home: Savoy
  div.paragraph: Director   (text inside span.text-span)
  div.paragraph: Zohar Wagner
  div: YEAR   (text inside span.paragraph)
  div: 2022
  div.paragraph: CATEGORY
  div.paragraph: Documentary
  ▸ a.explore-w.mobile.w-inline-block {mobile-only(data-hide=desktop)}:
    div.footagemenu-cta-tx {::after="EXPLORE"}: EXPLORE
  ▸ div.roll-cont-col.reviews {desktop-only(data-hide=mobile)}:
    div.awards-w.w-richtext [data-roll="reviews" data-parallax="2"] (rich text):
      <figure> image /assets/img/films/_shared/stars.svg
      <p> Weizman National Museum
      <h3> "Fast-paced and engrossing"
      <figure> image /assets/img/films/_shared/stars.svg
      <p> {zwj}
      <p> SF Jewish Film Festival
      <h3> "History through a heroine"
      <figure> image /assets/img/films/_shared/stars.svg
      <p> {zwj}
      <p> E-Walla
      <h3> "Brave, poetic, liberated"
      <p> {zwj}
    div.footagemenu-cta-tx {::after="EXPLORE"}: EXPLORE
┄ div.home-roll-item.w-dyn-item:
  ▸ div.roll-cont-item.award [data-parallax="12"] {desktop-only(data-hide=mobile)}:
    div.award-year: 2014
    div.award_headline: Jerusalem Film Festival
  ▸ div.mobile-reviews {mobile-only(data-hide=desktop)}:
    div.awards-w.mobile.w-richtext [data-roll="reviews" data-parallax="2"] (rich text):
      <figure> image /assets/img/films/_shared/stars.svg
      <p> Salona
      <h3> "BreathtakiNg cinematography"
      <figure> image /assets/img/films/_shared/stars.svg
      <p> {zwj}
      <p> HaBama
      <h3> "Delicate and moving"
      <figure> image /assets/img/films/_shared/stars.svg
      <p> {zwj}
      <p> SIFF Jury Statement
      <h3> "Pure cinematic beauty"
  div.roll-cont-eyeb.parish: Feature Film
  h2.roll-cont-he.home: Moon in the 12th House
  div.paragraph: Director   (text inside span.text-span)
  div.paragraph: Dorit Hakim Kramer
  div: YEAR   (text inside span.paragraph)
  div: 2014
  div.paragraph: CATEGORY
  div.paragraph: Feature Film
  ▸ a.explore-w.mobile.w-inline-block {mobile-only(data-hide=desktop)}:
    div.footagemenu-cta-tx {::after="EXPLORE"}: EXPLORE
  ▸ div.roll-cont-col.reviews {desktop-only(data-hide=mobile)}:
    div.awards-w.w-richtext [data-roll="reviews" data-parallax="2"] (rich text):
      <figure> image /assets/img/films/_shared/stars.svg
      <p> Salona
      <h3> "BreathtakiNg cinematography"
      <figure> image /assets/img/films/_shared/stars.svg
      <p> {zwj}
      <p> HaBama
      <h3> "Delicate and moving"
      <figure> image /assets/img/films/_shared/stars.svg
      <p> {zwj}
      <p> SIFF Jury Statement
      <h3> "Pure cinematic beauty"
    div.footagemenu-cta-tx {::after="EXPLORE"}: EXPLORE
┄ div.home-roll-item.w-dyn-item:
  ▸ div.roll-cont-item.award [data-parallax="12"] {desktop-only(data-hide=mobile)}:
    div.award-year: 2024
    div.award_headline: World Premiere
  ▸ div.mobile-reviews {mobile-only(data-hide=desktop)}:
    div.awards-w.mobile.w-richtext [data-roll="reviews" data-parallax="2"] (rich text):
      <figure> image /assets/img/films/_shared/stars.svg
      <p> {zwj}
      <p> POV Magazine
      <h3> "Touching and intimate"
      <figure> image /assets/img/films/_shared/stars.svg
      <p> {zwj}
      <p> POV Magazine
      <h3> "Groundbreaking LGBTQ+ cinema"
      <figure> image /assets/img/films/_shared/stars.svg
      <p> {zwj}
      <p> POV Magazine
      <h3> "Confronting cultural taboos"
  div.roll-cont-eyeb.parish: Documentary
  h2.roll-cont-he.home: Taboo
  div.paragraph: Director   (text inside span.text-span)
  div.paragraph: Shauly Melamed
  div: YEAR   (text inside span.paragraph)
  div: 2024
  div.paragraph: CATEGORY
  div.paragraph: Documentary
  ▸ a.explore-w.mobile.w-inline-block {mobile-only(data-hide=desktop)}:
    div.footagemenu-cta-tx {::after="EXPLORE"}: EXPLORE
  ▸ div.roll-cont-col.reviews {desktop-only(data-hide=mobile)}:
    div.awards-w.w-richtext [data-roll="reviews" data-parallax="2"] (rich text):
      <figure> image /assets/img/films/_shared/stars.svg
      <p> {zwj}
      <p> POV Magazine
      <h3> "Touching and intimate"
      <figure> image /assets/img/films/_shared/stars.svg
      <p> {zwj}
      <p> POV Magazine
      <h3> "Groundbreaking LGBTQ+ cinema"
      <figure> image /assets/img/films/_shared/stars.svg
      <p> {zwj}
      <p> POV Magazine
      <h3> "Confronting cultural taboos"
    div.footagemenu-cta-tx {::after="EXPLORE"}: EXPLORE
┄ div.home-roll-item.w-dyn-item:
  ▸ div.roll-cont-item.award [data-parallax="12"] {desktop-only(data-hide=mobile)}:
    div.award-year: 2024
    div.award_headline: Haifa Film Festival
  ▸ div.mobile-reviews {mobile-only(data-hide=desktop)}:
    div.awards-w.mobile.w-richtext [data-roll="reviews" data-parallax="2"] (rich text):
      <figure> image /assets/img/films/_shared/stars.svg
      <p> Critical Acclaim
      <h3> "A genius nowhere at home"
      <figure> image /assets/img/films/_shared/stars.svg
      <p> Critical Acclaim
      <h3> "A real-life Kafkaesque trial"
      <figure> image /assets/img/films/_shared/stars.svg
      <p> Critical Acclaim
      <h3> "The case of a literary legacy"
  div.roll-cont-eyeb.parish: Documentary
  h2.roll-cont-he.home: Kafka's Last Trial
  div.paragraph: Director   (text inside span.text-span)
  div.paragraph: Eliran Peled
  div: YEAR   (text inside span.paragraph)
  div: 2025
  div.paragraph: CATEGORY
  div.paragraph: Documentary
  ▸ a.explore-w.mobile.w-inline-block {mobile-only(data-hide=desktop)}:
    div.footagemenu-cta-tx {::after="EXPLORE"}: EXPLORE
  ▸ div.roll-cont-col.reviews {desktop-only(data-hide=mobile)}:
    div.awards-w.w-richtext [data-roll="reviews" data-parallax="2"] (rich text):
      <figure> image /assets/img/films/_shared/stars.svg
      <p> Critical Acclaim
      <h3> "A genius nowhere at home"
      <figure> image /assets/img/films/_shared/stars.svg
      <p> Critical Acclaim
      <h3> "A real-life Kafkaesque trial"
      <figure> image /assets/img/films/_shared/stars.svg
      <p> Critical Acclaim
      <h3> "The case of a literary legacy"
    div.footagemenu-cta-tx {::after="EXPLORE"}: EXPLORE
┄ div.home-roll-item.w-dyn-item:
  ▸ div.roll-cont-item.award [data-parallax="12"] {desktop-only(data-hide=mobile)}:
    div.award-year: 2024
    div.award_headline: National competition of Docaviv
  ▸ div.mobile-reviews {mobile-only(data-hide=desktop)}:
    div.awards-w.mobile.w-richtext [data-roll="reviews" data-parallax="2"] (rich text):
      <figure> image /assets/img/films/_shared/stars.svg
      <p> Critical Acclaim
      <h3> “A fascinating Voyage”
      <figure> image /assets/img/films/_shared/stars.svg
      <p> Critical Acclaim
      <h3> "A Film based on a true story"
      <figure> image /assets/img/films/_shared/stars.svg
      <p> Critical Acclaim
      <h3> “Riveting Soundtrack”
  div.roll-cont-eyeb.parish: Documentary
  h2.roll-cont-he.home: My Project X
  div.paragraph: Director   (text inside span.text-span)
  div.paragraph: Limor Pinhasov
  div: YEAR   (text inside span.paragraph)
  div: 2024
  div.paragraph: CATEGORY
  div.paragraph: Documentary
  ▸ a.explore-w.mobile.w-inline-block {mobile-only(data-hide=desktop)}:
    div.footagemenu-cta-tx {::after="EXPLORE"}: EXPLORE
  ▸ div.roll-cont-col.reviews {desktop-only(data-hide=mobile)}:
    div.awards-w.w-richtext [data-roll="reviews" data-parallax="2"] (rich text):
      <figure> image /assets/img/films/_shared/stars.svg
      <p> Critical Acclaim
      <h3> “A fascinating Voyage”
      <figure> image /assets/img/films/_shared/stars.svg
      <p> Critical Acclaim
      <h3> "A Film based on a true story"
      <figure> image /assets/img/films/_shared/stars.svg
      <p> Critical Acclaim
      <h3> “Riveting Soundtrack”
    div.footagemenu-cta-tx {::after="EXPLORE"}: EXPLORE
┄ div.home-roll-item.w-dyn-item:
  ▸ div.roll-cont-item.award [data-parallax="12"] {desktop-only(data-hide=mobile)}:
    div.award-year: 2024
    div.award_headline: The Cinema South Film Festival
  ▸ div.mobile-reviews {mobile-only(data-hide=desktop)}:
    div.awards-w.mobile.w-richtext [data-roll="reviews" data-parallax="2"] (rich text):
      <figure> image /assets/img/films/_shared/stars.svg
      <p> The Armenian Report
      <h3> "Inspiring true story"
      <figure> image /assets/img/films/_shared/stars.svg
      <p> Armenpress
      <h3> "Best Feature Film at Pomegranate Festival"
      <figure> image /assets/img/films/_shared/stars.svg
      <p> The Armenian Report
      <h3> "Emotional and powerful portrayal"
  div.roll-cont-eyeb.parish: Short Film
  h2.roll-cont-he.home: Ana Maxim
  div.paragraph: Director   (text inside span.text-span)
  div.paragraph: Yoni Handelsman
  div: YEAR   (text inside span.paragraph)
  div: 2024
  div.paragraph: CATEGORY
  div.paragraph: Short Film
  ▸ a.explore-w.mobile.w-inline-block {mobile-only(data-hide=desktop)}:
    div.footagemenu-cta-tx {::after="EXPLORE"}: EXPLORE
  ▸ div.roll-cont-col.reviews {desktop-only(data-hide=mobile)}:
    div.awards-w.w-richtext [data-roll="reviews" data-parallax="2"] (rich text):
      <figure> image /assets/img/films/_shared/stars.svg
      <p> The Armenian Report
      <h3> "Inspiring true story"
      <figure> image /assets/img/films/_shared/stars.svg
      <p> Armenpress
      <h3> "Best Feature Film at Pomegranate Festival"
      <figure> image /assets/img/films/_shared/stars.svg
      <p> The Armenian Report
      <h3> "Emotional and powerful portrayal"
    div.footagemenu-cta-tx {::after="EXPLORE"}: EXPLORE
┄ div.home-roll-item.w-dyn-item:
  ▸ div.roll-cont-item.award [data-parallax="12"] {desktop-only(data-hide=mobile)}:
    div.award-year: 2024
    div.award_headline: Best Feature Documentary
  ▸ div.mobile-reviews {mobile-only(data-hide=desktop)}:
    div.awards-w.mobile.w-richtext [data-roll="reviews" data-parallax="2"] (rich text):
      <figure> image /assets/img/films/_shared/stars.svg
      <p> IMDB
      <h3> "A journey into Freud's life"
      <figure> image /assets/img/films/_shared/stars.svg
      <p> The Jerusalem Post
      <h3> “experience of marginalization”
      <figure> image /assets/img/films/_shared/stars.svg
      <p> The Hebrews Project
      <h3> “Dimensions of Freud's legacy"
      <p> {zwj}
      <p> {zwj}
  div.roll-cont-eyeb.parish: Documentary
  h2.roll-cont-he.home: Outsider Freud
  div.paragraph: Director   (text inside span.text-span)
  div.paragraph: Yair Qedar
  div: YEAR   (text inside span.paragraph)
  div: 2025
  div.paragraph: CATEGORY
  div.paragraph: Documentary
  ▸ a.explore-w.mobile.w-inline-block {mobile-only(data-hide=desktop)}:
    div.footagemenu-cta-tx {::after="EXPLORE"}: EXPLORE
  ▸ div.roll-cont-col.reviews {desktop-only(data-hide=mobile)}:
    div.awards-w.w-richtext [data-roll="reviews" data-parallax="2"] (rich text):
      <figure> image /assets/img/films/_shared/stars.svg
      <p> IMDB
      <h3> "A journey into Freud's life"
      <figure> image /assets/img/films/_shared/stars.svg
      <p> The Jerusalem Post
      <h3> “experience of marginalization”
      <figure> image /assets/img/films/_shared/stars.svg
      <p> The Hebrews Project
      <h3> “Dimensions of Freud's legacy"
      <p> {zwj}
      <p> {zwj}
    div.footagemenu-cta-tx {::after="EXPLORE"}: EXPLORE
┄ div.home-roll-item.w-dyn-item:
  ▸ div.roll-cont-item.award [data-parallax="12"] {desktop-only(data-hide=mobile)}:
    div.award-year: 2026
    div.award_headline.w-dyn-bind-empty {w-dyn-bind-empty}: (empty)
  ▸ div.mobile-reviews {mobile-only(data-hide=desktop)}:
    div.awards-w.mobile.w-richtext [data-roll="reviews" data-parallax="2"] (rich text):
      <figure> image /assets/img/films/_shared/stars.svg
      <p> The New York Times
      <h3> "An Electrifing Relentless Thriller "
      <h4> {zwj}
      <figure> image /assets/img/films/_shared/stars.svg
      <p> Variety
      <h3> "Wahlberg at His Absolute Best"
      <h4> {zwj}
      <figure> image /assets/img/films/_shared/stars.svg
      <p> The Hollywood Reporter
      <h3> "Tense, Sharp and Uncomprimising"
      <h4> {zwj}
      <p> {zwj}
  div.roll-cont-eyeb.parish: Feature Film
  h2.roll-cont-he.home: By Any Means
  div.paragraph: Director   (text inside span.text-span)
  div.paragraph: Elegance Bratton
  div: YEAR   (text inside span.paragraph)
  div: 2026
  div.paragraph: CATEGORY
  div.paragraph: Feature Film
  ▸ a.explore-w.mobile.w-inline-block {mobile-only(data-hide=desktop)}:
    div.footagemenu-cta-tx {::after="EXPLORE"}: EXPLORE
  ▸ div.roll-cont-col.reviews {desktop-only(data-hide=mobile)}:
    div.awards-w.w-richtext [data-roll="reviews" data-parallax="2"] (rich text):
      <figure> image /assets/img/films/_shared/stars.svg
      <p> The New York Times
      <h3> "An Electrifing Relentless Thriller "
      <h4> {zwj}
      <figure> image /assets/img/films/_shared/stars.svg
      <p> Variety
      <h3> "Wahlberg at His Absolute Best"
      <h4> {zwj}
      <figure> image /assets/img/films/_shared/stars.svg
      <p> The Hollywood Reporter
      <h3> "Tense, Sharp and Uncomprimising"
      <h4> {zwj}
      <p> {zwj}
    div.footagemenu-cta-tx {::after="EXPLORE"}: EXPLORE
┄ div.home-roll-item.w-dyn-item:
  ▸ div.roll-cont-item.award [data-parallax="12"] {desktop-only(data-hide=mobile)}:
    div.award-year: 2026
    div.award_headline: Toronto Film Festival␠
  ▸ div.mobile-reviews {mobile-only(data-hide=desktop)}:
    div.awards-w.mobile.w-richtext [data-roll="reviews" data-parallax="2"] (rich text):
      <figure> image /assets/img/films/_shared/stars.svg
      <p> Deadline
      <h3> "Naomi Delivers a Powerhouse Performance"
      <h4> {zwj}
      <figure> image /assets/img/films/_shared/stars.svg
      <p> The Hollywood Reporter
      <h3> "A Gripping, Intensely Atmospheric Thriller"
      <h4> {zwj}
      <figure> image /assets/img/films/_shared/stars.svg
      <p> Screen Daily
      <h3> "A Stylish, Deeply Disturbing Triumph"
      <h4> {zwj}
  div.roll-cont-eyeb.parish: Feature Film
  h2.roll-cont-he.home: The Housewife
  div.paragraph: Director   (text inside span.text-span)
  div.paragraph: Ben Shirinian
  div: YEAR   (text inside span.paragraph)
  div: 2027
  div.paragraph: CATEGORY
  div.paragraph: Feature Film
  ▸ a.explore-w.mobile.w-inline-block {mobile-only(data-hide=desktop)}:
    div.footagemenu-cta-tx {::after="EXPLORE"}: EXPLORE
  ▸ div.roll-cont-col.reviews {desktop-only(data-hide=mobile)}:
    div.awards-w.w-richtext [data-roll="reviews" data-parallax="2"] (rich text):
      <figure> image /assets/img/films/_shared/stars.svg
      <p> Deadline
      <h3> "Naomi Delivers a Powerhouse Performance"
      <h4> {zwj}
      <figure> image /assets/img/films/_shared/stars.svg
      <p> The Hollywood Reporter
      <h3> "A Gripping, Intensely Atmospheric Thriller"
      <h4> {zwj}
      <figure> image /assets/img/films/_shared/stars.svg
      <p> Screen Daily
      <h3> "A Stylish, Deeply Disturbing Triumph"
      <h4> {zwj}
    div.footagemenu-cta-tx {::after="EXPLORE"}: EXPLORE
```

### Links

| text | href | type | target | element / notes |
|---|---|---|---|---|
| EXPLORE | `/films/savoy` | internal |  | explore-w.mobile.w-inline-block data-hide="desktop" |
| EXPLORE | `/films/savoy` | internal |  | explore-w.w-inline-block |
| EXPLORE | `/films/moon-in-the-12th-house` | internal |  | explore-w.mobile.w-inline-block data-hide="desktop" |
| EXPLORE | `/films/moon-in-the-12th-house` | internal |  | explore-w.w-inline-block |
| EXPLORE | `/films/taboo` | internal |  | explore-w.mobile.w-inline-block data-hide="desktop" |
| EXPLORE | `/films/taboo` | internal |  | explore-w.w-inline-block |
| EXPLORE | `/films/kafkas-last-trial` | internal |  | explore-w.mobile.w-inline-block data-hide="desktop" |
| EXPLORE | `/films/kafkas-last-trial` | internal |  | explore-w.w-inline-block |
| EXPLORE | `/films/my-project-x` | internal |  | explore-w.mobile.w-inline-block data-hide="desktop" |
| EXPLORE | `/films/my-project-x` | internal |  | explore-w.w-inline-block |
| EXPLORE | `/films/ana-maxim` | internal |  | explore-w.mobile.w-inline-block data-hide="desktop" |
| EXPLORE | `/films/ana-maxim` | internal |  | explore-w.w-inline-block |
| EXPLORE | `/films/outsider-freud` | internal |  | explore-w.mobile.w-inline-block data-hide="desktop" |
| EXPLORE | `/films/outsider-freud` | internal |  | explore-w.w-inline-block |
| EXPLORE | `/films/by-any-means` | internal |  | explore-w.mobile.w-inline-block data-hide="desktop" |
| EXPLORE | `/films/by-any-means` | internal |  | explore-w.w-inline-block |
| EXPLORE | `/films/thehousewife` | internal |  | explore-w.mobile.w-inline-block data-hide="desktop" |
| EXPLORE | `/films/thehousewife` | internal |  | explore-w.w-inline-block |

Resource hints inside this block (`<link>` elements): `prefetch:/films/savoy`, `prefetch:/films/moon-in-the-12th-house`, `prefetch:/films/taboo`, `prefetch:/films/kafkas-last-trial`, `prefetch:/films/my-project-x`, `prefetch:/films/ana-maxim`, `prefetch:/films/outsider-freud`, `prefetch:/films/by-any-means`, `prefetch:/films/thehousewife` (9 total)

### Media

| kind | local path | element | details | on disk |
|---|---|---|---|---|
| img | `/assets/img/films/savoy/675eb91e-savoy.webp` | image [data-roll="img"] | srcset 500w 800w 1080w 1600w 1920w; sizes="100vw"; loading=eager; alt="" | 210 KB |
| img | `/assets/img/films/_shared/JFF.webp` | award-img | loading=lazy; alt="" | 12 KB |
| img (×6) | `/assets/img/films/_shared/stars.svg` |  | loading=lazy; alt="" | 1 KB |
| img | `/assets/img/films/moon-in-the-12th-house/moon.jpg` | image [data-roll="img"] | srcset 500w 800w 1080w 1600w 1920w; sizes="100vw"; loading=eager; alt="" | 1050 KB |
| img | `/assets/img/films/_shared/JFF.webp` | award-img | loading=lazy; alt="" | 12 KB |
| img (×6) | `/assets/img/films/_shared/stars.svg` |  | loading=lazy; alt="" | 1 KB |
| img | `/assets/img/films/taboo/675eb903-taboo.webp` | image [data-roll="img"] | srcset 500w 800w 1080w 1600w 1920w; sizes="100vw"; loading=eager; alt="" | 282 KB |
| img | `/assets/img/films/taboo/International-Film-Festival-Rotterdam.webp` | award-img | loading=lazy; alt="" | 7 KB |
| img (×6) | `/assets/img/films/_shared/stars.svg` |  | loading=lazy; alt="" | 1 KB |
| img | `/assets/img/films/kafkas-last-trial/kafka.jpg` | image [data-roll="img"] | srcset 500w 800w 1080w 1600w 1920w; sizes="100vw"; loading=eager; alt="" | 659 KB |
| img | `/assets/img/films/kafkas-last-trial/attachment-1.webp` | award-img | loading=lazy; alt="" | 15 KB |
| img (×6) | `/assets/img/films/_shared/stars.svg` |  | loading=lazy; alt="" | 1 KB |
| img | `/assets/img/films/my-project-x/project.jpg` | image [data-roll="img"] | srcset 500w 800w 1080w 1600w 1920w; sizes="100vw"; loading=eager; alt="" | 987 KB |
| img | `/assets/img/films/my-project-x/DOCAVIV.webp` | award-img | loading=lazy; alt="" | 4 KB |
| img (×6) | `/assets/img/films/_shared/stars.svg` |  | loading=lazy; alt="" | 1 KB |
| img | `/assets/img/films/ana-maxim/ana.jpg` | image [data-roll="img"] | srcset 500w 800w 1080w 1600w 1920w; sizes="100vw"; loading=eager; alt="" | 1085 KB |
| img | `/assets/img/films/ana-maxim/Cinema-South-Festival.webp` | award-img | loading=lazy; alt="" | 6 KB |
| img (×6) | `/assets/img/films/_shared/stars.svg` |  | loading=lazy; alt="" | 1 KB |
| img | `/assets/img/films/outsider-freud/freud.jpg` | image [data-roll="img"] | srcset 500w 800w 1080w 1600w 1920w; sizes="100vw"; loading=eager; alt="" | 910 KB |
| img | `/assets/img/films/outsider-freud/White-Jaipur-Film-Festival-Laurel-Logo.webp` | award-img | srcset 500w 800w 1541w; sizes="100vw"; loading=lazy; alt="" | 70 KB |
| img (×6) | `/assets/img/films/_shared/stars.svg` |  | loading=lazy; alt="" | 1 KB |
| img | `/assets/img/films/by-any-means/6a57521a-BYANYMEANS_2024-04-28_EJA-02511_R1.webp` | image [data-roll="img"] | srcset 500w 800w 1080w 1600w 2000w 2600w 3200w 3900w; sizes="100vw"; loading=eager; alt="" | 399 KB |
| img | `/assets/img/films/by-any-means/cannes.png` | award-img.w-dyn-bind-empty | loading=lazy; alt="" | 78 KB |
| img (×6) | `/assets/img/films/_shared/stars.svg` |  | loading=lazy; alt="" | 1 KB |
| img | `/assets/img/films/thehousewife/housewife2.jpg` | image [data-roll="img"] | loading=eager; alt="" | 20 KB |
| img | `/assets/img/films/thehousewife/332-3329912_tiff-toronto-international-film-festival-logo+2.webp` | award-img | loading=lazy; alt="" | 11 KB |
| img (×6) | `/assets/img/films/_shared/stars.svg` |  | loading=lazy; alt="" | 1 KB |

## 4. `div.cursor-box.out`

Custom cursor (label + circle + arrows, follows the mouse) and two invisible PREV/NEXT hitboxes

### Copy (verbatim)

```text
div.text-block-4 [data-cursor="text"]: EXPLORE
```

### Links

_No links._

### Media

_No media._

## 5. `div.grad-bg`

Top gradient overlay

### Copy (verbatim)

```text
(no visible copy)
```

### Links

_No links._

### Media

_No media._

## 6. `div.grad-bg.bottom`

Bottom gradient overlay

### Copy (verbatim)

```text
(no visible copy)
```

### Links

_No links._

### Media

_No media._

## 7. `div.preloader-w`

Intro preloader (home only): logo video (desktop/mobile sources) and ENTER buttons. app.js shows ENTER after 3.5 s; cookie `preloader_shown` skips it for 1 h

### Copy (verbatim)

```text
div.footagemenu-cta-tx {::after="ENTER"}: ENTER
div.footagemenu-cta-tx {::after="ENTER"}: ENTER
```

### Links

_No links._

### Media

| kind | local path | element | details | on disk |
|---|---|---|---|---|
| video | `/assets/video/logo_intro_desktop.mp4` | preloader-video.desktop | muted autoplay=true playsinline=true; data-src=`/assets/video/animated_logo_black.mp4` | 4881 KB |
| video | `/assets/video/intro_mobile.mp4` | preloader-video.mobile | muted autoplay=true playsinline=true; data-src=`/assets/video/intro_mobile.mp4` | 775 KB |

## 8. `div.tutorial-wrapper.visible`

First-visit tutorial overlay (home only): muted tutorial video (played by app.js), 5 tips rotated every 4.8 s, CLOSE button. Cookie `tutorial_shown` (48 h). Removed by app.js when hidden by CSS (≤991px)

### Copy (verbatim)

```text
div.tut-text: Hold and drag to navigate the content
div.tut-text.second: Scroll to unlock the immersive film experience
div.tut-text.second: Click on left-side menu to Quick navigate Films
div.tut-text.second: Use the right menu for seamless navigation
div.tut-text.second: Click 'Explore' to view detailed case studies
div.footagemenu-cta-tx {::after="CLOSE"}: CLOSE
```

### Links

_No links._

### Media

| kind | local path | element | details | on disk |
|---|---|---|---|---|
| video | `/assets/video/tutorial-final.mp4` | video-2 | muted playsinline=true width=100% data-tutorial=video | 17978 KB |
