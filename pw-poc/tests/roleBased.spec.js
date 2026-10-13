// Role-based authorization: a NON-admin account must be refused admin-only operations (403 "Admin access required").
//
// BLOCKED until a non-admin account is provided: set DIA_VIEWER_USERNAME / DIA_VIEWER_PASSWORD (see .env.example). Without
// them every test here is reported as SKIPPED with the reason below, never as passed. The expected responses are taken
// from the backend's admin_required decorator; they have NOT yet been verified against a live non-admin session. Only refused (403) or non-mutating calls are made: the non-existent user id means nothing could
// change even if an admin guard failed.
const { test, expect } = require('../fixtures/api');
const { expectError } = require('../helpers/assertions');

const BLOCKED = 'BLOCKED: no non-admin credentials (set DIA_VIEWER_USERNAME / DIA_VIEWER_PASSWORD)';
const NO_SUCH_USER = 999999999;
const as = (viewerToken) => ({ Authorization: `Bearer ${viewerToken}` });

test.describe('role-based authorization (non-admin session)', () => {
  test('a non-admin can log in and is not an admin', async ({ auth, viewerToken }) => {
    test.skip(!viewerToken, BLOCKED);

    const me = await auth.me(viewerToken);

    expect(me.status()).toBe(200);
    expect((await me.json()).role).not.toBe('admin');
  });

  test('a non-admin cannot list users', async ({ auth, viewerToken }) => {
    test.skip(!viewerToken, BLOCKED);

    await expectError(await auth.users(viewerToken), 403, 'Admin access required');
  });

  test('a non-admin cannot change a role', async ({ auth, viewerToken }) => {
    test.skip(!viewerToken, BLOCKED);

    await expectError(await auth.updateRole(NO_SUCH_USER, { role: 'user' }, viewerToken), 403, 'Admin access required');
  });

  test('a non-admin cannot activate or deactivate a user', async ({ auth, viewerToken }) => {
    test.skip(!viewerToken, BLOCKED);

    await expectError(await auth.setActive(NO_SUCH_USER, { is_active: false }, viewerToken), 403, 'Admin access required');
  });

  test('a non-admin cannot delete a user', async ({ auth, viewerToken }) => {
    test.skip(!viewerToken, BLOCKED);

    await expectError(await auth.deleteUser(NO_SUCH_USER, viewerToken), 403, 'Admin access required');
  });

  test('a non-admin cannot trigger the tab-cache cleanup', async ({ anonymous, viewerToken }) => {
    test.skip(!viewerToken, BLOCKED);

    await expectError(await anonymous.post('/api/tabs/cleanup', { data: {}, headers: as(viewerToken) }), 403, 'Admin access required');
  });

  test('a non-admin still reads their own profile with a non-admin role', async ({ auth, viewerToken }) => {
    test.skip(!viewerToken, BLOCKED);

    const body = await (await auth.me(viewerToken)).json();

    expect(body).toMatchObject({ username: process.env.DIA_VIEWER_USERNAME, role: expect.any(String) });
    expect(body.role).not.toBe('admin');
  });
});
