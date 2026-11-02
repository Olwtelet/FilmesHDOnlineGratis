// Mapa do site: as páginas fixas e todas as sessões, nas URLs canônicas (com a barra final).
import type { APIRoute } from 'astro';
import { FILMS, filmHref } from '../data/films';
import { ROUTES, SITE } from '../data/site';

export const GET: APIRoute = () => {
  const caminhos = [ROUTES.home, ROUTES.work, ROUTES.about, ROUTES.contact, ROUTES.cookies, ROUTES.terms, ROUTES.privacy, ...FILMS.map((f) => filmHref(f.slug))];
  const urls = caminhos.map((c) => `  <url><loc>${new URL(c, SITE.url).href}</loc></url>`).join('\n');
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;
  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
