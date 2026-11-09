// Varre o site publicado (dist/) atrás de marca antiga, filmes de demonstração, estrelas, promessas e links quebrados.
//   npm run build && node tools/testes/varredura.mjs
// Olha o HTML inteiro (texto, atributos, comentários, dados embutidos), CSS, JS local, XML e nomes de arquivo.
import fs from 'node:fs';
import path from 'node:path';

const DIST = path.resolve(import.meta.dirname, '../../dist');
const andar = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? andar(path.join(d, e.name)) : [path.join(d, e.name)]));
const arquivos = andar(DIST);
const rel = (f) => '/' + path.relative(DIST, f).replaceAll('\\', '/');
const achados = [];

const VETADO = [
  /siena/i, /film foundation/i, /tel aviv/i, /dizengoff/i, /\b972\b/, /leelu/i, /dorit/i, /zohar/i, /\bvariety\b/i, /cinematic triumph/i, /director'?s cut/i, /a film based on/i,
  /savoy/i, /moon in the 12th/i, /\btaboo\b/i, /kafka/i, /my project x/i, /prisoner x/i, /ana maxim/i, /outsider[- ]freud/i, /freud/i, /by any means/i, /housewife/i,
  /rating[-_ ]?stars?/i, /footagemenu-stars/i, /stars\.svg/i, /\b5\/5\b/, /★|☆/,
  /steam/i, /a24/i, /all rights reserved/i, /lorem ipsum/i, /no items found/i, /this is some text/i, /data-wf-site/, /website-files\.com/, /webflow\.com\b/i,
  /assista (agora|gr[áa]tis|online)/i, /baixe|download gr[áa]tis/i,
  /\b(Inquiries|Press|Stay up to date|Follow us|All Work|Showcase|Investors|Broadcast|Main Crew|Producers|See case study|Our Services|Who we are|Watch Trailer|Sound on|Hold and drag|Go back|Page not found|Explore)\b/,
];
// bibliotecas e CSS minificados carregam palavras e classes que o público não vê; aqui só a marca conta
const SO_MARCA = /\/assets\/(js\/(app|webflow|jquery)|css\/(webflow|main|out))/;
const MARCA = [/siena/i, /steam/i, /film foundation/i, /tel aviv/i, /savoy/i, /kafka/i, /housewife/i, /ana maxim/i, /\.(moon|freud|taboo)\{/];

for (const f of arquivos) {
  const r = rel(f);
  for (const re of MARCA) if (re.test(r)) achados.push(`nome de arquivo ${r}`);
  if (!/\.(html|xml|txt|json|js|css|svg|webmanifest)$/.test(f)) continue;
  const t = fs.readFileSync(f, 'utf8');
  const regras = SO_MARCA.test(r) ? MARCA : VETADO;
  for (const re of regras) {
    const m = re.exec(t);
    if (m) achados.push(`${r}: ${re.source} -> "${t.slice(Math.max(0, m.index - 40), m.index + 40).replace(/\s+/g, ' ')}"`);
  }
}

// Links e recursos internos existem
const paginas = arquivos.filter((f) => f.endsWith('.html') && !/google[0-9a-f]+\.html$/.test(f)); // verificação do Search Console
const EXTERNOS = new Set();
const resolve = (u) => {
  const limpo = decodeURI(u.split('#')[0].split('?')[0]);
  if (limpo === '') return true;
  if (limpo.endsWith('/')) return fs.existsSync(path.join(DIST, limpo, 'index.html'));
  return fs.existsSync(path.join(DIST, limpo));
};
for (const f of paginas) {
  const t = fs.readFileSync(f, 'utf8');
  const refs = [...t.matchAll(/\s(?:href|src|poster|data-url)="([^"]+)"/g)].map((m) => m[1]);
  for (const s of t.matchAll(/\ssrcset="([^"]+)"/g)) refs.push(...s[1].split(',').map((x) => x.trim().split(/\s+/)[0]));
  for (const s of t.matchAll(/url\(([^)"']+)\)/g)) refs.push(s[1]);
  for (const s of t.matchAll(/"(\/assets\/[^"]+\.(?:webp|jpg|png|svg))"/g)) refs.push(s[1]);
  for (const s of t.matchAll(/content="https:\/\/filmeshdonlinegratis\.vercel\.app(\/og\/[^"]+)"/g)) refs.push(s[1]);
  for (const u of refs) {
    if (/^(mailto:|data:|#)/.test(u)) continue;
    if (/^https?:/.test(u)) { EXTERNOS.add(u); continue; }
    if (u.startsWith('/') && !resolve(u)) achados.push(`${rel(f)}: recurso inexistente ${u}`);
    if (u.startsWith('/') && !u.startsWith('/assets') && !u.startsWith('/og') && !u.startsWith('/_astro') && !/\.[a-z]+$/.test(u) && !u.endsWith('/') && !u.includes('#')) achados.push(`${rel(f)}: link sem barra final ${u}`);
  }
}

const PERMITIDOS = [/^https:\/\/discord\.gg\/(wSSJEJAJgt|B5DKdJuuWc)$/, /^https:\/\/www\.youtube\.com\/@Outelet$/, /^https:\/\/www\.youtube\.com\/watch\?v=[\w-]{11}$/, /^https:\/\/x\.com\/Olwtelet$/, /^https:\/\/github\.com\/Olwtelet/, /^https:\/\/filmeshdonlinegratis\.vercel\.app\//, /^https:\/\/www\.themoviedb\.org/, /^https:\/\/policies\.google\.com\/privacy/];
for (const u of EXTERNOS) if (!PERMITIDOS.some((re) => re.test(u))) achados.push(`link externo fora da lista: ${u}`);

// Marca nos metadados de cada página
for (const f of paginas) {
  const t = fs.readFileSync(f, 'utf8');
  if (!/<html lang="pt-BR"/.test(t)) achados.push(`${rel(f)}: lang`);
  if (!/<title>[^<]*Filmes HD Online Grátis/.test(t)) achados.push(`${rel(f)}: título sem o nome do site`);
  if (!/property="og:image" content="|content="https:\/\/filmeshdonlinegratis\.vercel\.app\/og\//.test(t)) achados.push(`${rel(f)}: og:image`);
}

console.log(`${arquivos.length} arquivos, ${paginas.length} páginas, ${EXTERNOS.size} links externos`);
console.log([...EXTERNOS].join('\n'));
if (achados.length) {
  console.log('\nACHADOS');
  console.log([...new Set(achados)].join('\n'));
  process.exit(1);
}
console.log('nenhum achado');
