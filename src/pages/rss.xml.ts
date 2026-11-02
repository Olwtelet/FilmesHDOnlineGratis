// Feed das sessões, em XML escrito à mão para não acrescentar dependência. Os guid e links são os mesmos do feed do site
// antigo: mudar qualquer um faria os leitores mostrarem todas as sessões como novas.
import type { APIRoute } from 'astro';
import { FILMS, filmHref } from '../data/films';
import { SITE } from '../data/site';

const SEMANA = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MESES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function esc(texto: string) {
  return texto.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

function cdata(html: string) {
  return `<![CDATA[${html.replace(/]]>/g, ']]]]><![CDATA[>')}]]>`;
}

/** 2026-10-31T20:30:00-03:00 vira Sat, 31 Oct 2026 20:30:00 -0300: a hora da sessão em São Paulo, não meia-noite UTC. */
function dataRss(iso: string) {
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}:\d{2}:\d{2})([+-]\d{2}):(\d{2})$/);
  if (!m) throw new Error(`data de sessão inesperada: ${iso}`);
  const [, ano, mes, dia, hora, deslocH, deslocM] = m;
  const semana = new Date(Date.UTC(+ano, +mes - 1, +dia)).getUTCDay();
  return `${SEMANA[semana]}, ${dia} ${MESES[+mes - 1]} ${ano} ${hora} ${deslocH}${deslocM}`;
}

export const GET: APIRoute = () => {
  const itens = [...FILMS]
    .sort((a, b) => (a.session.start < b.session.start ? 1 : -1))
    .map((film) => {
      const url = new URL(filmHref(film.slug), SITE.url).href;
      const ficha = [
        `<p>${esc(film.description)}</p>`,
        '<ul>',
        `<li><strong>Direção:</strong> ${esc(film.director)}</li>`,
        `<li><strong>Duração:</strong> ${film.minutes} min</li>`,
        `<li><strong>Sessão:</strong> ${esc(film.session.longDate)}, ${film.session.time}, ${esc(film.session.room)}</li>`,
        '</ul>',
      ].join('');
      return [
        '    <item>',
        `      <title>${esc(`${film.fullTitle} (${film.year})`)}</title>`,
        `      <link>${esc(url)}</link>`,
        `      <guid isPermaLink="true">${esc(url)}</guid>`,
        `      <description>${esc(film.description)}</description>`,
        `      <pubDate>${dataRss(film.session.startIso)}</pubDate>`,
        ...film.genres.map((g) => `      <category>${esc(g)}</category>`),
        `      <content:encoded>${cdata(ficha)}</content:encoded>`,
        '    </item>',
      ].join('\n');
    });

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${esc(SITE.name)}</title>
    <link>${esc(new URL('/', SITE.url).href)}</link>
    <description>${esc(SITE.description)}</description>
    <language>${SITE.lang}</language>
    <atom:link href="${esc(new URL(SITE.rss, SITE.url).href)}" rel="self" type="application/rss+xml" />
${itens.join('\n')}
  </channel>
</rss>
`;

  return new Response(xml, { headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' } });
};
