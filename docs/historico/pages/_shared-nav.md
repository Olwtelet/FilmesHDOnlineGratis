# Shared navigation `div.nav-w` (component `src/components/Nav.astro`)

Present as the first child of the page view on every page except `/404`. Markup is identical on all pages except: (1) `w--current` + `aria-current="page"` on the link(s) whose href equals the route, (2) the case-panel synopsis `.case-menu-tx` (Webflow placeholder “This is some text inside of a div block.” on non-film pages, the film synopsis on film pages, with a trailing newline that collapses to a trailing space), (3) the home logo link is `w--current` on `/`.

| route | elements with w--current | .case-menu-tx starts with |
|---|---|---|
| `/` | nav-link→/ | This is some text inside of a div block.… |
| `/work` | menu-link→/work | This is some text inside of a div block.… |
| `/about` | menu-link→/about | This is some text inside of a div block.… |
| `/contact` | menu-link→/contact | This is some text inside of a div block.… |
| `/cookies` | menu-link→/cookies | This is some text inside of a div block.… |
| `/terms` | menu-link→/terms | This is some text inside of a div block.… |
| `/privacy` | menu-link→/privacy | This is some text inside of a div block.… |
| `/404` | — (no nav) | — |
| `/films/savoy` | footagemenu-cta-w→/films/savoy, menu-film-direct-link→/films/savoy | In a hybrid fiction-docu film, Zohar Wagner recounts the story of Kochava Levy, … |
| `/films/moon-in-the-12th-house` | footagemenu-cta-w→/films/moon-in-the-12th-house, menu-film-direct-link→/films/moon-in-the-12th-house | When estranged sisters Lenny, who stayed to care for their ailing father, and Mi… |
| `/films/taboo` | footagemenu-cta-w→/films/taboo, menu-film-direct-link→/films/taboo | Amos Guttman, a Romanian migrant and gay filmmaker, challenged Israel’s conserva… |
| `/films/kafkas-last-trial` | footagemenu-cta-w→/films/kafkas-last-trial, menu-film-direct-link→/films/kafkas-last-trial | After Franz Kafka’s death, he left unpublished manuscripts with instructions to … |
| `/films/my-project-x` | footagemenu-cta-w→/films/my-project-x, menu-film-direct-link→/films/my-project-x | Michal Ben Horin uncovers childhood secrets through a personal film archive, whe… |
| `/films/ana-maxim` | footagemenu-cta-w→/films/ana-maxim, menu-film-direct-link→/films/ana-maxim | Anna (45) is a Nursing assistant of Maxim (76) an intolerable elderly man who su… |
| `/films/outsider-freud` | footagemenu-cta-w→/films/outsider-freud, menu-film-direct-link→/films/outsider-freud | A creative documentary exploring Freud’s life in four acts, blending animation, … |
| `/films/by-any-means` | footagemenu-cta-w→/films/by-any-means, menu-film-direct-link→/films/by-any-means | Based on a true story, a young Black FBI agent (Yahya Abdul-Mateen II) is sent i… |
| `/films/thehousewife` | footagemenu-cta-w→/films/thehousewife, menu-film-direct-link→/films/thehousewife | A New York Times journalist tracks down a potential Nazi officer living secretly… |

Note: the nav contains `<link rel="prefetch">` for `/` and every film and `<link rel="prerender" href="/work">` (they are part of the DOM and of the diff).

## Navigation markup (on /work only the WORK main link carries w--current) (as published on `work`)

### Copy (verbatim)

```text
┄ div.menu-row-film-item.w-dyn-item data-id/url=savoy:
  div.top-m-film-title [data-menu="mainyr"]: Savoy
  div.info-grid-tx: Documentary
  div.info-grid-tx: 2022
  div.text-block-7: MIN.
  div.text-block-6: 77
┄ div.menu-row-film-item.w-dyn-item data-id/url=moon-in-the-12th-house:
  div.top-m-film-title [data-menu="mainyr"]: Moon in the 12th House
  div.info-grid-tx: Feature Film
  div.info-grid-tx: 2014
  div.text-block-7: MIN.
  div.text-block-6: 109
┄ div.menu-row-film-item.w-dyn-item data-id/url=taboo:
  div.top-m-film-title [data-menu="mainyr"]: Taboo
  div.info-grid-tx: Documentary
  div.info-grid-tx: 2024
  div.text-block-7: MIN.
  div.text-block-6: 93
┄ div.menu-row-film-item.w-dyn-item data-id/url=kafkas-last-trial:
  div.top-m-film-title [data-menu="mainyr"]: Kafka's Last Trial
  div.info-grid-tx: Documentary
  div.info-grid-tx: 2024
  div.text-block-7: MIN.
  div.text-block-6: 83
┄ div.menu-row-film-item.w-dyn-item data-id/url=my-project-x:
  div.top-m-film-title [data-menu="mainyr"]: My Project X
  div.info-grid-tx: Documentary
  div.info-grid-tx: 2024
  div.text-block-7: MIN.
  div.text-block-6: 88
┄ div.menu-row-film-item.w-dyn-item data-id/url=ana-maxim:
  div.top-m-film-title [data-menu="mainyr"]: Ana Maxim
  div.info-grid-tx: Short Film
  div.info-grid-tx: 2024
  div.text-block-7: MIN.
  div.text-block-6: 27
┄ div.menu-row-film-item.w-dyn-item data-id/url=outsider-freud:
  div.top-m-film-title [data-menu="mainyr"]: Outsider Freud
  div.info-grid-tx: Documentary
  div.info-grid-tx: 2024
  div.text-block-7: MIN.
  div.text-block-6: 66
┄ div.menu-row-film-item.w-dyn-item data-id/url=by-any-means:
  div.top-m-film-title [data-menu="mainyr"]: By Any Means
  div.info-grid-tx: Feature Film
  div.info-grid-tx: 2026
  div.text-block-7: MIN.
  div.text-block-6: 146
┄ div.menu-row-film-item.w-dyn-item data-id/url=thehousewife:
  div.top-m-film-title [data-menu="mainyr"]: The Housewife
  div.info-grid-tx: Feature Film
  div.info-grid-tx: 2026
  div.text-block-7: MIN.
  div.text-block-6: 102
┄ div.menu-footage-item.w-dyn-item:
  div.footage-menu-eyeb: HEADLINE
  div.footage-menu-title: "A film based on a true Story"
  div.footage-menu-eyeb: DIRECTOR
  div.footage-menu-title: Zohar Wagner
  div.footage-menu-eyeb: PRODUCERS
  div.footage-menu-title: Leelu Dorit
  div.footagemenu-cta-tx.smaller {::after="EXPLORE"}: SEE{nbsp}CASE{nbsp}STUDY
┄ div.menu-footage-item.w-dyn-item:
  div.footage-menu-eyeb: HEADLINE
  div.footage-menu-title: "A film based on a true Story"
  div.footage-menu-eyeb: DIRECTOR
  div.footage-menu-title: Dorit Hakim Kramer
  div.footage-menu-eyeb: PRODUCERS
  div.footage-menu-title: Leelu Dorit
  div.footagemenu-cta-tx.smaller {::after="EXPLORE"}: SEE{nbsp}CASE{nbsp}STUDY
┄ div.menu-footage-item.w-dyn-item:
  div.footage-menu-eyeb: HEADLINE
  div.footage-menu-title: "A film based on a true Story"
  div.footage-menu-eyeb: DIRECTOR
  div.footage-menu-title: Shauly Melamed
  div.footage-menu-eyeb: PRODUCERS
  div.footage-menu-title: Leelu Dorit
  div.footagemenu-cta-tx.smaller {::after="EXPLORE"}: SEE{nbsp}CASE{nbsp}STUDY
┄ div.menu-footage-item.w-dyn-item:
  div.footage-menu-eyeb: HEADLINE
  div.footage-menu-title: "A film based on a true Story"
  div.footage-menu-eyeb: DIRECTOR
  div.footage-menu-title: Eliran Peled
  div.footage-menu-eyeb: PRODUCERS
  div.footage-menu-title: Leelu Dorit
  div.footagemenu-cta-tx.smaller {::after="EXPLORE"}: SEE{nbsp}CASE{nbsp}STUDY
┄ div.menu-footage-item.w-dyn-item:
  div.footage-menu-eyeb: HEADLINE
  div.footage-menu-title: "A film based on a true Story"
  div.footage-menu-eyeb: DIRECTOR
  div.footage-menu-title: Limor Pinhasov
  div.footage-menu-eyeb: PRODUCERS
  div.footage-menu-title: Leelu Dorit
  div.footagemenu-cta-tx.smaller {::after="EXPLORE"}: SEE{nbsp}CASE{nbsp}STUDY
┄ div.menu-footage-item.w-dyn-item:
  div.footage-menu-eyeb: HEADLINE
  div.footage-menu-title: "A film based on a true Story"
  div.footage-menu-eyeb: DIRECTOR
  div.footage-menu-title: Yoni Handelsman
  div.footage-menu-eyeb: PRODUCERS
  div.footage-menu-title: Leelu Dorit
  div.footagemenu-cta-tx.smaller {::after="EXPLORE"}: SEE{nbsp}CASE{nbsp}STUDY
┄ div.menu-footage-item.w-dyn-item:
  div.footage-menu-eyeb: HEADLINE
  div.footage-menu-title: "A film based on a true Story"
  div.footage-menu-eyeb: DIRECTOR
  div.footage-menu-title: Yair Qedar
  div.footage-menu-eyeb: PRODUCERS
  div.footage-menu-title: Leelu Dorit
  div.footagemenu-cta-tx.smaller {::after="EXPLORE"}: SEE{nbsp}CASE{nbsp}STUDY
┄ div.menu-footage-item.w-dyn-item:
  div.footage-menu-eyeb: HEADLINE
  div.footage-menu-title: "A film based on a true Story"
  div.footage-menu-eyeb: DIRECTOR
  div.footage-menu-title: Elegance Bratton
  div.footage-menu-eyeb: PRODUCERS
  div.footage-menu-title: Leelu Dorit
  div.footagemenu-cta-tx.smaller {::after="EXPLORE"}: SEE{nbsp}CASE{nbsp}STUDY
┄ div.menu-footage-item.w-dyn-item:
  div.footage-menu-eyeb: HEADLINE
  div.footage-menu-title: "A film based on a true Story"
  div.footage-menu-eyeb: DIRECTOR
  div.footage-menu-title: Ben Shirinian
  div.footage-menu-eyeb: PRODUCERS
  div.footage-menu-title: Leelu Dorit
  div.footagemenu-cta-tx.smaller {::after="EXPLORE"}: SEE{nbsp}CASE{nbsp}STUDY
div.case-menu-tx: This is some text inside of a div block.
div.footagemenu-cta-tx.smaller {::after="EXPLORE"}: 5/5
┄ div.menu-film.w-dyn-item:
  div.menu-film-title.menu [data-animation-delay="stagger" data-a="y"]: Savoy
┄ div.menu-film.w-dyn-item:
  div.menu-film-title.menu [data-animation-delay="stagger" data-a="y"]: Moon in the 12th House
┄ div.menu-film.w-dyn-item:
  div.menu-film-title.menu [data-animation-delay="stagger" data-a="y"]: Taboo
┄ div.menu-film.w-dyn-item:
  div.menu-film-title.menu [data-animation-delay="stagger" data-a="y"]: Kafka's Last Trial
┄ div.menu-film.w-dyn-item:
  div.menu-film-title.menu [data-animation-delay="stagger" data-a="y"]: My Project X
┄ div.menu-film.w-dyn-item:
  div.menu-film-title.menu [data-animation-delay="stagger" data-a="y"]: Ana Maxim
┄ div.menu-film.w-dyn-item:
  div.menu-film-title.menu [data-animation-delay="stagger" data-a="y"]: Outsider Freud
┄ div.menu-film.w-dyn-item:
  div.menu-film-title.menu [data-animation-delay="stagger" data-a="y"]: By Any Means
┄ div.menu-film.w-dyn-item:
  div.menu-film-title.menu [data-animation-delay="stagger" data-a="y"]: The Housewife
div.about-menu-tx: SIENA
div.about-menu-tx: ADMIT{nbsp}ONE
div.about-menu-tx: 004
div.nav-alt-tx: LET'S TALK
div.c-menu-cta-tx: EMAIL{nbsp}US
div.menu-link-list-text [data-delay=".1" data-counter="menuLinkText" data-a="y"]: WORK
div.menu-link-list-text [data-delay=".2" data-counter="menuLinkText" data-a="y"]: About
div.menu-link-list-text [data-delay=".3" data-counter="menuLinkText" data-a="y"]: Contact
div [data-delay=".3" data-a="y"]: COOKIE
div [data-delay=".4" data-a="y"]: TERMS
div [data-delay=".5" data-a="y"]: PRIVACY
div.light: ©2024. SIENA{nbsp}FILM{nbsp}FOUNDATION.␠
```

### Links

| text | href | type | target | element / notes |
|---|---|---|---|---|
| (icon) | `/` | internal |  | nav-link.logo.w-inline-block data-a="logo" |
| SEE{nbsp}CASE{nbsp}STUDY | `/films/savoy` | internal |  | footagemenu-cta-w.w-inline-block data-footagemenu="w" |
| SEE{nbsp}CASE{nbsp}STUDY | `/films/moon-in-the-12th-house` | internal |  | footagemenu-cta-w.w-inline-block data-footagemenu="w" |
| SEE{nbsp}CASE{nbsp}STUDY | `/films/taboo` | internal |  | footagemenu-cta-w.w-inline-block data-footagemenu="w" |
| SEE{nbsp}CASE{nbsp}STUDY | `/films/kafkas-last-trial` | internal |  | footagemenu-cta-w.w-inline-block data-footagemenu="w" |
| SEE{nbsp}CASE{nbsp}STUDY | `/films/my-project-x` | internal |  | footagemenu-cta-w.w-inline-block data-footagemenu="w" |
| SEE{nbsp}CASE{nbsp}STUDY | `/films/ana-maxim` | internal |  | footagemenu-cta-w.w-inline-block data-footagemenu="w" |
| SEE{nbsp}CASE{nbsp}STUDY | `/films/outsider-freud` | internal |  | footagemenu-cta-w.w-inline-block data-footagemenu="w" |
| SEE{nbsp}CASE{nbsp}STUDY | `/films/by-any-means` | internal |  | footagemenu-cta-w.w-inline-block data-footagemenu="w" |
| SEE{nbsp}CASE{nbsp}STUDY | `/films/thehousewife` | internal |  | footagemenu-cta-w.w-inline-block data-footagemenu="w" |
| (icon) | `/films/savoy` | internal |  | menu-film-direct-link.w-inline-block |
| (icon) | `/films/moon-in-the-12th-house` | internal |  | menu-film-direct-link.w-inline-block |
| (icon) | `/films/taboo` | internal |  | menu-film-direct-link.w-inline-block |
| (icon) | `/films/kafkas-last-trial` | internal |  | menu-film-direct-link.w-inline-block |
| (icon) | `/films/my-project-x` | internal |  | menu-film-direct-link.w-inline-block |
| (icon) | `/films/ana-maxim` | internal |  | menu-film-direct-link.w-inline-block |
| (icon) | `/films/outsider-freud` | internal |  | menu-film-direct-link.w-inline-block |
| (icon) | `/films/by-any-means` | internal |  | menu-film-direct-link.w-inline-block |
| (icon) | `/films/thehousewife` | internal |  | menu-film-direct-link.w-inline-block |
| EMAIL{nbsp}US | `mailto:lee@siena.film` | mailto |  | c-menu-cta-w.w-inline-block |
| WORK | `/work` | internal |  | menu-link.large.w-inline-block.w--current aria-current=page data-hover="mainlink" |
| About | `/about` | internal |  | menu-link.large.w-inline-block data-hover="mainlink" |
| Contact | `/contact` | internal |  | menu-link.large.w-inline-block data-hover="mainlink" |
| COOKIE | `/cookies` | internal |  | menu-link.xs.light.w-inline-block |
| TERMS | `/terms` | internal |  | menu-link.xs.light.w-inline-block |
| PRIVACY | `/privacy` | internal |  | menu-link.xs.light.w-inline-block |
| (icon) | `https://www.instagram.com/sienafilmfoundation/` | external | _blank | menu-link.social.w-inline-block |
| (icon) | `#` | anchor |  | menu-link.social.w-inline-block |
| (icon) | `https://www.facebook.com/profile.php?id=61572313858308` | external | _blank | menu-link.social.bigger.w-inline-block |
| (icon) | `https://www.facebook.com/profile.php?id=61572313858308` | external | _blank | menu-link.social.bigger.even-bigger.w-inline-block |

Resource hints inside this block (`<link>` elements): `prefetch:/`, `prefetch:/films/savoy`, `prefetch:/films/moon-in-the-12th-house`, `prefetch:/films/taboo`, `prefetch:/films/kafkas-last-trial`, `prefetch:/films/my-project-x`, `prefetch:/films/ana-maxim`, `prefetch:/films/outsider-freud`, `prefetch:/films/by-any-means`, `prefetch:/films/thehousewife`, `prerender:/work` (11 total)

### Media

| kind | local path | element | details | on disk |
|---|---|---|---|---|
| img | `/assets/img/films/savoy/675eb91e-savoy.webp` | menu-main-film-img | srcset 500w 800w 1080w 1600w 1920w; sizes="100vw"; loading=lazy; alt="" | 210 KB |
| img | `/assets/img/films/moon-in-the-12th-house/moon.jpg` | menu-main-film-img | srcset 500w 800w 1080w 1600w 1920w; sizes="100vw"; loading=lazy; alt="" | 1050 KB |
| img | `/assets/img/films/taboo/675eb903-taboo.webp` | menu-main-film-img | srcset 500w 800w 1080w 1600w 1920w; sizes="100vw"; loading=lazy; alt="" | 282 KB |
| img | `/assets/img/films/kafkas-last-trial/kafka.jpg` | menu-main-film-img | srcset 500w 800w 1080w 1600w 1920w; sizes="100vw"; loading=lazy; alt="" | 659 KB |
| img | `/assets/img/films/my-project-x/project.jpg` | menu-main-film-img | srcset 500w 800w 1080w 1600w 1920w; sizes="100vw"; loading=lazy; alt="" | 987 KB |
| img | `/assets/img/films/ana-maxim/ana.jpg` | menu-main-film-img | srcset 500w 800w 1080w 1600w 1920w; sizes="100vw"; loading=lazy; alt="" | 1085 KB |
| img | `/assets/img/films/outsider-freud/freud.jpg` | menu-main-film-img | srcset 500w 800w 1080w 1600w 1920w; sizes="100vw"; loading=lazy; alt="" | 910 KB |
| img | `/assets/img/films/by-any-means/6a57521a-BYANYMEANS_2024-04-28_EJA-02511_R1.webp` | menu-main-film-img | srcset 500w 800w 1080w 1600w 2000w 2600w 3200w 3900w; sizes="100vw"; loading=lazy; alt="" | 399 KB |
| img | `/assets/img/films/thehousewife/housewife2.jpg` | menu-main-film-img | loading=lazy; alt="" | 20 KB |
| img | `/assets/img/films/savoy/675eb91e-savoy.webp` | menu-smalll-film-img | srcset 500w 800w 1080w 1600w 1920w; sizes="70px"; loading=lazy; alt=""; width=70 | 210 KB |
| img | `/assets/img/films/moon-in-the-12th-house/moon.jpg` | menu-smalll-film-img | srcset 500w 800w 1080w 1600w 1920w; sizes="70px"; loading=lazy; alt=""; width=70 | 1050 KB |
| img | `/assets/img/films/taboo/675eb903-taboo.webp` | menu-smalll-film-img | srcset 500w 800w 1080w 1600w 1920w; sizes="70px"; loading=lazy; alt=""; width=70 | 282 KB |
| img | `/assets/img/films/kafkas-last-trial/kafka.jpg` | menu-smalll-film-img | srcset 500w 800w 1080w 1600w 1920w; sizes="70px"; loading=lazy; alt=""; width=70 | 659 KB |
| img | `/assets/img/films/my-project-x/project.jpg` | menu-smalll-film-img | srcset 500w 800w 1080w 1600w 1920w; sizes="70px"; loading=lazy; alt=""; width=70 | 987 KB |
| img | `/assets/img/films/ana-maxim/ana.jpg` | menu-smalll-film-img | srcset 500w 800w 1080w 1600w 1920w; sizes="70px"; loading=lazy; alt=""; width=70 | 1085 KB |
| img | `/assets/img/films/outsider-freud/freud.jpg` | menu-smalll-film-img | srcset 500w 800w 1080w 1600w 1920w; sizes="70px"; loading=lazy; alt=""; width=70 | 910 KB |
| img | `/assets/img/films/by-any-means/6a57521a-BYANYMEANS_2024-04-28_EJA-02511_R1.webp` | menu-smalll-film-img | srcset 500w 800w 1080w 1600w 2000w 2600w 3200w 3900w; sizes="70px"; loading=lazy; alt=""; width=70 | 399 KB |
| img | `/assets/img/films/thehousewife/housewife2.jpg` | menu-smalll-film-img | loading=lazy; alt=""; width=70 | 20 KB |
