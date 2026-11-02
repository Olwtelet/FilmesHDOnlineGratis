# Siena Film Foundation: réplica local

Réplica visual e funcional de https://www.siena.film/ (todas as páginas e tamanhos de tela), feita em **Astro 7** com os ativos, CSS e scripts originais do site, servidos localmente. O proprietário autorizou o uso de todos os ativos públicos do site.

A referência foi o site ao vivo inspecionado em 29/10/2026 (publicação Webflow "Last Published: Sun Mar 09 2025 10:50:13 GMT").

**Fase 1 da transformação (31/10/2026):** a réplica agora tem o tema "Sinal", uma camada de CSS com barras SMPTE e base quase preta, inspirada no Filmes HD Online Grátis. Filmes, textos, logo, rotas, DOM e runtime continuam os da Siena. Veja a seção "Tema Sinal (Fase 1)" e [docs/TEMA.md](docs/TEMA.md). As seções de comparação com o site ao vivo descrevem a réplica sem o tema: a cor e a letra agora diferem de propósito, e as descrições de cor das rotas (como o vermelho de `/contact`) são as do original.

## Como rodar

Pré-requisitos:
- **Node.js 22.23.4 ou mais recente** (testado com Node 24.19).
- **Microsoft Edge** para as ferramentas que abrem navegador (`compare.mjs`, `scenario.mjs`, `check-keyboard.mjs`): os vídeos são MP4 H.264, que o Chromium do Playwright não reproduz. `PW_CHANNEL=chromium` usa outro navegador; `PW_SEED` muda a semente do `Math.random` (ou `PW_SEED=off` desliga).

```bash
npm install
```

```bash
npm run start
```

`npm run start` gera o build de produção (`dist/`) e o serve em **http://localhost:4322** com `tools/serve.mjs`. O servidor de desenvolvimento (`npm run dev`) fica na 4321, então os dois podem rodar juntos.

O servidor de produção e o espelho de referência usam `tools/lib/hosting.mjs`, que reproduz como a hospedagem original responde (valores medidos em www.siena.film):
- caminhos sensíveis a maiúsculas (`/WORK` dá 404), mesmo no disco do Windows;
- barra no fim dá 301 para o caminho sem barra (`/work/?a=1` → `/work?a=1`), com a mesma página de redirecionamento do original;
- `/index.html` é a home, `/index` não; o slug de filme ignora espaços em volta (`/films/savoy%20`); `..` codificado é resolvido e acima da raiz dá 400; `%` malformado e NUL dão 400;
- `/404` responde 200 e caminhos inexistentes respondem 404 com a página 404 (com `Cache-Control: max-age=43200` como no original);
- `/sitemap.xml` é o arquivo original, com `application/rss+xml; charset=utf-8`;
- cada ativo sai com o `Content-Type`, o `Cache-Control` e a compressão (gzip/br) que a origem dele envia (gravados no manifesto); páginas em gzip com `Last-Modified` e `x-frame-options`;
- `ETag`/`Last-Modified` com 304, faixas de bytes (206/416) para os vídeos, HEAD;
- arquivo travado ou `dist/` sendo regerado: 503 em vez de derrubar o servidor;
- escuta só em 127.0.0.1 e ::1 (para abrir na rede, defina a variável de ambiente `HOST=0.0.0.0` antes de `npm run preview`).

Como na CDN original, os ativos têm cache longo: depois de trocar um arquivo em `public/assets`, recarregue com Ctrl+F5.

Outros comandos:

| comando | o que faz |
|---|---|
| `npm run dev` | servidor de desenvolvimento do Astro em http://localhost:4321 |
| `npm run build` | gera `dist/` (17 páginas estáticas, ativos e `sitemap.xml`) |
| `npm run preview` | serve um `dist/` já gerado em http://localhost:4322 (`node tools/serve.mjs <porta>` para outra) |
| `npm run verify:dom` | build e comparação estrita do DOM de cada página com o HTML original (`tools/dom-diff.mjs --strict`) |
| `npm run check:site` | com o preview rodando: links e ativos (toda URL local responde 200, toda âncora `#id` tem alvo, nenhum link externo novo, nenhum bundle aponta para as CDNs originais) e o comportamento de hospedagem; `-- --url=<base>` testa outra cópia |
| `npm run check:keyboard` | com o preview rodando: compara com o site ao vivo a ordem e a posição de foco do Tab e a navegação com Enter; `-- --settle=<ms>` muda a espera antes dos Tabs (padrão 6000, depois que o menu termina de entrar) e `-- --wait=<ms>` a espera depois do Enter |
| `npm run compare -- --out=reference/captures/compare/<nome>` | comparação visual lado a lado com o site ao vivo (veja "Comparação visual") |
| `npm run assets:sync` | baixa só os ativos que faltam em `public/assets` e regenera `assets-manifest.json`, `reference/localized/` e `public/assets/{css,js}` a partir de `reference/original/` (que nunca é baixado de novo); `-- --refresh-headers` mede de novo os cabeçalhos de cada origem |
| `npm run assets:report` | regenera `ASSETS.md` a partir do manifesto e confere os arquivos em disco |
| `npm run reference:serve` | serve o HTML original já localizado em http://localhost:4400 (espelho de referência, mesma hospedagem) |
| `node tools/theme-snapshot.mjs --label=<nome>` | com o preview rodando: captura os cenários e a geometria de cada elemento; `--no-theme` bloqueia o tema, para servir de controle |
| `node tools/theme-diff.mjs --a=<nome> --b=<nome>` | compara duas capturas: estrutura, layout, visibilidade, tamanho da página e estados do runtime |
| `node tools/theme-sheet.mjs --a=<nome> --b=<nome> --item=<cenário/viewport/estado> --out=<png>` | monta folhas de antes e depois |
| `node tools/theme-textwrap.mjs` | compara o número de linhas de cada texto, com e sem o tema |

No Git Bash, rotas passadas como argumento (`--routes=/work`) precisam de `MSYS_NO_PATHCONV=1` antes do comando.

## Arquitetura

O comportamento do site original fica no bundle `app.js`: GSAP com SplitText, Flip e ScrollTrigger, Lenis para a rolagem, Taxi.js para as transições de página, Howler para os sons e WebGL próprio para os cards de filme. Esse bundle é guiado por classes e atributos `data-*` do HTML do Webflow. Para ficar fiel no visual e no movimento, a réplica:

1. **Reaproveita o runtime original:** `app.js`, `main.css`, `out.css`, `webflow.css`, jQuery e os chunks Webflow, todos copiados para `public/assets/` com as URLs reescritas para caminhos locais.
2. **Gera o DOM original** com componentes Astro e dados tipados. A verificação `npm run verify:dom` compara as 17 páginas geradas com `reference/localized/` (o HTML original com as URLs dos ativos trocadas por caminhos locais e sem o Google Analytics), nó a nó: tags, atributos, ordem das classes, textos, comentários e espaços nas bordas dos elementos. Ela normaliza a ordem dos atributos e colapsa sequências de espaços, e ignora os elementos acrescentados pela réplica, marcados com `data-local-replica`: o `<script>` do formulário nas 17 páginas e, só na home, o `<style>` e o `<script>` da inicialização.

Estrutura:

```
src/
  layouts/BaseLayout.astro      <head> do Webflow, aviso de rotação, wrapper do Taxi, canvas WebGL, scripts
  components/
    Nav.astro, nav/*            navegação "ingresso": menu rápido de filmes, menu geral, painéis
    Footer.astro, footer/*      rodapé nas variantes base / on-black / 404
    ui/*                        ExploreButton, DownArrowButton, CursorBox, LogoSquare, máscaras de filme (ui/svg),
                                caminhos SVG compartilhados (svg-paths.ts), wfLink (w--current)
    home/*  work/*  about/*  contact/*  legal/*  case/*   seções de cada página
  data/                         textos, imagens e CMS (films.ts, home-roll.ts, work.ts, about.ts, legal.ts, case-studies/*.json…)
  pages/                        index, work, about, contact, cookies, terms, privacy, 404, films/[slug]
public/assets/                  css, js, fontes, vídeos, áudios e imagens (locais)
public/sitemap.xml              sitemap original
tools/                          sincronização de ativos, importadores de dados, servidores, verificações e comparação visual
  lib/hosting.mjs               emulação da hospedagem original (usada por serve.mjs e serve-reference.mjs)
  scenarios/*.mjs               cenários da comparação visual
docs/                           inventário do site original (INVENTORY.md + uma ficha por página)
reference/original/             HTML, bundles e sitemap originais, como baixados (verdade de referência)
reference/localized/            o mesmo HTML com as URLs dos ativos trocadas por caminhos locais
```

Os arquivos em `src/data` foram extraídos do HTML original pelos importadores `tools/import-*.mjs` e podem ser editados à mão. Nada em `src/` lê `reference/` em tempo de execução.

## Rotas concluídas (17)

| rota | página |
|---|---|
| `/` | home cinematográfica: preloader, tutorial de navegação, rolo de filmes em WebGL com arrastar, roda do mouse, teclado e toque, críticas, prêmios e EXPLORE |
| `/work` | carrossel horizontal com os vizinhos parcialmente visíveis, alternância Footage/Poster, régua de rolagem |
| `/about` | composição preta, arcos, "Film Production House", tipografia cinética, grade de 36 imagens, equipe, serviços, colaboradores, CTA "Our Films", rodapé |
| `/contact` | vermelho intenso, "Craft the Next Act", linhas horizontais, contatos |
| `/cookies`, `/terms`, `/privacy` | páginas legais (texto rico e rodapé on-black) |
| `/404` | 4-0-4 animado e GO BACK |
| `/films/savoy`, `/films/moon-in-the-12th-house`, `/films/taboo`, `/films/kafkas-last-trial`, `/films/my-project-x`, `/films/ana-maxim`, `/films/outsider-freud`, `/films/by-any-means`, `/films/thehousewife` | estudos de caso: hero, trailer com controles, créditos, galeria, críticas, festivais, investidores, próximo filme, newsletter, rodapé |

Em todas as páginas, exceto `/404` (que no original não tem navegação nem aviso de rotação), aparecem o aviso "Rotate your device" (celular deitado, 480–767 px), as transições de página, os menus, os sons e o cursor personalizado. Além das páginas, `/sitemap.xml` é servido como no original.

O que muda entre os nove filmes, como seções ocultas, listas vazias, trailers sem vídeo e anos divergentes, está em [docs/INVENTORY.md §c](docs/INVENTORY.md) e é reproduzido como no original.

## Inventário de ativos

- [`ASSETS.md`](ASSETS.md) lista cada ativo com o caminho local, a URL de origem, o filme dono, as páginas que o usam, o tamanho, os cabeçalhos da origem e a verificação.
- [`assets-manifest.json`](assets-manifest.json) tem os mesmos dados em formato legível por máquina.
- São **368 ativos, 134 MB**, todos no disco:

  | tipo | quantidade |
  |---|---|
  | imagens | 343 |
  | vídeos | 10 |
  | sons | 4 |
  | fontes | 3 |
  | CSS | 3 |
  | JS | 5 |

- Pastas: `public/assets/img/films/<slug>` para imagens de um só filme, `img/films/_shared`, `img/cms`, `img/site`, `img/webflow` (arquivos do próprio Webflow), além de `video/`, `audio/`, `fonts/`, `css/` e `js/`.
- Nenhum ativo foi substituído por imagem parecida, gerada ou placeholder. Casos especiais:
  - `img/webflow/placeholder.60f9b1840c.svg`: a URL original responde 403. É o placeholder do próprio Webflow (imagem vazia do CMS, oculta por `.w-dyn-bind-empty`), e o arquivo idêntico foi baixado da outra CDN do Webflow (anotado no manifesto).
  - A máscara WebGL `all-masks.webp`: o `app.js` original a carrega da CDN do Webflow. Ela agora é local. Sem ela, a home e o `/work` ficam sem imagens.
  - As duas imagens do selo "Made in Webflow" citadas em `webflow.schunk.js` também são locais (o Webflow só as injeta em domínios `*.webflow.io`).
- Continuam remotos só dois itens que não são arquivos: a dica `preconnect` no `<head>` e o `src` de vídeo de `/films/by-any-means`, que no original aponta para uma página do YouTube (o trailer não toca, como no original).

## Comparação visual

`npm run compare -- --out=reference/captures/compare/<nome>` abre o site ao vivo (A, padrão `https://www.siena.film`) e a réplica (B, padrão `http://localhost:4322`) no Edge, lado a lado, e roda os mesmos cenários nos dois.

- Opções: `--a=<url>`, `--b=<url>`, `--only=<trecho>[,<trecho>]` (cenários cujo nome contém o trecho), `--viewports=1440x900,1920x1080,390x844` (padrão de cada cenário), `--threshold=0.1` (sensibilidade de cor do pixelmatch).
- Cenários em `tools/scenarios/`: `00-smoke` (todas as rotas), `10-home` (preloader, tutorial, rolo, EXPLORE), `20-nav` (menus, transições), `30-work` (carrossel, Footage/Poster), `40-pages` (about, contact, legais, 404, aviso de rotação), `50-films` (os nove estudos de caso e o player), `60-interactions-desktop` (críticas, galeria, cursor, histórico do navegador, cadeias de navegação), `61-interactions-touch` (menu e navegação por toque, giro de tela) e `62-motion` (quadros do preloader, tutorial, inércia do rolo e arrasto, a cada 0,1–0,25 s).
- Determinismo: relógio falso pausado (timers, rAF, `Date` e `performance.now` só andam quando o cenário manda; o valor inicial não é controlado, ver "O desvio de `work-roll` a 390×844"), `Math.random` com semente por ponto de chamada, entrada sincronizada, `app.js` só roda depois das fontes, cookies do preloader e do tutorial definidos quando o cenário pede. Celular usa user-agent Android, porque o `app.js` decide "mobile" pelo user-agent.
- Saída em `<out>/report.md` (e `report.json`): uma linha por estado, com o **diff %** (porcentagem de pixels diferentes acima do limiar). As imagens lado a lado A | B e a máscara de diferença ficam em `<out>/sbs/` só para os estados que diferem; as capturas brutas, em `<out>/a` e `<out>/b`. O relatório também lista os problemas de console de cada lado.
- Para separar efeito de ambiente de defeito da réplica: rode `npm run reference:serve` e compare com `--a=http://localhost:4400` (o HTML original servido localmente pela mesma hospedagem), ou rode o site ao vivo contra ele mesmo.

## Integrações ausentes

- **Newsletter ("Stay up to date")**: no original, o envio vai para o Webflow Forms (`https://webflow.com/api/v1/form/6728a72e769070a603d43c13`), que só funciona no site publicado no Webflow. Na réplica, `public/assets/js/local-forms.js` intercepta o envio. Nenhum dado sai da máquina, e o próprio bloco de erro do formulário mostra: "Newsletter not connected in this local replica: the original form is delivered by Webflow Forms, which only works on the published Webflow site." **Não há sucesso simulado.** Para ligar um serviço real, implemente `submitNewsletter()` nesse arquivo: ela deve devolver uma promessa que só resolve quando o serviço aceitar o e-mail; aí o formulário mostra o estado de sucesso do próprio Webflow (`.w-form-done`).
- **Google Analytics** (`G-5SFTWJHZ12`) foi removido, para a réplica não enviar visitas à propriedade do site real.

## Tema Sinal (Fase 1)

Tokens, tratamentos e como desligar ou voltar estão em [docs/TEMA.md](docs/TEMA.md). O tema é uma camada de CSS (`public/assets/css/tema-sinal.css`) e duas fontes em `public/assets/fonts/tema/`. `app.js`, `webflow.css` e `main.css` não mudaram, e o DOM só ganhou três tags marcadas com `data-local-replica`.

**Como a preservação foi verificada, no build final de 31/10:**

| Verificação | Resultado |
|---|---|
| `npx astro build` | 17 páginas |
| `tools/dom-diff.mjs --strict` | 17 de 17 com "DOM identical" ao original, ignorando as tags marcadas |
| `npm run check:site` | 388 de 388 URLs locais respondem; âncoras e hospedagem corretas |
| Quebra de texto (`tools/theme-textwrap.mjs`) | 8.407 textos em 17 rotas e 3 tamanhos; 15 mudam de número de linhas |
| Teclado, 6 rotas, 20 paradas de Tab, contra o espelho original | mesma ordem e mesma altura; só muda a largura do que é texto |
| Chrome e Brave reais, sem outro programa sobre a janela | 47 de 47 visitas chegaram à home; 0 paradas e 0 retomadas de vídeo |
| Chrome a 1536 px, janela visível, com e sem tema | 18 de 18 visitas chegaram à home; 0 paradas e 0 retomadas de vídeo |
| Chrome e Brave reais, tela do Windows bloqueada, produção | 52 de 52 visitas chegaram à home; 0 paradas de vídeo |

**Comparação de geometria.** Os mesmos 31 cenários, em 85 execuções e 866 estados, foram capturados com o tema e com o tema bloqueado, no mesmo build. Dois controles sem tema medem a variação natural entre execuções. Relatórios em `reference/captures/tema-fase1/diff-*.md`.

| Comparação | Medidas | Layout diferente | Classes | Linhas de estado do runtime | Rotas | Erros novos |
|---|---:|---:|---:|---:|---:|---:|
| controle 1 × controle 2 | 417.234 | 1.042 (0,25%) | 0 | 0 | 0 | 0 |
| controle 1 × tema | 417.234 | 1.824 (0,44%) | 0 | 0 | 0 | 0 |
| controle 2 × tema | 417.236 | 1.673 (0,40%) | 0 | 0 | 0 | 0 |

- "Layout" conta elementos que mudaram mais de 2 px em posição vertical ou altura. A marquise de prêmios e a transição de `film-next` variam também entre os dois controles, então não são efeito do tema.
- Outras 28.479 medidas (6,83%) só mudaram largura ou posição horizontal, efeito esperado de texto com outra letra.
- As 377 mudanças de visibilidade são dois ajustes intencionais: links do rodapé de 20% para 50% (373) e o rótulo DRAG TO DISCOVER de 50% para 60% (4).
- **Altura da página:** nos três tamanhos pedidos, só `/terms` muda, em 7 px, a 1440 e a 1920. A 360 px de largura, três páginas mudam: uma com +18 px, uma página legal com +64 px e uma com −19 px.

**O que muda de número de linhas (15 de 8.407):**
- `/terms`: dois parágrafos a 1440 e dois a 1920, e dois a 390.
- `/`: a crítica "Fast-paced and engrossing" a 390.
- `/films/outsider-freud` a 390: o rótulo "Best Animation Documentary", repetido 8 vezes na marquise.

**Chrome e Brave reais, com a janela visível.** `reference/captures/home-init/validate-tema.sh`, com perfil limpo e sem as opções que desligam o rastreamento de oclusão. Cada visita espera o vídeo, clica em ENTER e confere tutorial e roda do mouse. Junto, `watch-windows.ps1` registrou a cada segundo quanto da janela de teste estava coberto, porque outros programas podem passar para a frente mesmo sem ninguém mexer no PC. A rodada completa teve 60 visitas:

| Janela durante a visita | Navegador | Visitas | Home | Vídeo até o fim | Parou no último quadro | Retomadas | Quadros ao clicar (mín./mediana) | rAF por segundo (mín./mediana) |
|---|---|---:|---:|---:|---:|---:|---:|---:|
| Sem outro programa por cima, sem uso do PC | Chrome | 15 | 15 | 13 de 13 | 0 | 0 | 240/243 | 165/168 |
| Sem outro programa por cima, sem uso do PC | Brave | 28 | 28 | 26 de 26 | 0 | 0 | 223/243 | 166/168 |
| Sem outro programa por cima, com mouse ou teclado em uso | Brave | 1 | 1 | 1 | 0 | 0 | 243 | 173 |
| Escondida, maior que o monitor | Chrome | 9 | 9 | 9 | 0 | 0 | 239/243 | 168/172 |
| Escondida, maior que o monitor | Brave | 1 | 1 | 1 | 0 | 0 | 241 | 167 |
| Escondida, inteira no monitor | Chrome | 6 | 6 | 5 | 0 | 2 | 162/229,5 | 108/142 |

As duas primeiras linhas incluem 4 recargas, que não tocam o vídeo, e 8 visitas ao servidor de desenvolvimento. "Escondida" quer dizer que, nos pontos medidos, nada da janela de teste ficava à vista no monitor: a cobertura registrada é de 100% nas janelas que cabem nele e de 89% a 93% nas maiores, porque o resto delas está fora da tela. Em 3 das 16 escondidas também houve mouse ou teclado em uso.

Somando as 4 visitas válidas da repetição descrita abaixo, são 47 visitas sem outro programa sobre a janela e sem uso do PC. Isso não é o mesmo que a janela inteira à vista: em 28 delas, um balão do próprio navegador cobria até 10% da janela, e a 1920 e 2560 px ela não cabe no monitor, com cerca de 10% a 12% da área fora da tela ou sob a barra de tarefas. Em 40 das 43 visitas da rodada completa, o navegador também não era o programa em primeiro plano, ao contrário de um visitante normal.

Tempo até a home, em produção, nas mesmas larguras. Com tema, são as visitas das duas primeiras linhas. Sem tema, é o mesmo script em 30/10, sem registro de tela. Por ser de outro dia, a comparação não é controlada:

| Grupo | Sem tema (30/10) | Com tema (31/10) |
|---|---:|---:|
| Chrome, 1ª visita, 1440 e 2560 px | 7,05 s (6 visitas) | 7,32 s (6 visitas) |
| Chrome, com cache, 1440 px | 6,80 s (3) | 6,85 s (3) |
| Brave, 1ª visita, 4 larguras | 7,05 s (12) | 7,26 s (11) |
| Brave, com cache, 4 larguras | 6,82 s (12) | 6,85 s (11) |

- **Chrome por largura.** Com registro de tela, sem outro programa por cima e sem uso do PC, essas séries têm o Chrome em produção com 6 visitas a 1440 px, 5 a 2560 px, 2 a 1920 px e nenhuma a 1536 px, uma das larguras em que o vídeo parava antes da correção. Essa largura foi medida à parte, na comparação direta descrita mais abaixo, só pelo proxy e com outra resolução no monitor principal.
- **Série interrompida.** A primeira rodada parou quando o PC desligou. Restaram 20 visitas legíveis do Chrome nas 4 larguras, com 0 paradas, 0 retomadas e 239/243 quadros, mas o registro de tela dela se perdeu. Uma lista de janelas feita 3,5 minutos antes, que só está no registro da sessão, mostra uma janela de outro programa maximizada no monitor principal. A 1440 e 1536 px (8 visitas), o rAF dá só um indício de que ela não estava por cima: nas 5 de 1ª visita, 165 a 168 por segundo fica acima do maior valor medido com a janela coberta (161,6), mas nas 3 com cache, 172 a 173, ele não distingue, porque janelas de 1536 px cobertas e com cache chegaram a 172,1 na comparação direta, com outra resolução. A 1920 e 2560 px (12 visitas), o rAF não distingue.
- **Janela escondida.** Em 16 das 60 visitas, outro programa passou para a frente e escondeu a janela de teste. Nas 10 maiores que o monitor, o rAF ficou normal (167 a 174 por segundo) e o vídeo não parou; o motivo não foi medido. Nas 6 que cabem inteiras, todas Chrome a 1536 px, o rAF caiu para 108 a 155, o log de mídia registrou underflow durante o vídeo em 4 (`DECODER_UNDERFLOW` em 2, `DEMUXER_UNDERFLOW` em 3, uma delas com os dois) e houve 2 retomadas, ambas nas 2 com `DECODER_UNDERFLOW`. Esse é o sinal do defeito original, e nenhum dos dois tipos apareceu nas 47 visitas válidas nem nas 66 de 30/10. As 6 chegaram à home. Na mais lenta, em 11,4 s, o vídeo não terminou: o teste clicou no limite de 9 s, com 3,71 s de 4,05 s tocados. A comparação direta mostra que esse sinal também aparece sem o tema.
- **Repetição.** As 18 visitas repetiram os grupos escondidos, com a janela de teste fixada acima das outras por uma versão do monitor que foi removida depois. O PC voltou a ser usado no meio dela. Só 4 visitas valem (1920 e 2560 px), com 0 retomadas e 242 ou 243 quadros, e não medem exatamente a mesma condição da rodada completa. As outras 14 tiveram mouse ou teclado em uso e não contam. Em 10 delas, a janela ficou escondida ou minimizada a maior parte do tempo e o rAF médio caiu para 2 a 29 por segundo. Em 9, o `local-preloader.js` forçou a home, entre 19 e 22 s, e 2 tiveram uma retomada. As 18 chegaram à home, mas em 11, todas com a janela fora de vista na hora do teste, a roda do mouse não moveu o rolo.
- **Quadros abaixo de 240.** O mínimo de 223 no Brave é da mesma ordem dos 226 sem o tema. Nessa visita, os 20 quadros que faltam são todos do contador, que começou a contar 0,33 s depois de o vídeo começar. Na visita de 226 sem o tema, 7 têm a mesma causa. Descontado o contador, os mínimos são 228 com o tema e 233 sem ele.
- **1ª visita.** Nesta comparação entre dias, a home chegou de 213 a 265 ms mais tarde que em 30/10, e de 36 a 49 ms mais tarde com cache. Entre duas rodadas com o tema, na mesma largura, a mediana variou até 150 ms. A medição justa desse custo está na comparação direta.
- **Desligamento durante o teste.** Em 31/10, às 08:22, o PC desligou sem aviso, 6 minutos depois do início da primeira rodada. O registro do Windows mostra 11 desligamentos inesperados desde 20/09, 9 deles antes deste projeto, todos sem tela azul nem erro de hardware registrado. Em um deles, em 13/10, o botão de energia foi acionado. As 123 visitas seguintes, incluindo a comparação direta e o controle, não causaram outro.

**Comparação direta: Chrome a 1536 px, com e sem tema.** `validate-1536.sh`, em 31/10. O monitor principal estava em 1920×1080; nas séries anteriores e nas paradas de antes da correção, ele tinha pelo menos 2560 px de largura. Os dois lados passam pelo mesmo proxy (`serve-ab-proxy.mjs`), que só retira do HTML as três tags do tema no lado sem tema, e nenhum usa a interceptação do Playwright. As visitas foram agrupadas pelo que o registro de tela mediu, sem nenhuma descartada:

| Janela | Tema | Visita | Visitas | Home | Vídeo até o fim | Underflow (`DECODER` / `DEMUXER`) | Retomadas | Parou no último quadro | Quadros ao clicar (mín./mediana) | Home (mediana) |
|---|---|---|---:|---:|---:|---:|---:|---:|---:|---:|
| Visível | com | 1ª | 6 | 6 | 6 | 0 | 0 | 0 | 243/243 | 7,23 s |
| Visível | sem | 1ª | 6 | 6 | 6 | 0 | 0 | 0 | 232/243 | 7,03 s |
| Visível | com | cache | 3 | 3 | 3 | 0 | 0 | 0 | 243/243 | 6,81 s |
| Visível | sem | cache | 3 | 3 | 3 | 0 | 0 | 0 | 243/243 | 6,80 s |
| Escondida | com | 1ª | 6 | 6 | 6 | 4 (3 / 2) | 3 | 0 | 210/225,5 | 7,79 s |
| Escondida | sem | 1ª | 9 | 9 | 9 | 5 (3 / 3) | 5 | 0 | 202/222 | 8,20 s |
| Escondida | com | cache | 3 | 3 | 3 | 0 | 0 | 0 | 239/241 | 6,96 s |
| Escondida | sem | cache | 3 | 3 | 3 | 0 | 0 | 0 | 241/242 | 6,97 s |

Controle positivo, com a janela visível e a correção `mix-blend-mode:lighten` retirada só no navegador do teste (`--stripfilter`), em 1ª visita:

| Sem a correção | Visitas | Vídeo até o fim | `DECODER_UNDERFLOW` | Retomadas por visita | Parou no último quadro | Quadros ao clicar | Home |
|---|---:|---:|---:|---:|---:|---:|---:|
| Sem tema | 3 | 0 | 3 | 2 | 3 | 38 a 46 | 11,3 s |
| Com tema | 3 | 3 | 0 | 0 | 0 | 243 | 7,1 a 7,7 s |

- **O teste enxerga o defeito nesta configuração.** Sem a correção e sem o tema, o vídeo parou nas 3 visitas, e o vigia mostrou o último quadro. Com a correção, nas mesmas condições, não parou nenhuma das 6 sem tema.
- **Com a janela visível, nada parou.** Nas 18 visitas com a correção, o vídeo tocou até o fim, sem underflow nem retomada, com e sem tema. Com tão poucas visitas, isso não exclui uma parada rara. Visível quer dizer sem outro programa por cima: nas 12 de 1ª visita, o Chrome estava em primeiro plano, com um balão dele cobrindo até 8% da janela; nas 6 com cache, outro programa estava em primeiro plano. As condições são iguais entre os dois lados de cada grupo.
- **O tratamento do tema também evitou a parada** nas 3 visitas sem a correção. Isso combina com o que se mediu antes sobre `filter` e `mix-blend-mode` no vídeo, mas são só 3 visitas, e a correção continua necessária.
- **O sinal com a janela escondida também aparece sem o tema.** Ele depende de a janela estar escondida: na 1ª visita, houve underflow em 9 de 15 escondidas e em 0 de 12 visíveis, e retomadas em 8 e em 0. O tema não é necessário para ele, mas estas amostras não excluem que o tema mude a sua frequência. A página se recupera: as 21 visitas escondidas chegaram à home, a mais lenta em 8,9 s.
- **Mesma janela por cima.** A linha "sem" da 1ª visita escondida mistura 6 visitas atrás de uma janela escura aberta para o teste com 3 atrás da janela do Claude; a linha "com" só tem a janela escura. Só atrás dela, com 6 de cada lado: 3 retomadas nos dois, `DECODER_UNDERFLOW` em 3 com o tema e em 1 sem ele, `DEMUXER_UNDERFLOW` em 2 e em 3, quadros 210/225,5 e 222/227 e home em 7,79 s e 7,81 s. A diferença de 0,41 s entre as duas linhas da tabela vem quase toda daquelas 3 visitas e não é ganho do tema.
- **Com cache.** Não houve underflow nem retomada nas 6 visitas escondidas com cache, todas atrás da janela do Claude. Isso não é exclusivo da 1ª visita: 2 delas tiveram evento `waiting`, 4 perderam de 1 a 4 quadros e, na rodada completa, uma visita com cache coberta teve `DEMUXER_UNDERFLOW`.
- **Custo do tema na 1ª visita.** Com a janela visível, 6 visitas de cada lado, em localhost: `DOMContentLoaded`, `load`, início e fim do vídeo vieram de 116 a 127 ms mais tarde, e o ENTER, 119 ms. A home, como o teste a mede, chegou 200 ms mais tarde, mas cerca de 75 ms disso vêm do intervalo com que o script percebe o fim do vídeo e clica; sem esse intervalo, o custo fica perto de 125 ms. Com cache, fica entre 11 e 14 ms. As visitas com tema rodaram antes das sem tema, mas a rodada alternada atrás da janela escura deu +103 ms no `DOMContentLoaded` e +95 ms no ENTER, então a ordem não explica o custo.
- **Número de visitas.** Foram 39, além das 6 do controle, e não as 24 planejadas. A janela do Claude passou para a frente no meio da primeira rodada, então os grupos que faltavam foram completados depois. Além disso, 3 visitas que deveriam ficar escondidas abriram na frente e contaram como visíveis, e outras 3 sem tema foram feitas para igualar os lados.

**Chrome e Brave reais, com a tela do Windows bloqueada.** Mesmo script, com o rastreamento de oclusão desligado, para não ocupar a tela. Nesse modo, o `requestAnimationFrame` fica em cerca de 58 por segundo.

| Grupo | Visitas | Home | Vídeo até o fim | Parou no último quadro | Retomadas | Quadros ao clicar (mediana) |
|---|---:|---:|---:|---:|---:|---:|
| Chrome, produção, 1ª visita | 12 | 12 | 12 | 0 | 0 | 231 |
| Chrome, produção, com cache | 12 | 12 | 12 | 0 | 0 | 242 |
| Brave, produção, 1ª visita | 12 | 12 | 12 | 0 | 0 | 229,5 |
| Brave, produção, com cache | 12 | 12 | 12 | 0 | 0 | 238 |
| Recarga, Chrome e Brave | 4 | 4 | não toca (cookie) | 0 | 0 | n/a |
| Desenvolvimento (4321), Chrome e Brave | 8 | 8 | 8 | 0 | 8 | 206 e 232,5 |

- No A/B do Chrome com a tela bloqueada (24 visitas, a 1440 e 1924 px), o tema deu mediana de 225 quadros na 1ª visita e 242 com cache, contra 238,5 e 235,5 sem ele. Com 6 visitas por grupo e valores em dois blocos, a diferença não separa o tema do acaso: nos dois lados, 4 das 12 visitas ficaram abaixo de 220. Esse A/B não é simétrico. Só o lado sem tema usava a interceptação do Playwright, que desliga o cache e acrescenta um passo a cada requisição: o grupo sem tema "com cache" baixou o vídeo inteiro a cada visita, então 242 e 235,5 não são comparáveis. Os tempos, que variaram menos de 100 ms, também não servem para medir o custo de carga. A medição justa é a da comparação direta.
- As retomadas no servidor de desenvolvimento não vêm do tema: aconteceram também com o tema bloqueado (3 de 3). Ele estava entregando o vídeo de 5 MB em cerca de 4 s, contra 6 ms em produção, e o `local-preloader.js` retomou o vídeo como previsto.

**Para repetir** com ninguém usando o PC, porque as janelas abrem no monitor principal e podem ficar na frente do que estiver aberto:

```bash
bash reference/captures/home-init/validate-tema.sh
```

Depois, `node reference/captures/home-init/validate-tema-table.cjs t` mostra a tabela. Ela descarta as tentativas com cadência de 1 quadro por segundo, mas isso não basta para provar que a janela estava visível: a página continua se dizendo visível e em foco mesmo atrás de outras janelas, por causa da emulação de foco do Playwright. Para saber o que a tela mostrou, inicie `watch-windows.ps1` junto e cruze com `validate-vis-join.cjs`. 

Para a comparação direta, deixe o servidor de produção em 4322 (`npm run start`), inicie `serve-ab-proxy.mjs` e `watch-windows.ps1` (com `-Raise`, para a janela de teste subir uma vez acima das outras), e rode `bash reference/captures/home-init/validate-1536.sh saida.txt c15z`. Para esconder a janela de propósito, abra `cover-window.ps1` antes e use o monitor sem `-Raise`. Para ler o resultado, passe a `validate-1536-results.cjs` só o registro de tela dessa rodada: ele lê todos os rótulos `c15<letra>-` e ignora os outros, e as visitas sem registro caem em `other`.

Os números da janela visível estão em `reference/captures/home-init/vis-results.txt`, gerado por `validate-vis-results.cjs`, e os da comparação direta em `1536-results.txt`, gerado por `validate-1536-results.cjs`. As medianas com número par de visitas são a média dos dois valores centrais. Os registros de `vis`, `visb` e `visc` em `vis-windows/` foram filtrados depois da coleta, sem títulos de janela e só com as janelas de teste, e os originais foram apagados. Os desligamentos vêm do log Sistema do Windows (eventos 41 e 6008).

**O que não foi testado:** Safari e Firefox; aparelhos físicos (o celular é emulado); larguras entre 768 e 991 px além da inspeção de texto e do preloader a 768; tema e sem tema lado a lado, pelo mesmo proxy, em outras larguras além de 1536 px e no Brave. Fora de 1536 px, só há o A/B do Chrome com a tela bloqueada, com interceptação em um lado.

## Inicialização da home

**O defeito.** Em uso real, a primeira visita à home podia ficar parada nas listras claras, com o ENTER por cima, ou tocar a abertura muito travada. Nos testes anteriores isso nunca apareceu, porque eles rodam no Edge sem interface e com relógio falso.

**A causa, medida em Chrome 151 e Brave 1.98 reais, com perfil limpo e sem relógio falso** (Windows, NVIDIA RTX 3050, driver 32.0.16.2101; saídas gravadas em `reference/captures/home-init/`, principalmente `gaps-out.txt`):
- O `logo_intro_desktop.mp4` (2160×1440, 60 fps, 4,05 s) para de apresentar quadros. O log de mídia do navegador registra `DECODER_UNDERFLOW` no `D3D11VideoDecoder`: o vídeo fica com `readyState` 2, sem pausar e com o arquivo inteiro em buffer, e não volta mais.
- Sem correção, com a janela em 1440×925, parou em 3 de 3 cargas limpas no Chrome e no Brave. O Edge 156 terminou 3 de 3.
- A largura não decide sozinha, e é daí que vem a intermitência. Na varredura gravada do Chrome, 1536, 1680, 1792 e 2560 px pararam 2 de 2, enquanto 1280, 1366, 1439, 1440 (com 825 px de altura), 1920 e 2160 px terminaram 2 de 2. Minutos depois, na mesma janela de 1440×825, as 12 cargas com variantes de CSS sem efeito pararam todas. A 1920 px houve uma rodada com 2 de 3 paradas, sem saída gravada, e outra com 0 de 6. A 1280 e 1366 px não parou em nenhuma medição.
- Não é algo que a réplica introduziu: a 1440 px, o site ao vivo e o HTML original local pararam 3 de 3 cada, no Chrome e no Brave. No Chrome, sem o `app.js`, também parou 3 de 3, então não depende do WebGL, das texturas nem do GSAP.
- Com o vídeo parado, o ENTER aparecia e funcionava, porque o original o libera por um `setTimeout` de 3,5 s, sem depender do vídeo. O visitante só via a imagem congelada.

**O mecanismo é uma hipótese, não um fato demonstrado:** a composição direta do vídeo. Nenhum teste lê em que caminho o vídeo está. O que foi medido, no Chrome e sem correção:
- `--disable-direct-composition` terminou 3 de 3, mas `--disable-direct-composition-video-overlays` parou 3 de 3.
- `--disable-accelerated-video-decode` terminou 3 de 3 com o `FFmpegVideoDecoder`, perdendo de 135 a 138 quadros, o que aponta também para o decodificador.
- `mix-blend-mode` e rotação mínima evitaram a parada em todas as cargas gravadas. `filter` reduziu, mas parou em 2 de 8 a 1440 px. `translateZ`, `will-change`, `clip-path`, `border-radius`, `opacity` e `scale` pararam 12 de 12.
- Com a regra final e a GPU ocupada a 1440 px, o mesmo `DECODER_UNDERFLOW` voltou em 6 de 6, então evitar esse caminho não basta.

**O que não reproduzi:** a abertura "nem aparecer" no Brave. O mais próximo foi a parada em cerca de 0,2 a 0,5 s de vídeo. Além disso, o original pula a abertura por 1 hora depois do ENTER (cookie `preloader_shown`), o que pode parecer isso. A abertura "muito travada" só apareceu numa rodada sem saída gravada: a 1439 e 2160 px, sem parar, o vídeo perdeu 58 e 173 quadros; na varredura gravada, as mesmas larguras perderam 0.

**A correção** (só na home, marcada com `data-local-replica`):
1. `.preloader-video{mix-blend-mode:lighten}` evitou a parada em máquina livre. Sobre o preto puro do overlay, o resultado é o próprio vídeo: 0 pixels diferentes em 6 instantes, no Chrome e no Brave, numa página de teste só com o vídeo pausado, a 1280 px. Layout, ordem e tempos do original não mudam.
2. `public/assets/js/local-preloader.js` observa o original e age sobre um estado que falhou. Numa carga saudável, seu único efeito visível é ignorar um segundo clique no ENTER.

| Estado que falhou | O que acontecia no original | O que acontece agora |
|---|---|---|
| Vídeo parado com os dados já baixados | congelado | até 2 tentativas de retomar no total, cada uma depois de 0,7 s sem quadro novo; na parada seguinte, o último quadro (logo em fundo preto) |
| `autoplay` recusado | primeiro quadro parado | 1 nova tentativa; o ENTER vem no tempo normal |
| Imagem de textura falha | o `app.js` só escuta `onload`: **home oculta para sempre** | a imagem vira um pixel transparente e a home segue |
| Máscara do WebGL falha | home sem nenhum filme | mostra as imagens do DOM |
| `app.js` falha ou WebGL indisponível | **sem ENTER, preso para sempre** | ENTER aos 3,5 s; home em coluna simples, com rolagem |
| Contexto WebGL perdido | filmes somem | mostra as imagens do DOM |
| Segundo clique no ENTER | o tutorial roda de novo (3 cliques: 3 vezes) | só o primeiro clique vale |
| Home oculta 12 s depois de o overlay sair e da última textura, ou 120 s depois de o overlay sair mesmo com textura pendente | continua oculta | libera a home |

### Resultados da versão final

Cada tentativa espera o vídeo, clica no ENTER, confere o tutorial e gira a roda. "Limpa" é uma carga com perfil novo e processo novo do navegador; "com cache" é uma recarga sem o cookie da abertura. Salvo indicação, tudo em máquina livre, com larguras de 1440, 1536, 1920 e 2560 px. Em todas as linhas abaixo, o overlay saiu, a roda moveu o carrossel e o tutorial rodou no máximo uma vez. Não houve erro de console nem resposta HTTP de erro; a única requisição que falhou foi `tutorial-final.mp4 net::ERR_ABORTED`, que também ocorre sem a correção. Depois desta validação só mudaram comentários.

**Produção (4322)**

| Navegador e visita | Tentativas | Vídeo até o fim | Paradas | ENTER (mediana / máx.) | Home visível (mediana / máx.) | Tarefa longa máx. |
|---|---|---|---|---|---|---|
| Chrome, limpa | 12 | 12 | 0 | 3,97 / 4,05 s | 7,03 / 7,11 s | 300 ms |
| Chrome, com cache | 12 | 12 | 0 | 3,72 / 3,74 s | 6,79 / 6,83 s | 280 ms |
| Chrome, retorno com o cookie, sem abertura (2560 px) | 2 | n/a | n/a | n/a | 2,41 s | 286 ms |
| Brave, limpa | 12 | 12 | 0 | 3,97 / 4,03 s | 7,05 / 7,11 s | 291 ms |
| Brave, com cache | 12 | 12 | 0 | 3,73 / 3,75 s | 6,82 / 6,85 s | 277 ms |
| Brave, retorno com o cookie, sem abertura (2560 px) | 2 | n/a | n/a | n/a | 2,43 s | 276 ms |

**Desenvolvimento (4321)**

| Navegador e visita | Tentativas | Vídeo até o fim | Paradas | ENTER (mediana / máx.) | Home visível (mediana / máx.) | Tarefa longa máx. |
|---|---|---|---|---|---|---|
| Chrome, limpa (1536 e 2560 px) | 5 | 5 | 0 | 3,96 / 4,03 s | 6,98 / 7,09 s | 321 ms |
| Chrome, com cache (2560 px) | 2 | 2 | 0 | 3,74 s | 6,82 s | 277 ms |
| Brave, limpa (1536 e 2560 px) | 5 | 5 | 0 | 3,92 / 4,07 s | 7,06 / 7,10 s | 292 ms |
| Brave, com cache (2560 px) | 2 | 2 | 0 | 3,79 s | 6,88 s | 277 ms |

A home aparece cerca de 2,2 s depois do clique, tempo do próprio original. Os testes clicam quando o vídeo termina. A roda foi testada alguns segundos depois de a home aparecer e já tinha respondido na primeira leitura, cerca de 130 ms depois; como essa leitura vem após 100 ms, o número é um limite superior.

**Máquina ocupada (produção, carga limpa; tempos são medianas)**

| Condição | Chrome | Brave |
|---|---|---|
| CPU reduzida 4× (1440 e 2560 px) | 5 de 5 até o fim, sem paradas; ENTER 4,40 s, home 8,70 s, tarefa longa até 1,08 s | 5 de 5 até o fim, sem paradas; ENTER 4,53 s, home 8,63 s, tarefa longa até 1,03 s |
| 16 processos ocupando a CPU (2560 px) | 3 de 3 até o fim, sem paradas | 3 de 3 até o fim, sem paradas |
| GPU ocupada por outra janela, a 42–51% nas leituras entre as rodadas (2560 px) | 4 de 4 até o fim, sem paradas | 4 de 4 até o fim, sem paradas |
| A mesma carga de GPU, a 37–46% nas leituras (1440 px) | **3 de 3 pararam**; o vigia foi ao último quadro em até 7,9 s | **3 de 3 pararam**; o vigia foi ao último quadro em até 7,7 s |

Com a carga de GPU, a home foi alcançada em 14 de 14 tentativas, e o ENTER ficou pronto em até 4,2 s. Com o Cyberpunk 2077 aberto (cerca de 80% da GPU), uma versão anterior da correção, com `filter`, também parou em 15 de 15 cargas a 1440 px e chegou ao último quadro; essa combinação não foi repetida com o `mix-blend-mode`. Portanto, **com a GPU muito ocupada a abertura ainda pode não tocar inteira, mas o visitante não fica preso.**

**Antes e depois, a 2560 px, com o mesmo teste (3 cargas limpas por navegador):** sem a correção, 0 de 6 tocaram até o fim, com o vídeo parado por 7,8 a 8,3 s, até o teste clicar no ENTER perto de 9 s; com ela, 6 de 6 sem parada. A sonda do teste não explica o resultado: sem a sonda injetada na página e sem leituras durante a carga (só o log de mídia e uma leitura no fim), foram 32 de 32 sem parada (16 no Chrome a 1440 px, 8 no Brave a 1440 px e 8 no Brave a 2560 px).

**Varredura de larguras com a correção** (1280, 1366, 1439, 1440, 1536, 1680, 1792, 1920, 2160 e 2560 px): Chrome 20 de 20 e Brave 10 de 10 até o fim, sem paradas e com no máximo 3 quadros perdidos.

**Janelas estreitas, com o vídeo de celular** (900 e 600 px, 2 tentativas por largura e navegador): 7 de 8 normais, com o vídeo até o fim, ENTER em até 4,0 s e home em até 6,6 s. Na outra (Chrome, 900 px), os quadros da página caíram para 1 por segundo a partir de 2,8 s, com a página ainda informando `visible`. A causa não foi medida. Nas medições de 31/10 com registro de tela, essa cadência só apareceu com a janela fora da lista de janelas visíveis, minimizada, por exemplo; uma janela apenas coberta não chegou a ela. O vigia fechou o overlay, liberou a home aos 20,9 s, e a roda não respondeu nos 2,5 s do teste; essa tentativa não conta como aprovada, e a repetição passou. A mesma queda ocorreu em 3 tentativas do Brave numa validação anterior, descartada.

**ENTER em cada estado** (Chrome e Brave, 1 tentativa por estado): durante o fade do botão, sobre o vídeo parado nas listras (com a regra CSS retirada, para forçar a parada), no logo preto, com a mídia ainda carregando, 3 cliques rápidos e 2 cliques durante o fade do overlay. Em todos, o clique foi aceito uma vez, o tutorial rodou uma vez, nenhum overlay ficou por cima e a roda respondeu. Antes do ENTER aparecer não há botão para clicar, como no original.

**Falhas simuladas** (Chrome e Brave): vídeo, `app.js`, uma textura e a máscara bloqueados; WebGL desligado (`--disable-3d-apis`); contexto perdido a 1,5 s. Em todas, o ENTER apareceu no tempo normal, a home abriu e a roda ou a rolagem funcionou. Sem a correção (só no Chrome, 1 tentativa por caso), os casos de `app.js` e WebGL ficaram sem ENTER e o de textura ficou com a home oculta, durante os 20 s do teste. O `autoplay` bloqueado foi testado no Brave, com a configuração do site. Os limites do vigia também dispararam, forçados de propósito: 12 s no Chrome e no Brave, 120 s no Chrome.

**Aba realmente oculta** (`hidden-tab.mjs`, CDP puro, 8 s oculta): Chrome e Brave passaram em primeira visita e em visita de retorno, sem home forçada. As linhas `background-tab` e `returning-hidden` de `states3-out.txt` não contam para isso, porque nelas a página continuou `visible`.

**Rede lenta (3 Mbps):** a home levou 29,7 s no Chrome e 30,4 s no Brave, sem ação do vigia sobre o vídeo e sem home forçada. Em outra tentativa no Brave, o teste terminou aos 30 s com a home já entrando (opacidade 0,96). O original, sem a correção, levou 30,2 s no Chrome, porque espera as 9 texturas.

**Fidelidade:** nos cenários visuais focados, 115 de 115 estados idênticos contra o site ao vivo (`home-intro`, `home-intro-clip`, `home-roll`, `motion-preloader`) e 76 de 76 contra o HTML original local (os mesmos, sem `home-roll`). O DOM estrito continua idêntico nas 17 páginas, e o teclado na home tem 30 de 30 paradas iguais às do site ao vivo.

**Limites:**
- Tudo foi medido em uma única máquina. Outra GPU ou outro driver podem se comportar de outro modo; o vigia existe para esse caso.
- Testei com perfis novos, não com os seus perfis de Chrome e Brave, cujas extensões e configurações podem interferir.
- "Máquina livre" vale para o que foi registrado: a rodada final grava a ausência de jogos abertos e GPU a até 5%; na validação principal essa leitura não foi gravada.
- O site ao vivo continua com o defeito, porque a correção vale só para esta réplica.
- O vigia só existe na home. Em `/work` aberto diretamente, a espera por texturas sem tratamento de erro continua igual à do original; isso vem da leitura do código e não foi testado.
- Evidências e scripts estão em `reference/captures/home-init/` (`rt.mjs`, `vtest.mjs`, `validate.sh`, `states3.sh`, `gaps.sh`, `hidden-tab.mjs`).

**Como conferir no seu Brave:** abra `http://localhost:4322/` numa janela anônima com cerca de 1440 px de largura e espere 6 s sem clicar em nada. Depois maximize a janela e recarregue: sem o clique no ENTER, a abertura toca de novo. O vídeo deve ir das listras até o logo em fundo preto, e o ENTER começa a aparecer perto de 3,5 s e fica pronto perto de 4 s. Se parar, rode `window.__localPreloader.log` no console: o registro diz o que falhou e o que o vigia fez. Depois de clicar no ENTER, a abertura só volta a aparecer depois de 1 hora, limpando o cookie `preloader_shown` ou fechando todas as janelas anônimas antes de abrir outra.

## O que foi testado

Ambiente: Windows 11, Microsoft Edge pelo Playwright (canal `msedge`), Node 24.19, densidade de pixels 1. "LIVE" é https://www.siena.film, comparado em 29 e 30/10/2026. Um "estado" é uma captura em um momento de um cenário; "idêntico" significa 0 pixel acima do limiar 0,1 do pixelmatch. As evidências ficam em `reference/captures/`.

### Verificações do build final (30/10)

| verificação | resultado |
|---|---|
| `npm run start` | 17 páginas geradas; as 17 rotas e `/sitemap.xml` respondem 200; caminho inexistente responde 404 |
| DOM (`npm run verify:dom`) | 17/17 idênticas, em `dist/` e por HTTP, incluindo os 85 comentários. Um teste de mutação confirmou que um comentário alterado reprova a página |
| Links e ativos (`npm run check:site`) | 385/385 URLs locais respondem 200 na réplica (383/383 no espelho, que não tem `local-forms.js` nem `local-preloader.js`); âncoras e links externos conferem; nenhum dos bundles aponta para as CDNs originais |
| Ativos | 368/368 no disco e no manifesto; cada um responde com o tipo, o cache e a compressão gravados da origem, e o corpo decodificado é igual ao arquivo |
| Hospedagem | 62 URLs comparadas com LIVE (réplica e espelho): 0 diferenças em status, `Location`, tipo, compressão, cache, `x-frame-options` e título. Faixas de bytes, 304, HEAD e arquivo travado (503, sem derrubar o servidor) testados à parte |
| Teclado (`npm run check:keyboard`) | 8/8 rotas: 30 paradas de Tab iguais em elemento, destino e posição, e Enter leva à mesma rota. `/work` repetida 3 vezes contra a réplica, 1 contra o espelho e 1 LIVE contra LIVE: todas iguais |

### Comparação visual

**Suíte completa (29/10):** 70 cenários, 161 execuções cenário × viewport, **1957 estados: 1933 idênticos (98,8%) e 24 diferentes.** Por viewport: 1440×900 (707), 390×844 (608), 1920×1080 (420), 360×740 (216), 844×390 (3) e 667×375 (3). Relatórios em `reference/captures/compare/final-1` e `final-2`. Os 24 estados:

| cenário | viewport | estados | diferença | situação |
|---|---|---|---|---|
| `film-player-by-any-means`, `film-by-any-means` | 1920×1080 | 11 | 0,0037–0,1353% | duas renderizações do mesmo cartaz, que também aparecem no LIVE (ver "Diferenças restantes") |
| `nav-menus` | 1440×900, 1920×1080 | 10 | 0,0002–0,0003% | variação também presente em LIVE contra LIVE |
| `page-about` | 390×844, 1920×1080 | 2 | 0,0017–0,0021% | variação também presente em LIVE contra LIVE e com o espelho |
| `smoke-404` | 1440×900 | 1 | 0,8978% | captura em tempo real, no meio da rolagem dos dígitos; o cenário determinístico `page-404` é idêntico |

**Depois da última mudança no servidor** (cache da compressão, feita após a suíte), a suíte completa **não** foi repetida. A verificação focada cobriu a inicialização e as áreas mais sensíveis a tempo:
- `home-intro`, `home-intro-clip`, `work-roll`, `nav-to-work`, `film-savoy`, `film-thehousewife`, `page-404` e `page-contact` nas viewports padrão de cada um: 176 estados, 175 idênticos (`final-3`). O diferente é `work-roll` `01-entering` a 390×844 (2,96%), uma renderização que o LIVE também produz.
- `nav-menus` e `page-about`: 88 estados, 85 idênticos (`ctl-replica`).
- `work-roll` a 390×844 repetido nos três lados, com cada captura medida contra uma mesma referência do LIVE: 4 de 30 capturas do LIVE (a própria referência incluída; as 4 vêm de 2 execuções), 0 de 7 do espelho e 2 de 9 da réplica tiveram algum estado acima do limiar. A rodada seguinte mostrou que essas diferenças vêm do relógio falso do teste (ver "O desvio de `work-roll` a 390×844").

**Rodada adversarial (29/10, com o servidor anterior às correções de hospedagem):**
- Outras viewports de desktop (1280×800, 1366×768, 1536×864, 2560×1440): 502 estados, 464 idênticos, 37 com até 0,0042% e 1 caso de início atrasado (35,14%) que o LIVE também apresenta.
- Tablet e celular (1024×768, 768×1024, 414×896, 360×740): 422 estados, 402 idênticos, 20 com até 0,0084%. Os passes de iPad emulado e de rotação ficam à parte (ver "Diferenças restantes").
- Paridade de execução: 192 carregamentos de página, com as mesmas requisições por rota (exceto `local-forms.js` e o placeholder bloqueado no LIVE), os mesmos erros de console, 26 estados de navegação iguais (histórico, cookies, storage, páginas do Taxi) e a mesma sequência de chamadas de som do Howler.
- Essa rodada confirmou 18 achados, todos corrigidos: `/sitemap.xml` ausente e 17 problemas de robustez ou documentação nas ferramentas.

**Interações cobertas pelos cenários:** preloader, tutorial, rolo com arrastar, roda, teclado e toque, EXPLORE, carrossel do `/work` com Footage/Poster e lightbox, menus rápido e geral, transições do Taxi, voltar e avançar do navegador, aviso de rotação, player de trailer, slider de críticas, região fixa do Director's Cut, cursor personalizado, hovers do rodapé e movimento quadro a quadro de preloader, tutorial, inércia e arrasto.

**Outros testes:**
- Sem rede externa (todo host fora de localhost bloqueado, 18 rotas, desktop e celular): a única requisição externa é o `src` do YouTube que o próprio original usa em `/films/by-any-means`. A WebGL renderiza.
- Newsletter: o envio é interceptado, nenhum POST sai da máquina e o bloco de erro mostra a integração faltante. O ramo de sucesso existe para uma integração futura, mas não foi exercitado, porque não há serviço conectado.

### O alerta de 4 px do teclado

O check apontou os links do menu em y=111 no LIVE e y=115 na réplica, em `/work`. A causa está no próprio teste, não na réplica: o bilhete da navegação entra deslizando cerca de 200 px em 1,2 s e, em 17 de 18 medições, termina entre 3,60 e 3,77 s depois do `load` (2,91 s na outra), enquanto o check media o primeiro Tab entre 3,01 e 3,21 s. Medir ali é ler um elemento em movimento: as fontes já estavam carregadas e o painel, fechado.

| medição em `/work` | LIVE × réplica | LIVE × espelho | LIVE × LIVE |
|---|---|---|---|
| espera antiga de 3 s (check, 5 rodadas): rodadas com diferença | 3 de 5 | 5 de 5 | 4 de 5 |
| espera de 6 s (probe, 3 rodadas): paradas diferentes | 0 de 90 | 0 de 90 | 0 de 90 |

Nas 9 rodadas com 3 s, as 167 paradas em que os dois menus já estavam parados não tiveram nenhuma diferença. Nada no layout foi alterado; `tools/check-keyboard.mjs` agora espera 6 s antes dos Tabs (`--settle`). Medidas, capturas e scripts estão em `reference/captures/keyboard-4px/`.

### O desvio de `work-roll` a 390×844

A causa está no relógio falso do teste, não na réplica. O Playwright define o valor inicial desse relógio (`p0`, em ms) pelo tempo real entre `clock.install()` e `clock.pauseAt()`, antes de a página pedir qualquer byte do site. Nas 114 cargas naturais da rodada, ficou entre 2 e 6 ms em 92 e chegou a 14 ms. Como o quadro do relógio falso tem 16 ms, o que importa é `p0` % 16. Ele decide se o primeiro quadro vira um tick do GSAP, isto é, uma atualização da animação (o ticker ignora quadros a menos de 4,17 ms de `p0`, e o kit só avança até o quadro seguinte quando `p0` não é múltiplo de 16), e em que quadro termina o `setTimeout(200)` da entrada do carrossel. Daí saem dois fenômenos distintos:

| `p0` % 16 | o que acontece | efeito acima do limiar | LIVE | espelho | réplica |
|---|---|---|---|---|---|
| 1 a 8 | normal: 65 ticks em `01-entering` | nenhum | 37 de 42 | 30 de 36 | 30 de 36 |
| 9 a 11 | entrada do carrossel um quadro atrasada, ainda com 65 ticks | só `01-entering`: 2,9587% | 4 de 42 | 5 de 36 | 5 de 36 |
| 12 a 15 e 0 | 1 tick a menos até o fim: 64 ticks em `01-entering` | `01-entering` 3,4485%, `06` 1,5093%, `07` 1,5406%, `08` 2,8466% | 1 de 42 | 1 de 36 | 1 de 36 |

As contagens são das cargas naturais, sem atraso forçado: 12 execuções completas do LIVE e 6 de cada cópia local, mais 30 cargas de cada lado só até `01-entering`, estas com três navegadores em paralelo. Elas mostram que o mecanismo existe em cada lado, mas não medem a frequência numa comparação comum: as cargas de uma execução não são independentes (o 1 de 42 e um dos 1 de 36 vieram da mesma) e a carga da máquina altera `p0`. Das 3 cargas com tick a menos, só a do espelho foi além de `01-entering`. Os valores 7 e 15 não apareceram, e 0 e 13 só com atraso forçado; para eles, a tabela vem da regra, não da contagem.

As porcentagens são contra uma captura normal (`ctl-workroll-l1/a`). Com outra referência normal, `01-entering` varia de 2,9581% a 2,9587% e de 3,4482% a 3,4485%. Se os dois lados caírem nas faixas de baixo, `01-entering` dá 0%, então o par não acusa a diferença.

**Por que 1 tick muda só esses estados:** o relógio do WebGL (`$.time`) soma 0,1 por tick. Com um tick a menos, o ruído de filme muda em toda a tela, mas fica abaixo do limiar da comparação (até 18 níveis). A faixa do Footage anda `$.time × 0,02` por quadro no celular e, com a suavização de 0,12, fica deslocada em 0,0167 na unidade do `u_x` (0,1 × 0,02 ÷ 0,12). Essa é a conta feita a partir do bundle; o valor medido foi 0,0160 em `06`, ainda convergindo, e 0,0166 de `07` a `10`. Em `09` e `10` a faixa já não aparece. Em `01-entering` o carrossel ainda se move e fica uma atualização atrás; a partir de `02`, fora do Footage, as posições são iguais.

**Evidências** (`reference/captures/workroll-webgl/`):
- A contagem de ticks, o quadro da primeira atualização e o quadro da entrada, previstos só a partir de `p0`, acertaram 127 de 127 capturas: as 114 naturais da tabela e 13 em que a sonda inseriu de 8 a 13 ms entre `install` e `pauseAt`.
- O PNG de `01-entering` é função de `p0` % 16: nenhum dos 14 valores observados gerou mais de um hash, e em 12 deles mais de um lado produziu o mesmo arquivo (0 e 13 têm uma captura só). Abaixo do limiar, `p0` também desloca o início das animações, e por isso cada valor tem um hash próprio.
- Os estados 02 a 10 são função da contagem de ticks: em cada estado, um só hash nas 33 capturas com 65 ticks e outro nas 4 com 64 (3 delas forçadas), nos três lados.
- A captura que motivou a investigação (`reference/captures/compare/ctl-workroll-r2/b`) está exatamente 1 tick atrás nos 10 estados, segundo a leitura do ruído do próprio PNG. Essa leitura coincidiu com o contador real da página em 460 de 460 estados.
- A réplica com `p0` 29 (atraso forçado) repetiu os 10 PNGs dessa captura byte a byte. O LIVE com atraso forçado (2 capturas) e o espelho em carga natural (`p0` 14) repetiram 9 de 10 byte a byte, e o restante ficou com 0,0000% contra ela. O `p0` da captura original não foi registrado; o valor (13 em `p0` % 16) é deduzido dessa igualdade.
- No LIVE a 390×844, `06` a `08` só foram vistos com atraso forçado. O caso natural do LIVE está a 414×896: as duas capturas de `reference/captures/adversarial/viewports-tablet-phone/live-vs-live` estão 1 tick atrás e, contra uma captura normal do LIVE, dão 3,44% em `01` e 1,52%, 1,53% e 2,95% em `06` a `08`. Como os dois lados perderam o tick, o relatório daquele par não mostrou nada disso.
- Em 37 execuções completas (24 naturais e 13 forçadas), canvas, rolagem, fontes e imagens não mudaram em nenhum estado; `/work` nessa viewport não tem `<video>`. A posição do carrossel só muda em `01-entering` (−232,519 px contra −237,377 px), nos dois fenômenos.

**Fora de 390×844:** `p0` não depende da viewport, só o tamanho do efeito. A 1366×768, nos 60 lados de uma rodada anterior (`reference/captures/adversarial/verify-viewports-desktop-VPD-1`), cada hash de `01-entering` corresponde a um só valor de `p0` % 16, e a posição segue os mesmos grupos: 2483,63 px com 1 a 8 e 2691,12 px com 9 a 12. É o "início atrasado" de 35,14%. O deslocamento da faixa do Footage é bem menor no desktop (0,00025 pela mesma conta; 0,0012–0,0072% medidos a 1366×768).

O site e o kit de teste não foram alterados, então esses valores podem reaparecer em comparações futuras, em qualquer viewport, sem indicar um defeito.

### O que não foi testado

- **Safari, iOS, Firefox e aparelhos reais.** A suíte visual rodou no Edge sem interface; Chrome e Brave reais só foram usados na inicialização da home. "Celular" é emulação (user-agent Android, toque e viewport).
- **Densidade de pixels 2 ou maior.** Todas as comparações usam densidade 1, e telas de maior densidade escolhem outros candidatos de `srcset`.
- **Som ouvido.** Comparei a sequência de chamadas de áudio, não a saída sonora.
- **A abertura com o Cyberpunk 2077 aberto na versão final,** e em outras GPUs e drivers (ver "Inicialização da home").
- **Uma segunda rodada adversarial sobre as correções.** Elas foram verificadas pelos testes acima, não por revisores independentes.
- **Publicação em outra hospedagem.** O comportamento de hospedagem descrito vale para `tools/serve.mjs`.

## Diferenças restantes

Nas condições testadas, as comparações mostram a réplica visual e funcionalmente equivalente ao site ao vivo, salvo o que está listado aqui. Isso não é uma prova de fidelidade perfeita: a suíte é uma amostra de estados, em um navegador, e o próprio site ao vivo varia entre carregamentos.

**1. Em aberto**
- Nenhum desvio foi demonstrado como exclusivo da réplica, mas nem todos têm controle direto. Na rodada adversarial de desktop, 31 das 38 linhas com diferença (até 0,0042%) não foram repetidas em LIVE contra LIVE nem contra o espelho no mesmo cenário e viewport; foram classificadas como ruído de borda pela inspeção das máscaras e porque o conjunto muda entre execuções.
- O cartaz de `/films/by-any-means`, listado abaixo, também aparece no LIVE, mas o mecanismo não foi identificado.

**2. Variações que também aparecem no site ao vivo (não são defeitos da réplica)**
- **Cartaz de `/films/by-any-means` a 1920×1080** (0,11–0,14% dos pixels, nas bordas da imagem): o mesmo arquivo, com os mesmos bytes, aparece em duas renderizações, uma levemente mais nítida. A versão mais nítida saiu com hash de PNG idêntico em 2 de 36 capturas do LIVE e em 4 de 30 dos servidores locais (incluindo o HTML original no espelho). A frequência local pode ser maior, mas a amostra não permite afirmar. O mecanismo do navegador não foi identificado.
- **`work-roll` a 390×844**, em `01-entering` (2,96% ou 3,45%) e em `06` a `08` (1,51–2,85%): efeito do relógio falso do teste, com os mesmos valores nos três lados. No LIVE, a essa viewport, `06` a `08` só foram vistos com atraso forçado (ver "O desvio de `work-roll` a 390×844").
- **`/about`, texto cinético** (até 0,0106% contra a réplica e 0,0128% contra o espelho) e **menu rápido da home** (até 0,0003%): diferenças de borda em poucos pixels. Em LIVE contra LIVE apareceram com até 0,0003% e 0,0001%, respectivamente. No `/about`, o valor entre duas cargas do LIVE foi menor do que contra as cópias locais, mas a réplica e o HTML original local se comportam igual. Esses máximos valem para as viewports padrão; a 414×896, o `/about` chegou a 0,0547% contra a réplica e 0,0321% em LIVE contra LIVE.
- **`/about` com iPad emulado** (até 26,05% a 768×1024, com 2,15% em LIVE contra LIVE): nesse modo o Chromium alarga a viewport de layout para caber o conteúdo, e a largura final varia a cada carga, inclusive no LIVE e no espelho. Sem o modo `isMobile`, 44 de 46 estados ficaram idênticos.
- **`/about` depois de girar a tela** (até 3,85% a 768×1024, com o mesmo valor contra o espelho, e 6,23% a 414×896): a esfera de imagens termina em resultados diferentes a cada execução, e o LIVE produziu todos eles. A 414×896, duas execuções do LIVE diferem em 23.561 pixels entre si, e a réplica ficou a 53 pixels de uma delas.
- **`smoke-404`** (0,90–1,38%): captura em tempo real da rolagem dos dígitos.
- **Início atrasado de `work-roll`** (35,14–35,23% a 1366×768): o mesmo efeito do relógio falso, visto em mais de uma execução (ver "O desvio de `work-roll` a 390×844").
- **Cor do logo em toque** (0,32%, sorteada em cada carregamento): ocorre igualmente no LIVE.
- **Posição do menu nos primeiros 3,8 s** depois do `load`: varia a cada carregamento em todos os lados, porque o menu ainda está entrando.

**3. Diferenças intencionais**
- **Newsletter:** mostra o erro explicando a integração faltante, em vez de enviar ao Webflow Forms.
- **Google Analytics:** removido; o LIVE envia visitas, a réplica não.
- **`local-forms.js`:** um `<script>` e uma requisição a mais nas 17 páginas, necessários para a newsletter.
- **Inicialização da home:** um `<style>`, um `<script>` (`local-preloader.js`) e uma requisição a mais só na home. Em máquina livre, a abertura da réplica não parou no Chrome nem no Brave, de 1280 a 2560 px; sem a correção ela parava, como o site ao vivo a 1440 px. Com a GPU ocupada a 1440 px ainda para, e o vigia vai ao último quadro. O comportamento também muda num caso sem falha (o segundo clique no ENTER é ignorado) e nas falhas da tabela em "Inicialização da home".
- **`placeholder.60f9b1840c.svg`:** o LIVE recebe 403 e registra um erro de console; a réplica carrega a cópia local. Em ambos a imagem fica oculta, então o efeito visual é nenhum.
- **URLs dos ativos:** apontam para `/assets/...` em vez das CDNs.

**4. Hospedagem que um servidor local não reproduz** (sem efeito observado nas páginas)
- HTTP/1.1 em localhost, sem TLS, em vez de HTTPS e HTTP/2 por CDN; latência quase nula; ativos na mesma origem em vez de origens cruzadas.
- Cabeçalhos próprios da CDN (`Age`, `CF-*`, cookie `_cfuvid`, `x-wf-*`); `Location` relativo em vez de absoluto; valores de `ETag` e `Last-Modified`; tamanhos comprimidos.

**5. Peculiaridades do original mantidas de propósito** (iguais ao LIVE, listadas para não parecerem defeitos)
- `/films/thehousewife` dispara um `TypeError` no `app.js`, e a roda do mouse não rola a página.
- O trailer de `/films/by-any-means` aponta para uma página do YouTube e não toca.
- `/404` responde 200.
- Os erros de digitação e as seções ocultas estão em [docs/INVENTORY.md §g](docs/INVENTORY.md).
