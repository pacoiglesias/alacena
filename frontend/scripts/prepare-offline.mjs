import { mkdir, copyFile } from 'node:fs/promises';
await mkdir('public/ocr', { recursive: true });
await copyFile('node_modules/tesseract.js/dist/worker.min.js', 'public/ocr/worker.min.js');
for (const variant of ['lstm', 'simd-lstm', 'relaxedsimd-lstm']) {
  for (const extension of ['wasm', 'wasm.js']) {
    const name = `tesseract-core-${variant}.${extension}`;
    await copyFile(`node_modules/tesseract.js-core/${name}`, `public/ocr/${name}`);
  }
}
await copyFile('node_modules/@tesseract.js-data/spa/4.0.0_best_int/spa.traineddata.gz', 'public/ocr/spa.traineddata.gz');
