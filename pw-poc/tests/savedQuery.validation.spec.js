// Saved-query input validation and authentication (the create/update/delete lifecycle is in savedQuery.workflow.spec.js).
const { test, expect } = require('../fixtures/api');
const { expectError, expectNoSensitiveData } = require('../helpers/assertions');
const { DataPilotClient } = require('../clients/datapilotClient');

const invalidCreates = [
  { name: 'missing name', data: { sql_text: 'SELECT 1' }, error: 'name is required' },
  { name: 'whitespace-only name', data: { name: '   ', sql_text: 'SELECT 1' }, error: 'name is required' },
  { name: 'missing sql_text', data: { name: 'zz-validation-only' }, error: 'sql_text is required' },
  { name: 'invalid visibility', data: { name: 'zz-validation-only', sql_text: 'SELECT 1', visibility: 'bogus' }, error: 'visibility must be one of private, everyone' },
];
for (const { name, data, error } of invalidCreates) {
  test(`create rejects ${name}`, async ({ datapilot }) => {
    const response = await datapilot.createSavedQuery(data);

    await expectError(response, 400, error);
    expect(await response.json(), 'nothing was created').not.toHaveProperty('id');
  });
}

test.fail('KNOWN DEFECT: create with a non-string name is a 4xx and does not leak Python internals', async ({ datapilot }) => {
  const response = await datapilot.createSavedQuery({ name: 123, sql_text: 'SELECT 1' }); // currently 500

  expect(response.status()).toBeGreaterThanOrEqual(400);
  expect(response.status()).toBeLessThan(500);
  await expectNoSensitiveData(response);
});

test.describe('authentication', () => {
  test('list, create and delete without a token are rejected', async ({ anonymous }) => {
    const dp = new DataPilotClient(anonymous);

    await expectError(await dp.listSavedQueries(), 401, 'Authorization token required');
    await expectError(await dp.createSavedQuery({ name: 'x', sql_text: 'SELECT 1' }), 401, 'Authorization token required');
    await expectError(await dp.deleteSavedQuery(1), 401, 'Authorization token required');
  });
});
