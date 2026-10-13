// Tab-state lifecycle.
// This changes the CALLER's own (ephemeral) workspace state, so it is conservative: the original state is captured first,
// put back at the end and compared, and afterAll repairs it if a step failed part-way.
const { test, expect } = require('../fixtures/api');
const { TabsClient } = require('../clients/tabsClient');

test.describe.configure({ mode: 'serial' });

const sample = { tabs: [{ id: 'zz-api-tab', name: 'API test', connection: 'test-payroll', query: 'SELECT 1', is_dirty: false }], active_tab_id: 'zz-api-tab', layout: {}, preferences: {} };
let original; // tab_data before the test (usually null)

const current = async (tabs) => (await (await tabs.restore()).json()).tab_data;

test.afterAll(async ({ api }) => {
  if (original === undefined) return; // nothing was captured, so nothing was changed
  const tabs = new TabsClient(api);
  if (JSON.stringify(await current(tabs)) === JSON.stringify(original)) return;
  if (original) await tabs.save({ tab_data: original });
  else await tabs.clearUserData(); // originally nothing was saved
});

test('capture the existing tab state', async ({ tabs }) => {
  const response = await tabs.restore();

  expect(response.status()).toBe(200);
  original = (await response.json()).tab_data;
});

test('save a tab state', async ({ tabs }) => {
  const response = await tabs.save({ tab_data: sample });

  expect(response.status()).toBe(200);
  expect(await response.json()).toMatchObject({ success: true, message: 'Tab state saved' });
});

test('restore returns exactly what was saved', async ({ tabs }) => {
  const saved = await current(tabs);

  expect(saved.active_tab_id).toBe('zz-api-tab');
  expect(saved.tabs).toHaveLength(1);
  expect(saved.tabs[0]).toMatchObject({ id: 'zz-api-tab', query: 'SELECT 1', connection: 'test-payroll' });
});

test('admin cleanup of expired cache entries reports a numeric count', async ({ tabs }) => {
  const response = await tabs.cleanup(); // removes only already-expired entries

  expect(response.status()).toBe(200);
  const body = await response.json();
  expect(body.success).toBe(true);
  expect(body.cleaned).toEqual(expect.any(Number));
  expect(body.message).toContain(String(body.cleaned));
});

test('the saved tab state survives the cleanup', async ({ tabs }) => {
  expect((await current(tabs)).active_tab_id).toBe('zz-api-tab');
});

test("clearing the user's cache data reports what was cleared", async ({ tabs }) => {
  const response = await tabs.clearUserData(); // scoped to the logged-in test user

  expect(response.status()).toBe(200);
  const body = await response.json();
  expect(body.success).toBe(true);
  expect(body.cleared.redis_keys_cleared).toEqual(expect.any(Number));
  expect(body.message).toBe('User cache data cleared');
});

test('the tab state is gone after the clear', async ({ tabs }) => {
  const body = await (await tabs.restore()).json();

  expect(body.success).toBe(true);
  expect(body.tab_data).toBeNull();
});

test('the original tab state is restored and verified', async ({ tabs }) => {
  if (original) { // there was a saved state: put it back (nothing to restore when there was none)
    const response = await tabs.save({ tab_data: original });
    expect(response.status()).toBe(200);
    expect((await response.json()).success).toBe(true);
  }

  expect(await current(tabs), 'the user\'s tab state equals what it was before the test').toEqual(original);
});
