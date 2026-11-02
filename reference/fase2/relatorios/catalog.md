# FHDOG catalogue inventory (Fase 2)

Source repo: `C:/Users/Usuario/Desktop/Projetos/FHDOG` (HEAD `72789e8`, 2026-10-05, clean). Live: https://filmeshdonlinegratis.vercel.app/ fetched 2026-10-31 23:29 UTC (20:29 in Sao Paulo).
Machine-readable output: `catalog-raw.json` in this folder (21 sessions, 22 features, sorted by start; `derived` is my addition: UTC start, weekday in America/Sao_Paulo, total runtime, computed end). Values are exactly as in the files, corrections are NOT applied there.

File paths below are relative to the source repo unless they start with `replica:` (= `C:/Users/Usuario/Desktop/FHDOG`). `ui/` and `islands/` are short for `src/components/ui/` and `src/components/islands/`; film files are in `src/content/films/`.

## 0. What matters most

1. **Count is right: 21 sessions, 22 films.** The double feature is one session with two films, so "every film gets a trailer" means 22 trailers.
2. **The catalogue ends tonight.** The last session is `the-hateful-eight-2015`, 2026-10-31 20:30, on air at the time of writing, computed end 23:18. From then on no future session exists, and "next session first" has nothing to show until the owner adds one. The order rule then falls through to "newest past first" (see 3.2). With the real clock, the order will not change at all from now until a new file is added, so **dynamic ordering can only be tested with a fake clock**.
3. **Two sessions identify the wrong film, in ways the site visitor does not see but a trailer search will hit:**
   - `the-inheritance-2025`: file says "Dan Berk & Robert Olsen", 2025, 99 min. The plot and character name in its own body (Becket Redfellow) belong to *How to Make a Killing* (2026), directed by John Patton Ford, about 105 min (web sources). **The director and year in the file look wrong**, and the slug names a different film.
   - `truth-treachery-2026`: the real title is *Truth & Treason* (2025, Matt Whitaker). "Treachery" in the slug is wrong, so is "2026". `year: 2025` in the feature is right.
4. **No trailer data anywhere in the repo.** Only an empty `trailer_url` database column and an admin field. Zero video IDs.
5. **All 21 images are landscape stills, none is a poster.** 11 of 21 are under 800 px wide, the smallest is 306x150. Siena needs a 1920 px hero, a 1212x1848 portrait poster and gallery strips per film. There is one image per session.
6. **Live site matches the repo on every field, but its states are frozen at build time (2026-10-05).** It still announces The Lobster (Oct 17) as next. This is the exact bug the browser-side ordering decision avoids.
7. **Published text has paste defects:** `:contentReference[oaicite:0]{index=0}` visible on the double-feature page (`ready-or-not-double-feature-2026.md:89`) and a stray code fence in 5 files that renders an empty `<pre>` on live.

## 1. Inventory, sorted by start

Weekday computed with `Intl` in `America/Sao_Paulo` from `<date>T<time>:00-03:00`. All rooms are "Sala 24". Bar = `tone` passed through `barFor()` in `src/lib/smpte.ts:91`.

| # | date | weekday | start | slug | film (year) | director | min | rating | tone, bar |
|---|---|---|---|---|---|---|---|---|---|
| 1 | 2026-04-18 | sab | 20:30 | the-long-walk-2025 | The Long Walk (2025) | Francis Lawrence | 108 | 16 | #C93C3C red |
| 2 | 2026-04-25 | sab | 20:30 | the-running-man-2026 | The Running Man (2025) | Edgar Wright | 137 | 16 | #FF3B30 red |
| 3 | 2026-06-13 | sab | 20:30 | vivarium-2019 | Vivarium (2019) | Lorcan Finnegan | 97 | 14 | #7BAF7A green |
| 4 | 2026-06-27 | sab | 20:30 | inglourious-basterds-2009 | Bastardos Inglórios (2009) | Quentin Tarantino | 153 | 18 | #8B1E1E red |
| 5 | 2026-06-30 | **ter** | 20:30 | the-menu-2022 | The Menu (2022) | Mark Mylod | 107 | 16 | #C46B2A red |
| 6 | 2026-07-02 | **qui** | 20:30 | obsession-2026 | Obsessão (2025) | Curry Barker | 108 | 18 | #5B0F18 red |
| 7 | 2026-07-04 | sab | 20:30 | v-for-vendetta-2005 | V de Vingança (2005) | James McTeigue | 132 | 16 | #A31222 red |
| 8 | 2026-07-11 | sab | 20:30 | lord-of-war-2005 | O Senhor das Armas (2005) | Andrew Niccol | 122 | 16 | #6B4A2B red |
| 9 | 2026-07-16 | **qui** | 20:30 | what-you-wish-for-2023 | Aquilo que Você Deseja (2023) | Nicholas Tomnay | 102 | 16 | #4B2E1F red |
| 10 | 2026-07-18 | sab | 20:30 | bugonia-2025 | Bugonia (2025) | Yorgos Lanthimos | 118 | 18 | #556B2F yellow |
| 11 | 2026-07-25 | sab | **19:30** | ready-or-not-double-feature-2026 | Casamento Sangrento (2019) at 19:30 + Casamento Sangrento: A Viúva (2026) at 21:30 | Matt Bettinelli-Olpin & Tyler Gillett | 95 + 108 | none | #8B0000 red |
| 12 | 2026-08-08 | sab | 20:30 | truth-treachery-2026 | Verdade e Traição (2025) | Matt Whitaker | 121 | 16 | #4A4A4A white |
| 13 | 2026-08-15 | sab | 20:30 | the-inheritance-2025 | Manual Prático da Vingança Lucrativa (2025) | Dan Berk & Robert Olsen | 99 | 16 | #7A4B1F red |
| 14 | 2026-08-22 | sab | 20:30 | limitless-2011 | Sem Limites (2011) | Neil Burger | 105 | 14 | #2E5FA8 blue |
| 15 | 2026-08-29 | sab | 20:30 | eyes-wide-shut-1999 | De Olhos Bem Fechados (1999) | Stanley Kubrick | 159 | 18 | #A0288F magenta |
| 16 | 2026-09-05 | sab | 20:30 | django-unchained-2012 | Django Livre (2012) | Quentin Tarantino | 165 | 16 | #C98A16 yellow |
| 17 | 2026-09-19 | sab | 20:30 | doctor-sleep-2019 | Doutor Sono (2019) | Mike Flanagan | 152 | 16 | #33507A blue |
| 18 | 2026-09-26 | sab | 20:30 | under-the-silver-lake-2018 | O Mistério de Silver Lake (2018) | David Robert Mitchell | 139 | 18 | #3FA9A5 cyan |
| 19 | 2026-10-17 | sab | 20:30 | the-lobster-2015 | O Lagosta (2015) | Yorgos Lanthimos | 119 | 16 | #4F7A4A green |
| 20 | 2026-10-24 | sab | 20:30 | pulp-fiction-1994 | Pulp Fiction: Tempo de Violência (1994) | Quentin Tarantino | 154 | 18 | #C8A23A yellow |
| 21 | 2026-10-31 | sab | 20:30 | the-hateful-eight-2015 | Os Oito Odiados (2015) | Quentin Tarantino | 168 | 18 | #8E9BA3 white |

Field presence: `kicker` is missing on #1 and #2 only. `rating` is missing on both films of #11 (the schema allows it, `src/content.config.ts:16`; any UI must handle "no rating"). `features[].time` exists only on #11. No file has a frontmatter key outside the schema.

## 2. Schedule check against "Saturday 20:30"

**17 of 21 follow the pattern. 4 exceptions:**

| slug | what differs |
|---|---|
| the-menu-2022 | Tuesday 2026-06-30, 20:30 |
| obsession-2026 | Thursday 2026-07-02, 20:30 |
| what-you-wish-for-2023 | Thursday 2026-07-16, 20:30 |
| ready-or-not-double-feature-2026 | Saturday, starts 19:30; second film 21:30 |

The site still claims the pattern in fixed copy: `src/pages/programacao.astro:55`, `src/pages/index.astro:66`, `src/pages/sobre.astro:52` and `:127`, `src/lib/site.ts:49` and `:53`. Date and time must come from each session, never from this copy.

**11 Saturdays between the first and last session have no session:** May 2, 9, 16, 23, 30; Jun 6, 20; Aug 1; Sep 12; Oct 3, 10. No file for May at all. So "uma sessão por sábado" is a description of intent, not of the record.

### 2.1 End time

**No explicit end time exists anywhere**: not in the schema (`src/content.config.ts:44-50`), not in any file, not in the seeds. End is derived as start + total runtime (`src/lib/catalog.ts:48,56`).

**That derivation is wrong for the double feature.** `catalog.ts` gives 22:53 (19:30 + 203 min, ignoring the 25-minute break). The per-film times give 23:18 (21:30 + 108). The live JSON-LD publishes the wrong value. The replica should use the latest `feature.time + runtime`.

No end time includes credits, chat or a margin, so "on air" is an estimate.

### 2.2 Ordering rule and test fixtures

Proposed rule, same shape as `featuredSession()` (`src/lib/catalog.ts:77-83`) but run in the browser: on-air first, then future ascending, then past descending by start. The owner's brief does not name the on-air case; I placed it first because the existing site does and because the session in progress is what a visitor needs. Compare instants built with the explicit offset (`Date.parse('2026-10-31T20:30:00-03:00')`), never `new Date('2026-10-31')`, which is midnight UTC and lands on the previous evening in Sao Paulo (warned about at `src/lib/format.ts:4-12`).

| fake now (-03:00) | on air | future | past | first three in order |
|---|---|---|---|---|
| 2026-07-01 12:00 | 0 | 16 | 5 | obsession, v-for-vendetta, lord-of-war (past starts: the-menu, inglourious, vivarium) |
| 2026-07-25 23:00 | ready-or-not (only with the corrected end) | 10 | 10 | ready-or-not, truth-treachery, the-inheritance |
| 2026-10-31 12:00 | 0 | 1 | 20 | hateful-eight, pulp-fiction, the-lobster |
| 2026-10-31 21:00 | hateful-eight | 0 | 20 | hateful-eight, pulp-fiction, the-lobster |
| 2026-11-01 00:00 | 0 | 0 | 21 | hateful-eight, pulp-fiction, the-lobster |

The last three rows give the same order and differ only in the label, which is why the label must also be computed (next / on air / last shown).

Full order for 2026-07-01: obsession-2026, v-for-vendetta-2005, lord-of-war-2005, what-you-wish-for-2023, bugonia-2025, ready-or-not-double-feature-2026, truth-treachery-2026, the-inheritance-2025, limitless-2011, eyes-wide-shut-1999, django-unchained-2012, doctor-sleep-2019, under-the-silver-lake-2018, the-lobster-2015, pulp-fiction-1994, the-hateful-eight-2015, the-menu-2022, inglourious-basterds-2009, vivarium-2019, the-running-man-2026, the-long-walk-2025.

Trap for whoever implements the highlight: Siena's intro spin does not land on index 0. Per `replica:docs/INVENTORY.md` (line 38 and d-3) it settles on `60 mod N` on `/` and `100 mod N` on `/work`. With N = 21 that is index 18 and index 16. "First highlight" needs either a rotation of the array or a change to those constants.

## 3. Comparison with the live site

Method: plain GET (`curl`/`fetch`) with no JavaScript executed, so the audience counter was not touched. Pages kept under `live/`.

- `/programacao/`: 21 rows, same 21 slugs, same order. **0 mismatches** on date, weekday, time, headline, film title + year, first 3 tags, total runtime, rating.
- All 21 `/sessoes/<slug>/`: HTTP 200. **0 mismatches** on `h1`, meta description, kicker, section headings, tags, JSON-LD (title, year, director, duration, rating, genres, start, end, room, room URL) and the room button.
- Stats on live: No arquivo 21, Sinais 23, Ainda vão ao ar **3**. Month groups: abril 2, junho 3, julho 6, agosto 4, setembro 3, outubro 3.
- RSS: 21 items, same data. Sitemap: 54 URLs (21 sessions, 23 tag pages, 10 others).
- Supabase seeds (`0003`, `0006`, `0008`): headline, summary, kicker, session instant, room URL and poster agree with the Markdown for all 21.

**The one real difference is time.** Every state is rendered with `new Date()` at build (`src/pages/programacao.astro:9`, `src/pages/sessoes/[slug].astro:43`, `src/pages/index.astro:11`). The build dates from 2026-10-05 (`sitemap-index.xml` lastmod `2026-10-05T13:59:43Z`, set at `astro.config.ts:101`; the `Last-Modified: 2026-10-30` response header is not the build date). Live therefore shows:

- The Lobster and Pulp Fiction as "Ainda vai ao ar" / "Agendada" although both have aired.
- The Hateful Eight as "Agendada" while it is starting.
- Home slate: "A próxima que passa · S-261017".
- "Ainda vão ao ar: 3" (true value now: 0).

## 4. Year and identity mismatches

The file name's year is not a release year in general: 3 of 21 disagree with the feature year.

| slug | file year | `features[].year` | what external sources say | verdict |
|---|---|---|---|---|
| obsession-2026 | 2026 | 2025 | TIFF premiere 2025, theatrical 2026-05-15. Runtime 108 or 109. | Both defensible. File is internally inconsistent: its kicker places the film in 2026 while the sheet says 2025. **Owner picks one.** |
| the-running-man-2026 | 2026 | 2025 | Released Nov 2025. **133 min** across several sources, file says **137**. Brazilian release title *O Sobrevivente*, file uses the English title. One cinema listing gives 18 anos, file says 16. | Feature year right, slug wrong. Fix runtime after checking; rating needs an official source. |
| truth-treachery-2026 | 2026 | 2025 | Title is ***Truth & Treason***. US opening Oct 2025; German release Feb 2026. 121 min in one source, 127 in another. | Feature year right. Slug has the wrong title and year. Search on "Treachery" will not find the trailer. |
| the-inheritance-2025 | 2025 | 2025 | Years agree, **but** the plot and the character Becket Redfellow are *How to Make a Killing* (2026), **John Patton Ford**, about 105 min. *Manual Prático da Vingança Lucrativa* appears as its Portuguese title in one database, not confirmed by a distributor. | **File's director, year, runtime and slug all look wrong.** Not a year quirk. Highest-priority data fix. |
| ready-or-not-double-feature-2026 | 2026 | 2019, 2026 | *Casamento Sangrento: A Viúva* confirmed as the Brazilian title of *Ready or Not 2: Here I Come* (2026). Runtime 104-108 across sources. AdoroCinema shows 18 anos. | File year = the sequel, fine. Ratings are absent; leave absent unless sourced. |

**Original titles for the trailer search (repo has no such field):** The Long Walk; The Running Man; Vivarium; Inglourious Basterds; The Menu; Obsession; V for Vendetta; Lord of War; What You Wish For; Bugonia; Ready or Not; Ready or Not 2: Here I Come; Truth & Treason; How to Make a Killing; Limitless; Eyes Wide Shut; Django Unchained; Doctor Sleep; Under the Silver Lake; The Lobster; Pulp Fiction; The Hateful Eight.

**Mixed title language:** The Long Walk, The Running Man, The Menu keep English titles while the rest use Brazilian ones. Not an error, just a thing for the owner to decide. I changed nothing.

**Slug policy needs a decision before anything is renamed.** `films.slug` is the key that `FilmActions` and `FilmNotes` use to find database rows, and `/sessoes/<slug>/` URLs are public and in the sitemap. Fixing `truth-treachery-2026` or `the-inheritance-2025` means a redirect and a database update.

Slug length: Siena hides the third hero line when the slug is under 13 characters (`replica:docs/INVENTORY.md` line 181). Only `bugonia-2025` (12) is under; `vivarium-2019` and `the-menu-2022` are exactly 13.

## 5. Room URLs

**No per-session difference.** All 21 sessions have room "Sala 24" and `https://discord.gg/B5DKdJuuWc`. The seeds agree.

There are **two different invites, same server**, checked on Discord's public invite endpoint without logging in:

| invite | used for | resolves to | expires |
|---|---|---|---|
| `B5DKdJuuWc` | every `session.roomUrl` | channel "Sala 24" (stage channel, type 13) | never |
| `wSSJEJAJgt` | `SITE.social.discord` (`src/lib/site.ts:61`), `README.md:271`, footer and Sobre | channel "regras-da-casa" (text) | never |

Both are valid, guild "Filmes HD Online Grátis". This looks deliberate: room button goes to the room, community link goes to the rules. Keep both. YouTube and Steam links answer 200.

## 6. Images

Three copies per session: `src/assets/films/` (what pages use), `public/posters/` (byte-identical, checked with `cmp`, used by the database-driven cards) and `public/og/<slug>.jpg` (1200x630, generated by `scripts/generate-social-images.mjs`: darkened still, SMPTE strip, headline, date and site name baked in).

I viewed all 21 on two contact sheets (`posters-sheet-1.png`, `posters-sheet-2.png`), and opened `truth-treachery`, `vivarium` and one OG card directly. **All are landscape stills, none is a poster.** The field is called `poster` but all `posterAlt` values say "Cena de ...". None has a title or logo baked in.

| slug | size | ratio | fmt | bytes | what it is |
|---|---|---|---|---|---|
| the-long-walk-2025 | 736x414 | 1.78 | jpg | 75501 | still |
| the-running-man-2026 | 736x414 | 1.78 | jpg | 28081 | still, close-up |
| vivarium-2019 | 1199x506 | 2.37 | jpg | 47409 | video-frame look, widest crop in the set |
| inglourious-basterds-2009 | 1013x678 | 1.49 | jpg | 143162 | posed publicity still |
| the-menu-2022 | 736x414 | 1.78 | jpg | 27360 | still |
| obsession-2026 | 736x414 | 1.78 | jpg | 32145 | still, close-up of a printed prop |
| v-for-vendetta-2005 | 1200x675 | 1.78 | jpg | 28858 | key-art look, mostly black |
| lord-of-war-2005 | 1200x796 | 1.51 | jpg | 162577 | still |
| what-you-wish-for-2023 | 500x310 | 1.61 | webp | 10700 | still, low resolution |
| bugonia-2025 | 500x334 | 1.50 | webp | 10450 | still, low resolution |
| ready-or-not-double-feature-2026 | 736x414 | 1.78 | jpg | 40425 | still; only one image for two films |
| truth-treachery-2026 | **306x150** | 2.04 | webp | 5748 | video frame, visibly soft at native size |
| the-inheritance-2025 | 500x281 | 1.78 | webp | 12328 | still, low resolution |
| limitless-2011 | 1200x643 | 1.87 | jpg | 68898 | still |
| eyes-wide-shut-1999 | 540x378 | 1.43 | jpg | 44484 | still, low resolution |
| django-unchained-2012 | 1200x771 | 1.56 | jpg | 77842 | still |
| doctor-sleep-2019 | 735x413 | 1.78 | jpg | 61011 | still |
| under-the-silver-lake-2018 | 825x463 | 1.78 | jpg | 56651 | publicity-style still |
| the-lobster-2015 | 1199x648 | 1.85 | jpg | 56054 | still |
| pulp-fiction-1994 | 1100x572 | 1.92 | jpg | 61567 | still |
| the-hateful-eight-2015 | 1200x731 | 1.64 | jpg | 172063 | still |

Size bands: under 800 px wide 11; 825 and 1013 one each; 1100 to 1200 eight. Nothing exceeds 1200.

Siena for comparison: hero 1920x1080, poster 1212x1848 (ratio 0.66), plus 13-25 gallery stills per strip. Siena does tolerate weak media (`thehousewife` is 576x288 and 190x281 with an empty gallery state), so the structure survives, but a full-bleed WebGL plane will show it. **The repo has none of: portrait posters, hi-res heroes, gallery stills, a second image for the double feature.** Those must be sourced, not generated, and licensing is the owner's call.

## 7. What each page and island does

| item | what it does | rendering | data |
|---|---|---|---|
| `src/pages/dossie.astro` | Tier-list tool: drag films (pointer events, arrow keys) into tiers S/A/B/C/D, add or remove tiers, search, export PNG at 3x from a hand-drawn canvas. Saves nothing (`:5-8`). Signed with site name and curator (`:567`). | static + client JS | catalogue embedded at build, images via `getImage` at 220 and 660 wide (`:31-32`) |
| `src/pages/mural.astro` + `islands/Mural.astro` | Public guestbook: name, optional site, "vibe" emoji, 500-char message. Moderated (`approved=false` at birth). Honeypot, 3 s minimum fill, 60 s cooldown (`Mural.astro:84-89,117-119`). Also hosts Audience. **No login needed**, despite being parked for the accounts phase. | static + Supabase REST from the browser | `mural_entries` |
| `src/pages/ranking.astro` | Participation table: watched, notes, ratings, favourites per user, from a view, top 100. Declared non-competitive. | **SSR** (`prerender=false`, `:21`) | `community_ranking` view, needs populated accounts |
| `src/pages/busca.json.ts` | Search index generated at build: title, headline, summary, href, short date, bar, accent-folded `terms` (titles, headline, summary, tags, director, year, genres). 13 KB live. | static | content files only |
| `src/pages/generos/index.astro`, `[slug].astro` | "Sinais" index with counts, one page per value with cards and links to others. **These are tags, not genres**: built from `tags` (`src/lib/catalog.ts:92-107`), not `features[].genres`. 23 values, including `indicação-da-semana` (20 of 21), `sessão-dupla`, `obscuro`. | static | content files only |
| `islands/Radio.astro` | Fixed dock with a Spotify playlist embed ("OST HD Online Grátis", id at `src/lib/site.ts:85`). iframe only after a click; preference in `localStorage` (`fhdog:radio`), requests autoplay on return visits (`:74,:149`). | client | third party, no account for the site |
| `islands/SearchPalette.astro` | Ctrl/Cmd+K `<dialog>` with ARIA listbox, loads `/busca.json` on first use, max 8 results, ignores queries under 2 characters. | client | content files only |
| `islands/Audience.astro` | 6-digit visit counter, used only on `/mural/`. POSTs `bump_audience` on every load (`:75-101`), incrementing once per tab via `sessionStorage`. Shows dashes on failure. No login. | client + Supabase RPC | `audience` |
| `islands/Calibration.astro` | Easter egg: Konami sequence overlays the 7-bar grid and viewport size (`:37-48`). Ignored while typing. | client | none |
| `islands/FilmActions.astro` | Favourite, "Assisti", **1 to 3 star rating** (`:36-55`). Optimistic writes. Needs login, shows an "Entre" link otherwise. | client + Supabase | `favorites`, `watched`, `ratings` |
| `islands/FilmNotes.astro` | One public note per person per film, 500 chars, edit own. Read is public via PostgREST, write needs login. | client + Supabase | `comments` |

Also found, relevant to scope:

- `islands/SessionMenu.astro`, `perfil/[username]`, `favoritos`, `assistidos`, `admin/*`, `auth/*`: all accounts. The last five are SSR. Login is Discord only (`README.md:161`).
- `src/lib/discord.ts` + `DISCORD_SESSION_WEBHOOK`: announces new sessions via a Discord webhook, server-side.
- `ui/SessionRules.astro:9-14`: four house rules, static. Useful on film pages.
- `ui/SessionSlate.astro`: the highlight with countdown; its copy for next / on air / last shown is at `:50-54`.

### 7.1 Accounts and database

| needs a login | needs a database, no login | needs neither |
|---|---|---|
| FilmActions, FilmNotes (write), SessionMenu, perfil, favoritos, assistidos, admin, auth | Mural (read and post), Audience, FilmNotes (read), Ranking (read) | Dossiê, busca.json, SearchPalette, gêneros, RSS, Radio (Spotify only), Calibration, Programação, Sobre, 404, SessionRules, FeatureSheet |

The replica has Astro as its only runtime dependency and `output: 'static'` (`replica:astro.config.mjs:7`). Everything in the third column fits that without an adapter.

**"No star ratings" has a long reach in the accounts phase.** Beyond FilmActions it touches `ui/LibraryList.astro:129`, `perfil/[username].astro:205`, `ranking.astro:43,55`, `lib/library.ts:61`, `lib/profiles.ts:87`, the `ratings` table and `rating_count` in the `community_ranking` and `film_stats` views (`supabase/migrations/0002_plataforma.sql:321-332,439,468`). Separately, the `rating` field in the sheets is the Brazilian age classification, not a star rating: it stays.

## 8. Proposed mapping into Siena

Rule used: Siena's structure stays, its slots get real FHDOG data, a slot with no real data uses the empty state Siena already has rather than invented content. These are proposals, nothing was built.

### Home roll and Work

| Siena slot | FHDOG source |
|---|---|
| Slide title `h2.roll-cont-he` | `features[].title`. **Not** `headline`: headlines reach 88 characters. Longest titles: 50 (double feature), 36, 32. Siena's longest is 22, and `main.css` has per-title offsets keyed on the first word. |
| Director / YEAR / CATEGORY callouts | `features[0].director`, `.year`, `.genres[0]`. Double feature's director string is 37 chars. |
| Eyebrow | Computed state + date, e.g. next / on air / last shown; `sessionCodeOf` style code is optional. |
| Award block | Hidden, or used as the state stamp. No fake laurels. |
| Reviews rich text | `headline` + `kicker` or `summary`. No critics. |
| Work YEAR / Location / CATEGORY | year / "Sala 24" or the date / first genre. |
| Work poster and FOOTAGE lightbox | Needs sourced posters and stills; empty lightbox state exists. |

### Nav menu

| Siena slot | FHDOG source |
|---|---|
| Main panel WORK / About / Contact | Programação / Sobre / Contato. Candidates to add: Dossiê, Busca. Siena numbers them automatically. |
| Small panel film rows with minutes | 21 rows, `runtime` (total for the double feature), computed order. |
| Footage panel HEADLINE / DIRECTOR / PRODUCERS | `headline` / `director` / **replace PRODUCERS**, no producer data exists: use date, time, room. |
| Case panel synopsis | `summary` |
| `replica:src/components/nav/RatingStars.astro` | Remove, per the no-stars rule. |
| Socials | Discord, YouTube, Steam (`src/lib/site.ts:60-65`). No Instagram, Facebook or LinkedIn exists in the repo. |
| About `ADMIT ONE / 004`, Contact `LET'S TALK / EMAIL US` | Copy, email is `SITE.email`. |

### Film page (every session)

| Siena section | FHDOG source | if empty |
|---|---|---|
| Hero | `features[].title`, `headline` as a line, date and room | |
| Trailer player | **No data yet**, needs 22 videos. See section 9. | |
| Credits, director + poster, grids | Only Direção, Duração, Classificação, Gêneros, Início exist (`ui/FeatureSheet.astro`). `cast_list` exists in the database schema and is **never seeded**. | Shrink grids; cast only from a verifiable source |
| Director's Cut (sticky) | `## Por que esta indicação?` | |
| Gallery | **One image per session.** Remove the placeholder `VARIETY` / "A cinematic triumph" captions and their stars (`INVENTORY.md` line 177): fake critic, on every film. | Siena's empty state (as on `thehousewife`) |
| Reviews slider | The three `### ` blocks of `## O que esperar`: curator's own words, no critics, no stars. | |
| Prizes marquee | Only awards named in the repo's own text: Pulp Fiction, The Lobster, The Hateful Eight. | Hidden section, Siena has this state |
| Investors & Broadcast | Becomes the session block: date, time, Sala 24, room button, `SessionRules`. | |
| Next film | Next in the computed order | |
| Remaining prose | `## A Premissa`, `## Sem Spoilers`, `## Conclusão`, `kicker` need a text slot. | |

Body structure is regular, which makes this mapping safe: 20 sessions have Premissa, Por que, O que esperar (3 H3), Conclusão. Exceptions: `the-running-man-2026` has no Sem Spoilers. `ready-or-not-double-feature-2026` is different: two `## N.ª EXIBIÇÃO` blocks, each with `### A Premissa` and `#### O que esperar`, then `## Por que esta Sessão Dupla?`, `### Programação`, Sem Spoilers, Conclusão. **It needs its own branch**, including two trailers in a player built for one. Body length runs from 310 to 796 words.

### About, Contact, footer

| Siena | FHDOG |
|---|---|
| About hero headline | `SITE.tagline`, `SITE.lede` |
| WHO WE ARE (2 founders) | Curator Olwtelet; server opened 2024-11-29 (`sobre.astro:20,51`). Do not pad to two people. |
| Our Services | "Isto não é streaming", "Como um filme entra" (`sobre.astro:58-85`) |
| Kinetic typography, 36-image grid | Real film titles; the grid would reuse stills, 21 sources for 36 cells |
| Facts | No ar desde, sessões, custo (`sobre.astro:116-133`). Frequency needs softening, see section 2. |
| COLLABORATEUR logos, Our Films CTA | No partners exist in the repo: hide or use communities. CTA goes to Programação. |
| Contact: PROJECT INQUIRIES, PHONE, ADDRESS | Only an email and Discord exist. **No phone, no address.** Remove the slots. |
| Footer "Stay up to date" form | No newsletter exists. Replace with RSS and Discord. |
| Footer sitemap | Início, Programação, Sobre, Contato, plus Dossiê, Gêneros |
| Footer Inquiries, Press | One email. No press address exists. |
| Footer sign-off | "Fim da transmissão", `© year`, "Curadoria Olwtelet" (`ui/Footer.astro:33,71-75`) |
| `/cookies`, `/terms`, `/privacy` | **FHDOG has no legal text at all** (grep for privacidade, termos, cookies, LGPD: none). Siena's text must go. Owner must supply text or the routes and links are removed. Do not invent legal text. |

### Worth absorbing, in order

1. **RSS, `busca.json`, SearchPalette:** cheap, data-only. 
2. **SessionRules:** four lines, static.
3. **Radio:** body-level placement survives Taxi navigation, better than today's reload on each page (Taxi swaps only `[data-taxi]`). Conflicts to design for: Siena has its own sounds and the trailer has sound; a plain Spotify embed cannot be paused from outside.
4. **Gêneros:** after separating real genres from `indicação-da-semana`, `sessão-dupla`, `obscuro`. Filter or extra page, Siena has no equivalent.
5. **Dossiê:** works as its own page. Owner should confirm tier lists do not breach "no ratings" in spirit; it is personal and unsaved.
6. **Calibration:** optional, suits Tema Sinal.

Parked: Mural, Ranking (owner's decision), FilmActions, FilmNotes, SessionMenu, perfil, favoritos, assistidos, admin. Audience: a database write that lives on the Mural page, parked with it.

### Integration traps found in `replica:public/assets/js/app.js` (read from code, not run)

- **Typing "g" toggles a debug panel:** `document.addEventListener("keydown", s => { s.key === "g" && pe.show() })`, with no check of the event target. Any text field added (search, Dossiê) hits this.
- **Space is swallowed on home and Work:** both sliders bind `keydown` on `window`, call `preventDefault()` on Space and move the slide; arrow keys also move it. A search input opened over those pages cannot receive a space unless its events are stopped first. Palette arrow navigation has the same conflict. Konami on these pages also moves slides.
- **Taxi intercepts same-host links** (`INVENTORY.md` d-2) and prefetches on hover. `/rss.xml` must carry `data-taxi-ignore` or a `target`. The hook is supported by app.js but absent from the HTML (d-4).
- A scrollable palette result list may need `data-lenis-prevent`.

## 9. Trailer and YouTube data

Grep of `trailer|youtube|youtu|embed` over the repo (excluding `node_modules`, `dist`, `.astro`, `.vercel`, `.git`, lock file):

- **No video ID, no YouTube watch or embed URL, anywhere.**
- `trailer_url` exists as an empty container: column at `supabase/migrations/0002_plataforma.sql:220`, admin field at `src/pages/admin/sessao/[id].astro:201-202`, `src/lib/admin.ts:20,56,125`, `src/lib/db/types.ts:55`. Seeds do not write it (`scripts/gerar-seed-catalogo.mjs:67`).
- YouTube appears only as the channel link: `src/lib/site.ts:23,62`, `ui/Footer.astro:16`, `index.astro:31`, `sobre.astro:22,28`, `README.md:272`.
- **Text conflict:** `vivarium-2019.md:93` and `what-you-wish-for-2023.md:87` tell readers to avoid full trailers, on pages that will now lead with one. Live session pages contain no trailer URLs either.

Blocking details if trailers are YouTube:

- FHDOG's CSP allows only Spotify frames: `frame-src https://open.spotify.com` (`vercel.json:21`), and `img-src` excludes YouTube thumbnails. Reusing that `vercel.json` blocks the player silently. The replica's own deployment headers need checking.
- Siena's player is a `<video src>`, and the original's `https://youtu.be/...` on `by-any-means` shows that a watch URL there does not play (`INVENTORY.md` c-2).

## 10. RSS

`src/pages/rss.xml.ts`, via `@astrojs/rss`, static. Live: 200, 23.7 KB, 21 items, newest first.

- Channel: `SITE.name`, `SITE.description`, `<language>pt-BR</language>`, link to home. No `<image>`, no `atom:link rel=self`.
- Item: `title` = `Title (year) + Title (year) — headline`; `link` and `guid isPermaLink=true` = `/sessoes/<slug>/` absolute; `description` = summary; `category` = all tags, including `indicação-da-semana`; `content:encoded` = summary + Direção, Duração, Sessão (`time · room`).
- `pubDate` = session date at 00:00 UTC (`:33`). In Sao Paulo that displays as **Friday 21:00**, and for future sessions it is future-dated. The time is only in the HTML content; date is not in the content at all. No image or enclosure.
- Autodiscovery at `src/components/Seo.astro:102`. Footer link at `ui/Footer.astro:22`. 301s from `/feed`, `/feed.xml` at `vercel.json:40-41`; `/tags/:slug*` and `/search-index.json` redirects at `:42-43`.

**For the replica:** `@astrojs/rss` is not a dependency there, a small static endpoint can emit the same XML. If film URLs move to `/films/<slug>`, the `guid` changes and readers will show 21 "new" items. Keep the old guid strings, and add `/sessoes/:slug/` to `/films/:slug` redirects, since these URLs are in the sitemap and Search Console verification exists (`public/google509acec848149235.html`).

## 11. Content defects and editorial notes

**Defects to fix when importing (all are live today):**

- `ready-or-not-double-feature-2026.md:89`: `:contentReference[oaicite:0]{index=0}` is rendered as visible text.
- Stray code fence at end of file, rendering an empty `<pre>` on live: `limitless-2011.md:104`, `obsession-2026.md:101`, `the-inheritance-2025.md:93`, `truth-treachery-2026.md:95`, `what-you-wish-for-2023.md:101`.
- `ready-or-not-double-feature-2026.md:105,107`: clock emoji in the schedule lines; check against Siena's fonts.
- `catalog.ts:16` declares a `proxima` state that `stateOf()` never returns (`:67-70`). Do not port it.

**Weak editorial patterns, in general terms** (owner's text, nothing rewritten):

- **Time-bound opener:** "Nossa indicação desta semana" in 18 of 21. On an archive, 20 of 21 are not this week. The tag `indicação-da-semana` has the same problem.
- **Repeated closers and formulas:** "Uma excelente escolha para quem..." in 10 files; a "stays with you after the credits" line in 6; "Quanto menos você souber" in 9; one sentence about being made to surprise is duplicated word for word in 2 files. "Misturando" opens a sentence in 11 files.
- **Generic praise over specifics:** frequent "marcante", "inesquecível", "experiência", "imprevisível", "reflexão". Two visible generations of text: the first 14 sessions (about 310 to 480 words, formula-driven) and the 7 newest (540 to 800 words, more specific, fewer stock phrases). The contrast will show side by side.
- **Unsupported superlatives:** "um dos mais..."-style claims and "cult" or "clássico" labels. `clássico` is tagged on a 2025 film (`truth-treachery-2026`). These are opinions, but they sit near the "nothing invented" line.
- **Epigraphs:** the 7 newest open with a blockquote presented as a line from the film. Some are recognisable. I could not confirm others, in particular `the-hateful-eight-2015.md:38` and `under-the-silver-lake-2018.md:38`, and `the-lobster-2015.md:38` reads like a paraphrase. **These should be checked or removed.**
- **Colour:** 10 of 21 tones map to the red bar, so the README's idea that the catalogue reassembles the test card (`README.md:22-25`) does not hold in practice. Relevant only if Tema Sinal uses `tone`.

## 12. Decisions for the owner

1. Correct `the-inheritance-2025` (director, year, runtime). This is the only item that could put false facts on the new pages.
2. What the highlight says after tonight, and when the next session file arrives.
3. Year to display for Obsessão (2025 or 2026). Runtime and title for The Running Man.
4. Slug policy: keep slugs as stable IDs with corrected display data, or rename with redirects and a database update.
5. Legal pages: supply text or drop the routes.
6. Double feature: one page with two trailers (my assumption), or two pages.
7. Whether on-air counts as "next" (assumed yes).
8. Image sourcing and rights for posters, heroes and galleries.

## 13. What I could not verify

- **External film data was looked up for 5 sessions only** (Running Man, Obsession, Truth & Treason, How to Make a Killing, Ready or Not 2). The other 16 directors, years and runtimes look right to me from general knowledge, not checked against a source. Sources disagree among themselves on some runtimes.
- **Brazilian age ratings:** none confirmed against the official ClassInd database.
- **Whether the live database holds `trailer_url` or `links` values added through the admin panel.** I did not query Supabase: that goes beyond reading the repo, and the owner can run `select slug, trailer_url, links from films`.
- **Whether any image really belongs to its film.** I looked at them but did not match them to source material.
- **Whether the epigraphs are real lines.**
- **App.js traps** were read from the code, not exercised in a browser. Footer, nav and Sobre on the live site were read from source, not rendered. No browser was opened at all.
- **Which video links work:** none exist to test.

Network reads beyond the two projects: Discord public invite metadata for the 2 invites, Spotify oEmbed for the playlist name, status of the YouTube and Steam links, web searches for section 4. All anonymous and read-only. No server was started or stopped, and neither project was written to.

## Sources (web lookups for section 4)

- [Truth & Treason, KSL](https://www.ksl.com/article/51391799/truth--treason-the-real-story-behind-the-latter-day-saint-teen-who-resisted-the-nazis), [The Viewer's Guide](https://theviewersguide.com/truth-treason-1443940), [Filmstarts](https://www.filmstarts.de/kritiken/139842.html)
- [How to Make a Killing, Rotten Tomatoes](https://static.rottentomatoes.com/m/how_to_make_a_killing_2026), [Apple TV](https://tv.apple.com/us/movie/umc.cmc.6ulh30ntityj9dv8x4x2r4a5y), [Moviebuff (Portuguese title)](https://assets.moviebuff.com/how-to-make-a-killing), [Kinocheck](https://kinocheck.com/movie/1g8/how-to-make-a-killing-2026)
- [Obsession, Bloody Disgusting](https://bloody-disgusting.com/movie/3913022/curry-barkers-obsession-sets-summer-2026-theatrical-release/), [The Playlist](https://theplaylist.net/?p=484747), [Signal Horizon](https://signalhorizon.com/?p=22994), [NetflixJunkie (runtime)](https://www.netflixjunkie.com/hollywood-news-how-long-is-the-movie-obsession-is-it-worth-watching/amp/)
- [The Running Man, Hoyts](https://www.hoyts.com.au/movies/the-running-man), [Gateway Film Center](https://gatewayfilmcenter.org/movies/the-running-man-2025/), [Tribuna de Minas (BR title, rating)](https://tribunademinas.com.br/noticias/cultura/20-11-2025/confira-a-programacao-dos-cinemas-em-juiz-de-fora-entre-os-dias-20-e-26-de-novembro.html?amp=1), [JB (BR title)](https://www.jb.com.br/colunistas/tom-leao/2025/11/1057704-o-novo-the-running-man-e-apenas-modorrento.html)
- [Casamento Sangrento: A Viúva, AdoroCinema](https://www.adorocinema.com/filmes/filme-1000001305/), [JustWatch](https://www.justwatch.com/br/filme/casamento-sangrento-a-viuva), [Kids-in-Mind](https://kids-in-mind.com/r/ready-or-not-2-here-i-come-parents-guide-movie-review-rating.htm)
