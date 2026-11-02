# Fase 2: Filmes HD Online Grátis sobre a estrutura da Siena

Este documento registra o modelo editorial, o cadastro de sessões, o mapeamento dos blocos e as decisões de adaptação. A estrutura, as animações e as interações continuam as da réplica; marca, filmes e textos passam a ser do Filmes HD Online Grátis.

Ponto de retorno do código: `backups/pre-fase2-marca.tar.gz` (193 arquivos, sem vídeo, imagem nem áudio). Os binários da Siena retirados do site público ficam em `reference/retirados-fase2/`, fora do que é servido.

## 1. Decisões de arquitetura

| Tema | Decisão | Motivo |
|---|---|---|
| Fonte de dados | Um arquivo por sessão em `src/data/sessoes/<slug>.json`, validado com zod no build | Home, Work, menu e páginas leem o mesmo dado; cadastrar é criar um arquivo |
| Slugs | Os mesmos do site atual, inclusive `the-inheritance-2025` e `truth-treachery-2026` | São a URL pública e a chave do banco que volta na fase de contas |
| Rotas | `/`, `/programacao/`, `/sobre/`, `/contato/`, `/sessoes/<slug>/`, `/cookies/`, `/termos/`, `/privacidade/`, `/rss.xml`. `format: directory`, `trailingSlash: always` | Mantém os links atuais do site no ar. O bundle não conhece rotas; `data-page` e `data-case` continuam |
| Primeiro destaque | Patch em `tools/patch-bundle.mjs`: o giro de entrada de `-60` e `-100` passa a múltiplo de N | Deixa uma só ordem em todas as listas. Rotacionar o DOM punha a próxima sessão na linha 18 do menu |
| Ordem | `<script data-taxi-reload>` inline depois do canvas: roda no primeiro carregamento e em toda navegação Taxi, inclusive do cache, antes de os módulos lerem o DOM | Um script deferido ou um wrapper de `fetch` não vê páginas em cache |
| Relógio | Texto local de São Paulo por `Intl` (`2026-10-31T20:30`), comparado como string | Independe do fuso do visitante e dos dados de fuso no build |
| Fim da sessão | `sessao.fim` explícito vence; sem ele, 00:00 do dia seguinte em São Paulo | Regra do proprietário |
| Sem próxima sessão | Um item-aviso (`data-aviso`) gerado em todas as listas posicionais; o script remove o item quando há sessão futura e o põe em primeiro quando não há | As listas precisam ter o mesmo N e nenhuma data é inventada |
| Aba aberta | Checagem a cada 30 s, em `visibilitychange` e `pageshow`. Rótulos mudam no lugar. Home e Programação recarregam quando a ordem muda: escondida, só na volta; visível, após 20 s sem interação. Abertura ou tutorial na tela, painel aberto, modo CENAS e filtro em uso seguram a recarga. Depois da abertura, os cookies são gravados antes para não repeti-la | Recarregar reinicia o WebGL do zero, sem corrida, e nunca em segundo plano |
| Abertura | Sem vídeo: barras em CSS `transform` e máscara derivada de `simbolo.png`. Um `<video>` vazio fica porque o `app.js` exige | Nenhum decodificador envolvido; 5,8 MB viram cerca de 18 KB; os vídeos tinham a marca nos quadros |
| Tutorial | `<video preload="none">` com gravação da home real em WebM e MP4, feita por `npm run tutorial` com a home servida em 4322. Regravar se a home mudar de aparência | O arquivo antigo era uma gravação do site da Siena. Nada do vídeo é pedido antes do `play()`, 2 s depois do ENTER, nem abaixo de 992 px. Mestre e roteiro ficam em `reference/fase2/tutorial/` |
| Trailer | `iframe` de `youtube-nocookie` montado no clique dentro do diálogo existente e removido ao fechar; controles do próprio YouTube; barra customizada oculta; `body::after` desligado enquanto aberto | A política do YouTube não permite sobreposição; nenhuma requisição antes do clique |
| Saída para o YouTube | Link "Não abriu? Ver no YouTube", sempre à vista e fora do player, com o filme escolhido. O clique tira o player na hora e fecha o diálogo | O site não enxerga um player que falhou em outra origem, então não há como mostrar um aviso só quando falha |
| Tamanho do diálogo | A partir de 768 px, encolhe em 16:9 até caber na janela. Em janela larga e baixa o bloco de 80% da largura passava da altura da tela e levava os controles do player, o X e o link junto. Ao mudar o tamanho da janela ou girar o aparelho, o player volta ao centro | Com a rolagem presa, quem girava o celular com o trailer aberto não tinha como voltar |
| Sessão dupla | Uma página, dois trailers, seletor de dois botões fora do player | O `Ia` do bundle aceita um único player |
| Teclado | Menus abrem e fecham com Espaço e Enter. Saem do Tab os painéis fechados, os cartões da home fora da tela e o link do lightbox. Paradas de Tab: home 5, Programação 7, sessão 27, Sobre 21, Contato 5, 404 9, Cookies 20 | Com 21 sessões a home tinha 97 paradas, 92 delas invisíveis |
| Sobre no celular | Até 479 px, título em 11vw e linhas pequenas em 4vw, com `!important` em `tema-sinal.css`: 42,9 e 15,6 px a 390 px | O `main.css` original deixa 15,6 e 7 px, difícil de ler; o site da Siena no ar está igual. Os 15vw e 20 px do `webflow.css` cabem, mas o fim de ONLINE e de CURADORIA some na camisa branca da foto |
| Ouvinte de teclado da Programação | Patch no `app.js`: guarda a referência para conseguir remover o ouvinte ao sair da página | O original criava uma função nova ao remover, e o ouvinte antigo continuava ativo depois de sair |
| Busca | Filtro no painel pequeno do menu, em `<textarea rows=1>` | `Hn` captura todo `input` sob `[data-menu=w]` por posição |
| Imagens | Hospedadas no site, derivadas do TMDB: hero 1920, roll 1600, cartaz 800, cenas 960 e 640 | `or()` não tem `onerror`, CDN externa travaria a página; Work carrega todos os quadros de uma vez |
| Lightbox | Número par de quadros, 14 por sessão, 640 px | O shader quebra a emenda com total ímpar; 14 a 640 px mantém o orçamento de GPU da Siena |
| Galeria | 14 itens por faixa; repete imagens se faltar | Menos de 6 abre buracos; zero derruba a página |
| Slider de leituras | 6 slides por sessão | Cobertura de 100% até 2560 px |
| Rollover dos títulos | Patch no `app.js`: escreve todas as letras e só depois cria as animações | O original forçava estilo e layout por letra. Com 299 letras em 21 títulos, isso virava uma tarefa longa de 4 a 11 s antes do timer do ENTER |
| CSS por filme | As regras `.moon`, `.kafka`, `.my`, `.ana` e `.freud` saem do `main.css` | Nomes dos filmes antigos; nenhuma classe dessas existe mais no HTML |
| Depuração do bundle | A tecla `g` deixa de abrir o painel lil-gui | Painel de desenvolvimento em inglês visível ao público |
| Textos no bundle | `SCROLL` passa a `ROLAR` | Literal único; ver `tools/patch-bundle.mjs` |

## 2. Blocos da Siena e o que entra neles

| Bloco | Conteúdo novo | Observação |
|---|---|---|
| Home, sobrancelha | Estado e data: `PRÓXIMA SESSÃO · 07/11 20:30` | Calculado no navegador, também visível no celular |
| Home, título | Título do filme | `tituloCurto` para a sessão dupla |
| Home, prêmio | Data em destaque e `SÁBADO 20:30 SALA 24` | Sem láurea |
| Home, críticas | 3 notas curatoriais `{ rotulo, frase }` | `<figure>` vazio mantém o parallax do `sg()`. Nada de estrelas nem crítico atribuído |
| Work, Location | `Sessão`: `17/10 20:30` | Mostra as exceções de dia e hora |
| Work, FOOTAGE/POSTER | CENAS / CARTAZ | |
| Menu, ingresso | Título curto, gênero, ano, minutos | |
| Menu, painel de filme | Manchete, direção, curadoria | |
| Menu, painel de caso | Leitura de até 320 caracteres | A meta description é outro campo, `descricao`, de até 155 |
| Caso, créditos | Direção, roteiro, fotografia, música, montagem, produção, elenco | Nomes conferidos com o TMDB |
| Caso, DIRECTOR'S CUT | Retirado | Afirmação falsa e nunca visível |
| Caso, galeria | Cenas sem legenda | O elemento de legenda fica vazio, senão o bundle quebra |
| Caso, críticas | `LEITURAS`: 6 notas `{ rotulo, frase }` da curadoria | Sem atribuição a crítico |
| Caso, prêmios | `FICHA DA SESSÃO`: data, hora, sala, direção, duração, gêneros, sinais | Letreiro derivado do dado, sem logos |
| Caso, investidores | `NA SALA`: sala, Discord, data, aviso de que o site não exibe o filme | O original só mostra `h3`, `h4` e `h5`, mais o link da sala que o tema reabilita |
| Caso, próximo | Próxima na ordem calculada | |
| Sobre, equipe | Curadoria (Olwtelet) e comunidade (Sala 24), com cartão de teste no lugar de retrato | Nenhuma pessoa inventada |
| Sobre, colaboradores | Discord, YouTube, Steam | Bloco já oculto pelo CSS original |
| Contato | E-mail, Discord | Sem telefone nem endereço |
| Rodapé, newsletter | Feed RSS: endereço, botão que copia de verdade, link | Nenhum dado pessoal coletado; nenhum sucesso simulado |

## 3. Funcionalidades do site antigo

| Recurso | Destino | Quando |
|---|---|---|
| Programação | Work em `/programacao/` | Agora |
| Sessões | Estudo de caso em `/sessoes/<slug>/` | Agora |
| Sobre | About em `/sobre/` | Agora |
| RSS | `/rss.xml`, mesmos `guid` | Agora |
| Busca (`busca.json`, paleta) | Filtro do painel pequeno do menu | Agora |
| Regras da sala | Bloco NA SALA | Agora |
| Gêneros e sinais | Filtro do menu e letreiro de cada sessão | Agora |
| Dossiê | Absorvido: a ferramenta de tier list é uma classificação pessoal e conflita com a regra sem pontuação. A leitura crítica passou às páginas de sessão | Agora, sem a ferramenta |
| Mural | Fase de contas e banco. Precisa de `mural_entries` e moderação | Última fase |
| Ranking | Fase de contas e banco; retirar `rating_count` das views | Última fase |
| Favoritos, assistidos, perfil, notas, admin, login | Fase de contas e banco; retirar a nota de 1 a 3 estrelas de `FilmActions`, `LibraryList` e das views | Última fase |
| Rádio (Spotify), Calibração | Fora desta fase; nada depende deles | A decidir |

## 4. Como cadastrar uma sessão

Sem banco de dados: um arquivo por sessão, e a home se reorganiza sozinha quando a data chega.

1. Copie `src/data/sessoes/_modelo.json` para `src/data/sessoes/<slug>.json`. O nome do arquivo é o `slug` e vira a URL `/sessoes/<slug>/`.
2. Preencha data e hora publicadas em `sessao`. Sessão fora do sábado às 20:30 não precisa de nada especial: vale o que estiver no arquivo. Se houver hora de término, acrescente `"fim": "2026-11-08T01:30"`, hora local de São Paulo. Sem esse campo a sessão fica em destaque até a meia-noite de São Paulo.
3. Em `filmes`, um item por filme. Sessão dupla tem dois itens, cada um com sua `hora` e seu trailer. Título de mais de 32 caracteres não cabe no ingresso e pede `tituloCurto`, de até 30.
4. O trailer é o ID do YouTube. Antes de cadastrar, confira se o vídeo toca incorporado: o site usa `youtube-nocookie`.
5. Em `imagens`, aponte para arquivos do TMDB (`{ "tmdb": "abc123.jpg" }`) ou para arquivos seus (`{ "arquivo": "caminho/no/projeto.jpg" }`). Pode haver menos de 14 cenas; o site repete até completar.
6. Rode:

```bash
npm run imagens
```

```bash
npm run textos
```

```bash
npm run og
```

```bash
npm run build
```

`npm run imagens` baixa e gera as versões em `public/assets/img/sessoes/<slug>/`, e `npm run og` gera o cartão de compartilhamento. O build para com o arquivo e o campo quando há data inexistente, hora inválida, fim antes do início, texto maior que o espaço na tela, campo com nome errado, imagem sem origem ou arquivo de imagem faltando. `npm run textos` confere o que não é estrutura: palavras longas demais para o espaço, vocabulário vetado, frases e rótulos repetidos.

Se a sessão nova mudar o estado da home (por exemplo, sai o aviso), o tutorial continua mostrando a home do dia da gravação. Para atualizar, com o site servido em 4322:

```bash
npm run tutorial
```

O campo opcional `classificacao` só entra quando houver registro confirmado. `linhasTitulo` é o número de linhas do título no herói da página; sem ele, a página mostra só o fio de cima e o de baixo.

Para a voz editorial, ver os campos de `texto` no modelo e as sessões já publicadas: tese crítica própria do filme, sem sinopse, superlativo, crítico citado, prêmio, bastidor ou promessa de streaming, e sem revelar o final.

## 5. Correções de dados

Inventário: 21 sessões e 22 filmes, a contagem que a Programação mostrava em 31/10/2026, com 0 divergências entre o site no ar, o repositório antigo e o RSS. O relatório completo está em `reference/fase2/relatorios/catalog.md`, e os créditos das imagens em `images-credits.md`, na mesma pasta.

O que mudou em relação ao que estava publicado:

| Sessão | Publicado | Agora | Fonte |
|---|---|---|---|
| `the-inheritance-2025` | Dan Berk e Robert Olsen, 2025, 99 min | John Patton Ford, 2026, 105 min | O enredo e o personagem Becket Redfellow, do próprio texto publicado, são de *How to Make a Killing* |
| `the-running-man-2026` | 137 min; classificação 16 | 133 min; 18 | Várias salas; Portaria 2.204/2025 no Diário Oficial |
| `obsession-2026` | 108 min | 109 min | Fontes dão 108 ou 109; vale o TMDB |
| `what-you-wish-for-2023` | 102 min | 101 min | TMDB |
| `the-long-walk-2025` | Classificação 16; o texto falava em 100 caminhantes | 18; 50 caminhantes, um por estado | Portaria 1.498/2025; Wikipedia |
| `vivarium-2019` | Classificação 14 | 16 | Portaria 1.405/2022 |
| `ready-or-not-double-feature-2026` | Sem classificação; fim calculado em 22:53 | 18 nos dois filmes; sem fim explícito | Portarias 963/2023 e 469/2026. O fim calculado errava: ignorava o intervalo entre os filmes |
| `truth-treachery-2026` | Sinal "clássico" | Sinal retirado | Filme de 2025 |

Lembrete: os slugs `truth-treachery-2026` (o filme se chama *Truth & Treason*) e `the-inheritance-2025` continuam errados de propósito, porque são a URL pública e a chave do banco.

Não copiado do site antigo: `:contentReference[oaicite:0]`, visível na sessão dupla, e as cercas de código soltas em 5 arquivos.

## 6. Catálogo publicado

21 sessões, 22 filmes. A sessão dupla é uma página com dois trailers: 19:30 e 21:30. A última sessão foi em 31/10/2026; desde 01/11/2026 às 00:00 não há sessão futura cadastrada e a home abre no aviso "Sem sinal".

| # | Data | Hora | Sessão | Direção | Min | Classif. | Slug |
|---:|---|---|---|---|---:|---|---|
| 1 | 18/04/2026 sáb | 20:30 | The Long Walk (2025) | Francis Lawrence | 108 | 18 | `the-long-walk-2025` |
| 2 | 25/04/2026 sáb | 20:30 | The Running Man (2025) | Edgar Wright | 133 | 18 | `the-running-man-2026` |
| 3 | 13/06/2026 sáb | 20:30 | Vivarium (2019) | Lorcan Finnegan | 97 | 16 | `vivarium-2019` |
| 4 | 27/06/2026 sáb | 20:30 | Bastardos Inglórios (2009) | Quentin Tarantino | 153 | 18 | `inglourious-basterds-2009` |
| 5 | 30/06/2026 ter | 20:30 | The Menu (2022) | Mark Mylod | 107 | 16 | `the-menu-2022` |
| 6 | 02/07/2026 qui | 20:30 | Obsessão (2025) | Curry Barker | 109 | 18 | `obsession-2026` |
| 7 | 04/07/2026 sáb | 20:30 | V de Vingança (2005) | James McTeigue | 132 | 16 | `v-for-vendetta-2005` |
| 8 | 11/07/2026 sáb | 20:30 | O Senhor das Armas (2005) | Andrew Niccol | 122 | 16 | `lord-of-war-2005` |
| 9 | 16/07/2026 qui | 20:30 | Aquilo que Você Deseja (2023) | Nicholas Tomnay | 101 | 16 | `what-you-wish-for-2023` |
| 10 | 18/07/2026 sáb | 20:30 | Bugonia (2025) | Yorgos Lanthimos | 118 | 18 | `bugonia-2025` |
| 11 | 25/07/2026 sáb | 19:30 | Casamento Sangrento + Casamento Sangrento: A Viúva (2019 + 2026) | Bettinelli-Olpin & Gillett | 95 + 108 | 18 | `ready-or-not-double-feature-2026` |
| 12 | 08/08/2026 sáb | 20:30 | Verdade e Traição (2025) | Matt Whitaker | 121 | 16 | `truth-treachery-2026` |
| 13 | 15/08/2026 sáb | 20:30 | Manual Prático da Vingança Lucrativa (2026) | John Patton Ford | 105 | 16 | `the-inheritance-2025` |
| 14 | 22/08/2026 sáb | 20:30 | Sem Limites (2011) | Neil Burger | 105 | 14 | `limitless-2011` |
| 15 | 29/08/2026 sáb | 20:30 | De Olhos Bem Fechados (1999) | Stanley Kubrick | 159 | 18 | `eyes-wide-shut-1999` |
| 16 | 05/09/2026 sáb | 20:30 | Django Livre (2012) | Quentin Tarantino | 165 | 16 | `django-unchained-2012` |
| 17 | 19/09/2026 sáb | 20:30 | Doutor Sono (2019) | Mike Flanagan | 152 | 16 | `doctor-sleep-2019` |
| 18 | 26/09/2026 sáb | 20:30 | O Mistério de Silver Lake (2018) | David Robert Mitchell | 139 | 18 | `under-the-silver-lake-2018` |
| 19 | 17/10/2026 sáb | 20:30 | O Lagosta (2015) | Yorgos Lanthimos | 119 | 16 | `the-lobster-2015` |
| 20 | 24/10/2026 sáb | 20:30 | Pulp Fiction: Tempo de Violência (1994) | Quentin Tarantino | 154 | 18 | `pulp-fiction-1994` |
| 21 | 31/10/2026 sáb | 20:30 | Os Oito Odiados (2015) | Quentin Tarantino | 168 | 18 | `the-hateful-eight-2015` |

Exceções ao sábado às 20:30: `the-menu-2022` (terça), `obsession-2026` e `what-you-wish-for-2023` (quinta), `ready-or-not-double-feature-2026` (19:30). Nenhuma sessão tem fim explícito publicado, então todas valem até a meia-noite de São Paulo.

## 7. Evidência dos testes

Rodada de 02/11/2026, contra o build de produção. Sem janela no Edge, salvo indicação.

| Verificação | Resultado | Observação |
|---|---|---|
| `tools/testes/varredura.mjs` | Nenhum achado | Siena, filmes antigos, estrelas, promessas, links internos, imagens, metadados |
| `tools/checar-textos.mjs` | 21 sessões dentro dos limites | |
| `tools/testes/ordem.mjs` | 47 de 47 | Antes, durante e depois da sessão, exceções, virada do dia, duas futuras, nenhuma futura, fusos, término explícito, aba aberta, escondida, CENAS e ENTER na tela |
| `tools/testes/interacoes.mjs` | 475 de 475 | Teclado, menus, filtro, toque, cadeia de navegação. A parte de mouse repetida depois do último ajuste do teste: 74 de 74 |
| `tools/testes/trailers.mjs` | 768 checagens, nenhuma falha | Os 22 trailers tocam pelo clique real, com som (85), oEmbed (22), nada externo antes do clique (18), saída para o YouTube (18), geometria em 30 janelas (30), celular deitado (34), sessão dupla (38), YouTube bloqueado (90), fechar (288), repetir (106), teclado (20), controles (19) |
| `tools/testes/paginas.mjs` | 3.294 de 3.294, depois da triagem abaixo | 7 tamanhos, de 360x640 a 1920x1080, com sessão futura, aviso e títulos longos, mais dados, links, marca e menus |
| `tools/testes/abertura.mjs` | 21 de 21 | Tempos, quadros, 5 caminhos de falha (máscara, textura, `app.js` bloqueado, movimento reduzido, sem WebGL), visita de volta, nenhum vídeo antes do ENTER |
| `tools/testes/janela-real.mjs`, **Chrome e Brave reais, com janela** | 92 de 92 | 8 visitas por navegador a 1440 e 1536 px, limpa e com cache: a abertura anima, a home abre, o tutorial toca sem parar, a seta troca o filme, console limpo. Trailer de Bugonia toca pelo clique, Escape fecha, o link abre o filme no YouTube e, de volta à aba, o diálogo está fechado e a página rola |
| Tutorial | 40 de 40 no Edge e no Chrome | Rodada anterior à formatação. Vídeo só depois do ENTER, nada no celular |
| Revisão de código | 19 achados, 0 bloqueios | Rodada anterior. Corrigidos: datas e limites no zod, aba escondida, CENAS, abertura na tela, máscara, canonical da 404, JSON-LD |
| Revisão visual | Folhas de home, Programação, menus, sessões e Sobre vistas uma a uma | Desktop e celular, títulos curtos e longos, com sessão futura e com aviso |

**Tempos da abertura, em ms (mediana).** PC parado havia mais de 2 horas, sem jogo aberto, com o Wallpaper Engine aberto, que usa a GPU. Com jogo aberto não foi medido.

| Onde | ENTER, visita limpa | ENTER, com cache | Home depois do clique, limpa e com cache |
|---|---:|---:|---:|
| Edge sem janela, n=8 | 3.703 | 3.716 | 1.717 e 1.716 |
| Chrome com janela, n=4 | 3.853 | 3.655 | 1.712 e 1.717 |
| Brave com janela, n=4 | 3.854 | 3.695 | 1.715 e 1.719 |
| Site original da Siena, no ar, Edge sem janela, n=6 | 3.913 | 3.736 | 1.710 e 1.713 |

O ENTER é um timer fixo de 3,5 s, contado desde que o `app.js` começa a rodar (150 a 350 ms depois da navegação). Em 60 visitas perfiladas, 30 no Edge e 30 no Chrome, o timer atrasou no máximo 7 ms, a espera do quadro seguinte foi de no máximo 8 ms, e a preparação terminou de 1,97 a 2,13 s antes do timer, nunca depois. A leitura de 4,0 a 4,8 s de 01/11, com o VALORANT aberto e uma sonda antiga, não se repetiu, então o `app.js` não foi mexido por causa disso. Nas janelas reais, 146 a 151 quadros por segundo. A referência antiga de 1.838 ms até a home era de antes da formatação do PC: o site original, medido agora, dá o mesmo valor deste site.

**Triagem das falhas de Páginas.** Na bateria de 02/11, 32 de 3.294 checagens falharam, todas em "nenhum texto cortado".

- Reais, corrigidas em `tema-sinal.css`: o título do Sobre em qualquer tela abaixo de 768 px, com as letras visivelmente cortadas embaixo, porque o original desce cada linha .4rem e o `main.css` reduz o corpo a 4vw; e o `@` do e-mail do Contato, que perdia 1,5 px.
- Falso positivo, teste ajustado: o giro das letras do título da home, animação do original a cada 6 s; a cópia do rollover da 404, que o `clip-path` do tema esconde; as palavras do Sobre que correm com a rolagem; e a lista de filmes do menu, cortada pela própria caixa, que rola até o último item (conferido com a roda a 1440x900, 1536x730 e 1280x720).
- Os três cortes corrigidos antes, sem conferência, não reapareceram: til e cedilha nos rótulos das notas do celular, última letra do rodapé e letra do título da home.

**Triagem das interações.** Corrigido: o trailer não prende o foco depois de Tab e clique no player, Escape volta a fechar depois de clicar no player e de sair da tela cheia, o diálogo cabe em janela larga e baixa (a 2560x950 o player tem 1547x870), o seletor da sessão dupla não some com o celular deitado, os menus respondem a Espaço e Enter, o Tab não para em nada invisível e o ouvinte de teclado da Programação não sobrevive à saída da página.

Em 11 cenários de YouTube bloqueado ou vídeo indisponível, o player não mostra texto de erro legível pelo site. O link "Não abriu? Ver no YouTube" é a saída nesses casos, e é por isso que ele fica sempre à vista.

### O que não foi verificado

- Safari, Firefox, aparelhos reais e publicação de verdade na Vercel.
- **Chrome e Brave reais, além do caminho principal.** Neles rodaram abertura, tutorial, troca de filme, um trailer e a saída para o YouTube. Menus, filtro, teclado, toque e os outros 21 trailers rodaram só no Edge sem janela.
- **Programação em iPad.** Em emulação a 820x1180 a janela não anda de lado, a escala fica em 1 e os cartazes aparecem. O conteúdo de 4.150 px é recortado de propósito. Num iPad de verdade não foi visto.
- Tempos da abertura com jogo aberto. Nenhum estava aberto durante a medição.
- Depois da bateria mudaram só as regras do Sobre e do Contato e os testes de Páginas e abertura: foram repetidos varredura, abertura e Páginas. O aumento do texto do Sobre no celular veio por último e repetiu varredura, textos e Páginas só no Sobre, em todos os tamanhos (148 de 148). O resto não depende dessas regras.

### Herdado da estrutura original, sem alteração

- Com roda de mouse física, cada entalhe soma 0,06 de filme e o `update()` puxa 10% de volta por quadro: a roda mexe o rolo e não troca de filme. Trackpad, arrasto, setas e toque trocam.
- Escape só fecha o trailer e limpa o filtro; não fecha os menus nem o tutorial.
- No celular, o gesto que começa em cima do slider de leituras não rola a página, porque o bundle segura o `touchstart`. Rola pela margem.
- Entre 480 e 767 px de largura, a página inteira fica coberta por "Gire o aparelho para ver melhor". Isso pega celular deitado e tablet pequeno em pé.
- Os ouvintes de `resize` e de toque da Programação também ficam depois de sair da página. Nenhum efeito visto.

Do link novo do trailer, sem alteração: o clique com o botão do meio abre a aba e não fecha o diálogo, e o texto do link não diz o nome do filme nem que abre outra aba.

## 8. Decisões que dependem do proprietário

- Aprovar os textos legais, que não são aconselhamento jurídico, e conferir os termos de uso do TMDB, de onde vêm as imagens.
- Publicar o `app.js`, o CSS e os áudios originais da estrutura: nenhuma licença foi encontrada nos arquivos.
- Imagens com símbolos nazistas em `truth-treachery-2026` e `inglourious-basterds-2009`.
- Título "Verdade e Traição", como publicado, contra "Verdade & Traição", o oficial no Diário Oficial; títulos em inglês mantidos (`The Long Walk`, `The Running Man`, `The Menu`).
- Classificações sem registro oficial encontrado: oito filmes antigos seguem o TMDB, e `what-you-wish-for-2023` só tem uma listagem.
- As leituras são de fontes secundárias: nenhum filme foi assistido por quem escreveu. Detalhes só de memória estão em `reference/fase2/relatorios/` e no registro da revisão.

