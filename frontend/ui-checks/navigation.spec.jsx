import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Header from '../src/components/layout/Header';
import InventoryView from '../src/components/inventory/InventoryView';

const house = { id: 'house-1', name: 'Casa de prueba', currency: 'MXN' };
const headerProps = { activeTab: 'shopping', setActiveTab: vi.fn(), activeHouse: house, onOpenScanner: vi.fn(), onOpenHouseModal: vi.fn() };
describe('Navegación y ajustes', () => {
  it('closes settings with Escape, outside click, and switching to the role menu', () => {
    render(<Header {...headerProps} />);
    const settings = screen.getByRole('button', { name: 'Menú de Ajustes, Hogar y Herramientas' });
    fireEvent.click(settings);
    expect(settings.getAttribute('aria-expanded')).toBe('true');
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(settings.getAttribute('aria-expanded')).toBe('false');
    fireEvent.click(settings);
    fireEvent.pointerDown(document.body);
    expect(settings.getAttribute('aria-expanded')).toBe('false');
    fireEvent.click(settings);
    fireEvent.click(screen.getByTitle('Cambiar Rol de Operación en el Hogar'));
    expect(settings.getAttribute('aria-expanded')).toBe('false');
  });
  it.each([
    ['Manual e Instructivo', /Manual Operativo & Guía del Sistema/],
    ['Tema Visual y Color', /Personalización de Color & Tema del Sistema/],
    ['Resumen Diario & Caducidades', /Resumen Diario de Cocina & Hogar/],
  ])('opens %s outside the sticky header and closes it', async (name, heading) => {
    const { container } = render(<Header {...headerProps} />);
    fireEvent.click(screen.getByRole('button', { name: 'Menú de Ajustes, Hogar y Herramientas' }));
    fireEvent.click(screen.getByRole('button', { name: new RegExp(name) }));
    const title = await screen.findByRole('heading', { name: heading });
    expect(container.querySelector('header').contains(title)).toBe(false);
    fireEvent.click(screen.getByRole('button', { name: 'Cerrar ajustes' }));
    expect(screen.queryByRole('heading', { name: heading })).toBeNull();
  });
  it('routes the wine and custom zone tabs to their corresponding filters', () => {
    localStorage.setItem('alacena_menu_tabs_v2', JSON.stringify([
      { id: 'cava', key: 'cava', label: 'Cava de prueba', icon: 'Wine', enabled: true, isSystem: true },
      { id: 'cold', key: 'cold', label: 'Refrigerador de prueba', icon: 'Layers', enabled: true, targetZone: 'Refrigerador' },
    ]));
    const wine = vi.fn(), zone = vi.fn();
    render(<Header {...headerProps} onFilterWines={wine} onSelectZoneFilter={zone} />);
    fireEvent.click(screen.getByRole('button', { name: 'Cava de prueba' }));
    fireEvent.click(screen.getByRole('button', { name: 'Refrigerador de prueba' }));
    expect(wine).toHaveBeenCalledTimes(1);
    expect(zone).toHaveBeenCalledWith('Refrigerador');
  });
  it.each([{ initialCategory: 'Vinos & Licores' }, { initialZone: 'Cava' }])('applies the requested inventory filter on opening: %o', (filter) => {
    const products = [
      { id: 'wine', name: 'Vino de prueba', category: 'Vinos & Licores', zone: 'Cava', isWine: true, quantity: 4, minStock: 0, unit: 'botellas', householdId: 'house-1' },
      { id: 'food', name: 'Arroz de prueba', category: 'Abarrotes', zone: 'Alacena', quantity: 5, minStock: 0, unit: 'kg', householdId: 'house-1' },
    ];
    render(<InventoryView {...filter} products={products} zones={[]} activeHouse={house} />);
    expect(screen.getByRole('heading', { level: 3, name: 'Vino de prueba' })).toBeTruthy();
    expect(screen.queryByRole('heading', { level: 3, name: 'Arroz de prueba' })).toBeNull();
  });
});
