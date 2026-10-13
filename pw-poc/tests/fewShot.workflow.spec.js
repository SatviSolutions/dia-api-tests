// Few-shot set lifecycle.
// Only a uniquely named set of its own is created, changed and removed; the seeded sets are never touched.
const { test, expect } = require('../fixtures/api');
const { expectError } = require('../helpers/assertions');
const { FewShotsClient } = require('../clients/fewShotsClient');

test.describe.configure({ mode: 'serial' });

const name = `zz-api-pw-fewshot-${Date.now()}`;
let id;

// Deleting a set that still has examples fails (known defect), so the clean-up empties the set first.
async function removeSet(fewshots) {
  await fewshots.save({ id, name, examples: [] });
  return fewshots.delete(id);
}

test.afterAll(async ({ api }) => {
  const fewshots = new FewShotsClient(api);
  if (id && (await fewshots.get(id)).status() === 200) await removeSet(fewshots);
  const remaining = (await (await fewshots.list()).json()).data.map((s) => s.id);
  expect(remaining, 'throw-away few-shot set was cleaned up').not.toContain(id);
});

test('create a set with two examples', async ({ fewshots }) => {
  const response = await fewshots.save({
    name, description: 'api-test throw-away', tags: 'api-test',
    examples: [{ input_text: 'q1', output_text: 'a1' }, { input_text: 'q2', output_text: 'a2', weight: 2 }],
  });

  expect(response.status()).toBe(200);
  const body = await response.json();
  expect(body).toMatchObject({ success: true, id: expect.any(Number) });
  id = body.id;
});

test('read the set: fields and the ordered examples round-trip', async ({ fewshots }) => {
  const response = await fewshots.get(id);

  expect(response.status()).toBe(200);
  const body = await response.json();
  expect(body.fs_set).toMatchObject({ name, tags: 'api-test' });
  expect(body.examples).toHaveLength(2);
  expect(body.examples[0]).toMatchObject({ input_text: 'q1', position: 0 });
  expect(body.examples[1]).toMatchObject({ output_text: 'a2', weight: 2 });
});

test('update the set: rename and replace the examples', async ({ fewshots }) => {
  const response = await fewshots.save({ id, name: `${name}-v2`, examples: [{ input_text: 'q1', output_text: 'a1' }] });

  expect(response.status()).toBe(200);
  expect(await response.json()).toMatchObject({ success: true, id });
});

test('the update is reflected in the list', async ({ fewshots }) => {
  const set = (await (await fewshots.list()).json()).data.find((s) => s.id === id);

  expect(set).toMatchObject({ name: `${name}-v2`, example_count: 1 });
});

test.fail('KNOWN DEFECT: deleting a set that still has examples succeeds and shows no debugger page', async ({ fewshots }) => {
  const response = await fewshots.delete(id); // currently 500 + Werkzeug debugger page

  expect(response.status()).toBe(200);
  expect(await response.text()).not.toContain('<!doctype');
});

test('work-around clean-up: empty the set, then delete it', async ({ fewshots }) => {
  const emptied = await fewshots.save({ id, name: `${name}-v2`, examples: [] });
  expect([200, 404], 'examples cleared (or the set is already gone if the defect is fixed)').toContain(emptied.status());

  const deleted = await fewshots.delete(id);
  expect([200, 404], 'empty set deleted (or already gone)').toContain(deleted.status());
});

test('the set is gone', async ({ fewshots }) => {
  await expectError(await fewshots.get(id), 404, 'Few-shot set not found');
});
