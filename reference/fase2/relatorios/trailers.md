# Fase 2: trailers per film

Data file: `trailers.json` in this folder. It has 98 tested IDs, flat, with `role` set to `primary`, `alternate`, `unconfirmed` or `rejected`. Filter on `role === "primary"` to get one ID per feature. Besides the requested fields it adds `rank`, `source`, `embedPreviewStatus`, `playableInEmbed`, `availableInBR`, `edgePlaybackState`, `durationSeconds`, `maxHeight`, `publishDate`, `captionTracks` and `audioTracks`.

## Result

All 22 features have a primary ID that passes every check: oEmbed 200, embed preview `OK` with `playableInEmbed:true`, `BR` in `availableCountries`, and real playback (`getPlayerState() === 1`, clock advancing, no error) in both headless Chrome and headless Edge.

| Primaries | Count | Films |
|---|---|---|
| pt-BR legendado, Brazilian distributor | 12 | Bugonia, Django Livre, Doutor Sono, Sem Limites, Obsessão, A Viúva, Os Oito Odiados, Manual Prático, The Long Walk, The Menu, The Running Man, Verdade e Traição |
| pt-BR dublado, Brazilian distributor | 1 | Aquilo que Você Deseja |
| English, studio channel | 5 | Pulp Fiction, Casamento Sangrento, O Lagosta, O Mistério de Silver Lake, V de Vingança |
| English, other distributor channel | 3 | De Olhos Bem Fechados (Park Circus), Bastardos Inglórios (Arrow Video), Vivarium (Umbrella) |
| English, aggregator, no distributor upload found | 1 | O Senhor das Armas |

Of the 98 IDs tested, 97 played. The one failure is `vLa0FX_xi08` (Vertigo Releasing, Vivarium UK trailer), which is age-restricted and returns error 150. No ID returned 101 or 153 under the correct referrer policy.

## Primary per feature

Playback columns are state/seconds at the sample point. State 1 means playing. Resolution is the largest format YouTube publishes for the video.

| slug | feature | videoId | channel | language | quality | Chrome | Edge |
|---|---|---|---|---|---|---|---|
| bugonia-2025 | Bugonia | `giAMydh9_4I` | Universal Pictures Brasil | pt-BR legendado | 1080p, 138s | 1/4.8s | 1/5.06s |
| django-unchained-2012 | Django Livre | `9vO2pd_y6s8` | Sony Pictures Brasil | pt-BR legendado | 1080p, 146s | 1/4.58s | 1/5.02s |
| doctor-sleep-2019 | Doutor Sono | `oM4Jp05zI7E` | Warner Bros. Pictures Brasil | pt-BR legendado | 1080p, 144s | 1/5.31s | 1/5.08s |
| eyes-wide-shut-1999 | De Olhos Bem Fechados | `VSS47StLOhk` | Park Circus | en | 1080p, 123s | 1/4.49s | 1/6.58s |
| inglourious-basterds-2009 | Bastardos Inglórios | `uSEDz-my7XQ` | Arrow Video | en | 1080p, 129s | 1/4.57s | 1/6.74s |
| limitless-2011 | Sem Limites | `JMU_ksS3fq4` | Imagem Filmes | pt-BR legendado | 720p, 152s | 1/4.8s | 1/6.55s |
| lord-of-war-2005 | O Senhor das Armas | `AXgyoER0aRc` | Rotten Tomatoes Classic Trailers | en | 720p, 156s | 1/4.63s | 1/4.42s |
| obsession-2026 | Obsessão | `OYueQyeNgOk` | Universal Pictures Brasil | pt-BR legendado | 1080p, 133s | 1/4.99s | 1/4.67s |
| pulp-fiction-1994 | Pulp Fiction: Tempo de Violência | `tGpTpVyI_OQ` | Miramax | en | 1080p, 98s | 1/4.71s | 1/4.95s |
| ready-or-not-double-feature-2026 | Casamento Sangrento | `ZtYTwUxhAoI` | SearchlightPictures | en | 1080p, 152s | 1/4.8s | 1/4.9s |
| ready-or-not-double-feature-2026 | Casamento Sangrento: A Viúva | `upSQJG_kOt4` | 20th Century Studios Brasil | pt-BR legendado | 1080p, 139s | 1/5.31s | 1/4.97s |
| the-hateful-eight-2015 | Os Oito Odiados | `xKjoznVA1O0` | Diamond Films Brasil | pt-BR legendado | 1080p, 141s | 1/4.21s | 1/7.11s |
| the-inheritance-2025 | Manual Prático da Vingança Lucrativa | `6EovZE2NR_U` | Diamond Films Brasil | pt-BR legendado | 1080p, 152s | 1/5.35s | 1/4.64s |
| the-lobster-2015 | O Lagosta | `LTNZmOJxuAc` | A24 | en | 720p, 138s | 1/4.54s | 1/4.81s |
| the-long-walk-2025 | The Long Walk | `B7gTKETLZ2I` | ParisFilmes | pt-BR legendado | 1080p, 141s | 1/4.09s | 1/4.82s |
| the-menu-2022 | The Menu | `Jd1rUZz1kd4` | 20th Century Studios Brasil | pt-BR legendado | 1080p, 131s | 1/5.02s | 1/4.12s |
| the-running-man-2026 | The Running Man | `mDrsB34BeuI` | Paramount Brasil | pt-BR legendado | 1080p, 161s | 1/4.02s | 1/4.87s |
| truth-treachery-2026 | Verdade e Traição | `M0lWlRGVF1M` | ParisFilmes | pt-BR legendado | 1080p, 117s | 1/4.57s | 1/4.92s |
| under-the-silver-lake-2018 | O Mistério de Silver Lake | `mwgUesU1pz4` | A24 | en | 1080p, 135s | 1/4.77s | 1/5.37s |
| v-for-vendetta-2005 | V de Vingança | `V5VGq23aZ-g` | Warner Bros. Entertainment | en | 2160p, 61s | 1/4.67s | 1/4.26s |
| vivarium-2019 | Vivarium | `L33tYvvTg50` | Umbrella Entertainment | en | 804p, 137s | 1/5.31s | 1/4.12s |
| what-you-wish-for-2023 | Aquilo que Você Deseja | `E9secK4nEGI` | Looke Filmes | pt-BR dublado | 1080p, 123s | 1/4.38s | 1/7.42s |

## Decisions for the owner

1. **O Senhor das Armas.** No studio or distributor upload exists in English or pt-BR that I could find. I searched Lionsgate Movies, Lionsgate Play, Paramount Movies, Paramount Brasil, Prime Video Brasil, Telecine, Imagem Filmes, Paris Filmes and Studiocanal UK. The primary is Rotten Tomatoes Classic Trailers, 720p with a MOVIECLIPS watermark. The only true distributor upload found is Capelight's, in German. This is the one film that does not strictly meet the rule.
2. **Casamento Sangrento (2019).** The Searchlight trailer is the red band cut. It is not age-gated and it plays. The alternate `LBwfO9Hj6oQ` is Searchlight's home-release version. Searches inside the 20th Century Studios Brasil channel returned the sequel but no 2019 trailer.
3. **Aquilo que Você Deseja.** The only official pt-BR trailer is dubbed and carries a persistent "Original Looke" mark, which is real but is streaming branding on screen. `JiljqpKZNpw` (Magnolia, English) is the clean alternative.
4. **V de Vingança.** The primary is from Warner Bros. in 2160p but runs only 61 s. `IHVzzxrPt1c` (DC official, 1080p, 106 s) is longer, if length matters more than the studio's main channel.
5. **De Olhos Bem Fechados.** The primary is the 2019 reissue trailer from Park Circus, with a title card reading BACK IN CINEMAS. The original trailer on Warner Bros. Rewind (`ZsW03brKIx4`) is only 270p and 4:3, so it would look poor in a large frame.

## Data problems found in the source repo

`src/content/films/the-inheritance-2025.md` describes the wrong credits:

| Line | File says | Evidence says |
|---|---|---|
| 16 | `director: "Dan Berk & Robert Olsen"` | John Patton Ford (A24 description of `BxBof_p3_es`, AdoroCinema) |
| 15 | `year: 2025` | Brazilian release 26 Feb 2026 (AdoroCinema) |
| 17 | `runtime: 99` | 1h 46min (AdoroCinema) |

The plot in that file (Becket Redfellow) matches *How to Make a Killing* and the Diamond Films description, so the trailer is right and the credits are wrong. The filename slug `the-inheritance-2025` also reflects the old identification. If Fase 2 prints a director on the film page, this must be corrected first, given the "nothing invented" rule.

The other names you asked me to check agree with the md:

| Film | md director | Evidence |
|---|---|---|
| Aquilo que Você Deseja | Nicholas Tomnay, not Stoller | Magnolia description of `JiljqpKZNpw` |
| Obsessão | Curry Barker | Blumhouse description of `gMC8kkwbIQQ` |
| The Long Walk | Francis Lawrence | Lionsgate description of `vAtUHeMQ1F8` |
| The Running Man | Edgar Wright | Paramount title and description |
| Verdade e Traição | Matt Whitaker | Web search, Truth & Treason listings; YouTube descriptions do not name him |

Sem Limites: no tested description names Neil Burger, so its identity rests on title, cast, year and channel.

Three films use an English title in the md while the Brazilian trailers show the Brazilian title on screen: The Long Walk (A Longa Marcha: Caminhe ou Morra), The Running Man (O Sobrevivente), The Menu (O Menu).

## What the embed needs, from control runs

Evidence is in `controls.json` and `audio-check.json`.

| Control | Result |
|---|---|
| `referrerpolicy="strict-origin-when-cross-origin"` | Plays |
| `referrerpolicy="no-referrer"` | **Error 153**, "Erro de configuração do player de vídeo" |
| `referrerpolicy="same-origin"` | **Error 153**, same message |
| Host `www.youtube.com` instead of `www.youtube-nocookie.com` | Plays (2 IDs) |

The markup that passed:

```html
<iframe src="https://www.youtube-nocookie.com/embed/ID?enablejsapi=1&origin=ORIGIN&autoplay=1&mute=1&playsinline=1&rel=0"
  referrerpolicy="strict-origin-when-cross-origin"
  allow="autoplay; encrypted-media; picture-in-picture; web-share"></iframe>
```

**CSP blocks this if the source repo's headers are reused.** `C:/Users/Usuario/Desktop/Projetos/FHDOG/vercel.json:21` has `frame-src https://open.spotify.com`, `script-src 'self' 'unsafe-inline'`, and an `img-src` without `i.ytimg.com`. Deploying with that header would block the iframe, the IFrame API script and YouTube thumbnails. Lines 13 (Referrer-Policy) and 16 (Permissions-Policy) are compatible. I did not test it against a live deployment, and I did not test the effect of `Cross-Origin-Opener-Policy: same-origin` on line 18. I found no CSP or referrer setting in the replica's config or `.astro` files.

**Captions can turn themselves on.** This happened with `cc_load_policy=0` set, muted or not, in logged-out sessions:

- Under pt-BR, automatic Portuguese captions appeared on the dubbed `E9secK4nEGI`, and manual English captions on `mwgUesU1pz4` and `JiljqpKZNpw`.
- In click-to-play sessions under pt-BR, `giAMydh9_4I`, `oM4Jp05zI7E` and `uSEDz-my7XQ` showed no captions. Sampled muted frames of the other legendado primaries showed no second text layer over the burnt-in subtitles either.
- Calling `player.unloadModule('captions')` after state 1 left no captions in the 2 runs that reached playback, both on `E9secK4nEGI`. That is thin evidence.

**Extra dub tracks.** Several videos list dub tracks in a fixed language set that looks like YouTube auto-dubbing, including `oM4Jp05zI7E`, `uSEDz-my7XQ` and `IHVzzxrPt1c`. On click-to-play the player selected the English original under both pt-BR and en-US for all three, so visitors should not get a machine dub by default. This was read from the player's internal `getAudioTrack()`; nobody listened to the audio, and logged-in viewers may behave differently.

**Other things to expect:**

- The embed chrome shows titles machine-translated for the viewer's locale, for example the Warner Bros. V for Vendetta title. Use oEmbed titles, not search or embed text, for identification.
- Some picture is pillarboxed or letterboxed inside the 16:9 frame, for example Bugonia and Vivarium.
- Load the API asynchronously and have a fallback. In the first pass, 9 page loads timed out in two clusters while waiting on the blocking `iframe_api` script, and all 9 played on retry. In the control runs, 6 of 17 sessions had not started playing after about 16 s, with no error event. Other agents were using this PC at the same time, so I cannot say whether the cause was load, network or YouTube.

## Alternatives per feature

**Bugonia**
- `s4CdikVLwaI` Universal Pictures Brasil, pt-BR legendado, 1080p, 115s, state 1 [alternate]
- `Yy8zLe8RIKI` Universal Pictures Brasil, pt-BR, not frame-checked, 1080p, 82s, state 1 [alternate]
- `bd_5HcTujfc` Focus Features, en, 1080p, 154s, state 1 [alternate]
- `7VBigr-JHB0` Focus Features, en, 1080p, 131s, state 1 [alternate]
- `S7TnvaZg9jI` ingresso.com, pt-BR legendado (title), 1080p, 138s, state 1 [unconfirmed]

**Django Livre**
- `tivv135aGbc` Sony Pictures Brasil, pt-BR legendado, 720p, 121s, state 1 [alternate]
- `_iH0UBYDI4g` Sony Pictures Entertainment, en, 720p, 124s, state 1 [alternate]
- `2dY7Ad9YhEk` Sony Pictures Entertainment, en, 720p, 125s, state 1 [alternate]

**Doutor Sono**
- `4BWhV-kCRc4` Warner Bros. Pictures Brasil, pt-BR, subtitles not seen in sampled frames, 1080p, 161s, state 1 [alternate]
- `BOzFZxB-8cw` Warner Bros., en, 1080p, 144s, state 1 [alternate]
- `2msJTFvhkU4` Warner Bros., en, 1080p, 161s, state 1 [alternate]
- `6u8ggerDcwg` Warner Bros. Entertainment, en, 2160p, 152s, state 1 [alternate]

**De Olhos Bem Fechados**
- `ZsW03brKIx4` Warner Bros. Rewind, en, 270p, 61s, state 1 [alternate]
- `xgVo96JaqeM` Rotten Tomatoes Classic Trailers, en, 720p, 58s, state 1 [alternate]

**Bastardos Inglórios**
- `sE8hc4gVyGo` Rotten Tomatoes Classic Trailers, en, 720p, 142s, state 1 [alternate]
- `qRYDNWXuip8` Rotten Tomatoes Classic Trailers, en, 544p, 141s, state 1 [alternate]
- `QFIUD3aq_do` Universal Pictures Home Entertainment Benelux, en, 1080p, 104s, state 1 [unconfirmed]
- `bkFVk4zkxu0` Universal Pictures International Italy, it, 720p, 123s, state 1 [rejected]

**Sem Limites**
- `vUkAfjfWh5g` eOnefilms, en, 720p, 145s, state 1 [alternate]
- `4TLppsfzQH8` Rotten Tomatoes Classic Trailers, en, 480p, 149s, state 1 [alternate]
- `jMZrBd3xywA` Amazon Prime Video UK & IE, en, 272p, 149s, state 1 [alternate]

**O Senhor das Armas**
- `xw1yMKtIwME` capelightpictures, de, 1080p, 104s, state 1 [alternate]
- `Mpmjysn5BAY` HD Retro Trailers, en, 2160p, 133s, state 1 [unconfirmed]

**Obsessão**
- `744FHdO0xwY` Universal Pictures Brasil, pt-BR legendado, 1080p, 47s, state 1 [alternate]
- `aEbifyxcyBY` Universal Pictures Brasil, pt-BR, not frame-checked, 1080p, 53s, state 1 [alternate]
- `TaaDkbG3I7g` Focus Features, en, 1080p, 149s, state 1 [alternate]
- `gMC8kkwbIQQ` Blumhouse, en, 1080p, 133s, state 1 [alternate]

**Pulp Fiction: Tempo de Violência**
- `yMXB9u4z8Ic` Rotten Tomatoes Classic Trailers, en, 1080p, 91s, state 1 [alternate]
- `5ZAhzsi1ybM` Rotten Tomatoes Classic Trailers, en, 720p, 155s, state 1 [alternate]
- `s7EdQ4FqbhY` Movieclips, en, 720p, 186s, state 1 [alternate]

**Casamento Sangrento**
- `LBwfO9Hj6oQ` SearchlightPictures, en, 1080p, 154s, state 1 [alternate]
- `uj3BeXjGfiA` 20th Century Studios Portugal, pt-PT legendado, 1080p, 144s, state 1 [alternate]
- `AXeYU6Kmrek` ONE Media, en, 1080p, 164s, state 1 [unconfirmed]

**Casamento Sangrento: A Viúva**
- `XGjOjk_7Y_w` 20th Century Studios Brasil, pt-BR dublado, 1080p, 139s, state 1 [alternate]
- `tpWh7NWRnJI` 20th Century Studios Brasil, pt-BR legendado (title), 1080p, 82s, state 1 [alternate]
- `DEvJx-_oOwE` 20th Century Studios Brasil, pt-BR dublado, 1080p, 82s, state 1 [alternate]
- `7K3sNRm8J0w` SearchlightPictures, en, 1080p, 139s, state 1 [alternate]
- `jczr0KCloXk` SearchlightPictures, en, 1080p, 82s, state 1 [alternate]

**Os Oito Odiados**
- `aR38_FXwvJ8` Diamond Films Brasil, pt-BR legendado (title), 1080p, 142s, state 1 [alternate]
- `klNgK9cXVw0` Diamond Films Brasil, pt-BR dublado (title), 1080p, 142s, state 1 [alternate]
- `1Ojxt1gXykE` Diamond Films Brasil, pt-BR dublado, 1080p, 142s, state 1 [alternate]
- `dgfL35I7bGY` Imagem Filmes, pt-BR legendado, 748p, 135s, state 1 [alternate]
- `juaP_vRyIGY` Rotten Tomatoes Trailers, en, 1080p, 140s, state 1 [alternate]

**Manual Prático da Vingança Lucrativa**
- `EhXZ50yjXz0` Diamond Films Brasil, pt-BR dublado, 1080p, 152s, state 1 [alternate]
- `BxBof_p3_es` A24, en, 1080p, 147s, state 1 [alternate]
- `Fp1KRL2nui4` STUDIOCANAL, en, 2160p, 141s, state 1 [alternate]

**O Lagosta**
- `vU29VfayDMw` Rotten Tomatoes Trailers, en, 1080p, 136s, state 1 [alternate]
- `z069ldsumxA` Rotten Tomatoes Trailers, en, 1080p, 94s, state 1 [alternate]
- `kNDT8L0FHKc` Cinemas NOS, pt-PT legendado (title), 1080p, 91s, state 1 [alternate]

**The Long Walk**
- `x_j8OdbQ9sI` ParisFilmes, pt-BR legendado, 1080p, 145s, state 1 [alternate]
- `sUgPNyqQ74o` ParisFilmes, pt-BR dublado, 1080p, 141s, state 1 [alternate]
- `VVa-G8HKG2s` ParisFilmes, pt-BR dublado, 1080p, 145s, state 1 [alternate]
- `vAtUHeMQ1F8` Lionsgate Movies, en, 2160p, 141s, state 1 [alternate]
- `Toj3Zxun7aQ` Lionsgate Movies, en, 2160p, 144s, state 1 [alternate]

**The Menu**
- `hyA7EY04snQ` 20th Century Studios Brasil, pt-BR legendado (title), 1080p, 98s, state 1 [alternate]
- `C_uTkUGcHv4` SearchlightPictures, en, 1080p, 130s, state 1 [alternate]
- `CAWZMssP3gM` SearchlightPictures, en, 1080p, 94s, state 1 [alternate]

**The Running Man**
- `2clDHSB_JPo` Paramount Brasil, pt-BR legendado (title), 1080p, 151s, state 1 [alternate]
- `BNubMqvYfRA` Paramount Brasil, pt-BR dublado (title), 1080p, 151s, state 1 [alternate]
- `KD18ddeFuyM` Paramount Pictures, en, 1080p, 167s, state 1 [alternate]
- `UsmiRIozzvw` Paramount Pictures, en, 1080p, 150s, state 1 [alternate]

**Verdade e Traição**
- `lEF-9cZd3ss` Angel, en, 2160p, 117s, state 1 [alternate]
- `UPepoAJLsTM` Angel, en, 2160p, 140s, state 1 [alternate]

**O Mistério de Silver Lake**
- `a1R9VmV7KZA` MUBI, en, 800p, 91s, state 1 [alternate]
- `XTfNsZUqHDA` Cinemas NOS, pt-PT legendado (title), 1080p, 135s, state 1 [alternate]
- `p4Upl0pm5i0` FILMS4YOU.PT, pt-PT legendado (title), 1080p, 135s, state 1 [unconfirmed]

**V de Vingança**
- `IHVzzxrPt1c` DC, en, 1080p, 106s, state 1 [alternate]
- `lSA7mAHolAw` Rotten Tomatoes Classic Trailers, en, 720p, 150s, state 1 [alternate]
- `4iW3f4Xu3Zw` IGN, en, 2160p, 137s, state 1 [unconfirmed]

**Vivarium**
- `oGlLCAmqYbc` XYZ Films, en, 720p, 135s, state 1 [alternate]
- `U3Xy2x9NDrw` Rotten Tomatoes Trailers, en, 1080p, 146s, state 1 [alternate]
- `6yZDn_ynQiU` Cinemas NOS, pt-PT (title), 1080p, 134s, state 1 [alternate]
- `vLa0FX_xi08` Vertigo Releasing, en, ?p, 90s, state -1 error 150 [rejected]

**Aquilo que Você Deseja**
- `JiljqpKZNpw` Magnolia Pictures & Magnet Releasing, en, 1080p, 131s, state 1 [alternate]
- `0U2YuNATXOM` IGN Movie Trailers, en, 1080p, 121s, state 1 [unconfirmed]
- `lk5vhGnFFTg` Looke Filmes, pt-BR, 1920p, 113s, state 1 [rejected]

Meaning of `source` in the JSON:

- `br-distributor`: Brazilian distributor channel.
- `studio`: production or releasing studio.
- `distributor`: distributor or label in another territory.
- `aggregator`: Rotten Tomatoes or Movieclips trailer channels, which are not the rights holder. Their descriptions link to Fandango; I did not see a licence.
- `press`: IGN.
- `third-party`: not shown to be official.

## Rejected without playback testing

All of these came up in search. None is in the JSON.

| Rejected | Reason |
|---|---|
| `5df-PVH5vXg`, `37A5tyJuZls`, `NBFoo63Xyo4` | Search shows a translated title reading V de Vingança on the first two, but oEmbed confirms all three are *V for Vengeance*, a different film |
| `b6zDhriKd1E` (Imagem Filmes, O Mestre das Armas) | Different film, surfaced by the Lord of War search |
| `wY0E4lutjMI`, `mYLGVLQJnGk`, `CRhvF_Ea5ag`, `NdtHtLdnVis`, `uJkhZe0kwyY` | Sem Limites / Limitless titles that are a documentary series or a TV series |
| `A6sx1YPvBsc`, `Ay1nu_bSmFg`, `xWPeseCYPPI`, `QuNQPrgRswE` | Different films with similar Portuguese titles |
| `6cKabTAFP7s`, `VOsX_oT2RUU`, `KZ1OOTTJluw`, `buGwX5048O4` | Self-described fan, home-made or modern re-edits |
| `Xl4lLIrHIqA`, `5IvEKRvV5rs` | Reaction or trailer analysis |
| `kGJG-_nN8Is` and uploads from TrailersBR, SóTrailers, Planeta Terror, Space Trailers, ONE Media Brasil, ONE Trailer Brasil, Boxoffice Trailers | Re-hosts by third parties, not studios or distributors |
| `1_b1mPDEpvk` (Prime Video Brasil) | A clip from O Senhor das Armas, not a trailer |

## Could not verify

- **Official status of channels is my judgement.** It rests on channel name, handle, content history, and press where available. YouTube search returned no verified badge for Diamond Films Brasil, ParisFilmes, Park Circus, XYZ Films or Blumhouse. Diamond is backed by press coverage and AdoroCinema. Paris Filmes is backed by its own uploads, including spots for Verdade & Traição dated to the Brazilian release, not by independent press.
- **Arrow Video and Bastardos Inglórios.** Arrow is a home-video label selling the film, not Universal or The Weinstein Company. No Universal Brasil upload turned up.
- **`QFIUD3aq_do`.** It is named Universal Pictures Home Entertainment Benelux, but the handle is @Hollywoodhundred, so I left it as `unconfirmed`.
- **Absence of a pt-BR official trailer is not proof.** For De Olhos Bem Fechados, Bastardos Inglórios, O Senhor das Armas, Pulp Fiction, Casamento Sangrento, O Lagosta, O Mistério de Silver Lake, V de Vingança and Vivarium, channel search and general search found none. YouTube channel search is not exhaustive and unlisted videos are invisible to it.
- **Playback was sampled, not complete.** Each video ran until the clock passed about 4 s; I did not play any to the end. No ad was showing at the sample point (`.ad-showing` false), but ads in production cannot be excluded.
- **Test conditions.** Logged-out, fresh browser contexts on this PC's connection, origin `http://localhost:8765` served through `page.route`. Not tested on the production domain, on mobile, logged in, or from other countries. All 98 list `BR` in `availableCountries`. Among primaries, 21 list 245 or more countries, while `E9secK4nEGI` lists only 22, so visitors abroad may be blocked on that one.
- **Language.** Burnt-in subtitles were checked on 4 sampled frames for 37 IDs. Entries marked "(title)" or "not frame-checked" rely on the title and caption language. `4BWhV-kCRc4` showed no subtitles in its dark sampled frames, so it is unconfirmed. Audio was never heard.
- **Red band and trailer content.** I looked only at sampled frames and did not review each trailer for content against the site's ratings.
- **Licensing.** I did not assess rights to embed beyond YouTube's own embed flags. IDs can also disappear or change settings later, so the site should handle `onError` and fall back to the next ID.

## Method

Scripts and raw data are in this folder:

| Step | Files |
|---|---|
| Candidates: YouTube search and channel search pages, plus web search for distributors | `yt-search.mjs`, `yt-channel.mjs`, `q.mjs`, `search-raw.json`, `channel-raw.json` |
| oEmbed, `youtube-nocookie.com/embed` markers, watch page player response | `verify-meta.mjs`, `meta.json` |
| Resolution and audio tracks | `verify-quality.mjs`, `quality.json` |
| Playback in headless Chrome 151 and Edge 156 through the IFrame API | `playback.mjs`, `playback.json`, `playback-edge.json` |
| Frame grabs for language | `frames.mjs`, `trailer-frames/`, `trailer-frames-alts/` |
| Director check against descriptions | `verify-director.mjs`, `directors.json` |
| Controls and audio track choice | `controls.mjs`, `controls.json`, `audio-check.mjs`, `audio-check.json` |
| Final merge | `build-trailers.cjs`, `candidates.json` |

Both projects stayed read-only, no server was started or stopped, and every browser ran headless.

## Sources

- [AdoroCinema, Manual Prático da Vingança Lucrativa](https://www.adorocinema.com/filmes/filme-314228/)
- [Ingresso.com, poster and release date](https://www.ingresso.com/noticias/manual-pratico-da-vinganca-lucrativa-ganha-poster-e-data-de-estreia)
- [AdoroCinema, O Lagosta](https://www.adorocinema.com/filmes/filme-224882/)
- [AdoroCinema, Retrospectiva 2016](https://www.adorocinema.com/noticias/filmes/noticia-126516/)
- [Observatório do Cinema, Os Oito Odiados](https://observatoriodocinema.com.br/?p=20028)
- [Diário do Litoral, Os Oito Odiados](https://www.diariodolitoral.com.br/cinema/os-oito-odiados-de-quentin-tarantino-estreia-em-janeiro/)
- [Rolling Stone Brasil, Os Oito Odiados](https://rollingstone.com.br/?p=57490)
- [Angel press release, Truth & Treason](https://angel.com/press/release/angel-announces-addition-of-truth-and-treason-to-theatrical-slate-for-fall)
- [IMDb, Truth & Treason](https://www.imdb.com/title/tt21825416)
- [Filmow, Vivarium](https://filmow.com/vivarium-t234788/)
- YouTube oEmbed, embed and watch pages for every ID in `trailers.json`
