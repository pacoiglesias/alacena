import React from 'react';
import { it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import InventoryView from '../src/components/inventory/InventoryView';
import RecipesView from '../src/components/recipes/RecipesView';
import BottomNavBar from '../src/components/layout/BottomNavBar';

// 3.14.0: la despensa no inventa datos y la tarjeta corrige la
// cantidad sin abrir la ficha (C-3 y C-7).
it('vino sin puntuar: ni 92 puntos ni capacidad inventada', () => {
  render(
    <InventoryView
      products={[
        { id: 'w1', name: 'Vino Sin Nota', category: 'Vinos & Licores', isWine: true, quantity: 2, unit: 'botellas', householdId: 'house-1' },
        { id: 'p1', name: 'Arroz suelto', category: 'Abarrotes', quantity: 1, unit: 'kg', householdId: 'house-1' },
      ]}
      zones={[]}
      activeHouse={{ id: 'house-1', currency: 'MXN' }}
      onUpdateQuantity={() => {}}
      onEditProduct={() => {}}
    />
  );
  expect(screen.getByText('Sin puntuar')).toBeTruthy();
  expect(screen.queryByText('92')).toBeNull();
  expect(screen.getByText('Sin referencia de stock')).toBeTruthy();
  // La cantidad de la tarjeta estándar se toca para editarla (C-7).
  expect(screen.getByTitle('Tocar para escribir la cantidad')).toBeTruthy();
});

// 3.14.0 (C-11): el recetario busca por nombre e ingrediente.
it('buscador de recetas por ingrediente', () => {
  render(
    <RecipesView
      recipes={[
        { id: 'r1', name: 'Sopa de ajo', portions: 4, ingredients: [{ productName: 'Ajo', amount: 1, unit: 'piezas' }] },
        { id: 'r2', name: 'Paella valenciana', portions: 4, ingredients: [{ productName: 'Arroz bomba', amount: 1, unit: 'kg' }] },
      ]}
      products={[]}
      staffList={[]}
      householdId="house-1"
      activeHouse={{ id: 'house-1', currency: 'MXN' }}
    />
  );
  expect(screen.getByText('Sopa de ajo')).toBeTruthy();
  expect(screen.getByText('Paella valenciana')).toBeTruthy();
  fireEvent.change(screen.getByLabelText('Buscar recetas'), { target: { value: 'arroz' } });
  expect(screen.queryByText('Sopa de ajo')).toBeNull();
  expect(screen.getByText('Paella valenciana')).toBeTruthy();
});

// 3.14.0 (B-2): la barra móvil usa las etiquetas del escritorio y
// la Bitácora por fin se alcanza desde ella (fuera el «Más»).
it('barra móvil = pestañas de escritorio, Bitácora incluida', () => {
  const onNavigate = vi.fn();
  render(
    <BottomNavBar
      activeTab="shopping"
      setActiveTab={() => {}}
      shoppingCount={3}
      onOpenScanner={() => {}}
      onNavigate={onNavigate}
    />
  );
  for (const label of ['Lista del Súper', 'CavaPro Vinos', 'Cocina & Recetas', 'Bitácora', 'Alacena & QR', 'Escanear']) {
    expect(screen.getByText(label)).toBeTruthy();
  }
  expect(screen.queryByText('Más')).toBeNull();
  fireEvent.click(screen.getByText('Bitácora'));
  expect(onNavigate).toHaveBeenCalledOnce();
  expect(onNavigate.mock.calls[0][0].id).toBe('audit');
});
