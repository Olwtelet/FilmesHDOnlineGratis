// Chrome e Brave de verdade, com janela visível, perfil descartável, relógio real e sem as opções de lançamento do Playwright:
// só a conexão CDP para observar. Abre janelas na tela: rode com o PC livre e o trabalho salvo.
//   node tools/testes/janela-real.mjs [--url=http://localhost:4322] [--navegadores=chrome,brave] [--larguras=1440,1536] [--rodadas=2] [--saida=pasta]
// Cada rodada faz uma visita limpa (perfil novo) e uma com cache (mesmo perfil, sem os cookies da abertura). Em cada visita: a
// abertura anima, o ENTER aparece, o clique abre a home, o tutorial toca sem parar no decodificador, FECHAR funciona e o rolo responde.
// No fim, por navegador: Programação direta e um trailer tocando pelo clique.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn, execSync } from 'node:child_process';
import { chromium } from 'playwright';

const arg = (n, d) => (process.argv.find((a) => a.startsWith(`--${n}=`)) || `--${n}=${d}`).split('=').slice(1).join('=');
const URL_BASE = arg('url', 'http://localhost:4322').replace(/\/$/, '');
const NAVEGADORES = arg('navegadores', 'chrome,brave').split(',');
const LARGURAS = arg('larguras', '1440,1536').split(',').map(Number);
const RODADAS = +arg('rodadas', 2);
const SAIDA = path.resolve(arg('saida', path.join(os.tmpdir(), 'fhdog-janela-real')));
const EXE = {
  chrome: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  brave: path.join(process.env.LOCALAPPDATA, 'BraveSoftware/Brave-Browser/Application/brave.exe'),
};
const ALTURA = 825;
fs.mkdirSync(SAIDA, { recursive: true });
const dormir = (ms) => new Promise((r) => setTimeout(r, ms));

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

const SONDA = () => {
  if (window.__m) return;
  const m = (window.__m = { enter: null, clique: null, home: null, animou: false, quadros: 0, erros: [], longa: 0 });
  try {
    new PerformanceObserver((l) => { for (const e of l.getEntries()) m.longa = Math.max(m.longa, Math.round(e.duration)); }).observe({ type: 'longtask', buffered: true });
  } catch {}
  addEventListener('error', (e) => m.erros.push(String(e.message)));
  addEventListener('unhandledrejection', (e) => m.erros.push(String(e.reason)));
  document.addEventListener('click', () => { if (m.clique === null) m.clique = performance.now(); }, true);
  const olhar = () => {
    m.quadros++;
    const ab = document.querySelector('.abertura');
    if (ab && ab.getClientRects().length > 0 && ab.getAnimations({ subtree: true }).some((a) => a.playState === 'running')) m.animou = true;
    const btn = document.querySelector('[data-preloader="btn"]');
    if (m.enter === null && btn && getComputedStyle(btn).visibility === 'visible') m.enter = performance.now();
    const taxi = document.querySelector('[data-taxi]');
    if (m.clique !== null && m.home === null && taxi) {
      const c = getComputedStyle(taxi);
      if (c.visibility !== 'hidden' && +c.opacity > 0.01) m.home = performance.now();
    }
    requestAnimationFrame(olhar);
  };
  requestAnimationFrame(olhar);
};

let porta = 9300 + (process.pid % 400);
async function abrirNavegador(tipo, perfil, largura) {
  porta++;
  const filho = spawn(EXE[tipo], [`--remote-debugging-port=${porta}`, `--user-data-dir=${perfil}`, '--no-first-run', '--no-default-browser-check', `--window-size=${largura + 16},${ALTURA + 120}`, 'about:blank'], { stdio: 'ignore' });
  for (let i = 0; i < 100; i++) {
    try { if ((await fetch(`http://127.0.0.1:${porta}/json/version`)).ok) break; } catch {}
    await dormir(100);
  }
  const navegador = await chromium.connectOverCDP(`http://127.0.0.1:${porta}`);
  const ctx = navegador.contexts()[0];
  await ctx.addInitScript(SONDA);
  const page = ctx.pages()[0] || (await ctx.newPage());
  return { filho, navegador, ctx, page };
}
async function fechar({ filho, navegador }, perfil) {
  await navegador.close().catch(() => {});
  // só a árvore desta janela: o navegador do proprietário continua aberto
  try { execSync(`taskkill /PID ${filho.pid} /T /F`, { stdio: 'ignore' }); } catch {}
  await dormir(500);
  try { fs.rmSync(perfil, { recursive: true, force: true }); } catch {}
}

async function visita(page, cdp, rotulo, comFoto) {
  const r = { rotulo, midia: [], console: [] };
  const aoConsole = (m) => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) r.console.push(m.text().slice(0, 200)); };
  const aoMidia = (p) => {
    for (const x of p.events || []) if (/UNDERFLOW|error/i.test(JSON.stringify(x))) r.midia.push(JSON.stringify(x.value).slice(0, 120));
    for (const x of p.messages || []) if (/underflow/i.test(x.message)) r.midia.push(x.message.slice(0, 120));
  };
  page.on('console', aoConsole);
  cdp.on('Media.playerEventsAdded', aoMidia);
  cdp.on('Media.playerMessagesLogged', aoMidia);
  await page.goto(`${URL_BASE}/`, { waitUntil: 'commit', timeout: 60000 });
  if (comFoto) {
    await dormir(1500);
    await page.screenshot({ path: path.join(SAIDA, `${rotulo}-abertura.jpg`), type: 'jpeg', quality: 70 }).catch(() => {});
  }
  await page.waitForFunction(() => { const b = document.querySelector('[data-preloader="btn"]'); return window.__m && window.__m.enter !== null && b && b.onclick && +getComputedStyle(b).opacity > 0.5; }, null, { timeout: 60000 });
  if (comFoto) await page.screenshot({ path: path.join(SAIDA, `${rotulo}-enter.jpg`), type: 'jpeg', quality: 70 }).catch(() => {});
  const antes = await page.evaluate(() => ({ quadros: window.__m.quadros, t: performance.now() }));
  await page.click('[data-preloader="btn"]');
  await page.waitForFunction(() => window.__m.home !== null, null, { timeout: 60000 });
  const m1 = await page.evaluate(() => ({ ...window.__m }));
  r.enter = m1.enter;
  r.home = m1.home - m1.clique;
  r.animou = m1.animou;
  r.fps = Math.round(((m1.quadros - antes.quadros) * 1000) / (m1.home - antes.t));
  r.longa = m1.longa;
  // tutorial: o vídeo começa 2 s depois do ENTER, e abaixo de 992 px não existe
  await page.waitForFunction(() => { const v = document.querySelector('[data-tutorial="video"]'); return v && v.currentTime > 0.2; }, null, { timeout: 15000 }).catch(() => {});
  const v1 = await page.evaluate(() => { const v = document.querySelector('[data-tutorial="video"]'); return v ? { t: v.currentTime, q: v.getVideoPlaybackQuality?.().totalVideoFrames ?? 0, src: v.currentSrc.split('/').pop() } : null; });
  await dormir(4000);
  const v2 = await page.evaluate(() => { const v = document.querySelector('[data-tutorial="video"]'); return v ? { t: v.currentTime, q: v.getVideoPlaybackQuality?.().totalVideoFrames ?? 0, perdidos: v.getVideoPlaybackQuality?.().droppedVideoFrames ?? 0, pausado: v.paused, pronto: v.readyState } : null; });
  r.tutorial = v1 && v2 ? { src: v1.src, avancou: +(v2.t - v1.t).toFixed(2), quadros: v2.q - v1.q, perdidos: v2.perdidos, pronto: v2.pronto } : null;
  if (comFoto) await page.screenshot({ path: path.join(SAIDA, `${rotulo}-tutorial.jpg`), type: 'jpeg', quality: 70 }).catch(() => {});
  await page.click('[data-tutorial="close"]', { timeout: 10000 }).catch((e) => r.console.push(`FECHAR: ${String(e).split('\n')[0]}`));
  await page.waitForFunction(() => { const t = document.querySelector('[data-tutorial="w"]'); return !t || t.getClientRects().length === 0 || +getComputedStyle(t).opacity < 0.05; }, null, { timeout: 8000 }).catch(() => r.console.push('tutorial não saiu'));
  await dormir(1500);
  const titulo = () => page.evaluate(() => document.querySelector('[data-menu="w"] .top-m-film-title, .top-m-film-title')?.textContent.trim());
  const t0 = await titulo();
  await page.keyboard.press('ArrowDown');
  await dormir(1500);
  const t1 = await titulo();
  r.rolo = { de: t0, para: t1 };
  if (comFoto) await page.screenshot({ path: path.join(SAIDA, `${rotulo}-home.jpg`), type: 'jpeg', quality: 70 }).catch(() => {});
  const fim = await page.evaluate(() => window.__m.erros);
  r.console.push(...fim);
  page.off('console', aoConsole);
  cdp.off('Media.playerEventsAdded', aoMidia);
  cdp.off('Media.playerMessagesLogged', aoMidia);
  return r;
}

function julgar(r) {
  const nome = r.rotulo;
  confere(`${nome}: abertura anima`, r.animou);
  confere(`${nome}: home abre`, r.home > 0, `ENTER ${r.enter.toFixed(0)} ms, home ${r.home.toFixed(0)} ms depois do clique, ${r.fps} q/s, tarefa longa ${r.longa} ms`);
  confere(`${nome}: tutorial toca sem parar`, !!r.tutorial && r.tutorial.avancou > 3 && !r.midia.length, JSON.stringify(r.tutorial) + (r.midia.length ? ` mídia: ${r.midia.slice(0, 2).join(' | ')}` : ''));
  confere(`${nome}: seta troca o filme`, !!r.rolo.de && r.rolo.de !== r.rolo.para, `${r.rolo.de} -> ${r.rolo.para}`);
  confere(`${nome}: console limpo`, r.console.length === 0, r.console.slice(0, 2).join(' | '));
}

const todas = [];
for (const tipo of NAVEGADORES) {
  if (!fs.existsSync(EXE[tipo])) {
    confere(`${tipo}: instalado`, false, EXE[tipo]);
    continue;
  }
  for (const largura of LARGURAS) {
    for (let i = 0; i < RODADAS; i++) {
      const perfil = fs.mkdtempSync(path.join(os.tmpdir(), `fhdog-${tipo}-`));
      const n = await abrirNavegador(tipo, perfil, largura);
      try {
        const cdp = await n.ctx.newCDPSession(n.page);
        await cdp.send('Media.enable').catch(() => {});
        const limpa = await visita(n.page, cdp, `${tipo}-${largura}-${i}-limpa`, i === 0);
        limpa.tipo = tipo; limpa.visita = 'limpa'; todas.push(limpa); julgar(limpa);
        await n.ctx.clearCookies();
        await dormir(800);
        const cache = await visita(n.page, cdp, `${tipo}-${largura}-${i}-cache`, false);
        cache.tipo = tipo; cache.visita = 'cache'; todas.push(cache); julgar(cache);
      } catch (e) {
        confere(`${tipo}-${largura}-${i}: visita terminou`, false, String(e).split('\n')[0]);
      }
      await fechar(n, perfil);
    }
  }
  // Programação direta e um trailer de verdade
  const perfil = fs.mkdtempSync(path.join(os.tmpdir(), `fhdog-${tipo}-`));
  const n = await abrirNavegador(tipo, perfil, 1440);
  try {
    await n.ctx.addCookies([{ name: 'preloader_shown', value: String(Date.now()), url: URL_BASE }, { name: 'tutorial_shown', value: 'true', url: URL_BASE }]);
    await n.page.goto(`${URL_BASE}/programacao/`, { waitUntil: 'commit', timeout: 60000 });
    await n.page.waitForFunction(() => { const t = document.querySelector('[data-taxi]'); return t && getComputedStyle(t).visibility !== 'hidden'; }, null, { timeout: 60000 });
    await dormir(5000);
    await n.page.screenshot({ path: path.join(SAIDA, `${tipo}-programacao.jpg`), type: 'jpeg', quality: 70 });
    confere(`${tipo}: Programação abre`, true, `folha ${tipo}-programacao.jpg`);
    await n.page.goto(`${URL_BASE}/sessoes/bugonia-2025/`, { waitUntil: 'commit', timeout: 60000 });
    await n.page.waitForSelector("[data-videoplayer='trigger']", { timeout: 60000 });
    await dormir(4000);
    await n.page.locator("[data-videoplayer='trigger']").scrollIntoViewIfNeeded().catch(() => {});
    await dormir(1500);
    await n.page.click("[data-videoplayer='trigger']", { timeout: 15000 });
    await dormir(7000);
    const quadro = n.page.frames().find((f) => /youtube(-nocookie)?\.com\/embed\//.test(f.url()));
    const tocando = quadro ? await quadro.evaluate(() => { const v = document.querySelector('video'); return v ? { t: v.currentTime, pausado: v.paused, mudo: v.muted, pronto: v.readyState } : null; }).catch((e) => ({ erro: String(e).split('\n')[0] })) : null;
    await n.page.screenshot({ path: path.join(SAIDA, `${tipo}-trailer.jpg`), type: 'jpeg', quality: 70 });
    confere(`${tipo}: trailer toca pelo clique`, !!tocando && tocando.t > 1 && !tocando.pausado, JSON.stringify(tocando));
    await n.page.keyboard.press('Escape');
    await dormir(1500);
    const saiu = await n.page.evaluate(() => !document.querySelector('iframe.yt-trailer'));
    confere(`${tipo}: Escape fecha o trailer`, saiu);
  } catch (e) {
    confere(`${tipo}: Programação e trailer`, false, String(e).split('\n')[0]);
  }
  await fechar(n, perfil);
}

for (const tipo of NAVEGADORES) {
  for (const v of ['limpa', 'cache']) {
    const g = todas.filter((r) => r.tipo === tipo && r.visita === v && r.enter);
    if (!g.length) continue;
    console.log(`info  ${tipo} ${v}, n=${g.length}: ENTER mediana ${mediana(g.map((r) => r.enter)).toFixed(0)} ms, máx ${Math.max(...g.map((r) => r.enter)).toFixed(0)}; home ${mediana(g.map((r) => r.home)).toFixed(0)} ms; tarefa longa máx ${Math.max(...g.map((r) => r.longa))} ms`);
  }
}
fs.writeFileSync(path.join(SAIDA, 'visitas.json'), JSON.stringify(todas, null, 1));
const falhas = resultados.filter((r) => !r.ok);
console.log(`\n${resultados.length - falhas.length} de ${resultados.length} aprovados. Capturas em ${SAIDA}`);
if (falhas.length) process.exit(1);
