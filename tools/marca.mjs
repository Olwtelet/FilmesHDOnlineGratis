// Gera os recursos da marca a partir do arquivo oficial reference/brand/simbolo.png, sem redesenhar a forma:
//   - máscara com transparência (alfa = luminância da fonte; só limpa o ruído do arquivo nas pontas);
//   - favicon com transparência: a mesma máscara, recortada num quadrado em volta da forma, com um halo fino, a própria forma
//     dilatada, por baixo e no tom contrário. Em PNG, branco com halo escuro; em SVG, branco com halo escuro em guia escura e quase
//     preto com halo claro em guia clara. O halo some na guia do mesmo tom e contorna a forma na do tom contrário, que é o caso da
//     janela anônima com o Windows claro (guia escura, conteúdo claro);
//   - ícone de toque (o próprio arquivo reduzido, branco sobre preto: o iOS não aceita transparência ali);
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

// Recorte quadrado em volta da forma, com 4% de folga: na guia o símbolo ocupa o ícone quase inteiro. Só enquadra, não redesenha.
const alfa = await mascara.clone().extractChannel(3).raw().toBuffer();
let x0 = info.width, y0 = info.height, x1 = 0, y1 = 0;
for (let y = 0; y < info.height; y++) for (let x = 0; x < info.width; x++) if (alfa[y * info.width + x] > 8) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
const lado = Math.min(info.width, info.height, Math.round(Math.max(x1 - x0 + 1, y1 - y0 + 1) * 1.08));
const meio = (a, b, limite) => Math.max(0, Math.min(limite - lado, Math.round((a + b + 1) / 2 - lado / 2)));
const RECORTE_FAVICON = { left: meio(x0, x1, info.width), top: meio(y0, y1, info.height), width: lado, height: lado };
const alfaEm = (l) => mascara.clone().extract(RECORTE_FAVICON).resize(l, l, { kernel: 'lanczos3' }).extractChannel(3).raw().toBuffer();
// máximo numa janela quadrada de 2*raio+1, em duas passadas
function dilatar(a, l, raio) {
  const meioPasso = new Uint8Array(a.length);
  const saida = Buffer.alloc(a.length);
  for (let y = 0; y < l; y++) for (let x = 0; x < l; x++) { let m = 0; for (let d = -raio; d <= raio; d++) if (x + d >= 0 && x + d < l) m = Math.max(m, a[y * l + x + d]); meioPasso[y * l + x] = m; }
  for (let y = 0; y < l; y++) for (let x = 0; x < l; x++) { let m = 0; for (let d = -raio; d <= raio; d++) if (y + d >= 0 && y + d < l) m = Math.max(m, meioPasso[(y + d) * l + x]); saida[y * l + x] = m; }
  return saida;
}
// alfa vira PNG branco: é assim que a máscara de luminância do SVG lê
const brancoCom = (a, l) => { const b = Buffer.alloc(l * l * 4, 255); for (let i = 0; i < l * l; i++) b[i * 4 + 3] = a[i]; return sharp(b, { raw: { width: l, height: l, channels: 4 } }).png({ compressionLevel: 9 }).toBuffer(); };
{
  // PNG de 32: forma branca sobre halo preto a 85%, de 1 px
  const forma = await alfaEm(32);
  const halo = dilatar(forma, 32, 1);
  const rgba = Buffer.alloc(32 * 32 * 4);
  for (let i = 0; i < 32 * 32; i++) {
    const f = forma[i] / 255, h = (halo[i] / 255) * 0.85, a = f + h * (1 - f);
    const c = a > 0 ? Math.round((255 * f) / a) : 0;
    rgba[i * 4] = rgba[i * 4 + 1] = rgba[i * 4 + 2] = c;
    rgba[i * 4 + 3] = Math.round(a * 255);
  }
  await sharp(rgba, { raw: { width: 32, height: 32, channels: 4 } }).png({ compressionLevel: 9 }).toFile(path.join(SITE, 'favicon-32.png'));
}
{
  // SVG: a forma e o halo de 3 px a 96, que dá 1 px na guia
  const forma = await alfaEm(96);
  const f64 = (await brancoCom(forma, 96)).toString('base64');
  const h64 = (await brancoCom(dilatar(forma, 96, 3), 96)).toString('base64');
  fs.writeFileSync(
    path.join(SITE, 'favicon.svg'),
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96">' +
      '<style>#h{fill:#000;fill-opacity:.85}#f{fill:#fff}@media (prefers-color-scheme:light){#h{fill:#fff;fill-opacity:.9}#f{fill:#151515}}</style>' +
      `<mask id="mh"><image id="halo" href="data:image/png;base64,${h64}" width="96" height="96"/></mask>` +
      `<mask id="mf"><image id="forma" href="data:image/png;base64,${f64}" width="96" height="96"/></mask>` +
      '<rect id="h" width="96" height="96" mask="url(#mh)"/><rect id="f" width="96" height="96" mask="url(#mf)"/></svg>\n',
  );
}
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
