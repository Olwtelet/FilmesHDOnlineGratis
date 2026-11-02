// One-off importer: extracts the per-film content of the Webflow "Films" CMS template
// (/films/<slug>) from reference/localized/films_<slug>.html into src/data/case-studies/<slug>.json.
//
//   node tools/import-case-studies.mjs
//
// Only the fields that are specific to the case-study page are written; everything that the
// shared FILMS collection already holds (title, category, director, synopsis, main image) is
// asserted to match src/data/films.ts and then taken from there at render time.
// Raw CMS values are kept verbatim (trailing spaces, typographic characters, empty fields), because
// Webflow prints them as-is and derives its conditional-visibility classes from emptiness.
import fs from 'node:fs';
import path from 'node:path';
import { parse, serialize } from 'parse5';
import { FILMS } from '../src/data/films.ts';

const ROOT = path.resolve(import.meta.dirname, '..');
const OUT = path.join(ROOT, 'src/data/case-studies');

const attr = (n, k) => n.attrs?.find((a) => a.name === k)?.value;
const classes = (n) => (attr(n, 'class') || '').split(/\s+/).filter(Boolean);
const has = (n, ...c) => c.every((x) => classes(n).includes(x));
const kids = (n) => (n.childNodes || []).filter((c) => c.tagName);
function findAll(n, pred, acc = []) {
  if (n.tagName && pred(n)) acc.push(n);
  for (const c of n.childNodes || []) findAll(c, pred, acc);
  if (n.content) findAll(n.content, pred, acc);
  return acc;
}
const find = (n, pred) => findAll(n, pred)[0];
const byClass = (n, ...c) => find(n, (x) => has(x, ...c));
const allByClass = (n, ...c) => findAll(n, (x) => has(x, ...c));
/** text of an element that must contain text only (no markup) */
function text(n) {
  if (!n) return undefined;
  if (kids(n).length) throw new Error(`unexpected markup inside .${classes(n).join('.')}`);
  return (n.childNodes || []).map((c) => c.value ?? '').join('');
}
const fail = (slug, msg) => {
  throw new Error(`[${slug}] ${msg}`);
};
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const image = (img) => (attr(img, 'srcset') ? { src: attr(img, 'src'), srcset: attr(img, 'srcset') } : { src: attr(img, 'src') });
const listItems = (list) => (list ? kids(list) : []);

function importFilm(film) {
  const { slug } = film;
  const file = path.join(ROOT, 'reference/localized', `films_${slug}.html`);
  const doc = parse(fs.readFileSync(file, 'utf8'));
  const view = find(doc, (n) => attr(n, 'data-taxi-view') !== undefined);
  const check = (ok, msg) => ok || fail(slug, msg);

  // ---- hero / trailer: everything comes from FILMS except the trailer URL
  const hero = byClass(view, 'cs-hero', 's');
  check(same(image(byClass(hero, 'cs-main-img')), film.image), 'hero image != FILMS image');
  check(text(byClass(hero, 'cs-title')) === film.title, 'hero title != FILMS title');
  check(text(byClass(hero, 'is-cs')) === film.category, 'hero category != FILMS category');
  const second = find(view, (n) => attr(n, 'id') === 'second');
  const video = find(second, (n) => n.tagName === 'video');
  check(same(image(byClass(second, 'image-2')), film.image), 'trailer poster != FILMS image');

  // ---- credits
  const credits = byClass(view, 'cs-credits-w');
  const main = byClass(credits, 'credit-main-q');
  check(text(byClass(main, 'credit-name')) === film.director, 'director != FILMS director');
  const dirImg = byClass(main, 'credit-main-img');
  check(attr(dirImg, 'sizes') === undefined || attr(dirImg, 'sizes') === '(max-width: 991px) 100vw, 25vw', 'director img sizes');
  const roleName = (it, roleCls, nameCls) => ({ role: text(byClass(it, ...roleCls)) ?? '', name: text(byClass(it, ...nameCls)) ?? '' });

  const keyCrew = listItems(find(credits, (n) => has(n, 'credit-grid', 'w-dyn-items') && classes(n).length === 2)).map((it) =>
    roleName(it, ['roll-cont-eyeb', 'mb-0'], ['credit-name']),
  );
  const producerTitles = listItems(byClass(credits, 'collection-list-4')).map((it) => text(byClass(it, 'credit-row-title')) ?? '');
  const producers = listItems(byClass(credits, 'credit-grid', 'cols-3')).map((it) => {
    const r = roleName(it, ['is-role', 'is-main'], ['credit-name', 'smaller']);
    check(attr(byClass(it, 'credit-name'), 'data-role') === r.role, 'producer data-role != role');
    return r;
  });
  check(same(producerTitles, producers.map((p) => p.role)), 'producer titles != producer roles');

  const row1 = listItems(byClass(credits, 'credit-grid', 'flex', 'first')).map((it) => roleName(it, ['is-role'], ['credit-name']));
  const row2El = find(credits, (n) => has(n, 'credit-grid', 'flex', 'w-dyn-items') && !has(n, 'first') && !has(n, 'small'));
  const crew = listItems(row2El).map((it) => {
    const [roleEl, castEl] = kids(kids(it)[0]);
    const role = text(roleEl);
    check(has(roleEl, 'w-condition-invisible') === !role && has(castEl, 'w-condition-invisible') === !!role, 'CAST label visibility');
    return { role, name: text(byClass(it, 'credit-name')) };
  });
  const row3 = listItems(byClass(credits, 'credit-grid', 'flex', 'small')).map((it) => text(byClass(it, 'credit-name')));
  check(same(row1, crew.slice(0, 2)), 'crew row 1 != first two crew items');
  check(same(row3, crew.map((c) => c.name)), 'crew row 3 != crew names');

  // ---- gallery (two strips of the same multi-image field) + director's cut
  const strips = allByClass(view, 'cs-footage-c');
  check(strips.length === 2, 'expected two footage strips');
  const [gallery, gallery2] = strips.map((strip) =>
    allByClass(strip, 'cs-footage-img').map((img) => {
      check(!attr(img, 'sizes') || attr(img, 'sizes') === '(max-width: 767px) 54vw, (max-width: 991px) 288px, 29vw', 'gallery sizes');
      return image(img);
    }),
  );
  check(same(gallery, gallery2), 'footage strips differ');
  check(same(image(byClass(view, 'dc-bg-img')), film.image), "director's cut image != FILMS image");

  // ---- reviews
  const reviewsSection = find(view, (n) => has(n, 's', 'full'));
  const reviews = allByClass(reviewsSection, 'review-slider-slide').map((it) => ({
    source: text(byClass(it, 'roll-cont-eyeb')),
    quote: text(byClass(it, 'review-he')),
  }));
  check(has(reviewsSection, 'w-condition-invisible') === !reviews.length, 'reviews visibility');

  // ---- prizes (7 identical copies of one CMS list, see the marquee)
  const prizesSection = byClass(view, 'prizes');
  const copies = findAll(prizesSection, (n) => classes(n).join(' ') === 'w-dyn-list');
  check(copies.length === 7, 'expected 7 prize lists');
  const prizeLists = copies.map((list) =>
    allByClass(list, 'prize-coll-it').map((it) => {
      const img = byClass(it, 'prize-it-img');
      return {
        logo: has(img, 'w-dyn-bind-empty') ? null : attr(img, 'src'),
        category: text(byClass(it, 'roll-cont-eyeb')),
        festival: text(byClass(it, 'prize-he')),
      };
    }),
  );
  check(prizeLists.every((l) => same(l, prizeLists[0])), 'prize copies differ');
  const prizes = prizeLists[0];
  check(has(prizesSection, 'w-condition-invisible') === !prizes.length, 'prizes visibility');
  check(same(image(byClass(prizesSection, 'image-2')), film.image), 'prizes image != FILMS image');

  // ---- investors & broadcast (rich text)
  const investorsSection = byClass(view, 'investor');
  const rt = byClass(investorsSection, 'investor-rt');
  const investorsHtml = has(rt, 'w-dyn-bind-empty') ? '' : serialize(rt);
  check(has(investorsSection, 'w-condition-invisible') === !investorsHtml, 'investors visibility');

  // ---- next project: the whole collection in FILMS order
  const next = allByClass(view, 'previousnext-item');
  check(same(next.map((n) => attr(n, 'data-id')), FILMS.map((f) => f.slug)), 'next list order != FILMS');
  next.forEach((n, i) => {
    check(text(byClass(n, 'previousnext-he')) === FILMS[i].title, 'next list title');
    check(same(image(byClass(n, 'prevnext-img')), FILMS[i].image), 'next list image');
  });

  return {
    slug,
    trailer: attr(video, 'src'),
    directorImage: image(dirImg),
    credits: { keyCrew, producers, crew },
    gallery,
    reviews,
    prizes,
    investorsHtml,
  };
}

fs.mkdirSync(OUT, { recursive: true });
for (const film of FILMS) {
  const data = importFilm(film);
  fs.writeFileSync(path.join(OUT, `${film.slug}.json`), JSON.stringify(data, null, 2) + '\n');
  console.log(
    `${film.slug}: crew ${data.credits.keyCrew.length}/${data.credits.producers.length}/${data.credits.crew.length}, gallery ${data.gallery.length}, reviews ${data.reviews.length}, prizes ${data.prizes.length}, investors ${data.investorsHtml ? 'yes' : 'empty'}, trailer ${JSON.stringify(data.trailer)}`,
  );
}
