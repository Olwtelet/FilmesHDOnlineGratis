// One-off importer: reads the /about content from reference/localized/about.html and writes
// src/data/about.ts (typed data rendered by src/pages/about.astro and src/components/about/*).
//   - hero              <- header.about-hero (arch images, small text groups, h1 words)
//   - typeComp          <- section.about-type-comp (typographic composition)
//   - grid              <- section.about-grid-coll (CMS "About grid" images, background-image urls)
//   - team / services / collaborators  <- the three article.s.h-auto blocks
//   - filmsCta          <- div.s.prizes ("Our Films" CTA + framed image)
// Usage: node tools/import-about.mjs   (re-run only if the reference is re-downloaded)
import fs from 'node:fs';
import path from 'node:path';
import { parse } from 'parse5';

const ROOT = path.resolve(import.meta.dirname, '..');
const doc = parse(fs.readFileSync(path.join(ROOT, 'reference/localized/about.html'), 'utf8'));
const attr = (n, k) => n.attrs?.find((a) => a.name === k)?.value;
const classes = (n) => (attr(n, 'class') || '').split(/\s+/).filter(Boolean);
const hasClass = (n, c) => classes(n).includes(c);
const kids = (n) => (n.childNodes || []).filter((c) => c.tagName);
function findAll(n, pred, acc = []) {
  if (n.tagName && pred(n)) acc.push(n);
  for (const c of n.childNodes || []) findAll(c, pred, acc);
  return acc;
}
const find = (n, pred) => findAll(n, pred)[0];
const byClass = (n, c) => find(n, (x) => hasClass(x, c));
const allByClass = (n, c) => findAll(n, (x) => hasClass(x, c));
const text = (n) => (n.childNodes || []).map((c) => (c.nodeName === '#text' ? c.value : text(c))).join('');
const assert = (cond, msg) => {
  if (!cond) throw new Error(`import-about: ${msg}`);
};
/** class list minus the base class -> the Webflow combo modifiers ("_2", "_6", ...) */
const modifier = (n, base) => classes(n).filter((c) => c !== base).join(' ');
const image = (img) => {
  const out = { src: attr(img, 'src') };
  if (attr(img, 'srcset')) out.srcset = attr(img, 'srcset');
  if (attr(img, 'sizes')) out.sizes = attr(img, 'sizes');
  return out;
};

const view = find(doc, (n) => attr(n, 'data-taxi-view') !== undefined);
assert(attr(view, 'data-page') === 'about', 'unexpected view');

// ---- hero ---------------------------------------------------------------------------------
const heroEl = find(view, (n) => attr(n, 'data-track') === 'abouthero');
const heroCols = kids(heroEl);
assert(heroCols.length === 3, 'hero should have 3 columns');
const archImg = (col) => image(byClass(col, 'arch-masked-img'));
const center = heroCols[1];
const groups = kids(center).filter((n) => hasClass(n, 'about-he-w') && !hasClass(n, 'full'));
assert(groups.length === 2, 'hero should have 2 small-text groups');
const smallGroup = (g) =>
  kids(g).map((of) => {
    const tx = byClass(of, 'about-he-sm-tx');
    return {
      text: text(tx),
      br: kids(tx).some((c) => c.tagName === 'br'),
      lines: allByClass(byClass(of, 'about-hero-lines'), 'line').length,
    };
  });
const h1 = find(center, (n) => n.tagName === 'h1');
const hero = {
  leftImage: archImg(heroCols[0]),
  rightImage: archImg(heroCols[2]),
  mobileImage: image(byClass(byClass(center, 'mobile-svg'), 'arch-masked-img')),
  topLines: smallGroup(groups[0]),
  words: allByClass(h1, 'span-move').map(text),
  headingLines: allByClass(byClass(center, 'cs-hero-lines'), 'line').length,
  bottomLines: smallGroup(groups[1]),
};

// ---- typographic composition ----------------------------------------------------------------
const typeEl = byClass(view, 'about-type-comp');
const titles = (struct) => kids(struct).map((n) => ({ text: text(n), mod: modifier(n, 'about-title-tx') }));
const xl = byClass(typeEl, 'about-xl-text');
const typeComp = {
  id: attr(typeEl, 'id'),
  titles: titles(kids(typeEl)[0]),
  statement: allByClass(typeEl, 'about-small-text-line').map((line) => kids(line).map(text)),
  formats: allByClass(byClass(typeEl, 'about-md-text'), 'div-block-11').map((col) => allByClass(col, 'text-block-12').map(text)),
  xlWord: text(byClass(xl, 'text-block-9')),
  xlTitles: titles(byClass(xl, 'about-struct-tx')),
  colophon: kids(byClass(xl, 'about-small-struct')).map(text),
};
assert(typeComp.titles.length === 4 && typeComp.statement.length === 4, 'unexpected type composition');

// ---- image grid (CMS) ----------------------------------------------------------------------
const gridItems = allByClass(byClass(view, 'about-grid-w'), 'w-dyn-item');
const gridNodeIds = new Set(gridItems.map((n) => attr(n, 'id')));
assert(gridNodeIds.size === 1, 'grid items should share one w-node id');
const grid = {
  nodeId: [...gridNodeIds][0],
  images: gridItems.map((item) => {
    const style = attr(byClass(item, 'img'), 'style');
    const m = style.match(/^background-image:url\("([^"]+)"\)$/);
    assert(m, `unexpected grid style ${style}`);
    return m[1];
  }),
};

// ---- articles --------------------------------------------------------------------------------
const articles = findAll(view, (n) => n.tagName === 'article');
assert(articles.length === 3, 'expected 3 articles');
const ticketTitle = (a) => text(byClass(a, 'ticket-btn-tx'));

const team = {
  title: ticketTitle(articles[0]),
  members: allByClass(articles[0], 'team-item').map((item) => ({
    role: text(byClass(item, 'roll-cont-eyeb')),
    name: text(byClass(item, 'team-he')),
    bio: text(byClass(item, 'team-bio')),
    image: image(byClass(item, 'team-img')),
  })),
};

const services = {
  title: ticketTitle(articles[1]),
  items: allByClass(articles[1], 'service-item').map((item) => ({
    label: text(byClass(item, 'roll-cont-eyeb')),
    lines: byClass(item, 'service-he')
      .childNodes.filter((c) => c.nodeName === '#text')
      .map((c) => c.value),
  })),
};

const collaborators = {
  title: ticketTitle(articles[2]),
  items: allByClass(articles[2], 'collab-item').map((item) => ({
    label: text(byClass(item, 'roll-cont-eyeb')),
    name: text(byClass(item, 'text-block-11')),
    logo: attr(byClass(item, 'collab-logo'), 'src'),
  })),
};

// ---- "Our Films" CTA -----------------------------------------------------------------------
const prizes = byClass(view, 'prizes');
const ctaLink = find(byClass(prizes, 'cta-content-w'), (n) => n.tagName === 'a');
const filmsCta = {
  title: text(byClass(prizes, 'cta-he')),
  href: attr(ctaLink, 'href'),
  label: text(byClass(ctaLink, 'footagemenu-cta-tx')),
  image: image(byClass(prizes, 'image-2')),
};

// ---- write ---------------------------------------------------------------------------------
const html = find(doc, (n) => n.tagName === 'html');
const page = {
  route: '/about',
  title: text(find(doc, (n) => n.tagName === 'title')),
  wfPage: attr(html, 'data-wf-page'),
};
const json = (v) => JSON.stringify(v, null, 2).replace(/ /g, '\\u00a0');

const out = `// GENERATED by tools/import-about.mjs from reference/localized/about.html.
// Safe to hand-edit; re-running the importer overwrites this file.
//
// Texts are stored exactly as published: "\\u00a0" is a non-breaking space (Webflow's &nbsp;),
// trailing spaces / line breaks are part of the content. Render them with {text}, never trim.

export interface AboutImage {
  src: string;
  /** Webflow responsive renditions; absent when the asset has none (then sizes is absent too) */
  srcset?: string;
  sizes?: string;
}

export interface AboutTitle {
  text: string;
  /** Webflow combo class after "about-title-tx" ("" for none) */
  mod: string;
}

/** One ".about-he-of-w" row of the hero: small text, optional trailing <br>, decorative lines. */
export interface HeroSmallLine {
  text: string;
  br: boolean;
  /** number of div.line inside .about-hero-lines */
  lines: number;
}

export const ABOUT_PAGE = ${json(page)} as const;

export const ABOUT_HERO: {
  leftImage: AboutImage;
  rightImage: AboutImage;
  mobileImage: AboutImage;
  topLines: HeroSmallLine[];
  words: string[];
  headingLines: number;
  bottomLines: HeroSmallLine[];
} = ${json(hero)};

export const ABOUT_TYPE_COMP: {
  /** anchor targeted by the hero's down arrow */
  id: string;
  titles: AboutTitle[];
  /** ".about-small-text-line" rows, each a list of cells */
  statement: string[][];
  /** ".div-block-11" columns of ".text-block-12" words (the 2nd column starts with a ._5-line) */
  formats: string[][];
  xlWord: string;
  xlTitles: AboutTitle[];
  colophon: string[];
} = ${json(typeComp)};

/** CMS "About grid" collection: every item carries the same Webflow grid-area id. */
export const ABOUT_GRID: { nodeId: string; images: string[] } = ${json(grid)};

export interface TeamMember {
  role: string;
  name: string;
  bio: string;
  image: AboutImage;
}

export const ABOUT_TEAM: { title: string; members: TeamMember[] } = ${json(team)};

export const ABOUT_SERVICES: { title: string; items: { label: string; lines: string[] }[] } = ${json(services)};

export const ABOUT_COLLABORATORS: { title: string; items: { label: string; name: string; logo: string }[] } = ${json(collaborators)};

export const ABOUT_FILMS_CTA: { title: string; href: string; label: string; image: AboutImage } = ${json(filmsCta)};
`;
fs.writeFileSync(path.join(ROOT, 'src/data/about.ts'), out);

// ---- long static SVG geometry used by src/components/about/* (copied, never retyped) ----------
const pathD = (svg, i = 0) => attr(findAll(svg, (n) => n.tagName === 'path')[i], 'd');
const svgOf = (cls) => find(view, (n) => n.tagName === 'svg' && hasClass(n, cls));
const archClip = pathD(svgOf('arch-img-mask'));
assert(archClip === pathD(byClass(byClass(center, 'mobile-svg'), 'arch-img-mask')), 'desktop/mobile arch clips differ');
const collabSvgs = allByClass(articles[2], 'collab-svg');
assert(new Set(collabSvgs.map((s) => pathD(s, 0) + pathD(s, 1))).size === 1, 'collab frames differ');
// the hero logo square and the "Our Films" CTA frame masks are shared components
// (ui/LogoSquare.astro, ui/svg/FilmMask*.astro): make sure /about still uses the same geometry
const shared = ['src/components/ui/svg-paths.ts', 'src/components/ui/svg/FilmMaskSvg.astro', 'src/components/ui/svg/FilmMaskMobileSvg.astro']
  .map((f) => fs.readFileSync(path.join(ROOT, f), 'utf8'))
  .join('\n');
for (const [what, d] of [
  ['hero logo lettering', pathD(svgOf('logo-footer'), 3)],
  ['CTA desktop frame (#film)', pathD(svgOf('svg-mask'))],
  ['CTA mobile frame (#filmmob)', pathD(svgOf('svg-mask-moble'))],
])
  assert(shared.includes(d), `/about ${what} differs from the shared component`);
const paths = {
  ARCH_CLIP_D: ['arch-shaped clipPath of the hero images (#arch2 desktop, #arch-mobile)', archClip],
  COLLAB_MASK_D: ['collaborator ticket frame: mask shape', pathD(collabSvgs[0], 0)],
  COLLAB_FRAME_D: ['collaborator ticket frame: outline drawn through the mask', pathD(collabSvgs[0], 1)],
};
const svgOut = `// GENERATED by tools/import-about.mjs: long static SVG path data of the /about page, copied
// verbatim from the original markup (shorter paths are written inline in the components).
${Object.entries(paths)
  .map(([k, [doc, d]]) => {
    assert(d && /^[\w.\s,-]+$/.test(d), `bad path ${k}`);
    return `\n/** ${doc} */\nexport const ${k} =\n  '${d}';\n`;
  })
  .join('')}`;
fs.writeFileSync(path.join(ROOT, 'src/components/about/svg-paths.ts'), svgOut);

console.log(
  `wrote src/data/about.ts (${grid.images.length} grid images, ${team.members.length} team members, ${services.items.length} services, ${collaborators.items.length} collaborators)`,
);
