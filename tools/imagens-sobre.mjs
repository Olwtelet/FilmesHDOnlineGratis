// Prepara os arcos e a moldura do CTA de /sobre/ em public/assets/img/sobre/, recortados dos originais de alta
// resolução em reference/sessoes-origem/ (só a pasta local, nada é baixado).
//   node tools/imagens-sobre.mjs
// O recorte é escolhido à mão: cada entrada diz de qual sessão vem e onde fica o centro do recorte, em fração da imagem.
// Os arcos pedem uma figura que funcione em pé. Filmes com suástica ou símbolo fascista em cena ficam de fora.
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const ROOT = path.resolve(import.meta.dirname, '..');
const ORIGEM = path.join(ROOT, 'reference/sessoes-origem');
const SAIDA = path.join(ROOT, 'public/assets/img/sobre');
const QUALIDADE = 78;

/** proporção dos arcos do herói: 469 x 1086 */
const ARCO = 469 / 1086;
/** proporção da moldura do CTA: 2126 x 1097 */
const CTA = 2126 / 1097;

const RECORTES = [
  { nome: 'arco-esquerdo', slug: 'eyes-wide-shut-1999', proporcao: ARCO, centroX: 0.25, centroY: 0.5, larguras: [466] },
  { nome: 'arco-direito', slug: 'the-lobster-2015', proporcao: ARCO, centroX: 0.76, centroY: 0.5, larguras: [640] },
  { nome: 'arco-movel', slug: 'pulp-fiction-1994', proporcao: ARCO, centroX: 0.63, centroY: 0.5, larguras: [639, 500] },
  { nome: 'cta', slug: 'the-long-walk-2025', proporcao: CTA, centroX: 0.5, centroY: 0.52, larguras: [2126, 1600, 800, 500] },
];

function original(slug) {
  const pasta = path.join(ORIGEM, slug);
  const arquivo = fs.readdirSync(pasta).find((f) => f.startsWith('original-'));
  if (!arquivo) throw new Error(`${slug}: nenhum original-*.jpg em ${pasta}`);
  return path.join(pasta, arquivo);
}

fs.mkdirSync(SAIDA, { recursive: true });
for (const r of RECORTES) {
  const entrada = original(r.slug);
  const { width, height } = await sharp(entrada).metadata();
  // o maior retângulo na proporção pedida, centrado em (centroX, centroY) sem sair da imagem
  const h = Math.min(height, Math.round(width / r.proporcao));
  const w = Math.round(h * r.proporcao);
  const left = Math.max(0, Math.min(width - w, Math.round(width * r.centroX - w / 2)));
  const top = Math.max(0, Math.min(height - h, Math.round(height * r.centroY - h / 2)));
  for (const largura of r.larguras) {
    if (largura > w) console.warn(`${r.nome}: ${largura} px é maior que o recorte de ${w} px`);
    const unico = r.larguras.length === 1;
    const destino = path.join(SAIDA, unico ? `${r.nome}.webp` : `${r.nome}-${largura}.webp`);
    await sharp(entrada)
      .extract({ left, top, width: w, height: h })
      .resize({ width: Math.min(largura, w) })
      .webp({ quality: QUALIDADE, effort: 6 })
      .toFile(destino);
    const kb = Math.round(fs.statSync(destino).size / 1024);
    console.log(`${path.basename(destino)}: ${r.slug}, recorte ${w}x${h}, saída ${Math.min(largura, w)} px, ${kb} KB`);
  }
}
