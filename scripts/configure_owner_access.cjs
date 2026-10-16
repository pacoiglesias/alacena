// One-time setup explicitly authorized by the owner. Does not enumerate users.
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
  await request(base + ':update', 'POST', { localId: owner.localId, customAttributes: JSON.stringify({ ...attributes, alacenaAccess: true }) });
  const verified = (await request(base + ':lookup', 'POST', { email: [email] })).users?.[0];
  if (!verified || !verified.emailVerified || !JSON.parse(verified.customAttributes || '{}').alacenaAccess) throw new Error('Owner authorization could not be verified.');
  console.log(JSON.stringify({ ownerConfigured: true, emailVerified: true, homeAccess: true, authorizedDomains: domains }));
}
main().catch((error) => { console.error(error.message); process.exitCode = 1; });
