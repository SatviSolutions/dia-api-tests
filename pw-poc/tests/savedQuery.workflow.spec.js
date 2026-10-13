// Lifecycle (chained) workflow: create, list, execute, update, delete, verify gone.
// Serial: each step uses the id created by the first one. Cleanup always runs.
const { test, expect } = require('../fixtures/api');
const { expectError } = require('../helpers/assertions');
const { DataPilotClient } = require('../clients/datapilotClient');

test.describe.configure({ mode: 'serial' });

const connection_name = 'test-payroll';
const sql_text = 'SELECT 1 AS n UNION ALL SELECT 2';
const name = `zz-api-pw-${Date.now()}`; // unique per run, so reruns never collide
let id; // captured from the create step and used by every later step

const findOwn = async (datapilot) => (await (await datapilot.listSavedQueries()).json()).find((q) => q.id === id);

test.afterAll(async ({ api }) => {
  if (id) await new DataPilotClient(api).deleteSavedQuery(id); // no-op (404) when the delete step already ran
});

test('create a saved query', async ({ datapilot }) => {
  const response = await datapilot.createSavedQuery({ name, sql_text, visibility: 'private' });

  expect(response.status()).toBe(201);
  const body = await response.json();
  expect(body).toMatchObject({ id: expect.any(Number), name, sql_text, visibility: 'private', is_mine: true, can_edit: true });
  id = body.id;
});

test('the new query appears in the list', async ({ datapilot }) => {
  expect(await findOwn(datapilot)).toMatchObject({ name, is_mine: true, is_shared: false });
});

test('the saved SQL executes and returns its rows', async ({ datapilot }) => {
  const response = await datapilot.execute({ connection_name, sql: sql_text });

  const body = await response.json();
  expect(body.status).toBe('success');
  expect(body.row_count).toBe(2);
});

test.fail('KNOWN DEFECT: executing with saved_query_id succeeds', async ({ datapilot }) => {
  // currently a PostgreSQL foreign-key violation on query_execution_logs, with the INSERT leaked
  const response = await datapilot.execute({ connection_name, sql: sql_text, saved_query_id: id });

  expect((await response.json()).status).toBe('success');
});

test('rename and share the query', async ({ datapilot }) => {
  const response = await datapilot.updateSavedQuery(id, { name: `${name}-renamed`, visibility: 'everyone' });

  expect(response.status()).toBe(200);
  expect(await response.json()).toMatchObject({ id, name: `${name}-renamed`, visibility: 'everyone', sql_text });
});

test('the update is persisted', async ({ datapilot }) => {
  expect(await findOwn(datapilot)).toMatchObject({ name: `${name}-renamed`, visibility: 'everyone', is_shared: true });
});

test('delete the query', async ({ datapilot }) => {
  const response = await datapilot.deleteSavedQuery(id);

  expect(response.status()).toBe(200);
  expect((await response.json()).success).toBe(true);
});

test('the deleted query is gone from the list', async ({ datapilot }) => {
  expect(await findOwn(datapilot)).toBeUndefined();
});

test('deleting it again is a 404', async ({ datapilot }) => {
  await expectError(await datapilot.deleteSavedQuery(id), 404, 'Query not found');
});

test('updating the deleted query is a 404', async ({ datapilot }) => {
  await expectError(await datapilot.updateSavedQuery(id, { name: 'zz' }), 404, 'Query not found');
});
