import React from 'react';
import { describe,it,expect,vi } from 'vitest';
import { render,screen,fireEvent,act } from '@testing-library/react';
import ConnectHouseGate from '../src/components/layout/ConnectHouseGate';

// 3.12.1: la puerta responde en su propio panel — estado al pulsar y
// error en el mismo sitio del toque, no en el bloque de conexión.
describe('Puerta de conexión a la casa', () => {
  it('shows its own opening state the moment it is tapped',() => {
    render(<ConnectHouseGate onUseLocalOnly={vi.fn()} />);
    fireEvent.click(screen.getByRole('button',{name:/Entrar con Google y conectar mi casa/}));
    expect(screen.getByRole('button',{name:/Abriendo el acceso de Google/}).disabled).toBe(true);
  });
  it('paints the sign-in error inside the gate panel',async () => {
    render(<ConnectHouseGate onUseLocalOnly={vi.fn()} />);
    fireEvent.click(screen.getByRole('button',{name:/Entrar con Google y conectar mi casa/}));
    await act(async () => { window.dispatchEvent(new CustomEvent('alacena-auth-error',{detail:'auth/timeout'})); });
    expect(screen.getByText(/Google no respondió/)).toBeTruthy();
    expect(screen.getByRole('button',{name:/Entrar con Google y conectar mi casa/}).disabled).toBe(false);
  });
  it('offers the Google window as plan B when the redirect came back empty',async () => {
    render(<ConnectHouseGate onUseLocalOnly={vi.fn()} />);
    fireEvent.click(screen.getByRole('button',{name:/Entrar con Google y conectar mi casa/}));
    await act(async () => { window.dispatchEvent(new CustomEvent('alacena-auth-error',{detail:'auth/redirect-returned-empty'})); });
    expect(screen.getByText(/volvió sin completar/)).toBeTruthy();
    expect(screen.getByRole('button',{name:/Entrar con la ventana de Google/})).toBeTruthy();
  });
});
