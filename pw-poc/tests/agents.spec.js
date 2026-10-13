// Agent API reads and validation. Nothing here creates data: the unknown-id calls use a non-existent id and the
// create call sends an invalid body. (The create/read/update/delete lifecycle is in agent.workflow.spec.js.)
const { test, expect } = require('../fixtures/api');

const UNKNOWN = 999999999;

test('the agent list is successful and its total agrees with the agents returned', async ({ agents }) => {
  const response = await agents.list();

  expect(response.status()).toBe(200);
  const body = await response.json();
  expect(body.success).toBe(true);
  expect(body.agents).toEqual(expect.any(Array));
  expect(body.total).toBe(body.agents.length);
});

test('the agent runtime status has numeric counters and an agents list', async ({ agents }) => {
  const response = await agents.status();

  expect(response.status()).toBe(200);
  const body = await response.json();
  expect(body.success).toBe(true);
  for (const counter of ['active_agents', 'total_agents', 'pinned_conversations']) expect(body.status[counter], counter).toEqual(expect.any(Number));
  expect(body.status.agents).toEqual(expect.any(Array));
});

test('an unknown agent is a 404 that names the id', async ({ agents }) => {
  const response = await agents.get(UNKNOWN);

  expect(response.status()).toBe(404);
  expect(await response.json()).toMatchObject({ success: false, error: `Agent ${UNKNOWN} not found` });
});

test('creating an agent without a name is rejected (nothing is created)', async ({ agents }) => {
  const response = await agents.create({});

  expect(response.status()).toBe(400);
  const body = await response.json();
  expect(body).toMatchObject({ success: false, error: 'name is required' });
  expect(body).not.toHaveProperty('agent_id');
});

test('updating an unknown agent is a 404', async ({ agents }) => {
  const response = await agents.update(UNKNOWN, { description: 'x' });

  expect(response.status()).toBe(404);
  expect((await response.json()).success).toBe(false);
});

test('deleting an unknown agent is a 404 that names the id', async ({ agents }) => {
  const response = await agents.delete(UNKNOWN);

  expect(response.status()).toBe(404);
  expect((await response.json()).error).toBe(`Agent ${UNKNOWN} not found`);
});

test('enabling an unknown agent is a 404', async ({ agents }) => {
  const response = await agents.enable(UNKNOWN);

  expect(response.status()).toBe(404);
  expect((await response.json()).success).toBe(false);
});
