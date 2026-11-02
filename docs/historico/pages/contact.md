# /contact — `contact`

Generated from `reference/localized/contact.html` (Last Published: Sun Mar 09 2025). Conventions: see [INVENTORY.md](../INVENTORY.md#conventions-used-in-docspages).

## Document / head

| field | value |
|---|---|
| route | `/contact` |
| `<title>` | Siena Film Foundation \| Contact |
| html attributes | `data-wf-domain="www.siena.film"` `data-wf-page="6746d9e5951614837160d2db"` `data-wf-site="6728a72e769070a603d43c13"` `lang="en"` |
| meta description | Siena Film Foundation is a boutique production house dedicated to crafting groundbreaking narratives that push the boundaries of cinematic storytelling. |
| og:title / og:image | Siena Film Foundation \| Contact / `/assets/img/site/open-graph.webp` |
| twitter:* attribute | `name=` |
| preconnect link | yes |
| body children (order) | `div.w-embed` → `div.w` → `div.canvas` → `div.div-block-44` → `script[src=/assets/js/jquery-3.5.1.min.js]` → `script[src=/assets/js/webflow.schunk.js]` → `script[src=/assets/js/webflow.js]` → `script(inline)` |
| page view element | `<div data-page="contact" data-taxi-view="" class="pw h-screen">` |
| scripts (src) | `/assets/js/jquery-3.5.1.min.js`, `/assets/js/webflow.schunk.js`, `/assets/js/webflow.js` |

**Navigation:** Rendered by `<Nav currentPath="/contact" />`. Elements carrying `w--current` + `aria-current="page"` here: `a.menu-link.large.w-inline-block.w--current` → `/contact`. Case-panel text (`.case-menu-tx`): “This is some text inside of a div block.”.

**Footer:** none

## Section outline (in DOM order)

| # | element | data-* | description |
|---|---|---|---|
| 1 | `div.nav-w` |  | Shared navigation component — see [_shared-nav.md](./_shared-nav.md) |
| 2 | `header.contact-s` | data-a="group" | Full-screen contact block (no footer on this page): “CONTACT US” eyebrow, rolling 3-line headline CRAFT / THE NEXT / ACT, then PROJECT INQUIRIES (mailto), PHONE NUMBER (tel:) and ADDRESS (plain text) rows |
| 3 | `div.div-block-44` |  | Rotate-your-device notice (CSS: visible only 480–767px wide; see INVENTORY §e) |

## 1. `div.nav-w`

Shared navigation component — see [_shared-nav.md](./_shared-nav.md)

Copy, links and media are documented once in the shared component docs.

## 2. `header.contact-s`

Full-screen contact block (no footer on this page): “CONTACT US” eyebrow, rolling 3-line headline CRAFT / THE NEXT / ACT, then PROJECT INQUIRIES (mailto), PHONE NUMBER (tel:) and ADDRESS (plain text) rows

### Copy (verbatim)

```text
h1.roll-cont-eyeb.parish.lg.is--contact [data-a="item"]: CONTACT{nbsp}US
div.contact-h [data-an="rollover"]: CRAFT
div.contact-h [data-an="rollover"]: THE{nbsp}NEXT
div.contact-h [data-an="rollover"]: ACT
div.roll-cont-eyeb.parish.mb-0.contact-off [data-a="alpha"]: PROJECT{nbsp}INQUIRIES   (inline: span {desktop-only(data-hide=mobile)})
div.contact-lab [data-a="item"]: LEE@SIENA.FILM
div.roll-cont-eyeb.parish.mb-0.contact-off [data-a="alpha"]: PHONE{nbsp}NUMBER
div.contact-lab [data-a="item"]: +972-54-2804049
div.roll-cont-eyeb.parish.mb-0.contact-off [data-a="alpha"]: ADDRESS
div.contact-lab [data-a="item"]: Dizengoff ST, 123, Tel Aviv
```

### Links

| text | href | type | target | element / notes |
|---|---|---|---|---|
| PROJECT{nbsp}INQUIRIES · LEE@SIENA.FILM | `mailto:lee@siena.film?subject=Project%20Inquiry` | mailto |  | div-block-23.w-inline-block |
| PHONE{nbsp}NUMBER · +972-54-2804049 | `tel:+972542804049` | tel |  | div-block-23.w-inline-block |

### Media

_No media._

## 3. `div.div-block-44`

Rotate-your-device notice (CSS: visible only 480–767px wide; see INVENTORY §e)

### Copy (verbatim)

```text
div.paragraph: Rotate your device⏎to ensure a better experience
```

### Links

_No links._

### Media

_No media._
