const { test, expect } = require('../fixtures/api');
const { expectError, expectNoSecretKeys } = require('../helpers/assertions');

test('list returns well-formed connections with unique ids, the SQLite fixture and no credentials', async ({ connections }) => {
  const response = await connections.list();

  expect(response.status()).toBe(200);
  const body = await response.json();
  expect(body.connections.length).toBeGreaterThan(0);
  for (const c of body.connections) {
    expect(c.id).toEqual(expect.any(Number));
    expect(c.name).toEqual(expect.stringMatching(/.+/));
    expect(c.db_type).toEqual(expect.stringMatching(/.+/));
    expect([0, 1]).toContain(c.disabled);
    for (const field of ['environment_type', 'host', 'port']) expect(c).toHaveProperty(field);
  }
  const ids = body.connections.map((c) => c.id);
  expect(new Set(ids).size, 'connection ids are unique').toBe(ids.length);
  expect(body.connections.map((c) => c.name)).toContain('test-payroll');
  expectNoSecretKeys(body.connections, '/api/repo/connections');
});

test('get returns one connection with the full schema and no credentials', async ({ connections }) => {
  const { connections: list } = await (await connections.list()).json();
  const fixture = list.find((c) => c.name === 'test-payroll');

  const response = await connections.get(fixture.id);

  expect(response.status()).toBe(200);
  const { connection } = await response.json();
  expect(connection).toMatchObject({ id: fixture.id, name: fixture.name, db_type: expect.any(String), is_active: expect.any(Boolean) });
  for (const field of ['host', 'port', 'database_name', 'environment_type', 'source_type', 'username']) expect(connection).toHaveProperty(field);
  expectNoSecretKeys(connection, '/api/repo/connections/:id');
});

test('get with an unknown id is a 404', async ({ connections }) => {
  await expectError(await connections.get(999999999), 404, 'Connection not found');
});

const invalidCreates = [
  { name: 'missing name', data: { db_type: 'sqlite' }, error: 'Connection name is required' },
  { name: 'whitespace-only name', data: { name: '   ', db_type: 'sqlite' }, error: 'Connection name is required' },
  { name: 'missing db_type', data: { name: 'zz-validation-only' }, error: 'Database type is required' },
  { name: 'file source without a file', data: { name: 'zz-validation-only', db_type: 'csv', source_type: 'file' }, error: 'Upload a file before saving this connection' },
  { name: 'unsupported db_type', data: { name: 'zz-validation-only', db_type: 'bogus' }, error: 'Unsupported db_type: bogus' },
];
for (const { name, data, error } of invalidCreates) {
  test(`create rejects ${name} (nothing is created)`, async ({ connections }) => {
    const response = await connections.create(data);

    await expectError(response, 400, error);
    expect(await response.json(), 'nothing was created').not.toHaveProperty('id');
  });
}

test('test-connection with no parameters is rejected', async ({ connections }) => {
  const response = await connections.test({});

  await expectError(response, 400, 'Connection parameters are required');
  expect((await response.json()).status).toBe('error');
});

// ---- read endpoints -----------------------------------------------------------------------------------------------

test('audit returns records, the connection and the success metrics', async ({ connections }) => {
  const { connections: list } = await (await connections.list()).json();
  const fixture = list.find((c) => c.name === 'test-payroll');

  const response = await connections.audit(fixture.id);

  expect(response.status()).toBe(200);
  const body = await response.json();
  expect(body.audit_records).toEqual(expect.any(Array));
  expect(body.connection.id).toBe(fixture.id);
  for (const metric of ['total_attempts', 'successful_attempts', 'success_rate', 'avg_duration_ms']) expect(body.metrics).toHaveProperty(metric);
});

test('sidebar lists connections with id, name, db_type and has_knowledge', async ({ connections }) => {
  const response = await connections.sidebar();

  expect(response.status()).toBe(200);
  const sidebar = await response.json();
  expect(sidebar.length).toBeGreaterThan(0);
  for (const c of sidebar) {
    expect(c).toMatchObject({ id: expect.any(Number), name: expect.any(String), db_type: expect.any(String), has_knowledge: expect.any(Boolean) });
  }
});

test('search returns {text, value} pairs that all contain the search term', async ({ connections }) => {
  const response = await connections.search('payroll');

  expect(response.status()).toBe(200);
  const results = await response.json();
  expect(results.length).toBeGreaterThan(0);
  for (const r of results) {
    expect(r.text).toEqual(expect.any(String));
    expect(r.value).toBe(r.text);
    expect(r.text.toLowerCase()).toContain('payroll');
  }
});

test('search for a term that matches nothing returns an empty list', async ({ connections }) => {
  const response = await connections.search('zz-no-such-connection-xyz');

  expect(response.status()).toBe(200);
  expect(await response.json()).toEqual([]);
});

// ---- unknown ids (non-existent id, so nothing can be changed) --------------------------------------------------------

// Update answers {"error": ...}; the other write endpoints answer {"status": "error", "message": ...}.
const unknownIdCalls = [
  { name: 'update', call: (c) => c.update(999999999, { tags: 'x' }), envelope: 'error' },
  { name: 'delete', call: (c) => c.delete(999999999), envelope: 'status' },
  { name: 'toggle', call: (c) => c.toggle(999999999), envelope: 'status' },
  { name: 'set monitor interval', call: (c) => c.setMonitorInterval(999999999, { interval_minutes: 5 }), envelope: 'status' },
];
for (const { name, call, envelope } of unknownIdCalls) {
  test(`${name} with an unknown id is a 404`, async ({ connections }) => {
    const response = await call(connections);

    await expectError(response, 404, 'Connection not found');
    if (envelope === 'status') expect((await response.json()).status).toBe('error');
  });
}

test('a non-numeric id is rejected as a client error, never a server error', async ({ connections }) => {
  const response = await connections.get('not-a-number');

  expect(response.status()).toBeGreaterThanOrEqual(400);
  expect(response.status()).toBeLessThan(500);
});

test.fail('KNOWN DEFECT: audit of an unknown connection id is a 404', async ({ connections }) => {
  expect((await connections.audit(999999999)).status()).toBe(404); // currently 200 {"redirect": "/connections"}
});

// ---- upload validation ---------------------------------------------------------------------------------------------
// Only the "no file part" path is exercised: a real upload would leave a permanent file on the server and DIA has
// no API to delete it.

const uploads = [
  { name: 'database file', send: (c) => c.uploadDatabaseFile({ note: 'no database_file part' }) },
  { name: 'source file', send: (c) => c.uploadSourceFile({ note: 'no source_file part' }) },
];
for (const { name, send } of uploads) {
  test(`upload of a ${name} without a file part is rejected`, async ({ connections }) => {
    const response = await send(connections);

    expect(response.status()).toBe(400);
    expect(await response.json()).toMatchObject({ status: 'error', message: 'No file uploaded' });
  });
}
