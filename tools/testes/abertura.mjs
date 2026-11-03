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
  const m = (window.__m = { longas: [], enter: null, clique: null, home: null, abertura: false, video: [], fonteNoNome: null });
  // no instante em que o nome começa a aparecer, a fonte dele já tinha chegado? Se não, local-preloader.js precisa fixar a reserva
  document.addEventListener('animationstart', (e) => { if (e.animationName === 'ab-vem' && e.target.classList?.contains('ab-r') && m.fonteNoNome == null) m.fonteNoNome = document.fonts.check('800 100px "Sinal Abertura"'); }, true);
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

// A ordem da abertura, lida uma vez na hora do ENTER, das próprias animações CSS: nada de ler estilo a cada quadro durante a carga.
// pintura: primeiro quadro do documento; sinal: a carta começa a entrar; nome: as cópias começam a aparecer; parado: a última
// animação do nome, do pente e das faixas terminou. Também: quantas cópias estão à vista e quantas têm a entrada, se a faixa do
// topo espera, e se a fonte do nome já estava pronta quando ele começou a aparecer (a SONDA anota) ou se a abertura ficou na reserva. Com movimento reduzido não há carta.
const LER_ORDEM = () => {
  const pintura = performance.getEntriesByType('paint').find((e) => e.name === 'first-paint')?.startTime ?? null;
  const de = (fn) => document.getAnimations().filter((a) => a.animationName && a.startTime !== null && fn(a)).map((a) => ({ nome: a.animationName, ini: a.startTime + a.effect.getTiming().delay, fim: a.startTime + a.effect.getComputedTiming().endTime }));
  const carta = de((a) => a.animationName === 'ab-sinal')[0] || null;
  const nome = de((a) => a.effect.target?.classList?.contains('ab-canal'));
  const resto = de((a) => a.effect.target?.closest?.('.ab-comb, .ab-rasgo'));
  const faixa = de((a) => a.animationName === 'ab-vem' && a.effect.target?.classList?.contains('ab-faixa'))[0] || null;
  const topo = de((a) => a.effect.pseudoElement === '::before' && a.animationName === 'ab-vem')[0] || null;
  const vem = nome.filter((x) => x.nome === 'ab-vem');
  const raiz = document.documentElement.classList;
  return {
    pintura: pintura === null ? null : Math.round(pintura),
    sinal: carta ? Math.round(carta.ini) : null,
    sinalFim: carta ? Math.round(carta.fim) : null,
    nome: vem.length ? Math.round(Math.min(...vem.map((x) => x.ini))) : null,
    parado: nome.length ? Math.round(Math.max(...[...nome, ...resto].map((x) => x.fim))) : null,
    faixa: faixa ? Math.round(faixa.ini) : null,
    topo: topo ? Math.round(topo.ini) : null,
    ativa: raiz.contains('abertura-ativa'),
    copias: [...document.querySelectorAll('.ab-canal')].filter((e) => getComputedStyle(e).display !== 'none').length,
    entradas: vem.length,
    reserva: raiz.contains('abertura-reserva'),
    fonte: window.__m?.fonteNoNome ?? null,
  };
};
// Preto por pelo menos 400 ms depois do primeiro quadro, faixa do topo inclusive; cada cópia à vista com a entrada; o nome entra
// durante a carta, nunca antes; nada mexe nos últimos 300 ms antes do ENTER; e a fonte estava pronta no nome, ou ficou a reserva.
function ordemCerta(o, enter, calmo = false) {
  if (!o || o.pintura === null || o.nome === null || o.parado === null) return { ok: false, texto: JSON.stringify(o) };
  const primeiro = Math.min(o.nome, o.sinal ?? Infinity, o.faixa ?? Infinity);
  const preto = primeiro - o.pintura;
  const durante = calmo ? o.sinal === null : o.sinal !== null && o.nome > o.sinal && o.nome < o.sinalFim + 300;
  const folga = enter - o.parado;
  // a faixa da abertura acende com a carta (com o nome, no movimento reduzido); a da página, só depois de o nome parar
  const faixas = o.faixa !== null && Math.abs(o.faixa - (calmo ? o.nome : o.sinal)) <= 60 && o.topo !== null && o.topo >= o.parado - 100;
  const copias = o.ativa && faixas && o.copias === (calmo ? 1 : 3) && o.entradas === o.copias;
  const fonte = o.reserva || o.fonte === true;
  const ok = preto >= 400 && durante && folga >= 300 && copias && fonte;
  return { ok, preto, folga, texto: `preto ${preto} ms, sinal ${o.sinal === null ? '-' : o.sinal - o.pintura}, nome ${o.nome - o.pintura}, parado ${o.parado - o.pintura}, ENTER ${Math.round(enter - o.pintura)} ms depois do primeiro quadro; ${o.copias} cópias, ${o.entradas} entradas, faixa ${o.faixa === null ? '-' : o.faixa - o.pintura}, topo ${o.topo === null ? 'sem espera' : o.topo - o.pintura}; fonte ${o.reserva ? 'na reserva' : o.fonte === true ? 'pronta' : o.fonte === false ? 'atrasada e sem reserva' : 'sem registro'}` };
}

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
  const ordem = await page.evaluate(LER_ORDEM).catch(() => null);
  await page.click('[data-preloader="btn"]', { timeout: limite });
  await page.waitForFunction(() => window.__m.home !== null, null, { timeout: limite });
  const m = await lerM(page);
  return { enter: m.enter, home: m.home - m.clique, longa: Math.max(0, ...m.longas.filter((l) => l[0] < m.enter).map((l) => l[1])), ordem };
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
  for (const [rotulo, lista] of [['limpa', limpa], ['com cache', cache]]) {
    const r = lista.map((v) => ordemCerta(v.ordem, v.enter));
    const ruins = r.filter((x) => !x.ok);
    confere(`${CANAL} ${rotulo}: preto, sinal, nome e ENTER, nessa ordem, em todas as visitas`, !ruins.length, ruins.length ? ruins[0].texto : `preto ${Math.min(...r.map((x) => x.preto))} a ${Math.max(...r.map((x) => x.preto))} ms; nome parado ${Math.min(...r.map((x) => x.folga))} a ${Math.max(...r.map((x) => x.folga))} ms antes do ENTER, n=${r.length}`);
  }
}

// Quadros reais do primeiro carregamento, para conferir com os olhos: nenhum quadro da marca antiga, retângulo ou tela sem estilo.
async function folhaDeQuadros(rotulo, opcoes, atrasar, { espera = 1500, cache = false, depois } = {}) {
  const ctx = await browser.newContext(opcoes);
  await ctx.addInitScript(SONDA);
  if (cache) {
    // uma visita inteira antes, no mesmo perfil, e os cookies da abertura apagados: a captura é a da visita com cache
    const antes = await ctx.newPage();
    await antes.goto(`${URL_BASE}/`, { waitUntil: 'commit', timeout: 60000 });
    await antes.waitForFunction(() => { const b = document.querySelector('[data-preloader="btn"]'); return b && b.onclick; }, null, { timeout: 60000 });
    await antes.waitForTimeout(1500);
    await antes.close();
    await ctx.clearCookies();
  }
  const page = await ctx.newPage();
  if (atrasar) await page.route(atrasar, async (r) => { await new Promise((f) => setTimeout(f, espera)); await r.continue(); });
  const cdp = await ctx.newCDPSession(page);
  const quadros = [];
  cdp.on('Page.screencastFrame', async (f) => {
    quadros.push({ t: f.metadata.timestamp, data: f.data });
    await cdp.send('Page.screencastFrameAck', { sessionId: f.sessionId }).catch(() => {});
  });
  await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 60, everyNthFrame: 1, maxWidth: 480, maxHeight: 480 });
  await page.goto(`${URL_BASE}/`, { waitUntil: 'commit', timeout: 60000 });
  const commit = Date.now() / 1000;
  await page.waitForFunction(() => { const b = document.querySelector('[data-preloader="btn"]'); return b && b.onclick && +getComputedStyle(b).opacity > 0.9; }, null, { timeout: 60000 });
  const ordem = await page.evaluate(LER_ORDEM).catch(() => null);
  const enter = await page.evaluate(() => window.__m.enter);
  // o primeiro quadro desenhado pelo documento, no relógio dos quadros: antes dele a tela ainda é a do about:blank, branca
  const pintado = await page.evaluate(() => performance.timeOrigin + (performance.getEntriesByType('paint').find((e) => e.name === 'first-paint')?.startTime ?? 0));
  await cdp.send('Page.stopScreencast');
  if (depois) await depois(page, confere);
  await ctx.close();
  // Pelos pixels: do primeiro quadro do documento até o primeiro com alguma luz, tudo preto, por pelo menos 400 ms
  const doc = quadros.filter((q) => q.t * 1000 >= Math.max(commit * 1000, pintado) - 20);
  const luz = await Promise.all(doc.map(async (q) => (await sharp(Buffer.from(q.data, 'base64')).greyscale().stats()).channels[0].max));
  const aceso = luz.findIndex((v) => v > 12); // 12: o ruído do monitor sobre o preto fica em 3
  // desde o primeiro quadro pintado: com a tela parada o screencast não manda quadro nenhum, então o primeiro que chega pode ser tardio
  const escuro = aceso > 0 ? Math.round(doc[aceso].t * 1000 - pintado) : 0;
  confere(`quadros ${rotulo}: começa preto`, aceso > 0 && escuro >= 400 , `${aceso} quadros pretos, ${escuro} ms; luz máxima até ali ${aceso > 0 ? Math.max(...luz.slice(0, aceso)) : '-'}`);
  const o = ordemCerta(ordem, enter, !!opcoes.reducedMotion);
  confere(`quadros ${rotulo}: preto, sinal, nome e ENTER, nessa ordem`, o.ok, o.texto);
  // Sequência curta, com o tempo desde o primeiro quadro do documento
  if (doc.length > 8) {
    const t0 = pintado / 1000; // os tempos da sequência contam do primeiro quadro pintado
    const alvos = [0, 300, 500, 650, 750, 850, 1000, 1150, 1400, 1800, 2400, 3000];
    const idx = alvos.map((ms) => doc.reduce((m, q, i) => (Math.abs((q.t - t0) * 1000 - ms) < Math.abs((doc[m].t - t0) * 1000 - ms) ? i : m), 0));
    idx.push(doc.length - 1);
    const L = 300, A = Math.round((L * opcoes.viewport.height) / opcoes.viewport.width);
    const blocos = await Promise.all(idx.map(async (i) => {
      const legenda = Buffer.from(`<svg width="${L}" height="24"><rect width="100%" height="100%" fill="#222"/><text x="6" y="17" font-family="monospace" font-size="15" fill="#fff">${Math.round((doc[i].t - t0) * 1000)} ms</text></svg>`);
      const img = await sharp(Buffer.from(doc[i].data, 'base64')).resize(L, A, { fit: 'contain', background: '#333' }).toBuffer();
      return sharp({ create: { width: L, height: A + 24, channels: 3, background: '#111' } }).composite([{ input: legenda, top: 0, left: 0 }, { input: img, top: 24, left: 0 }]).jpeg().toBuffer();
    }));
    const col = A > L ? 7 : 5;
    await sharp({ create: { width: col * (L + 4), height: Math.ceil(blocos.length / col) * (A + 28), channels: 3, background: '#000' } })
      .composite(blocos.map((input, i) => ({ input, left: (i % col) * (L + 4), top: Math.floor(i / col) * (A + 28) })))
      .jpeg({ quality: 85 }).toFile(path.join(SAIDA, `sequencia-${rotulo}.jpg`));
  }
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
  await folhaDeQuadros('1440-movimento-reduzido', { viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
  await folhaDeQuadros('1440-css-lento', { viewport: { width: 1440, height: 900 } }, '**/tema-sinal.css');
  await folhaDeQuadros('1440-fonte-lenta', { viewport: { width: 1440, height: 900 } }, '**/archivo-*.woff2');
  await folhaDeQuadros('1440-cache', { viewport: { width: 1440, height: 900 } }, null, { cache: true });
  await folhaDeQuadros('390-cache', CELULAR, null, { cache: true });
  // A fonte chegando depois dos 3 s de bloqueio: a abertura fica na reserva do começo ao fim, sem trocar com o ENTER na tela
  await folhaDeQuadros('1440-fonte-muito-lenta', { viewport: { width: 1440, height: 900 } }, '**/archivo-*.woff2', {
    espera: 4500,
    depois: async (page, conf) => {
      const ver = () => page.evaluate(() => ({ reserva: document.documentElement.classList.contains('abertura-reserva'), familia: getComputedStyle(document.querySelector('.ab-nome')).fontFamily, visivel: +getComputedStyle(document.querySelector('.ab-r')).opacity }));
      const noEnter = await ver();
      await page.waitForTimeout(2500);
      const depois = await ver();
      conf('quadros 1440-fonte-muito-lenta: nome à vista na reserva, sem troca depois do ENTER', noEnter.reserva && /^"?Sinal Reserva/.test(noEnter.familia) && noEnter.visivel === 1 && depois.familia === noEnter.familia, JSON.stringify({ noEnter, depois }));
    },
  });
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
  await caminhoDeFalha('tema-sinal.css bloqueado', { bloquear: '**/tema-sinal.css' });
  {
    // Sem o tema, o nome não aparece sem estilo no começo, mas aparece sozinho depois: a tela nunca fica só preta
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    await page.route('**/tema-sinal.css', (r) => r.abort());
    await page.goto(`${URL_BASE}/`, { waitUntil: 'commit', timeout: 60000 });
    await page.waitForTimeout(2000);
    const cedo = await page.evaluate(() => +getComputedStyle(document.querySelector('.ab-nome')).opacity);
    await page.waitForTimeout(5000);
    const tarde = await page.evaluate(() => {
      const n = document.querySelector('.ab-nome');
      const vistas = [...document.querySelectorAll('.ab-canal')].filter((e) => getComputedStyle(e).display !== 'none' && e.getBoundingClientRect().width > 0);
      const r = vistas[0]?.querySelector('span')?.getBoundingClientRect();
      return { opacidade: +getComputedStyle(n).opacity, copias: vistas.length, dentro: !!r && r.width > 0 && r.left >= 0 && r.right <= innerWidth && r.top >= 0 && r.bottom <= innerHeight };
    });
    confere('falha, tema bloqueado: o nome fica escondido no começo e aparece sozinho depois, uma vez só e na tela', cedo === 0 && tarde.opacidade === 1 && tarde.copias === 1 && tarde.dentro, JSON.stringify({ cedo, tarde }));
    await ctx.close();
  }
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
