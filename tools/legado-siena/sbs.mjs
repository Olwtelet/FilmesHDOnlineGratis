// Side-by-side montage (left | right) with optional 1/2 downsample and a pixel-diff ratio.
// Usage: node tools/sbs.mjs left.png right.png out.png [--half]
import fs from 'node:fs';
import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';

const [l, r, out] = process.argv.slice(2);
const half = process.argv.includes('--half');
const A = PNG.sync.read(fs.readFileSync(l));
const B = PNG.sync.read(fs.readFileSync(r));
const shrink = (img) => {
  if (!half) return img;
  const o = new PNG({ width: img.width >> 1, height: img.height >> 1 });
  for (let y = 0; y < o.height; y++)
    for (let x = 0; x < o.width; x++)
      for (let c = 0; c < 4; c++) {
        const i = (y * 2 * img.width + x * 2) * 4 + c;
        o.data[(y * o.width + x) * 4 + c] = (img.data[i] + img.data[i + 4] + img.data[i + img.width * 4] + img.data[i + img.width * 4 + 4]) >> 2;
      }
  return o;
};
let diff = null;
if (A.width === B.width && A.height === B.height) {
  const n = pixelmatch(A.data, B.data, null, A.width, A.height, { threshold: 0.1 });
  diff = n / (A.width * A.height);
}
const a = shrink(A), b = shrink(B);
const o = new PNG({ width: a.width + b.width + 6, height: Math.max(a.height, b.height) });
o.data.fill(0);
for (let i = 0; i < o.data.length; i += 4) { o.data[i] = 255; o.data[i + 2] = 255; o.data[i + 3] = 255; }
PNG.bitblt(a, o, 0, 0, a.width, a.height, 0, 0);
PNG.bitblt(b, o, 0, 0, b.width, b.height, a.width + 6, 0);
fs.writeFileSync(out, PNG.sync.write(o));
console.log(`${out} diff=${diff === null ? 'size-mismatch' : (diff * 100).toFixed(2) + '%'}`);
