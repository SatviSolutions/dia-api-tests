// Session lifecycle: logout revokes only that session's token.
// A dedicated login is used, so logging out revokes only that session (each token has its own jti/sid);
// the worker's own session must stay valid, which the last step proves.
const { test, expect } = require('../fixtures/api');
const { expectError, expectUnauthorized } = require('../helpers/assertions');

test.describe.configure({ mode: 'serial' });

const username = process.env.DIA_USERNAME;
const password = process.env.DIA_PASSWORD;
const bearer = (token) => ({ Authorization: `Bearer ${token}` });
let sessionToken;

test('log in to obtain a dedicated session token', async ({ auth }) => {
  const response = await auth.login({ username, password });

  expect(response.status()).toBe(200);
  sessionToken = (await response.json()).token;
});

test('the session token identifies the user', async ({ auth }) => {
  const response = await auth.me(sessionToken);

  expect(response.status()).toBe(200);
  expect((await response.json()).username).toBe(username);
});

test('the session token works on a data API', async ({ anonymous }) => {
  const response = await anonymous.get('/api/datapilot/history', { params: { limit: 1 }, headers: bearer(sessionToken) });

  expect(response.status()).toBe(200);
});

test('logout succeeds', async ({ auth }) => {
  const response = await auth.logout(sessionToken);

  expect(response.status()).toBe(200);
  expect((await response.json()).message).toBe('Logged out successfully');
});

test('the logged-out token is rejected on /me', async ({ auth }) => {
  await expectUnauthorized(await auth.me(sessionToken), 'Invalid or expired token');
});

test('the logged-out token is rejected on a data API and no history is leaked', async ({ anonymous }) => {
  const response = await anonymous.get('/api/datapilot/history', { params: { limit: 1 }, headers: bearer(sessionToken) });

  await expectError(response, 401, 'Invalid or expired token');
  expect(Array.isArray(await response.json())).toBe(false);
});

test('the worker\'s own admin session is unaffected', async ({ auth, token }) => {
  expect((await auth.me(token)).status()).toBe(200);
});
