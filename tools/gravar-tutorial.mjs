// Grava o vídeo do tutorial a partir da home real, servida pelo build em produção, e gera os arquivos do site.
//   npm run tutorial
//   node tools/gravar-tutorial.mjs [--url=http://localhost:4322] [--canal=msedge] [--so-gravar] [--so-codificar]
//                                  [--sem-mestre] [--quadros=<pasta>] [--kbps-webm=800] [--kbps-mp4=1250]
// Precisa do build servido em --url (npm run preview). Sempre headless. Saída:
//   public/assets/video/tutorial.webm e tutorial.mp4, public/assets/img/site/tutorial-poster.webp,
//   reference/fase2/tutorial/tutorial-mestre.webm (mestre em tamanho cheio) e roteiro.json.
// Com --quadros os JPEG ficam na pasta dada, e --so-codificar parte deles; sem a opção, são apagados no fim.
//
// Como grava: o relógio do navegador começa na hora real, para os rótulos serem datas verdadeiras, e depois anda quadro a
// quadro: cada quadro avança 1/30 s nos temporizadores, no requestAnimationFrame e nas animações de CSS, e só então é
// capturado. Assim o resultado não depende do ritmo da GPU nem do tempo de cada captura.
//
// O roteiro repete os gestos que as cinco dicas do tutorial pedem. O app.js troca a dica a cada 4,8 s depois do play().
// Primeiro e último quadro mostram o mesmo filme em repouso, como na gravação original. A gravação para com erro se o
// filme do centro tiver rótulo que envelhece ou se o aviso "Sem sinal" entrar na tela.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { chromium } from 'playwright';
import sharp from 'sharp';

const RAIZ = path.resolve(import.meta.dirname, '..');
const arg = (n, d) => (process.argv.find((a) => a.startsWith(`--${n}=`)) || `--${n}=${d}`).split('=').slice(1).join('=');
const tem = (n) => process.argv.includes(`--${n}`);
const URL_BASE = arg('url', 'http://localhost:4322');
const CANAL = arg('canal', 'msedge');
const QUADROS = path.resolve(arg('quadros', path.join(os.tmpdir(), 'fhdog-tutorial', 'quadros')));

const FPS = 30;
const DURACAO = 23.8; // o tutorial sai aos 24 s; o vídeo termina um instante antes, em repouso
const TELA = { width: 1440, height: 933 }; // quase a proporção 1668/1080 da caixa do vídeo (tema-sinal.css, .video-2)
const SAIDA = { largura: 960, altura: 622 }; // exatamente 2/3 da tela, sem pixel esticado. A caixa tem 327 px: sobra em densidade 2
const SAIDA_MP4 = { largura: 852, altura: 552 }; // o H.264 deste codificador rende menos por bit: menos pixels, menos blocos
const POSTER = { largura: 654, altura: 424 }; // a caixa em densidade 2: o pôster é pedido em toda visita, até no celular
const QUALIDADE_JPEG = 97;
const LIMITE_BYTES = 4 * 1024 * 1024;
const KBPS_WEBM = +arg('kbps-webm', 800);
const KBPS_MP4 = +arg('kbps-mp4', 1250);

const ARQ = {
  webm: path.join(RAIZ, 'public/assets/video/tutorial.webm'),
  mp4: path.join(RAIZ, 'public/assets/video/tutorial.mp4'),
  poster: path.join(RAIZ, 'public/assets/img/site/tutorial-poster.webp'),
  mestre: path.join(RAIZ, 'reference/fase2/tutorial/tutorial-mestre.webm'),
  roteiro: path.join(RAIZ, 'reference/fase2/tutorial/roteiro.json'),
};

const FILME_INICIAL = 'under-the-silver-lake-2018'; // longe do aviso "Sem sinal", que fica velho na primeira sessão nova
const POS_INICIAL = [860, 560];

// ---------------------------------------------------------------------------------------------------------- roteiro
// Tempos em segundos do vídeo. Dicas: 0 arraste, 4,8 rolagem, 9,6 menu de filmes, 14,4 menu do site, 19,2 Explorar.
const suave = (u) => u * u * (3 - 2 * u);

const roteiro = [
  // 1. Segure e arraste
  { t: 0.5, mover: [720, 560], dur: 0.45 },
  { t: 1.05, apertar: true },
  { t: 1.4, mover: [720, 300], dur: 1.5 },
  { t: 2.9, mover: [720, 270], dur: 0.3 },
  { t: 3.25, soltar: true },
  // 2. Role a página
  { t: 5.0, rolar: true, dur: 0.17 },
  { t: 6.25, rolar: true, dur: 0.17 },
  { t: 7.5, rolar: true, dur: 0.17 },
  // 3. Menu à esquerda: abre o ingresso, escolhe o filme do começo, fecha
  { t: 9.3, mover: 'ingresso', dur: 0.55 },
  { t: 9.95, clicar: true },
  { t: 10.3, mover: 'linha', dur: 0.65 },
  { t: 11.2, clicar: true },
  { t: 12.75, mover: 'ingresso', dur: 0.5 },
  { t: 13.4, clicar: true },
  // 4. Menu à direita
  { t: 14.6, mover: 'hamburguer', dur: 0.5 },
  { t: 15.25, clicar: true },
  { t: 15.85, mover: 'link1', dur: 0.4 },
  { t: 16.5, mover: 'link2', dur: 0.3 },
  { t: 17.05, mover: 'link3', dur: 0.3 },
  { t: 17.65, mover: 'hamburguer', dur: 0.45 },
  { t: 18.25, clicar: true },
  // 5. Explorar: só o hover, porque o clique sairia da home
  { t: 19.4, mover: 'explorar', dur: 0.85 },
  { t: 22.3, mover: POS_INICIAL, dur: 0.9 },
];

// ------------------------------------------------------------------------------------------------ código na página
// Roda antes do relógio falso: guarda o requestAnimationFrame verdadeiro, usado para esperar a composição do quadro.
const ANTES_DO_RELOGIO = () => {
  window.__rafReal = window.requestAnimationFrame.bind(window);
};

function PREPARAR_PAGINA({ tamanho }) {
  // o cursor do sistema não aparece na captura; este tem o tamanho que se lê com o vídeo a 327 px
  const SETA = '<path d="M3.5 2 3.5 20 8.2 15.8 11.6 23 15 21.4 11.7 14.4 18 14.1Z"/>';
  const MAO = '<path d="M9 2.5c1 0 1.8.8 1.8 1.8V11c.3-.5 1-.8 1.6-.8.9 0 1.6.6 1.7 1.4.3-.4.9-.7 1.5-.7.9 0 1.6.6 1.7 1.5.3-.3.8-.5 1.3-.5 1 0 1.8.8 1.8 1.8V17c0 3.3-2.3 5.5-5.5 5.5h-2.4c-2 0-3.4-.8-4.6-2.4L4.4 15c-.5-.8-.3-1.8.4-2.3.8-.5 1.8-.4 2.4.3V4.3c0-1 .8-1.8 1.8-1.8Z"/>';
  const PUNHO = '<path d="M6 11.2c0-1 .8-1.7 1.7-1.7.5 0 .9.2 1.2.5.2-.8.9-1.3 1.7-1.3.6 0 1.1.3 1.4.7.3-.6.9-1 1.6-1 .8 0 1.5.5 1.7 1.3.3-.2.6-.3 1-.3 1 0 1.8.8 1.8 1.8V16c0 3.3-2.3 5.5-5.5 5.5h-1.6c-2 0-3.5-.9-4.6-2.6l-2.3-3.7c-.5-.8-.2-1.8.5-2.2.4-.3.8-.3 1.2-.2Z"/>';
  const icone = (d) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="${tamanho}" height="${tamanho}" fill="#fff" stroke="#000" stroke-width="1.3" stroke-linejoin="round" style="position:absolute;left:0;top:0;display:none;filter:drop-shadow(0 2px 4px rgba(0,0,0,.45))">${d}</svg>`;
  const caixa = document.createElement('div');
  caixa.id = 'cursor-gravacao';
  caixa.style.cssText = 'position:fixed;left:0;top:0;width:0;height:0;z-index:2147483647;pointer-events:none;will-change:transform';
  caixa.innerHTML = `<div data-onda style="position:absolute;width:${tamanho}px;height:${tamanho}px;margin:${-tamanho / 2}px 0 0 ${-tamanho / 2}px;border:3px solid #fff;border-radius:50%;opacity:0;box-sizing:border-box"></div>${icone(SETA)}${icone(MAO)}${icone(PUNHO)}`;
  document.documentElement.appendChild(caixa);
  const [seta, mao, punho] = caixa.querySelectorAll('svg');
  const onda = caixa.querySelector('[data-onda]');
  // ponta do desenho, em unidades do viewBox de 24
  const PONTA = new Map([[seta, [3.5, 2]], [mao, [9, 2.5]], [punho, [11, 9]]]);

  window.__gravacao = {
    // Animações de CSS não obedecem ao relógio falso: cada uma passa a andar só por aqui.
    passoCss(ms) {
      for (const a of document.getAnimations()) {
        if (!a.__sobControle) {
          a.__sobControle = true;
          a.__t = a.currentTime || 0;
          a.pause();
        }
        a.__t += ms;
        const fim = a.effect ? a.effect.getComputedTiming().endTime : Infinity;
        if (a.__t >= fim) a.finish();
        else a.currentTime = a.__t;
      }
    },
    cursor(x, y, apertado, onda01) {
      const alvo = document.elementFromPoint(x, y);
      const tipo = alvo ? getComputedStyle(alvo).cursor : 'auto';
      const atual = apertado && tipo !== 'pointer' ? punho : tipo === 'pointer' ? mao : seta;
      for (const s of PONTA.keys()) s.style.display = s === atual ? 'block' : 'none';
      const [px, py] = PONTA.get(atual);
      atual.style.transform = `translate(${(-px * tamanho) / 24}px, ${(-py * tamanho) / 24}px)`;
      caixa.style.transform = `translate(${x}px, ${y}px)`;
      onda.style.opacity = onda01 > 0 ? String(0.9 * (1 - onda01)) : '0';
      onda.style.transform = `scale(${0.5 + 1.1 * onda01})`;
    },
  };
}

const medir = (page) =>
  page.evaluate((slug) => {
    const c = (el, fx = 0.5, fy = 0.5) => {
      const r = el.getBoundingClientRect();
      return [r.left + r.width * fx, r.top + r.height * fy];
    };
    const q = (s) => document.querySelector(s);
    const painelAberto = q('#smallpanel').checked;
    const principalAberto = q('#mainpanel').checked;
    const itens = [...document.querySelectorAll('[data-roll="item"]')];
    const dist = itens.map((el) => {
      const r = el.getBoundingClientRect();
      return Math.abs(r.top + r.height / 2 - innerHeight / 2);
    });
    const noCentro = itens[dist.indexOf(Math.min(...dist))];
    const links = [...document.querySelectorAll('.menu-link.large')];
    const linha = q(`.menu-films-w [data-sessao="${slug}"] .menu-film-item`);
    const aviso = q('[data-roll="item"][data-aviso]');
    const caixaAviso = aviso ? aviso.getBoundingClientRect() : null;
    return {
      painelAberto,
      principalAberto,
      noCentro: noCentro.getAttribute('data-sessao') || 'aviso',
      estadoNoCentro: noCentro.querySelector('[data-estado]')?.getAttribute('data-estado') || null,
      avisoNaTela: !!caixaAviso && caixaAviso.bottom > 0 && caixaAviso.top < innerHeight,
      ingresso: c(q('.mmenu-col.large'), 0.45, 0.3),
      hamburguer: c(q('[data-menu="maintrigger"]')),
      // à esquerda do centro da linha: a ponta direita é um link direto para a página do filme
      linha: linha ? c(linha, 0.35) : null,
      link1: links[0] ? c(links[0], 0.35) : null,
      link2: links[1] ? c(links[1], 0.3) : null,
      link3: links[2] ? c(links[2], 0.3) : null,
      explorar: c(noCentro.querySelector('.roll-cont-col.reviews .explore-w')),
    };
  }, FILME_INICIAL);

// ------------------------------------------------------------------------------------------------------- gravação
async function gravar() {
  fs.rmSync(QUADROS, { recursive: true, force: true });
  fs.mkdirSync(QUADROS, { recursive: true });

  // A GPU reduz o tempo de cada quadro, mas o resultado não depende dela (ver o começo do arquivo).
  const browser = await chromium.launch({ channel: CANAL, headless: true, args: ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist'] });
  const agora = Date.now();
  const ctx = await browser.newContext({ viewport: TELA, locale: 'pt-BR', timezoneId: 'America/Sao_Paulo' });
  await ctx.addCookies([
    { name: 'preloader_shown', value: String(agora), url: URL_BASE },
    { name: 'tutorial_shown', value: 'true', url: URL_BASE },
  ]);
  const page = await ctx.newPage();
  const erros = [];
  page.on('pageerror', (e) => erros.push(String(e)));
  page.on('console', (m) => {
    if (m.type() === 'error') erros.push(m.text());
  });
  await page.addInitScript(ANTES_DO_RELOGIO);
  await page.addInitScript(() => { window.__semCursorSinal = true; }); // este arquivo desenha o próprio cursor na gravação
  await page.clock.install({ time: agora });
  await page.goto(`${URL_BASE}/`, { waitUntil: 'load' });
  await page.waitForFunction(() => getComputedStyle(document.querySelector('[data-taxi]')).visibility !== 'hidden', null, { timeout: 60000 });

  const gl = await page.evaluate(() => {
    const c = document.createElement('canvas').getContext('webgl');
    const d = c && c.getExtension('WEBGL_debug_renderer_info');
    return d ? c.getParameter(d.UNMASKED_RENDERER_WEBGL) : 'sem informação';
  });
  console.log(`placa: ${gl}`);
  await page.waitForTimeout(3500);

  // Leva a roda ao filme do começo pelo próprio menu, ainda em tempo corrido, e espera tudo parar.
  let m = await medir(page);
  await page.mouse.move(POS_INICIAL[0], POS_INICIAL[1]);
  await page.mouse.click(m.ingresso[0], m.ingresso[1]);
  await page.waitForTimeout(1200);
  m = await medir(page);
  if (!m.linha) throw new Error(`o filme ${FILME_INICIAL} não está no menu`);
  await page.mouse.click(m.linha[0], m.linha[1]);
  await page.waitForTimeout(3000);
  m = await medir(page);
  await page.mouse.click(m.ingresso[0], m.ingresso[1]);
  await page.mouse.move(POS_INICIAL[0], POS_INICIAL[1]);
  await page.waitForTimeout(4000);
  m = await medir(page);
  if (m.noCentro !== FILME_INICIAL || m.painelAberto) throw new Error(`preparação falhou: ${JSON.stringify(m)}`);

  await page.evaluate(PREPARAR_PAGINA, { tamanho: 46 });
  await page.clock.pauseAt(Date.now() + 500);
  const cdp = await ctx.newCDPSession(page);

  const passos = roteiro.map((p) => ({ ...p }));
  let [x, y] = POS_INICIAL;
  let movendo = null;
  let apertado = false;
  let onda = -1;
  const totalQuadros = Math.round(DURACAO * FPS);
  let msFeitos = 0;
  const t0 = Date.now();
  const log = [];

  for (let i = 0; i < totalQuadros; i++) {
    const t = i / FPS;
    for (const p of passos) {
      if (p.feito || t + 1e-6 < p.t) continue;
      p.feito = true;
      if (p.mover) {
        const alvoNome = typeof p.mover === 'string' ? p.mover : null;
        const alvo = alvoNome ? (await medir(page))[alvoNome] : p.mover;
        if (!alvo) throw new Error(`alvo sem posição aos ${t.toFixed(2)} s: ${alvoNome}`);
        movendo = { de: [x, y], para: alvo, t0: p.t, dur: p.dur };
        log.push({ t: +t.toFixed(3), mover: alvoNome || 'ponto', para: alvo.map(Math.round) });
      }
      if (p.apertar) {
        await page.mouse.down();
        apertado = true;
        onda = 0;
        log.push({ t: +t.toFixed(3), acao: 'apertar' });
      }
      if (p.soltar) {
        await page.mouse.up();
        apertado = false;
        log.push({ t: +t.toFixed(3), acao: 'soltar' });
      }
      if (p.clicar) {
        await page.mouse.down();
        await page.mouse.up();
        onda = 0;
        log.push({ t: +t.toFixed(3), acao: 'clicar', sobre: (await medir(page)).noCentro });
      }
      if (p.rolar) log.push({ t: +t.toFixed(3), acao: 'rolar', noCentro: (await medir(page)).noCentro });
    }
    if (movendo) {
      const u = Math.min(1, (t - movendo.t0) / movendo.dur);
      const e = suave(u);
      x = movendo.de[0] + (movendo.para[0] - movendo.de[0]) * e;
      y = movendo.de[1] + (movendo.para[1] - movendo.de[1]) * e;
      await page.mouse.move(x, y);
      if (u >= 1) movendo = null;
    }

    const msAlvo = Math.round(((i + 1) * 1000) / FPS);
    const ms = msAlvo - msFeitos;
    msFeitos = msAlvo;
    if (passos.some((p) => p.rolar && t + 1e-6 >= p.t && t < p.t + p.dur)) {
      // Um gesto de trackpad, cerca de 90 eventos por segundo: o roll volta ao filme atual se o alvo não passar da metade, e
      // cada evento sintético só o move 0,06. O app.js ignora evento a menos de 10 ms do anterior, daí os 11 ms entre eles.
      for (let k = 0; k < 3; k++) {
        await page.mouse.wheel(0, 120);
        await page.clock.runFor(k < 2 ? 11 : ms - 22);
      }
    } else {
      await page.clock.runFor(ms);
    }
    if (onda >= 0) onda = onda + 1 / (0.35 * FPS) > 1 ? -1 : onda + 1 / (0.35 * FPS);
    await page.evaluate(
      ({ ms, x, y, apertado, onda }) =>
        new Promise((pronto) => {
          window.__gravacao.passoCss(ms);
          window.__gravacao.cursor(x, y, apertado, onda);
          window.__rafReal(() => window.__rafReal(pronto));
        }),
      { ms, x, y, apertado, onda },
    );
    const { data } = await cdp.send('Page.captureScreenshot', { format: 'jpeg', quality: QUALIDADE_JPEG, optimizeForSpeed: false });
    fs.writeFileSync(path.join(QUADROS, `q${String(i).padStart(5, '0')}.jpg`), Buffer.from(data, 'base64'));
    if (i % 15 === 0) {
      const agoraNaTela = await medir(page);
      if (agoraNaTela.avisoNaTela) throw new Error(`o aviso "Sem sinal" entrou na tela aos ${t.toFixed(2)} s`);
      if (agoraNaTela.estadoNoCentro !== 'exibida') throw new Error(`rótulo que envelhece aos ${t.toFixed(2)} s: ${agoraNaTela.noCentro} está como ${agoraNaTela.estadoNoCentro}`);
      if (i % 60 === 0) console.log(`quadro ${i}/${totalQuadros}, ${t.toFixed(1)} s, centro: ${agoraNaTela.noCentro}`);
    }
  }
  const fim = await medir(page);
  console.log(`gravou ${totalQuadros} quadros em ${((Date.now() - t0) / 1000).toFixed(0)} s; filme final: ${fim.noCentro}`);
  log.push({ t: DURACAO, final: fim.noCentro });
  await browser.close();

  const relevantes = erros.filter((e) => !/favicon|ERR_ABORTED/.test(e));
  if (relevantes.length) console.log(`aviso: console da página:\n  ${relevantes.slice(0, 5).join('\n  ')}`);
  if (fim.noCentro !== FILME_INICIAL) throw new Error(`o vídeo termina em ${fim.noCentro}, e não no filme do começo`);
  fs.mkdirSync(path.dirname(ARQ.roteiro), { recursive: true });
  fs.writeFileSync(ARQ.roteiro, JSON.stringify({ gravado: new Date(agora).toISOString(), url: URL_BASE, canal: CANAL, placa: gl, tela: TELA, fps: FPS, duracao: DURACAO, log }, null, 1));
}

// ------------------------------------------------------------------------------------------------------ codificação
function acharFfmpeg() {
  // o ffmpeg do Playwright é mínimo: cada versão traz só um codificador, e nenhum faz H.264
  const base = process.env.PLAYWRIGHT_BROWSERS_PATH || path.join(process.env.LOCALAPPDATA || path.join(os.homedir(), '.cache'), 'ms-playwright');
  const pastas = fs.existsSync(base) ? fs.readdirSync(base).filter((d) => d.startsWith('ffmpeg-')).sort().reverse() : [];
  for (const d of pastas) {
    for (const nome of ['ffmpeg-win64.exe', 'ffmpeg-linux', 'ffmpeg-mac']) {
      const exe = path.join(base, d, nome);
      if (fs.existsSync(exe) && spawnSync(exe, ['-hide_banner', '-encoders']).stdout.toString().includes('libvpx-vp9')) return exe;
    }
  }
  throw new Error(`nenhum ffmpeg com libvpx-vp9 em ${base}`);
}

function rodarFfmpeg(exe, args) {
  const quadros = fs.readdirSync(QUADROS).filter((f) => f.endsWith('.jpg')).sort();
  return new Promise((pronto, falha) => {
    const p = spawn(exe, ['-y', '-hide_banner', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', 'pipe:0', ...args], { stdio: ['pipe', 'ignore', 'pipe'] });
    let erro = '';
    p.stderr.on('data', (d) => (erro += d));
    p.stdin.on('error', () => {}); // se o ffmpeg sair antes, quem conta o motivo é o evento close
    p.on('close', (c) => (c === 0 ? pronto() : falha(new Error(`ffmpeg saiu com ${c}: ${erro.slice(-400)}`))));
    (async () => {
      for (const f of quadros) {
        if (!p.stdin.write(fs.readFileSync(path.join(QUADROS, f)))) await new Promise((r) => p.stdin.once('drain', r));
      }
      p.stdin.end();
    })();
  });
}

// O JPEG chega em BT.601 de faixa cheia: a saída vai marcada em BT.709 de faixa limitada, com a conversão certa.
const FILTRO = (l, a) => `scale=${l}:${a}:flags=lanczos+accurate_rnd+full_chroma_int:in_color_matrix=bt601:in_range=pc:out_color_matrix=bt709:out_range=tv,format=yuv420p`;
const COR = ['-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-color_range', 'tv'];

async function codificarWebm(exe) {
  const log = path.join(path.dirname(QUADROS), 'vp9-passos');
  fs.mkdirSync(path.dirname(ARQ.webm), { recursive: true });
  const comum = ['-vf', FILTRO(SAIDA.largura, SAIDA.altura), ...COR, '-c:v', 'libvpx-vp9', '-b:v', `${KBPS_WEBM}k`, '-g', '150', '-row-mt', '1', '-threads', '6', '-tile-columns', '1', '-auto-alt-ref', '1', '-lag-in-frames', '25', '-passlogfile', log, '-an'];
  await rodarFfmpeg(exe, [...comum, '-pass', '1', '-deadline', 'good', '-cpu-used', '4', '-f', 'webm', os.devNull]);
  await rodarFfmpeg(exe, [...comum, '-pass', '2', '-deadline', 'good', '-cpu-used', '1', ARQ.webm]);
  console.log(`tutorial.webm: ${fs.statSync(ARQ.webm).size} bytes`);
}

async function codificarMestre(exe) {
  fs.mkdirSync(path.dirname(ARQ.mestre), { recursive: true });
  await rodarFfmpeg(exe, ['-vf', FILTRO(TELA.width, TELA.height), ...COR, '-c:v', 'libvpx-vp9', '-crf', '24', '-b:v', '0', '-deadline', 'good', '-cpu-used', '3', '-row-mt', '1', '-threads', '6', '-an', ARQ.mestre]);
  console.log(`mestre: ${fs.statSync(ARQ.mestre).size} bytes`);
}

// Nenhum ffmpeg daqui faz H.264: quem codifica é o WebCodecs do navegador, e o mp4-muxer monta o arquivo.
async function codificarMp4() {
  const muxer = fs.readFileSync(path.join(RAIZ, 'node_modules/mp4-muxer/build/mp4-muxer.js'), 'utf8');
  const browser = await chromium.launch({ channel: CANAL, headless: true });
  const page = await browser.newPage();
  // VideoEncoder só existe em contexto seguro; localhost serve, sem depender de servidor nenhum
  await page.route('http://localhost:4599/**', (r) => r.fulfill({ contentType: 'text/html', body: '<!doctype html><title>codificador</title>' }));
  await page.goto('http://localhost:4599/');
  await page.addScriptTag({ content: muxer });
  const cfg = await page.evaluate(
    async ({ largura, altura, kbps, fps }) => {
      const { Muxer, ArrayBufferTarget } = window.Mp4Muxer;
      window.__alvo = new ArrayBufferTarget();
      window.__mux = new Muxer({ target: window.__alvo, video: { codec: 'avc', width: largura, height: altura, frameRate: fps }, fastStart: 'in-memory' });
      window.__info = { pedacos: 0, chaves: 0, erro: null, codec: null, cor: null };
      window.__enc = new VideoEncoder({
        output: (c, m) => {
          window.__info.pedacos++;
          if (c.type === 'key') window.__info.chaves++;
          if (m && m.decoderConfig && !window.__info.codec) {
            window.__info.codec = m.decoderConfig.codec;
            window.__info.cor = m.decoderConfig.colorSpace || null;
          }
          window.__mux.addVideoChunk(c, m);
        },
        error: (e) => (window.__info.erro = e.message),
      });
      const config = { codec: 'avc1.42E01F', width: largura, height: altura, framerate: fps, bitrate: kbps * 1000, bitrateMode: 'variable', hardwareAcceleration: 'prefer-software', latencyMode: 'quality', avc: { format: 'avc' } };
      const s = await VideoEncoder.isConfigSupported(config);
      if (!s.supported) throw new Error('H.264 sem suporte neste navegador');
      window.__enc.configure(config);
      return s.config.codec;
    },
    { largura: SAIDA_MP4.largura, altura: SAIDA_MP4.altura, kbps: KBPS_MP4, fps: FPS },
  );
  const quadros = fs.readdirSync(QUADROS).filter((f) => f.endsWith('.jpg')).sort();
  for (let i = 0; i < quadros.length; i++) {
    const jpg = await sharp(path.join(QUADROS, quadros[i])).resize(SAIDA_MP4.largura, SAIDA_MP4.altura, { kernel: 'lanczos3' }).jpeg({ quality: 96, chromaSubsampling: '4:4:4' }).toBuffer();
    await page.evaluate(
      async ({ b64, i, fps }) => {
        const bin = atob(b64);
        const a = new Uint8Array(bin.length);
        for (let j = 0; j < bin.length; j++) a[j] = bin.charCodeAt(j);
        const bmp = await createImageBitmap(new Blob([a], { type: 'image/jpeg' }));
        const f = new VideoFrame(bmp, { timestamp: Math.round((i * 1e6) / fps), duration: Math.round(1e6 / fps) });
        window.__enc.encode(f, { keyFrame: i % 150 === 0 });
        f.close();
        bmp.close();
        while (window.__enc.encodeQueueSize > 4) await new Promise((r) => setTimeout(r, 2));
      },
      { b64: jpg.toString('base64'), i, fps: FPS },
    );
  }
  const r = await page.evaluate(async () => {
    await window.__enc.flush();
    window.__enc.close();
    window.__mux.finalize();
    const a = new Uint8Array(window.__alvo.buffer);
    let s = '';
    for (let i = 0; i < a.length; i += 32768) s += String.fromCharCode(...a.subarray(i, i + 32768));
    return { ...window.__info, b64: btoa(s) };
  });
  await browser.close();
  if (r.erro) throw new Error(`WebCodecs: ${r.erro}`);
  fs.mkdirSync(path.dirname(ARQ.mp4), { recursive: true });
  fs.writeFileSync(ARQ.mp4, Buffer.from(r.b64, 'base64'));
  console.log(`tutorial.mp4: ${fs.statSync(ARQ.mp4).size} bytes, codec ${r.codec} (pedido ${cfg}), ${r.pedacos} quadros, ${r.chaves} chaves, cor ${JSON.stringify(r.cor)}`);
}

async function gerarPoster() {
  // o primeiro quadro: o vídeo começa sem salto a partir do pôster
  const primeiro = path.join(QUADROS, fs.readdirSync(QUADROS).filter((f) => f.endsWith('.jpg')).sort()[0]);
  await sharp(primeiro).resize(POSTER.largura, POSTER.altura, { kernel: 'lanczos3', fit: 'fill' }).webp({ quality: 72, effort: 6 }).toFile(ARQ.poster);
  console.log(`pôster: ${fs.statSync(ARQ.poster).size} bytes`);
}

// ------------------------------------------------------------------------------------------------------------ início
if (!tem('so-codificar')) await gravar();
if (!tem('so-gravar')) {
  const exe = acharFfmpeg();
  await gerarPoster();
  await codificarWebm(exe);
  await codificarMp4();
  if (!tem('sem-mestre')) await codificarMestre(exe);
  for (const a of [ARQ.webm, ARQ.mp4]) {
    if (fs.statSync(a).size > LIMITE_BYTES) {
      console.error(`FALHA ${path.basename(a)} passou de 4 MB`);
      process.exitCode = 1;
    }
  }
  if (!process.argv.some((a) => a.startsWith('--quadros='))) fs.rmSync(path.dirname(QUADROS), { recursive: true, force: true });
}
