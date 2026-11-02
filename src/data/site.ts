// Fatos do site compartilhados por menu, rodapé, páginas e metadados.

export const SITE = {
  name: 'Filmes HD Online Grátis',
  shortName: 'FHDOG',
  url: 'https://filmeshdonlinegratis.vercel.app',
  lang: 'pt-BR',
  tagline: 'As ideias são à prova de balas',
  description: 'Curadoria de cinema: cada sessão é escolhida por quem assistiu e tem o motivo da escolha registrado. A exibição é ao vivo na sala do Discord; o site não hospeda filmes.',
  author: 'Olwtelet',
  rss: '/rss.xml',
  /** data de abertura do servidor */
  since: '2024-11-29',
} as const;

// Links internos sempre na forma canônica, com a barra final: o Taxi compara a URL como texto.
export const ROUTES = {
  home: '/',
  work: '/programacao/',
  about: '/sobre/',
  contact: '/contato/',
  cookies: '/cookies/',
  terms: '/termos/',
  privacy: '/privacidade/',
} as const;

export const SOCIAL = {
  /** convite geral do servidor: abre o canal de regras */
  discord: 'https://discord.gg/wSSJEJAJgt',
  youtube: 'https://www.youtube.com/@FilmesHDOn-lineGrátis',
  steam: 'https://steamcommunity.com/groups/FilmesHDOnlineGratis',
  github: 'https://github.com/Olwtelet',
} as const;

/** convite direto da Sala 24: usado em toda sessão */
export const SALA_URL = 'https://discord.gg/B5DKdJuuWc';

export const EMAIL = {
  main: 'filmeshdonlinegratisbr@gmail.com',
} as const;

export interface SiteLink {
  href: string;
  label: string;
}

/** Painel principal do menu: links grandes. */
export const NAV_MAIN_LINKS: (SiteLink & { prerender?: boolean })[] = [
  { href: ROUTES.work, label: 'PROGRAMAÇÃO' },
  { href: ROUTES.about, label: 'Sobre' },
  { href: ROUTES.contact, label: 'Contato' },
];

/** Painel principal do menu: links legais (as células mantêm os ids de grade do Webflow). */
export const NAV_LEGAL_LINKS: (SiteLink & { nodeId: string })[] = [
  { href: ROUTES.cookies, label: 'COOKIES', nodeId: 'w-node-_5f7cb390-63c3-52da-5bb7-2905d4a63874-d4a6380e' },
  { href: ROUTES.terms, label: 'TERMOS', nodeId: 'w-node-_5f7cb390-63c3-52da-5bb7-2905d4a63878-d4a6380e' },
  { href: ROUTES.privacy, label: 'PRIVACIDADE', nodeId: 'w-node-_5f7cb390-63c3-52da-5bb7-2905d4a6387c-d4a6380e' },
];

export const NAV_COPYRIGHT = `©${new Date().getFullYear()} FILMES HD ONLINE GRÁTIS`;

/** Coluna "navegar" do rodapé. */
export const FOOTER_SITEMAP: SiteLink[] = [
  { href: ROUTES.home, label: 'Início' },
  { href: ROUTES.work, label: 'Programação' },
  { href: ROUTES.about, label: 'Sobre' },
  { href: ROUTES.contact, label: 'Contato' },
];

/** Links legais do rodapé. */
export const FOOTER_LEGAL_LINKS: SiteLink[] = [
  { href: ROUTES.cookies, label: 'COOKIES' },
  { href: ROUTES.privacy, label: 'PRIVACIDADE' },
  { href: ROUTES.terms, label: 'TERMOS' },
];

/** Coluna "contato" do rodapé: o endereço de e-mail não cabe no corpo do espaço, fica no href. */
export const FOOTER_CONTACTS = [
  { href: `mailto:${EMAIL.main}`, label: 'E-mail', address: 'ENVIAR E-MAIL', hideLabelOnMobile: true },
  { href: SALA_URL, label: 'Discord', address: 'IR PARA A SALA', hideLabelOnMobile: false, external: true },
];

/** Palavras grandes do rodapé: uma linha cada. */
export const FOOTER_TAGLINE = ['CURADORIA', 'CINEMA', 'AO VIVO'];

export const FOOTER_COPYRIGHT = `© ${new Date().getFullYear()} Filmes HD Online Grátis`;
export const FOOTER_COPYRIGHT_404 = FOOTER_COPYRIGHT;
