import React from 'react';
import {it,expect,vi} from 'vitest';
import {render,screen,fireEvent,waitFor} from '@testing-library/react';
import RestoreBackupModal from '../src/components/layout/RestoreBackupModal';
import ReceiptReconciliationModal from '../src/components/shopping/ReceiptReconciliationModal';
import Header from '../src/components/layout/Header';
import fixture from '../review/fixtures/backup-review.json';
const current={...fixture,products:[{...fixture.products[0],quantity:9}]};
const fileOf=(data)=>({size:100,text:async()=>JSON.stringify(data)});
it('restore is a dry-run until the user chooses mode and confirms',async()=>{
  const apply=vi.fn().mockResolvedValue(true);
  render(<RestoreBackupModal current={current} onApply={apply} onClose={vi.fn()} />);
  fireEvent.change(screen.getByLabelText('Seleccionar respaldo JSON'),{target:{files:[fileOf(fixture)]}});
  await screen.findByText('Vista previa, sin cambios');
  expect(apply).not.toHaveBeenCalled();
  expect(screen.getByRole('button',{name:'Crear respaldo previo y restaurar'}).disabled).toBe(true);
  fireEvent.click(screen.getByRole('radio',{name:'Reemplazar productos, lista, zonas, casas y recetas'}));
  fireEvent.click(screen.getByRole('checkbox',{name:'Revisé la vista previa y elegí reemplazar.'}));
  fireEvent.click(screen.getByRole('button',{name:'Crear respaldo previo y restaurar'}));
  await waitFor(()=>expect(apply).toHaveBeenCalledOnce());
  expect(apply.mock.calls[0][0].next.products[0].quantity).toBe(2);
  expect(current.products[0].quantity).toBe(9);
});
it('a corrupt or future backup cannot reach the apply callback',async()=>{
  const apply=vi.fn();render(<RestoreBackupModal current={current} onApply={apply} onClose={vi.fn()} />);
  fireEvent.change(screen.getByLabelText('Seleccionar respaldo JSON'),{target:{files:[fileOf({...fixture,version:'4.0.0'})]}});
  await screen.findByRole('alert');
  expect(apply).not.toHaveBeenCalled();expect(screen.getByRole('button',{name:'Crear respaldo previo y restaurar'}).disabled).toBe(true);
});
it('a failed restore keeps the preview open with an error',async()=>{
  const close=vi.fn();render(<RestoreBackupModal current={current} onApply={()=>Promise.reject(Error('Conflicto de prueba'))} onClose={close} />);
  fireEvent.change(screen.getByLabelText('Seleccionar respaldo JSON'),{target:{files:[fileOf(fixture)]}});
  await screen.findByText('Vista previa, sin cambios');
  fireEvent.click(screen.getByRole('checkbox',{name:'Revisé la vista previa y elegí combinar.'}));
  fireEvent.click(screen.getByRole('button',{name:'Crear respaldo previo y restaurar'}));
  expect(await screen.findByRole('alert')).toHaveProperty('textContent','Conflicto de prueba');expect(close).not.toHaveBeenCalled();
});
it('purchase rejects failure visibly and prevents duplicate submission while waiting',async()=>{
  let finish;const save=vi.fn(()=>new Promise((resolve)=>{finish=resolve;})),close=vi.fn();
  render(<ReceiptReconciliationModal isOpen checkedItems={[{id:'p',name:'Prueba',quantity:1,unit:'kg',estimatedPriceMxn:25}]} onConfirmPurchase={save} onClose={close}/>);
  const button=screen.getByRole('button',{name:'Confirmar e Ingresar a Despensa'});
  fireEvent.click(button);fireEvent.click(button);expect(save).toHaveBeenCalledOnce();
  expect(screen.getByRole('button',{name:'Registrando compra…'}).disabled).toBe(true);
  finish(false);await screen.findByRole('alert');expect(close).not.toHaveBeenCalled();
});
it('purchase cancellation does not call the save callback',()=>{
  const save=vi.fn(),close=vi.fn();render(<ReceiptReconciliationModal isOpen checkedItems={[{id:'p',name:'Prueba',quantity:1,unit:'kg'}]} onConfirmPurchase={save} onClose={close}/>);
  fireEvent.click(screen.getByRole('button',{name:'Cancelar'}));expect(save).not.toHaveBeenCalled();expect(close).toHaveBeenCalledOnce();
});
it('profile menu closes on Escape and outside click, restoring the trigger focus',()=>{
  render(<Header activeTab="shopping" setActiveTab={vi.fn()} activeHouse={{name:'Casa'}} />);
  const trigger=screen.getByTitle('Cambiar Rol de Operación en el Hogar');
  fireEvent.click(trigger);expect(trigger.getAttribute('aria-expanded')).toBe('true');
  fireEvent.keyDown(document,{key:'Escape'});expect(trigger.getAttribute('aria-expanded')).toBe('false');expect(document.activeElement).toBe(trigger);
  fireEvent.click(trigger);fireEvent.pointerDown(document.body);expect(trigger.getAttribute('aria-expanded')).toBe('false');
});
it('only the selected navigation tab receives aria-current',()=>{
  const navigate=vi.fn();const props={activeTab:'inventory',onNavigate:navigate,setActiveTab:vi.fn(),activeHouse:{name:'Casa'}};
  const {container,rerender}=render(<Header {...props} activeNavId="cava" />);
  expect(container.querySelectorAll('[aria-current="page"]')).toHaveLength(1);
  expect(screen.getByRole('button',{name:'CavaPro Vinos'}).getAttribute('aria-current')).toBe('page');
  fireEvent.click(screen.getByRole('button',{name:'Alacena & QR'}));expect(navigate.mock.calls[0][0].id).toBe('inventory');
  rerender(<Header {...props} activeNavId="inventory"/>);expect(container.querySelectorAll('[aria-current="page"]')).toHaveLength(1);
});
