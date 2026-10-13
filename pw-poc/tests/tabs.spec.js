// Workspace tab-state endpoints: read-only plus validation. The tests that change the caller's own tab state are in
// tabState.workflow.spec.js.
const { test, expect } = require('../fixtures/api');
const { expectError, expectUnauthorized } = require('../helpers/assertions');
const { TabsClient } = require('../clients/tabsClient');

test('health reports the overall status and each component', async ({ tabs }) => {
  const response = await tabs.health();

  expect(response.status()).toBe(200);
  const body = await response.json();
  expect(body.success).toBe(true);
  expect(body.health.overall).toEqual(expect.any(String));
  expect(body.health.redis.status).toEqual(expect.any(String));
  expect(body.health.duckdb.status).toEqual(expect.any(String));
});

test('stats expose the result cache and state cache with typed counters', async ({ tabs }) => {
  const response = await tabs.stats();

  expect(response.status()).toBe(200);
  const body = await response.json();
  expect(body.success).toBe(true);
  expect(body.stats.service_status).toEqual(expect.any(String));
  expect(body.stats.result_cache.total_entries).toEqual(expect.any(Number));
  expect(body.stats.result_cache.total_size_mb).toEqual(expect.any(Number));
  expect(body.stats.state_cache.connected).toEqual(expect.any(Boolean));
});

test('recent connections is a successful list', async ({ tabs }) => {
  const body = await (await tabs.recentConnections()).json();

  expect(body.success).toBe(true);
  expect(body.connections).toEqual(expect.any(Array));
});

test('restore always carries a tab_data key (null when nothing is saved)', async ({ tabs }) => {
  const response = await tabs.restore();

  expect(response.status()).toBe(200);
  const body = await response.json();
  expect(body.success).toBe(true);
  expect(body).toHaveProperty('tab_data');
});

test('tab history with a valid limit is a list no longer than the limit', async ({ tabs }) => {
  const response = await tabs.history({ limit: 5 });

  expect(response.status()).toBe(200);
  const body = await response.json();
  expect(body.success).toBe(true);
  expect(body.history).toEqual(expect.any(Array));
  expect(body.history.length).toBeLessThanOrEqual(5);
});

const invalidLimits = [
  { limit: '0', message: "'limit' must be greater than 0" },
  { limit: 'abc', message: "'limit' must be an integer" },
];
for (const { limit, message } of invalidLimits) {
  test(`tab history rejects limit=${limit}`, async ({ tabs }) => {
    const response = await tabs.history({ limit });

    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.success).toBe(false);
    expect(body.error).toContain(message);
  });
}

test('saving without tab_data is rejected (nothing is saved)', async ({ tabs }) => {
  const response = await tabs.save({});

  expect(response.status()).toBe(400);
  expect(await response.json()).toMatchObject({ success: false, error: 'tab_data is required' });
});

test('cached results of an unknown query are a 404 that echoes the id', async ({ tabs }) => {
  const response = await tabs.results(999999999);

  expect(response.status()).toBe(404);
  const body = await response.json();
  expect(body).toMatchObject({ success: false, query_log_id: 999999999 });
  expect(body.message).toContain('not found');
});

test('invalidating an unknown cached result is a 404', async ({ tabs }) => {
  const response = await tabs.invalidate(999999999);

  expect(response.status()).toBe(404);
  expect(await response.json()).toMatchObject({ success: false, message: 'Cached result not found' });
});

test('cached results is a successful list', async ({ tabs }) => {
  const body = await (await tabs.cachedResults()).json();

  expect(body.success).toBe(true);
  expect(body.cached_results).toEqual(expect.any(Array));
});

test('results and save without a token are rejected', async ({ anonymous }) => {
  const anon = new TabsClient(anonymous);

  await expectUnauthorized(await anon.results(1));
  await expectUnauthorized(await anon.save({}));
});
