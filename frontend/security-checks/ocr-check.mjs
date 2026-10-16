import assert from 'node:assert/strict';
import { createWorker } from 'tesseract.js';
import { parseRawShoppingText } from '../src/services/smartListParser.js';
import { parseReceiptTotal } from '../src/utils/receiptReview.js';
const worker = await createWorker('spa', 1, { langPath: 'node_modules/@tesseract.js-data/spa/4.0.0_best_int', cacheMethod: 'none' });
try {
  const { data } = await worker.recognize('test/fixtures/ticket-review.png');
  const items = parseRawShoppingText(data.text);
  const beans = items.find((i) => /alubias/i.test(i.name));
  assert.ok(beans, 'OCR must identify the actual product from the image');
  assert.equal(beans.quantity, 2);
  assert.equal(beans.realPrice, 95);
  assert.equal(parseReceiptTotal(data.text), 220);
  console.log(JSON.stringify({ ocr: 'passed', confidence: data.confidence, items: items.length, checkedTotal: 220, languageModel: 'local Spanish file, no download' }));
} finally { await worker.terminate(); }
