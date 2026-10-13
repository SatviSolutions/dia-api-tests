// LLM configuration lifecycle.
// A throw-away NON-default provider (pointing at a closed local port, so no model is ever called), one model and one
// dummy API key are created, exercised and removed in reverse order. The real Ollama provider is never touched.
const { test, expect } = require('../fixtures/api');
const { LlmClient } = require('../clients/llmClient');

test.describe.configure({ mode: 'serial' });

const name = `zz-api-pw-llm-${Date.now()}`;
const secret = `dummy-not-a-real-key-${Date.now()}`;
let providerId, modelId, keyId;
let defaultBefore; // the default provider's id before the workflow

async function expectNotFound(response, message) {
  expect(response.status()).toBe(404);
  expect(await response.json()).toMatchObject({ status: 'error', message });
}

test.afterAll(async ({ api }) => {
  const llm = new LlmClient(api); // reverse order; 404s are fine when a delete step already ran
  if (keyId) await llm.deleteApiKey(keyId);
  if (modelId) await llm.deleteModel(modelId);
  if (providerId) await llm.deleteProvider(providerId);
  const { providers, models, api_keys } = await (await llm.list()).json();
  expect(providers.map((p) => p.id), 'throw-away provider removed').not.toContain(providerId);
  expect(models.map((m) => m.id), 'throw-away model removed').not.toContain(modelId);
  expect(api_keys.map((k) => k.id), 'throw-away key removed').not.toContain(keyId);
});

test('create a throw-away provider (non-default)', async ({ llm }) => {
  defaultBefore = (await (await llm.list()).json()).providers.find((p) => p.is_default)?.id;

  const response = await llm.createProvider({ name, provider_type: 'openai', base_url: 'http://127.0.0.1:9/v1', description: 'api-test throw-away' });

  expect(response.status()).toBe(201);
  const body = await response.json();
  expect(body).toMatchObject({ success: true, id: expect.any(Number), name });
  providerId = body.id;
});

test('read the provider back', async ({ llm }) => {
  const response = await llm.getProvider(providerId);

  expect(response.status()).toBe(200);
  const body = await response.json();
  expect(body.status).toBe('success');
  expect(body.provider).toMatchObject({ id: providerId, name, provider_type: 'openai', is_default: false, is_active: true });
});

test('create a model under the provider', async ({ llm }) => {
  const response = await llm.createModel({ provider_id: providerId, name: 'zz-model', display_name: 'ZZ Model', model_type: 'chat' });

  expect(response.status()).toBe(200);
  const body = await response.json();
  expect(body.status).toBe('success');
  expect(body.model).toMatchObject({ provider_id: providerId, name: 'zz-model', is_default: false });
  modelId = body.model.id;
});

test('the model appears in the combined list and the provider counts it', async ({ llm }) => {
  const { providers, models } = await (await llm.list()).json();

  expect(models.find((m) => m.id === modelId)).toMatchObject({ provider_id: providerId });
  expect(providers.find((p) => p.id === providerId).models_count).toBe(1);
});

test('update the model', async ({ llm }) => {
  const response = await llm.updateModel(modelId, { description: 'updated by api test' });

  expect(response.status()).toBe(200);
  const body = await response.json();
  expect(body.status).toBe('success');
  expect(body.model).toMatchObject({ description: 'updated by api test', name: 'zz-model' });
});

test('create an API key with a dummy secret', async ({ llm }) => {
  const response = await llm.createApiKey({ provider_id: providerId, key_name: 'zz-key', key_value: secret });

  expect(response.status()).toBe(201);
  const body = await response.json();
  expect(body).toMatchObject({ success: true, id: expect.any(Number) });
  keyId = body.id;
});

test('reading the key returns only a masked value, never the secret', async ({ llm }) => {
  const response = await llm.getApiKey(keyId);

  expect(response.status()).toBe(200);
  const body = await response.json();
  expect(body.status).toBe('success');
  expect(body.api_key).toMatchObject({ key_name: 'zz-key', provider_id: providerId });
  expect(body.api_key).not.toHaveProperty('key_value');
  expect(body.api_key.key_value_masked).toEqual(expect.stringContaining('*'));
  expect(await response.text()).not.toContain(secret);
});

test.fail('KNOWN DEFECT: revealing the key without a token is rejected and the secret is not returned', async ({ anonymous }) => {
  const response = await new LlmClient(anonymous).revealApiKey(keyId); // currently 200 and returns the decrypted dummy secret

  expect(response.status()).toBe(401);
  expect(await response.text()).not.toContain(secret);
});

test('revealing the key with a token round-trips the stored secret', async ({ llm }) => {
  const response = await llm.revealApiKey(keyId);

  expect(response.status()).toBe(200);
  const body = await response.json();
  expect(body.status).toBe('success');
  expect(body.key_id).toBe(keyId);
  expect(body.key_value === secret, 'the revealed value equals the stored dummy secret').toBe(true);
});

test('update the key description; the secret stays masked', async ({ llm }) => {
  const response = await llm.updateApiKey(keyId, { description: 'rotated' });

  expect(response.status()).toBe(200);
  const body = await response.json();
  expect(body.status).toBe('success');
  expect(body.api_key.description).toBe('rotated');
  expect(body.api_key).not.toHaveProperty('key_value');
});

test('delete the API key', async ({ llm }) => {
  const response = await llm.deleteApiKey(keyId);

  expect(response.status()).toBe(200);
  expect((await response.json()).status).toBe('success');
});

test('deleting the key again is a 404', async ({ llm }) => {
  await expectNotFound(await llm.deleteApiKey(keyId), 'API key not found');
});

test('delete the model', async ({ llm }) => {
  const response = await llm.deleteModel(modelId);

  expect(response.status()).toBe(200);
  expect((await response.json()).status).toBe('success');
});

test('delete the provider', async ({ llm }) => {
  const response = await llm.deleteProvider(providerId);

  expect(response.status()).toBe(200);
  expect((await response.json()).status).toBe('success');
});

test('the deleted provider is a 404', async ({ llm }) => {
  await expectNotFound(await llm.getProvider(providerId), 'Provider not found');
});

test('the default provider is unchanged and the throw-away provider is gone', async ({ llm }) => {
  const { providers } = await (await llm.list()).json();

  expect(providers.filter((p) => p.is_default)).toHaveLength(1);
  expect(providers.find((p) => p.is_default).id, 'default provider is the same one as before').toBe(defaultBefore);
  expect(providers.map((p) => p.id)).not.toContain(providerId);
});
