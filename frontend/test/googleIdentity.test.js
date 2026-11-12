import test from 'node:test';
import assert from 'node:assert/strict';
import {
  GIS_SCRIPT_URL,
  GIS_BUTTON_OPTIONS,
  loadGoogleIdentityScript,
  initGoogleIdentity,
  renderGoogleSignInButton,
  resetGoogleIdentityScriptCache,
} from '../src/utils/googleIdentity.js';

const CLIENT_ID = '563016091019-2mv9qfe5nugggt64u383cunlc27tf4nr.apps.googleusercontent.com';

function fakeGoogle() {
  const calls = { initialize: [], renderButton: [] };
  const googleObj = {
    accounts: {
      id: {
        initialize: (config) => calls.initialize.push(config),
        renderButton: (element, options) => calls.renderButton.push({ element, options }),
      },
    },
  };
  return { googleObj, calls };
}

function fakeDocument() {
  const scripts = [];
  const doc = {
    scripts,
    head: { appendChild: (el) => scripts.push(el) },
    body: null,
    createElement: (tag) => ({ tag, src: '', async: false, defer: false, onload: null, onerror: null }),
  };
  return doc;
}

test('la carga inyecta una sola vez el script oficial de GIS y resuelve con window.google', async () => {
  resetGoogleIdentityScriptCache();
  const { googleObj } = fakeGoogle();
  const win = {};
  const doc = fakeDocument();
  const first = loadGoogleIdentityScript({ window: win, document: doc });
  const second = loadGoogleIdentityScript({ window: win, document: doc });
  assert.equal(doc.scripts.length, 1);
  assert.equal(doc.scripts[0].src, GIS_SCRIPT_URL);
  assert.equal(doc.scripts[0].src, 'https://accounts.google.com/gsi/client');
  win.google = googleObj;
  doc.scripts[0].onload();
  assert.equal(await first, googleObj);
  assert.equal(await second, googleObj);
});

test('si window.google ya está, no se inyecta ningún script', async () => {
  resetGoogleIdentityScriptCache();
  const { googleObj } = fakeGoogle();
  const doc = fakeDocument();
  const result = await loadGoogleIdentityScript({ window: { google: googleObj }, document: doc });
  assert.equal(result, googleObj);
  assert.equal(doc.scripts.length, 0);
});

test('un fallo de carga rechaza con auth/gis-load-failed y el siguiente intento puede reintentar', async () => {
  resetGoogleIdentityScriptCache();
  const { googleObj } = fakeGoogle();
  const win = {};
  const doc = fakeDocument();
  const failed = loadGoogleIdentityScript({ window: win, document: doc });
  doc.scripts[0].onerror();
  await assert.rejects(failed, (error) => error.code === 'auth/gis-load-failed');
  const retry = loadGoogleIdentityScript({ window: win, document: doc });
  assert.equal(doc.scripts.length, 2);
  win.google = googleObj;
  doc.scripts[1].onload();
  assert.equal(await retry, googleObj);
});

test('inicializa GIS con el ID de cliente web del proyecto', () => {
  const { googleObj, calls } = fakeGoogle();
  const ok = initGoogleIdentity({ googleObj, clientId: CLIENT_ID, onCredential: () => {}, onError: () => {} });
  assert.equal(ok, true);
  assert.equal(calls.initialize.length, 1);
  assert.equal(calls.initialize[0].client_id, CLIENT_ID);
});

test('el callback de GIS entrega la credencial tal cual a onCredential', () => {
  const { googleObj, calls } = fakeGoogle();
  let received = null;
  initGoogleIdentity({ googleObj, clientId: CLIENT_ID, onCredential: (token) => { received = token; }, onError: () => {} });
  calls.initialize[0].callback({ credential: 'ID_TOKEN_DE_PRUEBA' });
  assert.equal(received, 'ID_TOKEN_DE_PRUEBA');
});

test('una respuesta de GIS sin credencial sale por onError con auth/gis-no-credential', () => {
  const { googleObj, calls } = fakeGoogle();
  let failure = null;
  initGoogleIdentity({ googleObj, clientId: CLIENT_ID, onCredential: () => {}, onError: (error) => { failure = error; } });
  calls.initialize[0].callback({});
  assert.equal(failure.code, 'auth/gis-no-credential');
});

test('sin cliente GIS, init avisa auth/gis-unavailable y no lanza', () => {
  let failure = null;
  const ok = initGoogleIdentity({ googleObj: {}, clientId: CLIENT_ID, onCredential: () => {}, onError: (error) => { failure = error; } });
  assert.equal(ok, false);
  assert.equal(failure.code, 'auth/gis-unavailable');
});

test('renderButton pinta el botón oficial grande en el elemento dado', () => {
  const { googleObj, calls } = fakeGoogle();
  const element = { id: 'contenedor' };
  assert.equal(renderGoogleSignInButton(googleObj, element), true);
  assert.equal(calls.renderButton.length, 1);
  assert.equal(calls.renderButton[0].element, element);
  assert.equal(calls.renderButton[0].options.size, 'large');
  assert.equal(calls.renderButton[0].options.theme, GIS_BUTTON_OPTIONS.theme);
  assert.equal(renderGoogleSignInButton(googleObj, null), false);
  assert.equal(renderGoogleSignInButton({}, element), false);
});
