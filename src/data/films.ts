// Visão das sessões que os componentes consomem. Tudo aqui deriva de src/data/sessoes/*.json.
// FILMS fica em ordem cronológica; quem decide a ordem exibida é o navegador (components/SessoesOrdem.astro),
// com os atributos de sessaoAttrs() em cada filho das listas.
import fs from 'node:fs';
import path from 'node:path';
import { SESSOES, type SessaoDado } from './sessoes';

export interface FilmImage {
  /** maior versão; em roll e cartaz é a textura do WebGL */
  src: string;
  srcset?: string;
}

export interface Credit {
  role: string;
  name: string;
}

export interface Note {
  label: string;
  text: string;
}

export interface Trailer {
  youtube: string;
  /** título do filme, para o seletor da sessão dupla e o title do iframe */
  film: string;
}

export interface FilmSession {
  date: string;
  time: string;
  /** início, hora local de São Paulo: 2026-10-17T20:30 */
  start: string;
  /** fim: o explícito do arquivo ou 00:00 do dia seguinte */
  end: string;
  /** início com fuso, para JSON-LD */
  startIso: string;
  room: string;
  roomUrl: string;
  /** 17/10 */
  dayMonth: string;
  /** 17/10/2026 */
  fullDate: string;
  /** sábado */
  weekday: string;
  /** Sábado, 17 de outubro de 2026 */
  longDate: string;
}

export interface Film {
  slug: string;
  /** como aparece nas interfaces: título curto quando existe */
  title: string;
  /** título completo: metadados, créditos, RSS */
  fullTitle: string;
  originalTitle: string;
  category: string;
  /** rótulo de ano: "2015" ou "2019 + 2026" */
  year: string;
  /** só o primeiro ano, para o ingresso (4 dígitos) */
  firstYear: string;
  minutes: number;
  director: string;
  directorShort: string;
  synopsis: string;
  description: string;
  headline: string;
  genres: string[];
  signals: string[];
  /** sem classificação verificada, fica vazio */
  ratings: string[];
  image: FilmImage;
  /** versão pequena do herói, para menus */
  thumb: string;
  /** imagem de fundo do herói da página */
  hero: FilmImage;
  poster: FilmImage;
  directorImage: FilmImage;
  /** quadros do lightbox: sempre 14, número par exigido pelo shader */
  frames: string[];
  /** cenas da galeria: sempre 14 */
  gallery: FilmImage[];
  homeNotes: Note[];
  readings: Note[];
  credits: { keyCrew: Credit[]; producers: Credit[]; crew: Credit[] };
  trailers: Trailer[];
  session: FilmSession;
  heroLines: number;
  /** tamanho do título na home (variável --text-h1), para títulos longos */
  homeTitleSize?: string;
  /** escala do título na barra CENAS da Programação (variável --titulo-flip) */
  flipScale?: number;
  aviso?: boolean;
}

const QUADROS = 14;
const ZONA = 'America/Sao_Paulo';

const pasta = (slug: string) => `/assets/img/sessoes/${slug}`;

function srcset(base: string, larguras: number[]) {
  return larguras.map((l) => `${base}-${l}.webp ${l}w`).join(', ');
}

/** 2026-10-17 -> 2026-10-18T00:00, sem passar por fuso */
function diaSeguinte(data: string) {
  const [a, m, d] = data.split('-').map(Number);
  const u = new Date(Date.UTC(a, m - 1, d + 1));
  return `${u.toISOString().slice(0, 10)}T00:00`;
}

function deslocamento(data: string, hora: string) {
  const inst = new Date(`${data}T${hora}:00-03:00`);
  const nome = new Intl.DateTimeFormat('en-US', { timeZone: ZONA, timeZoneName: 'longOffset' })
    .formatToParts(inst)
    .find((p) => p.type === 'timeZoneName')!.value;
  return nome.replace('GMT', '') || '+00:00';
}

function sessaoDe(s: SessaoDado): FilmSession {
  const { data, hora, fim, sala, salaUrl } = s.sessao;
  const meio = new Date(`${data}T12:00:00-03:00`);
  const fmt = (o: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat('pt-BR', { timeZone: ZONA, ...o }).format(meio);
  const [a, m, d] = data.split('-');
  const semana = fmt({ weekday: 'long' });
  return {
    date: data,
    time: hora,
    start: `${data}T${hora}`,
    end: fim ?? diaSeguinte(data),
    startIso: `${data}T${hora}:00${deslocamento(data, hora)}`,
    room: sala,
    roomUrl: salaUrl,
    dayMonth: `${d}/${m}`,
    fullDate: `${d}/${m}/${a}`,
    weekday: semana,
    longDate: `${semana[0].toUpperCase()}${semana.slice(1)}, ${Number(d)} de ${fmt({ month: 'long' })} de ${a}`,
  };
}

/** Repete a lista até `n` itens. */
function ciclo<T>(lista: T[], n: number): T[] {
  return Array.from({ length: n }, (_, i) => lista[i % lista.length]);
}

/** O build monta os caminhos sem tocar nos arquivos: esquecer um passo do cadastro publicaria imagem quebrada. */
function conferirArquivos(slug: string) {
  const faltando = [`assets/img/sessoes/${slug}/hero-1600.webp`, `assets/img/sessoes/${slug}/cartaz-800.webp`, `og/${slug}.jpg`].filter(
    (f) => !fs.existsSync(path.join(process.cwd(), 'public', f)),
  );
  if (faltando.length) throw new Error(`Sessão "${slug}" sem arquivos: ${faltando.join(', ')}. Rode npm run imagens e npm run og.`);
}

function paraFilm(s: SessaoDado): Film {
  conferirArquivos(s.slug);
  const base = pasta(s.slug);
  const primeiro = s.filmes[0];
  const cenas = s.imagens.cenas.map((_, i) => `${base}/cena-${String(i + 1).padStart(2, '0')}`);
  const title = s.tituloCurto ?? s.titulo;
  const anos = [...new Set(s.filmes.map((f) => f.ano))];
  const n = title.length;
  return {
    slug: s.slug,
    title,
    fullTitle: s.titulo,
    originalTitle: s.filmes.map((f) => f.tituloOriginal).join(' + '),
    category: s.categoria,
    year: anos.join(' + '),
    firstYear: String(primeiro.ano),
    minutes: s.filmes.reduce((t, f) => t + f.duracao, 0),
    director: primeiro.direcao,
    directorShort: s.direcaoCurta ?? primeiro.direcao,
    synopsis: s.texto.leitura,
    description: s.texto.descricao,
    headline: s.texto.manchete,
    genres: [...new Set(s.filmes.flatMap((f) => f.generos))],
    signals: s.sinais,
    ratings: s.filmes.map((f) => f.classificacao).filter((c): c is NonNullable<typeof c> => !!c),
    image: { src: `${base}/hero-1600.webp` },
    thumb: `${base}/miniatura-160.webp`,
    hero: { src: `${base}/hero-1920.webp`, srcset: srcset(`${base}/hero`, [500, 800, 1080, 1600, 1920]) },
    poster: { src: `${base}/cartaz-800.webp`, srcset: srcset(`${base}/cartaz`, [500, 800]) },
    directorImage: { src: `${base}/direcao-720.webp` },
    frames: ciclo(cenas, QUADROS).map((c) => `${c}-640.webp`),
    gallery: ciclo(cenas, QUADROS).map((c) => ({ src: `${c}-960.webp`, srcset: srcset(c, [640, 960]) })),
    homeNotes: s.texto.notasHome.map((x) => ({ label: x.rotulo, text: x.frase })),
    readings: s.texto.leituras.map((x) => ({ label: x.rotulo, text: x.frase })),
    credits: {
      keyCrew: s.creditos.principais.map((c) => ({ role: c.funcao, name: c.nome })),
      producers: s.creditos.producao.map((c) => ({ role: c.funcao, name: c.nome })),
      crew: s.creditos.elenco.map((c) => ({ role: c.funcao, name: c.nome })),
    },
    trailers: s.filmes.map((f) => ({ youtube: f.trailer.youtube, film: f.titulo })),
    session: sessaoDe(s),
    heroLines: s.linhasTitulo ?? 1,
    homeTitleSize: n > 32 ? '4rem' : n > 24 ? '4.6rem' : undefined,
    flipScale: n >= 29 ? 0.72 : undefined,
  };
}

export const FILMS: Film[] = SESSOES.map(paraFilm);

const CARTAO = '/assets/img/site/sem-sinal';

/**
 * Item-aviso: entra em todas as listas posicionais do menu, da home e da Programação. O script de ordem o remove
 * quando há sessão futura e o põe em primeiro quando não há. Não traz data, porque não existe sessão a anunciar.
 */
export const AVISO: Film = {
  slug: 'sem-sinal',
  title: 'Sem sinal',
  fullTitle: 'Sem sinal',
  originalTitle: '',
  category: 'Aviso',
  year: '—',
  firstYear: '—',
  minutes: 0,
  director: 'A anunciar',
  directorShort: 'A anunciar',
  synopsis: 'Nenhuma sessão futura está cadastrada. Quando a próxima for anunciada, ela ocupa este espaço. Até lá, o arquivo segue aberto.',
  description: 'Nenhuma sessão futura está cadastrada.',
  headline: 'Nenhuma sessão anunciada',
  genres: [],
  signals: [],
  ratings: [],
  image: { src: `${CARTAO}-1600.webp` },
  thumb: `${CARTAO}-160.webp`,
  hero: { src: `${CARTAO}-1600.webp` },
  poster: { src: `${CARTAO}-800.webp` },
  directorImage: { src: `${CARTAO}-800.webp` },
  frames: ciclo([`${CARTAO}-640.webp`], QUADROS),
  gallery: [],
  homeNotes: [
    { label: 'Programação', text: 'Nenhuma sessão anunciada' },
    { label: 'Enquanto isso', text: 'O arquivo segue aberto' },
    { label: 'Aviso', text: 'A próxima sai no Discord e no RSS' },
  ],
  readings: [],
  credits: { keyCrew: [], producers: [], crew: [] },
  trailers: [],
  session: {
    date: '',
    time: '',
    start: '',
    end: '',
    startIso: '',
    room: 'Sala 24',
    roomUrl: 'https://discord.gg/B5DKdJuuWc',
    dayMonth: '—',
    fullDate: '—',
    weekday: '',
    longDate: '',
  },
  heroLines: 1,
  aviso: true,
};

/** Listas posicionais do menu, da home e da Programação: o aviso primeiro, depois as sessões. */
export const ITENS: Film[] = [AVISO, ...FILMS];

/** Atributos que o script de ordem lê em cada filho de lista. */
export function sessaoAttrs(film: Film): Record<string, string | boolean> {
  return film.aviso
    ? { 'data-aviso': true }
    : { 'data-sessao': film.slug, 'data-ini': film.session.start, 'data-fim': film.session.end };
}

/** Um filme da sessão: a sessão dupla mostra hora e duração de cada um, e Film só traz a soma. */
export interface FilmeDaSessao {
  title: string;
  director: string;
  minutes: number;
  /** hora de início: a própria do filme ou a da sessão */
  time: string;
  youtube: string;
}

export function filmesDaSessao(slug: string): FilmeDaSessao[] {
  const s = SESSOES.find((x) => x.slug === slug);
  if (!s) throw new Error(`sessão desconhecida "${slug}"`);
  return s.filmes.map((f) => ({
    title: f.titulo,
    director: f.direcao,
    minutes: f.duracao,
    time: f.hora ?? s.sessao.hora,
    youtube: f.trailer.youtube,
  }));
}

export const filmHref = (slug: string) => `/sessoes/${slug}/`;

export function getFilm(slug: string): Film {
  const film = FILMS.find((f) => f.slug === slug);
  if (!film) throw new Error(`sessão desconhecida "${slug}"`);
  return film;
}
