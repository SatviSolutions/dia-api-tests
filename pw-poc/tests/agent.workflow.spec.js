// Agent lifecycle. Only a uniquely named agent of its own is created,
// disabled/enabled, updated and deleted; existing agents are never touched. Chat/delegate (LLM calls) are not used.
const { test, expect } = require('../fixtures/api');
const { AgentsClient } = require('../clients/agentsClient');

test.describe.configure({ mode: 'serial' });

const name = `zz-api-pw-agent-${Date.now()}`;
let id;
let agentsBefore; // ids of the agents that existed before the workflow

test.afterAll(async ({ api }) => {
  const agents = new AgentsClient(api);
  if (id) await agents.delete(id); // 404 when the delete step already ran
  const after = (await (await agents.list()).json()).agents;
  expect(after.map((a) => a.id), 'throw-away agent removed').not.toContain(id);
  expect(after.filter((a) => (a.name ?? a.agent_name ?? '').startsWith('zz-api-pw-agent-')), 'no leftover test agents').toEqual([]);
  if (agentsBefore) expect(after.map((a) => a.id).sort(), 'the original agents are unchanged').toEqual(agentsBefore);
});

test('create an agent', async ({ agents }) => {
  agentsBefore = (await (await agents.list()).json()).agents.map((a) => a.id).sort();

  const response = await agents.create({ name, description: 'api-test throw-away' });

  expect(response.status()).toBe(200);
  const body = await response.json();
  expect(body.success).toBe(true);
  expect(body.agent_id).toEqual(expect.any(Number));
  id = body.agent_id;
});

test('read it back: the defaults are applied', async ({ agents }) => {
  const response = await agents.get(id);

  expect(response.status()).toBe(200);
  expect((await response.json()).agent).toMatchObject({ id, name, agent_mode: 'ask', enabled: true, autonomy_level: 1, max_tokens: 2000 });
});

test('it appears in the agent list and the total agrees', async ({ agents }) => {
  const body = await (await agents.list()).json();

  expect(body.agents.map((a) => a.id)).toContain(id);
  expect(body.total).toBe(body.agents.length);
});

test('disable the agent', async ({ agents }) => {
  const response = await agents.disable(id);

  expect(response.status()).toBe(200);
  expect(await response.json()).toMatchObject({ success: true, agent_id: id });
});

test('the disabled state is persisted', async ({ agents }) => {
  expect((await (await agents.get(id)).json()).agent.enabled).toBe(false);
});

test('enable the agent', async ({ agents }) => {
  const response = await agents.enable(id);

  expect(response.status()).toBe(200);
  expect((await response.json()).success).toBe(true);
});

test('update the description', async ({ agents }) => {
  const response = await agents.update(id, { description: 'updated by api test' });

  expect(response.status()).toBe(200);
  expect((await response.json()).success).toBe(true);
});

test('the update is persisted: description changed, name unchanged, still enabled', async ({ agents }) => {
  const { agent } = await (await agents.get(id)).json();

  expect(agent).toMatchObject({ description: 'updated by api test', name, enabled: true });
});

test('delete the agent', async ({ agents }) => {
  const response = await agents.delete(id);

  expect(response.status()).toBe(200);
  expect((await response.json()).success).toBe(true);
});

test('the deleted agent is a 404', async ({ agents }) => {
  const response = await agents.get(id);

  expect(response.status()).toBe(404);
  expect((await response.json()).success).toBe(false);
});

test('deleting the agent again is a 404', async ({ agents }) => {
  const response = await agents.delete(id);

  expect(response.status()).toBe(404);
  expect((await response.json()).success).toBe(false);
});
