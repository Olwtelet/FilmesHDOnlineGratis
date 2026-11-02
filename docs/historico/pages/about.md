# /about — `about`

Generated from `reference/localized/about.html` (Last Published: Sun Mar 09 2025). Conventions: see [INVENTORY.md](../INVENTORY.md#conventions-used-in-docspages).

## Document / head

| field | value |
|---|---|
| route | `/about` |
| `<title>` | Siena Film Foundation \| About |
| html attributes | `data-wf-domain="www.siena.film"` `data-wf-page="6746d9d321c00337a3e4adba"` `data-wf-site="6728a72e769070a603d43c13"` `lang="en"` |
| meta description | Siena Film Foundation is a boutique production house dedicated to crafting groundbreaking narratives that push the boundaries of cinematic storytelling. |
| og:title / og:image | Siena Film Foundation \| About / `/assets/img/site/open-graph.webp` |
| twitter:* attribute | `name=` |
| preconnect link | yes |
| body children (order) | `div.w-embed` → `div.w` → `div.canvas` → `div.div-block-44` → `script[src=/assets/js/jquery-3.5.1.min.js]` → `script[src=/assets/js/webflow.schunk.js]` → `script[src=/assets/js/webflow.js]` → `script(inline)` |
| page view element | `<div data-page="about" data-taxi-view="" class="pw black">` |
| scripts (src) | `/assets/js/jquery-3.5.1.min.js`, `/assets/js/webflow.schunk.js`, `/assets/js/webflow.js` |

**Navigation:** Rendered by `<Nav currentPath="/about" />`. Elements carrying `w--current` + `aria-current="page"` here: `a.menu-link.large.w-inline-block.w--current` → `/about`. Case-panel text (`.case-menu-tx`): “This is some text inside of a div block.”.

**Footer:** `footer.s.footer.w-variant-ff3af7bd-5bdd-e152-9111-9fa617f1f874` variant `on-black`; current links: `/about`; newsletter form `data-wf-page-id`: `6746d9d321c00337a3e4adba`

## Section outline (in DOM order)

| # | element | data-* | description |
|---|---|---|---|
| 1 | `div.nav-w` |  | Shared navigation component — see [_shared-nav.md](./_shared-nav.md) |
| 2 | `header.s.about-hero` | data-track="abouthero" | About hero: arch-masked side images (desktop), logo, 5-line headline with animated rules, arrow to #second, dashed SVG frame resized by JS, arch image for tablet/mobile |
| 3 | `section#second.s.fullbleed.about-type-comp` | data-a="abouttext" | Kinetic typography block scrubbed by scroll (film titles, manifesto lines, TELEVISION / FILMS / DOCUMENTARY, mobile SIENA block with book-style metadata) |
| 4 | `div.s.fullbleed.grid.aboutgrid` |  | 36-image CMS grid (CSS background images) that flies in in 3D while scrolling |
| 5 | `article.s.h-auto` |  | Ticket-style heading + CMS content (team / services) |
| 6 | `article.s.h-auto` |  | Ticket-style heading + CMS content (team / services) |
| 7 | `article.s.h-auto.flex-center.pt-lg` | data-css | COLLABORATEUR: 3 CMS collaborator logos (placeholder A24 logo ×3) |
| 8 | `div.s.prizes` |  | CTA “Our Films” + EXPLORE (white variant) → /work, over a parallax masked frame image |
| 9 | `footer.s.footer.w-variant-ff3af7bd-5bdd-e152-9111-9fa617f1f874` | data-once="true" data-a="group" data-s="footer" data-wf--footer--variant="on-black" | Shared footer component — see [_shared-footer.md](./_shared-footer.md) |
| 10 | `div.div-block-44` |  | Rotate-your-device notice (CSS: visible only 480–767px wide; see INVENTORY §e) |

## 1. `div.nav-w`

Shared navigation component — see [_shared-nav.md](./_shared-nav.md)

Copy, links and media are documented once in the shared component docs.

## 2. `header.s.about-hero`

About hero: arch-masked side images (desktop), logo, 5-line headline with animated rules, arrow to #second, dashed SVG frame resized by JS, arch image for tablet/mobile

### Copy (verbatim)

```text
div.about-he-sm-tx [data-a="alpha"]: SIENA{nbsp}FILM⏎
div.about-he-sm-tx [data-a="alpha"]: FOUNDATION{nbsp}IS{nbsp}A
h1.about-he: FILMPRODUCTIONHOUSE   (text inside span.span-clip, span.span-clip, span.span-clip)
div.about-he-sm-tx [data-a="alpha"]: DEDICATED{nbsp}TO{nbsp}CRAFTING⏎
div.about-he-sm-tx [data-a="alpha"]: GROUNDBREAKING{nbsp}NARRATIVES
```

### Links

| text | href | type | target | element / notes |
|---|---|---|---|---|
| (icon) | `#second` | anchor |  | abs.bottom.flex-center.mb-50.arrow-link-w.w-inline-block |

### Media

| kind | local path | element | details | on disk |
|---|---|---|---|---|
| img | `/assets/img/site/about_left.webp` | arch-masked-img | loading=eager; alt="" | 98 KB |
| img | `/assets/img/site/about_mobile.webp` | arch-masked-img | srcset 500w 800w 1444w; sizes="(max-width: 479px) 100vw, (max-width: 767px) 50vw, (max-width: 991px) 56vw, 100vw"; loading=eager; alt="" | 114 KB |
| img | `/assets/img/site/about_right.webp` | arch-masked-img | loading=eager; alt="" | 91 KB |

## 3. `section#second.s.fullbleed.about-type-comp`

Kinetic typography block scrubbed by scroll (film titles, manifesto lines, TELEVISION / FILMS / DOCUMENTARY, mobile SIENA block with book-style metadata)

### Copy (verbatim)

```text
div.about-title-tx: MOON{nbsp}IN{nbsp}THE{nbsp}12TH{nbsp}HOUSE
div.about-title-tx._2: TABOO
div.about-title-tx._3: SAVOY
div.about-title-tx._4: PRISONER X
div: With a commitment to selective
div: and thoughtful
div: storytelling,
div: Siena Film Foundation supports␠
div: and produces
div: TV, documentaries,
div: and feature films
div: that resonate
div: globally,
div: leaving an indelible
div: mark
div: on the world of cinema.
div.text-block-12: TELEVISION
div.text-block-12: FILMS
div.text-block-12: DOCUMENTARY
div.text-block-9: SIENA
div.about-title-tx: ANA{nbsp}MAXIM
div.about-title-tx._6: FREUD{nbsp}THE{nbsp}OUTSIDER
div.about-title-tx._5: KAFKA'S{nbsp}LAST{nbsp}TRIAL
div: SIENA{nbsp}FILM{nbsp}FOUNDATION
div: HARDCOVER. 365 DAYS{nbsp}OF{nbsp}INNOVATION
div: ISBN: DRIVE-GROWTH-STANDOUt-FANDOM.
div: CULTURALLY-CODED{nbsp}CREATIVITY
```

### Links

_No links._

### Media

_No media._

## 4. `div.s.fullbleed.grid.aboutgrid`

36-image CMS grid (CSS background images) that flies in in 3D while scrolling

### Copy (verbatim)

```text
(no visible copy)
```

### Links

_No links._

### Media

| kind | local path | element | details | on disk |
|---|---|---|---|---|
| background-image | `/assets/img/cms/1_About-us_Image.webp` | about-grid-item.img | inline style | 14 KB |
| background-image | `/assets/img/cms/2_About-us_Image.webp` | about-grid-item.img | inline style | 25 KB |
| background-image | `/assets/img/cms/3_About-us_Image.webp` | about-grid-item.img | inline style | 71 KB |
| background-image | `/assets/img/cms/4_About-us_Image.webp` | about-grid-item.img | inline style | 80 KB |
| background-image | `/assets/img/cms/5_About-us_Image.webp` | about-grid-item.img | inline style | 21 KB |
| background-image | `/assets/img/cms/6_About-us_Image.webp` | about-grid-item.img | inline style | 38 KB |
| background-image | `/assets/img/cms/8_About-us_Image.webp` | about-grid-item.img | inline style | 52 KB |
| background-image | `/assets/img/cms/9_About-us_Image.webp` | about-grid-item.img | inline style | 125 KB |
| background-image | `/assets/img/cms/10_About-us_Image.webp` | about-grid-item.img | inline style | 95 KB |
| background-image | `/assets/img/cms/11_About-us_Image.webp` | about-grid-item.img | inline style | 81 KB |
| background-image | `/assets/img/cms/12_About-us_Image.webp` | about-grid-item.img | inline style | 43 KB |
| background-image | `/assets/img/cms/13_About-us_Image.webp` | about-grid-item.img | inline style | 20 KB |
| background-image | `/assets/img/cms/14_About-us_Image.webp` | about-grid-item.img | inline style | 115 KB |
| background-image | `/assets/img/cms/15_About-us_Image.webp` | about-grid-item.img | inline style | 18 KB |
| background-image | `/assets/img/cms/16_About-us_Image.webp` | about-grid-item.img | inline style | 97 KB |
| background-image | `/assets/img/cms/17_About-us_Image.webp` | about-grid-item.img | inline style | 104 KB |
| background-image | `/assets/img/cms/27_About-us_Image.webp` | about-grid-item.img | inline style | 51 KB |
| background-image | `/assets/img/cms/26_About-us_Image.webp` | about-grid-item.img | inline style | 25 KB |
| background-image | `/assets/img/cms/25_About-us_Image.webp` | about-grid-item.img | inline style | 43 KB |
| background-image | `/assets/img/cms/24_About-us_Image.webp` | about-grid-item.img | inline style | 39 KB |
| background-image | `/assets/img/cms/23_About-us_Image.webp` | about-grid-item.img | inline style | 37 KB |
| background-image | `/assets/img/cms/22_About-us_Image.webp` | about-grid-item.img | inline style | 38 KB |
| background-image | `/assets/img/cms/21_About-us_Image.webp` | about-grid-item.img | inline style | 29 KB |
| background-image | `/assets/img/cms/20_About-us_Image.webp` | about-grid-item.img | inline style | 56 KB |
| background-image | `/assets/img/cms/19_About-us_Image.webp` | about-grid-item.img | inline style | 93 KB |
| background-image | `/assets/img/cms/18_About-us_Image.webp` | about-grid-item.img | inline style | 23 KB |
| background-image | `/assets/img/cms/37_About-us_Image.webp` | about-grid-item.img | inline style | 50 KB |
| background-image | `/assets/img/cms/36_About-us_Image.webp` | about-grid-item.img | inline style | 19 KB |
| background-image | `/assets/img/cms/35_About-us_Image.webp` | about-grid-item.img | inline style | 43 KB |
| background-image | `/assets/img/cms/34_About-us_Image.webp` | about-grid-item.img | inline style | 29 KB |
| background-image | `/assets/img/cms/33_About-us_Image.webp` | about-grid-item.img | inline style | 37 KB |
| background-image | `/assets/img/cms/32_About-us_Image.webp` | about-grid-item.img | inline style | 30 KB |
| background-image | `/assets/img/cms/31_About-us_Image.webp` | about-grid-item.img | inline style | 52 KB |
| background-image | `/assets/img/cms/30_About-us_Image.webp` | about-grid-item.img | inline style | 27 KB |
| background-image | `/assets/img/cms/29_About-us_Image.webp` | about-grid-item.img | inline style | 30 KB |
| background-image | `/assets/img/cms/28_About-us_Image.webp` | about-grid-item.img | inline style | 68 KB |

## 5. `article.s.h-auto`

Ticket-style heading + CMS content (team / services)

### Copy (verbatim)

```text
h2.ticket-btn-tx: WHO{nbsp}WE{nbsp}ARE
┄ div.team-item.w-dyn-item:
  div.roll-cont-eyeb.parish.mb-2: Founder
  h3.team-he: Dorit Hakim Kramer
  div.team-bio: Dorit Hakim Kramer is a writer, director, and producer known for award-winning films and TV. A Sam Spiegel alum and board member, she founded Siena Film Foundation to produce socially impactful works. She co-produced the acclaimed 2022 'Savoy' documentary and she just published her new book 'Due West'.
┄ div.team-item.w-dyn-item:
  div.roll-cont-eyeb.parish.mb-2: Founder
  h3.team-he: Lee Shira
  div.team-bio: Lee Shira is a seasoned producer with expertise in drama series, films, and documentaries. With a Film Studies degree from Tel Aviv University, Lee has contributed to projects like{nbsp}Our Boys{nbsp}(HBO),{nbsp}Scenes from a Marriage{nbsp}(HBO), and the Oscar-nominated{nbsp}Footnote. In 2024, Lee joined the Siena Film Foundation.␠
```

### Links

_No links._

### Media

| kind | local path | element | details | on disk |
|---|---|---|---|---|
| img | `/assets/img/cms/Dorit_Profile-Image_Siena.webp` | team-img | srcset 500w 800w 882w; sizes="(max-width: 479px) 100vw, (max-width: 991px) 50vw, 25vw"; loading=lazy; alt="" | 82 KB |
| img | `/assets/img/cms/Leelu_Profile-Image_Siena.webp` | team-img | srcset 500w 800w 882w; sizes="(max-width: 479px) 100vw, (max-width: 991px) 50vw, 25vw"; loading=lazy; alt="" | 36 KB |

## 6. `article.s.h-auto`

Ticket-style heading + CMS content (team / services)

### Copy (verbatim)

```text
h2.ticket-btn-tx: Our Services
div.roll-cont-eyeb.parish.mb-0: Service 1
h3.service-he: FILM⏎FINANCING
div.roll-cont-eyeb.parish.mb-0: Service 2
h3.service-he: FILM⏎PRODUCTION
```

### Links

_No links._

### Media

_No media._

## 7. `article.s.h-auto.flex-center.pt-lg`

COLLABORATEUR: 3 CMS collaborator logos (placeholder A24 logo ×3)

### Copy (verbatim)

```text
h2.ticket-btn-tx: COLLABORATEUR
┄ div.collab-item.w-dyn-item:
  div.roll-cont-eyeb.parish: LOGO
  div.text-block-11: A242
┄ div.collab-item.w-dyn-item:
  div.roll-cont-eyeb.parish: LOGO
  div.text-block-11: A241
┄ div.collab-item.w-dyn-item:
  div.roll-cont-eyeb.parish: LOGO
  div.text-block-11: A24
```

### Links

_No links._

### Media

| kind | local path | element | details | on disk |
|---|---|---|---|---|
| img (×3) | `/assets/img/site/a24logo.png` | collab-logo | loading=lazy; alt="" | 5 KB |

## 8. `div.s.prizes`

CTA “Our Films” + EXPLORE (white variant) → /work, over a parallax masked frame image

### Copy (verbatim)

```text
div.cta-he: Our Films
div.footagemenu-cta-tx {::after="EXPLORE"}: EXPLORE
```

### Links

| text | href | type | target | element / notes |
|---|---|---|---|---|
| EXPLORE | `/work` | internal |  | w-inline-block |

### Media

| kind | local path | element | details | on disk |
|---|---|---|---|---|
| img | `/assets/img/site/cta-frame.avif` | image-2 | srcset 500w 800w 2126w; sizes="100vw"; loading=eager; alt="" | 37 KB |

## 9. `footer.s.footer.w-variant-ff3af7bd-5bdd-e152-9111-9fa617f1f874`

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
