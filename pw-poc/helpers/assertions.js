// Only the checks that are repeated across many tests. Ordinary expectations stay in the tests.
const { expect } = require('@playwright/test');

// DIA reports errors as {"error": "..."} or {"status":"error","message":"..."}.
async function expectError(response, status, message) {
  expect(response.status()).toBe(status);
  const body = await response.json();
  if (message !== undefined) expect(body.error ?? body.message).toBe(message);
}

async function expectUnauthorized(response, message = 'Authorization token required') {
  await expectError(response, 401, message);
}

// The response must not expose stack traces, driver/SQL internals or credentials.
async function expectNoSensitiveData(response) {
  const text = (await response.text()).toLowerCase();
  const leaks = ['traceback', 'werkzeug', '<!doctype', 'sqlalchemy', 'sqlalche.me', 'sqlite3.', 'psycopg2', 'asyncpg',
    '[sql:', 'operationalerror', 'programmingerror', 'trinousererror', 'has no attribute', 'jdbc:', 'connection-password'];
  for (const leak of leaks) expect(text, `response leaks "${leak}"`).not.toContain(leak);
}

// No field NAME in the payload looks like a credential.
function expectNoSecretKeys(payload, where = 'response') {
  const suspicious = /pass(word)?|secret|private_key|connection_string|api_key|token|hash/i;
  (function walk(value, path) {
    if (Array.isArray(value)) value.forEach((v, i) => walk(v, `${path}[${i}]`));
    else if (value && typeof value === 'object') {
      for (const [key, inner] of Object.entries(value)) {
        expect(suspicious.test(key), `secret-looking field "${key}" at ${where}${path}`).toBe(false);
        walk(inner, `${path}.${key}`);
      }
    }
  })(payload, '');
}

// ---- Global checks (applied to every response by the `checks` fixture) ----

// The submitted password must not come back as a "password" field (compact or spaced JSON).
function echoesPassword(requestData, responseText) {
  let sentPassword;
  try {
    const body = typeof requestData === 'string' ? JSON.parse(requestData) : requestData;
    sentPassword = body && body.password;
  } catch {
    sentPassword = undefined;
  }
  if (!sentPassword) return false;
  return responseText.includes(`"password":"${sentPassword}"`) || responseText.includes(`"password": "${sentPassword}"`);
}

// Common secret-shaped JSON fields must never appear in a response body.
const SECRET_PATTERNS = [/"db_password"\s*:/i, /"connection_string"\s*:/i, /"secret"\s*:/i, /"private_key"\s*:/i];
function secretFieldsIn(responseText) {
  return SECRET_PATTERNS.filter((p) => p.test(responseText)).map(String);
}

module.exports = { expectError, expectUnauthorized, expectNoSensitiveData, expectNoSecretKeys, echoesPassword, secretFieldsIn };
