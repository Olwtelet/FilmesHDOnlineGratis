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
| Abertura | Aquisição de sinal, sem vídeo e sem o símbolo. O primeiro quadro é todo preto, inclusive a faixa do topo: uma cópia dela, dentro da abertura, acende junto com a carta, e a da página só aparece depois de o nome parar, porque corre noutro relógio. Aos 0,7 s a carta SMPTE entra como sincronismo perdido: desliza de lado até assentar, com três faixas fora do lugar, e a luz só sobe, sem piscar. Aos 0,95 s o nome chega em três cópias, uma por canal de cor, que convergem; o pente de barras pretas fecha a carta, e o nome fica parado aos 2,65 s (2,35 s abaixo de 992 px), bem antes do ENTER. Com movimento reduzido, o nome branco aparece aos 0,75 s, sem carta. Sem aperto de letras nem kerning, porque com eles o R e o Á de GRÁTIS se tocavam. Um `<video>` vazio fica porque o `app.js` exige | Pedido do proprietário: preto, interferência, nome, ENTER. Só `transform`, `translate`, `scale` e `opacity`, no compositor: nada para na tarefa longa do `app.js`, e nada roda depois do fechamento. O nome usa a mesma Archivo numa face com `font-display: block`. Se ela ainda não chegou quando o nome começa a aparecer, o script do `<head>` da home fixa a fonte de reserva para a abertura inteira; fica no `<head>` para não perder esse instante numa rede lenta: o nome nunca troca de fonte com o ENTER na tela. Um estilo crítico no `<head>` pinta `html` e `body` de preto e esconde o nome até o tema chegar; se o tema não chegar, o nome aparece sozinho aos 4,5 s, uma cópia só |
| Tutorial | `<video preload="none">` com gravação da home real em WebM e MP4, feita por `npm run tutorial` com a home servida em 4322. Regravar se a home mudar de aparência. Regravado nesta rodada, porque mostrava o anel antigo do cursor | O arquivo antigo era uma gravação do site da Siena. Nada do vídeo é pedido antes do `play()`, 2 s depois do ENTER, nem abaixo de 992 px. Mestre e roteiro ficam em `reference/fase2/tutorial/` |
| Favicon | `favicon.svg` e `favicon-32.png`, gerados por `tools/marca.mjs` da mesma máscara de `simbolo-transparente.png`, recortada num quadrado em volta da forma, com um halo de 1 px, a própria forma dilatada, por baixo e no tom contrário. O PNG é branco com halo escuro. O SVG troca de cor pelo tema do sistema, que é o da página (`prefers-color-scheme`): branco com halo escuro no escuro, quase preto com halo claro no claro. Os dois links levam `?v=2`. O ícone de toque continua opaco | O antigo era o arquivo reduzido sem canal alfa, um quadrado preto. Branco sumiria numa guia clara. O SVG segue o tema da página, não o da guia: numa janela anônima com o Windows claro, a guia é escura e a página é clara, e o halo é o que mantém a forma à vista. O `?v=` fura o cache de favicon, que o navegador guarda à parte |
| Cartão sem programação | Só as barras SMPTE e o texto, sem o quadrado nem o símbolo, nos quatro tamanhos de `sem-sinal-*.webp`, gerados por `tools/marca.mjs`. O símbolo segue pequeno no menu, no rodapé, na página Sobre e no favicon, com o desenho original | O nome e a mensagem são o assunto do cartão |
| Volta à home | Nenhum `:has()` em `tema-sinal.css`: o estado vem de classes (`html.trailer-aberto`, `.com-principal`, `.com-pequeno`, `.foco-*`) postas por `local-trailer.js` e `local-menu.js`. Cada imagem vira textura uma vez por visita. Filmes e quadros que saem da tela são descartados, e a carga de uma página que já foi trocada é ignorada | Com os 16 `:has()` do tema, a montagem da home gastava segundos em `Document::recalcStyle`. Nenhuma regra sozinha era a culpada. Os 25 do `main.css` original ficam, sem custo mensurável. Sem carregador e sem atraso artificial; números na seção 7 |
| Leituras | Patch no `app.js`: o slider anda sozinho, dentro do próprio `render`, sem outro timer. Para fora da tela, com a aba escondida, durante o arrasto e com o foco de teclado nas setas. Depois de mexer com o ponteiro, volta em 3 s; depois da seta, em 6 s. Janela que mostra um cartão por vez troca a cada 6 s. Com movimento reduzido, só manual. A barra de progresso passa a dar a volta, e "ARRASTE PARA VER" sai | Pedido do proprietário. A cópia do preenchimento em `.fill-bar::before` evita o salto da barra na volta do ciclo |
| Cursor | Retícula em `local-cursor.js` e no bloco 8c do tema: anel, ponto central e uma microbarra SMPTE. Estados de link, arrasto vertical e horizontal, play, setas e aperto, lidos por `closest` de `[data-hitbox]`, `[data-videoplayer]`, `[data-roll]`, `[data-slider]`, `[data-reviews]` e dos links. Em `[data-cursor="hide"]`, onde o `app.js` escondia o cursor antigo, a mira fica sem o rótulo de arrasto. O nó antigo `.cursor-w-out` fica no HTML e não aparece | Um cursor só, sem leitura de layout por movimento, e o laço de quadros para quando o anel alcança o ponto. Fora em toque, movimento reduzido, contraste alto e cores forçadas. Campos de texto mantêm o cursor de texto, e o player do YouTube mantém o dele |
| Canais | Steam sai de dados, ícones e textos. X entra com `https://x.com/FilmesHDOG`, sem o `?s=20` de compartilhamento do endereço recebido. A varredura veta `steam` no build | O endereço respondeu 200, com o título da conta. Os dados de `src/data/site.ts` alimentam rodapé, Sobre e JSON-LD |
| Trailer | `iframe` de `youtube-nocookie` montado no clique dentro do diálogo existente e removido ao fechar; controles do próprio YouTube; barra customizada oculta; `body::after` desligado enquanto aberto | A política do YouTube não permite sobreposição; nenhuma requisição antes do clique |
| Saída para o YouTube | Ícone sem texto, junto do X, com nome acessível e o filme escolhido. O clique tira o player na hora e fecha o diálogo | Sem frase na tela. O site não enxerga um player que falhou em outra origem, então não há como mostrar um aviso só quando falha; a saída fica sempre à mão |
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
| Textos no bundle | `SCROLL` passa a `ROLAR` | Literal único; ver `tools/patch-bundle.mjs`. Desde o cursor do tema o rótulo não aparece: fica porque o `app.js` escreve nele |

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
| Sobre, colaboradores | Discord, YouTube, X | Bloco já oculto pelo CSS original |
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

Rodada de 02/11/2026, contra o build de produção. Sem janela no Edge, salvo indicação. Jogo aberto registrado em todas as medições de tempo e de janela real, desde as 14:51; o Wallpaper Engine foi anotado ligado às 14:51, e depois essa condição não foi registrada. Depois da bateria principal mudaram o foco do player, o aperto das letras da abertura, o `data-cursor` e duas regras só abaixo de 360 px. Foram repetidos varredura, identidade, teclado, controles, saída, sessão dupla, mouse, abertura e janelas reais, e Páginas a 320 px e nas páginas legais. Os demais resultados são da bateria principal.

| Verificação | Resultado | Observação |
|---|---|---|
| `tools/testes/varredura.mjs` | Nenhum achado | Siena, Steam, filmes antigos, estrelas, promessas, links internos, imagens, metadados |
| `tools/checar-textos.mjs` | 21 sessões dentro dos limites | |
| `tools/testes/identidade.mjs` | 254 de 254 | Tabela de larguras abaixo. Conta as letras da abertura por imagem: 20 letras e o acento, sem nenhuma encostada. No Chrome real, com a aba escondida: 0 quadros e 0 px em 9 s, e na volta o cartão desliza no máximo 29 px por quadro |
| `tools/testes/volta-home.mjs`, **Chrome e Brave reais, com janela** | 24 de 24 | Medição na subseção abaixo |
| `tools/testes/ordem.mjs` | 47 de 47 | Antes, durante e depois da sessão, exceções, virada do dia, duas futuras, nenhuma futura, fusos, término explícito, aba aberta, escondida, CENAS e ENTER na tela |
| `tools/testes/interacoes.mjs` | 475 de 475 | Teclado, menus, filtro, toque, cadeia de navegação. Teclado e mouse também a 1920 px (212 de 212), toque também a 320 px (24 de 24), e mouse repetido a 1440 px depois do cursor (74 de 74) |
| `tools/testes/trailers.mjs` | 773 checagens, nenhuma falha | Os 22 trailers tocam pelo clique real, com som (85), oEmbed (22), nada externo antes do clique (18), saída para o YouTube (18), geometria em 15 janelas (30), celular deitado (34), sessão dupla (38), YouTube bloqueado (90), fechar (288), repetir (106), teclado (25), controles (19) |
| `tools/testes/paginas.mjs` | 3.295 de 3.295 | 7 tamanhos, de 360x640 a 1920x1080, com sessão futura, aviso e títulos longos, mais dados, links, marca e menus. Depois, 320x568 inteiro (831 de 831) e Contato e páginas legais em 5 tamanhos (817 de 817), com as duas correções abaixo |
| `tools/testes/abertura.mjs` | 21 de 21 | Tempos, quadros, 5 caminhos de falha (máscara, textura, `app.js` bloqueado, movimento reduzido, sem WebGL), visita de volta, nenhum vídeo antes do ENTER |
| `tools/testes/janela-real.mjs`, **Chrome e Brave reais, com janela** | 87 de 87 | 8 visitas por navegador a 1440 e 1536 px, limpa e com cache: a abertura anima, a home abre, o tutorial toca sem parar, a seta troca o filme, console limpo. Trailer de Bugonia toca pelo clique, Escape fecha, o ícone abre o filme no YouTube e, de volta à aba, o diálogo está fechado e a página rola. 2 de 16 visitas, em rajada, ficaram de fora com a janela sem desenhar |
| Tutorial | 40 de 40 no Edge e no Chrome | Rodada anterior à formatação. Vídeo só depois do ENTER, nada no celular |
| Revisão de código | 19 achados, 0 bloqueios | Rodada anterior. Corrigidos: datas e limites no zod, aba escondida, CENAS, abertura na tela, máscara, canonical da 404, JSON-LD |
| Revisão visual | Folhas de home, Programação, menus, sessões e Sobre vistas uma a uma | Desktop e celular, títulos curtos e longos, com sessão futura e com aviso |

**Tempos da abertura nova contra a anterior, em ms (mediana).** Os dois builds um logo depois do outro, duas vezes, em janelas reais a 1440 px, com jogo aberto. Fora as visitas com a janela sem desenhar. Medido antes de tirar o aperto das letras, que é só CSS; os tempos depois disso estão logo abaixo.

| Onde | ENTER, visita limpa | ENTER, com cache | Home depois do clique, limpa e com cache | Tarefa longa, limpa e com cache |
|---|---:|---:|---:|---:|
| Chrome, anterior, n=4 | 4.000 | 3.786 | 1.727 e 1.735 | 1.924 e 2.373 |
| Chrome, abertura nova, n=3 | 4.051 | 3.688 | 1.712 e 1.699 | 506 e 452 |
| Brave, anterior, n=4 | 4.029 | 3.842 | 1.722 e 1.731 | 2.056 e 2.431 |
| Brave, abertura nova, n=3 | 4.019 | 3.727 | 1.722 e 1.703 | 458 e 370 |

Na visita limpa, a diferença do ENTER fica dentro da variação entre visitas. Com cache, a abertura nova ficou cerca de 100 ms mais rápida, sem sobreposição entre as visitas. Em nenhum caso o ENTER piorou fora da variação. A tarefa longa cai de cerca de 2 s para cerca de 0,5 s entre os dois builds; a parte do `:has()` nessa queda não foi medida isoladamente na primeira visita.

Depois de tirar o aperto das letras, sem o build anterior ao lado: Edge sem janela, n=8, ENTER 3.765 e 3.786 ms (limpa e com cache), dentro da referência de ±50 ms, e home 1.684 ms nas duas. Chrome com janela, n=4, ENTER 3.936 e 3.768 ms, home 1.693 e 1.692 ms. Brave com janela, n=3, ENTER 4.000 e 3.998 ms, home 1.698 e 1.691 ms. O Brave com cache oscilou de 3.686 a 4.010 ms, faixa mais larga que nas corridas anteriores (3.703 a 3.776 ms). A maior tarefa longa de cada grupo ficou de 411 a 465 ms.

**O que rodou em cada largura.** Janela real só onde a coluna diz; o resto é Edge sem janela.

| Estado | 320 | 390 | 820 | 1440 | 1920 |
|---|---|---|---|---|---|
| Abertura, cartão, trailer e sessão dupla | sim | sim | sim | sim | sim |
| Páginas de filme, com corte de texto e menus | sim | sim | sim | sim | sim |
| Leituras: anda, sem salto, barra | sim | sim | sim | sim | sim |
| Leituras: o toque assume | sim | sim | sim | não se aplica | não se aplica |
| Leituras: o mouse assume, foco nas setas, ciclo inteiro | não se aplica | não se aplica | não se aplica | sim | não |
| Links sociais: rodapé e menu, com clique real | sim | sim | sim | sim | sim |
| Ida e volta à home: duas viagens e o rolo respondendo | sim | sim | sim | sim | sim |
| Pausa da volta à home medida, em janela real | não | não | não | sim | não |
| Cursor | desligado | desligado | desligado | sim | sim |
| Teclado, ícone do trailer pelo teclado, mouse | não se aplica | não se aplica | não se aplica | sim | sim |
| Toque | sim | sim | sim | não se aplica | não se aplica |
| Aba escondida, em janela real | não | sim | não | sim | não |

**Correções que só o teste a 320 px mostrou.** O e-mail do Contato passava 5,5 px da caixa que o recorta e agora cabe, com menos espaço entre as letras abaixo de 360 px. Na Privacidade, "ARMAZENAMENTO", com corpo fixo, alargava o bloco 3,7 px além da janela, e o título passa a 11vw abaixo de 360 px.

**Rodada anterior, PC parado havia mais de 2 horas**, sem jogo aberto, com a abertura antiga.

| Onde | ENTER, visita limpa | ENTER, com cache | Home depois do clique, limpa e com cache |
|---|---:|---:|---:|
| Edge sem janela, n=8 | 3.703 | 3.716 | 1.717 e 1.716 |
| Chrome com janela, n=4 | 3.853 | 3.655 | 1.712 e 1.717 |
| Brave com janela, n=4 | 3.854 | 3.695 | 1.715 e 1.719 |
| Site original da Siena, no ar, Edge sem janela, n=6 | 3.913 | 3.736 | 1.710 e 1.713 |

O ENTER é um timer fixo de 3,5 s, contado desde que o `app.js` começa a rodar (230 a 490 ms depois da navegação, nas 60 visitas abaixo). Em 60 visitas perfiladas com a abertura nova, 30 no Edge e 30 no Chrome, com jogo aberto, o timer atrasou no máximo 6 ms, a espera do quadro seguinte foi de no máximo 7 ms, e a preparação terminou de 2,75 a 3,3 s antes do timer, nunca depois. A referência antiga de 1.838 ms até a home era de antes da formatação do PC: o site original, medido agora, dá o mesmo valor deste site.

### Abertura em aquisição de sinal e favicon transparente, 03/11/2026

Build final, com jogo aberto no PC. A ordem vem de duas fontes independentes: o tempo das próprias animações CSS, lido uma vez na hora do ENTER, e os pixels dos quadros, do primeiro quadro pintado ao primeiro com alguma luz (o ruído do monitor sobre o preto fica em 3, o limite é 12).

| Verificação | Resultado | Observação |
|---|---|---|
| `abertura.mjs`, Edge sem janela | 46 de 46 | ENTER 3.724 ms na visita limpa e 3.739 com cache, home 1.689 ms depois do clique. Em todas as 16 visitas: preto de 541 a 686 ms, nome parado de 906 a 1.053 ms antes do ENTER. Quadros a 1440 e 390 px, limpa e com cache, movimento reduzido, CSS lento, fonte lenta (1,5 s) e muito lenta (4,5 s). Falhas: máscara, textura, `app.js`, tema e WebGL bloqueados, e movimento reduzido |
| `janela-real.mjs`, **Chrome e Brave reais** | 115 de 115 | Desktop a 1440 e 1536 px, limpa e com cache: preto de cerca de 600 ms pelos pixels, ordem certa, home e tutorial. 2 de 16 visitas de fora, em rajada, com a janela sem desenhar |
| `janela-real.mjs --modo=celular` | 75 de 75 | Telefone de 390 px emulado na janela real, nos dois navegadores. 2 de 12 de fora, em rajada |
| `janela-real.mjs --modo=calmo` | 85 de 85 | Movimento reduzido: preto, o nome branco aparecendo, ENTER. 2 de 12 de fora, em rajada |
| `identidade.mjs`, parte abertura | 41 de 41 | Cinco larguras: nome inteiro e grande, 21 formas separadas (20 letras e o acento), longe do ENTRAR |
| `paginas.mjs`, parte marca | 30 de 30 | Favicon PNG: a forma de `simbolo.png`, cantos transparentes, legível sobre fundo claro (238 pixels destacados) e escuro (354). SVG: a mesma forma, com o halo em volta |
| Guias reais | Chrome e Brave | Perfis novos, sem cache de favicon. Tema claro, escuro e misto (interface escura com página clara): o símbolo aparece nos três, e no misto o halo o contorna |

**O ENTER não mudou.** O build anterior (commit `13cb041`) e o novo, um logo depois do outro, duas vezes, no Edge: anterior 3.723 e 3.714 ms na visita limpa, 3.726 e 3.726 com cache; novo 3.709 e 3.716, 3.726 e 3.738. Uma leitura isolada de 3.667 ms veio da máquina, não da abertura.

**Triagem.** A primeira revisão achou o símbolo escuro sumindo numa guia escura com a página clara, o PNG branco sumindo numa guia clara, as três cópias do nome empilhadas sem o tema e a troca de fonte com o ENTER na tela quando a fonte passa dos 3 s de bloqueio: todos corrigidos. A segunda achou o ouvinte da fonte num script deferido, que perderia o instante numa rede lenta, e a faixa do topo noutro relógio, que no Brave acendia até 330 ms antes da carta: os dois corrigidos. Os testes também foram corrigidos onde aprovavam sem provar: cópias sem a entrada, faixa sem espera, fonte não conferida, emulação de celular que não pegava na primeira visita do Brave.

**O que não foi verificado nesta parte.** Safari, Firefox e aparelhos reais. O favicon no Safari, que até a versão 18 usa o PNG. A janela anônima com o Windows claro foi reproduzida por opções de linha de comando do Chrome, não com o tema do Windows trocado.

### Volta à home: home, EXPLORAR, sessão, logo, home

**Causa.** Os 16 `:has()` de `tema-sinal.css`, em 12 regras. Com eles, a montagem da home gastava segundos em `Document::recalcStyle`. A explicação provável é que cada inserção invalidava o estilo do documento inteiro: o efeito foi medido, o mecanismo por nó não. O perfil culpava o ticker do GSAP com "layout forçado"; o rastro mostrou `Document::recalcStyle`. Testes A/B por grupo de regras não mostraram ganho em nenhum grupo isolado, só ao tirar todos. Os 25 `:has()` do `main.css` original ficaram, sem custo mensurável.

**Causas menores, corrigidas também.** 22 chamadas de `texImage2D` a cada volta, somando de 360 a 560 ms, quase todas num mesmo quadro, porque cada imagem virava textura de novo; agora, nenhuma na volta. O WebGL também não soltava filmes nem assinaturas de quadro antigos, e a carga de uma página já trocada continuava rodando.

**Maior pausa, em ms (mediana).** Janelas reais, perfil novo, build anterior e final um logo depois do outro, nas mesmas condições.

| Caminho | Antes | Depois | Pior caso depois | n depois |
|---|---:|---:|---:|---:|
| Chrome, visita limpa, primeira volta | 1.853 | 153 | 189 | 2 |
| Chrome, visita limpa, voltas seguintes | 1.986 | 153 | 239 | 4 |
| Chrome, com cache, primeira volta | 1.845 | 233 | 283 | 2 |
| Chrome, com cache, voltas seguintes | 1.881 | 214 | 267 | 4 |
| Chrome, entrada direta na sessão | 1.873 | 545 | 545 | 1 |
| Brave, visita limpa, primeira volta | 2.017 | 178 | 178 | 1 |
| Brave, visita limpa, voltas seguintes | 1.967 | 203 | 239 | 4 |
| Brave, com cache, primeira volta | 2.264 | 587, ver abaixo | 1.006 | 2 |
| Brave, com cache, voltas seguintes | 2.211 | 217 | 311 | 2 |
| Brave, entrada direta na sessão | 2.253 | 378 | 450 | 2 |

Na linha do Brave com cache, 587 é a média de 167 ms e 1.006 ms, e o segundo valor é uma volta com a janela sem desenhar que o critério do teste não pegou. Mais cedo no mesmo dia, nas mesmas condições anotadas, com tudo mais lento por causa não medida e antes dos últimos ajustes da revisão, o build anterior parava de 3,2 a 4,4 s, e o novo, de 0,16 a 0,52 s.

**O que se vê.** Nos quadros gravados da mesma volta no Chrome, o maior intervalo sem imagem nova cai de 2.256 ms para 283 ms (306 ms no Brave). Antes, a tela ficava escura de 0,37 s a 3,2 s, e o cartão completo aparecia em 4,4 s. Agora ela fica escura de 0,38 s a 1 s, e o cartão completo aparece em 2,2 s. Esse trecho escuro é a coreografia original do bundle, com os quadros andando. Nada foi acrescentado: nem carregador, nem atraso artificial.

**Janela sem desenhar.** Com o jogo aberto, de vez em quando o site inteiro passa a desenhar a 1 quadro por segundo: a home leva 15 s para abrir e o tutorial não sai a tempo. As voltas com 4 ou mais intervalos de cerca de 1 s ficam fora das medianas e são contadas à parte. Nas primeiras medições o caso pesou contra o build novo (7 de 56 voltas e 4 de 16 visitas, contra 1 de 56 e 0 de 16), então ele foi tirado a limpo com 48 navegadores novos, alternando os dois builds. Deu **4 de 24 no build anterior e 2 de 24 no final**, todos em rajada, das 16:18 às 21. As mudanças desta rodada não causaram isso, e a diferença anterior era amostra pequena. No mesmo navegador, a página em branco ficou sempre acima de 130 quadros por segundo, antes e depois do site. Nenhuma outra página que desenha foi medida, então não se sabe se o caso depende do WebGL deste site, e a causa não foi investigada. Sem o caso, a abertura rodou a 180 q/s no final, contra 170 no anterior, e a home a 180 q/s nos dois.

**Fora de propósito.** Reaproveitar o HTML dos títulos entre as voltas e arredondar as escritas por quadro: a pausa que sobra já cai na tela quase preta, e os dois mexem em mais código do bundle.

**Capturas.** Abertura (sequências de quadros no Chrome, no Brave, no celular, com cache e com movimento reduzido), favicon nas guias, cartão, trailer, cursor, rodapé e as folhas de quadros da volta à home, antes e depois, estão em `reference/fase2/capturas/`.

**Triagem da bateria final.** Duas falhas de teste, resolvidas assim:

- `trailers`, "terceiro Tab entra no player": defeito real em `local-trailer.js`. O foco leva alguns milissegundos para cruzar para o iframe, e o `keyup` chegava nesse intervalo. O site entendia que o foco não tinha entrado no player e o devolvia ao diálogo. Na rodada anterior o teste passava, talvez porque o recálculo dos `:has()` atrasava a tecla sintética; isso não foi medido. Corrigido, e o teste agora cobre também a tecla presa por 80 ms e o caminho de entrar, sair com Shift+Tab, clicar no player e fechar com Escape.
- `janela-real`, 2 de 92 numa visita do Chrome ("tutorial não saiu" e a seta não trocou): compatível com a janela sem desenhar descrita acima, embora o log dessa visita, sem o novo medidor, só mostre 52 q/s até a home e 5,6 s para abri-la. Repetindo 10 visitas, duas vieram a 1 q/s, com a home em 15 s e o tutorial preso; as outras 8 passaram, com 104 a 170 q/s. O teste agora mede os quadros por segundo e conta esse caso à parte, aceitando no máximo 1 de cada 4 visitas. Na comparação dos builds, uma das quatro corridas ficou acima desse limite, 4 de 8, numa rajada; as outras três deram 53 de 53 e nenhuma falha no restante.

**Triagem das falhas de Páginas.** Na bateria de 02/11, 32 de 3.294 checagens falharam, todas em "nenhum texto cortado".

- Reais, corrigidas em `tema-sinal.css`: o título do Sobre em qualquer tela abaixo de 768 px, com as letras visivelmente cortadas embaixo, porque o original desce cada linha .4rem e o `main.css` reduz o corpo a 4vw; e o `@` do e-mail do Contato, que perdia 1,5 px.
- Falso positivo, teste ajustado: o giro das letras do título da home, animação do original a cada 6 s; a cópia do rollover da 404, que o `clip-path` do tema esconde; as palavras do Sobre que correm com a rolagem; e a lista de filmes do menu, cortada pela própria caixa, que rola até o último item (conferido com a roda a 1440x900, 1536x730 e 1280x720).
- Os três cortes corrigidos antes, sem conferência, não reapareceram: til e cedilha nos rótulos das notas do celular, última letra do rodapé e letra do título da home.

**Triagem das interações.** Corrigido: o trailer não prende o foco depois de Tab e clique no player, Escape volta a fechar depois de clicar no player e de sair da tela cheia, o diálogo cabe em janela larga e baixa (a 2560x950 o player tem 1547x870), o seletor da sessão dupla não some com o celular deitado, os menus respondem a Espaço e Enter, o Tab não para em nada invisível e o ouvinte de teclado da Programação não sobrevive à saída da página.

Em 9 de 12 cenários de YouTube bloqueado, nenhum texto de erro aparece. Com vídeo apagado, restrição de idade e bloqueador, o YouTube ou o navegador mostram o próprio texto, que o site não consegue ler. O ícone de abrir no YouTube, junto do X, é a saída em todos, e é por isso que ele fica sempre à vista.

### O que não foi verificado

- Safari, Firefox, aparelhos reais e publicação de verdade na Vercel.
- **Chrome e Brave reais, além do caminho principal.** Neles rodaram abertura, tutorial, troca de filme, um trailer e a saída para o YouTube. Menus, filtro, teclado, toque e os outros 21 trailers rodaram só no Edge sem janela.
- **Programação em iPad.** Em emulação a 820x1180 a janela não anda de lado, a escala fica em 1 e os cartazes aparecem. O conteúdo de 4.150 px é recortado de propósito. Num iPad de verdade não foi visto.
- **Volta à home a partir da Programação** não foi medida: só o caminho por EXPLORAR e a entrada direta na sessão.
- **A janela sem desenhar** não foi explicada: só se sabe que não vem das mudanças desta rodada. Com o jogo fechado, o caso não foi medido nesta rodada.
- Os relatórios de pesquisa em `reference/fase2/relatorios/` ainda citam a Steam, "ARRASTE PARA VER" e as classes antigas da abertura. São registro da pesquisa e não são servidos.
- **Os tempos da rodada final foram medidos com jogo aberto.** Os números de PC parado na tabela da abertura são da rodada anterior, com a abertura antiga.
- O destino do X foi conferido uma vez, pelo endereço e pelo título da página. O X pode pedir login a quem abre sem conta.
- A Vercel pode manter por até 1 dia a versão antiga de `sem-sinal-*.webp` no cache de imagens depois do próximo deploy.

### Limites conhecidos desta rodada

- O cursor é um elemento da página: num travamento da thread principal, ele para junto. Nenhum movimento dele lê layout, e o laço de quadros dorme quando o anel alcança o ponto.
- No Firefox a barra de rolagem nativa continua na lista de filmes do menu, porque o seletor usado é o do WebKit.
- As leituras não andam sozinhas em janelas mais largas que o ciclo, cerca de 2.720 px, porque todos os cartões já estão à vista. Seguem manuais.
- As leituras pausam sozinhas, mas não têm botão visível de pausa. O critério 2.2.2 da WCAG não foi avaliado.
- Entrar direto numa sessão e voltar pelo logo ainda pausa mais que o caminho pela home, de 378 a 545 ms na maior pausa, porque a home monta do zero.
- Com o foco dentro do player, chegando por Tab, o Escape não chega ao site e o diálogo fica aberto: uma página não recebe teclas de um iframe de outra origem. Sai-se com Shift+Tab até o X, e os atalhos do YouTube continuam valendo.

### Herdado da estrutura original, sem alteração

- Com roda de mouse física, cada entalhe soma 0,06 de filme e o `update()` puxa 10% de volta por quadro: a roda mexe o rolo e não troca de filme. Trackpad, arrasto, setas e toque trocam.
- Escape só fecha o trailer e limpa o filtro; não fecha os menus nem o tutorial.
- No celular, o gesto que começa em cima do slider de leituras não rola a página, porque o bundle segura o `touchstart`. Rola pela margem.
- Entre 480 e 767 px de largura, a página inteira fica coberta por "Gire o aparelho para ver melhor". Isso pega celular deitado e tablet pequeno em pé.
- Os ouvintes de `resize` e de toque da Programação também ficam depois de sair da página. Nenhum efeito visto.
- `user-select:none` vem do CSS original e cobre quase todo o texto. O novo cursor não impede a seleção, porque ela já não existia nesses blocos.
- Com a home parada, a thread principal fica ocupada de 160 a 320 ms por segundo, no WebGL e nos tickers do bundle. Era assim antes e não entrou nesta rodada.

Do ícone do trailer, sem alteração: o clique com o botão do meio abre a aba e não fecha o diálogo. O nome acessível diz o filme e que abre outra aba.

## 8. Decisões que dependem do proprietário

- Aprovar os textos legais, que não são aconselhamento jurídico, e conferir os termos de uso do TMDB, de onde vêm as imagens.
- Publicar o `app.js`, o CSS e os áudios originais da estrutura: nenhuma licença foi encontrada nos arquivos.
- Imagens com símbolos nazistas em `truth-treachery-2026` e `inglourious-basterds-2009`.
- Título "Verdade e Traição", como publicado, contra "Verdade & Traição", o oficial no Diário Oficial; títulos em inglês mantidos (`The Long Walk`, `The Running Man`, `The Menu`).
- Classificações sem registro oficial encontrado: oito filmes antigos seguem o TMDB, e `what-you-wish-for-2023` só tem uma listagem.
- As leituras são de fontes secundárias: nenhum filme foi assistido por quem escreveu. Detalhes só de memória estão em `reference/fase2/relatorios/` e no registro da revisão.

