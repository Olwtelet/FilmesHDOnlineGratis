// Gera os recursos da marca a partir do arquivo oficial reference/brand/simbolo.png, sem redesenhar a forma:
//   - máscara com transparência (alfa = luminância da fonte; só limpa o ruído do arquivo nas pontas);
//   - favicon e ícone de toque (o próprio arquivo reduzido, branco sobre preto);
//   - cartão de teste "sem sinal", só as barras: imagem do item-aviso e dos cartões da página Sobre.
//   node tools/marca.mjs
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const ROOT = path.resolve(import.meta.dirname, '..');
const FONTE = path.join(ROOT, 'reference/brand/simbolo.png');
const SITE = path.join(ROOT, 'public/assets/img/site');
fs.mkdirSync(SITE, { recursive: true });

const { data, info } = await sharp(FONTE).removeAlpha().raw().toBuffer({ resolveWithObject: true });
const px = info.width * info.height;
const rgba = Buffer.alloc(px * 4, 255);
for (let i = 0; i < px; i++) {
  const o = i * info.channels;
  const l = 0.2126 * data[o] + 0.7152 * data[o + 1] + 0.0722 * data[o + 2];
  rgba[i * 4 + 3] = Math.max(0, Math.min(255, Math.round(((l - 24) * 255) / (232 - 24))));
}
const mascara = sharp(rgba, { raw: { width: info.width, height: info.height, channels: 4 } });
await mascara.clone().webp({ lossless: true, effort: 6 }).toFile(path.join(SITE, 'simbolo-mascara.webp'));
await mascara.clone().resize(256, 256).webp({ lossless: true, effort: 6 }).toFile(path.join(SITE, 'simbolo-mascara-256.webp'));
await mascara.clone().png({ compressionLevel: 9 }).toFile(path.join(SITE, 'simbolo-transparente.png'));

await sharp(FONTE).removeAlpha().resize(32, 32).png().toFile(path.join(SITE, 'favicon-32.png'));
await sharp(FONTE).removeAlpha().resize(180, 180).png().toFile(path.join(SITE, 'icone-toque-180.png'));
await sharp(FONTE).removeAlpha().resize(512, 512).png().toFile(path.join(SITE, 'icone-512.png'));

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
