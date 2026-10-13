// LLM configuration: the provider/model/API-key lists, input validation and unknown ids. Nothing here creates data.
// (The create/read/update/delete lifecycle with a throw-away provider is in llm.workflow.spec.js.)
const { test, expect } = require('../fixtures/api');
const { expectError, expectNoSensitiveData } = require('../helpers/assertions');

const UNKNOWN = 999999999;
// The repo endpoints answer errors as {"status": "error", "message": "..."}.
async function expectNotFound(response, message) {
  expect(response.status()).toBe(404);
  expect(await response.json()).toMatchObject({ status: 'error', message });
}

test('the LLM list has typed providers, models and keys, at most one default, and never returns key values', async ({ llm }) => {
  const response = await llm.list();

  expect(response.status()).toBe(200);
  const body = await response.json();
  expect(body.providers.length).toBeGreaterThan(0);
  for (const p of body.providers) {
    expect(p).toMatchObject({ id: expect.any(Number), name: expect.any(String), provider_type: expect.any(String), is_active: expect.any(Boolean), models_count: expect.any(Number) });
  }
  expect(body.models).toEqual(expect.any(Array));
  for (const m of body.models) expect(m).toMatchObject({ id: expect.any(Number), provider_id: expect.any(Number), name: expect.any(String) });
  expect(body.api_keys).toEqual(expect.any(Array));
  expect(body.providers.filter((p) => p.is_default).length).toBeLessThanOrEqual(1);
  for (const key of body.api_keys) expect(key, 'API key values are masked in the list').not.toHaveProperty('key_value');
});

// ---- validation: every one is rejected before anything is stored ---------------------------------------------------

const invalidProviders = [
  { name: 'a missing name', data: { provider_type: 'openai' }, error: 'Provider name is required' },
  { name: 'a missing provider_type', data: { name: 'zz-validation-only' }, error: 'Provider type is required' },
];
for (const { name, data, error } of invalidProviders) {
  test(`creating a provider with ${name} is rejected`, async ({ llm }) => {
    await expectError(await llm.createProvider(data), 400, error);
  });
}

const invalidKeys = [
  { name: 'a missing provider_id', data: { key_name: 'k', key_value: 'v' }, error: 'provider_id is required' },
  { name: 'a missing key_name', data: { provider_id: 1, key_value: 'v' }, error: 'key_name is required' },
  { name: 'a missing key_value', data: { provider_id: 1, key_name: 'k' }, error: 'key_value is required' },
];
for (const { name, data, error } of invalidKeys) {
  test(`creating an API key with ${name} is rejected`, async ({ llm }) => {
    await expectError(await llm.createApiKey(data), 400, error); // rejected before any database access
  });
}

test.fail('KNOWN DEFECT: creating a provider with a non-string name is a 4xx and shows no debugger page', async ({ llm }) => {
  const response = await llm.createProvider({ name: 123, provider_type: 'openai' }); // currently 500 + Werkzeug debugger

  expect(response.status()).toBeGreaterThanOrEqual(400);
  expect(response.status()).toBeLessThan(500);
  await expectNoSensitiveData(response);
});

test.fail('KNOWN DEFECT: creating a model without provider_id is a 4xx and does not leak database internals', async ({ llm }) => {
  const response = await llm.createModel({}); // currently 500 with the raw psycopg2 NotNullViolation

  expect(response.status()).toBeGreaterThanOrEqual(400);
  expect(response.status()).toBeLessThan(500);
  await expectNoSensitiveData(response);
});

// ---- unknown ids (non-existent, so nothing can be changed) ---------------------------------------------------------

const unknownIds = [
  { name: 'get an LLM provider', call: (l) => l.getProvider(UNKNOWN), message: 'Provider not found' },
  { name: 'update an LLM provider', call: (l) => l.updateProvider(UNKNOWN, { description: 'x' }), message: 'Provider not found' },
  { name: 'delete an LLM provider', call: (l) => l.deleteProvider(UNKNOWN), message: 'Provider not found' },
  { name: 'get an LLM model', call: (l) => l.getModel(UNKNOWN), message: 'Model not found' },
  { name: 'update an LLM model', call: (l) => l.updateModel(UNKNOWN, { description: 'x' }), message: 'Model not found' },
  { name: 'delete an LLM model', call: (l) => l.deleteModel(UNKNOWN), message: 'Model not found' },
  { name: 'get an API key', call: (l) => l.getApiKey(UNKNOWN), message: 'API key not found' },
  { name: 'update an API key', call: (l) => l.updateApiKey(UNKNOWN, { description: 'x' }), message: 'API key not found' },
  { name: 'delete an API key', call: (l) => l.deleteApiKey(UNKNOWN), message: 'API key not found' },
  { name: 'reveal an API key', call: (l) => l.revealApiKey(UNKNOWN), message: 'API key not found' },
];
for (const { name, call, message } of unknownIds) {
  test(`${name} with an unknown id is a 404`, async ({ llm }) => {
    await expectNotFound(await call(llm), message);
  });
}
