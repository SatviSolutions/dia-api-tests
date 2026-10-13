const { test, expect } = require('../fixtures/api');
const { expectError, expectNoSecretKeys, expectNoSensitiveData } = require('../helpers/assertions');

const username = process.env.DIA_USERNAME;
const password = process.env.DIA_PASSWORD;

// Shape of the user object returned by login, refresh and /me.
function expectUserSchema(user) {
  expect(user.id).toEqual(expect.any(Number));
  expect(user.username).toEqual(expect.stringMatching(/.+/));
  expect(user.email).toEqual(expect.stringContaining('@'));
  expect(user.role).toEqual(expect.stringMatching(/.+/));
  expect(user.auth_provider).toEqual(expect.stringMatching(/.+/));
  for (const nullable of ['full_name', 'display_name', 'avatar_url']) expect(user).toHaveProperty(nullable); // present, may be null
}

test('login succeeds and returns a JWT plus the full user object', async ({ auth }) => {
  const response = await auth.login({ username, password });

  expect(response.status()).toBe(200);
  expect(response.headers()['content-type']).toContain('application/json');
  const body = await response.json();
  expect(body.token).toEqual(expect.stringMatching(/.{11,}/));
  expect(body.token.split('.')).toHaveLength(3); // header.payload.signature
  expectUserSchema(body.user);
  expect(body.user.username).toBe(username);
  if (username === 'admin') expect(body.user.role).toBe('admin'); // the seeded admin account carries the admin role
  expect(body.user).not.toHaveProperty('password');
  for (const [name, value] of Object.entries(response.headers())) {
    expect(value, `token reflected in response header "${name}"`).not.toContain(body.token);
  }
});

test('login with a wrong password is rejected', async ({ auth }) => {
  const response = await auth.login({ username, password: 'definitely-wrong' });

  await expectError(response, 401, 'Invalid username or password');
  expect(await response.json()).not.toHaveProperty('token');
});

// DIA throttles a (client, username) pair after 10 failed logins in 15 minutes (HTTP 429), and a pair only resets on a
// successful login. The failing usernames below therefore carry a per-run suffix so repeated runs never accumulate.
const runId = Date.now();

const invalidLogins = [
  { name: 'empty JSON object', data: {}, status: 400, error: 'Request body required' },
  { name: 'no request body at all', data: undefined, status: 400, error: 'Request body required' },
  { name: 'empty username', data: { username: '', password: 'x' }, status: 400, error: 'Username and password are required' },
  { name: 'empty password', data: { username, password: '' }, status: 400, error: 'Username and password are required' },
  { name: 'missing username', data: { password }, status: 400, error: 'Username and password are required' },
  { name: 'missing password', data: { username }, status: 400, error: 'Username and password are required' },
  { name: 'null username and password', data: { username: null, password: null }, status: 400, error: 'Username and password are required' },
  { name: 'unknown username', data: { username: `nonexistent_qa_user_${runId}`, password }, status: 401, error: 'Invalid username or password' },
  { name: 'SQL-injection style username', data: { username: `' OR '1'='1' -- ${runId}`, password: 'x' }, status: 401, error: 'Invalid username or password' },
];
for (const { name, data, status, error } of invalidLogins) {
  test(`login rejects invalid input: ${name}`, async ({ auth }) => {
    const response = await auth.login(data);

    await expectError(response, status, error);
    expect(await response.json(), 'no token must be granted').not.toHaveProperty('token');
  });
}

test('login with malformed JSON is a 400 and grants no token', async ({ auth }) => {
  const response = await auth.loginRaw('{"username": "admin", "password": }');

  expect(response.status()).toBe(400);
  expect(await response.text()).not.toContain('"token"');
});

test('/me returns the logged-in user with the full schema and no credentials', async ({ auth, token }) => {
  const response = await auth.me(token);

  expect(response.status()).toBe(200);
  const body = await response.json();
  expectUserSchema(body);
  expect(body.username).toBe(username);
  expectNoSecretKeys(body, '/auth/api/me');
});

test.fail('KNOWN DEFECT: login with a non-string username returns 4xx, not 500', async ({ auth }) => {
  const response = await auth.login({ username: 123, password: 'x' }); // currently 500 + Werkzeug debugger page

  expect(response.status()).toBeGreaterThanOrEqual(400);
  expect(response.status()).toBeLessThan(500);
  expect(response.headers()['content-type']).toContain('application/json'); // not an HTML debugger page
  await expectNoSensitiveData(response);
  expect(await response.json()).not.toHaveProperty('token');
});

test.fail('KNOWN DEFECT: login with a non-string password returns 4xx, not 500', async ({ auth }) => {
  const response = await auth.login({ username: 'admin', password: ['x'] }); // currently 500 + Werkzeug debugger page

  expect(response.status()).toBeGreaterThanOrEqual(400);
  expect(response.status()).toBeLessThan(500);
  await expectNoSensitiveData(response);
  let token = null;
  try { token = (await response.json()).token; } catch { /* an HTML error page has no token */ }
  expect(token, 'no token must be granted').toBeFalsy();
});
