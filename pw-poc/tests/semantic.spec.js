// Semantic models and knowledge graphs: read-only plus validation (no model or graph is created, enabled or built).
const { test, expect } = require('../fixtures/api');
const { expectError, expectNoSensitiveData } = require('../helpers/assertions');

test('the dashboard has numeric statistics and a list of recent imports', async ({ semantic }) => {
  const response = await semantic.dashboard();

  expect(response.status()).toBe(200);
  const body = await response.json();
  expect(body.recent_imports).toEqual(expect.any(Array));
  for (const stat of ['canonical_entities', 'physical_databases', 'physical_tables', 'pii_columns', 'semantic_models', 'semantic_tables']) {
    expect(body.stats[stat], stat).toEqual(expect.any(Number));
  }
});

const lists = [
  { name: 'models', call: (s) => s.listModels() },
  { name: 'physical databases', call: (s) => s.listPhysicalDatabases() },
  { name: 'models of a connection', call: (s) => s.modelsByConnection(9) },
];
for (const { name, call } of lists) {
  test(`listing ${name} returns an array`, async ({ semantic }) => {
    const response = await call(semantic);

    expect(response.status()).toBe(200);
    expect(await response.json()).toEqual(expect.any(Array));
  });
}

for (const [name, call] of [['get a model', (s) => s.getModel(999999999)], ['list the tables of a model', (s) => s.modelTables(999999999)]]) {
  test(`${name} with an unknown id is a 404`, async ({ semantic }) => {
    await expectError(await call(semantic), 404, 'Semantic model not found');
  });
}

test('creating a model without a name is rejected', async ({ semantic }) => {
  await expectError(await semantic.createModel({}), 400, 'name is required');
});

test.fail('KNOWN DEFECT: a malformed physical-database id is a 4xx and does not leak database internals', async ({ semantic }) => {
  const response = await semantic.getPhysicalDatabase('not-a-uuid'); // currently 500 with the raw psycopg2 error

  expect(response.status()).toBeGreaterThanOrEqual(400);
  expect(response.status()).toBeLessThan(500);
  await expectNoSensitiveData(response);
});

// ---- knowledge graph ------------------------------------------------------------------------------------------------

test('the knowledge-graph overview has numeric aggregate counters', async ({ semantic }) => {
  const response = await semantic.knowledgeGraphOverview();

  expect(response.status()).toBe(200);
  const body = await response.json();
  expect(body.success).toBe(true);
  expect(body.knowledge_graphs).toEqual(expect.any(Array));
  for (const counter of ['total_kgs', 'total_nodes', 'total_edges']) expect(body.aggregate[counter], counter).toEqual(expect.any(Number));
});

test('a connection without a knowledge graph reports none configured', async ({ semantic }) => {
  const response = await semantic.knowledgeGraph(9);

  expect(response.status()).toBe(200);
  const body = await response.json();
  expect(body.success).toBe(true);
  expect(body.data).toBeNull();
  expect(body.message).toContain('No knowledge graph');
});

test('the nodes of a missing knowledge graph are a 404', async ({ semantic }) => {
  const response = await semantic.knowledgeGraphNodes(9);

  expect(response.status()).toBe(404);
  expect(await response.json()).toMatchObject({ success: false, error: 'Knowledge graph not found' });
});

test('knowledge-graph search without a query is rejected', async ({ semantic }) => {
  const response = await semantic.knowledgeGraphSearch(9, {});

  expect(response.status()).toBe(400);
  expect(await response.json()).toMatchObject({ success: false, error: 'query is required' });
});
