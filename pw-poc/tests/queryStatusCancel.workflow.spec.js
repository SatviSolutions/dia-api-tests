// Query status and cancel: execute a query, then check its status, try to cancel it
// after it has completed, and confirm the completed query stays recorded as a success.
const { test, expect } = require('../fixtures/api');

test.describe.configure({ mode: 'serial' });

const connection_name = 'test-payroll';
let queryLogId;

test('execute a query', async ({ datapilot }) => {
  const response = await datapilot.execute({ connection_name, sql: 'SELECT * FROM main.salespeople' });

  expect(response.status()).toBe(200);
  const body = await response.json();
  expect(body.status).toBe('success');
  queryLogId = body.query_log_id;
});

test.fail('KNOWN DEFECT: status of the completed query answers 200 and reports success', async ({ datapilot }) => {
  const response = await datapilot.status(queryLogId); // currently 500 for every id

  expect(response.status()).toBe(200);
  expect(JSON.stringify(await response.json()).toLowerCase()).toContain('success');
});

test('cancelling an already-completed query is refused', async ({ datapilot }) => {
  const response = await datapilot.cancel(queryLogId);

  expect(response.status()).toBe(400);
  const body = await response.json();
  expect(body.success).toBe(false);
  expect(body.message).toContain('already completed');
});

test('the completed query is still recorded as a success in history', async ({ datapilot }) => {
  const history = await (await datapilot.history({ limit: 20 })).json();

  expect(history.find((h) => h.id === queryLogId)).toMatchObject({ status: 'success' });
});
