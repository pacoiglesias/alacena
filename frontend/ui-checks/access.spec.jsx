import React from 'react';
import { describe,it,expect,vi } from 'vitest';
import { render,screen,fireEvent,waitFor } from '@testing-library/react';
import CloudStatus from '../src/components/layout/CloudStatus';
import ConnectHouseGate from '../src/components/layout/ConnectHouseGate';
import { mountGoogleSignInButton } from '../src/services/cloudGateway';
vi.mock('../src/services/cloudGateway', () => ({getCloudUser:() => null,mountGoogleSignInButton:vi.fn(),signInWithGoogleIdToken:vi.fn(),disconnectGoogle:vi.fn(),connectReviewUser:vi.fn()}));
describe('Acceso con Google (GIS, 3.13.0)', () => {
  it('mounts the official Google button without errors when GIS loads',async () => {
    mountGoogleSignInButton.mockResolvedValue(undefined);
    render(<CloudStatus state="local" isOnline />);
    await waitFor(() => expect(mountGoogleSignInButton).toHaveBeenCalled());
    expect(screen.queryByRole('alert')).toBeNull();
  });
  it('shows the truth inside the panel and can retry when the GIS script fails to load',async () => {
    mountGoogleSignInButton.mockRejectedValueOnce({code:'auth/gis-load-failed'});
    mountGoogleSignInButton.mockResolvedValue(undefined);
    render(<CloudStatus state="local" isOnline />);
    const alert = await screen.findByRole('alert');
    expect(alert.textContent).toMatch(/No se pudo cargar el botón de Google/);
    fireEvent.click(screen.getByRole('button',{name:'Reintentar'}));
    await waitFor(() => expect(screen.queryByRole('alert')).toBeNull());
    expect(mountGoogleSignInButton).toHaveBeenCalledTimes(2);
  });
  it('the house gate mounts the Google button and keeps the explicit local-only choice',async () => {
    mountGoogleSignInButton.mockResolvedValue(undefined);
    const localOnly = vi.fn();
    render(<ConnectHouseGate onUseLocalOnly={localOnly} />);
    expect(screen.getByText(/Tu casa aún no está conectada en este dispositivo/)).toBeTruthy();
    await waitFor(() => expect(mountGoogleSignInButton).toHaveBeenCalled());
    fireEvent.click(screen.getByRole('button',{name:/Usar solo en este dispositivo/}));
    expect(localOnly).toHaveBeenCalledOnce();
  });
  it('shows local-data risk and backup without blocking use',() => {
    mountGoogleSignInButton.mockResolvedValue(undefined);
    const download=vi.fn();render(<CloudStatus state="local" isOnline hasLocalData onDownloadBackup={download} />);
    expect(screen.getByText(/puedes perder esta copia/)).toBeTruthy();
    fireEvent.click(screen.getByRole('button',{name:'Descargar respaldo (JSON)'}));expect(download).toHaveBeenCalledOnce();
    fireEvent.click(screen.getByRole('button',{name:'Entendido'}));
    expect(screen.getByRole('button',{name:'Descargar respaldo (JSON)'})).toBeTruthy();
  });
});
