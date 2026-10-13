// Playwright fixtures: a logged-in API context + clients, an anonymous context for security tests,
// and an automatic per-test version of the four global response checks:
// response time, no unexpected 5xx, no echoed password, no secret-shaped fields.
const base = require('@playwright/test');
const { AuthClient } = require('../clients/authClient');
const { DataPilotClient } = require('../clients/datapilotClient');
const { TrinoClient } = require('../clients/trinoClient');
const { ConnectionsClient } = require('../clients/connectionsClient');
const { CacheClient } = require('../clients/cacheClient');
const { SemanticClient } = require('../clients/semanticClient');
const { TabsClient } = require('../clients/tabsClient');
const { DqClient } = require('../clients/dqClient');
const { McpClient } = require('../clients/mcpClient');
const { JobsClient } = require('../clients/jobsClient');
const { LlmClient } = require('../clients/llmClient');
const { PromptsClient } = require('../clients/promptsClient');
const { FewShotsClient } = require('../clients/fewShotsClient');
const { AgentsClient } = require('../clients/agentsClient');
const { ChatClient } = require('../clients/chatClient');
const { AuthzClient } = require('../clients/authzClient');
const { echoesPassword, secretFieldsIn } = require('../helpers/assertions');

const baseURL = process.env.DIA_BASE_URL;
const MAX_RESPONSE_MS = Number(process.env.DIA_MAX_RESPONSE_MS || 3000);

// Every request made through `api` / `anonymous` is recorded here; the `checks` fixture inspects it after each test.
const calls = { current: [] };
const HTTP_METHODS = new Set(['get', 'post', 'put', 'patch', 'delete', 'head', 'fetch']);
function recorded(context) {
  return new Proxy(context, {
    get(target, prop) {
      const value = target[prop];
      if (typeof value !== 'function') return value;
      if (!HTTP_METHODS.has(prop)) return value.bind(target);
      return async (...args) => {
        const started = Date.now();
        const response = await value.apply(target, args);
        const requestData = args[1] && args[1].data;
        calls.current.push({ method: prop.toUpperCase(), url: response.url(), status: response.status(), ms: Date.now() - started, requestData, response });
        return response;
      };
    },
  });
}

// The global checks that look at every response: time, echoed password, secret-shaped fields.
async function globalProblems() {
  const found = [];
  for (const c of calls.current) {
    const where = `${c.method} ${c.url}`;
    if (c.ms > MAX_RESPONSE_MS) found.push(`${where} took ${c.ms}ms (limit ${MAX_RESPONSE_MS}ms)`);
    let text = '';
    try { text = await c.response.text(); } catch { /* body unavailable */ }
    if (echoesPassword(c.requestData, text)) found.push(`${where} echoes the submitted password in a "password" field`);
    for (const pattern of secretFieldsIn(text)) found.push(`${where} exposes a secret-like field matching ${pattern}`);
  }
  return found;
}

const test = base.test.extend({
  // Worker-scoped: one login and two HTTP contexts per worker, shared by all its tests.
  anonymous: [async ({ playwright }, use) => {
    const ctx = await playwright.request.newContext({ baseURL });
    await use(recorded(ctx));
    await ctx.dispose();
  }, { scope: 'worker' }],

  token: [async ({ anonymous }, use) => {
    const { DIA_USERNAME: username, DIA_PASSWORD: password } = process.env;
    if (!username || !password) throw new Error('Set DIA_USERNAME and DIA_PASSWORD (environment variables or pw-poc/.env; see pw-poc/.env.example)');
    const res = await anonymous.post('/auth/api/login', { data: { username, password } });
    if (!res.ok()) throw new Error(`Login failed: HTTP ${res.status()}`);
    await use((await res.json()).token);
  }, { scope: 'worker' }],

  // A NON-admin session for the role-based tests: null when DIA_VIEWER_USERNAME / DIA_VIEWER_PASSWORD are not provided.
  viewerToken: [async ({ anonymous }, use) => {
    const { DIA_VIEWER_USERNAME: username, DIA_VIEWER_PASSWORD: password } = process.env;
    if (!username || !password) return use(null);
    const res = await anonymous.post('/auth/api/login', { data: { username, password } });
    if (!res.ok()) throw new Error(`Non-admin login failed: HTTP ${res.status()}`);
    await use((await res.json()).token);
  }, { scope: 'worker' }],

  api: [async ({ playwright, token }, use) => {
    const ctx = await playwright.request.newContext({ baseURL, extraHTTPHeaders: { Authorization: `Bearer ${token}` } });
    await use(recorded(ctx));
    await ctx.dispose();
  }, { scope: 'worker' }],

  auth: async ({ anonymous }, use) => use(new AuthClient(anonymous)),
  datapilot: async ({ api }, use) => use(new DataPilotClient(api)),
  trino: async ({ api }, use) => use(new TrinoClient(api)),
  connections: async ({ api }, use) => use(new ConnectionsClient(api)),
  cache: async ({ api }, use) => use(new CacheClient(api)),
  semantic: async ({ api }, use) => use(new SemanticClient(api)),
  tabs: async ({ api }, use) => use(new TabsClient(api)),
  dq: async ({ api }, use) => use(new DqClient(api)),
  mcp: async ({ api }, use) => use(new McpClient(api)),
  jobs: async ({ api }, use) => use(new JobsClient(api)),
  llm: async ({ api }, use) => use(new LlmClient(api)),
  prompts: async ({ api }, use) => use(new PromptsClient(api)),
  fewshots: async ({ api }, use) => use(new FewShotsClient(api)),
  agents: async ({ api }, use) => use(new AgentsClient(api)),
  chat: async ({ api }, use) => use(new ChatClient(api)),
  authz: async ({ api }, use) => use(new AuthzClient(api)),

  // Runs for every test automatically; tests only ask for `checks` to inspect or reset what was recorded.
  // - 4xx responses are fine (many tests expect them).
  // - 5xx is tolerated only in tests declared `test.fail` (known defects) or annotated `allow-5xx`.
  // - In `test.fail` tests the other global problems are reported as annotations instead of failures, so a
  //   fixed defect still flips the test to red instead of being masked by an unrelated global finding.
  checks: [async ({ token }, use, testInfo) => { // `token` first, so the one-off worker login is not counted
    calls.current = [];
    await use({
      problems: globalProblems, // everything the global checks object to so far, as readable strings
      reset: () => { calls.current = []; }, // only for self-tests that provoke a violation on purpose
    });
    const knownDefect = testInfo.expectedStatus === 'failed';
    const problems = await globalProblems();
    if (knownDefect) problems.forEach((description) => testInfo.annotations.push({ type: 'global-check', description }));
    else base.expect(problems, 'global response checks').toEqual([]);
    const tolerates5xx = knownDefect || testInfo.annotations.some((a) => a.type === 'allow-5xx');
    if (!tolerates5xx) {
      const errors = calls.current.filter((c) => c.status >= 500).map((c) => `${c.method} ${c.url} -> ${c.status}`);
      base.expect(errors, 'unexpected 5xx responses').toEqual([]);
    }
  }, { auto: true }],
});

module.exports = { test, expect: base.expect };
