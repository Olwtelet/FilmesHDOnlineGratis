// Writes section 3b of tema-sinal.css: every size the original CSS gives in ch, restated in em with the width of "0" in
// the original font of that element. For each selector and property that uses ch anywhere, all its rules are repeated in
// the original order, so the responsive overrides keep winning where they did.
const fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '..');
const NB = new Set(['.awards-w', '.circle', '.flip-target-w', '.div-block-2', '.previousnext-text-w', '.prize-coll-w', '.about-small-text-wrap', '.video_plr-text', '.policy-rich-tx', '.policy-rich-tx p', '.policy-rich-tx ul']);
const rules = [];
const walk = (css, media) => {
  let i = 0;
  while (i < css.length) {
    const open = css.indexOf('{', i);
    if (open < 0) break;
    const sel = css.slice(i, open).trim();
    let d = 1, j = open + 1;
    while (j < css.length && d) { if (css[j] === '{') d++; else if (css[j] === '}') d--; j++; }
    const body = css.slice(open + 1, j - 1);
    if (sel.startsWith('@media') || sel.startsWith('@supports')) walk(body, sel);
    else if (!sel.startsWith('@')) for (const p of body.split(';')) { const k = p.indexOf(':'); if (k > 0) rules.push({ media, sel, prop: p.slice(0, k).trim(), val: p.slice(k + 1).trim() }); }
    i = j;
  }
};
for (const f of ['webflow.css', 'main.css']) walk(fs.readFileSync(path.join(ROOT, 'public/assets/css', f), 'utf8'), '');
const used = new Set(rules.filter((r) => /(^|[\s(])[\d.]+ch\b/.test(r.val)).map((r) => `${r.sel}|${r.prop}`));
const toEm = (sel, val) => val.replace(/([\d.]+)ch\b/g, (m, n) => `calc(${n} * var(${NB.has(sel) ? '--ch-texto' : '--ch-display'}))`);
const picked = rules.filter((r) => used.has(`${r.sel}|${r.prop}`));
const blocks = [];
for (const r of picked) {
  const last = blocks[blocks.length - 1];
  const line = `${r.sel} { ${r.prop}: ${toEm(r.sel, r.val)}; }`;
  if (last && last.media === r.media) last.lines.push(line);
  else blocks.push({ media: r.media, lines: [line] });
}
let out = `/* 3b. Medidas em ch. A unidade depende da largura do "0" de cada fonte, então a troca de fonte encolheria estas caixas.
       Aqui elas ficam em em, com a proporção da fonte original (gerado por tools/theme-gen-ch.cjs). */
:root { --ch-display: .598em; --ch-texto: .6196em; }
`;
for (const b of blocks) {
  if (b.media) out += `${b.media} {\n${b.lines.map((l) => `  ${l}`).join('\n')}\n}\n`;
  else out += `${b.lines.join('\n')}\n`;
}
const F = path.join(ROOT, 'public/assets/css/tema-sinal.css');
let s = fs.readFileSync(F, 'utf8');
const a = s.indexOf('/* 3b. Medidas em ch.');
const end = s.indexOf('/* 3c.');
if (a >= 0) s = s.slice(0, a) + out + '\n' + s.slice(end);
else s = s.slice(0, end) + out + '\n' + s.slice(end);
fs.writeFileSync(F, s);
console.log(`selectors/properties: ${used.size}, rules written: ${picked.length}`);
