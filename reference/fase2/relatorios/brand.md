# Fase 2: old-brand sweep and slot map

Audit of `C:/Users/Usuario/Desktop/FHDOG` (replica) against `C:/Users/Usuario/Desktop/Projetos/FHDOG` (source, HEAD `72789e8`). Date of the audit: 2026-10-31. Nothing in either project was changed. Paths below are relative to the replica unless they start with `FHDOG repo:`.

Method: ripgrep over `src/`, `public/` text files, `astro.config.mjs`, `package.json`, `tools/`; parse5 extraction of every text node, attribute and meta from the 17 pages in `dist/`; headless Edge (Playwright, `headless: true`) against the running build on `http://localhost:4322`; frames extracted from the videos; images converted and viewed. Scripts, screenshots and raw output are in `scratchpad/f2/brand-scratch/`. All "fit" and accent tests rewrote text in memory or in the HTML response, never on disk.

---

## 1. What matters most

1. **Portuguese accents break in display type. This is a blocker no amount of translating fixes.** Measured with real text in the real slots (section 4). `SESSÃO` renders as `SESSAO` on /contact, `PROGRAMAÇÃO` as `PROGRAMACAO` in the /about hero, `TRAIÇÃO` loses its tilde in the case hero, and the home roll titles show ghost tildes inside the letter below. 8 of the 21 film titles carry a diacritic (9 counting `A Viúva` in the double feature), and so do 19 of the 21 headlines.
2. **The public source leaks the brand beyond what is visible.** HTML comments at `BaseLayout.astro:41-65` print `siena-film-foundation.vercel.app` and a publish date in every page's view-source. `data-wf-site` (Siena's Webflow site id) is on all 17 pages and `preconnect` to Webflow's CDN on 16. /contact has a hidden row that never displays but still ships `Dizengoff ST, 123, Tel Aviv`.
3. **Four intro and tutorial videos have the brand burned in.** All 10 files in `public/assets/video/` go. The bundle needs a `<video>` in the preloader or it throws (`app.js:478`, `this.video=this.wrapper.querySelector("video")` then `.muted=`), so replacements must exist. This machine has no ffmpeg on PATH; Playwright's build encodes only VP9 and PNG, so no H.264 without installing something.
4. **Star ratings live in 4 places, and removing one of them silently kills an animation.** `sg()` (`app.js:1`, offset 53442) wraps a review block in its parallax `<div data-parallax>` only if the chunk contains `<figure`, `<p` and `<h3`. Delete the star `<figure>` and every home review loses its parallax. Keep a `<figure>` with something that is not a rating.
5. **Static fake claims are printed for every film regardless of content:** `"A film based on a true Story"`, `Leelu Dorit`, `5/5`, `VARIETY` / `"A cinematic triumph"`. They are in components, not in film data, so a data swap alone leaves them in place.
6. **Never put a YouTube URL in `<video src>`.** Today /films/by-any-means does. Measured: on page load, with no click, it requests `youtu.be` and `youtube.com/watch`, receives 5 cookies including `VISITOR_INFO1_LIVE` (6 months), and plays nothing because ORB blocks the response. A `youtube-nocookie.com` iframe inserted on click set 0 cookies in the same test (section 6).
7. **The real e-mail does not fit any big slot.** `FILMESHDONLINEGRATISBR@GMAIL.COM` measures 801 px at 48 px on /contact and 568 px in the footer, and overflows the viewport at 1024 and 390. Proposal: the address goes in the small eyebrow (fits at both widths), the big text becomes an action.
8. **Both quality gates fail by construction once content changes** (`check-site`, `dom-diff`, all film scenarios). Importers and `sync-assets` would restore Siena if anyone re-runs them (section 7).

---

## 2. Sweep results

### 2.1 Brand strings in code

| Where | Content |
|---|---|
| `package.json:2,4` | name `siena-film-replica`, description mentions www.siena.film |
| `src/data/site.ts:15-17` | Instagram, Facebook, LinkedIn of Siena |
| `src/data/site.ts:21-22` | `lee@siena.film`, `press@siena.film` |
| `src/data/site.ts:44,63,64,70,72` | `©2024. SIENA FILM FOUNDATION.`, footer addresses, `@siena. All Rights Reserved`, 404 variant |
| `src/data/site.ts:68` | footer words `PRODUCTION / DOCUMENTARY / FILM TV` |
| `src/layouts/BaseLayout.astro:24` | `SITE_DESCRIPTION` |
| `src/layouts/BaseLayout.astro:31,70` | `data-wf-domain="www.siena.film"`, `data-wf-site`, `lang="en"` |
| `src/layouts/BaseLayout.astro:41,42-65` | published-date comment; dev-loader comment with `siena-film-foundation.vercel.app` (lines 46, 53) |
| `src/data/home.ts:6`, `work-page.ts:6`, `contact.ts:32`, `about.ts:30`, `legal.ts:30,72,139`, `pages/404.astro:12`, `pages/films/[slug].astro:34` | `<title>` values |
| `src/data/contact.ts:40,45-46,50` | `LEE@SIENA.FILM`, `+972-54-2804049`, `Dizengoff ST, 123, Tel Aviv` (this row is `display:none` at every width I tested, but it ships) |
| `src/data/about.ts:56,61,124,148,164,227,237` | hero, statement, `xlWord`, colophon, team bios |
| `src/data/about.ts:229-240` | portrait file names `*_Profile-Image_Siena*` |
| `src/data/legal.ts` | 24 hits: `info@`, `legal@`, `licensing@siena.film`, `https://siena.film`, `12 Cinematic Lane, Tel Aviv`, `+972 3 555 1234`, Israeli law and courts, Webflow, Google Analytics, Facebook, `[Insert Country/State]`, `<sub>Subscript</sub>` |
| `src/components/nav/AboutMenu.astro:8` | ticket stub `SIENA` |
| `src/components/Nav.astro:37` | `svg.svg-logo`: outlined `SIENA` + `FILM FOUNDATION` (rendered and viewed) |
| `src/components/ui/svg-paths.ts:15-16`, `ui/LogoSquare.astro:13` | `LOGO_MARK_D` lettering, and the arch-in-square frame that is also the favicon mark |
| `public/sitemap.xml` | 7 `https://siena.film` URLs, no film pages |
| `public/assets/js/local-forms.js:3,9` | English error message shown to visitors on submit, mentions the replica |
| `tools/lib/hosting.mjs:2,32`, `tools/serve.mjs:17` | comments and console name only |
| `src/data/case-studies/*.json` | `Siena Film Foundation` in `investorsHtml` of 6 films (all these files are deleted) |

`app.js`, `webflow*.js`, and all four CSS files contain no `siena` string (`rg -i`). `Foundation` appears only in jQuery's licence header.

### 2.2 Head and metadata

| Item | Today | Action |
|---|---|---|
| Favicons | `BaseLayout.astro:87` plus swap script `:109-129` setting `/assets/img/site/678a52xx-favicon.png` | Remove script. FHDOG repo: `public/favicon.svg` works in both colour schemes, one `<link>` |
| Touch icon | `BaseLayout.astro:88`, `web-clip.png` | FHDOG repo: `public/apple-touch-icon.png` (180x180, viewed) |
| OG image | `BaseLayout.astro:30`, relative path, WebP, burned-in logo | FHDOG repo: `public/og.png` (1200x630, viewed) and `public/og/<slug>.jpg` per session. Must be absolute: FHDOG repo `Seo.astro:44` |
| Web manifest | None in either project | Nothing to do |
| JSON-LD | None in replica | Port from FHDOG repo: `index.astro` (`WebSite`), `sobre.astro:11-24` (`AboutPage`), `sessoes/[slug].astro:71-110` (`ScreeningEvent`, `BreadcrumbList`) |
| Canonical, `og:url`, `og:site_name`, `og:locale` | None. `astro.config.mjs` has no `site` | Add `site`, port `Seo.astro:61-103` |
| RSS | None | Port FHDOG repo `rss.xml.ts`, needs `@astrojs/rss` or hand-written XML; `package.json` has only `astro` |
| `<meta name=”viewport”…>` with curly quotes | `BaseLayout.astro:89` | Delete |
| Theme colour, `color-scheme`, `author` | None | Port from `Seo.astro:68-76` |
| robots | No `public/robots.txt` | Port FHDOG repo `public/robots.txt`, change the disallows |
| Search Console file | Not in replica | Keep FHDOG repo `public/google509acec848149235.html` if the domain stays |
| 404 `twitter:*` with `property=` | `pages/404.astro:29` | Drop the `twitterAttr` prop |
| `lang="en"`, `data-wf-locale="en"` | `BaseLayout.astro:70`, `pages/404.astro:28` | `pt-BR` |

### 2.3 Webflow ids: what is functional

Attributes on the 17 built pages: `data-wf-site`, `data-wf-domain`, `data-wf-page`, `data-wf-collection`, `data-wf-item-slug`, `data-wf-locale`, `data-wf-page-id`, `data-wf-element-id`, `data-wf--footer--variant`, `data-wf--explore-btn--variant`, `data-name`.

| Attribute or class | Read by | Verdict |
|---|---|---|
| `data-wf--explore-btn--variant=white` | `main.css`, `tema-sinal.css` | **Keep**, styles the white button |
| `w-node-*` ids (29 in `webflow.css`) | CSS grid placement | **Keep**, opaque and invisible |
| `w-variant-ff3af7bd-…` class | `webflow.css` | **Keep** |
| `data-wf-site` | `webflow.schunk.js` only: form endpoint, editor | Remove. It is Siena's site id |
| `data-wf-domain`, `data-wf-status` | badge module only (`webflow.schunk.js`) | Remove |
| `data-wf-page`, `-collection`, `-item-slug`, `-locale` | Nothing. `app.js` has 0 `data-wf` hits | Remove |
| `data-wf-page-id`, `-element-id`, `data-name` | Webflow forms | Go with the form (section 5.3) |

`dom-diff` will flag all of these, which is one more reason it needs a new baseline. Removal was reasoned from code, not run.

### 2.4 Strings inside the bundles

| File | String | Visible? | How to change |
|---|---|---|---|
| `app.js:1` (offset 44143) | `this.word.textContent="SCROLL"`, overwrites the `EXPLORE` in `CursorBox.astro:24` | Yes, cursor on / and /work | Single occurrence in the bundle |
| `app.js:470` (offset 364804) | `"SOUND OFF":"SOUND ON"` | Yes, only if the custom player stays | Single occurrence |
| `app.js:470` | `"0:00"`, `mm:ss` | Numeric | None |
| `app.js:470,473,478` | `FOOTAGE`, `PRELOADER_CLICKED`, `SLIDER_SETTLED` | No, internal events | **Do not touch** |
| `webflow.schunk.js` | `Made in Webflow`, `webflow.com?utm_campaign=brandjs` | Only on `*.webflow.io` domains | None once `data-wf-domain` is gone |
| `webflow.schunk.js` | `webflow.com/site/third-party-cookie-check.html`, `editor-api.webflow.com` | Third-party request on `?edit` (section 6) | Block by CSP or drop the module |
| `webflow.schunk.js` | `challenges.cloudflare.com/turnstile`, `formdata.webflow.com` | Only with a Webflow form | Goes with the form |
| `webflow.0a91112a…js` | `close lightbox`, `next image`, `previous image`, `Loading image` | aria labels; the lightbox is never opened (`tools/scenarios/30-work.mjs:5-8`) | Leave |
| `app.js:506,518` | `lil-gui.georgealways.com`, `gsap.com/standard-license` | Licence comments, not displayed | Leave |

Two ways to change `"SCROLL"`: edit the one literal in `app.js`, or leave the bundle alone and use `tema-sinal.css` (`[data-cursor="text"]{font-size:0}` plus `::after{content:"ROLAR"}`). Editing the literal is simpler and honest, but `tools/sync-assets.mjs` would overwrite it, and `docs/TEMA.md:19` currently promises the bundle is untouched. 

Hooks that look like English words but must stay: `data-page="work|about|contact|case|404|home|policy"` (`P.page==="case"` etc., 8 comparisons in `app.js`), `data-work`, `data-cursor`, `data-hitbox="PREV|NEXT"` (a selector, never displayed), class names.

**Routes are free to rename:** `app.js` has 0 occurrences of `/work`, `/about`, `/contact`, `/films`. It reads links from the DOM.

**Slug-dependent behaviour in the bundle:** `Ra` (`app.js:470`, offset 366588) does `e.dataset.case.length<13 && (heroLines[2].style.display="none")`. The slug's length was Siena's proxy for "title fits one line". FHDOG slugs carry the year, so only `bugonia-2025` (12) hides the third rule, while `the-menu-2022` and `vivarium-2019` (13) keep it on a one-line title. `data-case` is matched only against menu `data-id` (`Bh`, `Va`), so it does not have to equal the URL slug: use a derived id whose length encodes the real wrap. Long titles have the opposite problem: `MANUAL PRÁTICO DA VINGANÇA LUCRATIVA` wraps to 4 lines and `PULP FICTION: TEMPO DE VIOLÊNCIA` to 3 at 1440, against 3 fixed rules built for 2.

### 2.5 Binary assets with brand (viewed)

Full list by name in the appendix: 362 binaries, 133.5 MB, of which video is 115.9 MB.

| File | What it shows | Verdict |
|---|---|---|
| `img/site/678a5249-favicon.png`, `678a5267-favicon.png` | Siena arch-in-square mark, 32x32, no lettering | Replace |
| `img/site/web-clip.png` | Same mark, 256x256 | Replace |
| `img/site/open-graph.webp` | `SIENA FILM FOUNDATION` burned in | Replace |
| `img/site/a24logo.png` | A24 logo, third-party trademark, used 3 times as a placeholder partner | Delete, no real relationship |
| `img/site/about_left.webp`, `about_right.webp` | 469x1086 film stills | Replace |
| `img/site/about_mobile*.webp` | 1444x3344 film still, man in suit | Replace |
| `img/site/cta-frame*.avif` | 2126x1097 film still | Replace |
| `img/site/all-masks.webp` | White rounded shapes on black, no brand. Loaded by `app.js:34` as `mask_desk`; without it / and /work lose their images | **Keep** |
| `img/cms/Dorit_Profile-Image_Siena*`, `Leelu_Profile-Image_Siena*` | Portraits of two real, named people | Delete first. Personal images with no reason to stay |
| `img/cms/*_About-us_Image.webp` (36) | Siena film stills, one poster in Hebrew | Replace, grid needs 36 cells |
| `img/films/_shared/HAIFA.png`, `JFF.webp`, `JIFF.png`, `Warsaw-Film-Festival.png` | Festival logos and laurels | Delete |
| `img/films/_shared/stars.svg` | Five stars, 108x18 | Delete. Same box can hold the 7-bar mark (section 5.5) |
| `img/films/<9 slugs>/` | Stills, posters, 20+ festival logos | Delete |
| `video/logo_intro_desktop.mp4` | 2160x1440, 4.05 s. Cream, stripes, `SIENA` from about 1 s, `FILM FOUNDATION` at the end. XMP has layer names `SIENA TEXT WHITE` | Replace |
| `video/intro_mobile.mp4` | 1080x1920, 3.18 s, same | Replace |
| `video/animated_logo_black.mp4` | 3840x2160, 6.77 s, same. Only in `data-src` (`data/home.ts:37`); `app.js` has 0 `data-src` reads | Delete, drop the attribute |
| `video/tutorial-final.mp4` | 1668x1080, 22.83 s screen recording of the Siena site: logo, film titles, stars, critic quotes, `©2024. SIENA FILM FOUNDATION.` | Re-record from the finished site |
| `video/Ana_Maxim.mp4`, `Kafka-01`, `Moon`, `Project_X-01`, `Savoy-01`, `Taboo-01` | Siena trailers | Delete |
| `audio/cta_in`, `cta_out`, `menu_IN`, `menu_OUT` | 1.3 to 1.7 s UI sounds; no `siena` string in metadata | Keep, not listened to, licence unknown |
| `fonts/NB-International-Regular.ttf`, `NeueBrucke-Regular.ttf`, `P22-Parrish-Roman.ttf` | Siena's fonts. The theme replaces all of them, no element with text computes them, yet `NB International` is still fetched on 1 to 2 of 3 film-page loads (race: `webflow.css` applies before `tema-sinal.css`, linked in `<body>`) | Delete with the three `@font-face` in `webflow.css` |
| `img/webflow/*` | Grey placeholder, `background-image.svg` behind the about grid, `Made in Webflow` badge SVGs. Text checked, not viewed | No visible effect today; `placeholder.60f9…svg` shows if a prize logo is null (`CasePrizes.astro:28`) |

Keep-list after the purge: `audio/*`, `fonts/tema/*`, `img/site/all-masks.webp`, `img/webflow/*`, `css/*`, `js/*`. The rest of the 133 MB goes. `dist/` holds copies of everything: rebuild from clean.

### 2.6 Titles, slugs, Tel Aviv, festivals

- Film data files are entirely replaced: `src/data/films.ts`, `home-roll.ts`, `work.ts`, `case-studies/*.json` plus the 9 imports at `case-studies/index.ts:9-17`. `work.ts` has `location: "Tel Aviv"` 7 times and `"USA"` twice.
- Titles outside film data: `about.ts:101-114` and `:151-160` (`MOON IN THE 12TH HOUSE`, `TABOO`, `SAVOY`, `PRISONER X`, `ANA MAXIM`, `FREUD THE OUTSIDER`, `KAFKA'S LAST TRIAL`).
- Festival names and reviews sources: only in `home-roll.ts` and `case-studies/*.json`, none in components.
- Legal: `legal.ts:78,82,84,117-121,128,130,132`.

### 2.7 Fixed fake content in components

| Where | Text | Replace with |
|---|---|---|
| `nav/FootagePanel.astro:28` | `<RatingStars />` | Remove component call |
| `nav/FootagePanel.astro:29-30` | `HEADLINE`, `"A film based on a true Story"` on every film | `MANCHETE`, `film.headline` |
| `nav/FootagePanel.astro:35-36` | `PRODUCERS`, `Leelu Dorit` | `CURADORIA`, `Olwtelet` (FHDOG repo `Footer.astro:73-74`) |
| `nav/CasePanel.astro:13` | `This is some text inside of a div block.` | Tagline or empty |
| `nav/CasePanel.astro:28-29` | `<RatingStars larger />`, `5/5` | Remove stars. `5/5` slot: age rating `16` or runtime, both real |
| `case/FootageItem.astro:38-40` | Stars, `VARIETY`, `"A cinematic triumph"` on every still of every film | `SESSÃO` plus `film.headline`, or drop the overlay |
| `home/RollReviews.astro:20-26`, `data/home.ts:18` | Star figure | Keep `<figure>`, swap the image (section 5.5) |
| `case/CaseReviews.astro:43` | `1/12` counter, never rewritten: read as `1/12` on /films/savoy after load | Print the real total at build |
| `case/DynEmpty.astro:11` | `No items found.` | PT or remove |
| `footer/FooterNewsletter.astro:42,45` | `Thank you!…`, `Oops!…` | Goes with the form |
| `data/work-page.ts:29` | `Text Link` on a hidden link, read by screen readers | `Abrir {film.title}` |
| `data/legal.ts:66-67,133-134,172-173` | Webflow `<sub>Subscript</sub>` leftovers | Delete |

### 2.8 English interface words, with measured fit

Widths in px at 1440 / 390, original then proposal. "Clip" means the slot needs the section 4 fix if the word has a diacritic.

| Original | Where | Proposal | Fit |
|---|---|---|---|
| WORK, About, Contact | `site.ts:32-34` | PROGRAMAÇÃO, Sobre, Contato | 85 to 219 in 341, OK; rendered fine in the open menu |
| Home, Work, About, Contact | `site.ts:48-51` | Início, Programação, Sobre, Contato | 208 at `.ft-li-lk-tx`, OK |
| COOKIE, TERMS, PRIVACY | `site.ts:39-41,56-58` | COOKIES, TERMOS, PRIVACIDADE | 55, 51, 82; was 47, 42, 53. Row not checked for wrap |
| ENTER, CLOSE, GO BACK | `home.ts:40,52`, `404.astro:20` | ENTRAR, FECHAR, VOLTAR | Same length class |
| EXPLORE, `data-after="EXPLORE"` | `home.ts:13`, `work-page.ts:26`, `about.ts:291`, `FootagePanel.astro:40`, `CasePanel.astro:29`, `CaseNextProject.astro:27` | EXPLORAR | 51 → 58 |
| explore projects | `home.ts:14` | abrir a sessão | aria only |
| SEE CASE STUDY | `FootagePanel.astro:40` | VER FICHA | 93 → 58 |
| ALL WORK | `CaseNextProject.astro:24` | TODAS AS SESSÕES | 2 lines, 215 / 174, OK. Tilde collides with line above at `.8em` |
| All Work | `CaseHero.astro:24` | Programação | Small label |
| Showcase, NEXT | `CaseNextProject.astro:22,39,44` | Programação, PRÓXIMA | Small labels |
| ACTION!, WATCH / Trailer | `CaseTrailer.astro:32-33` | AÇÃO!, VER / Trailer | `ASSISTIR` 126 is wider than the 117 box; `VER` 55 fits |
| SOUND ON | `CaseTrailer.astro:67`, `app.js:470` | SOM LIGADO | 81 → 97. Only if the custom player stays |
| DIRECTOR'S CUT | `CaseShowcase.astro:30` | **Do not translate, it is a false claim.** FICHA DA SESSÃO | 96 → 103 |
| GALLERY, REVIEWS | `CaseGallery.astro:24`, `CaseReviews.astro:19` | GALERIA, A CURADORIA | Ticket heading, `O QUE FAZEMOS` measured 132 in 147 |
| DRAG TO DISCOVER | `CaseReviews.astro:61` | ARRASTE PARA VER | Similar |
| Investors & Broadcast | `CaseInvestors.astro:15` | Onde e quando | 356 → 223 |
| DIRECTOR, Director | `CaseCredits.astro:22`, `FootagePanel.astro:33`, `RollCallout.astro:19` | DIREÇÃO | Small |
| PRODUCErS, Main Crew, CAST | `CaseCredits.astro:55,70,89` | See section 5.6 | |
| YEAR, CATEGORY, Location, MIN. | `RollCallout.astro:26,32`, `work-page.ts:21-23`, `MenuFilmRows.astro:39` | ANO, GÊNERO, Sala, MIN. | Short |
| FOOTAGE, POSTER, MODE | `work-page.ts:15-16` | IMAGENS, CARTAZ, MODO | Not measured |
| SCROLL | `app.js:1` | ROLAR | 48 → 42 |
| Stay up to date, ENTER YOUR EMAIL | `FooterNewsletter.astro:14,29-31` | Fique por dentro; form goes (section 5.3) | |
| sitemap, contact us, Follow us —, Inquiries, Press | `FooterSitemap.astro:16`, `FooterContact.astro:13`, `FooterBottomBar.astro:24`, `site.ts:63-64` | navegar, contato, Siga —, E-mail, Discord | Short |
| ADMIT ONE | `AboutMenu.astro:11` | SALA 24 | 60 → 44 in 79 |
| 004 | `AboutMenu.astro:14` | Number of sessions, `021` | 19 in 78 |
| LET'S TALK, EMAIL US | `ContactMenu.astro:15,17` | FALE CONOSCO, E-MAIL | 99 → 139 and 45 → 33 by font metrics. Not visible on the page I measured: confirm on /contact |
| DIRECTOR'S NOTE:, PAGE NOT FOUND | `404.astro:16-17` | `ERR 404:`, `SEM SINAL`, from FHDOG repo `404.astro` | 134, 168. `PÁGINA NÃO ENCONTRADA` is 419 and overflows the 355 column at 390 |
| Rotate your device / to ensure a better experience | `RotateNotice.astro:1` | Gire o aparelho / para ver melhor | Shorter |
| Tutorial texts (5) | `home.ts:46-50` | Translate; keep 5 entries, `app.js:478` cycles them at 4.8 s | Not measured |

---

## 3. Fact base

Everything below is taken from the source repo. Nothing else may be used in a slot.

| Fact | Source |
|---|---|
| Name `Filmes HD Online Grátis`, short `FHDOG` | FHDOG repo `src/lib/site.ts:45-46` |
| Tagline `As ideias são à prova de balas` | `site.ts:47` |
| Description, curatorship, one session per Saturday, reason recorded | `site.ts:48-53` |
| Not streaming: no film hosted or distributed, screening live in the Discord room | `sobre.astro:58-65`, `README.md:3-7` |
| Open since 29 Nov 2024, small server | `sobre.astro:20,51`, facts block `:118-131` |
| Frequency `Sábados, 20:30`; cost `Nenhum` | `sobre.astro:126-131` |
| Author and curator `Olwtelet` | `site.ts:57`, `Footer.astro:73-74` |
| E-mail `filmeshdonlinegratisbr@gmail.com` | `site.ts:58` |
| Channels: Discord, YouTube, Steam, GitHub | `site.ts:61-64` (all answered HTTP 200 today) |
| RSS `/rss.xml` | `Footer.astro:22`, `rss.xml.ts` |
| Room `Sala 24`, `roomUrl`, date, time, director, year, runtime, age rating, genres, tags, headline, kicker, summary, editorial body | `src/content/films/*.md`, schema `content.config.ts` |

Things to know about those facts:

- **"Sábados" is a rule, not the data.** 18 of 21 sessions are on Saturdays; `the-menu-2022` is a Tuesday (30/06), `obsession-2026` and `what-you-wish-for-2023` Thursdays (02/07, 16/07). 20 are at 20:30, `ready-or-not-double-feature-2026` at 19:30. Per-film lines must come from the data. The owner's own copy, and `og.png`, say Saturdays.
- **Two Discord invites, both valid, no expiry, same server** (Discord's public invite API): `wSSJEJAJgt` opens channel `regras-da-casa`, `B5DKdJuuWc` opens channel `Sala 24`. Use the first for "the community" and the second for "go to the session". All 21 films use the second.
- **The catalogue ends today.** The last session is 2026-10-31 at 20:30, so after tonight there is no future session. Any `PRÓXIMA SESSÃO` label must be computed and must have a past-only state.
- **No trailer data exists.** `trailer_url` is a database column (`lib/db/types.ts:55`, `pages/admin/sessao/[id].astro:201`) and no film markdown has one. The repo contains zero real video IDs.
- **Images are small and landscape.** In `src/assets/films/`, largest 1200x796, smallest `truth-treachery-2026.webp` 306x150. No portraits. An arch at 469x1086 cropped from 1200x643 is upscaled about 1.7x.
- **Copy is longer than Siena's slots expect.** Headlines run 22 to 88 characters, kickers 0 to 134 (2 films have none), summaries 64 to 151.
- `Sobre` and `index` use `sameAs` with Discord, YouTube and Steam, so the set of 3 is the owner's own.

---

## 4. Accents in display type

Test: real slots, real theme, text replaced in the HTML response before `app.js` ran. Screenshots: `scratchpad/f2/brand-scratch/probes/`.

| Slot | Result | Likely cause (read from CSS, not isolated) |
|---|---|---|
| `.contact-h` (`accent-contact.png`) | `SESSÃO` → `SESSAO`, `GÊNERO` → `GENERO`. Accents fully removed | `.contact-h-of{height:.7em;overflow:clip}` |
| `.span-move` in about hero (`accent-about.png`) | `PROGRAMAÇÃO` → `PROGRAMACAO`, tilde and cedilla both gone | `.span-clip{overflow:clip}` |
| `.cs-title` (`accent-film.png`) | `TRAIÇÃO`: cedilla kept, tilde lost | `split-line-move-case` lines with `line-height:.7em` |
| `.roll-cont-he.home` (`crop-home.png`) | `Ã` shows a second tilde inside the letter's base, stray tilde fragment on the letter above, `Ç` loses the cedilla | Per-letter clones: `.cloneText{position:absolute;top:115%}` (`main.css`), rolled by `yPercent:"-=115"` (`app.js:478`). The clone's tilde rises into the visible cell |
| `.roll-cont-he.work` (`crop-work.png`) | Readable, but the tilde of line 2 lands inside line 1 | `line-height:.77em` |
| `.previousnext-he` (`crop-next.png`) | Readable, same collision | `line-height:.8em` |
| `.footer-of-w` | Not tested with accents, same pattern: `height:.7em;overflow:hidden` | Pick accent-free words until fixed |
| `.menu-link-list-text`, `.top-m-film-title` | Fine (`a2-menu-open.png`, `a2-home.png`) | No tight clip |
| `._404-he` | Heading had not appeared at the moment of `a2-404.png`; not assessed. Proposed `SEM SINAL` has no accent | |

Titles affected: `Bastardos Inglórios`, `Obsessão`, `Pulp Fiction: Tempo de Violência`, `Manual Prático da Vingança Lucrativa`, `Verdade e Traição`, `O Mistério de Silver Lake`, `V de Vingança`, `Aquilo que Você Deseja`, and `Casamento Sangrento: A Viúva`. Interface words avoid it where possible (sections 5.3, 5.4, 5.7), but titles cannot.

This needs a theme-level fix: taller clip boxes with compensating negative margins, and a taller cell for the letter clones so the 115% step clears the accent without touching the `-=115` loop. It also needs a visual gate, because `tools/theme-textwrap.mjs` counts lines only and cannot see it. Lowercase is no escape, since the CSS uppercases these titles.

---

## 5. Slot map

Verbs: **keep** (structure stays, new text), **swap** (asset), **derive** (from film data), **no fact** (what to do when nothing real exists).

### 5.1 Global

| Slot | Action | New content |
|---|---|---|
| `Nav.astro:37` logo | swap | FHDOG repo `Wordmark.astro`: 7-bar block plus name, as a single `currentColor` SVG fitting `viewBox 0 0 131 63` |
| `LogoSquare.astro` frame and lettering | swap | Arch frame is the old mark. 7 bars plus `FHDOG`. The big arches in the about hero are composition, keep them |
| `site.ts:15-17` social, 3 slots | keep | Discord, YouTube, Steam. Same count |
| `MainPanel.astro:48-76`, `FooterBottomBar.astro:26-41` icons | swap | No icon set in either repo; FHDOG's footer is text only. Needs 3 glyphs. Sizes tuned with `.bigger`, `.even-bigger`. Remove the `sic` LinkedIn-to-Facebook link at `MainPanel.astro:71-72` |
| External links | keep | Must have `target="_blank"` and `rel="noopener noreferrer"` |
| `/rss.xml` link | new | **Needs `target` or `data-taxi-ignore`.** Taxi handles same-origin links matching `a:not([target]):not([href^=\#]):not([data-taxi-ignore])` (`app.js:478`) and would try to render XML as a page |
| `NAV_COPYRIGHT` `site.ts:44` | keep | `©2026 FILMES HD ONLINE GRÁTIS`, 203 in 341, OK. Year from build, as FHDOG repo `Footer.astro:12` |
| `FOOTER_COPYRIGHT` `:70,72` | keep | `© 2026 Filmes HD Online Grátis · Curadoria Olwtelet`, GitHub link on the name. `All Rights Reserved` is not claimed by FHDOG and posters are not the owner's: drop it |
| Page titles | derive | FHDOG repo `Seo.astro:51-57`: `<title> · Filmes HD Online Grátis` when under 60 characters |

### 5.2 Nav panels

| Slot | Action | New content |
|---|---|---|
| `AboutMenu.astro` ticket | keep | `FHDOG`, `SALA 24`, `021` (sessions count from data). All three fit in the 79 px cells |
| `ContactMenu.astro` | keep | `FALE CONOSCO`, `E-MAIL`, mailto real address |
| Footage panel | derive | See 2.7 |
| Case panel | derive | `film.summary` (max 300 chars by schema) in place of synopsis |
| Rows: category, year, min | derive | First genre, year, runtime. Double feature has 2 features: sum `runtime`, `session.totalRuntime` exists in FHDOG repo `catalog.ts` |

### 5.3 Footer

| Slot | Action | New content |
|---|---|---|
| `FOOTER_TAGLINE` 3 lines at about 80 px | keep | `CURADORIA`, `CINEMA`, `AO VIVO`. Fit: 435, 290, 290; no accents, so no clip |
| Newsletter form `FooterNewsletter.astro` | **no fact: there is no newsletter** | Keep the column and its shape, remove `<form>`, `local-forms.js`, `w-form`. Eyebrow `Fique por dentro`. The input row becomes a link styled the same: `Assinar o feed RSS` plus arrow to `/rss.xml`. Result: no personal data collected, privacy page stays trivial |
| Sitemap column | keep | Início, Programação, Sobre, Contato |
| Contact column, 2 rows | keep | Row 1 eyebrow `E-mail`, value `ENVIAR E-MAIL` (202 / 177). The address itself does not fit (568 / 497, overflows at 1024 and 390). Row 2 eyebrow `Discord`, value `ENTRAR NA SALA`, `roomUrl` |
| Bottom bar | keep | `Siga —`, 3 icons, copyright, legal links. The 404 bar's `#` legal links (`FooterBottomBar.astro:18-19`) should be real |

### 5.4 /about

`Ha` (`app.js:473`) walks fixed child indexes, so these counts are structural: 4 statement rows with at least 2 cells each; formats block 2 columns with 2 children each (2 words; the 5-line plus 1 word). `Ua` declares `grid:[4,9]`, so the grid wants exactly 36 cells.

| Slot | Action | New content (nothing invented; source in section 3) |
|---|---|---|
| Hero small lines `about.ts:54-65` | keep | `FILMES HD ONLINE`, `GRÁTIS É UMA` |
| Hero h1, 3 words `:66-70` | keep | `CURADORIA`, `SEMANAL`, `DE CINEMA`. 517, 421, 475 against 573 OK. No accents, avoiding the clip |
| Hero bottom `:72-83` | keep | `A EXIBIÇÃO É AO VIVO`, `NA SALA DO DISCORD`. Under the old 336 |
| Arch images `:43-53`, 3 files | swap, thin source | Crops of the widest stills (`lord-of-war`, `django-unchained`, `the-hateful-eight`, `limitless`, `v-for-vendetta`), upscaled. Owner's call whether to use faces |
| Titles `:99-116`, `xlTitles` `:149-162` | derive | 4 and 3 titles from the catalogue. Widest real title is 375 vs. old 222, so choose short ones |
| Statement, 4 x 3 cells `:117-138` | keep | `Uma sessão por sábado, / escolhida por / quem assistiu,` · `com o motivo / da escolha / registrado.` · `A exibição acontece / ao vivo, / na sala do Discord.` · `O site não hospeda / nem distribui / nenhum filme.` |
| Formats `:139-147` | keep | `CURADORIA`, `CINEMA` + `AO VIVO` |
| `xlWord` `:148` | keep | `FHDOG`, same 5 letters as SIENA |
| Colophon `:163-168`, invented ISBN and "hardcover" | keep | `FILMES HD ONLINE GRÁTIS`, `NO AR DESDE 29 NOV 2024`, `SÁBADOS, 20:30`, `CUSTO: NENHUM` |
| Grid 36 images `:172-212` | **no fact: 21 images only** | Repeat posters to reach 36 without adjacent duplicates; do not reduce the count |
| Team `:221-245` `WHO WE ARE`, 2 people | **no fact: one name, no portrait, no bio** | Title `QUEM FAZ`. Card 1: role `Curadoria`, name `Olwtelet`, bio: how a film gets in, from `sobre.astro:75-79`, image a rendered SMPTE test card (`TestCard.astro`), not a face. Card 2: role `Comunidade`, name `Sala 24`, bio: server open since 29 Nov 2024, screening live. Keeps `grid 1fr 1fr`. No invented people. Use the owner's photo only if he supplies one |
| Services `:247-265` | keep | Title `O QUE FAZEMOS`. Labels `01`, `02`. `CURADORIA / SEMANAL`, `SESSÃO / AO VIVO`. Fit 328, 220 in 677. `SESSÃO` needs line-height check |
| Collaborators `:267-286`, `COLLABORATEUR`, A24 x3 | **no fact: no partners, no investors** | Title `ONDE ESTAMOS`. 3 real channels in the 3 cells: Discord, YouTube, Steam, eyebrow `CANAL`, white glyph in the ticket, cell wrapped in a link. 147, 156, 114 vs 60. A logo of a company with no relationship must not appear |
| CTA `:288-297` | keep | `Sessões` (354 / 202; `Nossas Sessões` 682 does not fit at 390), `EXPLORAR`, new `cta-frame` from a wide still |

### 5.5 Home

| Slot | Action | New content |
|---|---|---|
| Award block `RollAward.astro` | derive | `award-year` → session year; `award_headline` → `SÁB 31 OUT · 20:30`, computed; laurel `award-img` → **no fact: no awards** → the 7-bar mark, or `imageBindEmpty` as `by-any-means` uses today |
| Reviews `RollReviews.astro`, `home.ts:18` | **no fact: no critics** | Keep 3 repeats of `<figure>` + `<p>` + `<h3>` so `sg()` still builds the parallax. Image: 7-bar SVG, replacing `stars.svg` in its 108x18 box. Short real fields only, since `h3` is capped at `max-width:15ch` and a headline can reach 88 characters: `Gênero` + first genre, `Duração` + `107 min`, `Sessão` + `30 jun · 20:30`. Not measured in place |
| Callout | derive | Direção, Ano, Gênero |
| Preloader | swap | New 3 assets. Constraints: bundle needs a `<video>`; ENTER at 3.5 s (`app.js:478`); theme sets `grayscale(1)` and a multiply layer (`tema-sinal.css:335-354`), so **light stripes become SMPTE bars and black stays black**; logo must sit inside the white window, 40vw x 22vw centred on desktop, 58vw x 30vw at 56% 50% under 992 px; last frame must be pure black. Keep the sequence (light, stripes, logo on black), change only the mark. `local-preloader.js` needs no change |
| Tutorial video | swap | Record from the finished site, after all else. `.webm` works through the same `src`. 5 steps x 4.8 s = 24 s, current file 22.83 s |

### 5.6 /work and case pages

Film field mapping belongs to the data report; only brand slots here.

| Slot | Action | New content |
|---|---|---|
| Work callout `Location` | derive | Label `Sala`, value `Sala 24`, real and in every film |
| `CaseReviews` `REVIEWS` | **no fact: no reviews** | `A CURADORIA`. Slides from the owner's editorial body: `source` = section heading, `quote` = first sentence. 20 of 21 films have exactly `A Premissa`, `Por que esta indicação?`, `O que esperar`, `Sem Spoilers`, `Conclusão`; `the-running-man-2026` has 4; the double feature has its own |
| `FootageItem` overlay | keep or drop | See 2.7 |
| `DIRECTOR'S CUT` badge | keep | `FICHA DA SESSÃO` |
| `CasePrizes` marquee | **no fact: no prizes** | Either hide via `visibleIf(false)` or repurpose: `category` = `GÊNERO`, `festival` = genre, `logo` = bar mark, never null or Webflow's placeholder appears |
| `CaseInvestors` | **no fact: no investors, no broadcast** | `Onde e quando`: `Sala 24`, Discord link, date and time from data. Real, and the page's most useful line |
| `CaseCredits` | **no fact: only the director is known** | Key row: Direção, Ano. `PRODUCERS` row → `Ficha`: Duração, Classificação, Gêneros. `Main Crew` / `CAST` → hide or `Sessão`, `Sala`, `Curadoria Olwtelet`. Director portrait → film still. No role may be invented |
| `CaseTrailer` | keep | iframe on click only, never `<video src>` with a YouTube URL (`CaseTrailer.astro:73`). `SOUND`, scrub and time controls do not drive an iframe without the YouTube JS API. Trailer IDs have no source in the repo |

### 5.7 /contact

| Row | Action | New content |
|---|---|---|
| Eyebrow, headline | keep | `CONTATO`; `FALE`, `COM A`, `GENTE`. 342, 453, 478 / 176, 235, 248. Fits, and no diacritic to clip. `A PRÓXIMA` (402 at 390) overflows |
| Row 1, Inquiries | keep | Eyebrow `FILMESHDONLINEGRATISBR@GMAIL.COM` (286 / 357, inside 390 with 16 px margins), value `ENVIAR E-MAIL` (283 / 154), mailto |
| Row 2, Phone | **no fact: no phone** | Eyebrow `DISCORD`, value `ENTRAR NO SERVIDOR` (425 / 231), general invite |
| Row 3, Address | **no fact: no address** | Hidden at every width tested. Eyebrow `ONDE`, value `SALA 24, NO DISCORD`; or drop from the source |

### 5.8 Legal pages

`/cookies`, `/terms`, `/privacy` keep their template and 3 links. All text is rewritten; none of it is reusable. FHDOG has no legal pages, so there is no source: **the owner must approve this text; it is not legal advice.** Only statements of how the site really behaves:

- **/termos:** what the site is; not streaming; no film hosted or distributed; screening happens elsewhere, live; titles, posters and trailers belong to their holders; editorial text and code belong to the author (FHDOG repo `README.md:275`); external links; changes; e-mail. No jurisdiction, registered office, phone, service agreements or licensing: there is nothing real to put there.
- **/privacidade:** no account, form or analytics; hosting logs; YouTube only after clicking a trailer; links leave the site; e-mail for requests.
- **/cookies:** the table in section 6. The current page holds generic terms, not a cookie policy (`docs/INVENTORY.md:343`).

---

## 6. Cookies and third parties

Measured today on 10 routes (headless Edge, 1440x900, fresh context each):

| Observation | Result |
|---|---|
| Third-party requests | 0 on `/`, `/work`, `/about`, `/contact`, `/cookies`, `/terms`, `/privacy`, `/films/savoy`, `/404` |
| `/films/by-any-means` | `youtu.be` and `youtube.com/watch` on load, no click. Cookies on `.youtube.com`: `__Secure-YNID`, `YSC`, `VISITOR_INFO1_LIVE`, `VISITOR_PRIVACY_METADATA`, `__Secure-ROLLOUT_TOKEN`. `ERR_BLOCKED_BY_ORB`, no playback. Disappears with the Siena data, as long as the mistake is not repeated |
| First-party cookies | `preloader_shown=<epoch ms>`, 1 h, `Path=/`, set on ENTER. `tutorial_shown=true`, 48 h, `Path=/`. `httpOnly=false`, `SameSite=Lax` by default, no `Secure`. Home only (`app.js:478`) |
| `localStorage`, `sessionStorage` | Empty on all 10 routes |
| Connection hint | `preconnect` to `cdn.prod.website-files.com` on 16 of 17 pages (`BaseLayout.astro:73`). Delete |
| `/about?edit` | `webflow.schunk.js` opens `https://webflow.com/site/third-party-cookie-check.html` (observed, aborted by my route). In code, it then calls `editor-api.webflow.com`. Any visitor can trigger it; `localStorage.WebflowEditor` too |
| Live FHDOG home | Server `Vercel`, no `Set-Cookie` on HEAD |
| Analytics | None in the replica; no `gtag`, Plausible, Umami or Vercel analytics in FHDOG repo |

`youtube-nocookie.com` iframe, inserted into a local page, then played:

| Stage | Cookies | Hosts contacted | Storage on the embed origin |
|---|---|---|---|
| Before insert | 0 | none | |
| Loaded, not played | 0 | `www.youtube-nocookie.com`, `i.ytimg.com`, `yt3.ggpht.com`, `www.google.com`, `www.gstatic.com`, `fonts.gstatic.com`, `jnn-pa.googleapis.com` | `localStorage`: `yt-icons-last-purged`, `ytidb::LAST_RESULT_ENTRY_KEY`; IndexedDB: `YtIdbMeta` |
| After click, playing | 0 | Same plus `*.googlevideo.com` | Adds `yt-player-caption-persistence` |

What this means for the new site:

| Item | Type | When | Disclose |
|---|---|---|---|
| `preloader_shown`, `tutorial_shown` | Own, functional, no identifier | Home, after ENTER | Yes |
| YouTube nocookie | Third party, IP to Google hosts, storage on its own origin, **0 cookies in this run** | Only after clicking trailer, if the iframe is created on click | Yes. "No cookies" must not be promised: it was one fresh, signed-out run |
| Vercel | Host logs | Every request | Yes |
| Discord, YouTube, Steam, GitHub | Plain links | On click | Say links leave the site |
| Analytics, ads, fonts CDN, newsletter | None | Never | State it |

Features on the live site that a static replacement would lose, with their traces: Supabase (`sb-*-auth-token`, `sessionStorage` audience, mural `localStorage`), Spotify radio iframe (`localStorage`), Discord avatars.

CSP starting point, from FHDOG repo `vercel.json`, **not tested**: `default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; media-src 'self'; connect-src 'self'; frame-src https://www.youtube-nocookie.com; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'`. That blocks the `?edit` path too.

---

## 7. Tools that depend on slugs, routes or the reference

| Tool | Dependency | Effect after the swap | Action |
|---|---|---|---|
| `tools/check-site.mjs:17,58` | Page list from `reference/original/*.html`, including old `films_*` | 9 old routes 404 | Build the list from data |
| `check-site.mjs:61-66` | Every external URL must exist on the original page | Every Discord link fails | Replace with an allowlist |
| `check-site.mjs:81` | Sitemap must equal `reference/original/sitemap.xml`, type `application/rss+xml` | Fails | Rewrite. Host quirk in `hosting.mjs:35` too |
| `check-site.mjs:83,86` | `/work/?a=1`, `/WORK`, `/404` | Fails if routes rename | Parameterise |
| `tools/dom-diff.mjs:30,32,35,158`, `package.json:13` | Everything against `reference/localized`, text included | Fails on all 17 pages by design | New frozen baseline or structure-only mode ignoring text and URLs |
| `scenarios/50-films.mjs:5-15,116-120,124,190,195-199` | 9 slugs; player and next-film tests; asserts next URL is `/films/moon-in-the-12th-house` | Fails | Read from data |
| `scenarios/60-interactions-desktop.mjs:12,208-209,273,296,323,514,540,606,683` | `savoy`, `moon-in-the-12th-house`; "only these have REVIEWS" | Fails | All films have slides now |
| `scenarios/61-interactions-touch.mjs:5,11,14,240,300,375,507` | Same slugs; reads `sound` label `:59` | Fails | Same |
| `scenarios/62-motion.mjs:231,261` | `savoy`, `moon-…`, `kafkas-last-trial` | Fails | Same |
| `scenarios/40-pages.mjs:379,390-395`; `20-nav.mjs:80,105,135,168`; `30-work.mjs:21`; `00-smoke.mjs` | Routes | Fail only if routes rename | Route map |
| `tools/check-keyboard.mjs:13,18` | `--a` default `www.siena.film`; `/films/savoy`, `/films/thehousewife` | Fails | Same |
| `tools/theme-snapshot.mjs:23`, `theme-textwrap.mjs:8` | All 9 slugs in lists | Fails | Same. Also add an accent check |
| `tools/compare.mjs:3,15` | Default A is `www.siena.film` | A vs. B no longer meaningful | Retire, or freeze a pre-content baseline for animations |
| `tools/lib/hosting.mjs:32-35,211` | Webflow behaviours; `/films/` trim | Local only, but no longer describes the target host | Align with the real host |
| `tools/assets-report.mjs:21,30`, `tools/lib/hosting.mjs:28` via `assets-manifest.json` | Manifest of Siena origins | New assets get `no-cache` | Prune |

Do not re-run after the swap, they overwrite real work: `tools/import-films.mjs`, `import-home.mjs`, `import-work.mjs`, `import-about.mjs`, `import-legal.mjs`, `import-case-studies.mjs` (each `src/data` file says so at line 1-2), `tools/sync-assets.mjs` (`:26-29,165` restores Siena's bundles), and `npm run assets:sync` (`package.json:10`). Worth removing or guarding.

Not public, and left as is: `reference/`, `backups/`, `ASSETS.md`, `assets-manifest.json`, `docs/`, `README.md`. They name Siena but are not served. If the deploy uploads the whole folder, confirm `.vercelignore`; `.gitignore` covers only `reference/captures/` and `backups/`, so `reference/original` would go to a public repo.

---

## 8. Decisions for the owner

1. Route names: English as today, or `/programacao`, `/sobre`, `/contato`, `/sessoes/<slug>`, `/termos`, `/privacidade`. The bundle does not care. If the site replaces `filmeshdonlinegratis.vercel.app`, live URLs `/sessoes/<slug>/`, `/programacao/`, `/sobre/`, `/rss.xml` answer 200 today and need to keep working or redirect, and `vercel.json` has `trailingSlash: true` where the replica has `never`.
2. Publishing Siena's own code: this keeps `app.js`, `webflow.css`, `main.css`, the audio, and the design itself on a public site. I found no licence for them. Not something a text swap resolves.
3. Team card: test card or a real photo of the owner.
4. Newsletter: RSS link as proposed, or a real provider (then the privacy page changes).
5. `"SCROLL"`: edit one literal in the bundle, or CSS.
6. Legal text approval.
7. Preloader and tutorial format: VP9 `.webm` from local tools, or install an H.264 encoder.

## 9. Not verified

- Audio not listened to. Trailer files and most of the 300 film stills not viewed one by one; they are deleted regardless.
- Removing `data-wf-*` and the Webflow forms module was reasoned from code, not run.
- `.webm` playback on Safari and iOS was not tested. The preloader layout was not tested with a real replacement video.
- Accent fix itself: only the defect was measured.
- `LET'S TALK` and `EMAIL US` fits, `FOOTAGE`/`POSTER`, tutorial texts, home review `h3` lengths: not measured in place. Legal row wrap at intermediate widths not checked.
- The CSP above and the Discord, YouTube and Steam glyphs do not exist yet.
- YouTube behaviour was one fresh, signed-out headless Edge run on localhost; a signed-in browser or another region may differ. Whether a cookie banner is legally required is a question for the owner, not answered here.

---

## Appendix: every binary in `public/`, by name

**public/assets/audio/** (4 files, 93 KB)

`cta_in.mp3` 21 KB · `cta_out.mp3` 21 KB · `menu_IN.mp3` 26 KB · `menu_OUT.mp3` 26 KB

**public/assets/fonts/** (3 files, 188 KB)

`NB-International-Regular.ttf` 97 KB · `NeueBrucke-Regular.ttf` 31 KB · `P22-Parrish-Roman.ttf` 59 KB

**public/assets/fonts/tema/** (2 files, 127 KB)

`archivo-latin-wdth-normal.woff2` 88 KB · `jetbrains-mono-latin-wght-normal.woff2` 39 KB

**public/assets/img/cms/** (42 files, 2.0 MB)

`1_About-us_Image.webp` 14 KB · `2_About-us_Image.webp` 25 KB · `3_About-us_Image.webp` 71 KB · `4_About-us_Image.webp` 80 KB · `5_About-us_Image.webp` 21 KB · `6_About-us_Image.webp` 38 KB · `8_About-us_Image.webp` 52 KB · `9_About-us_Image.webp` 125 KB · `10_About-us_Image.webp` 95 KB · `11_About-us_Image.webp` 81 KB · `12_About-us_Image.webp` 43 KB · `13_About-us_Image.webp` 20 KB · `14_About-us_Image.webp` 115 KB · `15_About-us_Image.webp` 18 KB · `16_About-us_Image.webp` 97 KB · `17_About-us_Image.webp` 104 KB · `18_About-us_Image.webp` 23 KB · `19_About-us_Image.webp` 93 KB · `20_About-us_Image.webp` 56 KB · `21_About-us_Image.webp` 29 KB · `22_About-us_Image.webp` 38 KB · `23_About-us_Image.webp` 37 KB · `24_About-us_Image.webp` 39 KB · `25_About-us_Image.webp` 43 KB · `26_About-us_Image.webp` 25 KB · `27_About-us_Image.webp` 51 KB · `28_About-us_Image.webp` 68 KB · `29_About-us_Image.webp` 30 KB · `30_About-us_Image.webp` 27 KB · `31_About-us_Image.webp` 52 KB · `32_About-us_Image.webp` 30 KB · `33_About-us_Image.webp` 37 KB · `34_About-us_Image.webp` 29 KB · `35_About-us_Image.webp` 43 KB · `36_About-us_Image.webp` 19 KB · `37_About-us_Image.webp` 50 KB · `Dorit_Profile-Image_Siena-p-500.webp` 36 KB · `Dorit_Profile-Image_Siena-p-800.webp` 67 KB · `Dorit_Profile-Image_Siena.webp` 82 KB · `Leelu_Profile-Image_Siena-p-500.webp` 16 KB · `Leelu_Profile-Image_Siena-p-800.webp` 28 KB · `Leelu_Profile-Image_Siena.webp` 36 KB

**public/assets/img/films/_shared/** (5 files, 52 KB)

`HAIFA.png` 15 KB · `JFF.webp` 12 KB · `JIFF.png` 9 KB · `stars.svg` 1 KB · `Warsaw-Film-Festival.png` 15 KB

**public/assets/img/films/ana-maxim/** (24 files, 1.8 MB)

`ana-maxim-01.webp` 17 KB · `ana-maxim-02.webp` 18 KB · `ana-maxim-03.webp` 17 KB · `ana-maxim-04.webp` 30 KB · `ana-maxim-05.webp` 29 KB · `ana-maxim-06.webp` 16 KB · `ana-maxim-07.webp` 26 KB · `ana-maxim-09.webp` 44 KB · `ana-maxim-10.webp` 33 KB · `ana-maxim-11.webp` 50 KB · `ana-maxim-12.webp` 27 KB · `ana-maxim-13.webp` 46 KB · `ana-maxim-14.webp` 13 KB · `ana-maxim-p-500.webp` 18 KB · `ana-maxim-p-800.webp` 34 KB · `ana-maxim-p-1080.webp` 48 KB · `ana-maxim.webp` 59 KB · `ana-p-500.jpg` 19 KB · `ana-p-800.jpg` 40 KB · `ana-p-1080.jpg` 64 KB · `ana-p-1600.jpg` 118 KB · `ana.jpg` 1.1 MB · `Cinema-South-Festival.png` 16 KB · `Cinema-South-Festival.webp` 6 KB

**public/assets/img/films/by-any-means/** (50 files, 4.4 MB)

`6a57521a-BYANYMEANS_2024-04-28_EJA-02511_R1-p-500.webp` 10 KB · `6a57521a-BYANYMEANS_2024-04-28_EJA-02511_R1-p-800.webp` 20 KB · `6a57521a-BYANYMEANS_2024-04-28_EJA-02511_R1-p-1080.webp` 30 KB · `6a57521a-BYANYMEANS_2024-04-28_EJA-02511_R1-p-1600.webp` 60 KB · `6a57521a-BYANYMEANS_2024-04-28_EJA-02511_R1-p-2000.webp` 100 KB · `6a57521a-BYANYMEANS_2024-04-28_EJA-02511_R1.webp` 399 KB · `6a673820-BYANYMEANS_2024-04-28_EJA-02511_R1-p-500.webp` 10 KB · `6a673820-BYANYMEANS_2024-04-28_EJA-02511_R1-p-800.webp` 19 KB · `6a673820-BYANYMEANS_2024-04-28_EJA-02511_R1-p-1080.webp` 29 KB · `6a673820-BYANYMEANS_2024-04-28_EJA-02511_R1-p-1600.webp` 53 KB · `6a673820-BYANYMEANS_2024-04-28_EJA-02511_R1-p-2000.webp` 77 KB · `6a673820-BYANYMEANS_2024-04-28_EJA-02511_R1.webp` 93 KB · `BAM_04-15_MCFADDEN_00273_R1-p-500.webp` 11 KB · `BAM_04-15_MCFADDEN_00273_R1-p-800.webp` 19 KB · `BAM_04-15_MCFADDEN_00273_R1-p-1080.webp` 28 KB · `BAM_04-15_MCFADDEN_00273_R1-p-1600.webp` 49 KB · `BAM_04-15_MCFADDEN_00273_R1-p-2000.webp` 67 KB · `BAM_04-15_MCFADDEN_00273_R1-p-2600.webp` 95 KB · `BAM_04-15_MCFADDEN_00273_R1.webp` 98 KB · `BAM_04-16_MCFADDEN_00875_R21-p-500.webp` 19 KB · `BAM_04-16_MCFADDEN_00875_R21-p-800.webp` 34 KB · `BAM_04-16_MCFADDEN_00875_R21-p-1080.webp` 50 KB · `BAM_04-16_MCFADDEN_00875_R21-p-1600.webp` 83 KB · `BAM_04-16_MCFADDEN_00875_R21-p-2000.webp` 112 KB · `BAM_04-16_MCFADDEN_00875_R21-p-2600.webp` 157 KB · `BAM_04-16_MCFADDEN_00875_R21.webp` 168 KB · `BY-ANY-MEANS-052826-03-806c7f8532834b8db62c21d0b23ca16b-p-500.webp` 31 KB · `BY-ANY-MEANS-052826-03-806c7f8532834b8db62c21d0b23ca16b-p-800.webp` 57 KB · `BY-ANY-MEANS-052826-03-806c7f8532834b8db62c21d0b23ca16b-p-1080.webp` 85 KB · `BY-ANY-MEANS-052826-03-806c7f8532834b8db62c21d0b23ca16b-p-1600.webp` 129 KB · `BY-ANY-MEANS-052826-03-806c7f8532834b8db62c21d0b23ca16b.webp` 137 KB · `BYANYMEANS_2024-04-23_EJA-01110_R1-p-500.webp` 28 KB · `BYANYMEANS_2024-04-23_EJA-01110_R1-p-800.webp` 53 KB · `BYANYMEANS_2024-04-23_EJA-01110_R1-p-1080.webp` 79 KB · `BYANYMEANS_2024-04-23_EJA-01110_R1-p-1600.webp` 129 KB · `BYANYMEANS_2024-04-23_EJA-01110_R1-p-2000.webp` 172 KB · `BYANYMEANS_2024-04-23_EJA-01110_R1.webp` 227 KB · `BYANYMEANS_2024-04-23_EJA-01179_R1-p-500.webp` 35 KB · `BYANYMEANS_2024-04-23_EJA-01179_R1-p-800.webp` 71 KB · `BYANYMEANS_2024-04-23_EJA-01179_R1-p-1080.webp` 108 KB · `BYANYMEANS_2024-04-23_EJA-01179_R1-p-1600.webp` 186 KB · `BYANYMEANS_2024-04-23_EJA-01179_R1.webp` 230 KB · `BYANYMEANS_2024-04-28_EJA-02511_R1-p-2600.webp` 218 KB · `BYANYMEANS_2024-04-28_EJA-02511_R1-p-3200.webp` 243 KB · `BYANYMEANS_2024-04-28_EJA-02511_R2-p-500.webp` 20 KB · `BYANYMEANS_2024-04-28_EJA-02511_R2-p-800.webp` 40 KB · `BYANYMEANS_2024-04-28_EJA-02511_R2-p-1080.webp` 66 KB · `BYANYMEANS_2024-04-28_EJA-02511_R2-p-1600.webp` 103 KB · `BYANYMEANS_2024-04-28_EJA-02511_R2.webp` 104 KB · `cannes.png` 78 KB

**public/assets/img/films/kafkas-last-trial/** (31 files, 1.1 MB)

`attachment-1.webp` 15 KB · `kafka-p-500.jpg` 10 KB · `kafka-p-500.webp` 11 KB · `kafka-p-800.jpg` 23 KB · `kafka-p-800.webp` 21 KB · `kafka-p-1080.jpg` 39 KB · `kafka-p-1080.webp` 31 KB · `kafka-p-1600.jpg` 78 KB · `kafka.jpg` 659 KB · `kafka.webp` 39 KB · `המשפט_האחרון_של_קפקא-_און_ליין-0-01-41-04.webp` 6 KB · `המשפט_האחרון_של_קפקא-_און_ליין-0-01-56-17.webp` 9 KB · `המשפט_האחרון_של_קפקא-_און_ליין-0-02-04-12.webp` 12 KB · `המשפט_האחרון_של_קפקא-_און_ליין-0-03-14-13.webp` 18 KB · `המשפט_האחרון_של_קפקא-_און_ליין-0-04-40-03.webp` 21 KB · `המשפט_האחרון_של_קפקא-_און_ליין-0-05-11-06.webp` 9 KB · `המשפט_האחרון_של_קפקא-_און_ליין-0-05-50-04.webp` 12 KB · `המשפט_האחרון_של_קפקא-_און_ליין-0-07-31-08.webp` 12 KB · `המשפט_האחרון_של_קפקא-_און_ליין-0-11-17-00.webp` 5 KB · `המשפט_האחרון_של_קפקא-_און_ליין-0-11-55-22.webp` 11 KB · `המשפט_האחרון_של_קפקא-_און_ליין-0-18-17-05.webp` 17 KB · `המשפט_האחרון_של_קפקא-_און_ליין-0-20-29-12.webp` 14 KB · `המשפט_האחרון_של_קפקא-_און_ליין-0-25-01-21.webp` 14 KB · `המשפט_האחרון_של_קפקא-_און_ליין-0-29-49-19.webp` 12 KB · `המשפט_האחרון_של_קפקא-_און_ליין-0-31-46-12.webp` 12 KB · `המשפט_האחרון_של_קפקא-_און_ליין-0-34-53-07.webp` 12 KB · `המשפט_האחרון_של_קפקא-_און_ליין-0-47-51-11.webp` 12 KB · `המשפט_האחרון_של_קפקא-_און_ליין-0-54-43-21.webp` 18 KB · `המשפט_האחרון_של_קפקא-_און_ליין-0-59-08-11.webp` 5 KB · `המשפט_האחרון_של_קפקא-_און_ליין-1-06-00-21.webp` 11 KB · `המשפט_האחרון_של_קפקא-_און_ליין-1-10-09-22.webp` 8 KB

**public/assets/img/films/moon-in-the-12th-house/** (38 files, 1.7 MB)

`moon-12-house-p-500.webp` 9 KB · `moon-12-house-p-800.webp` 18 KB · `moon-12-house-p-1080.webp` 26 KB · `moon-12-house.webp` 32 KB · `moon-p-500.jpg` 16 KB · `moon-p-800.jpg` 34 KB · `moon-p-1080.jpg` 55 KB · `moon-p-1600.jpg` 104 KB · `moon.jpg` 1.0 MB · `Moon12-Prores422hq-Lt-Rt-02.06.16-0-01-02-01.webp` 17 KB · `Moon12-Prores422hq-Lt-Rt-02.06.16-0-01-40-19.webp` 6 KB · `Moon12-Prores422hq-Lt-Rt-02.06.16-0-03-52-15.webp` 23 KB · `Moon12-Prores422hq-Lt-Rt-02.06.16-0-04-23-15.webp` 15 KB · `Moon12-Prores422hq-Lt-Rt-02.06.16-0-05-02-10.webp` 8 KB · `Moon12-Prores422hq-Lt-Rt-02.06.16-0-05-56-16.webp` 10 KB · `Moon12-Prores422hq-Lt-Rt-02.06.16-0-14-36-05.webp` 15 KB · `Moon12-Prores422hq-Lt-Rt-02.06.16-0-16-01-12-p-500.webp` 13 KB · `Moon12-Prores422hq-Lt-Rt-02.06.16-0-16-01-12.webp` 33 KB · `Moon12-Prores422hq-Lt-Rt-02.06.16-0-17-03-13.webp` 25 KB · `Moon12-Prores422hq-Lt-Rt-02.06.16-0-17-26-19.webp` 14 KB · `Moon12-Prores422hq-Lt-Rt-02.06.16-0-21-42-16.webp` 14 KB · `Moon12-Prores422hq-Lt-Rt-02.06.16-0-22-21-11.webp` 11 KB · `Moon12-Prores422hq-Lt-Rt-02.06.16-0-26-14-02.webp` 5 KB · `Moon12-Prores422hq-Lt-Rt-02.06.16-0-28-33-15.webp` 12 KB · `Moon12-Prores422hq-Lt-Rt-02.06.16-0-30-29-23.webp` 13 KB · `Moon12-Prores422hq-Lt-Rt-02.06.16-0-38-38-11.webp` 8 KB · `Moon12-Prores422hq-Lt-Rt-02.06.16-0-39-48-06.webp` 10 KB · `Moon12-Prores422hq-Lt-Rt-02.06.16-0-42-46-14.webp` 10 KB · `Moon12-Prores422hq-Lt-Rt-02.06.16-0-56-51-19.webp` 11 KB · `Moon12-Prores422hq-Lt-Rt-02.06.16-0-58-40-08.webp` 32 KB · `Moon12-Prores422hq-Lt-Rt-02.06.16-1-01-15-10.webp` 15 KB · `Moon12-Prores422hq-Lt-Rt-02.06.16-1-01-23-04.webp` 25 KB · `Moon12-Prores422hq-Lt-Rt-02.06.16-1-06-48-20.webp` 8 KB · `Moon12-Prores422hq-Lt-Rt-02.06.16-1-07-04-08.webp` 18 KB · `Moon12-Prores422hq-Lt-Rt-02.06.16-1-10-25-23.webp` 15 KB · `Seatle-Film-Festival.png` 12 KB · `SERET.png` 34 KB · `The-Chicago-International-Film-Festival.png` 13 KB

**public/assets/img/films/my-project-x/** (24 files, 1.5 MB)

`DOCAVIV.webp` 4 KB · `my_project_x_01.webp` 14 KB · `my_project_x_02.webp` 16 KB · `my_project_x_03.webp` 19 KB · `my_project_x_04.webp` 18 KB · `my_project_x_05.webp` 20 KB · `my_project_x_06.webp` 22 KB · `my_project_x_07.webp` 24 KB · `my_project_x_08.webp` 20 KB · `my_project_x_09.webp` 13 KB · `my_project_x_10.webp` 18 KB · `my_project_x_11.webp` 22 KB · `my_project_x_12.webp` 31 KB · `my_project_x_13.webp` 14 KB · `my_project_x_14.webp` 16 KB · `project_x-p-500.webp` 13 KB · `project_x-p-800.webp` 24 KB · `project_x-p-1080.webp` 34 KB · `project_x.webp` 42 KB · `project-p-500.jpg` 15 KB · `project-p-800.jpg` 31 KB · `project-p-1080.jpg` 50 KB · `project-p-1600.jpg` 96 KB · `project.jpg` 987 KB

**public/assets/img/films/outsider-freud/** (35 files, 1.9 MB)

`freud_01.webp` 20 KB · `freud_02.webp` 19 KB · `freud_03.webp` 17 KB · `freud_04.webp` 19 KB · `freud_05.webp` 17 KB · `freud_06.webp` 19 KB · `freud_07.webp` 18 KB · `freud_08.webp` 34 KB · `freud_09.webp` 10 KB · `freud_10.webp` 15 KB · `freud_11.webp` 22 KB · `freud_12.webp` 22 KB · `freud_13.webp` 37 KB · `freud_14.webp` 15 KB · `freud_15.webp` 18 KB · `freud_16.webp` 17 KB · `freud_17.webp` 23 KB · `freud_18.webp` 38 KB · `freud_19.webp` 53 KB · `freud_20.webp` 10 KB · `freud-p-500.jpg` 14 KB · `freud-p-800.jpg` 30 KB · `freud-p-1080.jpg` 53 KB · `freud-p-1600.jpg` 106 KB · `freud-the-outsider-p-500.webp` 12 KB · `freud-the-outsider-p-800.webp` 25 KB · `freud-the-outsider-p-1080.webp` 38 KB · `freud-the-outsider.webp` 95 KB · `freud.jpg` 910 KB · `JFF.png` 13 KB · `Kiez-Berlin-Film-Festival.png` 20 KB · `Mannheim.png` 14 KB · `White-Jaipur-Film-Festival-Laurel-Logo-p-500.webp` 28 KB · `White-Jaipur-Film-Festival-Laurel-Logo-p-800.webp` 55 KB · `White-Jaipur-Film-Festival-Laurel-Logo.webp` 70 KB

**public/assets/img/films/savoy/** (39 files, 1.0 MB)

`675eb91e-savoy-p-500.webp` 8 KB · `675eb91e-savoy-p-800.webp` 25 KB · `675eb91e-savoy-p-1080.webp` 54 KB · `675eb91e-savoy.webp` 210 KB · `678fa9d3-savoy-p-500.webp` 27 KB · `678fa9d3-savoy-p-800.webp` 60 KB · `678fa9d3-savoy-p-1080.webp` 87 KB · `678fa9d3-savoy.webp` 108 KB · `Atlanta-Jewish-Film-Festival.png` 18 KB · `Boca-International-Jewish-Film-Festival.png` 26 KB · `FIPADOC.png` 11 KB · `Krakow-Film-Festival.png` 35 KB · `Ophir-Awards.png` 17 KB · `Santa-Barbara-International-Film-Festival.png` 23 KB · `Savoy-0-01-02-06.webp` 14 KB · `Savoy-0-02-12-07.webp` 5 KB · `Savoy-0-02-20-02.webp` 7 KB · `Savoy-0-02-35-15.webp` 8 KB · `Savoy-0-02-51-05.webp` 10 KB · `Savoy-0-03-53-11.webp` 10 KB · `Savoy-0-05-03-12.webp` 9 KB · `Savoy-0-06-29-02.webp` 4 KB · `Savoy-0-11-01-11.webp` 7 KB · `Savoy-0-12-11-12.webp` 6 KB · `Savoy-0-14-39-08.webp` 13 KB · `Savoy-0-14-47-03.webp` 11 KB · `Savoy-0-17-22-18.webp` 6 KB · `Savoy-0-20-37-07.webp` 6 KB · `Savoy-0-24-07-10.webp` 12 KB · `Savoy-0-25-09-16.webp` 9 KB · `Savoy-0-26-58-14.webp` 27 KB · `Savoy-0-30-59-20.webp` 6 KB · `Savoy-0-32-25-10.webp` 5 KB · `Savoy-0-32-56-13.webp` 14 KB · `Savoy-0-36-18-21.webp` 7 KB · `Savoy-0-42-24-15.webp` 8 KB · `savoy-p-1600.webp` 121 KB · `Seattle-Jewish-Film-Festival.png` 20 KB · `UK-Jewish-Film-Festival.png` 8 KB

**public/assets/img/films/taboo/** (34 files, 926 KB)

`675eb903-taboo-p-500.webp` 14 KB · `675eb903-taboo-p-800.webp` 27 KB · `675eb903-taboo-p-1080.webp` 42 KB · `675eb903-taboo.webp` 282 KB · `678fa9e1-taboo-p-500.webp` 22 KB · `678fa9e1-taboo-p-800.webp` 41 KB · `678fa9e1-taboo-p-1080.webp` 57 KB · `678fa9e1-taboo.webp` 74 KB · `International-Film-Festival-Rotterdam.webp` 7 KB · `Taboo-0-01-41-04.webp` 8 KB · `Taboo-0-02-59-00.webp` 12 KB · `Taboo-0-05-34-15.webp` 14 KB · `Taboo-0-05-50-04.webp` 4 KB · `Taboo-0-07-46-22.webp` 15 KB · `Taboo-0-08-25-19.webp` 10 KB · `Taboo-0-09-43-15.webp` 10 KB · `Taboo-0-11-01-11.webp` 18 KB · `Taboo-0-12-34-20.webp` 11 KB · `Taboo-0-12-58-04.webp` 5 KB · `Taboo-0-17-07-04.webp` 12 KB · `Taboo-0-18-17-05.webp` 15 KB · `Taboo-0-19-35-01.webp` 7 KB · `Taboo-0-22-26-06.webp` 16 KB · `Taboo-0-24-38-13.webp` 15 KB · `Taboo-0-25-56-08.webp` 9 KB · `Taboo-0-28-08-15.webp` 8 KB · `Taboo-0-39-41-05.webp` 10 KB · `Taboo-0-43-58-00.webp` 19 KB · `Taboo-0-50-27-02.webp` 20 KB · `Taboo-0-51-44-22.webp` 12 KB · `Taboo-0-52-23-19.webp` 10 KB · `Taboo-1-00-18-12.webp` 11 KB · `taboo-p-1600.webp` 76 KB · `Thessaloniki-Film-Festival.png` 15 KB

**public/assets/img/films/thehousewife/** (3 files, 39 KB)

`332-3329912_tiff-toronto-international-film-festival-logo+2.webp` 11 KB · `housewife2.jpg` 20 KB · `images.jpg` 8 KB

**public/assets/img/site/** (14 files, 573 KB)

`678a5249-favicon.png` 1 KB · `678a5267-favicon.png` 0 KB · `a24logo.png` 5 KB · `about_left.webp` 98 KB · `about_mobile-p-500.webp` 52 KB · `about_mobile-p-800.webp` 95 KB · `about_mobile.webp` 114 KB · `about_right.webp` 91 KB · `all-masks.webp` 12 KB · `cta-frame-p-500.avif` 11 KB · `cta-frame-p-800.avif` 26 KB · `cta-frame.avif` 37 KB · `open-graph.webp` 27 KB · `web-clip.png` 4 KB

**public/assets/img/webflow/** (4 files, 21 KB)

`background-image.svg` 11 KB · `placeholder.60f9b1840c.svg` 0 KB · `webflow-badge-icon-d2.89e12c322e.svg` 0 KB · `webflow-badge-text-d2.c82cec3b78.svg` 10 KB

**public/assets/video/** (10 files, 115.9 MB)

`Ana_Maxim.mp4` 16.7 MB · `animated_logo_black.mp4` 1.4 MB · `intro_mobile.mp4` 775 KB · `Kafka-01.mp4` 14.6 MB · `logo_intro_desktop.mp4` 4.8 MB · `Moon.mp4` 16.0 MB · `Project_X-01.mp4` 14.9 MB · `Savoy-01.mp4` 15.3 MB · `Taboo-01.mp4` 14.0 MB · `tutorial-final.mp4` 17.6 MB

Total: 362 binaries, 133.5 MB.
