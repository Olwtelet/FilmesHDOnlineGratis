// Conteúdo fixo da home: metadados, botão do cartão, abertura e tutorial. Os campos de cada sessão vêm de data/films.ts.
import { SITE } from './site';

export const HOME_META = {
  title: SITE.name,
};

/** Botões EXPLORAR do cartão do roll (celular e desktop) */
export const HOME_EXPLORE = {
  label: 'EXPLORAR',
  ariaLabel: 'abrir a sessão',
};

export const PRELOADER = {
  /** cobre 100vw no menor período das barras */
  barrasFora: 33,
  /** as linhas de SITE.name: duas em tela larga, três no celular em pé */
  nome: ['Filmes HD', 'Online', 'Grátis'],
  enterLabel: 'ENTRAR',
};

export const TUTORIAL = {
  texts: [
    'Segure e arraste para navegar pelo conteúdo',
    'Role a página para passar pelas sessões',
    'Clique no menu à esquerda para ir direto a um filme',
    'Use o menu à direita para navegar pelo site',
    "Clique em 'Explorar' para ver a página do filme",
  ],
  closeLabel: 'FECHAR',
};
