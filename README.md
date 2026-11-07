# Filmes HD Online Grátis

Site da curadoria de cinema Filmes HD Online Grátis: sessões ao vivo na Sala 24, no Discord, com programação, arquivo e uma página crítica por sessão. O site não hospeda nem exibe filmes.

Feito em **Astro 7**, gera páginas estáticas. A estrutura, as animações e as interações vêm de um runtime original (`public/assets/js/app.js`, com GSAP, Lenis, Taxi.js, Howler e WebGL próprio), guiado por classes e atributos do HTML. A identidade visual é o [Tema Sinal](docs/TEMA.md).

| Documento | Conteúdo |
|---|---|
| [docs/FASE2.md](docs/FASE2.md) | Decisões, mapeamento dos blocos, funcionalidades do site antigo, **como cadastrar uma sessão**, correções de dados e evidência dos testes |
| [docs/TEMA.md](docs/TEMA.md) | Tokens e tratamentos do Tema Sinal |
| [docs/historico/](docs/historico/) | A réplica da Siena: README original, com toda a investigação da inicialização, e o inventário das páginas antigas |

## Como rodar

Node.js 22.23.4 ou mais recente (testado com o 24.19).

```bash
npm install
```

```bash
npm run start
```

Gera `dist/` e serve em **http://localhost:4322** com `tools/serve.mjs`, que responde como a hospedagem final: aplica os cabeçalhos de `vercel.json` (CSP, COOP, cache) e redireciona `/programacao` para `/programacao/`. O servidor de desenvolvimento (`npm run dev`) fica na 4321.

| Comando | O que faz |
|---|---|
| `npm run dev` | Astro em desenvolvimento, porta 4321 |
| `npm run build` | Gera `dist/` |
| `npm run preview` | Serve um `dist/` já gerado na 4322 |
| `npm run imagens` | Baixa e gera as imagens das sessões. Aceita um slug; `--forcar` refaz |
| `npm run og` | Gera os cartões de compartilhamento em `public/og/` |
| `npm run textos` | Confere o texto editorial além do que o build valida |
| `npm run tutorial` | Regrava o vídeo do tutorial a partir da home servida na 4322 |
| `npm run marca` | Gera favicon, máscara e cartão de teste a partir de `reference/brand/simbolo.png` |
| `node tools/patch-bundle.mjs` | Reaplica as edições locais do `app.js` e do `main.css`; rodar de novo não altera nada |

## Como cadastrar uma sessão

Um arquivo por sessão em `src/data/sessoes/`, sem banco de dados. A home se reorganiza sozinha quando a data chega. O passo a passo está em [docs/FASE2.md](docs/FASE2.md#4-como-cadastrar-uma-sessão), e o modelo em `src/data/sessoes/_modelo.json`.

## Arquitetura

```
src/
  data/sessoes/*.json     uma sessão por arquivo; index.ts valida com zod
  data/films.ts           visão das sessões que os componentes consomem
  data/site.ts            nome, rotas, canais e menus
  components/
    SessoesOrdem.astro    ordem e estado das sessões, decididos no navegador
    home/ work/ case/ about/ contact/ legal/ nav/ footer/ ui/
  layouts/BaseLayout.astro
  pages/                  index, programacao, sobre, contato, cookies, termos, privacidade, 404,
                          sessoes/[slug], rss.xml, sitemap.xml
public/
  assets/js/app.js        runtime original, com as edições de tools/patch-bundle.mjs
  assets/js/local-*.js    camada local: imagens, abertura, menu, trailer e cursor
  assets/css/tema-sinal.css
  assets/img/sessoes/     imagens de cada sessão, geradas
  og/                     cartões de compartilhamento, gerados
tools/
  testes/                 testes atuais, ver abaixo
  legado-siena/           ferramentas da réplica; não rodar
reference/                histórico: capturas, HTML original, binários retirados, relatórios da Fase 2
```

**Ordem das sessões.** `SessoesOrdem.astro` é um script inline com `data-taxi-reload`: roda depois do DOM e antes do `app.js` e dos módulos, no primeiro carregamento e em toda navegação do Taxi, inclusive de página em cache. Ele ordena as listas pelo relógio de São Paulo, sem novo deploy e sem corrida com o WebGL. Ordem e aba aberta estão em [docs/FASE2.md](docs/FASE2.md).

**Edições no runtime.** Ficam todas em `tools/patch-bundle.mjs`: o giro de entrada para no primeiro item, o rótulo `ROLAR`, que o cursor do tema deixou fora da tela, a tecla de depuração retirada, o rollover sem layout por letra, as regras por filme do `main.css`, as leituras que andam sozinhas e, na volta à home, uma textura por imagem e o descarte do que saiu da tela.

## Testes

Testam o build na 4322. Sobem navegador sem janela, menos os três marcados como janela real, que abrem o Chrome e o Brave instalados.

| Comando | O que confere |
|---|---|
| `node tools/testes/varredura.mjs` | Marca antiga, filmes de demonstração, estrelas, promessas e links em todo o `dist/` |
| `node tools/testes/ordem.mjs` | Ordem com relógio controlado, exceções de dia e hora, virada do dia, fusos, aba aberta |
| `node tools/testes/paginas.mjs` | Toda página em cada tamanho: console, rede, CSP, corte de texto, dados contra o JSON, links |
| `node tools/testes/trailers.mjs` | Todos os trailers tocando e todos os caminhos de fechar |
| `node tools/testes/interacoes.mjs` | Teclado, mouse, toque, som, menu, filtro, cadeia de navegação, RSS e peso |
| `node tools/testes/abertura.mjs` | Tempos do ENTER e da home, quadros da abertura, caminhos de falha |
| `node tools/testes/identidade.mjs` | Abertura, cartão, trailer, leituras, canais, cursor e ida e volta à home a 320, 390, 820, 1440 e 1920 px. Janela real só na parte `aba` |
| `node tools/testes/janela-real.mjs` | Janela real: primeira visita, tutorial, rolo e um trailer no Chrome e no Brave |
| `node tools/testes/volta-home.mjs` | Janela real: pausas na volta à home, com e sem cache, com antes e depois por `--referencia` |

Cada suíte aceita `--url` e `--canal=msedge|chrome`. Rode uma por vez: elas usam a GPU, e o PC do proprietário já desligou sozinho durante rodadas longas e paralelas.

## Inicialização da home

A primeira visita antiga podia travar no vídeo da abertura, em Chrome e Brave reais, por causa do decodificador. A investigação está em [docs/historico/README-replica-siena.md](docs/historico/README-replica-siena.md). Na Fase 2 o vídeo saiu: a abertura, "o sinal encontra o cinema", é feita em CSS (preto, traço de sincronismo, carta SMPTE fora de fase, captura, nome, repouso, ENTER por volta de 6 s), sem decodificador nenhum. A ordem é conferida por `tools/testes/abertura.mjs` e `janela-real.mjs`, que leem o tempo das próprias animações e os pixels dos primeiros quadros.

`public/assets/js/local-preloader.js` e `local-imagens.js` continuam observando a carga e só agem sobre um estado que falhou:

| Estado que falhou | No runtime original | Agora |
|---|---|---|
| Imagem de textura falha | Home oculta para sempre | A imagem vira um pixel transparente e a home segue |
| Máscara do WebGL falha | Nenhum filme aparece | Vira um pixel branco: os filmes aparecem sem recorte |
| `app.js` falha ou WebGL indisponível | Sem ENTER, preso | ENTER de reserva aos 5,8 s quando a abertura toca (3,5 s com movimento reduzido ou na volta dentro da hora) e home em coluna simples, com rolagem |
| Contexto WebGL perdido | Filmes somem | Mostra as imagens do DOM |
| Segundo clique no ENTER | Tutorial roda de novo | Só o primeiro clique vale |
| Home oculta 12 s depois de o overlay sair e da última textura, ou 120 s com textura pendente | Continua oculta | Libera a home |

Depois do ENTER, `window.__localPreloader.log` mostra o que aconteceu naquela carga.
