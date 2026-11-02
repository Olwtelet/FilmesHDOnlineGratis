// Execução única (Fase 2): monta src/data/sessoes/<slug>.json a partir do inventário do site antigo,
// da verificação de créditos e imagens e da verificação de trailers. Depois disso os JSON são o dado
// editável; não rode de novo sem --forcar, porque sobrescreve o que foi escrito à mão.
//   node reference/fase2/gerar-sessoes.cjs <pasta-dos-relatorios> [--forcar]
const fs = require('fs');
const path = require('path');

const REL = process.argv[2];
const FORCAR = process.argv.includes('--forcar');
const SAIDA = path.resolve(__dirname, '../../src/data/sessoes');
fs.mkdirSync(SAIDA, { recursive: true });

const catalogo = require(path.join(REL, 'catalog-raw.json'));
const tmdb = require(path.join(REL, 'films-tmdb.json'));
const trailers = require(path.join(REL, 'trailers.json'));

// Correções aos dados publicados, com a evidência em docs/FASE2.md.
const CORRIGE = {
  'the-inheritance-2025': { ano: 2026, direcao: 'John Patton Ford', duracao: 105 },
  'the-running-man-2026': { duracao: 133 },
  'obsession-2026': { duracao: 109 },
  'what-you-wish-for-2023': { duracao: 101 },
};
const TITULO_CURTO = {
  'ready-or-not-double-feature-2026': 'Casamento Sangrento + A Viúva',
  'the-inheritance-2025': 'Manual Prático da Vingança',
};
const DIRECAO_CURTA = { 'ready-or-not-double-feature-2026': 'Bettinelli-Olpin & Gillett' };
// Pôsteres cuja versão principal traz suástica no letreiro: usa a versão sem esse elemento.
const CARTAZ = {
  'inglourious-basterds-2009': (f) => f.poster.textless_xx[0].path,
};

const FUNCAO_ROTEIRO = (r) => {
  if (!r) return 'Roteiro';
  if (/^screenplay/i.test(r) || /^written/i.test(r)) return 'Roteiro';
  if (/novel|book|short story/i.test(r)) return 'Obra original';
  if (/original film/i.test(r)) return 'Filme original';
  if (/story/i.test(r)) return 'Argumento';
  if (/graphic|comic/i.test(r)) return 'Obra original';
  return 'Roteiro';
};

function creditos(feats) {
  const lista = (k) => feats.flatMap((f) => (f.credits[k] || []));
  const unicos = (a, chave = (x) => x.name) => a.filter((x, i) => a.findIndex((y) => chave(y) === chave(x)) === i);
  const principais = [];
  const roteiro = unicos(lista('writers'));
  const porFuncao = new Map();
  for (const w of roteiro) {
    const fn = FUNCAO_ROTEIRO(w.role);
    porFuncao.set(fn, [...(porFuncao.get(fn) || []), w.name]);
  }
  for (const [funcao, nomes] of porFuncao) {
    if (principais.length < 2) principais.push({ funcao, nome: nomes.slice(0, 2).join(' & ') });
  }
  const um = (k, funcao) => {
    const n = unicos(lista(k)).map((x) => x.name);
    if (n.length) principais.push({ funcao, nome: n.slice(0, 2).join(' & ') });
  };
  um('director_of_photography', 'Fotografia');
  um('composers', 'Música');
  um('editors', 'Montagem');
  const producao = unicos(lista('producers')).slice(0, 4).map((p) => ({ funcao: 'Produção', nome: p.name }));
  const elenco = unicos(lista('cast'), (c) => c.actor).slice(0, 6).map((c) => ({ funcao: c.character || 'Elenco', nome: c.actor }));
  return { principais: principais.slice(0, 4), producao, elenco };
}

function escolheCenas(feats) {
  const limpa = (b) => !(b.flags || []).some((x) => /swastika|near-duplicate|low-res|infant/i.test(x));
  const porFilme = feats.map((f) => {
    const stills = f.backdrops.filter((b) => b.kind === 'still' && limpa(b));
    const arte = f.backdrops.filter((b) => b.kind !== 'still' && limpa(b));
    return [...stills, ...arte];
  });
  const alvo = 14;
  const fora = [];
  let i = 0;
  while (fora.length < alvo && porFilme.some((l) => l.length)) {
    const l = porFilme[i % porFilme.length];
    if (l.length) fora.push(l.shift());
    i++;
  }
  return fora;
}

function trailerDe(slug, feature) {
  const t = trailers.find((x) => x.slug === slug && x.role === 'primary' && x.featureTitle === feature);
  if (!t) throw new Error(`sem trailer ${slug} ${feature}`);
  return { youtube: t.videoId, canal: t.channel, idioma: t.language, tituloVideo: t.title };
}

for (const s of catalogo) {
  const arquivo = path.join(SAIDA, `${s.slug}.json`);
  if (fs.existsSync(arquivo) && !FORCAR) {
    console.log('mantido', s.slug);
    continue;
  }
  const feats = [].concat(tmdb[s.slug]);
  const filmes = s.features.map((f, i) => {
    const t = feats[i];
    const c = CORRIGE[s.slug] || {};
    return {
      titulo: f.title.trim(),
      tituloOriginal: t.title_original,
      ano: c.ano ?? f.year,
      direcao: c.direcao ?? f.director,
      duracao: c.duracao ?? f.runtime,
      ...(f.rating ? { classificacao: f.rating } : {}),
      generos: f.genres,
      ...(f.time ? { hora: f.time } : {}),
      trailer: trailerDe(s.slug, f.title.trim()),
      tmdb: t.tmdb_id,
      imdb: t.imdb_id,
    };
  });
  const titulo = filmes.length > 1 ? filmes.map((f) => f.titulo).join(' + ') : filmes[0].titulo;
  const cenas = escolheCenas(feats);
  const stills = cenas.filter((b) => b.kind === 'still' && b.w >= 1920);
  const hero = (stills[0] || cenas[0]).path;
  const retrato = (stills[1] || cenas[1] || cenas[0]).path;
  const cartaz = CARTAZ[s.slug] ? CARTAZ[s.slug](feats[0]) : feats[0].poster.primary.path;
  const doc = {
    slug: s.slug,
    titulo,
    ...(TITULO_CURTO[s.slug] ? { tituloCurto: TITULO_CURTO[s.slug] } : {}),
    categoria: filmes[0].generos[0],
    ...(DIRECAO_CURTA[s.slug] ? { direcaoCurta: DIRECAO_CURTA[s.slug] } : {}),
    sessao: { data: s.session.date, hora: s.session.time, sala: s.session.room, salaUrl: s.session.roomUrl },
    filmes,
    sinais: s.tags,
    rascunho: true,
    texto: {
      manchete: s.headline.slice(0, 30).trim(),
      leitura: (s.kicker || s.summary).slice(0, 280).trim(),
      descricao: s.summary.slice(0, 155).trim(),
      notasHome: [
        { rotulo: 'Rascunho', frase: s.headline.slice(0, 44).trim() },
        { rotulo: 'Rascunho', frase: s.summary.slice(0, 44).trim() },
        { rotulo: 'Rascunho', frase: filmes[0].direcao.slice(0, 44) },
      ],
      leituras: Array.from({ length: 6 }, (_, i) => ({
        rotulo: `Rascunho ${i + 1}`,
        frase: (i % 2 ? s.summary : s.headline).slice(0, 120).trim(),
      })),
    },
    creditos: creditos(feats),
    imagens: {
      hero: { tmdb: hero },
      cartaz: { tmdb: cartaz },
      direcao: { tmdb: retrato },
      cenas: cenas.map((b) => ({ tmdb: b.path })),
    },
  };
  fs.writeFileSync(arquivo, JSON.stringify(doc, null, 2) + '\n');
  console.log('escrito', s.slug, 'cenas', cenas.length, 'creditos', doc.creditos.principais.length, doc.creditos.producao.length, doc.creditos.elenco.length);
}
