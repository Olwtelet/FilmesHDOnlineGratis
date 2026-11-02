# FHDOG films: TMDB identity, images and verified credits

Generated 2026-10-31. Machine-readable data: `films-tmdb.json` in this folder (keyed by md slug; `ready-or-not-double-feature-2026` is an array of two). Nothing was written to either project.

## 1. How this was done, and what was reachable

| Source | Result |
|---|---|
| themoviedb.org public pages | Reachable with WebFetch and with plain `curl` (default user agent). A request carrying a browser user agent gets a "Checking your browser" cookie page instead; I did not script around it and did not use a browser. ~160 page fetches at about 1 per 1.2 s. |
| TMDB API (`api.themoviedb.org`) | 401 without a key. Not used; I did not look for a key in the projects. |
| image.tmdb.org CDN | Reachable. Every selected image was checked: HEAD on `original` and on `w1280` (posters: `w780`), plus a 256 KB ranged GET to read the real pixel size from the file header. 487 images, 0 failures, 0 mismatches against the size the TMDB page shows. Two HEAD replies omitted the content type; both were 200 and valid JPEG. |
| en.wikipedia.org API (second source) | Reachable after backing off a rate-limit reply. All 22 features have an article with an infobox. |
| Wikidata | Reachable. Each article's item carries the same TMDB id as chosen here, and gave the IMDb id: 22 of 22 agree. |
| IMDb (`/fullcredits`, `/technical`) | **403 via WebFetch** on all 3 requests. Not worked around. |
| Box Office Mojo `/title/<imdb>/credits/` (owned by IMDb, third source) | Reachable. Gives running time, principal crew and top 4 cast for all 22. |
| pt.wikipedia.org, web search | Second source for Brazilian titles. |

Backdrops: I took the TMDB "Sem Idioma" (`?image_language=xx`) list, which is the site's textless bucket, then viewed contact sheets of up to 50 candidates per film at w300 and picked by eye, dropping duplicates, fan art, title lettering, gore and obvious spoilers. Sheets are in `raw/sheets/*.jpg` (numbers on them are not stored in the JSON). Kinds: `still` = looks like a film frame or unit photo; `art` = textless key art.

Credit markers: **W** Wikipedia infobox or cast section, **w** Wikipedia article text only, **B** Box Office Mojo. Everything listed is also on TMDB unless noted.

## 2. Overview

| Slug | TMDB id | IMDb | Original title | Brazilian title (TMDB) | TMDB year | Backdrops | Poster |
|---|---:|---|---|---|---:|---:|---|
| bugonia-2025 | 701387 | tt12300742 | Bugonia | Bugonia | 2025 | 17 | pt-BR 2000x3000 |
| django-unchained-2012 | 68718 | tt1853728 | Django Unchained | Django Livre | 2012 | 18 | pt-BR 2000x3000 |
| doctor-sleep-2019 | 501170 | tt5606664 | Doctor Sleep | Doutor Sono | 2019 | 16 | pt-BR 2000x3000 |
| eyes-wide-shut-1999 | 345 | tt0120663 | Eyes Wide Shut | De Olhos Bem Fechados | 1999 | 17 | pt-BR 2000x3000 |
| inglourious-basterds-2009 | 16869 | tt0361748 | Inglourious Basterds | Bastardos Inglórios | 2009 | 16 | pt-BR 1000x1500 |
| limitless-2011 | 51876 | tt1219289 | Limitless | Sem Limites | 2011 | 17 | en-US 1000x1426 |
| lord-of-war-2005 | 1830 | tt0399295 | Lord of War | O Senhor das Armas | 2005 | 14 | pt-BR 1000x1500 |
| obsession-2026 | 1339713 | tt37287335 | Obsession | Obsessão | 2026 | 15 | pt-BR 1000x1500 |
| pulp-fiction-1994 | 680 | tt0110912 | Pulp Fiction | Pulp Fiction: Tempo de Violência | 1994 | 19 | pt-BR 1400x2100 |
| ready-or-not-double-feature-2026 | 567609 | tt7798634 | Ready or Not | Casamento Sangrento | 2019 | 17 | pt-BR 2000x3000 |
| ready-or-not-double-feature-2026 | 1266127 | tt33978029 | Ready or Not: Here I Come | Casamento Sangrento: A Viúva | 2026 | 18 | pt-BR 2000x3000 |
| the-hateful-eight-2015 | 273248 | tt3460252 | The Hateful Eight | Os Oito Odiados | 2015 | 16 | pt-BR 1400x2100 |
| the-inheritance-2025 | 467905 | tt4357198 | How to Make a Killing | Manual Prático da Vingança Lucrativa | 2026 | 17 | pt-BR 2000x3000 |
| the-lobster-2015 | 254320 | tt3464902 | The Lobster | O Lagosta | 2015 | 16 | pt-BR 1000x1500 |
| the-long-walk-2025 | 604079 | tt10374610 | The Long Walk | A Longa Marcha: Caminhe ou Morra | 2025 | 17 | pt-BR 1024x1536 |
| the-menu-2022 | 593643 | tt9764362 | The Menu | O Menu | 2022 | 16 | en-US 2000x3000 |
| the-running-man-2026 | 798645 | tt14107334 | The Running Man | O Sobrevivente | 2025 | 18 | pt-BR 2000x3000 |
| truth-treachery-2026 | 1443940 | tt21825416 | Truth & Treason | Verdade e Traição | 2025 | **4** | pt-BR 2000x3000 |
| under-the-silver-lake-2018 | 396461 | tt5691670 | Under the Silver Lake | O Mistério de Silver Lake | 2018 | 17 | en-US 2000x3000 |
| v-for-vendetta-2005 | 752 | tt0434409 | V for Vendetta | V de Vingança | 2006 | 16 | pt-BR 2000x3000 |
| vivarium-2019 | 458305 | tt8368406 | Vivarium | Viveiro | 2019 | **13** | en-US 2000x3000 |
| what-you-wish-for-2023 | 1126934 | tt13638858 | What You Wish For | Aquilo que Você Deseja | 2024 | **9** | pt-BR 1000x1500 |

URL forms: `https://image.tmdb.org/t/p/original/<path>`, `https://image.tmdb.org/t/p/w1280/<path>`, posters also `w780`.

## 3. Discrepancies for the owner's records

Paths are under `C:/Users/Usuario/Desktop/Projetos/FHDOG/src/content/films/`.

### 3.1 Wrong film data (needs correcting)

- **`the-inheritance-2025.md`**: the film is *How to Make a Killing* (TMDB 467905), Brazilian title *Manual Prático da Vingança Lucrativa*. The md body names Becket Redfellow, which fits. Line 16: director `Dan Berk & Robert Olsen` is wrong: **John Patton Ford** on TMDB, Wikipedia, Box Office Mojo and Brazilian press. Line 15: year `2025` should be **2026** (TMDB 2026-02-16; Brazil 26/02/2026). Line 17: runtime `99` should be **105** (all three sources). The slug "the-inheritance" matches no title of this film.
- **`the-running-man-2026.md:16`**: runtime `137`. Wikipedia (citing the Irish classifier IFCO) and Box Office Mojo give **133**; TMDB gives 130.

### 3.2 Titles differ from the Brazilian release title

The md uses the original title where a Brazilian one exists. Probably the owner's choice, but worth knowing, because a single data source would carry it everywhere:

| md file | md title | Brazilian title | Second source |
|---|---|---|---|
| the-long-walk-2025.md | The Long Walk | A Longa Marcha: Caminhe ou Morra | ptwiki, Wikidata pt-br label |
| the-menu-2022.md | The Menu | O Menu | ptwiki, AdoroCinema |
| the-running-man-2026.md | The Running Man | O Sobrevivente (same Brazilian title as the 1987 film) | ptwiki, Wikidata pt-br label |
| vivarium-2019.md | Vivarium | Viveiro | ptwiki `{{BRPT}}`; pt-BR backdrop on TMDB reads VIVEIRO |

Slug mismatches, no data impact: `truth-treachery-2026` is *Truth & Treason* (a TMDB search for "Truth and Treachery" returns nothing).

Sequel naming: TMDB has *Ready or Not: Here I Come*; Wikipedia *Ready or Not 2: Here I Come* and notes the on-screen title has no 2. The Brazilian posters on TMDB print "Casamento Sangrento 2 / A Viúva" while the title field is "Casamento Sangrento: A Viúva", which is what the md uses.

### 3.3 Year: source-dependent, not clearly wrong

| md file | md year | TMDB | Wikipedia | Comment |
|---|---:|---:|---|---|
| obsession-2026.md | 2025 | 2026 | TIFF 2025-09-05; US 2026-05-15 | md uses the festival year, the slug the commercial one |
| v-for-vendetta-2005.md | 2005 | 2006 | "2005 film"; premiere 2005-12-11, general release 2006 | md matches Wikipedia |
| what-you-wish-for-2023.md | 2023 | 2024 | Fantasia 2023-07-30; US 2024-05-31 | md uses the festival year |
| the-running-man-2026.md | 2025 | 2025 | 2025 | md correct, slug carries the session year |
| truth-treachery-2026.md | 2025 | 2025 | 2025 | md correct, slug carries the session year; Brazil 02/04/2026 on TMDB |

### 3.4 Runtime table

Director matched the md for 21 of 22 features (exception above). Bold where the md disagrees with both Wikipedia and Box Office Mojo.

| Feature | md | TMDB | Wikipedia | Box Office Mojo | Use |
|---|---:|---:|---:|---:|---:|
| Bugonia | 118 | 118 | 118 | 118 | 118 |
| Django Unchained | 165 | 165 | 165 | 165 | 165 |
| Doctor Sleep | 152 | 152 | 152 | 152 | 152 |
| Eyes Wide Shut | 159 | 159 | 159 | 159 | 159 |
| Inglourious Basterds | 153 | 152 | 153 | 153 | 153 |
| Limitless | 105 | 106 | 105 | 105 | 105 |
| Lord of War | 122 | 122 | 122 | 122 | 122 |
| Obsession | **108** | 100 | 109 | 109 | 109 |
| Pulp Fiction | 154 | 154 | 154 | 154 | 154 |
| Ready or Not | 95 | 95 | 95 | 95 | 95 |
| Ready or Not: Here I Come | 108 | 108 | 108 | 108 | 108 |
| The Hateful Eight | 168 | 167 | 167 | 168 | 168 |
| How to Make a Killing | **99** | 105 | 105 | 105 | 105 |
| The Lobster | 119 | 119 | 118 | 119 | 119 |
| The Long Walk | 108 | 109 | 108 | 108 | 108 |
| The Menu | 107 | 107 | 107 | 107 | 107 |
| The Running Man | **137** | 130 | 133 | 133 | 133 |
| Truth & Treason | 121 | 121 | 121 | 121 | 121 |
| Under the Silver Lake | 139 | 139 | 139 | 139 | 139 |
| V for Vendetta | 132 | 130 | 133 | 132 | 132 |
| Vivarium | 97 | 97 | 98 | 97 | 97 |
| What You Wish For | **102** | 102 | 101 | 101 | 101 |

Notes: TMDB is the outlier on *Obsession* (100) and *The Running Man* (130), so runtimes should not be taken from TMDB unchecked. *Obsession*: md 108 is within a minute of 109, and some press prints 108. *What You Wish For*: md 102 matches TMDB. *The Hateful Eight*: 167 general, 187 roadshow; md 168 matches Box Office Mojo.

### 3.5 Age rating (not requested; noticed in passing)

| md file | md rating | TMDB BR certification |
|---|---:|---:|
| ready-or-not-double-feature-2026.md (Ready or Not) | (none) | 16 |
| ready-or-not-double-feature-2026.md (Ready or Not: Here I Come) | (none) | 18 |
| the-long-walk-2025.md (The Long Walk) | 16 | 18 |
| the-running-man-2026.md (The Running Man) | 16 | 18 |
| truth-treachery-2026.md (Truth & Treason) | 16 | PG-13 (US rating shown: TMDB has no BR certification) |
| vivarium-2019.md (Vivarium) | 14 | 16 |
| what-you-wish-for-2023.md (What You Wish For) | 16 | R (US rating shown: TMDB has no BR certification) |

### 3.6 Stray artifacts in md bodies

- `ready-or-not-double-feature-2026.md:89` ends with a leftover `:contentReference[oaicite:0]{index=0}`.
- A lone closing code fence as the last line of `limitless-2011.md:104`, `obsession-2026.md:101`, `the-inheritance-2025.md:93`, `truth-treachery-2026.md:95`, `what-you-wish-for-2023.md:101`.

### 3.7 Country data disagrees between TMDB and Wikipedia

| Film | TMDB | Wikipedia |
|---|---|---|
| Bugonia | United States | United Kingdom, Ireland, South Korea, United States |
| Inglourious Basterds | United States | United States, Germany |
| Lord of War | United States | United States, Germany |
| How to Make a Killing | United Kingdom | France, United Kingdom |
| The Lobster | Ireland, United Kingdom | Ireland, United Kingdom, Greece, France, Netherlands |
| The Running Man | United States | United Kingdom, United States |
| Truth & Treason | United States, Lithuania | United States |
| V for Vendetta | United States | United States, United Kingdom, Germany |

Original language is English on TMDB for all 22. Wikipedia also lists: *Inglourious Basterds* German and French; *The Lobster* French; *What You Wish For* Spanish. Any on-page country line should cite one source; Wikipedia is the fuller one.

## 4. Image problems the lead must decide on

**Shortfall: three films cannot reach 14 textless backdrops on TMDB.** All textless images are listed; there are no others.

| Film | Textless on TMDB | Distinct | Other languages |
|---|---:|---:|---|
| Truth & Treason | 4 | 3, of which 2 real stills | 5, all with title lettering (en 3, cs 2) |
| Vivarium | 13 | 11 | 12, all with title lettering |
| What You Wish For | 9 | 9 (4 and 5 are close variants) | 4, all with title lettering |

Options, none taken: fewer gallery slots or repeats for these three, frames from the official trailer, or cropping text-bearing art. Inventing or borrowing unrelated stills would break the "nothing invented" rule.

**Nazi imagery.** Both war films display it on their official art, and Brazilian law restricts swastika display when it is used to promote Nazism, so a film site is a different case, but this is the owner's call and I am not giving legal advice.

- *Truth & Treason*: two of its four textless backdrops and every poster on TMDB show a large swastika gag; one en-US poster shows a cap with an eagle instead. The two remaining stills are clean at thumbnail size.
- *Inglourious Basterds*: the main `backdrops` list avoids visible Nazi uniform and insignia at thumbnail size. Five stronger frames with SS uniform, armband or cap badge sit apart in `backdrops_alternates_flagged`. All 3 pt-BR posters and the top en-US one have a swastika in the title lettering; the first `textless_xx` poster has none visible.

**Other flags in the JSON.** `diegetic-text` means lettering inside the scene (props, signs), kept on purpose. `below-1920` is usable but soft at full bleed. Left out: child-harm frames in *Doctor Sleep*, gore in *Ready or Not* 1 and 2 and *Obsession*, nudity in *Eyes Wide Shut* (ritual frames checked at w780: robed), spoilers such as the burger and boat frames of *The Menu*. Also left out as probable fan work: the "mosaic" art that appears on both *Django Unchained* and *The Hateful Eight*, the Van Gogh-style Django, the Santa-hat Mia, and the painting set uploaded to *Ready or Not*.

**No Brazilian poster on TMDB** for *Limitless*, *The Menu*, *Under the Silver Lake*, *Vivarium*: primary falls back to the TMDB main poster (English) and textless is listed. The repo already has its own art in `src/assets/films/`.

**Hotlink or copy.** Across the 487 checked images, `original` files run from 0.06 to 3.5 MB (median 0.7). `w1280` backdrops run from 37 to 457 KB (median 150), so `w1280` is the practical size. Whether to self-host, and TMDB's attribution terms, I did not review.

## 5. Film by film

### Bugonia (`bugonia-2025`)

- TMDB [701387](https://www.themoviedb.org/movie/701387-bugonia) · IMDb tt12300742 · Wikipedia: Bugonia (film)
- Brazilian title: **Bugonia** (second source: ptwiki infobox)
- md: Bugonia, 2025, Yorgos Lanthimos, 118 min (`bugonia-2025.md:14`)
- Release: TMDB primary 2025-10-23, Brazil 27/11/2025 (BR)
- Country: TMDB United States · Wikipedia United Kingdom, Ireland, South Korea, United States · Original language: en

- Direction: Yorgos Lanthimos [W+B]
- Writing: Will Tracy (Screenplay) [W+B]; Jang Joon-hwan (Original film (Save the Green Planet!)) [W+B]
- Photography: Robbie Ryan [W+B]
- Music: Jerskin Fendrix [W+B]
- Editing: Yorgos Mavropsaridis [W+B]
- Producers: Ed Guiney [W+B]; Andrew Lowe [W+B]; Yorgos Lanthimos [W+B]
- Cast: Emma Stone as Michelle [W+B]; Jesse Plemons as Teddy [W+B]; Aidan Delbis as Don [W+B]; Stavros Halkias as Casey [W+B]; Alicia Silverstone as Sandy [W]
- Note: 6th TMDB cast entry (J. Carmen Galindez Barrera) not found in a second source; left out.

**Poster** primary `6OeJbx1QGDwrlL8SPZeLKjLhhA7.jpg` 2000x3000 (pt-BR).

- pt-BR: `6OeJbx1QGDwrlL8SPZeLKjLhhA7.jpg` 2000x3000, `vTQ4GUmcU3aOM5IpTkU3fZGs1ja.jpg` 2000x3000, `wHS0ob793etBQOgUUMCgbpCgtLt.jpg` 1128x1692
- en: `rSdOua3wKMEaFWDcKAYWRjXQWOt.jpg` 2000x3000, `18Kbb0qeCxwzna0W6a9gEMZuizF.jpg` 1000x1500
- textless: `ov9wEM1vEGernHeXewmbeyYAXoU.jpg` 2000x3000, `jSCuXZbwxbUHCvebMzxjY2ccSWy.jpg` 2000x3000

**Backdrops** (17; all TMDB "no language"; textless site totals: 134)

| Path | Size | w1280 | Kind | Flags |
|---|---|---:|---|---|
| `jihTSrMksmU5ujqRZnc6SBFSyfq.jpg` | 3840x2160 | 117 KB | still |  |
| `yq4qnZrCwghyUMrdRfnDtHtafZy.jpg` | 3840x2160 | 101 KB | still |  |
| `k1pjgp4LFLZTT2lUWS1fLlm0aL8.jpg` | 3840x2160 | 189 KB | still |  |
| `16EHmLgyVwTCnX05SoI240qr3iR.jpg` | 3840x2160 | 273 KB | still |  |
| `iW6ackYLGkOJ72BtSLYRrg6f0HW.jpg` | 3840x2160 | 142 KB | still |  |
| `fRRSgQObvUduBZtc2ta8nH7iEVI.jpg` | 3840x2160 | 187 KB | still |  |
| `cj2fug7Ayk0eaYOpW0npBaHXMCc.jpg` | 3840x2160 | 156 KB | still |  |
| `plna0LjGMlfQkVwWTKXajHv1VxV.jpg` | 3840x2160 | 251 KB | still |  |
| `rxB4T6M1nFH2es5SX8Ytm9Q2f3d.jpg` | 3840x2160 | 123 KB | still |  |
| `sukDxjiGCNkldfGpXePqJxNU8V8.jpg` | 3840x2160 | 331 KB | still |  |
| `uv2QglfswUynxr1I0tAxELIcwt5.jpg` | 3840x2160 | 179 KB | still |  |
| `4L9E7F3Jj0C3VXKxCMXkrqcMJF7.jpg` | 3840x2160 | 205 KB | still |  |
| `kMtUDuZnHDjiXtusgoDKL581wpq.jpg` | 3840x2160 | 80 KB | still |  |
| `e8gXUwRcwUWri3pSqiF54dr86Mx.jpg` | 3840x2160 | 187 KB | still |  |
| `iuVHKGWXNB61xkH9c6MzBLsVebj.jpg` | 3840x2160 | 142 KB | still |  |
| `tN3pTxkQoP96wtaEahYuRVdUWb2.jpg` | 3840x2160 | 99 KB | art |  |
| `xUn15uJ83Vdhv8co75iZTTgQQoC.jpg` | 3840x2160 | 193 KB | art |  |

### Django Unchained (`django-unchained-2012`)

- TMDB [68718](https://www.themoviedb.org/movie/68718-django-unchained) · IMDb tt1853728 · Wikipedia: Django Unchained
- Brazilian title: **Django Livre** (second source: ptwiki)
- md: Django Livre, 2012, Quentin Tarantino, 165 min (`django-unchained-2012.md:14`)
- Release: TMDB primary 2012-12-25, Brazil 18/01/2013 (BR)
- Country: TMDB United States · Wikipedia United States · Original language: en

- Direction: Quentin Tarantino [W+B]
- Writing: Quentin Tarantino (Writer) [W+B]
- Photography: Robert Richardson [W+B]
- Music: (none credited) — No composer in Wikipedia infobox or Box Office Mojo (compilation score). TMDB credits Luis Bacalov as Music/Theme Song Performance for the pre-existing Django theme; do not present as composer of the film.
- Editing: Fred Raskin [W+B]
- Producers: Stacey Sher [W+B]; Reginald Hudlin [W+B]; Pilar Savone [W+B]
- Cast: Jamie Foxx as Django Freeman [W+B]; Christoph Waltz as Dr. King Schultz [W+B]; Leonardo DiCaprio as Calvin J. Candie [W+B]; Kerry Washington as Broomhilda von Shaft [W+B]; Samuel L. Jackson as Stephen [W]; Walton Goggins as Billy Crash [W]

**Poster** primary `ar63Sx8jeqk0OOu2uchS477S2zE.jpg` 2000x3000 (pt-BR).

- pt-BR: `ar63Sx8jeqk0OOu2uchS477S2zE.jpg` 2000x3000, `xFOZFOdQFijudZrgX53mHeBI2Ff.jpg` 1500x2250, `agPU4LNxcazPhzgk0Qcj7rwaICv.jpg` 1400x2100
- en: `7oWY8VDWW7thTzWh3OKYRkWUlD5.jpg` 2000x3000, `mhf63wOnaLCnzxeHgngTH98WaVh.jpg` 2000x3000
- textless: `tqpCY0MMHQ8kS89U6ago3N82cJw.jpg` 1000x1500, `wwnFuiiG3Bq3qYW5OUVgWjpHOXu.jpg` 800x1200

**Backdrops** (18; all TMDB "no language"; textless site totals: 59)

| Path | Size | w1280 | Kind | Flags |
|---|---|---:|---|---|
| `8cs96njK3qaPDoyUNKYAWjWoWFF.jpg` | 3000x1687 | 255 KB | still |  |
| `yLr2uJ6SYXlbzADsfzg01uD7Asu.jpg` | 2560x1440 | 230 KB | still | diegetic-text:WANTED handbill |
| `lVcI3MOtumvEbOdS1Og7QoV6Lfc.jpg` | 3840x2160 | 153 KB | still |  |
| `7IrHTCH5yOLDblgJq98a1k9HXN9.jpg` | 3840x2160 | 177 KB | still |  |
| `2GsMFKx6cMAtKklk60xPA41BeRk.jpg` | 2048x1152 | 156 KB | still |  |
| `34ofLAZ1duOMzO0aLslPdWlvPju.jpg` | 2048x1152 | 196 KB | still |  |
| `xYOkwpPAfy64vpAkL4yGakRGymi.jpg` | 2482x1396 | 223 KB | still |  |
| `9iNyECcekbs5G0EKb4P0Zbq9DIx.jpg` | 3000x1688 | 271 KB | still |  |
| `sjzkeSj13ebnFFgYQhQu0TKsQAN.jpg` | 2962x1666 | 214 KB | still |  |
| `c1KGjSNrN4xsia1vSAJlg9sqoXb.jpg` | 2288x1286 | 231 KB | still |  |
| `eSfHn4xjkD83vUakUTvN5brsS7.jpg` | 3840x2160 | 157 KB | still |  |
| `fjdHKYVCN366og3ESs3nYWlxTPV.jpg` | 2288x1287 | 95 KB | still |  |
| `mojjlb3lAFz7GW72n2pyjNDaPuu.jpg` | 2915x1640 | 118 KB | still |  |
| `rxQyQ6hX5bGAiqgwMH53tMOpZyt.jpg` | 2983x1678 | 121 KB | still |  |
| `uXCf2UteenS7DxOdnzQWAyABIdG.jpg` | 2941x1654 | 147 KB | still |  |
| `6lHMDwGczd5Zp8lpPr6fOgNOznf.jpg` | 3009x1693 | 149 KB | still |  |
| `s4cJQaj40SwMifUrrdtdOJsjnRO.jpg` | 3840x2160 | 146 KB | art |  |
| `4LUd0S7lKGesczf5Tc0adLoZkpC.jpg` | 2048x1152 | 156 KB | art |  |

### Doctor Sleep (`doctor-sleep-2019`)

- TMDB [501170](https://www.themoviedb.org/movie/501170-doctor-sleep) · IMDb tt5606664 · Wikipedia: Doctor Sleep (2019 film)
- Brazilian title: **Doutor Sono** (second source: ptwiki)
- md: Doutor Sono, 2019, Mike Flanagan, 152 min (`doctor-sleep-2019.md:14`)
- Release: TMDB primary 2019-10-30, Brazil 07/11/2019 (BR)
- Country: TMDB United States · Wikipedia United States · Original language: en

- Direction: Mike Flanagan [W+B]
- Writing: Mike Flanagan (Screenplay) [W+B]; Stephen King (Novel) [W+B]
- Photography: Michael Fimognari [W+B]
- Music: The Newton Brothers (Original music (TMDB lists the duo as Andrew Grush and Taylor Stewart)) [W+B]
- Editing: Mike Flanagan [W+B]
- Producers: Trevor Macy [W+B]; Jon Berg [W+B]
- Cast: Ewan McGregor as Dan Torrance [W+B]; Rebecca Ferguson as Rose the Hat [W+B]; Kyliegh Curran as Abra Stone [W+B]; Cliff Curtis as Billy Freeman [W+B]; Zahn McClarnon as Crow Daddy [W]; Emily Alyn Lind as Snakebite Andi [W]
- Note: TMDB character reads "Danny Torrance"; Wikipedia "Dan Torrance".

**Poster** primary `1Sp02vj2faWSF72OqIM9E7HuSG9.jpg` 2000x3000 (pt-BR).

- pt-BR: `1Sp02vj2faWSF72OqIM9E7HuSG9.jpg` 2000x3000, `5pGR623Rg89yjzhVrflhOIY4MQV.jpg` 600x900, `wQ9WXD8Z5FOkB64HieLY0luxYZM.jpg` 1135x1607
- en: `p69QzIBbN06aTYqRRiCOY1emNBh.jpg` 2000x3000, `ohS07RD5jpfUjEkYBC4q6MKaA6E.jpg` 2000x3000
- textless: `6wd4WO5tLFATlFBd9vJtp7YWAPQ.jpg` 1000x1500, `aROTqxIf5tZJR6Ao3QvFhRDQwfa.jpg` 2000x3000

**Backdrops** (16; all TMDB "no language"; textless site totals: 38)

| Path | Size | w1280 | Kind | Flags |
|---|---|---:|---|---|
| `gKk8Bg4qpHfniAJC3phzCZpkaIg.jpg` | 3120x1755 | 68 KB | still |  |
| `A1lvRqwbLz0PIs5QyivFVzCarc6.jpg` | 1920x1080 | 123 KB | still |  |
| `b1SGSQrWsvtThke5m7sMjCIZHNq.jpg` | 3840x2160 | 155 KB | still |  |
| `a6FfVn74RwINqRB8l3GxCLxnq9Z.jpg` | 3691x2076 | 63 KB | still |  |
| `5PeGXB91GrQtRtfdFy1Yd7WOML3.jpg` | 3691x2076 | 152 KB | still |  |
| `e0PO7FYdulmqlpQpQ0ncqCxZjwy.jpg` | 3691x2076 | 153 KB | still |  |
| `zaKRw2WVgwiUm2PacZ5Jm6q8tOJ.jpg` | 3840x2160 | 123 KB | still |  |
| `4D4Ic9N4tnwaW4x241LGb1XOi7O.jpg` | 3840x2160 | 115 KB | still | diegetic-text:REDRUM on mirror |
| `acbxQQoOyDZ8pgz1fApZkL6w0zD.jpg` | 1920x1080 | 170 KB | still |  |
| `rOjEhPgIe6pNYgQ12Lnwl1HXD2y.jpg` | 3129x1760 | 176 KB | still |  |
| `zqzob0FEWsOrrQJq0geVcSbdYc4.jpg` | 1280x720 | 89 KB | still | below-1920 |
| `qLP84ZGnstYOaNwOxq28599qo0E.jpg` | 1291x725 | 78 KB | still | below-1920 |
| `gKUHNrgymzJjdtQtFLpL7iYfZQ8.jpg` | 1291x727 | 123 KB | still | below-1920 |
| `ap6Zc5NDOfbZaMhkRDyghbGeLf0.jpg` | 3840x2160 | 127 KB | art | promo-art |
| `r2t6lPg7sNqOOtGeOJMpByPRbqF.jpg` | 1920x1080 | 152 KB | art | promo-art |
| `65LB5joN7Vn756bBB9Y7KiJFqfE.jpg` | 3840x2160 | 67 KB | art | promo-art |

### Eyes Wide Shut (`eyes-wide-shut-1999`)

- TMDB [345](https://www.themoviedb.org/movie/345-eyes-wide-shut) · IMDb tt0120663 · Wikipedia: Eyes Wide Shut
- Brazilian title: **De Olhos Bem Fechados** (second source: ptwiki)
- md: De Olhos Bem Fechados, 1999, Stanley Kubrick, 159 min (`eyes-wide-shut-1999.md:14`)
- Release: TMDB primary 1999-07-16, Brazil 03/09/1999 (BR)
- Country: TMDB United Kingdom, United States · Wikipedia United Kingdom, United States · Original language: en

- Direction: Stanley Kubrick [W+B]
- Writing: Stanley Kubrick (Screenplay) [W+B]; Frederic Raphael (Screenplay) [W+B]; Arthur Schnitzler (Novella (Traumnovelle)) [W+B]
- Photography: Larry Smith [W+B]
- Music: Jocelyn Pook [W+B]
- Editing: Nigel Galt [W+B]
- Producers: Stanley Kubrick [W+B]
- Producers, not cross-checked: Brian W. Cook (Producer on TMDB and AFI; co-producer on Rotten Tomatoes and IMDb per search snippet; absent from Wikipedia infobox and Box Office Mojo); Jan Harlan (Executive producer per search snippet (Criterion, Rotten Tomatoes); not a producer credit)
- Cast: Tom Cruise as Dr. Bill Harford [W+B]; Nicole Kidman as Alice Harford [W+B]; Sydney Pollack as Victor Ziegler [W+B]; Marie Richardson as Marion Nathanson [W]; Rade Šerbedžija as Milich [W]; Todd Field as Nick Nightingale [W+B]
- Note: TMDB character reads "Dr. William Harford"; Wikipedia "Dr. Bill Harford".
- Note: Only one producer is credited in the two independent sources.

**Poster** primary `rrz3J0ascmMVnknnGOelpChj7n5.jpg` 2000x3000 (pt-BR).

- pt-BR: `pmU8WQ2fOdxLuYaNe1kHE2L8SlI.jpg` 800x1200, `rrz3J0ascmMVnknnGOelpChj7n5.jpg` 2000x3000, `nTVwIk42iSZx4MUFNFwsUeWzZeZ.jpg` 960x1440
- en: `knEIz1eNGl5MQDbrEAVWA7iRqF9.jpg` 1000x1500, `a0YOhU3zq0RkOYrVlPXCeE1oFkR.jpg` 1000x1500
- textless: `wg4qZONbcEbi5LypF2wH9UO7QHW.jpg` 1264x1896, `18wsbKjWJSWdFuidP49L3njQPuL.jpg` 2000x3000

**Backdrops** (17; all TMDB "no language"; textless site totals: 114)

| Path | Size | w1280 | Kind | Flags |
|---|---|---:|---|---|
| `cAZ87S5bONxKMMAlPxK8LZvdOcm.jpg` | 1920x1080 | 133 KB | still |  |
| `gCCaVhcsNh8Ni4ne0k6nNcr5PHZ.jpg` | 1920x1080 | 122 KB | still |  |
| `9BCKtndgyhcFk4omuLWqZ2P4fKu.jpg` | 3840x2160 | 229 KB | still |  |
| `nIytsYeL1wvUYz13fMH83qBvkI2.jpg` | 2000x1125 | 244 KB | still |  |
| `d0A76lLOqu1qJPBqQaWGvTk6zxk.jpg` | 3840x2160 | 170 KB | still |  |
| `pNlRpt8Ts8D13cONG6voSu1jAyl.jpg` | 3840x2160 | 241 KB | still |  |
| `rqFkuEvPn8kJI3IJYkjGV9xyMWh.jpg` | 3200x1800 | 186 KB | still |  |
| `nEDO3Xdq6oNZ8xR0Iz6Kxfurv6X.jpg` | 3200x1800 | 227 KB | still |  |
| `qUuYxC4z8SAwB03R98Ul9srvl3m.jpg` | 3840x2160 | 223 KB | still |  |
| `kImwvmtMNZezdljFmgBYBvahTzp.jpg` | 3840x2160 | 129 KB | still |  |
| `AklO85uUDAL3O7iSOtFGfqT3w8n.jpg` | 1920x1080 | 163 KB | still |  |
| `rqfvMj7pRz1KqX832Z9wVFjNjnA.jpg` | 3599x2024 | 173 KB | still |  |
| `dhrMAf7xr3TBHYZrXhwDsMclCSJ.jpg` | 3840x2160 | 155 KB | still |  |
| `790ztJ7cVR5ZGnNNO6t0BtJaEmh.jpg` | 3628x2041 | 163 KB | still |  |
| `62HTXxAx9NLzOdfrPOzWDTdLzLS.jpg` | 1920x1080 | 144 KB | still |  |
| `aC6wW62V6b0csr5iUnbOjYAqfhg.jpg` | 3840x2160 | 85 KB | art |  |
| `fn6KYqHGfqDtgUppOShnvBDQj5s.jpg` | 3840x2160 | 69 KB | art |  |

### Inglourious Basterds (`inglourious-basterds-2009`)

- TMDB [16869](https://www.themoviedb.org/movie/16869-inglourious-basterds) · IMDb tt0361748 · Wikipedia: Inglourious Basterds
- Brazilian title: **Bastardos Inglórios** (second source: ptwiki)
- md: Bastardos Inglórios, 2009, Quentin Tarantino, 153 min (`inglourious-basterds-2009.md:14`)
- Release: TMDB primary 2009-08-02, Brazil 09/10/2009 (BR)
- Country: TMDB United States · Wikipedia United States, Germany · Original language: en

- Direction: Quentin Tarantino [W+B]
- Writing: Quentin Tarantino (Writer) [W+B]
- Photography: Robert Richardson [W+B]
- Music: (none credited) — No composer credit in any source (pre-existing music).
- Editing: Sally Menke [W+B]
- Producers: Lawrence Bender [W+B]
- Cast: Brad Pitt as Lt. Aldo Raine [W+B]; Mélanie Laurent as Shosanna Dreyfus [W+B]; Christoph Waltz as Col. Hans Landa [W]; Eli Roth as Sgt. Donny Donowitz [W+B]; Michael Fassbender as Lt. Archie Hicox [W]; Diane Kruger as Bridget von Hammersmark [W+B]
- Note: Only one producer is credited in the two independent sources.

**Poster** primary `6UjYycIR6VLYgggfNpmSPJHmFS0.jpg` 1000x1500 (pt-BR).
Flag: All 3 pt-BR posters and the first en-US poster carry a swastika motif in the title lettering. The textless xx poster has none visible: use it if the owner wants no swastika on the site.

- pt-BR: `6UjYycIR6VLYgggfNpmSPJHmFS0.jpg` 1000x1500, `qLerDVVX4Dk8q9Axeu3OFjcOXap.jpg` 1873x2810, `fM7cHZc9WK9yU47kiiyMS4tW0uw.jpg` 1000x1500
- en: `aupnPtagH9JVBuMrGEanf4iqXEQ.jpg` 2000x3000, `3Gb6G2amMuKZmmCpRqM4N67s8eE.jpg` 1353x2030
- textless: `col4fqppvbht1nvT4OL11SDG4We.jpg` 2000x3000, `keHft98Yidc6xA1s1xlYZsJ4LgW.jpg` 2000x3000

**Backdrops** (16; all TMDB "no language"; textless site totals: 50)

| Path | Size | w1280 | Kind | Flags |
|---|---|---:|---|---|
| `cr0aR8A8TN8rfayqsZIfiL5Gw4k.jpg` | 3840x2160 | 170 KB | still |  |
| `tm43wuKhVoPTCWDJ5tAR0E22h0k.jpg` | 3840x2160 | 180 KB | still |  |
| `9xjj7lXiGJmCgeLuRS299c8mJ3P.jpg` | 2708x1523 | 203 KB | still | diegetic-text:cinema marquee |
| `y8EHVHSnTiWKvzOKLo9PiyRGesR.jpg` | 2598x1461 | 116 KB | still |  |
| `92ewsLVoZhO09b4KcF4Lg3o73Wf.jpg` | 1920x1080 | 108 KB | still |  |
| `2v0rKccg3s7vWN1ac2YX9j2uUTl.jpg` | 1920x1080 | 175 KB | still |  |
| `pd5u0sttA2RdWz1OvOefKNZQ48z.jpg` | 2048x1152 | 261 KB | still | german-army-tunic, no insignia visible; knife-threat |
| `snV10wwjldKh465xTy80XKPs9pU.jpg` | 3840x2160 | 147 KB | still |  |
| `1YSMA6POgdNYhVyAcpypw0jdYMt.jpg` | 2000x1125 | 109 KB | still |  |
| `idynOqKtTaAZy0vmtziro9CMC8G.jpg` | 1920x1080 | 146 KB | still |  |
| `g7FBvWy7obJlZviVTP0eFlO7JMG.jpg` | 1897x1067 | 136 KB | still | below-1920 |
| `qCRx7pryOX3YDYHwEMYLX1EJJP4.jpg` | 1600x900 | 110 KB | still | below-1920 |
| `9SDgHM1gpCGOGpYYlOXyADufhTv.jpg` | 1499x843 | 176 KB | still | below-1920 |
| `aKF0po0AL3kledxJCd3gXajdvhv.jpg` | 1414x795 | 205 KB | still | below-1920 |
| `bMJxwgLyD47CDQ6BFCT2AMMlID7.jpg` | 3840x2160 | 330 KB | art | illustrated-art |
| `qEfbsFCLQikIkRMaa2WDwOnZCZc.jpg` | 3840x2160 | 86 KB | art | key-art-cutout |

Flagged alternates, not in the main list:

| Path | Size | w1280 | Flags |
|---|---|---:|---|
| `3kw5QXcqofEal3onLTIVLMbsLu9.jpg` | 3040x1710 | 132 KB | nazi-uniform |
| `fxCmRDZqgj8RhogE5QeSqKwebWj.jpg` | 2708x1523 | 150 KB | nazi-uniform:SS cap badge |
| `aNTW6eg0vcmpNYZXQ654GqAqQjl.jpg` | 3840x2160 | 117 KB | nazi-uniform; diegetic-text:film poster |
| `3Sr97bem2wuO8dE9ax1lCt8xrgk.jpg` | 3840x2160 | 169 KB | nazi-uniform:SS, armband visible |
| `bjhzR5r7hICzAbLmtAZHYHYZ055.jpg` | 3044x1712 | 74 KB | nazi-uniform:eagle insignia |

### Limitless (`limitless-2011`)

- TMDB [51876](https://www.themoviedb.org/movie/51876-limitless) · IMDb tt1219289 · Wikipedia: Limitless (film)
- Brazilian title: **Sem Limites** (second source: ptwiki)
- md: Sem Limites, 2011, Neil Burger, 105 min (`limitless-2011.md:14`)
- Release: TMDB primary 2011-03-17, Brazil 25/03/2011 (BR)
- Country: TMDB United States · Wikipedia United States · Original language: en

- Direction: Neil Burger [W+B]
- Writing: Leslie Dixon (Screenplay) [W+B]; Alan Glynn (Novel (The Dark Fields)) [W+B]
- Photography: Jo Willems [W+B]
- Music: Paul Leonard-Morgan [W+B]
- Editing: Naomi Geraghty [W+B]; Tracy Adams [W+B]
- Producers: Leslie Dixon [W+B]; Scott Kroopf [W+B]; Ryan Kavanaugh [W+B]
- Cast: Bradley Cooper as Eddie Morra [W+B]; Robert De Niro as Carl Van Loon [W+B]; Abbie Cornish as Lindy [W+B]; Andrew Howard as Gennady [W]; Anna Friel as Melissa Gant [W+B]; Johnny Whitworth as Vernon Gant [W]
- Note: TMDB character reads "Edward Morra"; Wikipedia "Eddie Morra".

**Poster** primary `r8anWUCVK7MZEolcfPrM9eFkRO4.jpg` 1000x1426 (fallback: no pt-BR poster on TMDB).

- en: `r8anWUCVK7MZEolcfPrM9eFkRO4.jpg` 1000x1426, `hv5JMCrMVLvV6HKPf9FcBuyk2MG.jpg` 1000x1500
- textless: `4grrNnjeSRWK7fw48oiteVY6GhA.jpg` 1000x1426, `2E1bmVP3jEUvwd2zaLUmp8lwlLI.jpg` 1000x1500

**Backdrops** (17; all TMDB "no language"; textless site totals: 26)

| Path | Size | w1280 | Kind | Flags |
|---|---|---:|---|---|
| `1wsl5RFtJdrEia9U7LTMq2bcOwW.jpg` | 2048x1152 | 177 KB | still |  |
| `9BrEqPLAJVnDBxV0Fm1lKJ1WSmv.jpg` | 1920x1080 | 166 KB | still |  |
| `bPsUUR9uY7mO2Sbql6MDVzigzgI.jpg` | 1920x1080 | 137 KB | still |  |
| `sXagoyyNpW1Gp9ijTfiepLXWqdP.jpg` | 3200x1800 | 157 KB | still |  |
| `bdDcO7EjJ5p7eO3rpluPHuXKDBN.jpg` | 3200x1800 | 116 KB | still |  |
| `hgP3DpOPgmbDRJYTfUVy4L83wXr.jpg` | 3200x1800 | 158 KB | still |  |
| `glCaVq3xLZScilMqv9yS0sJuw0m.jpg` | 3200x1800 | 187 KB | still |  |
| `5FsjxutoW2rCoPnY1m1m3KzOtqh.jpg` | 1920x1080 | 138 KB | still |  |
| `4Wc4jdGG1AlSl5z1b1h4Zaa0P13.jpg` | 1920x1080 | 180 KB | still |  |
| `gk0tSU5tbmtWBBe31CmU1qeaiVq.jpg` | 1920x1080 | 134 KB | still | diegetic-text:floating letters effect |
| `nBQzrxjf9RBdt3fBbm0AOwwMBEH.jpg` | 1920x1080 | 214 KB | still |  |
| `o3YDMn1ZBLsT372szJfCc5UxDkf.jpg` | 1920x1080 | 196 KB | still |  |
| `A6Af63l1CiOz3KpJokdA7ga8xzd.jpg` | 1920x1080 | 110 KB | still |  |
| `mcVNmTjUFS0U6mhxJRhsP8zhMeP.jpg` | 1920x1080 | 180 KB | still |  |
| `7evR106llnVKTQnjepnbIY26Ht0.jpg` | 1920x1080 | 89 KB | still |  |
| `9V6Yq2ZVUmyAPcPyDcCBPnkluKF.jpg` | 3840x2160 | 135 KB | art |  |
| `eoRtlcYm7RDxtaZ7v0G0dO0UjeR.jpg` | 3840x2160 | 206 KB | art |  |

### Lord of War (`lord-of-war-2005`)

- TMDB [1830](https://www.themoviedb.org/movie/1830-lord-of-war) · IMDb tt0399295 · Wikipedia: Lord of War
- Brazilian title: **O Senhor das Armas** (second source: ptwiki)
- md: O Senhor das Armas, 2005, Andrew Niccol, 122 min (`lord-of-war-2005.md:14`)
- Release: TMDB primary 2005-09-16, Brazil 14/10/2005 (BR)
- Country: TMDB United States · Wikipedia United States, Germany · Original language: en

- Direction: Andrew Niccol [W+B]
- Writing: Andrew Niccol (Writer) [W+B]
- Photography: Amir Mokri [W+B]
- Music: Antonio Pinto [W+B]
- Editing: Zach Staenberg [W+B]
- Producers: Andrew Niccol [W+B]; Nicolas Cage [W+B]; Philippe Rousselet [W+B]
- Cast: Nicolas Cage as Yuri Orlov [W+B]; Bridget Moynahan as Ava Fontaine [W+B]; Jared Leto as Vitaly Orlov [W+B]; Ethan Hawke as Jack Valentine [W+B]; Eamonn Walker as André Baptiste Sr. [W]; Ian Holm as Simeon Weisz [W]

**Poster** primary `yLxbDZ1h7wbHo7mkyX5AR9hjODe.jpg` 1000x1500 (pt-BR).

- pt-BR: `yLxbDZ1h7wbHo7mkyX5AR9hjODe.jpg` 1000x1500, `sYGUx9T1OsrcigRP1x3QwwR87bU.jpg` 600x900
- en: `3MGQD4yXokufNlW1AyRXdiy7ytP.jpg` 1340x2000, `u5O3JTZzrpETnHQaIEUcsHE02or.jpg` 1000x1500
- textless: `gxRM135fpi74UsANJ9VuA5P94l6.jpg` 2000x3000, `6ynAcIkXYLB50RYOFSKLW1uIdLi.jpg` 2000x3000

**Backdrops** (14; all TMDB "no language"; textless site totals: 20)

| Path | Size | w1280 | Kind | Flags |
|---|---|---:|---|---|
| `nkC2qbZooCzb0koMq03MuQ1YqKo.jpg` | 1920x1080 | 210 KB | still |  |
| `1tyP2CmZIWlq3ybupKrRRXnfRbR.jpg` | 1920x1080 | 242 KB | still |  |
| `qSe6q3q4ASw5vMav9YVGnOEtZsx.jpg` | 1920x1080 | 73 KB | still |  |
| `9fnCC4vAyn1eClbTPK8YBRy2f13.jpg` | 2048x1152 | 201 KB | still |  |
| `8mwTkP0ouOpnfqq1060qDoji3Oa.jpg` | 2560x1440 | 237 KB | still |  |
| `rFas9NuL5VPezt48JirQR0V2y7t.jpg` | 1280x720 | 100 KB | still | below-1920 |
| `itZrt9Q5b4PJNfMT4ukRp3RDCHR.jpg` | 1423x800 | 159 KB | still | below-1920 |
| `lt1gMRSw7SVQcj3xP8tGUTpd1qI.jpg` | 1390x782 | 173 KB | still | below-1920 |
| `5HLNp2zEsXezVoXtOfLJE29xaUI.jpg` | 3648x2052 | 237 KB | art |  |
| `d3C6ZzIaq1I8q2LpL1TnUQaMlVb.jpg` | 3840x2160 | 169 KB | art |  |
| `qz2mgk4UwejtZLdkzrOsSWuzgmF.jpg` | 1920x1080 | 193 KB | art |  |
| `6faxYGRA1gNuBojuJiffjNAlYVx.jpg` | 3840x2160 | 189 KB | art |  |
| `aDswjn9q5QCtLi7DaoJ21rq2pm8.jpg` | 3840x2160 | 110 KB | art |  |
| `nc0gyicqDycGTWMgKowM9tULuZZ.jpg` | 3840x2160 | 155 KB | art |  |

### Obsession (`obsession-2026`)

- TMDB [1339713](https://www.themoviedb.org/movie/1339713-obsession) · IMDb tt37287335 · Wikipedia: Obsession (2025 film)
- Brazilian title: **Obsessão** (second source: ptwiki)
- md: Obsessão, 2025, Curry Barker, 108 min (`obsession-2026.md:14`)
- Release: TMDB primary 2026-05-13, Brazil 14/05/2026 (BR)
- Country: TMDB United States · Wikipedia United States · Original language: en

- Direction: Curry Barker [W+B]
- Writing: Curry Barker (Writer) [W+B]
- Photography: Taylor Clemons [W+B]
- Music: Rock Burwell [W+B]
- Editing: Curry Barker [W+B]
- Producers: James Harris [W+B]; Haley Nicole Johnson [W+B]; Christian Mercuri [W+B]
- Cast: Michael Johnston as Bear [W+B]; Inde Navarrette as Nikki [W+B]; Cooper Tomlinson as Ian [W+B]; Megan Lawless as Sarah [W+B]; Andy Richter as Carter [W]; Haley Fitzgerald as Viola [W]

**Poster** primary `wUc6IDf5ChjM1UyQye21qFBeJY0.jpg` 1000x1500 (pt-BR).

- pt-BR: `wUc6IDf5ChjM1UyQye21qFBeJY0.jpg` 1000x1500, `cngBPFnLuC7mRVmBwMVFKtYFADK.jpg` 2000x3000, `yhtt7IdzjJ6Vwh1AcG54QFYPtwf.jpg` 2000x3000
- en: `bRwnj8WEKBCvmfeUNOukJPwB43K.jpg` 2000x3000, `7Var7KpENv7M2hcXsRV0ZoD8aYV.jpg` 2000x3000
- textless: `o5VincY0eEAq4GHHiKcWjSuNPCm.jpg` 1680x2520, `tTX4xnZKoPJnNQT8vYYkNgRt6hr.jpg` 2000x3000

**Backdrops** (15; all TMDB "no language"; textless site totals: 71)

| Path | Size | w1280 | Kind | Flags |
|---|---|---:|---|---|
| `5lTZyuBTNOfawsfPT8Q0cIg6qAF.jpg` | 3840x2160 | 98 KB | still |  |
| `uoTZOIXnkcTgJe1emITpsQq7sPu.jpg` | 3840x2160 | 105 KB | still |  |
| `diOZbaDnB2CIilwd0527AB1qMvW.jpg` | 3200x1800 | 102 KB | still |  |
| `u5BkYDM5gfK4wINfoIFMAcEUKhx.jpg` | 1920x1080 | 119 KB | still |  |
| `7xZCxnhIB7XNwbJDoaNocFzGOmO.jpg` | 3840x2160 | 99 KB | still |  |
| `oICYZzr1arFtiaPrQfOTYZOOrCy.jpg` | 1920x1080 | 147 KB | still |  |
| `d40SQY5TXCF8NJN2C6FnxFHsOD4.jpg` | 3840x2160 | 67 KB | still |  |
| `fnASfC4pJ4NSzJ1ch7FBD99PiaZ.jpg` | 3840x2160 | 149 KB | still |  |
| `8nnO9zr2jUH2qH2PysbRQ1TMaye.jpg` | 3236x1820 | 61 KB | still |  |
| `15baaheTOxyJvnzFw8Xv8otes5g.jpg` | 3840x2160 | 113 KB | still | diegetic-text:ONE WISH WILLOW prop |
| `aJNHKRM5BiGroXGPDhrHeAnSWQ3.jpg` | 3840x2160 | 96 KB | still |  |
| `ovFpatjBA43fsjcWo5RRpq6r6Ou.jpg` | 3840x2160 | 131 KB | still |  |
| `jJUYB1WUZhP3NbbdxLeC3ERNGK.jpg` | 3840x2160 | 63 KB | still |  |
| `3PIc1ToM2bNf19P2k1VlHC6i1Kt.jpg` | 3236x1820 | 145 KB | still |  |
| `qDmeLX1NTCD7B2IbDhCEReJgmO8.jpg` | 3840x2160 | 127 KB | art | promo-art |

### Pulp Fiction (`pulp-fiction-1994`)

- TMDB [680](https://www.themoviedb.org/movie/680-pulp-fiction) · IMDb tt0110912 · Wikipedia: Pulp Fiction
- Brazilian title: **Pulp Fiction: Tempo de Violência** (second source: ptwiki)
- md: Pulp Fiction: Tempo de Violência, 1994, Quentin Tarantino, 154 min (`pulp-fiction-1994.md:14`)
- Release: TMDB primary 1994-09-10, Brazil 03/03/1995 (BR)
- Country: TMDB United States · Wikipedia United States · Original language: en

- Direction: Quentin Tarantino [W+B]
- Writing: Quentin Tarantino (Screenplay and story) [W+B]; Roger Avary (Story) [W+B]
- Photography: Andrzej Sekula [W+B]
- Music: (none credited) — No composer credit in any source (pre-existing songs; music supervisor Karyn Rachtman per TMDB).
- Editing: Sally Menke [W+B]
- Producers: Lawrence Bender [W+B]
- Cast: John Travolta as Vincent Vega [W+B]; Samuel L. Jackson as Jules Winnfield [W+B]; Uma Thurman as Mia Wallace [W+B]; Bruce Willis as Butch Coolidge [W+B]; Ving Rhames as Marsellus Wallace [W]; Harvey Keitel as Winston Wolfe [W]
- Note: TMDB character reads "The Wolf"; Wikipedia "Winston Wolfe".
- Note: Only one producer is credited in the two independent sources.

**Poster** primary `tptjnB2LDbuUWya9Cx5sQtv5hqb.jpg` 1400x2100 (pt-BR).

- pt-BR: `tptjnB2LDbuUWya9Cx5sQtv5hqb.jpg` 1400x2100, `40YtMiZxlGpoHLVrhFWkDcGoLEJ.jpg` 2000x3000, `wGPP9ZOoYpLd9MnFxuDH3WKRL2t.jpg` 1000x1500
- en: `vQWk5YBFWF4bZaofAbv0tShwBvQ.jpg` 2000x3000, `wZbnRMarWnO4DJRisOaK4QEg1tl.jpg` 1000x1500
- textless: `AmyQTQsNxITitCM0Ya5l5bpYGpn.jpg` 1600x2400, `z0NDXPgclyhoGAWDokTAzvJeRTt.jpg` 1400x2100

**Backdrops** (19; all TMDB "no language"; textless site totals: 53)

| Path | Size | w1280 | Kind | Flags |
|---|---|---:|---|---|
| `suaEOtk1N1sgg2MTM7oZd2cfVp3.jpg` | 2631x1480 | 169 KB | still |  |
| `9pGM43a9VmXxwIxmhJoiDkcB2hT.jpg` | 3000x1688 | 210 KB | still |  |
| `eDMZmfnH50DDboUxTRnOYYpE9aY.jpg` | 2318x1304 | 174 KB | still |  |
| `19joFuQ6YTkcru4rvOf8b9CIjjg.jpg` | 2900x1631 | 192 KB | still | diegetic-text:partial signage |
| `tfaY1QVIhkr4ft1eUk1UP2ZdfCC.jpg` | 2880x1620 | 129 KB | still |  |
| `tamCUHl16mptimLh1ZwJ1XH6QOr.jpg` | 1920x1080 | 194 KB | still |  |
| `vrk8HqZ6Q5vaW1fYqTbfupsPpXQ.jpg` | 1920x1080 | 223 KB | still |  |
| `u68kjtFhoulKVdcYVHUzBai9TTY.jpg` | 2880x1620 | 143 KB | still |  |
| `zlHyF5q27hyA5T6IwlJp0rcyW3R.jpg` | 2680x1507 | 224 KB | still |  |
| `7AR20EehD6HxHU0mUTetQKHCxUd.jpg` | 2502x1407 | 106 KB | still |  |
| `aHq7BwReAmLB5Mip3WWQSELAjDC.jpg` | 2449x1376 | 66 KB | still |  |
| `1z0Mh1mVuIkAEqMXDzJwRSiahLm.jpg` | 3840x2160 | 107 KB | still |  |
| `1SUIPFsfuNnAQExdbWyawXBGf4v.jpg` | 3840x2160 | 121 KB | still |  |
| `t0vJ5SkdOxzECDw4X9IvaXc1o68.jpg` | 3840x2160 | 191 KB | still |  |
| `kEMHy177TS3JkpHRRuI00Kufoge.jpg` | 3840x2160 | 137 KB | still |  |
| `v1noweOkBdTPlkdw7J5d4y55Bn3.jpg` | 2000x1125 | 139 KB | still |  |
| `cOGysF4SXauEKz18mFGmkZW6O2T.jpg` | 3840x2160 | 157 KB | art | poster-photo |
| `7PNSr7qKtdusxuFXb5IyEfQTPlD.jpg` | 1920x1080 | 161 KB | art |  |
| `52StM7zDmcjeKxWkW55X5LtoLQi.jpg` | 1920x1080 | 54 KB | art |  |

### Ready or Not (`ready-or-not-double-feature-2026`)

- TMDB [567609](https://www.themoviedb.org/movie/567609-ready-or-not) · IMDb tt7798634 · Wikipedia: Ready or Not (2019 film)
- Brazilian title: **Casamento Sangrento** (second source: ptwiki)
- md: Casamento Sangrento, 2019, Matt Bettinelli-Olpin & Tyler Gillett, 95 min (`ready-or-not-double-feature-2026.md:14`)
- Release: TMDB primary 2019-08-21, Brazil 23/12/2019 (BR)
- Country: TMDB United States · Wikipedia United States · Original language: en

- Direction: Matt Bettinelli-Olpin [W+B]; Tyler Gillett [W+B]
- Writing: Guy Busick (Writer) [W+B]; R. Christopher Murphy (Writer) [W+B]
- Photography: Brett Jutkiewicz [W+B]
- Music: Brian Tyler [W+B]
- Editing: Terel Gibson [W+B]
- Producers: Tripp Vinson [W+B]; James Vanderbilt [W+B]; William Sherak [W+B]
- Cast: Samara Weaving as Grace [W+B]; Adam Brody as Daniel [W+B]; Mark O'Brien as Alex [W+B]; Henry Czerny as Tony [W+B]; Andie MacDowell as Becky [W]; Melanie Scrofano as Emilie [W]

**Poster** primary `k5dJuAdjv1wCq2Vzj1GZfwGmLoU.jpg` 2000x3000 (pt-BR).

- pt-BR: `k5dJuAdjv1wCq2Vzj1GZfwGmLoU.jpg` 2000x3000, `b7xXu3NUybFAS39CYllCOo7Ntn9.jpg` 2000x3000
- en: `oJD9KQFoObZmxAS1je56SIFVNJt.jpg` 2000x3000, `vOl6shtL0wknjaIs6JdKCpcHvg8.jpg` 2000x3000
- textless: `3lt9gDV4q0ubNE6E1MBVgwzt2UD.jpg` 2000x3000, `tQMGl6mPSpH0o85Ed9WvbxqGPDz.jpg` 2000x3000

**Backdrops** (17; all TMDB "no language"; textless site totals: 65)

| Path | Size | w1280 | Kind | Flags |
|---|---|---:|---|---|
| `oJ1MIABA0WF0a7MDVQnnMvBdex8.jpg` | 3840x2160 | 118 KB | still | mild-blood |
| `5clwbYVMmV5FytxYO8KZ5LpJcQZ.jpg` | 3840x2160 | 109 KB | still |  |
| `aNrNi5QExO6b8MnEGsfpgp21NIY.jpg` | 3840x2160 | 193 KB | still |  |
| `j8uPZSPjKYzHlN2B4NhPQVWWZ5x.jpg` | 3840x2160 | 179 KB | still |  |
| `ubqaGfwYxZMaTEVfhPghF87tzYm.jpg` | 1920x1080 | 188 KB | still |  |
| `lg6umZ6dzD39zyiYamktfvJCFzs.jpg` | 3840x2160 | 49 KB | still |  |
| `y3XBQL53Ks0FMH6ewPrK6tghTHN.jpg` | 3840x2160 | 172 KB | still |  |
| `tJXF1z6G73MVVFQZVIIfv9M2oug.jpg` | 3840x2160 | 201 KB | still |  |
| `vLJxumnSn8AQRxfznvgmXVlcjG3.jpg` | 3840x2160 | 219 KB | still |  |
| `w7R0Tm4BdMs6hFVVOsuWL2xROft.jpg` | 3840x2160 | 259 KB | still |  |
| `dK9CJMzmGijl9dkiSguZ6nsVg4V.jpg` | 2400x1350 | 103 KB | still | struggle |
| `eJNSYDiBQIlwLeFf8zQdOcj6YaJ.jpg` | 1362x766 | 106 KB | still | below-1920 |
| `6m1jkppbWrfvx635Dwe1l8hAsmC.jpg` | 1351x760 | 110 KB | still | below-1920 |
| `ya4hXbxKUx5oWEWJmVVN09Rm5Gt.jpg` | 1422x800 | 101 KB | still | below-1920 |
| `vkGytvxZzvw9i3UffC4TwardIky.jpg` | 3840x2160 | 183 KB | art | key-art |
| `iUtJ06Rc1HOHzAR0eiaZco9nvKy.jpg` | 3840x2160 | 165 KB | art | key-art |
| `1RGaOOAnZuiepWzjPg286Hxfu2S.jpg` | 2400x1350 | 161 KB | art | key-art |

### Ready or Not: Here I Come (`ready-or-not-double-feature-2026`)

- TMDB [1266127](https://www.themoviedb.org/movie/1266127-ready-or-not-here-i-come) · IMDb tt33978029 · Wikipedia: Ready or Not 2: Here I Come
- Brazilian title: **Casamento Sangrento: A Viúva** (second source: ptwiki + Wikidata pt-br label)
- md: Casamento Sangrento: A Viúva, 2026, Matt Bettinelli-Olpin & Tyler Gillett, 108 min (`ready-or-not-double-feature-2026.md:23`)
- Release: TMDB primary 2026-03-19, Brazil 19/03/2026 (BR)
- Country: TMDB United States · Wikipedia United States · Original language: en

- Direction: Matt Bettinelli-Olpin [W+B]; Tyler Gillett [W+B]
- Writing: Guy Busick (Writer) [W+B]; R. Christopher Murphy (Writer) [W+B]
- Photography: Brett Jutkiewicz [W+B]
- Music: Sven Faulconer [W+B]
- Editing: Jay Prychidny [W+B]
- Producers: Tripp Vinson [W+B]; James Vanderbilt [W+B]; William Sherak [W+B]
- Cast: Samara Weaving as Grace MacCaullay [W+B]; Kathryn Newton as Faith MacCaullay [W+B]; Sarah Michelle Gellar as Ursula Danforth [W+B]; Shawn Hatosy as Titus Danforth [W]; Elijah Wood as The Lawyer [W+B]; Nestor Carbonell as Ignacio El Caido [W]

**Poster** primary `u6OwPW7mO8nrtJoC27W541bRQ8F.jpg` 2000x3000 (pt-BR).

- pt-BR: `u6OwPW7mO8nrtJoC27W541bRQ8F.jpg` 2000x3000, `uUP8RqH8zOnFu042U50k4lENOTO.jpg` 900x1350, `62oDIAJUeXBBXGGrLCjzcCwAES7.jpg` 680x1000
- en: `13ZcJzSGEqVgDSqsS9U5EkQwPkV.jpg` 2000x3000, `jRf89HVEtBZiSnOXXWDhZOfuTwW.jpg` 2000x3000
- textless: `lcrnvyUhcgU58s22R7EFsBLYe9V.jpg` 2000x3000, `546iJKBTu8ZS3f24b3nKSGtxTmF.jpg` 2000x3000

**Backdrops** (18; all TMDB "no language"; textless site totals: 111)

| Path | Size | w1280 | Kind | Flags |
|---|---|---:|---|---|
| `2wbXwwEseGuVAfnmYvVopkBPbAl.jpg` | 3000x1688 | 136 KB | still |  |
| `2okNnNRrFPZHwCqZg21kVn3uIsC.jpg` | 3000x1688 | 205 KB | still |  |
| `pDbGF6T0lacZx8a3XQLCAfKZFAP.jpg` | 3000x1688 | 228 KB | still |  |
| `5Z9BnEJ6wOJZRvYwd79twOmb0v3.jpg` | 3840x2160 | 116 KB | still |  |
| `4ByIxFqL1dsJVaD2mSYCpjGgY8O.jpg` | 3840x2160 | 148 KB | still |  |
| `8csGpIW1esx3x3EfW1SwXZaxwGJ.jpg` | 3840x2160 | 183 KB | still |  |
| `fpl1fBFvJkRJIzRePXqTMNlSfBx.jpg` | 3000x1688 | 133 KB | still |  |
| `7eQZ0OAhlV5Y6BvaumDJQCPjnqi.jpg` | 3840x2160 | 146 KB | still |  |
| `7DEjoBAQz9vMI7PzMj4eDLhmNj2.jpg` | 3000x1688 | 131 KB | still |  |
| `yaC2u43ZnYesblgfVvA1XDqqmcv.jpg` | 2560x1440 | 188 KB | still |  |
| `ktknOLgIKqWiL39CXZoN2iL52WT.jpg` | 3000x1688 | 138 KB | still |  |
| `s9bJYkJWjRVSwiRd1Xf6b4hp2kK.jpg` | 3000x1688 | 155 KB | still |  |
| `hOFujmZfuIs79nVox0s97rZGX7u.jpg` | 3000x1688 | 305 KB | still |  |
| `g1qdBCgCF6iFvD9MFHcxDvEx8Ov.jpg` | 3000x1688 | 110 KB | still |  |
| `gz2d56VceMoonpZBSWJLvnylian.jpg` | 3000x1688 | 132 KB | still |  |
| `4JAG87CuTbcLBQ9kSPN7TQOPJc9.jpg` | 3000x1684 | 153 KB | still |  |
| `lE9CIX0NqKppnwopQdnabID6hZ1.jpg` | 3840x2160 | 310 KB | art |  |
| `5z7DJi3iKcD5Uv8xzxwX5hHSYjY.jpg` | 3840x2160 | 188 KB | art |  |

### The Hateful Eight (`the-hateful-eight-2015`)

- TMDB [273248](https://www.themoviedb.org/movie/273248-the-hateful-eight) · IMDb tt3460252 · Wikipedia: The Hateful Eight
- Brazilian title: **Os Oito Odiados** (second source: ptwiki lead)
- md: Os Oito Odiados, 2015, Quentin Tarantino, 168 min (`the-hateful-eight-2015.md:14`)
- Release: TMDB primary 2015-12-25, Brazil 07/01/2016 (BR)
- Country: TMDB United States · Wikipedia United States · Original language: en

- Direction: Quentin Tarantino [W+B]
- Writing: Quentin Tarantino (Writer) [W+B]
- Photography: Robert Richardson [W+B]
- Music: Ennio Morricone [W+B]
- Editing: Fred Raskin [W+B]
- Producers: Richard N. Gladstein [W+B]; Stacey Sher [W+B]; Shannon McIntosh [W+B]
- Cast: Samuel L. Jackson as Major Marquis Warren [W+B]; Kurt Russell as John "The Hangman" Ruth [W+B]; Jennifer Jason Leigh as Daisy Domergue [W+B]; Walton Goggins as Chris Mannix [W+B]; Demián Bichir as Bob [W]; Tim Roth as Oswaldo Mobray [W]
- Note: Do not use the second names Wikipedia lists for Bichir and Roth: they reveal plot.

**Poster** primary `jfTo9U9OgOXODEEspNnYFuZdR1q.jpg` 1400x2100 (pt-BR).

- pt-BR: `jfTo9U9OgOXODEEspNnYFuZdR1q.jpg` 1400x2100, `gnNM215fP0cNIWBNd1BwdHkF3u5.jpg` 1400x2100, `fEFgAL3qhc6qT3WH4Z6vd7d04fD.jpg` 1853x2779
- en: `jIywvdPjia2t3eKYbjVTcwBQlG8.jpg` 1000x1500, `cB932BToOpAGGnYgbzXvyfoiEwM.jpg` 1800x2700
- textless: `hqsqQyy2VVdv2FnvRNy018qnOn.jpg` 1440x2160, `9b23MAGYmdkDIOWtkpIeQPS7MCD.jpg` 2000x3000

**Backdrops** (16; all TMDB "no language"; textless site totals: 59)

| Path | Size | w1280 | Kind | Flags |
|---|---|---:|---|---|
| `7g1zO5t0bd27Iqn5ZUDJmksOGPJ.jpg` | 3840x2160 | 204 KB | still |  |
| `dqQIgYgP65tAOcgzXzjbqOQ2BV9.jpg` | 1920x1080 | 167 KB | still |  |
| `9jQdllO3v0lZLrmz7W1C9jVT55z.jpg` | 2048x1152 | 255 KB | still |  |
| `iWVXhCkL579GYHjQMs6OxTLOcyk.jpg` | 3000x1688 | 212 KB | still |  |
| `cDxcPmqwhAfpdHFB8mvIqDZslT9.jpg` | 1920x1080 | 171 KB | still |  |
| `8iKMXL7luxnVMAhCxP53Y0OAKsw.jpg` | 3840x2160 | 231 KB | still |  |
| `zWGCll0p3x34elDzNEyOKKzT3Fq.jpg` | 1920x1080 | 271 KB | still |  |
| `ncTlQsLHZJgOir1kbBSTvSoEZZZ.jpg` | 1920x1080 | 255 KB | still |  |
| `ooccnzULstLzvZt4mZ2AA6kzazd.jpg` | 2048x1152 | 151 KB | still |  |
| `5zEbHRQ2H672eYT5IoRg5M0592K.jpg` | 1920x1080 | 180 KB | still |  |
| `1QTl3YRjL3xHrcx4pydTETAVDUP.jpg` | 1920x1080 | 130 KB | still |  |
| `4eboUcfhRVsxIUfmgZMsQpS38GW.jpg` | 1920x1080 | 138 KB | still |  |
| `zm7lKFXAyZUPTqBDfdQyFLZRF5V.jpg` | 2048x1152 | 195 KB | still |  |
| `3mWWyaNdYEhAnv25s4dvnsCqEBl.jpg` | 1920x1080 | 351 KB | still |  |
| `13d7wMUyfgMObIhfCQa4KSQPjaG.jpg` | 3840x2160 | 362 KB | art |  |
| `2ymyKjOMG6qZegd6TvK8L2d5LXW.jpg` | 3840x2160 | 257 KB | art |  |

### How to Make a Killing (`the-inheritance-2025`)

- TMDB [467905](https://www.themoviedb.org/movie/467905-how-to-make-a-killing) · IMDb tt4357198 · Wikipedia: How to Make a Killing
- Brazilian title: **Manual Prático da Vingança Lucrativa** (second source: AdoroCinema, Omelete via web search)
- md: Manual Prático da Vingança Lucrativa, 2025, Dan Berk & Robert Olsen, 99 min (`the-inheritance-2025.md:14`)
- Release: TMDB primary 2026-02-16, Brazil 26/02/2026 (BR)
- Country: TMDB United Kingdom · Wikipedia France, United Kingdom · Original language: en

- Direction: John Patton Ford [W+B]
- Writing: John Patton Ford (Writer) [W+B]; Robert Hamer (Original film (Kind Hearts and Coronets)) [W+B]; John Dighton (Original film (Kind Hearts and Coronets)) [W+B]; Roy Horniman (Original novel (Israel Rank)) [W+B]
- Photography: Todd Banhazl [W+B]
- Music: Emile Mosseri [W+B]
- Editing: Harrison Atkins [W+B]
- Producers: Graham Broadbent [W+B]; Peter Czernin [W+B]
- Cast: Glen Powell as Becket Redfellow [W+B]; Margaret Qualley as Julia Steinway [W+B]; Jessica Henwick as Ruth [W+B]; Bill Camp as Warren Redfellow [W]; Zach Woods as Noah Redfellow [W]; Topher Grace as Steven J. Redfellow [W]
- Note: TMDB reads "Julia" and "Steven Redfellow"; Wikipedia adds the surname and middle initial. Czernin is "Pete" on Wikipedia, "Peter" on TMDB and Box Office Mojo.

**Poster** primary `7zWwXsgM7aza7mBqOSCcrfG0FU6.jpg` 2000x3000 (pt-BR).

- pt-BR: `7zWwXsgM7aza7mBqOSCcrfG0FU6.jpg` 2000x3000, `eyYbgERxVuWBhCeZZLNFlZVWLz2.jpg` 2000x3000, `yC7kvzSBopVid128M60E5YOKsp.jpg` 2000x3000
- en: `vxMeKC7o5Gi8IHMi6lUgsdprTqv.jpg` 2000x3000, `yQ7OP2HYxl9YmkWNMkuUA2YaF5.jpg` 2000x3000
- textless: `36CFG4tkXgfZmMrW7INVDOUenuN.jpg` 2000x3000, `3E0o2jkJt3QGSnl6GSh74ZWuwnu.jpg` 2000x3000

**Backdrops** (17; all TMDB "no language"; textless site totals: 30)

| Path | Size | w1280 | Kind | Flags |
|---|---|---:|---|---|
| `vuaPZ4IbsIRr2wDARZT7rFQ5CgP.jpg` | 3200x1800 | 79 KB | still |  |
| `tJfyYC6KBgsra8mOeePS2KkkgBc.jpg` | 3840x2160 | 147 KB | still |  |
| `bVkeFg8WQLfd8BwwqtqviftBkYF.jpg` | 3840x2160 | 125 KB | still |  |
| `8Tlk2Wax750IiFLCKay57ez4LhN.jpg` | 3840x2160 | 170 KB | still |  |
| `8NRG6L6Y35CDhppeElyUu0eyr8e.jpg` | 3840x2160 | 146 KB | still |  |
| `mhXdDrphWF7XTQWyp3d8MZUqb3o.jpg` | 3840x2160 | 224 KB | still |  |
| `3kjCA2oBdlHedkyuifEjRlrlSHY.jpg` | 3840x2160 | 129 KB | still |  |
| `fzj8Hn3JlBPaC3iuYRmQUWSV3fO.jpg` | 3840x2160 | 165 KB | still |  |
| `cnFfhwckqE9wv0h5zl4iSfY5CPD.jpg` | 3840x2160 | 126 KB | still |  |
| `bmPVC8zVzLcNPA28FJejKeRPtc6.jpg` | 3840x2160 | 143 KB | still |  |
| `2QDJW41bGwYNrVSFtb36skEh88E.jpg` | 3840x2160 | 114 KB | still |  |
| `lMsKDlFV2vttQi9hJpaC00Pd3WH.jpg` | 3840x2160 | 156 KB | still |  |
| `k5VP8fL72NXrjRYZATIicCaZoyM.jpg` | 3840x2160 | 162 KB | still |  |
| `8aQQ6VEcmCsiUMPRCymVSaNxA62.jpg` | 3840x2160 | 148 KB | still |  |
| `vgGcmZWWjxYanOrPxxIoijZqCtQ.jpg` | 3840x2160 | 189 KB | art |  |
| `yU2Fz8FFcTcblYDHvShJqZ1dTOC.jpg` | 3840x2160 | 173 KB | art |  |
| `bkUa5ZDqjQPx6rkxs0hM87vaWVa.jpg` | 3840x2160 | 40 KB | art |  |

### The Lobster (`the-lobster-2015`)

- TMDB [254320](https://www.themoviedb.org/movie/254320-the-lobster) · IMDb tt3464902 · Wikipedia: The Lobster
- Brazilian title: **O Lagosta** (second source: ptwiki)
- md: O Lagosta, 2015, Yorgos Lanthimos, 119 min (`the-lobster-2015.md:14`)
- Release: TMDB primary 2015-10-15, Brazil 23/06/2016 (BR)
- Country: TMDB Ireland, United Kingdom · Wikipedia Ireland, United Kingdom, Greece, France, Netherlands · Original language: en

- Direction: Yorgos Lanthimos [W+B]
- Writing: Yorgos Lanthimos (Writer) [W+B]; Efthimis Filippou (Writer) [W+B]
- Photography: Thimios Bakatakis [W+B]
- Music: (none credited) — No composer credit in any source (pre-existing music; Wikipedia infobox music field empty).
- Editing: Yorgos Mavropsaridis [W+B]
- Producers: Ceci Dempsey [W+B]; Ed Guiney [W+B]; Lee Magiday [W+B]
- Cast: Colin Farrell as David [W+B]; Rachel Weisz as Short Sighted Woman [W+B]; Olivia Colman as Hotel Manager [W+B]; Léa Seydoux as Loner Leader [W]; Michael Smiley as Loner Swimmer [W]; Ariane Labed as The Maid [W]

**Poster** primary `cUiXj9cGE7xjAm9L23jSKPnxs8g.jpg` 1000x1500 (pt-BR).

- pt-BR: `cUiXj9cGE7xjAm9L23jSKPnxs8g.jpg` 1000x1500, `eWuvKmyyYqb1ukPoZN1MQ8Hjumi.jpg` 1000x1500, `j6myBmhTWNo4M3UrYxvtLHxSf6G.jpg` 1400x2100
- en: `7Y9ILV1unpW9mLpGcqyGQU72LUy.jpg` 1000x1500, `oe3XoAL0he16IWLHFzdg32q5ty6.jpg` 1080x1600
- textless: `dFxv2V5M5tjgANU17xQ7N0nPFn1.jpg` 2000x3000, `38PZNWH9JLAXKKDTTbIHE3od9wB.jpg` 1000x1500

**Backdrops** (16; all TMDB "no language"; textless site totals: 24)

| Path | Size | w1280 | Kind | Flags |
|---|---|---:|---|---|
| `s48CvFbWoWHhSPgz2wW9Rffw04q.jpg` | 3000x1688 | 349 KB | still |  |
| `rqMvkc7P5yYfomhYXDmteWQoUeK.jpg` | 3000x1688 | 225 KB | still |  |
| `2JmiFFiOxdTMOYgUbZThC3QsAsE.jpg` | 3840x2160 | 231 KB | still |  |
| `oLIdWgOuuB5HtpTcC9ywZrXPhVR.jpg` | 3840x2160 | 212 KB | still |  |
| `7KBufhNhLaSBmEg2s4GcmKhJkIa.jpg` | 3300x1856 | 298 KB | still |  |
| `9WSMvUBd18mK5yuOy3y06RpXu60.jpg` | 3300x1856 | 233 KB | still |  |
| `94YrKYbwLpekGRf4YI8RyBYxQYo.jpg` | 1920x1080 | 273 KB | still |  |
| `jRcexaXo41F5sJ3w8oCtej6G551.jpg` | 1920x1080 | 147 KB | still |  |
| `u4NWlK02GkIzWOcZat4Pq0ZJ8xy.jpg` | 3300x1856 | 342 KB | still |  |
| `lyRwGflXyvGLIOc6U08CRGs9J5l.jpg` | 3300x1856 | 254 KB | still |  |
| `7ZNpC4KHrR6T1Ejy2uM69clz2uK.jpg` | 3300x1856 | 277 KB | still |  |
| `744uCsFeZlr5E1XFUNJXz439Ci.jpg` | 3000x1688 | 239 KB | still | diegetic-text:ROOM sign |
| `es1u1cu7pPk0o2InwXA1BrYRD3d.jpg` | 1920x1080 | 209 KB | still |  |
| `itZNYqU2bN99gTjXZYPQau5CNS2.jpg` | 1362x766 | 131 KB | still | low-res; below-1920 |
| `wrrA1xzZq7z84hacSsSTbJoPaUx.jpg` | 3840x2160 | 48 KB | art | key-art-cutout |
| `wjP1pYBGMvMnogw254tdwfM1yrj.jpg` | 3840x2160 | 37 KB | art | key-art-cutout |

### The Long Walk (`the-long-walk-2025`)

- TMDB [604079](https://www.themoviedb.org/movie/604079-the-long-walk) · IMDb tt10374610 · Wikipedia: The Long Walk (2025 film)
- Brazilian title: **A Longa Marcha: Caminhe ou Morra** (second source: ptwiki + Wikidata pt-br label)
- md: The Long Walk, 2025, Francis Lawrence, 108 min (`the-long-walk-2025.md:13`)
- Release: TMDB primary 2025-09-10, Brazil 18/09/2025 (BR)
- Country: TMDB United States · Wikipedia United States · Original language: en

- Direction: Francis Lawrence [W+B]
- Writing: JT Mollner (Screenplay) [W+B]; Stephen King (Novel) [W+B]
- Photography: Jo Willems [W+B]
- Music: Jeremiah Fraites [W+B]
- Editing: Mark Yoshikawa [W+B]; Peggy Eghbalian [B]
- Producers: Roy Lee [W+B]; Steven Schneider [W+B]; Francis Lawrence [W+B]
- Cast: Cooper Hoffman as Raymond Garraty [W+B]; David Jonsson as Peter McVries [W+B]; Garrett Wareing as Billy Stebbins [W+B]; Ben Wang as Hank Olson [W]; Tut Nyuot as Arthur Baker [W+B]; Charlie Plummer as Gary Barkovitch [W]
- Note: Peggy Eghbalian: Editor on TMDB and Box Office Mojo, not in Wikipedia infobox; one festival listing credits her and Yoshikawa under assembly. Treat her title as slightly uncertain.

**Poster** primary `qE0XKOHZvXtiM4aBLlTPUVZiIc5.jpg` 1024x1536 (pt-BR).

- pt-BR: `qE0XKOHZvXtiM4aBLlTPUVZiIc5.jpg` 1024x1536, `hxaW1iVGtw3tovCSkPlIL9PhvmA.jpg` 2000x3000, `dNYBL51Gj7kNdw4e5NtRUbtC256.jpg` 500x750
- en: `wobVTa99eW0ht6c1rNNzLkazPtR.jpg` 2000x3000, `8DujdBpmSXOJJyp9R5BgUvIhYB.jpg` 2000x3000
- textless: `qtT4PsR1HFwetwuWmLRImONHtuh.jpg` 2000x3000, `5KuqXJsxcPuZ6FCq2u5ljr6hKWR.jpg` 2000x3000

**Backdrops** (17; all TMDB "no language"; textless site totals: 36)

| Path | Size | w1280 | Kind | Flags |
|---|---|---:|---|---|
| `zf7BQY4k5RNFI1sD4n9EVLnEG8m.jpg` | 3000x1688 | 137 KB | still |  |
| `jyghveaMeSnTMFKT2ZebfVymhET.jpg` | 3000x1688 | 147 KB | still | diegetic-text:vehicle marking |
| `pIVvTbK6wIOXfIfErIymh7inXSV.jpg` | 3000x1688 | 142 KB | still |  |
| `rMjSSvCVyHVKaG1rOmOOIXlCp0z.jpg` | 3000x1688 | 84 KB | still |  |
| `mfgkSQVqrNrIzdbIffYhHRL9dfe.jpg` | 1920x1080 | 112 KB | still |  |
| `apSrVzdmHKPpZa5Dzb7sWFKExQO.jpg` | 1920x1080 | 107 KB | still |  |
| `bzwoNgJso0imrmqh0m0vzExQr3U.jpg` | 1920x1080 | 123 KB | still |  |
| `c3T1Ux7eZeZ4XLJ5hq3kSM6JI99.jpg` | 1920x1080 | 72 KB | still |  |
| `oV9TOQV0Dk8ggxwa1DzcY0R6WVK.jpg` | 1920x1080 | 74 KB | still |  |
| `iMaDXyZfjbeWyykuU1qQWOgjZuk.jpg` | 3000x1688 | 106 KB | still |  |
| `bYfjOg7YBiLbUfcBzHDHkylDWda.jpg` | 3000x1688 | 141 KB | still |  |
| `dQpY3kSMT5vkU0EGG3jGvU1Gyns.jpg` | 3000x1688 | 113 KB | still |  |
| `eR3J6DvVmGbctm6kWqwWRWCYOfy.jpg` | 3000x1688 | 247 KB | still |  |
| `veAaJEZdxthGPJY7xoUKA6dW6Cr.jpg` | 3000x1688 | 308 KB | still |  |
| `kSaEL8xcYLtZ2oPenC2HzYerhw1.jpg` | 3000x1688 | 210 KB | still |  |
| `2dlt9I2ga6hweywz9zsFUz1PVii.jpg` | 3840x2160 | 148 KB | art |  |
| `32nioleNI8wL6SQwvuBcxNdhu37.jpg` | 1920x1080 | 165 KB | art |  |

### The Menu (`the-menu-2022`)

- TMDB [593643](https://www.themoviedb.org/movie/593643-the-menu) · IMDb tt9764362 · Wikipedia: The Menu (2022 film)
- Brazilian title: **O Menu** (second source: ptwiki, AdoroCinema)
- md: The Menu, 2022, Mark Mylod, 107 min (`the-menu-2022.md:14`)
- Release: TMDB primary 2022-11-17, Brazil 17/11/2022 (BR)
- Country: TMDB United States · Wikipedia United States · Original language: en

- Direction: Mark Mylod [W+B]
- Writing: Seth Reiss (Writer) [W+B]; Will Tracy (Writer) [W+B]
- Photography: Peter Deming [W+B]
- Music: Colin Stetson [W+B]
- Editing: Christopher Tellefsen [W+B]
- Producers: Adam McKay [W+B]; Betsy Koch [W+B]; Will Ferrell [W+B]
- Cast: Anya Taylor-Joy as Margot [W+B]; Ralph Fiennes as Chef Slowik [W+B]; Nicholas Hoult as Tyler [W+B]; Janet McTeer as Lillian [W]; Paul Adelstein as Ted [W]; Rob Yang as Bryce [W]

**Poster** primary `fPtUgMcLIboqlTlPrq0bQpKK8eq.jpg` 2000x3000 (fallback: no pt-BR poster on TMDB).

- en: `fPtUgMcLIboqlTlPrq0bQpKK8eq.jpg` 2000x3000, `v31MsWhF9WFh7Qooq6xSBbmJxoG.jpg` 2000x3000
- textless: `qutqzbLrDWaxEZIyQnJyvbKlEp1.jpg` 2000x3000, `q90kzMTCyJasscaEEEL3xDB6KEn.jpg` 2000x3000

**Backdrops** (16; all TMDB "no language"; textless site totals: 38)

| Path | Size | w1280 | Kind | Flags |
|---|---|---:|---|---|
| `4vSBj7BYsyuKCx96EJzGyp20WfY.jpg` | 3840x2160 | 101 KB | still |  |
| `tKHiT9rBKKbu3F9TuBNKq621JiD.jpg` | 3840x2160 | 121 KB | still |  |
| `vlBVkglm66XfpZnzN5hKZjekOCi.jpg` | 3840x2160 | 96 KB | still |  |
| `21aqNI7u45TliNOQfKHliSywZ3e.jpg` | 3840x2160 | 234 KB | still |  |
| `9q0e66c0cgaPAa9GQEgGCpEXJJ3.jpg` | 3840x2160 | 205 KB | still |  |
| `gkQoX62Sihlq7ga8PuYxxepsGXe.jpg` | 3840x2160 | 86 KB | still |  |
| `iwgwJsmUqAfRQkKs50oRFgo2Cr1.jpg` | 3000x1688 | 457 KB | still |  |
| `ffqpc7d6izC1KGcRwesaFbI7mHd.jpg` | 3840x2160 | 139 KB | still |  |
| `tosKn2ULGdIPiZjQxReJ986NGHm.jpg` | 3840x2160 | 153 KB | still |  |
| `kk5qZtPPOYDYTLBgmmKYcJ7Zhcf.jpg` | 1920x1080 | 99 KB | still |  |
| `8xrY0uhx8BD5nPhBBToYy4GC7kT.jpg` | 1920x1080 | 100 KB | still |  |
| `p3xFx5JJDY6Qvf9k4greb8noI34.jpg` | 1920x1080 | 97 KB | still |  |
| `uG8jHRfkbp1ZhjunO39PahJZ0Ac.jpg` | 1920x1080 | 77 KB | still |  |
| `jEv34FQaKvrL1n4NlxV3ZuKC7Aq.jpg` | 1920x1080 | 68 KB | still |  |
| `mSyQoValhBsJdq3JNGXJww2Q5yL.jpg` | 3840x2160 | 231 KB | art |  |
| `i7pwdlwMVv63Mv00mk2TrJ4L4Qe.jpg` | 1920x1080 | 159 KB | art |  |

### The Running Man (`the-running-man-2026`)

- TMDB [798645](https://www.themoviedb.org/movie/798645-the-running-man) · IMDb tt14107334 · Wikipedia: The Running Man (2025 film)
- Brazilian title: **O Sobrevivente** (second source: ptwiki + Wikidata pt-br label)
- md: The Running Man, 2025, Edgar Wright, 137 min (`the-running-man-2026.md:13`)
- Release: TMDB primary 2025-11-11, Brazil 20/11/2025 (BR)
- Country: TMDB United States · Wikipedia United Kingdom, United States · Original language: en

- Direction: Edgar Wright [W+B]
- Writing: Michael Bacall (Screenplay) [W+B]; Edgar Wright (Screenplay) [W+B]; Stephen King (Novel) [W+B]
- Photography: Chung Chung-hoon [W+B]
- Music: Steven Price [W+B]
- Editing: Paul Machliss [W+B]
- Producers: Simon Kinberg [W+B]; Nira Park [W+B]; Edgar Wright [W+B]
- Cast: Glen Powell as Ben Richards [W+B]; Colman Domingo as Bobby T [W]; Lee Pace as Evan McCone [W]; Josh Brolin as Dan Killian [W]; William H. Macy as Molie [W]; Michael Cera as Elton Parrakis [W]
- Note: TMDB spells the character "Elton Perrakis"; Wikipedia "Elton Parrakis".
- Note: Box Office Mojo prints the DP as "Chung-hoon Chung", same person.

**Poster** primary `8nBuPCAXLFSuUBjO1WvJ2blEVmK.jpg` 2000x3000 (pt-BR).

- pt-BR: `8nBuPCAXLFSuUBjO1WvJ2blEVmK.jpg` 2000x3000, `71Ywb8dNJMmk64QlesFLwSUeyqC.jpg` 2000x3000, `850gUPu2ZRJ5fGHVxBNlcY4CxiJ.jpg` 2000x3000
- en: `dKL78O9zxczVgjtNcQ9UkbYLzqX.jpg` 2000x3000, `bnGKTYXVkQp0TKWRfAvTTY1y2XC.jpg` 2000x3000
- textless: `7lIrwPbSe2JWfzp0YO9VkCzjCwL.jpg` 2000x3000, `5dekvc1Iw2FuzHsAyverOr2pioh.jpg` 2000x3000

**Backdrops** (18; all TMDB "no language"; textless site totals: 46)

| Path | Size | w1280 | Kind | Flags |
|---|---|---:|---|---|
| `at7Vtn4EKNSNNWfQFKEulLraera.jpg` | 3840x2160 | 107 KB | still |  |
| `ujMlwV1HDGKEHES0ZVbSMkFYBKM.jpg` | 3840x2160 | 179 KB | still |  |
| `pnkEOG38EKA4MxgbRMjWGBPGevO.jpg` | 2500x1406 | 156 KB | still |  |
| `r2AECYSJXRcPpGmWmfkUztpmK75.jpg` | 2500x1406 | 107 KB | still |  |
| `lGnPqsK1C3XQkF5ZBCWqAzfuuRc.jpg` | 3840x2160 | 125 KB | still | diegetic-text:in-world show logo |
| `nLR4VEx5Jv2E7nfPdy3ZOguyk71.jpg` | 3543x1993 | 89 KB | still |  |
| `qS6WGs5co80ATvBRew1RQnoGJ3K.jpg` | 3840x2160 | 187 KB | still |  |
| `olzb4W4UsqhUMEVwKyRFKGLnajK.jpg` | 2340x1316 | 146 KB | still |  |
| `nuCVfa3HGbQ4QBzwZPvKT0TJSke.jpg` | 2500x1406 | 138 KB | still | diegetic-text:neon signage |
| `vnLK0jsfKCYurLIDj8zyIyZM42F.jpg` | 2500x1406 | 132 KB | still |  |
| `mCYlV3UAGtDBIAVtkZnKMSSgmoJ.jpg` | 2477x1393 | 109 KB | still |  |
| `nrzTiAyKO9rGzCAbpMlIZ8KVXb9.jpg` | 2500x1406 | 119 KB | still |  |
| `rn2s85HbpmNdl9HtBhTNFIpPkWY.jpg` | 3840x2160 | 161 KB | still | diegetic-text:in-world network wall |
| `8fMOzkMoTB7IR1z50yeOv40NOUU.jpg` | 3840x2160 | 121 KB | still |  |
| `mxhSPUShBzCJ5TeWnP72obapILd.jpg` | 3840x2160 | 162 KB | still |  |
| `jjX8S5du550d9PkSQcbDgQyfEJT.jpg` | 3840x2160 | 226 KB | still |  |
| `jFhdb45moOI78fkvtRNybjs1H4h.jpg` | 3840x2160 | 189 KB | art |  |
| `oUOLzuxAQ42QBCo6oP6APMDik4w.jpg` | 3840x2160 | 273 KB | art |  |

### Truth & Treason (`truth-treachery-2026`)

- TMDB [1443940](https://www.themoviedb.org/movie/1443940-truth-treason) · IMDb tt21825416 · Wikipedia: Truth & Treason
- Brazilian title: **Verdade e Traição** (second source: NOT independently confirmed: only TMDB and its pt-BR poster art)
- md: Verdade e Traição, 2025, Matt Whitaker, 121 min (`truth-treachery-2026.md:14`)
- Release: TMDB primary 2025-10-16, Brazil 02/04/2026 (BR)
- Country: TMDB United States, Lithuania · Wikipedia United States · Original language: en

- Direction: Matt Whitaker [W+B]
- Writing: Matt Whitaker (Writer) [W+B]; Ethan Vincent (Writer) [W+B]
- Photography: Bianca Cline [W+B]
- Music: Aaron Zigman [W+B]
- Editing: Adam L. Banks [W+B]
- Producers: John Foss [W+B]; Russ Kendall [W+B]; Matt Whitaker [W+B]
- Cast: Ewan Horrocks as Helmuth Hübener [W+B]; Rupert Evans as Erwin Mussener [W+B]; Ferdinand McKay as Karl-Heinz Schnibbe [W+B]; Daf Thomas as Rudi Wobbe [W+B]; Nye Occomore as Salomon Schwarz [W]; Joanna Christie as Emma Hübener [W]
- Note: TMDB reads "Solomon Schwarz", Wikipedia "Salomon Schwarz". Wikipedia reads "Rudolf Wobbe", TMDB "Rudi Wobbe"; the md uses Rudi.

**Poster** primary `wJAdJLTSkpdAtdwa54JnRa2g7BO.jpg` 2000x3000 (pt-BR).
Flag: Every poster on TMDB shows a swastika gag over the boy's mouth (one en-US variant shows an eagle cap instead). Owner decision needed.

- pt-BR: `wJAdJLTSkpdAtdwa54JnRa2g7BO.jpg` 2000x3000, `zgGNI8sPd2H8ywLjgvZXp1AMbg5.jpg` 2000x3000
- en: `ArDLn658OjT3dMThIi4GDQJRuY3.jpg` 2000x3000, `vJdXh0Ezcftep9ft9zvL8eI0EoI.jpg` 2000x3000
- textless: `hjrwUeG5dBF8dlbrWlgz904XLaT.jpg` 2000x3000

**Backdrops** (4, SHORTFALL; all TMDB "no language"; textless site totals: 4)

| Path | Size | w1280 | Kind | Flags |
|---|---|---:|---|---|
| `yUBjDdAfZqg09f1Uu3Lu5cw2xPP.jpg` | 3840x2160 | 166 KB | still |  |
| `uXNmzaA0i7ugrR1GizlEpLdAcwK.jpg` | 3840x2160 | 102 KB | still |  |
| `98PhUeOMK33Oyekw53tSGsfPZ7H.jpg` | 3840x2160 | 46 KB | art | swastika:large, key art |
| `bVKTQsw3OLclUA0W0CNZ0uUEd9V.jpg` | 3840x2160 | 75 KB | art | swastika:large, key art; near-duplicate-of:previous |

### Under the Silver Lake (`under-the-silver-lake-2018`)

- TMDB [396461](https://www.themoviedb.org/movie/396461-under-the-silver-lake) · IMDb tt5691670 · Wikipedia: Under the Silver Lake
- Brazilian title: **O Mistério de Silver Lake** (second source: AdoroCinema via web search)
- md: O Mistério de Silver Lake, 2018, David Robert Mitchell, 139 min (`under-the-silver-lake-2018.md:14`)
- Release: TMDB primary 2018-08-08, Brazil 04/11/2020 (BR)
- Country: TMDB United States · Wikipedia United States · Original language: en

- Direction: David Robert Mitchell [W+B]
- Writing: David Robert Mitchell (Writer) [W+B]
- Photography: Mike Gioulakis [W+B]
- Music: Disasterpeace (Original music (TMDB lists him as Richard Vreeland)) [W+B]
- Editing: Julio Perez IV [W+B]
- Producers: Michael De Luca [W+B]; Chris Bender [W+B]; Jake Weiner [W+B]
- Cast: Andrew Garfield as Sam [W+B]; Riley Keough as Sarah [W+B]; Topher Grace as Bar Buddy [W+B]; Callie Hernandez as Millicent Sevence [W+B]; Don McManus as Final Man [W]; Jeremy Bobb as Songwriter [W]
- Note: Names vary by source: Mike/Michael Gioulakis (DP); Julio Perez IV / Julio C. Perez IV (editor).

**Poster** primary `cJ9aKlEgTLYtpYjNqin06YqJRUl.jpg` 2000x3000 (fallback: no pt-BR poster on TMDB).

- en: `cJ9aKlEgTLYtpYjNqin06YqJRUl.jpg` 2000x3000, `6sq6fOb02zjhguNpi5VOklq6Nj.jpg` 1000x1500
- textless: `ywnn4915B2UC1I3KcWjLl4WlzKD.jpg` 2000x3000, `kDvhsBFA01xrpbLpJoMt9Q33zvA.jpg` 2000x3000

**Backdrops** (17; all TMDB "no language"; textless site totals: 87)

| Path | Size | w1280 | Kind | Flags |
|---|---|---:|---|---|
| `r2z8ceIsg9ON8DIHTf6cMqnK3CL.jpg` | 1920x1080 | 117 KB | still |  |
| `smc5oE6iRdp4hguSPT3RHsyceQH.jpg` | 1920x1080 | 106 KB | still |  |
| `aGFCehJ6AoDUGLrBWwxm8VATieu.jpg` | 1920x1080 | 160 KB | still |  |
| `nRMEwXTStVoK4rHlbrTwjugHeJA.jpg` | 2048x1152 | 220 KB | still |  |
| `7VkjHXUvLVyomy5NO4zKHjyl9te.jpg` | 2048x1152 | 147 KB | still | swimwear |
| `87d2mP3ZGaoh8xUFKVfUAJKsqiP.jpg` | 2048x1152 | 152 KB | still |  |
| `coMRkCXB0xeemCKjIECb0YRZSqL.jpg` | 3840x2160 | 132 KB | still |  |
| `gDhJlg4eddijnwjSLrGNAFrNC8p.jpg` | 3840x2160 | 93 KB | still |  |
| `cr5gCwsYCCJ5tIakXQFVdS5yQzL.jpg` | 3840x2160 | 158 KB | still |  |
| `cdlCXtMEblkt9RNXfUQW857dgon.jpg` | 3840x2160 | 156 KB | still |  |
| `3JglkXfUpWoPsIeBJkd9ZbxchEh.jpg` | 3840x2160 | 113 KB | still |  |
| `UX0JcA7hR8aFllDYlk19gcbjgv.jpg` | 2048x1152 | 147 KB | still |  |
| `83XTQgnCYVrHtU3aXst3eaJGtza.jpg` | 3840x2160 | 97 KB | still |  |
| `kR9oHhyeKExiftmn9IXtvJAhlIX.jpg` | 3840x2160 | 166 KB | still |  |
| `mJbzS2pCSe8JJTqjtDbQH9kTlmf.jpg` | 2048x1152 | 110 KB | still |  |
| `44dgugY6wBUFfJdaVOhNfr6E5g3.jpg` | 3840x2160 | 180 KB | art | poster-art |
| `dR64XOEucCT2nEg47DeEaeMaD9F.jpg` | 2000x1123 | 168 KB | art | poster-art |

### V for Vendetta (`v-for-vendetta-2005`)

- TMDB [752](https://www.themoviedb.org/movie/752-v-for-vendetta) · IMDb tt0434409 · Wikipedia: V for Vendetta (film)
- Brazilian title: **V de Vingança** (second source: ptwiki)
- md: V de Vingança, 2005, James McTeigue, 132 min (`v-for-vendetta-2005.md:14`)
- Release: TMDB primary 2006-02-23, Brazil 07/04/2006 (BR)
- Country: TMDB United States · Wikipedia United States, United Kingdom, Germany · Original language: en

- Direction: James McTeigue [W+B]
- Writing: The Wachowskis (Screenplay) [W+B]; David Lloyd (Graphic novel (co-creator; Alan Moore asked not to be credited, per Wikipedia note)) [W+B]
- Photography: Adrian Biddle [W+B]
- Music: Dario Marianelli [W+B]
- Editing: Martin Walsh [W+B]
- Producers: Joel Silver [W+B]; Grant Hill [W+B]; The Wachowskis [W+B]
- Cast: Natalie Portman as Evey Hammond [W+B]; Hugo Weaving as V [W+B(actor)]; Stephen Rea as Eric Finch [W+B]; Stephen Fry as Gordon Deitrich [W]; John Hurt as Adam Sutler [W]; Tim Pigott-Smith as Peter Creedy [W]
- Note: TMDB lists Lana and Lilly Wachowski; Wikipedia "The Wachowskis". TMDB gives Weaving also "William Rookwood": left out, it is a plot reveal.

**Poster** primary `Awk4uagfl0wz6WiqlCitfswHwcT.jpg` 2000x3000 (pt-BR).

- pt-BR: `Awk4uagfl0wz6WiqlCitfswHwcT.jpg` 2000x3000
- en: `1avD1JeaRiJX5M4ahPdZPypGoGN.jpg` 751x1123, `piZOwjyk1g51oPHonc7zaQY3WOv.jpg` 2000x3000
- textless: `16gmXqmV9Cfnq1d97a0zASJyKiL.jpg` 2000x3000, `rJl5GHh65qVC1WtySgCmrJQHO89.jpg` 1736x2456

**Backdrops** (16; all TMDB "no language"; textless site totals: 45)

| Path | Size | w1280 | Kind | Flags |
|---|---|---:|---|---|
| `sFEYsEfzTx7hhjetlNrme8B5OUo.jpg` | 2500x1406 | 174 KB | still | diegetic-text:propaganda poster |
| `7pFgSoKuq3INFBlNUYoK5cx9n9P.jpg` | 2048x1152 | 143 KB | still |  |
| `fv4XvbQW2NDEXV8Zdxhmv0wHuu3.jpg` | 1920x1080 | 209 KB | still |  |
| `mnm1WMXMMS77NtVHbs3sQ27AVbm.jpg` | 2048x1152 | 241 KB | still |  |
| `cKMZqcYKMvuoESDa8O5NMojdmfL.jpg` | 1920x1080 | 206 KB | still |  |
| `jFMjSMpTiUU5FYvlORTz7YveNqe.jpg` | 1920x1080 | 57 KB | still |  |
| `hd9v1P8eHHlXofqR04mdJn8Va7x.jpg` | 3840x2160 | 147 KB | still |  |
| `yv5fcr3YhjdqEHKSxzkqdJ7icrl.jpg` | 2855x1606 | 96 KB | still |  |
| `84DvFeWnbhGHyTDCuGAo10j9MZ5.jpg` | 2855x1606 | 137 KB | still |  |
| `b8x3sTom98rjJLzhEcW9d41qMzq.jpg` | 2855x1606 | 119 KB | still |  |
| `gj7HCslrHhaVY0R0yyMSHn3UDpt.jpg` | 2855x1606 | 131 KB | still |  |
| `4vU0t17acqu8eeV3KypxD5QUpyZ.jpg` | 3840x2160 | 170 KB | art | key-art |
| `h3O3peJByVG5ufR9OAkk2FqT6jh.jpg` | 3840x2160 | 139 KB | art | key-art |
| `sGcqFRwQEpgp4pD1DUewf1vSjbQ.jpg` | 3840x2160 | 107 KB | art | key-art |
| `jwN7szfWynj3CgW2X5ipcdlwTCT.jpg` | 3840x2160 | 176 KB | art | key-art |
| `dL2JVFryU4bnxaBfZe1IeW7DQDd.jpg` | 1920x1080 | 234 KB | art | promo-art |

### Vivarium (`vivarium-2019`)

- TMDB [458305](https://www.themoviedb.org/movie/458305-vivarium) · IMDb tt8368406 · Wikipedia: Vivarium (film)
- Brazilian title: **Viveiro** (second source: ptwiki {{BRPT}})
- md: Vivarium, 2019, Lorcan Finnegan, 97 min (`vivarium-2019.md:14`)
- Release: TMDB primary 2019-09-07, Brazil 27/03/2020 (BR)
- Country: TMDB Belgium, Denmark, Ireland · Wikipedia Ireland, Belgium, Denmark · Original language: en

- Direction: Lorcan Finnegan [W+B]
- Writing: Garret Shanley (Screenplay and story) [W+B]; Lorcan Finnegan (Story) [W+B]
- Photography: MacGregor [W+B]
- Music: Kristian Eidnes Andersen [W+B]
- Editing: Tony Cranstoun [W+B]
- Producers: John McDonnell [W+B]; Brendan McCarthy [W+B]
- Cast: Imogen Poots as Gemma [W+B]; Jesse Eisenberg as Tom [W+B]; Senan Jennings as Young Boy [W]; Éanna Hardwicke as Older Boy [W]; Jonathan Aris as Martin [W]

**Poster** primary `myf3qzpeN0JbuFRPwSpJcz7rmAT.jpg` 2000x3000 (fallback: no pt-BR poster on TMDB).

- en: `myf3qzpeN0JbuFRPwSpJcz7rmAT.jpg` 2000x3000, `bk5xkiXc1msKwrRJ5WtisHui8xE.jpg` 1000x1500
- textless: `67GUrVxrECS7xAIMeeh0nLnkxLQ.jpg` 1000x1426, `9TuEncCfklGLXt5WsEXaDybd5uG.jpg` 1000x1426

**Backdrops** (13, SHORTFALL; all TMDB "no language"; textless site totals: 13)

| Path | Size | w1280 | Kind | Flags |
|---|---|---:|---|---|
| `gzrxB8PLoSZhzKi1t5mKYGFZT3s.jpg` | 1920x1080 | 161 KB | still |  |
| `ux9s3gwuA2qgoTNFFom2QOHeK9w.jpg` | 3840x2160 | 131 KB | still |  |
| `i1kmEj4oPLuSXwlBfwgCqqdEkjY.jpg` | 2560x1440 | 141 KB | still |  |
| `eCcJkBqqGhjswDtadLmRmZVXpoj.jpg` | 2560x1440 | 156 KB | still |  |
| `jg675a839JrP0DSrriUPP9KBiBe.jpg` | 1920x1080 | 183 KB | still |  |
| `mPAnIUerw9OUsIR0rMqI2SEbMge.jpg` | 1920x1080 | 225 KB | still | diegetic-text:estate agent window |
| `pKl47OwPiuDqPEGkrsiqwAmTpBT.jpg` | 3840x2160 | 121 KB | still | infant-bare-back |
| `jZ4YdDCnfK4cO13do9J4JaT8d2O.jpg` | 2258x1270 | 106 KB | still | near-duplicate-of:previous, lower res; infant-bare-back |
| `inlg8EsXowlP2SpfyZkj9xwpsdD.jpg` | 3840x2160 | 235 KB | art | key-art |
| `zLa8fA7boGtNoNH7n6iYi9UqoaH.jpg` | 1920x1080 | 199 KB | art | key-art; near-duplicate-of:previous, lower res |
| `apzuJXA9RVfMEWXmv80fZv5Yof2.jpg` | 3840x2160 | 98 KB | art | key-art |
| `3KbXRhzg5pITV70MEwWLf4jaiZp.jpg` | 1920x1080 | 95 KB | art | key-art |
| `7601ez9A07THOeilJYouYFLvruo.jpg` | 3840x2160 | 82 KB | art | key-art |

### What You Wish For (`what-you-wish-for-2023`)

- TMDB [1126934](https://www.themoviedb.org/movie/1126934-what-you-wish-for) · IMDb tt13638858 · Wikipedia: What You Wish For
- Brazilian title: **Aquilo que Você Deseja** (second source: JustWatch BR via web search)
- md: Aquilo que Você Deseja, 2023, Nicholas Tomnay, 102 min (`what-you-wish-for-2023.md:14`)
- Release: TMDB primary 2024-05-31, Brazil 25/11/2025 (BR)
- Country: TMDB United States · Wikipedia United States · Original language: en

- Direction: Nicholas Tomnay [W+B]
- Writing: Nicholas Tomnay (Writer) [W+B]
- Photography: Mateo Guzmán [W+B]
- Music: Jeff Russo [W+B]; Tracie Turnbull [W+B]
- Editing: Nicholas Tomnay [W+B]
- Producers: Nicholas Tomnay [W+B]; Francesca Silvestri [W+B]; Kevin Chinoy [W+B]
- Cast: Nick Stahl as Ryan [W+B]; Tamsin Topolski as Imogene [W(actor)+B]; Randy Vasquez as Detective Ruiz [W+B]; Penelope Mitchell as Alice [W+B]; Brian Groh as Jack [W]; Juan Carlos Messier as Maurice [W]
- Note: TMDB lists only Tomnay as producer; Wikipedia and Box Office Mojo both add Silvestri and Chinoy. TMDB reads "Imogene", Wikipedia "Imogen".

**Poster** primary `kekxNg1VB5wgpihPXOyN2gsN9AT.jpg` 1000x1500 (pt-BR).

- pt-BR: `kekxNg1VB5wgpihPXOyN2gsN9AT.jpg` 1000x1500
- en: `bBbceiJHq4dqrKcFEAKolBhiDx0.jpg` 2000x3000, `9T6ww265pozXkNPKl26hRhIpbxt.jpg` 1000x1500

**Backdrops** (9, SHORTFALL; all TMDB "no language"; textless site totals: 9)

| Path | Size | w1280 | Kind | Flags |
|---|---|---:|---|---|
| `5dawGWbeskQTJsTd0QNUkmRZCSv.jpg` | 3838x2160 | 147 KB | still |  |
| `xRyknWbheZjv8BPihffxPV3yHwO.jpg` | 1920x1080 | 115 KB | still |  |
| `1nhTeCl7hSRfnCVhxB4AADxeBEe.jpg` | 3127x1759 | 133 KB | still |  |
| `40SSJe41OHfRZp2rzdefokR4HSJ.jpg` | 1600x900 | 77 KB | still | below-1920 |
| `qzNZWNMnNyTn8hn4o6uAQ7vXm8C.jpg` | 1280x720 | 105 KB | still | below-1920 |
| `rvQ9ykbT9B7MUxFMm2hwzLGmXLC.jpg` | 1280x720 | 101 KB | still | below-1920 |
| `sGAvgQDy1HShW8ja7R6pkUqJUKe.jpg` | 3840x2160 | 209 KB | art | key-art |
| `8lJ87AOOs9G0vay20s4Zv3LwAl.jpg` | 3840x2160 | 149 KB | art | key-art |
| `idEMUdiEcWnmV01Fp15BRkvK7XP.jpg` | 1920x1080 | 189 KB | art | key-art |

## 6. Not verified

- **IMDb directly**: blocked (403). Box Office Mojo stands in; it is IMDb-owned, so it is not a fully independent witness, and Wikipedia editors often draw on the same data.
- **Character names for cast beyond the top 4** rest on TMDB plus Wikipedia only. Where they differed I noted it in the film section; `character` holds the cleaned form, `character_tmdb` the TMDB text.
- **Textlessness** was judged on w300 thumbnails (a dozen sensitive frames at w780). A tiny corner logo or small armband detail could slip through; check at full size before a hero use.
- **Whether a backdrop is an official still.** Many 3840-wide uploads may be community upscales, and my `still`/`art` split is by eye. I cannot tell from the outside.
- **Spoiler calls** are mine, from context and Wikipedia plots, not from watching the films.
- **Brazilian title of *Truth & Treason***: only TMDB and its pt-BR poster art show "Verdade e Traição" (the md agrees); a web search found no independent Brazilian listing.
- **TMDB terms of use and image licensing**: not reviewed.
- **Trailers**: out of scope for this report.

Scratch: `raw/` holds fetched pages, thumbnails and contact sheets; `scripts/` holds the pipeline (`fetch-tmdb.js`, `parse.js`, `fetch-wiki.js`, `bom.js`, `probe.js`, `selection.js`, `curated.js`, `build.js`, `report.js`).
