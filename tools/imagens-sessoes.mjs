// Prepara as imagens das sessões em public/assets/img/sessoes/<slug>/ a partir de cada
// src/data/sessoes/<slug>.json. Cada imagem do JSON aponta para o TMDB ({ "tmdb": "arquivo.jpg" }) ou
// para um arquivo local ({ "arquivo": "caminho/relativo/ao/projeto.jpg" }).
//   node tools/imagens-sessoes.mjs            só o que falta
//   node tools/imagens-sessoes.mjs <slug>     uma sessão
//   node tools/imagens-sessoes.mjs --forcar   refaz tudo
// Os originais baixados ficam em reference/sessoes-origem/, fora do site publicado.
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const ROOT = path.resolve(import.meta.dirname, '..');
const DADOS = path.join(ROOT, 'src/data/sessoes');
const SAIDA = path.join(ROOT, 'public/assets/img/sessoes');
const ORIGEM = path.join(ROOT, 'reference/sessoes-origem');

const args = process.argv.slice(2);
const FORCAR = args.includes('--forcar');
const SO = args.find((a) => !a.startsWith('--'));

// O roll usa `src` como textura WebGL, por isso a maior versão dele fica em 1600 px.
const HERO = [1920, 1600, 1080, 800, 500];
const CARTAZ = [800, 500];
const CENA = [960, 640];
const QUALIDADE = 76;

async function baixar(url, destino) {
  if (fs.existsSync(destino)) return;
  fs.mkdirSync(path.dirname(destino), { recursive: true });
  for (let tentativa = 1; ; tentativa++) {
    const r = await fetch(url);
    if (r.ok) {
      fs.writeFileSync(destino, Buffer.from(await r.arrayBuffer()));
      return;
    }
    if (tentativa >= 3) throw new Error(`${url}: HTTP ${r.status}`);
    await new Promise((ok) => setTimeout(ok, 1500 * tentativa));
  }
}

async function origem(img, slug, tamanho) {
  if (img.arquivo) return path.resolve(ROOT, img.arquivo);
  // recortes partem do original, para não perder definição
  const t = img.recorte ? 'original' : tamanho;
  const destino = path.join(ORIGEM, slug, `${t}-${img.tmdb}`);
  await baixar(`https://image.tmdb.org/t/p/${t}/${img.tmdb}`, destino);
  return destino;
}

async function derivar(entrada, destino, largura, opcoes = {}) {
  if (fs.existsSync(destino) && !FORCAR) return;
  fs.mkdirSync(path.dirname(destino), { recursive: true });
  let p = sharp(entrada).rotate();
  if (opcoes.recorte) {
    const { width, height } = await sharp(entrada).metadata();
    const { x, y, largura: l, altura: a } = opcoes.recorte;
    const left = Math.round(x * width);
    const top = Math.round(y * height);
    p = sharp(await p.extract({ left, top, width: Math.min(Math.round(l * width), width - left), height: Math.min(Math.round(a * height), height - top) }).toBuffer());
  }
  p = opcoes.altura
    ? p.resize(largura, opcoes.altura, { fit: 'cover', position: 'attention' })
    : p.resize({ width: largura, withoutEnlargement: true });
  await p.webp({ quality: QUALIDADE, effort: 5 }).toFile(destino);
}

async function preparar(sessao) {
  const pasta = path.join(SAIDA, sessao.slug);
  const { hero, cartaz, direcao, cenas } = sessao.imagens;
  const h = await origem(hero, sessao.slug, 'original');
  for (const l of HERO) await derivar(h, path.join(pasta, `hero-${l}.webp`), l, { recorte: hero.recorte });
  await derivar(h, path.join(pasta, 'miniatura-160.webp'), 160, { altura: 110, recorte: hero.recorte });
  const c = await origem(cartaz, sessao.slug, 'w780');
  for (const l of CARTAZ) await derivar(c, path.join(pasta, `cartaz-${l}.webp`), l, { recorte: cartaz.recorte });
  const d = await origem(direcao, sessao.slug, 'w1280');
  await derivar(d, path.join(pasta, 'direcao-720.webp'), 720, { altura: 1200, recorte: direcao.recorte });
  for (let i = 0; i < cenas.length; i++) {
    const n = String(i + 1).padStart(2, '0');
    const e = await origem(cenas[i], sessao.slug, 'w1280');
    for (const l of CENA) await derivar(e, path.join(pasta, `cena-${n}-${l}.webp`), l, { recorte: cenas[i].recorte });
  }
  return cenas.length;
}

const arquivos = fs.readdirSync(DADOS).filter((a) => a.endsWith('.json') && !a.startsWith('_'));
const fila = arquivos.map((a) => JSON.parse(fs.readFileSync(path.join(DADOS, a), 'utf8'))).filter((s) => !SO || s.slug === SO);
if (SO && !fila.length) throw new Error(`sessão não encontrada: ${SO}`);

const falhas = [];
await Promise.all(
  Array.from({ length: 4 }, async () => {
    for (let s = fila.shift(); s; s = fila.shift()) {
      try {
        console.log(s.slug, await preparar(s), 'cenas');
      } catch (e) {
        falhas.push(`${s.slug}: ${e.message}`);
      }
    }
  }),
);
if (falhas.length) {
  console.error(falhas.join('\n'));
  process.exit(1);
}
