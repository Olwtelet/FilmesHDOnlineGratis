# Shared footer `footer.footer` (component `src/components/Footer.astro`)

Variant `on-black` adds the class `w-variant-ff3af7bd-5bdd-e152-9111-9fa617f1f874` to the footer and to many descendants — NOT always as the last class (e.g. `footer-of-w w-variant-… last`, `ft-newsletter-input w-variant-… w-input`). The newsletter `<form>` carries `data-wf-page-id` = the page's Webflow page id (film pages: the template id `673306dca8fcb48d30953c00`). Sitemap/legal links get `w--current` + `aria-current` on their own route. `/home`, `/work` and `/contact` have no footer; `/404` has its own minimal footer.

## Variant `base` (film pages) (as published on `films_savoy`)

### Copy (verbatim)

```text
div [data-a="item"]: PRODUCTION
div [data-a="item"]: DOCUMENTARY
div.text-block-13 [data-a="item"]: FILM TV
h2.roll-cont-eyeb.parish.mobile-mb: Stay up to date
div: Thank you! Your submission has been received!
div: Oops! Something went wrong while submitting the form.
h2.roll-cont-eyeb.parish.mobile-mb: sitemap
h3.ft-li-lk-tx: Home
h3.ft-li-lk-tx: Work
h3.ft-li-lk-tx: About
h3.ft-li-lk-tx: Contact
h2.roll-cont-eyeb.parish.mobile-mb: contact us
div.roll-cont-eyeb.parish.mb-line.ft: Inquiries   (text inside span {desktop-only(data-hide=mobile)})
div.ft-contact-li-he: LEE@SiENA.film
div.roll-cont-eyeb.parish.mb-line.ft: Press
div.ft-contact-li-he: PRESS@SiENA.FILM
div.roll-cont-eyeb.parish.center.left: Follow us —
div.roll-cont-eyeb.parish.center: @siena. All Rights Reserved
div.roll-cont-eyeb.parish.center: COOKIE
div.roll-cont-eyeb.parish.center: -
div.roll-cont-eyeb.parish.center: PRIVACY
div.roll-cont-eyeb.parish.center: -
div.roll-cont-eyeb.parish.center: TERMS
```

### Links

| text | href | type | target | element / notes |
|---|---|---|---|---|
| Home | `/` | internal |  | ft-sitemap-lk.w-inline-block |
| Work | `/work` | internal |  | ft-sitemap-lk.w-inline-block |
| About | `/about` | internal |  | ft-sitemap-lk.w-inline-block |
| Contact | `/contact` | internal |  | ft-sitemap-lk.w-inline-block |
| Inquiries · LEE@SiENA.film | `mailto:lee@siena.film?subject=Direct%20Mail%20from%20Website` | mailto |  | ft-contact-li-it.w-inline-block |
| Press · PRESS@SiENA.FILM | `mailto:press@siena.film?subject=Direct%20Email%20from%20Website` | mailto |  | ft-contact-li-it.w-inline-block |
| (icon) | `https://www.facebook.com/profile.php?id=61572313858308` | external | _blank | footer-social-icon-w.w-inline-block |
| (icon) | `https://www.linkedin.com/company/siena-film-foundation/` | external | _blank | footer-social-icon-w.w-inline-block |
| (icon) | `https://www.instagram.com/sienafilmfoundation/` | external | _blank | footer-social-icon-w.w-inline-block |
| COOKIE | `/cookies` | internal |  | ft-small-lk.w-inline-block |
| PRIVACY | `/privacy` | internal |  | ft-small-lk.w-inline-block |
| TERMS | `/terms` | internal |  | ft-small-lk.w-inline-block |

### Media

_No media._

## Variant `on-black` (about, cookies, terms, privacy) (as published on `about`)

### Copy (verbatim)

```text
div [data-a="item"]: PRODUCTION
div [data-a="item"]: DOCUMENTARY
div.text-block-13 [data-a="item"]: FILM TV
h2.roll-cont-eyeb.parish.mobile-mb.w-variant-ff3af7bd-5bdd-e152-9111-9fa617f1f874: Stay up to date
div: Thank you! Your submission has been received!
div: Oops! Something went wrong while submitting the form.
h2.roll-cont-eyeb.parish.mobile-mb.w-variant-ff3af7bd-5bdd-e152-9111-9fa617f1f874: sitemap
h3.ft-li-lk-tx.w-variant-ff3af7bd-5bdd-e152-9111-9fa617f1f874: Home
h3.ft-li-lk-tx.w-variant-ff3af7bd-5bdd-e152-9111-9fa617f1f874: Work
h3.ft-li-lk-tx.w-variant-ff3af7bd-5bdd-e152-9111-9fa617f1f874: About
h3.ft-li-lk-tx.w-variant-ff3af7bd-5bdd-e152-9111-9fa617f1f874: Contact
h2.roll-cont-eyeb.parish.mobile-mb.w-variant-ff3af7bd-5bdd-e152-9111-9fa617f1f874: contact us
div.roll-cont-eyeb.parish.mb-line.w-variant-ff3af7bd-5bdd-e152-9111-9fa617f1f874.ft: Inquiries   (text inside span {desktop-only(data-hide=mobile)})
div.ft-contact-li-he.w-variant-ff3af7bd-5bdd-e152-9111-9fa617f1f874: LEE@SiENA.film
div.roll-cont-eyeb.parish.mb-line.w-variant-ff3af7bd-5bdd-e152-9111-9fa617f1f874.ft: Press
div.ft-contact-li-he.w-variant-ff3af7bd-5bdd-e152-9111-9fa617f1f874: PRESS@SiENA.FILM
div.roll-cont-eyeb.parish.center.left: Follow us —
div.roll-cont-eyeb.parish.center: @siena. All Rights Reserved
div.roll-cont-eyeb.parish.center: COOKIE
div.roll-cont-eyeb.parish.center: -
div.roll-cont-eyeb.parish.center: PRIVACY
div.roll-cont-eyeb.parish.center: -
div.roll-cont-eyeb.parish.center: TERMS
```

### Links

| text | href | type | target | element / notes |
|---|---|---|---|---|
| Home | `/` | internal |  | ft-sitemap-lk.w-inline-block |
| Work | `/work` | internal |  | ft-sitemap-lk.w-inline-block |
| About | `/about` | internal |  | ft-sitemap-lk.w-inline-block.w--current aria-current=page |
| Contact | `/contact` | internal |  | ft-sitemap-lk.w-inline-block |
| Inquiries · LEE@SiENA.film | `mailto:lee@siena.film?subject=Direct%20Mail%20from%20Website` | mailto |  | ft-contact-li-it.w-variant-ff3af7bd-5bdd-e152-9111-9fa617f1f874.w-inline-block |
| Press · PRESS@SiENA.FILM | `mailto:press@siena.film?subject=Direct%20Email%20from%20Website` | mailto |  | ft-contact-li-it.w-variant-ff3af7bd-5bdd-e152-9111-9fa617f1f874.w-inline-block |
| (icon) | `https://www.facebook.com/profile.php?id=61572313858308` | external | _blank | footer-social-icon-w.w-variant-ff3af7bd-5bdd-e152-9111-9fa617f1f874.w-inline-block |
| (icon) | `https://www.linkedin.com/company/siena-film-foundation/` | external | _blank | footer-social-icon-w.w-variant-ff3af7bd-5bdd-e152-9111-9fa617f1f874.w-inline-block |
| (icon) | `https://www.instagram.com/sienafilmfoundation/` | external | _blank | footer-social-icon-w.w-variant-ff3af7bd-5bdd-e152-9111-9fa617f1f874.w-inline-block |
| COOKIE | `/cookies` | internal |  | ft-small-lk.w-variant-ff3af7bd-5bdd-e152-9111-9fa617f1f874.w-inline-block |
| PRIVACY | `/privacy` | internal |  | ft-small-lk.w-variant-ff3af7bd-5bdd-e152-9111-9fa617f1f874.w-inline-block |
| TERMS | `/terms` | internal |  | ft-small-lk.w-variant-ff3af7bd-5bdd-e152-9111-9fa617f1f874.w-inline-block |

### Media

_No media._

## 404 footer (not the component: `footer.s.footer.black`, only the last line) (as published on `404`)

### Copy (verbatim)

```text
div.roll-cont-eyeb.parish.center.left: Follow us —
div.roll-cont-eyeb.parish.center: @siena. All Rights Reserved 2024
div.roll-cont-eyeb.parish.center: COOKIE
div.roll-cont-eyeb.parish.center: -
div.roll-cont-eyeb.parish.center: PRIVACY
div.roll-cont-eyeb.parish.center: -
div.roll-cont-eyeb.parish.center: TERMS
```

### Links

| text | href | type | target | element / notes |
|---|---|---|---|---|
| (icon) | `https://www.facebook.com/profile.php?id=61572313858308` | external | _blank | footer-social-icon-w._404.w-inline-block |
| (icon) | `https://www.linkedin.com/company/siena-film-foundation/` | external | _blank | footer-social-icon-w._404.w-inline-block |
| (icon) | `https://www.instagram.com/sienafilmfoundation/` | external | _blank | footer-social-icon-w._404.w-inline-block |
| COOKIE | `#` | anchor |  | ft-small-lk.white.w-inline-block |
| PRIVACY | `#` | anchor |  | ft-small-lk.white.w-inline-block |
| TERMS | `#` | anchor |  | ft-small-lk.white.w-inline-block |

### Media

_No media._
