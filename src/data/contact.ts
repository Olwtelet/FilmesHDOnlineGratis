// Conteúdo de /contato/: só o e-mail e o Discord, os dois canais reais. Sem telefone e sem endereço.
//   é o espaço que não quebra linha. O título não leva acento: as letras rolam por uma janela de .7em que os corta.
import { EMAIL, ROUTES, SOCIAL } from './site';

export interface ContactRow {
  /** rótulo pequeno (.contact-off) */
  label: string;
  /** valor grande (.contact-lab) */
  value: string;
  href: string;
  /** link que sai do site: abre em outra aba, fora do Taxi */
  external?: boolean;
}

export interface ContactPage {
  path: string;
  title: string;
  description: string;
  /** sobrancelha acima do título */
  eyebrow: string;
  /** título que rola, um item por linha (data-an="rollover") */
  headline: string[];
  rows: ContactRow[];
}

export const CONTACT_PAGE: ContactPage = {
  path: ROUTES.contact,
  title: 'Contato',
  description: 'Como falar com a curadoria de Filmes HD Online Grátis: por e-mail ou no servidor do Discord.',
  eyebrow: 'CONTATO',
  headline: ['FALE', 'COM A', 'GENTE'],
  rows: [
    {
      // o endereço não cabe no valor grande: vai no rótulo pequeno, e o valor vira a ação
      label: EMAIL.main.toUpperCase(),
      value: 'ENVIAR E-MAIL',
      href: `mailto:${EMAIL.main}`,
    },
    {
      label: 'DISCORD',
      value: 'ENTRAR NO SERVIDOR',
      href: SOCIAL.discord,
      external: true,
    },
  ],
};
