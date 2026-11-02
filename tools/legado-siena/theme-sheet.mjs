// Before/after contact sheet from two labels of tools/theme-snapshot.mjs: one row per state, before on the left, after on the right.
// Usage: node tools/theme-sheet.mjs --a=antes --b=depois --out=sheet.png --item=scenario/viewport/state[,scenario/viewport/state...]
//                                   [--dir=reference/captures/tema-fase1] [--width=720] [--cols=1]
// A state is the file name without .png; "scenario/viewport/*" takes every state of that run.
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const opt = (k, d) => process.argv.find((a) => a.startsWith(`--${k}=`))?.slice(k.length + 3) ?? d;
const DIR = path.resolve(opt('dir', 'reference/captures/tema-fase1'));
const A = opt('a', 'antes'), B = opt('b', 'depois'), W = +opt('width', 720), COLS = +opt('cols', 1);
const items = opt('item').split(',').flatMap((it) => {
  const [s, v, st] = it.split('/');
  if (st !== '*') return [`${s}/${v}/${st}`];
  return fs.readdirSync(path.join(DIR, A, s, v)).filter((f) => f.endsWith('.png')).sort().map((f) => `${s}/${v}/${f.slice(0, -4)}`);
});
const GAP = 8, HEAD = 26;
const esc = (t) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;');
const cell = async (label, item) => {
  const file = path.join(DIR, label, `${item}.png`);
  if (!fs.existsSync(file)) return { input: await sharp({ create: { width: W, height: Math.round(W * .625), channels: 3, background: '#400' } }).png().toBuffer(), h: Math.round(W * .625) };
  const input = await sharp(file).resize({ width: W }).png().toBuffer();
  return { input, h: (await sharp(input).metadata()).height };
};
const rows = [];
for (const item of items) {
  const [a, b] = [await cell(A, item), await cell(B, item)];
  rows.push({ item, a, b, h: Math.max(a.h, b.h) + HEAD });
}
const pairW = W * 2 + GAP;
const nRows = Math.ceil(rows.length / COLS);
const rowH = Array.from({ length: nRows }, (_, r) => Math.max(...rows.slice(r * COLS, (r + 1) * COLS).map((x) => x.h)));
const total = { w: COLS * pairW + (COLS - 1) * 24 + GAP * 2, h: rowH.reduce((p, c) => p + c + GAP, GAP) };
const layers = [];
rows.forEach((row, i) => {
  const r = Math.floor(i / COLS), c = i % COLS;
  const x = GAP + c * (pairW + 24), y = GAP + rowH.slice(0, r).reduce((p, h) => p + h + GAP, 0);
  const svg = `<svg width="${pairW}" height="${HEAD}"><text x="2" y="17" font-family="Consolas,monospace" font-size="13" fill="#9ba0a6">${esc(A)}  ${esc(row.item)}</text><text x="${W + GAP + 2}" y="17" font-family="Consolas,monospace" font-size="13" fill="#e8e9ea">${esc(B)}</text></svg>`;
  layers.push({ input: Buffer.from(svg), left: x, top: y });
  layers.push({ input: row.a.input, left: x, top: y + HEAD });
  layers.push({ input: row.b.input, left: x + W + GAP, top: y + HEAD });
});
await sharp({ create: { width: total.w, height: total.h, channels: 3, background: '#111' } }).composite(layers).png({ compressionLevel: 9 }).toFile(opt('out'));
console.log(`${opt('out')}: ${rows.length} states, ${total.w}x${total.h}`);
