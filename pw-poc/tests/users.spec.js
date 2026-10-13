// Session and user-administration endpoints: refresh, providers, user list and the admin guards.
// Every mutating call targets a non-existent user id, or is the self-demotion guard that is refused before any change,
// so no account can be modified.
const { test, expect } = require('../fixtures/api');
const { expectError, expectUnauthorized, expectNoSecretKeys } = require('../helpers/assertions');

const username = process.env.DIA_USERNAME;
const NO_SUCH_USER = 999999999;

test('refresh issues a new JWT for the same user', async ({ auth, token }) => {
  const response = await auth.refresh(token);

  expect(response.status()).toBe(200);
  const body = await response.json();
  expect(body.token).toEqual(expect.stringMatching(/.{11,}/));
  expect(body.token.split('.')).toHaveLength(3);
  expect(body.user).toMatchObject({ id: expect.any(Number), username, email: expect.stringContaining('@'), role: expect.any(String), auth_provider: expect.any(String) });
});

test('providers is public and lists the login providers, with a default among them', async ({ auth }) => {
  const response = await auth.providers(); // no token

  expect(response.status()).toBe(200);
  const body = await response.json();
  expect(body.providers.length).toBeGreaterThan(0);
  for (const p of body.providers) expect(p).toMatchObject({ name: expect.any(String), display_name: expect.any(String) });
  expect(body.providers.map((p) => p.name)).toContain(body.default);
  expect(body.auto_redirect).toEqual(expect.any(Boolean));
});

test('the user list has typed users, includes the caller and the four standard roles, and no credentials', async ({ auth, token }) => {
  const response = await auth.users(token);

  expect(response.status()).toBe(200);
  const body = await response.json();
  expect(body.users.length).toBeGreaterThan(0);
  for (const u of body.users) {
    expect(u).toMatchObject({ id: expect.any(Number), username: expect.any(String), email: expect.any(String), role: expect.any(String), is_active: expect.any(Boolean) });
  }
  expect(body.users.map((u) => u.username)).toContain(username);
  expect(body.available_roles.map((r) => r.name)).toEqual(expect.arrayContaining(['admin', 'manager', 'analyst', 'user']));
  expectNoSecretKeys(body.users, '/auth/api/users');
});

// ---- no token: every one is rejected (non-existent ids, so nothing could change even if the guard failed) -------------

const withoutToken = [
  { name: 'refresh', call: (auth) => auth.refresh() },
  { name: 'list users', call: (auth) => auth.users() },
  { name: 'update a role', call: (auth) => auth.updateRole(NO_SUCH_USER, { role: 'user' }) },
  { name: 'set a user active', call: (auth) => auth.setActive(NO_SUCH_USER, { is_active: false }) },
  { name: 'delete a user', call: (auth) => auth.deleteUser(NO_SUCH_USER) },
];
for (const { name, call } of withoutToken) {
  test(`${name} without a token is rejected`, async ({ auth }) => {
    await expectUnauthorized(await call(auth));
  });
}

// ---- admin guards ---------------------------------------------------------------------------------------------------

const adminErrors = [
  { name: 'update role of a non-existent user', call: (a, t) => a.updateRole(NO_SUCH_USER, { role: 'user' }, t), status: 404, error: 'User not found' },
  { name: 'update role without a role', call: (a, t) => a.updateRole(NO_SUCH_USER, {}, t), status: 400, error: 'Role is required' },
  { name: 'set active on a non-existent user', call: (a, t) => a.setActive(NO_SUCH_USER, { is_active: false }, t), status: 404, error: 'User not found' },
  { name: 'delete a non-existent user', call: (a, t) => a.deleteUser(NO_SUCH_USER, t), status: 404, error: 'User not found' },
];
for (const { name, call, status, error } of adminErrors) {
  test(`${name} is rejected`, async ({ auth, token }) => {
    await expectError(await call(auth, token), status, error);
  });
}

test('update role with an invalid role value lists the valid roles', async ({ auth, token }) => {
  const response = await auth.updateRole(NO_SUCH_USER, { role: 'not-a-real-role' }, token);

  expect(response.status()).toBe(400);
  const { error } = await response.json();
  expect(error).toContain('Invalid role');
  expect(error).toContain('admin');
});

test('an admin cannot demote themselves', async ({ auth, token }) => {
  // Safety guard, refused before any change is made. Needs the caller\'s own id.
  const me = await (await auth.me(token)).json();

  await expectError(await auth.updateRole(me.id, { role: 'user' }, token), 400, 'Cannot demote yourself from admin');
  expect((await (await auth.me(token)).json()).role, 'own role is unchanged').toBe(me.role);
});
