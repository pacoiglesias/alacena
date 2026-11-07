// One-time setup explicitly authorized by the owner. Does not enumerate users.
// Asigna a paco@cobertores.com el claim alacenaAccess + la lista `households`
// de casas autorizadas que exigen firestore.rules y storage.rules (AL-1/AL-4).
// Casas de Paco (IDs de /households, los mismos de INITIAL_HOUSEHOLDS en
// frontend/src/services/demoData.js): house-1 Casa México (principal),
// house-2 Casa Fin de Semana (Valle) y house-spain Casa España.
// Para añadir una casa nueva: ALACENA_HOUSEHOLDS=house-1,house-2,house-spain,house-nueva
// node scripts/configure_owner_access.cjs
// Después, Paco debe cerrar y volver a abrir sesión en la app: el claim
// viaja en el ID token y solo se refresca al iniciar sesión.
// ⚠️ Ejecutar ESTE script ANTES de desplegar las reglas nuevas; sin el
// claim `households`, las reglas deniegan el acceso (falla cerrada).
const HOUSEHOLDS = (process.env.ALACENA_HOUSEHOLDS || 'house-1,house-2,house-spain')
  .split(',').map((h) => h.trim()).filter(Boolean);
if (!HOUSEHOLDS.length) throw new Error('ALACENA_HOUSEHOLDS no puede quedar vacío.');
const auth = require(process.env.APPDATA + '/npm/node_modules/firebase-tools/lib/auth');
async function main() {
  const account = auth.getGlobalDefaultAccount();
  const email = 'paco@cobertores.com';
  if (account?.user.email !== email || account.user.email_verified !== true) throw new Error('The verified CLI owner does not match the approved account.');
  const token = await auth.getAccessToken(account.tokens.refresh_token, ['https://www.googleapis.com/auth/cloud-platform', 'https://www.googleapis.com/auth/firebase']);
  const headers = { Authorization: 'Bearer ' + token.access_token, 'Content-Type': 'application/json' };
  const project = 'alacena-enterprise-prod';
  async function request(url, method = 'GET', body) {
    const response = await fetch(url, { method, headers, body: body ? JSON.stringify(body) : undefined });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message || `HTTP ${response.status}`);
    return data;
  }
  const configUrl = `https://identitytoolkit.googleapis.com/admin/v2/projects/${project}/config`;
  const config = await request(configUrl);
  const domains = [...new Set([...(config.authorizedDomains || []), 'alacena.cobertores.com', 'localhost', '127.0.0.1'])];
  await request(configUrl + '?updateMask=authorizedDomains', 'PATCH', { authorizedDomains: domains });
  const base = `https://identitytoolkit.googleapis.com/v1/projects/${project}/accounts`;
  let owner = (await request(base + ':lookup', 'POST', { email: [email] })).users?.[0];
  if (!owner) owner = await request(base, 'POST', { email, emailVerified: true, displayName: 'Paco Iglesias' });
  const attributes = JSON.parse(owner.customAttributes || '{}');
  await request(base + ':update', 'POST', { localId: owner.localId, customAttributes: JSON.stringify({ ...attributes, alacenaAccess: true, households: HOUSEHOLDS }) });
  const verified = (await request(base + ':lookup', 'POST', { email: [email] })).users?.[0];
  const verifiedAttributes = JSON.parse(verified?.customAttributes || '{}');
  if (!verified || !verified.emailVerified || !verifiedAttributes.alacenaAccess || JSON.stringify(verifiedAttributes.households || []) !== JSON.stringify(HOUSEHOLDS)) throw new Error('Owner authorization could not be verified.');
  console.log(JSON.stringify({ ownerConfigured: true, emailVerified: true, homeAccess: true, households: HOUSEHOLDS, authorizedDomains: domains }));
}
main().catch((error) => { console.error(error.message); process.exitCode = 1; });
