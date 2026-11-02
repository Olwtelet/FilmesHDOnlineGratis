// Textos fixos e ajustes de /programacao/ (a página "work" do bundle). Os campos de cada sessão vêm de data/films.ts.
import { ROUTES } from './site';

export const WORK_PAGE = {
  route: ROUTES.work,
  title: 'Programação',
  description: 'Todas as sessões da curadoria, com data e hora. A exibição é ao vivo na Sala 24 do Discord; o site não hospeda filmes.',
  /** chunk do Webflow que traz o módulo de lightbox */
  webflowScript: '/assets/js/webflow.0a91112a.bed7af5b8ef7aa34.js',
} as const;

/** Chave de modo no topo da página (o primeiro rótulo é o modo inicial). Sem acentos: a caixa de 1em recorta. */
export const WORK_TOGGLE = {
  modes: ['CENAS', 'CARTAZ'],
  suffix: 'MODO',
} as const;

/** Rótulos das linhas de cada cartão, na ordem em que aparecem */
export const WORK_CALLOUT_LABELS = {
  year: 'Ano',
  session: 'Sessão',
  category: 'Gênero',
} as const;

export const WORK_EXPLORE_LABEL = 'EXPLORAR';

/** Largura do cartaz em cada faixa, para o srcset */
export const WORK_POSTER_SIZES = '(max-width: 767px) 75vw, (max-width: 991px) 41vw, 32vw';

/** Texto do link oculto de cada cartão, lido por leitor de tela */
export const workLinkText = (title: string) => `Abrir ${title}`;
