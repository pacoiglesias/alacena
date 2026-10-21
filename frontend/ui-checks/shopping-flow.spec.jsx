import React, { useState } from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, within, waitFor } from '@testing-library/react';
import ShoppingListView from '../src/components/shopping/ShoppingListView';
import ReceiptReconciliationModal from '../src/components/shopping/ReceiptReconciliationModal';

const article = { id: 'rice', name: 'Arroz de prueba', quantity: 1.245, unit: 'kg', estimatedPriceMxn: 40, checked: true, householdId: 'house-1' };
const confirmName = 'Confirmar e Ingresar a Despensa';
function Shopping({ save = () => true }) {
  const [list, setList] = useState([article, { ...article, id: 'milk', name: 'Leche pendiente', quantity: 1, checked: false }]);
  return <ShoppingListView shoppingList={list} products={[]} zones={[]} activeHouse={{ id: 'house-1', currency: 'EUR' }}
    onToggleItem={(id) => setList((rows) => rows.map((r) => r.id === id ? { ...r, checked: !r.checked } : r))}
    onCompletePurchaseToPantry={save} onRemoveItem={vi.fn()} onAddItem={vi.fn()} onUpdateItemQuantity={vi.fn()} />;
}
async function openWalkingPurchase(save) {
  const result = render(<Shopping save={save} />);
  fireEvent.click(screen.getAllByRole('button', { name: /^👟\s*Modo Súper$/ })[0]);
  fireEvent.click(within(screen.getByRole('dialog', { name: 'Modo Súper' })).getByRole('button', { name: 'Guardar (1)' }));
  const dialog = await screen.findByRole('dialog', { name: 'Guardar mi compra' });
  return { ...result, dialog };
}

describe('Modo Súper: guardar y cancelar', () => {
  it('opens confirmation outside the immersive screen; cancel preserves the cart and returns focus', async () => {
    const { dialog, container } = await openWalkingPurchase();
    expect(dialog.parentElement).toBe(document.body);
    expect(container.contains(dialog)).toBe(false);
    expect(screen.queryByRole('dialog', { name: 'Modo Súper' })).toBeNull();
    expect(document.activeElement).toBe(within(dialog).getByRole('spinbutton', { name: 'Total pagado' }));
    fireEvent.click(within(dialog).getByRole('button', { name: 'Cancelar' }));
    const walking = screen.getByRole('dialog', { name: 'Modo Súper' });
    expect(within(walking).getByRole('checkbox', { name: 'En carrito: Arroz de prueba' }).getAttribute('aria-checked')).toBe('true');
    expect(screen.queryByRole('dialog', { name: 'Guardar mi compra' })).toBeNull();
  });
  it('submits only selected items, keeps three decimals, actual total, buyer and notes', async () => {
    const save = vi.fn(() => true);
    const { dialog } = await openWalkingPurchase(save);
    fireEvent.change(within(dialog).getByRole('spinbutton', { name: 'Total pagado' }), { target: { value: '49.80' } });
    fireEvent.change(within(dialog).getByLabelText('Notas de la compra'), { target: { value: 'Folio prueba' } });
    fireEvent.click(within(dialog).getByRole('button', { name: confirmName }));
    await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Guardar mi compra' })).toBeNull());
    expect(save).toHaveBeenCalledTimes(1);
    const payload = save.mock.calls[0][0];
    expect(payload.checkedItems).toHaveLength(1);
    expect(payload.checkedItems[0].quantity).toBe(1.245);
    expect(payload.realTotalMxn).toBe(49.8);
    expect(payload.ticketNotes).toBe('Folio prueba');
    expect(payload.buyerName).toBeTruthy();
  });
  it('shows rejection without hiding the confirmation or losing selection', async () => {
    const { dialog } = await openWalkingPurchase(() => false);
    fireEvent.click(within(dialog).getByRole('button', { name: confirmName }));
    expect(await screen.findByRole('alert')).toHaveProperty('textContent', expect.stringContaining('selección se conserva'));
    expect(screen.getByRole('dialog', { name: 'Guardar mi compra' })).toBe(dialog);
  });
  it('More tools closes with Escape and outside click', () => {
    render(<Shopping />);
    const toggle = screen.getByRole('button', { name: 'Más herramientas y opciones' });
    fireEvent.click(toggle);
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    fireEvent.click(toggle);
    fireEvent.pointerDown(document.body);
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
  });
  it.each([
    ['⚖️ Comparador Multitienda & Ahorro', /Inteligencia de Precios & Asesor Multitienda/],
    ['Canasta Básica Semanal', /Canasta Básica Semanal del Hogar/],
    ['Imprimir Lista en PDF', /Hoja de Compras Oficial & PDF/],
    ['Importar Texto / WhatsApp', /Importador Bidireccional Inteligente & OCR/],
    ['¿Qué Falta en Casa? (Personal)', /¿Qué falta en casa\? \(Apuntar al Súper\)/],
    ['Librito QR de Cocina', /Centro de Impresión QR/],
    ['Ticket QR Digital', /Ticket QR de Orden para el Súper/],
  ])('opens and closes the menu tool: %s', async (name, heading) => {
    render(<Shopping />);
    const toggle = screen.getByRole('button', { name: 'Más herramientas y opciones' });
    fireEvent.click(toggle);
    fireEvent.click(screen.getByRole('button', { name, exact: true }));
    await screen.findByRole('heading', { name: heading });
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    fireEvent.click(screen.getByRole('button', { name: 'Cerrar herramienta' }));
    expect(screen.queryByRole('heading', { name: heading })).toBeNull();
  });
});

describe('Confirmación de compra', () => {
  it('blocks invalid totals and a second submission while saving', async () => {
    let finish;
    const save = vi.fn(() => new Promise((resolve) => { finish = resolve; }));
    const close = vi.fn();
    render(<ReceiptReconciliationModal isOpen checkedItems={[article]} onConfirmPurchase={save} onClose={close} />);
    const total = screen.getByRole('spinbutton', { name: 'Total pagado' });
    fireEvent.change(total, { target: { value: '-1' } });
    expect(screen.getByRole('button', { name: confirmName }).disabled).toBe(true);
    fireEvent.change(total, { target: { value: '0' } });
    const button = screen.getByRole('button', { name: confirmName });
    fireEvent.click(button); fireEvent.click(button);
    expect(save).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('button', { name: 'Registrando compra…' }).disabled).toBe(true);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(close).not.toHaveBeenCalled();
    finish(true);
    await waitFor(() => expect(close).toHaveBeenCalledTimes(1));
  });
  it('keeps an exception visible and allows retry', async () => {
    const save = vi.fn().mockRejectedValueOnce(new Error('fallo de prueba')).mockResolvedValueOnce(true);
    const close = vi.fn();
    render(<ReceiptReconciliationModal isOpen checkedItems={[article]} onConfirmPurchase={save} onClose={close} />);
    fireEvent.click(screen.getByRole('button', { name: confirmName }));
    await screen.findByRole('alert');
    expect(close).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: confirmName }));
    await waitFor(() => expect(close).toHaveBeenCalledTimes(1));
  });
});
