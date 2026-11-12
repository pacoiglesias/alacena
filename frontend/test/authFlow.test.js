import test from 'node:test';
import assert from 'node:assert/strict';
import { isMobileSignInEnv, preferredSignInFlow, shouldFallbackToRedirect, REDIRECT_FALLBACK_CODES } from '../src/utils/authFlow.js';

const IPHONE_UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1';
const ANDROID_UA = 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Mobile Safari/537.36';
const DESKTOP_UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36';

test('en el iPhone la primera vía es la redirección a la página de Google (3.12.1)', () => {
  assert.equal(isMobileSignInEnv({ userAgent: IPHONE_UA }), true);
  assert.equal(preferredSignInFlow({ userAgent: IPHONE_UA }), 'redirect');
});

test('en Android la primera vía también es la redirección', () => {
  assert.equal(preferredSignInFlow({ userAgent: ANDROID_UA }), 'redirect');
});

test('la app instalada (standalone) entra por redirección aunque el UA no lo diga', () => {
  assert.equal(preferredSignInFlow({ userAgent: DESKTOP_UA, standalone: true }), 'redirect');
  assert.equal(preferredSignInFlow({ userAgent: DESKTOP_UA, navigatorStandalone: true }), 'redirect');
});

test('un entorno táctil (pointer: coarse) entra por redirección', () => {
  assert.equal(preferredSignInFlow({ userAgent: DESKTOP_UA, pointerCoarse: true }), 'redirect');
});

test('en escritorio la primera vía sigue siendo la ventana emergente', () => {
  assert.equal(isMobileSignInEnv({ userAgent: DESKTOP_UA, pointerCoarse: false, standalone: false }), false);
  assert.equal(preferredSignInFlow({ userAgent: DESKTOP_UA }), 'popup');
  assert.equal(preferredSignInFlow({}), 'popup');
  assert.equal(preferredSignInFlow(), 'popup');
});

test('la detección se puede forzar por completo desde el test', () => {
  // Sin ninguna señal móvil, jamás redirección por accidente.
  assert.equal(preferredSignInFlow({ userAgent: '', pointerCoarse: false, standalone: false, navigatorStandalone: false }), 'popup');
});

test('el respaldo a redirección cubre la emergente cerrada, cancelada o colgada', () => {
  for (const code of ['auth/popup-blocked', 'auth/operation-not-supported-in-this-environment', 'auth/popup-closed-by-user', 'auth/cancelled-popup-request', 'auth/timeout']) {
    assert.equal(shouldFallbackToRedirect(code), true, code);
    assert.ok(REDIRECT_FALLBACK_CODES.includes(code), code);
  }
});

test('el respaldo NO salta con errores que la redirección no arregla', () => {
  for (const code of ['auth/network-request-failed', 'auth/unauthorized-domain', 'auth/redirect-returned-empty', 'auth/internal-error', undefined, '']) {
    assert.equal(shouldFallbackToRedirect(code), false, String(code));
  }
});
