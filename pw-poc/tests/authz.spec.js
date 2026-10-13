// Authorization engine API: reads, validation and authentication. Strictly non-mutating (see authzClient.js): no grant,
// policy or access request is created and no role switch is changed. Role-based checks that need a non-admin account
// stay Blocked (no such credentials exist) and are not attempted here.
const { test, expect } = require('../fixtures/api');
const { expectError, expectUnauthorized } = require('../helpers/assertions');
const { AuthzClient } = require('../clients/authzClient');

// ---- reads ----------------------------------------------------------------------------------------------------------

test("my-permissions reports the caller's role and the pages with their privileges", async ({ authz }) => {
  const response = await authz.myPermissions();

  expect(response.status()).toBe(200);
  const body = await response.json();
  expect(body.role).toBe('admin');
  expect(body.unrestricted).toEqual(expect.any(Boolean));
  expect(body.pages.length).toBeGreaterThan(0);
  for (const page of body.pages) expect(page).toMatchObject({ label: expect.any(String), privileges: expect.any(Array), urn: expect.any(String) });
});

test('the role list contains the standard roles, with their chain and system flag, and a matching total', async ({ authz }) => {
  const response = await authz.roles();

  expect(response.status()).toBe(200);
  const body = await response.json();
  expect(body.roles).toEqual(expect.any(Array));
  expect(body.total).toEqual(expect.any(Number));
  expect(body.roles.map((r) => r.name)).toEqual(expect.arrayContaining(['admin', 'manager', 'analyst', 'user']));
  for (const role of body.roles) expect(role).toMatchObject({ chain: expect.any(Array), is_system: expect.any(Boolean) });
});

test('the permission catalog has groups, tiers and a total', async ({ authz }) => {
  const response = await authz.catalog();

  expect(response.status()).toBe(200);
  const body = await response.json();
  expect(body.groups.length).toBeGreaterThan(0);
  expect(body.tiers).toBeDefined();
  expect(body.total).toEqual(expect.any(Number));
});

test('every grant has the confirmed schema', async ({ authz }) => {
  const response = await authz.grants();

  expect(response.status()).toBe(200);
  const grants = await response.json();
  expect(grants).toEqual(expect.any(Array));
  for (const g of grants) {
    expect(g.id).toEqual(expect.any(Number));
    expect(['user', 'role', 'group']).toContain(g.subject_type);
    expect(['allow', 'deny']).toContain(g.effect);
    expect(g.privilege).toEqual(expect.any(String));
    expect(g.object_pattern).toEqual(expect.any(String));
    expect(g.is_active).toEqual(expect.any(Boolean));
  }
});

const listEndpoints = [
  { name: 'policies', call: (a) => a.policies() },
  { name: 'classifications', call: (a) => a.classifications() },
  { name: 'my access requests', call: (a) => a.myRequests() },
];
for (const { name, call } of listEndpoints) {
  test(`${name} is a list`, async ({ authz }) => {
    const response = await call(authz);

    expect(response.status()).toBe(200);
    expect(await response.json()).toEqual(expect.any(Array));
  });
}

test('the access report count matches the events, each with an action and a timestamp', async ({ authz }) => {
  const response = await authz.accessReport();

  expect(response.status()).toBe(200);
  const body = await response.json();
  expect(body.events).toEqual(expect.any(Array));
  expect(body.count).toBe(body.events.length);
  for (const e of body.events) expect(e).toMatchObject({ action: expect.any(String), created_at: expect.any(String) });
});

// ---- validation: every one is rejected before anything is stored -----------------------------------------------------

const rejected = [
  { name: 'creating a grant with an invalid subject_type', call: (a) => a.createGrant({}), status: 400, error: 'subject_type must be user, role or group' },
  { name: 'creating a policy with an invalid kind', call: (a) => a.createPolicy({}), status: 400, error: 'kind must be mask or row_filter' },
  { name: 'creating an access request without object_urn', call: (a) => a.createRequest({}), status: 400, error: 'object_urn is required' },
  { name: 'why-not without a path', call: (a) => a.whyNot(), status: 400, error: 'path is required' },
  { name: 'explain without its parameters', call: (a) => a.explain(), status: 400, error: 'user_id and urn are required' },
  { name: 'a role-switch update without a key', call: (a) => a.updateRoleSwitches('zz-no-such-role', {}), status: 400, error: 'key is required' },
  { name: 'deleting an unknown grant', call: (a) => a.deleteGrant(999999999), status: 404, error: 'Grant not found' },
  { name: 'deleting an unknown policy', call: (a) => a.deletePolicy(999999999), status: 404, error: 'Policy not found' },
];
for (const { name, call, status, error } of rejected) {
  test(`${name} is rejected`, async ({ authz }) => {
    await expectError(await call(authz), status, error);
  });
}

// ---- authentication ------------------------------------------------------------------------------------------------

const withoutToken = [
  { name: 'my-permissions', call: (a) => a.myPermissions() },
  { name: 'the role list', call: (a) => a.roles() },
  { name: 'the grant list', call: (a) => a.grants() },
  { name: 'grant creation', call: (a) => a.createGrant({}) }, // empty body: nothing could be created even if the guard failed
  { name: 'the policy list', call: (a) => a.policies() },
  { name: 'the access report', call: (a) => a.accessReport() },
];
for (const { name, call } of withoutToken) {
  test(`${name} without a token is rejected`, async ({ anonymous }) => {
    await expectUnauthorized(await call(new AuthzClient(anonymous)));
  });
}

test('the role list with an invalid token is rejected', async ({ anonymous }) => {
  const response = await anonymous.get('/api/authz/roles', { headers: { Authorization: 'Bearer invalid.token.value' } });

  await expectUnauthorized(response, 'Invalid or expired token');
});
