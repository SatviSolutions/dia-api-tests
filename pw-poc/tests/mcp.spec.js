// MCP server registry: reads, validation and unknown ids. No server is ever created or connected (a stdio server would
// spawn a local process).
const { test, expect } = require('../fixtures/api');
const { expectUnauthorized } = require('../helpers/assertions');
const { McpClient } = require('../clients/mcpClient');

test('the server list count matches the servers returned', async ({ mcp }) => {
  const response = await mcp.list();

  expect(response.status()).toBe(200);
  const body = await response.json();
  expect(body.success).toBe(true);
  expect(body.servers).toEqual(expect.any(Array));
  expect(body.count).toBe(body.servers.length);
});

test('the tool list count matches the tools returned', async ({ mcp }) => {
  const response = await mcp.tools();

  expect(response.status()).toBe(200);
  const body = await response.json();
  expect(body.success).toBe(true);
  expect(body.tools).toEqual(expect.any(Array));
  expect(body.tool_count).toBe(body.tools.length);
});

test('the registry has well-formed entries and a matching count', async ({ mcp }) => {
  const response = await mcp.registry();

  expect(response.status()).toBe(200);
  const body = await response.json();
  expect(body.registry.length).toBeGreaterThan(0);
  expect(body.count).toBe(body.registry.length);
  for (const entry of body.registry) {
    expect(entry).toMatchObject({ id: expect.any(String), name: expect.any(String), category: expect.any(String) });
    expect(['stdio', 'sse', 'http']).toContain(entry.transport);
  }
});

// Invalid bodies only: every one is rejected before anything is stored.
const invalidCreates = [
  { name: 'a missing name', data: {}, check: (e) => expect(e).toBe('name is required'), exactName: true },
  { name: 'a missing transport', data: { name: 'zz-validation-only' }, check: (e) => expect(e).toContain('transport is required') },
  { name: 'an invalid transport', data: { name: 'zz-validation-only', transport: 'bogus' }, check: (e) => expect(e).toBe("transport must be 'stdio', 'sse', or 'http'") },
  { name: 'stdio without a command', data: { name: 'zz-validation-only', transport: 'stdio' }, check: (e) => expect(e).toBe('command is required for stdio transport') },
  { name: 'http without a url', data: { name: 'zz-validation-only', transport: 'http' }, check: (e) => expect(e).toBe('url is required for sse/http transport') },
  { name: 'headers that are not an object', data: { name: 'zz-validation-only', transport: 'http', url: 'http://127.0.0.1:9', headers: [] }, check: (e) => expect(e).toBe('headers must be a JSON object') },
];
for (const { name, data, check } of invalidCreates) {
  test(`creating a server with ${name} is rejected`, async ({ mcp }) => {
    const response = await mcp.create(data);

    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.success).toBe(false);
    check(body.error);
  });
}

const unknownId = 999999999;
const unknownCalls = [
  { name: 'get', call: (m) => m.get(unknownId) },
  { name: 'update', call: (m) => m.update(unknownId, { name: 'x' }) },
  { name: 'delete', call: (m) => m.delete(unknownId) },
  { name: 'list the tools of', call: (m) => m.serverTools(unknownId) },
];
for (const { name, call } of unknownCalls) {
  test(`${name} an unknown server is a 404`, async ({ mcp }) => {
    const response = await call(mcp);

    expect(response.status()).toBe(404);
    expect(await response.json()).toMatchObject({ success: false, error: `Server ${unknownId} not found` });
  });
}

test('creating a server without a token is rejected', async ({ anonymous }) => {
  await expectUnauthorized(await new McpClient(anonymous).create({}));
});
