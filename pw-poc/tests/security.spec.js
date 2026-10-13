const { test, expect } = require('../fixtures/api');
const { expectUnauthorized } = require('../helpers/assertions');

// Entries are [method, path, request body]. `anonymous` sends no Authorization header at all.
const send = (anonymous, [method, path, data]) => anonymous.fetch(path, { method, data });

// ---- Public by design -------------------------------------------------------------------------------------------

test('/health is public and reports the service healthy', async ({ anonymous }) => {
  const response = await anonymous.get('/health');

  expect(response.status()).toBe(200);
  const body = await response.json();
  expect(body).toMatchObject({ service: 'dia', status: 'healthy', version: expect.any(String), dependencies: expect.any(Object), degraded: expect.any(Array) });
  expect(Number.isNaN(Date.parse(body.timestamp)), 'timestamp is a valid date').toBe(false);
  expect(await response.text()).not.toMatch(/password|secret|token/i);
});

// ---- Protected endpoints: no token -> 401 "Authorization token required" ----------------------------------------

const protectedEndpoints = [
  ['GET', '/auth/api/me'],
  ['GET', '/api/datapilot/history?limit=1'],
  ['GET', '/api/tabs/history'],
  ['GET', '/api/tabs/stats'],
  ['GET', '/api/prompts/'],
  ['GET', '/api/fewshots/'],
  ['GET', '/api/jobs'],
  ['GET', '/api/mcp-servers'],
  ['GET', '/api/datapilot/dialects'],
  ['POST', '/api/datapilot/format', { sql: 'SELECT 1' }],
  ['POST', '/api/datapilot/validate', { sql: 'SELECT 1' }],
  ['POST', '/api/datapilot/check-safety', { sql: 'SELECT 1' }],
  ['POST', '/api/datapilot/explain', { connection_name: 'test-payroll', sql: 'SELECT 1' }],
];
for (const endpoint of protectedEndpoints) {
  test(`anonymous ${endpoint[0]} ${endpoint[1]} is rejected`, async ({ anonymous }) => {
    await expectUnauthorized(await send(anonymous, endpoint));
  });
}

// ---- Protected endpoints: bad token -> 401 "Invalid or expired token" -------------------------------------------

for (const path of ['/api/datapilot/history?limit=1', '/auth/api/me', '/api/tabs/history', '/api/prompts/']) {
  test(`a bad token is rejected: ${path}`, async ({ anonymous }) => {
    const response = await anonymous.get(path, { headers: { Authorization: 'Bearer invalid.token.value' } });

    await expectUnauthorized(response, 'Invalid or expired token');
  });
}

// ---- Endpoints that SHOULD require a token but currently answer anonymous callers --------------------------------
// test.fail = expected failure: when DIA fixes one, the test turns red and tells us to remove `.fail`.
// Write endpoints only ever receive an invalid body or a non-existent id, so nothing can be created or deleted.
const anonymousGaps = [
  // connections / repo
  ['GET', '/api/repo/connections'],
  ['GET', '/api/repo/connections/3'],
  ['GET', '/api/repo/connections/sidebar'],
  ['GET', '/api/repo/connections/search'],
  ['POST', '/api/repo/connections', {}],
  ['DELETE', '/api/repo/connections/999999999'],
  ['POST', '/api/repo/connections/upload', {}],
  ['GET', '/api/repo/query-history'],
  ['GET', '/api/repo/admin-stats'],
  ['GET', '/api/dashboard'],
  // LLM configuration (the key reveal returns a decrypted secret)
  ['GET', '/api/repo/llm-providers'],
  ['GET', '/api/repo/api-keys/999999999/reveal'],
  ['POST', '/api/repo/llm-providers', {}],
  ['POST', '/api/repo/llm-models', {}],
  ['POST', '/api/repo/api-keys', {}],
  // agents / chat
  ['GET', '/api/agents'],
  ['GET', '/api/agents/'],
  ['POST', '/api/agents/create', {}],
  ['GET', '/chat/providers'],
  ['GET', '/chat/prompts'],
  // application logs
  ['GET', '/api/logs/files'],
  ['GET', '/api/logs/content/app.log'],
  // semantic / knowledge graph
  ['GET', '/api/semantic'],
  ['GET', '/api/semantic/dashboard'],
  ['GET', '/api/semantic/physical-databases'],
  ['GET', '/api/connections/knowledge-graphs/overview'],
  ['GET', '/api/connections/9/knowledge-graph'],
  // Trino
  ['GET', '/api/trino/status'],
  ['GET', '/api/trino/config'],
  ['GET', '/api/trino/catalogs'],
  ['GET', '/api/trino/functions'],
  ['GET', '/api/trino/queries'],
  ['GET', '/api/trino/info'],
  ['GET', '/api/trino/catalog-configs'], // returns connector credentials
  ['POST', '/api/trino/validate-connection', {}],
  ['POST', '/api/trino/query', { sql: 'SELECT 1' }], // anonymous SQL execution
];
for (const endpoint of anonymousGaps) {
  test.fail(`KNOWN DEFECT: anonymous ${endpoint[0]} ${endpoint[1]} requires a token`, async ({ anonymous }) => {
    expect((await send(anonymous, endpoint)).status()).toBe(401);
  });
}

test.fail('KNOWN DEFECT: an invalid bearer token is rejected on /api/repo/connections', async ({ anonymous }) => {
  // the repo blueprint does not validate tokens at all: a garbage token is accepted
  const response = await anonymous.get('/api/repo/connections', { headers: { Authorization: 'Bearer invalid.token.value' } });

  expect(response.status()).toBe(401);
});
