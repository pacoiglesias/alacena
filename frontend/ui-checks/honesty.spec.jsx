import React from 'react';
import {it,expect} from 'vitest';
import {render,screen} from '@testing-library/react';
import AuditTrailView from '../src/components/audit/AuditTrailView';
import ProactiveHomeAdvisor from '../src/components/assistant/ProactiveHomeAdvisor';
import InventoryView from '../src/components/inventory/InventoryView';
it('opens inventory with legacy products that have no category',()=>{
  render(<InventoryView products={[{id:'legacy',name:'Producto antiguo',quantity:1,unit:'piezas',householdId:'house-1'}]} zones={[]} activeHouse={{id:'house-1',currency:'MXN'}} />);
  expect(screen.getByText('Producto antiguo')).toBeTruthy();
});
it('bitácora sin tecnicismos: ni códigos crudos, ni hash, ni delta JSON (3.14.0)',() => {
  const {rerender}=render(<AuditTrailView logs={[]} />);
  expect(screen.getByText(/Sin movimientos todavía/)).toBeTruthy();
  expect(screen.queryByText(/Cadena Íntegra/i)).toBeNull();
  rerender(<AuditTrailView logs={[{id:'test',action:'BAJA_ARTICULO',description:'Movimiento real',timestamp:new Date().toISOString()}]} />);
  // La acción se lee en humano y el código crudo no aparece.
  expect(screen.getByText('Baja de artículo')).toBeTruthy();
  expect(screen.queryByText('BAJA_ARTICULO')).toBeNull();
  // Sin chip de hash, sin «Sin firma», sin delta JSON y sin prometer firmado.
  expect(screen.queryByText(/Sin firma/)).toBeNull();
  expect(screen.queryByText(/Ver delta JSON/)).toBeNull();
  expect(screen.queryByText(/criptográfica/)).toBeNull();
  expect(screen.queryByText(/Exportar PDF/)).toBeNull();
  expect(screen.getByText(/1 movimiento registrado/)).toBeTruthy();
});
it('does not invent AI predictions or recipes without history',() => {
  render(<ProactiveHomeAdvisor products={[]} recipes={[{id:'example',name:'Receta de ejemplo',ingredients:[]}]} />);
  expect(screen.getByText(/Aún no hay predicciones/)).toBeTruthy();
  expect(screen.queryByText(/IA Activa|100% Automático|100% En Despensa/)).toBeNull();
});
