# Tema "Sinal" (Fase 1)

Camada visual que traduz a réplica da Siena para uma linguagem de sinal de vídeo, inspirada em barras SMPTE e no Filmes HD Online Grátis. Estrutura, DOM, rotas, textos, filmes, logo e runtime continuam os da réplica. A Fase 1 não migra nada do outro site.

## Onde está

| Arquivo | O que faz |
|---|---|
| `public/assets/css/tema-sinal.css` | Toda a camada: fontes, tokens, superfícies, tipografia, botões, marcas de sinal e preloader. |
| `public/assets/fonts/tema/` | Archivo (eixos de largura e peso) e JetBrains Mono, em WOFF2, licença SIL OFL. |
| `src/layouts/BaseLayout.astro` | Duas linhas de `preload` das fontes no `head` e o `<link>` do CSS no `body`, depois do CSS original. Todas com `data-local-replica`. |
| `tools/legado-siena/theme-snapshot.mjs` | Captura os cenários determinísticos, com a geometria de cada elemento em cada estado. |
| `tools/legado-siena/theme-diff.mjs` | Compara duas capturas: estrutura, layout, visibilidade, página e linhas de estado. |
| `tools/legado-siena/theme-sheet.mjs` | Monta as folhas de antes e depois. |
| `tools/legado-siena/theme-textwrap.mjs` | Compara o número de linhas de cada texto, com e sem o tema. |
| `tools/legado-siena/theme-gen-ch.cjs` | Gera o bloco 3b do CSS. |
| `backups/pre-fase1-tema.tar.gz` | Ponto de retorno de código e estilos (607 KB, 204 arquivos), sem os vídeos, as imagens e `reference/`. |

`app.js`, `webflow.css` e `main.css` não foram alterados. Nenhum elemento novo entrou no DOM: as faixas, as scanlines e a carta de barras são pseudoelementos. As únicas adições são as três tags acima, marcadas com `data-local-replica`.

### Desligar ou voltar

- Para desligar o tema: remova as três tags de `BaseLayout.astro` e rode o build.
- Para voltar o código ao estado anterior, na raiz do projeto:

```bash
tar -xzf backups/pre-fase1-tema.tar.gz
```

Isso restaura os arquivos que existiam antes. `tema-sinal.css`, `fonts/tema/`, `docs/TEMA.md` e as ferramentas `theme-*` são novos: continuam na pasta, sem efeito, até serem apagados à mão.

## Tokens

Definidos no bloco 1 do CSS. Os valores da base e das barras foram medidos no Filmes HD Online Grátis, no Chrome real.

| Token | Valor | Uso |
|---|---|---|
| `--sinal-preto` | `#050506` | Fundo da página. |
| `--sinal-superficie-1` a `-3` | `#0a0b0c`, `#101113`, `#17191b` | Onde era o papel creme, do mais fundo ao mais elevado. |
| `--sinal-ingresso` | `#1e2124` | Corpo dos ingressos. Mais claro que as superfícies, para a silhueta e os furos aparecerem. |
| `--sinal-linha`, `--sinal-linha-forte` | `#23262a`, `#33373c` | Linhas contínuas. |
| `--sinal-linha-tracejada` | `#5c6168` | Tracejados, que precisam de mais luz para ler como linha. |
| `--sinal-texto`, `-2`, `-3` | `#e8e9ea`, `#9ba0a6`, `#868c93` | Texto principal e dois níveis atenuados. |
| `--smpte-*` | barras a 75% (`#c0c0c0`, `#c0c000`, `#00c0c0`, `#00c000`, `#c000c0`, `#c00000`, `#0000c0`) | Faixas e carta de barras. |
| `--acento-*` | `#45d145`, `#d6d63b`, `#3bd6d6`, `#e85ae8`, `#f0564b` | As mesmas cores, clareadas para ler sobre o preto. |

As cores só entram por função:

| Token de função | Cor | Onde aparece |
|---|---|---|
| `--cor-ativo`, `--cor-ativo-fundo` | verde | Modo ligado no Work, marcador do carrossel, filme atual no menu, foco, seleção de texto, cursor da newsletter, hover de ENTER, EXPLORE, CLOSE e do cartão ALL WORK (neste, só contorno e texto). |
| `--cor-navegacao` | ciano | Hover de links, menus e linhas do menu rápido. |
| `--cor-gravacao` | vermelho | Play, trailer, EMAIL US, rótulo de Contact, hover das críticas, erro de formulário. |
| `--cor-destaque` | amarelo | Rótulos de seção sobre superfície nos estudos de caso, como nas fichas de referência. |
| `--contato-fundo` | preto | Fundo de Contact, que era vermelho no original. Mudar este token devolve a cor à página. |

Outros tokens: `--faixa-smpte` e `--faixa-altura` (a faixa de 7 barras), `--scan-alfa`, `--vinheta-alfa`, `--ruido`, `--aberracao`, `--font-display`, `--font-display-leve`, `--font-texto` e `--font-rotulo`. O bloco original (`--black`, `--white`, `--red`, `--gold`, `--gray`) aponta para esses tokens.

## Tratamentos

- **Barras:** só em quatro lugares. Faixa de 3 px no topo de todas as páginas, faixa de separação no rodapé, a carta de ajuste da abertura e a microbarra de 22 px do cursor.
- **Cursor:** uma mira de calibração em `local-cursor.js` e no bloco 8c de `tema-sinal.css`, com anel, ponto central e a microbarra. O ponto fica exatamente sob o mouse, e o anel o segue com um pequeno atraso. Muda para link, arrasto, play e setas. Com toque, movimento reduzido, contraste alto e cores forçadas, volta o cursor do sistema.
- **Monitor:** scanlines a 4%, vinheta leve e um ruído estático quase invisível, num único pseudoelemento fixo do `body`, sem animação e sem `mix-blend-mode`. Essa camada fica sobre tudo, inclusive os filmes, que não recebem nenhum outro filtro. A força está em `--scan-alfa`, `--vinheta-alfa` e no `slope` de `--ruido`.
- **Títulos grandes:** um desvio de cor de 0,012 em nas bordas, como no site de referência.
- **Abertura:** "o sinal encontra o cinema", sem vídeo desde a Fase 2. O `<video>` da abertura fica vazio porque o `app.js` exige o elemento. Começa em preto total, inclusive a faixa do topo; um traço fino de sincronismo cresce na altura do nome. A carta SMPTE chega em seis faixas, cada uma uma camada do tamanho dela, deslocadas de lado e fora de fase, que se acertam em duas correções de horizontal. Na captura, a carta se comprime no traço e o nome abre dele, com as letras recortadas nas barras (`background-clip: text` com `--faixa-smpte`); depois uma cópia branca cobre as cores e o nome repousa branco sobre preto até o ENTER, que vem do timer do `app.js` (5,8 s depois do primeiro quadro da abertura, ou 3,5 s com movimento reduzido). Ao apertar ENTRAR, o nome se comprime numa linha. Os tempos ficam nas variáveis `--linha0`, `--sinal0`, `--captura`, `--nome0` e `--branco0` de `.abertura`; a faixa do topo da página espera fixos 6,4 s (3,3 s com movimento reduzido), porque corre noutro relógio, e uma cópia dentro da abertura acende com a carta.
- **Favicon:** a forma da máscara, com transparência e um halo de 1 px no tom contrário. Pelo SVG, branca com o sistema no escuro e quase preta no claro; o halo contorna a forma quando a guia e a página discordam do tema.
- **Ingressos:** silhueta, furos e tracejado preservados, em cinza escuro em vez de creme. O hover usa as cores de função.
- **Timecode e canal:** o tempo do player e os números do menu (01, 02, 03) passaram para a letra mono. Não há timecode correndo nem marca de canal fixa.
- **Ritmo dos estudos de caso:** o corte entre o antigo papel e as seções pretas virou um fio neutro de 1 px, em `box-shadow`, sem ocupar espaço.
- **Impressão:** o bloco 9 tira as marcas de monitor e troca os tokens por tinta sobre papel.

## Tipografia

| Antes | Depois | Por quê |
|---|---|---|
| Neue Brucke | `Sinal Display`: Archivo 800, largura 77% | Largura média igual à original. |
| Neue Brucke, títulos da home e do Work | `Sinal Titulo`: Archivo 800, largura 75%, sem kerning | O bundle divide esses títulos em letras, que perdem o kerning. Assim a linha medida é a linha final. |
| Neue Brucke, números do menu | `Sinal Numero`: JetBrains Mono 500 com as métricas da Neue Brucke | Mono como número de canal, sem mudar a altura da linha. |
| Neue Brucke em rótulos e textos pequenos, até cerca de 25 px | `Sinal Display Leve`: Archivo 600, largura 82% | O peso 800 empasta em tamanhos pequenos. |
| NB International | `Sinal Texto`: Archivo 400, largura 101%, com a faixa de pesos | Mantém o negrito das páginas legais. |
| P22 Parrish Roman | `Sinal Rotulo`: JetBrains Mono 500 | Rótulos de transmissão. |

Cada família usa `ascent-override` e `descent-override` da fonte que substitui, então as caixas de texto têm a mesma altura e o mesmo alinhamento.

**Unidade `ch`:** o CSS original usa `ch` em 37 regras de largura, e `ch` depende da largura do "0" de cada fonte. O bloco 3b repete essas regras em `em`, com a proporção da fonte original (`--ch-display` e `--ch-texto`), na mesma ordem e nos mesmos breakpoints. Ele é gerado por `tools/theme-gen-ch.cjs`.

**Corrida entre fontes e runtime:** no build original, o `app.js` dividia os títulos antes de a fonte carregar, às vezes com a métrica da fonte de reserva, e isso mudava as quebras no celular em visitas sem cache. O kit de comparação sempre esperou as fontes. Com o `preload` do tema, a fonte chega antes e a divisão usa a letra real, que é o mesmo estado comparado pelo kit. Numa conexão muito lenta a corrida ainda pode acontecer, porque o bundle divide as linhas uma vez só. Para isso, os títulos têm uma reserva local, `Sinal Reserva` (Arial a 84%), com largura parecida.

## O que a Fase 2 aproveitou

- Paleta e fontes ficam nos blocos 0 e 1, sem valor preso a um filme.
- Títulos, nomes e imagens vêm do conteúdo. O tema não tem texto próprio, exceto o que está no DOM da réplica.
- `Sinal Titulo` e os ajustes de `letter-spacing` do bloco 3 foram medidos com os títulos da Siena. Na Fase 2 os títulos mudaram: os ajustes foram refeitos no bloco 3d, e `tools/testes/paginas.mjs` confere corte e quebra nos títulos novos.
- O logo é o símbolo em máscara mais o nome em texto (bloco 7d), e o tema define a cor dele.
- `--sinal-linha`, `--sinal-texto-3` e `--acento-magenta` fazem parte da paleta medida e ainda não têm uso. Ficaram reservados para a Fase 2.
- As fontes são o recorte latino, que cobre os acentos do português.
