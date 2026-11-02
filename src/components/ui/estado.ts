// Sobrancelha de estado dos cartões da home e da Programação. O script de components/SessoesOrdem.astro troca o texto
// pelo estado da sessão (Próxima sessão, Sessão de hoje, Exibida); a data completa é o texto antes de ele rodar.
// O aviso não tem data nem estado: o texto é fixo.
import type { Film } from '../../data/films';

export function estadoAttrs(film: Film): Record<string, string | boolean> {
  return film.aviso
    ? {}
    : { 'data-estado': true, 'data-sessao': film.slug, 'data-ini': film.session.start, 'data-fim': film.session.end };
}

export const estadoTexto = (film: Film) => (film.aviso ? 'Nenhuma sessão anunciada' : film.session.fullDate);
