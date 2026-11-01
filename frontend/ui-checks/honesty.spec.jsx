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
it('does not claim SHA verification for empty or unsigned logs',() => {
  const {rerender}=render(<AuditTrailView logs={[]} />);
  expect(screen.getByText(/No hay registros que verificar/)).toBeTruthy();
  expect(screen.queryByText(/Cadena Íntegra/i)).toBeNull();
  rerender(<AuditTrailView logs={[{id:'test',description:'Movimiento real',timestamp:new Date().toISOString()}]} />);
  expect(screen.getByText(/no se ha verificado/)).toBeTruthy();
  expect(screen.getByText(/Sin firma/)).toBeTruthy();
});
it('does not invent AI predictions or recipes without history',() => {
  render(<ProactiveHomeAdvisor products={[]} recipes={[{id:'example',name:'Receta de ejemplo',ingredients:[]}]} />);
  expect(screen.getByText(/Aún no hay predicciones/)).toBeTruthy();
  expect(screen.queryByText(/IA Activa|100% Automático|100% En Despensa/)).toBeNull();
});
