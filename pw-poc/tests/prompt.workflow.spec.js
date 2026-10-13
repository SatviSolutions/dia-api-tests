// Prompt-template lifecycle.
// Only a uniquely named prompt of its own is created, changed and deleted; the seeded prompts are never modified.
const { test, expect } = require('../fixtures/api');
const { expectError } = require('../helpers/assertions');
const { PromptsClient } = require('../clients/promptsClient');

test.describe.configure({ mode: 'serial' });

const name = `zz-api-pw-prompt-${Date.now()}`;
const fields = { name, type: 'sql', renderer: 'format', role: 'system' };
const created = []; // every prompt id this file may have created (the happy path and the known-defect save)
let id;

test.afterAll(async ({ api }) => {
  const prompts = new PromptsClient(api);
  for (const promptId of created) await prompts.delete(promptId); // 404 when already deleted
  const remaining = (await (await prompts.list()).json()).data.map((p) => p.id);
  for (const promptId of created) expect(remaining, `prompt ${promptId} was cleaned up`).not.toContain(promptId);
});

test('create a prompt', async ({ prompts }) => {
  const response = await prompts.save({ ...fields, template_text: 'Hello {name}' });

  expect(response.status()).toBe(200);
  const body = await response.json();
  expect(body).toMatchObject({ success: true, id: expect.any(Number) });
  id = body.id;
  created.push(id);
});

test('read it back: the stored template and fields match', async ({ prompts }) => {
  const response = await prompts.get(id);

  expect(response.status()).toBe(200);
  expect((await response.json()).prompt).toMatchObject({ id, name, template_text: 'Hello {name}', type: 'sql', renderer: 'format' });
});

test('update the template in place', async ({ prompts }) => {
  const response = await prompts.save({ id, ...fields, template_text: 'Goodbye {name}' });

  expect(response.status()).toBe(200);
  expect(await response.json()).toMatchObject({ success: true, id });
});

test('the prompt update is persisted', async ({ prompts }) => {
  expect((await (await prompts.get(id)).json()).prompt.template_text).toBe('Goodbye {name}');
});

test('delete the prompt', async ({ prompts }) => {
  const response = await prompts.delete(id);

  expect(response.status()).toBe(200);
  expect((await response.json()).success).toBe(true);
});

test('the deleted prompt is a 404', async ({ prompts }) => {
  await expectError(await prompts.get(id), 404, 'Prompt not found');
});

test('deleting the prompt again is a 404', async ({ prompts }) => {
  await expectError(await prompts.delete(id), 404, 'Prompt not found');
});

test.fail('KNOWN DEFECT: saving a prompt with variables succeeds and leaks no database internals', async ({ prompts }) => {
  const response = await prompts.save({ ...fields, name: `${name}-vars`, template_text: 'Hello {name}', variables: [{ name: 'name', dtype: 'string' }] });
  const body = await response.json().catch(() => ({})); // currently 500: column "required" is boolean but an integer is supplied
  if (body.id) created.push(body.id); // remembered BEFORE asserting, so afterAll always removes it

  expect(response.status()).toBe(200);
  expect(JSON.stringify(body).toLowerCase()).not.toMatch(/psycopg2|datatypemismatch|\[sql:/);
});
