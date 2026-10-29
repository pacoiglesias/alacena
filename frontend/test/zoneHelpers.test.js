import test from 'node:test';
import assert from 'node:assert/strict';
import { firstLivingZoneName, reassignProductsFromDeletedZone } from '../src/utils/zoneHelpers.js';

const zones = [
  { id: 'z1', name: 'Alacena Principal' },
  { id: 'z2', name: 'Refrigerador' },
  { id: 'z3', name: 'Cava Don Paco' },
];

test('borrar una zona deja viva la primera restante como destino', () => {
  assert.equal(firstLivingZoneName(zones, 'z2'), 'Alacena Principal');
  assert.equal(firstLivingZoneName(zones, 'z1'), 'Refrigerador');
  assert.equal(firstLivingZoneName([], 'z1'), 'Alacena Principal');
  assert.equal(firstLivingZoneName([{ id: 'z9', name: 'Solo esta' }], 'z9'), 'Alacena Principal');
});

test('los productos de la zona borrada se reasignan y los demás no se tocan', () => {
  const products = [
    { id: 'p1', name: 'Arroz', zone: 'Refrigerador' },
    { id: 'p2', name: 'Vino', zone: 'Cava Don Paco' },
    { id: 'p3', name: 'Leche', zone: 'Refrigerador' },
  ];
  const out = reassignProductsFromDeletedZone(products, 'Refrigerador', 'Alacena Principal');
  assert.equal(out.find((p) => p.id === 'p1').zone, 'Alacena Principal');
  assert.equal(out.find((p) => p.id === 'p3').zone, 'Alacena Principal');
  assert.equal(out.find((p) => p.id === 'p2').zone, 'Cava Don Paco');
  // Sin mutar el arreglo original.
  assert.equal(products.find((p) => p.id === 'p1').zone, 'Refrigerador');
});

test('ningún producto queda con el nombre de la zona muerta', () => {
  const products = [{ id: 'p1', name: 'Queso', zone: 'Cuarto Frío' }];
  const out = reassignProductsFromDeletedZone(products, 'Cuarto Frío', 'Refrigerador');
  assert.ok(out.every((p) => p.zone !== 'Cuarto Frío'));
});
