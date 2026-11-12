import { describe,it,expect,vi,afterEach } from 'vitest';
import { waitFor } from '@testing-library/react';
import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import { auth } from '../src/services/firebase';

vi.mock('firebase/auth', () => ({
  onAuthStateChanged: vi.fn(() => () => {}),
  getIdTokenResult: vi.fn(),
  GoogleAuthProvider: { credential: vi.fn((idToken) => ({ providerId: 'google.com', idToken })) },
  signInWithCredential: vi.fn(async () => ({ user: { uid: 'uid-de-prueba' } })),
  signOut: vi.fn(),
  signInWithEmailAndPassword: vi.fn(),
}));
vi.mock('../src/services/firebase', () => ({
  auth: { app: { options: { projectId: 'alacena-enterprise-prod' } } },
  REVIEW_MODE: false,
  GOOGLE_WEB_CLIENT_ID: '563016091019-2mv9qfe5nugggt64u383cunlc27tf4nr.apps.googleusercontent.com',
}));

import { signInWithGoogleIdToken, mountGoogleSignInButton } from '../src/services/cloudSession';

afterEach(() => { delete window.google; vi.clearAllMocks(); });

describe('Adaptador de credencial GIS → Firebase (3.13.0)', () => {
  it('canjea el id_token con GoogleAuthProvider.credential + signInWithCredential', async () => {
    await signInWithGoogleIdToken('ID_TOKEN_DE_PRUEBA');
    expect(GoogleAuthProvider.credential).toHaveBeenCalledWith('ID_TOKEN_DE_PRUEBA');
    expect(signInWithCredential).toHaveBeenCalledWith(auth, { providerId: 'google.com', idToken: 'ID_TOKEN_DE_PRUEBA' });
  });

  it('monta el botón: inicializa GIS con el ID de cliente y la credencial del callback entra en Firebase', async () => {
    const initialize = vi.fn();
    const renderButton = vi.fn();
    window.google = { accounts: { id: { initialize, renderButton } } };
    const element = document.createElement('div');
    await mountGoogleSignInButton(element);
    expect(initialize).toHaveBeenCalledWith(expect.objectContaining({
      client_id: '563016091019-2mv9qfe5nugggt64u383cunlc27tf4nr.apps.googleusercontent.com',
    }));
    expect(renderButton).toHaveBeenCalledWith(element, expect.objectContaining({ size: 'large' }));
    const { callback } = initialize.mock.calls[0][0];
    callback({ credential: 'TOKEN_DEL_CALLBACK' });
    await waitFor(() => expect(signInWithCredential).toHaveBeenCalledWith(auth, { providerId: 'google.com', idToken: 'TOKEN_DEL_CALLBACK' }));
  });

  it('una respuesta de GIS sin credencial avisa por el bus con auth/gis-no-credential', async () => {
    vi.resetModules();
    const initialize = vi.fn();
    window.google = { accounts: { id: { initialize, renderButton: vi.fn() } } };
    const fresh = await import('../src/services/cloudSession');
    await fresh.mountGoogleSignInButton(document.createElement('div'));
    const seen = [];
    const listener = (event) => seen.push(event.detail);
    window.addEventListener('alacena-auth-error', listener);
    initialize.mock.calls[0][0].callback({});
    window.removeEventListener('alacena-auth-error', listener);
    expect(seen).toEqual(['auth/gis-no-credential']);
  });
});
