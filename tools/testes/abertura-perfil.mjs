// De onde vem a demora do ENTER: separa a thread ocupada (o timer de 3.500 ms dispara tarde) da falta de quadros (o timer dispara
// na hora e o tween do botão espera o rAF). Rode com o PC parado e nada mais usando a GPU: os tempos são o resultado.
//   node tools/testes/abertura-perfil.mjs [--url=http://localhost:4322] [--canal=msedge] [--n=10] [--lotes=A,B,D] [--saida=pasta]
// Lotes: A visita fria (navegador novo a cada visita); B igual, com perfil de CPU; D navegador só e contexto novo a cada visita,
// como em abertura.mjs: a diferença entre D e A é o peso do cache de programas. Nenhum clique: a visita termina 1 s depois do ENTER.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { chromium } from 'playwright';

const arg = (n, d) => (process.argv.find((a) => a.startsWith(`--${n}=`)) || `--${n}=${d}`).split('=').slice(1).join('=');
const URL_BASE = arg('url', 'http://localhost:4322').replace(/\/$/, '');
const CANAL = arg('canal', 'msedge');
const N = +arg('n', 10);
const LOTES = arg('lotes', 'A,B,D').split(',');
const SAIDA = path.resolve(arg('saida', path.join(os.tmpdir(), 'fhdog-abertura-perfil')));
const LIMITE = 90000;
fs.mkdirSync(SAIDA, { recursive: true });

const mediana = (a) => {
  const s = [...a].sort((x, y) => x - y);
  const m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};
const dormir = (ms) => new Promise((r) => setTimeout(r, ms));

const SONDA = () => {
  const m = (window.__p = { registrado: null, disparo: null, fimDisparo: null, estilo: null, longas: [], quadros: [] });
  const original = window.setTimeout;
  window.setTimeout = function (fn, atraso, ...resto) {
    if (atraso === 3500 && m.registrado === null && typeof fn === 'function') {
      m.registrado = performance.now();
      const cb = fn;
      fn = function () {
        m.disparo = performance.now();
        try {
          return cb.apply(this, arguments);
        } finally {
          m.fimDisparo = performance.now();
        }
      };
    }
    return original.call(this, fn, atraso, ...resto);
  };
  const observar = (tipo, destino, ler) => {
    try {
      new PerformanceObserver((l) => { for (const e of l.getEntries()) destino.push(ler(e)); }).observe({ type: tipo, buffered: true });
    } catch {}
  };
  observar('longtask', m.longas, (e) => [Math.round(e.startTime), Math.round(e.duration)]);
  observar('long-animation-frame', m.quadros, (e) => [Math.round(e.startTime), Math.round(e.duration), Math.round(e.blockingDuration)]);
  document.addEventListener('DOMContentLoaded', () => {
    const btn = document.querySelector('[data-preloader="btn"]');
    if (!btn) return;
    const ver = () => { if (m.estilo === null && getComputedStyle(btn).visibility === 'visible') m.estilo = performance.now(); };
    new MutationObserver(ver).observe(btn, { attributes: true, attributeFilter: ['style', 'class'] });
    ver();
  });
};

// Tempo próprio por função do bundle, em ms. As amostras são de 500 µs, então abaixo de uns 5 ms é ruído.
function porFuncao(perfil) {
  const nos = new Map(perfil.nodes.map((n) => [n.id, n]));
  const tempo = new Map();
  perfil.samples.forEach((id, i) => {
    const f = nos.get(id).callFrame;
    const arquivo = f.url.split('/').pop() || '(navegador)';
    const chave = `${f.functionName || '(anônima)'} ${arquivo}${f.url ? `:${f.lineNumber + 1}` : ''}`;
    tempo.set(chave, (tempo.get(chave) || 0) + (perfil.timeDeltas[i] || 0) / 1000);
  });
  return tempo;
}

function analisar(m) {
  const devido = m.registrado + 3500;
  const longas = m.longas.slice().sort((a, b) => a[0] - b[0]);
  // bloco contínuo de tarefas iniciado antes do instante devido: é ele que atrasa o timer
  let ocupadoAte = m.registrado;
  for (const [ini, dur] of longas) if (ini <= devido && ini <= ocupadoAte + 50) ocupadoAte = Math.max(ocupadoAte, ini + dur);
  return {
    enter: m.estilo,
    tLl: m.registrado,
    atrasoTimer: m.disparo - devido,
    atrasoTick: m.estilo - m.fimDisparo,
    margem: 3500 - (ocupadoAte - m.registrado),
    emCurso: longas.find(([ini, dur]) => ini <= devido && devido <= ini + dur) || null,
    longas,
    quadros: m.quadros,
  };
}

async function visita(browser, comPerfil) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await ctx.addInitScript(SONDA);
  const page = await ctx.newPage();
  const erros = [];
  page.on('pageerror', (e) => erros.push(String(e)));
  let cdp = null;
  if (comPerfil) {
    cdp = await ctx.newCDPSession(page);
    await cdp.send('Profiler.enable');
    await cdp.send('Profiler.setSamplingInterval', { interval: 500 });
    await cdp.send('Profiler.start');
  }
  await page.goto(`${URL_BASE}/`, { waitUntil: 'commit', timeout: LIMITE });
  await page.waitForFunction(() => window.__p && window.__p.estilo !== null, null, { timeout: LIMITE });
  await dormir(1000);
  const m = await page.evaluate(() => window.__p);
  const perfil = cdp ? (await cdp.send('Profiler.stop')).profile : null;
  await ctx.close();
  return { ...analisar(m), perfil, erros };
}

const fmt = (a) => `${mediana(a).toFixed(1)} (${Math.min(...a).toFixed(0)} a ${Math.max(...a).toFixed(0)})`;
const relatorio = {};

for (const lote of LOTES) {
  const series = [];
  const somaFuncoes = new Map();
  const unico = lote === 'D' ? await chromium.launch({ channel: CANAL, headless: true }) : null;
  for (let i = 0; i < N; i++) {
    const browser = unico || (await chromium.launch({ channel: CANAL, headless: true }));
    const v = await visita(browser, lote === 'B');
    if (!unico) await browser.close();
    if (v.perfil) for (const [k, ms] of porFuncao(v.perfil)) somaFuncoes.set(k, (somaFuncoes.get(k) || 0) + ms);
    delete v.perfil;
    series.push(v);
    console.log(`${lote}${i}  ENTER ${v.enter.toFixed(0)}  t_ll ${v.tLl.toFixed(0)}  timer +${v.atrasoTimer.toFixed(0)}  tick +${v.atrasoTick.toFixed(0)}  margem ${v.margem.toFixed(0)}  maior ${Math.max(0, ...v.longas.map((l) => l[1]))}  em curso ${v.emCurso ? v.emCurso.join('+') : '-'}${v.erros.length ? `  ERRO ${v.erros[0]}` : ''}`);
    await dormir(3000);
  }
  if (unico) await unico.close();
  console.log(`\n${CANAL} lote ${lote}, n=${N}`);
  console.log(`  ENTER ${fmt(series.map((s) => s.enter))} ms`);
  console.log(`  início do timer (t_ll) ${fmt(series.map((s) => s.tLl))} ms`);
  console.log(`  atraso do timer ${fmt(series.map((s) => s.atrasoTimer))} ms; acima de 20 ms em ${series.filter((s) => s.atrasoTimer > 20).length} de ${N}`);
  console.log(`  espera do quadro ${fmt(series.map((s) => s.atrasoTick))} ms`);
  console.log(`  margem até o timer ${fmt(series.map((s) => s.margem))} ms; negativa em ${series.filter((s) => s.margem < 0).length} de ${N}`);
  const funcoes = [...somaFuncoes].sort((a, b) => b[1] - a[1]).slice(0, 25).map(([k, ms]) => [k, +(ms / N).toFixed(1)]);
  if (funcoes.length) {
    console.log('  tempo próprio médio por visita, até 1 s depois do ENTER:');
    for (const [k, ms] of funcoes) console.log(`    ${String(ms).padStart(8)} ms  ${k}`);
  }
  relatorio[lote] = { series, funcoes };
}

const destino = path.join(SAIDA, `perfil-${CANAL}.json`);
fs.writeFileSync(destino, JSON.stringify(relatorio, null, 1));
console.log(`\nSéries em ${destino}`);
