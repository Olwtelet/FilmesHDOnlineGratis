// Prepara as imagens dos cartões "QUEM FAZ" de /sobre/ em public/assets/img/sobre/, a partir dos originais guardados em
// reference/brand/ (que não são servidos nem alterados).
//   node tools/imagens-quem-faz.mjs
//
// Foto do Olwtelet (736 x 981): recorte vertical de x 205 a 625, altura inteira. Mantém a pessoa inteira na largura, do
// cotovelo esquerdo (x 265) ao braço direito (x 615), e tira da borda direita o tronco, a perna e o canto inferior onde está a
// pessoa que segura o guarda-chuva; a mão no cabo fica, porque cortar ali cortaria o braço de quem está na foto. O cartão
// alinha o recorte pelo alto (object-position no tema-sinal.css), então a cabeça e o rosto ficam à vista em todas as larguras.
// Nada é ampliado: o original só tem 736 px de largura, e o recorte sai na resolução dele.
//
// Logo (reference/brand/logo.jpg, a marca do site, 1254 x 1254): o símbolo ocupa x 251 a 1034 e y 135 a 1116, medido por
// tools/marca.mjs em reference/brand/logo-recorte.json, com campo preto puro em volta. O recorte deixa uma margem de 4% da
// altura do símbolo; o resto do respiro vem do padding do painel, que tem o mesmo preto, e o símbolo fica
// grande sem encostar nas bordas. Cores e proporções do símbolo não mudam.
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const ROOT = path.resolve(import.meta.dirname, '..');
const ORIGEM = path.join(ROOT, 'reference/brand');
const SAIDA = path.join(ROOT, 'public/assets/img/sobre');
const LOGO = JSON.parse(fs.readFileSync(path.join(ORIGEM, 'logo-recorte.json'), 'utf8'));
const MARGEM_LOGO = Math.round(LOGO.altura * 0.04);

const SAIDAS = [
  {
    arquivo: 'Foto do Olwtelet.jpg',
    nome: 'olwtelet',
    recorte: { left: 205, top: 0, width: 420, height: 981 },
    larguras: [420, 300],
    qualidade: 82,
  },
  {
    arquivo: LOGO.arquivo,
    nome: 'sala-24',
    recorte: { left: LOGO.x0 - MARGEM_LOGO, top: LOGO.y0 - MARGEM_LOGO, width: LOGO.largura + 2 * MARGEM_LOGO, height: LOGO.altura + 2 * MARGEM_LOGO },
    larguras: [860, 430],
    qualidade: 90,
  },
];

fs.mkdirSync(SAIDA, { recursive: true });
for (const s of SAIDAS) {
  const entrada = path.join(ORIGEM, s.arquivo);
  const { width, height } = await sharp(entrada).metadata();
  const r = s.recorte;
  if (r.left < 0 || r.top < 0 || r.left + r.width > width || r.top + r.height > height) throw new Error(`${s.arquivo}: recorte fora da imagem`);
  for (const w of s.larguras) {
    if (w > r.width) throw new Error(`${s.nome}: ${w} px ampliaria o recorte de ${r.width} px`);
    const destino = path.join(SAIDA, `${s.nome}-${w}.webp`);
    const info = await sharp(entrada).extract(r).resize({ width: w }).webp({ quality: s.qualidade, effort: 6 }).toFile(destino);
    console.log(`${path.relative(ROOT, destino)}: ${info.width} x ${info.height}, ${(info.size / 1024).toFixed(1)} KB`);
  }
}
