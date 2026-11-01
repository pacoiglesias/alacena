import { readFile, writeFile } from 'node:fs/promises';
import { gzipSync } from 'node:zlib';
const dir = process.argv[2] || 'dist', label = process.argv[3] || 'after';
const html = await readFile(`${dir}/index.html`, 'utf8');
const paths = [...new Set([...html.matchAll(/(?:src|href)="(\/assets\/[^"?]+\.js)"/g)].map((m) => m[1]))];
const js = await Promise.all(paths.map((p) => readFile(dir + p)));
const metrics = { label, files: paths, initialJsBytes: js.reduce((sum, b) => sum + b.length, 0), initialJsGzipBytes: js.reduce((sum, b) => sum + gzipSync(b).length, 0) };
await writeFile(`review/metrics-${label}.json`, JSON.stringify(metrics, null, 2));
// Only the benchmark copy is instrumented; observe a painted, interactive quick-add field.
if (label === 'baseline') await writeFile(`${dir}/index.html`, html.replace('</body>', `<script>let n=0;function ready(){if(document.querySelector('input[aria-label="Qué hace falta en casa"]')){requestAnimationFrame(()=>document.documentElement.dataset.usableMs=Math.round(performance.now()))}else if(n++<900)requestAnimationFrame(ready)}requestAnimationFrame(ready)</script></body>`));
console.log(metrics);
