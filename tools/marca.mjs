// Gera os recursos da marca a partir do arquivo oficial reference/brand/logo.jpg (o "A" colorido, 1254 x 1254, sobre campo
// preto), sem redesenhar o símbolo: cores, geometria e detalhes são os pixels do arquivo.
//
//   1. Fundo externo transparente. Só sai o preto ligado às bordas do quadro. A busca parte das bordas por uma versão erodida
//      do preto (raio 3), então não atravessa as linhas pretas finas entre as faces; depois volta ao tamanho original. O miolo
//      do A, a casa preta da escala de cinza e as linhas internas ficam, porque são desenho.
//   2. Halo escuro: a própria silhueta dilatada, por baixo, no preto do tema. Sobre fundo escuro some; sobre foto ou fundo claro
//      devolve ao símbolo o contorno preto que ele tem no arquivo. É o que dá contraste em toda tela sem tingir o símbolo.
//   3. Derivados, cada um no seu enquadramento:
//      - simbolo-cor-256.webp e simbolo-cor-768.webp: o símbolo recortado justo, com o halo, para menu, rodapé, Sobre e as
//        imagens de compartilhamento;
//      - favicon-32.png e favicon.svg: quadrado em volta do símbolo, transparente, com halo de 1 px na escala da guia;
//      - icone-toque-180.png e icone-512.png: o próprio arquivo, recortado num quadrado em volta do símbolo, com o campo preto
//        (o iOS não aceita transparência no ícone de toque);
//      - cartão de teste "sem sinal", só as barras: imagem do item-aviso.
//   node tools/marca.mjs
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const ROOT = path.resolve(import.meta.dirname, '..');
const FONTE = path.join(ROOT, 'reference/brand/logo.jpg');
const SITE = path.join(ROOT, 'public/assets/img/site');
fs.mkdirSync(SITE, { recursive: true });

/** preto do tema (--sinal-preto), usado no halo */
const HALO = [5, 5, 6];
/** fundo do arquivo: 0 ou 1 nos quatro cantos; a casa preta da escala de cinza fica em 10 a 12 */
const LIMIAR_FUNDO = 6;
const RAIO_EROSAO = 3;

const { data: rgb, info } = await sharp(FONTE).removeAlpha().toColourspace('srgb').raw().toBuffer({ resolveWithObject: true });
const W = info.width, H = info.height, N = W * H;

// --- 1. fundo externo -----------------------------------------------------------------------------------------------
const escuro = new Uint8Array(N);
for (let i = 0; i < N; i++) escuro[i] = Math.max(rgb[i * 3], rgb[i * 3 + 1], rgb[i * 3 + 2]) <= LIMIAR_FUNDO ? 1 : 0;

/** mínimo (erosão) ou máximo (dilatação) numa janela quadrada de 2*raio+1, em duas passadas */
function janela(a, w, h, raio, maximo) {
  const meio = new Uint8Array(a.length), saida = new Uint8Array(a.length);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    let v = maximo ? 0 : 255;
    for (let d = -raio; d <= raio; d++) { const xx = x + d; const s = xx < 0 || xx >= w ? (maximo ? 0 : 255) : a[y * w + xx]; v = maximo ? Math.max(v, s) : Math.min(v, s); }
    meio[y * w + x] = v;
  }
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    let v = maximo ? 0 : 255;
    for (let d = -raio; d <= raio; d++) { const yy = y + d; const s = yy < 0 || yy >= h ? (maximo ? 0 : 255) : meio[yy * w + x]; v = maximo ? Math.max(v, s) : Math.min(v, s); }
    saida[y * w + x] = v;
  }
  return saida;
}
// fora do quadro conta como fundo na erosão: a borda do arquivo não fecha a busca
const erodido = janela(escuro, W, H, RAIO_EROSAO, false);
const externo = new Uint8Array(N);
const fila = new Int32Array(N);
let ini = 0, fim = 0;
const semear = (i) => { if (erodido[i] && !externo[i]) { externo[i] = 1; fila[fim++] = i; } };
for (let x = 0; x < W; x++) { semear(x); semear((H - 1) * W + x); }
for (let y = 0; y < H; y++) { semear(y * W); semear(y * W + W - 1); }
while (ini < fim) {
  const i = fila[ini++], x = i % W, y = (i - x) / W;
  if (x > 0) semear(i - 1);
  if (x < W - 1) semear(i + 1);
  if (y > 0) semear(i - W);
  if (y < H - 1) semear(i + W);
}
const fundo = janela(externo, W, H, RAIO_EROSAO + 1, true);
for (let i = 0; i < N; i++) fundo[i] = fundo[i] && escuro[i] ? 1 : 0;

// caixa do símbolo
let x0 = W, y0 = H, x1 = 0, y1 = 0;
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (!fundo[y * W + x]) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
const larg = x1 - x0 + 1, alt = y1 - y0 + 1;

// --- 2. RGBA: o arquivo onde é símbolo, transparente onde é fundo externo, com o halo por baixo ------------------------
/** RGBA do símbolo numa tela maior (margem m em volta da caixa), com halo de raio r em pixels do arquivo */
function rgbaComHalo(m, r) {
  const w = larg + 2 * m, h = alt + 2 * m;
  const alfa = new Uint8Array(w * h);
  const cor = Buffer.alloc(w * h * 3);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const sx = x0 - m + x, sy = y0 - m + y;
    if (sx < 0 || sy < 0 || sx >= W || sy >= H) continue;
    const i = sy * W + sx;
    if (!fundo[i]) { alfa[y * w + x] = 255; cor[(y * w + x) * 3] = rgb[i * 3]; cor[(y * w + x) * 3 + 1] = rgb[i * 3 + 1]; cor[(y * w + x) * 3 + 2] = rgb[i * 3 + 2]; }
  }
  const halo = r > 0 ? janela(alfa, w, h, r, true) : new Uint8Array(w * h);
  const saida = Buffer.alloc(w * h * 4);
  for (let i = 0; i < w * h; i++) {
    if (alfa[i]) { saida[i * 4] = cor[i * 3]; saida[i * 4 + 1] = cor[i * 3 + 1]; saida[i * 4 + 2] = cor[i * 3 + 2]; saida[i * 4 + 3] = 255; }
    else if (halo[i]) { saida[i * 4] = HALO[0]; saida[i * 4 + 1] = HALO[1]; saida[i * 4 + 2] = HALO[2]; saida[i * 4 + 3] = 255; }
  }
  return { buf: saida, w, h };
}
const raw = ({ buf, w, h }) => sharp(buf, { raw: { width: w, height: h, channels: 4 } });

// --- 3. derivados ---------------------------------------------------------------------------------------------------
// Símbolo com halo de 24 px do arquivo (cerca de 1 px de tela no menu) e 2 px de folga. A forma ocupa alt/(alt+52) da altura
// do arquivo: o tema usa esse número para a altura da forma igualar a da caixa.
const MARGEM = 26;
const comHalo = rgbaComHalo(MARGEM, 24);
// 256 serve menu, rodapé e Sobre (até 3x de densidade); 768 só alimenta as imagens de compartilhamento
await raw(comHalo).resize({ height: 256, kernel: 'lanczos3' }).webp({ lossless: true, effort: 6 }).toFile(path.join(SITE, 'simbolo-cor-256.webp'));
await raw(comHalo).resize({ height: 768, kernel: 'lanczos3' }).webp({ quality: 92, alphaQuality: 100, effort: 6 }).toFile(path.join(SITE, 'simbolo-cor-768.webp'));
console.log(`símbolo ${larg} x ${alt} em (${x0}, ${y0}); folga ${MARGEM}: a forma ocupa ${((alt / (alt + 2 * MARGEM)) * 100).toFixed(2)}% da altura`);

// Favicon: quadrado em volta do símbolo com 4% de folga de cada lado, reduzido, e o halo feito na escala do ícone, para dar
// 1 px na guia. A redução é sobre o símbolo sem halo, com alfa pré-multiplicado: as cores não escurecem na borda.
const ladoFav = Math.round(Math.max(larg, alt) * 1.08);
const semHalo = rgbaComHalo(Math.ceil((ladoFav - Math.min(larg, alt)) / 2) + 2, 0);
const recorteFav = { left: Math.round((semHalo.w - ladoFav) / 2), top: Math.round((semHalo.h - ladoFav) / 2), width: ladoFav, height: ladoFav };
async function favicon(l, raio, alfaHalo) {
  const { data } = await raw(semHalo).extract(recorteFav).resize(l, l, { kernel: 'lanczos3' }).raw().toBuffer({ resolveWithObject: true });
  const a = new Uint8Array(l * l);
  for (let i = 0; i < l * l; i++) a[i] = data[i * 4 + 3];
  const h = janela(a, l, l, raio, true);
  const out = Buffer.alloc(l * l * 4);
  for (let i = 0; i < l * l; i++) {
    const fa = a[i] / 255, ha = (h[i] / 255) * alfaHalo, ta = fa + ha * (1 - fa);
    for (let c = 0; c < 3; c++) out[i * 4 + c] = ta > 0 ? Math.round((data[i * 4 + c] * fa + HALO[c] * ha * (1 - fa)) / ta) : 0;
    out[i * 4 + 3] = Math.round(ta * 255);
  }
  return sharp(out, { raw: { width: l, height: l, channels: 4 } }).png({ compressionLevel: 9 }).toBuffer();
}
fs.writeFileSync(path.join(SITE, 'favicon-32.png'), await favicon(32, 1, 0.9));
// SVG: a mesma imagem a 96 px, com halo de 3 px (1 px na guia). Uma imagem só: as cores do símbolo não mudam com o tema da guia,
// e o halo escuro some na guia escura e contorna o símbolo na clara.
fs.writeFileSync(
  path.join(SITE, 'favicon.svg'),
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96"><image id="simbolo" href="data:image/png;base64,${(await favicon(96, 3, 0.9)).toString('base64')}" width="96" height="96"/></svg>\n`,
);

// Ícones de toque: o próprio JPG, num quadrado em volta do símbolo em que ele ocupa 80% da altura, sem margem preta a mais.
let RECORTE_ICONE;
{
  const lado = Math.min(W, H, Math.round(alt / 0.8));
  const cx = x0 + larg / 2, cy = y0 + alt / 2;
  const left = Math.max(0, Math.min(W - lado, Math.round(cx - lado / 2)));
  const top = Math.max(0, Math.min(H - lado, Math.round(cy - lado / 2)));
  for (const [nome, l] of [['icone-toque-180.png', 180], ['icone-512.png', 512]]) {
    await sharp(FONTE).removeAlpha().extract({ left, top, width: lado, height: lado }).resize(l, l, { kernel: 'lanczos3' }).png({ compressionLevel: 9 }).toFile(path.join(SITE, nome));
  }
  RECORTE_ICONE = { left, top, lado };
}

// Recorte e máscara do fundo, para os testes conferirem os derivados contra o arquivo
fs.writeFileSync(path.join(ROOT, 'reference/brand/logo-recorte.json'), JSON.stringify({ arquivo: 'logo.jpg', x0, y0, largura: larg, altura: alt, margemSimbolo: MARGEM, ladoFavicon: ladoFav, icone: RECORTE_ICONE, limiarFundo: LIMIAR_FUNDO, raioErosao: RAIO_EROSAO }, null, 1) + '\n');

// Cartão de teste: as mesmas barras SMPTE do tema.
const BARRAS = ['#c0c0c0', '#c0c000', '#00c0c0', '#00c000', '#c000c0', '#c00000', '#0000c0'];
const INVERSAS = ['#0000c0', '#131313', '#c000c0', '#131313', '#00c0c0', '#131313', '#c0c0c0'];
const BASE = [['#00214c', 17.86], ['#ffffff', 17.85], ['#32006a', 17.86], ['#131313', 17.86], ['#090909', 4.77], ['#131313', 4.75], ['#1d1d1d', 4.75], ['#131313', 14.3]];

function cartaoSvg(l, a) {
  const faixa = (cores, y, h) => cores.map((c, i) => `<rect x="${(i * l) / cores.length}" y="${y}" width="${l / cores.length + 1}" height="${h}" fill="${c}"/>`).join('');
  let x = 0;
  const base = BASE.map(([c, p]) => {
    const w = (p / 100) * l;
    const r = `<rect x="${x}" y="${a * 0.75}" width="${w + 1}" height="${a * 0.25}" fill="${c}"/>`;
    x += w;
    return r;
  }).join('');
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${l}" height="${a}">${faixa(BARRAS, 0, a * 0.67)}${faixa(INVERSAS, a * 0.67, a * 0.08)}${base}</svg>`);
}

async function cartao(l, a, nome) {
  await sharp(cartaoSvg(l, a)).webp({ quality: 88 }).toFile(path.join(SITE, `${nome}.webp`));
}
await cartao(1600, 900, 'sem-sinal-1600');
await cartao(800, 1200, 'sem-sinal-800');
await cartao(640, 360, 'sem-sinal-640');
await cartao(160, 110, 'sem-sinal-160');
console.log('marca gerada em', path.relative(ROOT, SITE));
