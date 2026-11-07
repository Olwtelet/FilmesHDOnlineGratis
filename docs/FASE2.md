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
| Abertura | "O sinal encontra o cinema", sem vídeo e sem o símbolo, em quatro tempos. Expectativa: preto e, aos 0,7 s, um traço fino de sincronismo que cresce do centro, na altura do nome. Formação: a 1,15 s a carta SMPTE chega em seis faixas fora de fase, cada uma deslocada de lado, que se acertam em duas correções de horizontal; a luz só sobe, sem piscar. Captura: aos 3,15 s a carta formada se comprime no traço e, quando chega nele, aos 3,55 s, o nome abre do traço, recortado nas cores das barras, e trava de lado; aos 4 s as cores escorrem para o branco sobre preto. Repouso: o nome fica parado desde 4,5 s e o ENTER vem 5,8 s depois do primeiro quadro da abertura, cerca de 6 s depois da navegação. Ao apertar ENTRAR com o botão principal, o nome se comprime de volta numa linha enquanto a camada some; se o aperto não vira clique, o nome volta. Com movimento reduzido: preto, o nome branco aparecendo aos 0,75 s e o ENTER aos 3,5 s. A faixa do topo acende com as primeiras faixas da carta, por uma cópia dentro da abertura; a da página só aparece depois do ENTER, porque corre noutro relógio. Sem aperto de letras nem kerning, porque com eles o R e o Á de GRÁTIS se tocavam. Um `<video>` vazio fica porque o `app.js` exige | Pedido do proprietário: uma assinatura memorável, com expectativa, formação, um momento de captura e um repouso, cerca de 6 s até o ENTER. O timer do ENTER no `app.js`, por `tools/patch-bundle.mjs`, conta 5,8 s a partir do primeiro quadro da abertura (o início das animações do nome), e nunca menos de 3,5 s depois de o `app.js` rodar, como no original: com o `app.js` atrasado, a abertura já acabou e não sobra espera morta. Com movimento reduzido continua 3,5 s. O ENTER de reserva de `local-preloader.js` usa 5,8 s só quando a abertura toca, e 3,5 s com movimento reduzido ou na volta dentro da hora. Só `transform`, `translate`, `scale` e `opacity`, no compositor, e nada roda depois de 4,5 s; cada faixa da carta é uma camada só do tamanho dela. O nome usa a mesma Archivo numa face com `font-display: block`; se ela ainda não chegou quando o nome começa a abrir, o script do `<head>` da home fixa a fonte de reserva para a abertura inteira, e o nome nunca troca de fonte com o ENTER na tela. Um estilo crítico no `<head>` pinta `html` e `body` de preto e esconde o nome até o tema chegar; se o tema não chegar, o nome aparece sozinho aos 4,5 s, só a cópia branca |
| Tutorial | `<video preload="none">` com gravação da home real em WebM e MP4, feita por `npm run tutorial` com a home servida em 4322. Regravar se a home mudar de aparência. Regravado na rodada do cursor, porque mostrava o anel antigo, e de novo em 06/11/2026, quando a home deixou de abrir no aviso "Sem sinal" e passou a destacar Laranja Mecânica: o rolo tem outra ordem e outros vizinhos. A gravação continua parando em O Mistério de Silver Lake, sessão já exibida, para nenhum rótulo envelhecer | O arquivo antigo era uma gravação do site da Siena. Nada do vídeo é pedido antes do `play()`, 2 s depois do ENTER, nem abaixo de 992 px. Mestre e roteiro ficam em `reference/fase2/tutorial/` |
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
| Home, sobrancelha | Estado e data: `PRÓXIMA SESSÃO · 14/11 20:30` | Calculado no navegador, também visível no celular |
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

25 sessões, 26 filmes. A sessão dupla é uma página com dois trailers: 19:30 e 21:30. Em 06/11/2026 entraram quatro sessões de sábado às 20:30 (linhas 22 a 25), e a home deixou de abrir no aviso: destaca Laranja Mecânica e avança sozinha à meia-noite de São Paulo depois de cada sessão, para Eles Vivem em 15/11, Entrevista com o Demônio em 22/11 e Rocky: Um Lutador em 06/12. Não há sessão em 07/11 nem em 28/11; nesses sábados segue em destaque a próxima. A partir de 13/12/2026 às 00:00, se nenhuma outra for cadastrada, a home volta ao aviso "Sem sinal".

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
| 22 | 14/11/2026 sáb | 20:30 | Laranja Mecânica (1971) | Stanley Kubrick | 136 | sem registro | `a-clockwork-orange-1971` |
| 23 | 21/11/2026 sáb | 20:30 | Eles Vivem (1988) | John Carpenter | 94 | sem registro | `they-live-1988` |
| 24 | 05/12/2026 sáb | 20:30 | Entrevista com o Demônio (2023) | Cameron Cairnes & Colin Cairnes | 93 | 16 | `late-night-with-the-devil-2023` |
| 25 | 12/12/2026 sáb | 20:30 | Rocky: Um Lutador (1976) | John G. Avildsen | 119 | sem registro | `rocky-1976` |

Exceções ao sábado às 20:30: `the-menu-2022` (terça), `obsession-2026` e `what-you-wish-for-2023` (quinta), `ready-or-not-double-feature-2026` (19:30). Nenhuma sessão tem fim explícito publicado, então todas valem até a meia-noite de São Paulo.

**Sessões de novembro e dezembro de 2026.** Fatos, créditos, imagens e trailers com as fontes de cada um estão em `reference/fase2/relatorios/sessoes-2026-11.md`, e os dados da pesquisa, com todas as URLs, em `reference/fase2/relatorios/sessoes-2026-11/`. Cada ficha teve duas checagens independentes. Decisões desta entrada:

- **Ano de Entrevista com o Demônio: 2023.** O filme estreou no SXSW em 10/03/2023 e foi lançado nos cinemas em 2024 (EUA em 22/03, Brasil em 04/07, pela Diamond Films). O catálogo mostra o ano da primeira exibição pública, como em V de Vingança (2005, lançado em 2006), Obsessão (2025, lançado em 2026) e Aquilo que Você Deseja (2023, lançado em 2024). A portaria brasileira de classificação também registra 2023. O TMDB mostra 2024, pela data comercial. Nos outros três o ano não muda por nenhum critério: 1971, 1988 e 1976.
- **Classificação indicativa só com registro oficial.** Entrevista com o Demônio é 16, pela Portaria CPCIND/SENAJUS/MJSP nº 1.096/2024 (DOU de 05/06/2024). Para Eles Vivem e Rocky a busca no DOU não achou portaria, e o mesmo método achou as de títulos de controle (The Running Man, Vivarium, Eu Sou Rocky). A de Eles Vivem rodou só na pesquisa, porque na verificação o in.gov.br recusou a conexão, e a busca não alcança 1989, ano do lançamento no Brasil, quando a classificação ainda vinha da censura federal. Para Laranja Mecânica a busca no DOU não chegou a rodar: o in.gov.br recusou a conexão na pesquisa e na verificação. A consulta pública do ClassInd só funciona em navegador com login e não foi feita. Nos três o campo ficou vazio, e a página não mostra classificação. Os indícios encontrados (TMDB, lojas, cineclubes) se dividem e não foram publicados. As oito fichas antigas que seguem o TMDB continuam como estavam.
- **Créditos com nome que não é o da tela.** A música de Laranja Mecânica sai como Wendy Carlos, nome atual, e o crédito de 1971 é Walter Carlos. O roteiro de Eles Vivem sai como "John Carpenter (como Frank Armitage)", o pseudônimo da tela. Em Entrevista com o Demônio a menina é só "Lilly", como o filme a chama; o sobrenome D'Abo das bases não é dito em cena. Em Rocky, Adrian, Paulie e Mickey saem sem os sobrenomes, que o filme não diz. O promotor sai só como Jergens, como no crédito da tela, porque o filme lhe dá dois primeiros nomes, George e Miles.
- **Imagens.** Nada com nudez, violência sexual ou o final. Sangue, só um fio no lábio de Nada na briga do beco de Eles Vivem (cena 14), que quase não se vê a 960 px; a troca sem sangue está anotada no relatório. Em Laranja Mecânica, nada do bar Korova nem a arte do triângulo, que tem uma figura nua. O hero de Laranja Mecânica é o close de Alex, de fundo escuro: com o túnel dos quatro drugues, a primeira escolha, o rótulo da sessão e o título caíam sobre a luz branca no cartão da home no celular, e o rótulo sumia. O túnel ficou no painel da direção. Entrevista com o Demônio tem só 6 cenas aproveitáveis sem letreiro no TMDB. Das outras 8 sem letreiro, 5 são arte promocional, uma é montagem e duas são o mesmo grito de Jack, de contexto não confirmado. A galeria leva as 6 e 3 recortes delas, e o site repete até 14. O cartaz de Rocky é a capa do DVD brasileiro de 25 anos, com "ROCKY" e, abaixo, "UM LUTADOR"; o cartaz principal em português do TMDB mostra o abraço do final.
- **Trailers** de canal oficial: Warner Bros. Entertainment (Laranja Mecânica, trailer do lançamento em 4K, em inglês), Shout! Studios (Eles Vivem, trailer da edição de colecionador, em inglês), Diamond Films Brasil (Entrevista com o Demônio, legendado) e Amazon MGM Studios (Rocky, em inglês). Nenhum trailer brasileiro oficial foi achado para os três mais antigos.

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

### Sessões de novembro e dezembro de 2026, 06 e 07/11/2026

Build final com as 25 sessões, servido em 4322, no Edge sem janela, salvo indicação. Onde a tabela diz "dois builds", o build do commit anterior (`09d6d49`, 21 sessões, tutorial anterior) foi servido em 4323, e os dois rodaram alternados. O PC teve processos de jogo abertos a bateria toda: cerca de 200 nas etapas 3 e 4 e nas duas cadeias do começo da 5, e 5 daí em diante. Nas duas primeiras etapas o registro só diz se havia jogo, e a suíte de interações começou sem nenhum. O log dos trailers para às 18:55 de 06/11, na parte do teclado; o Windows registra o boot às 00:02 de 07/11, e a bateria foi retomada às 00:36 pelas partes que faltavam. As suítes rodaram uma de cada vez. Parte delas rodou presa a 4 núcleos e em prioridade baixa, para não disputar a máquina; isso pesou nas leituras, como mostra o parágrafo delas, abaixo.

| Verificação | Resultado | Observação |
|---|---|---|
| `tools/testes/varredura.mjs` | Nenhum achado | |
| `tools/checar-textos.mjs` | 25 sessões dentro dos limites | |
| `tools/testes/ordem.mjs` | 80 de 80 | Relógio controlado em America/Sao_Paulo. Laranja Mecânica em destaque de 01/11 a 14/11 às 23:59, inclusive no sábado 07/11, sem sessão. Eles Vivem a partir de 15/11. Entrevista com o Demônio a partir de 22/11, inclusive no sábado 28/11, sem sessão. Rocky a partir de 06/12. O aviso "Sem sinal" a partir de 13/12 às 00:00 e ainda em 01/03/2027. Também a ordem completa das 25 em 13/12, o término explícito na última sessão e numa do meio, a home aberta e ociosa que recarrega em cada virada e destaca a seguinte, e a abertura na tela, que não recarrega |
| `tools/testes/trailers.mjs` | Antes do reinício, 504 aprovações e 2 falhas, repetidas: 15 de 15. Depois, 59 aprovações e 98 de 98 | As 2 falhas eram em fechar: o YouTube não começou a tocar em 60 s. Depois do reinício, teclado, controles e celular deitado rodaram, e a suíte caiu no começo da geometria. Geometria, saída e, nas 25 sessões, o link externo abrindo o mesmo trailer do player rodaram na etapa 3 e deram 98 de 98 |
| `tools/testes/paginas.mjs` | 4.233 de 4.234, mais o despejo sem falha | Marca, dados e links: 536. Matriz: 1.980, com as páginas fixas nos 8 tamanhos, as 25 sessões a 1440 e a 390 px e 3 sessões nos outros 6. Títulos: 1.290, com os instantes de 06/11 e do aviso. Menus: 427 de 428, com o aviso no lugar da próxima sessão. A falha foi o toque no menu da Programação a 320 px, sem resposta em 10 s; repetido a 320 e 360 px, deu 10 de 10, duas vezes em cada build. O despejo de textos rodou com sessão futura e com o aviso. Três vezes o Edge não abriu a tempo e derrubou a suíte, duas delas depois de a Programação não responder em 300 s; o que faltava rodou em blocos, e ali a Programação abriu em todos os tamanhos. A única reprovação dos blocos foi o toque no menu dela a 320 px, descrito acima |
| `tools/testes/interacoes.mjs` | 498 de 499. A cadeia repetida com a leitura antiga deu 41 de 42; com a leitura nova, 42 de 42 quatro vezes, e o mouse, 74 de 74 | As duas falhas eram do teste, com o carrossel lido nos itens 24 e 10; ver abaixo |
| `tools/testes/identidade.mjs` | 253 de 254 | A falha foi nas leituras, ver abaixo |
| `tools/testes/abertura.mjs` | Dois builds: anterior 46 de 48, novo 48 de 48 | Antes, com o build novo: 46 de 48 e 43 de 48. As falhas foram tempos fora da faixa. Na primeira rodada, a mediana do ENTER ficou cerca de 70 ms acima dos 5.800 ms, a mesma diferença da máquina da tabela do ENTER abaixo; nas outras, houve visitas lentas, com um ENTER a 16 s da navegação. Houve ainda uma visita com 303 ms de preto, abaixo dos 400 pedidos, e uma com o nome parado 18 ms menos que o 1 s pedido antes do ENTER. O código da abertura não mudou |
| `tools/testes/janela-real.mjs`, **Chrome e Brave reais** | Dois builds, duas vezes: anterior 124 de 125 e 125 de 125, novo 123 de 125 e 125 de 125 | Antes, com o build novo: 121 de 125 com o tutorial anterior e 115 de 120 com o novo. As falhas foram o tutorial parando em buffering, quase sempre por falta de quadros decodificados (7 de 8; a outra, por falta de dados), nos dois vídeos e nos dois builds: 5 com o vídeo anterior e 3 com o novo; o nome parado menos de 1 s antes do ENTER, duas vezes, por 104 e 125 ms; um trailer que não carregou no Chrome; e um primeiro quadro já com luz no Brave |
| Páginas das quatro sessões | Vistas uma a uma | Capturas a 1440 e a 390 px: nome, data, hora e estado certos, e o ano e a duração no ingresso: 1971 e 136 min, 1988 e 94, 2023 e 93, 1976 e 119 |

**O ENTER não mudou.** Mediana de 8 visitas, no Edge sem janela, em ms desde o início da abertura, alternando os dois builds três vezes. A referência de 05/11, nesta máquina, era 5.807. A diferença, de 30 a 67 ms, aparece nos dois builds e, por isso, é atribuída à máquina.

| Build | ENTER, visita limpa | ENTER, com cache | Home depois do clique, limpa e com cache |
|---|---:|---:|---:|
| Anterior, 1ª | 5.874 | 5.873 | 1.697 e 1.695 |
| Novo, 1ª | 5.837 | 5.861 | 1.696 e 1.698 |
| Anterior, 2ª | 5.858 | 5.864 | 1.697 e 1.698 |
| Novo, 2ª | 5.864 | 5.861 | 1.697 e 1.701 |
| Anterior, 3ª | 5.862 | 5.866 | 1.693 e 1.689 |
| Novo, 3ª | 5.858 | 5.860 | 1.696 e 1.698 |

**Tutorial.** Regravado em 06/11, depois que a home passou a abrir em Laranja Mecânica. O build servido nas duas primeiras etapas era de antes da gravação, e isso só apareceu em 07/11 às 02:34. Refeito o build, só os três arquivos do tutorial mudaram. A janela real da segunda etapa rodou com o vídeo anterior. As seguintes rodaram com o novo no build novo, e o build anterior, em 4323, seguiu com o vídeo anterior.

**Carrossel da Programação: a falha era do teste.** Na primeira visita à Programação a partir da home, o teste leu o carrossel nos itens 24 e 10, e não no 0. Uma sonda acompanhou essa visita oito vezes, quatro em cada build. Nas oito, a página ficou visível no item 0 e terminou parada no item 0. Em quatro, três no build anterior e uma no novo, a sonda viu o giro depois de a página ficar visível, de 7 a 8 s depois do clique; nas outras, o item 0 ficou parado até ela encerrar. Pelo código do original, o giro de entrada só começa quando o WebGL da página termina de carregar, e percorre cerca de 100 itens até voltar ao 0. Com o PC carregado, ele começava depois da leitura do teste, que pegava o meio do caminho. O teste agora espera o canvas mostrar imagem e lê o carrossel só depois de 12 s sem movimento. A mesma leitura vale para a ida da home sem sessão à Programação pelo EXPLORAR.

**Leituras.** Presas a 4 núcleos e em prioridade baixa, as leituras reprovaram nos dois builds, em checagens diferentes a cada rodada. As mais frequentes foram o cartão que salta no ciclo, a espera depois de soltar e a espera depois da seta. O anterior reprovou 1 de 4 rodadas, e o novo, 5 de 6. Para separar a página do teste, uma sonda mediu dentro da página, quadro a quadro, por 25 s, três vezes em cada build. Os dois andaram lisos, com no máximo 1,9 px por quadro e nenhuma tarefa longa. Com prioridade normal e todos os núcleos, deu 52 de 52 duas vezes em cada build, com os mesmos 5 processos de jogo das últimas quatro rodadas presas, que reprovaram nos dois builds. A diferença entre os builds na condição presa não foi explicada; a página de sessão nova tem 12% mais HTML, dos quatro filmes nas listas do menu.

**Mudanças nos testes.** `ordem.mjs` ganhou as viradas das quatro sessões. `paginas.mjs` ganhou os instantes de 06/11 e do aviso. O estado sem sessão das Páginas, que usava a hora do PC e tinha deixado de cair no aviso, agora usa um relógio fixo, calculado dos dados, dois dias depois da última sessão. Os menus também são vistos nesse estado. `trailers.mjs` confere o link externo de cada sessão. `interacoes.mjs` lê o carrossel depois do giro de entrada. Os três testes que calculam o fim do catálogo contam também um fim explícito, se houver.

**Revisão.** Uma revisão independente, com cada achado verificado por outro revisor, deu 12 achados, e 6 se confirmaram e foram corrigidos. São eles: o estado sem sessão das Páginas, que tinha deixado de ser testado; a busca no DOU de Laranja Mecânica, dada como feita sem ter rodado; os números das portarias de Entrevista com o Demônio no relatório; o registro do cartaz de Rocky e a numeração de uma cena; o README, que ainda falava em 22 trailers; e esta seção, que os relatórios citavam antes de existir. Uma segunda revisão leu as duas correções de teste, achou as duas certas e sugeriu quatro reforços, todos aplicados e rodados. Uma terceira conferiu os números desta seção contra os logs e a coerência dos documentos. Levou a corrigir contagens e descrições desta seção; notas de trabalho e trechos superados pelas trocas de imagem no relatório das sessões; o sangue na briga de Eles Vivem, antes negado; o título no cartaz e o nome de Jergens em Rocky; o alcance da busca no DOU de Eles Vivem; um exemplo de data no topo deste arquivo; e o ENTER de reserva no README.

**O que não foi verificado nesta parte.** Safari, Firefox, aparelhos reais e a publicação na Vercel. Nenhuma medida com o PC sem carga. Os trailers tocaram a partir deste PC, no Brasil; fora do Brasil não foi testado.

### Abertura "o sinal encontra o cinema", 05/11/2026

Build final, com jogo aberto no PC. O ritmo foi ajustado olhando sequências de quadros reais: a carta parada por meio segundo antes da captura, o nome abrindo só quando a carta chega ao traço, e o preto do começo mais longo, para criar expectativa. A ordem é conferida pelo tempo das próprias animações e pelos pixels dos primeiros quadros.

| Verificação | Resultado | Observação |
|---|---|---|
| `abertura.mjs`, Edge sem janela | 46 de 48, e os tempos repetidos com a checagem nova da home: 8 de 8 | ENTER 5.807 ms depois do início da abertura (5.802 a 5.814) e 5.946 a 5.965 ms depois da navegação; home de 1.653 a 1.670 ms depois do clique. As duas reprovações eram a home mais rápida que a referência da Siena: essa checagem agora reprova só a mais lenta. Preto de 525 a 710 ms; nome parado de 1,30 a 1,52 s antes do ENTER, em todas as 16 visitas. Quadros a 1440 e 390 px, limpa e com cache, movimento reduzido, CSS lento, fonte lenta e muito lenta (na reserva, sem troca). Falhas de máscara, textura, `app.js`, tema e WebGL, e a volta dentro e depois da hora |
| `abertura-perfil.mjs`, Chrome sem janela | 30 visitas | O timer do ENTER atrasou no máximo 5 ms, e a preparação terminou pelo menos 5,1 s antes dele |
| `janela-real.mjs`, **Chrome e Brave reais** | 115 de 115 | Desktop a 1440 e 1536 px, limpa e com cache, com ENTRAR, home, tutorial e trailer. 2 de 16 visitas de fora, em rajada, com a janela sem desenhar |
| `janela-real.mjs --modo=celular` | 64 de 65 | A reprovação é só a regra de no máximo 1 em 4 visitas com a janela sem desenhar: 4 de 12, em rajada. Alternando a abertura anterior (`a55fb94`) e a nova em 40 navegadores com o mesmo celular emulado, deu 3 de 20 na anterior e 2 de 20 na nova, todos na mesma rajada: não vem da abertura |
| `janela-real.mjs --modo=calmo` | 85 de 85 | Movimento reduzido: preto, o nome branco aos 0,75 s e o ENTER aos 3,5 s. 2 de 12 de fora, em rajada |
| `identidade.mjs`, parte abertura | 41 de 41 | Cinco larguras: nome inteiro, 21 formas separadas, longe do ENTRAR; a captura do meio sai no instante do recorte, pelo relógio da própria animação |
| Saída pelo ENTRAR | Conferida | O nome se comprime numa linha a partir do aperto; soltando fora, ele volta; o botão direito não faz nada |

**Revisão.** Seis achados, todos corrigidos antes do commit: o gesto de saída que deixava o nome achatado quando o aperto não virava clique; o timer do ENTER contado do `app.js`, que com rede lenta viraria espera morta (agora conta do primeiro quadro da abertura, com o mínimo original de 3,5 s); o ENTER de reserva a 5,8 s na volta dentro da hora, sem abertura; o nome que saltaria à vista num ENTRAR apertado antes de ele abrir; o preto de 0,5 s com movimento reduzido, curto demais para a margem; e a captura do recorte tirada pelo relógio da carga, e não pelo da animação.

**Capturas.** O vídeo do ritmo completo, com a saída e a chegada à home, está em `reference/fase2/capturas/abertura-ritmo-1280.webm` e `abertura-ritmo-390.webm`, com uma folha de quadros do vídeo. As sequências de quadros reais do Chrome, do Brave, do celular, com cache e com movimento reduzido também estão lá.

**O que não foi verificado nesta parte.** Safari, Firefox e aparelhos reais. Rede lenta de verdade: só CSS e fonte atrasados pelo teste. A saída pelo teclado não tem o gesto antecipado, porque não há aperto antes do Enter; o nome se comprime enquanto a camada some.

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
- Classificações sem registro oficial encontrado: oito filmes antigos seguem o TMDB, e `what-you-wish-for-2023` só tem uma listagem. Laranja Mecânica, Eles Vivem e Rocky: Um Lutador ficaram sem classificação. A consulta do ClassInd pede navegador com login e não foi feita. No DOU, a busca não achou portaria de Eles Vivem nem de Rocky; a de Eles Vivem rodou só na pesquisa e não alcança 1989. A busca de Laranja Mecânica não rodou, porque o in.gov.br recusou a conexão, e falta refazê-la. Se o registro existir no ClassInd ou no DOU, basta pôr o valor em `classificacao`. Indícios encontrados, não publicados: Laranja Mecânica 16 ou 18, Eles Vivem 14 ou 16, Rocky 12.
- As leituras são de fontes secundárias: nenhum filme foi assistido por quem escreveu. Detalhes só de memória estão em `reference/fase2/relatorios/` e no registro da revisão.

