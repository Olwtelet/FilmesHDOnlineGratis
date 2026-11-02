// Confere o texto editorial de src/data/sessoes/*.json além do que o zod valida no build: palavras longas demais para
// os espaços, vocabulário de divulgação, promessas que o site não cumpre, frases repetidas entre filmes.
//   node tools/checar-textos.mjs [slug]
import fs from 'node:fs';
import path from 'node:path';

const DIR = path.resolve(import.meta.dirname, '../src/data/sessoes');
const SO = process.argv[2];
const arquivos = fs.readdirSync(DIR).filter((a) => a.endsWith('.json') && !a.startsWith('_'));
const sessoes = arquivos.map((a) => JSON.parse(fs.readFileSync(path.join(DIR, a), 'utf8')));
if (SO && !sessoes.some((s) => s.slug === SO)) {
  console.log(`sessão desconhecida: ${SO}`);
  process.exit(1);
}

const PROIBIDO = [
  /imperd[ií]vel/i, /obra[- ]prima/i, /inesquec[ií]vel/i, /marcante/i, /um dos (mais|melhores)/i, /uma das (mais|melhores)/i, /\bexperi[êe]ncia\b/i,
  /reflex[ãa]o profunda/i, /nossa indica[çc][ãa]o/i, /\bcult\b/i, /cl[áa]ssico/i, /excelente/i, /brilhante/i, /genial/i, /magistral/i, /eletrizante/i,
  /de tirar o f[ôo]lego/i, /assista (agora|gr[áa]tis|online)/i, /\bstreaming\b/i, /\bdownload\b/i, /\bbaixar\b/i, /em cartaz/i, /dispon[ií]vel/i,
  /\boscar\b/i, /\bcannes\b/i, /\bpr[êe]mio/i, /bilheteria/i, /aclamad/i, /\bcr[ií]tica especializada\b/i,
];
const erros = [];
const frases = new Map();

function maiorPalavra(t) {
  return Math.max(...t.split(/[\s\-–—/]+/).map((p) => p.replace(/[.,;:!?"'()«»]/g, '').length));
}
function checar(slug, campo, t, { max, palavra }) {
  if (t.length > max) erros.push(`${slug} ${campo}: ${t.length} caracteres, limite ${max}`);
  if (palavra && maiorPalavra(t) > palavra) erros.push(`${slug} ${campo}: palavra com mais de ${palavra} letras em "${t}"`);
  for (const re of PROIBIDO) if (re.test(t)) erros.push(`${slug} ${campo}: vocabulário vetado (${re.source}) em "${t}"`);
  if (/[—–]/.test(t)) erros.push(`${slug} ${campo}: travessão em "${t}"`);
  if (t !== t.trim()) erros.push(`${slug} ${campo}: espaço nas pontas`);
  const chave = t.toLowerCase();
  frases.set(chave, [...(frases.get(chave) || []), `${slug} ${campo}`]);
}

for (const s of sessoes) {
  if (SO && s.slug !== SO) continue;
  if (s.rascunho) erros.push(`${s.slug}: ainda marcado como rascunho`);
  const x = s.texto;
  checar(s.slug, 'manchete', x.manchete, { max: 30, palavra: 13 });
  checar(s.slug, 'leitura', x.leitura, { max: 320 });
  checar(s.slug, 'descricao', x.descricao, { max: 155 });
  x.notasHome.forEach((n, i) => {
    checar(s.slug, `notasHome[${i}].rotulo`, n.rotulo, { max: 18 });
    checar(s.slug, `notasHome[${i}].frase`, n.frase, { max: 44, palavra: 13 });
  });
  const soma = x.notasHome.reduce((t, n) => t + n.frase.length, 0);
  if (soma > 120) erros.push(`${s.slug} notasHome: soma das frases ${soma}, limite 120`);
  x.leituras.forEach((n, i) => {
    checar(s.slug, `leituras[${i}].rotulo`, n.rotulo, { max: 27 });
    checar(s.slug, `leituras[${i}].frase`, n.frase, { max: 130, palavra: 14 });
  });
}
for (const [f, onde] of frases) if (onde.length > 1 && f.length > 12) erros.push(`repetido: "${f}" em ${onde.join(', ')}`);

const rotulos = new Map();
for (const s of sessoes) for (const n of s.texto.leituras) rotulos.set(n.rotulo.toLowerCase(), (rotulos.get(n.rotulo.toLowerCase()) || 0) + 1);
for (const [r, n] of rotulos) if (n > 2) erros.push(`rótulo "${r}" usado em ${n} leituras; varie`);

if (erros.length) {
  console.log(erros.join('\n'));
  console.log(`\n${erros.length} problema(s)`);
  process.exit(1);
}
console.log(`${SO || sessoes.length + ' sessões'}: textos dentro dos limites`);
