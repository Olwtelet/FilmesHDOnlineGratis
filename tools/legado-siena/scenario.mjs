// Runs scenarios against ONE base URL and stores screenshots/videos.
// Usage: node tools/scenario.mjs <baseUrl> <outDir> [--only=substr[,substr]] [--viewports=1440x900,390x844] [--video]
// Output: <outDir>/<scenario>/<viewport>/<label>.png (+ video.webm, console.txt)
import path from 'node:path';
import { loadScenarios, runScenario, closeBrowser } from './lib/runner.mjs';

const [base, out] = process.argv.slice(2);
const opt = (k) => process.argv.find((a) => a.startsWith(`--${k}=`))?.slice(k.length + 3);
const only = opt('only')?.split(',');
const vpOverride = opt('viewports')?.split(',');
const all = await loadScenarios();
const names = Object.keys(all).filter((n) => !only || only.some((o) => n.includes(o)));
for (const name of names) {
  for (const vp of vpOverride ?? all[name].viewports) {
    const r = await runScenario(all[name], {
      base,
      viewport: vp,
      outDir: path.join(out, name, vp),
      video: process.argv.includes('--video') || all[name].video,
    });
    console.log(`${name} @${vp}: ${r.shots.length} shots, ${r.problems.length} problems${r.problems.length ? '\n   ' + r.problems.slice(0, 5).join('\n   ') : ''}`);
  }
}
await closeBrowser();
