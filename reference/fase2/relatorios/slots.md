# Slot budget for the Fase 2 rewrite

Read-only study of `C:/Users/Usuario/Desktop/FHDOG` (Astro replica with the Sinal theme) against the content of `C:/Users/Usuario/Desktop/Projetos/FHDOG`. Nothing in either project was changed. Every test below ran in headless Edge against the production build on port 4322, with the HTML or the text rewritten in the test browser only. Scripts, data and screenshots are in `C:/Users/Usuario/AppData/Local/Temp/claude/C--Users-Usuario-Desktop-FHDOG/81789070-6ca0-404a-8dc3-8f2a84b50875/scratchpad/f2`; paths below are relative to it.

## 1. What matters most

**1. Home titles break inside words and lose their accents.** After SplitText, each letter of `h2.roll-cont-he.home` is an inline block, so a word wider than its box wraps between letters. The box is 395 px at 89.6 px (the 33ch parent, not the `h2`'s own 643 px `max-width`), about 9 letters. "Bastardos Inglórios" renders as `BASTARDO / S / INGLÓRIOS`, "Lucrativa" as `LUCRATIV / A`. Siena's longest word never reached that width. Separately, `main.css` clips each letter (`.split-line-move>div{overflow:hidden;line-height:.8em}`) and keeps a clone under it at `top:100%`: at rest "Traição" reads `TRAICÃO` with the tilde cut, no cedilla and a stray piece of the clone's accent inside the Ã. Both are fixed by the CSS in 6.1. Line breaks were tested at 1920, 1440, 1280, 390 and 360 px wide, accents by eye at 1440 and 390. Screens: `accents/frozenBase-home-title.png` (today, at rest), `accents/candD-home-title.png` (fixed, at rest).

**2. "No star ratings" cannot be done by deleting the stars' `<figure>` from the home reviews.** The bundle builds the three review blocks by splitting the rich text on `<figure` (`sg`, `app.js` offset 53442: a chunk becomes `<div data-parallax=...>` only if it includes `<figure`, `<p` and `<h3`). Measured with the tag removed: 0 blocks instead of 3, so the per-block parallax and the `.awards-w>div` centring go, and phones show 3 quotes in the row instead of 2. Measured with an empty `<figure class="w-richtext-align-center w-richtext-figure-type-image"></figure>` per block (`fig.cjs`): 3 blocks, 2 quotes on phones, and the desktop column shrinks from 560 to 432 px, which is what the budget in 3.1 counts on. The stars in the nav panels and in the gallery captions (`RatingStars.astro`) have no bundle reference and can simply go.

**3. Clipped accents in other fixed boxes.** Same family of defect, measured with crops at 2x. Footer big words (`GRÁTIS` shows `GRATIS`, `AÇÃO` shows `ACAO`), about hero words, the 404 lines, the small-panel row (tilde only) and the Contact headline. The first four are fixed in 6.1. The Contact headline is not: its letters roll through the same window, and my two attempts left artefacts, so that slot should use words without diacritics. Not affected, checked by eye: nav ticket, main menu links, case hero, Work titles.

**4. Budgets are not Siena's lengths.** Tightest real limits:

| Limit | Why | Real data that breaks it |
|---|---|---|
| Home quote: 50 characters (3 blocks, no stars) | Column height; EXPLORE leaves the card | 10 of 21 `headline`s are longer |
| Next title at 390: 2 lines, 26 characters | Text box 188 px, overlaps NEXT from line 3 | "Pulp Fiction: Tempo de Violência" -11 px, "Manual..." -44 px; fixed in 6.2 |
| Ticket title: 3 lines, about 30 characters | `overflow:clip` on a 77 px row | "Manual Prático da Vingança Lucrativa" (line 4 cut), the double title |
| Ticket category: 14 characters | `nowrap` row of 237 px | "Comédia Sombria" +5 px, "Ficção Científica" +9, "Suspense Psicológico" +33; fixed by 6.2 |
| Work FOOTAGE bar: 3 lines | Title grows down from a fixed top, 88 px above the window edge at 900 tall | Line 4 of "Pulp Fiction..." and "Manual..." is cut; fixed in 6.2 |
| Home director: 26 characters | `nowrap` grid | "Matt Bettinelli-Olpin & Tyler Gillett" (37) |
| Footer and Contact value: 18 and 16 characters | 32 px and 48 px type | `filmeshdonlinegratisbr@gmail.com` (32) in both |
| Legal H1 at 390: 7 characters | 20vw | "PRIVACIDADE" 79 px past the screen; fixed in 6.2 |
| 404 line at 390: 17 characters | one line in a 24 px clip | "PÁGINA NÃO ENCONTRADA" 47 px past the screen |

**5. Text in the bundle and other text that the data cannot reach.** `SCROLL` (`app.js` offset 44143, the template's `EXPLORE` is never shown) and `SOUND ON` / `SOUND OFF` (offset 364804) need a one-string patch or a small observer. `1/12` is static: nothing rewrites it, despite the comment in `CaseReviews.astro:4`. `local-forms.js:9` overwrites the form error in English. Fake or foreign text that stays in the DOM while hidden: gallery captions (`VARIETY`), the Siena street address, the A24 collaborators, `Leelu Dorit`, the static quote in the footage panel, and the `This is some text...` placeholder.

**6. Facts for the other Fase 2 work, found on the way.**

- The card shown first is not the first in the DOM. `Qn` leaves `target` at -60 and the Work slider at -100 (`app.js` offsets 52636 and 346938). Measured: with 9 cards the centred card is index 6 on home and 1 on Work; with 21 cloned cards, **index 18 on home and 16 on Work**, which is `60 mod N` and `100 mod N`. The "next session first" order has to land on those indices, or those two constants have to change.
- `data-case` decides the third hero rule by length, and `data-id` must equal it. With the source file names as slugs, O Lagosta, Vivarium, Sem Limites, Obsessão and The Menu get a rule through their one-line hero title (section 4.3).
- `.menu-footage-item:first-child` alone sets the footage panel's height; `.small-panel` has no scroll and 21 rows pass the bottom of a 900 px window by 138 px, 318 px at 720 tall.

## 2. Method

- **Data lengths:** `stats.mjs`, `legalstats.mjs` read the data modules directly.
- **Geometry:** `measure.cjs`, computed style and box of about 250 selectors at 1440x900, 1920x1080, 1280x720, 390x844 (`geom.json`).
- **Fit:** `slots.cjs` and `slots2.cjs` replace text in the live page after the bundle has run and measure overflow (`slots.json`, `slots2.json`). The Portuguese strings are test strings cut from the owner's own copy, not proposed copy.
- **Titles:** `t3.cjs` and `t3b.cjs` rewrite the HTML in flight so SplitText sees the real title (`titles.jsonl`, `titlesB.jsonl`, `titlesC.jsonl`, `titlesS.jsonl` today; `titlesE.jsonl`, `titlesR.jsonl` with the candidate CSS). `extra.cjs` reads the starting card with 21 cards, `fig.cjs` the review blocks without stars, `rule.cjs` the hero rules, `flip2.cjs` and `g.cjs` the FOOTAGE bar, `f.cjs` the other rules.
- **Accents:** `accents.cjs`, `hc.cjs`, 2x crops in `accents/`. Rest-state crops freeze the roll with a test-only rule, because the title rolls every few seconds.
- **Phones:** 390 and 360 px use the desktop user agent. CSS breakpoints apply, but `B.isMobile` branches of the bundle do not run.

## 3. Slot budget table

How to read it. "Siena" is minimum / median / maximum characters of the published data, measured with zero-width characters removed and spaces collapsed (`scratchpad/f2/stats.mjs`). "UP" means uppercase is applied by CSS, so the data can stay in normal case. Sizes are computed values from the production build with the Sinal theme: desktop = 1440x900 (1920x1080 is the same unless noted, `rem` is 16 px everywhere), then 390x844. "Holds" is what the box takes today. "Budget" is the recommended limit for Portuguese copy: **ideal / hard ceiling**. Uppercase Portuguese was measured with accented strings, so these numbers already include the wider letters. Budgets marked with * depend on a CSS change from section 6.

Film data the source project can actually fill (`src/content/films/*.md`): title 7 to 36 characters, director 10 to 37, `headline` 22 / 47 / 88, `kicker` 59 / 110 / 134 (2 films have none), `summary` 64 / 126 / 151, genre 4 to 20 ("Suspense Psicológico").

### 3.1 Home roll, per card

| Slot | Source | Per film | Siena | UP | Font and box (desktop; 390) | Holds | Budget PT | Notes |
|---|---|---|---|---|---|---|---|---|
| Eyebrow | `film.category`, `HomeRollItem.astro:44` | 1 | 10 / 11 / 12 | yes | Sinal Rotulo 9.6 px, spacing .33em, 8.9 px per char; box 395; 294 | 44; 33 on one line | 20 / 30 | Same field also feeds the callout, the ticket row, Work and the hero, whose limits are tighter. "Sessão Dupla Especial · Terror" (30) fits |
| Title | `film.title`, `HomeRollItem.astro:45` | 1 | 5 / 12 / 22 | yes (`h2`) | Sinal Titulo 89.6 px, line pitch 72 px, about 43 px per char; box 395 (the parent, not the 643 px `max-width`); 390: 48 px, box 258 | 9 chars per line, then breaks **inside words** | 24 at full size, longest word 10 chars; 32 at 4.6rem*; 40 at 4rem*; 390: any | Section 5. 8vh (57.6 px at 720 tall) on screens up to 750 px tall |
| Label `Director` | `RollCallout.astro:19` | 1 | 8 | yes (`ul`) | Sinal Display 20 px, row 14 px high, `nowrap`, `1fr 1fr`; column 181; 390: 16 px, column 104 | 18; 13 | 7 / 9 ("Direção") | Keep `span.text-span` |
| Label `YEAR` | `RollCallout.astro:26` | 1 | 4 | yes | same | 18; 13 | 3 / 9 ("Ano") | |
| Label `CATEGORY` | `RollCallout.astro:32` | 1 | 8 | yes | same | 18; 13 | 6 / 9 ("Gênero") | |
| Director value | `film.director`, `RollCallout.astro:21` | 1 | 10 / 14 / 18 | yes | same; never wraps | 18 without moving the grid; 23 widens the column and stays inside; 37 leaves the list by 60 px (desktop). 390: list grows, 23 chars = 262 px, 37 = 338 px, 22 px past the column | 18 / 26 | "Quentin Tarantino" (17) fits. "Matt Bettinelli-Olpin & Tyler Gillett" (37) needs a short form, "Bettinelli-Olpin & Gillett" (26). At 360 px wide the 37-character form leaves the viewport |
| Year value | `roll.year`, `RollCallout.astro:28` | 1 | 4 | yes | same | 18 | 4 / 11 ("2019 + 2026") | Single source: use the film's real year; Siena had differing values |
| Category value | `film.category`, `RollCallout.astro:33` | 1 | 10 / 11 / 12 | yes | same | 18; 20 widens the column, stays inside | 17 / 20 | |
| Award year | `roll.award.year`, `RollAward.astro:17` | 1 | 4 | no | Sinal Display 32 px; 16 px per digit; box 107 | "18/07" 71 px, "18 JUL" 87 px, "18/07/2026" 145 px overflows, "SÁB 18/07" wraps | 5 / 6 | Desktop only |
| Award headline | `roll.award.headline`, `RollAward.astro:20` | 1 | 14 / 23.5 / 31 | yes | Sinal Display 16.8 px, line 15.9 px; box 108.8; 12 per line | 14-24 chars 2 lines, 31 = 3, 45 = 5, 60 = 6, 88 = 9. Gap to a 2-line title at 900 tall: 105, 89, 57, 41, 0 px | 24 / 31 with a laurel; 45 without | Desktop only. No real laurels exist: the image (118 px with its margin) should go, which buys about 7 lines. An empty field gets `w-dyn-bind-empty` and hides |
| Review source (3) | `roll.reviews[].p`, `RollReviews.astro:27` | 3, two copies | 4 / 16 / 23 | yes | Sinal Rotulo 9.6 px, spacing 9.6 px per char; box 186; 390: 142 | 19; 15 per line | 18 / 30 (2 lines) | Mobile shows blocks 1 and 2 only (`main.css`: `div:nth-child(3){display:none}`) |
| Review quote (3) | `roll.reviews[].h3`, `RollReviews.astro:29` | 3, two copies | 21 / 30 / 44 | yes | Sinal Display 25.6 px, line 23 px; box 186, 14 per line. 1.2rem up to 890 tall. 2vh (14.4 px, box 129) up to 750 tall. 390: 19.2 px, box 142 | With stars at 900 tall: 3 blocks of 36 chars fit, 44 pushes EXPLORE 56 px past the card. Without the star figure: 44 chars leaves 73 px, 56 chars overflows by 66 px | 30 / 50 without stars*; 30 / 36 if a star-size figure stays | Sum rule at 900 tall, no figure, 1-line sources: 15 quote lines across the 3 blocks. 10 of the 21 real `headline`s exceed 50 characters |
| Review mobile copy | same data, `HomeRollItem.astro:41` | 2 visible | as above | yes | two columns of 142 px, `max-height:30svh` with `overflow:clip` (253 px at 844 tall, 222 at 740) | 70 chars with stars = 246 px; 88 without = 224 px | follows the desktop budget | Clips silently past 30svh, last lines vanish |
| Star figure (3) | `RollReviews.astro:20-25`, `REVIEW_STARS_SRC` `home.ts:18` | 3 | n/a | n/a | 43 px high with its margin | n/a | **Remove the picture, keep the `<figure>` tag** | The bundle groups the blocks by `<figure` (`sg`, `app.js` offset 53442). See trap 2 in section 1 |
| EXPLORE (2 copies) | `HOME_EXPLORE` `home.ts:13` | 2 | 7 | no | Sinal Display Leve 12 px, spacing 1.8 px, 8.7 px per char; box 93; `data-after` repeats it | 10 | 8 / 10 ("EXPLORAR") | Typed in uppercase |
| `aria-label` | `home.ts:14` | 1 | 16 | n/a | not visible | n/a | free | |

### 3.2 Work carousel, per card

| Slot | Source | Per film | Siena | UP | Font and box (desktop; 390) | Holds | Budget PT | Notes |
|---|---|---|---|---|---|---|---|---|
| Eyebrow (2 copies) | `film.category`, `WorkRollItem.astro:38,42` | 2 | 10 / 11 / 12 | yes | Sinal Rotulo 9.6 px; box 298 | 33 | 20 / 30 | |
| Title (2 copies) | `film.title`, `WorkRollItem.astro:39,43` | 2 | 5 / 12 / 22 | yes | Sinal Titulo 48 px, line 37 px, box 258. Up to 750 tall: 5vh in a 18vw card. 390: 40 px, box 215 | 11 per line; 6 lines still inside the 567 px card | 26 / 36, longest word 10 | Text grows upward over the poster. No split here, so no mid-word break and no accent clipping. In the FOOTAGE bar only 3 lines fit, 6.2 |
| Labels `YEAR`, `Location`, `CATEGORY` | `WORK_CALLOUT_LABELS` `work-page.ts:20` | 3 × 2 | 4, 8, 8 | yes | Sinal Display 16 px, `nowrap`, column 130; 390: 104 | 16; 12 | 6 / 8 | Rows carry percentage offsets from `main.css` |
| Year value | `film.year`, `WorkRollItem.astro:22` | 2 | 4 | yes | same | 16 | 4 / 11 | |
| Location value | `work.location`, `work.ts` | 2 | 3 / 8 / 8 | yes | same | 16 stays inside the list at both widths; 27 is 42 px past the list at 390, inside the card | 11 / 16 | "Sala 24", "18/07 20:30" fit. "Location" has no real meaning for FHDOG: the row suits "Sessão" |
| Category value | `film.category`, `WorkRollItem.astro:24` | 2 | 10 / 11 / 12 | yes | same | Up to 17 inside at 390; 20 is 19 px past the list at 390, inside the card | 15 / 17 | |
| EXPLORE (mobile, bottom bar) | `WORK_EXPLORE_LABEL` `work-page.ts:26`, `WorkBottomEdge.astro` | 1 + 2 shared | 7 | no | as the home button | 10 | 8 / 10 | |
| Toggle `FOOTAGE`, `POSTER` | `WORK_TOGGLE` `work-page.ts:14` | shared | 7, 6 | no | Sinal Display Leve 12 px, spacing 1.2 px; switch 63 px; 390: 50 px | 8 at desktop, 6 at 390 (Siena's FOOTAGE already overflows 50 by 7 px) | 5 / 7 ("CENAS", "CARTAZ") | "FOTOGRAMAS" 85 px does not fit. Clip box of 1em: avoid accents |
| Toggle `MODE` | `work-page.ts:16` | shared | 4 | no | same, 30% opacity | 8 | 4 / 6 ("MODO") | |
| Hidden link `Text Link` | `WORK_HIDDEN_LINK_TEXT` `work-page.ts:29` | 1 | 9 | no | hidden | n/a | use the film title | Screen readers only |

### 3.3 Nav: ticket, panels, menu

| Slot | Source | Per film | Siena | UP | Font and box (desktop; 390) | Holds | Budget PT | Notes |
|---|---|---|---|---|---|---|---|---|
| Ticket title | `film.title`, `MenuFilmRows.astro:25` | 1 | 5 / 12 / 22 | yes | Sinal Display Leve 20 px, line 18 px; box 130; `.menu-row-top` 77 px with `overflow:clip`. Hidden up to 991 px | 12 per line, 3 lines. Line 4 is cut (36 chars: 88/77 px) | 24 / 30 | Measured clipped: "Manual Prático da Vingança Lucrativa", the 50-character double title. Needs a short title or the 6.2 rule |
| Ticket category | `film.category`, `MenuFilmRows.astro:32` | 1 | 10 / 11 / 12 | yes | Sinal Display Leve 7.2 px, spacing 2 px, `nowrap`, 1rem side padding; row 237 | 14 today; 15 = 5 px over, 17 = 9 px, 20 = 33 px over. 20 fits with half the padding* | 12 / 14; 20* | Shares the data with the eyebrow |
| Ticket year | `film.year`, `MenuFilmRows.astro:35` | 1 | 4 | yes | same | 4 | 4 / 4 | Double feature: use the first film's year |
| Ticket `MIN.` + minutes | `film.minutes`, `MenuFilmRows.astro:39-40` | 1 | 4 + 2 / 2 / 3 | yes | same | 7 | `MIN.` + 3 | Double feature: 95 + 108 = 203 min |
| Small panel row | `film.title`, `SmallPanel.astro:36` | 1 | 5 / 12 / 22 | yes | Sinal Display Leve 12.8 px; row 237, 42 px high; hidden up to 991 px | 1 line up to about 30 chars (183 px); more wraps and the row grows | 26 / 40 | **21 rows need 903 px under a 135 px nav: 138 px past a 900 px window and no scroll** (`overflow:hidden`, no `data-lenis-prevent`). Tilde cut by the 1-line clip box (6.1) |
| Footage panel eyebrows `HEADLINE`, `DIRECTOR`, `PRODUCERS` | `FootagePanel.astro:29,33,35` | 3 | 8, 8, 9 | no | Sinal Texto 6 px, spacing 1.8 px; box 91 | 13 | 8 / 12 | Opens only in Work FOOTAGE mode |
| Footage quote | static `"A film based on a true Story"`, `FootagePanel.astro:30` | 1 | 30, same on all | yes | Sinal Display Leve 13 px, line 15.6 px; box 91, 13 per line | 20 chars = 2 lines, 30 = 3, 44 = 5, 88 = 8 | 24 / 30 | Static fake text today: must become per-film or real |
| Footage director | `film.director`, `FootagePanel.astro:34` | 1 | 10 / 14 / 18 | yes | same | 17-23 = 2 lines, 37 = 4 | 18 / 23 | |
| Footage third value | static `Leelu Dorit`, `FootagePanel.astro:36` | 1 | 11, same on all | yes | same | 20 = 2 lines | 14 / 20 | Real crew name of Siena, must go |
| Footage panel height | `.menu-footage-item:first-child { position:relative }`, others absolute | n/a | panel 151 px | n/a | Only the **first** item in DOM sets the height | Grows 167 to 218 px with text | keep every film within the first film's line count | A longer text in any other film overflows the ticket. With the date-sorted order the first item changes, so budget for the worst |
| Footage CTA | `SEE CASE STUDY`, `FootagePanel.astro:40` | 1 | 14 | no | Sinal Display Leve 10 px, spacing 1.5 px; row 209 | 25 | 12 / 20 | |
| Stars | `RatingStars.astro` in `FootagePanel.astro:28`, `CasePanel.astro:28`, `FootageItem.astro:38` | 1-2 per film + 1 per still | n/a | n/a | SVG | n/a | **Remove** | Nothing in `app.js` references them |
| Case panel synopsis | `film.synopsis`, `CasePanel.astro:22` | 1 | 182 / 278 / 446 | no | Sinal Texto 12 px, line 14.4 px, no spacing; box 209; hidden up to 991 px | 35 per line; 150 = 5 lines, 280 = 9, 450 = 13, 700 = 21 (panel 371 px); never clips | 280 / 450 | Also `<meta description>`, `films/[slug].astro:36`, where 155 is the useful limit. `summary` (64-151) fits as is |
| Case panel placeholder | `CasePanel.astro:13` | 1 per non-case page | 40 | no | same | n/a | replace or empty | English Webflow filler, in the DOM of all other pages |
| Case panel `5/5` | `CasePanel.astro:29` | 1 | 3 | no | Sinal Display Leve 10 px | 12 | **Remove** with `.rating-w` | Rating |
| Main links `WORK`, `About`, `Contact` | `NAV_MAIN_LINKS` `site.ts:31` | shared | 4, 5, 7 | yes | Sinal Display 32 px; row 319; 390: 326 | 15 | 11 / 14 | "PROGRAMAÇÃO" (11) renders whole, accents included |
| Legal links | `NAV_LEGAL_LINKS` `site.ts:38` | shared | 5, 6, 7 | yes | Sinal Display Leve 12 px, spacing 1.1 px; 3-column grid in 243 px | 11 ("PRIVACIDADE" 82 px, the grid adapts) | 7 / 11 | |
| Copyright | `NAV_COPYRIGHT` `site.ts:44` | shared | 30 | no | Sinal Display Leve 12 px, spacing 1.2 px; 298 px | 34 | 30 / 34 | "©2026 FILMES HD ONLINE GRÁTIS." is 30 |
| Ticket on /about | `AboutMenu.astro:8,11,14` | shared | 5, 9, 3 | no | Sinal Display Leve 9 px, spacing 1.9 px; 3 cells of 79 px | 11 per cell, cells stretch | 5, 9, 3 / 11 each | `ADMIT ONE` is a picture of a ticket, not a claim |
| Ticket on /contact | `ContactMenu.astro:15,17` | shared | 10, 8 | no | 22 px, box 145 (`LET'S TALK`); 8 px, spacing 1.6 px, box 147 (`EMAIL US`) | 14 on one line; 25 | 10 / 12; 14 / 20 | "FALE COM A GENTE" wraps to 2 lines. "ENTRAR NO DISCORD" fits |


### 3.4 Case study, per film

| Slot | Source | Per film | Siena | UP | Font and box (desktop; 390) | Holds | Budget PT | Notes |
|---|---|---|---|---|---|---|---|---|
| Back link `All Work` | `CaseHero.astro:24` | 1 | 8 | yes | Sinal Rotulo 9.6 px; free width | 30 | 7 / 16 | "Todas as sessões" fits |
| Hero eyebrow | `film.category`, `CaseHero.astro:32` | 1 | 10 / 11 / 12 | yes | Sinal Rotulo 12.8 px, spacing 4.2 px, 11.9 px per char; centred; 390: 355 | 100; 29 | 20 / 28 | 43 chars of three genres fit at desktop only |
| H1 | `film.title`, `CaseHero.astro:35` | 1 | 5 / 12 / 22 | yes | Sinal Display 97.6 px, line 68 px, box 572 (em based); 4.4rem ≤991, 4.1rem ≤767, 48 px ≤479, box 281 | 11 per line; breaks are the same at every width | 36 / 50 | Fixed-height hero: each line takes 68 px from the image (673 px with 1 line, 400 px with 5 at 900 tall). Accents poke above the top rule, readable |
| Hero rules | `CaseHero.astro:36-40`, bundle rule on `data-case` | 2 or 3 | n/a | n/a | absolute, `space-between`, moved up .6rem | n/a | n/a | Section 4.3 |
| Trailer eyebrow `ACTION!` | `CaseTrailer.astro:32` | 1 | 7 | yes | Sinal Rotulo 9.6 px; box 126 | 14 | 5 / 12 | "AÇÃO!" |
| Trailer heading `WATCH` / `Trailer` | `CaseTrailer.astro:33` | 2 lines | 5, 7 | yes (`h2`) | Sinal Display 32 px, line 28.8 px; button 138 px; same at 390 | "ASSISTIR" 126 px | 8 / 8 per line | Keep the `<br>` |
| Time labels | `CaseTrailer.astro:54,64` | 2 | 5, 4 | no | Sinal Rotulo 14 px | n/a | no copy | Bundle rewrites them |
| `SOUND ON` | `CaseTrailer.astro:67`; bundle writes `SOUND OFF` / `SOUND ON` on click, `app.js` offset 364804 | 1 | 8, 9 | no | Sinal Display Leve 18 px; box 107 | 10 | 8 / 10 ("SOM LIGADO") | The template text is lost at the first click: translating needs a one-string bundle patch or a small observer |
| Director label | `CaseCredits.astro:22` | 1 | 8 | yes | Sinal Rotulo 9.6 px; card 329 (449 at 1920, 314 at 1280); 390: 355 | 30 | 7 / 20 | "Direção" |
| Director name, big card | `film.director`, `CaseCredits.astro:23` | 1 | 10 / 14 / 18 | yes | Sinal Display 51.2 px, line 41 px, box 232 at 80%; 390: 28.8 px, box 155 | 17 chars 2 lines, 21-23 = 3, 37 = 5. Words up to 296 px fit (2 px over at 1280, where the card is 314). 390: same lines, widest 167 px | 24 / 37, longest word 11 | Text sits at the bottom of a 603 px card, so extra lines are safe |
| Key crew role | `credits.keyCrew[].role`, `CaseCredits.astro:36` | 2-4 | 3 / 6 / 23 | yes | Sinal Rotulo 9.6 px; column 512; 390: 355 | 57; 39 | 20 / 34 | |
| Key crew name | `credits.keyCrew[].name`, `CaseCredits.astro:37` | 2-4 | 10 / 12.5 / 19 | yes | as the big card, 276 box at 512 column; 390: 155 | Same lines as the big card, widest word 296 px in a 512 px column; row 146 px at 2 lines | 23 / 37 | The row grows; no clipping. Two columns only: 3 or 4 items wrap to a second row |
| Producer band | `credits.producers[].role`, `CaseCredits.astro:49` | 2-8 | 8 / 11 / 18 | yes | Sinal Rotulo 9.6 px in a 2.6rem band; hidden ≤991 | 34 with 2 items | 14 / 20 | Width divides by the item count: 8 items leave 128 px |
| Producer role under name | `CaseCredits.astro:62` | 2-8 | same | yes | hidden above 991; 390: visible, 355 | 39 | 14 / 30 | |
| Producer name | `credits.producers[].name`, `CaseCredits.astro:63` | 2-8 | 8 / 13 / 23 | yes | Sinal Display 48 px, line 38 px, box 172 (6ch); 390: 28.8 px, 353 wide | 23 chars 4 lines, 37 = 5, row grows from 115 px. 390: 1 line up to 23 chars (338 px), 37 = 2 | 20 / 37, 4 items at most per row | 5 or more columns let wide words collide. Band title `PRODUCErS` on phones (`CaseCredits.astro:55`), sic in the original |
| `Main Crew` band | `CaseCredits.astro:70` | 1 | 9 | yes | Sinal Rotulo 9.6 px | 114 | 12 / 30 | "Elenco e equipe" |
| Crew role | `credits.crew[].role`, `CaseCredits.astro:76,88` | 2-5 | 5 / 10 / 18 | yes | Sinal Rotulo 9.6 px | 30+ | 14 / 21 | Empty role shows the fallback `CAST` (`CaseCredits.astro:89`) |
| Crew name | `credits.crew[].name`, `CaseCredits.astro:77,91` | 2-5, 2 copies | 9 / 12 / 21 | yes | Sinal Display 32 px, `nowrap`; cell min 30%; 390: 19.7 px, 353 | 37 chars 553 px; 340 px of 355 at 390. Cells wrap as a row at desktop | 23 / 37 | Grid 1 takes the first two, grid 2 the rest. Third copy (`:100`) is hidden |
| Director's cut | `CaseShowcase.astro:30` | 1 | 14 | no | hidden by `.abs.sticky-c` | n/a | 14 / 14 if ever shown | Measured 0x0 at every viewport |
| Section tickets `GALLERY`, `REVIEWS` | `CaseGallery.astro:24`, `CaseReviews.astro:19`, `TicketHeading.astro` | 2 | 7, 7 | yes (`h2`) | Sinal Display Leve 16 px, spacing 1.6 px; 390: 10 px | 20 | 7 / 16 | "POR QUE ASSISTIR" (16) fits |
| Gallery caption `VARIETY` + quote | `FootageItem.astro:39-40` | 1 per still | 7, 21, same on all | yes | hidden by `.abs.cs-footage-cont` | n/a | **Empty** | Fake critic in the DOM of every still, static. `app.js` also hides about 40% of the captions at random (offset near 368045) |
| Review slide source | `reviews[].source`, `CaseReviews.astro:32` | 0-7 in Siena | 7 / 20 / 23 | yes | Sinal Rotulo 9.6 px; box 328; 390: 208 | 36; 23 | 18 / 27 | |
| Review slide text | `reviews[].quote`, `CaseReviews.astro:33` | 0-7 | 58 / 68 / 77 | yes | Sinal Display 40 px, line 36 px; box 354 inside a 424x572 card; 390: 21 px, line 18.9, box 208 | Lines: 77 = 6, 100 = 8, 120 = 9, 150 = 12. Source to card top: 275, 203, 167, 59 px; 180 chars goes 13 px past the top. 390: 220 chars still 34 px inside | 100 / 130 | `headline` and `kicker` fit as they are; `summary` (151) is at the edge. Bottom-aligned, so overflow goes up over the card's punched top |
| Counter `1/12` | `CaseReviews.astro:43` | 1 | 4 | yes | Sinal Display 9.6 px | n/a | Real count at build, or hide | Static: nothing in `app.js` rewrites it, though the template comment says so. Savoy has 6 slides and reads 1/12 |
| `DRAG TO DISCOVER` | `CaseReviews.astro:61` | 1 | 16 | yes | Sinal Rotulo 9.6 px; hidden on phones | 100+ | 16 / 30 | "ARRASTE PARA VER" |
| Prize category | `prizes[].category`, `CasePrizes.astro:29` | 0-14, 7 copies | 12 / 25 / 38 | yes | Sinal Rotulo 9.6 px; box 285; 390: 238 | 32; 26 on one line, then wraps | 20 / 28 | No real prizes exist for these films. Items without an image hide the logo (`bound`) |
| Prize festival | `prizes[].festival`, `CasePrizes.astro:30` | 0-14, 7 copies | 12 / 25 / 41 | yes (`h3`) | Sinal Display 32 px, line 32 px; box 247-285; 390: 28 px, box 216-238 | 15 per line; "Suspense Psicológico" 2 lines, 37 chars 3 lines; marquee has no height limit | 24 / 40 | 4 to 14 items. Fewer items make a very fast marquee: 1 item runs in 2 s per copy |
| `Investors & Broadcast` | `CaseInvestors.astro:15` | 1 | 21 | yes (`h2`) | Sinal Display 32 px; 390: 355, 21 per line | 80; 21 per line | 18 / 35 | Must be renamed: nothing here is real for FHDOG. "Exibição" works |
| Investors rich text | `investorsHtml`, `CaseInvestors.astro:16` | 1-7 blocks | blocks 3 / 74 / 217; whole 74 / 117.5 / 317 | yes | Sinal Display 21 px, line 30 px; 1373 wide; 390: 355, 33 per line | 129 per line; 220 chars = 2 lines | 220 / 320 in all, `h3` or `h4` only | Section 360 px tall at desktop |
| `Showcase` (2 uses) | `CaseNextProject.astro:22,39` | 2 | 8 | yes | Sinal Rotulo 9.6 px; box 271-283; 390: 304 | 31 | 12 / 20 | "Próxima sessão" |
| `ALL WORK` | `CaseNextProject.astro:24` | 1 | 8 | yes | Sinal Display 51.2 px, line 41 px; box 283 (246 at 1280, 393 at 1920); 390: 41.6 px, 306 | "SESSÕES" 202 px; "PROGRAMAÇÃO" 350 px overflows by 67 | 8 / 9 per word | |
| Next title | `film.title`, `CaseNextProject.astro:41` | 1 of N shown | 5 / 12 / 22 | yes | Sinal Display 51.2 px, line 41 px; box 271, `height:3ch` (92 px); 390: 41.6 px, box 304 | Desktop: 4 lines 66 px to the CTA, 6 lines **-16**. 1280: 4 lines 29 px, 6 lines **-53**. 390: 1 line 56 px, 2 lines 22 px, 3 lines **-11**, 4 **-44**, 5 **-77** | 40 at desktop; 390: 26 / 40* | Section 6.2 |
| `Explore`, `NEXT` | `CaseNextProject.astro:27,44` | 2 | 7, 4 | yes | Sinal Display Leve 16 px, spacing 3.2 px; 390: 13 px | 14 | 7 / 10 ("PRÓXIMA") | |
| Empty state | `DynEmpty.astro:11` | up to 7+ | 15 | no | hidden unless a list is empty | n/a | Portuguese, short | Visible if a list ships empty |

### 3.5 Footer

| Slot | Source | Count | Siena | UP | Font and box (desktop; 390) | Holds | Budget PT | Notes |
|---|---|---|---|---|---|---|---|---|
| Big words (3) | `FOOTER_TAGLINE` `site.ts:68`, `Footer.astro:44-53` | 3 | 10, 11, 7 | no | Sinal Display 89.6 px, spacing -.04em, `height:.7em`, `overflow:hidden`; 390: 41.6 px | 6 chars 259-266 px (120 at 390); 16 chars 646 (300); 23 chars 915 at desktop, at 390 it wraps and line 2 is cut | 9 / 16 per line | One line only: a wrapped second line is cut. "FILMES", "ONLINE", "GRÁTIS" 259-266 px. **Accents and cedilla are clipped today**: `GRÁTIS` reads `GRATIS` (6.1) |
| Column titles | `FooterNewsletter.astro:14`, `FooterSitemap.astro:16`, `FooterContact.astro:13` | 3 | 15, 7, 10 | yes (`h2`) | Sinal Rotulo 9.6 px; 185-333 | 20+ | 15 / 20 | |
| Email placeholder | `FooterNewsletter.astro:30-31` | 1 + aria | 16 | no | Sinal Display 14 px, spacing 1.4 px; 214 px usable; 390: 10 px | 20 | 17 / 20 ("DIGITE SEU E-MAIL") | Typed in uppercase |
| Form success | `FooterNewsletter.astro:42` | 1 | 45 | no | Sinal Texto 20 px, 20 px padding; 321 | wraps freely | 40 / 80 | Replaces the form |
| Form failure | `FooterNewsletter.astro:45`, runtime `MESSAGE` `local-forms.js:9` | 1 | 53, runtime 150 | no | same | wraps freely | 60 / 120 | The script overwrites the visible text in English: change both or connect a provider |
| Sitemap links | `FOOTER_SITEMAP` `site.ts:47` | 4 | 4-7 | yes (`h3`) | Sinal Display 32 px, spacing -.03em; column 185 grows | "PROGRAMAÇÃO" 208 px | 8 / 11 | |
| Contact label | `FOOTER_CONTACTS` `site.ts:63` | 2 | 9, 5 | yes | Sinal Rotulo 9.6 px; hidden on phones for the first | 12 | 9 / 12 | |
| Contact value | `site.ts:63-64`, `FooterContact.astro:23` | 2 | 14, 16 | yes | Sinal Display 32 px, line 32 px; column 333; 390: 21 px, 355 | 18 chars 327 px; 21 chars 366, past the column. 32 chars 568; 373 at 390, 15 px past the box | 14 / 18 | **The real address `filmeshdonlinegratisbr@gmail.com` (32) does not fit.** Show "E-MAIL" or "DISCORD" and keep the address in `href` |
| `Follow us —` | `FooterBottomBar.astro:24` | 1 | 11 | yes | Sinal Rotulo 9.6 px | 40 | 11 / 16 | |
| Copyright | `FOOTER_COPYRIGHT` `site.ts:70`, 404 copy `:72` | 1 | 27, 32 | yes | Sinal Rotulo 9.6 px; 453; 390: 355 | 49; 39 on one line | 30 / 39 | |
| Legal links | `FOOTER_LEGAL_LINKS` `site.ts:55` | 3 | 5-7 | yes | Sinal Rotulo 9.6 px, flex | 12 | 7 / 11 | |

### 3.6 About

| Slot | Source | Count | Siena | UP | Font and box (desktop; 390) | Holds | Budget PT | Notes |
|---|---|---|---|---|---|---|---|---|
| Hero small lines | `ABOUT_HERO.topLines`, `bottomLines` `about.ts:54,72`; `HeroSmallText.astro` | 4 | 10, 15, 21, 25 | no | Sinal Display Leve 25 px at 900 tall (2.8vh), 1.8vw ≤1220, `nbsp` so one line; 390: 7 px by the 1.8vw rule at load | 36 at desktop | 20 / 28 | Typed in uppercase; use ` ` |
| Hero words | `ABOUT_HERO.words` `about.ts:66` | 3 | 4, 10, 5 | no | Sinal Display 100.8 px, 7vw, line .7em; 390: 15.6 px at the 4vw rule | "PRODUCTION" 573 px, "PROGRAMAÇÃO" 688 px between the two arch photos | 8 / 10 | One word per line. Accents clipped today (6.1) |
| Film titles list | `ABOUT_TYPE_COMP.titles`, `xlTitles` `about.ts:99,150` | 4 + 3 | 5 / 14 / 22 | no | Sinal Display 22 px, spacing -.88 px; each carries a translate | 36 chars 375 px, one line | `_2`, `_3`, `_4`: 10; others 26 | Section 4.1 |
| Statement cells | `statement` `about.ts:117` | 4 rows × 3 | cells 4 / 15 / 30; rows 39 / 52 / 61 | no | Sinal Texto 24 px, spacing -.03em, `space-between` in 818; 390: 12 px in 390 | 72 per row | row 52 / 65 | 30 chars per cell is the look. Overflow cuts nothing, the cells only touch |
| Format words | `formats` `about.ts:139` | 3 | 5, 10, 11 | no | Sinal Display 89.6 px; 390: 51.2 px | "DOCUMENTÁRIO" 594 px; 340 px at 390 | 8 / 12 | Typed uppercase. Real content: genres |
| XL word | `xlWord` `about.ts:148` | 1 | 5 | no | Sinal Display 331 px (23vw), spacing -.056em; 390: 49vw | "SIENA" 766, "FHDOG" 902, 390: 442 and 520 (wider than the screen, on purpose in the original) | 5 / 6 | Bleeds off screen by design and moves with scroll |
| Colophon | `colophon` `about.ts:163` | 4 | 21, 33, 35, 27 | yes | Sinal Texto 12 px; 262 | 35 | 30 / 40 | Contains an invented ISBN-looking joke: rewrite |
| Team title, services title, CTA | `about.ts:222,248,289` | 3 | 10, 12, 9 | yes | ticket 16 px; CTA Sinal Display 89.6 px; 390: 51.2 px | CTA: "Nossos Filmes" 613; 350 at 390 | 13 / 13 | |
| Team role | `ABOUT_TEAM` `about.ts:225` | 2 | 7 | yes | Sinal Rotulo 9.6 px | 30 | 12 / 30 | |
| Team name | `about.ts:226` | 2 | 9, 18 | yes | Sinal Display 51.2 px, line 41 px, `max-width:3ch`: one word per line | word 300 px fits a 339 px text column | 3 words, word 10 chars | |
| Team bio | `about.ts:227` | 2 | 303, 307 | no | Sinal Texto 18 px, line 21.6; 272 at 50% of the card; 390: 15 px, 320 | 300 = 10 lines; 450 = 15 lines and the card grows from 432 to 540 px | 300 / 400 | |
| Services | `ABOUT_SERVICES` `about.ts:248` | 2 × label + 2 lines | 9; 4-10 | yes | label 9.6 px; heading Sinal Display 64 px, 2.6rem on phones | "PROGRAMAÇÃO" 437; 284 | 9 / 11 per line | Lines split by `<br>` |
| Collaborators | `ABOUT_COLLABORATORS` `about.ts:267` | 3 | 13, 4, 3-4 | yes | hidden by CSS | n/a | Empty or remove the data | A24 logo and names in the DOM |

### 3.7 Contact, legal, 404, overlays

| Slot | Source | Count | Siena | UP | Font and box (desktop; 390) | Holds | Budget PT | Notes |
|---|---|---|---|---|---|---|---|---|
| Contact eyebrow | `CONTACT_PAGE.eyebrow` `contact.ts:34` | 1 | 10 | yes | Sinal Rotulo 12 px | 100+; 34 | 10 / 20 | |
| Contact headline | `headline` `contact.ts:35` | 3 lines | 5, 8, 3 | yes | Sinal Display 172.8 px (12vw), char split, clip `.7em`; 390: 93.6 px (24vw) | 390: 7-8 per line (51.6 px per char); 14 at desktop | 5 / 7 per line, **no accents or cedilla** | Accents are clipped and the CSS fix tried did not work here (clones roll through the same window), so choose plain words: "FALE", "COM A", "GENTE" |
| Contact label | `rows[].label` `contact.ts:37-50` | 3 | 9-17 | yes | Sinal Rotulo 9.6 px; shares a 598 px row; 390: 12 px, stacked | label + value under 560 px | 12 / 17 | `labelDesktopPrefix` hides on phones |
| Contact value | `rows[].value` `contact.ts:40-50` | 2 visible | 14, 15, 26 (hidden) | yes | Sinal Display 48 px, -.1rem, 24.5 px per char; 390: 26 px, 13.3 px per char, 342 | 16 with a 17-char label; 21 with a 5-char one; 25 at 390 | 14 / 16 | The real address in capitals is 801 px at desktop and 436 px at 390, 23 px past the screen. "DISCORD" 175 and "FALE CONOSCO" 295 fit |
| Legal H1 | `heading` `legal.ts` | 1 | 5, 7, 7 | yes | Sinal Display 7vw; 14vw ≤767; 20vw (78 px) ≤479 | **"PRIVACIDADE" is 451 px wide at 390: 79 px past the screen** | 7 / 7 at 20vw; 11 with the 6.2 rule* | |
| Legal H3 | `blocks[h3]` `legal.ts` | 8-9 | 7 / 20 / 31 | yes | Sinal Display 38.4 px, wraps; 390: 355 | "INFORMAÇÕES QUE COLETAMOS" 1 line at desktop, 2 at 390 | 30 / 40 | |
| Legal paragraph | `blocks[p]` `legal.ts` | 22-25 | 9 / 46-75 / 595 | no | Sinal Texto 16 px, line 19.2, max 595; 390: 355 | free | free | Pages total 1167-3938 chars. `<li>` is uppercase through the `ul` rule, so keep lists short: 49 / 80 / 128 today |
| 404 digits | `404.astro:15` | 3 | 1 | no | Sinal Display 34vw, roll | 1 | 1 | Keep |
| 404 note | `404.astro:16` | 1 | 16 | no | Sinal Display 38 px, line .75em, one line (`nbsp`), 30 px clip (24 px at 390) | 17 at 390 | 16 / 17 | Typed uppercase. "NOTA DA DIREÇÃO:" 291 px. Accents clipped today (6.1) |
| 404 heading | `404.astro:17` | 1 | 14 | no | same | **"PÁGINA NÃO ENCONTRADA" is 419 px, 47 px past a 390 screen** | 14 / 17 | "NÃO ENCONTRADA" (14) fits. The clip box hides a second line |
| 404 button | `404.astro:20` | 1 | 7 | no | button, 93 px | 10 | 6 / 10 ("VOLTAR") | |
| Tutorial tips | `TUTORIAL.texts` `home.ts:45-51` | 5 | 37 / 45 / 47 | yes | Sinal Texto 10 px, line 1em, spacing .08em; box 196x20, `overflow:clip`; hidden ≤991 | 2 lines exactly; five Portuguese tips of 40-47 chars measured at 2 lines | 44 / 47 | A third line is cut. Accents on line 1 not checked by eye |
| Tutorial close | `TUTORIAL.closeLabel` `home.ts:52` | 1 | 5 | no | button at scale .8 | 10 | 6 / 10 ("FECHAR") | |
| Preloader `ENTER` | `PRELOADER.enterLabel` `home.ts:40` | 2 | 5 | no | button | 10 | 6 / 10 ("ENTRAR") | Video frames with the Siena logo are a separate job |
| Rotate notice | `RotateNotice.astro:1` | 1 per page | 18 + 29 | no | Sinal Texto 16 px; shown only from 480 to 767 px wide | free | 20 + 32 | "Gire o aparelho" / "para ver melhor" |
| Cursor | `CursorBox.astro:24`; bundle writes `SCROLL`, `app.js` offset 44143 | 1 | 7 → 6 | no | Sinal Texto 12 px in a 104 px circle; hidden on touch | 12 | 5 / 8 ("ROLAR") | The template's `EXPLORE` is never seen. Translating needs a bundle patch or an observer |
| Browser titles and meta | `home.ts:6`, `work-page.ts:6`, `about.ts:30`, `contact.ts:32`, `legal.ts`, `404.astro:12`, `films/[slug].astro:34`, `SITE_DESCRIPTION` `BaseLayout.astro:22` | 1 per page | 27-46 | n/a | not visible | n/a | 60 / 70; description 155 | All say "Siena Film Foundation" |


## 4. CSS and bundle rules tied to films, title words and `ch` widths

### 4.1 Rules tied to a film or to a title word

| Rule | Where | What it does | With the FHDOG titles |
|---|---|---|---|
| `.moon { .split-line-move:nth-child(2) { translate(20%) } }` | `main.css`, `@media (min-width:767px)` | Staggers line 2 of a home title whose first word is "Moon" | Never matches |
| `.kafka { ...:nth-child(2) { translate(-15%) } }` | same | Staggers line 2 for "Kafka's..." (the bundle cuts the first word at `'`) | Never matches |
| `.my, .ana { ... translate(0) }` | same | Resets lines for "My..." and "Ana..." | Never matches. A future title starting with "My" or "Ana" gets it, harmless |
| `.freud { ...:nth-child(2) { translate(10%) } }` | same | Dead rule already: the class is `outsider` (`docs/INVENTORY.md:231`) | Never matches |
| No `.savoy`, `.taboo`, `.by`, `.the` rule exists | `main.css` | The classes are added, nothing styles them | `.o`, `.de`, `.os`, `.sem`, `.v`, `.the`, `.pulp`, `.manual`, `.casamento`, `.vivarium`, `.bugonia`, `.django`, `.doutor`, `.bastardos`, `.obsessão`, `.verdade`, `.aquilo` have no rule in `webflow.css`, `main.css` or `tema-sinal.css`: no collision |
| Source of those classes | `app.js` offset 375790: `textContent.toLowerCase().split(" ")[0].split("'")`, then `classList.add` | Adds the first word as a class to every home `h2` | A title with a leading space gives `classList.add("")`, which throws and stops that title's split. Trim every title in the data |
| `[data-case=...]` | No CSS rule anywhere | Only JS reads it: `Ra` (offset 366678) hides the 3rd hero rule when `data-case.length < 13`, `Bh` (offset 356235) and `Va` (offset 369676) compare it with `data-id` | Length of the slug decides the hero rule, not the title. See 4.3 |
| Short-title shift in Work FOOTAGE mode | `app.js` offset 350221: `h2.textContent.length < 10` moves the title `y: 2.5rem` and the callouts `xPercent: -(10-n)*10` | Keeps short titles aligned in the bottom bar | Applies to O Lagosta (9), Vivarium (8), Bugonia (7), Obsessão (8), The Menu (8). Vivarium measured: top 842, bottom 870 of 900 |
| Mobile-UA FOOTAGE shift | `app.js` offset 349634: `textContent.length > 9 ? 60 : 100` | `yPercent` of the title block on phones | Not exercised: the probes use a desktop UA at 390 px (`B.isMobile` is UA based, `$m`/`Ym`) |
| `.about-title-tx._2` to `._6` | `webflow.css` | `translate(80%, 140%, 70%, -10%, 20%)`, a percentage of the text's own width | Bound to the position, not the film. A long title in `_2`, `_3` or `_4` runs off screen: keep those at 10 characters or fewer |
| `.work-roll-c .roll-cont-item .linecallout-list .linecallout-item:nth-child(n) div:nth-child(m)` | `main.css` | Per-row `translate(-15%, -20%, 10%, -5%, -10%)`, a percentage of the cell | Generic, independent of the film |
| `.text-span { margin-left:-30% }` | `webflow.css` | Offset of the first home label only (`RollCallout.astro:19`) | Keep the `span` |
| `[data-css=creditgrid2]:nth-child(-n+2) { display:none }`, `.credit-row.last { display:none }` | `main.css`, `webflow.css` | Second crew grid skips the two already shown; the names-only row never shows | The hidden copies must still be rendered consistently, no copy needed |
| `[data-marquee-active="1..14"]` | `main.css`; set by `Za` (offset 382813), capped at 14 | Marquee speed by item count | Up to 14 items per film; more works but keeps the speed of 14 |

### 4.2 Rules that keep real text out of sight in the current build

| Rule | Slot | Consequence |
|---|---|---|
| `.abs.sticky-c { display:none }` | DIRECTOR'S CUT badge, `CaseShowcase.astro:21-36` | Measured 0x0 at every viewport. No budget needed; the string and the film image still ship in the DOM |
| `.abs.cs-footage-cont { display:none }` | Gallery caption `VARIETY` / `"A cinematic triumph"` + stars, `FootageItem.astro:37-41` | Never visible, but it is a fake critic in the DOM on every still of every film: remove the text and `RatingStars` |
| `.s.h-auto.flex-center.pt-lg { display:none }` | About "COLLABORATEUR" | Never visible; the A24 logo and names ship in the DOM |
| `.contact-li-it.is--address { display:none }` | Contact ADDRESS row | Never visible; a real street address of Siena ships in the DOM |
| `.roll-cont-eyeb.parish.is-role.is-main { display:none }` above 991 px | Producer role under the name | Desktop shows the role only in the band above (`.credit-row-title`); phones show it in the card and read the band `PRODUCErS` (`CaseCredits.astro:55`) |
| `.investor-rt h1, h2, p, ol, ul { display:none }` | Investors rich text | Only `h3`, `h4`, `h5` render. A `<p>` disappears silently |
| `.awards-w h1, h2, h5, h6, ol, ul, strong, em, sup { display:none }` | Home review rich text | Only `figure`, `p`, `h3`, `h4` render |
| `.tutorial-wrapper { display:none }` at 991 px and below, `.div-block-44` shown only from 480 to 767 px | Tutorial, rotate notice | No phone-portrait budget for either |

### 4.3 Third hero rule (`data-case.length < 13`)

The three rules of `.cs-hero-lines.case-he` are flex children with `justify-content:space-between`. With three, the middle one crosses the title at half height; with the third hidden, only the top and the bottom rule remain.

Siena's slugs happened to match its titles: one-line titles had short slugs (`savoy`, `taboo`), the two-line `outsider-freud` had a long one. FHDOG's slugs carry the year, so 20 of the 21 reach 13 characters; only `bugonia-2025` (12) stays below. Measured at 1440: `Vivarium` with `vivarium-2019` gets rules at -10, 24 and 58 px around its 68 px title, so the middle one runs across the word (`shots/rule-vivarium-2-1.png`). If the source file names become the slugs, O Lagosta (`the-lobster-2015`), Sem Limites (`limitless-2011`), Obsessão (`obsession-2026`) and The Menu (`the-menu-2022`) join it. `Doutor Sono` is right with three: the middle one falls between its lines. A 3-line title such as `O Mistério de Silver Lake` gets the rule across line 2, as Siena's `Moon in the 12th House` did.

`data-case` must stay equal to the film's `data-id` (nav ticket and next card compare them), so padding it is not a clean fix. Recommended: emit the expected line count in the template and let CSS win over the inline style of the bundle, see 6.3.

### 4.4 Measures in `ch`

`tema-sinal.css` block 3b restates them in `em` from the original font (`--ch-display: .598em`, `--ch-texto: .6196em`), so they do not depend on the Sinal fonts. The ones that limit text:

| Selector | Value | At desktop | At 390 | Effect on copy |
|---|---|---|---|---|
| `.roll-cont-item` | 33ch display | 395 px (font 20 px) | 100% (294 px) | The real limit of the home title: parent of the `h2` |
| `.roll-cont-he.home` | max 12ch; ≤479: width 9ch, max 13ch | max 643 px, capped to 395 by the parent | 258 px | Widen here (6.1) |
| `.roll-cont-he.work` | width 9ch | 258 px at 48 px; 194 px at 36 px (1280x720) | 215 px at 40 px | About 11 characters per line |
| `.cs-title` | max 9.8ch (3c) | 572 px at 97.6 px | 281 px at 48 px | Scales with the font, so the line breaks are the same at every width |
| `.linecallout-list.home` / `.work` | 33ch / flex | 363 px (padding inside) / 260 px | auto, grows with content / 208 px | Rows are `nowrap` in a `1fr 1fr` grid |
| `.awards-w` | max 15ch texto | 186 px | 100%, two columns of 142 px | 14 characters per line in the quote |
| `.awards-w h3` | max 15ch display | 229 px at 25.6 px, 129 px at 14.4 px | 172 px | Parent is narrower at desktop |
| `.credit-name` | width 9ch, max 80% | 232 px | 155 px | Wider words overflow the box, not the card |
| `.credit-name.smaller` | width 6ch | 172 px | 100% | Almost one word per line at desktop |
| `.team-he` | max 3ch | 92 px | 92 px | One word per line, always |
| `.previousnext-text-w` | width 27ch texto | 335 px | 100% | About 10 characters per line in the next title |
| `.previousnext-he` | height 3ch | 92 px | 75 px | Fixed height that longer titles overflow, towards the CTA |
| `.prize-coll-w` | max 23ch; ≤767: 32ch; ≤479: 24ch | 285 px | 238 px | Marquee column |
| `.contact-li-it` | min 50ch display | 598 px | 100% | Label and value share the row |
| `.policy-rich-tx p`, `ul` | max 60ch texto | 595 px | 100% | Free running text |
| `.sound-toggle-tx` | width 10ch | 107 px | 107 px | Bundle writes `SOUND ON` / `SOUND OFF` here |


## 5. Real titles

All 14 titles you listed were run through the real split, plus the other 7 real ones and a short form of the double feature. In 5.1, a home title takes 72 px per visible row, so one listed with 2 lines at 217 px has a word broken in two. The gaps depend on the Siena award of the card that was centred. The usual card has a 2-row award; a few runs caught the card without award text (Bugonia 275 today, Pulp Fiction 168 with the candidate), so compare lines first.

| Title | Today | With section 6 |
|---|---|---|
| O Lagosta | Home: "O" alone on line 1, because 412 px does not fit in 395. Hero: 1 line with a rule through it (slug has 16 chars) | Home: 1 line. Hero: needs 6.3 |
| Vivarium | Fine on every slot, except the rule through the hero title (slug has 13). Under 10 chars, so the FOOTAGE shift applies: measured top 842, bottom 870 of 900 | Hero: 6.3 |
| Bugonia | Fine. Slug has 12, so the rule is hidden correctly | Same |
| Sem Limites | Home: 2 lines. Hero: 1 line with the rule through it | Home: 1 line at 452 px. Hero: 6.3 |
| Doutor Sono | 2 lines everywhere; 3 rules fall right, the middle one between the lines | 2 lines at desktop, 1 at 390 |
| De Olhos Bem Fechados | 3 lines, gap 32 px under a 2-row award | Same 3 lines at full size; 2 at 390 and at 720 tall. Gap 150 px once the laurel goes |
| Bastardos Inglórios | **`BASTARDO / S / INGLÓRIOS`** at 1440: three rows. The Ó is clipped | 2 lines, Ó whole |
| Os Oito Odiados | 2 lines, fine | Same; 1 line at 720 tall |
| O Mistério de Silver Lake | 4 rows with "O" alone, gap 0 to the award. The É is clipped | 4.6rem: 2 lines, gap 130 px |
| Pulp Fiction: Tempo de Violência | 4 rows, gap 0. The Ê is clipped. Next card at 390: -11 px. FOOTAGE bar: line 4 cut by the window | 4.6rem: 3 lines, gap about 70 px. Next: fits. FOOTAGE: 3 lines inside |
| Verdade e Traição | 2 lines, `TRAIÇÃO` loses cedilla and tilde. "Verdade e" is 393 px of 395 | 2 lines, accents whole |
| Aquilo que Você Deseja | 3 lines. The Ê is clipped | 3 lines at desktop, 2 at 390, Ê whole |
| Manual Prático da Vingança Lucrativa | **`MANUAL / PRÁTICO / DA / VINGANCA / LUCRATIV / A`**: six rows, callouts 73 px under the card. Ticket: line 4 cut. Next at 390: -44 px. FOOTAGE bar: line 4 cut | 4rem: 3 lines, gap 96 px. Next: fits. FOOTAGE: 3 lines. Ticket: needs the short title |
| Casamento Sangrento + Casamento Sangrento: A Viúva | 725 px tall, callouts 363 px under the card, ticket cut, next -77 px at 390 | Still too long at 720 tall and 360 wide (gap 0), ticket still cut: use the short form |
| Casamento Sangrento + A Viúva (short form) | Not run on the current CSS | 3 lines on every size tested, gap 71 px at 1440, FOOTAGE inside the window |


### 5.1 Home: today against the candidate CSS plus size tiers

"Gap" is the distance in px from the award block (desktop) or the mobile reviews (390) to the eyebrow above the title. 0 means they touch or overlap. At 1440 the gap includes the Siena laurel still in the build.

| Title | n | 1440 today | gap | 1440 candidate | gap | 390 today | gap | 390 candidate | gap |
|---|---|---|---|---|---|---|---|---|---|
| O Lagosta | 9 | O / Lagosta (145 px) | 105 | 89.6px: O Lagosta | 177 | O Lagosta | 314 | O Lagosta | 314 |
| Vivarium | 8 | Vivarium (72 px) | 177 | 89.6px: Vivarium | 177 | Vivarium | 314 | Vivarium | 314 |
| Bugonia | 7 | Bugonia (72 px) | 275 | 89.6px: Bugonia | 177 | Bugonia | 314 | Bugonia | 314 |
| Sem Limites | 11 | Sem / Limites (145 px) | 105 | 89.6px: Sem Limites | 177 | Sem Limites | 314 | Sem Limites | 314 |
| Doutor Sono | 11 | Doutor / Sono (145 px) | 105 | 89.6px: Doutor / Sono | 105 | Doutor / Sono | 276 | Doutor Sono | 314 |
| De Olhos Bem Fechados | 21 | De Olhos / Bem / Fechados (217 px) | 95 | 89.6px: De Olhos / Bem / Fechados | 32 | De Olhos / Bem / Fechados | 237 | De Olhos Bem / Fechados | 276 |
| Bastardos Inglórios | 19 | Bastardos / Inglórios (217 px) | 35 | 89.6px: Bastardos / Inglórios | 105 | Bastardos / Inglórios | 276 | Bastardos / Inglórios | 276 |
| Os Oito Odiados | 15 | Os Oito / Odiados (145 px) | 105 | 89.6px: Os Oito / Odiados | 105 | Os Oito / Odiados | 276 | Os Oito / Odiados | 276 |
| O Mistério de Silver Lake | 25 | O / Mistério / de Silver / Lake (290 px) | 0 | 73.6px: O Mistério de / Silver Lake | 130 | O Mistério / de Silver / Lake | 237 | O Mistério de / Silver Lake | 276 |
| Pulp Fiction: Tempo de Violência | 32 | Pulp / Fiction: / Tempo de / Violência (290 px) | 0 | 73.6px: Pulp Fiction: / Tempo de / Violência | 168 | Pulp / Fiction: / Tempo de / Violência | 199 | Pulp Fiction: / Tempo de / Violência | 237 |
| Verdade e Traição | 17 | Verdade e / Traição (145 px) | 105 | 89.6px: Verdade e / Traição | 105 | Verdade e / Traição | 276 | Verdade e / Traição | 276 |
| Aquilo que Você Deseja | 22 | Aquilo / que Você / Deseja (217 px) | 32 | 89.6px: Aquilo que / Você / Deseja | 32 | Aquilo que / Você / Deseja | 237 | Aquilo que / Você Deseja | 276 |
| Manual Prático da Vingança Lucrativa | 36 | Manual / Prático / da / Vingança / Lucrativa (435 px) | 0 | 64px: Manual Prático / da Vingança / Lucrativa | 96 | Manual / Prático da / Vingança / Lucrativa | 199 | Manual / Prático da / Vingança / Lucrativa | 199 |
| Casamento Sangrento + Casamento Sangrento: A Viúva | 50 | Casamento / Sangrento / + / Casamento / Sangrento: / A Viúva (725 px) | 0 | 54.4px: Casamento / Sangrento + / Casamento / Sangrento: A Viúva | 75 | Casamento / Sangrento / + / Casamento / Sangrento: / A Viúva | 122 | Casamento / Sangrento + / Casamento / Sangrento: A / Viúva | 161 |
| Casamento Sangrento + A Viúva | 29 | n/a |  | 73.6px: Casamento / Sangrento + A / Viúva | 71 | n/a |  | Casamento / Sangrento + / A Viúva | 237 |
| Django Livre | 12 | n/a |  | 89.6px: Django / Livre | 105 | n/a |  | Django Livre | 314 |
| O Senhor das Armas | 18 | n/a |  | 89.6px: O Senhor / das Armas | 105 | n/a |  | O Senhor das / Armas | 276 |
| V de Vingança | 13 | n/a |  | 89.6px: V de / Vingança | 105 | n/a |  | V de Vingança | 314 |
| Obsessão | 8 | n/a |  | 89.6px: Obsessão | 177 | n/a |  | Obsessão | 314 |
| The Menu | 8 | n/a |  | 89.6px: The Menu | 177 | n/a |  | The Menu | 314 |
| The Long Walk | 13 | n/a |  | 89.6px: The Long / Walk | 105 | n/a |  | The Long / Walk | 276 |
| The Running Man | 15 | n/a |  | 89.6px: The / Running / Man | 32 | n/a |  | The Running / Man | 276 |

### 5.2 Home with the candidate at other sizes

| Title | 1920x1080 | gap | 1280x720 | gap | 360x740 | gap |
|---|---|---|---|---|---|---|
| O Lagosta | 89.6px: O Lagosta | 330 | 57.6px: O Lagosta | 168 | 48px: O Lagosta | 191 |
| Vivarium | 89.6px: Vivarium | 330 | 57.6px: Vivarium | 168 | 48px: Vivarium | 191 |
| Bugonia | 89.6px: Bugonia | 428 | 57.6px: Bugonia | 168 | 48px: Bugonia | 191 |
| Sem Limites | 89.6px: Sem Limites | 330 | 57.6px: Sem Limites | 168 | 48px: Sem Limites | 191 |
| Doutor Sono | 89.6px: Doutor / Sono | 258 | 57.6px: Doutor Sono | 168 | 48px: Doutor / Sono | 153 |
| De Olhos Bem Fechados | 89.6px: De Olhos / Bem / Fechados | 185 | 57.6px: De Olhos Bem / Fechados | 122 | 48px: De Olhos / Bem / Fechados | 114 |
| Bastardos Inglórios | 89.6px: Bastardos / Inglórios | 355 | 57.6px: Bastardos / Inglórios | 122 | 48px: Bastardos / Inglórios | 153 |
| Os Oito Odiados | 89.6px: Os Oito / Odiados | 258 | 57.6px: Os Oito Odiados | 168 | 48px: Os Oito / Odiados | 153 |
| O Mistério de Silver Lake | 73.6px: O Mistério de / Silver Lake | 283 | 57.6px: O Mistério de / Silver Lake | 122 | 48px: O Mistério / de Silver / Lake | 114 |
| Pulp Fiction: Tempo de Violência | 73.6px: Pulp Fiction: / Tempo de / Violência | 224 | 57.6px: Pulp Fiction: / Tempo de / Violência | 75 | 48px: Pulp / Fiction: / Tempo de / Violência | 76 |
| Verdade e Traição | 89.6px: Verdade e / Traição | 258 | 57.6px: Verdade e / Traição | 122 | 48px: Verdade e / Traição | 153 |
| Aquilo que Você Deseja | 89.6px: Aquilo que / Você / Deseja | 185 | 57.6px: Aquilo que Você / Deseja | 122 | 48px: Aquilo que / Você Deseja | 153 |
| Manual Prático da Vingança Lucrativa | 64px: Manual Prático / da Vingança / Lucrativa | 249 | 57.6px: Manual Prático / da Vingança / Lucrativa | 75 | 48px: Manual / Prático da / Vingança / Lucrativa | 76 |
| Casamento Sangrento + Casamento Sangrento: A Viúva | 54.4px: Casamento / Sangrento + / Casamento / Sangrento: A Viúva | 228 | 57.6px: Casamento / Sangrento + / Casamento / Sangrento: A / Viúva | 0 | 48px: Casamento / Sangrento / + / Casamento / Sangrento: / A Viúva | 0 |
| Casamento Sangrento + A Viúva | 73.6px: Casamento / Sangrento + A / Viúva | 224 | 57.6px: Casamento / Sangrento + A / Viúva | 75 | 48px: Casamento / Sangrento / + A Viúva | 114 |
| Django Livre | n/a |  | n/a |  | n/a |  |
| O Senhor das Armas | n/a |  | n/a |  | n/a |  |
| V de Vingança | n/a |  | n/a |  | n/a |  |
| Obsessão | n/a |  | n/a |  | n/a |  |
| The Menu | n/a |  | n/a |  | n/a |  |
| The Long Walk | n/a |  | n/a |  | n/a |  |
| The Running Man | n/a |  | n/a |  | n/a |  |

### 5.3 The other title slots, today (no CSS change)

Work: lines, widest line in px (box 258 at desktop, 215 at 390). Hero: the lines as split, and the height left for the hero image at 900 tall. Ticket: lines, content/box height. Small panel: lines, widest line. Next: lines, px left to the CTA, negative means overlap.

| Title | Work 1440 | Work 390 | Hero 1440 and 390 | Image | Hero 390 if different | Ticket | Small | Next 1440 | Next 390 |
|---|---|---|---|---|---|---|---|---|---|
| O Lagosta | 1, 216 | 1, 180 | O Lagosta | 673 | same | 1, 77/77 | 1, 62 | 1, 189 | 1, 56 |
| Vivarium | 1, 189 | 1, 158 | Vivarium | 673 | same | 1, 77/77 | 1, 53 | 1, 189 | 1, 56 |
| Bugonia | 1, 177 | 1, 147 | Bugonia | 673 | same | 1, 77/77 | 1, 51 | 1, 189 | 1, 56 |
| Sem Limites | 1, 242 | 1, 202 | Sem Limites | 673 | same | 1, 77/77 | 1, 69 | 2, 148 | 1, 56 |
| Doutor Sono | 2, 163 | 2, 135 | Doutor / Sono | 605 | same | 1, 77/77 | 1, 81 | 2, 148 | 1, 56 |
| De Olhos Bem Fechados | 3, 207 | 3, 172 | De Olhos / Bem / Fechados | 537 | same | 2, 77/77 | 1, 145 | 3, 107 | 2, 22 |
| Bastardos Inglórios | 2, 234 | 2, 195 | Bastardos / Inglórios | 605 | same | 2, 77/77 | 1, 130 | 2, 148 | 2, 22 |
| Os Oito Odiados | 2, 174 | 2, 145 | Os Oito / Odiados | 605 | same | 2, 77/77 | 1, 97 | 2, 148 | 2, 22 |
| O Mistério de Silver Lake | 3, 221 | 3, 184 | O Mistério / de Silver / Lake | 537 | same | 2, 77/77 | 1, 152 | 3, 107 | 2, 22 |
| Pulp Fiction: Tempo de Violência | 4, 205 | 4, 171 | Pulp Fiction: / Tempo de / Violência | 537 | same | 3, 77/77 | 2, 136 | 4, 66 | 3, -11 |
| Verdade e Traição | 2, 211 | 2, 176 | Verdade e / Traição | 605 | same | 2, 77/77 | 1, 113 | 2, 148 | 2, 22 |
| Aquilo que Você Deseja | 3, 231 | 3, 192 | Aquilo que / Você Deseja | 605 | same | 2, 77/77 | 1, 145 | 3, 107 | 2, 22 |
| Manual Prático da Vingança Lucrativa | 4, 229 | 4, 190 | Manual / Prático da / Vingança / Lucrativa | 468 | same | 4, 88/77 | 2, 174 | 4, 66 | 4, -44 |
| Casamento Sangrento + Casamento Sangrento: A Viúva | 6, 250 | 6, 208 | Casamento / Sangrento + / Casamento / Sangrento: / A Viúva | 400 | same | 5, 106/77 | 3, 154 | 6, -16 | 5, -77 |
| Casamento Sangrento + A Viúva | 3, 244 | 3, 204 | Casamento / Sangrento + / A Viúva | 537 | same | 3, 77/77 | 2, 160 | 3, 107 | 3, -11 |
| Django Livre | 2, 161 | 2, 134 | Django / Livre | 605 | same | 1, 77/77 | 1, 81 | 2, 148 | 1, 56 |
| O Senhor das Armas | 2, 222 | 2, 185 | O Senhor / das Armas | 605 | same | 2, 77/77 | 1, 123 | 2, 148 | 2, 22 |
| V de Vingança | 2, 201 | 2, 167 | V de / Vingança | 605 | same | 2, 77/77 | 1, 85 | 2, 148 | 1, 56 |
| Obsessão | 1, 208 | 1, 173 | Obsessão | 673 | same | 1, 77/77 | 1, 61 | 1, 189 | 1, 56 |
| The Menu | 1, 195 | 1, 163 | The Menu | 673 | same | 1, 77/77 | 1, 57 | 1, 189 | 1, 56 |
| The Long Walk | 2, 188 | 2, 157 | The Long / Walk | 605 | same | 2, 77/77 | 1, 88 | 2, 148 | 1, 56 |
| The Running Man | 2, 258 | 2, 215 | The Running / Man | 605 | same | 2, 77/77 | 1, 102 | 3, 107 | 2, 22 |

### 5.4 Short laptop and large desktop (today)

| Title | Work 1280x720: font, lines, widest, card | Hero 1280x720: lines, image | Next 1280: lines, gap | Work 1920: lines | Hero 1920: lines, image |
|---|---|---|---|---|---|
| Casamento Sangrento + A Viúva | 36px, 3, 183, 230x377 | 3, 357 | 3, 70 | 3 | 3, 717 |
| Bugonia | 36px, 1, 132, 230x377 | 1, 493 | 1, 152 | 1 | 1, 853 |
| Doutor Sono | 36px, 2, 122, 230x377 | 2, 425 | 2, 111 | 2 | 2, 785 |
| O Mistério de Silver Lake | 36px, 3, 166, 230x377 | 3, 357 | 3, 70 | 3 | 3, 717 |
| Pulp Fiction: Tempo de Violência | 36px, 4, 154, 230x377 | 3, 357 | 4, 29 | 4 | 3, 717 |
| Manual Prático da Vingança Lucrativa | 36px, 4, 171, 230x377 | 4, 288 | 4, 29 | 4 | 4, 648 |
| Casamento Sangrento + Casamento Sangrento: A Viúva | 36px, 6, 187, 230x377 | 5, 220 | 6, -53 | 6 | 5, 580 |


### 5.5 Work FOOTAGE bar (`flip2.cjs`, `g.cjs`)

The title moves into `.roll-cont-item.mark.first` at scale .75 and grows down from a fixed top. Widths below are on screen.

| Title | 1440x900 today | 1920x1080 today | With 6.2: 1440 | 1920 | 1280x720 |
|---|---|---|---|---|---|
| Doutor Sono | 2 lines, bottom 868 of 900 | 2 lines, 1033 of 1080 | unchanged | unchanged | 1 line, 667 of 720 |
| Casamento Sangrento + A Viúva | 3 lines, 895 of 900 | 3 lines, 1061 of 1080 | 3 lines, 872 | 1038 | 709 |
| Pulp Fiction: Tempo de Violência | **4 lines, 923 of 900** | **4 lines, 1089 of 1080** | 3 lines, 872 | 1038 | 709 |
| Manual Prático da Vingança Lucrativa | **4 lines, 923 of 900** | **4 lines, 1089 of 1080** | 3 lines, 872 | 1038 | 709 |

The callouts beside the title start at x = 401 or more and the title ends at x = 319, so they do not meet. Screens: `shots/flip-ManualP.png` (today), `shots/G-flip-1440-Manual.png` (candidate).


## 6. Recommended CSS, without touching the base structure

All of it goes in `tema-sinal.css` as a new block after 3c. No selector of the bundle changes, the DOM stays the same except for the attributes in 6.3, and each rule was injected in the test browser only. The rules are not on disk in the project.

### 6.1 Titles and clipped accents (block 3d)

```css
/* 3d. Títulos e acentos do português */

/* Título da home. A caixa sai da coluna de 33ch, centrada sobre ela: cabe uma palavra de 10 letras. */
@media (min-width: 768px) { .roll-cont-he.home { width: 29rem; max-width: 29rem; } }
@media (min-width: 768px) and (max-width: 991px) { .roll-cont-he.home { font-size: 4.6rem; width: 26rem; max-width: 26rem; } }
@media (max-width: 479px) { .roll-cont-he.home { width: 100%; max-width: 100%; } }
/* Depois do split cada letra é um inline-block: sem isto, a palavra quebra entre letras. */
.split-line-wrapper .split-line-move { white-space: nowrap; }

/* A caixa de recorte de cada letra cresce só para o recorte, com margem negativa: a linha não muda.
   O .079em desfaz o efeito do y:18% do bundle, que passa a medir a caixa maior. */
.split-line-move > .split-rollover { padding-block: .2em .24em; margin-block: -.2em -.24em; }
.split-line-move .originalText2, .split-line-move .cloneText2 { padding-block: .2em .24em; }
.split-line-move .originalText2 { margin-block: -.2em -.24em; position: relative; top: -.079em; }
.split-line-move .cloneText2 { top: calc(100% - .079em); }

/* O mesmo para as outras caixas que recortam texto */
.footer-of-w, .footer-of-w.last { height: 1.12em; padding-top: .3em; padding-bottom: .2em; margin-block: -.22em -.2em; }
.about-he .span-clip { display: block; padding-block: .28em .22em; margin-block: -.28em -.22em; }
._404-line { display: flow-root; }
._404-line .ovfl-hidden { height: calc(1.5em + 18px); padding-top: calc(.15em + 10px); padding-bottom: 8px; margin-block: -10px -8px; }
.menu-text-title-w { padding-top: 4px; margin-top: -4px; }
```

Why this shape:

- `29rem` is fixed, not in `em`, so a smaller title gets more letters per line instead of the same breaks. The tablet band exists because 29rem at 820 px wide runs 13 px into the reviews column; with it the title ends at x = 514 and the reviews start at 525. At 1440 it overflows the 395 px column by 34 px per side and stays inside the card (`Sangrento + A` at 462 px starts at x = 77, the card at x = 65).
- `white-space:nowrap` is a guard. With the wider box no tested word reaches it, and it applies only after the split, since the class arrives with SplitText.
- The padding on the letter boxes changes the distance the roll moves, and `yPercent:-=100` follows it, so the loop still closes exactly: the clone sits one full box below, then replaces the original. The rest position was checked by eye at 2x. The rolling itself runs, but I only saw it in stills.
- Accents of a lower line touch the bottom of the line above. That is the .77em leading of the design, not the clip. It is legible: `accents/candDlive-home-title.png`.
- `.contact-h-of` is left out on purpose. Its letters end up as clones with the originals one box above, and a larger window shows them. Use plain words in that slot.

### 6.2 Other fit rules

```css
/* Cartão "próximo" no celular: a caixa de texto cresce e a imagem cede, em vez de o título invadir o CTA */
@media (max-width: 767px) { .previousnext-text-w { height: auto; min-height: 42%; } .previousnext-he { height: auto; } }
/* Linha de baixo do ingresso: cabe um gênero de 20 letras */
.info-grid-tx { padding-left: .5rem; padding-right: .5rem; }
/* Título das páginas legais no celular: PRIVACIDADE cabe */
@media (max-width: 479px) { .policy-rich-tx h1 { font-size: 13vw; } }
/* Barra do modo FOOTAGE no Work: títulos longos ficam dentro da janela (--titulo-flip vem do dado, 6.3) */
.roll-cont-item.mark.first .roll-cont-he.work { width: 16.1rem; font-size: calc(var(--text-h3) * var(--titulo-flip, 1)); }
```

Measured with these rules injected:

- **Next card at 390 and 360:** the 5-line double title gets a 282 px text panel, a 166 px image and 14 px to the CTA; the card stays at 448 px.
- **Ticket row:** "Suspense Psicológico" gives cells of 133 + 40 + 64 = 237 px, an exact fit in the 237 px row.
- **Legal H1 at 390:** "PRIVACIDADE" is 293 px at 50.7 px, inside the screen. The other two titles shrink with it.
- **FOOTAGE bar:** section 5.5. At 720 tall the bundle's `5vh !important` wins over the variable, and the fixed width alone brings long titles to 3 lines.

Long titles in the ticket have no safe CSS-only answer at 3 lines. Use a short title field (below). If the field is rejected, `.top-m-film-title { display:-webkit-box; -webkit-box-orient:vertical; -webkit-line-clamp:3; overflow:hidden }` cuts cleanly with an ellipsis, but I did not test it.

### 6.3 Per-film values to emit from the data

No new element, only attributes, computed at build time from the single data source:

| What | How | Value |
|---|---|---|
| Home title size | Inline custom property on the `h2`: `style="--text-h1:4.6rem"`. `.roll-cont-he` already reads it, `[data-page=home] h2` (8vh on short screens) and `.roll-cont-he.home` (3rem on phones) still win where they should | Up to 24 characters: none. 25-32: `4.6rem`. 33-40: `4rem`. More: use the short title. `De Olhos Bem Fechados` (21) stays in 3 lines at full size with a 32 px gap, and 150 px once the laurel goes |
| FOOTAGE title size | Inline `style="--titulo-flip:.72"` on the Work `h2` | Titles that take 4 lines or more in Work: tested with Pulp Fiction, Manual and the short double form |
| Short title | New optional field, used by the ticket, the small panel, the next card and the home title of the double feature | "Casamento Sangrento + A Viúva" (29): 3 lines everywhere tested. "Manual Prático da Vingança Lucrativa" could keep its full form on the home page and hero, and needs a form of 30 or fewer for the ticket: the owner decides, none is proposed here |
| Hero rules | `data-linhas` on `[data-cs=lines]`, the line count measured once for each title at build or by hand, with `[data-cs=lines][data-linhas="1"] > .line:nth-child(3){display:none!important}` and `[data-cs=lines][data-linhas="2"] > .line:nth-child(3){display:block!important}` | `.cs-title` scales its box with the font, so the count does not change with the width. Simpler alternative: one rule that always hides the third line, which keeps top and bottom for every film |

### 6.4 What to do at each size, title by title

- **Desktop, 89.6 px:** Vivarium, Bugonia, O Lagosta, Sem Limites, Obsessão, The Menu on 1 line; Doutor Sono, Bastardos Inglórios, Os Oito Odiados, Verdade e Traição, Django Livre, O Senhor das Armas, V de Vingança, The Long Walk on 2; De Olhos Bem Fechados, Aquilo que Você Deseja, The Running Man on 3.
- **390 px, 48 px, full width of 294 px:** the same breaks or fewer lines. Nothing overflows, including the full double title at 5 lines, gap 161 px at 844 tall. At 360x740 that one reaches gap 0, so use the short title.
- **Home at 720 tall:** 8vh wins over the inline property, so everything renders at 57.6 px; the full double title reaches gap 0 with the laurel still present.


## 7. Not verified

- **Real phones and real Chrome, Brave, Safari.** All measurements are headless Edge. `overflow`, `padding` and `flow-root` are safe across browsers, but nothing was run on Safari.
- **Mobile user agent.** `B.isMobile` branches did not run: the FOOTAGE title shift on phones and the drag handlers.
- **The roll in motion with the 6.1 rules.** I checked the rest state at 2x and saw stills of the running roll. Whether the loop looks right at speed needs a person watching it.
- **Tablet widths:** the home title was measured at 820 and 1024 px only. Other slots at 768 to 1023 px were not measured.
- **Height between 751 and 890 px**: only derived from the rules (`1.2rem` quotes), not measured. 900 tall is the tightest case I measured for the review column.
- **Footage panel with long text over the ticket edge**, and the Case panel opened on screen: heights were read from the layout while closed.
- **404 at 390:** the crop `accents/candE390-404.png` was reviewed for accents only; the 24 px clip box there is smaller than at desktop.
- **Tutorial accents on line 1** of the 20 px clip box: lines were counted, the crop was not inspected.
- **Budget for 21 real films in the footage and case panels:** no one has written the copy yet, so those are limits, not results.
- **Small-panel scroll:** the overflow is measured. The fix (a `max-height` with `overflow-y:auto` and `data-lenis-prevent`) is not tested here.
- **The 21-card roll** used 12 cloned cards to read the starting index. Nothing else about 21 cards (WebGL load, performance, the scroll ruler) was evaluated.
- **The Portuguese test strings** are only for measuring. None is proposed copy, and the mappings such as "Sala 24" in the Location row are examples of length.
