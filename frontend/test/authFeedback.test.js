import test from 'node:test';
import assert from 'node:assert/strict';
import { authErrorMessage } from '../src/utils/authFeedback.js';

test('el fallo de carga de GIS tiene un motivo claro y una salida (3.13.0)', () => {
  const msg = authErrorMessage('auth/gis-load-failed');
  assert.match(msg, /No se pudo cargar el botón de Google/);
  assert.match(msg, /reinténtalo/i);
});

test('los códigos conocidos nunca caen en el aviso genérico', () => {
  const generic = 'No se pudo completar el acceso. Reintenta; tus datos siguen guardados en este dispositivo.';
  for (const code of ['auth/gis-load-failed', 'auth/gis-no-credential', 'auth/gis-unavailable', 'auth/network-request-failed', 'auth/timeout', 'auth/unauthorized-domain', 'auth/web-storage-unsupported', 'auth/internal-error']) {
    assert.notEqual(authErrorMessage(code), generic, code);
  }
});

test('los códigos del flujo retirado (emergente/redirección) ya no tienen mensaje propio', () => {
  const generic = authErrorMessage('auth/algo-nuevo');
  for (const code of ['auth/popup-closed-by-user', 'auth/popup-blocked', 'auth/redirect-returned-empty', 'auth/operation-not-supported-in-this-environment']) {
    assert.equal(authErrorMessage(code), generic, code);
  }
});

test('un código desconocido mantiene el aviso genérico con red de seguridad', () => {
  assert.equal(
    authErrorMessage('auth/algo-nuevo'),
    'No se pudo completar el acceso. Reintenta; tus datos siguen guardados en este dispositivo.'
  );
  assert.equal(authErrorMessage(undefined), authErrorMessage('auth/algo-nuevo'));
});
