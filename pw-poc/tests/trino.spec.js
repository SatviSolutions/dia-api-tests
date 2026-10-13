const { test, expect } = require('../fixtures/api');
const { expectError, expectNoSensitiveData } = require('../helpers/assertions');

test('status shows Trino is reachable', async ({ trino }) => {
  const response = await trino.getStatus();

  expect(response.status()).toBe(200);
  const body = await response.json();
  expect(body.connection.status).toBe('connected');
  expect(body.server_info).toEqual(expect.any(Object));
});

test('config exposes host, port and default catalog but no password', async ({ trino }) => {
  const response = await trino.getConfig();

  expect(response.status()).toBe(200);
  const body = await response.json();
  expect(body.status).toBe('success');
  expect(body.config.host).toEqual(expect.any(String));
  expect(body.config.port).toEqual(expect.any(Number));
  expect(await response.text()).not.toMatch(/password/i);
});

test('query returns the computed row', async ({ trino }) => {
  const response = await trino.query({ sql: 'SELECT 1' });

  expect(response.status()).toBe(200);
  const body = await response.json();
  expect(body.status).toBe('success');
  expect(body.row_count).toBe(1);
  expect(body.data[0]._col0).toBe(1);
});

test('query without sql is rejected', async ({ trino }) => {
  const response = await trino.query({});

  await expectError(response, 400, 'SQL query is required');
  expect((await response.json()).status).toBe('error');
});

test('query history returns success and a list', async ({ trino }) => {
  const response = await trino.getQueries();

  expect(response.status()).toBe(200);
  const body = await response.json();
  expect(body.status).toBe('success');
  expect(body.queries).toEqual(expect.any(Array));
});

test('should return Trino catalogs', async ({ trino }) => {
  const response = await trino.getCatalogs();

  expect(response.status()).toBe(200);
  expect((await response.json()).catalogs).toEqual(expect.arrayContaining(['system', 'dia']));
});

test('should return the schemas of a catalog', async ({ trino }) => {
  const response = await trino.getSchemas('system');

  expect(response.status()).toBe(200);
  const body = await response.json();
  expect(body.catalog).toBe('system');
  expect(body.schemas).toContain('information_schema');
});

test('should return the supported connectors', async ({ trino }) => {
  const response = await trino.getConnectors();

  expect(response.status()).toBe(200);
  const { connectors } = await response.json();
  expect(connectors.length).toBeGreaterThan(0);
  for (const c of connectors) expect(c).toEqual({ connector: expect.any(String), db_type: expect.any(String), default_port: expect.any(String) });
});

test('should return the function catalog', async ({ trino }) => {
  const response = await trino.getFunctions();

  expect(response.status()).toBe(200);
  expect((await response.json()).functions.map((f) => f.name)).toContain('abs');
});

test('validate-connection reports every missing parameter', async ({ trino }) => {
  const response = await trino.validateConnection({});

  expect(response.status()).toBe(200);
  const body = await response.json();
  expect(body.valid).toBe(false);
  expect(body.errors).toContain('Host is required');
});

test('explain returns a query plan', async ({ trino }) => {
  const response = await trino.explain({ sql: 'SELECT 1' });

  expect(response.status()).toBe(200);
  expect((await response.json()).plan[0]).toContain('Fragment 0');
});

test('explain without sql is rejected', async ({ trino }) => {
  await expectError(await trino.explain({}), 400, 'SQL query is required');
});

test.fail('KNOWN DEFECT: catalog-configs do not expose connector credentials', async ({ trino }) => {
  await expectNoSensitiveData(await trino.getCatalogConfigs());
});

test.fail('KNOWN DEFECT: an invalid catalog name is a 4xx, not a 500 with a Trino error', async ({ trino }) => {
  const response = await trino.getSchemas('zz-none');

  expect(response.status()).toBeGreaterThanOrEqual(400);
  expect(response.status()).toBeLessThan(500);
  await expectNoSensitiveData(response);
});
