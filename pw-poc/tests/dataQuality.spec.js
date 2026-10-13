// Data-quality API. Reads and validation, plus one known-defect test that may CREATE a rule; every rule it creates is
// tracked, deleted in afterAll and verified gone.
const { test, expect } = require('../fixtures/api');
const { expectError, expectUnauthorized } = require('../helpers/assertions');
const { DqClient } = require('../clients/dqClient');

const createdRuleIds = [];
test.afterAll(async ({ api }) => {
  const dq = new DqClient(api);
  for (const id of createdRuleIds) await dq.deleteRule(id);
  const remaining = (await (await dq.listRules()).json()).map((rule) => rule.id);
  for (const id of createdRuleIds) expect(remaining, `rule ${id} was cleaned up`).not.toContain(id);
});

test('the rule list is an array', async ({ dq }) => {
  const response = await dq.listRules();

  expect(response.status()).toBe(200);
  expect(await response.json()).toEqual(expect.any(Array));
});

test('creating a rule without its fields names the missing ones', async ({ dq }) => {
  const response = await dq.createRule({});

  expect(response.status()).toBe(400);
  const { error } = await response.json();
  expect(error).toContain('Missing fields');
  expect(error).toContain('column_name');
  expect(error).toContain('template');
});

test('deleting an unknown rule is a 404', async ({ dq }) => {
  await expectError(await dq.deleteRule(999999999), 404, 'Rule not found');
});

test('evaluating without a query_log_id is rejected', async ({ dq }) => {
  await expectError(await dq.evaluate({}), 400, 'query_log_id is required');
});

test('the runs of an unknown query are an empty list', async ({ dq }) => {
  const response = await dq.runs(999999999);

  expect(response.status()).toBe(200);
  expect(await response.json()).toEqual([]);
});

test.fail('KNOWN DEFECT: a rule with an unknown template is rejected with a 4xx', async ({ dq }) => {
  const response = await dq.createRule({ column_name: 'zz_col', template: 'zz-not-a-template' }); // currently 201: invalid rule stored
  const body = await response.json().catch(() => ({}));
  if (body.id) createdRuleIds.push(body.id); // remembered BEFORE asserting, so afterAll always removes it

  expect(response.status()).toBeGreaterThanOrEqual(400);
  expect(response.status()).toBeLessThan(500);
});

test('rule list and rule creation without a token are rejected', async ({ anonymous }) => {
  const anon = new DqClient(anonymous);

  await expectUnauthorized(await anon.listRules());
  await expectUnauthorized(await anon.createRule({}));
});
