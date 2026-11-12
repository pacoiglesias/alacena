import test from 'node:test';
import assert from 'node:assert/strict';
import { authErrorMessage } from '../src/utils/authFeedback.js';

test('la redirección que vuelve vacía tiene un motivo claro y una salida (3.12.0)', () => {
  const msg = authErrorMessage('auth/redirect-returned-empty');
  assert.match(msg, /volvió sin completar/);
  assert.match(msg, /Reintentar conexión/);
});

test('el plan B tras la redirección vacía es la ventana de Google, también en el móvil (3.12.1)', () => {
  // Este texto es el que la puerta (ConnectHouseGate) pinta en su
  // propio panel cuando la redirección vuelve sin completar: tiene
  // que ofrecer la ventana emergente como salida, no un callejón.
  const msg = authErrorMessage('auth/redirect-returned-empty');
  assert.match(msg, /ventana de Google/);
});

test('los códigos conocidos nunca caen en el aviso genérico', () => {
  const generic = 'No se pudo completar el acceso. Reintenta; tus datos siguen guardados en este dispositivo.';
  for (const code of ['auth/popup-closed-by-user', 'auth/popup-blocked', 'auth/network-request-failed', 'auth/timeout', 'auth/unauthorized-domain', 'auth/web-storage-unsupported', 'auth/operation-not-supported-in-this-environment', 'auth/internal-error']) {
    assert.notEqual(authErrorMessage(code), generic, code);
  }
});

test('un código desconocido mantiene el aviso genérico con red de seguridad', () => {
  assert.equal(
    authErrorMessage('auth/algo-nuevo'),
    'No se pudo completar el acceso. Reintenta; tus datos siguen guardados en este dispositivo.'
  );
  assert.equal(authErrorMessage(undefined), authErrorMessage('auth/algo-nuevo'));
});
