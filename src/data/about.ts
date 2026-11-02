// Conteúdo de /sobre/. Só entra fato do site e título do catálogo: sem pessoa, prêmio ou parceiro inventado.
//
// " " é o espaço que não quebra linha: os títulos e as linhas do herói ocupam uma linha cada.
// As quantidades são exigência do bundle (classe Ha do app.js, que lê por posição e derruba a página se faltar item):
// 4 linhas de declaração com ao menos 2 células, 2 colunas de formatos e 3 títulos grandes. A grade tem 36 células.
import { FILMS, getFilm } from './films';
import { ROUTES, SITE, SOCIAL } from './site';

export interface AboutImage {
  src: string;
  /** versões responsivas; sem elas, sizes também fica de fora */
  srcset?: string;
  sizes?: string;
}

export interface AboutTitle {
  text: string;
  /** classe depois de "about-title-tx" ("" para nenhuma); _2 a _6 deslocam o título pela própria largura */
  mod: string;
}

/** Uma linha ".about-he-of-w" do herói: texto pequeno, <br> opcional no fim, fios decorativos. */
export interface HeroSmallLine {
  text: string;
  br: boolean;
  /** quantos div.line dentro de .about-hero-lines */
  lines: number;
}

export const ABOUT_PAGE = {
  route: ROUTES.about,
  title: 'Sobre',
  description: 'O que é esta curadoria de cinema, como um filme entra na programação e por que nenhum filme fica hospedado aqui. As sessões são ao vivo, no Discord.',
};

/** Dados estruturados da página, a partir dos fatos do site. */
export const ABOUT_JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'AboutPage',
  name: 'Sobre',
  url: new URL(ROUTES.about, SITE.url).href,
  isPartOf: { '@type': 'WebSite', name: SITE.name, url: SITE.url },
  about: {
    '@type': 'Organization',
    name: SITE.name,
    foundingDate: SITE.since,
    url: SITE.url,
    sameAs: [SOCIAL.discord, SOCIAL.youtube, SOCIAL.x],
  },
};

const IMG = '/assets/img/sobre';

export const ABOUT_HERO: {
  leftImage: AboutImage;
  rightImage: AboutImage;
  mobileImage: AboutImage;
  topLines: HeroSmallLine[];
  words: string[];
  headingLines: number;
  bottomLines: HeroSmallLine[];
} = {
  // recortes feitos por tools/imagens-sobre.mjs
  leftImage: { src: `${IMG}/arco-esquerdo.webp` },
  rightImage: { src: `${IMG}/arco-direito.webp` },
  mobileImage: {
    src: `${IMG}/arco-movel-639.webp`,
    srcset: `${IMG}/arco-movel-500.webp 500w, ${IMG}/arco-movel-639.webp 639w`,
    sizes: '(max-width: 479px) 100vw, (max-width: 767px) 50vw, (max-width: 991px) 56vw, 100vw',
  },
  topLines: [
    { text: 'FILMES HD ONLINE', br: true, lines: 1 },
    { text: 'GRÁTIS É UMA', br: false, lines: 2 },
  ],
  words: ['CURADORIA', 'DE CINEMA', 'AO VIVO'],
  headingLines: 4,
  bottomLines: [
    { text: 'COM SESSÕES NA SALA 24,', br: true, lines: 1 },
    { text: 'NO DISCORD', br: false, lines: 2 },
  ],
};

/** Título do catálogo em uma linha, como o bloco tipográfico exige. */
function titulo(slug: string, mod = ''): AboutTitle {
  return { text: getFilm(slug).title.toUpperCase().replace(/ /g, ' '), mod };
}

export const ABOUT_TYPE_COMP: {
  /** âncora da seta do herói */
  id: string;
  titles: AboutTitle[];
  /** linhas ".about-small-text-line", cada uma com suas células */
  statement: string[][];
  /** colunas ".div-block-11" de palavras ".text-block-12" (a segunda começa com ._5-line) */
  formats: string[][];
  xlWord: string;
  xlTitles: AboutTitle[];
  colophon: string[];
} = {
  id: 'second',
  // _2, _3 e _4 deslocam mais: títulos curtos, senão saem da tela no celular
  titles: [titulo('inglourious-basterds-2009'), titulo('vivarium-2019', '_2'), titulo('bugonia-2025', '_3'), titulo('the-lobster-2015', '_4')],
  statement: [
    ['Curadoria é uma escolha', 'que alguém defende', 'em voz alta.'],
    ['Cada sessão fica registrada', 'com o motivo', 'de ter sido escolhida.'],
    ['A exibição é ao vivo,', 'na Sala 24,', 'no Discord.'],
    ['O site não hospeda', 'nem distribui', 'nenhum filme.'],
  ],
  formats: [['CURADORIA', 'CINEMA'], ['AO VIVO']],
  xlWord: SITE.shortName,
  xlTitles: [titulo('the-menu-2022'), titulo('lord-of-war-2005', '_6'), titulo('the-hateful-eight-2015', '_5')],
  colophon: ['FILMES HD ONLINE GRÁTIS', 'NO AR DESDE 29 NOV 2024', 'SALA 24, NO DISCORD', 'CUSTO: NENHUM'],
};

/**
 * Grade de 36 células: 9 colunas por 4 linhas, com as sessões em ciclo. Vizinhas ficam a 1, 8, 9 ou 10 posições na
 * lista, então nenhuma imagem encosta nela mesma enquanto o catálogo tiver mais de 10 sessões.
 */
export const ABOUT_GRID: { nodeId: string; images: string[] } = {
  nodeId: 'w-node-a1ff9f15-5d35-87b6-44a3-67c14a03d219-a3e4adba',
  images: Array.from({ length: 36 }, (_, i) => `/assets/img/sessoes/${FILMS[i % FILMS.length].slug}/hero-500.webp`),
};

export interface TeamMember {
  role: string;
  name: string;
  bio: string;
  image: AboutImage;
}

/** Não há retrato de ninguém: o cartão de teste ocupa o lugar da foto. */
const CARTAO: AboutImage = {
  src: '/assets/img/site/sem-sinal-800.webp',
  srcset: '/assets/img/site/sem-sinal-640.webp 640w, /assets/img/site/sem-sinal-800.webp 800w',
  sizes: '(max-width: 479px) 100vw, (max-width: 991px) 50vw, 25vw',
};

export const ABOUT_TEAM: { title: string; members: TeamMember[] } = {
  title: 'QUEM FAZ',
  members: [
    {
      role: 'Curadoria',
      name: SITE.author,
      bio: 'Escolhe as sessões e registra o motivo de cada uma. Não há fórmula, e a ausência dela é deliberada: um filme entra porque incomodou alguém, porque rendeu discussão até tarde, porque não saiu da cabeça depois dos créditos. Nunca porque quebrou bilheteria, e nunca porque um sistema calculou que você ia gostar.',
      image: CARTAO,
    },
    {
      role: 'Comunidade',
      name: 'Sala 24',
      bio: 'A sala fica em um servidor pequeno do Discord, aberto em 29 de novembro de 2024, sem plano nenhum. A exibição acontece ali, ao vivo, com todo mundo assistindo ao mesmo tempo. A maior parte das sessões é aos sábados, às 20:30, mas o que vale é a data e a hora publicadas na página de cada uma. Não custa nada.',
      image: CARTAO,
    },
  ],
};

export const ABOUT_SERVICES: { title: string; items: { label: string; lines: string[] }[] } = {
  title: 'O QUE FAZEMOS',
  items: [
    { label: '01', lines: ['CURADORIA', 'COM MOTIVO'] },
    { label: '02', lines: ['SESSÃO', 'AO VIVO'] },
  ],
};

/** Bloco oculto pelo CSS original em todas as larguras; fica no DOM só com os canais reais. */
export const ABOUT_COLLABORATORS: { title: string; items: { label: string; name: string; logo: string; href: string }[] } = {
  title: 'ONDE ESTAMOS',
  items: [
    { label: 'CANAL', name: 'Discord', logo: '/assets/img/site/social-discord.svg', href: SOCIAL.discord },
    { label: 'CANAL', name: 'YouTube', logo: '/assets/img/site/social-youtube.svg', href: SOCIAL.youtube },
    { label: 'CANAL', name: 'X', logo: '/assets/img/site/social-x.svg', href: SOCIAL.x },
  ],
};

export const ABOUT_FILMS_CTA: { title: string; href: string; label: string; image: AboutImage } = {
  title: 'Sessões',
  href: ROUTES.work,
  label: 'EXPLORAR',
  image: {
    src: `${IMG}/cta-2126.webp`,
    srcset: `${IMG}/cta-500.webp 500w, ${IMG}/cta-800.webp 800w, ${IMG}/cta-1600.webp 1600w, ${IMG}/cta-2126.webp 2126w`,
    sizes: '100vw',
  },
};
