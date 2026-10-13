// SQL parsing, visualization and autocomplete helper endpoints (read-only plus validation).
const { test, expect } = require('../fixtures/api');
const { expectError, expectUnauthorized } = require('../helpers/assertions');
const { DataPilotClient } = require('../clients/datapilotClient');

test('the SQL parser service health is public and advertises its features', async ({ anonymous }) => {
  const response = await new DataPilotClient(anonymous).health(); // no token

  expect(response.status()).toBe(200);
  const body = await response.json();
  expect(body.service).toEqual(expect.any(String));
  expect(body.features.length).toBeGreaterThan(0);
});

test('parse returns column lineage, CTEs, joins and statement info', async ({ datapilot }) => {
  const response = await datapilot.parse({ sql: 'SELECT a FROM t' });

  expect(response.status()).toBe(200);
  const body = await response.json();
  expect(body.success).toBe(true);
  expect(body.column_lineage.a).toContain('t.a');
  expect(body.ctes).toEqual(expect.any(Object));
  expect(body.joins).toEqual(expect.any(Array));
  expect(body.statement_info).toMatchObject({ category: 'DML', has_cte: false, cte_count: 0 });
});

test('parse detects a CTE and a join', async ({ datapilot }) => {
  const response = await datapilot.parse({ sql: 'WITH c AS (SELECT id FROM a) SELECT c.id FROM c JOIN b ON c.id = b.id' });

  expect(response.status()).toBe(200);
  const body = await response.json();
  expect(body.statement_info).toMatchObject({ has_cte: true, cte_count: 1 });
  expect(body.joins.length).toBeGreaterThanOrEqual(1);
});

test('parse and visualize without sql are rejected', async ({ datapilot }) => {
  for (const call of [datapilot.parse({}), datapilot.visualize({})]) {
    const response = await call;
    expect(response.status()).toBe(400);
    expect(await response.json()).toMatchObject({ success: false, error: 'No SQL provided' });
  }
});

test('autocomplete settings are boolean feature flags', async ({ datapilot }) => {
  const response = await datapilot.autocompleteSettings();

  expect(response.status()).toBe(200);
  const body = await response.json();
  expect(body.success).toBe(true);
  expect(body.settings.advanced_suggestions_enabled).toEqual(expect.any(Boolean));
  expect(body.settings.join_suggestions_enabled).toEqual(expect.any(Boolean));
});

test('implied-relationship settings have a flag, a confidence between 0 and 1, and strategies', async ({ datapilot }) => {
  const { settings } = await (await datapilot.impliedRelationshipsSettings()).json();

  expect(settings.enabled).toEqual(expect.any(Boolean));
  expect(settings.min_confidence).toBeGreaterThanOrEqual(0);
  expect(settings.min_confidence).toBeLessThanOrEqual(1);
  expect(settings.strategies).toEqual(expect.any(Array));
});

test('SQL-context cache statistics are numeric and consistent', async ({ datapilot }) => {
  const response = await datapilot.sqlContextStats();

  expect(response.status()).toBe(200);
  const { stats } = await response.json();
  for (const counter of ['hits', 'misses', 'size', 'max_size']) expect(stats[counter], counter).toEqual(expect.any(Number));
  expect(stats.size).toBeLessThanOrEqual(stats.max_size + 1);
  expect(stats.hit_rate).toBeGreaterThanOrEqual(0);
  expect(stats.hit_rate).toBeLessThanOrEqual(1);
});

const missingFields = [
  { name: 'sql-context without connection_id', call: (dp) => dp.sqlContext({}), error: 'connection_id is required' },
  { name: 'join-hints without its fields', call: (dp) => dp.joinHints({}), error: 'database_id, left_table, and right_table are required' },
  { name: 'canonical-join-hints without its fields', call: (dp) => dp.canonicalJoinHints({}), error: 'left_table and right_table are required' },
];
for (const { name, call, error } of missingFields) {
  test(`${name} is rejected`, async ({ datapilot }) => {
    const response = await call(datapilot);

    expect(response.status()).toBe(400);
    expect((await response.json()).error).toBe(error);
  });
}

test('parse, visualize, autocomplete settings and SQL-context stats without a token are rejected', async ({ anonymous }) => {
  const anon = new DataPilotClient(anonymous);

  await expectUnauthorized(await anon.parse({ sql: 'SELECT 1' }));
  await expectUnauthorized(await anon.visualize({ sql: 'SELECT 1' }));
  await expectUnauthorized(await anon.autocompleteSettings());
  await expectUnauthorized(await anon.sqlContextStats());
});
