// Gera as imagens de compartilhamento em public/og/, 1200x630, JPEG:
//   padrao-v2.jpg  a imagem padrão do site: o símbolo e o nome, e nenhum outro texto. O nome vai em três linhas grandes entre
//                  fios, como "CURADORIA / CINEMA / AO VIVO" no rodapé, com a faixa de cores embaixo e as linhas de varredura
//                  do monitor. A mesma imagem é gravada também em padrao.jpg, para que os links antigos sigam valendo; o
//                  nome novo fura o cache das redes, que guardam a imagem pela URL.
//   <slug>.jpg     cena da sessão escurecida, símbolo, nome, data, hora, sala e título
// Lê src/data/sessoes/*.json direto e monta cada imagem num navegador sem janela, com as fontes e as cores do tema.
// O símbolo é a máscara de tools/marca.mjs; o nome é só tipografia.
//   node tools/gerar-og.mjs            todas
//   node tools/gerar-og.mjs <slug>     uma sessão e a padrão
//   node tools/gerar-og.mjs padrao     só a padrão
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const ROOT = path.resolve(import.meta.dirname, '..');
const PUBLICO = path.join(ROOT, 'public');
const DADOS = path.join(ROOT, 'src/data/sessoes');
const SAIDA = path.join(PUBLICO, 'og');
const ORIGEM = 'http://og.local';
const NOME = 'Filmes HD Online Grátis';
const PADRAO = 'padrao-v2.jpg';
const SO = process.argv[2];
const SO_PADRAO = SO === 'padrao';

const esc = (t) => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const BASE = `
html, body { margin: 0; width: 1200px; height: 630px; overflow: hidden; background: #000; color: var(--sinal-texto); }
body::before { display: none; }
.simbolo { background: currentColor; -webkit-mask: url(/assets/img/site/simbolo-mascara.webp) center / auto 128.3% no-repeat; mask: url(/assets/img/site/simbolo-mascara.webp) center / auto 128.3% no-repeat; aspect-ratio: .8; }
.faixa { position: absolute; left: 0; right: 0; bottom: 0; height: 12px; background: var(--faixa-smpte); }
`;

function padrao() {
  // o símbolo à esquerda, na altura do bloco do nome; o bloco centrado na vertical, com os fios indo até a borda direita
  const linhas = ['Filmes HD', 'Online', 'Grátis'];
  if (linhas.join(' ') !== NOME) throw new Error('o nome da imagem padrão mudou');
  return `
  <style>${BASE}
    body::after { content: ""; position: absolute; inset: 0; pointer-events: none;
      background: repeating-linear-gradient(rgb(0 0 0 / .18) 0 1px, transparent 1px 3px), radial-gradient(120% 95% at 50% 50%, transparent 58%, rgb(0 0 0 / .55) 100%); }
    main { position: absolute; inset: 0 0 12px; display: flex; align-items: center; padding-left: 92px; gap: 54px; }
    .simbolo { flex: none; height: 352px; }
    h1 { flex: 1; margin: 0; font: 800 122px/.86 var(--font-display); text-transform: uppercase; text-shadow: var(--aberracao); }
    h1 span { display: block; padding: 12px 0 6px; border-bottom: 1px solid rgb(232 233 234 / .38); }
    h1 span:first-child { border-top: 1px solid rgb(232 233 234 / .38); }
  </style>
  <main><div class="simbolo"></div><h1>${linhas.map((l) => `<span>${esc(l)}</span>`).join('')}</h1></main>
  <div class="faixa"></div>`;
}

function sessao(s) {
  const titulo = s.tituloCurto ?? s.titulo;
  const [a, m, d] = s.sessao.data.split('-');
  return `
  <style>${BASE}
    .fundo { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; filter: brightness(.5) saturate(.85); }
    .veu { position: absolute; inset: 0; background: linear-gradient(rgb(0 0 0 / .55), rgb(0 0 0 / .1) 34%, rgb(0 0 0 / .78) 72%, rgb(0 0 0 / .94)); }
    .marca { position: absolute; left: 56px; top: 44px; display: flex; align-items: center; gap: 16px; }
    .marca .simbolo { height: 84px; }
    .marca span { font: 600 25px/1.14 var(--font-display-leve); letter-spacing: .03em; text-transform: uppercase; }
    .texto { position: absolute; left: 56px; right: 56px; bottom: 52px; }
    .quando { font: 500 26px/1 var(--font-rotulo); letter-spacing: .14em; text-transform: uppercase; color: var(--sinal-texto); }
    h1 { margin: 22px 0 0; font: 800 104px/1.04 var(--font-display); word-spacing: .06em; text-transform: uppercase; text-wrap: balance; text-shadow: var(--aberracao); }
  </style>
  <img class="fundo" src="/assets/img/sessoes/${s.slug}/hero-1600.webp" alt="">
  <div class="veu"></div>
  <div class="marca"><div class="simbolo"></div><span>Filmes HD<br>Online Grátis</span></div>
  <div class="texto"><div class="quando">${d}/${m}/${a} · ${s.sessao.hora} · ${esc(s.sessao.sala)}</div><h1>${esc(titulo)}</h1></div>
  <div class="faixa"></div>`;
}

function documento(corpo) {
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><link rel="stylesheet" href="/assets/css/tema-sinal.css"></head><body>${corpo}</body></html>`;
}

const sessoes = fs
  .readdirSync(DADOS)
  .filter((f) => f.endsWith('.json') && !f.startsWith('_'))
  .map((f) => JSON.parse(fs.readFileSync(path.join(DADOS, f), 'utf8')))
  .filter((s) => !SO_PADRAO && (!SO || s.slug === SO));
if (SO && !SO_PADRAO && !sessoes.length) throw new Error(`sessão desconhecida "${SO}"`);
for (const s of sessoes) {
  const hero = path.join(PUBLICO, `assets/img/sessoes/${s.slug}/hero-1600.webp`);
  if (!fs.existsSync(hero)) throw new Error(`${s.slug}: falta ${hero}. Rode npm run imagens.`);
}

fs.mkdirSync(SAIDA, { recursive: true });

async function abrir() {
  for (const channel of ['msedge', 'chrome', undefined]) {
    try {
      return await chromium.launch({ channel, headless: true });
    } catch {
      // tenta o próximo navegador instalado
    }
  }
  throw new Error('nenhum navegador disponível para o Playwright');
}

const navegador = await abrir();
const contexto = await navegador.newContext({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
const pagina = await contexto.newPage();
// Nenhum servidor: cada pedido vai direto para public/; o documento vem desta variável.
let html = '';
await contexto.route(`${ORIGEM}/**`, (route) => {
  const url = new URL(route.request().url());
  if (url.pathname === '/') return route.fulfill({ contentType: 'text/html; charset=utf-8', body: html });
  return route.fulfill({ path: path.join(PUBLICO, decodeURIComponent(url.pathname)) });
});

async function gerar(arquivo, corpo) {
  html = documento(corpo);
  await pagina.goto(`${ORIGEM}/`, { waitUntil: 'networkidle' });
  await pagina.evaluate(async () => {
    await Promise.all([document.fonts.load('800 80px "Sinal Display"'), document.fonts.load('600 25px "Sinal Display Leve"'), document.fonts.load('500 25px "Sinal Rotulo"')]);
    await document.fonts.ready;
    await Promise.all([...document.images].map((i) => i.decode().catch(() => {})));
    // o título ocupa no máximo 2 linhas e não passa da margem
    const t = document.querySelector('.texto h1');
    if (t) {
      const cabe = () => t.getBoundingClientRect().height <= parseFloat(getComputedStyle(t).fontSize) * 1.04 * 2 + 1 && t.scrollWidth <= t.clientWidth;
      for (let tam = 104; tam > 48 && !cabe(); tam -= 2) t.style.fontSize = `${tam - 2}px`;
    }
  });
  await pagina.waitForTimeout(80);
  await pagina.screenshot({ path: path.join(SAIDA, arquivo), type: 'jpeg', quality: 84 });
  console.log(`og/${arquivo} ${Math.round(fs.statSync(path.join(SAIDA, arquivo)).size / 1024)} KB`);
}

await gerar(PADRAO, padrao());
// a URL antiga continua servindo a imagem padrão, agora a nova
fs.copyFileSync(path.join(SAIDA, PADRAO), path.join(SAIDA, 'padrao.jpg'));
console.log(`og/padrao.jpg = og/${PADRAO}`);
for (const s of sessoes) await gerar(`${s.slug}.jpg`, sessao(s));
await navegador.close();
