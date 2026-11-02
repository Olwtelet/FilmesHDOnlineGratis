// Abertura da home contra o build em produção: tempos do ENTER e da home, quadros do primeiro carregamento, caminhos de falha
// e visita de volta. Sempre headless. Rode com nada mais usando a máquina: os tempos são a parte que importa aqui.
//   node tools/testes/abertura.mjs [--url=http://localhost:4322] [--canal=msedge] [--n=8] [--partes=tempos,quadros,falhas,retorno] [--saida=pasta]
// Referência dos tempos: o site original da Siena medido nesta máquina em 02/11/2026 (Edge a 1440x900, n=6). O ENTER da visita limpa lá
// depende da rede, então esse fica o do protótipo em reference/fase2/relatorios/preloader.md, seção 5. Em outra máquina, meça de novo.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { chromium } from 'playwright';
import sharp from 'sharp';

const arg = (n, d) => (process.argv.find((a) => a.startsWith(`--${n}=`)) || `--${n}=${d}`).split('=').slice(1).join('=');
const URL_BASE = arg('url', 'http://localhost:4322').replace(/\/$/, '');
const CANAL = arg('canal', 'msedge');
const N = +arg('n', 8);
const PARTES = arg('partes', 'tempos,quadros,falhas,retorno').split(',');
const SAIDA = path.resolve(arg('saida', path.join(os.tmpdir(), 'fhdog-abertura')));
const REF = { enterLimpa: 3751.5, enterCache: 3736, homeLimpa: 1709.5, homeCache: 1712.5 };
const FOLGA = 50;
const CELULAR = {
  viewport: { width: 390, height: 844 },
  hasTouch: true,
  isMobile: true,
  userAgent: 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36',
};
fs.mkdirSync(SAIDA, { recursive: true });

const resultados = [];
function confere(nome, ok, detalhe = '') {
  resultados.push({ nome, ok });
  console.log(`${ok ? 'ok   ' : 'FALHA'} ${nome}${detalhe ? `  ${detalhe}` : ''}`);
}
const mediana = (a) => {
  const s = [...a].sort((x, y) => x - y);
  const m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};

// Marca em cada quadro quando o ENTER aparece, quando o clique acontece e quando a home fica visível.
const SONDA = () => {
  const m = (window.__m = { longas: [], enter: null, clique: null, home: null, abertura: false, video: [] });
  try {
    new PerformanceObserver((l) => { for (const e of l.getEntries()) m.longas.push([Math.round(e.startTime), Math.round(e.duration)]); }).observe({ type: 'longtask', buffered: true });
  } catch {}
  document.addEventListener('click', () => { if (m.clique === null) m.clique = performance.now(); }, true);
  // Nada de ler estilo ou layout a cada quadro: durante a carga isso mede a própria sonda. O botão avisa quando o bundle mexe nele.
  document.addEventListener('DOMContentLoaded', () => {
    const btn = document.querySelector('[data-preloader="btn"]');
    if (!btn) return;
    const ver = () => { if (m.enter === null && getComputedStyle(btn).visibility === 'visible') m.enter = performance.now(); };
    new MutationObserver(ver).observe(btn, { attributes: true, attributeFilter: ['style', 'class'] });
    ver();
  });
  setInterval(() => {
    const ab = document.querySelector('.abertura');
    if (ab && ab.getClientRects().length > 0) m.abertura = true;
  }, 300);
  const olhar = () => {
    if (m.clique !== null && m.home === null) {
      const c = getComputedStyle(document.querySelector('[data-taxi]'));
      if (c.visibility !== 'hidden' && +c.opacity > 0.01) m.home = performance.now();
    }
    requestAnimationFrame(olhar);
  };
  requestAnimationFrame(olhar);
};

function novosErros(page) {
  const erros = [];
  page.on('pageerror', (e) => erros.push(`exceção: ${e}`));
  page.on('console', (m) => { if (m.type() === 'error' && !/ERR_ABORTED|ERR_FAILED|Failed to load resource/.test(m.text())) erros.push(m.text()); });
  return erros;
}
const lerM = (page) => page.evaluate(() => window.__m);

async function visita(page, limite = 60000) {
  await page.goto(`${URL_BASE}/`, { waitUntil: 'commit', timeout: limite });
  await page.waitForFunction(() => window.__m && window.__m.enter !== null, null, { timeout: limite });
  // o bundle libera o clique com a transição do botão já em andamento
  await page.waitForFunction(() => { const b = document.querySelector('[data-preloader="btn"]'); return b && b.onclick && +getComputedStyle(b).opacity > 0.5; }, null, { timeout: limite });
  await page.click('[data-preloader="btn"]', { timeout: limite });
  await page.waitForFunction(() => window.__m.home !== null, null, { timeout: limite });
  const m = await lerM(page);
  return { enter: m.enter, home: m.home - m.clique, longa: Math.max(0, ...m.longas.filter((l) => l[0] < m.enter).map((l) => l[1])) };
}

const browser = await chromium.launch({ channel: CANAL, headless: true });

if (PARTES.includes('tempos')) {
  const limpa = [];
  const cache = [];
  for (let i = 0; i < N; i++) {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    await ctx.addInitScript(SONDA);
    const page = await ctx.newPage();
    const erros = novosErros(page);
    limpa.push(await visita(page));
    await ctx.clearCookies();
    await page.waitForTimeout(1500); // deixa o cache gravar as respostas
    const pagina2 = await ctx.newPage();
    await page.close();
    cache.push(await visita(pagina2));
    if (erros.length) confere(`tempos ${i}: console limpo`, false, erros.slice(0, 2).join(' | '));
    await ctx.close();
  }
  const fmt = (a, k) => `${mediana(a.map((x) => x[k])).toFixed(1)} (${Math.min(...a.map((x) => x[k])).toFixed(0)} a ${Math.max(...a.map((x) => x[k])).toFixed(0)})`;
  const gate = (nome, a, k, ref) => {
    const m = mediana(a.map((x) => x[k]));
    confere(`${nome}: dentro de ${FOLGA} ms de ${ref}`, Math.abs(m - ref) <= FOLGA, `${fmt(a, k)} ms, n=${a.length}`);
  };
  gate(`${CANAL} limpa: ENTER`, limpa, 'enter', REF.enterLimpa);
  gate(`${CANAL} com cache: ENTER`, cache, 'enter', REF.enterCache);
  gate(`${CANAL} limpa: home depois do clique`, limpa, 'home', REF.homeLimpa);
  gate(`${CANAL} com cache: home depois do clique`, cache, 'home', REF.homeCache);
  console.log(`info  tarefa longa antes do ENTER, limpa ${fmt(limpa, 'longa')} ms; com cache ${fmt(cache, 'longa')} ms`);
}

// Quadros reais do primeiro carregamento, para conferir com os olhos: nenhum quadro da marca antiga, retângulo ou tela sem estilo.
async function folhaDeQuadros(rotulo, opcoes, atrasar) {
  const ctx = await browser.newContext(opcoes);
  const page = await ctx.newPage();
  if (atrasar) await page.route(atrasar, async (r) => { await new Promise((f) => setTimeout(f, 1500)); await r.continue(); });
  const cdp = await ctx.newCDPSession(page);
  const quadros = [];
  cdp.on('Page.screencastFrame', async (f) => {
    quadros.push({ t: f.metadata.timestamp, data: f.data });
    await cdp.send('Page.screencastFrameAck', { sessionId: f.sessionId }).catch(() => {});
  });
  await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 60, everyNthFrame: 1, maxWidth: 480, maxHeight: 480 });
  await page.goto(`${URL_BASE}/`, { waitUntil: 'commit', timeout: 60000 });
  await page.waitForFunction(() => { const b = document.querySelector('[data-preloader="btn"]'); return b && b.onclick && +getComputedStyle(b).opacity > 0.9; }, null, { timeout: 60000 });
  await cdp.send('Page.stopScreencast');
  await ctx.close();
  if (quadros.length < 8) {
    confere(`quadros ${rotulo}: capturados`, false, `${quadros.length}`);
    return;
  }
  const t0 = quadros[0].t;
  const passo = Math.max(1, Math.floor(quadros.length / 24));
  const escolhidos = quadros.filter((_, i) => i % passo === 0).slice(0, 24);
  const blocos = await Promise.all(escolhidos.map((q) => sharp(Buffer.from(q.data, 'base64')).resize(240, 240, { fit: 'contain', background: '#333' }).jpeg().toBuffer()));
  const composicao = blocos.map((input, i) => ({ input, left: (i % 6) * 244, top: Math.floor(i / 6) * 244 }));
  const destino = path.join(SAIDA, `quadros-${rotulo}.jpg`);
  await sharp({ create: { width: 6 * 244, height: Math.ceil(blocos.length / 6) * 244, channels: 3, background: '#111' } }).composite(composicao).jpeg({ quality: 80 }).toFile(destino);
  confere(`quadros ${rotulo}: folha gerada`, true, `${quadros.length} quadros em ${(quadros.at(-1).t - t0).toFixed(1)} s, ${destino}`);
}
if (PARTES.includes('quadros')) {
  await folhaDeQuadros('1440', { viewport: { width: 1440, height: 900 } });
  await folhaDeQuadros('390', CELULAR);
  await folhaDeQuadros('1440-css-lento', { viewport: { width: 1440, height: 900 } }, '**/tema-sinal.css');
  await folhaDeQuadros('1440-fonte-lenta', { viewport: { width: 1440, height: 900 } }, '**/archivo-*.woff2');
}

async function caminhoDeFalha(nome, { bloquear, navegador = browser, opcoes = {}, depois }) {
  const ctx = await navegador.newContext({ viewport: { width: 1440, height: 900 }, ...opcoes });
  await ctx.addInitScript(SONDA);
  const page = await ctx.newPage();
  const erros = novosErros(page);
  if (bloquear) await page.route(bloquear, (r) => r.abort());
  let chegou = true;
  try {
    await visita(page, 45000);
  } catch (e) {
    chegou = false;
    console.log(`info  ${nome}: ${String(e).split('\n')[0]}`);
  }
  const estado = await page.evaluate(() => ({
    log: (window.__localPreloader?.log || []).map((l) => l[1]),
    overlay: !!document.querySelector('[data-preloader="w"]') && document.querySelector('[data-preloader="w"]').getClientRects().length > 0,
  })).catch(() => ({ log: [], overlay: null }));
  confere(`falha, ${nome}: ENTER aparece e a home abre`, chegou, estado.log.join(', '));
  if (depois) await depois(page, estado);
  const reais = erros.filter((e) => !/WebGL|renderer|context/i.test(e));
  if (reais.length) console.log(`info  ${nome}: console ${reais.slice(0, 2).join(' | ')}`);
  await ctx.close();
}
if (PARTES.includes('falhas')) {
  await caminhoDeFalha('máscara do WebGL abortada', {
    bloquear: '**/all-masks.webp',
    depois: async (page) => {
      const falhou = await page.evaluate(() => window.__imagens.falhas.some((s) => /all-masks/.test(s)));
      confere('falha, máscara: registrada e trocada', falhou);
    },
  });
  await caminhoDeFalha('uma textura abortada', { bloquear: '**/assets/img/sessoes/pulp-fiction-1994/hero-1600.webp' });
  await caminhoDeFalha('app.js bloqueado', { bloquear: '**/assets/js/app.js' });
  await caminhoDeFalha('movimento reduzido', { opcoes: { reducedMotion: 'reduce' } });
  const semWebgl = await chromium.launch({ channel: CANAL, headless: true, args: ['--disable-3d-apis'] });
  await caminhoDeFalha('WebGL indisponível', { navegador: semWebgl });
  await semWebgl.close();
}

if (PARTES.includes('retorno')) {
  // Cookie de 5 minutos: nada da abertura aparece em quadro nenhum
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    await ctx.addCookies([{ name: 'preloader_shown', value: String(Date.now() - 3e5), url: URL_BASE }, { name: 'tutorial_shown', value: 'true', url: URL_BASE }]);
    await ctx.addInitScript(SONDA);
    const page = await ctx.newPage();
    await page.goto(`${URL_BASE}/`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForFunction(() => { const t = document.querySelector('[data-taxi]'); return t && getComputedStyle(t).visibility !== 'hidden'; }, null, { timeout: 60000 });
    await page.waitForTimeout(1500);
    const m = await lerM(page);
    confere('volta dentro da hora: sem abertura nem ENTER', !m.abertura && m.enter === null, JSON.stringify({ abertura: m.abertura, enter: m.enter }));
    await ctx.close();
  }
  // Cookie de 2 horas: a abertura toca de novo
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    await ctx.addCookies([{ name: 'preloader_shown', value: String(Date.now() - 72e5), url: URL_BASE }, { name: 'tutorial_shown', value: 'true', url: URL_BASE }]);
    await ctx.addInitScript(SONDA);
    const page = await ctx.newPage();
    await page.goto(`${URL_BASE}/`, { waitUntil: 'commit', timeout: 60000 });
    await page.waitForFunction(() => window.__m && window.__m.enter !== null, null, { timeout: 60000 });
    const m = await lerM(page);
    confere('volta depois da hora: a abertura toca', m.abertura, `ENTER em ${m.enter.toFixed(0)} ms`);
    await ctx.close();
  }
  // Primeira visita: cookies gravados pelo clique, tutorial com vídeo só depois do ENTER
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    await ctx.addInitScript(SONDA);
    const page = await ctx.newPage();
    const videos = [];
    let cliqueEm = null;
    page.on('request', (r) => { if (/\.(mp4|webm)(\?|$)/.test(r.url())) videos.push({ url: r.url(), depoisDoClique: cliqueEm !== null }); });
    await page.goto(`${URL_BASE}/`, { waitUntil: 'commit', timeout: 60000 });
    await page.waitForFunction(() => { const b = document.querySelector('[data-preloader="btn"]'); return window.__m && b && b.onclick && +getComputedStyle(b).opacity > 0.5; }, null, { timeout: 60000 });
    confere('primeira visita: nenhum vídeo pedido antes do ENTER', videos.length === 0, videos.map((v) => v.url).join());
    cliqueEm = Date.now();
    await page.click('[data-preloader="btn"]');
    await page.waitForTimeout(4500);
    const cookies = await ctx.cookies();
    const nomes = cookies.map((c) => c.name);
    confere('primeira visita: o clique grava preloader_shown', nomes.includes('preloader_shown'), nomes.join());
    confere('primeira visita: o tutorial grava tutorial_shown', nomes.includes('tutorial_shown'));
    confere('primeira visita: só o vídeo do tutorial é pedido', videos.every((v) => /assets\/video\/tutorial\./.test(v.url) && v.depoisDoClique), videos.map((v) => v.url.split('/').pop()).join());
    await ctx.close();
  }
  // Nada dos vídeos antigos no que é publicado
  {
    const DIST = path.resolve(import.meta.dirname, '../../dist');
    const andar = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? andar(path.join(d, e.name)) : [path.join(d, e.name)]));
    const achados = andar(DIST).filter((f) => /\.(html|js|css|json|xml)$/.test(f) && /logo_intro|intro_mobile|animated_logo|tutorial-final/.test(fs.readFileSync(f, 'utf8')));
    confere('dist sem os vídeos antigos', achados.length === 0, achados.join());
  }
}

await browser.close();
const falhas = resultados.filter((r) => !r.ok);
console.log(`\n${resultados.length - falhas.length} de ${resultados.length} aprovados. Folhas em ${SAIDA}`);
if (falhas.length) process.exit(1);
