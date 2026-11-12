import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveAuthDomain, DEFAULT_AUTH_DOMAIN, APP_AUTH_HOSTS } from '../src/utils/authDomain.js';

test('el dominio de producción usa su propio authDomain (mismo sitio)', () => {
  assert.equal(resolveAuthDomain('alacena.cobertores.com'), 'alacena.cobertores.com');
});

test('web.app y firebaseapp.com también se sirven a sí mismos', () => {
  assert.equal(resolveAuthDomain('alacena-enterprise-prod.web.app'), 'alacena-enterprise-prod.web.app');
  assert.equal(resolveAuthDomain('alacena-enterprise-prod.firebaseapp.com'), 'alacena-enterprise-prod.firebaseapp.com');
  assert.equal(resolveAuthDomain('alacena.iglesiasmurrieta.com'), 'alacena.iglesiasmurrieta.com');
});

test('un dominio desconocido cae al authDomain clásico de Firebase', () => {
  assert.equal(resolveAuthDomain('preview.example.com'), DEFAULT_AUTH_DOMAIN);
  assert.equal(resolveAuthDomain(''), DEFAULT_AUTH_DOMAIN);
  assert.equal(resolveAuthDomain(undefined), DEFAULT_AUTH_DOMAIN);
  assert.equal(resolveAuthDomain(null), DEFAULT_AUTH_DOMAIN);
});

test('la lista de dominios propios no contiene duplicados ni vacíos', () => {
  assert.equal(new Set(APP_AUTH_HOSTS).size, APP_AUTH_HOSTS.length);
  assert.ok(APP_AUTH_HOSTS.every((h) => h && !h.includes('://')));
});
