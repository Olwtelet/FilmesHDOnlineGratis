// One-off importer: reads the home roll collection (Webflow "Films" CMS list on "/") from
// reference/localized/home.html and writes src/data/home-roll.ts with the fields that only the
// home cards use (award laurel, critic quotes rich text, the card's own YEAR value), keyed by slug.
// Fields shared with the rest of the site (title, category, director, background image) come from
// src/data/films.ts at render time; this script checks that they match the reference.
// Usage: node tools/import-home.mjs   (re-run only if the reference is re-downloaded)
import fs from 'node:fs';
import path from 'node:path';
import { parse } from 'parse5';

const ROOT = path.resolve(import.meta.dirname, '..');
const OUT = path.join(ROOT, 'src/data/home-roll.ts');
const doc = parse(fs.readFileSync(path.join(ROOT, 'reference/localized/home.html'), 'utf8'));
const filmsSrc = fs.readFileSync(path.join(ROOT, 'src/data/films.ts'), 'utf8');
const FILMS = JSON.parse(filmsSrc.match(/export const FILMS: Film\[\] = (\[[\s\S]*?\n\]);/)[1]);

const attr = (n, k) => n.attrs?.find((a) => a.name === k)?.value;
const classes = (n) => (attr(n, 'class') || '').split(/\s+/).filter(Boolean);
const hasClass = (n, c) => classes(n).includes(c);
const kids = (n) => (n.childNodes || []).filter((c) => c.tagName);
function findAll(n, pred, acc = []) {
  if (n.tagName && pred(n)) acc.push(n);
  for (const c of n.childNodes || []) findAll(c, pred, acc);
  return acc;
}
const byClass = (n, ...cs) => findAll(n, (x) => cs.every((c) => hasClass(x, c)));
const one = (n, ...cs) => {
  const hits = byClass(n, ...cs);
  if (hits.length !== 1) throw new Error(`expected one .${cs.join('.')}, found ${hits.length}`);
  return hits[0];
};
const text = (n) => (n.childNodes || []).map((c) => (c.nodeName === '#text' ? c.value : text(c))).join('');
const check = (cond, msg) => {
  if (!cond) throw new Error(msg);
};

function image(img) {
  const out = { src: attr(img, 'src') };
  if (attr(img, 'srcset') !== undefined) out.srcset = attr(img, 'srcset');
  if (attr(img, 'sizes') !== undefined) out.sizes = attr(img, 'sizes');
  return out;
}

// Rich text body (Webflow w-richtext): star-rating figures + p / h3 / h4 text blocks.
const STAR_FIGURE = 'w-richtext-align-center w-richtext-figure-type-image';
function richText(rt) {
  return (rt.childNodes || []).map((c) => {
    check(c.tagName, `unexpected text node in rich text: ${JSON.stringify(c.value)}`);
    if (c.tagName === 'figure') {
      check(attr(c, 'class') === STAR_FIGURE, `unexpected figure class ${attr(c, 'class')}`);
      const [div] = kids(c);
      const [img] = kids(div);
      check(kids(c).length === 1 && div.tagName === 'div' && kids(div).length === 1, 'unexpected figure markup');
      check(attr(img, 'src') === '/assets/img/films/_shared/stars.svg' && attr(img, 'loading') === 'lazy' && attr(img, 'alt') === '' && img.attrs.length === 3, 'unexpected stars img');
      return { type: 'stars' };
    }
    check(['p', 'h3', 'h4'].includes(c.tagName) && !c.attrs.length, `unexpected rich text element ${c.tagName}`);
    check(c.childNodes.length === 1 && c.childNodes[0].nodeName === '#text', `rich text ${c.tagName} is not plain text`);
    return { type: c.tagName, text: c.childNodes[0].value };
  });
}

const items = byClass(doc, 'home-roll-item');
check(items.length === FILMS.length, `home roll has ${items.length} items, FILMS has ${FILMS.length}`);

const roll = items.map((item, i) => {
  const film = FILMS[i];
  const href = `/films/${film.slug}`;
  const links = findAll(item, (n) => n.tagName === 'a' || n.tagName === 'link').map((n) => attr(n, 'href'));
  check(links.length === 3 && links.every((h) => h === href), `item ${i}: links ${links} do not all point to ${href}`);

  // background image = the film's main CMS image
  const bg = one(item, 'roll-img-w').childNodes[0];
  const bgImg = image(bg);
  check(bgImg.src === film.image.src && bgImg.srcset === film.image.srcset, `item ${i}: background image differs from FILMS`);
  check(bgImg.sizes === (film.image.srcset ? '100vw' : undefined), `item ${i}: unexpected sizes ${bgImg.sizes}`);

  // title / category / director are the shared CMS fields
  check(text(one(item, 'roll-cont-eyeb')) === film.category, `item ${i}: eyebrow differs from category`);
  check(text(one(item, 'roll-cont-he')) === film.title, `item ${i}: title differs`);
  const values = byClass(item, 'linecallout-item').map((li) => text(kids(li)[li === byClass(item, 'linecallout-item')[0] ? 2 : 1]));
  const [director, year, category] = values;
  check(director === film.director, `item ${i}: director differs`);
  check(category === film.category, `item ${i}: category differs`);

  // award laurel
  const headline = one(item, 'award_headline');
  const awardImg = one(item, 'award-img');
  const award = {
    year: text(one(item, 'award-year')),
    headline: text(headline),
    image: image(awardImg),
  };
  check(hasClass(headline, 'w-dyn-bind-empty') === (award.headline === ''), `item ${i}: headline bind-empty mismatch`);
  if (hasClass(awardImg, 'w-dyn-bind-empty')) award.imageBindEmpty = true;

  // critic quotes (same rich text rendered for mobile and desktop)
  const [mobile, desktop] = byClass(item, 'awards-w');
  check(hasClass(mobile, 'mobile') && !hasClass(desktop, 'mobile'), `item ${i}: unexpected reviews order`);
  const reviews = richText(desktop);
  check(JSON.stringify(richText(mobile)) === JSON.stringify(reviews), `item ${i}: mobile reviews differ from desktop`);

  return [film.slug, { year, award, reviews }];
});

// compact, readable TS: one rich-text block per line; invisible characters escaped
const js = (v) => JSON.stringify(v).replace(/[​-‍ ﻿]/g, (c) => `\\u${c.charCodeAt(0).toString(16).padStart(4, '0')}`);
const body = roll
  .map(([slug, v]) =>
    [
      `  ${js(slug)}: {`,
      `    year: ${js(v.year)},`,
      `    award: ${js(v.award)},`,
      `    reviews: [`,
      ...v.reviews.map((b) => `      ${js(b)},`),
      `    ],`,
      `  },`,
    ].join('\n'),
  )
  .join('\n');
const out = `// GENERATED by tools/import-home.mjs from reference/localized/home.html (home roll cards).
// Safe to hand-edit; re-running the importer overwrites this file.
//
// Home-only CMS fields of each film, keyed by slug. The cards themselves follow FILMS order and
// take title / category / director / background image from src/data/films.ts.

export interface HomeImage {
  src: string;
  srcset?: string;
  sizes?: string;
}

/** One block of a Webflow rich-text body: a star-rating figure or a plain-text p / h3 / h4. */
export type RichBlock = { type: 'stars' } | { type: 'p' | 'h3' | 'h4'; text: string };

export interface HomeAward {
  /** award year, as published */
  year: string;
  /** "" when the CMS field is empty (Webflow then adds w-dyn-bind-empty) */
  headline: string;
  /** laurel image */
  image: HomeImage;
  /** the CMS image field is empty: Webflow keeps the designer placeholder and adds w-dyn-bind-empty */
  imageBindEmpty?: boolean;
}

export interface HomeRollFilm {
  /** the card's own YEAR field (not always Film.year) */
  year: string;
  award: HomeAward;
  /** critic quotes rich text (rendered twice: mobile and desktop) */
  reviews: RichBlock[];
}

export const HOME_ROLL: Record<string, HomeRollFilm> = {
${body}
};
`;
fs.writeFileSync(OUT, out);
console.log(`wrote ${path.relative(ROOT, OUT)} (${roll.length} films)`);
