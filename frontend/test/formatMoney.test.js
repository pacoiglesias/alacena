import test from 'node:test';
import assert from 'node:assert/strict';
import {
  formatHouseMoney,
  houseCurrencyCode,
  houseCurrencySymbol,
} from '../src/utils/formatMoney.js';

// 3.14.0 (C-4): una sola función de moneda para toda la app; la moneda
// la manda la casa activa, nunca un «$ MXN» escrito en la vista.
const MX = { id: 'house-1', currency: 'MXN' };
const ES = { id: 'house-spain', currency: 'EUR' };

test('casa MXN formatea con $ y separadores es-MX', () => {
  assert.equal(formatHouseMoney(MX, 1234.5), '$1,234.50');
  assert.equal(formatHouseMoney(MX, 0), '$0.00');
});

test('casa EUR formatea en euros, sin símbolo de peso', () => {
  const out = formatHouseMoney(ES, 1234.5);
  assert.ok(out.includes('€'));
  assert.ok(!out.includes('$'));
  // Parte decimal es-ES con coma (la agrupación de miles la pone el
  // Intl del navegador; el ICU reducido de Node puede omitirla).
  assert.ok(out.includes('234,50'));
});

test('sin casa o sin moneda se cae a MXN, el histórico de la app', () => {
  assert.equal(houseCurrencyCode(null), 'MXN');
  assert.equal(houseCurrencyCode({}), 'MXN');
  assert.equal(formatHouseMoney(null, 10), '$10.00');
});

test('símbolo por casa', () => {
  assert.equal(houseCurrencySymbol(MX), '$');
  assert.equal(houseCurrencySymbol(ES), '€');
});

test('valores no numéricos cuentan como 0, nunca NaN en pantalla', () => {
  assert.equal(formatHouseMoney(MX, undefined), '$0.00');
  assert.equal(formatHouseMoney(MX, 'abc'), '$0.00');
});
