// Chat configuration reads: the provider list and the system prompt. Plain HTTP reads only: no WebSocket, no LLM call and no
// chat message is ever sent. (The anonymous-access defects for these two endpoints are in security.spec.js.)
const { test, expect } = require('../fixtures/api');

test('the chat providers payload has a default provider and well-formed providers', async ({ chat }) => {
  const response = await chat.providers();

  expect(response.status()).toBe(200);
  const body = await response.json();
  expect(body.success).toBe(true);
  expect(body.providers.default_provider).toEqual(expect.any(String));
  expect(body.providers.providers.length).toBeGreaterThan(0);
  for (const p of body.providers.providers) {
    expect(p.id).toEqual(expect.any(String));
    expect(p.label).toEqual(expect.any(String));
    expect(p.models).toEqual(expect.any(Array));
  }
  expect(body.providers.providers.map((p) => p.id), 'the default provider is one of the listed providers').toContain(body.providers.default_provider);
});

test('the chat prompts payload carries the system prompt metadata', async ({ chat }) => {
  const response = await chat.prompts();

  expect(response.status()).toBe(200);
  const { prompts } = await response.json();
  expect(prompts.system_prompt.exists).toEqual(expect.any(Boolean));
  expect(prompts.system_prompt.text).toEqual(expect.any(String));
});
