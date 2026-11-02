// Identidade e interação da rodada de 02/11/2026: abertura só com o nome, cartão sem o símbolo, saída do trailer sem texto, leituras que
// andam sozinhas, X no lugar da Steam, o cursor do tema e a ida e volta à home nas cinco larguras. Contra o build em produção, sem janela;
// só a parte aba abre o Chrome com janela, porque aba escondida não existe sem janela. As capturas vão para --saida.
//   node tools/testes/identidade.mjs [--url=http://localhost:4322] [--canal=msedge] [--partes=abertura,cartao,trailer,leituras,canais,cursor,volta,aba] [--saida=pasta]
import { spawn, execSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { chromium } from 'playwright';
import sharp from 'sharp';

const arg = (n, d) => (process.argv.find((a) => a.startsWith(`--${n}=`)) || `--${n}=${d}`).split('=').slice(1).join('=');
const URL_BASE = arg('url', 'http://localhost:4322').replace(/\/$/, '');
const CANAL = arg('canal', 'msedge');
const PARTES = arg('partes', 'abertura,cartao,trailer,leituras,canais,cursor,volta,aba').split(',');
const SAIDA = path.resolve(arg('saida', path.join(os.tmpdir(), 'fhdog-identidade')));
const RAIZ = path.resolve(import.meta.dirname, '../..');
const DIST = path.join(RAIZ, 'dist');
fs.mkdirSync(SAIDA, { recursive: true });

const UA = 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36';
const LARGURAS = [
  { nome: '320', opcoes: { viewport: { width: 320, height: 568 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2, userAgent: UA } },
  { nome: '390', opcoes: { viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2, userAgent: UA } },
  { nome: '820', opcoes: { viewport: { width: 820, height: 1180 }, hasTouch: true, isMobile: true, userAgent: UA } },
  { nome: '1440', opcoes: { viewport: { width: 1440, height: 900 } } },
  { nome: '1920', opcoes: { viewport: { width: 1920, height: 1080 } } },
];
const DESKTOP = { viewport: { width: 1440, height: 900 } };
const SESSAO = '/sessoes/bugonia-2025/';
const DUPLA = '/sessoes/ready-or-not-double-feature-2026/';

const dormir = (ms) => new Promise((r) => setTimeout(r, ms));
// Dois dias depois da última sessão cadastrada: o aviso aparece, e o teste não muda de resposta quando entrar uma sessão nova
const ULTIMA = fs.readdirSync(path.join(RAIZ, 'src/data/sessoes')).filter((f) => f.endsWith('.json') && !f.startsWith('_')).map((f) => JSON.parse(fs.readFileSync(path.join(RAIZ, 'src/data/sessoes', f), 'utf8')).sessao.data).sort().at(-1);
const SEM_SESSAO = new Date(new Date(`${ULTIMA}T12:00:00-03:00`).getTime() + 2 * 864e5);
const resultados = [];
function confere(nome, ok, detalhe = '') {
  resultados.push({ nome, ok });
  console.log(`${ok ? 'ok   ' : 'FALHA'} ${nome}${detalhe ? `  ${detalhe}` : ''}`);
}

const browser = await chromium.launch({ channel: CANAL, headless: true });

async function abrir(caminho, opcoes = DESKTOP, { semCookies = false, antes } = {}) {
  const ctx = await browser.newContext(opcoes);
  if (!semCookies) {
    await ctx.addCookies([
      { name: 'preloader_shown', value: String(Date.now() + 864e5 * 400), url: URL_BASE },
      { name: 'tutorial_shown', value: 'true', url: URL_BASE },
    ]);
  }
  const page = await ctx.newPage();
  page.erros = [];
  page.on('pageerror', (e) => page.erros.push(String(e)));
  page.on('console', (m) => { if (m.type() === 'error' && !/ERR_ABORTED|ERR_FAILED|Failed to load resource|Unable to preventDefault inside passive/.test(m.text())) page.erros.push(m.text()); }); // o aviso de passive vem do virtual-scroll do original
  if (antes) await antes(page, ctx);
  await page.goto(URL_BASE + caminho, { waitUntil: 'load', timeout: 120000 });
  return { ctx, page };
}
// Formas claras separadas sobre fundo escuro: duas letras que se tocam contam como uma. A caixa do texto não enxerga isso.
async function contarFormas(png) {
  const { data, info } = await sharp(png).greyscale().raw().toBuffer({ resolveWithObject: true });
  const { width: l, height: a, channels } = info;
  const claro = new Uint8Array(l * a);
  for (let i = 0; i < l * a; i++) claro[i] = data[i * channels] > 128 ? 1 : 0;
  let formas = 0;
  const pilha = [];
  for (let i = 0; i < l * a; i++) {
    if (!claro[i]) continue;
    claro[i] = 0;
    pilha.push(i);
    let area = 0;
    while (pilha.length) {
      const p = pilha.pop();
      area++;
      const x = p % l, y = (p - x) / l;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const nx = x + dx, ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= l || ny >= a) continue;
        const q = ny * l + nx;
        if (claro[q]) { claro[q] = 0; pilha.push(q); }
      }
    }
    if (area >= 8) formas++;
  }
  return formas;
}
const lerSlides = (page) => page.evaluate(() => [...document.querySelectorAll('[data-reviews="slide"]')].map((e) => e.getBoundingClientRect().left));
const medianaDe = (a, b) => { const d = a.map((x, i) => Math.abs(b[i] - x)).sort((p, q) => p - q); return d[d.length >> 1]; };
const pronta = (page) => page.waitForFunction(() => {
  const t = document.querySelector('[data-taxi]');
  if (!t) return false;
  const c = getComputedStyle(t);
  return c.visibility !== 'hidden' && +c.opacity > 0.9;
}, null, { timeout: 90000 });

// ------------------------------------------------------------------------------------------------ abertura
if (PARTES.includes('abertura')) {
  for (const { nome, opcoes } of LARGURAS) {
    const pedidos = [];
    const { ctx, page } = await abrir('/', opcoes, { semCookies: true, antes: (p) => p.on('request', (r) => pedidos.push(r.url())) });
    await dormir(1200);
    await page.screenshot({ path: path.join(SAIDA, `abertura-${nome}-meio.jpg`), type: 'jpeg', quality: 78 });
    await page.waitForFunction(() => { const b = document.querySelector('[data-preloader="btn"]'); return b && b.onclick && +getComputedStyle(b).opacity > 0.9; }, null, { timeout: 60000 });
    await page.screenshot({ path: path.join(SAIDA, `abertura-${nome}-enter.jpg`), type: 'jpeg', quality: 78 });
    const m = await page.evaluate(() => {
      const nomeEl = document.querySelector('.ab-nome');
      const r = document.createRange();
      r.selectNodeContents(nomeEl);
      const linhas = [...r.getClientRects()].filter((q) => q.width > 4);
      const caixa = { top: Math.min(...linhas.map((q) => q.top)), bottom: Math.max(...linhas.map((q) => q.bottom)), left: Math.min(...linhas.map((q) => q.left)), right: Math.max(...linhas.map((q) => q.right)) };
      const btn = [...document.querySelectorAll('[data-preloader="btn"] a, [data-preloader="btn"] button, [data-preloader="btn"] > *')].map((b) => b.getBoundingClientRect()).filter((q) => q.width > 0)[0];
      const cs = getComputedStyle(nomeEl);
      return { corpo: parseFloat(cs.fontSize), fonte: cs.fontFamily, carregada: document.fonts.check(`${cs.fontSize} "Sinal Display"`), caixa, btnTopo: btn ? btn.top : null, vw: innerWidth, vh: innerHeight, simbolo: document.querySelectorAll('.ab-simbolo, .ab-janela, .ab-dentro').length, texto: nomeEl.textContent.replace(/\s+/g, ' ').trim() };
    });
    confere(`abertura ${nome}: sem o símbolo`, m.simbolo === 0, `${m.simbolo} nós`);
    confere(`abertura ${nome}: nome completo, na fonte do tema`, /filmes hd online gr[áa]tis/i.test(m.texto) && m.carregada, `${m.texto}, ${m.fonte}`);
    confere(`abertura ${nome}: nome grande`, m.caixa.right - m.caixa.left >= m.vw * 0.5, `corpo ${m.corpo.toFixed(1)} px, ${Math.round(m.caixa.right - m.caixa.left)} de ${m.vw} px`);
    confere(`abertura ${nome}: nome inteiro na janela`, m.caixa.left >= 0 && m.caixa.right <= m.vw && m.caixa.top >= 0, JSON.stringify(m.caixa));
    // 20 letras e o acento do Á: nenhuma encosta na outra, nem o acento na linha de cima
    const png = await page.screenshot({ clip: { x: Math.max(0, m.caixa.left - 4), y: Math.max(0, m.caixa.top - 4), width: Math.min(m.vw, m.caixa.right + 4) - Math.max(0, m.caixa.left - 4), height: m.caixa.bottom - m.caixa.top + 8 } });
    const formas = await contarFormas(png);
    confere(`abertura ${nome}: nenhuma letra encosta na outra`, formas === 21, `${formas} formas, esperadas 21`);
    confere(`abertura ${nome}: nome não encosta no ENTRAR`, m.btnTopo !== null && m.caixa.bottom <= m.btnTopo, `nome até ${Math.round(m.caixa.bottom)}, botão em ${Math.round(m.btnTopo)}`);
    confere(`abertura ${nome}: a máscara grande do símbolo não é pedida`, !pedidos.some((u) => /simbolo-mascara\.webp/.test(u)));
    confere(`abertura ${nome}: console limpo`, !page.erros.length, page.erros.slice(0, 2).join(' | '));
    await ctx.close();
  }
  const { ctx, page } = await abrir('/', { ...DESKTOP, reducedMotion: 'reduce' }, { semCookies: true });
  await dormir(1500);
  const calma = await page.evaluate(() => {
    const ver = (s) => { const e = document.querySelector(s); return e ? getComputedStyle(e).display : null; };
    return { carta: ver('.ab-carta'), barras: ver('.ab-fora'), nome: +getComputedStyle(document.querySelector('.ab-nome')).opacity };
  });
  confere('abertura com movimento reduzido: só o nome, sobre preto', calma.carta === 'none' && calma.barras === 'none' && calma.nome > 0.9, JSON.stringify(calma));
  await page.screenshot({ path: path.join(SAIDA, 'abertura-movimento-reduzido.jpg'), type: 'jpeg', quality: 78 });
  await ctx.close();
}

// ------------------------------------------------------------------------------------------------ cartão
if (PARTES.includes('cartao')) {
  for (const [arq, l, a] of [['sem-sinal-1600', 1600, 900], ['sem-sinal-800', 800, 1200], ['sem-sinal-640', 640, 360], ['sem-sinal-160', 160, 110]]) {
    const { data, info } = await sharp(path.join(DIST, 'assets/img/site', `${arq}.webp`)).removeAlpha().raw().toBuffer({ resolveWithObject: true });
    // no meio da largura e a 45% da altura fica a barra verde; antes, o quadrado preto com a logo branca
    const x0 = Math.round(l * 0.45), x1 = Math.round(l * 0.55), y0 = Math.round(a * 0.2), y1 = Math.round(a * 0.6);
    let fora = 0, total = 0;
    for (let y = y0; y < y1; y += 2) for (let x = x0; x < x1; x += 2) {
      const o = (y * info.width + x) * info.channels;
      total++;
      if (!(data[o] < 60 && data[o + 1] > 140 && data[o + 2] < 60)) fora++;
    }
    confere(`cartão ${arq}: o centro é só a barra verde, sem o quadrado nem a logo`, fora / total < 0.02, `${fora} de ${total} pixels fora`);
  }
  for (const { nome, opcoes } of LARGURAS) {
    const { ctx, page } = await abrir('/', opcoes, { antes: (p) => p.clock.install({ time: SEM_SESSAO }) });
    await pronta(page);
    await dormir(4500);
    const noMeio = await page.evaluate(() => {
      const itens = [...document.querySelectorAll('[data-roll="item"]')];
      const d = itens.map((e) => { const b = e.getBoundingClientRect(); return Math.abs(b.top + b.height / 2 - innerHeight / 2); });
      const it = itens[d.indexOf(Math.min(...d))];
      return { aviso: !it.getAttribute('data-sessao'), imagem: it.querySelector('img').getAttribute('src'), selo: it.textContent.includes('Aguardando programação') };
    });
    confere(`cartão ${nome}: sem sessão futura, a home abre no aviso temático`, noMeio.aviso && noMeio.selo && /sem-sinal/.test(noMeio.imagem), JSON.stringify(noMeio));
    await page.screenshot({ path: path.join(SAIDA, `cartao-${nome}.jpg`), type: 'jpeg', quality: 78 });
    await ctx.close();
  }
}

// ------------------------------------------------------------------------------------------------ trailer
if (PARTES.includes('trailer')) {
  for (const { nome, opcoes } of LARGURAS) {
    const { ctx, page } = await abrir(DUPLA, opcoes);
    await pronta(page);
    await page.route(/youtube-nocookie\.com/, (r) => r.fulfill({ status: 200, contentType: 'text/html', body: '<!doctype html><title>player</title>' }));
    await page.evaluate(() => document.querySelector('[data-videoplayer="trigger"]').scrollIntoView({ block: 'center', behavior: 'instant' }));
    await dormir(1500);
    await page.evaluate(() => document.querySelector('[data-videoplayer="trigger"]').click());
    await page.waitForFunction(() => parseFloat(document.querySelector('[data-videoplayer="darken"]').style.opacity) >= 0.9, null, { timeout: 20000 });
    await dormir(400);
    const m = await page.evaluate(() => {
      const a = document.querySelector('[data-trailer-fora]');
      const x = document.querySelector('[data-videoplayer="close"]').getBoundingClientRect();
      const r = a.getBoundingClientRect();
      const noPonto = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
      const p = document.querySelector('iframe.yt-trailer').getBoundingClientRect();
      const cruza = !(r.right <= p.left || r.left >= p.right || r.bottom <= p.top || r.top >= p.bottom);
      return { texto: a.textContent.trim(), rotulo: a.getAttribute('aria-label'), href: a.href, alvo: a.target, rel: a.rel, acertavel: !!noPonto && noPonto.closest('[data-trailer-fora]') === a, tam: [Math.round(r.width), Math.round(r.height)], dentroDaJanela: r.left >= 0 && r.right <= innerWidth && r.top >= 0 && r.bottom <= innerHeight, noX: !(r.right <= x.left || r.left >= x.right || r.bottom <= x.top || r.top >= x.bottom), cruza, naPagina: document.body.textContent.includes('Não abriu') };
    });
    confere(`trailer ${nome}: saída sem texto visível, com nome acessível`, m.texto === '' && /abrir no YouTube/.test(m.rotulo) && !m.naPagina, m.rotulo);
    confere(`trailer ${nome}: saída alcançável, fora do player e do X`, m.acertavel && m.dentroDaJanela && !m.noX && !m.cruza, JSON.stringify({ tam: m.tam, janela: m.dentroDaJanela, noX: m.noX, cruza: m.cruza }));
    confere(`trailer ${nome}: alvo de pelo menos 40 px`, m.tam[0] >= 40 && m.tam[1] >= 40, m.tam.join('x'));
    const antes = m.href;
    await page.evaluate(() => document.querySelectorAll('[data-trailer]')[1].click());
    await dormir(300);
    const depois = await page.evaluate(() => { const a = document.querySelector('[data-trailer-fora]'); return { href: a.href, rotulo: a.getAttribute('aria-label'), filme: document.querySelectorAll('[data-trailer]')[1].dataset.trailer }; });
    confere(`trailer ${nome}: o segundo filme da sessão dupla troca o destino`, depois.href !== antes && depois.href.endsWith(depois.filme) && /A Viúva/.test(depois.rotulo), depois.rotulo);
    await page.screenshot({ path: path.join(SAIDA, `trailer-${nome}.jpg`), type: 'jpeg', quality: 78 });
    confere(`trailer ${nome}: console limpo`, !page.erros.length, page.erros.slice(0, 2).join(' | '));
    await ctx.close();
  }
}

// O ícone do YouTube pelo teclado: anel de foco, Escape com o foco nele e Enter abrindo o filme escolhido
if (PARTES.includes('trailer')) {
  for (const { nome, opcoes } of LARGURAS.filter((l) => ['1440', '1920'].includes(l.nome))) {
    const { ctx, page } = await abrir(DUPLA, opcoes);
    await pronta(page);
    await ctx.route(/youtube-nocookie\.com|youtube\.com\/watch/, (r) => r.fulfill({ status: 200, contentType: 'text/html', body: '<!doctype html><title>player</title>' }));
    const abrirPeloTeclado = async () => {
      await page.evaluate(() => { const g = document.querySelector('[data-videoplayer="trigger"]'); g.scrollIntoView({ block: 'center', behavior: 'instant' }); g.focus(); });
      await dormir(1500);
      await page.keyboard.press('Enter');
      await page.waitForFunction(() => parseFloat(document.querySelector('[data-videoplayer="darken"]').style.opacity) >= 0.9, null, { timeout: 20000 });
      await dormir(400);
    };
    const aoIcone = async () => {
      await page.evaluate(() => document.querySelector('[data-videoplayer="close"]').focus());
      await page.keyboard.press('Tab');
      await dormir(150);
      return page.evaluate(() => { const a = document.activeElement, c = getComputedStyle(a); return { noIcone: a.dataset.trailerFora !== undefined, visivel: a.matches(':focus-visible'), anel: c.outlineStyle !== 'none' && parseFloat(c.outlineWidth) > 0, rotulo: a.getAttribute('aria-label') }; });
    };
    const fechado = () => page.waitForFunction(() => !document.querySelector('[data-videoplayer="dialog"]').classList.contains('open') && !document.querySelector('iframe.yt-trailer') && document.activeElement === document.querySelector('[data-videoplayer="trigger"]'), null, { timeout: 15000 }).then(() => true, () => false);
    await abrirPeloTeclado();
    const f1 = await aoIcone();
    confere(`trailer ${nome}: o Tab depois do X para no ícone, com anel de foco`, f1.noIcone && f1.visivel && f1.anel, JSON.stringify(f1));
    await page.keyboard.press('Escape');
    confere(`trailer ${nome}: Escape com o foco no ícone fecha, e o foco volta ao gatilho`, await fechado());
    await dormir(1800);
    await abrirPeloTeclado();
    await page.evaluate(() => document.querySelectorAll('[data-trailer]')[1].click());
    await dormir(300);
    const f2 = await aoIcone();
    const segundo = await page.evaluate(() => document.querySelectorAll('[data-trailer]')[1].dataset.trailer);
    const [aba] = await Promise.all([ctx.waitForEvent('page', { timeout: 15000 }), page.keyboard.press('Enter')]);
    const destino = aba.url();
    await aba.close();
    await page.bringToFront();
    confere(`trailer ${nome}: Enter no ícone abre o segundo filme da sessão dupla`, f2.noIcone && destino.endsWith(segundo), destino);
    confere(`trailer ${nome}: depois do Enter, sem player, fechado e com o foco no gatilho`, await fechado());
    confere(`trailer ${nome}: console limpo no teclado`, !page.erros.length, page.erros.slice(0, 2).join(' | '));
    await ctx.close();
  }
}

// ------------------------------------------------------------------------------------------------ leituras
if (PARTES.includes('leituras')) {
  const trazer = async (page) => {
    await page.evaluate(() => document.querySelector('[data-reviews="wrapper"]').scrollIntoView({ block: 'center', behavior: 'instant' }));
    await dormir(800);
  };
  const andou = async (page, ms) => {
    const a = await lerSlides(page);
    await dormir(ms);
    const b = await lerSlides(page);
    // a mediana: o cartão que recicla no outro lado salta milhares de pixels, fora da tela
    const d = a.map((x, i) => Math.abs(b[i] - x)).sort((p, q) => p - q);
    return d[d.length >> 1];
  };
  {
    const { ctx, page } = await abrir(SESSAO);
    await pronta(page);
    confere('leituras: sem instrução de arrastar', !(await page.evaluate(() => /ARRASTE/i.test(document.body.textContent) || !!document.querySelector('.div-block-34'))));
    // fora da tela nada acumula
    const fora0 = await lerSlides(page);
    await dormir(3000);
    const fora1 = await lerSlides(page);
    confere('leituras: fora da tela, não anda', fora0[0] === fora1[0], `${fora0[0]} -> ${fora1[0]}`);
    await trazer(page);
    await dormir(1800); // a pausa de entrada
    const v = (await andou(page, 3000)) / 3;
    confere('leituras: anda sozinha, devagar e perceptível', v > 20 && v < 90, `${v.toFixed(1)} px/s`);
    // passo a passo: suave, sem salto
    const amostras = [];
    for (let i = 0; i < 16; i++) { amostras.push((await lerSlides(page))[0]); await dormir(150); }
    const passos = amostras.slice(1).map((x, i) => x - amostras[i]);
    confere('leituras: movimento suave, sempre no mesmo sentido', passos.every((p) => p <= 0.5 || Math.abs(p) > 1500) && Math.max(...passos.map(Math.abs).filter((p) => p < 1500)) < 40, passos.map((p) => p.toFixed(0)).join(' '));
    // arrasto assume na hora e a passagem espera
    const caixa = await page.evaluate(() => { const r = document.querySelector('[data-reviews="wrapper"]').getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; });
    await page.mouse.move(caixa.x, caixa.y);
    await page.mouse.down();
    await page.mouse.move(caixa.x - 40, caixa.y, { steps: 4 });
    await dormir(600);
    const preso = await andou(page, 1500);
    confere('leituras: segurando o arrasto, nada anda sozinho', preso < 3, `${preso.toFixed(1)} px`);
    const a0 = await lerSlides(page);
    await page.mouse.move(caixa.x - 240, caixa.y, { steps: 8 });
    await page.mouse.up();
    await dormir(800);
    const a1 = await lerSlides(page);
    confere('leituras: o arrasto continua movendo', a1[0] < a0[0] - 50, `${a0[0].toFixed(0)} -> ${a1[0].toFixed(0)}`);
    const espera = await andou(page, 1200);
    confere('leituras: logo depois de soltar, a passagem ainda espera', espera < 8, `${espera.toFixed(1)} px`);
    await dormir(2400);
    const volta = await andou(page, 2000);
    confere('leituras: depois, retoma sozinha', volta > 30, `${volta.toFixed(1)} px em 2 s`);
    // ponteiro parado sobre o cartão não segura a passagem; o movimento dele segura
    await page.mouse.move(caixa.x + 3, caixa.y + 3);
    await dormir(300);
    const comMovimento = await (async () => {
      const a = await lerSlides(page);
      for (let i = 0; i < 8; i++) { await page.mouse.move(caixa.x + i * 4, caixa.y); await dormir(200); }
      const b = await lerSlides(page);
      return Math.abs(b[0] - a[0]);
    })();
    confere('leituras: ponteiro em movimento na seção pausa', comMovimento < 12, `${comMovimento.toFixed(1)} px em 1,6 s`);
    await dormir(4200);
    const parado = await andou(page, 2000);
    confere('leituras: ponteiro parado não segura a passagem', parado > 30, `${parado.toFixed(1)} px em 2 s`);
    // setas
    await page.mouse.move(40, 40);
    await page.evaluate(() => document.querySelector('[data-reviews="prevnext"]').scrollIntoView({ block: 'center', behavior: 'instant' }));
    await dormir(500);
    const s0 = await lerSlides(page);
    await page.click('[data-reviews="prevnext"] button >> nth=1');
    await dormir(1700);
    const s1 = await lerSlides(page);
    confere('leituras: a seta troca de nota', s1[0] !== s0[0], `${s0[0].toFixed(0)} -> ${s1[0].toFixed(0)}`);
    await page.mouse.move(40, 40);
    const aposSeta = await andou(page, 2000);
    confere('leituras: depois da seta, a passagem espera', aposSeta < 8, `${aposSeta.toFixed(1)} px`);
    // foco de teclado
    await dormir(4000);
    await page.evaluate(() => document.querySelector('[data-reviews="prevnext"] button').focus({ focusVisible: true }));
    await dormir(400);
    const focoVisivel = await page.evaluate(() => document.activeElement.matches(':focus-visible'));
    await dormir(600);
    const comFoco = await andou(page, 3500);
    confere('leituras: com foco de teclado nas setas, não anda', focoVisivel && comFoco < 3, `${comFoco.toFixed(1)} px`);
    await page.evaluate(() => document.activeElement.blur());
    await dormir(3400);
    const semFoco = await andou(page, 2000);
    confere('leituras: sem o foco, retoma', semFoco > 30, `${semFoco.toFixed(1)} px`);
    // ciclo inteiro: nenhum cartão salta dentro da janela, e a barra percorre tudo
    const vw = 1440;
    const inicio = await page.evaluate(() => document.querySelector('[data-reviews="progress"]').style.transform);
    let salto = null, maxBarra = 0, minBarra = 1e9;
    let ant = await lerSlides(page);
    for (let i = 0; i < 80; i++) {
      await dormir(1000);
      const agora = await lerSlides(page);
      agora.forEach((x, k) => {
        const aparece = (p) => p + 544 > 0 && p < vw;
        if (Math.abs(x - ant[k]) > 300 && (aparece(x) || aparece(ant[k]))) salto = salto || { k, de: ant[k], para: x };
      });
      ant = agora;
      const b = await page.evaluate(() => parseFloat(/translateX\(([-\d.]+)%\)/.exec(document.querySelector('[data-reviews="progress"]').style.transform)?.[1] ?? '0'));
      maxBarra = Math.max(maxBarra, b);
      minBarra = Math.min(minBarra, b);
    }
    confere('leituras: no ciclo inteiro, nenhum cartão salta na tela', !salto, salto ? JSON.stringify(salto) : '80 s');
    confere('leituras: a barra percorre o ciclo e recomeça', maxBarra > 420 && minBarra < 80, `${minBarra.toFixed(0)}% a ${maxBarra.toFixed(0)}%, começou em ${inicio}`);
    const antesCopia = await page.evaluate(() => { const c = getComputedStyle(document.querySelector('[data-reviews="progress"]'), '::before'); return { conteudo: c.content, fundo: c.backgroundColor }; });
    confere('leituras: a cópia da barra existe, para a volta não saltar', antesCopia.conteudo !== 'none', JSON.stringify(antesCopia));
    await page.evaluate(() => document.querySelector('[data-reviews="wrapper"]').scrollIntoView({ block: 'center', behavior: 'instant' }));
    await dormir(600);
    await page.screenshot({ path: path.join(SAIDA, 'leituras-1440.jpg'), type: 'jpeg', quality: 78 });
    // troca de página pelo Taxi: uma só soma, na mesma velocidade
    const v0 = (await andou(page, 3000)) / 3;
    const ir = (s) => page.evaluate((h) => { const a = document.querySelector(`a[href="${h}"]`); if (!a) throw new Error(`sem ${h}`); a.click(); }, s);
    await ir('/sessoes/the-lobster-2015/');
    await page.waitForFunction(() => location.pathname === '/sessoes/the-lobster-2015/');
    await pronta(page);
    await dormir(800);
    await ir(SESSAO);
    await page.waitForFunction((s) => location.pathname === s, SESSAO);
    await pronta(page);
    await trazer(page);
    await dormir(2400);
    const v1 = (await andou(page, 3000)) / 3;
    confere('leituras: trocar de página não duplica a velocidade', v1 > v0 * 0.6 && v1 < v0 * 1.4, `${v0.toFixed(1)} -> ${v1.toFixed(1)} px/s`);
    confere('leituras: console limpo', !page.erros.length, page.erros.slice(0, 2).join(' | '));
    await ctx.close();
  }
  {
    const { ctx, page } = await abrir(SESSAO, { ...DESKTOP, reducedMotion: 'reduce' });
    await pronta(page);
    await trazer(page);
    await dormir(2500);
    const parado = await andou(page, 3000);
    confere('leituras: com movimento reduzido, fica na mão', parado < 1, `${parado.toFixed(1)} px`);
    const s0 = await lerSlides(page);
    await page.evaluate(() => document.querySelector('[data-reviews="prevnext"]').scrollIntoView({ block: 'center', behavior: 'instant' }));
    await dormir(300);
    await page.click('[data-reviews="prevnext"] button >> nth=1');
    await dormir(1500);
    confere('leituras: com movimento reduzido, as setas funcionam', (await lerSlides(page))[0] !== s0[0]);
    await ctx.close();
  }
  for (const { nome, opcoes } of LARGURAS.filter((l) => ['320', '390'].includes(l.nome))) {
    const { ctx, page } = await abrir(SESSAO, opcoes);
    await pronta(page);
    await trazer(page);
    const antes = await lerSlides(page);
    const passos = new Set();
    await page.screenshot({ path: path.join(SAIDA, `leituras-${nome}.jpg`), type: 'jpeg', quality: 78 });
    let ant = antes;
    for (let i = 0; i < 26; i++) {
      await dormir(500);
      const agora = await lerSlides(page);
      if (Math.abs(agora[0] - ant[0]) > 3 && Math.abs(agora[0] - ant[0]) < 2000) passos.add(i);
      ant = agora;
    }
    const w = opcoes.viewport.width;
    const dist = Math.abs(ant[0] - antes[0]);
    confere(`leituras ${nome}: no telefone, anda um cartão de cada vez e espera`, dist > w * 0.9 && passos.size <= 10, `${dist.toFixed(0)} px, em movimento em ${passos.size} de 26 leituras`);
    confere(`leituras ${nome}: console limpo`, !page.erros.length, page.erros.slice(0, 2).join(' | '));
    await ctx.close();
  }
  for (const { nome, opcoes } of LARGURAS.filter((l) => ['820', '1920'].includes(l.nome))) {
    const { ctx, page } = await abrir(SESSAO, opcoes);
    await pronta(page);
    await trazer(page);
    await dormir(1800);
    const w = opcoes.viewport.width;
    let ant = await lerSlides(page), salto = null, moveu = 0;
    for (let i = 0; i < 30; i++) {
      await dormir(500);
      const agora = await lerSlides(page);
      if (medianaDe(ant, agora) > 3) moveu++;
      const ve = (p) => p < w && p > -w * 0.5;
      agora.forEach((x, k) => { if (Math.abs(x - ant[k]) > w * 1.2 && ve(x) && ve(ant[k])) salto = salto || { k, de: ant[k], para: x }; });
      ant = agora;
    }
    confere(`leituras ${nome}: anda sozinha, sem cartão saltando na tela`, moveu > 0 && !salto, `em movimento em ${moveu} de 30 leituras${salto ? `, salto ${JSON.stringify(salto)}` : ''}`);
    const barra = await page.evaluate(() => /translateX\(([-\d.]+)%\)/.exec(document.querySelector('[data-reviews="progress"]').style.transform)?.[1] ?? null);
    confere(`leituras ${nome}: a barra acompanha`, barra !== null, `${barra}%`);
    await page.screenshot({ path: path.join(SAIDA, `leituras-${nome}.jpg`), type: 'jpeg', quality: 78 });
    confere(`leituras ${nome}: console limpo`, !page.erros.length, page.erros.slice(0, 2).join(' | '));
    await ctx.close();
  }
  // No toque, com a passagem ligada: o dedo assume, e a seta dá mais tempo
  for (const { nome, opcoes } of LARGURAS.filter((l) => ['320', '390', '820'].includes(l.nome))) {
    const { ctx, page } = await abrir(SESSAO, opcoes);
    const cdp = await ctx.newCDPSession(page);
    await pronta(page);
    await trazer(page);
    await dormir(1800);
    const c = await page.evaluate(() => { const r = document.querySelector('[data-reviews="wrapper"]').getBoundingClientRect(); return { x: innerWidth * 0.75, y: Math.max(20, Math.min(innerHeight - 20, r.top + r.height / 2)) }; });
    const dedo = (type, touchPoints) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints });
    await dedo('touchStart', [{ x: c.x, y: c.y }]);
    for (let i = 1; i <= 4; i++) { await dedo('touchMove', [{ x: c.x - i * 10, y: c.y }]); await dormir(30); }
    await dormir(700);
    const preso = await andou(page, 1500);
    const a0 = await lerSlides(page);
    for (let i = 5; i <= 14; i++) { await dedo('touchMove', [{ x: c.x - i * 10, y: c.y }]); await dormir(30); }
    await dormir(400);
    const a1 = await lerSlides(page);
    await dedo('touchEnd', []);
    confere(`leituras ${nome}: com o dedo parado no cartão, nada anda sozinho`, preso < 3, `${preso.toFixed(1)} px`);
    confere(`leituras ${nome}: o cartão acompanha o dedo`, medianaDe(a0, a1) > 20, `${medianaDe(a0, a1).toFixed(0)} px`);
    await dormir(1100);
    const espera = await andou(page, 1200);
    confere(`leituras ${nome}: logo depois de soltar, a passagem espera`, espera < 8, `${espera.toFixed(1)} px`);
    await dormir(9000);
    await page.evaluate(() => document.querySelector('[data-reviews="prevnext"]').scrollIntoView({ block: 'center', behavior: 'instant' }));
    await dormir(500);
    const seta = await page.evaluate(() => { const b = document.querySelectorAll('[data-reviews="prevnext"] button')[1]; const r = b.getBoundingClientRect(); return r.width > 0 && r.height > 0 ? { x: r.left + r.width / 2, y: r.top + r.height / 2 } : null; });
    confere(`leituras ${nome}: as setas estão à mão`, !!seta, JSON.stringify(seta));
    if (seta) {
      const s0 = await lerSlides(page);
      await page.touchscreen.tap(seta.x, seta.y);
      await dormir(1700);
      const s1 = await lerSlides(page);
      confere(`leituras ${nome}: tocar na seta troca de nota`, medianaDe(s0, s1) > 5, `${medianaDe(s0, s1).toFixed(0)} px`);
      const aposSeta = await andou(page, 2000);
      confere(`leituras ${nome}: depois da seta, a passagem espera`, aposSeta < 8, `${aposSeta.toFixed(1)} px`);
    }
    confere(`leituras ${nome}: console limpo no toque`, !page.erros.length, page.erros.slice(0, 2).join(' | '));
    await ctx.close();
  }
}

// ------------------------------------------------------------------------------------------------ canais
if (PARTES.includes('canais')) {
  const paginas = [];
  const andar = (d) => { for (const n of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, n.name); if (n.isDirectory()) andar(p); else paginas.push(p); } };
  andar(DIST);
  const comSteam = paginas.filter((f) => /steam/i.test(path.basename(f)) || (/\.(html|xml|json|txt|css|js|svg|webmanifest)$/.test(f) && /steam/i.test(fs.readFileSync(f, 'utf8'))));
  confere('canais: nenhuma menção à Steam no build', !comSteam.length, comSteam.slice(0, 4).map((f) => path.relative(DIST, f)).join(', '));
  const sobre = fs.readFileSync(path.join(DIST, 'sobre/index.html'), 'utf8');
  confere('canais: X nos dados estruturados', /"sameAs":\[[^\]]*https:\/\/x\.com\/FilmesHDOG/.test(sobre));
  confere('canais: o ícone do X existe', fs.existsSync(path.join(DIST, 'assets/img/site/social-x.svg')));
  for (const [nome, cam] of [['home', '/'], ['sessão', SESSAO], ['Sobre', '/sobre/'], ['Contato', '/contato/'], ['Termos', '/termos/']]) {
    const { ctx, page } = await abrir(cam);
    const links = await page.evaluate(() => [...document.querySelectorAll('a[href*="x.com"]')].map((a) => ({ href: a.href, alvo: a.target, rel: a.rel, rotulo: a.getAttribute('aria-label') || a.textContent.trim(), svg: !!a.querySelector('svg') })));
    confere(`canais ${nome}: link para a conta no X`, links.length > 0 && links.every((l) => l.href === 'https://x.com/FilmesHDOG' && l.alvo === '_blank' && /noopener/.test(l.rel)), JSON.stringify(links[0] || null));
    await ctx.close();
  }
  const { ctx, page } = await abrir(SESSAO);
  await pronta(page);
  await page.evaluate(() => document.querySelector('footer, .s.footer')?.scrollIntoView({ block: 'end', behavior: 'instant' }));
  await dormir(1500);
  await page.screenshot({ path: path.join(SAIDA, 'canais-rodape.jpg'), type: 'jpeg', quality: 78 });
  await ctx.close();
  // Nas cinco larguras, no rodapé e no menu: o link à vista, com o ícone, e o clique ou o toque abrindo a conta. A conta não é pedida de verdade.
  for (const { nome, opcoes } of LARGURAS) {
    const { ctx, page } = await abrir(SESSAO, opcoes);
    await pronta(page);
    await ctx.route(/x\.com/, (r) => r.fulfill({ status: 200, contentType: 'text/html', body: '<!doctype html><title>x</title>' }));
    const tocar = (p) => (opcoes.hasTouch ? page.touchscreen.tap(p.x, p.y) : page.mouse.click(p.x, p.y));
    const medir = (noMenu) => page.evaluate((m) => {
      const a = [...document.querySelectorAll('a[href="https://x.com/FilmesHDOG"]')].find((e) => !!e.closest('[data-menu="w"]') === m);
      if (!a) return null;
      const r = a.getBoundingClientRect(), s = a.querySelector('svg')?.getBoundingClientRect();
      const x = r.left + r.width / 2, y = r.top + r.height / 2;
      const topo = document.elementFromPoint(x, y);
      return { x, y, alvo: a.target, rel: a.rel, rotulo: a.getAttribute('aria-label') || a.textContent.trim(), naTela: r.top >= 0 && r.bottom <= innerHeight && r.left >= 0 && r.right <= innerWidth, acertavel: !!topo && a.contains(topo), icone: s ? [Math.round(s.width), Math.round(s.height)] : null };
    }, noMenu);
    const conferir = async (onde, m) => {
      confere(`canais ${nome}, ${onde}: link do X à vista, com ícone`, !!m && m.alvo === '_blank' && /noopener/.test(m.rel) && m.naTela && m.acertavel && m.icone?.[0] >= 8, JSON.stringify(m));
      if (!m?.acertavel) return;
      const [aba] = await Promise.all([ctx.waitForEvent('page', { timeout: 15000 }), tocar(m)]);
      const destino = aba.url();
      await aba.close();
      await page.bringToFront();
      confere(`canais ${nome}, ${onde}: abre a conta`, destino === 'https://x.com/FilmesHDOG', destino);
    };
    await page.evaluate(() => [...document.querySelectorAll('a[href="https://x.com/FilmesHDOG"]')].find((e) => !e.closest('[data-menu="w"]')).scrollIntoView({ block: 'center', behavior: 'instant' }));
    await dormir(1800);
    await page.screenshot({ path: path.join(SAIDA, `canais-${nome}.jpg`), type: 'jpeg', quality: 78 });
    await conferir('rodapé', await medir(false));
    await page.evaluate(() => document.getElementById('mainpanel').parentElement.click());
    await page.waitForFunction(() => document.getElementById('mainpanel').checked, null, { timeout: 10000 });
    await dormir(1600);
    await conferir('menu', await medir(true));
    await ctx.close();
  }
  const legal = fs.readFileSync(path.join(DIST, 'privacidade/index.html'), 'utf8');
  confere('canais: texto legal cita o X', /Discord, YouTube, X e GitHub/.test(legal));
}

// ------------------------------------------------------------------------------------------------ cursor
if (PARTES.includes('cursor')) {
  const fonte = fs.readFileSync(path.join(RAIZ, 'public/assets/js/local-cursor.js'), 'utf8');
  const leituras = /getBoundingClientRect|getComputedStyle|elementFromPoint|offset(Top|Left|Width|Height)|client(Width|Height)|scroll(Top|Left|Width|Height)\b/.exec(fonte);
  confere('cursor: nenhuma leitura de layout no script', !leituras, leituras?.[0] || '');
  const lerCursor = (page) => page.evaluate(() => {
    const n = document.querySelector('.cursor-sinal-no');
    if (!n) return { existe: false, classe: document.documentElement.classList.contains('cursor-sinal') };
    const p = n.querySelector('.cs-ponto').getBoundingClientRect();
    return { existe: true, classe: document.documentElement.classList.contains('cursor-sinal'), visivel: n.classList.contains('visivel') && getComputedStyle(n).display !== 'none', estado: n.dataset.mira, x: Math.round(p.x), y: Math.round(p.y), bloqueia: getComputedStyle(n).pointerEvents !== 'none', quantos: document.querySelectorAll('.cursor-sinal-no').length, antigo: getComputedStyle(document.querySelector('.cursor-w-out') || document.body).display };
  });
  const naHora = async (page, x, y) => { await page.mouse.move(x, y, { steps: 3 }); await dormir(120); return lerCursor(page); };
  const centro = (page, s) => page.evaluate((q) => { const v = [...document.querySelectorAll(q)].filter((e) => { const r = e.getBoundingClientRect(); return r.width > 2 && r.height > 2 && r.top >= 0 && r.bottom <= innerHeight && r.left >= 0 && r.right <= innerWidth; }); const r = v[0]?.getBoundingClientRect(); return r ? { x: r.left + r.width / 2, y: r.top + r.height / 2 } : null; }, s);
  const foto = async (page, nome, x, y) => {
    const clip = { x: Math.max(0, x - 110), y: Math.max(0, y - 110), width: 220, height: 220 };
    await dormir(350);
    await page.screenshot({ path: path.join(SAIDA, `cursor-${nome}.png`), clip });
  };
  {
    const { ctx, page } = await abrir('/');
    await pronta(page);
    await dormir(4500);
    const antesDeMover = await lerCursor(page);
    confere('cursor: nada antes do primeiro movimento de mouse', !antesDeMover.existe && !antesDeMover.classe);
    const p = await naHora(page, 720, 420);
    confere('cursor: nasce no primeiro movimento, um só, e o antigo some', p.existe && p.classe && p.visivel && p.quantos === 1 && p.antigo === 'none', JSON.stringify(p));
    confere('cursor: o ponto está exatamente sob o mouse', Math.abs(p.x - 720) <= 3 && Math.abs(p.y - 420) <= 3, `${p.x},${p.y}`);
    confere('cursor: não intercepta o ponteiro', !p.bloqueia);
    confere('cursor: arrasto vertical no rolo da home', p.estado === 'arrasto-v', p.estado);
    await foto(page, 'arrasto-home', 720, 420);
    const c = await centro(page, '[data-roll="item"] [data-hide="mobile"] a.explore-w');
    if (c) {
      const l = await naHora(page, c.x, c.y);
      confere('cursor: link no EXPLORAR', l.estado === 'link', l.estado);
      await foto(page, 'link', c.x, c.y);
    } else confere('cursor: EXPLORAR à vista', false);
    const cima = await centro(page, '[data-hitbox]');
    if (cima) {
      const h = await naHora(page, cima.x, cima.y);
      confere('cursor: seta na área de anterior e próximo', ['cima', 'baixo'].includes(h.estado), h.estado);
      await foto(page, 'seta', cima.x, cima.y);
      const i0 = await page.evaluate(() => { const it = [...document.querySelectorAll('[data-roll="item"]')]; const d = it.map((e) => Math.abs(e.getBoundingClientRect().top)); return d.indexOf(Math.min(...d)); });
      await page.mouse.click(cima.x, cima.y);
      await dormir(1700);
      const i1 = await page.evaluate(() => { const it = [...document.querySelectorAll('[data-roll="item"]')]; const d = it.map((e) => Math.abs(e.getBoundingClientRect().top)); return d.indexOf(Math.min(...d)); });
      confere('cursor: o clique nessa área continua trocando de filme', i1 !== i0, `${i0} -> ${i1}`);
    } else confere('cursor: área de anterior e próximo à vista', false);
    // arrasto: fica no estado até soltar, mesmo passando sobre um link
    await page.mouse.move(720, 420);
    await dormir(150);
    await page.mouse.down();
    await dormir(350);
    const ap = await page.evaluate(() => document.querySelector('.cursor-sinal-no').classList.contains('apertado'));
    await foto(page, 'arrasto-apertado', 720, 420);
    await page.mouse.up();
    confere('cursor: apertar marca o arrasto', ap);
    // sair da janela e voltar
    await page.evaluate(() => document.documentElement.dispatchEvent(new MouseEvent('mouseleave')));
    const saiu = await lerCursor(page);
    await naHora(page, 700, 400);
    const voltou = await lerCursor(page);
    confere('cursor: some ao sair da janela e volta com o mouse', !saiu.visivel && voltou.visivel, `${saiu.visivel} -> ${voltou.visivel}`);
    // navegação real pelo cursor: o clique atravessa
    const noCentro = () => page.evaluate(() => {
      const it = [...document.querySelectorAll('[data-roll="item"]')];
      const d = it.map((x) => { const b = x.getBoundingClientRect(); return Math.abs(b.top + b.height / 2 - innerHeight / 2); });
      const m = it[d.indexOf(Math.min(...d))];
      if (!m.getAttribute('data-sessao')) return null;
      const r = m.querySelector('[data-hide="mobile"] a.explore-w').getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    });
    let e = await noCentro();
    for (let k = 0; k < 4 && !e; k++) { await page.keyboard.press('ArrowDown'); await dormir(1700); e = await noCentro(); }
    await page.mouse.move(e.x, e.y);
    await page.mouse.click(e.x, e.y);
    await page.waitForFunction(() => location.pathname.startsWith('/sessoes/'), null, { timeout: 15000 });
    await pronta(page);
    await dormir(600);
    const naSessao = await naHora(page, 720, 500);
    confere('cursor: o clique atravessa, e o cursor continua depois da troca de página', naSessao.visivel && naSessao.quantos === 1, JSON.stringify(naSessao));
    confere('cursor: console limpo na home', !page.erros.length, page.erros.slice(0, 2).join(' | '));
    await ctx.close();
  }
  {
    const { ctx, page } = await abrir('/programacao/');
    await pronta(page);
    await dormir(4500);
    const p = await naHora(page, 720, 450);
    confere('cursor: arrasto horizontal na Programação', p.estado === 'arrasto-h', p.estado);
    await foto(page, 'arrasto-programacao', 720, 450);
    const c = await centro(page, '[data-hitbox]');
    if (c) { const h = await naHora(page, c.x, c.y); confere('cursor: seta nas laterais da Programação', ['esquerda', 'direita'].includes(h.estado), h.estado); await foto(page, 'seta-programacao', c.x, c.y); }
    // campo de texto: o cursor do sistema, e nada de cursor nenhum
    await page.mouse.move(1000, 100);
    await page.evaluate(() => document.querySelector('#smallpanel').parentElement.click());
    await dormir(1300);
    const f = await centro(page, 'textarea.menu-filtro');
    if (f) {
      const t = await naHora(page, f.x, f.y);
      const nativo = await page.evaluate(() => getComputedStyle(document.querySelector('textarea.menu-filtro')).cursor);
      confere('cursor: no campo do filtro, a mira sai e fica o cursor de texto', t.estado === 'texto' && !t.visivel && nativo === 'text', JSON.stringify({ estado: t.estado, visivel: t.visivel, nativo }));
    } else confere('cursor: filtro à vista', false);
    await ctx.close();
  }
  {
    const { ctx, page } = await abrir(SESSAO);
    await pronta(page);
    await page.route(/youtube-nocookie\.com/, (r) => r.fulfill({ status: 200, contentType: 'text/html', body: '<!doctype html><title>player</title>' }));
    await page.evaluate(() => document.querySelector('[data-reviews="wrapper"]').scrollIntoView({ block: 'center', behavior: 'instant' }));
    await dormir(1200);
    const r = await naHora(page, 720, 450);
    confere('cursor: arrasto nas leituras', r.estado === 'arrasto-h', r.estado);
    await foto(page, 'arrasto-leituras', 720, 450);
    await page.evaluate(() => document.querySelector('[data-videoplayer="trigger"]').scrollIntoView({ block: 'center', behavior: 'instant' }));
    await dormir(1200);
    const t = await centro(page, '[data-videoplayer="trigger"]');
    const pl = await naHora(page, t.x, t.y);
    confere('cursor: play no gatilho do trailer', pl.estado === 'play', pl.estado);
    await foto(page, 'play', t.x, t.y);
    await page.mouse.click(t.x, t.y);
    await page.waitForFunction(() => parseFloat(document.querySelector('[data-videoplayer="darken"]').style.opacity) >= 0.9, null, { timeout: 20000 });
    await dormir(400);
    const aberto = await page.evaluate(() => {
      const n = document.querySelector('.cursor-sinal-no');
      return { classe: document.documentElement.classList.contains('trailer-aberto'), no: getComputedStyle(n).display, x: getComputedStyle(document.querySelector('[data-videoplayer="close"]')).cursor, iframe: !!document.querySelector('iframe.yt-trailer') };
    });
    confere('cursor: com o trailer aberto, volta o do sistema', aberto.classe && aberto.no === 'none' && aberto.x !== 'none' && aberto.iframe, JSON.stringify(aberto));
    await page.keyboard.press('Escape');
    await page.waitForFunction(() => !document.querySelector('[data-videoplayer="dialog"]').classList.contains('open'), null, { timeout: 15000 });
    await dormir(200);
    const fechado = await naHora(page, 400, 300);
    confere('cursor: ao fechar o trailer, o do tema volta', fechado.visivel && !(await page.evaluate(() => document.documentElement.classList.contains('trailer-aberto'))), JSON.stringify(fechado));
    await ctx.close();
  }
  {
    const { ctx, page } = await abrir('/termos/');
    await pronta(page);
    await dormir(800);
    const c = await centro(page, '.policy-rich-tx p');
    const p0 = await naHora(page, c.x, c.y);
    confere('cursor: mira parada no texto, sem o rótulo de arrasto', p0.estado === 'padrao', p0.estado);
    await foto(page, 'padrao', c.x, c.y);
    // A seleção não anda no site, nem antes do cursor (herdado, FASE2.md). O que cabe ao cursor é não ficar na frente do texto.
    const sob = await page.evaluate(([x, y]) => document.elementFromPoint(x, y).tagName, [c.x, c.y]);
    confere('cursor: não fica na frente do texto', sob === 'P', sob);
    await ctx.close();
  }
  {
    const { ctx, page } = await abrir('/');
    await pronta(page);
    await dormir(4500);
    await page.mouse.move(700, 400);
    await dormir(150);
    await page.keyboard.press('Tab');
    const foco = await page.evaluate(() => document.activeElement.tagName);
    confere('cursor: o foco de teclado não muda', foco !== 'BODY', foco);
    await ctx.close();
  }
  for (const [rotulo, opcoes] of [['toque', LARGURAS[1].opcoes], ['movimento reduzido', { ...DESKTOP, reducedMotion: 'reduce' }], ['cores forçadas', { ...DESKTOP, forcedColors: 'active' }], ['contraste maior', { ...DESKTOP, contrast: 'more' }]]) {
    const { ctx, page } = await abrir('/', opcoes);
    await pronta(page);
    await dormir(2500);
    await page.mouse.move(180, 300, { steps: 3 });
    await dormir(300);
    const c = await lerCursor(page);
    const nativo = await page.evaluate(() => getComputedStyle(document.body).cursor);
    confere(`cursor: desligado com ${rotulo}`, !c.classe && (!c.existe || !c.visivel) && nativo !== 'none', JSON.stringify({ ...c, nativo }));
    await ctx.close();
  }
  {
    // Onde o app.js escondia o cursor antigo, a mira fica sem rótulo de arrasto
    const { ctx, page } = await abrir('/programacao/');
    await pronta(page);
    await dormir(4500);
    const c = await centro(page, '.work-edge.bottom');
    if (c) {
      const h = await naHora(page, c.x, c.y);
      const sob = await page.evaluate(([x, y]) => !!document.elementFromPoint(x, y)?.closest('[data-cursor="hide"]'), [c.x, c.y]);
      confere('cursor: em [data-cursor="hide"], sem o rótulo de arrasto', sob && h.estado === 'padrao', JSON.stringify({ sob, estado: h.estado }));
    } else confere('cursor: faixa de baixo da Programação à vista', false);
    await ctx.close();
  }
  {
    const { ctx, page } = await abrir('/', LARGURAS[4].opcoes);
    await pronta(page);
    await dormir(4500);
    const p = await naHora(page, 960, 540);
    confere('cursor 1920: nasce um só, sob o mouse, e arrasta no rolo', p.quantos === 1 && Math.abs(p.x - 960) <= 3 && Math.abs(p.y - 540) <= 3 && p.estado === 'arrasto-v', JSON.stringify(p));
    const c = await centro(page, '[data-roll="item"] [data-hide="mobile"] a.explore-w');
    const l = c ? await naHora(page, c.x, c.y) : null;
    confere('cursor 1920: link no EXPLORAR', l?.estado === 'link', l?.estado);
    const h = await centro(page, '[data-hitbox]');
    const a = h ? await naHora(page, h.x, h.y) : null;
    confere('cursor 1920: seta na área de anterior e próximo', ['cima', 'baixo'].includes(a?.estado), a?.estado);
    confere('cursor 1920: console limpo', !page.erros.length, page.erros.slice(0, 2).join(' | '));
    await ctx.close();
  }
  // folha com os estados
  const estados = ['padrao', 'arrasto-home', 'link', 'seta', 'arrasto-apertado', 'arrasto-programacao', 'seta-programacao', 'arrasto-leituras', 'play'].filter((n) => fs.existsSync(path.join(SAIDA, `cursor-${n}.png`)));
  const blocos = await Promise.all(estados.map(async (n, i) => {
    const legenda = Buffer.from(`<svg width="440" height="30"><rect width="100%" height="100%" fill="#000"/><text x="8" y="21" font-family="monospace" font-size="18" fill="#fff">${n}</text></svg>`);
    const img = await sharp(path.join(SAIDA, `cursor-${n}.png`)).resize(440, 440, { kernel: 'nearest' }).composite([{ input: legenda, top: 0, left: 0 }]).png().toBuffer();
    return { input: img, left: (i % 4) * 444, top: Math.floor(i / 4) * 444 };
  }));
  await sharp({ create: { width: 4 * 444, height: Math.ceil(blocos.length / 4) * 444, channels: 3, background: '#222' } }).composite(blocos).jpeg({ quality: 88 }).toFile(path.join(SAIDA, 'cursor-estados.jpg'));
}

// ------------------------------------------------------------------------------------------------ ida e volta à home
if (PARTES.includes('volta')) {
  const alvo = (page, s) => page.evaluate((q) => {
    for (const e of document.querySelectorAll(q)) {
      const r = e.getBoundingClientRect();
      if (r.width < 2 || r.height < 2 || r.left < 0 || r.right > innerWidth || r.top < 0 || r.bottom > innerHeight) continue;
      const x = r.left + r.width / 2, y = r.top + r.height / 2;
      const t = document.elementFromPoint(x, y);
      if (t && (t === e || e.contains(t))) return { x, y, href: e.getAttribute('href') };
    }
    return null;
  }, s);
  const noCentro = (page) => page.evaluate(() => {
    const it = [...document.querySelectorAll('[data-roll="item"]')];
    const d = it.map((e) => { const b = e.getBoundingClientRect(); return Math.abs(b.top + b.height / 2 - innerHeight / 2); });
    const m = it[d.indexOf(Math.min(...d))];
    return m ? m.getAttribute('data-sessao') || 'aviso' : null;
  });
  for (const { nome, opcoes } of LARGURAS) {
    const toque = !!opcoes.hasTouch;
    // uma data com sessão à frente: o primeiro item é um filme, e o EXPLORAR leva à página dele
    const { ctx, page } = await abrir('/', opcoes, { antes: (p) => p.clock.install({ time: new Date('2026-07-01T12:00:00-03:00') }) });
    const cdp = await ctx.newCDPSession(page);
    const tocar = (p) => (toque ? page.touchscreen.tap(p.x, p.y) : page.mouse.click(p.x, p.y));
    await pronta(page);
    await dormir(4500);
    for (let viagem = 1; viagem <= 2; viagem++) {
      const e = await alvo(page, '[data-roll="item"] a.explore-w');
      confere(`volta ${nome}, viagem ${viagem}: EXPLORAR à mão`, !!e, e?.href);
      if (!e) break;
      await tocar(e);
      const foi = await page.waitForFunction((h) => location.pathname === h, e.href, { timeout: 30000 }).then(() => true, () => false);
      await pronta(page);
      await dormir(800);
      const na = await page.evaluate(() => ({ titulo: document.querySelector('.cs-title')?.textContent.trim().slice(0, 30) || null }));
      confere(`volta ${nome}, viagem ${viagem}: chega à sessão`, foi && !!na.titulo, `${e.href} ${na.titulo}`);
      const l = await alvo(page, 'a.nav-link.logo');
      confere(`volta ${nome}, viagem ${viagem}: logo à mão na sessão`, !!l);
      if (!l) break;
      const t0 = Date.now();
      await tocar(l);
      const voltou = await page.waitForFunction(() => location.pathname === '/', null, { timeout: 30000 }).then(() => true, () => false);
      await pronta(page);
      const ms = Date.now() - t0;
      await dormir(3000);
      const c = await noCentro(page);
      const r = await page.evaluate(() => ({ itens: document.querySelectorAll('[data-roll="item"]').length, canvas: !!document.querySelector('canvas'), tarefa: !!document.querySelector('[data-tutorial="w"]') && getComputedStyle(document.querySelector('[data-tutorial="w"]')).display !== 'none' }));
      confere(`volta ${nome}, viagem ${viagem}: de volta à home, no rolo`, voltou && !!c && r.itens > 1 && r.canvas, `${ms} ms até a home, centro ${c}, ${r.itens} itens`);
    }
    await page.screenshot({ path: path.join(SAIDA, `volta-${nome}.jpg`), type: 'jpeg', quality: 78 });
    // o rolo continua respondendo
    const c0 = await noCentro(page);
    if (toque) {
      const { width: W, height: H } = opcoes.viewport;
      const dedo = (type, touchPoints) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints });
      await dedo('touchStart', [{ x: W / 2, y: H * 0.8 }]);
      for (let i = 1; i <= 6; i++) { await dedo('touchMove', [{ x: W / 2, y: H * 0.8 - (H * 0.5 * i) / 6 }]); await dormir(24); }
      await dedo('touchEnd', []);
    } else await page.keyboard.press('ArrowDown');
    await dormir(2000);
    const c1 = await noCentro(page);
    confere(`volta ${nome}: depois das viagens, o rolo troca de filme`, c1 !== c0, `${c0} -> ${c1}`);
    confere(`volta ${nome}: console limpo`, !page.erros.length, page.erros.slice(0, 2).join(' | '));
    await ctx.close();
  }
}

// ------------------------------------------------------------------------------------------------ leituras com a aba escondida
// Em CDP direto: o Playwright liga a emulação de foco, e a página responde "visible" mesmo escondida.
if (PARTES.includes('aba')) {
  const porta = 9500 + (process.pid % 300);
  const perfil = fs.mkdtempSync(path.join(os.tmpdir(), 'fhdog-aba-'));
  const filho = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe', [`--remote-debugging-port=${porta}`, `--user-data-dir=${perfil}`, '--no-first-run', '--no-default-browser-check', '--window-size=1456,960', 'about:blank'], { stdio: 'ignore' });
  const http = (c, metodo = 'GET') => fetch(`http://127.0.0.1:${porta}/json/${c}`, { method: metodo });
  for (let i = 0; i < 100; i++) { try { if ((await http('version')).ok) break; } catch {} await dormir(100); }
  const alvo = (await (await http('list')).json()).find((x) => x.type === 'page');
  const ws = new WebSocket(alvo.webSocketDebuggerUrl);
  await new Promise((r) => { ws.onopen = r; });
  let seq = 0;
  const espera = new Map();
  ws.onmessage = (e) => { const m = JSON.parse(e.data); if (espera.has(m.id)) { espera.get(m.id)(m); espera.delete(m.id); } };
  const cdp = (method, params = {}) => new Promise((r) => { const id = ++seq; espera.set(id, r); ws.send(JSON.stringify({ id, method, params })); });
  const avaliar = async (expression) => (await cdp('Runtime.evaluate', { expression, returnByValue: true })).result?.result?.value;
  const LER = `[...document.querySelectorAll('[data-reviews="slide"]')].map((e) => e.getBoundingClientRect().left)`;
  await cdp('Network.enable');
  for (const [name, value] of [['preloader_shown', String(Date.now() + 864e5 * 400)], ['tutorial_shown', 'true']]) await cdp('Network.setCookie', { name, value, url: URL_BASE });
  for (const { nome, opcoes } of LARGURAS.filter((l) => ['390', '1440'].includes(l.nome))) {
    const { width, height } = opcoes.viewport;
    await cdp('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: opcoes.deviceScaleFactor || 1, mobile: !!opcoes.isMobile });
    await cdp('Emulation.setTouchEmulationEnabled', { enabled: !!opcoes.hasTouch });
    if (opcoes.userAgent) await cdp('Emulation.setUserAgentOverride', { userAgent: opcoes.userAgent });
    await cdp('Page.navigate', { url: URL_BASE + SESSAO });
    for (let i = 0; i < 180; i++) {
      await dormir(500);
      if (await avaliar(`(() => { const t = document.querySelector('[data-taxi]'); if (!t || !document.querySelector('[data-reviews="wrapper"]')) return false; const c = getComputedStyle(t); return c.visibility !== 'hidden' && +c.opacity > 0.9; })()`)) break;
    }
    await avaliar(`document.querySelector('[data-reviews="wrapper"]').scrollIntoView({ block: 'center', behavior: 'instant' })`);
    await dormir(4000);
    await avaliar(`window.__q = 0; (function f() { window.__q++; requestAnimationFrame(f); })(); 0`);
    const outra = await (await http('new?about:blank', 'PUT')).json();
    await dormir(1000);
    const visivel = await avaliar('document.visibilityState');
    const a = await avaliar(LER);
    const q0 = await avaliar('window.__q');
    await dormir(9000);
    const b = await avaliar(LER);
    const q1 = await avaliar('window.__q');
    confere(`leituras ${nome}, aba escondida: nada anda`, visivel === 'hidden' && medianaDe(a, b) < 1, `${visivel}, ${medianaDe(a, b).toFixed(1)} px e ${q1 - q0} quadros em 9 s`);
    await http(`close/${outra.id}`);
    await http(`activate/${alvo.id}`);
    await dormir(400);
    const c = await avaliar(LER);
    confere(`leituras ${nome}, de volta à aba: não salta o tempo perdido`, medianaDe(b, c) < width * 1.1, `${medianaDe(b, c).toFixed(0)} px`);
    await dormir(8000);
    const d = await avaliar(LER);
    confere(`leituras ${nome}, de volta à aba: retoma`, medianaDe(c, d) > 3, `${medianaDe(c, d).toFixed(0)} px em 8 s`);
  }
  ws.close();
  try { execSync(`taskkill /PID ${filho.pid} /T /F`, { stdio: 'ignore' }); } catch {}
  await dormir(500);
  try { fs.rmSync(perfil, { recursive: true, force: true }); } catch {}
}

await browser.close();
const ok = resultados.filter((x) => x.ok).length;
console.log(`\n${ok} de ${resultados.length} aprovados. Capturas em ${SAIDA}`);
process.exitCode = ok === resultados.length ? 0 : 1;
