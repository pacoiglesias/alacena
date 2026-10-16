// Read-only deployment preflight. Never print tokens or provider secrets.
const auth = require(process.env.APPDATA + '/npm/node_modules/firebase-tools/lib/auth');
async function main() {
  const account = auth.getGlobalDefaultAccount();
  if (!account) throw new Error('Firebase CLI has no signed-in account.');
  const token = await auth.getAccessToken(account.tokens.refresh_token, ['https://www.googleapis.com/auth/cloud-platform', 'https://www.googleapis.com/auth/firebase']);
  const headers = { Authorization: 'Bearer ' + token.access_token };
  const project = 'alacena-enterprise-prod';
  const endpoints = {
    config: `https://identitytoolkit.googleapis.com/admin/v2/projects/${project}/config`,
    google: `https://identitytoolkit.googleapis.com/v2/projects/${project}/defaultSupportedIdpConfigs/google.com`,
    users: `https://identitytoolkit.googleapis.com/v1/projects/${project}/accounts:lookup`,
    domains: `https://firebasehosting.googleapis.com/v1beta1/projects/-/sites/${project}/customDomains`,
  };
  const output = { accountEmail: account.user.email, accountVerified: account.user.email_verified };
  for (const [key, url] of Object.entries(endpoints)) {
    const response = await fetch(url, key === 'users' ? { method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify({ email: [account.user.email] }) } : { headers });
    const data = await response.json();
    if (!response.ok) { output[key] = { status: response.status, message: data.error?.message }; continue; }
    if (key === 'config') output.config = { authorizedDomains: data.authorizedDomains };
    if (key === 'google') output.google = { enabled: data.enabled };
    if (key === 'users') output.users = { owner: data.users?.filter((u) => u.email === account.user.email).map((u) => ({ uid: u.localId, emailVerified: u.emailVerified, customAttributes: u.customAttributes })) };
    if (key === 'domains') output.domains = data.customDomains?.map((d) => ({ name: d.name, hostState: d.hostState, ownershipState: d.ownershipState }));
  }
  console.log(JSON.stringify(output, null, 2));
}
main().catch((error) => { console.error(error.message); process.exitCode = 1; });
