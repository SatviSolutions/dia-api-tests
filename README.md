# DIA API Tests

API automation for the DIA application, **primary framework: Playwright Test + `APIRequestContext`, JavaScript only**.

```
JavaScript spec  ->  Playwright Test  ->  APIRequestContext (client class)  ->  DIA API :8081  ->  response  ->  expect()
```

**Rules for this project:** JavaScript only (no TypeScript), Playwright's built-in request client only (no other HTTP or API-testing
library), API only (no browser, no `page`, no UI selectors), no database testing (data correctness lives in the separate
`dia-db-test` project).

## Run

```bash
npm install
cp pw-poc/.env.example pw-poc/.env      # then fill in DIA_USERNAME / DIA_PASSWORD (gitignored, never commit it)
npm test                                # whole Playwright API suite (same as `npm run test:api`), about 12 s; also refreshes the consolidated report (see below)
npm run test:api:report                 # open the HTML report of the last run
npx playwright test -c pw-poc tests/authz.spec.js        # one spec
npx playwright test -c pw-poc -g "history limit"         # tests whose title matches
```

Reports: `pw-poc/playwright-report/` (HTML) and `pw-poc/results/junit.xml`. Browsers are never launched, so
`npx playwright install` is not needed for these tests.

## Consolidated endpoint report (http://localhost:9400)

One page that combines **test execution results** with an **endpoint-by-endpoint status** for all 594 routes of
`pw-poc/endpoint-inventory.json`, with filters (method, route search, module, status), expandable details per endpoint and per test,
failure reasons, BLOCKED reasons with what is needed to unblock, and documentation-drift flags.

```bash
npm test                 # run the FULL suite, publish the report and make sure the report server is running (same as npm run test:report)
npm run report:start     # start the report server in the background -> open http://localhost:9400/
npm run report:stop      # stop it         (npm run report:status shows whether it runs; npm run report:serve = foreground)
```

After every `npm test` the report server is started if it is not already running and its URL is printed (the test exit code is preserved). The server binds `127.0.0.1:9400` only. If the port is taken it stops with a message and never picks another one
(`DIA_REPORT_PORT` overrides it explicitly). A new report appears on its own; the open page reloads itself.

**Endpoint statuses** (computed from the run, separate from the documented classification, which is never edited):
`PASSED` (a test-body request reached it and every test that reached it passed), `FAILED`, `SKIPPED`, `DEFECT-ONLY` (reached only
by expected-failure `test.fail` tests, which never establish PASSED), `BLOCKED`, `MISSING`, `NOT REQUIRED`, and `NOT RUN` (documented as
covered but not reached in this run, and every unreached covered endpoint in a partial run). An HTTP 200 alone never makes an endpoint
PASSED. Only requests made inside the test body count: `beforeAll`/`afterAll`, fixtures, logins and cleanup are kept apart as
diagnostics. A **DRIFT** badge flags a disagreement between the run and the documented classification (for example a documented Missing
route that a test reached). Response codes shown are the recorded ones; routes nobody requested show none.

**Which run replaces which report** (`pw-poc/report/`, generated and gitignored):

| Run | Published to | Replaces the main report? |
|---|---|---|
| complete, successful full suite (no unexpected failure) | `/` (`report/current`) | yes, atomically |
| complete full suite with unexpected test failures | `/failed-full` (FAILED endpoints are shown there) | no, the main report is preserved |
| partial (spec file, `-g`, shard, `.only`, missing spec, tests that did not run, fewer tests than the last full run) | `/partial` | never |
| interrupted, global error, environment/login failure, no test executed (e.g. `--list`), report-generation error | nowhere | no, the last valid report stays |

If completeness cannot be established the run counts as partial. Reports are built in a staging directory, validated (counts add up, no
secret or JWT in the output) and published by atomically replacing a symlink; only the previous run directory of the same slot is
removed. The existing `playwright-report/` and `results/junit.xml` outputs are still written by every run, as before. Reports contain
no headers, tokens, request bodies or query values, and error text is redacted.

## Configuration (environment variables)

| Variable | Purpose |
|---|---|
| `DIA_BASE_URL` | DIA gateway (default `http://localhost:8081`) |
| `DIA_USERNAME`, `DIA_PASSWORD` | admin account used by the authenticated context |
| `DIA_MAX_RESPONSE_MS` | response-time limit per request (default 3000) |
| `DIA_VIEWER_USERNAME`, `DIA_VIEWER_PASSWORD` | optional NON-admin account; enables `tests/roleBased.spec.js` |

Real environment variables win over `pw-poc/.env`. Missing credentials make the suite fail loudly; it never guesses.

## Architecture (`pw-poc/`)

| Path | Role |
|---|---|
| `playwright.config.js` | config, env loading, reporters (list, HTML, JUnit), 4 workers |
| `fixtures/api.js` | `anonymous` (no token) and `api` (admin token) contexts, `viewerToken`, one client per area, and the automatic global checks |
| `clients/*.js` | one class per API area (request code only, **no assertions**) |
| `helpers/assertions.js` | the few repeated checks: `expectError`, `expectUnauthorized`, `expectNoSensitiveData`, `expectNoSecretKeys` |
| `tests/*.spec.js` | the tests: the request, the input and the expected behaviour are visible in each test |
| `COVERAGE_MAP.md` | endpoint-level coverage of the QA backend source (594 route + method combinations): status (Covered, Defect-only, Missing, Blocked, Not Required), priority, notes, a BLOCKED section with reason and unblock requirement, and a separate uncounted section for routes found only in `/home/dia/backend` |
| `COVERAGE_GAPS.md` | prioritised remaining gaps (dated snapshot) |
| `reporters/` | the consolidated-report reporter, route matcher and HTML/JUnit renderer (only active with `npm run test:report`) |
| `report/serve.js` | the local report server (`127.0.0.1:9400`); generated reports under `report/` are gitignored |
| `endpoint-inventory.json` | machine-readable copy of the inventory (static classification read from source; **not** a runtime result and not verified runtime availability) |

**Global checks** run automatically after every test (fixture `checks`): response time, no unexpected 5xx, no echoed password, no
secret-shaped fields. In `test.fail` tests they are recorded as annotations so a fixed defect still flips the test to red.

**Known defects** are `test.fail(...)` with the correct expected behaviour: the test passes while the defect exists and goes red
when DIA fixes it (then remove `.fail`). Never weaken them. 65 exist today.

**Lifecycle (E2E) workflows** are serial describes (`*.workflow.spec.js`): they create uniquely named throw-away data, feed each
response into the next call, and an `afterAll` always deletes and verifies. They never touch seeded data.

**Authorization:** admin vs anonymous vs bad-token is fully covered. The 7 non-admin tests skip with `BLOCKED: no non-admin
credentials` until `DIA_VIEWER_*` is set (their expectations are not yet verified against a live non-admin session).

## KNOWN DEFECTS

Tests titled `KNOWN DEFECT: ...` (`test.fail`) assert the **correct** behaviour and are expected to fail until the backend is fixed
(verified against the live backend and `backend/app` source, 2026-10-05). Never weaken them to make them pass.
65 reproduce today; each maps to one of the defects below.

| # | Defect | Severity |
|---|---|---|
| 1 | **`/api/trino/*` has no authentication.** `catalog-configs` returns connector properties incl. database user/password and JDBC URL (also returned to authenticated callers), and `POST /api/trino/query` runs SQL anonymously against a catalog federating DIA's own PostgreSQL | Critical |
| 2 | **`GET /api/repo/api-keys/<id>/reveal` returns the decrypted LLM API key with no token**; LLM provider/model/key create, connection create/update/delete and file upload are also reachable anonymously (the whole `/api/repo/*` blueprint is unauthenticated, and an invalid token is accepted) | Critical |
| 3 | `/api/logs/files`, `/api/logs/content/<file>` expose the application log without a token | High |
| 4 | `/api/trino/catalogs|functions|queries|info|validate-connection`, `/api/semantic/*`, `/api/connections/*knowledge-graph*`, `/api/agents/*` (incl. create), `/chat/providers`, `/chat/prompts`, `/api/dashboard`, `/api/repo/query-history|admin-stats|llm-providers` require no token | High |
| 5 | `POST /auth/api/login` with non-string username/password -> 500 + Werkzeug interactive-debugger page; same debugger page for few-shot delete and LLM provider create with wrong types | High |
| 6 | `POST /execute` with `connection_name: 123` leaks DIA's internal query on `connections` (incl. password column) | High |
| 7 | Few-shot set delete -> 500 whenever the set has examples (FK not cascaded) | Medium |
| 8 | `POST /api/prompts/save` with `variables` -> 500 (`column "required" is boolean`), SQL error leaked | Medium |
| 9 | `GET /api/datapilot/status/<id>` -> 500 for every id | Medium |
| 10 | `/execute` with `saved_query_id` of an API-created saved query -> FK violation + INSERT leaked | Medium |
| 11 | `POST /api/repo/llm-models {}` -> 500 + psycopg2 NotNullViolation; `GET /api/semantic/physical-databases/<non-uuid>` -> 500 + psycopg2 error | Medium |
| 12 | Invalid-column execution returns raw `sqlite3.OperationalError` + `[SQL: ...]` (original known defect) | Medium |
| 13 | Non-string `sql` (execute, count, format, check-safety) / `name` (saved-queries) -> 500 `'int' object has no attribute 'strip'`; non-numeric `page` -> raw Python error | Medium |
| 14 | Malformed / array JSON body on `/execute` -> 500 (should be 400) | Low |
| 15 | `/validate` reports `valid: true` for unparseable SQL; DQ rule accepts an unknown template | Low |
| 16 | `GET /api/trino/catalogs/<name-with-hyphen>/schemas` -> 500 + raw TrinoUserError (SQL built by string concatenation) | Medium |
| 17 | Unknown ids return 200 instead of 404: `/status/<id>`, `/connections/<id>/audit`, `/api/jobs/<id>/logs|tasks` | Low |

Previously known and now **fixed in the backend**: `history?limit=abc` returns 400. Its test is unchanged and now passes.

## Not exposed by this environment

* **Navigator** is served under **`/datapilot/api/navigator/*`** (the gateway's `/datapilot/api/*` route), not `/api/navigator/*` (which returns 405 like any unregistered `/api/` path). It is used by the DataPilot UI for schema browsing and can start `METADATA_FETCH` background jobs. It is **not covered yet** (see `COVERAGE_GAPS.md`).
* `/ws` (WebSocket chat/DataPilot streaming) cannot be driven by the request fixture.
* The gateway (`:8081`) routes `/api/*`, `/auth/*`, `/chat/*` (a fixed list), `/health` to the backend. Mount points differ from the
  blueprint source: chat is `/chat/*` not `/api/chat/*`; cache manager is `/api/cache-manager/api/*`; knowledge graph is
  `/api/connections/<id>/knowledge-graph*`.

## Blocked (not skipped silently)

Blocked endpoints are never counted as covered. Every blocked route (170 in the QA inventory) is listed with its exact method, route, reason and what is needed to unblock it in the **BLOCKED endpoints** section of `pw-poc/COVERAGE_MAP.md`; the table below summarises the main causes.

| Item | Why |
|---|---|
| Role-based authorization (403 for non-admin) | No non-admin credentials are provided to this project (local accounts `test.analyst/steward/viewer` exist but their passwords are not documented). `tests/roleBased.spec.js` (7 tests) is written from `admin_required` and is **reported as skipped, with the reason**, until `DIA_VIEWER_USERNAME`/`DIA_VIEWER_PASSWORD` are set. Not yet verified against a live non-admin session. |
| Positive user role/active/delete | There is no create-user API; it would mutate shared real accounts, and a role change flips `role_source` to `local` irreversibly for SSO users. Needs an explicitly approved disposable account. |
| Successful file upload | Writes a permanent file on the server and there is no delete API; only validation is tested. |
| Create/connect real MCP server, create jobs, worker scale, KG build/enable | Spawn processes/start real work or resize shared pools. |
| Create grants/policies, change role switches, delete the default LLM provider, `cache-manager/delete-all-cache` | Would change the shared permission/LLM/cache posture. |
| Agent chat/delegate, chat messages | Need a running LLM and WebSocket. |
| PostgreSQL connection `test` | Points at localhost:5432, unreachable in this environment (Oracle is covered with `FROM DUAL`). |
