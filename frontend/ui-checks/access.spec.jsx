import React from 'react';
import { describe,it,expect,vi } from 'vitest';
import { render,screen,fireEvent,act } from '@testing-library/react';
import CloudStatus from '../src/components/layout/CloudStatus';
import { connectGoogle } from '../src/services/cloudGateway';
vi.mock('../src/services/cloudGateway', () => ({getCloudUser:() => null,connectGoogle:vi.fn(),disconnectGoogle:vi.fn()}));
describe('Acceso con Google', () => {
  it('offers retry after a closed popup',async () => {
    connectGoogle.mockRejectedValueOnce({code:'auth/popup-closed-by-user'});
    render(<CloudStatus state="local" isOnline />);
    fireEvent.click(screen.getByRole('button',{name:'Conectar mi casa'}));
    await screen.findByText(/Cerraste la ventana/);
    expect(screen.getByRole('button',{name:'Reintentar conexión'}).disabled).toBe(false);
  });
  it('recovers after 60 seconds even if Google never resolves',async () => {
    vi.useFakeTimers(); connectGoogle.mockImplementationOnce(() => new Promise(() => {}));
    render(<CloudStatus state="local" isOnline />);
    fireEvent.click(screen.getByRole('button',{name:'Conectar mi casa'}));
    await act(async () => {await vi.advanceTimersByTimeAsync(60001);});
    expect(screen.getByText(/Google no respondió/)).toBeTruthy();
    expect(screen.getByRole('button',{name:'Reintentar conexión'}).disabled).toBe(false);
    expect(screen.getByRole('button',{name:'Acceder en esta pestaña'})).toBeTruthy();
  });
  it('shows local-data risk and backup without blocking use',() => {
    const download=vi.fn();render(<CloudStatus state="local" isOnline hasLocalData onDownloadBackup={download} />);
    expect(screen.getByText(/puedes perder esta copia/)).toBeTruthy();
    fireEvent.click(screen.getByRole('button',{name:'Descargar respaldo (JSON)'}));expect(download).toHaveBeenCalledOnce();
    fireEvent.click(screen.getByRole('button',{name:'Entendido'}));
    expect(screen.getByRole('button',{name:'Descargar respaldo (JSON)'})).toBeTruthy();
  });
});
