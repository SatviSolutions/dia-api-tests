// Cache manager and per-query result cache. Read-only plus validation; cleanup-expired only removes entries that have
// already expired, and delete-all-cache is never called.
const { test, expect } = require('../fixtures/api');
const { expectError, expectUnauthorized } = require('../helpers/assertions');
const { CacheClient } = require('../clients/cacheClient');

const UNKNOWN = 999999999;

test('cache stats report numeric result-cache counters', async ({ cache }) => {
  const response = await cache.stats();

  expect(response.status()).toBe(200);
  const body = await response.json();
  expect(body.success).toBe(true);
  expect(body.stats.result_cache.total_entries).toEqual(expect.any(Number));
  expect(body.stats.result_cache.total_size_mb).toEqual(expect.any(Number));
});

test('cache entries are scoped to the caller', async ({ cache }) => {
  const response = await cache.entries();

  expect(response.status()).toBe(200);
  const body = await response.json();
  expect(body.success).toBe(true);
  expect(body.entries).toEqual(expect.any(Array));
  expect(body.include_all).toEqual(expect.any(Boolean));
  expect(body.user_id).toEqual(expect.any(Number));
});

test('an unknown cache entry is a 404', async ({ cache }) => {
  const response = await cache.entry(UNKNOWN);

  expect(response.status()).toBe(404);
  expect(await response.json()).toMatchObject({ success: false, error: 'Cache entry not found' });
});

test('cleanup of expired entries reports a numeric count', async ({ cache }) => {
  const response = await cache.cleanupExpired();

  expect(response.status()).toBe(200);
  const body = await response.json();
  expect(body.success).toBe(true);
  expect(body.cleaned).toEqual(expect.any(Number));
  expect(body.message).toContain(String(body.cleaned));
});

test('the result cache reports an unknown query as status "unknown"', async ({ cache }) => {
  const response = await cache.resultStatus(UNKNOWN);

  expect(response.status()).toBe(200);
  expect(await response.json()).toMatchObject({ status: 'unknown', query_log_id: UNKNOWN });
});

test('profile and page of an unknown query say the cache is not ready', async ({ cache }) => {
  await expectError(await cache.resultProfile(UNKNOWN), 404, 'Cache not ready');
  await expectError(await cache.resultPage(UNKNOWN, { page: 1 }), 404, 'Cache not ready');
});

test('cache stats and cleanup without a token are rejected', async ({ anonymous }) => {
  const anon = new CacheClient(anonymous);

  await expectUnauthorized(await anon.stats());
  await expectUnauthorized(await anon.cleanupExpired());
});
