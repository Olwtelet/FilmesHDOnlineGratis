// O percurso real, em Chrome e Brave de verdade e com janela: home, EXPLORAR, página do filme, clique no logo, home de novo. Mede onde
// a tela para: intervalos entre quadros, quadros longos com o script culpado (Long Animation Frames) e o tempo gasto no WebGL.
//   node tools/testes/volta-home.mjs [--url=http://localhost:4322] [--navegadores=chrome,brave] [--rodadas=2] [--voltas=3] [--largura=1440]
//                                    [--modo=medir|perfil|rastro|quadros] [--saida=pasta] [--rotulo=depois] [--referencia=arquivo.json]
// medir: sem nada mais ligado, são os números que valem. perfil: tempo próprio de CPU por função na volta. rastro: tempo por evento em cada
// thread (imagem, layout, GPU) na volta. quadros: folha com o que apareceu na tela na volta. Os três últimos pesam: use só para achar a causa.
// Cada rodada usa perfil novo, com uma visita limpa e uma com cache; em cada visita, --voltas idas e voltas na mesma aba.
// Com --referencia, repete o resumo daquele arquivo ao lado, e a volta não pode ter pausa maior que a da referência (folga de 10%).
// Com --limite=700, a mediana da maior pausa não pode passar desse valor. No fim de cada rodada mede também quem entra direto numa sessão e clica no logo.
// Volta com o navegador a 1 quadro por segundo é janela sem desenhar, não o site: fica de fora das medianas e é contada à parte.
// Para achar a causa sem abrir janela: --sem-janela=1, --visitas=limpa e --ab=regex, que tira nas voltas ímpares as regras de CSS cujo seletor casa.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn, execSync } from 'node:child_process';
import { chromium } from 'playwright';
import sharp from 'sharp';

const arg = (n, d) => (process.argv.find((a) => a.startsWith(`--${n}=`)) || `--${n}=${d}`).split('=').slice(1).join('=');
const URL_BASE = arg('url', 'http://localhost:4322').replace(/\/$/, '');
const NAVEGADORES = arg('navegadores', 'chrome,brave').split(',');
const RODADAS = +arg('rodadas', 2);
const VOLTAS = +arg('voltas', 3);
const LARGURA = +arg('largura', 1440);
const MODO = arg('modo', 'medir');
const ROTULO = arg('rotulo', 'depois');
const REFERENCIA = arg('referencia', '');
const SEM_JANELA = arg('sem-janela', '') === '1';
const VISITAS = arg('visitas', 'limpa,cache').split(',');
const AB = arg('ab', '');
const SAIDA = path.resolve(arg('saida', path.join(os.tmpdir(), 'fhdog-volta-home')));
const ALTURA = 825;
const JANELA = 6000; // quanto tempo, depois do clique, a volta é observada
const EXE = {
  chrome: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  brave: path.join(process.env.LOCALAPPDATA, 'BraveSoftware/Brave-Browser/Application/brave.exe'),
};
fs.mkdirSync(SAIDA, { recursive: true });
const dormir = (ms) => new Promise((r) => setTimeout(r, ms));
const mediana = (a) => {
  if (!a.length) return 0;
  const s = [...a].sort((x, y) => x - y);
  const m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};
const resultados = [];
function confere(nome, ok, detalhe = '') {
  resultados.push({ nome, ok });
  console.log(`${ok ? 'ok   ' : 'FALHA'} ${nome}${detalhe ? `  ${detalhe}` : ''}`);
}

const SONDA = () => {
  if (window.__v) return;
  const v = (window.__v = { quadros: [], loaf: [], longas: [], gl: [], contextos: 0, marcas: [], erros: [] });
  addEventListener('error', (e) => v.erros.push(String(e.message)));
  addEventListener('unhandledrejection', (e) => v.erros.push(String(e.reason)));
  let ant = 0;
  const q = (t) => {
    if (ant && t - ant > 20) v.quadros.push([Math.round(ant), Math.round(t - ant)]);
    ant = t;
    v.ultimoQuadro = t;
    requestAnimationFrame(q);
  };
  requestAnimationFrame(q);
  try {
    new PerformanceObserver((l) => {
      for (const e of l.getEntries()) {
        v.loaf.push({
          t: Math.round(e.startTime), d: Math.round(e.duration), b: Math.round(e.blockingDuration),
          estilo: e.styleAndLayoutStart ? Math.round(e.startTime + e.duration - e.styleAndLayoutStart) : 0,
          s: e.scripts.map((s) => ({ f: s.sourceFunctionName, u: (s.sourceURL || '').split('/').pop(), c: s.sourceCharPosition, i: s.invokerType, n: String(s.invoker).slice(0, 60), d: Math.round(s.duration), l: Math.round(s.forcedStyleAndLayoutDuration) })),
        });
      }
    }).observe({ type: 'long-animation-frame', buffered: true });
  } catch {}
  try {
    new PerformanceObserver((l) => { for (const e of l.getEntries()) v.longas.push([Math.round(e.startTime), Math.round(e.duration)]); }).observe({ type: 'longtask', buffered: true });
  } catch {}
  for (const C of [window.WebGLRenderingContext, window.WebGL2RenderingContext]) {
    if (!C) continue;
    for (const nome of ['texImage2D', 'texSubImage2D', 'compileShader', 'linkProgram', 'getProgramParameter', 'generateMipmap']) {
      const o = C.prototype[nome];
      C.prototype[nome] = function (...a) {
        const t = performance.now();
        const r = o.apply(this, a);
        const d = performance.now() - t;
        if (d > 0.3) v.gl.push([nome, Math.round(t), +d.toFixed(1)]);
        return r;
      };
    }
  }
  const gc = HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext = function (tipo, ...a) {
    const antes = !!this.__temContexto;
    const r = gc.call(this, tipo, ...a);
    if (r && !antes && /webgl/.test(tipo)) { this.__temContexto = true; v.contextos++; v.marcas.push(['contexto', Math.round(performance.now())]); }
    return r;
  };
  document.addEventListener('click', (e) => {
    const a = e.target.closest && e.target.closest('a');
    v.marcas.push(['clique', Math.round(performance.now()), a ? a.getAttribute('href') : '']);
  }, true);
  document.addEventListener('DOMContentLoaded', () => {
    let pag = null;
    const ver = () => {
      const p = document.querySelector('[data-taxi-view]')?.getAttribute('data-page');
      if (p !== pag) { pag = p; v.marcas.push(['pagina', Math.round(performance.now()), p]); }
    };
    ver();
    new MutationObserver(ver).observe(document.querySelector('[data-taxi]') || document.body, { childList: true });
  });
};

let porta = 9700 + (process.pid % 200);
async function abrirNavegador(tipo, perfil) {
  if (SEM_JANELA) {
    const navegador = await chromium.launch({ executablePath: EXE[tipo], headless: true });
    const ctx = await navegador.newContext({ viewport: { width: LARGURA, height: ALTURA } });
    await ctx.addInitScript(SONDA);
    await ctx.addCookies([
      { name: 'preloader_shown', value: String(Date.now() + 864e5 * 400), url: URL_BASE },
      { name: 'tutorial_shown', value: 'true', url: URL_BASE },
    ]);
    return { navegador, ctx, page: await ctx.newPage() };
  }
  porta++;
  const filho = spawn(EXE[tipo], [`--remote-debugging-port=${porta}`, `--user-data-dir=${perfil}`, '--no-first-run', '--no-default-browser-check', '--disable-backgrounding-occluded-windows', '--disable-features=CalculateNativeWinOcclusion', `--window-size=${LARGURA + 16},${ALTURA + 120}`, 'about:blank'], { stdio: 'ignore' });
  for (let i = 0; i < 100; i++) {
    try { if ((await fetch(`http://127.0.0.1:${porta}/json/version`)).ok) break; } catch {}
    await dormir(100);
  }
  const navegador = await chromium.connectOverCDP(`http://127.0.0.1:${porta}`);
  const ctx = navegador.contexts()[0];
  await ctx.addInitScript(SONDA);
  await ctx.addCookies([
    { name: 'preloader_shown', value: String(Date.now() + 864e5 * 400), url: URL_BASE },
    { name: 'tutorial_shown', value: 'true', url: URL_BASE },
  ]);
  const page = ctx.pages()[0] || (await ctx.newPage());
  return { filho, navegador, ctx, page };
}
async function fechar({ filho, navegador }, perfil) {
  await navegador.close().catch(() => {});
  // só a árvore desta janela: o navegador do proprietário continua aberto
  if (filho) try { execSync(`taskkill /PID ${filho.pid} /T /F`, { stdio: 'ignore' }); } catch {}
  await dormir(500);
  try { fs.rmSync(perfil, { recursive: true, force: true }); } catch {}
}

const esperarPagina = (page, dp) => page.waitForFunction((d) => {
  const v = document.querySelector('[data-taxi-view]');
  const t = document.querySelector('[data-taxi]');
  if (!v || !t || v.getAttribute('data-page') !== d) return false;
  const c = getComputedStyle(t);
  return c.visibility !== 'hidden' && +c.opacity > 0.9;
}, dp, { timeout: 60000 });

// O centro de um elemento já parado, para o clique ser do mouse de verdade
async function centroDe(page, avaliar) {
  for (let i = 0; i < 40; i++) {
    const c = await page.evaluate(avaliar);
    if (c) return c;
    await dormir(150);
  }
  throw new Error('alvo do clique não apareceu');
}
const CENTRO_EXPLORAR = () => {
  const itens = [...document.querySelectorAll('[data-roll="item"]')];
  const d = itens.map((el) => { const b = el.getBoundingClientRect(); return Math.abs(b.top + b.height / 2 - innerHeight / 2); });
  const min = Math.min(...d);
  const it = itens[d.indexOf(min)];
  if (min > 12 || !it || !it.getAttribute('data-sessao')) return null;
  const a = it.querySelector('[data-hide="mobile"] a.explore-w');
  const r = a && a.getBoundingClientRect();
  return r && r.width > 10 && r.top >= 0 && r.bottom <= innerHeight ? { x: r.left + r.width / 2, y: r.top + r.height / 2, sessao: it.getAttribute('data-sessao') } : null;
};
const CENTRO_LOGO = () => {
  const r = document.querySelector('a.nav-link.logo')?.getBoundingClientRect();
  return r && r.width > 10 ? { x: r.left + r.width / 2, y: r.top + r.height / 2 } : null;
};

// Só o que caiu na janela de tempo depois do clique
function recorte(v, t0, t1) {
  const dentro = (t) => t >= t0 && t < t1;
  const gaps = v.quadros.filter((q) => dentro(q[0]));
  const maiores = [...gaps].sort((a, b) => b[1] - a[1]).slice(0, 4).map((q) => [q[0] - t0, q[1]]);
  const loaf = v.loaf.filter((l) => dentro(l.t)).sort((a, b) => b.d - a.d).slice(0, 4).map((l) => ({
    em: l.t - t0, d: l.d, bloqueio: l.b, estilo: l.estilo,
    scripts: l.s.sort((a, b) => b.d - a.d).slice(0, 3).map((s) => `${s.f || '(anônima)'} ${s.u}:${s.c} ${s.i} ${s.d} ms${s.l ? `, layout forçado ${s.l} ms` : ''}`),
  }));
  const gl = {};
  for (const [nome, t, d] of v.gl) if (dentro(t)) { gl[nome] = gl[nome] || { n: 0, ms: 0 }; gl[nome].n++; gl[nome].ms = +(gl[nome].ms + d).toFixed(1); }
  return {
    maior: gaps.length ? Math.max(...gaps.map((q) => q[1])) : 0,
    acima50: gaps.filter((q) => q[1] > 50).length,
    acima100: gaps.filter((q) => q[1] > 100).length,
    tempoPerdido: gaps.filter((q) => q[1] > 50).reduce((s, q) => s + q[1], 0),
    maiores, loaf, gl,
    longas: v.longas.filter((l) => dentro(l[0])).length,
  };
}

async function clicar(page, c) {
  await page.mouse.move(c.x, c.y);
  await dormir(250);
  const t0 = await page.evaluate(() => performance.now());
  await page.mouse.click(c.x, c.y);
  return Math.round(t0);
}

function perfilProprio(perfil) {
  const porFn = new Map();
  const dt = perfil.timeDeltas || [];
  const noPorId = new Map(perfil.nodes.map((n) => [n.id, n]));
  perfil.samples.forEach((id, i) => {
    const n = noPorId.get(id);
    const nome = `${n.callFrame.functionName || '(anônima)'} ${n.callFrame.url.split('/').pop()}:${n.callFrame.columnNumber}`;
    porFn.set(nome, (porFn.get(nome) || 0) + (dt[i] || 0) / 1000);
  });
  return [...porFn.entries()].sort((a, b) => b[1] - a[1]).slice(0, 30).map(([nome, ms]) => [nome, +ms.toFixed(1)]);
}

// Tempo próprio de cada evento, por thread: o que está aninhado desconta do pai
function rastroPorThread(rastro, t0us, t1us) {
  const nomes = new Map();
  for (const e of rastro.traceEvents) if (e.ph === 'M' && e.name === 'thread_name') nomes.set(`${e.pid}:${e.tid}`, e.args.name);
  const porThread = new Map();
  for (const e of rastro.traceEvents) {
    if (e.ph !== 'X' || !e.dur || e.ts < t0us || e.ts > t1us) continue;
    const k = `${e.pid}:${e.tid}`;
    if (!porThread.has(k)) porThread.set(k, []);
    porThread.get(k).push(e);
  }
  const saida = {};
  for (const [k, lista] of porThread) {
    const nome = nomes.get(k) || k;
    if (!/CrRendererMain|Compositor$|CrGpuMain|VizCompositor|ThreadPool|ImageDecode|DedicatedWorker/.test(nome)) continue;
    lista.sort((a, b) => a.ts - b.ts || b.dur - a.dur);
    const proprio = new Map();
    const pilha = [];
    const soma = (e, v) => proprio.set(e.name, (proprio.get(e.name) || 0) + v);
    for (const e of lista) {
      while (pilha.length && pilha[pilha.length - 1].ts + pilha[pilha.length - 1].dur <= e.ts) pilha.pop();
      if (pilha.length) soma(pilha[pilha.length - 1], -e.dur);
      soma(e, e.dur);
      pilha.push(e);
    }
    const longos = lista.filter((e) => /RunTask|ThreadControllerImpl::RunTask/.test(e.name) && e.dur > 50000).map((e) => [Math.round((e.ts - t0us) / 1000), Math.round(e.dur / 1000)]);
    const base = saida[nome] || { proprio: {}, longos: [] };
    for (const [n, us] of proprio) base.proprio[n] = (base.proprio[n] || 0) + us / 1000;
    base.longos.push(...longos);
    saida[nome] = base;
  }
  for (const b of Object.values(saida)) {
    b.proprio = Object.entries(b.proprio).sort((x, y) => y[1] - x[1]).slice(0, 18).map(([n, ms]) => [n, +ms.toFixed(1)]);
  }
  return saida;
}

async function folha(quadros, rotulo) {
  if (!quadros.length) return;
  const t0 = quadros[0].t;
  const escolhidos = quadros.length <= 48 ? quadros : Array.from({ length: 48 }, (_, i) => quadros[Math.round((i * (quadros.length - 1)) / 47)]);
  const LARG = 320;
  const ALT = Math.round((LARG * ALTURA) / LARGURA);
  const COLS = 6;
  const linhas = Math.ceil(escolhidos.length / COLS);
  const partes = await Promise.all(escolhidos.map(async (q, i) => {
    const legenda = Buffer.from(`<svg width="${LARG}" height="22"><rect width="100%" height="100%" fill="black"/><text x="6" y="16" font-family="monospace" font-size="14" fill="white">${Math.round((q.t - t0) * 1000)} ms</text></svg>`);
    const img = await sharp(Buffer.from(q.d, 'base64')).resize(LARG, ALT, { fit: 'fill' }).composite([{ input: legenda, top: 0, left: 0 }]).jpeg({ quality: 62 }).toBuffer();
    return { input: img, left: (i % COLS) * LARG, top: Math.floor(i / COLS) * ALT };
  }));
  await sharp({ create: { width: COLS * LARG, height: linhas * ALT, channels: 3, background: '#000' } }).composite(partes).jpeg({ quality: 70 }).toFile(path.join(SAIDA, `${rotulo}.jpg`));
  // Maior intervalo entre quadros que a tela mostrou
  let maior = 0, em = 0;
  for (let i = 1; i < quadros.length; i++) { const g = (quadros[i].t - quadros[i - 1].t) * 1000; if (g > maior) { maior = g; em = (quadros[i - 1].t - t0) * 1000; } }
  console.log(`info  ${rotulo}: ${quadros.length} quadros mostrados, maior intervalo ${Math.round(maior)} ms, ${Math.round(em)} ms depois do primeiro`);
}

async function percurso(n, tipo, visita, i, cdp) {
  const { page, navegador } = n;
  // O Windows põe janela de segundo plano nos núcleos de eficiência: fora da frente, as pausas dobram e os números não comparam
  await page.bringToFront();
  // Sem sessão futura a home abre no aviso, cujo EXPLORAR leva à Programação: a seta passa para um filme, como quem navega
  await page.mouse.move(LARGURA / 2, ALTURA / 2);
  let alvo = null;
  for (let k = 0; k < 4 && !alvo; k++) {
    await page.keyboard.press('ArrowDown');
    await dormir(1600);
    alvo = await page.evaluate(CENTRO_EXPLORAR);
  }
  if (!alvo) alvo = await centroDe(page, CENTRO_EXPLORAR);
  const tIda = await clicar(page, alvo);
  await esperarPagina(page, 'case');
  await dormir(JANELA);
  const logo = await centroDe(page, CENTRO_LOGO);

  const rotulo = `${tipo}-${visita}-${i}`;
  let quadros = [];
  const aoQuadro = (f) => { quadros.push({ t: f.metadata.timestamp, d: f.data }); cdp.send('Page.screencastFrameAck', { sessionId: f.sessionId }).catch(() => {}); };
  if (MODO === 'perfil') { await cdp.send('Profiler.enable'); await cdp.send('Profiler.setSamplingInterval', { interval: 500 }); await cdp.send('Profiler.start'); }
  if (MODO === 'rastro') await navegador.startTracing(page, { categories: ['toplevel', 'devtools.timeline', 'disabled-by-default-devtools.timeline', 'blink', 'gpu', 'cc', 'viz', 'v8'] });
  if (MODO === 'quadros') { cdp.on('Page.screencastFrame', aoQuadro); await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 55, maxWidth: 640, everyNthFrame: 1 }); }

  if (AB) {
    const sem = i % 2 === 1;
    const n = await page.evaluate(([s, padrao]) => {
      const re = new RegExp(padrao);
      window.__guardadas = window.__guardadas || [];
      let tiradas = 0;
      if (s) {
        for (const f of document.styleSheets) {
          const anda = (lista) => { for (let k = lista.cssRules.length - 1; k >= 0; k--) { const r = lista.cssRules[k]; if (r.selectorText && re.test(r.selectorText)) { window.__guardadas.push([lista, r.cssText, k]); lista.deleteRule(k); tiradas++; } else if (r.cssRules) anda(r); } };
          try { anda(f); } catch {}
        }
      } else {
        for (const [lista, t, k] of window.__guardadas.reverse()) { try { lista.insertRule(t, Math.min(k, lista.cssRules.length)); } catch {} }
        window.__guardadas = [];
      }
      return tiradas;
    }, [sem, AB]);
    console.log(`      A/B: volta ${i} ${sem ? `SEM ${n} regras` : 'com todas'}`);
    await dormir(600);
  }
  const tVolta = await clicar(page, logo);
  await esperarPagina(page, 'home');
  const tVisivel = await page.evaluate(() => performance.now());
  await dormir(JANELA);

  const extras = {};
  if (MODO === 'perfil') { const { profile } = await cdp.send('Profiler.stop'); extras.cpu = perfilProprio(profile); }
  if (MODO === 'rastro') {
    const buf = await navegador.stopTracing();
    const rastro = JSON.parse(buf.toString('utf8'));
    fs.writeFileSync(path.join(SAIDA, `${rotulo}-rastro.json.txt`), JSON.stringify(rastro.traceEvents.filter((e) => e.ph === 'X' && e.dur > 20000).map((e) => [e.name, e.ts, e.dur, e.tid])));
    let min = Infinity, max = 0;
    for (const e of rastro.traceEvents) if (e.ph === 'X') { if (e.ts < min) min = e.ts; if (e.ts > max) max = e.ts; }
    extras.threads = rastroPorThread(rastro, min, max);
  }
  if (MODO === 'quadros') { await cdp.send('Page.stopScreencast'); cdp.off('Page.screencastFrame', aoQuadro); await folha(quadros, `${rotulo}-${ROTULO}`); }

  const v = await page.evaluate(() => { const w = window.__v; return { quadros: w.quadros, loaf: w.loaf, longas: w.longas, gl: w.gl, marcas: w.marcas, contextos: w.contextos, erros: w.erros }; });
  const pagina = v.marcas.filter((m) => m[0] === 'pagina' && m[1] >= tVolta && m[2] === 'home').map((m) => m[1] - tVolta)[0] ?? null;
  return {
    tipo, visita, i, sessao: alvo.sessao,
    ida: recorte(v, tIda, tIda + JANELA),
    volta: { ...recorte(v, tVolta, tVolta + JANELA), trocaEm: pagina, visivelEm: Math.round(tVisivel - tVolta) },
    ocioso: await custoOcioso(cdp),
    contextos: v.contextos, erros: v.erros, ...extras,
  };
}

// A home parada: quanto o thread principal gasta por segundo. Sobe a cada volta se objetos antigos seguirem rodando.
async function custoOcioso(cdp) {
  const ler = async () => Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map((m) => [m.name, m.value]));
  const a = await ler();
  await dormir(2000);
  const b = await ler();
  return Math.round((((b.ScriptDuration - a.ScriptDuration) + (b.LayoutDuration - a.LayoutDuration) + (b.RecalcStyleDuration - a.RecalcStyleDuration)) * 1000) / 2);
}

// Quem entra direto numa sessão e clica no logo chega à home pela primeira vez nessa aba: nada guardado da home.
async function entradaDireta(n, tipo, cdp) {
  const { page } = n;
  await page.goto(`${URL_BASE}/sessoes/bugonia-2025/`, { waitUntil: 'load', timeout: 90000 });
  await esperarPagina(page, 'case');
  await page.bringToFront();
  await dormir(JANELA);
  const logo = await centroDe(page, CENTRO_LOGO);
  const tVolta = await clicar(page, logo);
  await esperarPagina(page, 'home');
  const tVisivel = await page.evaluate(() => performance.now());
  await dormir(JANELA);
  const v = await page.evaluate(() => { const w = window.__v; return { quadros: w.quadros, loaf: w.loaf, longas: w.longas, gl: w.gl, marcas: w.marcas, contextos: w.contextos, erros: w.erros }; });
  const pagina = v.marcas.filter((m) => m[0] === 'pagina' && m[1] >= tVolta && m[2] === 'home').map((m) => m[1] - tVolta)[0] ?? null;
  const volta = { ...recorte(v, tVolta, tVolta + JANELA), trocaEm: pagina, visivelEm: Math.round(tVisivel - tVolta) };
  return { tipo, visita: 'direta', i: 0, ida: { maior: 0 }, volta, ocioso: await custoOcioso(cdp), contextos: v.contextos, erros: v.erros };
}

const todas = [];
const naoAbriu = [];
for (const tipo of NAVEGADORES) {
  for (let r = 0; r < RODADAS; r++) {
    const perfil = fs.mkdtempSync(path.join(os.tmpdir(), `fhdog-volta-${tipo}-`));
    const n = await abrirNavegador(tipo, perfil);
    try {
      const cdp = await n.ctx.newCDPSession(n.page);
      await cdp.send('Performance.enable');
      for (const visita of VISITAS) {
        if (visita === 'cache') { await n.page.goto('about:blank'); await dormir(800); }
        await n.page.goto(`${URL_BASE}/`, { waitUntil: 'load', timeout: 90000 });
        // Home que não abre é achado, não erro do teste: fica registrado como estava, com a foto, e a visita segue com uma recarga
        try {
          await esperarPagina(n.page, 'home');
        } catch {
          const estado = await n.page.evaluate(() => {
            const v = document.querySelector('[data-taxi-view]');
            const t = document.querySelector('[data-taxi]');
            const c = t && getComputedStyle(t);
            return { pagina: v && v.getAttribute('data-page'), visibilidade: c && c.visibility, opacidade: c && c.opacity, oculta: document.hidden, foco: document.hasFocus(), abertura: !!document.querySelector('.preloader-w'), tutorial: !!document.querySelector('[data-tutorial="w"]'), cookies: document.cookie, erros: window.__v?.erros, marcas: window.__v?.marcas };
          });
          naoAbriu.push({ tipo, visita, r, estado });
          console.log(`AVISO ${tipo} ${visita} r${r}: a home não abriu em 60 s  ${JSON.stringify(estado)}`);
          await n.page.screenshot({ path: path.join(SAIDA, `nao-abriu-${tipo}-${visita}-${r}.jpg`), type: 'jpeg', quality: 70 }).catch(() => {});
          await n.page.reload({ waitUntil: 'load', timeout: 90000 });
          await esperarPagina(n.page, 'home');
        }
        await dormir(3000);
        for (let i = 0; i < VOLTAS; i++) {
          let x;
          try {
            x = await percurso(n, tipo, visita, i, cdp);
          } catch (e) {
            const estado = await n.page.evaluate(() => {
              const t = document.querySelector('[data-taxi]');
              const c = t && getComputedStyle(t);
              return { caminho: location.pathname, pagina: document.querySelector('[data-taxi-view]')?.getAttribute('data-page'), opacidade: c && c.opacity, oculta: document.hidden, foco: document.hasFocus(), semQuadroHa: Math.round(performance.now() - window.__v.ultimoQuadro), erros: window.__v.erros };
            }).catch((erro) => String(erro).slice(0, 120));
            naoAbriu.push({ tipo, visita, r, i, estado });
            console.log(`AVISO ${tipo} ${visita} r${r} volta ${i}: ${String(e).split('\n')[0]}  ${JSON.stringify(estado)}`);
            await n.page.screenshot({ path: path.join(SAIDA, `falhou-${tipo}-${visita}-${r}-${i}.jpg`), type: 'jpeg', quality: 70 }).catch(() => {});
            await n.page.goto(`${URL_BASE}/`, { waitUntil: 'load', timeout: 90000 });
            await esperarPagina(n.page, 'home');
            await dormir(3000);
            continue;
          }
          x.rodada = r;
          todas.push(x);
          console.log(`${tipo} ${visita} r${r} volta ${i}: maior pausa ${x.volta.maior} ms, acima de 50 ms ${x.volta.acima50}, acima de 100 ms ${x.volta.acima100}, perdido ${x.volta.tempoPerdido} ms, página ${x.volta.trocaEm} ms, visível ${x.volta.visivelEm} ms, contextos ${x.contextos}, ida ${x.ida.maior} ms`);
          for (const l of x.volta.loaf.slice(0, 2)) console.log(`      ${l.em} ms: quadro de ${l.d} ms, bloqueio ${l.bloqueio}, estilo e layout ${l.estilo} | ${l.scripts.join(' ; ')}`);
          console.log(`      gl: ${JSON.stringify(x.volta.gl)}`);
          if (x.cpu) console.log(`      cpu: ${x.cpu.slice(0, 14).map((c) => `${c[1]} ${c[0]}`).join(' | ')}`);
          if (x.threads) for (const [nome, b] of Object.entries(x.threads)) console.log(`      ${nome}: longos ${JSON.stringify(b.longos.slice(0, 8))} | ${b.proprio.slice(0, 12).map((c) => `${c[1]} ${c[0]}`).join(' | ')}`);
          console.log(`      home parada: ${x.ocioso} ms de thread principal por segundo`);
        }
      }
      if (MODO === 'medir' && !AB) {
        const x = await entradaDireta(n, tipo, cdp);
        x.rodada = r;
        todas.push(x);
        console.log(`${tipo} direta r${r}: maior pausa ${x.volta.maior} ms, perdido ${x.volta.tempoPerdido} ms, página ${x.volta.trocaEm} ms, visível ${x.volta.visivelEm} ms`);
      }
    } finally {
      await fechar(n, perfil);
    }
  }
}

const resumo = {};
const LIMITE = +arg('limite', '0');
const semDesenhar = (x) => x.volta.maiores.filter((q) => q[1] >= 900 && q[1] <= 1100).length >= 4 || x.volta.trocaEm === null;
const descartadas = todas.filter(semDesenhar);
if (descartadas.length) console.log(`\n${descartadas.length} de ${todas.length} voltas fora das medianas, com a janela sem desenhar: ${descartadas.map((x) => `${x.tipo} ${x.visita} r${x.rodada} v${x.i}`).join(', ')}`);
for (const tipo of NAVEGADORES) for (const visita of [...VISITAS, 'direta']) {
  const a = todas.filter((x) => x.tipo === tipo && x.visita === visita && !semDesenhar(x));
  if (!a.length) continue;
  const parte = (l) => ({
    n: l.length,
    maiorMediana: mediana(l.map((x) => x.volta.maior)), maiorPior: Math.max(...l.map((x) => x.volta.maior)),
    perdidoMediana: mediana(l.map((x) => x.volta.tempoPerdido)),
    acima100Mediana: mediana(l.map((x) => x.volta.acima100)),
    paginaMediana: mediana(l.map((x) => x.volta.trocaEm ?? 0)),
    idaMaiorMediana: mediana(l.map((x) => x.ida.maior)),
    ociosoMediana: mediana(l.map((x) => x.ocioso)),
  });
  if (visita === 'direta') { resumo[`${tipo} entrada direta na sessão`] = parte(a); continue; }
  resumo[`${tipo} ${visita}, primeira volta`] = parte(a.filter((x) => x.i === 0));
  if (VOLTAS > 1) resumo[`${tipo} ${visita}, voltas seguintes`] = parte(a.filter((x) => x.i > 0));
}
fs.writeFileSync(path.join(SAIDA, `volta-home-${ROTULO}.json`), JSON.stringify({ rotulo: ROTULO, modo: MODO, url: URL_BASE, resumo, todas }, null, 1));
console.log(`\nResumo ${ROTULO}, modo ${MODO}, em ms:`);
for (const [k, r] of Object.entries(resumo)) console.log(`${k}: maior pausa ${r.maiorMediana} (pior ${r.maiorPior}), tempo em pausas ${r.perdidoMediana}, pausas acima de 100 ms ${r.acima100Mediana}, troca de página ${r.paginaMediana}, ida ${r.idaMaiorMediana}, home parada ${r.ociosoMediana} ms/s, n=${r.n}`);
if (LIMITE) for (const [k, r] of Object.entries(resumo)) confere(`${k}: maior pausa até ${LIMITE} ms`, r.n > 0 && r.maiorMediana <= LIMITE, `${r.maiorMediana} ms, pior ${r.maiorPior}, n=${r.n}`);
if (LIMITE || REFERENCIA) confere('sobram voltas medidas: no máximo 1 em 4 fora das medianas', todas.length > 0 && descartadas.length * 4 <= todas.length, `${descartadas.length} de ${todas.length}`);

confere('a home sempre abre', !naoAbriu.length, `${naoAbriu.length} visita(s) sem abrir`);
confere('nenhum erro de script no percurso', todas.every((x) => !x.erros.length), [...new Set(todas.flatMap((x) => x.erros))].slice(0, 3).join(' | '));
confere('o WebGL não cria contexto novo a cada volta', todas.every((x) => x.contextos <= 1), `máximo ${Math.max(...todas.map((x) => x.contextos))}`);
if (REFERENCIA && MODO === 'medir') {
  const ref = JSON.parse(fs.readFileSync(REFERENCIA, 'utf8')).resumo;
  console.log('\nComparação com a referência, maior pausa e tempo em pausas (referência -> agora):');
  for (const [k, r] of Object.entries(resumo)) {
    const b = ref[k];
    if (!b) continue;
    confere(`${k}: pausa não piorou`, r.n > 0 && r.maiorMediana <= b.maiorMediana * 1.1, `${b.maiorMediana} -> ${r.maiorMediana} ms; em pausas ${b.perdidoMediana} -> ${r.perdidoMediana} ms`);
  }
}
const ok = resultados.filter((x) => x.ok).length;
console.log(`\n${ok} de ${resultados.length} aprovados. Detalhes em ${SAIDA}`);
process.exitCode = ok === resultados.length ? 0 : 1;
