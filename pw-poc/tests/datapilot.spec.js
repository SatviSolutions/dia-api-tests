const { test, expect } = require('../fixtures/api');
const { DataPilotClient } = require('../clients/datapilotClient');
const { expectError, expectNoSensitiveData } = require('../helpers/assertions');

const ORDER_SKEW_MS = 1000;
const HISTORY_FIELDS = { id: 'number', connection_name: 'string', database_name: 'string', db_type: 'string', duration: 'string',
  executed_at: 'string', executed_by: 'string', execution_time_ms: 'number', sql_text: 'string', status: 'string' };

const connection_name = 'test-payroll'; // read-only SQLite fixture
const THREE_ROWS = 'SELECT 1 AS n UNION ALL SELECT 2 UNION ALL SELECT 3';

test('execute returns exactly the rows the database computes', async ({ datapilot }) => {
  const response = await datapilot.execute({ connection_name, sql: THREE_ROWS });

  expect(response.status()).toBe(200);
  const body = await response.json();
  expect(body.status).toBe('success');
  expect(body.row_count).toBe(3);
  expect(body.data.map((row) => row.n)).toEqual([1, 2, 3]);
  expect(body.column_types.n).toBe('number');
  expect(body).toMatchObject({ execution_time_ms: expect.any(Number), has_more: expect.any(Boolean), query_log_id: expect.any(Number) });
});

test('execute on a real table returns columns, column_types and a consistent row_count', async ({ datapilot }) => {
  const response = await datapilot.execute({ connection_name, sql: 'SELECT * FROM main.salespeople' });

  expect(response.status()).toBe(200);
  const body = await response.json();
  expect(body.status).toBe('success');
  expect(body.columns.length).toBeGreaterThan(0);
  expect(body.column_types).toEqual(expect.any(Object));
  expect(body.data).toEqual(expect.any(Array));
  expect(body.row_count).toBe(body.data.length);
  expect(body.query_log_id).toEqual(expect.any(Number));
});

test('count equals the row count the execute step reported', async ({ datapilot }) => {
  const sql = 'SELECT * FROM main.salespeople';
  const executed = await (await datapilot.execute({ connection_name, sql })).json();

  const response = await datapilot.count({ query_log_id: executed.query_log_id, connection_name, sql });

  expect(response.status()).toBe(200);
  const body = await response.json();
  expect(body.total_row_count).toEqual(expect.any(Number));
  expect(body.total_row_count).toBe(executed.row_count);
  expect(body.from_cache).toEqual(expect.any(Boolean));
});

test('history contains a just-executed query with its connection, status and db type', async ({ datapilot }) => {
  const sql = `SELECT ${Date.now()} AS marker`; // unique, so this test finds its own row
  await datapilot.execute({ connection_name, sql });

  const response = await datapilot.history({ limit: 5 });

  expect(response.status()).toBe(200);
  const history = await response.json();
  expect(history.length).toBeLessThanOrEqual(5);
  expect(history.find((h) => h.sql_text === sql)).toMatchObject({ connection_name, status: 'success', db_type: 'sqlite' });
});

for (const limit of [1, 10, 50]) {
  test(`history limit=${limit}: size, field types, newest-first order and non-empty sql`, async ({ datapilot }) => {
    const response = await datapilot.history({ limit });

    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toContain('application/json');
    const history = await response.json();
    expect(history).toEqual(expect.any(Array));
    expect(history.length).toBeLessThanOrEqual(limit);
    for (const item of history) {
      for (const [field, type] of Object.entries(HISTORY_FIELDS)) expect(typeof item[field], `${field} of history item ${item.id}`).toBe(type);
      expect(item.sql_text.length, `sql_text of history item ${item.id}`).toBeGreaterThan(0);
    }
    // DIA sorts history by log id (assigned when a query starts) while executed_at is when it finished. Run one query at a
    // time and the two agree; with tests running in parallel, overlapping queries can finish out of start order by
    // a few milliseconds. So: ids must be strictly newest-first, and executed_at newest-first within a small skew.
    for (let i = 1; i < history.length; i++) {
      expect(history[i - 1].id, 'history is ordered newest-first by id').toBeGreaterThan(history[i].id);
      expect(new Date(history[i - 1].executed_at).getTime() + ORDER_SKEW_MS, 'executed_at is newest-first (within the concurrency skew)')
        .toBeGreaterThanOrEqual(new Date(history[i].executed_at).getTime());
    }
  });
}

for (const limit of ['0', '-1']) {
  test(`history rejects limit=${limit}`, async ({ datapilot }) => {
    const response = await datapilot.history({ limit });

    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body).toEqual({ error: expect.any(String) }); // a JSON error object, nothing else
    expect(body.error).toContain('limit');
    expect(body.error).toContain('greater than 0');
    await expectNoSensitiveData(response);
  });
}

test('history rejects a non-numeric limit', async ({ datapilot }) => {
  const response = await datapilot.history({ limit: 'abc' }); // used to be a 500 defect; the backend now returns 400

  expect(response.status()).toBe(400);
  expect((await response.json()).error).toContain('limit');
  await expectNoSensitiveData(response);
});

test('a query against a missing table is reported as a failure', async ({ datapilot }) => {
  const response = await datapilot.execute({ connection_name, sql: 'SELECT * FROM main.no_such_table_xyz' });

  expect(response.status()).toBe(200);
  const body = await response.json();
  expect(body.status).toBe('failure');
  expect(body.error).toBeTruthy();
  expect(body).not.toHaveProperty('data');
});

const invalidRequests = [
  { name: 'empty sql', body: { connection_name, sql: '   ' }, error: 'sql query is required' },
  { name: 'missing sql', body: { connection_name }, error: 'sql query is required' },
  { name: 'missing connection_name', body: { sql: 'SELECT 1' }, error: 'connection_name is required' },
  { name: 'empty connection_name', body: { connection_name: '', sql: 'SELECT 1' }, error: 'connection_name is required' },
];
for (const { name, body, error } of invalidRequests) {
  test(`execute rejects ${name}`, async ({ datapilot }) => {
    await expectError(await datapilot.execute(body), 400, error);
  });
}

test('execute with an empty body reports an error message', async ({ datapilot }) => {
  const response = await datapilot.execute({});

  expect(response.status()).toBe(400);
  expect((await response.json()).error).toEqual(expect.stringMatching(/.+/));
});

test('a query with no matching rows succeeds with zero rows but still reports its columns', async ({ datapilot }) => {
  const body = await (await datapilot.execute({ connection_name, sql: 'SELECT 1 AS n WHERE 1=0' })).json();

  expect(body).toMatchObject({ status: 'success', row_count: 0, data: [], columns: ['n'] });
});

test('include_total adds the total row count', async ({ datapilot }) => {
  const response = await datapilot.execute({ connection_name, sql: THREE_ROWS, include_total: true });

  expect(response.status()).toBe(200);
  expect((await response.json()).total_row_count).toBe(3);
});

test('stacked statements are not executed', async ({ datapilot }) => {
  const body = await (await datapilot.execute({ connection_name, sql: 'SELECT 1; SELECT 2' })).json();

  expect(body.status).not.toBe('success');
  expect(body).not.toHaveProperty('data');
});

test('an unknown connection is reported as a failure that names it, without internals', async ({ datapilot }) => {
  const response = await datapilot.execute({ connection_name: 'totally-fake-connection-xyz', sql: 'SELECT 1' });

  expect(response.status()).toBe(200); // DIA reports well-formed-but-failed requests in the body, not with a 4xx
  const body = await response.json();
  expect(body.status).toBe('failure');
  expect(body.error).toContain('not found');
  expect(body.error.toLowerCase()).not.toContain('traceback');
  expect(body.error.toLowerCase()).not.toContain('sqlalchemy');
});

// Targets a table that does not exist, so nothing could be damaged even if the protection regressed.
const writeStatements = [
  { type: 'DROP', sql: 'DROP TABLE IF EXISTS main.zz_nonexistent_xyz' },
  { type: 'DELETE', sql: 'DELETE FROM main.zz_nonexistent_xyz' },
  { type: 'UPDATE', sql: 'UPDATE main.zz_nonexistent_xyz SET a = 1' },
  { type: 'INSERT', sql: 'INSERT INTO main.zz_nonexistent_xyz VALUES (1)' },
];
for (const { type, sql } of writeStatements) {
  test(`write protection: ${type} is blocked on a read-only connection`, async ({ datapilot }) => {
    const response = await datapilot.execute({ connection_name, sql });

    expect(response.status()).toBe(403);
    const body = await response.json();
    expect(body).toMatchObject({ status: 'blocked', statement_type: type });
    expect(body.error).toContain('read-only');
    expect(body).not.toHaveProperty('data');
  });
}

test.fail('KNOWN DEFECT: execute with a non-string sql returns 4xx, not 500', async ({ datapilot }) => {
  const response = await datapilot.execute({ connection_name, sql: 123 });

  expect(response.status()).toBeGreaterThanOrEqual(400);
  expect(response.status()).toBeLessThan(500);
  await expectNoSensitiveData(response);
});

test.fail('KNOWN DEFECT: a failed query does not leak driver/SQL internals', async ({ datapilot }) => {
  const response = await datapilot.execute({ connection_name, sql: 'SELECT no_such_column_xyz FROM main.salespeople' });

  expect(response.status()).toBe(200);
  expect((await response.json()).status).toBe('failure');
  await expectNoSensitiveData(response);
});

test.fail('KNOWN DEFECT: execute with a numeric connection_name is a 4xx and does not leak DIA\'s internal query', async ({ datapilot }) => {
  const response = await datapilot.execute({ connection_name: 123, sql: 'SELECT 1' }); // currently echoes the internal `connections` query

  expect(response.status()).toBeGreaterThanOrEqual(400);
  expect(response.status()).toBeLessThan(500);
  await expectNoSensitiveData(response);
  expect((await response.text()).toLowerCase()).not.toContain('connections.password');
});

test.fail('KNOWN DEFECT: execute with a malformed JSON body is a 400', async ({ datapilot }) => {
  const response = await datapilot.executeRaw('{ this is not json'); // currently 500

  expect(response.status()).toBe(400);
});

test.fail('KNOWN DEFECT: execute with a JSON array body is a 4xx and does not leak Python internals', async ({ datapilot }) => {
  const response = await datapilot.execute([]); // currently 500 "'list' object has no attribute 'get'"

  expect(response.status()).toBeGreaterThanOrEqual(400);
  expect(response.status()).toBeLessThan(500);
  await expectNoSensitiveData(response);
});

// ---- count ------------------------------------------------------------------------------------------------------

test('count lists all three required fields when they are missing', async ({ datapilot }) => {
  await expectError(await datapilot.count({}), 400, 'query_log_id, connection_name, and sql are required');
});

test('count with an unknown connection is a 404 that names it', async ({ datapilot }) => {
  const response = await datapilot.count({ query_log_id: 1, connection_name: 'zz-no-such-conn', sql: 'SELECT 1' });

  await expectError(response, 404, "Connection 'zz-no-such-conn' not found");
});

test.fail('KNOWN DEFECT: count with a non-string sql is a 4xx and does not leak Python internals', async ({ datapilot }) => {
  const response = await datapilot.count({ query_log_id: 1, connection_name, sql: 123 }); // currently 500

  expect(response.status()).toBeGreaterThanOrEqual(400);
  expect(response.status()).toBeLessThan(500);
  await expectNoSensitiveData(response);
});

// ---- status / cancel --------------------------------------------------------------------------------------------

test.fail('KNOWN DEFECT: status of an unknown query_log_id is a 404', async ({ datapilot }) => {
  expect((await datapilot.status(999999999)).status()).toBe(404); // currently 200 {"error": "Query not found"}
});

test('status with a non-numeric id is a client error', async ({ datapilot }) => {
  const response = await datapilot.status('abc');

  expect(response.status()).toBeGreaterThanOrEqual(400);
  expect(response.status()).toBeLessThan(500);
});

test('cancelling an unknown query reports that nothing was cancelled', async ({ datapilot }) => {
  const response = await datapilot.cancel(999999999);

  expect(response.status()).toBe(400);
  const body = await response.json();
  expect(body.success).toBe(false);
  expect(body.message).toContain('Failed to cancel');
});

test('history without a limit returns the available records', async ({ datapilot }) => {
  const response = await datapilot.history();

  expect(response.status()).toBe(200);
  const history = await response.json();
  expect(history).toEqual(expect.any(Array));
  expect(history.length).toBeGreaterThan(0);
});

// ---- authentication on the DataPilot query endpoints --------------------------------------------------------------

test.describe('authentication', () => {
  const badToken = { Authorization: 'Bearer invalid.token.value' };

  test('execute without a token is rejected and returns no query data', async ({ anonymous }) => {
    const response = await new DataPilotClient(anonymous).execute({ connection_name, sql: 'SELECT 1' });

    await expectError(response, 401, 'Authorization token required');
    const body = await response.json();
    expect(body).not.toHaveProperty('data');
    expect(body).not.toHaveProperty('columns');
  });

  test('count without a token is rejected and returns no count data', async ({ anonymous }) => {
    const response = await new DataPilotClient(anonymous).count({ query_log_id: 1, connection_name, sql: 'SELECT 1' });

    await expectError(response, 401, 'Authorization token required');
    expect(await response.json()).not.toHaveProperty('total_row_count');
  });

  test('status and cancel without a token are rejected', async ({ anonymous }) => {
    const dp = new DataPilotClient(anonymous);

    await expectError(await dp.status(1), 401, 'Authorization token required');
    await expectError(await dp.cancel(1), 401, 'Authorization token required');
  });

  test('execute with an invalid token is rejected and returns no data', async ({ anonymous }) => {
    const response = await anonymous.post('/api/datapilot/execute', { data: { connection_name, sql: 'SELECT 1' }, headers: badToken });

    await expectError(response, 401, 'Invalid or expired token');
    expect(await response.json()).not.toHaveProperty('data');
  });

  test('count with an invalid token is rejected', async ({ anonymous }) => {
    const response = await anonymous.post('/api/datapilot/count', { data: { query_log_id: 1, connection_name, sql: 'SELECT 1' }, headers: badToken });

    await expectError(response, 401, 'Invalid or expired token');
  });
});
