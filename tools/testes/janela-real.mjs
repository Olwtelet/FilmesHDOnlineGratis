// Chrome e Brave de verdade, com janela visível, perfil descartável, relógio real e sem as opções de lançamento do Playwright:
// só a conexão CDP para observar. Abre janelas na tela. Com outro programa na frente o navegador deixaria de desenhar a janela
// coberta, o que parece defeito de início e não é: por isso a oclusão fica desligada, e o tempo medido com o PC em uso vale menos.
//   node tools/testes/janela-real.mjs [--url=http://localhost:4322] [--navegadores=chrome,brave] [--larguras=1440,1536] [--rodadas=2] [--modo=celular|calmo] [--saida=pasta]
// --modo=celular emula um telefone de 390 px pelo CDP, na mesma janela real (sem tutorial, que não existe abaixo de 992 px);
// --modo=calmo liga o movimento reduzido. Nos dois, só as visitas, sem a parte da Programação e do trailer.
// Cada rodada faz uma visita limpa (perfil novo) e uma com cache (mesmo perfil, sem os cookies da abertura). Em cada visita: a
// abertura anima, o ENTER aparece, o clique abre a home, o tutorial toca sem parar no decodificador, FECHAR funciona e o rolo responde.
// No fim, por navegador: Programação direta e um trailer tocando pelo clique.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn, execSync } from 'node:child_process';
import { chromium } from 'playwright';
import sharp from 'sharp';

const arg = (n, d) => (process.argv.find((a) => a.startsWith(`--${n}=`)) || `--${n}=${d}`).split('=').slice(1).join('=');
const URL_BASE = arg('url', 'http://localhost:4322').replace(/\/$/, '');
const NAVEGADORES = arg('navegadores', 'chrome,brave').split(',');
const LARGURAS = arg('larguras', '1440,1536').split(',').map(Number);
const RODADAS = +arg('rodadas', 2);
const SAIDA = path.resolve(arg('saida', path.join(os.tmpdir(), 'fhdog-janela-real')));
const MODO = arg('modo', '');
if (!['', 'celular', 'calmo'].includes(MODO)) { console.error(`--modo desconhecido: ${MODO}`); process.exit(2); }
const UA_CELULAR = 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36';
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

// A ordem da abertura, lida uma vez na hora do ENTER, das próprias animações CSS: nada de ler estilo a cada quadro durante a carga.
// pintura: primeiro quadro do documento; sinal: o traço ou a primeira faixa da carta começa; captura: a carta começa a se
// comprimir no traço; nome: o nome começa a abrir; parado: a última animação do traço, das faixas, da captura e do nome terminou.
// Também: quantas cópias do nome estão à vista, se a faixa do topo espera, e se a fonte do nome já estava pronta quando ele
// começou a aparecer (a SONDA anota) ou se a abertura ficou na reserva. Com movimento reduzido não há sinal nem captura.
const LER_ORDEM = () => {
  const pintura = performance.getEntriesByType('paint').find((e) => e.name === 'first-paint')?.startTime ?? null;
  const de = (fn) => document.getAnimations().filter((a) => a.animationName && a.startTime !== null && fn(a)).map((a) => ({ nome: a.animationName, ini: a.startTime + a.effect.getTiming().delay, fim: a.startTime + a.effect.getComputedTiming().endTime }));
  const em = (sel) => (a) => !!a.effect.target?.matches?.(sel) && !a.effect.pseudoElement;
  const sinal = de(em('.ab-linha, .ab-fatia'));
  const captura = de((a) => a.animationName === 'ab-captura')[0] || null;
  const nome = de((a) => em('.ab-nome')(a) && a.animationName !== 'ab-reserva' && a.animationName !== 'ab-fecha');
  const tudo = de((a) => em('.ab-linha, .ab-fatia, .ab-sinal, .ab-nome, .ab-canal')(a) && a.animationName !== 'ab-reserva' && a.animationName !== 'ab-fecha');
  const faixa = de(em('.ab-faixa'))[0] || null;
  const topo = de((a) => a.effect.pseudoElement === '::before' && a.animationName === 'ab-vem')[0] || null;
  const raiz = document.documentElement.classList;
  const r = (x) => (x == null ? null : Math.round(x));
  const relogio = document.querySelector('.ab-nome')?.getAnimations?.().find((a) => a.animationName !== 'ab-reserva');
  return {
    pintura: r(pintura),
    inicio: relogio && relogio.startTime !== null ? r(relogio.startTime) : null,
    sinal: sinal.length ? r(Math.min(...sinal.map((x) => x.ini))) : null,
    captura: r(captura?.ini),
    nome: nome.length ? r(Math.min(...nome.map((x) => x.ini))) : null,
    parado: tudo.length ? r(Math.max(...tudo.map((x) => x.fim))) : null,
    faixa: r(faixa?.ini),
    topo: r(topo?.ini),
    ativa: raiz.contains('abertura-ativa'),
    copias: [...document.querySelectorAll('.ab-canal')].filter((e) => getComputedStyle(e).display !== 'none').length,
    reserva: raiz.contains('abertura-reserva'),
    fonte: window.__m?.fonteNoNome ?? null,
  };
};
// Preto por pelo menos 400 ms depois do primeiro quadro, faixa do topo inclusive. O sinal começa antes da captura, e o nome só
// abre na captura, nunca antes; com movimento reduzido não há sinal nem captura. O nome fica parado pelo menos 1 s antes do ENTER.
// A faixa da abertura acende com o sinal (com o nome, no movimento reduzido); a da página, só depois de tudo parar. Duas cópias do
// nome à vista (uma no movimento reduzido), e a fonte pronta quando o nome apareceu, ou a abertura na reserva.
function ordemCerta(o, enter, calmo = false) {
  if (!o || o.pintura === null || o.nome === null || o.parado === null) return { ok: false, texto: JSON.stringify(o) };
  const primeiro = Math.min(o.nome, o.sinal ?? Infinity, o.faixa ?? Infinity);
  const preto = primeiro - o.pintura;
  const historia = calmo ? o.sinal === null && o.captura === null : o.sinal !== null && o.captura !== null && o.sinal < o.captura && o.nome >= o.captura && o.nome <= o.captura + 600;
  const folga = enter - o.parado;
  const faixas = o.faixa !== null && (calmo ? Math.abs(o.faixa - o.nome) <= 60 : o.faixa >= o.sinal - 20 && o.faixa < o.captura) && o.topo !== null && o.topo >= o.parado - 100;
  const copias = o.ativa && faixas && o.copias === (calmo ? 1 : 2);
  const fonte = o.reserva || o.fonte === true;
  const ok = preto >= 400 && historia && folga >= 1000 && copias && fonte;
  const d = (x) => (x === null ? '-' : x - o.pintura);
  return { ok, preto, folga, texto: `preto ${preto} ms, sinal ${d(o.sinal)}, captura ${d(o.captura)}, nome ${d(o.nome)}, parado ${d(o.parado)}, ENTER ${Math.round(enter - o.pintura)} ms depois do primeiro quadro; ${o.copias} cópias, faixa ${d(o.faixa)}, topo ${o.topo === null ? 'sem espera' : d(o.topo)}; fonte ${o.reserva ? 'na reserva' : o.fonte === true ? 'pronta' : o.fonte === false ? 'atrasada e sem reserva' : 'sem registro'}` };
}

async function emularCelular(cdp) {
  await cdp.send('Emulation.setUserAgentOverride', { userAgent: UA_CELULAR }).catch(() => {});
  await cdp.send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true }).catch(() => {});
  await cdp.send('Emulation.setTouchEmulationEnabled', { enabled: true }).catch(() => {});
}
const SONDA = () => {
  if (window.__m) return;
  const m = (window.__m = { enter: null, clique: null, home: null, animou: false, quadros: 0, erros: [], longa: 0, fonteNoNome: null });
  // no instante em que o nome começa a aparecer, a fonte dele já tinha chegado? Se não, local-preloader.js precisa fixar a reserva
  document.addEventListener('animationstart', (e) => { if (e.animationName !== 'ab-reserva' && e.target.classList?.contains('ab-nome') && m.fonteNoNome == null) m.fonteNoNome = document.fonts.check('800 100px "Sinal Abertura"'); }, true);
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
  const filho = spawn(EXE[tipo], [`--remote-debugging-port=${porta}`, `--user-data-dir=${perfil}`, '--no-first-run', '--no-default-browser-check', '--disable-backgrounding-occluded-windows', '--disable-features=CalculateNativeWinOcclusion', `--window-size=${largura + 16},${ALTURA + 120}`, 'about:blank'], { stdio: 'ignore' });
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
  const quadros = [];
  const aoQuadro = async (f) => { quadros.push({ t: f.metadata.timestamp, data: f.data }); await cdp.send('Page.screencastFrameAck', { sessionId: f.sessionId }).catch(() => {}); };
  cdp.on('Page.screencastFrame', aoQuadro);
  await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 60, everyNthFrame: 1, maxWidth: 480, maxHeight: 480 }).catch(() => {});
  await page.goto(`${URL_BASE}/`, { waitUntil: 'commit', timeout: 60000 });
  // no primeiro carregamento de um Brave novo a emulação já se perdeu uma vez: de novo, assim que a página nasce
  if (MODO === 'celular') await emularCelular(cdp);
  if (comFoto) {
    await dormir(1500);
    await page.screenshot({ path: path.join(SAIDA, `${rotulo}-abertura.jpg`), type: 'jpeg', quality: 70 }).catch(() => {});
  }
  await page.waitForFunction(() => { const b = document.querySelector('[data-preloader="btn"]'); return window.__m && window.__m.enter !== null && b && b.onclick && +getComputedStyle(b).opacity > 0.5; }, null, { timeout: 60000 });
  if (comFoto) await page.screenshot({ path: path.join(SAIDA, `${rotulo}-enter.jpg`), type: 'jpeg', quality: 70 }).catch(() => {});
  r.ordem = await page.evaluate(LER_ORDEM).catch(() => null);
  const pintado = await page.evaluate(() => performance.timeOrigin + (performance.getEntriesByType('paint').find((e) => e.name === 'first-paint')?.startTime ?? 0));
  r.ambiente = await page.evaluate(() => ({ largura: innerWidth, calmo: matchMedia('(prefers-reduced-motion: reduce)').matches }));
  await cdp.send('Page.stopScreencast').catch(() => {});
  cdp.off('Page.screencastFrame', aoQuadro);
  // pelos pixels: do primeiro quadro pintado ao primeiro com alguma luz; 12 porque o ruído do monitor sobre o preto fica em 3
  const doc = quadros.filter((q) => q.t * 1000 >= pintado - 20);
  const luz = await Promise.all(doc.map(async (q) => (await sharp(Buffer.from(q.data, 'base64')).greyscale().stats()).channels[0].max));
  const aceso = luz.findIndex((v) => v > 12);
  r.escuro = aceso > 0 ? Math.round(doc[aceso].t * 1000 - pintado) : aceso === 0 ? 0 : null;
  if (comFoto && doc.length > 8) {
    const alvos = [0, 600, 1050, 1400, 1800, 2300, 2800, 3200, 3400, 3550, 3750, 4100, 4600, 5300, 99999]; // o último: o quadro do ENTER
    const idx = alvos.map((ms) => doc.reduce((m, q, i) => (Math.abs(q.t * 1000 - pintado - ms) < Math.abs(doc[m].t * 1000 - pintado - ms) ? i : m), 0));
    const blocos = await Promise.all(idx.map(async (i, k) => {
      const legenda = Buffer.from(`<svg width="240" height="22"><rect width="100%" height="100%" fill="#222"/><text x="6" y="16" font-family="monospace" font-size="14" fill="#fff">${Math.round(doc[i].t * 1000 - pintado)} ms</text></svg>`);
      const img = await sharp(Buffer.from(doc[i].data, 'base64')).resize(240, 180, { fit: 'contain', background: '#333' }).toBuffer();
      return { input: await sharp({ create: { width: 240, height: 202, channels: 3, background: '#111' } }).composite([{ input: legenda, top: 0, left: 0 }, { input: img, top: 22, left: 0 }]).jpeg().toBuffer(), left: (k % 5) * 244, top: Math.floor(k / 5) * 206 };
    }));
    await sharp({ create: { width: 5 * 244, height: 3 * 206, channels: 3, background: '#000' } }).composite(blocos).jpeg({ quality: 85 }).toFile(path.join(SAIDA, `${rotulo}-sequencia.jpg`)).catch(() => {});
  }
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
  if (MODO === 'celular') {
    r.fpsFechar = null;
    r.msFechar = null;
    await dormir(2500);
  } else {
  await page.waitForFunction(() => { const v = document.querySelector('[data-tutorial="video"]'); return v && v.currentTime > 0.2; }, null, { timeout: 15000 }).catch(() => {});
  const v1 = await page.evaluate(() => { const v = document.querySelector('[data-tutorial="video"]'); return v ? { t: v.currentTime, q: v.getVideoPlaybackQuality?.().totalVideoFrames ?? 0, src: v.currentSrc.split('/').pop() } : null; });
  await dormir(4000);
  const v2 = await page.evaluate(() => { const v = document.querySelector('[data-tutorial="video"]'); return v ? { t: v.currentTime, q: v.getVideoPlaybackQuality?.().totalVideoFrames ?? 0, perdidos: v.getVideoPlaybackQuality?.().droppedVideoFrames ?? 0, pausado: v.paused, pronto: v.readyState } : null; });
  r.tutorial = v1 && v2 ? { src: v1.src, avancou: +(v2.t - v1.t).toFixed(2), quadros: v2.q - v1.q, perdidos: v2.perdidos, pronto: v2.pronto } : null;
  if (comFoto) await page.screenshot({ path: path.join(SAIDA, `${rotulo}-tutorial.jpg`), type: 'jpeg', quality: 70 }).catch(() => {});
  const q0 = await page.evaluate(() => ({ quadros: window.__m.quadros, t: performance.now() }));
  await page.click('[data-tutorial="close"]', { timeout: 10000 }).catch((e) => r.console.push(`FECHAR: ${String(e).split('\n')[0]}`));
  await page.waitForFunction(() => { const t = document.querySelector('[data-tutorial="w"]'); return !t || t.getClientRects().length === 0 || +getComputedStyle(t).opacity < 0.05; }, null, { timeout: 8000 }).catch(() => r.console.push('tutorial não saiu'));
  const q1 = await page.evaluate(() => ({ quadros: window.__m.quadros, t: performance.now() }));
  r.fpsFechar = Math.round(((q1.quadros - q0.quadros) * 1000) / (q1.t - q0.t));
  r.msFechar = Math.round(q1.t - q0.t);
  await dormir(1500);
  }
  // o item do rolo que está no meio da janela; o primeiro .top-m-film-title é fixo da lista do menu e nunca muda
  const titulo = () => page.evaluate(() => {
    const itens = [...document.querySelectorAll('[data-roll="item"]')];
    const d = itens.map((el) => { const b = el.getBoundingClientRect(); return Math.abs(b.top + b.height / 2 - innerHeight / 2); });
    const it = itens[d.indexOf(Math.min(...d))];
    return it ? it.getAttribute('data-sessao') || 'aviso' : null;
  });
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

// Visita com o navegador a 1 quadro por segundo é janela sem desenhar, não o site: como na volta à home, fica fora da conta e é contada à parte.
const semDesenhar = (r) => r.fps < 20 || (r.fpsFechar != null && r.fpsFechar < 20);

function julgar(r) {
  const nome = r.rotulo;
  if (semDesenhar(r)) {
    console.log(`aviso ${nome}: janela sem desenhar, ${r.fps} q/s até a home e ${r.fpsFechar} q/s ao fechar o tutorial; home em ${r.home.toFixed(0)} ms, fora da conta`);
    confere(`${nome}: home abre`, r.home > 0);
    const erros = r.console.filter((x) => x !== 'tutorial não saiu' && !x.startsWith('FECHAR:'));
    confere(`${nome}: console limpo`, erros.length === 0, erros.slice(0, 2).join(' | '));
    return;
  }
  confere(`${nome}: abertura anima`, r.animou);
  const o = ordemCerta(r.ordem, r.enter, MODO === 'calmo');
  confere(`${nome}: preto, sinal, nome e ENTER, nessa ordem`, o.ok, o.texto);
  confere(`${nome}: começa preto, pelos quadros`, r.escuro !== null && r.escuro >= 400, `${r.escuro} ms do primeiro quadro pintado até o primeiro com luz`);
  if (MODO === 'celular') confere(`${nome}: emulação de celular valeu`, r.ambiente?.largura === 390, JSON.stringify(r.ambiente));
  if (MODO === 'calmo') confere(`${nome}: movimento reduzido valeu`, r.ambiente?.calmo === true, JSON.stringify(r.ambiente));
  confere(`${nome}: home abre`, r.home > 0, `ENTER ${r.enter.toFixed(0)} ms, home ${r.home.toFixed(0)} ms depois do clique, ${r.fps} q/s, tarefa longa ${r.longa} ms`);
  if (MODO !== 'celular') confere(`${nome}: tutorial toca sem parar`, !!r.tutorial && r.tutorial.avancou > 3 && !r.midia.length, JSON.stringify(r.tutorial) + (r.midia.length ? ` mídia: ${r.midia.slice(0, 2).join(' | ')}` : ''));
  confere(`${nome}: seta troca o filme`, !!r.rolo.de && r.rolo.de !== r.rolo.para, `${r.rolo.de} -> ${r.rolo.para}${r.msFechar != null ? `; FECHAR levou ${r.msFechar} ms a ${r.fpsFechar} q/s` : ''}`);
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
        // o Playwright termina de preparar a página depois de conectar e, no Brave, desfazia a emulação feita antes disso
        await n.page.evaluate(() => 1);
        await dormir(300);
        if (MODO === 'celular') await emularCelular(cdp);
        if (MODO === 'calmo') await cdp.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
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
  if (MODO) continue;
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
    // O link do YouTube com aba de verdade: a aba nova vem para a frente e a do site para de desenhar. O som tem de sair mesmo assim.
    await n.page.click("[data-videoplayer='trigger']", { timeout: 15000 });
    await dormir(5000);
    const [aba] = await Promise.all([n.ctx.waitForEvent('page', { timeout: 15000 }), n.page.click('[data-trailer-fora]', { timeout: 15000 })]);
    await dormir(1500);
    const atras = await n.page.evaluate(() => ({ iframes: document.querySelectorAll('iframe.yt-trailer').length, escondida: document.hidden }));
    confere(`${tipo}: link do YouTube tira o player na hora`, atras.iframes === 0, JSON.stringify(atras));
    await aba.waitForURL('**/watch?v=*', { timeout: 30000 }).catch(() => {});
    confere(`${tipo}: link do YouTube abre o filme`, /watch\?v=giAMydh9_4I/.test(aba.url()), aba.url());
    await aba.close();
    await n.page.bringToFront();
    const fechou = await n.page.waitForFunction(() => !document.querySelector("[data-videoplayer='dialog']").classList.contains('open') && !document.documentElement.classList.contains('lenis-stopped'), null, { timeout: 10000 }).then(() => true, () => false);
    confere(`${tipo}: de volta à aba, diálogo fechado e página rolando`, fechou);
  } catch (e) {
    confere(`${tipo}: Programação e trailer`, false, String(e).split('\n')[0]);
  }
  await fechar(n, perfil);
}

for (const tipo of NAVEGADORES) {
  for (const v of ['limpa', 'cache']) {
    const g = todas.filter((r) => r.tipo === tipo && r.visita === v && r.enter && !semDesenhar(r));
    if (!g.length) continue;
    console.log(`info  ${tipo} ${v}, n=${g.length}: ENTER mediana ${mediana(g.map((r) => r.enter)).toFixed(0)} ms, máx ${Math.max(...g.map((r) => r.enter)).toFixed(0)}; home ${mediana(g.map((r) => r.home)).toFixed(0)} ms; tarefa longa máx ${Math.max(...g.map((r) => r.longa))} ms`);
  }
}
const fora = todas.filter(semDesenhar).length;
confere('sobram visitas medidas: no máximo 1 em 4 com a janela sem desenhar', todas.length > 0 && fora * 4 <= todas.length, `${fora} de ${todas.length}`);
fs.writeFileSync(path.join(SAIDA, 'visitas.json'), JSON.stringify(todas, null, 1));
const falhas = resultados.filter((r) => !r.ok);
console.log(`\n${resultados.length - falhas.length} de ${resultados.length} aprovados. Capturas em ${SAIDA}`);
if (falhas.length) process.exit(1);
