// Trailers: os 22 tocando de verdade nas 21 páginas de sessão e todos os caminhos de fechar, contra o build em produção.
//   node tools/testes/trailers.mjs [--url=http://localhost:4322] [--canal=msedge] [--partes=oembed,tocar,...] [--so=expressão] [--paralelo=1] [--tentativas=3] [--saida=pasta]
// Partes: oembed, tocar, antes, fechar, dupla, rede, repetir, teclado, controles, paisagem, geometria, saida (padrão: todas).
// Sempre headless. Cada caso reprovado sai como FALHA e o processo termina com código 1.
//
// Como o player é lido: frame.evaluate dentro do iframe de youtube-nocookie, em #movie_player e no <video> dele. O site monta
// o iframe sem enablejsapi, então o postMessage não responde; o frame é lido de fora, sem mudar nada do que o site monta.
// Áudio nunca é ouvido: "sem áudio" quer dizer iframe fora do DOM, frame desanexado e nenhum <video>/<audio> tocando na página.
//
// Repetição: o WebGL headless é por software e o YouTube é rede de verdade. Um caso reprovado roda de novo em aba nova, até
// --tentativas. O que só passa na repetição sai como "aviso" com a primeira falha: é para ler, não para ignorar.
//
// page.route desliga o cache HTTP: só a parte "rede" usa. O relógio aqui é o real; nada depende da ordem das sessões.
import { chromium } from 'playwright';
import { AsyncLocalStorage } from 'node:async_hooks';
import fs from 'node:fs';
import path from 'node:path';

const arg = (n, d) => {
  const a = process.argv.find((x) => x.startsWith(`--${n}=`));
  return a ? a.slice(n.length + 3) : d;
};
const URL_BASE = arg('url', 'http://localhost:4322');
const CANAL = arg('canal', 'msedge');
const PARALELO = +arg('paralelo', '1');
const TENTATIVAS = +arg('tentativas', '3');
const SAIDA = arg('saida', '');
const SO = arg('so', ''); // só os casos cujo nome casa com esta expressão
const PARTES = arg('partes', 'oembed,tocar,antes,fechar,dupla,rede,repetir,teclado,controles,paisagem,geometria,saida').split(',');
if (SAIDA) fs.mkdirSync(SAIDA, { recursive: true });

const PASTA = path.resolve(import.meta.dirname, '../../src/data/sessoes');
const SESSOES = fs
  .readdirSync(PASTA)
  .filter((f) => f.endsWith('.json') && !f.startsWith('_'))
  .map((f) => {
    const j = JSON.parse(fs.readFileSync(path.join(PASTA, f), 'utf8'));
    return { slug: f.replace('.json', ''), titulo: j.titulo, filmes: j.filmes.map((x) => ({ titulo: x.titulo, id: x.trailer.youtube, canal: x.trailer.canal, tituloVideo: x.trailer.tituloVideo })) };
  });
const sessao = (slug) => SESSOES.find((s) => s.slug === slug);

// Título curto, sessão dupla e título longo
const PAGINAS = ['bugonia-2025', 'ready-or-not-double-feature-2026', 'the-inheritance-2025'];
const DUPLA = 'ready-or-not-double-feature-2026';
const OUTRA = 'vivarium-2019'; // página de onde se chega por Taxi, e para onde se volta

const UA_CELULAR = 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36';
const UA_TABLET = 'Mozilla/5.0 (Linux; Android 14; SM-X710) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';
const toque = (ua) => ({ userAgent: ua, hasTouch: true, isMobile: true });
const DISPOSITIVOS = {
  desktop: { viewport: { width: 1440, height: 900 } },
  tablet: { viewport: { width: 820, height: 1180 }, ...toque(UA_TABLET) },
  celular: { viewport: { width: 390, height: 844 }, ...toque(UA_CELULAR) },
  paisagem: { viewport: { width: 844, height: 390 }, ...toque(UA_CELULAR) },
};
const EXTRAS = [
  ['1920x1080', { viewport: { width: 1920, height: 1080 } }],
  ['1200x800', { viewport: { width: 1200, height: 800 } }],
  ['1199x800', { viewport: { width: 1199, height: 800 } }],
  ['1180x820 tablet deitado', { viewport: { width: 1180, height: 820 }, ...toque(UA_TABLET) }],
  ['1024x768 tablet deitado', { viewport: { width: 1024, height: 768 }, ...toque(UA_TABLET) }],
  ['768x1024 tablet', { viewport: { width: 768, height: 1024 }, ...toque(UA_TABLET) }],
  ['360x640 celular', { viewport: { width: 360, height: 640 }, ...toque(UA_CELULAR) }],
  ['320x568 celular', { viewport: { width: 320, height: 568 }, ...toque(UA_CELULAR) }],
  // De 480 a 767 px de largura o aviso de girar cobre tudo, de propósito: o trailer nem chega a abrir
  ['800x360 celular deitado', { viewport: { width: 800, height: 360 }, ...toque(UA_CELULAR) }],
  ['915x412 celular deitado', { viewport: { width: 915, height: 412 }, ...toque(UA_CELULAR) }],
  ['932x430 celular deitado', { viewport: { width: 932, height: 430 }, ...toque(UA_CELULAR) }],
  // Largas e baixas: o 16:9 de 80% da largura passaria da altura da janela
  ['1536x730', { viewport: { width: 1536, height: 730 } }],
  ['1920x800', { viewport: { width: 1920, height: 800 } }],
  ['2560x950', { viewport: { width: 2560, height: 950 } }],
  ['3440x1300', { viewport: { width: 3440, height: 1300 } }],
];
const HOST_FORA = /(^|\.)(youtube\.com|youtube-nocookie\.com|youtu\.be|ytimg\.com|googlevideo\.com|ggpht\.com|google\.com|google\.[a-z.]+|googleapis\.com|gstatic\.com|googleusercontent\.com|doubleclick\.net|googlesyndication\.com|google-analytics\.com|googletagmanager\.com)$/i;

const GATILHO = "[data-videoplayer='trigger']";
const DIALOGO = "[data-videoplayer='dialog']";
const FECHAR = "[data-videoplayer='close']";
const ESCURO = "[data-videoplayer='darken']";
const WRAPPER = "[data-videoplayer='wrapper']";
const VIDEO = "video[data-videoplayer='video']";
const MENU = "[data-menu='w']";

const resultados = [];
const avisos = [];
const fichas = [];
// Dentro de um caso as conferências ficam guardadas: só valem as da tentativa que encerra o caso
const casoAtual = new AsyncLocalStorage();
function publica({ nome, ok, detalhe, calado }) {
  resultados.push({ nome, ok, detalhe });
  if (!calado) console.log(`${ok ? 'ok   ' : 'FALHA'} ${nome}${detalhe ? `  ${detalhe}` : ''}`);
}
function confere(nome, ok, detalhe = '', calado = false) {
  const guardadas = casoAtual.getStore();
  if (guardadas) guardadas.push({ nome, ok, detalhe, calado });
  else publica({ nome, ok, detalhe, calado });
}
function aviso(nome, detalhe = '') {
  avisos.push({ nome, detalhe });
  console.log(`aviso ${nome}${detalhe ? `  ${detalhe}` : ''}`);
}

// ---------------------------------------------------------------- utilidades

// Um navegador por caso: um ERR_NETWORK_CHANGED ou um serviço de rede travado não contamina os casos seguintes
async function novaAba(disp, { cookies = true } = {}) {
  const opcoes = typeof disp === 'string' ? DISPOSITIVOS[disp] : disp;
  const navegador = await chromium.launch({ channel: CANAL, headless: true });
  const ctx = await navegador.newContext({ ...opcoes, locale: 'pt-BR', timezoneId: 'America/Sao_Paulo' });
  if (cookies) {
    await ctx.addCookies([
      { name: 'preloader_shown', value: String(Date.now()), url: URL_BASE },
      { name: 'tutorial_shown', value: 'true', url: URL_BASE },
    ]);
  }
  // Só no documento do site: CSP violada e qualquer src ou play() no <video> do bundle
  await ctx.addInitScript((base) => {
    if (window.top !== window || !location.href.startsWith(base)) return;
    window.__teste = { csp: [], srcVideo: [], playVideo: 0 };
    document.addEventListener('securitypolicyviolation', (e) => window.__teste.csp.push(`${e.violatedDirective} ${e.blockedURI}`));
    const d = Object.getOwnPropertyDescriptor(HTMLMediaElement.prototype, 'src');
    Object.defineProperty(HTMLMediaElement.prototype, 'src', {
      configurable: true,
      get: d.get,
      set(v) {
        if (this.matches('[data-videoplayer]')) window.__teste.srcVideo.push(String(v));
        d.set.call(this, v);
      },
    });
    const p = HTMLMediaElement.prototype.play;
    HTMLMediaElement.prototype.play = function () {
      if (this.matches('[data-videoplayer]')) window.__teste.playVideo++;
      return p.apply(this, arguments);
    };
    // Também por atributo e por <source> filho: o <video> do bundle nunca pode ganhar fonte, em nenhuma página do Taxi
    const sa = Element.prototype.setAttribute;
    Element.prototype.setAttribute = function (nome, valor) {
      if (String(nome).toLowerCase() === 'src' && this.matches?.("video[data-videoplayer='video'], video[data-videoplayer='video'] source")) window.__teste.srcVideo.push(String(valor));
      return sa.apply(this, arguments);
    };
    new MutationObserver((lista) => {
      for (const m of lista) for (const n of m.addedNodes) if (n.nodeType === 1 && n.matches('source') && n.parentElement?.matches("video[data-videoplayer='video']")) window.__teste.srcVideo.push(`<source> ${n.getAttribute('src')}`);
    }).observe(document, { childList: true, subtree: true });
  }, URL_BASE);
  const page = await ctx.newPage();
  page.ehToque = !!opcoes.hasTouch;
  page.erros = [];
  page.errosFora = [];
  page.errosAmbiente = [];
  page.pedidos = [];
  page.on('request', (r) => page.pedidos.push({ url: r.url(), t: Date.now() }));
  // O evento também traz exceções do iframe, sem pilha, como "A network error occurred." com o YouTube bloqueado: do site é só o que tem a URL dele na pilha
  page.on('pageerror', (e) => {
    (String(e.stack || '').includes(URL_BASE) ? page.erros : page.errosFora).push(String(e.message || e).slice(0, 200));
  });
  page.on('console', (m) => {
    if (m.type() !== 'error') return;
    const origem = m.location()?.url || '';
    if (page.consoleEsperado?.test(m.text())) return;
    // Do próprio bundle, no touchmove de window; também aparece na estrutura original.
    if (/Unable to preventDefault inside passive/.test(m.text())) return;
    // Dispositivo de áudio ou rede da máquina mudando com dezenas de navegadores headless abertos: vira aviso, não defeito do site
    if (/AudioContext encountered an error from the audio device|ERR_NETWORK_CHANGED/.test(m.text())) page.errosAmbiente.push(m.text().slice(0, 120));
    else (origem.startsWith(URL_BASE) ? page.erros : page.errosFora).push(`${m.text().slice(0, 200)} [${origem.replace(URL_BASE, '')}]`);
  });
  return { ctx, page, navegador };
}

async function salvarTela(page, nome) {
  if (!SAIDA) return;
  const arquivo = path.join(SAIDA, `${nome.replace(/[^\w.-]+/g, '_')}.png`);
  await page.screenshot({ path: arquivo, timeout: 30000 }).catch(() => {});
}

async function umaVez(nome, disp, fn, opcoes) {
  const { ctx, page, navegador } = await novaAba(disp, opcoes);
  try {
    await fn(page, ctx);
  } catch (e) {
    confere(nome, false, `exceção: ${String(e.message || e).split('\n')[0]}`);
    await salvarTela(page, `erro-${nome}`);
  }
  const fim = await page.evaluate(() => ({ ...window.__teste, atributo: document.querySelector("video[data-videoplayer='video']")?.getAttribute('src') ?? null })).catch(() => null);
  const problemas = [];
  if (page.erros.length) problemas.push(`console: ${page.erros.slice(0, 3).join(' | ')}`);
  if (fim?.csp?.length) problemas.push(`CSP: ${fim.csp.slice(0, 3).join(' | ')}`);
  if (fim?.srcVideo?.length || fim?.atributo) problemas.push(`<video> recebeu src: ${fim.srcVideo} ${fim.atributo}`);
  if (fim?.playVideo) problemas.push(`play() no <video> vazio: ${fim.playVideo}`);
  if (page.errosAmbiente.length) aviso(`${nome}: erro do ambiente no console`, page.errosAmbiente[0]);
  confere(`${nome}: site limpo`, problemas.length === 0, problemas.join('; '), problemas.length === 0);
  await ctx.close().catch(() => {});
  await navegador.close().catch(() => {});
}

// Cada caso em aba própria. Exceção vira FALHA; console do site e CSP são conferidos no fim de todos.
async function caso(nome, disp, fn, opcoes) {
  if (SO && !new RegExp(SO).test(nome)) return;
  for (let tentativa = 1; ; tentativa++) {
    const guardadas = [];
    await casoAtual.run(guardadas, () => umaVez(nome, disp, fn, opcoes));
    const reprovadas = guardadas.filter((r) => !r.ok);
    if (!reprovadas.length || tentativa >= TENTATIVAS) {
      guardadas.forEach(publica);
      return;
    }
    aviso(`${nome}: reprovado na tentativa ${tentativa}, repetindo`, `${reprovadas[0].nome}: ${reprovadas[0].detalhe}`.slice(0, 400));
  }
}

async function emLotes(tarefas, n = PARALELO) {
  let i = 0;
  await Promise.all(
    Array.from({ length: Math.max(1, n) }, async () => {
      while (i < tarefas.length) await tarefas[i++]();
    }),
  );
}

const framesYouTube = (page) => page.frames().filter((f) => /youtube(-nocookie)?\.com\/embed\//.test(f.url()));
const hostDe = (u) => {
  try {
    return new URL(u).host;
  } catch {
    return '';
  }
};
const pedidosDeFora = (page, desde = 0) => page.pedidos.filter((p) => p.t >= desde && /^https?:/.test(p.url) && !p.url.startsWith(URL_BASE));

async function clicarEm(page, x, y) {
  if (page.ehToque) await page.touchscreen.tap(x, y);
  else {
    await page.mouse.move(x, y);
    await page.mouse.down();
    await page.mouse.up();
  }
}

async function esperarBundle(page) {
  await page.waitForFunction((g) => typeof document.querySelector(g)?.onclick === 'function', GATILHO, { timeout: 120000 });
}

// O pôster ainda escala e o Lenis ainda anda depois de rolar: clica só com o botão parado e acertável
async function gatilhoParado(page) {
  let ant = null;
  for (let i = 0; i < 400; i++) {
    const r = await page.evaluate((g) => {
      const t = document.querySelector(g);
      const b = t.getBoundingClientRect();
      const cs = getComputedStyle(t);
      const x = b.left + b.width / 2;
      const y = b.top + b.height / 2;
      const e = document.elementFromPoint(x, y);
      return { x, y, acerta: !!e?.closest(g), vis: cs.visibility, op: +cs.opacity };
    }, GATILHO);
    if (ant && Math.abs(r.x - ant.x) < 0.5 && Math.abs(r.y - ant.y) < 0.5 && r.acerta && r.vis === 'visible' && r.op > 0.99) return r;
    ant = r;
    await page.waitForTimeout(150);
  }
  throw new Error(`gatilho não ficou clicável: ${JSON.stringify(ant)}`);
}

async function irAoGatilho(page) {
  await esperarBundle(page);
  await page.evaluate((g) => document.querySelector(g).scrollIntoView({ block: 'center', behavior: 'instant' }), GATILHO);
  return gatilhoParado(page);
}

const irPara = (page, slug) => page.goto(`${URL_BASE}/sessoes/${slug}/`, { waitUntil: 'load', timeout: 180000 });

async function esperarAberto(page) {
  await page.waitForFunction(
    ([d, e]) => document.querySelector(d)?.classList.contains('open') && parseFloat(document.querySelector(e)?.style.opacity) >= 0.9 && document.querySelector('iframe.yt-trailer'),
    [DIALOGO, ESCURO],
    { timeout: 60000 },
  );
}

async function abrirTrailer(page) {
  const p = await irAoGatilho(page);
  await clicarEm(page, p.x, p.y);
  await esperarAberto(page);
}

const lerPlayer = (frame) =>
  frame.evaluate(() => {
    const p = document.querySelector('#movie_player');
    const v = document.querySelector('video.html5-main-video') || document.querySelector('video');
    const e = document.querySelector('.ytp-error');
    const visivel = !!e && e.getClientRects().length > 0 && getComputedStyle(e).display !== 'none';
    const dados = p?.getVideoData?.();
    return {
      url: location.href,
      tem: !!p,
      estado: p?.getPlayerState?.(),
      t: p?.getCurrentTime?.(),
      duracao: p?.getDuration?.(),
      mudo: p?.isMuted?.(),
      volume: p?.getVolume?.(),
      id: dados?.video_id,
      titulo: dados?.title,
      autor: dados?.author,
      vT: v?.currentTime,
      pausado: v?.paused,
      vMudo: v?.muted,
      rs: v?.readyState,
      w: v?.videoWidth,
      h: v?.videoHeight,
      erro: visivel ? e.innerText.replace(/\s+/g, ' ').trim().slice(0, 160) : null,
      anuncio: !!document.querySelector('.ad-showing'),
      legenda: document.querySelector('.ytp-caption-segment')?.innerText || null,
      permiteAutoplay: document.featurePolicy?.allowsFeature?.('autoplay'),
      permiteTelaCheia: document.fullscreenEnabled,
    };
  });

// Tocando é estado 1 com o relógio do vídeo andando. Sem tela de erro. No toque, se o YouTube não partir sozinho, toca no player.
async function esperarTocando(page, id, { limite = 60000, avanco = 1.5, tocarSeParado = 25000 } = {}) {
  const t0 = Date.now();
  let primeiro = null;
  let ultimo = null;
  let tocou = false;
  while (Date.now() - t0 < limite) {
    const fr = framesYouTube(page).find((f) => f.url().includes(`/embed/${id}`));
    if (fr) {
      ultimo = await lerPlayer(fr).catch(() => ultimo);
      if (ultimo?.erro) return { ok: false, motivo: `tela de erro: ${ultimo.erro}`, ultimo, ms: Date.now() - t0 };
      if (ultimo?.estado === 1 && ultimo.pausado === false && ultimo.id === id) {
        if (!primeiro) primeiro = { ...ultimo, ms: Date.now() - t0 };
        else if (ultimo.vT >= primeiro.vT + avanco) return { ok: true, primeiro, ultimo, ms: primeiro.ms, tocou };
      }
      if (page.ehToque && !tocou && !primeiro && Date.now() - t0 > tocarSeParado) {
        const b = await page.locator('iframe.yt-trailer').boundingBox();
        if (b) await page.touchscreen.tap(b.x + b.width / 2, b.y + b.height / 2);
        tocou = true;
      }
    }
    await page.waitForTimeout(300);
  }
  return { ok: false, motivo: `não tocou em ${limite / 1000} s`, ultimo, ms: Date.now() - t0 };
}
const resumoPlayer = (r) => (r.ok ? `estado ${r.ultimo.estado}, ${r.primeiro.vT.toFixed(2)}→${r.ultimo.vT.toFixed(2)} s, mudo ${r.ultimo.mudo}, partiu em ${(r.ms / 1000).toFixed(1)} s${r.tocou ? ', pediu toque' : ''}${r.ultimo.anuncio ? ', ANÚNCIO' : ''}` : `${r.motivo} | ${JSON.stringify(r.ultimo || {}).slice(0, 220)}`);

// Com o diálogo aberto: geometria, o que cobre o player (inclusive o que tem pointer-events: none) e o estado da página.
// O estilo temporário faz elementsFromPoint enxergar as camadas que deixam o clique passar; ele sai antes de voltar.
const medirAberto = (page) =>
  page.evaluate(
    ({ DIALOGO, FECHAR, ESCURO, VIDEO, MENU }) => {
      const q = (s) => document.querySelector(s);
      const desc = (el) => `${el.tagName.toLowerCase()}${el.id ? `#${el.id}` : ''}${typeof el.className === 'string' && el.className ? `.${el.className.trim().split(/\s+/).join('.')}` : ''}`;
      const f = q('iframe.yt-trailer');
      const r = f.getBoundingClientRect();
      const opacidade = (el) => {
        let o = 1;
        for (let n = el; n && n.nodeType === 1; n = n.parentElement) o *= +getComputedStyle(n).opacity;
        return o;
      };
      const pinta = (el) => {
        const cs = getComputedStyle(el);
        if (cs.visibility !== 'visible' || opacidade(el) < 0.02) return false;
        const fundo = cs.backgroundColor;
        const temFundo = !/rgba?\(0, 0, 0, 0\)|transparent/.test(fundo) || cs.backgroundImage !== 'none';
        const temTexto = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
        return temFundo || temTexto || ['IMG', 'VIDEO', 'CANVAS', 'SVG', 'PATH'].includes(el.tagName.toUpperCase());
      };
      const estilo = document.createElement('style');
      estilo.textContent = '*{pointer-events:auto!important}';
      document.head.append(estilo);
      const cobre = new Set();
      let fora = 0;
      const eixos = [0.004, 0.1, 0.25, 0.5, 0.75, 0.9, 0.996];
      for (const a of eixos) {
        for (const b of eixos) {
          const pilha = document.elementsFromPoint(r.left + r.width * a, r.top + r.height * b);
          if (!pilha.includes(f)) fora++;
          for (const el of pilha) {
            if (el === f) break;
            if (pinta(el)) cobre.add(desc(el));
          }
        }
      }
      estilo.remove();
      const acertavel = (el) => {
        if (!el) return null;
        const b = el.getBoundingClientRect();
        const dentro = b.left >= 0 && b.top >= 0 && b.right <= innerWidth + 0.5 && b.bottom <= innerHeight + 0.5;
        const e = document.elementFromPoint(b.left + b.width / 2, b.top + b.height / 2);
        return { x: b.left + b.width / 2, y: b.top + b.height / 2, l: Math.round(b.width), a: Math.round(b.height), dentro, acerta: !!e && (e === el || el.contains(e)) };
      };
      const antes = getComputedStyle(document.body, '::before');
      const m = q(MENU);
      const v = q(VIDEO);
      return {
        src: f.src,
        titulo: f.title,
        referrer: f.referrerPolicy,
        allow: f.allow,
        qtd: document.querySelectorAll('iframe').length,
        rect: { l: r.left, t: r.top, w: r.width, h: r.height },
        dentro: r.left >= -0.5 && r.top >= -0.5 && r.right <= innerWidth + 0.5 && r.bottom <= innerHeight + 0.5,
        cobre: [...cobre],
        fora,
        depois: getComputedStyle(document.body, '::after').display,
        faixaCobre: antes.display !== 'none' && r.top < parseFloat(antes.height),
        fechar: acertavel(q(FECHAR)),
        opcoes: [...document.querySelectorAll('[data-trailer]')].map((b) => ({ ...acertavel(b), id: b.dataset.trailer, apertado: b.getAttribute('aria-pressed') })),
        saida: { ...acertavel(q('[data-trailer-fora]')), href: q('[data-trailer-fora]')?.href, rel: q('[data-trailer-fora]')?.rel },
        logo: (() => { const b = q('.marca-nav')?.getBoundingClientRect(); return b ? { x: b.left + b.width / 2, y: b.top + b.height / 2, l: Math.round(b.width), a: Math.round(b.height) } : null; })(),
        escuro: q(ESCURO).style.opacity,
        lenisParado: document.documentElement.classList.contains('lenis-stopped'),
        menu: { op: +getComputedStyle(m).opacity, vis: getComputedStyle(m).visibility },
        videoSrc: v?.getAttribute('src') ?? null,
        videoAtual: v?.currentSrc ?? '',
        largura: document.documentElement.scrollWidth,
        vw: innerWidth,
        vh: innerHeight,
      };
    },
    { DIALOGO, FECHAR, ESCURO, VIDEO, MENU },
  );

function problemasAberto(m, id, { exigeSelecionado } = {}) {
  const p = [];
  if (m.qtd !== 1) p.push(`${m.qtd} iframes`);
  if (!m.src.startsWith(`https://www.youtube-nocookie.com/embed/${id}`)) p.push(`src ${m.src}`);
  if (m.referrer !== 'strict-origin-when-cross-origin') p.push(`referrerpolicy ${m.referrer}`);
  if (m.depois !== 'none') p.push(`body::after ${m.depois}`);
  if (m.faixaCobre) p.push('faixa SMPTE sobre o player');
  if (m.cobre.length) p.push(`cobrem o player: ${m.cobre.join(', ')}`);
  if (m.fora) p.push(`${m.fora} de 49 pontos do player cortados ou fora da tela`);
  if (!m.dentro) p.push(`player fora da tela: ${JSON.stringify(m.rect)} em ${m.vw}x${m.vh}`);
  if (m.rect.w < 200 || m.rect.h < 200) p.push(`player menor que 200x200: ${Math.round(m.rect.w)}x${Math.round(m.rect.h)}`);
  if (!m.fechar?.dentro || !m.fechar?.acerta) p.push(`fechar inalcançável: ${JSON.stringify(m.fechar)}`);
  for (const o of m.opcoes) if (!o.dentro || !o.acerta) p.push(`opção ${o.id} inalcançável: ${JSON.stringify(o)}`);
  if (!m.saida.dentro || !m.saida.acerta) p.push(`link do YouTube inalcançável: ${JSON.stringify(m.saida)}`);
  if (m.saida.href !== `https://www.youtube.com/watch?v=${id}`) p.push(`link do YouTube aponta para ${m.saida.href}`);
  if (m.saida.rel !== 'noopener noreferrer') p.push(`link do YouTube com rel "${m.saida.rel}"`);
  // acertavel só olha o centro: a caixa inteira não pode cobrir o X, e nada do seletor fica sob o logo, que pinta por cima
  const cruza = (a, b) => a && b && Math.abs(a.x - b.x) < (a.l + b.l) / 2 && Math.abs(a.y - b.y) < (a.a + b.a) / 2;
  if (cruza(m.saida, m.fechar)) p.push(`link do YouTube sobre o X: ${JSON.stringify(m.saida)} ${JSON.stringify(m.fechar)}`);
  if (cruza(m.saida, m.logo)) p.push(`link do YouTube sob o logo: ${JSON.stringify(m.saida)} ${JSON.stringify(m.logo)}`);
  for (const o of m.opcoes) if (cruza(o, m.logo)) p.push(`opção ${o.id} sob o logo: ${JSON.stringify(o)} ${JSON.stringify(m.logo)}`);
  for (const o of m.opcoes) if (cruza(o, m.saida)) p.push(`opção ${o.id} sobre o link do YouTube: ${JSON.stringify(o)} ${JSON.stringify(m.saida)}`);
  if (!m.lenisParado) p.push('Lenis solto com o diálogo aberto');
  if (m.menu.vis !== 'hidden') p.push(`menu visível sobre o trailer: ${JSON.stringify(m.menu)}`);
  if (m.videoSrc || m.videoAtual) p.push(`<video> com fonte: ${m.videoSrc} ${m.videoAtual}`);
  if (m.largura > m.vw + 1) p.push(`rolagem lateral: ${m.largura} em ${m.vw}`);
  return p;
}
const resumoAberto = (m) => `player ${Math.round(m.rect.w)}x${Math.round(m.rect.h)} em ${m.vw}x${m.vh}, fechar ${m.fechar?.l}x${m.fechar?.a}${m.opcoes.length ? `, opções ${m.opcoes.map((o) => `${o.l}x${o.a}`).join(' ')}` : ''}`;

const lerFechado = (page) =>
  page.evaluate(
    ({ GATILHO, DIALOGO, ESCURO, VIDEO, MENU }) => {
      const q = (s) => document.querySelector(s);
      const d = q(DIALOGO);
      const e = q(ESCURO);
      const g = q(GATILHO);
      const m = q(MENU);
      const a = document.activeElement;
      return {
        iframes: document.querySelectorAll('iframe').length,
        aberto: d?.classList.contains('open'),
        dialogo: d && getComputedStyle(d).visibility,
        escuro: e && getComputedStyle(e).visibility,
        lenisParado: document.documentElement.classList.contains('lenis-stopped'),
        menu: { op: +getComputedStyle(m).opacity, vis: getComputedStyle(m).visibility },
        foco: a ? `${a.tagName.toLowerCase()}.${a.className}` : null,
        focoGatilho: a === g,
        gatilho: g && { op: +getComputedStyle(g).opacity, vis: getComputedStyle(g).visibility },
        depois: getComputedStyle(document.body, '::after').display,
        midiaTocando: [...document.querySelectorAll('video,audio')].filter((v) => !v.paused).length,
        videoSrc: q(VIDEO)?.getAttribute('src') ?? null,
      };
    },
    { GATILHO, DIALOGO, ESCURO, VIDEO, MENU },
  );

// Rola de verdade: roda do mouse no desktop, dedo no resto. Devolve quantos pixels a página andou.
// O dedo é touchStart, touchMove e touchEnd crus: Input.synthesizeScrollGesture devolve 0 px nestas páginas mesmo sem abrir o
// diálogo, e reprovaria tudo. No celular, um toque a menos de 8 px do player é entregue ao iframe pelo ajuste de toque.
async function arrastarDedo(page, x, y, distancia) {
  page.cdp ??= await page.context().newCDPSession(page);
  const toque = (type, touchPoints) => page.cdp.send('Input.dispatchTouchEvent', { type, touchPoints });
  await toque('touchStart', [{ x, y }]);
  for (let i = 1; i <= 12; i++) {
    await toque('touchMove', [{ x, y: y - (distancia * i) / 12 }]);
    await page.waitForTimeout(16);
  }
  await toque('touchEnd', []);
}
async function rolar(page, { x, y } = {}) {
  const vp = page.viewportSize();
  const px = x ?? vp.width / 4;
  const py = y ?? vp.height * 0.6;
  const antes = await page.evaluate(() => scrollY);
  if (page.ehToque) {
    await arrastarDedo(page, px, py, Math.round(vp.height / 3));
  } else {
    await page.mouse.move(px, py);
    await page.mouse.wheel(0, 400);
  }
  let delta = 0;
  for (let i = 0; i < 20; i++) {
    await page.waitForTimeout(100);
    delta = (await page.evaluate(() => scrollY)) - antes;
    if (Math.abs(delta) > 20) break;
  }
  return delta;
}

// Depois de fechar: espera os tweens e confere tudo de uma vez, numa linha só por caso
async function conferirFechado(page, nome, { foco = true, frameAntigo = null, linhaDeBase = null, rolagemAntes = null } = {}) {
  const p = [];
  await page
    .waitForFunction(
      ([d, m, g]) => {
        const dl = document.querySelector(d);
        const mn = getComputedStyle(document.querySelector(m));
        const gt = getComputedStyle(document.querySelector(g));
        return dl && !dl.classList.contains('open') && +mn.opacity > 0.99 && mn.visibility === 'visible' && +gt.opacity > 0.99 && gt.visibility === 'visible' && !document.documentElement.classList.contains('lenis-stopped');
      },
      [DIALOGO, MENU, GATILHO],
      { timeout: 30000 },
    )
    .catch(() => {});
  const f = await lerFechado(page);
  if (f.iframes) p.push(`${f.iframes} iframe(s) no DOM`);
  // a lista de frames do Playwright anda um pouco atrás do DOM
  for (let i = 0; i < 40 && framesYouTube(page).length; i++) await page.waitForTimeout(250);
  const restantes = framesYouTube(page).length;
  if (restantes) p.push(`${restantes} frame(s) do YouTube vivos`);
  if (frameAntigo && !frameAntigo.isDetached()) p.push('frame antigo não saiu');
  if (f.midiaTocando) p.push(`${f.midiaTocando} mídia(s) tocando`);
  if (f.aberto) p.push('diálogo ainda com .open');
  if (f.dialogo !== 'hidden') p.push(`diálogo ${f.dialogo}`);
  if (f.escuro !== 'hidden') p.push(`escurecimento ${f.escuro}`);
  if (f.lenisParado) p.push('Lenis parado');
  if (f.menu.op < 0.99 || f.menu.vis !== 'visible') p.push(`menu ${JSON.stringify(f.menu)}`);
  if (foco && !f.focoGatilho) p.push(`foco em ${f.foco}`);
  if (!f.gatilho || f.gatilho.op < 0.99 || f.gatilho.vis !== 'visible') p.push(`gatilho ${JSON.stringify(f.gatilho)}`);
  if (linhaDeBase ? f.depois !== linhaDeBase : f.depois === 'none') p.push(`body::after ${f.depois}`);
  if (f.videoSrc) p.push(`<video> com src ${f.videoSrc}`);
  if (rolagemAntes !== null) {
    const agora = await page.evaluate(() => scrollY);
    if (Math.abs(agora - rolagemAntes) > 2) p.push(`a página pulou ao fechar: ${Math.round(rolagemAntes)} → ${Math.round(agora)}`);
  }
  const andou = await rolar(page);
  if (Math.abs(andou) < 20) p.push(`não rolou: ${andou} px`);
  // Requisição nova ao YouTube depois de fechado é player vivo em algum lugar
  const marca = Date.now();
  await page.waitForTimeout(1500);
  const novos = pedidosDeFora(page, marca);
  if (novos.length) p.push(`${novos.length} pedido(s) externos depois de fechar: ${hostDe(novos[0].url)}`);
  confere(nome, p.length === 0, p.join('; ') || `sem iframe, rolou ${Math.round(andou)} px, menu visível, ${foco ? 'foco no gatilho, ' : ''}body::after ${f.depois}`);
}

// Depois de qualquer fechamento o estado interno tem de estar certo: um clique só reabre, com o trailer certo
async function reabre(page, nome, id) {
  const p = await irAoGatilho(page);
  await clicarEm(page, p.x, p.y);
  await esperarAberto(page);
  const m = await medirAberto(page);
  confere(`${nome}: reabre com um clique`, m.qtd === 1 && m.src.includes(`/embed/${id}`), m.src);
  await page.keyboard.press('Escape');
  await page.waitForFunction((d) => !document.querySelector(d).classList.contains('open'), DIALOGO, { timeout: 15000 });
}

async function taxiPara(page, slug, { esperar = true } = {}) {
  const alvo = `/sessoes/${slug}/`;
  const achou = await page.evaluate((h) => {
    const a = document.querySelector(`a[href="${h}"]`);
    if (!a) return false;
    a.click();
    return true;
  }, alvo);
  if (!achou) throw new Error(`nenhum link para ${alvo}`);
  if (esperar) await esperarSessao(page, slug);
}

async function esperarSessao(page, slug) {
  const id = sessao(slug).filmes[0].id;
  await page.waitForFunction(
    ([h, id, g, w]) => location.pathname === h && document.querySelector(w)?.dataset.youtube === id && typeof document.querySelector(g)?.onclick === 'function',
    [`/sessoes/${slug}/`, id, GATILHO, WRAPPER],
    { timeout: 60000 },
  );
}

// Um ponto da área escura a mais de 30 px do player e dos botões: mais perto que isso o dedo pode ser entregue a eles
async function pontoEscuro(page) {
  return page.evaluate((ESCURO) => {
    const e = document.querySelector(ESCURO);
    const perto = [...document.querySelectorAll("iframe.yt-trailer, [data-videoplayer='close'], [data-trailer], [data-trailer-fora]")].map((n) => n.getBoundingClientRect());
    const longe = (x, y) => perto.every((r) => x < r.left - 30 || x > r.right + 30 || y < r.top - 30 || y > r.bottom + 30);
    const achados = [];
    let total = 0;
    let escuros = 0;
    for (let y = 25; y < innerHeight - 10; y += 30) {
      for (let x = 15; x < innerWidth - 10; x += 30) {
        total++;
        if (document.elementFromPoint(x, y) !== e) continue;
        escuros++;
        if (longe(x, y)) achados.push({ x, y });
      }
    }
    achados.sort((a, b) => Math.abs(a.y - innerHeight / 2) - Math.abs(b.y - innerHeight / 2) || a.x - b.x);
    return { ponto: achados[0] || null, qtd: escuros, total };
  }, ESCURO);
}

// ---------------------------------------------------------------- partes

// oEmbed: ainda responde, e título e canal batem com o que está em src/data/sessoes
async function parteOembed() {
  const pedir = async (id) => {
    let ultimo;
    for (let i = 0; i < 3; i++) {
      try {
        const r = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(`https://www.youtube.com/watch?v=${id}`)}&format=json`, { signal: AbortSignal.timeout(20000) });
        if (r.status === 200) return { status: 200, ...(await r.json()) };
        ultimo = { status: r.status };
      } catch (e) {
        ultimo = { status: 0, erro: String(e.message || e) };
      }
    }
    return ultimo;
  };
  for (const s of SESSOES) {
    for (const f of s.filmes) {
      const r = await pedir(f.id);
      confere(`oEmbed ${s.slug} ${f.id}`, r.status === 200 && !!r.title, `${r.status} | ${r.title ?? r.erro ?? ''} | ${r.author_name ?? ''}`);
      if (r.status === 200) {
        if (r.author_name !== f.canal) aviso(`oEmbed ${f.id}: canal mudou`, `dado "${f.canal}", YouTube "${r.author_name}"`);
        if (r.title !== f.tituloVideo) aviso(`oEmbed ${f.id}: título mudou`, `dado "${f.tituloVideo}", YouTube "${r.title}"`);
      }
      fichas.push({ tipo: 'oembed', slug: s.slug, id: f.id, status: r.status, titulo: r.title, canal: r.author_name, canalNoDado: f.canal });
    }
  }
}

async function tocarUma(s) {
  await caso(`tocar ${s.slug}`, 'desktop', async (page) => {
    await irPara(page, s.slug);
    const posicao = await irAoGatilho(page);
    // Antes do clique: nada fora do site
    const fora = pedidosDeFora(page);
    const hosts = [...new Set(fora.map((p) => hostDe(p.url)))];
    const dicas = await page.evaluate((re) => [...document.querySelectorAll('link[href],script[src],img[src],source[src],iframe')].map((n) => n.href || n.src || '').filter((u) => { try { return new RegExp(re, 'i').test(new URL(u).host); } catch { return false; } }), HOST_FORA.source);
    confere(`${s.slug}: nada fora do site antes do clique`, hosts.length === 0 && dicas.length === 0, [hosts.join(', '), dicas.join(', ')].filter(Boolean).join(' | ') || `${page.pedidos.length} pedidos, todos locais`);
    // O dado para buscadores aponta para os mesmos vídeos, e o texto do JSON-LD não vira requisição
    const noLd = await page.evaluate(() => [...document.querySelectorAll('script[type="application/ld+json"]')].flatMap((n) => [...n.textContent.matchAll(/youtube-nocookie\.com\/embed\/([\w-]{11})/g)].map((m) => m[1])));
    confere(`${s.slug}: JSON-LD com os trailers certos`, s.filmes.every((f) => noLd.includes(f.id)) && noLd.every((id) => s.filmes.some((f) => f.id === id)), noLd.join(','));
    await clicarEm(page, posicao.x, posicao.y);
    await esperarAberto(page);
    for (let i = 0; i < s.filmes.length; i++) {
      const f = s.filmes[i];
      if (i > 0) {
        const b = await medirAberto(page);
        const o = b.opcoes[i];
        await clicarEm(page, o.x, o.y);
      }
      const r = await esperarTocando(page, f.id);
      const m = await medirAberto(page);
      const titulo = `Trailer de ${f.titulo}`;
      const p = problemasAberto(m, f.id);
      if (m.titulo !== titulo) p.push(`title do iframe "${m.titulo}"`);
      confere(`tocar ${s.slug} ${f.id}`, r.ok && p.length === 0, p.join('; ') || resumoPlayer(r));
      fichas.push({ tipo: 'tocar', canal: CANAL, slug: s.slug, id: f.id, ok: r.ok, ms: r.ms, estado: r.ultimo?.estado, inicio: r.primeiro?.vT, fim: r.ultimo?.vT, duracao: r.ultimo?.duracao, mudo: r.ultimo?.mudo, volume: r.ultimo?.volume, videoId: r.ultimo?.id, titulo: r.ultimo?.titulo, autor: r.ultimo?.autor, erro: r.ultimo?.erro, resolucao: r.ultimo ? `${r.ultimo.w}x${r.ultimo.h}` : null, anuncio: r.ultimo?.anuncio, legenda: r.ultimo?.legenda, autoplay: r.ultimo?.permiteAutoplay, telaCheia: r.ultimo?.permiteTelaCheia });
    }
    await salvarTela(page, `tocar-${s.slug}`);
    await page.keyboard.press('Escape');
    await page.waitForFunction((d) => !document.querySelector(d).classList.contains('open'), DIALOGO, { timeout: 30000 });
  });
}

async function parteTocar() {
  await emLotes(SESSOES.map((s) => () => tocarUma(s)));
  const tocados = fichas.filter((f) => f.tipo === 'tocar' && f.ok);
  const mudos = tocados.filter((f) => f.mudo).length;
  console.log(`info  ${new Set(tocados.map((f) => f.id)).size} trailers tocaram depois de um clique; ${mudos} em ${tocados.length} leituras estavam mudos (o site não pede mute)`);
}

// Nada de YouTube ao rolar a página inteira e passar o mouse no botão, em celular e desktop, nem depois de uma navegação Taxi
async function parteAntes() {
  const tarefas = [];
  for (const disp of ['desktop', 'celular']) {
    for (const slug of PAGINAS) {
      tarefas.push(() =>
        caso(`antes ${disp} ${slug}`, disp, async (page) => {
          await irPara(page, slug);
          await esperarBundle(page);
          const altura = await page.evaluate(() => document.documentElement.scrollHeight);
          for (let y = 0; y < altura; y += 700) {
            await page.evaluate((v) => window.scrollTo(0, v), y);
            await page.waitForTimeout(120);
          }
          const p = await irAoGatilho(page);
          if (!page.ehToque) await page.mouse.move(p.x, p.y);
          await page.waitForTimeout(1500);
          const hosts = [...new Set(pedidosDeFora(page).map((x) => hostDe(x.url)))];
          const iframes = await page.evaluate(() => document.querySelectorAll('iframe').length);
          const cookies = (await page.context().cookies()).filter((c) => !c.domain.includes('localhost')).map((c) => c.name);
          confere(`antes ${disp} ${slug}: página toda rolada, nada fora do site`, hosts.length === 0 && iframes === 0 && cookies.length === 0, `hosts [${hosts}] iframes ${iframes} cookies de fora [${cookies}] em ${page.pedidos.length} pedidos`);
          await taxiPara(page, OUTRA);
          await page.waitForTimeout(2500);
          const hosts2 = [...new Set(pedidosDeFora(page).map((x) => hostDe(x.url)))];
          confere(`antes ${disp} ${slug}: depois de um Taxi, nada fora do site`, hosts2.length === 0, `hosts [${hosts2}]`);
        }),
      );
    }
  }
  await emLotes(tarefas);
}

// Os caminhos de fechar. Em todos o trailer já estava tocando, exceto nos que fecham durante a abertura.
const CAMINHOS = {
  async x(page) {
    const m = await medirAberto(page);
    await clicarEm(page, m.fechar.x, m.fechar.y);
    return `${m.fechar.l}x${m.fechar.a}`;
  },
  async escuro(page) {
    const e = await pontoEscuro(page);
    if (!e.ponto) throw new Error(`nenhum ponto da tela acerta o escurecimento (${e.total} testados)`);
    await clicarEm(page, e.ponto.x, e.ponto.y);
    return `em ${e.ponto.x},${e.ponto.y}; ${e.qtd} de ${e.total} pontos da tela acertam`;
  },
  async escape(page) {
    await page.keyboard.press('Escape');
    return '';
  },
};

function casosDeFechar(disp, slug) {
  const f = sessao(slug).filmes[0];
  const tarefas = [];
  for (const nome of Object.keys(CAMINHOS)) {
    const rotulo = `fechar ${disp} ${slug} ${nome}`;
    tarefas.push(() =>
      caso(rotulo, disp, async (page) => {
        await irPara(page, slug);
        await abrirTrailer(page);
        const m = await medirAberto(page);
        const pa = problemasAberto(m, f.id);
        confere(`${rotulo}: aberto sem nada por cima`, pa.length === 0, pa.join('; ') || resumoAberto(m));
        const r = await esperarTocando(page, f.id, { avanco: 0.8 });
        confere(`${rotulo}: tocando`, r.ok, resumoPlayer(r));
        // o scroll fica preso enquanto aberto, mesmo com a roda sobre o iframe
        const preso = await rolar(page, { x: m.rect.l + m.rect.w / 2, y: m.rect.t + m.rect.h / 2 });
        const areaEscura = (await pontoEscuro(page)).ponto;
        const presoFora = areaEscura ? await rolar(page, areaEscura) : 0;
        confere(`${rotulo}: fundo não rola com o diálogo aberto`, Math.abs(preso) < 5 && Math.abs(presoFora) < 5, `sobre o player ${preso} px, sobre a área escura ${presoFora} px`);
        await esperarTocando(page, f.id, { avanco: 0.2, limite: 20000 }); // um arrasto sobre o player pode pausar ou mostrar controles
        if (nome === 'x') await salvarTela(page, `aberto-${disp}-${slug}`);
        const frame = framesYouTube(page)[0];
        const rolagemAntes = await page.evaluate(() => scrollY);
        const info = await CAMINHOS[nome](page);
        // um toque que caísse no link do YouTube também fecharia: só uma aba aberta denuncia
        confere(`${rotulo}: nenhuma aba nova`, page.context().pages().length === 1, `${page.context().pages().length} abas`, true);
        await conferirFechado(page, `${rotulo}${info ? ` (${info})` : ''}`, { frameAntigo: frame, rolagemAntes });
        await reabre(page, rotulo, f.id);
      }),
    );
  }
  // Voltar com o diálogo aberto, tendo chegado por Taxi: a página anterior entra limpa
  const rVoltar = `fechar ${disp} ${slug} voltar`;
  tarefas.push(() =>
    caso(rVoltar, disp, async (page) => {
      await irPara(page, OUTRA);
      await esperarBundle(page);
      await page.waitForTimeout(800);
      await taxiPara(page, slug);
      await abrirTrailer(page);
      const r = await esperarTocando(page, f.id, { avanco: 0.8 });
      confere(`${rVoltar}: tocando`, r.ok, resumoPlayer(r));
      const frame = framesYouTube(page)[0];
      await page.goBack({ timeout: 60000 });
      await esperarSessao(page, OUTRA);
      await conferirFechado(page, rVoltar, { foco: false, frameAntigo: frame });
      await page.goForward({ timeout: 60000 });
      await esperarSessao(page, slug);
      const volta = await lerFechado(page);
      confere(`${rVoltar}: avançar não traz o diálogo de volta`, !volta.aberto && volta.iframes === 0, JSON.stringify({ aberto: volta.aberto, iframes: volta.iframes }));
      await reabre(page, rVoltar, f.id);
    }),
  );
  // Navegar enquanto abre: por link e pelo voltar, antes do fim da abertura
  const rNav = `fechar ${disp} ${slug} link durante a abertura`;
  tarefas.push(() =>
    caso(rNav, disp, async (page) => {
      await irPara(page, slug);
      const p = await irAoGatilho(page);
      await clicarEm(page, p.x, p.y);
      await page.waitForTimeout(120);
      const escuro = await page.evaluate((e) => document.querySelector(e).style.opacity, ESCURO);
      const durante = parseFloat(escuro || 0) < 0.9;
      await taxiPara(page, OUTRA);
      // passa do setTimeout de 500 ms do B.scroll.stop e do tween do escurecimento
      await page.waitForTimeout(2500);
      await conferirFechado(page, `${rNav}${durante ? '' : ' (AVISO: já tinha terminado)'} (escurecimento ${escuro || 0})`, { foco: false });
      await reabre(page, rNav, sessao(OUTRA).filmes[0].id);
    }),
  );
  const rNavV = `fechar ${disp} ${slug} voltar durante a abertura`;
  tarefas.push(() =>
    caso(rNavV, disp, async (page) => {
      await irPara(page, OUTRA);
      await esperarBundle(page);
      await page.waitForTimeout(800);
      await taxiPara(page, slug);
      const p = await irAoGatilho(page);
      await clicarEm(page, p.x, p.y);
      await page.waitForTimeout(120);
      const escuro = await page.evaluate((e) => document.querySelector(e).style.opacity, ESCURO);
      await page.goBack({ timeout: 60000 });
      await esperarSessao(page, OUTRA);
      await page.waitForTimeout(2500);
      await conferirFechado(page, `${rNavV} (escurecimento ${escuro || 0})`, { foco: false });
      await reabre(page, rNavV, sessao(OUTRA).filmes[0].id);
    }),
  );
  return tarefas;
}

async function parteFechar() {
  const tarefas = [];
  for (const disp of ['desktop', 'tablet', 'celular']) for (const slug of PAGINAS) tarefas.push(...casosDeFechar(disp, slug));
  await emLotes(tarefas);
}

// Seletor da sessão dupla: mouse, teclado e toque
async function escolher(page, rotulo, indice, acionar) {
  const [a, b] = sessao(DUPLA).filmes;
  const alvo = sessao(DUPLA).filmes[indice];
  const frameAntigo = framesYouTube(page)[0];
  const historia = await page.evaluate(() => history.length);
  await acionar();
  const r = await esperarTocando(page, alvo.id, { avanco: 0.8 });
  const m = await medirAberto(page);
  const h2 = await page.evaluate(() => history.length);
  const p = problemasAberto(m, alvo.id);
  if (m.opcoes[indice].apertado !== 'true' || m.opcoes[1 - indice].apertado !== 'false') p.push(`aria-pressed ${m.opcoes.map((o) => o.apertado)}`);
  if (m.titulo !== `Trailer de ${alvo.titulo}`) p.push(`title "${m.titulo}"`);
  if (frameAntigo && !frameAntigo.isDetached()) p.push('player anterior continua vivo');
  if (h2 !== historia) p.push(`histórico cresceu de ${historia} para ${h2}`);
  if (framesYouTube(page).length !== 1) p.push(`${framesYouTube(page).length} players`);
  confere(rotulo, r.ok && p.length === 0, p.join('; ') || resumoPlayer(r));
  void a;
  void b;
}

async function parteDupla() {
  const [a, b] = sessao(DUPLA).filmes;
  const porPonto = (disp) =>
    caso(`dupla ${disp}`, disp, async (page) => {
      const meio = page.ehToque ? 'toque' : 'mouse';
      await irPara(page, DUPLA);
      await abrirTrailer(page);
      const r0 = await esperarTocando(page, a.id, { avanco: 0.8 });
      confere(`dupla ${disp}: começa no primeiro filme`, r0.ok, resumoPlayer(r0));
      await salvarTela(page, `dupla-${disp}`);
      const clicar = (i) => async () => {
        const m = await medirAberto(page);
        await clicarEm(page, m.opcoes[i].x, m.opcoes[i].y);
      };
      await escolher(page, `dupla ${disp}: ${meio} no segundo filme`, 1, clicar(1));
      // de novo no já escolhido: não remonta
      await page.evaluate(() => { document.querySelector('iframe.yt-trailer').dataset.marca = '1'; });
      await clicar(1)();
      await page.waitForTimeout(800);
      const manteve = await page.evaluate(() => document.querySelector('iframe.yt-trailer')?.dataset.marca === '1');
      confere(`dupla ${disp}: ${meio} no já escolhido não remonta o player`, manteve);
      await escolher(page, `dupla ${disp}: ${meio} de volta no primeiro`, 0, clicar(0));
      await escolher(page, `dupla ${disp}: ${meio} no segundo outra vez`, 1, clicar(1));
      // fechar com o segundo escolhido; reabrir mantém a escolha com um só player
      const m = await medirAberto(page);
      const frame = framesYouTube(page)[0];
      await clicarEm(page, m.fechar.x, m.fechar.y);
      await conferirFechado(page, `dupla ${disp}: fechado pelo X com o segundo escolhido`, { frameAntigo: frame });
      await abrirTrailer(page);
      const m2 = await medirAberto(page);
      const r2 = await esperarTocando(page, b.id, { avanco: 0.8 });
      confere(`dupla ${disp}: reabre no filme escolhido`, r2.ok && m2.opcoes[1].apertado === 'true' && m2.qtd === 1, resumoPlayer(r2));
      await page.keyboard.press('Escape');
      await conferirFechado(page, `dupla ${disp}: Escape no segundo filme`);
      // navegar e voltar: a página volta no primeiro filme
      await taxiPara(page, OUTRA);
      await page.waitForTimeout(1500);
      await page.goBack({ timeout: 60000 });
      // a URL muda antes da troca do DOM: só a sessão dupla tem o seletor
      await page.waitForFunction(([g, w]) => location.pathname.includes('ready-or-not') && !!document.querySelector('[data-trailer]') && typeof document.querySelector(g)?.onclick === 'function' && !!document.querySelector(w), [GATILHO, WRAPPER], { timeout: 60000 });
      const estado = await page.evaluate((w) => ({ id: document.querySelector(w).dataset.youtube, apertado: [...document.querySelectorAll('[data-trailer]')].map((o) => o.getAttribute('aria-pressed')).join() }), WRAPPER);
      confere(`dupla ${disp}: voltar à página reinicia no primeiro filme`, estado.id === a.id && estado.apertado === 'true,false', JSON.stringify(estado));
    });
  const tarefas = [() => porPonto('desktop'), () => porPonto('tablet'), () => porPonto('celular')];
  // Teclado
  tarefas.push(() =>
    caso('dupla teclado', 'desktop', async (page) => {
      await irPara(page, DUPLA);
      await irAoGatilho(page);
      await page.evaluate((g) => document.querySelector(g).focus(), GATILHO);
      await page.keyboard.press('Enter');
      await esperarAberto(page);
      const r0 = await esperarTocando(page, a.id, { avanco: 0.8 });
      confere('dupla teclado: Enter no gatilho abre e toca', r0.ok, resumoPlayer(r0));
      const ordem = [];
      let achou = false;
      for (let i = 0; i < 6 && !achou; i++) {
        await page.keyboard.press('Tab');
        const atual = await page.evaluate(() => {
          const e = document.activeElement;
          return { d: `${e.tagName.toLowerCase()}.${e.className}`, id: e.dataset?.trailer || null, contorno: getComputedStyle(e).outlineStyle, largura: getComputedStyle(e).outlineWidth, visivel: e.matches(':focus-visible') };
        });
        ordem.push(atual.d);
        if (atual.id === b.id) {
          achou = true;
          confere('dupla teclado: foco visível na opção', atual.visivel && atual.contorno !== 'none', `outline ${atual.contorno} ${atual.largura}`);
        }
      }
      confere('dupla teclado: Tab chega à segunda opção', achou, ordem.join(' > '));
      await escolher(page, 'dupla teclado: Enter no segundo filme', 1, () => page.keyboard.press('Enter'));
      await page.keyboard.press('Shift+Tab');
      const voltou = await page.evaluate(() => document.activeElement.dataset?.trailer);
      confere('dupla teclado: Shift+Tab chega à primeira opção', voltou === a.id, voltou);
      await escolher(page, 'dupla teclado: Espaço no primeiro filme', 0, () => page.keyboard.press('Space'));
      const frame = framesYouTube(page)[0];
      await page.keyboard.press('Escape');
      await conferirFechado(page, 'dupla teclado: Escape com o foco na opção devolve o foco ao gatilho', { frameAntigo: frame });
    }),
  );
  await emLotes(tarefas);
}

// YouTube bloqueado. O visitante precisa ver algo honesto e sair do diálogo.
const BLOQUEIOS = [
  ['youtube-nocookie, abort failed', /youtube-nocookie\.com/, 'failed'],
  ['youtube-nocookie, bloqueador', /youtube-nocookie\.com/, 'blockedbyclient'],
  ['youtube-nocookie, DNS', /youtube-nocookie\.com/, 'namenotresolved'],
  ['só o vídeo (googlevideo)', /googlevideo\.com/, 'failed'],
  ['scripts do player (youtube.com e ytimg)', /(^https:\/\/[^/]*(youtube\.com|ytimg\.com|gstatic\.com)\/)|\/s\/player\//, 'failed'],
];
// Honesto é o visitante ler o que aconteceu: tela de erro do YouTube, página de erro do navegador com texto, ou um aviso do site.
// Retângulo preto ou cinza mudo não conta: sem isso ele fica esperando um vídeo que não vem.
async function lerSituacao(page) {
  const fr = page.frames().filter((f) => f !== page.mainFrame());
  const frame = fr[0]
    ? await fr[0]
        .evaluate(() => {
          const e = document.querySelector('.ytp-error');
          return {
            url: location.href.slice(0, 80),
            texto: document.body?.innerText?.replace(/\s+/g, ' ').trim().slice(0, 200) ?? '',
            erro: e && e.getClientRects().length > 0 ? e.innerText.replace(/\s+/g, ' ').trim().slice(0, 160) : null,
            estado: document.querySelector('#movie_player')?.getPlayerState?.(),
          };
        })
        .catch((e) => ({ url: fr[0].url().slice(0, 80), texto: '', erro: null, semLeitura: String(e.message).split('\n')[0] }))
    : null;
  const doSite = await page.evaluate((d) => {
    const dl = document.querySelector(d);
    const candidatos = [...dl.querySelectorAll('*')].filter((n) => !n.closest('iframe') && !n.closest('[data-videoplayer="ui"]') && !n.closest('.trailer-opcoes') && !n.closest('[data-trailer-fora]') && !n.closest('button') && n.children.length === 0 && n.textContent.trim() && getComputedStyle(n).visibility === 'visible' && n.getClientRects().length);
    return candidatos.map((n) => n.textContent.trim()).join(' | ');
  }, DIALOGO);
  const honesto = !!frame?.erro || !!(frame?.url.startsWith('chrome-error') && frame.texto) || !!doSite;
  return { frame, doSite, honesto, nativo: fr[0] };
}

// Bloqueio (ou vídeo que deixou de existir) num aparelho: o diálogo abre, o estado é honesto e cada saída funciona
function casosDeBloqueio(nome, disp, slug, preparar, saidas = Object.keys(CAMINHOS)) {
  const id = sessao(slug).filmes[0].id;
  return saidas.map((nomeSaida, i) => {
    const rotulo = `bloqueio ${nome}, ${disp}, sair por ${nomeSaida}`;
    return () =>
      caso(rotulo, disp, async (page) => {
        await preparar(page, id);
        await irPara(page, slug);
        await abrirTrailer(page);
        // tempo de sobra para um aviso aparecer, se houver
        await page.waitForTimeout(15000);
        const m = await medirAberto(page);
        const pa = problemasAberto(m, m.src.split('/embed/')[1].split('?')[0]);
        confere(`${rotulo}: diálogo abre, nada por cima`, pa.length === 0, pa.join('; ') || resumoAberto(m));
        const s = await lerSituacao(page);
        if (i === 0) {
          // O site não enxerga o player de outra origem: sem texto de erro, o que resta ao visitante é o link, conferido em problemasAberto
          if (!s.honesto) aviso(`bloqueio ${nome}, ${disp}: sem texto de erro, resta o link`, `frame ${JSON.stringify(s.frame)}`);
          fichas.push({ tipo: 'bloqueio', nome, disp, frame: s.frame, avisoDoSite: s.doSite });
          await salvarTela(page, `bloqueio-${nome}-${disp}`);
        }
        const info = await CAMINHOS[nomeSaida](page);
        await conferirFechado(page, `${rotulo}${info ? ` (${info})` : ''}`, { frameAntigo: s.nativo });
      });
  });
}

async function parteRede() {
  const tarefas = [];
  const bloquear = (padrao, erro) => (page) => page.route(padrao, (r) => r.abort(erro));
  // Página com outro ID: vídeo apagado, ou que deixou de aceitar incorporação
  const trocarId = (novo) => (page, id) =>
    page.route(
      (u) => u.pathname.startsWith('/sessoes/'),
      async (route) => {
        const r = await route.fetch();
        await route.fulfill({ response: r, body: (await r.text()).replaceAll(id, novo) });
      },
    );
  for (const [nome, padrao, erro] of BLOQUEIOS) tarefas.push(...casosDeBloqueio(nome, 'desktop', 'bugonia-2025', bloquear(padrao, erro)));
  for (const disp of ['tablet', 'celular', 'paisagem']) tarefas.push(...casosDeBloqueio(BLOQUEIOS[0][0], disp, 'bugonia-2025', bloquear(BLOQUEIOS[0][1], BLOQUEIOS[0][2])));
  tarefas.push(...casosDeBloqueio(BLOQUEIOS[0][0], 'desktop', DUPLA, bloquear(BLOQUEIOS[0][1], BLOQUEIOS[0][2]), ['x']));
  tarefas.push(...casosDeBloqueio('vídeo apagado', 'desktop', 'bugonia-2025', trocarId('xxxxxxxxxxx'), ['x', 'escape']));
  tarefas.push(...casosDeBloqueio('vídeo com restrição de idade', 'desktop', 'bugonia-2025', trocarId('vLa0FX_xi08'), ['x', 'escape']));
  // Sem internet depois de a página carregar
  tarefas.push(() =>
    caso('bloqueio sem internet', 'celular', async (page, ctx) => {
      await irPara(page, 'bugonia-2025');
      await irAoGatilho(page);
      page.consoleEsperado = /ERR_INTERNET_DISCONNECTED/; // imagens tardias do próprio site também falham: é o que se espera aqui
      await ctx.setOffline(true);
      await abrirTrailer(page);
      await page.waitForTimeout(6000);
      await salvarTela(page, 'bloqueio-sem-internet-celular');
      const s = await lerSituacao(page);
      if (!s.honesto) aviso('bloqueio sem internet: sem texto de erro, resta o link', `frame ${JSON.stringify(s.frame)}`);
      const m = await medirAberto(page);
      confere('bloqueio sem internet: link do YouTube à vista', m.saida.dentro && m.saida.acerta, JSON.stringify(m.saida));
      await clicarEm(page, m.fechar.x, m.fechar.y);
      await page.waitForFunction((d) => !document.querySelector(d).classList.contains('open'), DIALOGO, { timeout: 30000 });
      await ctx.setOffline(false);
      await conferirFechado(page, 'bloqueio sem internet: celular fecha pelo X');
    }),
  );
  await emLotes(tarefas);
}

// Reaberturas, navegação entre sessões, cliques em má hora
async function parteRepetir() {
  const tarefas = [];
  for (const disp of ['desktop', 'tablet', 'celular']) {
    tarefas.push(() =>
      caso(`repetir ${disp} duas vezes seguidas`, disp, async (page) => {
        const f = sessao('the-menu-2022').filmes[0];
        await irPara(page, 'the-menu-2022');
        await abrirTrailer(page);
        const r1 = await esperarTocando(page, f.id, { avanco: 0.8 });
        confere(`repetir ${disp}: primeira abertura toca`, r1.ok, resumoPlayer(r1));
        const m1 = await medirAberto(page);
        await clicarEm(page, m1.fechar.x, m1.fechar.y);
        await conferirFechado(page, `repetir ${disp}: fechou a primeira`);
        await abrirTrailer(page);
        const r2 = await esperarTocando(page, f.id, { avanco: 0.8 });
        const m2 = await medirAberto(page);
        confere(`repetir ${disp}: segunda abertura toca, com um só player`, r2.ok && m2.qtd === 1 && framesYouTube(page).length === 1, resumoPlayer(r2));
        await page.keyboard.press('Escape');
        await conferirFechado(page, `repetir ${disp}: fechou a segunda`);
      }),
    );
    tarefas.push(() =>
      caso(`repetir ${disp} depois de Taxi`, disp, async (page) => {
        const [slugA, slugB, slugC] = ['the-menu-2022', 'obsession-2026', 'pulp-fiction-1994'];
        await irPara(page, slugA);
        await esperarBundle(page);
        await page.waitForTimeout(800);
        await taxiPara(page, slugB);
        await abrirTrailer(page);
        const rB = await esperarTocando(page, sessao(slugB).filmes[0].id, { avanco: 0.8 });
        confere(`repetir ${disp}: Taxi para ${slugB}, trailer certo`, rB.ok, resumoPlayer(rB));
        const mB = await medirAberto(page);
        await clicarEm(page, mB.fechar.x, mB.fechar.y);
        await conferirFechado(page, `repetir ${disp}: fechou depois do Taxi`);
        await taxiPara(page, slugC);
        await abrirTrailer(page);
        const rC = await esperarTocando(page, sessao(slugC).filmes[0].id, { avanco: 0.8 });
        confere(`repetir ${disp}: segundo Taxi para ${slugC}, trailer certo`, rC.ok, resumoPlayer(rC));
        await page.keyboard.press('Escape');
        await conferirFechado(page, `repetir ${disp}: Escape depois do segundo Taxi (um só ouvinte)`);
        // de volta a uma página que o Taxi já tem em cache
        await page.waitForTimeout(800);
        await page.goBack({ timeout: 60000 });
        await esperarSessao(page, slugB);
        await abrirTrailer(page);
        const rB2 = await esperarTocando(page, sessao(slugB).filmes[0].id, { avanco: 0.8 });
        const mB2 = await medirAberto(page);
        confere(`repetir ${disp}: página do cache do Taxi abre, um só player`, rB2.ok && mB2.qtd === 1, resumoPlayer(rB2));
        await page.keyboard.press('Escape');
        await conferirFechado(page, `repetir ${disp}: Escape na página do cache do Taxi`);
        // a primeira página, a do carregamento inicial, volta da cópia do Taxi
        await page.waitForTimeout(800);
        await page.goBack({ timeout: 60000 });
        await esperarSessao(page, slugA);
        await abrirTrailer(page);
        const rA = await esperarTocando(page, sessao(slugA).filmes[0].id, { avanco: 0.8 });
        const mA = await medirAberto(page);
        confere(`repetir ${disp}: página do carregamento inicial reabre pelo Taxi`, rA.ok && mA.qtd === 1, resumoPlayer(rA));
        await page.keyboard.press('Escape');
        await conferirFechado(page, `repetir ${disp}: Escape na página inicial revisitada`);
      }),
    );
    // Clique duplo no botão de play: o segundo clique cai no toggleState do bundle antes de o botão sumir
    for (const intervalo of [0, 100, 180]) {
      tarefas.push(() =>
        caso(`repetir ${disp} clique duplo ${intervalo} ms`, disp, async (page) => {
          const f = sessao('the-menu-2022').filmes[0];
          await irPara(page, 'the-menu-2022');
          const p = await irAoGatilho(page);
          await clicarEm(page, p.x, p.y);
          if (intervalo) await page.waitForTimeout(intervalo);
          await clicarEm(page, p.x, p.y);
          await esperarAberto(page);
          await page.waitForTimeout(1200);
          const m = await medirAberto(page);
          const pa = problemasAberto(m, f.id);
          await salvarTela(page, `clique-duplo-${disp}-${intervalo}`);
          confere(`repetir ${disp}: clique duplo (${intervalo} ms) abre sem efeito colateral`, pa.length === 0, pa.join('; ') || resumoAberto(m));
          await clicarEm(page, m.fechar.x, m.fechar.y);
          await page.waitForTimeout(1200);
          await salvarTela(page, `clique-duplo-${disp}-${intervalo}-fechado`);
          await conferirFechado(page, `repetir ${disp}: clique duplo (${intervalo} ms), depois X`);
        }),
      );
    }
  }
  // Fechar durante a abertura
  for (const [nome, fn] of [
    ['Escape', (page) => page.keyboard.press('Escape')],
    ['X', async (page) => {
      const b = await page.locator(FECHAR).boundingBox();
      await page.mouse.click(b.x + b.width / 2, b.y + b.height / 2);
    }],
    ['escuro', async (page) => {
      const e = await pontoEscuro(page);
      if (e.ponto) await page.mouse.click(e.ponto.x, e.ponto.y);
      else await page.evaluate((s) => document.querySelector(s).click(), ESCURO);
    }],
  ]) {
    tarefas.push(() =>
      caso(`repetir ${nome} durante a abertura`, 'desktop', async (page) => {
        const f = sessao('the-menu-2022').filmes[0];
        await irPara(page, 'the-menu-2022');
        const p = await irAoGatilho(page);
        await clicarEm(page, p.x, p.y);
        await page.waitForTimeout(250);
        const escuro = await page.evaluate((e) => document.querySelector(e).style.opacity, ESCURO);
        await fn(page);
        await conferirFechado(page, `repetir ${nome} durante a abertura (escurecimento ${escuro || 0}): fecha assim que termina`);
        await reabre(page, `repetir ${nome} durante a abertura`, f.id);
      }),
    );
  }
  // Escape com tudo fechado não mexe em nada
  tarefas.push(() =>
    caso('repetir Escape com o diálogo fechado', 'desktop', async (page) => {
      const f = sessao('the-menu-2022').filmes[0];
      await irPara(page, 'the-menu-2022');
      await irAoGatilho(page);
      await page.keyboard.press('Escape');
      await page.keyboard.press('Escape');
      await page.waitForTimeout(800);
      const e = await lerFechado(page);
      confere('repetir Escape com o diálogo fechado: nada muda', !e.aberto && e.iframes === 0 && !e.lenisParado && e.menu.vis === 'visible', JSON.stringify({ aberto: e.aberto, iframes: e.iframes, lenis: e.lenisParado, menu: e.menu }));
      await reabre(page, 'repetir Escape com o diálogo fechado', f.id);
    }),
  );
  // Abre e fecha em sequência: no fim, um só player e tudo solto
  tarefas.push(() =>
    caso('repetir abre e fecha cinco vezes', 'desktop', async (page) => {
      const f = sessao('the-menu-2022').filmes[0];
      await irPara(page, 'the-menu-2022');
      for (let i = 0; i < 5; i++) {
        await abrirTrailer(page);
        if (i % 2) await page.keyboard.press('Escape');
        else {
          const m = await medirAberto(page);
          await clicarEm(page, m.fechar.x, m.fechar.y);
        }
        await page.waitForFunction((d) => !document.querySelector(d).classList.contains('open'), DIALOGO, { timeout: 15000 });
      }
      await abrirTrailer(page);
      const r = await esperarTocando(page, f.id, { avanco: 0.8 });
      const m = await medirAberto(page);
      confere('repetir: sexta abertura toca com um só player', r.ok && m.qtd === 1 && framesYouTube(page).length === 1, resumoPlayer(r));
      await page.keyboard.press('Escape');
      await conferirFechado(page, 'repetir: fechou a sexta');
    }),
  );
  // Abrir e fechar não deixa entrada morta no histórico: um único voltar leva à página anterior, mesmo depois de trocar de trailer
  for (const [slug, trocar] of [['the-menu-2022', false], [DUPLA, true]]) {
    tarefas.push(() =>
      caso(`repetir abrir, fechar e voltar ${slug}`, 'desktop', async (page) => {
        await irPara(page, OUTRA);
        await esperarBundle(page);
        await page.waitForTimeout(800);
        await taxiPara(page, slug);
        const antes = await page.evaluate(() => history.length);
        await abrirTrailer(page);
        await esperarTocando(page, sessao(slug).filmes[0].id, { avanco: 0.5 });
        if (trocar) {
          const m = await medirAberto(page);
          await clicarEm(page, m.opcoes[1].x, m.opcoes[1].y);
          await esperarTocando(page, sessao(slug).filmes[1].id, { avanco: 0.5 });
        }
        await page.keyboard.press('Escape');
        await conferirFechado(page, `repetir abrir, fechar e voltar ${slug}: fechou`);
        const depois = await page.evaluate(() => history.length);
        await page.goBack({ timeout: 60000 });
        await esperarSessao(page, OUTRA);
        confere(`repetir abrir, fechar e voltar ${slug}: um voltar chega à página anterior, histórico ${antes} → ${depois}`, depois === antes, page.url());
      }),
    );
  }
  // Gatilho perto da borda: o visitante clica sem centralizar, e o bundle para o Lenis aos 500 ms
  for (const disp of ['desktop', 'celular']) {
    tarefas.push(() =>
      caso(`repetir ${disp} gatilho na borda`, disp, async (page) => {
        const f = sessao('the-menu-2022').filmes[0];
        await irPara(page, 'the-menu-2022');
        await esperarBundle(page);
        const vp = page.viewportSize();
        await page.evaluate(([g, h]) => {
          const t = document.querySelector(g).getBoundingClientRect();
          window.scrollTo({ top: scrollY + t.top + t.height / 2 - h, behavior: 'instant' });
        }, [GATILHO, vp.height * 0.92]);
        const p = await gatilhoParado(page);
        await clicarEm(page, p.x, p.y);
        await esperarAberto(page);
        await page.waitForTimeout(1500);
        const m = await medirAberto(page);
        const pa = problemasAberto(m, f.id);
        await salvarTela(page, `borda-${disp}`);
        confere(`repetir ${disp}: clique com o gatilho a ${Math.round(p.y)} px de ${vp.height}: player inteiro na tela`, pa.length === 0, pa.join('; ') || resumoAberto(m));
        await page.keyboard.press('Escape');
        await conferirFechado(page, `repetir ${disp}: fecha depois do clique na borda`);
      }),
    );
  }
  // A seta do herói cria uma entrada #second no histórico: voltar fecha o diálogo e fica na página
  tarefas.push(() =>
    caso('repetir voltar para a âncora da mesma página', 'desktop', async (page) => {
      const f = sessao('the-menu-2022').filmes[0];
      await irPara(page, 'the-menu-2022');
      await esperarBundle(page);
      await page.waitForTimeout(1500);
      await page.evaluate(() => document.querySelector('a[href="#second"]').click());
      await page.waitForTimeout(2000);
      const naSecao = await page.evaluate((g) => {
        const r = document.querySelector(g).getBoundingClientRect();
        return { hash: location.hash, dentro: r.top >= 0 && r.bottom <= innerHeight };
      }, GATILHO);
      confere('repetir: a seta do herói leva ao trailer', naSecao.dentro, JSON.stringify(naSecao));
      await abrirTrailer(page);
      await esperarTocando(page, f.id, { avanco: 0.5 });
      await page.goBack({ timeout: 30000 });
      await conferirFechado(page, 'repetir: voltar na mesma página fecha o diálogo', { foco: true });
      confere('repetir: continua na página da sessão', page.url().includes('/sessoes/the-menu-2022/'), page.url());
    }),
  );
  // Primeira visita, sem cookies, direto na página de uma sessão
  for (const disp of ['desktop', 'celular']) {
    tarefas.push(() =>
      caso(`repetir ${disp} primeira visita sem cookies`, disp, async (page) => {
        const f = sessao('the-menu-2022').filmes[0];
        await irPara(page, 'the-menu-2022');
        // A abertura, se houver, pede ENTER
        const enter = page.locator('[data-preloader="btn"]');
        await page.waitForTimeout(2500);
        const temEnter = (await enter.count()) && (await enter.first().isVisible().catch(() => false));
        if (temEnter) {
          await page.waitForFunction(() => { const b = document.querySelector('[data-preloader="btn"]'); return b && +getComputedStyle(b).opacity > 0.9; }, null, { timeout: 30000 }).catch(() => {});
          const b = await enter.first().boundingBox();
          if (b) await clicarEm(page, b.x + b.width / 2, b.y + b.height / 2);
          await page.waitForTimeout(3000);
        }
        // O tutorial, se houver, tem o próprio botão; o gatilho precisa ficar clicável depois dele
        const fechaTutorial = page.locator('[data-tutorial="close"], [data-tutorial="btn"]');
        if ((await fechaTutorial.count()) && (await fechaTutorial.first().isVisible().catch(() => false))) await fechaTutorial.first().click({ timeout: 5000 }).catch(() => {});
        await abrirTrailer(page);
        const r = await esperarTocando(page, f.id, { avanco: 0.8 });
        confere(`repetir ${disp}: primeira visita${temEnter ? ', depois do ENTER' : ''}, trailer toca`, r.ok, resumoPlayer(r));
        const m = await medirAberto(page);
        await clicarEm(page, m.fechar.x, m.fechar.y);
        await conferirFechado(page, `repetir ${disp}: primeira visita, fecha pelo X`);
      }, { cookies: false }),
    );
  }
  await emLotes(tarefas);
}

// Teclado de ponta a ponta, sem mouse
async function parteTeclado() {
  const f = sessao('the-menu-2022').filmes[0];
  const tarefas = [];
  for (const tecla of ['Enter', 'Space']) {
    tarefas.push(() =>
      caso(`teclado ${tecla} no gatilho`, 'desktop', async (page) => {
        await irPara(page, 'the-menu-2022');
        await irAoGatilho(page);
        await page.evaluate((g) => document.querySelector(g).focus({ preventScroll: true }), GATILHO);
        await page.keyboard.press(tecla);
        await esperarAberto(page);
        const r = await esperarTocando(page, f.id, { avanco: 0.8 });
        const foco = await page.evaluate((d) => document.activeElement === document.querySelector(d), DIALOGO);
        confere(`teclado: ${tecla} no gatilho abre e toca, foco no diálogo`, r.ok && foco, `${resumoPlayer(r)}; foco no diálogo ${foco}`);
        // Tab vai ao X, a mesma tecla fecha, foco volta
        await page.keyboard.press('Tab');
        const noX = await page.evaluate((x) => document.activeElement === document.querySelector(x), FECHAR);
        confere(`teclado: ${tecla}, primeiro Tab cai no X`, noX);
        await page.keyboard.press(tecla);
        await conferirFechado(page, `teclado: ${tecla} abre, ${tecla} no X fecha`);
      }),
    );
  }
  // Teclas de rolagem com o diálogo aberto: a página atrás não pode andar
  tarefas.push(() =>
    caso('teclado teclas de rolagem com o diálogo aberto', 'desktop', async (page) => {
      await irPara(page, 'the-menu-2022');
      await abrirTrailer(page);
      await esperarTocando(page, f.id, { avanco: 0.5 });
      // depois dos 500 ms do B.scroll.stop e do B.scroll.to
      await page.waitForTimeout(1200);
      const antes = await page.evaluate(() => scrollY);
      const andou = [];
      for (const tecla of ['PageDown', 'ArrowDown', 'End', 'Space', 'Home', 'PageUp']) {
        await page.keyboard.press(tecla);
        await page.waitForTimeout(350);
        const agora = await page.evaluate(() => scrollY);
        if (Math.abs(agora - antes) > 2) andou.push(`${tecla}: ${Math.round(agora - antes)} px`);
      }
      confere('teclado: PageDown, setas, End, Espaço, Home e PageUp não movem a página atrás do diálogo', andou.length === 0, andou.join(', ') || `scrollY ${Math.round(antes)}`);
      await page.keyboard.press('Escape');
      await conferirFechado(page, 'teclado: Escape depois das teclas de rolagem');
    }),
  );
  // Atalho de teclado depois de um clique no player: o Escape precisa continuar chegando ao site, mesmo se a última tecla foi Tab
  tarefas.push(() =>
    caso('teclado Tab e depois clique no player', 'desktop', async (page) => {
      await irPara(page, 'the-menu-2022');
      await abrirTrailer(page);
      await esperarTocando(page, f.id, { avanco: 0.5 });
      await page.keyboard.press('Tab');
      const m = await medirAberto(page);
      await page.mouse.click(m.rect.l + m.rect.w / 2, m.rect.t + m.rect.h / 2);
      await page.waitForTimeout(1200);
      const foco = await page.evaluate(() => document.activeElement?.tagName);
      await page.keyboard.press('Escape');
      await conferirFechado(page, `teclado: Tab, clique no player e Escape fecha (foco no ${foco})`);
    }),
  );
  // O diálogo não prende o foco. Como no original; registrado para quem revisa acessibilidade
  tarefas.push(() =>
    caso('teclado foco solto', 'desktop', async (page) => {
      await irPara(page, 'the-menu-2022');
      await abrirTrailer(page);
      await page.waitForTimeout(800);
      await page.keyboard.press('Shift+Tab');
      const r = await page.evaluate((d) => {
        const a = document.activeElement;
        return { elemento: `${a.tagName.toLowerCase()}.${String(a.className).slice(0, 40)}`, href: a.getAttribute('href'), noDialogo: document.querySelector(d).contains(a) };
      }, DIALOGO);
      console.log(`info  teclado: Shift+Tab a partir do diálogo vai para ${JSON.stringify(r)}`);
      fichas.push({ tipo: 'foco-solto', ...r });
    }),
  );
  // Foco no player por Tab: Escape é do YouTube, e o caminho de saída é Shift+Tab
  tarefas.push(() =>
    caso('teclado foco dentro do player', 'desktop', async (page) => {
      await irPara(page, 'the-menu-2022');
      await abrirTrailer(page);
      await esperarTocando(page, f.id, { avanco: 0.5 });
      // X, link do YouTube, player
      const paradas = [];
      for (let i = 0; i < 3; i++) {
        await page.keyboard.press('Tab');
        paradas.push(await page.evaluate(() => document.activeElement?.dataset?.trailerFora !== undefined ? 'link' : document.activeElement?.tagName));
      }
      await page.waitForTimeout(600);
      const noFrame = await page.evaluate(() => document.activeElement?.tagName);
      confere('teclado: terceiro Tab entra no player, depois do X e do link, sem ser devolvido', noFrame === 'IFRAME' && paradas[1] === 'link', paradas.join(' > '));
      await page.keyboard.press('Escape');
      await page.waitForTimeout(1200);
      const abertoAinda = await page.evaluate((d) => document.querySelector(d).classList.contains('open'), DIALOGO);
      console.log(`info  teclado: Escape com o foco dentro do player ${abertoAinda ? 'não chega ao site, o diálogo fica aberto' : 'fechou o diálogo'}`);
      fichas.push({ tipo: 'escape-no-player', abertoAinda });
      if (abertoAinda) {
        let saiu = false;
        let n = 0;
        for (; n < 30 && !saiu; n++) {
          await page.keyboard.press('Shift+Tab');
          saiu = await page.evaluate((x) => document.activeElement === document.querySelector(x), FECHAR);
        }
        confere('teclado: Shift+Tab sai do player de volta ao X', saiu, `${n} toques`);
        await page.keyboard.press('Enter');
        await conferirFechado(page, 'teclado: sai do player e fecha pelo X');
      } else {
        await conferirFechado(page, 'teclado: Escape dentro do player fecha');
      }
    }),
  );
  // Tab de trás: link atrás do diálogo. Enter navega, e o diálogo não fica preso
  tarefas.push(() =>
    caso('teclado link atrás do diálogo', 'desktop', async (page) => {
      await irPara(page, 'the-menu-2022');
      await abrirTrailer(page);
      await esperarTocando(page, f.id, { avanco: 0.5 });
      const destino = await page.evaluate(() => {
        const a = document.querySelector('a.work-back-btn');
        a.focus({ preventScroll: true });
        return a.getAttribute('href');
      });
      await page.keyboard.press('Enter');
      await page.waitForFunction((h) => location.pathname === h, destino, { timeout: 60000 });
      await page.waitForTimeout(3000);
      const e = await page.evaluate(([m]) => ({ lenis: document.documentElement.classList.contains('lenis-stopped'), iframes: document.querySelectorAll('iframe').length, menu: { op: +getComputedStyle(document.querySelector(m)).opacity, vis: getComputedStyle(document.querySelector(m)).visibility } }), [MENU]);
      confere('teclado: Enter num link com o diálogo aberto navega e solta tudo', !e.lenis && e.iframes === 0 && e.menu.op > 0.99 && framesYouTube(page).length === 0, JSON.stringify(e));
    }),
  );
  await emLotes(tarefas);
}

// Os controles do próprio YouTube continuam nas mãos do visitante
async function parteControles() {
  const f = sessao('the-menu-2022').filmes[0];
  const clicarNoPlayer = async (page, seletor) => {
    const h = await page.$('iframe.yt-trailer');
    const fr = await h.contentFrame();
    const b = await fr.locator(seletor).first().boundingBox({ timeout: 20000 });
    if (!b) throw new Error(`controle ${seletor} sem caixa`);
    await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2);
    await page.mouse.down();
    await page.mouse.up();
    return { fr, b };
  };
  // O YouTube troca a interface do player sem aviso: a nova (ytm/yt-progress-bar) primeiro, a antiga (ytp-) como reserva
  const YT = {
    configuracoes: '.player-settings-icon, .ytp-settings-button',
    menu: '.ytSpecBottomSheetLayoutHost, .ytp-settings-menu',
    barra: '.ytPlayerProgressBarDragContainer, .ytp-progress-bar',
    telaCheia: '.fullscreen-icon, .ytp-fullscreen-button',
    titulo: '.ytmVideoInfoVideoTitle, .ytp-title-link',
  };
  const tarefas = [
    () =>
      caso('controles clique no vídeo', 'desktop', async (page) => {
        await irPara(page, 'the-menu-2022');
        await abrirTrailer(page);
        await esperarTocando(page, f.id, { avanco: 0.5 });
        const m = await medirAberto(page);
        const meio = { x: m.rect.l + m.rect.w / 2, y: m.rect.t + m.rect.h / 2 };
        await page.mouse.move(meio.x + 30, meio.y + 30);
        await page.waitForTimeout(300);
        await page.mouse.click(meio.x, meio.y);
        await page.waitForTimeout(900);
        const fr = framesYouTube(page)[0];
        const pausado = await lerPlayer(fr);
        confere('controles: clique no vídeo pausa', pausado.estado === 2, `estado ${pausado.estado}`);
        await page.waitForTimeout(600); // o blur devolve o foco ao diálogo aos 400 ms
        const foco = await page.evaluate((d) => document.activeElement === document.querySelector(d), DIALOGO);
        confere('controles: depois do clique no player o foco volta ao diálogo', foco);
        await page.mouse.click(meio.x, meio.y);
        await page.waitForTimeout(900);
        const r = await esperarTocando(page, f.id, { avanco: 0.5, limite: 15000 });
        confere('controles: segundo clique retoma', r.ok, resumoPlayer(r));
        await page.waitForTimeout(600);
        await page.keyboard.press('Escape');
        await conferirFechado(page, 'controles: Escape depois de clicar no player', { frameAntigo: fr });
      }),
    () =>
      caso('controles menu de configurações', 'desktop', async (page) => {
        await irPara(page, 'the-menu-2022');
        await abrirTrailer(page);
        await esperarTocando(page, f.id, { avanco: 0.5 });
        const m = await medirAberto(page);
        await page.mouse.move(m.rect.l + m.rect.w / 2, m.rect.t + m.rect.h / 2);
        await page.waitForTimeout(300);
        const { fr } = await clicarNoPlayer(page, YT.configuracoes);
        await page.waitForTimeout(1500); // depois do blur de 400 ms do local-trailer.js
        const aberto = await fr.evaluate((s) => {
          const p = document.querySelector(s);
          return { existe: !!p, visivel: !!p && getComputedStyle(p).display !== 'none' && p.getClientRects().length > 0, foco: document.hasFocus() };
        }, YT.menu);
        confere('controles: o menu de configurações do YouTube fica aberto depois de 1,5 s', aberto.visivel, JSON.stringify(aberto));
        await salvarTela(page, 'controles-configuracoes');
        await page.keyboard.press('Escape');
        await conferirFechado(page, 'controles: Escape com o menu do YouTube aberto');
      }),
    () =>
      caso('controles arrastar a barra de progresso', 'desktop', async (page) => {
        await irPara(page, 'the-menu-2022');
        await abrirTrailer(page);
        await esperarTocando(page, f.id, { avanco: 0.5 });
        const m = await medirAberto(page);
        await page.mouse.move(m.rect.l + m.rect.w / 2, m.rect.t + m.rect.h / 2);
        await page.waitForTimeout(300);
        const h = await page.$('iframe.yt-trailer');
        const fr = await h.contentFrame();
        const b = await fr.locator(YT.barra).first().boundingBox({ timeout: 20000 });
        if (!b) throw new Error('barra de progresso sem caixa');
        const y = b.y + b.height / 2;
        const antes = (await lerPlayer(fr)).vT;
        await page.mouse.move(b.x + b.width * 0.1, y);
        await page.mouse.down();
        await page.waitForTimeout(900); // segurando além dos 400 ms do blur
        await page.mouse.move(b.x + b.width * 0.5, y, { steps: 6 });
        await page.waitForTimeout(300);
        await page.mouse.up();
        await page.waitForTimeout(1200);
        const depois = await lerPlayer(fr);
        confere('controles: arrastar a barra salta o vídeo mesmo com o foco devolvido no meio', depois.vT > antes + 20, `${antes.toFixed(1)} → ${depois.vT.toFixed(1)} s, estado ${depois.estado}`);
        await page.keyboard.press('Escape');
        await conferirFechado(page, 'controles: Escape depois de arrastar');
      }),
    () =>
      caso('controles tela cheia', 'desktop', async (page) => {
        await irPara(page, 'the-menu-2022');
        await abrirTrailer(page);
        const r = await esperarTocando(page, f.id, { avanco: 0.5 });
        confere('controles: autoplay e tela cheia liberados no iframe', r.ok && r.ultimo.permiteAutoplay && r.ultimo.permiteTelaCheia, `autoplay ${r.ultimo?.permiteAutoplay}, tela cheia ${r.ultimo?.permiteTelaCheia}`);
        const m = await medirAberto(page);
        await page.mouse.move(m.rect.l + m.rect.w / 2, m.rect.t + m.rect.h / 2);
        await page.waitForTimeout(300);
        await clicarNoPlayer(page, YT.telaCheia);
        await page.waitForFunction(() => document.fullscreenElement, null, { timeout: 5000 }).catch(() => {});
        await page.waitForTimeout(800);
        const cheia = await page.evaluate(() => document.fullscreenElement?.tagName ?? null);
        confere('controles: o botão de tela cheia do YouTube funciona e o foco não é roubado', cheia === 'IFRAME', `fullscreenElement ${cheia}`);
        if (cheia) await page.evaluate(() => document.exitFullscreen());
        await page.waitForTimeout(800);
        await page.keyboard.press('Escape');
        await page.waitForTimeout(1200);
        const e = await lerFechado(page);
        confere('controles: depois de sair da tela cheia, Escape fecha o diálogo', !e.aberto, `foco em ${e.foco}`);
        if (e.aberto) {
          const b = await medirAberto(page);
          await page.mouse.click(b.fechar.x, b.fechar.y);
        }
        await conferirFechado(page, 'controles: sai da tela cheia e fecha');
      }),
    () =>
      caso('controles link do título', 'desktop', async (page, ctx) => {
        await irPara(page, 'the-menu-2022');
        await abrirTrailer(page);
        await esperarTocando(page, f.id, { avanco: 0.5 });
        const m = await medirAberto(page);
        await page.mouse.move(m.rect.l + m.rect.w / 2, m.rect.t + m.rect.h / 2);
        await page.waitForTimeout(300);
        const nova = ctx.waitForEvent('page', { timeout: 8000 }).catch(() => null);
        await clicarNoPlayer(page, YT.titulo);
        const aba = await nova;
        const destino = aba ? aba.url() : null;
        confere('controles: o título do YouTube abre em outra aba, com COOP same-origin', !!aba, destino || 'nenhuma aba');
        if (aba) await aba.close();
        const ainda = await page.evaluate((d) => document.querySelector(d).classList.contains('open'), DIALOGO);
        confere('controles: o diálogo continua aberto depois disso', ainda);
      }),
  ];
  await emLotes(tarefas);
}

// Celular deitado
async function partePaisagem() {
  const tarefas = [];
  for (const slug of ['bugonia-2025', DUPLA]) {
    const f = sessao(slug).filmes[0];
    for (const nome of Object.keys(CAMINHOS)) {
      const rotulo = `paisagem ${slug} ${nome}`;
      tarefas.push(() =>
        caso(rotulo, 'paisagem', async (page) => {
          await irPara(page, slug);
          await abrirTrailer(page);
          const m = await medirAberto(page);
          const pa = problemasAberto(m, f.id);
          confere(`${rotulo}: player, fechar e opções na tela`, pa.length === 0, pa.join('; ') || resumoAberto(m));
          const r = await esperarTocando(page, f.id, { avanco: 0.8 });
          confere(`${rotulo}: tocando`, r.ok, resumoPlayer(r));
          if (nome === 'x') await salvarTela(page, `paisagem-${slug}`);
          const frame = framesYouTube(page)[0];
          const info = await CAMINHOS[nome](page);
          await conferirFechado(page, `${rotulo}${info ? ` (${info})` : ''}`, { frameAntigo: frame });
        }),
      );
    }
  }
  tarefas.push(() =>
    caso('paisagem seletor por toque', 'paisagem', async (page) => {
      const [a, b] = sessao(DUPLA).filmes;
      await irPara(page, DUPLA);
      await abrirTrailer(page);
      await esperarTocando(page, a.id, { avanco: 0.5 });
      const m = await medirAberto(page);
      const o = m.opcoes[1];
      await page.touchscreen.tap(o.x, o.y);
      const r = await esperarTocando(page, b.id, { avanco: 0.5, limite: 30000 }).catch((e) => ({ ok: false, motivo: String(e) }));
      confere('paisagem: toque na segunda opção troca o trailer', r.ok, resumoPlayer(r));
    }),
  );
  // Girar o aparelho com o trailer aberto, nos dois sentidos
  for (const [de, para] of [['celular', 'paisagem'], ['paisagem', 'celular']]) {
    tarefas.push(() =>
      caso(`paisagem girar de ${de} para ${para}`, de, async (page) => {
        const f = sessao('bugonia-2025').filmes[0];
        await irPara(page, 'bugonia-2025');
        await abrirTrailer(page);
        await esperarTocando(page, f.id, { avanco: 0.5 });
        await page.evaluate(() => { document.querySelector('iframe.yt-trailer').dataset.marca = '1'; });
        await page.setViewportSize(DISPOSITIVOS[para].viewport);
        await page.waitForTimeout(1500);
        const m = await medirAberto(page);
        const pa = problemasAberto(m, f.id);
        const mesmo = await page.evaluate(() => document.querySelector('iframe.yt-trailer')?.dataset.marca === '1');
        confere(`paisagem: girar de ${de} para ${para} mantém o player na tela`, pa.length === 0 && mesmo, pa.join('; ') || `${resumoAberto(m)}, mesmo iframe ${mesmo}`);
        const r = await esperarTocando(page, f.id, { avanco: 0.5, limite: 20000 });
        confere(`paisagem: girar de ${de} para ${para} segue tocando`, r.ok, resumoPlayer(r));
        await salvarTela(page, `girar-${de}-${para}`);
        await clicarEm(page, m.fechar.x, m.fechar.y);
        await conferirFechado(page, `paisagem: girar de ${de} para ${para}, fecha pelo X`);
      }),
    );
  }
  await emLotes(tarefas);
}

// O link para o YouTube abre o filme escolhido em outra aba, fecha o diálogo e não troca a página
async function parteSaida() {
  const tarefas = [];
  for (const disp of ['desktop', 'tablet', 'celular']) {
    tarefas.push(() =>
      caso(`saída ${disp}`, disp, async (page, ctx) => {
        const alvo = sessao(DUPLA).filmes[1];
        await irPara(page, DUPLA);
        await abrirTrailer(page);
        const antes = await medirAberto(page);
        await clicarEm(page, antes.opcoes[1].x, antes.opcoes[1].y);
        await page.waitForFunction((id) => document.querySelector('iframe.yt-trailer')?.src.includes(id), alvo.id, { timeout: 15000 });
        const m = await medirAberto(page);
        const frame = framesYouTube(page)[0];
        const [aba] = await Promise.all([ctx.waitForEvent('page', { timeout: 15000 }), clicarEm(page, m.saida.x, m.saida.y)]);
        // o player sai no próprio clique, sem esperar um quadro: com a aba nova na frente eles param
        const iframesNoClique = await page.evaluate(() => document.querySelectorAll('iframe.yt-trailer').length);
        confere(`saída ${disp}: o player sai no clique`, iframesNoClique === 0, `${iframesNoClique} iframes`);
        const chegou = aba.url().includes(`watch?v=${alvo.id}`) || (await aba.waitForURL(`**/watch?v=${alvo.id}*`, { timeout: 30000 }).then(() => true, () => false));
        confere(`saída ${disp}: abre o filme escolhido em outra aba`, chegou, aba.url());
        const lido = await aba.evaluate(() => ({ opener: window.opener === null, referrer: document.referrer })).catch(() => null);
        confere(`saída ${disp}: a outra aba não enxerga o site nem recebe a origem`, lido?.opener === true && lido?.referrer === '', JSON.stringify(lido));
        await aba.close();
        confere(`saída ${disp}: a página continua na sessão`, page.url().endsWith(`/sessoes/${DUPLA}/`), page.url());
        await conferirFechado(page, `saída ${disp}: diálogo fechado, sem player`, { frameAntigo: frame });
      }),
    );
  }
  await emLotes(tarefas);
}

// Tamanhos além dos pedidos: só a geometria, sem esperar o vídeo
async function parteGeometria() {
  const tarefas = [];
  for (const [nome, disp] of EXTRAS) {
    tarefas.push(() =>
      caso(`geometria ${nome}`, disp, async (page) => {
        await irPara(page, DUPLA);
        await abrirTrailer(page);
        await page.waitForTimeout(800);
        const m = await medirAberto(page);
        const pa = problemasAberto(m, sessao(DUPLA).filmes[0].id);
        confere(`geometria ${nome}: player, fechar e opções na tela`, pa.length === 0, pa.join('; ') || resumoAberto(m));
        await salvarTela(page, `geometria-${nome}`);
      }),
    );
  }
  await emLotes(tarefas);
}

// ---------------------------------------------------------------- execução

const TODAS = { oembed: parteOembed, tocar: parteTocar, antes: parteAntes, fechar: parteFechar, dupla: parteDupla, rede: parteRede, repetir: parteRepetir, teclado: parteTeclado, controles: parteControles, paisagem: partePaisagem, geometria: parteGeometria, saida: parteSaida };
for (const p of PARTES) {
  console.log(`\n== ${p} (${CANAL})`);
  await TODAS[p]();
}

if (SAIDA) fs.writeFileSync(path.join(SAIDA, `fichas-${CANAL}-${PARTES.join('_').slice(0, 40)}.json`), JSON.stringify({ resultados, avisos, fichas }, null, 1));
const falhas = resultados.filter((r) => !r.ok);
console.log(`\n${resultados.length - falhas.length} de ${resultados.length} aprovados${avisos.length ? `, ${avisos.length} avisos` : ''}`);
if (falhas.length) {
  console.log('\nFALHAS:');
  for (const f of falhas) console.log(`- ${f.nome}  ${f.detalhe}`);
  process.exit(1);
}
