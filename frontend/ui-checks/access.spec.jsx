import React from 'react';
import { describe,it,expect,vi } from 'vitest';
import { render,screen,fireEvent,act } from '@testing-library/react';
import CloudStatus from '../src/components/layout/CloudStatus';
import { connectGoogle } from '../src/services/cloudGateway';
vi.mock('../src/services/cloudGateway', () => ({getCloudUser:() => null,connectGoogle:vi.fn(),disconnectGoogle:vi.fn()}));
describe('Acceso con Google', () => {
  it('falls back to the Google page when the popup is closed (3.12.1)',async () => {
    connectGoogle.mockReset();
    connectGoogle.mockRejectedValueOnce({code:'auth/popup-closed-by-user'}).mockResolvedValue(undefined);
    render(<CloudStatus state="local" isOnline />);
    fireEvent.click(screen.getByRole('button',{name:'Conectar mi casa'}));
    await screen.findByText(/Te llevo a la página de Google/);
    expect(connectGoogle).toHaveBeenCalledTimes(2);
    expect(connectGoogle).toHaveBeenNthCalledWith(2,true);
  });
  it('falls back to the Google page after 60 seconds even if Google never resolves (3.12.1)',async () => {
    vi.useFakeTimers();
    connectGoogle.mockReset();
    connectGoogle.mockImplementationOnce(() => new Promise(() => {})).mockResolvedValue(undefined);
    render(<CloudStatus state="local" isOnline />);
    fireEvent.click(screen.getByRole('button',{name:'Conectar mi casa'}));
    await act(async () => {await vi.advanceTimersByTimeAsync(60001);});
    expect(connectGoogle).toHaveBeenCalledTimes(2);
    expect(connectGoogle).toHaveBeenNthCalledWith(2,true);
    expect(screen.getByText(/Te llevo a la página de Google/)).toBeTruthy();
    expect(screen.getByRole('button',{name:'Conectar mi casa'}).disabled).toBe(false);
    vi.useRealTimers();
  });
  it('shows local-data risk and backup without blocking use',() => {
    const download=vi.fn();render(<CloudStatus state="local" isOnline hasLocalData onDownloadBackup={download} />);
    expect(screen.getByText(/puedes perder esta copia/)).toBeTruthy();
    fireEvent.click(screen.getByRole('button',{name:'Descargar respaldo (JSON)'}));expect(download).toHaveBeenCalledOnce();
    fireEvent.click(screen.getByRole('button',{name:'Entendido'}));
    expect(screen.getByRole('button',{name:'Descargar respaldo (JSON)'})).toBeTruthy();
  });
});
