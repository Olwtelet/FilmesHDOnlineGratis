# Classificação etária dos 26 filmes

Consulta feita em 08/11/2026. O campo `classificacao` de cada filme em `src/data/sessoes/<slug>.json` é a idade recomendada (L, 10, 12, 14, 16 ou 18) e aparece na ficha da sessão como "Classificação etária: 16 anos". Não é nota, estrela nem avaliação crítica. Desde esta rodada o campo é obrigatório, e nenhum dos 26 filmes está sem valor.

## Critério

1. Vale a classificação etária publicada para o Brasil, numa fonte pública que abre sem login. Uma classificação americana (R, PG-13) ou de outro país nunca é convertida em idade brasileira.
2. A portaria de classificação no Diário Oficial da União vale mais que qualquer outra fonte. Seis filmes têm portaria registrada (seção 5 de `docs/FASE2.md`, e a de Entrevista com o Demônio em `sessoes-2026-11.md`).
3. Sem portaria, o valor vem de plataformas brasileiras (Apple TV Brasil, Netflix Brasil, Prime Video Brasil, HBO Max Brasil, Disney+ Brasil, Claro tv+), de exibidores e instituições culturais (Cinemark, UCI, Instituto Moreira Salles, Mostra de São Paulo, Centro Cultural São Paulo) e da seção de certificados do IMDb, conferidos entre si. Só entram páginas que mostram o filme certo: título, ano, direção ou elenco.
4. Quando as fontes brasileiras divergem e não dá para saber qual versão a sessão vai exibir, vale a indicação mais restritiva entre as fontes confiáveis. Ela é registrada como indicação da fonte escolhida, não como portaria.
5. Selo com a letra A na frente (A14, A16, A18) é autoclassificação da plataforma. O número sem a letra vem do Ministério da Justiça, como explica a central de ajuda da HBO Max: [Classificações de conteúdo na HBO Max](https://help.hbomax.com/br/Answer/Detail/000002586). Esses selos aparecem aqui como indicação da plataforma.

Como foi feito:
- O IMDb (seção Certificações do guia dos pais, entrada Brazil) foi lido no navegador para os 26 filmes.
- As outras fontes foram procuradas por agentes independentes. Cada página foi aberta e conferida por um segundo verificador, que tentou refutar o valor e a identidade do filme.
- As fontes das quatro mudanças foram abertas de novo antes da troca.
- O DOU não pôde ser consultado nesta rodada: o navegador do app recusa o in.gov.br, e o Chrome estava desconectado. As portarias já registradas foram mantidas e não foram reabertas.

## Valores e fontes

País: Brasil em todas as linhas. Consulta: 08/11/2026 em todas as linhas. O IMDb de cada filme está em `https://www.imdb.com/title/<id>/parentalguide/`, seção Certificações.

| # | Filme | Valor | Fonte principal | Modalidade | Confirmam | Divergem |
|---:|---|---|---|---|---|---|
| 1 | The Long Walk (2025) | 18 | Portaria 1.498/2025 (DOU), registrada na seção 5. Hoje: [Cinemark](https://www.cinemark.com.br/filme/a-longa-marcha-caminhe-ou-morra) | Cinema | UCI, AdoroCinema, Prime Video, Claro tv+, IMDb | Apple TV A16 e TMDB digital 16, indicações da loja digital |
| 2 | The Running Man (2025) | 18 | Portaria 2.204/2025 (DOU), registrada na seção 5. Hoje: [Cinemark](https://www.cinemark.com.br/filme/o-sobrevivente) | Cinema | Apple TV, UCI, AdoroCinema, JustWatch, IMDb | Claro tv+ 16, sem descritores; uma ficha de imprensa com 12 |
| 3 | Vivarium (2019) | 16 | Portaria 1.405/2022 (DOU), registrada na seção 5. Hoje: [Apple TV](https://tv.apple.com/br/movie/viveiro/umc.cmc.1y1eg3bc65xefhpd2n0bx24he) | Digital, sem estreia em cinema no Brasil | Prime Video, AdoroCinema, IMDb | |
| 4 | Bastardos Inglórios (2009) | 18 | [Apple TV](https://tv.apple.com/br/movie/bastardos-inglorios/umc.cmc.3r1vekw1q5380qojcz9t1ie6a) | Loja digital | Netflix, Prime Video, AdoroCinema (cinema, 2009), IMDb | IMDb registra 16 só para a versão editada para TV |
| 5 | The Menu (2022) | 16 | [Apple TV](https://tv.apple.com/br/movie/o-menu/umc.cmc.138krmen28x7fjwrmm6c7l5gm) | Loja digital | AdoroCinema, TMDB (cinema, 2022), IMDb | |
| 6 | Obsessão (2025) | 18 | [Apple TV](https://tv.apple.com/br/movie/obsessao/umc.cmc.5n9tcj7azek0g9igds7ybcc0s) | Loja digital | TMDB (cinema e digital, 2026), IMDb | |
| 7 | V de Vingança (2005) | 16 | [HBO Max](https://www.hbomax.com/br/pt/movies/v-de-vinganca/acc7cc4f-cdc6-4e00-b8a9-eb8b72241bba), selo sem a letra A | Streaming | Apple TV (A16), Prime Video, Omelete, IMDb | |
| 8 | O Senhor das Armas (2005) | 16 | [Apple TV](https://tv.apple.com/br/movie/o-senhor-das-armas/umc.cmc.33c8emvylqpid7l1uf71orhz4) | Loja digital | Netflix, Prime Video, Omelete, IMDb | |
| 9 | Aquilo que Você Deseja (2023) | **18**, era 16 | [Prime Video](https://www.primevideo.com/detail/0M4QME6Q0PX03SNIYEYE8NCTLT), selo A18, canal Looke | Streaming; indicação da plataforma | | O 16 anterior vinha do arquivo do site antigo, sem fonte pública brasileira. O IMDb não tem certificado brasileiro, e a página da Looke não mostra número |
| 10 | Bugonia (2025) | 18 | [Apple TV](https://tv.apple.com/br/movie/bugonia/umc.cmc.405pbn0ajtqwj3ycjapyd0i9x) | Loja digital | Prime Video, JustWatch, Jornal de Brasília (cinema, Universal), IMDb | Um site de notícias com "Livre" numa linha solta, descartado |
| 11 | Casamento Sangrento (2019) | 18 | Portaria 963/2023 (DOU), registrada na seção 5. Hoje: [Apple TV](https://tv.apple.com/br/movie/casamento-sangrento/umc.cmc.70tmfkjw2mgapsonfln8j7yau) | Loja digital | Netflix, Disney+ (A18), IMDb | Fontes de 2019 a 2025 com 16 (TMDB digital, Netflix até maio de 2025, JustWatch) e uma de 2020 com 14, anteriores à portaria de 2023 |
| 12 | Casamento Sangrento: A Viúva (2026) | 18 | Portaria 469/2026 (DOU), registrada na seção 5. Hoje: [AdoroCinema](https://www.adorocinema.com/filmes/filme-1000001305/) | Cinema, Disney | Disney+, Apple TV, JustWatch, IMDb | |
| 13 | Verdade e Traição (2025) | 16 | [Apple TV](https://tv.apple.com/br/movie/verdade--traicao/umc.cmc.5v9kwra7oh4kov8rp1g1tfq57) | Loja digital | IMDb | Só uma plataforma brasileira e o IMDb; o TMDB registra a estreia em cinema sem idade |
| 14 | Manual Prático da Vingança Lucrativa (2026) | 16 | [Prime Video](https://www.primevideo.com/-/pt/detail/0RF7XSLW69GOQRBVEXZ3D9IWZ7) | Loja digital | Apple TV, AdoroCinema (cinema, Diamond Films), IMDb | |
| 15 | Sem Limites (2011) | 14 | [Apple TV](https://tv.apple.com/br/movie/sem-limites/umc.cmc.3r8penw72d0g0peapo0gk3q3s) | Loja digital | Netflix, Prime Video, JustWatch, IMDb | |
| 16 | De Olhos Bem Fechados (1999) | 18 | [HBO Max](https://www.hbomax.com/br/pt/movie/e081bcaf-7dbc-42c0-92aa-3dcb5f2323b1) | Streaming | Apple TV, Prime Video, [Mostra de São Paulo](https://mostra.org/arquivo/filme/390), AdoroCinema, IMDb | |
| 17 | Django Livre (2012) | 16 | [Apple TV](https://tv.apple.com/br/movie/django-livre/umc.cmc.1k5z2t463bta6u5dyvu9xsp4g) | Loja digital | Netflix, Prime Video, AdoroCinema (cinema, 2013), IMDb | |
| 18 | Doutor Sono (2019) | 16 | [Netflix](https://www.netflix.com/title/80233020) | Streaming, versão de cinema (2h32) | Apple TV (A16), AdoroCinema (cinema, 2019), JustWatch, IMDb | A versão do diretor (3h) não tem idade publicada |
| 19 | O Mistério de Silver Lake (2018) | 18 | [Apple TV](https://tv.apple.com/br/movie/o-misterio-de-silver-lake/umc.cmc.649vt05uv0znkija6etgg0zjw), selo A18 | Loja digital | AdoroCinema, TMDB (digital, 2020) | IMDb 16 e Prime Video "16+" na escala própria da Amazon. Ficou 18, o valor das fontes no formato brasileiro |
| 20 | O Lagosta (2015) | 16 | [Apple TV](https://tv.apple.com/br/movie/o-lagosta/umc.cmc.53sd1btc65tto9igfxy3gorya) | Digital, sem estreia em cinema no Brasil | Prime Video, IMDb (vídeo) | |
| 21 | Pulp Fiction: Tempo de Violência (1994) | 18 | [Apple TV](https://tv.apple.com/br/movie/pulp-fiction-tempo-de-violencia/umc.cmc.1hfvw2p79f9qdeydow8nmrn7t) | Loja digital | Netflix, IMDb | |
| 22 | Os Oito Odiados (2015) | 18 | [Apple TV](https://tv.apple.com/br/movie/os-oito-odiados/umc.cmc.1t2k0vp0w0w0ayfvezfym9s1e) | Loja digital | Netflix, AdoroCinema (cinema, 2016), IMDb | |
| 23 | Laranja Mecânica (1971) | **18**, era vazio | [Apple TV](https://tv.apple.com/br/movie/a-clockwork-orange/umc.cmc.3ldbiqqnpx3d6bd8eknxioyaf), selo A18 | Loja digital; indicação da plataforma, a mais restritiva | [Centro Cultural São Paulo](https://prefeitura.sp.gov.br/web/cultura/w/centro-cultural-s%C3%A3o-paulo-exibe-mostra-especial-de-stanley-kubrick-no-cine-na-pra%C3%A7a), sessão de 2026 | 16 em outras fontes; ver abaixo |
| 24 | Eles Vivem (1988) | **14**, era vazio | [Instituto Moreira Salles](https://ims.com.br/filme/eles-vivem/) | Exibição em DCP | Apple TV (A14), JustWatch, TMDB (cinema, 1989), IMDb | |
| 25 | Entrevista com o Demônio (2023) | 16 | Portaria 1.096/2024 (DOU, 05/06/2024; no DOU, a página leva o título da 1.083, primeira do bloco): [DOU](https://www.in.gov.br/web/dou/-/portaria-cpcind/senajus/mjsp-n-1.083-de-4-de-junho-de-2024-563694657) | Cinema, Diamond Films | Netflix, Apple TV, AdoroCinema, IMDb | |
| 26 | Rocky: Um Lutador (1976) | **12**, era vazio | [Apple TV](https://tv.apple.com/br/movie/rocky/umc.cmc.s32qp1txtrpzqz861on1fjot), "12" sem a letra A | Loja digital | [Claro tv+](https://www.claro.com.br/tv-por-assinatura/programacao/grade/programa/amc-hd/1-1619/rocky-um-lutador/1-807573) (canal AMC), JustWatch, TMDB (cinema, 1977), IMDb | |

Na sessão dupla, cada filme guarda a própria classificação no dado. A ficha mostra uma linha só quando as duas idades são iguais, como agora (18 e 18), e uma linha por filme quando forem diferentes.

## Laranja Mecânica: por que 18

As fontes brasileiras públicas se dividem entre 16 e 18. A diferença vem de época, versão e critério de plataforma:

**Época.** O filme ficou proibido no Brasil e só estreou em 1978, com tarjas pretas sobre a nudez e "censura 18 anos":
- [TMDB, datas de lançamento](https://www.themoviedb.org/movie/185/releases): 04/09/1978, 18, cinema.
- [Rolling Stone Brasil, 25/07/2021](https://rollingstone.com.br/noticia/50-anos-de-laranja-mecanica-5-curiosidades-sobre-o-classico-de-stanley-kubrick-lista/).

Esse 18 é um certificado da Censura Federal, anterior ao sistema de classificação indicativa, sobre uma cópia cortada. Não vale como classificação atual.

**Versão.** A versão restaurada voltou aos cinemas em 2013, no CineSESC, com 16 anos ([Omelete](https://omelete.com.br/cinema/versao-restaurada-de-laranja-mecanica-volta-sao-paulo/)). O TMDB registra também um relançamento em 22/08/2014 com 16, anotado "com cortes". Essa anotação vem de base colaborativa e não foi confirmada. Se for verdadeira, o 16 valeu para uma cópia cortada.

**Plataformas e exibidores hoje:**

| Fonte | Valor |
|---|---|
| Apple TV Brasil | A18, autoclassificação da plataforma, com os descritores violência, sexo e alta tensão |
| JustWatch Brasil | 16, sem dizer a origem |
| IMDb, certificado brasileiro | 16, sem nota de versão |
| Centro Cultural São Paulo, Prefeitura de São Paulo, sessão de 27/08/2026 | 18 |

O 18 do Centro Cultural São Paulo é uma corroboração fraca: a mesma mostra deu 18 a Nascido para Matar, que outras fontes brasileiras dão como 16.

**Decisão.** O catálogo não diz qual cópia a sessão vai exibir, e nenhuma portaria do DOU pôde ser consultada nesta rodada. O único 16 ligado a uma versão é o do relançamento de 2013, informado pela imprensa, e o TMDB põe em dúvida se essa cópia era completa. Sem determinar a versão, vale a indicação mais restritiva entre as fontes brasileiras confiáveis.

O valor é **18**, como indicação da Apple TV Brasil (selo A18, autoclassificação da plataforma). Não é classificação oficial do Ministério da Justiça. Se a sessão usar a cópia restaurada e aparecer uma portaria dessa versão com 16, basta trocar o valor no JSON.

## Fontes que não serviram

- **Filmow, Guia da Semana e Cine Passeio (Curitiba):** devolveram 403. Os valores que só apareceram em trechos de busca não foram usados.
- **Prime Video com "Suitable for ages 16 and over":** é a escala da própria Amazon, não o selo brasileiro; o selo brasileiro é o arquivo `adjctq` da imagem. Foi tratado como divergência, não como idade brasileira.
- **Classificações americanas e de outros países** (R, PG-13, M/16 de Portugal e outras): ignoradas.
