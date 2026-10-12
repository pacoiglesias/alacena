const fs = require('fs');
const path = require('path');
const {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds,
} = require('@firebase/rules-unit-testing');

const PROJECT_ID = 'alacena-enterprise-prod';
const RULES_PATH = path.resolve(__dirname, '../../firestore.rules');

describe('🛡️ ALACENA Enterprise — Firestore Security Rules Verification Suite', () => {
  let testEnv;

  before(async () => {
    const rules = fs.readFileSync(RULES_PATH, 'utf8');
    testEnv = await initializeTestEnvironment({
      projectId: PROJECT_ID,
      firestore: {
        rules,
        host: '127.0.0.1',
        port: 8080,
      },
    });
  });

  after(async () => {
    if (testEnv) {
      await testEnv.cleanup();
    }
  });

  beforeEach(async () => {
    await testEnv.clearFirestore();

    // Setup base multi-tenant context: Workspace, Household, and Members
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore();

      // Workspace doc
      await db.doc('workspaces/ws-palmas').set({
        name: 'Palmas Luxury Residence',
        ownerId: 'user-admin-01',
        createdBy: 'user-admin-01',
        createdAt: new Date(),
        plan: 'ENTERPRISE',
      });

      // Member: Admin
      await db.doc('workspaces/ws-palmas/members/user-admin-01').set({
        role: 'admin',
        displayName: 'Paco Iglesias (Owner)',
        email: 'paco@cobertores.com',
      });

      // Member: Service (Operativo / Cocina)
      await db.doc('workspaces/ws-palmas/members/user-service-01').set({
        role: 'service',
        displayName: 'María (Jefa de Cocina)',
        email: 'maria@palmas.com',
      });

      // Existing Household
      await db.doc('workspaces/ws-palmas/households/casa-principal').set({
        name: 'Casa Principal',
      });

      // Existing Inventory Item
      await db.doc('workspaces/ws-palmas/households/casa-principal/items/item-jamon-01').set({
        id: 'item-jamon-01',
        workspaceId: 'ws-palmas',
        householdId: 'casa-principal',
        name: 'Jamón Ibérico 5 Jotas',
        currentQuantity: 3,
        updatedAt: new Date(),
      });

      // Existing Private Financial Pricing
      await db.doc('workspaces/ws-palmas/households/casa-principal/items/item-jamon-01/private_financial/pricing').set({
        unitPrice: 580.00,
        currency: 'MXN',
      });
    });
  });

  // TEST 1: usuario service NO puede escribir audit_trail
  it('TEST 1: usuario service NO puede escribir audit_trail (append-only con campos restringidos/falsificados)', async () => {
    const serviceContext = testEnv.authenticatedContext('user-service-01');
    const serviceDb = serviceContext.firestore();

    // Intento de inyectar campos no permitidos o modificar audit_trail
    const invalidLogRef = serviceDb.doc('workspaces/ws-palmas/households/casa-principal/audit_trail/log-evil-01');
    await assertFails(invalidLogRef.set({
      id: 'log-evil-01',
      workspaceId: 'ws-palmas',
      householdId: 'casa-principal',
      userId: 'user-service-01',
      action: 'ALTER_RECORD',
      maliciousField: 'exploit', // Campo no listado en hasOnly
      timestamp: new Date(),
    }));
  });

  // TEST 2: usuario service NO puede leer private_financial
  it('TEST 2: usuario service NO puede leer private_financial', async () => {
    const serviceContext = testEnv.authenticatedContext('user-service-01');
    const serviceDb = serviceContext.firestore();

    const pricingRef = serviceDb.doc('workspaces/ws-palmas/households/casa-principal/items/item-jamon-01/private_financial/pricing');
    await assertFails(pricingRef.get());
  });

  // TEST 3: usuario NO miembro NO puede leer items
  it('TEST 3: usuario NO miembro NO puede leer items', async () => {
    const strangerContext = testEnv.authenticatedContext('user-stranger-99');
    const strangerDb = strangerContext.firestore();

    const itemRef = strangerDb.doc('workspaces/ws-palmas/households/casa-principal/items/item-jamon-01');
    await assertFails(itemRef.get());
  });

  // TEST 4: usuario admin SÍ puede crear items
  it('TEST 4: usuario admin SÍ puede crear items', async () => {
    const adminContext = testEnv.authenticatedContext('user-admin-01');
    const adminDb = adminContext.firestore();

    const newItemRef = adminDb.doc('workspaces/ws-palmas/households/casa-principal/items/item-aceite-01');
    await assertSucceeds(newItemRef.set({
      id: 'item-aceite-01',
      workspaceId: 'ws-palmas',
      householdId: 'casa-principal',
      name: 'Aceite de Oliva Extra Virgen 500ml',
      currentQuantity: 4,
    }));
  });

  // TEST 5: usuario puede escribir su propio profile, no el de otro
  it('TEST 5: usuario puede escribir su propio profile, no el de otro', async () => {
    const userContext = testEnv.authenticatedContext('user-regular-02');
    const userDb = userContext.firestore();

    // Su propio perfil con campos autorizados
    const myProfileRef = userDb.doc('users/user-regular-02');
    await assertSucceeds(myProfileRef.set({
      displayName: 'Carlos Operaciones',
      email: 'carlos@alacena.mx',
      photoURL: 'https://alacena.mx/avatar.png',
      preferences: { theme: 'dark' },
      locale: 'es-MX',
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    // Intento de escribir el perfil de otro usuario -> DEBE FALLAR
    const otherProfileRef = userDb.doc('users/user-admin-01');
    await assertFails(otherProfileRef.set({
      displayName: 'Hacked Admin',
      updatedAt: new Date(),
    }));
  });
});
