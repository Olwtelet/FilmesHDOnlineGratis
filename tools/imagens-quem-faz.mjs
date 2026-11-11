// Prepara as imagens dos cartões "QUEM FAZ" de /sobre/ em public/assets/img/sobre/, a partir dos originais guardados em
// reference/brand/ (que não são servidos nem alterados).
//   node tools/imagens-quem-faz.mjs
//
// Olwtelet (reference/brand/goat.png, 1254 x 1254, pixel art): o painel do cartão muda de forma com a largura, de 0,38 (227 x
// 599 px a 992 px) a quadrado, e um recorte da imagem quadrada não segura o gorro, o pompom e o rosto em todas. Por isso a
// imagem vira um pôster mais alto: o céu estrelado continua para cima, 946 px, feito de retalhos do próprio céu da imagem
// (só das regiões sem gorro e sem as estrelas grandes em cruz), virados ao acaso, com o tom médio trocado pelo das primeiras
// linhas do original e um leve escurecimento para o alto. As 50 primeiras linhas do original, céu puro, fazem a transição.
// Nada do retrato é alterado nem ampliado. O tema (seção 7e) cobre o painel com o pôster em object-position 63% 100%: o gorro
// (x 330 a 885, a partir de y 85), o pompom (x 900 a 1060) e o rosto (até o queixo, perto de y 1110) ficam inteiros em todas as
// larguras, e no painel quadrado aparece a imagem original inteira.
//
// Sala 24 (reference/brand/simbolo.png, 1024 x 1024): o símbolo da marca, branco sobre preto. O desenho ocupa x 205 a 843 e
// y 112 a 911, medido aqui pelo que não é preto. O recorte deixa 4% da altura do desenho de margem; o resto do respiro vem
// do padding do painel, no mesmo preto. Forma e proporção do símbolo não mudam.
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const ROOT = path.resolve(import.meta.dirname, '..');
const ORIGEM = path.join(ROOT, 'reference/brand');
const SAIDA = path.join(ROOT, 'public/assets/img/sobre');
fs.mkdirSync(SAIDA, { recursive: true });

/** grava as larguras pedidas de uma imagem já recortada, sem nunca ampliar */
async function gravar(buffer, nome, larguras, qualidade) {
  const { width } = await sharp(buffer).metadata();
  for (const w of larguras) {
    if (w > width) throw new Error(`${nome}: ${w} px ampliaria a imagem de ${width} px`);
    const destino = path.join(SAIDA, `${nome}-${w}.webp`);
    const info = await sharp(buffer).resize({ width: w }).webp({ quality: qualidade, effort: 6 }).toFile(destino);
    console.log(`${path.relative(ROOT, destino)}: ${info.width} x ${info.height}, ${(info.size / 1024).toFixed(1)} KB`);
  }
}

// --- Olwtelet: pôster com o céu estendido -------------------------------------------------------------------------------
export const CEU_EXTRA = 946;
async function posterOlwtelet() {
  const { data: src, info } = await sharp(path.join(ORIGEM, 'goat.png')).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const W = info.width, H0 = info.height, EXT = CEU_EXTRA, H = H0 + EXT;
  if (W !== 1254 || H0 !== 1254) throw new Error(`goat.png: esperado 1254 x 1254, veio ${W} x ${H0}`);
  const px = (x, y) => { const i = (y * W + x) * 3; return [src[i], src[i + 1], src[i + 2]]; };
  let semente = 24; // determinístico: rodar de novo dá o mesmo arquivo
  const acaso = () => { semente = (semente * 1103515245 + 12345) & 0x7fffffff; return semente / 0x7fffffff; };
  // céu puro: à esquerda do gorro e à direita da ponta dele
  const REGIOES = [{ x0: 0, x1: 320, y0: 0, y1: 430 }, { x0: 1070, x1: W, y0: 0, y1: 380 }];
  const P = 112, F = 32, MISTURA = 50;
  const retalhos = [];
  for (const r of REGIOES) for (let y = r.y0; y + P <= r.y1; y += 8) for (let x = r.x0; x + P <= r.x1; x += 8) {
    let max = 0, s0 = 0, s1 = 0, s2 = 0, n = 0;
    for (let yy = y; yy < y + P; yy += 2) for (let xx = x; xx < x + P; xx += 2) { const [a, b, c] = px(xx, yy); max = Math.max(max, a + b + c); s0 += a; s1 += b; s2 += c; n++; }
    if (max < 420) retalhos.push({ x, y, media: [s0 / n, s1 / n, s2 / n] }); // sem as estrelas grandes em cruz
  }
  if (retalhos.length < 100) throw new Error(`goat.png: só ${retalhos.length} retalhos de céu`);
  const base = [0, 0, 0];
  for (let y = 0; y < 40; y++) for (let x = 0; x < W; x++) { const c = px(x, y); base[0] += c[0]; base[1] += c[1]; base[2] += c[2]; }
  base.forEach((v, i) => (base[i] = v / (40 * W)));
  const out = new Float32Array(W * H * 3);
  for (let y = 0; y < H0; y++) for (let x = 0; x < W; x++) { const o = ((y + EXT) * W + x) * 3, i = (y * W + x) * 3; out[o] = src[i]; out[o + 1] = src[i + 1]; out[o + 2] = src[i + 2]; }
  const alto = EXT + MISTURA, acum = new Float32Array(W * alto * 3), peso = new Float32Array(W * alto);
  for (let gy = -F; gy < alto + F; gy += P - F) for (let gx = -F; gx < W; gx += P - F) {
    const r = retalhos[Math.floor(acaso() * retalhos.length)];
    const fx = acaso() < 0.5, fy = acaso() < 0.5;
    for (let y = 0; y < P; y++) for (let x = 0; x < P; x++) {
      const X = gx + x, Y = gy + y;
      if (X < 0 || X >= W || Y < 0 || Y >= alto) continue;
      const w = Math.max(1e-3, Math.min(1, (x + 1) / F, (P - x) / F) * Math.min(1, (y + 1) / F, (P - y) / F));
      const c = px(r.x + (fx ? P - 1 - x : x), r.y + (fy ? P - 1 - y : y));
      const i = Y * W + X;
      for (let k = 0; k < 3; k++) acum[i * 3 + k] += (c[k] - r.media[k] + base[k]) * w;
      peso[i] += w;
    }
  }
  for (let Y = 0; Y < alto; Y++) for (let X = 0; X < W; X++) {
    const i = Y * W + X, o = i * 3;
    const escurece = Y >= EXT ? 1 : 1 - 0.15 * Math.pow(1 - Y / EXT, 1.4);
    const t = Y < EXT ? 0 : (Y - EXT) / MISTURA; // dentro do original: do retalho (linha 0) ao original (linha 50)
    for (let k = 0; k < 3; k++) out[o + k] = t * out[o + k] + (1 - t) * (acum[o + k] / peso[i]) * escurece;
  }
  const buf = Buffer.alloc(W * H * 3);
  for (let i = 0; i < buf.length; i++) buf[i] = Math.max(0, Math.min(255, Math.round(out[i])));
  return sharp(buf, { raw: { width: W, height: H, channels: 3 } }).png().toBuffer();
}

// --- Sala 24: o símbolo preto e branco ----------------------------------------------------------------------------------
async function recorteSimbolo() {
  const arquivo = path.join(ORIGEM, 'simbolo.png');
  const { data, info } = await sharp(arquivo).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  let x0 = info.width, y0 = info.height, x1 = -1, y1 = -1;
  for (let y = 0; y < info.height; y++) for (let x = 0; x < info.width; x++) {
    const i = (y * info.width + x) * 3;
    if (Math.max(data[i], data[i + 1], data[i + 2]) > 40) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
  }
  const m = Math.round((y1 - y0 + 1) * 0.04);
  const r = { left: x0 - m, top: y0 - m, width: x1 - x0 + 1 + 2 * m, height: y1 - y0 + 1 + 2 * m };
  if (r.left < 0 || r.top < 0 || r.left + r.width > info.width || r.top + r.height > info.height) throw new Error('simbolo.png: recorte fora da imagem');
  return sharp(arquivo).extract(r).png().toBuffer();
}

await gravar(await posterOlwtelet(), 'olwtelet', [860, 430], 86);
await gravar(await recorteSimbolo(), 'sala-24', [700, 350], 90);
