// Textos de /cookies/, /termos/ e /privacidade/. Cada frase descreve o que o site faz de verdade: se o comportamento
// mudar, o texto muda junto. Sem jurisdição, endereço, telefone ou empresa, porque nada disso existe aqui.
//
// O <h1> de cada página é `heading`; os blocos vêm depois, em ordem. `html` é marcação em linha (<strong>, <a>).
// <li> fica em caixa alta pelo CSS, por isso as listas são evitadas: o texto vai em parágrafos.
import { EMAIL, ROUTES, SITE } from './site';

export type LegalSlug = 'cookies' | 'terms' | 'privacy';

export type LegalBlock =
  | { tag: 'h1' | 'h3' | 'p'; /** HTML em linha */ html: string }
  | { tag: 'ul'; /** HTML em linha de cada <li> */ items: string[] };

export interface LegalPage {
  /** rota, também o link "atual" marcado no menu e no rodapé */
  path: string;
  title: string;
  description: string;
  /** primeiro <h1> do texto */
  heading: string;
  blocks: LegalBlock[];
}

const h3 = (html: string): LegalBlock => ({ tag: 'h3', html });
const p = (html: string): LegalBlock => ({ tag: 'p', html });
const externo = (href: string, texto: string) => `<a href="${href}" target="_blank" rel="noopener noreferrer">${texto}</a>`;

const EMAIL_LINK = `<a href="mailto:${EMAIL.main}">${EMAIL.main}</a>`;
const POLITICA_GOOGLE = externo('https://policies.google.com/privacy?hl=pt-BR', 'política de privacidade do Google');
const REVISAO = p('Última revisão: 31 de outubro de 2026.');

export const LEGAL_PAGES: Record<LegalSlug, LegalPage> = {
  cookies: {
    path: ROUTES.cookies,
    title: 'Cookies',
    description: 'Os dois cookies que este site grava, para que servem e quanto duram, e o que muda quando você abre um trailer do YouTube.',
    heading: 'COOKIES',
    blocks: [
      p('Este site grava dois cookies próprios. Os dois servem só para não repetir as animações de entrada, e nenhum deles identifica você.'),
      h3('Os dois cookies'),
      p('<strong>preloader_shown</strong>: guarda a data e a hora em que a abertura da página inicial foi exibida, para ela não se repetir. Dura 1 hora.'),
      p('<strong>tutorial_shown</strong>: guarda apenas o valor “true”, para o tutorial da página inicial não se repetir. Dura 48 horas.'),
      p('Eles são gravados quando você passa pela abertura e pelo tutorial. Se a ordem das sessões mudar com a página inicial ou a Programação abertas, a página recarrega sozinha e grava os dois antes, para a abertura não voltar.'),
      h3('O que eles não fazem'),
      p('Não guardam nome, e-mail nem qualquer identificador. Não servem para estatística nem para publicidade, e o site não tem nenhuma das duas coisas. O site é estático: nada do lado do servidor lê esses cookies.'),
      h3('Trailers do YouTube'),
      p('Sem um clique em um trailer, nenhuma requisição vai ao YouTube. Depois do clique, o player é do Google, carregado de youtube-nocookie.com. Ele pode guardar dados na origem dele, e este site não controla nem lê nada disso. Por isso não prometemos que o YouTube não grava cookies. Quem responde por esse tratamento é o Google, na ' + POLITICA_GOOGLE + '.'),
      h3('Como apagar'),
      p('Os dois cookies expiram sozinhos. Para apagar antes, use as configurações do seu navegador. Sem eles, a abertura e o tutorial voltam a aparecer, e nada mais muda.'),
      h3('Dúvidas'),
      p(`Escreva para ${EMAIL_LINK}.`),
      REVISAO,
    ],
  },
  terms: {
    path: ROUTES.terms,
    title: 'Termos de uso',
    description: 'O que este site é e o que não é: uma curadoria de cinema que não hospeda nem distribui filmes. Direitos sobre imagens e links externos.',
    heading: 'TERMOS',
    blocks: [
      p(`${SITE.name} é uma curadoria de cinema mantida por ${SITE.author}. Estes termos explicam o que o site é e o que ele não é.`),
      h3('O que o site é'),
      p('Um catálogo de sessões. Cada página traz a ficha do filme, o motivo da escolha, a data, a hora e o trailer.'),
      h3('O que o site não é'),
      p('Apesar do nome, este site não é um serviço de streaming. Ele não hospeda, não transmite e não distribui nenhum filme, e não oferece download. O site não cobra nada e não vende nada.'),
      h3('As sessões'),
      p('As sessões acontecem ao vivo, na Sala 24, em um servidor do Discord, fora deste site. Para entrar é preciso uma conta no Discord, sujeita às regras do Discord. Datas e horas são as publicadas na página de cada sessão.'),
      h3('Informações do site'),
      p(`Fichas, datas e textos podem conter erros e podem mudar sem aviso. O site é oferecido como está, sem promessa de que fique sempre no ar. Se encontrar um erro, escreva para ${EMAIL_LINK}.`),
      h3('Filmes, imagens e trailers'),
      p('Títulos, cartazes, cenas e trailers pertencem aos seus titulares e aparecem aqui para identificar e comentar as obras. Este site usa o TMDB como fonte de imagens, mas não é endossado nem certificado pelo TMDB. Os trailers são exibidos pelo YouTube.'),
      p(`Se você é titular de algum desses materiais e quer pedir correção ou retirada, escreva para ${EMAIL_LINK}.`),
      h3('Textos e código'),
      p(`Os textos da curadoria e o código próprio do site são de ${SITE.author}. Bibliotecas e outros recursos de terceiros usados no site seguem as licenças deles.`),
      h3('Links externos'),
      p('Os links para Discord, YouTube, Steam e GitHub levam a serviços de terceiros, com termos próprios. Este site não controla o que acontece neles.'),
      h3('Mudanças'),
      p('Estes termos podem mudar junto com o site. Vale a versão publicada nesta página.'),
      REVISAO,
    ],
  },
  privacy: {
    path: ROUTES.privacy,
    title: 'Privacidade',
    description: 'O que este site coleta, e é pouco: sem conta, sem formulário, sem estatística e sem anúncio. Hospedagem, cookies, YouTube e links externos.',
    heading: 'PRIVACIDADE',
    blocks: [
      p('Este site não tem conta, não tem formulário que colete dados, não tem estatística de visitas e não tem anúncio. Abaixo está o que acontece quando você o visita.'),
      h3('Hospedagem'),
      p('O site é hospedado na Vercel. Como em qualquer hospedagem, cada acesso pode gerar um registro com dados técnicos, como endereço IP, data e hora, endereço pedido e navegador. Esses registros ficam com a Vercel, nas condições dela, inclusive o tempo de guarda.'),
      h3('Cookies e armazenamento'),
      p(`O site grava dois cookies funcionais, sem identificador, e não usa localStorage nem sessionStorage. A lista está na página de <a href="${ROUTES.cookies}">cookies</a>.`),
      h3('Copiar o endereço do feed'),
      p('O botão do rodapé escreve o endereço do RSS na área de transferência do seu aparelho. Nada é enviado a ninguém.'),
      h3('Trailers do YouTube'),
      p('Fontes, imagens e scripts saem do próprio site. A exceção é o trailer: o player só é montado depois que você clica nele, a partir de youtube-nocookie.com, e é removido quando você fecha.'),
      p(`Depois do clique, seu navegador fala diretamente com servidores do Google, que recebem seu endereço IP e dados técnicos. O player pode guardar dados na origem dele, e este site não controla nem lê nada disso. Para esse tratamento, vale a ${POLITICA_GOOGLE}.`),
      h3('Links externos'),
      p('Discord, YouTube, Steam e GitHub são links comuns: nada é carregado desses serviços até você clicar. Depois disso, valem as regras de cada um. O que acontece na sala de exibição segue as regras do Discord.'),
      h3('E-mail'),
      p(`Se você escrever para ${EMAIL_LINK}, a curadoria recebe seu endereço e o que você mandar, e usa isso para responder. É uma conta do Gmail.`),
      h3('Pedidos'),
      p('Para qualquer pedido ou dúvida sobre estes dados, escreva para o mesmo endereço.'),
      REVISAO,
    ],
  },
};
