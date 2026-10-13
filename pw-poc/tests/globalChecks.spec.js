// Self-tests for the shared global checks (password echo, secret-shaped fields). They talk to a tiny local
// server that misbehaves on purpose, so the checks are proven without touching DIA.
const http = require('http');
const { test, expect } = require('../fixtures/api');
const { echoesPassword, secretFieldsIn } = require('../helpers/assertions');

let server;
let base;
test.beforeAll(async () => {
  server = http.createServer((req, res) => {
    let body = '';
    req.on('data', (chunk) => { body += chunk; });
    req.on('end', () => {
      res.setHeader('Content-Type', 'application/json');
      if (req.url === '/echo') res.end(body); // returns whatever it was sent, password included
      else if (req.url === '/secret') res.end('{"db_password": "x"}');
      else res.end('{"username": "demo", "email": "demo@dia.local"}'); // legitimate fields only
    });
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  base = `http://127.0.0.1:${server.address().port}`;
});
test.afterAll(async () => { await new Promise((resolve) => server.close(resolve)); });

test.describe('detection rules', () => {
  test('a password echoed under a "password" field is detected, compact or spaced', () => {
    expect(echoesPassword({ password: 'hunter2' }, '{"password":"hunter2"}')).toBe(true);
    expect(echoesPassword('{"password":"hunter2"}', '{"password": "hunter2"}')).toBe(true);
  });

  test('the same text in a legitimate field is NOT flagged (identical username and password)', () => {
    expect(echoesPassword({ username: 'demo', password: 'demo' }, '{"username": "demo", "email": "demo@dia.local"}')).toBe(false);
    expect(echoesPassword({ username: 'demo' }, '{"password": "demo"}')).toBe(false); // nothing was sent, so nothing to echo
  });

  test('secret-shaped field names are detected, ordinary fields are not', () => {
    for (const field of ['db_password', 'connection_string', 'secret', 'private_key']) {
      expect(secretFieldsIn(`{"${field}": "x"}`), field).toHaveLength(1);
    }
    expect(secretFieldsIn('{"secret_santa": 1, "password_policy": "x", "auth_provider": "local"}')).toEqual([]);
  });
});

test.describe('fixture wiring (real HTTP calls through the recorded context)', () => {
  test('a clean response produces no global problems', async ({ anonymous, checks }) => {
    await anonymous.post(`${base}/clean`, { data: { username: 'demo', password: 'demo' } });

    expect(await checks.problems()).toEqual([]);
  });

  test('an echoed password is reported by the fixture', async ({ anonymous, checks }) => {
    await anonymous.post(`${base}/echo`, { data: { username: 'u', password: 'hunter2' } });

    expect(await checks.problems()).toEqual([expect.stringContaining('echoes the submitted password')]);
    checks.reset(); // provoked on purpose, so do not fail this test at teardown
  });

  test('a secret-shaped field is reported by the fixture', async ({ anonymous, checks }) => {
    await anonymous.get(`${base}/secret`);

    expect(await checks.problems()).toEqual([expect.stringContaining('"db_password"')]);
    checks.reset();
  });
});
