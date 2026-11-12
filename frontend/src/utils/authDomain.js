// Dominio de autenticación = dominio desde el que se sirve la app
// (ronda 3.12.0, «conexión siempre viva»).
//
// Causa raíz del incidente del 11-nov-2026: la app se sirve en
// alacena.cobertores.com pero el authDomain quedaba fijo en
// alacena-enterprise-prod.firebaseapp.com. En navegadores con el
// almacenamiento particionado (Chrome/Safari actuales), el flujo
// signInWithRedirect salta al handler de OTRO dominio y al volver el
// SDK no recupera el resultado: getRedirectResult llega vacío y la
// sesión nunca se completa, dejando la app en modo «solo este
// dispositivo» sin avisar. Sirviendo el handler /__/auth/handler
// desde el MISMO dominio de la app (Firebase Hosting lo sirve en
// todos los dominios conectados y todos están en los dominios
// autorizados del proyecto), la redirección es de mismo sitio y el
// acceso se completa.
//
// Si la app se abre desde un dominio desconocido (p. ej. un preview),
// se mantiene el dominio clásico de Firebase como respaldo seguro.

export const DEFAULT_AUTH_DOMAIN = 'alacena-enterprise-prod.firebaseapp.com';

export const APP_AUTH_HOSTS = [
  'alacena.cobertores.com',
  'alacena.iglesiasmurrieta.com',
  'alacena-enterprise-prod.web.app',
  'alacena-enterprise-prod.firebaseapp.com',
];

export function resolveAuthDomain(hostname) {
  const host = String(hostname || '').trim().toLowerCase();
  return APP_AUTH_HOSTS.includes(host) ? host : DEFAULT_AUTH_DOMAIN;
}
