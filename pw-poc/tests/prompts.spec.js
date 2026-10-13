// Prompt templates and few-shot sets: reads, validation and unknown ids. Seeded prompts/sets are only read.
// (The create/update/delete lifecycles are in prompt.workflow.spec.js and fewShot.workflow.spec.js.)
const { test, expect } = require('../fixtures/api');
const { expectError, expectUnauthorized } = require('../helpers/assertions');
const { PromptsClient } = require('../clients/promptsClient');
const { FewShotsClient } = require('../clients/fewShotsClient');

// ---- prompts --------------------------------------------------------------------------------------------------------

test('the prompt list has typed summaries', async ({ prompts }) => {
  const response = await prompts.list();

  expect(response.status()).toBe(200);
  const { data } = await response.json();
  expect(data.length).toBeGreaterThan(0);
  for (const p of data) expect(p).toMatchObject({ id: expect.any(Number), name: expect.any(String), type: expect.any(String), role: expect.any(String), version: expect.any(String) });
});

test('an existing prompt has its template and metadata', async ({ prompts }) => {
  const response = await prompts.get(1);

  expect(response.status()).toBe(200);
  const { prompt } = await response.json();
  expect(prompt.id).toBe(1);
  expect(prompt.name).toEqual(expect.any(String));
  expect(prompt.template_text.length).toBeGreaterThan(0);
  expect(prompt.renderer).toEqual(expect.any(String));
});

test('a prompt with an unknown id is a 404', async ({ prompts }) => {
  await expectError(await prompts.get(999999999), 404, 'Prompt not found');
});

// Every body below is rejected before anything is stored.
const invalidPrompts = [
  { name: 'without a name', data: {}, check: (e) => expect(e).toBe('Prompt name is required') },
  { name: 'without template_text', data: { name: 'zz-validation-only' }, check: (e) => expect(e).toBe('Template text is required') },
  { name: 'without its required fields', data: { name: 'zz-validation-only', template_text: 'x' }, check: (e) => { expect(e).toContain('Missing required fields'); expect(e).toContain('type'); } },
  { name: 'with invalid schema JSON', data: { name: 'zz-validation-only', template_text: 'x', input_schema_json: '{not json' }, check: (e) => expect(e).toContain('Invalid JSON for input_schema_json') },
];
for (const { name, data, check } of invalidPrompts) {
  test(`saving a prompt ${name} is rejected`, async ({ prompts }) => {
    const response = await prompts.save(data);

    expect(response.status()).toBe(400);
    check((await response.json()).error);
  });
}

test('deleting an unknown prompt is a 404', async ({ prompts }) => {
  await expectError(await prompts.delete(999999999), 404, 'Prompt not found');
});

test('previewing an unknown prompt is a 404', async ({ prompts }) => {
  await expectError(await prompts.preview(999999999), 404, 'not found');
});

// ---- few-shot sets ----------------------------------------------------------------------------------------------------

test('the few-shot list has typed sets with example counts', async ({ fewshots }) => {
  const response = await fewshots.list();

  expect(response.status()).toBe(200);
  const { data } = await response.json();
  expect(data).toEqual(expect.any(Array));
  for (const s of data) expect(s).toMatchObject({ id: expect.any(Number), name: expect.any(String), example_count: expect.any(Number) });
});

test('a few-shot set with an unknown id is a 404', async ({ fewshots }) => {
  await expectError(await fewshots.get(999999999), 404, 'Few-shot set not found');
});

const invalidSets = [
  { name: 'without a name', data: {}, error: 'Set name is required' },
  { name: 'with examples that are not a list', data: { name: 'zz-validation-only', examples: 'x' }, error: 'examples must be a list' },
  { name: 'with an example missing its output', data: { name: 'zz-validation-only', examples: [{ input_text: 'q' }] }, error: 'Example 1 is missing its input or output' },
  { name: 'with an example that is not an object', data: { name: 'zz-validation-only', examples: ['str'] }, error: 'Example 1 must be an object' },
];
for (const { name, data, error } of invalidSets) {
  test(`saving a few-shot set ${name} is rejected`, async ({ fewshots }) => {
    await expectError(await fewshots.save(data), 400, error);
  });
}

test('updating an unknown few-shot set is a 404', async ({ fewshots }) => {
  await expectError(await fewshots.save({ id: 999999999, name: 'zz' }), 404, 'Set not found');
});

test('deleting an unknown few-shot set is a 404', async ({ fewshots }) => {
  await expectError(await fewshots.delete(999999999), 404, 'Set not found');
});

test('saving a few-shot set or a prompt without a token is rejected', async ({ anonymous }) => {
  await expectUnauthorized(await new FewShotsClient(anonymous).save({}));
  await expectUnauthorized(await new PromptsClient(anonymous).save({}));
});
