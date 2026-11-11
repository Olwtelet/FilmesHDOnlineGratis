// Gera os quatro efeitos sonoros do site em public/assets/audio/, por síntese, sem amostra de terceiros:
//   cta_in.mp3     realce: o ponteiro entra num botão de ação (EXPLORAR, ENTRAR, FECHAR). Um estalo de seletor e um bipe
//                  curto de 1 kHz, o tom de referência da carta de teste. É o mais curto e o mais baixo, porque é o mais frequente.
//   cta_out.mp3    acionar: o clique nesses botões. Uma varredura curta de sintonia que trava num intervalo de quinta (1 kHz e 1,5 kHz).
//   menu_IN.mp3    abrir o menu: o sinal entrando. Um baque grave e macio, uma subida de 440 a 880 Hz que pousa num acorde
//                  curto, e um chiado bem baixo, filtrado, pulsando a 24 Hz como o obturador de um projetor.
//   menu_OUT.mp3   fechar o menu: o gesto contrário, não o arquivo invertido. A nota desce de 880 a 330 Hz com o filtro fechando,
//                  como um sinal que se apaga, e termina num baque grave. Um pouco mais baixo que o de abrir.
// Tudo em 48 kHz, mono, sem grave abaixo de 70 Hz (que alto-falante de notebook não toca) e sem agudo acima de 9 kHz, com o
// ataque na primeira amostra. As matrizes WAV ficam em reference/sons/. O MP3 sai pelo codificador do próprio Windows
// (tools/lib/mp3-windows.ps1); ele às vezes perde os últimos quadros, então o WAV leva 400 ms de silêncio no fim e o
// resultado é conferido: a duração tem de cobrir o som inteiro.
//   node tools/gerar-sons.mjs           matrizes e MP3
//   node tools/gerar-sons.mjs --wav     só as matrizes
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const ROOT = path.resolve(import.meta.dirname, '..');
const MATRIZES = path.join(ROOT, 'reference/sons');
const SAIDA = path.join(ROOT, 'public/assets/audio');
const TAXA = 48000;
const SO_WAV = process.argv.includes('--wav');

// --- blocos de síntese ---------------------------------------------------------------------------------------------------
function gerador(semente) {
  let s = semente >>> 0;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296 * 2 - 1; };
}
/** filtro biquad (RBJ), aplicado a uma amostra por vez; frequência pode variar por amostra */
function biquad(tipo, q) {
  let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
  return (x, f) => {
    const w = (2 * Math.PI * Math.min(f, TAXA * 0.45)) / TAXA, c = Math.cos(w), al = Math.sin(w) / (2 * q);
    let b0, b1, b2;
    if (tipo === 'passa-baixa') { b0 = (1 - c) / 2; b1 = 1 - c; b2 = (1 - c) / 2; }
    else if (tipo === 'passa-alta') { b0 = (1 + c) / 2; b1 = -(1 + c); b2 = (1 + c) / 2; }
    else { b0 = al; b1 = 0; b2 = -al; } // passa-faixa, ganho de pico 0 dB
    const a0 = 1 + al, a1 = -2 * c, a2 = 1 - al;
    const y = (b0 * x + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2) / a0;
    x2 = x1; x1 = x; y2 = y1; y1 = y;
    return y;
  };
}
/** oscilador senoidal com fase acumulada (a frequência pode mudar sem estalo) */
function seno() { let fase = 0; return (f) => { fase += (2 * Math.PI * f) / TAXA; return Math.sin(fase); }; }
const db = (v) => Math.pow(10, v / 20);
/** envelope: ataque linear em a segundos, depois queda exponencial com constante tau */
const env = (t, a, tau) => (t < 0 ? 0 : t < a ? t / a : Math.exp(-(t - a) / tau));
/** entre 0 e 1, com saída suave */
const suave = (x) => { const v = Math.max(0, Math.min(1, x)); return 1 - Math.pow(1 - v, 3); };

function render(duracao, fn) {
  const n = Math.round(duracao * TAXA), out = new Float32Array(n);
  for (let i = 0; i < n; i++) out[i] = fn(i / TAXA, i);
  return out;
}
/** acabamento comum: corta abaixo de 70 Hz e acima de 9 kHz, satura de leve (calor analógico), abre e fecha sem estalo,
 *  normaliza o pico */
function acabar(sinal, picoDb) {
  const pa = biquad('passa-alta', 0.707), pb = biquad('passa-baixa', 0.707);
  const n = sinal.length, out = new Float32Array(n);
  for (let i = 0; i < n; i++) out[i] = pb(pa(sinal[i], 70), 9000);
  // a saturação recebe o sinal com pico 0,85: só arredonda os picos, sem acrescentar zumbido de harmônicos
  let p0 = 0;
  for (const v of out) p0 = Math.max(p0, Math.abs(v));
  for (let i = 0; i < n; i++) out[i] = Math.tanh(1.15 * (out[i] * 0.85) / p0) / Math.tanh(1.15);
  const fim = Math.round(0.012 * TAXA);
  for (let i = 0; i < fim; i++) out[n - 1 - i] *= i / fim;
  let pico = 0;
  for (const v of out) pico = Math.max(pico, Math.abs(v));
  const g = db(picoDb) / pico;
  for (let i = 0; i < n; i++) out[i] *= g;
  return out;
}

// --- os quatro sons -------------------------------------------------------------------------------------------------------
function ctaIn() {
  const ruido = gerador(11), pf = biquad('passa-faixa', 2.2), s1 = seno(), s2 = seno();
  return acabar(render(0.12, (t) => {
    const estalo = pf(ruido(), 2300) * env(t, 0.0004, 0.0016) * db(-6);
    const f = 1000 + 40 * Math.exp(-t / 0.012); // pousa em 1 kHz
    const bipe = (s1(f) + db(-20) * s2(2 * f)) * env(t, 0.003, 0.03);
    return estalo + 0.55 * bipe;
  }), -7);
}

function ctaOut() {
  const ruido = gerador(23), pf = biquad('passa-faixa', 5), click = biquad('passa-faixa', 1.6);
  const varre = seno(), a = seno(), b = seno(), a2 = seno();
  const TRAVA = 0.045;
  return acabar(render(0.3, (t) => {
    // sintonia: ruído estreito e uma portadora subindo, antes de travar
    const p = Math.min(1, t / TRAVA);
    const sintonia = (pf(ruido(), 600 + 1800 * suave(p)) * db(-14) + varre(500 + 500 * suave(p)) * db(-16)) * (t < TRAVA ? 0.4 + 0.6 * p : Math.exp(-(t - TRAVA) / 0.012));
    // trava: estalo de relé e a quinta 1 kHz e 1,5 kHz, com um leve desvio de afinação (dois osciladores analógicos)
    const tt = t - TRAVA;
    const rele = tt >= 0 ? click(ruido(), 3000) * env(tt, 0.0003, 0.0012) * db(-8) : 0;
    const quinta = tt >= 0 ? (a(1000) + db(-3) * b(1501.5) + db(-18) * a2(2000)) * env(tt, 0.002, 0.085) : 0;
    return sintonia + rele + 0.5 * quinta;
  }), -5);
}

function menuIn() {
  const ruido = gerador(37), pf = biquad('passa-faixa', 1.3), bq = seno(), sobe = seno(), c1 = seno(), c2 = seno(), c3 = seno();
  return acabar(render(0.42, (t) => {
    // baque: corpo grave que cai de 160 a 90 Hz, curto
    const baque = bq(90 + 70 * Math.exp(-t / 0.018)) * env(t, 0.002, 0.035) * db(-4);
    // subida de 440 a 880 Hz em 90 ms, com um tremor lento de fita
    const wow = 1 + 0.003 * Math.sin(2 * Math.PI * 5.5 * t);
    const f = (440 + 440 * suave(t / 0.09)) * wow;
    const glide = sobe(f) * env(t, 0.006, 0.07) * db(-6);
    // pouso: 880, 1320 e 1760 Hz
    const tp = t - 0.07;
    const acorde = tp >= 0 ? (c1(880 * wow) + db(-4) * c2(1320 * wow) + db(-14) * c3(1760 * wow)) * env(tp, 0.012, 0.11) : 0;
    // o sinal entrando: chiado estreito, baixo, pulsando a 24 Hz, que some em 160 ms
    const obturador = 0.65 + 0.35 * Math.sin(2 * Math.PI * 24 * t);
    const chiado = pf(ruido(), 2200) * obturador * env(t, 0.01, 0.06) * db(-14);
    return baque + glide + 0.55 * acorde + chiado;
  }), -4);
}

function menuOut() {
  const ruido = gerador(53), pb = biquad('passa-baixa', 0.9), pf = biquad('passa-faixa', 1.3), desce = seno(), h = seno(), bq = seno();
  return acabar(render(0.34, (t) => {
    // a nota desce de 880 a 330 Hz em 140 ms, e o filtro fecha de 6 kHz a 1,1 kHz: o sinal se apaga
    const p = suave(t / 0.14);
    const f = 880 - 550 * p;
    const nota = (desce(f) + db(-8) * h(2 * f)) * env(t, 0.004, 0.09);
    const fechado = pb(nota, 6000 - 4900 * p) * db(-4);
    const chiado = pf(ruido(), 1800) * (0.65 + 0.35 * Math.sin(2 * Math.PI * 24 * t)) * env(t, 0.006, 0.045) * db(-18);
    // baque final, macio
    const tb = t - 0.12;
    const baque = tb >= 0 ? bq(80 + 40 * Math.exp(-tb / 0.02)) * env(tb, 0.003, 0.03) * db(-8) : 0;
    return fechado + chiado + baque;
  }), -6);
}

// --- WAV e MP3 -------------------------------------------------------------------------------------------------------------
function wav(amostras, silencioFinal) {
  const n = amostras.length + Math.round(silencioFinal * TAXA);
  const buf = Buffer.alloc(44 + n * 2);
  buf.write('RIFF', 0); buf.writeUInt32LE(36 + n * 2, 4); buf.write('WAVE', 8);
  buf.write('fmt ', 12); buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(1, 22);
  buf.writeUInt32LE(TAXA, 24); buf.writeUInt32LE(TAXA * 2, 28); buf.writeUInt16LE(2, 32); buf.writeUInt16LE(16, 34);
  buf.write('data', 36); buf.writeUInt32LE(n * 2, 40);
  for (let i = 0; i < amostras.length; i++) buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, amostras[i])) * 32767), 44 + i * 2);
  return buf;
}
/** quadros MPEG-1 Layer III do arquivo: conta e soma a duração (1152 amostras por quadro) */
function quadrosMp3(buf) {
  let i = 0, quadros = 0, taxa = 0;
  if (buf.toString('latin1', 0, 3) === 'ID3') i = 10 + ((buf[6] & 0x7f) << 21 | (buf[7] & 0x7f) << 14 | (buf[8] & 0x7f) << 7 | (buf[9] & 0x7f));
  const KBPS = [0, 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320], TAXAS = [44100, 48000, 32000];
  while (i + 4 <= buf.length) {
    if (buf[i] !== 0xff || (buf[i + 1] & 0xe0) !== 0xe0) { i++; continue; }
    const kb = KBPS[buf[i + 2] >> 4], tx = TAXAS[(buf[i + 2] >> 2) & 3], pad = (buf[i + 2] >> 1) & 1;
    if (!kb || !tx) { i++; continue; }
    taxa = tx; quadros++;
    i += Math.floor((144000 * kb) / tx) + pad;
  }
  return { quadros, taxa, segundos: taxa ? (quadros * 1152) / taxa : 0 };
}

const SONS = { cta_in: ctaIn(), cta_out: ctaOut(), menu_IN: menuIn(), menu_OUT: menuOut() };
fs.mkdirSync(MATRIZES, { recursive: true });
fs.mkdirSync(SAIDA, { recursive: true });
for (const [nome, amostras] of Object.entries(SONS)) {
  const matriz = path.join(MATRIZES, `${nome}.wav`);
  fs.writeFileSync(matriz, wav(amostras, 0));
  let pico = 0, soma = 0;
  for (const v of amostras) { pico = Math.max(pico, Math.abs(v)); soma += v * v; }
  const linha = `${nome}: ${(amostras.length / TAXA * 1000).toFixed(0)} ms, pico ${(20 * Math.log10(pico)).toFixed(1)} dBFS, RMS ${(10 * Math.log10(soma / amostras.length)).toFixed(1)} dBFS`;
  if (SO_WAV) { console.log(linha); continue; }
  // MP3: o WAV com folga de silêncio e o MP3 ficam na pasta temporária; o arquivo publicado só é trocado depois de conferido
  const pasta = fs.mkdtempSync(path.join(process.env.TEMP || process.env.TMPDIR || '/tmp', 'sons-'));
  const tmp = path.join(pasta, `${nome}.wav`), mp3 = path.join(pasta, `${nome}.mp3`);
  const destino = path.join(SAIDA, `${nome}.mp3`);
  let ok = false, info = { quadros: 0, segundos: 0 };
  try {
    fs.writeFileSync(tmp, wav(amostras, 0.4));
    for (let tentativa = 1; tentativa <= 4 && !ok; tentativa++) {
      execFileSync('powershell', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', path.join(ROOT, 'tools/lib/mp3-windows.ps1'), '-Entrada', tmp, '-Saida', mp3, '-Taxa', String(TAXA), '-Kbps', '96', '-Canais', '1'], { stdio: 'pipe' });
      info = quadrosMp3(fs.readFileSync(mp3));
      ok = info.taxa === TAXA && info.segundos >= amostras.length / TAXA + 0.05; // o som inteiro e mais 50 ms
    }
    if (!ok) throw new Error(`${nome}: o MP3 saiu curto (${info.segundos.toFixed(3)} s) depois de 4 tentativas; o arquivo publicado não mudou`);
    fs.copyFileSync(mp3, destino);
  } finally {
    fs.rmSync(pasta, { recursive: true, force: true });
  }
  console.log(`${linha}; mp3 ${info.quadros} quadros, ${info.segundos.toFixed(3)} s, ${(fs.statSync(destino).size / 1024).toFixed(1)} KB`);
}
