// Teclado, mouse, toque, som, menu, filtro, navegação Taxi, RSS e peso, contra o build em produção.
//   node tools/testes/interacoes.mjs [--url=http://localhost:4322] [--canal=msedge] [--secao=teclado,filtro,mouse,som,toque,cadeia,rss,peso] [--so=expressão] [--desktop=1920x1080] [--saida=pasta] [--gpu=software]
// Sempre headless. Sem --secao roda tudo. Com --saida grava as capturas lá. Cada caso imprime ok ou FALHA; sai com código 1 se houver FALHA.
// Armadilhas: o relógio falso do Playwright não anda animação CSS; o bundle decide "celular" pelo user agent; WebGL headless é
// software e lento, então aqui se espera por condição, nunca por tempo curto fixo. Teclas Espaço e setas são engolidas em window
// na home e na Programação pelo bundle original.
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const arg = (n, d) => (process.argv.find((a) => a.startsWith(`--${n}=`)) || `--${n}=${d}`).split('=').slice(1).join('=');
const URL_BASE = arg('url', 'http://localhost:4322').replace(/\/$/, '');
const CANAL = arg('canal', 'msedge');
const SECOES = arg('secao', 'teclado,filtro,mouse,som,toque,cadeia,rss,peso').split(',');
const SAIDA = arg('saida', '');
const SO = arg('so', '') ? new RegExp(arg('so', ''), 'i') : null; // roda só os cenários cujo nome casa com a expressão
if (SAIDA) fs.mkdirSync(SAIDA, { recursive: true });

const UA_CELULAR = 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36';
const UA_TABLET = 'Mozilla/5.0 (Linux; Android 14; SM-X710) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';
const [LARGO, ALTO] = arg('desktop', '1440x900').split('x').map(Number);
const TELAS = {
  desktop: { viewport: { width: LARGO, height: ALTO } },
  c320: { viewport: { width: 320, height: 568 }, isMobile: true, hasTouch: true, userAgent: UA_CELULAR },
  c390: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, userAgent: UA_CELULAR },
  c360: { viewport: { width: 360, height: 640 }, isMobile: true, hasTouch: true, userAgent: UA_CELULAR },
  // sem isMobile: nesse modo o Chromium alarga a viewport de layout para caber o conteúdo (ver a checagem de innerWidth em secaoToque)
  tablet: { viewport: { width: 820, height: 1180 }, hasTouch: true, userAgent: UA_TABLET },
  tabletMovel: { viewport: { width: 820, height: 1180 }, isMobile: true, hasTouch: true, userAgent: UA_TABLET },
};
const JULHO = '2026-07-01T12:00:00-03:00'; // obsession-2026 em primeiro
// Dois dias depois da última sessão cadastrada: o aviso vem em primeiro, e o teste não muda quando entra uma sessão nova
const DADOS = fs.readdirSync(path.resolve(import.meta.dirname, '../../src/data/sessoes')).filter((f) => f.endsWith('.json') && !f.startsWith('_')).map((f) => JSON.parse(fs.readFileSync(path.resolve(import.meta.dirname, '../../src/data/sessoes', f), 'utf8')));
const N_SESSOES = DADOS.length;
const ULTIMA = DADOS.map((s) => (s.sessao.fim ? s.sessao.fim.slice(0, 10) : s.sessao.data)).sort().at(-1); // um fim explícito conta pelo dia dele
const SEM_SESSAO = new Date(new Date(`${ULTIMA}T12:00:00-03:00`).getTime() + 2 * 864e5).toISOString(); // aviso em primeiro
const SESSAO = '/sessoes/obsession-2026/';
const LISTAS = ['[data-roll="container"]', '.work-roll-w', '.work-overl-w', '[data-menu="films"]', '[data-menu="footages"]', '.menu-films-w'];
const ESPERA = { timeout: 240000, polling: 200 };

const resultados = [];
function confere(nome, ok, detalhe = '') {
  resultados.push({ nome, ok: !!ok, detalhe });
  console.log(`${ok ? 'ok   ' : 'FALHA'} ${nome}${detalhe ? `  ${detalhe}` : ''}`);
}
const info = (t) => console.log(`info  ${t}`);
async function tenta(nome, fn) {
  if (SO && !SO.test(nome)) return;
  try {
    await fn();
  } catch (e) {
    confere(`${nome}: terminou sem erro de teste`, false, String(e.message || e).split('\n')[0].slice(0, 220));
  }
}
const dorme = (page, ms) => page.waitForTimeout(ms);
// Pedido HTTP direto, sem página. O padrão de 30 s estoura com a máquina ocupada; isso não diz nada sobre o site.
const pedir = (origem, url) => origem.request.get(url, { timeout: 240000 });
async function captura(page, nome, opts = {}) {
  if (SAIDA) await page.screenshot({ path: path.join(SAIDA, `${CANAL}-${nome}.png`), ...opts }).catch(() => {});
}

// Conta texturas e desenhos do WebGL e lê pixels logo depois de um quadro desenhado: o microtask roda dentro do mesmo quadro,
// antes de o navegador limpar o buffer.
const INSTRUMENTO = () => {
  if (window.top !== window) return;
  const M = (window.__gl = { criadas: 0, apagadas: 0, coletadas: 0, bytes: 0, desenhos: 0, pedidos: [] });
  const infos = new WeakMap();
  const ligada = new WeakMap();
  // o OGL não apaga textura: o que some é o que o GC coleta
  const reg = new FinalizationRegistry((info) => { M.coletadas++; M.bytes -= info.b; });
  const protos = [window.WebGLRenderingContext?.prototype, window.WebGL2RenderingContext?.prototype].filter(Boolean);
  for (const P of protos) {
    const ct = P.createTexture;
    P.createTexture = function () { M.criadas++; const t = ct.apply(this, arguments); const info = { b: 0 }; infos.set(t, info); reg.register(t, info, info); return t; };
    const dt = P.deleteTexture;
    P.deleteTexture = function (t) { if (t) { M.apagadas++; const i = infos.get(t); if (i) { M.bytes -= i.b; i.b = 0; reg.unregister(i); } } return dt.apply(this, arguments); };
    const bt = P.bindTexture;
    P.bindTexture = function (alvo, t) { if (alvo === this.TEXTURE_2D) ligada.set(this, t); return bt.apply(this, arguments); };
    const ti = P.texImage2D;
    P.texImage2D = function () {
      const a = arguments;
      let w = 0, h = 0;
      if (a.length >= 8) { w = a[3]; h = a[4]; } else if (a[5]) { w = a[5].naturalWidth || a[5].videoWidth || a[5].width || 0; h = a[5].naturalHeight || a[5].videoHeight || a[5].height || 0; }
      const t = ligada.get(this);
      const i = t && infos.get(t);
      if (i) { M.bytes += w * h * 4 - i.b; i.b = w * h * 4; }
      return ti.apply(this, arguments);
    };
    for (const nome of ['drawElements', 'drawArrays', 'drawElementsInstanced', 'drawArraysInstanced']) {
      const d = P[nome];
      if (!d) continue;
      P[nome] = function () {
        M.desenhos++;
        const r = d.apply(this, arguments);
        if (M.pedidos.length) {
          const pedidos = M.pedidos;
          M.pedidos = [];
          const gl = this;
          queueMicrotask(() => {
            const fb = gl.getParameter(gl.FRAMEBUFFER_BINDING);
            gl.bindFramebuffer(gl.FRAMEBUFFER, null);
            const W = gl.drawingBufferWidth, H = gl.drawingBufferHeight, px = new Uint8Array(4);
            let n = 0, comAlfa = 0, soma = 0, soma2 = 0;
            for (let y = 1; y < 12; y++) for (let x = 1; x < 12; x++) {
              gl.readPixels(Math.floor((x / 12) * W), Math.floor((y / 12) * H), 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px);
              n++;
              if (px[3] > 0) comAlfa++;
              const l = (px[0] + px[1] + px[2]) / 3;
              soma += l; soma2 += l * l;
            }
            gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
            const media = soma / n;
            pedidos.forEach((res) => res({ n, comAlfa, media: Math.round(media), desvio: Math.round(Math.sqrt(Math.max(0, soma2 / n - media * media))), W, H }));
          });
        }
        return r;
      };
    }
  }
  window.__amostrar = () => new Promise((res) => { M.pedidos.push(res); });
};

// --gpu=software usa o rasterizador do próprio navegador: mais lento em máquina livre, mas não trava quando a memória da GPU acaba
const browser = await chromium.launch({ channel: CANAL, headless: true, args: arg('gpu', '') === 'software' ? ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] : [] });

async function abrir({ caminho = '/', quando, tela = 'desktop', semCookies = false, permissoes, antes }) {
  const ctx = await browser.newContext({ ...TELAS[tela] });
  if (!semCookies) {
    await ctx.addCookies([
      { name: 'preloader_shown', value: String(Date.now() + 864e5 * 400), url: URL_BASE },
      { name: 'tutorial_shown', value: 'true', url: URL_BASE },
    ]);
  }
  if (permissoes) await ctx.grantPermissions(permissoes, { origin: URL_BASE });
  const page = await ctx.newPage();
  page.setDefaultTimeout(180000);
  page.erros = [];
  page.on('pageerror', (e) => page.erros.push(`pageerror: ${e}`));
  page.on('console', (m) => {
    // o AudioContext reclama quando esta máquina não entrega dispositivo de áudio ao navegador sem janela: é do ambiente, não do site
    if (/AudioContext encountered an error/.test(m.text())) return info(`ambiente: ${m.text().slice(0, 90)}`);
    // "Unable to preventDefault" vem do virtual-scroll do original e aparece igual no site de referência
    if (m.type() === 'error' && !/favicon|ERR_ABORTED|youtube|Unable to preventDefault inside passive/i.test(m.text())) page.erros.push(m.text());
  });
  page.on('response', (r) => { if (r.status() >= 400 && !/favicon/.test(r.url())) page.erros.push(`http ${r.status()} ${r.url()}`); });
  await page.addInitScript(INSTRUMENTO);
  if (quando) await page.clock.install({ time: new Date(quando) });
  if (antes) await antes(page, ctx);
  // o load da Programação espera 300 quadros; com a GPU disputada passa de 3 min. A página fica utilizável antes disso.
  await page.goto(URL_BASE + caminho, { waitUntil: 'domcontentloaded', timeout: 240000 });
  return { ctx, page };
}

const paginaAtual = (page) => page.evaluate(() => document.querySelector('[data-taxi-view]')?.getAttribute('data-page') || null);

const carrossel = (page) =>
  page.evaluate(() => {
    const home = document.querySelector('[data-roll="container"]');
    const itens = [...document.querySelectorAll(home ? '[data-roll="item"]' : '[data-slider="item"]')];
    if (!itens.length) return null;
    const d = itens.map((el) => {
      const r = el.getBoundingClientRect();
      return home ? Math.abs(r.top + r.height / 2 - innerHeight / 2) : Math.abs(r.left + r.width / 2 - innerWidth / 2);
    });
    const i = d.indexOf(Math.min(...d));
    return { i, n: itens.length, sessao: itens[i].getAttribute('data-sessao') || 'AVISO', dist: Math.round(d[i]) };
  });

// Espera o carrossel parar num item. O giro inicial e a inércia levam tempo real, mais ainda com WebGL em software.
async function assentar(page, limite = 120000) {
  const t0 = Date.now();
  let ultimo = null, iguais = 0;
  while (Date.now() - t0 < limite) {
    const c = await carrossel(page);
    if (c && c.dist < 14 && ultimo && ultimo.i === c.i && Math.abs(ultimo.dist - c.dist) <= 1) iguais++;
    else iguais = 0;
    ultimo = c;
    if (iguais >= 3) return c;
    await dorme(page, 250);
  }
  throw new Error(`carrossel não assentou: ${JSON.stringify(ultimo)}`);
}

// Onde o carrossel para depois da entrada. O giro de entrada só começa quando o WebGL da página termina de carregar, e o
// carrossel já está visível, parado no item 0, antes dele: com o PC carregado o giro pode começar segundos depois de
// pronta(), e uma leitura só pega o meio do caminho. Primeiro espera o canvas com imagem: o WebGL carregou, e o giro já foi
// disparado. Depois lê só quando passam 12 s sem nenhum movimento, contados do último.
async function paradaFinal(page, quieto = 12000, limite = 120000) {
  const t0 = Date.now();
  let comImagem = false;
  while (!comImagem && Date.now() - t0 < limite) {
    const px = await page.evaluate(() => Promise.race([window.__amostrar(), new Promise((r) => setTimeout(() => r(null), 2000))]));
    if (px && px.desvio >= 3) comImagem = true;
    else await dorme(page, 250);
  }
  if (!comImagem) return { ...(await carrossel(page)), semImagem: true };
  let ultimo = null, iguais = 0, mexeu = false, desde = Date.now();
  while (Date.now() - t0 < limite) {
    const c = await carrossel(page);
    if (!c || (ultimo && (c.i !== ultimo.i || Math.abs(c.dist - ultimo.dist) > 1))) { if (ultimo) mexeu = true; desde = Date.now(); }
    if (c && c.dist < 14 && ultimo && ultimo.i === c.i && Math.abs(ultimo.dist - c.dist) <= 1) iguais++;
    else iguais = 0;
    ultimo = c;
    if (iguais >= 3 && Date.now() - desde >= quieto) return { ...c, mexeu };
    await dorme(page, 250);
  }
  return { ...ultimo, mexeu, semParar: true };
}

async function pronta(page) {
  await page.waitForFunction(() => {
    const t = document.querySelector('[data-taxi]');
    if (!t) return false;
    const c = getComputedStyle(t);
    return c.visibility !== 'hidden' && +c.opacity > 0.95;
  }, null, ESPERA);
  const p = await paginaAtual(page);
  if (p === 'home' || p === 'work') {
    // numa entrada por Taxi a página fica visível parada em outro item e só então gira até o item 0: esperar parar não basta
    await page.waitForFunction(() => {
      const home = document.querySelector('[data-roll="container"]');
      const itens = [...document.querySelectorAll(home ? '[data-roll="item"]' : '[data-slider="item"]')];
      if (!itens.length) return false;
      const r = itens[0].getBoundingClientRect();
      return (home ? Math.abs(r.top + r.height / 2 - innerHeight / 2) : Math.abs(r.left + r.width / 2 - innerWidth / 2)) < 14;
    }, null, { timeout: 60000, polling: 150 }).catch(() => {});
    await assentar(page);
  }
  await dorme(page, 2200); // entrada da navegação (1,2 s depois de 0,6 s a 1,6 s)
}

async function esperarPagina(page, dataPage, caminho) {
  await page.waitForFunction(({ dataPage, caminho }) => document.querySelector('[data-taxi-view]')?.getAttribute('data-page') === dataPage && (!caminho || location.pathname === caminho), { dataPage, caminho }, ESPERA);
  await pronta(page);
}

const ordemListas = (page) =>
  page.evaluate((LISTAS) => {
    const out = {};
    for (const sel of LISTAS) {
      const l = document.querySelector(sel);
      if (l) out[sel] = [...l.children].filter((c) => c.hasAttribute('data-sessao') || c.hasAttribute('data-aviso')).map((c) => c.getAttribute('data-sessao') || 'AVISO');
    }
    const nx = document.querySelector('[data-nextcms="w"]');
    if (nx) out.proximas = [...nx.children].filter((c) => c.hasAttribute('data-sessao')).map((c) => c.getAttribute('data-sessao'));
    return out;
  }, LISTAS);

function listasIguais(o) {
  const { proximas, ...l } = o;
  const v = Object.values(l);
  if (!v.length) return { ok: true, n: 0, ordem: [] };
  const ok = v.every((x) => x.join() === v[0].join()) && (!proximas || proximas.join() === v[0].filter((s) => s !== 'AVISO').join());
  return { ok, n: v[0].length, ordem: v[0] };
}

const ALVO = { principal: '[data-menu="maintrigger"]', pequeno: '.menu-w .checkbox-w' };
const ID = { principal: 'mainpanel', pequeno: 'smallpanel' };
const marcado = (page, q) => page.evaluate((id) => !!document.getElementById(id)?.checked, ID[q]);
async function abrirMouse(page, q) {
  await page.click(ALVO[q]);
  await page.waitForFunction((id) => document.getElementById(id)?.checked, ID[q], ESPERA);
  await dorme(page, 1400);
}
async function fecharMouse(page, q) {
  await page.click(ALVO[q]);
  await page.waitForFunction((id) => !document.getElementById(id)?.checked, ID[q], ESPERA);
  await dorme(page, 900);
}

// O que está de fato na tela: tamanho, visibilidade, opacidade e corte por ancestral com overflow.
const LER_FOCO = () => {
  const el = document.activeElement;
  if (!el || el === document.body) return { fim: true };
  const r = el.getBoundingClientRect();
  let x0 = r.left, y0 = r.top, x1 = r.right, y1 = r.bottom, porque = null;
  if (r.width === 0 || r.height === 0) porque = 'sem tamanho';
  for (let n = el; n && n !== document.documentElement && !porque; n = n.parentElement) {
    const c = getComputedStyle(n);
    if (c.display === 'none' || c.visibility === 'hidden') porque = 'oculto';
    else if (+c.opacity === 0 && !n.classList.contains('menu-input')) porque = 'opacidade 0';
    else if (n !== el && (c.overflowX !== 'visible' || c.overflowY !== 'visible')) {
      const q = n.getBoundingClientRect();
      x0 = Math.max(x0, q.left); y0 = Math.max(y0, q.top); x1 = Math.min(x1, q.right); y1 = Math.min(y1, q.bottom);
      if (x1 <= x0 || y1 <= y0) porque = `cortado por ${String(n.className).split(' ')[0]}`;
    }
  }
  if (!porque && (Math.min(x1, innerWidth) <= Math.max(x0, 0) || Math.min(y1, innerHeight) <= Math.max(y0, 0))) porque = 'fora da tela';
  let anel = false;
  for (let n = el, k = 0; n && k < 4 && !anel; n = n.parentElement, k++) {
    const c = getComputedStyle(n);
    if (c.outlineStyle !== 'none' && parseFloat(c.outlineWidth) >= 1) anel = true;
  }
  return {
    id: `${el.tagName.toLowerCase()}.${[...el.classList].slice(0, 2).join('.')}${el.id ? `#${el.id}` : ''}`,
    href: el.getAttribute('href'),
    rotulo: (el.getAttribute('aria-label') || el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 40),
    invisivel: porque,
    anel,
  };
};

async function percorrerTab(page, limite = 260) {
  const paradas = [];
  for (let i = 0; i < limite; i++) {
    await page.keyboard.press('Tab');
    let s = await page.evaluate(LER_FOCO);
    if (s.fim) return { paradas, terminou: true };
    // o conteúdo de sessão e rodapé entra com fade quando a rolagem chega nele: dá tempo ao fade antes de reprovar
    if (s.invisivel === 'opacidade 0') {
      await dorme(page, 1500);
      s = await page.evaluate(LER_FOCO);
    }
    paradas.push(s);
  }
  return { paradas, terminou: false };
}

// Tudo o que o mouse alcança nesta tela, sem rolar: precisa aparecer no percurso do Tab.
const CONTROLES_VISIVEIS = () =>
  [...document.querySelectorAll('a[href], button, input, textarea, select')]
    .filter((el) => {
      if (el.classList.contains('menu-input')) return false;
      const r = el.getBoundingClientRect();
      if (!r.width || !r.height || r.bottom < 0 || r.top > innerHeight || r.right < 0 || r.left > innerWidth) return false;
      for (let n = el; n && n !== document.documentElement; n = n.parentElement) {
        const c = getComputedStyle(n);
        if (c.display === 'none' || c.visibility === 'hidden' || +c.opacity === 0) return false;
        if (n !== el && c.overflowY !== 'visible') {
          const q = n.getBoundingClientRect();
          if (r.bottom <= q.top || r.top >= q.bottom || r.right <= q.left || r.left >= q.right) return false;
        }
      }
      const p = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
      return p && (p === el || el.contains(p) || p.contains(el));
    })
    .map((el) => el.getAttribute('href') || el.getAttribute('aria-label') || el.className.toString());

const scrollsPaineis = (page) =>
  page.evaluate(() => [...document.querySelectorAll('.menu-w .panel-content-w, .menu-w .menu-films-w')].filter((e) => e.scrollTop).map((e) => `${e.className.split(' ')[0]}:${Math.round(e.scrollTop)}`));

async function focarTab(page, seletor, limite = 170) {
  for (let i = 0; i < limite; i++) {
    await page.keyboard.press('Tab');
    if (await page.evaluate((s) => document.activeElement?.matches?.(s), seletor)) return i + 1;
  }
  return -1;
}

// ===================== TECLADO
async function secaoTeclado() {
  const ROTAS = [
    ['home', '/', 'home'],
    ['Programação', '/programacao/', 'work'],
    ['sessão', SESSAO, 'case'],
    ['Sobre', '/sobre/', 'about'],
    ['Contato', '/contato/', 'contact'],
    ['404', '/404.html', '404'],
    ['Cookies', '/cookies/', 'policy'],
  ];
  // 0. Primeira visita: a abertura e o tutorial precisam dar passagem ao teclado
  await tenta('primeira visita pelo teclado', async () => {
    const { ctx, page } = await abrir({ caminho: '/', quando: JULHO, semCookies: true });
    await page.waitForFunction(() => {
      const b = document.querySelector('[data-preloader="btn"]');
      return b && b.onclick && getComputedStyle(b).visibility !== 'hidden' && +getComputedStyle(b).opacity > 0.5;
    }, null, ESPERA);
    const passos = await focarTab(page, '[data-preloader="btn"] button', 130);
    confere('primeira visita: o Tab chega ao ENTRAR', passos > 0 && passos <= 3, `em ${passos} Tab`);
    await captura(page, 'primeira-visita-entrar');
    const anel = await page.evaluate(LER_FOCO);
    confere('primeira visita: o ENTRAR em foco tem anel visível', anel.anel && !anel.invisivel, JSON.stringify(anel));
    await page.keyboard.press('Enter');
    await page.waitForFunction(() => !document.querySelector('[data-preloader="w"]'), null, ESPERA);
    confere('primeira visita: Enter fecha a abertura', true);
    await page.waitForFunction(() => { const t = document.querySelector('[data-tutorial="w"]'); return !t || getComputedStyle(t).visibility !== 'hidden'; }, null, ESPERA);
    await dorme(page, 2500);
    const temTutorial = await page.evaluate(() => !!document.querySelector('[data-tutorial="w"]'));
    if (temTutorial) {
      const passosFechar = await focarTab(page, '[data-tutorial="close"] button', 140);
      confere('tutorial: o Tab chega ao FECHAR sem atravessar a página escondida', passosFechar > 0 && passosFechar <= 3, `em ${passosFechar} Tab`);
      await page.keyboard.press('Escape');
      await dorme(page, 1500);
      const aberto = await page.evaluate(() => { const t = document.querySelector('[data-tutorial="w"]'); return !!t && t.getBoundingClientRect().top < innerHeight - 5; });
      info(`tutorial: Escape ${aberto ? 'não fecha (herdado, FASE2.md)' : 'fecha'}`);
      if (aberto) {
        await page.locator('[data-tutorial="close"] button').focus().catch(() => {});
        await page.keyboard.press('Enter');
        const fechou = await page.waitForFunction(() => { const t = document.querySelector('[data-tutorial="w"]'); return !t || t.getBoundingClientRect().top >= innerHeight - 5; }, null, { timeout: 15000, polling: 200 }).then(() => true, () => false);
        confere('tutorial: Enter no FECHAR fecha', fechou);
      }
    }
    confere('primeira visita: console limpo', !page.erros.length, page.erros.slice(0, 2).join(' | '));
    await ctx.close();
  });

  // 1. Percurso do Tab com os menus fechados
  for (const [nome, caminho] of ROTAS) {
    await tenta(`Tab em ${nome}`, async () => {
      const { ctx, page } = await abrir({ caminho, quando: JULHO });
      await pronta(page);
      const y0 = await carrossel(page);
      const controles = await page.evaluate(CONTROLES_VISIVEIS);
      const { paradas, terminou } = await percorrerTab(page);
      confere(`${nome}: o Tab termina, sem prender o foco`, terminou, `${paradas.length} paradas`);
      const hrefs = new Set(paradas.flatMap((p) => [p.href, p.rotulo]));
      const faltam = controles.filter((c) => !hrefs.has(c) && !paradas.some((p) => p.id.includes(c.split(' ')[0])));
      confere(`${nome}: todo controle visível é alcançado pelo Tab`, !faltam.length, faltam.slice(0, 4).join(' | '));
      const semAnel = paradas.filter((p) => !p.anel);
      confere(`${nome}: toda parada tem anel de foco`, !semAnel.length, semAnel.slice(0, 3).map((p) => p.id).join(' | '));
      const semNome = paradas.filter((p) => !p.rotulo);
      confere(`${nome}: todo controle focável tem nome acessível`, !semNome.length, [...new Set(semNome.map((p) => p.id))].slice(0, 5).join(' | '));
      const invisiveis = paradas.filter((p) => p.invisivel);
      const porClasse = {};
      invisiveis.forEach((p) => { const k = `${p.invisivel}`; porClasse[k] = (porClasse[k] || 0) + 1; });
      confere(`${nome}: nenhuma parada do Tab fica invisível`, !invisiveis.length, invisiveis.length ? `${invisiveis.length} de ${paradas.length}: ${JSON.stringify(porClasse)}; ex.: ${invisiveis.filter((p) => !/panel-content/.test(p.invisivel)).slice(0, 3).map((p) => p.id).join(' , ')}` : '');
      const rolados = await scrollsPaineis(page);
      confere(`${nome}: o Tab não rola painel fechado`, !rolados.length, rolados.join(' '));
      if (y0) {
        const y1 = await carrossel(page);
        confere(`${nome}: o Tab não move o carrossel`, y1.i === y0.i, `${y0.i} -> ${y1.i}`);
      }
      // Shift+Tab volta pelo mesmo caminho
      await page.keyboard.press('Shift+Tab');
      const volta = await page.evaluate(LER_FOCO);
      confere(`${nome}: Shift+Tab volta para a última parada`, !paradas.length || volta.id === paradas[paradas.length - 1].id, volta.id);
      confere(`${nome}: console limpo`, !page.erros.length, page.erros.slice(0, 2).join(' | '));
      await ctx.close();
    });
  }

  // 2. Abrir e fechar os menus pelo teclado
  for (const [nome, caminho] of ROTAS.filter((r) => r[0] !== '404')) {
    await tenta(`menus pelo teclado em ${nome}`, async () => {
      for (const q of ['principal', 'pequeno']) {
        if (q === 'pequeno' && !['home', 'Programação', 'sessão'].includes(nome)) continue;
        const { ctx, page } = await abrir({ caminho, quando: JULHO });
        await pronta(page);
        const passos = await focarTab(page, `#${ID[q]}`);
        confere(`${nome}: Tab chega ao gatilho ${q}`, passos > 0, `em ${passos} Tab`);
        await page.keyboard.press('Space');
        await dorme(page, 1500);
        const abriuEspaco = nome === 'sessão' && q === 'pequeno' ? await page.evaluate(() => document.querySelector('[data-menu="casepanel"]').classList.contains('open')) : await marcado(page, q);
        let abriuEnter = false;
        if (!abriuEspaco) {
          await page.keyboard.press('Enter');
          await dorme(page, 1500);
          abriuEnter = await marcado(page, q);
        }
        confere(`${nome}: Espaço ou Enter abre o menu ${q}`, abriuEspaco || abriuEnter, `Espaço ${abriuEspaco}, Enter ${abriuEnter}`);
        if (nome === 'sessão' && q === 'pequeno' && abriuEspaco) {
          const dois = await page.evaluate(() => {
            const pequena = document.querySelector('.small-panel').getBoundingClientRect().height;
            return { pequena: Math.round(pequena), caso: document.querySelector('[data-menu="casepanel"]').classList.contains('open') };
          });
          await captura(page, 'sessao-espaco-bilhete');
          confere('sessão: Espaço no ingresso abre só o painel de caso, como o clique', dois.pequena === 0, JSON.stringify(dois));
        }
        await ctx.close();
      }
    });
  }

  // 2b. Com o menu aberto (pelo mouse, porque o teclado pode não abrir) o Tab anda pelo painel, visível
  for (const [nome, caminho] of [['home', '/'], ['Programação', '/programacao/'], ['sessão', SESSAO], ['Sobre', '/sobre/'], ['Contato', '/contato/']]) {
    await tenta(`Tab com menu aberto em ${nome}`, async () => {
      const { ctx, page } = await abrir({ caminho, quando: JULHO });
      await pronta(page);
      await page.mouse.move(600, 500);
      await abrirMouse(page, 'principal');
      await page.evaluate(() => document.getElementById('mainpanel').focus());
      const paradas = [];
      for (let i = 0; i < 9; i++) { await page.keyboard.press('Tab'); paradas.push(await page.evaluate(LER_FOCO)); }
      const fora = paradas.filter((p) => p.invisivel || !p.anel || !/menu-link/.test(p.id));
      confere(`${nome} com o principal aberto: 9 Tab passam pelos 9 links, visíveis e com anel`, !fora.length, fora.slice(0, 3).map((p) => `${p.id} ${p.invisivel || ''}`).join(' | '));
      await captura(page, `tab-menu-aberto-${nome}`);
      await fecharMouse(page, 'principal');
      if (nome === 'home' || nome === 'Programação') {
        await abrirMouse(page, 'pequeno');
        await page.locator('.menu-filtro').focus();
        const linhas = [];
        for (let i = 0; i < 10; i++) {
          await page.keyboard.press('Tab');
          await dorme(page, 450); // o link direto aparece com transição quando recebe foco
          linhas.push(await page.evaluate(LER_FOCO));
        }
        const ruins = linhas.filter((p) => p.invisivel || !p.anel || !/menu-film/.test(p.id));
        confere(`${nome} com o painel pequeno aberto: o Tab anda pelas linhas, visíveis e com anel`, !ruins.length, ruins.slice(0, 3).map((p) => `${p.id} ${p.invisivel || ''}`).join(' | '));
        await page.keyboard.press('Enter');
        await dorme(page, 800);
        confere(`${nome} com o painel pequeno aberto: console limpo`, !page.erros.length, page.erros.slice(0, 2).join(' | '));
      }
      await ctx.close();
    });
  }
  // 2c. O gatilho do ingresso não faz nada em Sobre e Contato, onde o CSS original o desliga para o mouse
  await tenta('ingresso desligado em Sobre', async () => {
    const { ctx, page } = await abrir({ caminho: '/sobre/', quando: JULHO });
    await pronta(page);
    const passos = await focarTab(page, '#smallpanel', 4);
    confere('Sobre: o ingresso, desligado para o mouse, não recebe foco', passos < 0, `chegou em ${passos} Tab`);
    if (passos > 0) {
      await page.keyboard.press('Space');
      await dorme(page, 900);
      const r = await page.evaluate(() => ({ marcado: document.getElementById('smallpanel').checked, trava: getComputedStyle(document.querySelector('.menu-close-trig')).display }));
      confere('Sobre: Espaço no ingresso não deixa a camada de fechar cobrindo a página', r.trava === 'none', JSON.stringify(r));
    }
    await ctx.close();
  });

  // 3. Escape fecha o que estiver aberto (abre com o mouse, porque o teclado pode não abrir)
  for (const [nome, caminho] of [['home', '/'], ['Programação', '/programacao/'], ['sessão', SESSAO], ['Sobre', '/sobre/']]) {
    await tenta(`Escape em ${nome}`, async () => {
      const { ctx, page } = await abrir({ caminho, quando: JULHO });
      await pronta(page);
      await page.mouse.move(600, 500);
      await abrirMouse(page, 'principal');
      await page.keyboard.press('Escape');
      await dorme(page, 1000);
      // Herdado, FASE2.md: Escape não fecha os menus. Registrado, não cobrado; a saída é o clique ou a rolagem.
      info(`${nome}: Escape ${(await marcado(page, 'principal')) ? 'não fecha' : 'fecha'} o menu principal`);
      if (await marcado(page, 'principal')) await fecharMouse(page, 'principal');
      if (nome === 'home' || nome === 'Programação') {
        await abrirMouse(page, 'pequeno');
        await page.keyboard.press('Escape');
        await dorme(page, 1000);
        info(`${nome}: Escape ${(await marcado(page, 'pequeno')) ? 'não fecha' : 'fecha'} o painel pequeno`);
      }
      await ctx.close();
    });
  }

  // 4. Setas e Espaço movem o carrossel, sem contar duas vezes
  await tenta('setas na home', async () => {
    const { ctx, page } = await abrir({ caminho: '/', quando: JULHO });
    await pronta(page);
    const n = (await carrossel(page)).n;
    const pressiona = async (tecla) => { await page.keyboard.press(tecla); await dorme(page, 500); return (await assentar(page)).i; };
    confere('home: seta para baixo vai ao próximo', (await pressiona('ArrowDown')) === 1);
    confere('home: Espaço vai ao próximo', (await pressiona('Space')) === 2);
    confere('home: seta para cima volta', (await pressiona('ArrowUp')) === 1);
    await pressiona('ArrowUp');
    confere('home: seta para cima no primeiro vai ao último', (await pressiona('ArrowUp')) === n - 1);
    confere('home: seta para baixo no último vai ao primeiro', (await pressiona('ArrowDown')) === 0);
    confere('home: nenhuma tecla rolou a página', (await page.evaluate(() => scrollY)) === 0);
    // Enter no EXPLORAR do item atual, pelo teclado
    await pressiona('ArrowDown');
    const atual = await carrossel(page);
    await page.evaluate(() => document.activeElement?.blur());
    const destino = `/sessoes/${atual.sessao}/`;
    await page.evaluate((d) => { const a = [...document.querySelectorAll('a.explore-w:not(.mobile)')].find((x) => x.getAttribute('href') === d); a.focus(); }, destino);
    await page.keyboard.press('Enter');
    await esperarPagina(page, 'case', destino);
    confere('home: Enter no EXPLORAR abre a sessão certa', new URL(page.url()).pathname === destino, page.url());
    confere('home: console limpo no teclado', !page.erros.length, page.erros.slice(0, 2).join(' | '));
    await ctx.close();
  });
  for (const [quando, rotulo, destino0] of [[JULHO, 'com sessão', '/sessoes/obsession-2026/'], [SEM_SESSAO, 'sem sessão', '/sobre/']]) {
    await tenta(`setas na Programação ${rotulo}`, async () => {
      const { ctx, page } = await abrir({ caminho: '/programacao/', quando });
      await pronta(page);
      const n = (await carrossel(page)).n;
      const hrefLink = () => page.evaluate(() => new URL(document.querySelector('[data-slider="link"]').href).pathname);
      confere(`Programação ${rotulo}: EXPLORAR do item 0 aponta para ${destino0}`, (await hrefLink()) === destino0, await hrefLink());
      const pressiona = async (tecla) => { await page.keyboard.press(tecla); await dorme(page, 500); return (await assentar(page)).i; };
      confere(`Programação ${rotulo}: seta direita vai ao próximo`, (await pressiona('ArrowRight')) === 1);
      confere(`Programação ${rotulo}: Espaço vai ao próximo`, (await pressiona('Space')) === 2);
      confere(`Programação ${rotulo}: seta esquerda volta`, (await pressiona('ArrowLeft')) === 1);
      await pressiona('ArrowLeft');
      confere(`Programação ${rotulo}: seta esquerda no primeiro vai ao último`, (await pressiona('ArrowLeft')) === n - 1);
      confere(`Programação ${rotulo}: seta direita no último vai ao primeiro`, (await pressiona('ArrowRight')) === 0);
      // o botão da chave CENAS/CARTAZ responde a Enter e a Espaço
      await page.evaluate(() => document.querySelector('[data-work="toggle"] button.work-toggle:not(.inactive)').focus());
      const antesToggle = await page.evaluate(() => [...document.querySelectorAll('button.work-toggle')].map((b) => b.classList.contains('inactive')).join());
      await page.keyboard.press('Space');
      await dorme(page, 1800);
      const depoisEspaco = await page.evaluate(() => [...document.querySelectorAll('button.work-toggle')].map((b) => b.classList.contains('inactive')).join());
      confere(`Programação ${rotulo}: Espaço aciona a chave CENAS/CARTAZ`, depoisEspaco !== antesToggle, `${antesToggle} -> ${depoisEspaco}`);
      if (depoisEspaco === antesToggle) {
        await assentar(page).catch(() => {});
        await page.evaluate(() => document.querySelector('[data-work="toggle"] button.work-toggle:not(.inactive)').focus());
        await page.keyboard.press('Enter');
        await dorme(page, 1800);
      }
      const depoisEnter = await page.evaluate(() => [...document.querySelectorAll('button.work-toggle')].map((b) => b.classList.contains('inactive')).join());
      confere(`Programação ${rotulo}: Enter aciona a chave CENAS/CARTAZ`, depoisEnter !== antesToggle, `${antesToggle} -> ${depoisEnter}`);
      // nome acessível
      const nomes = await page.evaluate(() => [...document.querySelectorAll('button.work-toggle')].map((b) => b.getAttribute('aria-label') || b.textContent.trim()));
      confere(`Programação ${rotulo}: os botões da chave têm nome acessível`, nomes.every(Boolean), JSON.stringify(nomes));
      // volta a CARTAZ e Enter no EXPLORAR
      await page.evaluate(() => document.querySelector('[data-work="toggle"] button.work-toggle:not(.inactive)').click());
      await dorme(page, 2200);
      await assentar(page);
      await page.evaluate(() => document.querySelector('[data-slider="link"]').focus());
      const alvo = await hrefLink();
      await page.keyboard.press('Enter');
      await page.waitForFunction((a) => location.pathname === a, alvo, ESPERA);
      await pronta(page);
      confere(`Programação ${rotulo}: Enter no EXPLORAR abre o destino do item atual`, new URL(page.url()).pathname === alvo, alvo);
      confere(`Programação ${rotulo}: console limpo`, !page.erros.length, page.erros.slice(0, 2).join(' | '));
      await ctx.close();
    });
  }

  // 5. O âncora do lightbox do Webflow: nenhum dos que ficam fora da tela recebe foco
  await tenta('âncora do lightbox', async () => {
    const { ctx, page } = await abrir({ caminho: '/programacao/', quando: JULHO });
    await pronta(page);
    const r = await page.evaluate(() => [...document.querySelectorAll('a.footage-img-sizer')].filter((a) => a.tabIndex >= 0 && getComputedStyle(a).visibility !== 'hidden').map((a) => ({ aria: a.getAttribute('aria-label'), x: Math.round(a.getBoundingClientRect().x), hidden: a.getAttribute('aria-hidden') })));
    const emFoco = r.filter((x) => x.hidden !== 'true');
    confere('Programação: nenhum âncora de lightbox fora da tela recebe foco', !emFoco.length, JSON.stringify(emFoco.slice(0, 2)));
    confere('Programação: nenhum rótulo em inglês nos âncoras', !r.some((x) => /open lightbox/i.test(x.aria || '')), r[0]?.aria || '');
    const passos = await focarTab(page, 'a.footage-img-sizer');
    if (passos > 0) {
      await page.keyboard.press('Enter');
      await dorme(page, 2500);
      const caixa = await page.evaluate(() => { const b = document.querySelector('.w-lightbox-backdrop'); return b ? { visivel: getComputedStyle(b).display !== 'none', rotulos: [...b.querySelectorAll('[aria-label]')].map((x) => x.getAttribute('aria-label')) } : null; });
      await captura(page, 'lightbox-enter');
      confere('Programação: Enter no âncora não abre o lightbox do Webflow, que nunca foi visível', !caixa?.visivel, JSON.stringify(caixa));
      await page.keyboard.press('Escape');
      await dorme(page, 1200);
    }
    confere('Programação: console limpo no âncora', !page.erros.length, page.erros.slice(0, 2).join(' | '));
    await ctx.close();
  });

  // 6. Enter, âncora interna e o trailer na sessão
  await tenta('Enter na sessão', async () => {
    const { ctx, page } = await abrir({ caminho: SESSAO, quando: JULHO, antes: async (p, c) => { await c.route(/youtube-nocookie/, (r) => r.fulfill({ status: 200, contentType: 'text/html', body: '<!doctype html><title>x</title>' })); } });
    await pronta(page);
    const y0 = await page.evaluate(() => scrollY);
    await focarTab(page, 'a.arrow-link-w');
    await page.keyboard.press('Enter');
    await dorme(page, 2500);
    confere('sessão: Enter em "Ir para o trailer" desce a página', (await page.evaluate(() => scrollY)) > y0 + 100, String(await page.evaluate(() => Math.round(scrollY))));
    await focarTab(page, 'button.video-cta-w', 5);
    await page.keyboard.press('Enter');
    await page.waitForFunction(() => document.querySelector('[data-videoplayer="dialog"]')?.classList.contains('open') && parseFloat(document.querySelector('[data-videoplayer="darken"]').style.opacity) >= 0.9, null, ESPERA);
    const iframe = await page.evaluate(() => !!document.querySelector('iframe.yt-trailer'));
    confere('sessão: Enter no trailer abre o diálogo e monta o player', iframe);
    await page.keyboard.press('Escape');
    await page.waitForFunction(() => !document.querySelector('[data-videoplayer="dialog"]').classList.contains('open'), null, ESPERA);
    await dorme(page, 1200);
    const f = await page.evaluate(() => ({ iframe: !!document.querySelector('iframe.yt-trailer'), foco: document.activeElement?.className?.toString() || '' }));
    confere('sessão: Escape fecha o trailer, tira o player e devolve o foco ao botão', !f.iframe && /video-cta-w/.test(f.foco), JSON.stringify(f));
    // Espaço rola a página numa carga direta; o Lenis só volta quando o tween de fechar termina
    await page.waitForFunction(() => !document.documentElement.classList.contains('lenis-stopped'), null, ESPERA);
    await dorme(page, 500);
    await page.evaluate(() => document.activeElement?.blur());
    const y1 = await page.evaluate(() => scrollY);
    await page.keyboard.press('Space');
    await dorme(page, 1500);
    confere('sessão em carga direta: Espaço rola a página', (await page.evaluate(() => scrollY)) > y1 + 50, `${Math.round(y1)} -> ${Math.round(await page.evaluate(() => scrollY))}`);
    // Enter no cartão da próxima sessão
    const prox = await page.evaluate(() => [...document.querySelectorAll('[data-nextcms="w"] > .previousnext-item a.next-link')].find((a) => getComputedStyle(a.closest('.previousnext-item')).display !== 'none')?.getAttribute('href'));
    await page.evaluate((h) => document.querySelector(`[data-nextcms="w"] a.next-link[href="${h}"]`).focus(), prox);
    await page.keyboard.press('Enter');
    await esperarPagina(page, 'case', prox);
    confere('sessão: Enter no cartão abre a próxima sessão', new URL(page.url()).pathname === prox, prox);
    confere('sessão: console limpo no teclado', !page.erros.length, page.erros.slice(0, 2).join(' | '));
    await ctx.close();
  });

  // 7. Depois de passar pela Programação, Espaço continua valendo nas outras páginas
  await tenta('Espaço depois da Programação', async () => {
    const { ctx, page } = await abrir({ caminho: '/programacao/', quando: JULHO });
    await pronta(page);
    await page.evaluate((s) => document.querySelector(`.menu-films-w a[href="${s}"]`).click(), SESSAO);
    await esperarPagina(page, 'case', SESSAO);
    const prevenido = await page.evaluate(() => { const ev = new KeyboardEvent('keydown', { code: 'Space', key: ' ', bubbles: true, cancelable: true }); document.body.dispatchEvent(ev); return ev.defaultPrevented; });
    confere('sessão depois da Programação: Espaço não fica cancelado por ouvinte antigo', !prevenido);
    const y1 = await page.evaluate(() => scrollY);
    await page.keyboard.press('Space');
    await dorme(page, 1500);
    confere('sessão depois da Programação: Espaço rola a página', (await page.evaluate(() => scrollY)) > y1 + 50, `${Math.round(y1)} -> ${Math.round(await page.evaluate(() => scrollY))}`);
    await focarTab(page, '#mainpanel');
    await page.keyboard.press('Space');
    await dorme(page, 1300);
    confere('sessão depois da Programação: Espaço abre o menu principal', await marcado(page, 'principal'));
    await ctx.close();
  });
  await tenta('Espaço depois da home', async () => {
    const { ctx, page } = await abrir({ caminho: '/', quando: JULHO });
    await pronta(page);
    await page.evaluate((s) => document.querySelector(`.menu-films-w a[href="${s}"]`).click(), SESSAO);
    await esperarPagina(page, 'case', SESSAO);
    const prevenido = await page.evaluate(() => { const ev = new KeyboardEvent('keydown', { code: 'Space', key: ' ', bubbles: true, cancelable: true }); document.body.dispatchEvent(ev); return ev.defaultPrevented; });
    confere('sessão depois da home: Espaço não fica cancelado', !prevenido);
    await ctx.close();
  });

  // 8. Enter na 404
  await tenta('Enter na 404', async () => {
    const { ctx, page } = await abrir({ caminho: '/404.html', quando: JULHO });
    await pronta(page);
    await page.keyboard.press('Tab');
    await page.keyboard.press('Enter');
    await esperarPagina(page, 'home', '/');
    const c404 = await carrossel(page);
    confere('404: Enter em VOLTAR leva à home, no item 0', c404?.i === 0, JSON.stringify(c404));
    confere('404: console limpo', !page.erros.length, page.erros.slice(0, 2).join(' | '));
    await ctx.close();
  });
}

// ===================== FILTRO
const linhasVisiveis = (page) =>
  page.evaluate(() => [...document.querySelectorAll('.menu-films-w > .menu-film')].filter((l) => getComputedStyle(l).display !== 'none').map((l) => l.getAttribute('data-sessao') || 'AVISO'));

async function filtrar(page, texto) {
  await page.locator('.menu-filtro').fill('');
  await page.locator('.menu-filtro').click();
  if (texto) await page.keyboard.type(texto, { delay: 10 });
  await dorme(page, 120);
  return linhasVisiveis(page);
}

async function secaoFiltro() {
  const CASOS = [
    ['/', JULHO, 'home com sessão', 'obsession-2026'],
    ['/', SEM_SESSAO, 'home sem sessão', 'AVISO'],
    ['/programacao/', JULHO, 'Programação com sessão', 'obsession-2026'],
    ['/programacao/', SEM_SESSAO, 'Programação sem sessão', 'AVISO'],
  ];
  for (const [caminho, quando, rotulo, primeira] of CASOS) {
    await tenta(`filtro em ${rotulo}`, async () => {
      const { ctx, page } = await abrir({ caminho, quando });
      await pronta(page);
      const inicio = await carrossel(page);
      const todas = await linhasVisiveis(page);
      const o = listasIguais(await ordemListas(page));
      confere(`${rotulo}: linhas na mesma ordem do carrossel, começando em ${primeira}`, todas[0] === primeira && todas.join() === o.ordem.join() && inicio.sessao === primeira, `${todas.length} linhas, atual ${inicio.sessao}`);
      await abrirMouse(page, 'pequeno');
      confere(`${rotulo}: o campo aparece com o painel aberto`, await page.locator('.menu-filtro').isVisible());
      confere(`${rotulo}: acentos ignorados, sem acento acha Obsessão`, (await filtrar(page, 'obsessao')).includes('obsession-2026'));
      confere(`${rotulo}: maiúsculas e acento acham Obsessão`, (await filtrar(page, 'OBSESSÃO')).includes('obsession-2026'));
      confere(`${rotulo}: "inglorios" acha Bastardos Inglórios`, (await filtrar(page, 'inglorios')).join() === 'inglourious-basterds-2009');
      confere(`${rotulo}: acento a mais no termo não atrapalha`, (await filtrar(page, 'búgônia')).join() === 'bugonia-2025');
      confere(`${rotulo}: dois termos em qualquer ordem`, (await filtrar(page, '2015 tarantino')).join() === 'the-hateful-eight-2015');
      // vazio
      const vazio = await filtrar(page, 'zzzqqq');
      const msg = await page.evaluate(() => { const e = document.querySelector('.menu-filtro-vazio'); return { visivel: !e.hidden && e.getBoundingClientRect().height > 0, texto: e.textContent.trim() }; });
      confere(`${rotulo}: sem resultado mostra a mensagem`, !vazio.length && msg.visivel && msg.texto === 'Nenhuma sessão encontrada', JSON.stringify(msg));
      const urlAntes = page.url();
      await page.keyboard.press('Enter');
      await dorme(page, 800);
      confere(`${rotulo}: Enter sem resultado não navega`, page.url() === urlAntes);
      // Escape limpa
      await page.keyboard.press('Escape');
      await dorme(page, 200);
      const esc = await page.evaluate(() => ({ valor: document.querySelector('.menu-filtro').value, foco: document.activeElement === document.querySelector('.menu-filtro'), vazioOculto: document.querySelector('.menu-filtro-vazio').hidden, aberto: document.getElementById('smallpanel').checked }));
      confere(`${rotulo}: Escape limpa o campo, tira o foco e o painel segue aberto`, esc.valor === '' && !esc.foco && esc.vazioOculto && esc.aberto, JSON.stringify(esc));
      confere(`${rotulo}: Escape devolve todas as linhas`, (await linhasVisiveis(page)).length === todas.length);
      // teclas dentro do campo
      await filtrar(page, 'a b');
      for (const t of ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End']) await page.keyboard.press(t);
      await dorme(page, 900);
      const k = await page.evaluate(() => ({ valor: document.querySelector('.menu-filtro').value, aberto: document.getElementById('smallpanel').checked, linhas: document.querySelector('.menu-filtro').value.includes('\n') }));
      confere(`${rotulo}: Espaço e setas no campo não movem o carrossel nem fecham o painel`, k.valor === 'a b' && k.aberto && (await carrossel(page)).i === inicio.i, JSON.stringify(k));
      // a tecla g não abre painel de depuração
      await filtrar(page, 'gg');
      confere(`${rotulo}: tecla g não abre painel de depuração`, !(await page.locator('.lil-gui').count()) || !(await page.locator('.lil-gui').first().isVisible()));
      // colar com quebra de linha
      await page.locator('.menu-filtro').fill('bugonia\n');
      await dorme(page, 120);
      confere(`${rotulo}: texto colado com quebra de linha funciona`, (await linhasVisiveis(page)).join() === 'bugonia-2025');
      // Tab a partir do campo vai à primeira linha visível
      await filtrar(page, 'bugonia');
      await page.keyboard.press('Tab');
      const fTab = await page.evaluate(() => document.activeElement.closest('.menu-film')?.getAttribute('data-sessao'));
      confere(`${rotulo}: Tab no campo vai à primeira linha visível`, fTab === 'bugonia-2025', String(fTab));
      // roda na lista
      await filtrar(page, '');
      await page.locator('.menu-films-w').hover();
      await page.mouse.wheel(0, 300);
      await dorme(page, 800);
      const rodou = await page.evaluate(() => ({ topo: document.querySelector('.menu-films-w').scrollTop, aberto: document.getElementById('smallpanel').checked }));
      confere(`${rotulo}: roda na lista rola a lista, sem fechar o painel nem mover o carrossel`, rodou.topo > 0 && rodou.aberto && (await carrossel(page)).i === inicio.i, JSON.stringify(rodou));
      // índice certo com filtro: a linha clicada leva ao item dela, inclusive sendo a última visível
      for (const termo of ['bugonia', 'vingança', ...(primeira === 'AVISO' ? ['sem sinal'] : [])]) {
        if (!(await marcado(page, 'pequeno'))) await abrirMouse(page, 'pequeno');
        const vis = await filtrar(page, termo);
        const alvo = vis[vis.length - 1];
        const seletor = alvo === 'AVISO' ? '.menu-films-w > .menu-film[data-aviso] .menu-film-title' : `.menu-films-w > .menu-film[data-sessao="${alvo}"] .menu-film-title`;
        await page.click(seletor);
        await dorme(page, 700);
        const c = await assentar(page);
        const bilhete = await page.evaluate(() => [...document.querySelectorAll('[data-menu="films"] > *')].find((f) => getComputedStyle(f).visibility !== 'hidden')?.getAttribute('data-sessao') || 'AVISO');
        confere(`${rotulo}: filtro "${termo}", a linha clicada abre o item certo`, c.sessao === alvo, `${alvo} -> ${c.sessao}, ${vis.length} visíveis`);
        await dorme(page, 1500);
        const bilhete2 = await page.evaluate(() => [...document.querySelectorAll('[data-menu="films"] > *')].find((f) => getComputedStyle(f).visibility !== 'hidden')?.getAttribute('data-sessao') || 'AVISO');
        confere(`${rotulo}: filtro "${termo}", o ingresso acompanha`, bilhete2 === alvo, `${bilhete} / ${bilhete2}`);
      }
      // link direto com filtro
      if (!(await marcado(page, 'pequeno'))) await abrirMouse(page, 'pequeno');
      await filtrar(page, 'vingança');
      const diretos = await page.evaluate(() => [...document.querySelectorAll('.menu-films-w > .menu-film')].filter((l) => getComputedStyle(l).display !== 'none').map((l) => [l.getAttribute('data-sessao'), l.querySelector('a.menu-film-direct-link').getAttribute('href')]));
      confere(`${rotulo}: link direto de cada linha filtrada aponta para a própria sessão`, diretos.every(([s, h]) => h === `/sessoes/${s}/`), JSON.stringify(diretos));
      // Enter abre a primeira visível
      const vis = await filtrar(page, primeira === 'AVISO' ? 'sem' : 'bugonia');
      const esperado = vis[0] === 'AVISO' ? '/programacao/' : `/sessoes/${vis[0]}/`;
      await page.keyboard.press('Enter');
      if (esperado !== new URL(urlAntes).pathname) {
        await page.waitForFunction((d) => location.pathname === d, esperado, ESPERA);
        await pronta(page);
      } else {
        await dorme(page, 3000);
      }
      confere(`${rotulo}: Enter abre a primeira linha visível`, new URL(page.url()).pathname === esperado, `${vis[0]} -> ${page.url()}`);
      confere(`${rotulo}: console limpo no filtro`, !page.erros.length, page.erros.slice(0, 2).join(' | '));
      await ctx.close();
    });
  }
}

// ===================== MOUSE
async function arrastar(page, de, ate, passos = 14) {
  await page.mouse.move(de.x, de.y);
  await page.mouse.down();
  await page.mouse.move(ate.x, ate.y, { steps: passos });
  await dorme(page, 60);
  await page.mouse.up();
}

// Clica no meio da faixa de anterior ou próximo, onde nada mais cobre o ponto.
async function pontoDe(page, seletor) {
  return page.evaluate((s) => {
    const el = document.querySelector(s);
    const r = el.getBoundingClientRect();
    for (let fy = 0.5; fy > 0.02; fy -= 0.08) for (const fx of [0.5, 0.35, 0.65, 0.2, 0.8]) {
      const x = r.left + r.width * fx, y = r.top + r.height * fy;
      if (x < 0 || y < 0 || x >= innerWidth || y >= innerHeight) continue;
      if (document.elementFromPoint(x, y) === el) return { x, y };
    }
    return null;
  }, seletor);
}

async function trazer(page, seletor, topo = 0.15) {
  const { height: H, width: W } = page.viewportSize();
  await page.mouse.move(W - 3, H / 2);
  for (let i = 0; i < 14; i++) {
    const t = await page.evaluate((s) => {
      const el = [...document.querySelectorAll(s)].find((e) => e.getBoundingClientRect().height > 0);
      return el ? el.getBoundingClientRect().top : null;
    }, seletor);
    if (t === null) throw new Error(`não achei ${seletor}`);
    const dy = t - H * topo;
    if (Math.abs(dy) < 30) break;
    await page.mouse.wheel(0, dy);
    await dorme(page, 1100);
  }
  await dorme(page, 500);
}

async function secaoMouse() {
  // Home
  await tenta('mouse na home', async () => {
    const { ctx, page } = await abrir({ caminho: '/', quando: JULHO });
    await pronta(page);
    const { n } = await carrossel(page);
    await page.mouse.move(720, 480, { steps: 4 });
    await dorme(page, 1000);
    const cursor = await page.evaluate(() => {
      const t = document.querySelector('[data-cursor="text"]');
      const antigo = document.querySelector('.cursor-w-out');
      const no = document.querySelector('.cursor-sinal-no');
      const r = no && no.querySelector('.cs-ponto').getBoundingClientRect();
      return { texto: t.textContent, antigoEscondido: getComputedStyle(antigo).display === 'none', visivel: !!no && no.classList.contains('visivel'), x: r && Math.round(r.x), y: r && Math.round(r.y) };
    });
    confere('home: o rótulo do cursor antigo está em português, escondido', cursor.texto === 'ROLAR' && cursor.antigoEscondido && !(await page.evaluate(() => /SCROLL/.test(document.body.textContent))), cursor.texto);
    confere('home: o cursor do tema segue o ponteiro e está visível', cursor.visivel && Math.abs(cursor.x - 720) < 3 && Math.abs(cursor.y - 480) < 3, JSON.stringify(cursor));
    await captura(page, 'home-cursor');
    // arrastar
    await arrastar(page, { x: 720, y: 640 }, { x: 720, y: 420 });
    await dorme(page, 400);
    let c = await assentar(page);
    confere('home: arrastar para cima vai ao próximo', c.i === 1, JSON.stringify(c));
    // rollover do título que entrou
    await dorme(page, 400);
    const rol = await page.evaluate(async (s) => {
      const item = document.querySelector(`[data-roll="item"][data-sessao="${s}"]`);
      const chars = [...item.querySelectorAll('.split-rollover .originalText2')];
      const ler = () => chars.map((e) => e.style.transform).join('|');
      const vistos = new Set();
      const fim = performance.now() + 6000;
      while (performance.now() < fim) { vistos.add(ler()); await new Promise((r) => setTimeout(r, 60)); }
      return { letras: chars.length, estados: vistos.size };
    }, c.sessao);
    confere('home: o título rola letra a letra ao trocar de sessão', rol.letras > 0 && rol.estados > 3, JSON.stringify(rol));
    await arrastar(page, { x: 720, y: 420 }, { x: 720, y: 640 });
    await dorme(page, 400);
    c = await assentar(page);
    confere('home: arrastar para baixo volta', c.i === 0, JSON.stringify(c));
    // roda
    await page.mouse.move(720, 480);
    // Herdado, FASE2.md: 120 de roda (um entalhe) dão 0,06 de item e o alvo volta 10% por quadro ao inteiro mais próximo: mexe e volta
    let pico = 0;
    for (let i = 0; i < 10; i++) { await page.mouse.wheel(0, 120); pico = Math.max(pico, (await carrossel(page)).dist); await dorme(page, 30); }
    await dorme(page, 500);
    c = await assentar(page);
    confere('home: a roda mexe o rolo e volta ao mesmo item', pico >= 5 && c.i === 0, JSON.stringify({ pico, ...c }));
    // anterior e próximo dão a volta
    const irPara = async (i) => { await page.evaluate((k) => document.querySelectorAll('.menu-films-w > .menu-film')[k].click(), i); await dorme(page, 500); return assentar(page); };
    await irPara(0);
    const prev = await pontoDe(page, '[data-hitbox="PREV"]');
    const next = await pontoDe(page, '[data-hitbox="NEXT"]');
    confere('home: há ponto livre nas faixas de anterior e próximo', prev && next, JSON.stringify({ prev, next }));
    await page.mouse.click(prev.x, prev.y);
    await dorme(page, 500);
    c = await assentar(page);
    confere('home: anterior no primeiro vai ao último', c.i === n - 1, JSON.stringify(c));
    await page.mouse.click(next.x, next.y);
    await dorme(page, 500);
    c = await assentar(page);
    confere('home: próximo no último vai ao primeiro', c.i === 0, JSON.stringify(c));
    // painel pequeno e principal
    await abrirMouse(page, 'pequeno');
    await captura(page, 'home-painel-pequeno');
    await page.locator('.menu-films-w > .menu-film').nth(3).locator('.menu-film-title').hover();
    await dorme(page, 500);
    await fecharMouse(page, 'pequeno');
    await abrirMouse(page, 'principal');
    await captura(page, 'home-menu-principal');
    // trocar direto de um painel para o outro
    await page.click(ALVO.pequeno);
    await dorme(page, 1400);
    confere('home: clicar no ingresso com o principal aberto troca de painel', (await marcado(page, 'pequeno')) && !(await marcado(page, 'principal')));
    await page.mouse.click(300, 700); // fora do painel
    await dorme(page, 1000);
    confere('home: clicar fora fecha o painel', !(await marcado(page, 'pequeno')));
    // EXPLORAR com mouse
    await page.click('a.explore-w:not(.mobile) >> visible=true');
    await esperarPagina(page, 'case', SESSAO);
    confere('home: clique em EXPLORAR abre a sessão atual', new URL(page.url()).pathname === SESSAO, page.url());
    confere('home: console limpo no mouse', !page.erros.length, page.erros.slice(0, 2).join(' | '));
    await ctx.close();
  });

  // Home com o aviso em primeiro
  await tenta('mouse na home sem sessão', async () => {
    const { ctx, page } = await abrir({ caminho: '/', quando: SEM_SESSAO });
    await pronta(page);
    const c = await carrossel(page);
    confere('home sem sessão: o aviso vem em primeiro', c.sessao === 'AVISO', JSON.stringify(c));
    await page.mouse.move(720, 480);
    await page.click('a.explore-w:not(.mobile) >> visible=true');
    await esperarPagina(page, 'work', '/programacao/');
    const c2 = await paradaFinal(page);
    confere('home sem sessão: EXPLORAR leva à Programação, com o aviso em primeiro', c2.sessao === 'AVISO' && !c2.semImagem && !c2.semParar, JSON.stringify(c2));
    confere('home sem sessão: console limpo', !page.erros.length, page.erros.slice(0, 2).join(' | '));
    await ctx.close();
  });

  // Programação, nos dois estados
  for (const [quando, rotulo, primeira, destinoCartao] of [[JULHO, 'com sessão', 'obsession-2026', '/sessoes/v-for-vendetta-2005/'], [SEM_SESSAO, 'sem sessão', 'AVISO', null]]) {
    await tenta(`mouse na Programação ${rotulo}`, async () => {
      const { ctx, page } = await abrir({ caminho: '/programacao/', quando });
      await pronta(page);
      const { n, sessao } = await carrossel(page);
      confere(`Programação ${rotulo}: começa em ${primeira}`, sessao === primeira, sessao);
      await page.mouse.move(720, 500, { steps: 4 });
      await dorme(page, 900);
      const txt = await page.evaluate(() => { const w = document.querySelector('[data-cursor="home"]'); return { t: document.querySelector('[data-cursor="text"]').textContent, classe: w.className }; });
      confere(`Programação ${rotulo}: cursor diz ROLAR`, txt.t === 'ROLAR' && !/hide/.test(txt.classe), JSON.stringify(txt));
      await arrastar(page, { x: 900, y: 500 }, { x: 680, y: 500 });
      await dorme(page, 400);
      let c = await assentar(page);
      confere(`Programação ${rotulo}: arrastar para a esquerda vai ao próximo`, c.i === 1, JSON.stringify(c));
      await arrastar(page, { x: 600, y: 500 }, { x: 820, y: 500 });
      await dorme(page, 400);
      c = await assentar(page);
      confere(`Programação ${rotulo}: arrastar para a direita volta`, c.i === 0, JSON.stringify(c));
      await page.mouse.move(720, 500);
      let pico = 0;
      for (let i = 0; i < 10; i++) { await page.mouse.wheel(0, 120); pico = Math.max(pico, (await carrossel(page)).dist); await dorme(page, 30); }
      await dorme(page, 500);
      c = await assentar(page);
      confere(`Programação ${rotulo}: a roda mexe o rolo e volta ao mesmo item`, pico >= 5 && c.i === 0, JSON.stringify({ pico, ...c }));
      const irPara = async (i) => { await page.evaluate((k) => document.querySelectorAll('.menu-films-w > .menu-film')[k].click(), i); await dorme(page, 500); return assentar(page); };
      await irPara(0);
      const prev = await pontoDe(page, '[data-hitbox="PREV"]');
      const next = await pontoDe(page, '[data-hitbox="NEXT"]');
      await page.mouse.click(prev.x, prev.y);
      await dorme(page, 500);
      c = await assentar(page);
      confere(`Programação ${rotulo}: anterior no primeiro vai ao último`, c.i === n - 1, JSON.stringify(c));
      await page.mouse.click(next.x, next.y);
      await dorme(page, 500);
      c = await assentar(page);
      confere(`Programação ${rotulo}: próximo no último vai ao primeiro`, c.i === 0, JSON.stringify(c));
      const hora0 = await page.evaluate(() => window.__amostrar());
      confere(`Programação ${rotulo}: o WebGL desenha no modo CARTAZ`, hora0.desvio > 2, JSON.stringify(hora0));
      // CENAS
      await page.click('[data-work="toggle"] button.work-toggle:not(.inactive)');
      await dorme(page, 2600);
      const modo = await page.evaluate(() => [...document.querySelectorAll('button.work-toggle')].map((b) => b.classList.contains('inactive')));
      confere(`Programação ${rotulo}: a chave troca para CENAS`, modo[0] === false && modo[1] === true, JSON.stringify(modo));
      const hora1 = await page.evaluate(() => window.__amostrar());
      confere(`Programação ${rotulo}: o WebGL desenha quadros no modo CENAS`, hora1.desvio > 2, JSON.stringify(hora1));
      await captura(page, `programacao-cenas-${rotulo.replace(' ', '-')}`);
      const antesFaixa = await page.evaluate(() => window.__gl.desenhos);
      await arrastar(page, { x: 900, y: 500 }, { x: 600, y: 500 });
      await dorme(page, 1000);
      const ind = await carrossel(page);
      confere(`Programação ${rotulo}: arrastar em CENAS não troca de sessão`, ind.i === 0 && (await page.evaluate(() => window.__gl.desenhos)) > antesFaixa, JSON.stringify(ind));
      // Cartão do painel de filme em CENAS
      await page.click(ALVO.pequeno);
      await page.waitForFunction(() => document.querySelector('[data-menu="footagepanel"]').classList.contains('open'), null, ESPERA);
      await dorme(page, 1500);
      const cartao = await page.evaluate(() => {
        const vis = [...document.querySelectorAll('[data-menu="footages"] > *')].filter((f) => getComputedStyle(f).visibility !== 'hidden');
        const a = vis[0]?.querySelector('a.footagemenu-cta-w');
        const r = a?.getBoundingClientRect();
        return { n: vis.length, sessao: vis[0]?.getAttribute('data-sessao') || 'AVISO', href: a?.getAttribute('href'), txt: a?.textContent.trim(), alto: r?.height };
      });
      await captura(page, `programacao-painel-filme-${rotulo.replace(' ', '-')}`);
      const esperadoCartao = primeira === 'AVISO' ? '/sobre/' : `/sessoes/${primeira}/`;
      confere(`Programação ${rotulo}: o cartão do painel é o do item atual`, cartao.n === 1 && cartao.sessao === primeira && cartao.href === esperadoCartao, JSON.stringify(cartao));
      await page.click(`[data-menu="footages"] a.footagemenu-cta-w[href="${esperadoCartao}"]`);
      await page.waitForFunction((d) => location.pathname === d, esperadoCartao, ESPERA);
      await pronta(page);
      confere(`Programação ${rotulo}: o cartão leva ao destino certo`, new URL(page.url()).pathname === esperadoCartao, page.url());
      // Volta: a Programação entra em CARTAZ de novo
      await page.goBack();
      await esperarPagina(page, 'work', '/programacao/');
      const volta = await page.evaluate(() => [...document.querySelectorAll('button.work-toggle')].map((b) => b.classList.contains('inactive')));
      confere(`Programação ${rotulo}: voltar reinicia em CARTAZ`, volta[0] === true && volta[1] === false, JSON.stringify(volta));
      // CENAS em outro item: o cartão continua certo
      await page.keyboard.press('ArrowRight');
      await dorme(page, 500);
      const c2 = await assentar(page);
      await page.click('[data-work="toggle"] button.work-toggle:not(.inactive)');
      await dorme(page, 2600);
      await page.click(ALVO.pequeno);
      await page.waitForFunction(() => document.querySelector('[data-menu="footagepanel"]').classList.contains('open'), null, ESPERA);
      await dorme(page, 1200);
      const cartao2 = await page.evaluate(() => { const vis = [...document.querySelectorAll('[data-menu="footages"] > *')].filter((f) => getComputedStyle(f).visibility !== 'hidden'); return { n: vis.length, sessao: vis[0]?.getAttribute('data-sessao'), href: vis[0]?.querySelector('a.footagemenu-cta-w').getAttribute('href') }; });
      confere(`Programação ${rotulo}: em outro item o cartão acompanha`, cartao2.n === 1 && cartao2.sessao === c2.sessao && cartao2.href === `/sessoes/${c2.sessao}/`, JSON.stringify({ c2, cartao2 }));
      void destinoCartao;
      confere(`Programação ${rotulo}: console limpo no mouse`, !page.erros.length, page.erros.slice(0, 2).join(' | '));
      await ctx.close();
    });
  }

  // Sessão
  await tenta('mouse na sessão', async () => {
    const { ctx, page } = await abrir({ caminho: SESSAO, quando: JULHO });
    await pronta(page);
    await page.mouse.move(600, 500);
    // ingresso abre o painel de caso, com a leitura
    await page.click(ALVO.pequeno);
    await dorme(page, 1400);
    const caso = await page.evaluate(() => ({ aberto: document.querySelector('[data-menu="casepanel"]').classList.contains('open'), texto: document.querySelector('.case-menu-tx').textContent.trim().length }));
    confere('sessão: o ingresso abre o painel de caso com a leitura', caso.aberto && caso.texto > 100, JSON.stringify(caso));
    await captura(page, 'sessao-painel-caso');
    await page.click(ALVO.pequeno);
    await dorme(page, 900);
    await abrirMouse(page, 'principal');
    confere('sessão: abre o menu principal', await marcado(page, 'principal'));
    await fecharMouse(page, 'principal');
    // galeria
    await trazer(page, '[data-footage="w"]');
    // o bundle move cada item das duas faixas (data-footage="item" e "item2"), em sentidos opostos
    const lerFaixas = () => page.evaluate(() => ['item', 'item2'].map((k) => { const e = document.querySelector(`[data-footage="${k}"]`); return e ? Math.round(e.getBoundingClientRect().left) : null; }));
    const f0 = await lerFaixas();
    await page.mouse.wheel(0, 400);
    await dorme(page, 1300);
    const f1 = await lerFaixas();
    const anda = [f1[0] - f0[0], f1[1] - f0[1]];
    confere('sessão: as faixas da galeria andam com a rolagem, em sentidos opostos', anda[0] !== 0 && anda[1] !== 0 && Math.sign(anda[0]) !== Math.sign(anda[1]), `${f0} -> ${f1}`);
    const itens = await page.evaluate(() => [...document.querySelectorAll('[data-footage="line"]')].map((l) => l.querySelectorAll('img').length));
    confere('sessão: duas faixas com 14 itens', itens.length === 2 && itens.every((x) => x === 14), JSON.stringify(itens));
    // leituras: aqui o que se mede é a mão, então a passagem automática fica desligada; ela tem um teste próprio, em identidade.mjs
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await trazer(page, '[data-reviews="wrapper"]', 0.2);
    const lerSlide = () => page.evaluate(() => [...document.querySelectorAll('[data-reviews="slide"]')].map((e) => Math.round(e.getBoundingClientRect().left)));
    const lerBarra = () => page.evaluate(() => { const e = document.querySelector('[data-reviews="progress"]'); return e.style.transform || getComputedStyle(e).width; });
    const s0 = await lerSlide();
    const b0 = await lerBarra();
    const box = await page.evaluate(() => { const r = document.querySelector('[data-reviews="wrapper"]').getBoundingClientRect(); return { y: r.top + r.height / 2 }; });
    await arrastar(page, { x: 1000, y: box.y }, { x: 650, y: box.y }, 20);
    await dorme(page, 1700);
    const s1 = await lerSlide();
    const b1 = await lerBarra();
    confere('sessão: arrastar move as leituras', s1[0] < s0[0] - 50, `${s0[0]} -> ${s1[0]}`);
    confere('sessão: a barra de progresso acompanha', b0 !== b1, `${b0} -> ${b1}`);
    await page.click('[data-reviews="prevnext"] button >> nth=1');
    await dorme(page, 1600);
    const s2 = await lerSlide();
    confere('sessão: botão de próxima nota move', s2[0] !== s1[0], `${s1[0]} -> ${s2[0]}`);
    await page.click('[data-reviews="prevnext"] button >> nth=0');
    await dorme(page, 1600);
    const s3 = await lerSlide();
    confere('sessão: botão de nota anterior volta', s3[0] !== s2[0], `${s2[0]} -> ${s3[0]}`);
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    // letreiro
    await trazer(page, '.s.prizes', 0.1);
    await dorme(page, 800);
    const marq = await page.evaluate(async () => {
      const el = document.querySelector('[data-marquee-active] > div');
      if (!el) return { achou: false };
      const a = getComputedStyle(el).transform;
      await new Promise((r) => setTimeout(r, 700));
      const b = getComputedStyle(el).transform;
      return { achou: true, ativo: el.parentElement.getAttribute('data-marquee-active'), anim: el.getAnimations().filter((x) => x.playState === 'running').length, mudou: a !== b };
    });
    confere('sessão: o letreiro corre', marq.achou && marq.anim > 0 && marq.mudou, JSON.stringify(marq));
    await captura(page, 'sessao-letreiro');
    // cartão da próxima sessão: a seguinte na ordem calculada
    const ordem = (await ordemListas(page)).proximas;
    const atual = SESSAO.split('/')[2];
    const esperado = `/sessoes/${ordem[(ordem.indexOf(atual) + 1) % ordem.length]}/`;
    await trazer(page, '[data-nextcms="w"]', 0.2);
    const visiveis = await page.evaluate(() => [...document.querySelectorAll('[data-nextcms="w"] > .previousnext-item')].filter((e) => getComputedStyle(e).display !== 'none').map((e) => e.querySelector('a.next-link').getAttribute('href')));
    confere('sessão: mostra um só cartão, o da próxima na ordem', visiveis.length === 1 && visiveis[0] === esperado, `${visiveis.join()} esperado ${esperado}`);
    // rodapé
    await trazer(page, 'footer .ft-sitemap-lk', 0.5);
    await captura(page, 'sessao-rodape');
    const links = await page.evaluate(() => [...document.querySelectorAll('footer a[href^="/"]')].map((a) => a.getAttribute('href')));
    for (const h of [...new Set(links)]) {
      const r = await pedir(page, URL_BASE + h);
      confere(`rodapé: ${h} responde`, r.ok(), String(r.status()));
    }
    await page.click('footer .ft-sitemap-lk[href="/contato/"]');
    await esperarPagina(page, 'contact', '/contato/');
    confere('rodapé: clique em Contato navega por Taxi', new URL(page.url()).pathname === '/contato/');
    await page.goBack();
    await esperarPagina(page, 'case', SESSAO);
    await trazer(page, '[data-nextcms="w"]', 0.2);
    const b = await page.locator(`[data-nextcms="w"] a.next-link[href="${esperado}"]`).boundingBox();
    await page.mouse.click(b.x + b.width / 2, b.y + b.height / 2);
    await esperarPagina(page, 'case', esperado);
    confere('sessão: clique no cartão abre a próxima sessão', new URL(page.url()).pathname === esperado, page.url());
    confere('sessão: console limpo no mouse', !page.erros.length, page.erros.slice(0, 2).join(' | '));
    await ctx.close();
  });

  // A última sessão da ordem aponta de volta para a primeira
  await tenta('última sessão', async () => {
    const { ctx, page } = await abrir({ caminho: '/sessoes/the-long-walk-2025/', quando: SEM_SESSAO });
    await pronta(page);
    const r = await page.evaluate(() => ({ visiveis: [...document.querySelectorAll('[data-nextcms="w"] > .previousnext-item')].filter((e) => getComputedStyle(e).display !== 'none').map((e) => e.querySelector('a.next-link').getAttribute('href')), ordem: [...document.querySelector('[data-nextcms="w"]').children].map((c) => c.getAttribute('data-sessao')) }));
    confere('sessão última da ordem: o cartão volta à primeira', r.visiveis.length === 1 && r.visiveis[0] === `/sessoes/${r.ordem[0]}/`, r.visiveis.join());
    await ctx.close();
  });

  // Rótulos e botões das páginas sem carrossel
  await tenta('main e footer em Sobre', async () => {
    const { ctx, page } = await abrir({ caminho: '/sobre/', quando: JULHO });
    await pronta(page);
    await page.mouse.move(600, 600);
    await abrirMouse(page, 'principal');
    await page.locator('[data-menu="mainpanel"] a.menu-link.large[href="/contato/"]').hover();
    await dorme(page, 500);
    await captura(page, 'sobre-menu');
    await page.click('[data-menu="mainpanel"] a.menu-link.large[href="/contato/"]');
    await esperarPagina(page, 'contact', '/contato/');
    confere('menu principal: o link de Contato navega e o menu some', !(await marcado(page, 'principal')));
    await abrirMouse(page, 'principal');
    await page.click('[data-menu="mainpanel"] a.menu-link.xs[href="/termos/"]');
    await esperarPagina(page, 'policy', '/termos/');
    confere('menu principal: o link legal navega', new URL(page.url()).pathname === '/termos/');
    await page.click('a.nav-link.logo');
    await esperarPagina(page, 'home', '/');
    confere('logo: leva à home por Taxi', new URL(page.url()).pathname === '/');
    confere('Sobre e Contato: console limpo', !page.erros.length, page.erros.slice(0, 2).join(' | '));
    await ctx.close();
  });
}

// ===================== SOM
async function secaoSom() {
  await tenta('som', async () => {
    const mp3 = [];
    const { ctx, page } = await abrir({ caminho: '/', quando: JULHO, antes: async (p) => { p.on('response', (r) => { if (/\.mp3(\?|$)/.test(r.url())) mp3.push([r.url().split('/').pop(), r.status()]); }); } });
    await pronta(page);
    confere('som: nada é baixado antes do primeiro clique', mp3.length === 0, mp3.join());
    const global = await page.evaluate(() => {
      if (!window.Howl) return false;
      window.__toques = [];
      const p = window.Howl.prototype.play;
      window.Howl.prototype.play = function () { window.__toques.push(String(this._src).split('/').pop()); return p.apply(this, arguments); };
      return true;
    });
    confere('som: Howler presente', global);
    await page.mouse.move(700, 500);
    await page.mouse.click(700, 500); // primeiro clique: contexto de áudio e carga dos arquivos
    await page.waitForFunction(() => window.Howler?._howls?.length >= 4 && window.Howler._howls.every((h) => h.state() !== 'loading'), null, ESPERA);
    const est = await page.evaluate(() => ({ estados: window.Howler._howls.map((h) => [String(h._src).split('/').pop(), h.state()]), ctx: window.Howler.ctx?.state, webAudio: window.Howler.usingWebAudio }));
    confere('som: os 4 arquivos carregam', est.estados.length === 4 && est.estados.every((e) => e[1] === 'loaded'), JSON.stringify(est));
    await dorme(page, 300);
    const nomes = mp3.map((m) => m[0]).sort().join();
    confere('som: os 4 arquivos respondem 200', mp3.length === 4 && mp3.every((m) => m[1] === 200) && nomes === 'cta_in.mp3,cta_out.mp3,menu_IN.mp3,menu_OUT.mp3', nomes);
    // passar o mouse no EXPLORAR toca cta_in
    const ponto = await page.evaluate(() => { const a = [...document.querySelectorAll('[data-sound-hover="0"]')].find((e) => { const r = e.getBoundingClientRect(); return r.width && r.top > 0 && r.bottom < innerHeight && getComputedStyle(e).visibility !== 'hidden'; }); if (!a) return null; const r = a.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; });
    confere('som: há gatilho de hover na tela', !!ponto, JSON.stringify(ponto));
    await page.mouse.move(300, 300, { steps: 2 });
    await dorme(page, 200);
    await page.mouse.move(ponto.x, ponto.y, { steps: 3 });
    await dorme(page, 400);
    const t1 = await page.evaluate(() => window.__toques.slice());
    confere('som: hover no botão chama play de cta_in', t1.includes('cta_in.mp3'), t1.join());
    // clique no menu toca menu_IN
    await page.mouse.move(600, 600);
    await page.click(ALVO.principal);
    await dorme(page, 1300);
    const t2 = await page.evaluate(() => window.__toques.slice());
    confere('som: clique no menu chama play de menu_IN', t2.includes('menu_IN.mp3'), t2.join());
    await page.click(ALVO.principal);
    await dorme(page, 900);
    // depois de uma troca de página o gatilho continua vivo e não duplica
    await page.evaluate(() => { window.__toques.length = 0; });
    await page.evaluate(() => document.querySelector('[data-menu="mainpanel"] a[href="/sobre/"]').click());
    await esperarPagina(page, 'about', '/sobre/');
    await page.evaluate(() => { window.__toques.length = 0; });
    await page.mouse.move(600, 600);
    await page.click(ALVO.principal);
    await dorme(page, 1200);
    const t3 = await page.evaluate(() => window.__toques.slice());
    confere('som: depois do Taxi o clique no menu chama play uma vez', t3.filter((x) => x === 'menu_IN.mp3').length === 1, t3.join());
    confere('som: nenhum erro de console, inclusive de CSP', !page.erros.length, page.erros.slice(0, 2).join(' | '));
    await ctx.close();
  });
  // Celular: sem som por decisão do original
  await tenta('som no celular', async () => {
    const { ctx, page } = await abrir({ caminho: '/', quando: JULHO, tela: 'c390' });
    await pronta(page);
    await page.evaluate(() => { window.__toques = []; if (window.Howl) { const p = window.Howl.prototype.play; window.Howl.prototype.play = function () { window.__toques.push(1); return p.apply(this, arguments); }; } });
    await page.tap(ALVO.principal);
    await dorme(page, 1300);
    await page.tap(ALVO.principal);
    await dorme(page, 1000);
    confere('som no celular: o toque não chama play', (await page.evaluate(() => window.__toques.length)) === 0);
    confere('som no celular: console limpo', !page.erros.length, page.erros.slice(0, 2).join(' | '));
    await ctx.close();
  });
}

// ===================== TOQUE
// Um deslize lento e curto não troca de item, nem no site de referência: o alvo volta ao inteiro mais próximo a cada quadro.
async function deslizar(page, cdp, a, b, { passos = 6, segurar = false } = {}) {
  const toque = (type, touchPoints) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints });
  await toque('touchStart', [{ x: a.x, y: a.y }]);
  await dorme(page, 30);
  for (let i = 1; i <= passos; i++) {
    await toque('touchMove', [{ x: a.x + ((b.x - a.x) * i) / passos, y: a.y + ((b.y - a.y) * i) / passos }]);
    await dorme(page, 24);
  }
  if (segurar) { for (let i = 0; i < 4; i++) { await toque('touchMove', [{ x: b.x, y: b.y }]); await dorme(page, 40); } }
  await toque('touchEnd', []);
  await dorme(page, 60);
}

async function toqueNoCentro(page, seletor) {
  const p = await page.evaluate((s) => {
    const el = [...document.querySelectorAll(s)].find((e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && r.top < innerHeight && r.bottom > 0 && r.left < innerWidth && r.right > 0 && getComputedStyle(e).visibility !== 'hidden'; });
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  }, seletor);
  if (!p) throw new Error(`nada visível em ${seletor}`);
  await page.touchscreen.tap(p.x, p.y);
  return p;
}

async function secaoToque() {
  for (const [tela, nome] of [['c320', '320x568'], ['c390', '390x844'], ['c360', '360x640'], ['tablet', 'tablet 820x1180']]) {
    const { width: W, height: H } = TELAS[tela].viewport;
    const CEL = tela !== 'tablet';
    await tenta(`toque na home ${nome}`, async () => {
      const { ctx, page } = await abrir({ caminho: '/', quando: JULHO, tela });
      const cdp = await ctx.newCDPSession(page);
      await pronta(page);
      const inicio = await carrossel(page);
      confere(`${nome} home: começa na próxima sessão`, inicio.sessao === 'obsession-2026', JSON.stringify(inicio));
      await captura(page, `${tela}-home`);
      await deslizar(page, cdp, { x: W / 2, y: H * 0.8 }, { x: W / 2, y: H * 0.3 });
      await dorme(page, 500);
      let c = await assentar(page);
      confere(`${nome} home: deslizar para cima avança`, c.i > 0, JSON.stringify(c));
      const foi = c.i;
      await deslizar(page, cdp, { x: W / 2, y: H * 0.3 }, { x: W / 2, y: H * 0.8 });
      await dorme(page, 500);
      c = await assentar(page);
      confere(`${nome} home: deslizar para baixo volta`, c.i < foi || (foi > 0 && c.i === 0), JSON.stringify(c));
      const px = await page.evaluate(() => window.__amostrar());
      confere(`${nome} home: o WebGL desenha`, px.desvio > 2, JSON.stringify(px));
      // menu
      await page.tap(ALVO.principal);
      await page.waitForFunction(() => document.getElementById('mainpanel').checked, null, ESPERA);
      await dorme(page, 1400);
      await captura(page, `${tela}-menu`);
      const v = await page.evaluate(() => [...document.querySelectorAll('[data-menu="mainpanel"] a.menu-link')].filter((a) => { const r = a.getBoundingClientRect(); return r.height > 0 && r.bottom <= innerHeight + 1 && r.top >= 0; }).length);
      confere(`${nome} menu: todos os links cabem na tela`, v >= 9, `${v} visíveis`);
      await page.tap(ALVO.principal);
      await page.waitForFunction(() => !document.getElementById('mainpanel').checked, null, ESPERA);
      await dorme(page, 1000);
      confere(`${nome} menu: o X fecha`, !(await marcado(page, 'principal')));
      await page.tap(ALVO.principal);
      await page.waitForFunction(() => document.getElementById('mainpanel').checked, null, ESPERA);
      await dorme(page, 1400);
      await page.touchscreen.tap(W / 2, H * 0.92);
      await dorme(page, 1200);
      confere(`${nome} menu: tocar fora fecha`, !(await marcado(page, 'principal')));
      // duplo toque não dá zoom nem quebra
      const antes = await carrossel(page);
      await page.touchscreen.tap(W / 2, H * 0.5);
      await dorme(page, 70);
      await page.touchscreen.tap(W / 2, H * 0.5);
      await dorme(page, 1200);
      const z = await page.evaluate(() => ({ s: visualViewport.scale, l: Math.round(visualViewport.pageLeft), w: document.documentElement.scrollWidth - innerWidth, url: location.pathname }));
      const depois = await assentar(page);
      confere(`${nome} home: duplo toque não dá zoom, não move e não navega`, z.s === 1 && z.url === '/' && depois.i === antes.i, JSON.stringify(z));
      // EXPLORAR
      const destino = `/sessoes/${depois.sessao}/`;
      const seletor = CEL ? `a.explore-w.mobile[href="${destino}"]` : `a.explore-w[href="${destino}"]`;
      await toqueNoCentro(page, seletor);
      await esperarPagina(page, 'case', destino);
      confere(`${nome} home: EXPLORAR abre a sessão atual`, new URL(page.url()).pathname === destino, page.url());
      // links do menu
      await page.tap(ALVO.principal);
      await page.waitForFunction(() => document.getElementById('mainpanel').checked, null, ESPERA);
      await dorme(page, 1400);
      await page.tap('[data-menu="mainpanel"] a.menu-link.large[href="/sobre/"]');
      await esperarPagina(page, 'about', '/sobre/');
      confere(`${nome} menu: o link leva a Sobre`, new URL(page.url()).pathname === '/sobre/');
      await page.goBack();
      await esperarPagina(page, 'case', destino);
      confere(`${nome} voltar: retorna à sessão`, new URL(page.url()).pathname === destino);
      confere(`${nome} home: console limpo`, !page.erros.length, page.erros.slice(0, 2).join(' | '));
      await ctx.close();
    });
    await tenta(`toque na Programação ${nome}`, async () => {
      const { ctx, page } = await abrir({ caminho: '/programacao/', quando: JULHO, tela });
      const cdp = await ctx.newCDPSession(page);
      await pronta(page);
      await captura(page, `${tela}-programacao`);
      await deslizar(page, cdp, { x: W * 0.8, y: H * 0.5 }, { x: W * 0.2, y: H * 0.5 });
      await dorme(page, 500);
      let c = await assentar(page);
      confere(`${nome} Programação: deslizar para a esquerda avança`, c.i > 0, JSON.stringify(c));
      const foi = c;
      await deslizar(page, cdp, { x: W * 0.2, y: H * 0.5 }, { x: W * 0.8, y: H * 0.5 });
      await dorme(page, 500);
      c = await assentar(page);
      confere(`${nome} Programação: deslizar para a direita volta`, c.i < foi.i || c.i === 0, JSON.stringify(c));
      await deslizar(page, cdp, { x: W * 0.8, y: H * 0.5 }, { x: W * 0.2, y: H * 0.5 });
      await dorme(page, 500);
      c = await assentar(page);
      // chave
      await page.tap('[data-work="toggle"] button.work-toggle:not(.inactive)');
      await dorme(page, 2600);
      const px = await page.evaluate(() => window.__amostrar());
      confere(`${nome} Programação: CENAS desenha`, px.desvio > 2, JSON.stringify(px));
      await deslizar(page, cdp, { x: W * 0.8, y: H * 0.5 }, { x: W * 0.3, y: H * 0.5 });
      await dorme(page, 800);
      await captura(page, `${tela}-programacao-cenas`);
      await page.tap('[data-work="toggle"] button.work-toggle:not(.inactive)');
      await dorme(page, 2600);
      c = await assentar(page);
      // EXPLORAR
      const destino = await page.evaluate(() => new URL(document.querySelector('[data-slider="link"]').href).pathname);
      confere(`${nome} Programação: o destino do EXPLORAR é o item atual`, destino === `/sessoes/${c.sessao}/`, `${destino} / ${c.sessao}`);
      await toqueNoCentro(page, '[data-slider="link"] .explore-btn-w');
      await esperarPagina(page, 'case', destino);
      confere(`${nome} Programação: EXPLORAR abre a sessão`, new URL(page.url()).pathname === destino, page.url());
      // A página de sessão rola por toque depois da Programação
      const y0 = await page.evaluate(() => scrollY);
      await deslizar(page, cdp, { x: W / 2, y: H * 0.8 }, { x: W / 2, y: H * 0.25 }, { segurar: true });
      await dorme(page, 800);
      const y1 = await page.evaluate(() => scrollY);
      confere(`${nome} sessão: o dedo rola a página depois da Programação`, y1 > y0 + 100, `${Math.round(y0)} -> ${Math.round(y1)}`);
      confere(`${nome} Programação: console limpo`, !page.erros.length, page.erros.slice(0, 2).join(' | '));
      await ctx.close();
    });
    await tenta(`toque na sessão ${nome}`, async () => {
      const { ctx, page } = await abrir({ caminho: SESSAO, quando: JULHO, tela });
      const cdp = await ctx.newCDPSession(page);
      await pronta(page);
      const dest = async (sel, frac = 0.25) => {
        for (let i = 0; i < 40; i++) {
          const t = await page.evaluate((s) => { const el = [...document.querySelectorAll(s)].find((e) => e.getBoundingClientRect().height > 0); return el ? el.getBoundingClientRect().top : null; }, sel);
          if (t === null) throw new Error(`não achei ${sel}`);
          if (Math.abs(t - H * frac) < 100) return true;
          const dy = Math.max(-H * 0.5, Math.min(H * 0.5, t - H * frac));
          // o dedo começa onde não há slider
          const y0 = await page.evaluate(({ W, H, dy }) => {
            for (const f of [0.85, 0.75, 0.65, 0.55, 0.45, 0.35]) {
              const y = Math.round(H * (dy > 0 ? f : 1 - f));
              const el = document.elementFromPoint(W / 2, y);
              if (el && !el.closest('[data-reviews="wrapper"]')) return y;
            }
            return Math.round(H * 0.8);
          }, { W, H, dy });
          await deslizar(page, cdp, { x: W / 2, y: y0 }, { x: W / 2, y: y0 - dy }, { segurar: true });
          await dorme(page, 500);
        }
        return false;
      };
      await page.emulateMedia({ reducedMotion: 'reduce' }); // a mão, sem a passagem automática
      await dest('[data-reviews="wrapper"]', 0.2);
      await dorme(page, 800);
      const lerSlide = () => page.evaluate(() => [...document.querySelectorAll('[data-reviews="slide"]')].map((e) => Math.round(e.getBoundingClientRect().left)));
      const s0 = await lerSlide();
      const yr = await page.evaluate(() => { const r = document.querySelector('[data-reviews="wrapper"]').getBoundingClientRect(); return Math.round(r.top + r.height / 2); });
      const y0 = await page.evaluate(() => scrollY);
      await deslizar(page, cdp, { x: W * 0.85, y: yr }, { x: W * 0.2, y: yr });
      await dorme(page, 1600);
      const s1 = await lerSlide();
      confere(`${nome} sessão: deslizar move as leituras`, s1[0] < s0[0] - 30, `${s0[0]} -> ${s1[0]}`);
      confere(`${nome} sessão: deslizar na horizontal não rola a página`, Math.abs((await page.evaluate(() => scrollY)) - y0) < 40);
      await captura(page, `${tela}-sessao-leituras`);
      // O que se testa aqui é o toque no botão: um deslize que comece sobre as leituras não rola a página (herdado, FASE2.md)
      await page.evaluate(() => document.querySelector('[data-reviews="prevnext"]').scrollIntoView({ block: 'center', behavior: 'instant' }));
      await dorme(page, 600);
      await toqueNoCentro(page, '[data-reviews="prevnext"] button:nth-child(2)');
      await dorme(page, 1500);
      const s2 = await lerSlide();
      confere(`${nome} sessão: tocar em próxima nota move`, s2[0] !== s1[0], `${s1[0]} -> ${s2[0]}`);
      await page.emulateMedia({ reducedMotion: 'no-preference' });
      // próximo cartão
      await dest('[data-nextcms="w"]', 0.3);
      await dorme(page, 800);
      const prox = await page.evaluate(() => [...document.querySelectorAll('[data-nextcms="w"] > .previousnext-item')].find((e) => getComputedStyle(e).display !== 'none')?.querySelector('a.next-link').getAttribute('href'));
      await toqueNoCentro(page, `[data-nextcms="w"] a.next-link[href="${prox}"]`);
      await esperarPagina(page, 'case', prox);
      confere(`${nome} sessão: tocar no cartão abre a próxima`, new URL(page.url()).pathname === prox, prox);
      confere(`${nome} sessão: console limpo`, !page.erros.length, page.erros.slice(0, 2).join(' | '));
      await ctx.close();
    });
  }
  // A viewport de layout não pode crescer além da tela: o bundle centra o carrossel e o menu por innerWidth
  for (const [tela, nome] of [['c390', '390x844'], ['tabletMovel', 'tablet 820x1180 em modo móvel']]) {
    for (const caminho of ['/', '/programacao/', SESSAO, '/sobre/']) {
      await tenta(`viewport ${nome} ${caminho}`, async () => {
        const { ctx, page } = await abrir({ caminho, quando: JULHO, tela });
        await pronta(page);
        const v = await page.evaluate(() => ({ innerWidth, vv: Math.round(visualViewport.width), escala: +visualViewport.scale.toFixed(3), doc: document.documentElement.clientWidth, rolagem: document.documentElement.scrollWidth }));
        await captura(page, `viewport-${tela}-${caminho.replace(/\//g, '_')}`);
        confere(`${nome} ${caminho}: a viewport de layout é a da tela`, v.innerWidth === TELAS[tela].viewport.width, JSON.stringify(v));
        await ctx.close();
      });
    }
  }
  // Aviso de girar
  await tenta('girar', async () => {
    const { ctx, page } = await abrir({ caminho: '/', quando: JULHO, tela: 'c360' });
    await pronta(page);
    const aviso = () => page.evaluate(() => {
      const e = document.querySelector('.div-block-44');
      if (!e) return null;
      const c = getComputedStyle(e), r = e.getBoundingClientRect();
      return { display: c.display, w: Math.round(r.width), h: Math.round(r.height), texto: e.textContent.replace(/\s+/g, ' ').trim(), vw: innerWidth, vh: innerHeight };
    });
    const retrato = await aviso();
    confere('girar 360x640 em pé: sem aviso', retrato?.display === 'none', JSON.stringify(retrato));
    await page.setViewportSize({ width: 640, height: 360 });
    await dorme(page, 1500);
    const deitado = await aviso();
    await captura(page, 'girar-aviso');
    confere('girar 640x360 deitado: o aviso cobre a tela', deitado?.display !== 'none' && deitado.w === deitado.vw && deitado.h === deitado.vh && /Gire o aparelho/.test(deitado.texto), JSON.stringify(deitado));
    await page.setViewportSize({ width: 360, height: 640 });
    await dorme(page, 1500);
    const volta = await aviso();
    const c = await assentar(page);
    confere('girar de volta: o aviso some e a home segue no lugar', volta?.display === 'none' && c.sessao === 'obsession-2026', JSON.stringify(c));
    await page.setViewportSize({ width: 844, height: 390 });
    await dorme(page, 1500);
    const largo = await aviso();
    confere('girar 844x390: layout de tablet, sem aviso', largo?.display === 'none', JSON.stringify(largo));
    confere('girar: console limpo', !page.erros.length, page.erros.slice(0, 2).join(' | '));
    await ctx.close();
  });
}

// ===================== NAVEGAÇÃO TAXI EM CADEIA
async function medir(page, cdp) {
  await cdp.send('HeapProfiler.collectGarbage');
  await cdp.send('HeapProfiler.collectGarbage');
  await dorme(page, 400); // os finalizadores rodam depois da coleta
  await cdp.send('HeapProfiler.collectGarbage');
  const { usedSize } = await cdp.send('Runtime.getHeapUsage');
  const { metrics } = await cdp.send('Performance.getMetrics');
  const m = Object.fromEntries(metrics.map((x) => [x.name, x.value]));
  const gl = await page.evaluate(() => ({ c: window.__gl.criadas, a: window.__gl.apagadas, k: window.__gl.coletadas, b: window.__gl.bytes, d: window.__gl.desenhos }));
  return { heapMB: +(usedSize / 1048576).toFixed(1), nos: m.Nodes, ouvintes: m.JSEventListeners, texVivas: gl.c - gl.a - gl.k, texMB: +(gl.b / 1048576).toFixed(0), desenhos: gl.d };
}

async function secaoCadeia() {
  for (const [quando, rotulo, n, primeira] of [[JULHO, 'com sessão', N_SESSOES, 'obsession-2026'], [SEM_SESSAO, 'sem sessão', N_SESSOES + 1, 'AVISO']]) {
    await tenta(`cadeia ${rotulo}`, async () => {
      const { ctx, page } = await abrir({ caminho: '/', quando });
      const cdp = await ctx.newCDPSession(page);
      await cdp.send('Performance.enable');
      await pronta(page);
      const ir = (seletor) => page.evaluate((s) => { const a = document.querySelector(s); if (!a) throw new Error(`sem ${s}`); a.click(); }, seletor);
      const link = (h) => `.menu-films-w a[href="${h}"], [data-menu="mainpanel"] a[href="${h}"], footer a[href="${h}"]`;
      const LOGO = 'a.nav-link.logo';
      const A = '/sessoes/obsession-2026/';
      const B = '/sessoes/pulp-fiction-1994/';
      const C = '/sessoes/ready-or-not-double-feature-2026/';
      // cada salto: [como, página esperada, caminho esperado]
      const SALTOS = [
        [() => ir(link('/programacao/')), 'work', '/programacao/'],
        [() => ir(link(A)), 'case', A],
        [() => ir(link(B)), 'case', B],
        [() => ir(link('/sobre/')), 'about', '/sobre/'],
        [() => page.goBack(), 'case', B],
        [() => page.goBack(), 'case', A],
        [() => page.goForward(), 'case', B],
        [() => ir(LOGO), 'home', '/'],
        [() => ir(link('/programacao/')), 'work', '/programacao/'],
        [() => ir(link(C)), 'case', C],
        [() => ir(link('/contato/')), 'contact', '/contato/'],
        [() => page.goBack(), 'case', C],
        [() => page.goBack(), 'work', '/programacao/'],
        [() => page.goBack(), 'home', '/'],
        [() => page.goForward(), 'work', '/programacao/'],
        [() => ir(link('/sobre/')), 'about', '/sobre/'],
        [() => ir(link(A)), 'case', A],
        [() => ir(LOGO), 'home', '/'],
        [() => ir(link(C)), 'case', C],
        [() => ir(link('/programacao/')), 'work', '/programacao/'],
        [() => ir(LOGO), 'home', '/'],
      ];
      const inicial = await medir(page, cdp);
      const linhas = [{ salto: 0, pagina: 'home', ...inicial }];
      let falhas = 0;
      let ordemBase = null;
      for (let i = 0; i < SALTOS.length; i++) {
        const [como, dp, caminho] = SALTOS[i];
        const d0 = await page.evaluate(() => window.__gl.desenhos);
        await como();
        await esperarPagina(page, dp, caminho);
        const o = await ordemListas(page);
        const li = listasIguais(o);
        const est = await page.evaluate(() => {
          const t = document.querySelector('[data-taxi]');
          const c = getComputedStyle(t);
          return { vis: c.visibility, op: +c.opacity, vistas: document.querySelectorAll('[data-taxi-view]').length, canvas: document.querySelectorAll('[data-gl="c"] canvas').length, titulo: document.title };
        });
        const problemas = [];
        if (est.vis === 'hidden' || est.op < 0.95) problemas.push(`invisível ${JSON.stringify(est)}`);
        if (est.vistas !== 1) problemas.push(`${est.vistas} vistas`);
        if (est.canvas !== 1) problemas.push(`${est.canvas} canvas`);
        if (li.n !== 0 && (!li.ok || li.n !== n)) problemas.push(`listas ${li.n}/${n} iguais=${li.ok}`);
        if (li.n && !ordemBase) ordemBase = li.ordem.join();
        if (li.n && li.ordem.join() !== ordemBase) problemas.push('ordem mudou entre saltos');
        if (li.n && li.ordem[0] !== primeira) problemas.push(`primeira ${li.ordem[0]}`);
        if (dp === 'home' || dp === 'work') {
          const c = await paradaFinal(page);
          if (c.semImagem) problemas.push(`canvas sem imagem em 120 s: ${JSON.stringify(c)}`);
          else if (c.semParar) problemas.push(`carrossel não parou: ${JSON.stringify(c)}`);
          else if (c.i !== 0) problemas.push(`carrossel em ${c.i}`);
          const px = await page.evaluate(() => window.__amostrar());
          const d1 = await page.evaluate(() => window.__gl.desenhos);
          if (px.desvio < 3) problemas.push(`canvas sem imagem ${JSON.stringify(px)}`); // o alfa é sempre 1: quem prova imagem é o contraste
          if (d1 <= d0) problemas.push('nenhum desenho no salto');
          if (SAIDA && i >= SALTOS.length - 2) await captura(page, `cadeia-${rotulo.replace(' ', '-')}-${i + 1}-${dp}`);
        }
        if (page.erros.length) problemas.push(page.erros.splice(0).slice(0, 2).join(' | '));
        if (problemas.length) falhas++;
        confere(`cadeia ${rotulo}, salto ${i + 1} para ${caminho}`, !problemas.length, problemas.join(' ; '));
        linhas.push({ salto: i + 1, pagina: dp, ...(await medir(page, cdp)) });
      }
      info(`cadeia ${rotulo}: salto página heapMB nós ouvintes texturas-vivas textura-MB`);
      linhas.forEach((l) => info(`  ${String(l.salto).padStart(2)} ${l.pagina.padEnd(8)} ${String(l.heapMB).padStart(6)} ${String(l.nos).padStart(6)} ${String(l.ouvintes).padStart(5)} ${String(l.texVivas).padStart(5)} ${String(l.texMB).padStart(5)}`));
      void falhas;
      await ctx.close();
    });
  }
}

// ===================== RSS E FORMULÁRIOS
async function secaoRss() {
  const copiar = async (page) => {
    await trazer(page, '[data-feed="copiar"]', 0.5);
    await page.click('[data-feed="copiar"]');
    await dorme(page, 500);
    return page.evaluate(() => {
      const w = document.querySelector('[data-feed="w"]');
      const campo = w.querySelector('[data-feed="campo"]');
      const ler = (c) => { const e = w.querySelector(`[data-feed="${c}"]`); return { texto: e.textContent, visivel: getComputedStyle(e).display !== 'none' && e.getBoundingClientRect().height > 0 }; };
      return { ok: ler('ok'), erro: ler('erro'), valor: campo.value, foco: document.activeElement === campo, sel: [campo.selectionStart, campo.selectionEnd] };
    });
  };
  await tenta('RSS permitido', async () => {
    const { ctx, page } = await abrir({ caminho: '/sobre/', quando: JULHO, permissoes: ['clipboard-read', 'clipboard-write'] });
    await pronta(page);
    const r = await copiar(page);
    const lido = await page.evaluate(() => navigator.clipboard.readText());
    confere('RSS: a área de transferência guarda o endereço', lido === r.valor && /^https:\/\/[^/]+\/rss\.xml$/.test(lido), lido);
    confere('RSS: a mensagem de sucesso aparece só depois da cópia real', r.ok.visivel && r.ok.texto === 'Endereço copiado.' && !r.erro.visivel, JSON.stringify(r.ok));
    await captura(page, 'rss-copiado');
    // pelo teclado
    await page.evaluate(() => { const b = document.querySelector('[data-feed="copiar"]'); b.focus(); });
    await page.evaluate(() => navigator.clipboard.writeText('outra coisa'));
    await page.keyboard.press('Enter');
    await dorme(page, 500);
    confere('RSS: Enter no botão copia', (await page.evaluate(() => navigator.clipboard.readText())) === r.valor);
    await ctx.close();
  });
  await tenta('RSS negado', async () => {
    // negação real, pelo mesmo caminho de um usuário que bloqueou a permissão
    const { ctx, page } = await abrir({ caminho: '/sobre/', quando: JULHO });
    const cdp = await ctx.newCDPSession(page);
    let real = true;
    await cdp.send('Browser.setPermission', { permission: { name: 'clipboard-write', allowWithoutSanitization: true }, setting: 'denied', origin: URL_BASE }).catch(() => { real = false; });
    await pronta(page);
    if (!real) await page.evaluate(() => { navigator.clipboard.writeText = () => Promise.reject(new DOMException('negado', 'NotAllowedError')); });
    const r = await copiar(page);
    if (r.ok.visivel) {
      // o navegador ignorou a negação: força a recusa na API
      info('RSS: o navegador ignorou Browser.setPermission denied; recusa simulada na API');
      await page.evaluate(() => { navigator.clipboard.writeText = () => Promise.reject(new DOMException('negado', 'NotAllowedError')); });
    }
    const r2 = r.ok.visivel ? await copiar(page) : r;
    confere('RSS negado: mensagem honesta, sem sucesso', r2.erro.visivel && !r2.ok.visivel && /Não deu para copiar/.test(r2.erro.texto), JSON.stringify(r2.erro));
    confere('RSS negado: o endereço fica selecionado para copiar à mão', r2.foco && r2.sel[0] === 0 && r2.sel[1] === r2.valor.length, JSON.stringify(r2.sel));
    await captura(page, 'rss-negado');
    await ctx.close();
  });
  await tenta('RSS sem API', async () => {
    const { ctx, page } = await abrir({ caminho: '/sobre/', quando: JULHO, antes: (p) => p.addInitScript(() => { Object.defineProperty(navigator, 'clipboard', { value: undefined, configurable: true }); }) });
    await pronta(page);
    const r = await copiar(page);
    confere('RSS sem Clipboard API: mensagem honesta', r.erro.visivel && !r.ok.visivel, JSON.stringify(r.erro));
    await ctx.close();
  });
  await tenta('RSS depois do Taxi', async () => {
    const { ctx, page } = await abrir({ caminho: '/contato/', quando: JULHO, permissoes: ['clipboard-read', 'clipboard-write'] });
    await pronta(page);
    await page.evaluate(() => document.querySelector('[data-menu="mainpanel"] a[href="/sobre/"]').click());
    await esperarPagina(page, 'about', '/sobre/');
    const r = await copiar(page);
    confere('RSS: o botão funciona em página aberta por Taxi', r.ok.visivel && (await page.evaluate(() => navigator.clipboard.readText())) === r.valor, r.ok.texto);
    const feed = await pedir(page, `${URL_BASE}/rss.xml`);
    confere('RSS: o feed responde', feed.ok() && /xml/.test(feed.headers()['content-type'] || ''), feed.headers()['content-type']);
    await ctx.close();
  });
  // Nenhum formulário, nenhum sucesso simulado
  await tenta('formulários', async () => {
    const ctx = await browser.newContext();
    const mapa = await (await pedir(ctx, `${URL_BASE}/sitemap.xml`)).text();
    const rotas = [...mapa.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]).pathname);
    rotas.push('/404.html');
    confere(`páginas varridas incluem as ${N_SESSOES} sessões`, rotas.filter((r) => r.startsWith('/sessoes/')).length === N_SESSOES, `${rotas.length} rotas`);
    const achados = [];
    for (const r of rotas) {
      const html = await (await pedir(ctx, URL_BASE + r)).text();
      if (/<form\b/i.test(html)) achados.push(`${r}: <form>`);
      if (/type="submit"|\baction="/i.test(html)) achados.push(`${r}: envio`);
      if (/w-form-done"[^>]*>[^<]+|w-form-fail"[^>]*>[^<]+/.test(html)) achados.push(`${r}: mensagem pronta de formulário`);
      const texto = html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, ' ').replace(/<[^>]+>/g, ' ');
      const m = /\b(obrigad[oa]|inscri[çc][ãa]o|inscrit[oa]|assinatura confirmada|mensagem enviada|enviado com sucesso|subscribe|thank you)\b/i.exec(texto);
      if (m) achados.push(`${r}: "${m[0]}"`);
    }
    confere('nenhum formulário, botão de envio ou sucesso simulado', !achados.length, achados.slice(0, 6).join(' | '));
    await ctx.close();
  });
  await tenta('Contato', async () => {
    const { ctx, page } = await abrir({ caminho: '/contato/', quando: JULHO });
    await pronta(page);
    const r = await page.evaluate(() => {
      const vivos = (s) => [...document.querySelectorAll(s)].filter((e) => { const b = e.getBoundingClientRect(); return b.height > 0 && getComputedStyle(e).visibility !== 'hidden'; });
      return { forms: document.querySelectorAll('form').length, campos: vivos('input:not(.menu-input), textarea').map((e) => e.className), links: vivos('.contact-li-w a').map((a) => a.getAttribute('href')) };
    });
    confere('Contato: sem formulário nem campo; só links reais de contato', !r.forms && !r.campos.filter((c) => !/menu-filtro/.test(c)).length && r.links.length >= 2 && r.links.every((h) => /^(mailto:|https:\/\/discord)/.test(h)), JSON.stringify(r));
    await ctx.close();
  });
}

// ===================== PESO
async function secaoPeso() {
  const CASOS = [
    ['/', 'desktop 1440x900', { viewport: { width: 1440, height: 900 } }],
    ['/programacao/', 'desktop 1440x900', { viewport: { width: 1440, height: 900 } }],
    [SESSAO, 'desktop 1440x900', { viewport: { width: 1440, height: 900 } }],
    ['/', 'celular 390x844', { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2.625, isMobile: true, hasTouch: true, userAgent: UA_CELULAR }],
    ['/programacao/', 'celular 390x844', { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2.625, isMobile: true, hasTouch: true, userAgent: UA_CELULAR }],
    [SESSAO, 'celular 390x844', { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2.625, isMobile: true, hasTouch: true, userAgent: UA_CELULAR }],
  ];
  info('peso: rota | tela | KB na rede até o load | imagens | KB de imagem | requisições | load em ms');
  for (const [caminho, tela, opcoes] of CASOS) {
    await tenta(`peso ${caminho} ${tela}`, async () => {
      const ctx = await browser.newContext(opcoes);
      const page = await ctx.newPage();
      page.setDefaultTimeout(420000);
      const cdp = await ctx.newCDPSession(page);
      await cdp.send('Network.enable');
      const req = new Map();
      cdp.on('Network.responseReceived', (e) => { req.set(e.requestId, { url: e.response.url, tipo: e.type, status: e.response.status, mime: e.response.mimeType, bytes: 0, enc: e.response.headers['content-encoding'] || e.response.headers['Content-Encoding'] || '' }); });
      cdp.on('Network.loadingFinished', (e) => { const r = req.get(e.requestId); if (r) r.bytes = e.encodedDataLength; });
      const urls = [];
      page.on('request', (q) => urls.push(q.url()));
      let carregado = 0, foto = null;
      page.once('load', () => { carregado = 1; });
      await page.goto(URL_BASE + caminho, { waitUntil: 'load', timeout: 420000 });
      void carregado;
      const t = await page.evaluate(() => { const n = performance.getEntriesByType('navigation')[0]; return { load: Math.round(n.loadEventStart), dom: Math.round(n.domContentLoadedEventEnd) }; });
      const antes = [...req.values()];
      const soma = (l) => l.reduce((a, r) => a + r.bytes, 0);
      const imagens = antes.filter((r) => /image/.test(r.mime));
      foto = { totalKB: Math.round(soma(antes) / 1024), imagens: imagens.length, imgKB: Math.round(soma(imagens) / 1024), req: antes.length, load: t.load, dom: t.dom };
      await dorme(page, 8000); // o que pede depois do load
      const depois = [...req.values()];
      const extra = depois.length - antes.length;
      const porTipo = {};
      depois.forEach((r) => { const k = /image/.test(r.mime) ? 'imagem' : r.tipo; porTipo[k] = (porTipo[k] || 0) + r.bytes; });
      info(`peso: ${caminho} | ${tela} | ${foto.totalKB} KB | ${foto.imagens} imagens | ${foto.imgKB} KB | ${foto.req} req | load ${foto.load} ms | depois do load: +${extra} req, total ${Math.round(soma(depois) / 1024)} KB | ${Object.entries(porTipo).map(([k, v]) => `${k} ${Math.round(v / 1024)}`).join(', ')}`);
      // o <img> e o new Image() do WebGL pedem a mesma URL; só conta como repetida se vier da rede de novo
      const vistas = new Map();
      depois.filter((r) => r.bytes > 512).forEach((r) => vistas.set(r.url, (vistas.get(r.url) || 0) + 1));
      const repetidas = [...vistas].filter(([, q]) => q > 1).map(([u]) => u);
      const desperdicio = depois.filter((r) => r.bytes > 512 && repetidas.includes(r.url)).reduce((a, r) => a + r.bytes, 0) / 2;
      confere(`peso ${caminho} ${tela}: nenhuma URL baixada duas vezes da rede`, !repetidas.length, repetidas.length ? `${repetidas.length} URLs, cerca de ${Math.round(desperdicio / 1024)} KB a mais: ${repetidas.slice(0, 2).join(' ')}` : '');
      const externos = urls.filter((u) => !u.startsWith(URL_BASE) && !u.startsWith('data:') && !u.startsWith('blob:'));
      confere(`peso ${caminho} ${tela}: nenhum pedido a outro domínio antes de um clique`, !externos.length, externos.slice(0, 2).join(' '));
      const erros = depois.filter((r) => r.status >= 400);
      confere(`peso ${caminho} ${tela}: nenhuma resposta de erro`, !erros.length, erros.slice(0, 2).map((r) => r.url).join(' '));
      await ctx.close();
    });
  }
}

const SECAO = { teclado: secaoTeclado, filtro: secaoFiltro, mouse: secaoMouse, som: secaoSom, toque: secaoToque, cadeia: secaoCadeia, rss: secaoRss, peso: secaoPeso };
for (const s of SECOES) {
  console.log(`\n=== ${s} (${CANAL})`);
  await SECAO[s]();
}
await browser.close();
const falhas = resultados.filter((r) => !r.ok);
console.log(`\n${resultados.length - falhas.length} de ${resultados.length} aprovados`);
if (falhas.length) {
  console.log('\nFALHAS');
  falhas.forEach((f) => console.log(`  ${f.nome}${f.detalhe ? `  ${f.detalhe}` : ''}`));
  process.exit(1);
}
