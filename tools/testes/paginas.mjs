// Toda página pública e toda palavra pública, contra o build em produção.
//   node tools/testes/paginas.mjs [--url=http://localhost:4322] [--canal=msedge] [--so=matriz,titulos,menu,despejo,links,dados,marca]
//                                 [--paralelo=3] [--filtro=regex-do-caminho] [--tam=390x844,360x640] [--saida=pasta]
// Sempre headless. Nada é editado no site. Em --saida ficam capturas, o detalhe de cada visita (visitas.jsonl) e o despejo do texto.
//
// O que cada parte faz:
//   matriz   cada página em cada tamanho, rolando com a roda ou com toque: console, rede, CSP, terceiros, transbordo, imagens,
//            texto vazio que ocupa espaço, texto cortado (mede a tinta de cada letra contra as caixas com overflow oculto) e
//            palavra partida no meio.
//   titulos  home e Programação nos instantes com sessão futura, inclusive o título longo.
//   menu     painel principal e painel de filmes abertos, medidos do mesmo jeito.
//   despejo  texto de todas as páginas nos dois estados do relógio, com atributos, metadados, JSON-LD e pseudoelementos,
//            mais as cadeias dos local-*.js e do app.js, o content do CSS, RSS, sitemap e robots.
//   links    cada link interno na forma canônica (o Taxi compara a URL como texto) e cada link externo respondendo.
//   dados    datas, títulos, duração, RSS, sitemap e JSON-LD conferidos contra src/data/sessoes/*.json.
//   marca    og:image e favicons conferidos contra reference/brand/simbolo.png.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { chromium } from 'playwright';
import sharp from 'sharp';
import { parse } from 'parse5';

const arg = (n, d) => { const a = process.argv.find((x) => x.startsWith(`--${n}=`)); return a ? a.slice(n.length + 3) : d; };
const BASE = arg('url', 'http://localhost:4322');
const CANAL = arg('canal', 'msedge');
const PARTES = arg('so', 'matriz,titulos,menu,despejo,links,dados,marca').split(',');
const PARALELO = +arg('paralelo', '3');
const FILTRO = arg('filtro', '') ? new RegExp(arg('filtro', '')) : null;
const SO_TAM = arg('tam', '') ? arg('tam', '').split(',') : null;
const SAIDA = path.resolve(arg('saida', path.join(os.tmpdir(), 'fhdog-paginas')));
const RAIZ = path.resolve(import.meta.dirname, '../..');
const DIST = path.join(RAIZ, 'dist');
const CAPTURAS = path.join(SAIDA, 'capturas');
fs.mkdirSync(CAPTURAS, { recursive: true });

const UA_CELULAR = 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36';
const UA_TABLET = 'Mozilla/5.0 (Linux; Android 14; SM-X710) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';
const TAMANHOS = [
  { nome: '1440x900', width: 1440, height: 900 },
  { nome: '1920x1080', width: 1920, height: 1080 },
  { nome: '1280x720', width: 1280, height: 720 },
  { nome: '1536x730', width: 1536, height: 730 },
  { nome: '820x1180', width: 820, height: 1180, ua: UA_TABLET },
  { nome: '390x844', width: 390, height: 844, ua: UA_CELULAR },
  { nome: '360x640', width: 360, height: 640, ua: UA_CELULAR },
  { nome: '320x568', width: 320, height: 568, ua: UA_CELULAR },
];
const tamanhosValidos = TAMANHOS.filter((t) => !SO_TAM || SO_TAM.includes(t.nome));
const SEMPRE_TODOS = ['1440x900', '390x844'];
const AMOSTRA = ['ready-or-not-double-feature-2026', 'the-hateful-eight-2015', 'truth-treachery-2026'];
const INEXISTENTE = '/endereco-que-nao-existe/';
const FIXAS = ['/', '/programacao/', '/sobre/', '/contato/', '/cookies/', '/termos/', '/privacidade/', INEXISTENTE];

const SESSOES = fs.readdirSync(path.join(RAIZ, 'src/data/sessoes'))
  .filter((f) => f.endsWith('.json') && !f.startsWith('_'))
  .map((f) => JSON.parse(fs.readFileSync(path.join(RAIZ, 'src/data/sessoes', f), 'utf8')));
const SLUGS = SESSOES.map((s) => s.slug);

// Instantes que exercitam os títulos: São Paulo, sempre -03:00 nestas datas.
const INSTANTES = [
  { rotulo: 'obsessao', quando: '2026-07-01T12:00' },
  { rotulo: 'titulo-longo', quando: '2026-07-20T12:00' },
  { rotulo: 'hoje', quando: '2026-10-31T12:00' },
];

const resultados = [];
function confere(nome, ok, detalhe = '') {
  resultados.push({ nome, ok, detalhe });
  console.log(`${ok ? 'ok   ' : 'FALHA'} ${nome}${detalhe ? `  ${detalhe}` : ''}`);
}
const nomeArquivo = (s) => s.replace(/[^a-z0-9.-]+/gi, '_').replace(/^_|_$/g, '') || 'home';
const curto = (l, n = 3) => l.slice(0, n).join(' | ').slice(0, 500) + (l.length > n ? ` (+${l.length - n})` : '');
const espera = (ms) => new Promise((r) => setTimeout(r, ms));
async function emParalelo(tarefas, n, fn) {
  let i = 0;
  await Promise.all(Array.from({ length: n }, async () => { while (i < tarefas.length) { const t = tarefas[i++]; await fn(t); } }));
}
// Um navegador novo por visita: o processo de GPU do rasterizador por software não devolve a memória ao fechar um contexto
// com WebGL (chegou a 6 GB numa rodada longa) e cada visita seguinte ficava mais lenta que a anterior.
async function comNavegador(fn) {
  const b = await chromium.launch({ channel: CANAL, headless: true });
  try { await fn(b); } finally { await Promise.race([b.close().catch(() => {}), espera(30000)]); }
}

// ---------------------------------------------------------------------------------------------------------------------
// Medidas dentro da página. Roda por página.evaluate: não pode usar nada de fora.
// ---------------------------------------------------------------------------------------------------------------------
const MEDIR = () => {
  const vw = document.documentElement.clientWidth;
  const vh = innerHeight;
  const contexto = document.createElement('canvas').getContext('2d');
  const cacheTinta = new Map();
  const IGNORAR = 'svg,script,style,noscript,template,textarea,[hidden]';
  const TOL = 1.2;

  // A tinta real de uma letra, em frações do corpo. Título maiúsculo com acento sobe além da caixa de linha apertada, e é isso
  // que uma comparação de scrollHeight não vê.
  const tinta = (ch, cs) => {
    const fonte = `${cs.fontStyle} ${cs.fontWeight} 100px ${cs.fontFamily}`;
    const chave = fonte + ch;
    let m = cacheTinta.get(chave);
    if (!m) {
      contexto.font = fonte;
      const t = contexto.measureText(ch);
      m = { a: t.actualBoundingBoxAscent / 100, d: t.actualBoundingBoxDescent / 100, e: t.actualBoundingBoxLeft / 100, r: t.actualBoundingBoxRight / 100, fa: t.fontBoundingBoxAscent / 100, fd: t.fontBoundingBoxDescent / 100, av: t.width / 100 };
      cacheTinta.set(chave, m);
    }
    return m;
  };
  const visivel = (el) => el.checkVisibility({ opacityProperty: true, visibilityProperty: true, contentVisibilityAuto: true });
  const descreve = (el) => {
    const partes = [];
    for (let a = el, i = 0; a && a !== document.body && i < 3; a = a.parentElement, i++) {
      const cl = typeof a.className === 'string' ? a.className.trim().split(/\s+/).filter(Boolean).slice(0, 2).join('.') : '';
      partes.unshift(a.tagName.toLowerCase() + (cl ? `.${cl}` : ''));
    }
    return partes.join('>');
  };
  // Caixas que cortam este elemento, respeitando o bloco de contenção de position:absolute e fixed.
  const cacheClip = new Map();
  const clipsDe = (el) => {
    if (cacheClip.has(el)) return cacheClip.get(el);
    const out = [];
    let pos = getComputedStyle(el).position;
    for (let a = el.parentElement; a && a !== document.documentElement; a = a.parentElement) {
      const cs = getComputedStyle(a);
      const contem = cs.position !== 'static' || cs.transform !== 'none' || cs.filter !== 'none' || cs.perspective !== 'none' || cs.willChange.includes('transform');
      if (pos === 'fixed' && cs.transform === 'none' && cs.filter === 'none') continue;
      if (pos === 'absolute' && !contem) continue;
      const ox = cs.overflowX === 'hidden' || cs.overflowX === 'clip';
      const oy = cs.overflowY === 'hidden' || cs.overflowY === 'clip';
      if (ox || oy) out.push({ el: a, r: a.getBoundingClientRect(), ox, oy });
      pos = cs.position;
      if (pos === 'static' || pos === 'relative' || pos === 'sticky') pos = 'x';
    }
    // o elemento que tem o próprio texto também corta
    const cs = getComputedStyle(el);
    const ox = cs.overflowX === 'hidden' || cs.overflowX === 'clip';
    const oy = cs.overflowY === 'hidden' || cs.overflowY === 'clip';
    if (ox || oy) out.unshift({ el, r: el.getBoundingClientRect(), ox, oy });
    cacheClip.set(el, out);
    return out;
  };
  const blocoDe = (el) => {
    let a = el;
    while (a.parentElement && getComputedStyle(a).display.startsWith('inline')) a = a.parentElement;
    return a;
  };
  const fixo = (el) => { for (let a = el; a; a = a.parentElement) if (getComputedStyle(a).position === 'fixed') return true; return false; };
  const emRepouso = (copia) => {
    const caixa = copia.parentElement.getBoundingClientRect();
    const desvio = (e) => Math.abs(e.getBoundingClientRect().top - caixa.top);
    const outra = copia.previousElementSibling || copia.nextElementSibling;
    return (!outra || desvio(copia) <= desvio(outra)) && desvio(copia) < parseFloat(getComputedStyle(copia).fontSize) * 0.35;
  };

  const cortes = [];
  const blocos = new Map();
  const range = document.createRange();
  const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
  const paginaFixa = ['home', 'work'].includes(document.querySelector('[data-taxi-view]')?.getAttribute('data-page')) || document.documentElement.scrollHeight <= vh + 1;
  while (w.nextNode()) {
    const n = w.currentNode;
    if (n.nodeType === 1) {
      if (n.tagName === 'BR') { const b = n.parentElement && blocoDe(n.parentElement); if (b && blocos.has(b)) blocos.get(b).push(null); }
      continue;
    }
    const el = n.parentElement;
    if (!el || el.closest(IGNORAR)) continue;
    const texto = n.data;
    if (!texto.trim()) { const b = blocoDe(el); if (blocos.has(b)) blocos.get(b).push(null); continue; }
    if (!visivel(el)) continue;
    // Rollover: duas cópias de cada letra giram na caixa. Só conta a que está parada lá; a outra e as que giram são a animação.
    if (el.closest('.cloneText2')) continue;
    const copia = el.closest('.originalText,.cloneText,.originalText2');
    if (copia && !emRepouso(copia)) continue;
    range.selectNodeContents(n);
    const u = range.getBoundingClientRect();
    if (u.width < 0.5 || u.height < 0.5 || u.right < 0 || u.left > vw || u.bottom < 0 || u.top > vh) continue;
    const cs = getComputedStyle(el);
    const clips = clipsDe(el);
    const eFixo = fixo(el);
    const caixaAlta = cs.textTransform === 'uppercase';
    const bloco = blocoDe(el);
    if (!blocos.has(bloco)) blocos.set(bloco, []);
    const lista = blocos.get(bloco);
    let vistos = 0, cortados = 0, ocultos = 0;
    let acentos = '';
    const lados = { cima: 0, baixo: 0, esq: 0, dir: 0 };
    let culpado = null;
    const carrossel = el.closest('[data-slider="item"],[data-roll="item"],[data-reviews="slide"],[data-footage="item"],[data-footage="item2"],[data-marquee],.about-md-text,.about-xl-text,.menu-films-w');
    const rc = carrossel && carrossel.getBoundingClientRect();
    // As palavras do Sobre correm com a rolagem e a lista do menu rola: sair da própria caixa ou da janela é o movimento delas.
    const corre = el.closest('.about-md-text,.about-xl-text,.menu-films-w');
    const carrosselFora = corre || (rc && (rc.left < 0 || rc.right > vw || rc.top < 0 || rc.bottom > vh));
    for (let i = 0; i < texto.length; i++) {
      const original = texto[i];
      if (/\s/.test(original)) { lista.push(null); continue; }
      const ch = caixaAlta ? original.toLocaleUpperCase('pt-BR') : original;
      range.setStart(n, i);
      range.setEnd(n, i + 1);
      const r = range.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) continue;
      lista.push({ ch, top: r.top, bottom: r.bottom, left: r.left, h: r.height });
      const m = tinta(ch, cs);
      const E = r.height / (m.fa + m.fd || 1);
      const base = r.top + m.fa * E;
      // o canvas mede sem font-stretch: a escala horizontal vem do avanço real da letra, descontado o letter-spacing
      const espacamento = (parseFloat(cs.letterSpacing) || 0) * (E / (parseFloat(cs.fontSize) || 1));
      const kx = m.av > 0 ? (r.width - espacamento) / (m.av * E) : 1;
      const ink = { t: base - m.a * E, b: base + m.d * E, l: r.left - m.e * E * kx, r: r.left + m.r * E * kx };
      if (ink.b <= ink.t || ink.r <= ink.l) continue;
      let estado = 'visto';
      // Título que encosta nas linhas do tema perde a curva das letras redondas, como no original: até 4% do corpo passa.
      // Sinal gráfico não tem essa folga: sem o til, PROGRAMAÇÃO vira outra palavra.
      const temAcento = /[ÃÕÁÉÍÓÚÂÊÔÀÇãõáéíóúâêôàç]/.test(ch);
      const tol = temAcento ? TOL : Math.max(TOL, E * 0.04);
      const caixas = clips.filter((c) => (!carrossel || !c.el.contains(carrossel) || c.el === carrossel) && c.el !== corre).map((c) => ({ ...c, nome: null }));
      // Cartão de carrossel ou texto que corre com a rolagem pode sair da janela: é a própria animação.
      if (!carrosselFora) {
        caixas.push({ r: { top: -1e9, bottom: 1e9, left: 0, right: vw }, ox: true, oy: false, el: null, nome: 'borda da janela' });
        if (eFixo || paginaFixa) caixas.push({ r: { top: 0, bottom: vh, left: -1e9, right: 1e9 }, ox: false, oy: true, el: null, nome: 'altura da janela' });
      }
      for (const c of caixas) {
        const dc = c.oy ? c.r.top - ink.t : 0, db = c.oy ? ink.b - c.r.bottom : 0, de = c.ox ? c.r.left - ink.l : 0, dd = c.ox ? ink.r - c.r.right : 0;
        const fora = (c.oy && (ink.b <= c.r.top || ink.t >= c.r.bottom)) || (c.ox && (ink.r <= c.r.left || ink.l >= c.r.right));
        if (fora) { estado = 'oculto'; culpado = culpado || c; break; }
        if (dc > tol || db > tol || de > tol || dd > tol) {
          estado = 'cortado';
          culpado = c;
          if (temAcento) acentos += ch;
          lados.cima = Math.max(lados.cima, dc); lados.baixo = Math.max(lados.baixo, db); lados.esq = Math.max(lados.esq, de); lados.dir = Math.max(lados.dir, dd);
        }
      }
      if (estado === 'visto') vistos++; else if (estado === 'cortado') cortados++; else ocultos++;
    }
    if ((vistos + cortados) > 0 && (cortados > 0 || ocultos > 0)) {
      cortes.push({
        el: descreve(el),
        clip: culpado ? (culpado.nome || descreve(culpado.el)) : '?',
        texto: texto.trim().slice(0, 60),
        cortados, ocultos, vistos, acentos,
        px: Object.fromEntries(Object.entries(lados).filter(([, v]) => v > 0).map(([k, v]) => [k, +v.toFixed(1)])),
        corpo: cs.fontSize,
      });
    }
  }

  // Palavra partida: duas letras seguidas, sem espaço entre elas, em linhas diferentes.
  const palavras = [];
  for (const [bloco, lista] of blocos) {
    let ant = null;
    for (const c of lista) {
      if (!c) { ant = null; continue; }
      if (ant && c.top > ant.bottom - ant.h * 0.4 && c.left < ant.left && !/[-/–—­]/.test(ant.ch)) {
        palavras.push({ el: descreve(bloco), texto: (bloco.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 70), em: ant.ch + '|' + c.ch });
        break;
      }
      ant = c;
    }
  }
  return {
    cortes, palavras,
    largura: { doc: document.documentElement.scrollWidth, corpo: document.body.scrollWidth, janela: vw, x: scrollX },
    y: scrollY, altura: document.documentElement.scrollHeight,
  };
};

// Fora do viewport também conta: texto vazio ocupando caixa e elemento que passa da borda sem ninguém cortando.
const MEDIR_ESTRUTURA = () => {
  const vw = document.documentElement.clientWidth;
  const visivel = (el) => el.checkVisibility({ opacityProperty: false, visibilityProperty: true, contentVisibilityAuto: true });
  const descreve = (el) => {
    const partes = [];
    for (let a = el, i = 0; a && a !== document.body && i < 3; a = a.parentElement, i++) {
      const cl = typeof a.className === 'string' ? a.className.trim().split(/\s+/).filter(Boolean).slice(0, 3).join('.') : '';
      partes.unshift(a.tagName.toLowerCase() + (cl ? `.${cl}` : ''));
    }
    return partes.join('>');
  };
  const TEXTUAL = 'h1,h2,h3,h4,h5,h6,p,li,figcaption,blockquote,dt,dd,label,td,th,em,strong,small,span,[class*="-tx"],[class*="text"],[class*="title"],[class*="eyeb"],[class*="label"],[class*="desc"],[class*="name"],[class*="paragraph"],[class*="heading"]';
  const vazios = [];
  document.querySelectorAll(TEXTUAL).forEach((el) => {
    if (el.closest('svg')) return;
    if (el.textContent.trim()) return;
    if (el.querySelector('img,svg,video,canvas,iframe,input,textarea,select,picture')) return;
    if (el.children.length && [...el.children].some((c) => c.getBoundingClientRect().height > 0)) return;
    if (!visivel(el)) return;
    const r = el.getBoundingClientRect();
    if (r.width < 1 || r.height < 1) return;
    const est = getComputedStyle(el);
    if (est.backgroundImage !== 'none' || (est.maskImage && est.maskImage !== 'none') || (est.webkitMaskImage && est.webkitMaskImage !== 'none')) return;
    vazios.push({ el: descreve(el), l: +r.width.toFixed(0), a: +r.height.toFixed(0) });
  });
  const alem = [];
  document.querySelectorAll('body *').forEach((el) => {
    if (el.closest('svg') && el.tagName !== 'svg') return;
    if (!visivel(el)) return;
    const r = el.getBoundingClientRect();
    if (r.width < 1 || r.height < 1 || r.right <= vw + 1) return;
    for (let a = el.parentElement; a && a !== document.documentElement; a = a.parentElement) {
      const cs = getComputedStyle(a);
      if (cs.overflowX !== 'visible') return;
    }
    alem.push({ el: descreve(el), direita: +r.right.toFixed(0) });
  });
  // Segunda opinião, além da tinta: folha de texto com overflow oculto cujo conteúdo não cabe na caixa.
  const estourados = [];
  document.querySelectorAll('body *').forEach((el) => {
    if (el.closest('svg,textarea') || !visivel(el)) return;
    const cs = getComputedStyle(el);
    if (cs.overflowX === 'visible' && cs.overflowY === 'visible') return;
    if (cs.overflowX === 'auto' || cs.overflowY === 'auto' || cs.overflowX === 'scroll' || cs.overflowY === 'scroll') return;
    if (![...el.childNodes].some((n) => n.nodeType === 3 && n.data.trim())) return;
    const dx = el.scrollWidth - el.clientWidth, dy = el.scrollHeight - el.clientHeight;
    if (el.clientWidth > 0 && el.clientHeight > 0 && (dx > 1 || dy > 1)) estourados.push({ el: descreve(el), texto: el.textContent.trim().slice(0, 50), dx, dy, corpo: cs.fontSize });
  });
  return { vazios, alem: alem.slice(0, 12), estourados };
};

const LER_IMAGENS = () => [...document.images].map((i) => ({ src: i.currentSrc || i.src, ok: i.complete && i.naturalWidth > 0, completa: i.complete, largura: i.naturalWidth, lazy: i.loading === 'lazy' }));

// ---------------------------------------------------------------------------------------------------------------------
// Visita
// ---------------------------------------------------------------------------------------------------------------------
function opcoesContexto(tam) {
  const o = { viewport: { width: tam.width, height: tam.height } };
  if (tam.ua) Object.assign(o, { userAgent: tam.ua, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
  return o;
}
function cookies() {
  return [
    { name: 'preloader_shown', value: String(Date.now() + 864e5 * 400), url: BASE },
    { name: 'tutorial_shown', value: 'true', url: BASE },
  ];
}

async function abrir(browser, { caminho, tam, quando }) {
  const ctx = await browser.newContext(opcoesContexto(tam));
  await ctx.addCookies(cookies());
  const page = await ctx.newPage();
  const reg = { console: [], excecoes: [], falhas: [], http: [], terceiros: [], redirecoes: [] };
  const doc = BASE + caminho;
  page.on('console', (m) => {
    const t = m.text();
    // A página 404 responde 404 de propósito, e o navegador sempre anota isso no console.
    if (caminho === INEXISTENTE && /status of 404/.test(t) && m.location().url === doc) return;
    // Do próprio bundle, no touchmove de window; também aparece na estrutura original.
    if (/Unable to preventDefault inside passive/.test(t)) return;
    if (m.type() === 'error' || /Content Security Policy|Refused to/i.test(t)) reg.console.push(`${m.type()}: ${t.slice(0, 300)}`);
  });
  page.on('pageerror', (e) => reg.excecoes.push(String(e).slice(0, 300)));
  page.on('request', (r) => { const u = r.url(); if (/^https?:/.test(u) && !u.startsWith(BASE)) reg.terceiros.push(u); });
  page.on('requestfailed', (r) => reg.falhas.push(`${r.failure()?.errorText} ${r.url()}`));
  page.on('response', (r) => {
    const s = r.status();
    if (s >= 400 && !(r.url() === doc && caminho === INEXISTENTE && s === 404)) reg.http.push(`${s} ${r.url()}`);
    if (s >= 300 && s < 400) reg.redirecoes.push(`${s} ${r.url()}`);
  });
  await page.addInitScript(() => {
    window.__csp = [];
    document.addEventListener('securitypolicyviolation', (e) => window.__csp.push(`${e.violatedDirective} ${e.blockedURI}`));
  });
  if (quando) await page.clock.install({ time: new Date(`${quando}:00-03:00`) });
  // Home e Programação esperam dezenas de imagens para o load e o WebGL, que aqui roda no processador: prazo largo.
  const resposta = await page.goto(doc, { waitUntil: 'load', timeout: 300000 });
  reg.status = resposta?.status();
  await page.waitForFunction(() => { const t = document.querySelector('[data-taxi]'); return t && getComputedStyle(t).visibility !== 'hidden'; }, null, { timeout: 240000 });
  await page.evaluate(() => document.fonts.ready.then(() => true));
  const dataPage = await page.evaluate(() => document.querySelector('[data-taxi-view]')?.getAttribute('data-page'));
  await espera(['home', 'work'].includes(dataPage) ? 5000 : 3000);
  return { ctx, page, reg, dataPage };
}

async function rolar(page, tam, cdp, dy, ponto = { x: 0.5, y: 0.6 }) {
  const x = Math.round(tam.width * ponto.x);
  const y = Math.round(tam.height * ponto.y);
  if (cdp) {
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
    const passos = 8;
    const curso = Math.min(Math.abs(dy), tam.height * 0.5) * Math.sign(dy);
    for (let i = 1; i <= passos; i++) {
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y: Math.round(y - (curso * i) / passos) }] });
      await espera(16);
    }
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  } else {
    await page.mouse.move(x, y);
    await page.mouse.wheel(0, dy);
  }
}
async function esperarParar(page) {
  let ant = -1;
  for (let i = 0; i < 20; i++) {
    const y = await page.evaluate(() => scrollY);
    if (Math.abs(y - ant) < 1) return y;
    ant = y;
    await espera(180);
  }
  return ant;
}

// Só fica o que continua igual depois de uma segunda leitura: máscara de entrada em andamento não é defeito.
async function coletar(page, acumulado) {
  const a = await page.evaluate(MEDIR);
  acumulado.largura = Math.max(acumulado.largura || 0, a.largura.doc, a.largura.corpo);
  acumulado.xMax = Math.max(acumulado.xMax || 0, a.largura.x);
  if (a.cortes.length || a.palavras.length) {
    await espera(1300);
    const b = await page.evaluate(MEDIR);
    const chaveC = (c) => c.el + c.texto;
    const chaveP = (c) => c.el + c.texto;
    const nb = new Set(b.cortes.map(chaveC));
    const pb = new Set(b.palavras.map(chaveP));
    for (const c of b.cortes.filter((x) => a.cortes.some((y) => chaveC(y) === chaveC(x)))) if (nb.has(chaveC(c))) acumulado.cortes.set(chaveC(c), c);
    for (const c of b.palavras.filter((x) => a.palavras.some((y) => chaveP(y) === chaveP(x)))) if (pb.has(chaveP(c))) acumulado.palavras.set(chaveP(c), c);
  }
}

async function percorrer(page, tam, dataPage, acumulado, voltas = 5) {
  const cdp = tam.ua ? await page.context().newCDPSession(page) : null;
  await coletar(page, acumulado);
  const passo = Math.round(tam.height * 0.7);
  if (dataPage === 'home' || dataPage === 'work') {
    // Roda e toque giram o carrossel: cinco passos bastam para o próximo, o aviso e os títulos longos passarem pela tela.
    for (let i = 0; i < voltas; i++) {
      await rolar(page, tam, cdp, passo);
      await espera(1500);
      await coletar(page, acumulado);
    }
    return { fundo: true, y: 0 };
  }
  // O slider de leituras segura o toque que começa nele (touchstart com preventDefault no bundle): quem está no celular
  // rola pela margem. Quando a página não anda, o dedo tenta outros pontos, e a conta de quantas vezes isso foi preciso vai no retorno.
  const PONTOS = [{ x: 0.5, y: 0.6 }, { x: 0.5, y: 0.12 }, { x: 0.5, y: 0.92 }, { x: 0.03, y: 0.5 }, { x: 0.97, y: 0.5 }];
  let ponto = 0;
  let presos = 0;
  let parado = 0;
  let y = await page.evaluate(() => scrollY);
  for (let i = 0; i < 120; i++) {
    await rolar(page, tam, cdp, passo, PONTOS[ponto]);
    await espera(350);
    const novo = await esperarParar(page);
    await coletar(page, acumulado);
    const { sh, vh } = await page.evaluate(() => ({ sh: document.documentElement.scrollHeight, vh: innerHeight }));
    if (novo + vh >= sh - 2) return { fundo: true, y: novo, presos };
    if (Math.abs(novo - y) < 2) {
      parado++;
      if (cdp) { presos++; ponto = (ponto + 1) % PONTOS.length; }
    } else parado = 0;
    y = novo;
    if (parado >= (cdp ? PONTOS.length + 1 : 4)) break;
  }
  const { sh, vh } = await page.evaluate(() => ({ sh: document.documentElement.scrollHeight, vh: innerHeight }));
  return { fundo: y + vh >= sh - 2 || sh <= vh + 1, y, sh, presos };
}

// O que conta para quem usa: a janela anda de lado com um gesto? O html tem overflow-x oculto, então scrollWidth maior não basta.
async function tentarLateral(page, tam) {
  if (tam.ua) {
    const cdp = await page.context().newCDPSession(page);
    const y = Math.round(tam.height * 0.5);
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: Math.round(tam.width * 0.85), y }] });
    for (let i = 1; i <= 8; i++) {
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: Math.round(tam.width * (0.85 - (0.7 * i) / 8)), y }] });
      await espera(16);
    }
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  } else {
    await page.mouse.move(tam.width / 2, tam.height / 2);
    await page.mouse.wheel(400, 0);
  }
  await espera(600);
  return page.evaluate(() => ({ x: scrollX, vvx: Math.round(visualViewport.pageLeft), largura: innerWidth, escala: visualViewport.scale, doc: document.documentElement.scrollWidth, corpo: document.body.scrollWidth }));
}

// Captura não pode derrubar a visita: num rasterizador por software com o WebGL ocupado ela pode demorar.
async function capturar(page, arquivo) {
  try {
    await page.screenshot({ path: path.join(CAPTURAS, arquivo), type: 'jpeg', quality: 72, timeout: 90000 });
    return true;
  } catch (e) {
    console.log(`aviso: captura ${arquivo} não saiu: ${String(e).split('\n')[0]}`);
    return false;
  }
}

// Fechar um contexto com WebGL pode levar minutos em rasterizador por software: não segura o restante da fila.
async function fechar(ctx) {
  const t0 = Date.now();
  await Promise.race([ctx.close().catch(() => {}), espera(20000)]);
  const s = Date.now() - t0;
  if (s > 5000) console.log(`aviso: fechar o contexto levou ${Math.round(s / 1000)} s`);
}

const linhasVisitas = [];
function guardarVisita(v) {
  linhasVisitas.push(v);
  fs.appendFileSync(path.join(SAIDA, 'visitas.jsonl'), JSON.stringify(v) + '\n');
}

async function visitar(browser, { caminho, tam, quando, rotulo = '' }, tentativa = 1) {
  const nome = `${caminho} ${tam.nome}${rotulo ? ` [${rotulo}]` : ''}`;
  const base = `${nomeArquivo(caminho)}__${tam.nome}${rotulo ? `__${rotulo}` : ''}`;
  let ctx;
  const inicioVisita = Date.now();
  try {
    const etapas = {};
    const marca = (n) => { etapas[n] = Math.round((Date.now() - inicioVisita) / 1000); };
    const a = await abrir(browser, { caminho, tam, quando });
    marca('abriu');
    ctx = a.ctx;
    const { page, reg, dataPage } = a;
    await capturar(page, `${base}__topo.jpg`);
    marca('topo');
    const acumulado = { cortes: new Map(), palavras: new Map() };
    const fim = await percorrer(page, tam, dataPage, acumulado, quando ? 1 : 5);
    marca('rolou');
    await capturar(page, `${base}__fim.jpg`);
    marca('fim');
    const lateral = await tentarLateral(page, tam);
    const estrutura = await page.evaluate(MEDIR_ESTRUTURA);
    // As miniaturas do menu fechado são lazy e só carregam quando o painel abre: aqui forçamos para conferir o arquivo.
    marca('estrutura');
    const antes = await page.evaluate(LER_IMAGENS);
    await page.evaluate(() => { document.querySelectorAll('img[loading="lazy"]').forEach((i) => { i.loading = 'eager'; }); });
    let imagens = await page.evaluate(LER_IMAGENS);
    for (let i = 0; i < 60 && imagens.some((x) => !x.completa); i++) {
      await espera(1000);
      imagens = await page.evaluate(LER_IMAGENS);
    }
    marca('imagens');
    const csp = await page.evaluate(() => window.__csp || []);
    const v = {
      caminho, tamanho: tam.nome, rotulo, status: reg.status, dataPage,
      console: reg.console, excecoes: reg.excecoes, falhas: [...reg.falhas], http: reg.http, terceiros: reg.terceiros, redirecoes: reg.redirecoes, csp,
      largura: acumulado.largura, xMax: acumulado.xMax, janela: tam.width, fim, lateral,
      cortes: [...acumulado.cortes.values()], palavras: [...acumulado.palavras.values()],
      vazios: estrutura.vazios, alem: estrutura.alem, estourados: estrutura.estourados,
      imagensTotal: imagens.length, imagensRuins: imagens.filter((i) => !i.ok), imagensLazyPendentes: antes.filter((i) => !i.completa).length,
    };
    v.segundos = Math.round((Date.now() - inicioVisita) / 1000);
    v.etapas = etapas;
    guardarVisita(v);
    const esperado = caminho === INEXISTENTE ? 404 : 200;
    confere(`${nome}: status ${esperado}`, reg.status === esperado, String(reg.status));
    confere(`${nome}: console e exceções limpos`, !reg.console.length && !reg.excecoes.length, curto([...reg.excecoes, ...reg.console]));
    confere(`${nome}: rede sem falha nem 4xx/5xx`, !reg.falhas.length && !reg.http.length, curto([...reg.http, ...reg.falhas]));
    confere(`${nome}: nenhum recurso interno redirecionado`, !reg.redirecoes.length, curto(reg.redirecoes));
    confere(`${nome}: sem violação de CSP`, !csp.length, curto(csp));
    confere(`${nome}: nenhum terceiro antes do clique no trailer`, !reg.terceiros.length, curto(reg.terceiros));
    confere(`${nome}: a janela não anda de lado nem encolhe`, !lateral.x && !lateral.vvx && lateral.largura === tam.width && lateral.escala === 1, JSON.stringify(lateral));
    // A faixa do carrossel da Programação e o letreiro do Sobre passam da janela de propósito, sob o overflow-x oculto do html,
    // como no original. Em qualquer outra página isso é transbordo.
    const faixaPermitida = dataPage === 'work' || dataPage === 'about';
    confere(`${nome}: scrollWidth dentro da janela`, faixaPermitida || acumulado.largura <= tam.width + 1, `maior largura ${acumulado.largura} janela ${tam.width}`);
    confere(`${nome}: nada além da borda sem corte`, !estrutura.alem.length, curto(estrutura.alem.map((e) => `${e.el} -> ${e.direita}`)));
    confere(`${nome}: rolou até o fim`, fim.fundo, JSON.stringify(fim));
    confere(`${nome}: imagens completas`, !v.imagensRuins.length, `${imagens.length} imagens; ${curto(v.imagensRuins.map((i) => i.src))}`);
    confere(`${nome}: folha de texto cabe na caixa com overflow oculto`, !estrutura.estourados.length, curto(estrutura.estourados.map((e) => `"${e.texto}" ${e.el} dx ${e.dx} dy ${e.dy}`)));
    confere(`${nome}: sem texto vazio ocupando espaço`, !estrutura.vazios.length, curto(estrutura.vazios.map((e) => `${e.el} ${e.l}x${e.a}`)));
    confere(`${nome}: nenhum texto cortado`, !v.cortes.length, curto(v.cortes.map((c) => `"${c.texto}" ${c.el} por ${c.clip} ${JSON.stringify(c.px)} ocultos ${c.ocultos}`)));
    confere(`${nome}: nenhuma palavra partida`, !v.palavras.length, curto(v.palavras.map((c) => `"${c.texto}" em ${c.em}`)));
  } catch (e) {
    // Estouro de tempo com a máquina ocupada não é defeito do site: tenta de novo antes de reprovar.
    if (tentativa < 3 && /Timeout|Target .*closed/i.test(String(e))) {
      console.log(`aviso: ${nome}: tentativa ${tentativa} sem resposta (${String(e).split('\n')[0].slice(0, 100)})`);
      if (ctx) await fechar(ctx);
      ctx = null;
      await espera(5000);
      return visitar(browser, { caminho, tam, quando, rotulo }, tentativa + 1);
    }
    confere(`${nome}: visita concluída`, false, String(e).slice(0, 300));
  } finally {
    if (ctx) await fechar(ctx);
  }
}

async function parteMatriz() {
  const tarefas = [];
  for (const tam of tamanhosValidos) for (const caminho of FIXAS) tarefas.push({ caminho, tam });
  for (const tam of tamanhosValidos) {
    const lista = SEMPRE_TODOS.includes(tam.nome) ? SLUGS : AMOSTRA;
    for (const s of lista) tarefas.push({ caminho: `/sessoes/${s}/`, tam });
  }
  await emParalelo(tarefas.filter((t) => !FILTRO || FILTRO.test(t.caminho)), PARALELO, (t) => comNavegador((b) => visitar(b, t)));
}

async function parteTitulos() {
  const tarefas = [];
  for (const tam of tamanhosValidos) for (const i of INSTANTES) for (const caminho of ['/', '/programacao/']) tarefas.push({ caminho, tam, quando: i.quando, rotulo: i.rotulo });
  // A página de sessão muda o rótulo de estado conforme o relógio.
  for (const tam of tamanhosValidos.filter((t) => SEMPRE_TODOS.includes(t.nome))) {
    tarefas.push({ caminho: '/sessoes/obsession-2026/', tam, quando: INSTANTES[0].quando, rotulo: 'proxima' });
    tarefas.push({ caminho: '/sessoes/ready-or-not-double-feature-2026/', tam, quando: INSTANTES[1].quando, rotulo: 'proxima' });
    tarefas.push({ caminho: '/sessoes/the-hateful-eight-2015/', tam, quando: INSTANTES[2].quando, rotulo: 'hoje' });
  }
  await emParalelo(tarefas.filter((t) => !FILTRO || FILTRO.test(t.caminho)), PARALELO, (t) => comNavegador((b) => visitar(b, t)));
}

// ---------------------------------------------------------------------------------------------------------------------
// Painéis do menu abertos
// ---------------------------------------------------------------------------------------------------------------------
async function medirPainel(page, nome, base, sufixo) {
  const acumulado = { cortes: new Map(), palavras: new Map() };
  await coletar(page, acumulado);
  await capturar(page, `${base}__${sufixo}.jpg`);
  confere(`${nome} ${sufixo}: nenhum texto cortado`, !acumulado.cortes.size, curto([...acumulado.cortes.values()].map((c) => `"${c.texto}" ${c.el} por ${c.clip} ${JSON.stringify(c.px)} ocultos ${c.ocultos}`)));
  confere(`${nome} ${sufixo}: nenhuma palavra partida`, !acumulado.palavras.size, curto([...acumulado.palavras.values()].map((c) => `"${c.texto}" em ${c.em}`)));
  guardarVisita({ caminho: nome, painel: sufixo, cortes: [...acumulado.cortes.values()], palavras: [...acumulado.palavras.values()] });
}

async function visitarMenu(browser, { caminho, tam, quando, rotulo = '' }) {
  const nome = `menu ${caminho} ${tam.nome}${rotulo ? ` [${rotulo}]` : ''}`;
  const base = `menu__${nomeArquivo(caminho)}__${tam.nome}${rotulo ? `__${rotulo}` : ''}`;
  let ctx;
  try {
    const a = await abrir(browser, { caminho, tam, quando });
    ctx = a.ctx;
    const { page, reg } = a;
    const disparo = page.locator('[data-menu="maintrigger"]');
    if (tam.ua) await disparo.tap({ timeout: 10000 }); else await disparo.click({ timeout: 10000 });
    await espera(2200);
    await medirPainel(page, nome, base, 'principal');
    if (tam.ua) await disparo.tap({ timeout: 10000 }); else await disparo.click({ timeout: 10000 });
    await espera(1500);
    // O ingresso abre a lista de filmes; abaixo de 992 px a coluna some e este painel não existe.
    const ingresso = page.locator('.mmenu-col.large');
    if (await ingresso.isVisible() && tam.width >= 992) {
      const caixa = await ingresso.boundingBox();
      if (tam.ua) await page.touchscreen.tap(caixa.x + caixa.width / 2, caixa.y + caixa.height * 0.3);
      else await page.mouse.click(caixa.x + caixa.width / 2, caixa.y + caixa.height * 0.3);
      await espera(2200);
      await medirPainel(page, nome, base, 'filmes');
    }
    confere(`${nome}: console limpo`, !reg.console.length && !reg.excecoes.length, curto([...reg.excecoes, ...reg.console]));
    confere(`${nome}: rede limpa`, !reg.falhas.length && !reg.http.length, curto([...reg.http, ...reg.falhas]));
    confere(`${nome}: sem terceiros`, !reg.terceiros.length, curto(reg.terceiros));
    const imagens = await page.evaluate(LER_IMAGENS);
    guardarVisita({ caminho: nome, painel: 'imagens', imagensTotal: imagens.length, imagensPendentes: imagens.filter((i) => !i.completa).length });
  } catch (e) {
    confere(`${nome}: visita concluída`, false, String(e).slice(0, 300));
  } finally {
    if (ctx) await fechar(ctx);
  }
}

async function parteMenu() {
  const tarefas = [];
  const caminhos = ['/', '/programacao/', '/sobre/', '/contato/', '/cookies/', `/sessoes/${AMOSTRA[0]}/`, '/sessoes/the-menu-2022/'];
  for (const tam of tamanhosValidos) for (const caminho of caminhos) tarefas.push({ caminho, tam });
  for (const tam of tamanhosValidos) tarefas.push({ caminho: '/', tam, quando: INSTANTES[1].quando, rotulo: 'titulo-longo' });
  await emParalelo(tarefas.filter((t) => !FILTRO || FILTRO.test(t.caminho)), PARALELO, (t) => comNavegador((b) => visitarMenu(b, t)));
}

// ---------------------------------------------------------------------------------------------------------------------
// Despejo de todo o texto público
// ---------------------------------------------------------------------------------------------------------------------
const DESPEJAR = () => {
  const out = [];
  const add = (tipo, texto, visivel = true) => { const t = String(texto ?? '').replace(/\s+/g, ' ').trim(); if (t) out.push({ tipo, texto: t, visivel }); };
  const vis = (el) => el.checkVisibility({ visibilityProperty: true, contentVisibilityAuto: true });
  // texto de cada nó, inclusive em painel fechado
  const w = document.createTreeWalker(document.documentElement, NodeFilter.SHOW_TEXT);
  const juntar = new Map();
  while (w.nextNode()) {
    const n = w.currentNode;
    const el = n.parentElement;
    if (!el || ['SCRIPT', 'STYLE', 'NOSCRIPT'].includes(el.tagName)) continue;
    if (!n.data.trim()) continue;
    // letras separadas pelo bundle voltam a ser uma palavra
    let dono = el;
    while (dono.parentElement && dono.textContent.trim().length <= 1 && dono !== document.body) dono = dono.parentElement;
    if (!juntar.has(dono)) juntar.set(dono, dono.textContent);
  }
  for (const [dono, t] of juntar) add(`texto:${dono.tagName.toLowerCase()}.${(typeof dono.className === 'string' ? dono.className : '').trim().split(/\s+/)[0] || ''}`, t, vis(dono));
  document.querySelectorAll('*').forEach((el) => {
    for (const a of el.attributes) {
      const nome = a.name;
      if (['class', 'style', 'id', 'd', 'href', 'src', 'srcset', 'sizes', 'width', 'height', 'viewBox', 'viewbox', 'fill', 'stroke', 'xmlns', 'clip-path', 'clip-rule', 'fill-rule', 'stroke-width', 'stroke-dasharray', 'transform', 'clipPathUnits', 'clippathunits', 'role', 'type', 'rel', 'as', 'crossorigin', 'integrity', 'charset', 'lang', 'loading', 'target', 'preload', 'muted', 'playsinline', 'rows', 'wrap', 'spellcheck', 'autocomplete', 'tabindex', 'defer', 'for', 'name', 'property', 'aria-hidden', 'aria-current', 'aria-pressed', 'x', 'y', 'cx', 'cy', 'r'].includes(nome)) {
        if (el.tagName === 'META' && nome === 'name') continue;
        continue;
      }
      if (nome.startsWith('data-wf') || nome === 'data-w-id') continue;
      add(`attr:${nome}`, a.value);
    }
  });
  document.querySelectorAll('[href]').forEach((el) => { if (el.tagName === 'A' || el.tagName === 'LINK') add(`href:${el.tagName.toLowerCase()}`, el.getAttribute('href')); });
  document.querySelectorAll('meta').forEach((m) => add(`meta:${m.getAttribute('name') || m.getAttribute('property') || m.getAttribute('charset') || '?'}`, m.getAttribute('content')));
  add('title', document.title);
  document.querySelectorAll('template').forEach((t) => add('template', t.content.textContent));
  document.querySelectorAll('script[type*="json"]').forEach((s) => add(`script:${s.type}`, s.textContent));
  // texto que o CSS põe na tela
  document.querySelectorAll('body *').forEach((el) => {
    for (const ps of ['::before', '::after']) {
      const c = getComputedStyle(el, ps).content;
      if (c && c !== 'none' && c !== 'normal' && !/^(""|'')$/.test(c)) add(`css:${ps}`, c);
    }
  });
  add('innerText', document.body.innerText);
  return out;
};

async function despejarPagina(browser, { caminho, tam, quando, rotulo }, destino) {
  let ctx;
  try {
    const a = await abrir(browser, { caminho, tam, quando });
    ctx = a.ctx;
    const { page } = a;
    const itens = await page.evaluate(DESPEJAR);
    for (const i of itens) destino.push({ caminho, tam: tam.nome, estado: rotulo, ...i });
    confere(`despejo ${caminho} ${tam.nome} ${rotulo}`, itens.length > 0, `${itens.length} itens`);
  } catch (e) {
    confere(`despejo ${caminho} ${tam.nome} ${rotulo}`, false, String(e).slice(0, 300));
  } finally {
    if (ctx) await fechar(ctx);
  }
}

// Termos que não podem aparecer para o visitante. Título de filme e nome próprio ficam de fora pelo contexto (ver PERMITIDO).
const VETADOS = [
  ['marca antiga', /\bsiena\b|film foundation|tel aviv|dizengoff|leelu|dorit|zohar|cinematic triumph|director'?s cut/i],
  ['filme da demonstração', /savoy|moon in the 12th|\btaboo\b|kafka|my project x|prisoner x|ana maxim|outsider|freud|by any means|housewife/i],
  ['estrelas ou nota', /★|☆|\b\d(?:[.,]\d)?\s*\/\s*(?:5|10)\b|\bestrelas?\b|\bnota \d|\bpontua[cç][aã]o\b|\brating\b|\bscore\b|imdb|metacritic|rotten/i],
  ['inglês visível', /\b(ENTER|SCROLL|EXPLORE|CLOSE|Location|Footage|Poster|Credits|Awards?|Reviews?|Next|Previous|Prev|Back|Watch|Play|Pause|Sound|Mute|Unmute|Hold|Drag|Loading|Director|Cast|Crew|Producers?|Press|Newsletter|Subscribe|Search|Filter|Copy|Copied|Read more|See more|View|Showcase|Follow|Share|Investors|Broadcast|Inquiries|Our Services|Who we are|Privacy|Terms|Page not found|All rights)\b/],
  // "não é um serviço de streaming" e "não oferece download" nos Termos são a negação que o proprietário pediu
  ['promessa de streaming ou download', /\b(assista|assistir (?!ao mesmo tempo)|baixar|baixe|(?<!oferece )download|(?<!serviço de )streaming|torrent|dublad[oa]s?|filme completo|sem cadastro)\b/i],
  ['provisório', /lorem ipsum|\bTODO\b|\bFIXME\b|\bTBD\b|\bundefined\b|\bNaN\b|\[object|\{\{|example\.com|no items found|this is some text/],
  // "O vencedor leva dinheiro" é o enredo de The Long Walk e "quebrou bilheteria" é a recusa no Sobre
  ['prêmio ou crítico', /\boscar|palma de ouro|globo de ouro|premiad[oa]|vencedor d[eoa]|aclamad[oa]|(?<!quebrou )bilheteria|crítico d[eo]|metascore/i],
  // Nome de personagem fica; função em inglês é sobra do cadastro do TMDB
  ['papel em inglês no elenco', /^(Hotel Manager|Loner Leader|Loner Swimmer|Short Sighted Woman|The Maid|Bar Buddy|Final Man|Songwriter|Older Boy|Young Boy|Detective .+|Lt\. .+|Sgt\. .+|Col\. .+)$/],
];
const TIPOS_VISIVEIS = /^(texto|innerText|attr:aria-label|attr:alt|attr:title|attr:placeholder|attr:data-after|attr:data-youtube-title|attr:data-trailer-title|meta:|title|css:|script:|template)/;

// O HTML como sai do build, antes de qualquer script: cada texto e atributo uma vez, com as páginas onde aparece.
function despejoEstatico() {
  const TECNICOS = new Set(['class', 'style', 'id', 'd', 'href', 'src', 'srcset', 'sizes', 'width', 'height', 'viewbox', 'fill', 'stroke', 'xmlns', 'clip-path', 'clip-rule', 'fill-rule', 'stroke-width', 'stroke-dasharray', 'transform', 'clippathunits', 'role', 'type', 'rel', 'as', 'crossorigin', 'integrity', 'charset', 'lang', 'loading', 'target', 'preload', 'muted', 'playsinline', 'rows', 'wrap', 'spellcheck', 'autocomplete', 'tabindex', 'defer', 'for', 'aria-hidden', 'aria-current', 'aria-pressed', 'x', 'y', 'cx', 'cy', 'r', 'data-w-id', 'data-a', 'data-an', 'data-del', 'data-delay', 'data-cursor', 'data-hover', 'data-parallax', 'data-menu', 'data-hide', 'data-sound-hover', 'data-btn', 'data-explore', 'data-x', 'data-roll', 'data-animation-delay', 'data-counter', 'data-footagemenu', 'data-taxi', 'data-taxi-view', 'data-gl']);
  const grupos = new Map();
  const add = (tipo, texto, pagina) => {
    const t = String(texto ?? '').replace(/\s+/g, ' ').trim();
    if (!t) return;
    const k = `${tipo}\t${t}`;
    if (!grupos.has(k)) grupos.set(k, { tipo, texto: t, paginas: new Set() });
    grupos.get(k).paginas.add(pagina);
  };
  const arquivos = andarDist(DIST).filter((f) => f.endsWith('.html') && !/google[0-9a-f]+\.html$/.test(f));
  for (const f of arquivos) {
    const pagina = '/' + path.relative(DIST, f).replaceAll('\\', '/').replace(/index\.html$/, '');
    nos(parse(fs.readFileSync(f, 'utf8')), (n) => {
      if (n.nodeName === '#text') {
        const pai = n.parentNode?.tagName;
        if (pai === 'style') return;
        if (pai === 'script') { if (/json/.test(atributo(n.parentNode, 'type') || '')) add('json', n.value, pagina); return; }
        const classe = (atributo(n.parentNode, 'class') || '').split(/\s+/)[0];
        add(`texto ${pai}${classe ? `.${classe}` : ''}`, n.value, pagina);
        return;
      }
      if (!n.tagName) return;
      if (n.tagName === 'meta') { add(`meta ${atributo(n, 'name') || atributo(n, 'property') || ''}`, atributo(n, 'content'), pagina); return; }
      for (const a of n.attrs || []) {
        if (TECNICOS.has(a.name) || a.name.startsWith('data-wf')) continue;
        add(`attr ${a.name}`, a.value, pagina);
      }
      if (n.tagName === 'a') add('link', atributo(n, 'href'), pagina);
    });
  }
  const linhas = [...grupos.values()]
    .sort((a, b) => b.paginas.size - a.paginas.size || a.tipo.localeCompare(b.tipo) || a.texto.localeCompare(b.texto))
    .map((g) => `[${g.paginas.size > 3 ? `${g.paginas.size} pág.` : [...g.paginas].join(' ')}] [${g.tipo}] ${g.texto}`);
  fs.writeFileSync(path.join(SAIDA, 'despejo-estatico.txt'), linhas.join('\n'));
  console.log(`despejo estático: ${grupos.size} textos distintos em ${path.join(SAIDA, 'despejo-estatico.txt')}`);
}

// Cadeias de JS que podem chegar à tela: todos os literais dos arquivos do site e, do bundle, só os que têm cara de frase ou rótulo.
function literaisDe(codigo) {
  const out = [];
  const re = /"((?:[^"\\\n]|\\.)*)"|'((?:[^'\\\n]|\\.)*)'|`((?:[^`\\]|\\.)*)`/g;
  for (const m of codigo.matchAll(re)) out.push(m[1] ?? m[2] ?? m[3]);
  return out;
}
function despejoCodigo() {
  const JS = path.join(DIST, 'assets/js');
  const linhas = [];
  for (const f of fs.readdirSync(JS).filter((x) => x.startsWith('local-'))) {
    const semComentario = fs.readFileSync(path.join(JS, f), 'utf8').replace(/^\s*\/\/.*$/gm, '');
    for (const l of new Set(literaisDe(semComentario))) if (/[a-zà-ú]{2}/i.test(l) && !/^[.\[#]/.test(l)) linhas.push(`[${f}] ${l}`);
  }
  // No bundle ficam as palavras em maiúscula, as frases com espaço e o que é atribuído a textContent, innerHTML ou aria.
  const app = fs.readFileSync(path.join(JS, 'app.js'), 'utf8');
  const rotulos = new Set();
  for (const l of literaisDe(app)) {
    if (l.length < 2 || l.length > 200) continue;
    if (/^[A-ZÀ-Ú][A-ZÀ-Ú ]{1,}$/.test(l) || /^[A-ZÀ-Úa-zà-ú][a-zà-ú]+( [a-zà-úA-ZÀ-Ú]+){1,}[.!?]?$/.test(l)) rotulos.add(l);
  }
  for (const l of rotulos) linhas.push(`[app.js literal] ${l}`);
  for (const m of app.matchAll(/.{60}(?:textContent|innerText|innerHTML|setAttribute\("(?:aria-label|title|alt|placeholder)")\s*[=,]\s*[^;]{0,120}/g)) linhas.push(`[app.js atribuição] ${m[0]}`);
  // Texto que o CSS escreve: content com letras
  for (const f of fs.readdirSync(path.join(DIST, 'assets/css'))) {
    const css = fs.readFileSync(path.join(DIST, 'assets/css', f), 'utf8');
    for (const m of css.matchAll(/content:\s*("[^"]*"|'[^']*')/g)) if (/[a-zà-ú]{2}/i.test(m[1])) linhas.push(`[${f} content] ${m[1]}`);
  }
  // XML e texto públicos, inteiros
  for (const f of ['rss.xml', 'sitemap.xml', 'robots.txt']) linhas.push(`\n===== ${f}\n${fs.readFileSync(path.join(DIST, f), 'utf8')}`);
  fs.writeFileSync(path.join(SAIDA, 'despejo-codigo.txt'), linhas.join('\n'));
  console.log(`despejo de código: ${linhas.length} linhas em ${path.join(SAIDA, 'despejo-codigo.txt')}`);
}

async function parteDespejo() {
  const destino = [];
  despejoCodigo();
  const tarefas = [];
  const paginas = [...FIXAS, ...SLUGS.map((s) => `/sessoes/${s}/`)];
  const amostra = [...FIXAS, ...AMOSTRA.map((s) => `/sessoes/${s}/`), '/sessoes/obsession-2026/'];
  despejoEstatico(paginas);
  // O relógio só muda rótulos e ordem: todas as páginas numa janela, e uma amostra nos demais instantes e no celular.
  const grande = TAMANHOS[0];
  const celular = TAMANHOS.find((t) => t.nome === '390x844');
  for (const caminho of paginas) {
    tarefas.push({ caminho, tam: grande, rotulo: 'sem-sessao' });
    tarefas.push({ caminho, tam: grande, quando: INSTANTES[0].quando, rotulo: 'com-sessao' });
  }
  for (const caminho of amostra) tarefas.push({ caminho, tam: celular, rotulo: 'sem-sessao' });
  for (const caminho of ['/', '/programacao/', ...AMOSTRA.map((s) => `/sessoes/${s}/`)]) {
    tarefas.push({ caminho, tam: celular, quando: INSTANTES[0].quando, rotulo: 'com-sessao' });
    for (const i of INSTANTES.slice(1)) tarefas.push({ caminho, tam: grande, quando: i.quando, rotulo: i.rotulo });
  }
  await emParalelo(tarefas.filter((t) => !FILTRO || FILTRO.test(t.caminho)), PARALELO, (t) => comNavegador((b) => despejarPagina(b, t, destino)));
  fs.writeFileSync(path.join(SAIDA, 'despejo-bruto.jsonl'), destino.map((d) => JSON.stringify(d)).join('\n'));

  // Agrupado: cada texto uma vez, com onde aparece. É este arquivo que se lê.
  const grupos = new Map();
  for (const d of destino) {
    if (d.tipo === 'innerText') continue;
    const ch = `${d.tipo}\t${d.texto}`;
    if (!grupos.has(ch)) grupos.set(ch, { tipo: d.tipo, texto: d.texto, caminhos: new Set(), estados: new Set(), visivel: false });
    const g = grupos.get(ch);
    g.caminhos.add(d.caminho); g.estados.add(d.estado); g.visivel = g.visivel || d.visivel;
  }
  const linhas = [...grupos.values()].sort((a, b) => a.tipo.localeCompare(b.tipo) || b.caminhos.size - a.caminhos.size || a.texto.localeCompare(b.texto)).map((g) => {
    const onde = g.caminhos.size > 3 ? `${g.caminhos.size} páginas` : [...g.caminhos].join(' ');
    return `[${g.tipo}] [${onde}] [${[...g.estados].join(',')}]${g.visivel ? '' : ' [oculto]'} ${g.texto}`;
  });
  fs.writeFileSync(path.join(SAIDA, 'despejo-unico.txt'), linhas.join('\n'));
  console.log(`despejo: ${destino.length} itens, ${grupos.size} textos distintos em ${path.join(SAIDA, 'despejo-unico.txt')}`);

  // Varredura do despejo
  const achados = new Map();
  for (const g of grupos.values()) {
    if (!TIPOS_VISIVEIS.test(g.tipo)) continue;
    for (const [categoria, re] of VETADOS) {
      const m = re.exec(g.texto);
      if (m) {
        const k = `${categoria}\t${m[0]}\t${g.texto.slice(Math.max(0, m.index - 40), m.index + 50)}`;
        if (!achados.has(k)) achados.set(k, `${categoria}: "${m[0]}" em [${g.tipo}] [${g.caminhos.size} páginas] ...${g.texto.slice(Math.max(0, m.index - 40), m.index + 50)}...`);
      }
    }
  }
  // Links como ficam depois dos scripts: o bundle preenche o link do carrossel e o Taxi compara como texto.
  const hrefs = new Map();
  for (const d of destino) if (d.tipo === 'href:a') { if (!hrefs.has(d.texto)) hrefs.set(d.texto, d.caminho); }
  const hrefsRuins = [];
  for (const [v, onde] of hrefs) {
    if (/^(https?:|mailto:|tel:)/.test(v)) continue;
    if (v.startsWith('#')) { if (v === '#' && !/programacao/.test(onde)) hrefsRuins.push(`${v} em ${onde}`); continue; }
    const limpo = v.split('#')[0].split('?')[0];
    if (!limpo.startsWith('/') || (!/\.[a-z0-9]+$/i.test(limpo) && !limpo.endsWith('/')) || /(index\.html|\/\/|[A-Z])/.test(limpo)) { hrefsRuins.push(`${v} em ${onde}: forma não canônica`); continue; }
    const r = await fetch(BASE + limpo, { redirect: 'manual' });
    await r.arrayBuffer();
    if (r.status !== 200) hrefsRuins.push(`${v} em ${onde}: HTTP ${r.status}`);
  }
  confere('links depois dos scripts: canônicos e 200', !hrefsRuins.length, `${hrefs.size} distintos; ${curto(hrefsRuins, 8)}`);
  fs.writeFileSync(path.join(SAIDA, 'despejo-vetados.txt'), [...achados.values()].join('\n'));
  confere('despejo: nenhum termo vetado', achados.size === 0, curto([...achados.values()], 12));
  return destino;
}

// ---------------------------------------------------------------------------------------------------------------------
// Links
// ---------------------------------------------------------------------------------------------------------------------
function andarDist(d) { return fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? andarDist(path.join(d, e.name)) : [path.join(d, e.name)])); }
function nos(n, fn) { fn(n); for (const c of n.childNodes || []) nos(c, fn); if (n.content) nos(n.content, fn); }
const atributo = (n, a) => n.attrs?.find((x) => x.name === a)?.value;

async function parteLinks() {
  const paginas = andarDist(DIST).filter((f) => f.endsWith('.html') && !/google[0-9a-f]+\.html$/.test(f));
  const internos = new Map();
  const externos = new Map();
  const rel = (f) => '/' + path.relative(DIST, f).replaceAll('\\', '/');
  const ancorasRuins = [];
  for (const f of paginas) {
    const doc = parse(fs.readFileSync(f, 'utf8'));
    const ids = new Set();
    nos(doc, (n) => { const id = atributo(n, 'id'); if (id) ids.add(id); });
    nos(doc, (n) => {
      if (!n.tagName) return;
      // data-url do Work é o slug que o lightbox usa, não um endereço
      for (const a of ['href', 'src', 'poster', 'data-src']) {
        const v = atributo(n, a);
        if (!v) continue;
        if (a === 'href' && v.startsWith('#')) {
          // âncora na própria página precisa de destino; "#" sozinho só no gancho de lightbox do Webflow
          const ok = v === '#' ? (atributo(n, 'class') || '').includes('w-lightbox') || atributo(n, 'data-slider') === 'link' : ids.has(v.slice(1));
          if (!ok) ancorasRuins.push(`${v} em ${rel(f)}`);
          continue;
        }
        if (/^(mailto:|data:|javascript:|tel:)/.test(v)) continue;
        if (/^https?:/.test(v)) {
          if (!externos.has(v)) externos.set(v, new Set());
          externos.get(v).add(`${n.tagName}@${rel(f)}`);
          if (n.tagName === 'a' && v.startsWith('https://filmeshdonlinegratis.vercel.app')) internos.set(`${v}\ta`, { v, tag: 'a', onde: rel(f) });
        } else if (!internos.has(`${v}\t${n.tagName}`)) internos.set(`${v}\t${n.tagName}`, { v, tag: n.tagName, onde: rel(f) });
      }
      const ss = atributo(n, 'srcset');
      if (ss) for (const s of ss.split(',')) { const v = s.trim().split(/\s+/)[0]; if (v && !internos.has(`${v}\t${n.tagName}`)) internos.set(`${v}\t${n.tagName}`, { v, tag: n.tagName, onde: rel(f) }); }
      if (['script', 'style'].includes(n.tagName)) return;
    });
  }
  confere('âncoras internas têm destino', ancorasRuins.length === 0, curto(ancorasRuins));
  // Interno: resposta 200 sem redirecionar; link de página com a barra final, sem índice e sem maiúscula.
  let ruins = [];
  const lista = [...internos.values()];
  const repetido = new Set();
  await emParalelo(lista, 4, async ({ v, tag, onde }) => {
    if (repetido.has(v)) return;
    repetido.add(v);
    if (v.startsWith('https://')) { ruins.push(`${v} em ${onde}: link absoluto para o próprio site; o Taxi compara o caminho como texto`); return; }
    if (!v.startsWith('/')) { ruins.push(`${v} em ${onde}: não começa com /`); return; }
    const limpo = v.split('#')[0].split('?')[0];
    if (tag === 'a' && !/\.[a-z0-9]+$/i.test(limpo) && !limpo.endsWith('/')) ruins.push(`${v} em ${onde}: sem barra final`);
    if (tag === 'a' && /(index\.html|\/\/|[A-Z])/.test(limpo)) ruins.push(`${v} em ${onde}: forma não canônica`);
    // O servidor local fecha conexões ociosas: uma nova tentativa não é falha do site.
    for (let t = 0; t < 4; t++) {
      try {
        const r = await fetch(BASE + encodeURI(decodeURI(limpo)), { redirect: 'manual' });
        if (r.status !== 200) ruins.push(`${v} em ${onde}: HTTP ${r.status} ${r.headers.get('location') || ''}`);
        await r.arrayBuffer();
        return;
      } catch (e) {
        if (t === 3) ruins.push(`${v} em ${onde}: ${e.cause?.code || e}`);
        await espera(300);
      }
    }
  });
  confere('links internos e recursos: 200 sem redirecionar, forma canônica', ruins.length === 0, `${repetido.size} distintos; ${curto(ruins, 10)}`);

  // Os dois lados da barra respondem como a hospedagem: sem barra leva à forma canônica.
  for (const c of ['/programacao', '/sobre', '/sessoes/bugonia-2025']) {
    const r = await fetch(BASE + c, { redirect: 'manual' });
    confere(`${c} redireciona para a forma com barra`, r.status >= 300 && r.status < 400 && (r.headers.get('location') || '').endsWith(`${c}/`), `${r.status} ${r.headers.get('location')}`);
  }

  // Canônica, og:url e href do menu: exatamente iguais ao caminho servido.
  const canonicos = [];
  for (const f of paginas) {
    const r = rel(f);
    if (r === '/404.html') continue;
    const esperado = 'https://filmeshdonlinegratis.vercel.app' + r.replace(/index\.html$/, '');
    const doc = parse(fs.readFileSync(f, 'utf8'));
    let can = null, url = null;
    nos(doc, (n) => {
      if (n.tagName === 'link' && atributo(n, 'rel') === 'canonical') can = atributo(n, 'href');
      if (n.tagName === 'meta' && atributo(n, 'property') === 'og:url') url = atributo(n, 'content');
    });
    if (can !== esperado || url !== esperado) canonicos.push(`${r}: canonical ${can} og:url ${url}`);
  }
  confere('canonical e og:url iguais à URL servida', canonicos.length === 0, curto(canonicos));

  // Externos: GET com agente de navegador. Discord e X podem bloquear robôs: resposta 403/429 é anotada, não dada por quebrada.
  const respostas = [];
  const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';
  await emParalelo([...externos.keys()], 6, async (u) => {
    const onde = [...externos.get(u)];
    if (onde.every((o) => /^(link|meta)/.test(o)) && u.startsWith('https://filmeshdonlinegratis.vercel.app')) return;
    if (u.startsWith('https://filmeshdonlinegratis.vercel.app')) return;
    if (/^https:\/\/www\.youtube\.com\/watch\?v=/.test(u)) return; // os IDs já são conferidos pelo oEmbed, abaixo
    let status, final, titulo = '';
    try {
      const c = new AbortController();
      const t = setTimeout(() => c.abort(), 25000);
      const r = await fetch(encodeURI(decodeURI(u)), { redirect: 'follow', headers: { 'user-agent': UA, 'accept-language': 'pt-BR' }, signal: c.signal });
      clearTimeout(t);
      status = r.status; final = r.url;
      // HTTP 200 não basta: um serviço pode responder 200 com uma página de erro
      const html = await r.text();
      titulo = /<title[^>]*>([^<]*)<\/title>/i.exec(html)?.[1]?.trim() || '';
    } catch (e) { status = `erro ${e.cause?.code || e.name}`; }
    respostas.push({ u, status, final, titulo, onde: onde.length, primeira: onde[0] });
  });
  fs.writeFileSync(path.join(SAIDA, 'links-externos.json'), JSON.stringify(respostas, null, 1));
  for (const r of respostas) {
    const bloqueavel = /discord\.gg|\/\/x\.com\//.test(r.u);
    const ok = (r.status === 200 && !/(error|erro|not found|não encontrad)/i.test(r.titulo)) || (bloqueavel && (r.status === 403 || r.status === 429));
    confere(`externo ${r.u}`, ok, `${r.status} "${r.titulo}" -> ${r.final || ''} (${r.onde} referências)`);
  }

  // XML bem formado e cabeçalhos dos arquivos públicos
  for (const [c, tipo] of [['/rss.xml', /rss\+xml/], ['/sitemap.xml', /xml/], ['/robots.txt', /text\/plain/]]) {
    const r = await fetch(BASE + c, { redirect: 'manual' });
    const t = await r.text();
    confere(`${c}: 200 e tipo certo`, r.status === 200 && tipo.test(r.headers.get('content-type') || ''), `${r.status} ${r.headers.get('content-type')}`);
    if (!c.endsWith('.xml')) continue;
    const pilha = [];
    let bem = true;
    const limpo = t.replace(/<!\[CDATA\[[\s\S]*?\]\]>/g, '').replace(/<\?[\s\S]*?\?>/g, '');
    for (const m of limpo.matchAll(/<(\/?)([a-zA-Z:]+)[^>]*?(\/?)>/g)) {
      if (m[3]) continue;
      if (!m[1]) pilha.push(m[2]);
      else if (pilha.pop() !== m[2]) bem = false;
    }
    confere(`${c}: XML bem formado`, bem && !pilha.length && !/&(?!amp;|lt;|gt;|quot;|apos;|#)/.test(limpo));
  }

  // Convite do Discord: a página é igual para código válido e inválido; a API pública distingue.
  for (const r of respostas.filter((x) => /discord\.gg\//.test(x.u))) {
    const codigo = r.u.split('/').pop();
    const a = await fetch(`https://discord.com/api/v9/invites/${codigo}`, { headers: { 'user-agent': UA } });
    await a.body?.cancel().catch(() => {});
    confere(`convite do Discord ${codigo} válido`, a.status === 200 || a.status === 429, String(a.status));
  }

  // Perfil no X: a página pode recusar robô ou pedir login; o oEmbed público responde 200 para perfil existente e 404 para inexistente.
  for (const r of respostas.filter((x) => /^https:\/\/x\.com\//.test(x.u))) {
    try {
      const a = await fetch(`https://publish.x.com/oembed?url=${encodeURIComponent(r.u)}`, { headers: { 'user-agent': UA } });
      await a.body?.cancel().catch(() => {});
      confere(`perfil do X ${r.u} existe`, a.status === 200 || a.status === 429, String(a.status));
    } catch (e) { confere(`perfil do X ${r.u} existe`, false, String(e).slice(0, 120)); }
  }

  // Trailers: oEmbed responde 200 só para vídeo público e incorporável.
  const trailers = [...new Set(SESSOES.flatMap((s) => s.filmes.map((f) => `${f.trailer.youtube}\t${f.titulo}`)))];
  await emParalelo(trailers, 6, async (t) => {
    const [id, titulo] = t.split('\t');
    try {
      const r = await fetch(`https://www.youtube.com/oembed?format=json&url=https://www.youtube.com/watch?v=${id}`, { headers: { 'user-agent': UA } });
      confere(`trailer ${id} (${titulo}) incorporável`, r.status === 200, String(r.status));
      await r.body?.cancel().catch(() => {});
    } catch (e) { confere(`trailer ${id} (${titulo}) incorporável`, false, String(e).slice(0, 120)); }
  });
}

// ---------------------------------------------------------------------------------------------------------------------
// Dados contra o JSON
// ---------------------------------------------------------------------------------------------------------------------
const SEMANA_PT = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado'];
const SEMANA_RSS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MES_RSS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MES_PT = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
const descodificar = (t) => t.replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
const textoDe = (n) => { let t = ''; nos(n, (x) => { if (x.nodeName === '#text' && !['script', 'style'].includes(x.parentNode?.tagName)) t += x.value + ' '; }); return t.replace(/\s+/g, ' '); };

function parteDados() {
  const rss = fs.readFileSync(path.join(DIST, 'rss.xml'), 'utf8');
  const itensRss = [...rss.matchAll(/<item>([\s\S]*?)<\/item>/g)].map((m) => m[1]);
  confere('RSS: um item por sessão', itensRss.length === SESSOES.length, `${itensRss.length} itens`);
  const mapa = fs.readFileSync(path.join(DIST, 'sitemap.xml'), 'utf8');
  const locs = [...mapa.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  const esperadas = ['/', '/programacao/', '/sobre/', '/contato/', '/cookies/', '/termos/', '/privacidade/', ...SLUGS.map((s) => `/sessoes/${s}/`)].map((c) => `https://filmeshdonlinegratis.vercel.app${c}`);
  confere('sitemap: todas as páginas, nenhuma a mais', [...locs].sort().join() === [...esperadas].sort().join(), `${locs.length} endereços`);

  for (const s of SESSOES) {
    const f = path.join(DIST, 'sessoes', s.slug, 'index.html');
    const html = fs.readFileSync(f, 'utf8');
    const doc = parse(html);
    const metas = {};
    const ld = [];
    let titulo = '';
    nos(doc, (n) => {
      if (n.tagName === 'meta') { const k = atributo(n, 'property') || atributo(n, 'name'); if (k) metas[k] = atributo(n, 'content'); }
      if (n.tagName === 'title') titulo = textoDe(n).trim();
      if (n.tagName === 'script' && atributo(n, 'type') === 'application/ld+json') ld.push(n.childNodes.map((c) => c.value || '').join(''));
    });
    const [a, m, d] = s.sessao.data.split('-');
    const dt = new Date(Date.UTC(+a, +m - 1, +d));
    const semana = SEMANA_PT[dt.getUTCDay()];
    const inicio = `${s.sessao.data}T${s.sessao.hora}`;
    const minutos = s.filmes.reduce((t, x) => t + x.duracao, 0);
    const corpo = textoDe(doc);
    const nome = s.slug;

    confere(`${nome}: <title> traz o título`, titulo.includes(s.titulo), titulo);
    confere(`${nome}: og:image da própria sessão`, metas['og:image'] === `https://filmeshdonlinegratis.vercel.app/og/${s.slug}.jpg`, metas['og:image']);
    confere(`${nome}: twitter:image igual a og:image`, metas['twitter:image'] === metas['og:image']);
    confere(`${nome}: descrição curta para meta`, (metas.description || '').length > 0 && metas.description.length <= 300, `${(metas.description || '').length} caracteres`);
    confere(`${nome}: meta description não cortada no meio`, /[.!?…]$/.test((metas.description || '').trim()), (metas.description || '').slice(-40));

    // JSON-LD
    let okLd = false, detalheLd = 'sem JSON-LD';
    for (const bruto of ld) {
      try {
        const j = JSON.parse(bruto);
        const objs = Array.isArray(j) ? j : [j];
        const ev = objs.flatMap((o) => (o['@graph'] ? o['@graph'] : [o])).find((o) => /Event/.test(o['@type'] || ''));
        if (ev) {
          okLd = ev.startDate?.startsWith(`${inicio}:00`) && /-03:00$/.test(ev.startDate);
          detalheLd = `${ev['@type']} ${ev.startDate} ${ev.name}`;
        } else detalheLd = `sem Event: ${bruto.slice(0, 120)}`;
      } catch (e) { detalheLd = `JSON inválido: ${e}`; }
    }
    confere(`${nome}: JSON-LD com a data do arquivo`, okLd, detalheLd);

    // Página: data, hora, sala, direção, duração, gêneros, créditos
    confere(`${nome}: página traz a data`, corpo.includes(`${d}/${m}/${a}`) || corpo.includes(`${d}/${m}`), `${d}/${m}/${a}`);
    confere(`${nome}: página traz a hora`, corpo.includes(s.sessao.hora), s.sessao.hora);
    confere(`${nome}: dia da semana certo`, new RegExp(semana, 'i').test(corpo) && !SEMANA_PT.filter((x) => x !== semana && !/feira/.test(x)).some((x) => new RegExp(`${x} ?,? ?${d}`, 'i').test(corpo)), `${s.sessao.data} é ${semana}`);
    confere(`${nome}: página traz a direção`, s.filmes.every((x) => corpo.includes(x.direcao)), s.filmes.map((x) => x.direcao).join());
    confere(`${nome}: página traz a duração`, s.filmes.every((x) => corpo.includes(String(x.duracao))) || corpo.includes(String(minutos)), `${minutos}`);
    const creditos = [...s.creditos.principais, ...s.creditos.producao, ...s.creditos.elenco];
    const semNome = creditos.filter((c) => !corpo.includes(descodificar(c.nome)));
    confere(`${nome}: todos os créditos na página`, !semNome.length, curto(semNome.map((c) => c.nome)));
    const semLeitura = s.texto.leituras.filter((l) => !corpo.includes(l.frase) || !corpo.includes(l.rotulo));
    confere(`${nome}: as 6 leituras na página`, s.texto.leituras.length === 6 && !semLeitura.length, curto(semLeitura.map((l) => l.rotulo)));

    // RSS
    const item = itensRss.find((i) => i.includes(`/sessoes/${s.slug}/</link>`));
    if (!item) { confere(`${nome}: item no RSS`, false); continue; }
    const pub = /<pubDate>([^<]+)<\/pubDate>/.exec(item)?.[1];
    const esperadoPub = `${SEMANA_RSS[dt.getUTCDay()]}, ${d} ${MES_RSS[+m - 1]} ${a} ${s.sessao.hora}:00 -0300`;
    confere(`${nome}: pubDate do RSS`, pub === esperadoPub, `${pub}`);
    const longa = `${Number(d)} de ${MES_PT[+m - 1]} de ${a}`;
    confere(`${nome}: data por extenso no RSS`, new RegExp(`${semana}, ${longa}`, 'i').test(item), longa);
    confere(`${nome}: título no RSS`, descodificar(/<title>([^<]+)<\/title>/.exec(item)?.[1] || '').startsWith(s.titulo), /<title>([^<]+)<\/title>/.exec(item)?.[1]);
  }

  // Ingresso do menu e cartões da home contra o JSON (HTML antes do script de ordem)
  const home = parse(fs.readFileSync(path.join(DIST, 'index.html'), 'utf8'));
  const cartoes = [];
  nos(home, (n) => { if (n.tagName === 'div' && atributo(n, 'data-roll') === 'item' && atributo(n, 'data-sessao')) cartoes.push(n); });
  confere('home: um cartão por sessão', cartoes.length === SESSOES.length, String(cartoes.length));
  for (const c of cartoes) {
    const s = SESSOES.find((x) => x.slug === atributo(c, 'data-sessao'));
    const t = textoDe(c);
    const [, m, d] = s.sessao.data.split('-');
    const dt = new Date(Date.UTC(+s.sessao.data.slice(0, 4), +m - 1, +d));
    const semana = SEMANA_PT[dt.getUTCDay()];
    confere(`home ${s.slug}: data, dia da semana, hora e sala`, t.includes(`${d}/${m}`) && t.includes(`${semana} ${s.sessao.hora} ${s.sessao.sala}`), t.slice(0, 80));
    confere(`home ${s.slug}: data-ini igual ao arquivo`, atributo(c, 'data-ini') === `${s.sessao.data}T${s.sessao.hora}`, atributo(c, 'data-ini'));
  }
}

// ---------------------------------------------------------------------------------------------------------------------
// Marca: og:image e favicons
// ---------------------------------------------------------------------------------------------------------------------
async function parteMarca() {
  const OG = path.join(DIST, 'og');
  for (const s of [...SLUGS, 'padrao']) {
    const f = path.join(OG, `${s}.jpg`);
    if (!fs.existsSync(f)) { confere(`og ${s}`, false, 'não existe'); continue; }
    const m = await sharp(f).metadata();
    confere(`og ${s}: 1200x630 em JPEG`, m.width === 1200 && m.height === 630 && m.format === 'jpeg', `${m.width}x${m.height} ${m.format}`);
  }
  // O favicon tem de ser o arquivo do proprietário reduzido, pixel a pixel, e não um redesenho.
  const FONTE = path.join(RAIZ, 'reference/brand/simbolo.png');
  for (const [nome, lado] of [['favicon-32.png', 32], ['icone-toque-180.png', 180], ['icone-512.png', 512]]) {
    const arq = path.join(DIST, 'assets/img/site', nome);
    const a = await sharp(arq).removeAlpha().raw().toBuffer({ resolveWithObject: true });
    const b = await sharp(FONTE).removeAlpha().resize(lado, lado).raw().toBuffer({ resolveWithObject: true });
    let soma = 0, maior = 0;
    for (let i = 0; i < a.data.length; i++) { const d = Math.abs(a.data[i] - b.data[i]); soma += d; maior = Math.max(maior, d); }
    const media = soma / a.data.length;
    confere(`${nome}: igual a simbolo.png reduzido`, a.info.width === lado && a.info.height === lado && media < 1, `${a.info.width}x${a.info.height} diferença média ${media.toFixed(3)} máxima ${maior}`);
  }
  // A máscara do símbolo no logo: alfa precisa seguir a luminância do original.
  const mascara = path.join(DIST, 'assets/img/site/simbolo-mascara.webp');
  const alfa = await sharp(mascara).ensureAlpha().extractChannel('alpha').raw().toBuffer({ resolveWithObject: true });
  const lum = await sharp(FONTE).removeAlpha().greyscale().resize(alfa.info.width, alfa.info.height).raw().toBuffer();
  let divergentes = 0;
  for (let i = 0; i < alfa.data.length; i++) if ((alfa.data[i] > 127) !== (lum[i] > 127)) divergentes++;
  const frac = divergentes / alfa.data.length;
  confere('simbolo-mascara.webp: mesma forma de simbolo.png', frac < 0.002, `${(frac * 100).toFixed(3)}% de pixels divergentes`);
}

// ---------------------------------------------------------------------------------------------------------------------
if (PARTES.includes('marca')) await parteMarca();
if (PARTES.includes('dados')) parteDados();
if (PARTES.includes('links')) await parteLinks();
if (PARTES.includes('despejo')) await parteDespejo();
if (PARTES.includes('matriz')) await parteMatriz();
if (PARTES.includes('titulos')) await parteTitulos();
if (PARTES.includes('menu')) await parteMenu();

const falhas = resultados.filter((r) => !r.ok);
fs.writeFileSync(path.join(SAIDA, `resultado-${PARTES.join('-')}.json`), JSON.stringify(resultados, null, 1));
console.log(`\n${resultados.length - falhas.length} de ${resultados.length} aprovados. Detalhes em ${SAIDA}`);
process.exit(falhas.length ? 1 : 0);
