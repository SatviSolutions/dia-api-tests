# DIA API endpoint coverage (Playwright)

_Revised 2026-10-14 (previous version generated 2026-10-07)._ **Inventory source:** the QA backend source tree `/home/dia-qa/backend/app` (Quart blueprints registered in `app/__init__.py` plus the FastAPI v2 app mounted at `/api/v2`), read statically. The compose file for the QA stack suggests this tree is what serves the gateway on `:8081`, but **that has not been verified at runtime**, so this inventory does **not** claim verified runtime availability. Routes that exist only in `/home/dia/backend` are kept in a separate, uncounted section at the bottom.

**Denominator: 594 route+method combinations** = 529 Quart combinations (439 distinct paths, including 2 WebSocket routes and the catch-all CORS `OPTIONS`) + 65 FastAPI v2 combinations (52 distinct paths) from `/home/dia-qa`. Not inventoried: none known. "Covered" means a non-skipped test in the suite targets the route, determined by statically tracing the test code to the requests it sends (the last full run I observed, on 2026-10-08, had 448 passed, 0 failed, 7 skipped); it is **not** a runtime-verified result of the planned consolidated report.

| Status | Routes | Share |
|---|---:|---:|
| Covered | 160 | 27% |
| Defect-only | 10 | 2% |
| Missing | 239 | 40% |
| Blocked | 170 | 29% |
| Not Required | 15 | 3% |
| **Total** | **594** | |

**Coverage = 160/594 (26.9%)**; excluding Not Required routes: 160/579 (27.6%). Calculation: Covered routes divided by all inventoried routes (second figure: minus the 15 Not Required routes). Original-scope check: the 432 routes of the 2026-10-07 map are included here; of those 160 are Covered (37.0% of 432; the old document stated 171/432, 40%; one row, `GET /api/repo/<model>`, had no real test, and 10 routes reached only by expected-failure tests are no longer counted).

**Not counted as covered:** 10 routes are reached only by KNOWN DEFECT (`test.fail`, expected-failure) tests, mostly anonymous requests, so no authenticated happy-path request exists (status *Defect-only*). Skipped tests (the 7 role-based ones) are never counted. Of the 160 Covered routes, **49** are exercised only by negative, validation, auth or unknown/empty-state tests (happy path not exercised; the flag text in the Notes column says which); together with the 10 Defect-only routes that makes 59 routes without a passing happy-path test (the old map said 51). **Blocked routes are NOT covered**: each is listed in the BLOCKED section with its reason and what is needed to unblock it.

Open work by priority (from the inventory): **P0**: 12 missing, 20 blocked; **P1**: 177 missing, 74 blocked; **P2**: 50 missing, 76 blocked. Defect-only routes (not counted as covered): P0 1, P1 6, P2 3.

## By area

| Area | Covered | Defect-only | Missing | Blocked | Not Required | Total |
|---|---:|---:|---:|---:|---:|---:|
| Semantic models | 7 | 1 | 61 | 15 | 0 | 84 |
| Navigator | 0 | 0 | 25 | 8 | 0 | 33 |
| Connections / LLM / queries (repo) | 27 | 2 | 20 | 7 | 2 | 58 |
| Authorization | 16 | 0 | 6 | 11 | 0 | 33 |
| Trino | 10 | 2 | 8 | 8 | 0 | 28 |
| DataPilot (SQL, saved queries, viz, autocomplete) | 28 | 0 | 2 | 0 | 0 | 30 |
| Jobs | 6 | 2 | 0 | 10 | 0 | 18 |
| Prompts | 6 | 0 | 9 | 0 | 2 | 17 |
| Data quality | 5 | 0 | 11 | 0 | 0 | 16 |
| Knowledge graph | 4 | 0 | 3 | 9 | 0 | 16 |
| MCP servers | 8 | 0 | 0 | 7 | 0 | 15 |
| Agents | 8 | 0 | 2 | 3 | 0 | 13 |
| Cache manager | 7 | 0 | 1 | 4 | 1 | 13 |
| Weave flows | 0 | 0 | 10 | 2 | 0 | 12 |
| Authentication & users | 9 | 0 | 0 | 0 | 0 | 9 |
| Chat | 2 | 0 | 1 | 5 | 0 | 8 |
| Docker services | 0 | 0 | 0 | 0 | 8 | 8 |
| Few-shots | 5 | 0 | 1 | 0 | 1 | 7 |
| Application logs | 0 | 2 | 1 | 0 | 0 | 3 |
| Health | 1 | 0 | 2 | 0 | 0 | 3 |
| Dashboard | 0 | 1 | 0 | 0 | 0 | 1 |
| Auth admin: providers / roles / integrations | 0 | 0 | 7 | 9 | 0 | 16 |
| Auth admin: role mappings | 0 | 0 | 3 | 4 | 0 | 7 |
| Connector OAuth | 0 | 0 | 10 | 25 | 0 | 35 |
| Conversations / messages | 0 | 0 | 12 | 0 | 0 | 12 |
| DataPilot chat sessions | 0 | 0 | 1 | 3 | 0 | 4 |
| OAuth / SSO | 0 | 0 | 1 | 5 | 0 | 6 |
| Other | 11 | 0 | 0 | 0 | 1 | 12 |
| Voice | 0 | 0 | 6 | 4 | 0 | 10 |
| WebSocket | 0 | 0 | 0 | 2 | 0 | 2 |
| v2 (FastAPI) | 0 | 0 | 19 | 0 | 0 | 19 |
| v2 faceted search (FastAPI) | 0 | 0 | 17 | 29 | 0 | 46 |

## BLOCKED endpoints (not covered)

Each row: method, exact route, why it cannot be tested safely today, and what is needed to unblock it. Blocked is a statement about the test environment, not about the endpoint existing.

| Method | Route | Reason | To unblock | Priority |
|---|---|---|---|---|
| POST | `/api/agents/chat` | needs a running LLM / reloads the shared runtime | a running LLM; explicit approval for /reload (shared runtime) | P1 |
| POST | `/api/agents/delegate` | needs a running LLM / reloads the shared runtime | a running LLM; explicit approval for /reload (shared runtime) | P1 |
| POST | `/api/agents/reload` | needs a running LLM / reloads the shared runtime | a running LLM; explicit approval for /reload (shared runtime) | P1 |
| POST | `/auth/admin/integrations/<name>/enable` | changes the shared authentication posture (providers/roles); provider test calls an external IdP | explicit approval + a disposable provider/role (changes the shared auth posture; provider test calls an external IdP) | P0 |
| DELETE | `/auth/admin/providers/<provider_name>` | changes the shared authentication posture (providers/roles); provider test calls an external IdP | explicit approval + a disposable provider/role (changes the shared auth posture; provider test calls an external IdP) | P0 |
| POST | `/auth/admin/providers/<provider_name>` | changes the shared authentication posture (providers/roles); provider test calls an external IdP | explicit approval + a disposable provider/role (changes the shared auth posture; provider test calls an external IdP) | P0 |
| POST | `/auth/admin/providers/<provider_name>/enable` | changes the shared authentication posture (providers/roles); provider test calls an external IdP | explicit approval + a disposable provider/role (changes the shared auth posture; provider test calls an external IdP) | P0 |
| POST | `/auth/admin/providers/<provider_name>/test` | changes the shared authentication posture (providers/roles); provider test calls an external IdP | explicit approval + a disposable provider/role (changes the shared auth posture; provider test calls an external IdP) | P0 |
| POST | `/auth/admin/roles/api/roles` | changes the shared authentication posture (providers/roles); provider test calls an external IdP | explicit approval + a disposable provider/role (changes the shared auth posture; provider test calls an external IdP) | P0 |
| DELETE | `/auth/admin/roles/api/roles/<role_id>` | changes the shared authentication posture (providers/roles); provider test calls an external IdP | explicit approval + a disposable provider/role (changes the shared auth posture; provider test calls an external IdP) | P0 |
| PUT | `/auth/admin/roles/api/roles/<role_id>` | changes the shared authentication posture (providers/roles); provider test calls an external IdP | explicit approval + a disposable provider/role (changes the shared auth posture; provider test calls an external IdP) | P0 |
| POST | `/auth/admin/roles/api/roles/seed` | changes the shared authentication posture (providers/roles); provider test calls an external IdP | explicit approval + a disposable provider/role (changes the shared auth posture; provider test calls an external IdP) | P0 |
| POST | `/auth/admin/role-mappings/api/mappings` | changes the shared role-mapping posture | explicit approval + a disposable provider/role (changes the shared auth posture; provider test calls an external IdP) | P1 |
| DELETE | `/auth/admin/role-mappings/api/mappings/<mapping_id>` | changes the shared role-mapping posture | explicit approval + a disposable provider/role (changes the shared auth posture; provider test calls an external IdP) | P1 |
| PUT | `/auth/admin/role-mappings/api/mappings/<mapping_id>` | changes the shared role-mapping posture | explicit approval + a disposable provider/role (changes the shared auth posture; provider test calls an external IdP) | P1 |
| POST | `/auth/admin/role-mappings/api/reload` | changes the shared role-mapping posture | explicit approval + a disposable provider/role (changes the shared auth posture; provider test calls an external IdP) | P1 |
| POST | `/api/authz/classifications` | changes the shared permission posture | your explicit approval + a disposable connection, user and role to change (isolated, restored afterwards) | P0 |
| DELETE | `/api/authz/classifications/<int:classification_id>` | changes the shared permission posture | your explicit approval + a disposable connection, user and role to change (isolated, restored afterwards) | P0 |
| DELETE | `/api/authz/connections/<int:conn_id>/credentials` | changes the shared permission posture | your explicit approval + a disposable connection, user and role to change (isolated, restored afterwards) | P0 |
| PUT | `/api/authz/connections/<int:conn_id>/credentials` | changes the shared permission posture | your explicit approval + a disposable connection, user and role to change (isolated, restored afterwards) | P0 |
| PUT | `/api/authz/connections/<int:conn_id>/matrix` | changes the shared permission posture | your explicit approval + a disposable connection, user and role to change (isolated, restored afterwards) | P0 |
| PUT | `/api/authz/connections/<int:conn_id>/passthrough` | changes the shared permission posture | your explicit approval + a disposable connection, user and role to change (isolated, restored afterwards) | P0 |
| PUT | `/api/authz/connections/<int:conn_id>/posture` | changes the shared permission posture | your explicit approval + a disposable connection, user and role to change (isolated, restored afterwards) | P0 |
| POST | `/api/authz/requests/<int:request_id>/approve` | changes the shared permission posture | your explicit approval + a disposable connection, user and role to change (isolated, restored afterwards) | P0 |
| POST | `/api/authz/requests/<int:request_id>/deny` | changes the shared permission posture | your explicit approval + a disposable connection, user and role to change (isolated, restored afterwards) | P0 |
| POST | `/api/authz/roles/<role_name>/clear-group` | changes the shared permission posture | your explicit approval + a disposable connection, user and role to change (isolated, restored afterwards) | P0 |
| PUT | `/api/authz/users/<int:user_id>/attributes` | changes the shared permission posture | your explicit approval + a disposable connection, user and role to change (isolated, restored afterwards) | P0 |
| DELETE | `/api/cache-manager/api/delete-all-cache` | result cache degraded here (DORIS disabled) / destructive | result cache enabled (DORIS) + explicit approval for destructive deletes | P2 |
| DELETE | `/api/cache-manager/api/delete-cache-entry/<int:query_log_id>` | result cache degraded here (DORIS disabled) / destructive | result cache enabled (DORIS) + explicit approval for destructive deletes | P2 |
| DELETE | `/api/datapilot/cache/<int:query_log_id>` | result cache degraded here (DORIS disabled) / destructive | result cache enabled (DORIS) + explicit approval for destructive deletes | P2 |
| GET | `/api/datapilot/cache/<int:query_log_id>/cell` | result cache degraded here (DORIS disabled) / destructive | result cache enabled (DORIS) + explicit approval for destructive deletes | P2 |
| DELETE | `/chat/attachments/<attachment_id>` | writes files or changes the shared chat configuration | a disposable attachment + a sandboxed chat configuration | P2 |
| GET | `/chat/attachments/<attachment_id>` | writes files or changes the shared chat configuration | a disposable attachment + a sandboxed chat configuration | P1 |
| POST | `/chat/history/clear` | writes files or changes the shared chat configuration | a disposable attachment + a sandboxed chat configuration | P2 |
| POST | `/chat/prompts` | writes files or changes the shared chat configuration | a disposable attachment + a sandboxed chat configuration | P2 |
| POST | `/chat/upload` | writes files or changes the shared chat configuration | a disposable attachment + a sandboxed chat configuration | P2 |
| POST | `/api/repo/<model>/new` | RECLASSIFIED from Not Required: generic create of arbitrary model rows with no delete API | explicit approval; generic CRUD can create arbitrary model rows with no delete API | P1 |
| POST | `/api/repo/connections/preview-rest-api` | calls an external REST service, a provider or a model runtime | a mock/stub provider or REST service (no real external calls) | P1 |
| POST | `/api/repo/llm-providers/<int:provider_id>/discover-models` | calls an external REST service, a provider or a model runtime | a mock/stub provider or REST service (no real external calls) | P1 |
| POST | `/api/repo/llm-providers/<int:provider_id>/health-check` | calls an external REST service, a provider or a model runtime | a mock/stub provider or REST service (no real external calls) | P1 |
| POST | `/api/repo/llm-providers/<int:provider_id>/onnx-load-model` | calls an external REST service, a provider or a model runtime | a mock/stub provider or REST service (no real external calls) | P1 |
| POST | `/api/repo/llm-providers/<int:provider_id>/onnx-unload-model` | calls an external REST service, a provider or a model runtime | a mock/stub provider or REST service (no real external calls) | P1 |
| POST | `/api/repo/llm-providers/<int:provider_id>/sync-models` | calls an external REST service, a provider or a model runtime | a mock/stub provider or REST service (no real external calls) | P1 |
| GET | `/auth/api/atlassian-mcp/callback` | starts or completes an external OAuth flow (redirect and token exchange) | an identity-provider/connector account or a stub provider | P2 |
| GET | `/auth/api/atlassian-mcp/connect` | starts or completes an external OAuth flow (redirect and token exchange) | an identity-provider/connector account or a stub provider | P2 |
| DELETE | `/auth/api/atlassian-mcp/disconnect` | changes or revokes the caller's stored OAuth tokens | a disposable connected test user, and approval to alter stored tokens | P2 |
| GET | `/auth/api/atlassian-mcp/tools` | lists tools through the MCP tool service, which loads live from the external MCP server when the caller is connected. UNCERTAIN: for a user with no stored token it may return an empty list without any external call; not verified, so not reclassified | a connected test account or a stub MCP server; or confirm the unconnected behaviour from source and test only that | P2 |
| POST | `/auth/api/atlassian/ask` | external sync, embedding and LLM work against the connected service | a connected test account, an embedding/LLM service, and agreed cleanup of the index | P2 |
| GET | `/auth/api/atlassian/callback` | starts or completes an external OAuth flow (redirect and token exchange) | an identity-provider/connector account or a stub provider | P2 |
| GET | `/auth/api/atlassian/connect` | starts or completes an external OAuth flow (redirect and token exchange) | an identity-provider/connector account or a stub provider | P2 |
| PUT | `/auth/api/atlassian/connector` | changes the caller's connector settings (local database write, not an external call). UNCERTAIN: could be tested if the previous settings are saved and restored; not reclassified | approval, plus saving and restoring the previous settings | P2 |
| DELETE | `/auth/api/atlassian/disconnect` | changes or revokes the caller's stored OAuth tokens | a disposable connected test user, and approval to alter stored tokens | P2 |
| DELETE | `/auth/api/atlassian/index` | deletes the caller's indexed documents; restoring them would need a new sync (inferred from the sync handlers, not verified). UNCERTAIN: could be tested with an approved disposable user | a disposable user whose index may be deleted | P2 |
| GET | `/auth/api/atlassian/search` | live search against the external Atlassian APIs using the caller's token | a connected Atlassian test account or a stub | P2 |
| POST | `/auth/api/atlassian/sync` | external sync, embedding and LLM work against the connected service | a connected test account, an embedding/LLM service, and agreed cleanup of the index | P2 |
| PUT | `/auth/api/database/connector` | changes the caller's connector settings (local database write, not an external call). UNCERTAIN: could be tested if the previous settings are saved and restored; not reclassified | approval, plus saving and restoring the previous settings | P2 |
| GET | `/auth/api/github-mcp/callback` | starts or completes an external OAuth flow (redirect and token exchange) | an identity-provider/connector account or a stub provider | P2 |
| GET | `/auth/api/github-mcp/connect` | starts or completes an external OAuth flow (redirect and token exchange) | an identity-provider/connector account or a stub provider | P2 |
| DELETE | `/auth/api/github-mcp/disconnect` | changes or revokes the caller's stored OAuth tokens | a disposable connected test user, and approval to alter stored tokens | P2 |
| GET | `/auth/api/github-mcp/tools` | lists tools through the MCP tool service, which loads live from the external MCP server when the caller is connected. UNCERTAIN: for a user with no stored token it may return an empty list without any external call; not verified, so not reclassified | a connected test account or a stub MCP server; or confirm the unconnected behaviour from source and test only that | P2 |
| GET | `/auth/api/sharepoint-mcp/callback` | starts or completes an external OAuth flow (redirect and token exchange) | an identity-provider/connector account or a stub provider | P2 |
| GET | `/auth/api/sharepoint-mcp/connect` | starts or completes an external OAuth flow (redirect and token exchange) | an identity-provider/connector account or a stub provider | P2 |
| DELETE | `/auth/api/sharepoint-mcp/disconnect` | changes or revokes the caller's stored OAuth tokens | a disposable connected test user, and approval to alter stored tokens | P2 |
| GET | `/auth/api/sharepoint-mcp/tools` | lists tools through the MCP tool service, which loads live from the external MCP server when the caller is connected. UNCERTAIN: for a user with no stored token it may return an empty list without any external call; not verified, so not reclassified | a connected test account or a stub MCP server; or confirm the unconnected behaviour from source and test only that | P2 |
| POST | `/auth/api/sharepoint/ask` | external sync, embedding and LLM work against the connected service | a connected test account, an embedding/LLM service, and agreed cleanup of the index | P2 |
| PUT | `/auth/api/sharepoint/connector` | changes the caller's connector settings (local database write, not an external call). UNCERTAIN: could be tested if the previous settings are saved and restored; not reclassified | approval, plus saving and restoring the previous settings | P2 |
| DELETE | `/auth/api/sharepoint/index` | deletes the caller's indexed documents; restoring them would need a new sync (inferred from the sync handlers, not verified). UNCERTAIN: could be tested with an approved disposable user | a disposable user whose index may be deleted | P2 |
| POST | `/auth/api/sharepoint/sync` | external sync, embedding and LLM work against the connected service | a connected test account, an embedding/LLM service, and agreed cleanup of the index | P2 |
| DELETE | `/api/datapilot/chat/sessions/<session_id>` | needs a chat session, which can only be created through the WebSocket | a chat session created through the WebSocket (not possible with APIRequestContext) | P2 |
| GET | `/api/datapilot/chat/sessions/<session_id>` | needs a chat session, which can only be created through the WebSocket | a chat session created through the WebSocket (not possible with APIRequestContext) | P2 |
| PATCH | `/api/datapilot/chat/sessions/<session_id>` | needs a chat session, which can only be created through the WebSocket | a chat session created through the WebSocket (not possible with APIRequestContext) | P2 |
| DELETE | `/api/jobs/<string:job_id>` | starts real work / resizes the shared worker pool | a disposable job type that can be cancelled safely; explicit approval before any worker add/remove/scale | P1 |
| POST | `/api/jobs/<string:job_id>/clone` | starts real work / resizes the shared worker pool | a disposable job type that can be cancelled safely; explicit approval before any worker add/remove/scale | P1 |
| POST | `/api/jobs/<string:job_id>/pause` | starts real work / resizes the shared worker pool | a disposable job type that can be cancelled safely; explicit approval before any worker add/remove/scale | P1 |
| POST | `/api/jobs/<string:job_id>/reenqueue-stuck` | starts real work / resizes the shared worker pool | a disposable job type that can be cancelled safely; explicit approval before any worker add/remove/scale | P1 |
| POST | `/api/jobs/<string:job_id>/resume` | starts real work / resizes the shared worker pool | a disposable job type that can be cancelled safely; explicit approval before any worker add/remove/scale | P1 |
| POST | `/api/jobs/<string:job_id>/retry` | starts real work / resizes the shared worker pool | a disposable job type that can be cancelled safely; explicit approval before any worker add/remove/scale | P1 |
| POST | `/api/jobs/semantic-catalog-import` | starts real work / resizes the shared worker pool | a disposable job type that can be cancelled safely; explicit approval before any worker add/remove/scale | P1 |
| POST | `/api/jobs/workers/add` | starts real work / resizes the shared worker pool | a disposable job type that can be cancelled safely; explicit approval before any worker add/remove/scale | P1 |
| POST | `/api/jobs/workers/remove` | starts real work / resizes the shared worker pool | a disposable job type that can be cancelled safely; explicit approval before any worker add/remove/scale | P1 |
| POST | `/api/jobs/workers/scale` | starts real work / resizes the shared worker pool | a disposable job type that can be cancelled safely; explicit approval before any worker add/remove/scale | P1 |
| POST | `/api/connections/<int:connection_id>/knowledge-graph/abbreviations` | starts indexing / needs an LLM, or has no delete API | a running LLM + a throw-away connection/graph | P1 |
| POST | `/api/connections/<int:connection_id>/knowledge-graph/build` | starts indexing / needs an LLM, or has no delete API | a running LLM + a throw-away connection/graph | P1 |
| POST | `/api/connections/<int:connection_id>/knowledge-graph/disable` | starts indexing / needs an LLM, or has no delete API | a running LLM + a throw-away connection/graph | P1 |
| POST | `/api/connections/<int:connection_id>/knowledge-graph/enable` | starts indexing / needs an LLM, or has no delete API | a running LLM + a throw-away connection/graph | P1 |
| POST | `/api/connections/<int:connection_id>/knowledge-graph/feedback` | starts indexing / needs an LLM, or has no delete API | a running LLM + a throw-away connection/graph | P1 |
| POST | `/api/connections/<int:connection_id>/knowledge-graph/golden-queries` | starts indexing / needs an LLM, or has no delete API | a running LLM + a throw-away connection/graph | P1 |
| POST | `/api/connections/<int:connection_id>/knowledge-graph/index-canonical` | starts indexing / needs an LLM, or has no delete API | a running LLM + a throw-away connection/graph | P1 |
| PUT | `/api/connections/<int:connection_id>/knowledge-graph/nodes/<uuid:node_id>` | starts indexing / needs an LLM, or has no delete API | a running LLM + a throw-away connection/graph | P1 |
| POST | `/api/connections/<int:connection_id>/text-to-sql/context` | starts indexing / needs an LLM, or has no delete API | a running LLM + a throw-away connection/graph | P1 |
| POST | `/api/mcp-servers/<int:server_id>/connect` | spawns a process or calls an external MCP server | a harmless local MCP stub server that can be spawned and torn down | P1 |
| POST | `/api/mcp-servers/<int:server_id>/disconnect` | spawns a process or calls an external MCP server | a harmless local MCP stub server that can be spawned and torn down | P1 |
| POST | `/api/mcp-servers/<int:server_id>/execute` | spawns a process or calls an external MCP server | a harmless local MCP stub server that can be spawned and torn down | P1 |
| POST | `/api/mcp-servers/<int:server_id>/test` | spawns a process or calls an external MCP server | a harmless local MCP stub server that can be spawned and torn down | P1 |
| POST | `/api/mcp-servers/<int:server_id>/tools/refresh` | spawns a process or calls an external MCP server | a harmless local MCP stub server that can be spawned and torn down | P1 |
| POST | `/api/mcp-servers/connect-all` | spawns a process or calls an external MCP server | a harmless local MCP stub server that can be spawned and torn down | P1 |
| POST | `/api/mcp-servers/from-registry` | spawns a process or calls an external MCP server | a harmless local MCP stub server that can be spawned and torn down | P1 |
| POST | `/datapilot/api/navigator/async/columns` | starts METADATA_FETCH jobs or changes navigator metadata/config | a throw-away connection + a before/after check of the job list for METADATA_FETCH side effects | P1 |
| POST | `/datapilot/api/navigator/async/tables` | starts METADATA_FETCH jobs or changes navigator metadata/config | a throw-away connection + a before/after check of the job list for METADATA_FETCH side effects | P1 |
| POST | `/datapilot/api/navigator/connections` | starts METADATA_FETCH jobs or changes navigator metadata/config | a throw-away connection + a before/after check of the job list for METADATA_FETCH side effects | P1 |
| POST | `/datapilot/api/navigator/connections/<connection_name>/cache/clear` | starts METADATA_FETCH jobs or changes navigator metadata/config | a throw-away connection + a before/after check of the job list for METADATA_FETCH side effects | P1 |
| POST | `/datapilot/api/navigator/connections/<connection_name>/schemas/<schema_name>/cache/clear` | starts METADATA_FETCH jobs or changes navigator metadata/config | a throw-away connection + a before/after check of the job list for METADATA_FETCH side effects | P1 |
| POST | `/datapilot/api/navigator/connections/<connection_name>/schemas/<schema_name>/tables/<table_name>/cache/clear` | starts METADATA_FETCH jobs or changes navigator metadata/config | a throw-away connection + a before/after check of the job list for METADATA_FETCH side effects | P1 |
| PUT | `/datapilot/api/navigator/connections/<int:conn_id>` | starts METADATA_FETCH jobs or changes navigator metadata/config | a throw-away connection + a before/after check of the job list for METADATA_FETCH side effects | P1 |
| POST | `/datapilot/api/navigator/smart/tables` | starts METADATA_FETCH jobs or changes navigator metadata/config | a throw-away connection + a before/after check of the job list for METADATA_FETCH side effects | P1 |
| POST | `/auth/oauth/<provider_name>/backchannel-logout` | needs an identity provider | an identity provider / external service account, or a stub IdP | P2 |
| GET | `/auth/oauth/<provider_name>/callback` | needs an identity provider | an identity provider / external service account, or a stub IdP | P2 |
| GET | `/auth/oauth/<provider_name>/login` | needs an identity provider | an identity provider / external service account, or a stub IdP | P2 |
| GET | `/auth/oauth/<provider_name>/logout` | needs an identity provider | an identity provider / external service account, or a stub IdP | P2 |
| GET | `/auth/oauth/avatar/<user_id>` | needs an identity provider | an identity provider / external service account, or a stub IdP | P2 |
| POST | `/api/semantic/canonical/bulk/approve` | starts jobs / uses an LLM / bulk-mutates the shared semantic catalog | a disposable semantic model + an LLM where noted + agreed cleanup | P1 |
| POST | `/api/semantic/canonical/bulk/delete` | starts jobs / uses an LLM / bulk-mutates the shared semantic catalog | a disposable semantic model + an LLM where noted + agreed cleanup | P1 |
| POST | `/api/semantic/canonical/bulk/reject` | starts jobs / uses an LLM / bulk-mutates the shared semantic catalog | a disposable semantic model + an LLM where noted + agreed cleanup | P1 |
| GET | `/api/semantic/canonical/entities/<entity_id>/suggested-joins` | RECLASSIFIED from Missing: calls the LLM (canonical_join_suggester) | a disposable semantic model + an LLM where noted + agreed cleanup | P1 |
| POST | `/api/semantic/canonical/generate` | starts jobs / uses an LLM / bulk-mutates the shared semantic catalog | a disposable semantic model + an LLM where noted + agreed cleanup | P1 |
| POST | `/api/semantic/canonical/models/<model_id>/derive-raw-relationships` | starts jobs / uses an LLM / bulk-mutates the shared semantic catalog | a disposable semantic model + an LLM where noted + agreed cleanup | P1 |
| POST | `/api/semantic/canonical/relationships/bulk-verify` | starts jobs / uses an LLM / bulk-mutates the shared semantic catalog | a disposable semantic model + an LLM where noted + agreed cleanup | P1 |
| POST | `/api/semantic/canonical/sources/bulk-verify` | starts jobs / uses an LLM / bulk-mutates the shared semantic catalog | a disposable semantic model + an LLM where noted + agreed cleanup | P1 |
| POST | `/api/semantic/imports/<config_id>/run` | starts jobs / uses an LLM / bulk-mutates the shared semantic catalog | a disposable semantic model + an LLM where noted + agreed cleanup | P1 |
| POST | `/api/semantic/logical-references/bulk-delete` | starts jobs / uses an LLM / bulk-mutates the shared semantic catalog | a disposable semantic model + an LLM where noted + agreed cleanup | P1 |
| POST | `/api/semantic/logical-references/derive-relationships` | starts jobs / uses an LLM / bulk-mutates the shared semantic catalog | a disposable semantic model + an LLM where noted + agreed cleanup | P1 |
| POST | `/api/semantic/logical-references/import/csv` | starts jobs / uses an LLM / bulk-mutates the shared semantic catalog | a disposable semantic model + an LLM where noted + agreed cleanup | P1 |
| POST | `/api/semantic/logical-references/import/sql` | starts jobs / uses an LLM / bulk-mutates the shared semantic catalog | a disposable semantic model + an LLM where noted + agreed cleanup | P1 |
| POST | `/api/semantic/physical-databases/<db_id>/refresh` | starts jobs / uses an LLM / bulk-mutates the shared semantic catalog | a disposable semantic model + an LLM where noted + agreed cleanup | P1 |
| POST | `/api/semantic/wizard/start` | starts jobs / uses an LLM / bulk-mutates the shared semantic catalog | a disposable semantic model + an LLM where noted + agreed cleanup | P1 |
| POST | `/api/trino/catalog-configs` | changes shared Trino configuration / cancels queries | explicit approval + a throw-away catalog (never the shared one) | P1 |
| DELETE | `/api/trino/catalog-configs/<catalog_name>` | changes shared Trino configuration / cancels queries | explicit approval + a throw-away catalog (never the shared one) | P1 |
| PUT | `/api/trino/catalog-configs/<catalog_name>` | changes shared Trino configuration / cancels queries | explicit approval + a throw-away catalog (never the shared one) | P1 |
| POST | `/api/trino/catalog-configs/from-connection` | changes shared Trino configuration / cancels queries | explicit approval + a throw-away catalog (never the shared one) | P1 |
| POST | `/api/trino/catalog-configs/from-file-connection` | changes shared Trino configuration / cancels queries | explicit approval + a throw-away catalog (never the shared one) | P1 |
| PUT | `/api/trino/config` | changes shared Trino configuration / cancels queries | explicit approval + a throw-away catalog (never the shared one) | P1 |
| DELETE | `/api/trino/queries/<query_id>` | changes shared Trino configuration / cancels queries | explicit approval + a throw-away catalog (never the shared one) | P1 |
| POST | `/api/trino/restart` | changes shared Trino configuration / cancels queries | explicit approval + a throw-away catalog (never the shared one) | P1 |
| POST | `/api/voice/synthesize` | needs speech models (STT/TTS/VAD) running | speech models installed (STT/TTS/VAD) | P2 |
| POST | `/api/voice/transcribe` | needs speech models (STT/TTS/VAD) running | speech models installed (STT/TTS/VAD) | P2 |
| POST | `/api/voice/tts_engine` | needs speech models (STT/TTS/VAD) running | speech models installed (STT/TTS/VAD) | P2 |
| POST | `/api/voice/vad/process` | needs speech models (STT/TTS/VAD) running | speech models installed (STT/TTS/VAD) | P2 |
| POST | `/api/weave/flows/<int:flow_id>/preview` | executes a flow | a throw-away flow; run/preview additionally need approval because they execute the flow | P1 |
| POST | `/api/weave/flows/<int:flow_id>/run` | executes a flow | a throw-away flow; run/preview additionally need approval because they execute the flow | P1 |
| WS | `/ws/chat/datapilot` | WebSocket: cannot be driven by APIRequestContext | cannot be driven by APIRequestContext; needs a WebSocket client (outside the allowed stack) | P2 |
| WS | `/ws/chat/general` | WebSocket: cannot be driven by APIRequestContext | cannot be driven by APIRequestContext; needs a WebSocket client (outside the allowed stack) | P2 |
| POST | `/api/v2/facetedsearch/dashboard/{slug}/data` | FastAPI v2 faceted search write/sync/test: needs the external search engine (+ optional LLM) | the external search engine (+ optional LLM) and a throw-away index | P2 |
| POST | `/api/v2/facetedsearch/dashboards` | FastAPI v2 faceted search write/sync/test: needs the external search engine (+ optional LLM) | the external search engine (+ optional LLM) and a throw-away index | P2 |
| POST | `/api/v2/facetedsearch/dashboards/import` | FastAPI v2 faceted search write/sync/test: needs the external search engine (+ optional LLM) | the external search engine (+ optional LLM) and a throw-away index | P2 |
| DELETE | `/api/v2/facetedsearch/dashboards/{dashboard_id}` | FastAPI v2 faceted search write/sync/test: needs the external search engine (+ optional LLM) | the external search engine (+ optional LLM) and a throw-away index | P2 |
| PUT | `/api/v2/facetedsearch/dashboards/{dashboard_id}` | FastAPI v2 faceted search write/sync/test: needs the external search engine (+ optional LLM) | the external search engine (+ optional LLM) and a throw-away index | P2 |
| POST | `/api/v2/facetedsearch/dashboards/{dashboard_id}/duplicate` | FastAPI v2 faceted search write/sync/test: needs the external search engine (+ optional LLM) | the external search engine (+ optional LLM) and a throw-away index | P2 |
| POST | `/api/v2/facetedsearch/dashboards/{dashboard_id}/widgets` | FastAPI v2 faceted search write/sync/test: needs the external search engine (+ optional LLM) | the external search engine (+ optional LLM) and a throw-away index | P2 |
| POST | `/api/v2/facetedsearch/facets` | FastAPI v2 faceted search write/sync/test: needs the external search engine (+ optional LLM) | the external search engine (+ optional LLM) and a throw-away index | P2 |
| POST | `/api/v2/facetedsearch/facets/reorder` | FastAPI v2 faceted search write/sync/test: needs the external search engine (+ optional LLM) | the external search engine (+ optional LLM) and a throw-away index | P2 |
| DELETE | `/api/v2/facetedsearch/facets/{facet_id}` | FastAPI v2 faceted search write/sync/test: needs the external search engine (+ optional LLM) | the external search engine (+ optional LLM) and a throw-away index | P2 |
| PUT | `/api/v2/facetedsearch/facets/{facet_id}` | FastAPI v2 faceted search write/sync/test: needs the external search engine (+ optional LLM) | the external search engine (+ optional LLM) and a throw-away index | P2 |
| POST | `/api/v2/facetedsearch/indexes` | FastAPI v2 faceted search write/sync/test: needs the external search engine (+ optional LLM) | the external search engine (+ optional LLM) and a throw-away index | P2 |
| DELETE | `/api/v2/facetedsearch/indexes/{index_id}` | FastAPI v2 faceted search write/sync/test: needs the external search engine (+ optional LLM) | the external search engine (+ optional LLM) and a throw-away index | P2 |
| PUT | `/api/v2/facetedsearch/indexes/{index_id}` | FastAPI v2 faceted search write/sync/test: needs the external search engine (+ optional LLM) | the external search engine (+ optional LLM) and a throw-away index | P2 |
| POST | `/api/v2/facetedsearch/indexes/{index_id}/reindex` | FastAPI v2 faceted search write/sync/test: needs the external search engine (+ optional LLM) | the external search engine (+ optional LLM) and a throw-away index | P2 |
| POST | `/api/v2/facetedsearch/indexes/{index_id}/sync` | FastAPI v2 faceted search write/sync/test: needs the external search engine (+ optional LLM) | the external search engine (+ optional LLM) and a throw-away index | P2 |
| POST | `/api/v2/facetedsearch/nlp/analyze` | FastAPI v2 faceted search write/sync/test: needs the external search engine (+ optional LLM) | the external search engine (+ optional LLM) and a throw-away index | P2 |
| POST | `/api/v2/facetedsearch/pages/{slug}/search` | FastAPI v2 faceted search write/sync/test: needs the external search engine (+ optional LLM) | the external search engine (+ optional LLM) and a throw-away index | P2 |
| POST | `/api/v2/facetedsearch/search-pages` | FastAPI v2 faceted search write/sync/test: needs the external search engine (+ optional LLM) | the external search engine (+ optional LLM) and a throw-away index | P2 |
| DELETE | `/api/v2/facetedsearch/search-pages/{page_id}` | FastAPI v2 faceted search write/sync/test: needs the external search engine (+ optional LLM) | the external search engine (+ optional LLM) and a throw-away index | P2 |
| PUT | `/api/v2/facetedsearch/search-pages/{page_id}` | FastAPI v2 faceted search write/sync/test: needs the external search engine (+ optional LLM) | the external search engine (+ optional LLM) and a throw-away index | P2 |
| PUT | `/api/v2/facetedsearch/settings` | FastAPI v2 faceted search write/sync/test: needs the external search engine (+ optional LLM) | the external search engine (+ optional LLM) and a throw-away index | P2 |
| POST | `/api/v2/facetedsearch/settings/reset` | FastAPI v2 faceted search write/sync/test: needs the external search engine (+ optional LLM) | the external search engine (+ optional LLM) and a throw-away index | P2 |
| POST | `/api/v2/facetedsearch/settings/test-ai` | FastAPI v2 faceted search write/sync/test: needs the external search engine (+ optional LLM) | the external search engine (+ optional LLM) and a throw-away index | P2 |
| POST | `/api/v2/facetedsearch/settings/test-connection` | FastAPI v2 faceted search write/sync/test: needs the external search engine (+ optional LLM) | the external search engine (+ optional LLM) and a throw-away index | P2 |
| POST | `/api/v2/facetedsearch/widgets/reorder` | FastAPI v2 faceted search write/sync/test: needs the external search engine (+ optional LLM) | the external search engine (+ optional LLM) and a throw-away index | P2 |
| DELETE | `/api/v2/facetedsearch/widgets/{widget_id}` | FastAPI v2 faceted search write/sync/test: needs the external search engine (+ optional LLM) | the external search engine (+ optional LLM) and a throw-away index | P2 |
| PUT | `/api/v2/facetedsearch/widgets/{widget_id}` | FastAPI v2 faceted search write/sync/test: needs the external search engine (+ optional LLM) | the external search engine (+ optional LLM) and a throw-away index | P2 |
| POST | `/api/v2/facetedsearch/widgets/{widget_id}/preview` | FastAPI v2 faceted search write/sync/test: needs the external search engine (+ optional LLM) | the external search engine (+ optional LLM) and a throw-away index | P2 |

## Endpoints

| Endpoint | Method | Playwright test | Status | Priority | Notes / blocker |
|---|---|---|---|---|---|
| `/api/agents/` | GET | it appears in the agent list and the total agrees; KNOWN DEFECT: anonymous GET /api/agents requires a token (+2 more) | Covered | P1 | 4 tests |
| `/api/agents/<int:agent_id>` | DELETE | delete the agent; deleting the agent again is a 404 (+1 more) | Covered | P1 | 3 tests |
| `/api/agents/<int:agent_id>` | GET | read it back: the defaults are applied; the disabled state is persisted (+4 more) | Covered | P1 | 6 tests |
| `/api/agents/<int:agent_id>` | PUT | update the description; updating an unknown agent is a 404 | Covered | P1 | 2 tests |
| `/api/agents/<int:agent_id>/disable` | POST | disable the agent | Covered | P1 | 1 test |
| `/api/agents/<int:agent_id>/enable` | POST | enable the agent; enabling an unknown agent is a 404 | Covered | P1 | 2 tests |
| `/api/agents/create` | POST | create an agent; KNOWN DEFECT: anonymous POST /api/agents/create requires a token (+1 more) | Covered | P1 | 3 tests |
| `/api/agents/status` | GET | the agent runtime status has numeric counters and an agents list | Covered | P1 | 1 test |
| `/api/agents/pin` | POST | — | Missing | P1 | write path: needs a throw-away object with cleanup |
| `/api/agents/unpin` | POST | — | Missing | P1 | write path: needs a throw-away object with cleanup |
| `/api/agents/chat` | POST | — | Blocked | P1 | needs a running LLM |
| `/api/agents/delegate` | POST | — | Blocked | P1 | needs a running LLM |
| `/api/agents/reload` | POST | — | Blocked | P1 | reloads the shared agent runtime |
| `/api/logs/content/<path:filename>` | GET | KNOWN DEFECT: anonymous GET /api/logs/content/app.log requires a token | Defect-only | P2 | 1 test; NOT COUNTED AS COVERED: reached only by KNOWN DEFECT (test.fail) tests, mostly anonymous requests; needs an authenticated happy-path test |
| `/api/logs/files` | GET | KNOWN DEFECT: anonymous GET /api/logs/files requires a token | Defect-only | P2 | 1 test; NOT COUNTED AS COVERED: reached only by KNOWN DEFECT (test.fail) tests, mostly anonymous requests; needs an authenticated happy-path test |
| `/api/logs/tail/<path:filename>` | GET | — | Missing | P2 | read-only; safe to add |
| `/auth/api/login` | POST | login succeeds and returns a JWT plus the full user object; login rejects invalid input: unknown username (+13 more) | Covered | P0 | 15 tests |
| `/auth/api/logout` | POST | logout succeeds | Covered | P0 | 1 test |
| `/auth/api/me` | GET | /me returns the logged-in user with the full schema and no credentials; anonymous GET /auth/api/me is rejected (+4 more) | Covered | P0 | 6 tests |
| `/auth/api/providers` | GET | providers is public and lists the login providers, with a default among them | Covered | P0 | 1 test |
| `/auth/api/refresh` | POST | refresh issues a new JWT for the same user; refresh without a token is rejected | Covered | P0 | 2 tests |
| `/auth/api/users` | GET | the user list has typed users, includes the caller and the four standard roles, and no credentials; list users without a token is rejected | Covered | P0 | 2 tests; non-admin 403 test is skipped (BLOCKED: no non-admin credentials) |
| `/auth/api/users/<int:user_id>` | DELETE | delete a user without a token is rejected; delete a non-existent user is rejected | Covered | P0 | 2 tests; non-admin 403 test is skipped (BLOCKED: no non-admin credentials); negative/validation/auth only: happy path not exercised (verified from tests: only no-token (401) and unknown-user (404) cases; no successful delete (it would remove a real account)) |
| `/auth/api/users/<int:user_id>/active` | PUT | set a user active without a token is rejected; set active on a non-existent user is rejected | Covered | P0 | 2 tests; non-admin 403 test is skipped (BLOCKED: no non-admin credentials); negative/validation/auth only: happy path not exercised (verified from tests: only no-token (401) and unknown-user (404) cases; no successful activation change) |
| `/auth/api/users/<int:user_id>/role` | PUT | update a role without a token is rejected; update role of a non-existent user is rejected (+3 more) | Covered | P0 | 5 tests; non-admin 403 test is skipped (BLOCKED: no non-admin credentials); negative/validation/auth only: happy path not exercised (verified from tests: no-token (401), unknown-user (404), missing role (400), invalid role (400) and the self-demotion guard (400); no successful role change (it would alter a real account)) |
| `/api/authz/access-report` | GET | the access report count matches the events, each with an action and a timestamp; the access report without a token is rejected | Covered | P0 | 2 tests |
| `/api/authz/catalog` | GET | the permission catalog has groups, tiers and a total | Covered | P0 | 1 test |
| `/api/authz/classifications` | GET | classifications is a list | Covered | P0 | 1 test |
| `/api/authz/explain` | GET | explain without its parameters is rejected | Covered | P0 | 1 test; negative/validation/auth only: happy path not exercised |
| `/api/authz/grants` | GET | every grant has the confirmed schema; the grant list without a token is rejected | Covered | P0 | 2 tests |
| `/api/authz/grants` | POST | creating a grant with an invalid subject_type is rejected; grant creation without a token is rejected | Covered | P0 | 2 tests; negative/validation/auth only: happy path not exercised |
| `/api/authz/grants/<int:grant_id>` | DELETE | deleting an unknown grant is rejected | Covered | P0 | 1 test; negative/validation/auth only: happy path not exercised |
| `/api/authz/my-permissions` | GET | my-permissions reports the caller's role and the pages with their privileges; my-permissions without a token is rejected | Covered | P0 | 2 tests |
| `/api/authz/policies` | GET | policies is a list; the policy list without a token is rejected | Covered | P0 | 2 tests |
| `/api/authz/policies` | POST | creating a policy with an invalid kind is rejected | Covered | P0 | 1 test; negative/validation/auth only: happy path not exercised |
| `/api/authz/policies/<int:policy_id>` | DELETE | deleting an unknown policy is rejected | Covered | P0 | 1 test; negative/validation/auth only: happy path not exercised |
| `/api/authz/requests` | POST | creating an access request without object_urn is rejected | Covered | P0 | 1 test; negative/validation/auth only: happy path not exercised |
| `/api/authz/requests/mine` | GET | my access requests is a list | Covered | P0 | 1 test |
| `/api/authz/roles` | GET | the role list contains the standard roles, with their chain and system flag, and a matching total; the role list without a token is rejected (+1 more) | Covered | P0 | 3 tests |
| `/api/authz/roles/<role_name>/switches` | PUT | a role-switch update without a key is rejected | Covered | P0 | 1 test; negative/validation/auth only: happy path not exercised |
| `/api/authz/why-not` | GET | why-not without a path is rejected | Covered | P0 | 1 test; negative/validation/auth only: happy path not exercised |
| `/api/authz/connections/<int:conn_id>/credentials` | GET | — | Missing | P0 | read-only; safe to add |
| `/api/authz/connections/<int:conn_id>/matrix` | GET | — | Missing | P0 | read-only; safe to add |
| `/api/authz/requests` | GET | — | Missing | P0 | read-only; safe to add |
| `/api/authz/roles/<role_name>/switches` | GET | — | Missing | P0 | read-only; safe to add |
| `/api/authz/trino-rules` | GET | — | Missing | P0 | read-only; safe to add |
| `/api/authz/users/<int:user_id>/attributes` | GET | — | Missing | P0 | read-only; safe to add |
| `/api/authz/classifications` | POST | — | Blocked | P0 | changes the shared permission posture: needs explicit approval and a safe throw-away isolation plan |
| `/api/authz/classifications/<int:classification_id>` | DELETE | — | Blocked | P0 | changes the shared permission posture: needs explicit approval and a safe throw-away isolation plan |
| `/api/authz/connections/<int:conn_id>/credentials` | DELETE | — | Blocked | P0 | changes the shared permission posture: needs explicit approval and a safe throw-away isolation plan |
| `/api/authz/connections/<int:conn_id>/credentials` | PUT | — | Blocked | P0 | changes the shared permission posture: needs explicit approval and a safe throw-away isolation plan |
| `/api/authz/connections/<int:conn_id>/matrix` | PUT | — | Blocked | P0 | changes the shared permission posture: needs explicit approval and a safe throw-away isolation plan |
| `/api/authz/connections/<int:conn_id>/passthrough` | PUT | — | Blocked | P0 | changes the shared permission posture: needs explicit approval and a safe throw-away isolation plan |
| `/api/authz/connections/<int:conn_id>/posture` | PUT | — | Blocked | P0 | changes the shared permission posture: needs explicit approval and a safe throw-away isolation plan |
| `/api/authz/requests/<int:request_id>/approve` | POST | — | Blocked | P0 | changes the shared permission posture: needs explicit approval and a safe throw-away isolation plan |
| `/api/authz/requests/<int:request_id>/deny` | POST | — | Blocked | P0 | changes the shared permission posture: needs explicit approval and a safe throw-away isolation plan |
| `/api/authz/roles/<role_name>/clear-group` | POST | — | Blocked | P0 | changes the shared permission posture: needs explicit approval and a safe throw-away isolation plan |
| `/api/authz/users/<int:user_id>/attributes` | PUT | — | Blocked | P0 | changes the shared permission posture: needs explicit approval and a safe throw-away isolation plan |
| `/api/cache-manager/api/cache-entries` | GET | cache entries are scoped to the caller | Covered | P1 | 1 test |
| `/api/cache-manager/api/cache-entry/<int:query_log_id>` | GET | an unknown cache entry is a 404 | Covered | P1 | 1 test; negative/validation/auth only: happy path not exercised |
| `/api/cache-manager/api/cache-stats` | GET | cache stats report numeric result-cache counters; cache stats and cleanup without a token are rejected | Covered | P1 | 2 tests |
| `/api/cache-manager/api/cleanup-expired` | POST | cleanup of expired entries reports a numeric count; cache stats and cleanup without a token are rejected | Covered | P1 | 2 tests |
| `/api/datapilot/cache/<int:query_log_id>/page` | POST | profile and page of an unknown query say the cache is not ready | Covered | P1 | 1 test; negative/validation/auth only: happy path not exercised |
| `/api/datapilot/cache/<int:query_log_id>/profile` | GET | profile and page of an unknown query say the cache is not ready | Covered | P1 | 1 test; negative/validation/auth only: happy path not exercised |
| `/api/datapilot/cache/<int:query_log_id>/status` | GET | the result cache reports an unknown query as status "unknown" | Covered | P1 | 1 test; negative/validation/auth only: happy path not exercised (verified from tests: only an unknown query id (200, status "unknown"); the status of a real cached query is never tested) |
| `/api/cache-manager/api/export-cache-list` | GET | — | Missing | P2 | read-only; safe to add |
| `/api/cache-manager/api/delete-all-cache` | DELETE | — | Blocked | P2 | result cache is degraded here (DORIS disabled) / destructive |
| `/api/cache-manager/api/delete-cache-entry/<int:query_log_id>` | DELETE | — | Blocked | P2 | result cache is degraded here (DORIS disabled) / destructive |
| `/api/datapilot/cache/<int:query_log_id>` | DELETE | — | Blocked | P2 | result cache is degraded here (DORIS disabled) / destructive |
| `/api/datapilot/cache/<int:query_log_id>/cell` | GET | — | Blocked | P2 | result cache is degraded here (DORIS disabled) / destructive |
| `/api/cache-manager/` | GET | — | Not Required | P2 | server-rendered/admin form helper, not a data API |
| `/chat/prompts` | GET | the chat prompts payload carries the system prompt metadata; KNOWN DEFECT: anonymous GET /chat/prompts requires a token | Covered | P1 | 2 tests |
| `/chat/providers` | GET | the chat providers payload has a default provider and well-formed providers; KNOWN DEFECT: anonymous GET /chat/providers requires a token | Covered | P1 | 2 tests |
| `/chat/search` | GET | — | Missing | P1 | read-only; safe to add |
| `/chat/attachments/<attachment_id>` | DELETE | — | Blocked | P2 | writes files or changes the shared chat configuration; no safe isolation |
| `/chat/attachments/<attachment_id>` | GET | — | Blocked | P1 | needs an uploaded attachment (upload writes files on the server) |
| `/chat/history/clear` | POST | — | Blocked | P2 | writes files or changes the shared chat configuration; no safe isolation |
| `/chat/prompts` | POST | — | Blocked | P2 | writes files or changes the shared chat configuration; no safe isolation |
| `/chat/upload` | POST | — | Blocked | P2 | writes files or changes the shared chat configuration; no safe isolation |
| `/api/repo/<model>` | GET | — | Missing | P1 | RECLASSIFIED from Covered: all 13 old tests request /api/repo/connections (a static route that wins); no test reaches this generic handler. Generic JSON read of any registered model: assert no secret columns |
| `/api/repo/admin-stats` | GET | KNOWN DEFECT: anonymous GET /api/repo/admin-stats requires a token | Defect-only | P1 | 1 test; NOT COUNTED AS COVERED: reached only by KNOWN DEFECT (test.fail) tests, mostly anonymous requests; needs an authenticated happy-path test |
| `/api/repo/api-keys` | POST | create an API key with a dummy secret; KNOWN DEFECT: anonymous POST /api/repo/api-keys requires a token (+3 more) | Covered | P0 | 5 tests |
| `/api/repo/api-keys/<int:key_id>` | DELETE | delete the API key; deleting the key again is a 404 (+1 more) | Covered | P0 | 3 tests |
| `/api/repo/api-keys/<int:key_id>` | GET | reading the key returns only a masked value, never the secret; get an API key with an unknown id is a 404 | Covered | P0 | 2 tests |
| `/api/repo/api-keys/<int:key_id>` | PUT | update the key description; the secret stays masked; update an API key with an unknown id is a 404 | Covered | P0 | 2 tests |
| `/api/repo/api-keys/<int:key_id>/reveal` | GET | KNOWN DEFECT: revealing the key without a token is rejected and the secret is not returned; revealing the key with a token round-trips the stored secret (+2 more) | Covered | P0 | 4 tests |
| `/api/repo/connections` | GET | it appears in the connection list, enabled; the deleted connection is gone from the list (+5 more) | Covered | P0 | 7 tests |
| `/api/repo/connections` | POST | create a throw-away connection; create a throw-away connection to monitor (+6 more) | Covered | P0 | 8 tests |
| `/api/repo/connections/<int:conn_id>` | DELETE | delete the connection; deleting the connection again is a 404 (+3 more) | Covered | P0 | 5 tests |
| `/api/repo/connections/<int:conn_id>` | GET | read it back by id: stored values match and no credentials are exposed; the update is persisted and other fields are unchanged (+10 more) | Covered | P0 | 12 tests |
| `/api/repo/connections/<int:conn_id>` | PUT | update the tags; update with an unknown id is a 404 | Covered | P0 | 2 tests |
| `/api/repo/connections/<int:conn_id>/audit` | GET | audit returns records, the connection and the success metrics; KNOWN DEFECT: audit of an unknown connection id is a 404 | Covered | P0 | 2 tests |
| `/api/repo/connections/<int:conn_id>/monitor-interval` | POST | set the interval to 15 minutes; a negative interval is rejected (+4 more) | Covered | P0 | 6 tests |
| `/api/repo/connections/<int:conn_id>/toggle` | POST | toggle disables the connection; toggle with an unknown id is a 404 | Covered | P0 | 2 tests |
| `/api/repo/connections/search` | GET | search returns {text, value} pairs that all contain the search term; search for a term that matches nothing returns an empty list (+1 more) | Covered | P0 | 3 tests |
| `/api/repo/connections/sidebar` | GET | sidebar lists connections with id, name, db_type and has_knowledge; KNOWN DEFECT: anonymous GET /api/repo/connections/sidebar requires a token | Covered | P0 | 2 tests |
| `/api/repo/connections/test` | POST | test-connection with no parameters is rejected | Covered | P0 | 1 test; negative/validation/auth only: happy path not exercised |
| `/api/repo/connections/upload` | POST | upload of a database file without a file part is rejected; KNOWN DEFECT: anonymous POST /api/repo/connections/upload requires a token | Covered | P0 | 2 tests; negative/validation/auth only: happy path not exercised |
| `/api/repo/connections/upload-source-file` | POST | upload of a source file without a file part is rejected | Covered | P0 | 1 test; negative/validation/auth only: happy path not exercised |
| `/api/repo/llm-models` | POST | create a model under the provider; KNOWN DEFECT: anonymous POST /api/repo/llm-models requires a token (+1 more) | Covered | P1 | 3 tests |
| `/api/repo/llm-models/<int:model_id>` | DELETE | delete the model; delete an LLM model with an unknown id is a 404 | Covered | P1 | 2 tests |
| `/api/repo/llm-models/<int:model_id>` | GET | get an LLM model with an unknown id is a 404 | Covered | P1 | 1 test; negative/validation/auth only: happy path not exercised |
| `/api/repo/llm-models/<int:model_id>` | PUT | update the model; update an LLM model with an unknown id is a 404 | Covered | P1 | 2 tests |
| `/api/repo/llm-providers` | GET | the model appears in the combined list and the provider counts it; the default provider is unchanged and the throw-away provider is gone (+2 more) | Covered | P0 | 4 tests |
| `/api/repo/llm-providers` | POST | create a throw-away provider (non-default); KNOWN DEFECT: anonymous POST /api/repo/llm-providers requires a token (+3 more) | Covered | P0 | 5 tests |
| `/api/repo/llm-providers/<int:provider_id>` | DELETE | delete the provider; delete an LLM provider with an unknown id is a 404 | Covered | P0 | 2 tests |
| `/api/repo/llm-providers/<int:provider_id>` | GET | read the provider back; the deleted provider is a 404 (+1 more) | Covered | P0 | 3 tests |
| `/api/repo/llm-providers/<int:provider_id>` | PUT | update an LLM provider with an unknown id is a 404 | Covered | P0 | 1 test; negative/validation/auth only: happy path not exercised |
| `/api/repo/query-history` | GET | KNOWN DEFECT: anonymous GET /api/repo/query-history requires a token | Defect-only | P1 | 1 test; NOT COUNTED AS COVERED: reached only by KNOWN DEFECT (test.fail) tests, mostly anonymous requests; needs an authenticated happy-path test |
| `/api/repo/llm-providers/<int:provider_id>/onnx-debug` | GET | — | Missing | P2 | read-only; safe to add |
| `/api/repo/llm-providers/<int:provider_id>/onnx-status` | GET | — | Missing | P2 | read-only; safe to add |
| `/api/repo/llm_execution_logs/data` | GET | — | Missing | P1 | read-only; safe to add |
| `/api/repo/llm_execution_logs/filter-options` | GET | — | Missing | P1 | read-only; safe to add |
| `/api/repo/logs/llm-execution` | GET | — | Missing | P1 | read-only; safe to add |
| `/api/repo/models` | GET | — | Missing | P1 | read-only; safe to add |
| `/api/repo/queries` | GET | — | Missing | P1 | read-only; safe to add |
| `/api/repo/queries` | POST | — | Missing | P1 | write path: needs a throw-away object with cleanup |
| `/api/repo/queries/<int:query_id>` | DELETE | — | Missing | P1 | write path: needs a throw-away object with cleanup |
| `/api/repo/queries/<int:query_id>/edit` | GET | — | Missing | P1 | read-only; safe to add |
| `/api/repo/queries/<int:query_id>/edit` | POST | — | Missing | P1 | write path: needs a throw-away object with cleanup |
| `/api/repo/queries/get` | GET | — | Missing | P1 | read-only; safe to add |
| `/api/repo/queries/search` | GET | — | Missing | P1 | read-only; safe to add |
| `/api/repo/connections/preview-rest-api` | POST | — | Blocked | P1 | calls an external REST service |
| `/api/repo/llm-providers/<int:provider_id>/discover-models` | POST | — | Blocked | P1 | calls the provider / loads a model runtime |
| `/api/repo/llm-providers/<int:provider_id>/health-check` | POST | — | Blocked | P1 | calls the provider / loads a model runtime |
| `/api/repo/llm-providers/<int:provider_id>/onnx-load-model` | POST | — | Blocked | P1 | calls the provider / loads a model runtime |
| `/api/repo/llm-providers/<int:provider_id>/onnx-unload-model` | POST | — | Blocked | P1 | calls the provider / loads a model runtime |
| `/api/repo/llm-providers/<int:provider_id>/sync-models` | POST | — | Blocked | P1 | calls the provider / loads a model runtime |
| `/api/repo/` | GET | — | Not Required | P2 | server-rendered/admin form helper, not a data API |
| `/api/repo/<model>/data` | GET | — | Missing | P2 | RECLASSIFIED from Not Required: JSON read of a model, not only a form helper (re-check source before writing the test) |
| `/api/repo/<model>/new` | GET | — | Missing | P2 | RECLASSIFIED from Not Required: re-check source; may return a form schema only |
| `/api/repo/<model>/new` | POST | — | Blocked | P1 | RECLASSIFIED from Not Required: generic create of arbitrary model rows with no delete API |
| `/api/repo/test-upload` | GET | — | Not Required | P2 | server-rendered/admin form helper, not a data API |
| `/api/dashboard` | GET | KNOWN DEFECT: anonymous GET /api/dashboard requires a token | Defect-only | P2 | 1 test; NOT COUNTED AS COVERED: reached only by KNOWN DEFECT (test.fail) tests, mostly anonymous requests; needs an authenticated happy-path test |
| `/api/datapilot/dq/evaluate` | POST | evaluating without a query_log_id is rejected | Covered | P1 | 1 test; negative/validation/auth only: happy path not exercised |
| `/api/datapilot/dq/rules` | GET | the rule list is an array; rule list and rule creation without a token are rejected | Covered | P1 | 2 tests |
| `/api/datapilot/dq/rules` | POST | creating a rule without its fields names the missing ones; KNOWN DEFECT: a rule with an unknown template is rejected with a 4xx (+1 more) | Covered | P1 | 3 tests; negative/validation/auth only: happy path not exercised |
| `/api/datapilot/dq/rules/<int:rule_id>` | DELETE | deleting an unknown rule is a 404 | Covered | P1 | 1 test; negative/validation/auth only: happy path not exercised |
| `/api/datapilot/dq/runs/<int:query_log_id>` | GET | the runs of an unknown query are an empty list | Covered | P1 | 1 test; negative/validation/auth only: happy path not exercised (verified from tests: only an unknown query id (200, empty list); a real run history is never tested) |
| `/api/datapilot/dq/extract-tables` | POST | — | Missing | P1 | write path: needs a throw-away object with cleanup |
| `/api/datapilot/dq/fails/<int:query_log_id>` | POST | — | Missing | P1 | write path: needs a throw-away object with cleanup |
| `/api/datapilot/dq/regressions/<int:run_id>` | GET | — | Missing | P1 | read-only; safe to add |
| `/api/datapilot/dq/rule-sets` | GET | — | Missing | P1 | read-only; safe to add |
| `/api/datapilot/dq/rule-sets` | POST | — | Missing | P1 | write path: needs a throw-away object with cleanup |
| `/api/datapilot/dq/rules-to-sql` | POST | — | Missing | P1 | write path: needs a throw-away object with cleanup |
| `/api/datapilot/dq/rules/<int:rule_id>` | PUT | — | Missing | P1 | write path: needs a throw-away object with cleanup |
| `/api/datapilot/dq/rules/<int:rule_id>/history` | GET | — | Missing | P1 | read-only; safe to add |
| `/api/datapilot/dq/runs/compare` | GET | — | Missing | P1 | read-only; safe to add |
| `/api/datapilot/dq/runs/detail/<int:run_id>` | GET | — | Missing | P1 | read-only; safe to add |
| `/api/datapilot/dq/suggest/<int:query_log_id>` | GET | — | Missing | P1 | read-only; safe to add |
| `/api/datapilot/cancel/<int:query_log_id>` | POST | cancelling an already-completed query is refused; cancelling an unknown query reports that nothing was cancelled (+1 more) | Covered | P0 | 3 tests; negative/validation/auth only: happy path not exercised |
| `/api/datapilot/check-safety` | POST | check-safety: a SELECT is read-only and safe; check-safety: a DROP is data-modifying and unsafe, and names the affected table (+4 more) | Covered | P0 | 6 tests |
| `/api/datapilot/count` | POST | count equals the row count the execute step reported; count lists all three required fields when they are missing (+14 more) | Covered | P0 | 16 tests |
| `/api/datapilot/dialects` | GET | dialects maps every name to a dialect string and the count agrees; anonymous GET /api/datapilot/dialects is rejected | Covered | P0 | 2 tests |
| `/api/datapilot/execute` | POST | execute on a real table returns columns, column_types and a consistent row_count; execute rejects missing sql (+41 more) | Covered | P0 | 43 tests |
| `/api/datapilot/explain` | POST | explain returns a query plan for the SQLite connection; explain rejects missing connection_name (+3 more) | Covered | P0 | 5 tests |
| `/api/datapilot/extract-params` | POST | extract-params finds the named parameters and counts them; extract-params returns nothing for SQL without parameters (+1 more) | Covered | P0 | 3 tests |
| `/api/datapilot/format` | POST | format puts the statement on several lines with upper-case keywords; format without sql is rejected (+2 more) | Covered | P0 | 4 tests |
| `/api/datapilot/history` | GET | history limit=1: size, field types, newest-first order and non-empty sql; history limit=10: size, field types, newest-first order and non-empty sql (+20 more) | Covered | P0 | 22 tests |
| `/api/datapilot/lineage` | POST | lineage reports both joined tables and the referenced columns; lineage without sql is rejected | Covered | P0 | 2 tests |
| `/api/datapilot/minify` | POST | minify collapses whitespace and reports consistent sizes; minify without sql is rejected | Covered | P0 | 2 tests |
| `/api/datapilot/optimize` | POST | optimize echoes the original SQL and returns a simplified form; optimize without sql is rejected | Covered | P0 | 2 tests |
| `/api/datapilot/saved-queries` | GET | the new query appears in the list; the update is persisted (+2 more) | Covered | P0 | 4 tests |
| `/api/datapilot/saved-queries` | POST | create a saved query; create rejects missing name (+5 more) | Covered | P0 | 7 tests |
| `/api/datapilot/saved-queries/<int:query_id>` | DELETE | delete the query; deleting it again is a 404 (+1 more) | Covered | P0 | 3 tests |
| `/api/datapilot/saved-queries/<int:query_id>` | PUT | rename and share the query; updating the deleted query is a 404 | Covered | P0 | 2 tests |
| `/api/datapilot/status/<int:query_log_id>` | GET | KNOWN DEFECT: status of the completed query answers 200 and reports success; KNOWN DEFECT: status of an unknown query_log_id is a 404 (+2 more) | Covered | P0 | 4 tests |
| `/api/datapilot/transpile` | POST | transpile translates T-SQL TOP into PostgreSQL LIMIT; transpile without sql is rejected (+1 more) | Covered | P0 | 3 tests |
| `/api/datapilot/validate` | POST | validate accepts valid SQL and reports its statement type; validate without sql is rejected (+2 more) | Covered | P0 | 4 tests |
| `/api/datapilot/autocomplete-settings` | GET | autocomplete settings are boolean feature flags; parse, visualize, autocomplete settings and SQL-context stats without a token are rejected | Covered | P1 | 2 tests |
| `/api/datapilot/canonical-join-hints` | POST | canonical-join-hints without its fields is rejected | Covered | P1 | 1 test; negative/validation/auth only: happy path not exercised |
| `/api/datapilot/health` | GET | the SQL parser service health is public and advertises its features | Covered | P1 | 1 test |
| `/api/datapilot/implied-relationships-settings` | GET | implied-relationship settings have a flag, a confidence between 0 and 1, and strategies | Covered | P1 | 1 test |
| `/api/datapilot/join-hints` | POST | join-hints without its fields is rejected | Covered | P1 | 1 test; negative/validation/auth only: happy path not exercised |
| `/api/datapilot/parse` | POST | parse returns column lineage, CTEs, joins and statement info; parse detects a CTE and a join (+2 more) | Covered | P1 | 4 tests |
| `/api/datapilot/sql-context` | POST | sql-context without connection_id is rejected | Covered | P1 | 1 test; negative/validation/auth only: happy path not exercised |
| `/api/datapilot/sql-context/stats` | GET | SQL-context cache statistics are numeric and consistent; parse, visualize, autocomplete settings and SQL-context stats without a token are rejected | Covered | P1 | 2 tests |
| `/api/datapilot/visualize` | POST | parse and visualize without sql are rejected; parse, visualize, autocomplete settings and SQL-context stats without a token are rejected | Covered | P1 | 2 tests; negative/validation/auth only: happy path not exercised |
| `/api/datapilot/implied-relationships-settings` | POST | — | Missing | P2 | write path: needs a throw-away object with cleanup |
| `/api/datapilot/sql-context/cache` | DELETE | — | Missing | P2 | write path: needs a throw-away object with cleanup |
| `/api/services/` | GET | — | Not Required | P2 | infrastructure-only (Docker container control); currently returns HTTP 500, report to the DIA team |
| `/api/services/api/containers` | GET | — | Not Required | P2 | infrastructure-only (Docker container control); currently returns HTTP 500, report to the DIA team |
| `/api/services/api/containers/<container_id>` | GET | — | Not Required | P2 | infrastructure-only (Docker container control); currently returns HTTP 500, report to the DIA team |
| `/api/services/api/containers/<container_id>/logs` | GET | — | Not Required | P2 | infrastructure-only (Docker container control); currently returns HTTP 500, report to the DIA team |
| `/api/services/api/containers/<container_id>/restart` | POST | — | Not Required | P2 | infrastructure-only (Docker container control); currently returns HTTP 500, report to the DIA team |
| `/api/services/api/containers/<container_id>/start` | POST | — | Not Required | P2 | infrastructure-only (Docker container control); currently returns HTTP 500, report to the DIA team |
| `/api/services/api/containers/<container_id>/stop` | POST | — | Not Required | P2 | infrastructure-only (Docker container control); currently returns HTTP 500, report to the DIA team |
| `/api/services/api/info` | GET | — | Not Required | P2 | infrastructure-only (Docker container control); currently returns HTTP 500, report to the DIA team |
| `/api/fewshots/` | GET | anonymous GET /api/fewshots/ is rejected | Covered | P1 | 1 test; negative/validation/auth only: happy path not exercised |
| `/api/fewshots/<int:sid>` | GET | read the set: fields and the ordered examples round-trip; the update is reflected in the list (+3 more) | Covered | P1 | 5 tests |
| `/api/fewshots/<int:sid>/delete` | POST | KNOWN DEFECT: deleting a set that still has examples succeeds and shows no debugger page; deleting an unknown few-shot set is a 404 | Covered | P1 | 2 tests |
| `/api/fewshots/data` | GET | the update is reflected in the list; the few-shot list has typed sets with example counts | Covered | P1 | 2 tests |
| `/api/fewshots/save` | POST | create a set with two examples; update the set: rename and replace the examples (+6 more) | Covered | P1 | 8 tests |
| `/api/fewshots/import` | POST | — | Missing | P2 | write path: needs a throw-away object with cleanup |
| `/api/fewshots/new` | GET | — | Not Required | P2 | server-rendered/admin form helper, not a data API |
| `/health` | GET | /health is public and reports the service healthy | Covered | P2 | 1 test |
| `/metrics` | GET | — | Missing | P2 | RECLASSIFIED from Not Required: public read-only probe (about 1 s CPU sampling, within the response-time limit); COVERAGE_GAPS listed it as a P2 gap |
| `/ready` | GET | — | Missing | P2 | RECLASSIFIED from Not Required: public read-only probe (DB, Redis, Ollama pings); COVERAGE_GAPS listed it as a P2 gap |
| `/api/jobs` | GET | anonymous GET /api/jobs is rejected; the job list has a pagination envelope and well-formed jobs | Covered | P1 | 2 tests |
| `/api/jobs/<string:job_id>` | GET | jobs health reports a running, healthy executor; get an unknown job is a 404 (+1 more) | Covered | P1 | 3 tests; negative/validation/auth only: happy path not exercised |
| `/api/jobs/<string:job_id>/cancel` | POST | cancel an unknown job is a 404 | Covered | P1 | 1 test; negative/validation/auth only: happy path not exercised |
| `/api/jobs/<string:job_id>/details` | GET | details of an unknown job is a 404 | Covered | P1 | 1 test; negative/validation/auth only: happy path not exercised |
| `/api/jobs/<string:job_id>/logs` | GET | KNOWN DEFECT: the logs of an unknown job are a 404 | Defect-only | P1 | 1 test; NOT COUNTED AS COVERED: reached only by KNOWN DEFECT (test.fail) tests, mostly anonymous requests; needs an authenticated happy-path test |
| `/api/jobs/<string:job_id>/tasks` | GET | KNOWN DEFECT: the tasks of an unknown job are a 404 | Defect-only | P1 | 1 test; NOT COUNTED AS COVERED: reached only by KNOWN DEFECT (test.fail) tests, mostly anonymous requests; needs an authenticated happy-path test |
| `/api/jobs/health` | GET | jobs health reports a running, healthy executor; jobs health without a token is rejected | Covered | P1 | 2 tests |
| `/api/jobs/workers/status` | GET | workers status count matches the worker list | Covered | P1 | 1 test |
| `/api/jobs/<string:job_id>` | DELETE | — | Blocked | P1 | starts real work / needs a disposable job / resizes the shared worker pool |
| `/api/jobs/<string:job_id>/clone` | POST | — | Blocked | P1 | starts real work / needs a disposable job / resizes the shared worker pool |
| `/api/jobs/<string:job_id>/pause` | POST | — | Blocked | P1 | starts real work / needs a disposable job / resizes the shared worker pool |
| `/api/jobs/<string:job_id>/reenqueue-stuck` | POST | — | Blocked | P1 | starts real work / needs a disposable job / resizes the shared worker pool |
| `/api/jobs/<string:job_id>/resume` | POST | — | Blocked | P1 | starts real work / needs a disposable job / resizes the shared worker pool |
| `/api/jobs/<string:job_id>/retry` | POST | — | Blocked | P1 | starts real work / needs a disposable job / resizes the shared worker pool |
| `/api/jobs/semantic-catalog-import` | POST | — | Blocked | P1 | starts real work / needs a disposable job / resizes the shared worker pool |
| `/api/jobs/workers/add` | POST | — | Blocked | P1 | starts real work / needs a disposable job / resizes the shared worker pool |
| `/api/jobs/workers/remove` | POST | — | Blocked | P1 | starts real work / needs a disposable job / resizes the shared worker pool |
| `/api/jobs/workers/scale` | POST | — | Blocked | P1 | starts real work / needs a disposable job / resizes the shared worker pool |
| `/api/connections/<int:connection_id>/knowledge-graph` | GET | KNOWN DEFECT: anonymous GET /api/connections/9/knowledge-graph requires a token; a connection without a knowledge graph reports none configured | Covered | P1 | 2 tests; negative/validation/auth only: happy path not exercised (verified from tests: only connection 9, which has no knowledge graph (200, success true, data null); a graph with data is never tested, and the anonymous test is an expected-failure defect test) |
| `/api/connections/<int:connection_id>/knowledge-graph/nodes` | GET | the nodes of a missing knowledge graph are a 404 | Covered | P1 | 1 test; negative/validation/auth only: happy path not exercised |
| `/api/connections/<int:connection_id>/knowledge-graph/search` | POST | knowledge-graph search without a query is rejected | Covered | P1 | 1 test; negative/validation/auth only: happy path not exercised |
| `/api/connections/knowledge-graphs/overview` | GET | KNOWN DEFECT: anonymous GET /api/connections/knowledge-graphs/overview requires a token; the knowledge-graph overview has numeric aggregate counters | Covered | P1 | 2 tests |
| `/api/connections/<int:connection_id>/knowledge-graph/abbreviations` | GET | — | Missing | P1 | read-only; safe to add |
| `/api/connections/<int:connection_id>/knowledge-graph/golden-queries` | GET | — | Missing | P1 | read-only; safe to add |
| `/api/connections/<int:connection_id>/knowledge-graph/relationships` | GET | — | Missing | P1 | read-only; safe to add |
| `/api/connections/<int:connection_id>/knowledge-graph/abbreviations` | POST | — | Blocked | P1 | starts indexing / needs an LLM, or has no delete API so the data could not be cleaned up |
| `/api/connections/<int:connection_id>/knowledge-graph/build` | POST | — | Blocked | P1 | starts indexing / needs an LLM, or has no delete API so the data could not be cleaned up |
| `/api/connections/<int:connection_id>/knowledge-graph/disable` | POST | — | Blocked | P1 | starts indexing / needs an LLM, or has no delete API so the data could not be cleaned up |
| `/api/connections/<int:connection_id>/knowledge-graph/enable` | POST | — | Blocked | P1 | starts indexing / needs an LLM, or has no delete API so the data could not be cleaned up |
| `/api/connections/<int:connection_id>/knowledge-graph/feedback` | POST | — | Blocked | P1 | starts indexing / needs an LLM, or has no delete API so the data could not be cleaned up |
| `/api/connections/<int:connection_id>/knowledge-graph/golden-queries` | POST | — | Blocked | P1 | starts indexing / needs an LLM, or has no delete API so the data could not be cleaned up |
| `/api/connections/<int:connection_id>/knowledge-graph/index-canonical` | POST | — | Blocked | P1 | starts indexing / needs an LLM, or has no delete API so the data could not be cleaned up |
| `/api/connections/<int:connection_id>/knowledge-graph/nodes/<uuid:node_id>` | PUT | — | Blocked | P1 | modifies graph data with no safe throw-away graph |
| `/api/connections/<int:connection_id>/text-to-sql/context` | POST | — | Blocked | P1 | starts indexing / needs an LLM, or has no delete API so the data could not be cleaned up |
| `/api/mcp-servers` | GET | anonymous GET /api/mcp-servers is rejected; the server list count matches the servers returned | Covered | P1 | 2 tests |
| `/api/mcp-servers` | POST | creating a server with a missing name is rejected; creating a server with a missing transport is rejected (+5 more) | Covered | P1 | 7 tests; negative/validation/auth only: happy path not exercised |
| `/api/mcp-servers/<int:server_id>` | DELETE | delete an unknown server is a 404 | Covered | P1 | 1 test; negative/validation/auth only: happy path not exercised |
| `/api/mcp-servers/<int:server_id>` | GET | the tool list count matches the tools returned; the registry has well-formed entries and a matching count (+1 more) | Covered | P1 | 3 tests; negative/validation/auth only: happy path not exercised |
| `/api/mcp-servers/<int:server_id>` | PUT | update an unknown server is a 404 | Covered | P1 | 1 test; negative/validation/auth only: happy path not exercised |
| `/api/mcp-servers/<int:server_id>/tools` | GET | list the tools of an unknown server is a 404 | Covered | P1 | 1 test; negative/validation/auth only: happy path not exercised |
| `/api/mcp-servers/registry` | GET | the registry has well-formed entries and a matching count | Covered | P1 | 1 test |
| `/api/mcp-servers/tools` | GET | the tool list count matches the tools returned | Covered | P1 | 1 test |
| `/api/mcp-servers/<int:server_id>/connect` | POST | — | Blocked | P1 | spawns a process or calls an external MCP server |
| `/api/mcp-servers/<int:server_id>/disconnect` | POST | — | Blocked | P1 | spawns a process or calls an external MCP server |
| `/api/mcp-servers/<int:server_id>/execute` | POST | — | Blocked | P1 | spawns a process or calls an external MCP server |
| `/api/mcp-servers/<int:server_id>/test` | POST | — | Blocked | P1 | spawns a process or calls an external MCP server |
| `/api/mcp-servers/<int:server_id>/tools/refresh` | POST | — | Blocked | P1 | spawns a process or calls an external MCP server |
| `/api/mcp-servers/connect-all` | POST | — | Blocked | P1 | spawns a process or calls an external MCP server |
| `/api/mcp-servers/from-registry` | POST | — | Blocked | P1 | spawns a process or calls an external MCP server |
| `/datapilot/api/navigator/async/jobs/<job_id>` | GET | — | Missing | P1 | read-only; a cache miss can start a METADATA_FETCH job (check jobs after the run) |
| `/datapilot/api/navigator/connections` | GET | — | Missing | P1 | read-only; a cache miss can start a METADATA_FETCH job (check jobs after the run) |
| `/datapilot/api/navigator/connections/<connection_name>/cache/status` | GET | — | Missing | P1 | read-only; a cache miss can start a METADATA_FETCH job (check jobs after the run) |
| `/datapilot/api/navigator/connections/<connection_name>/catalogs` | GET | — | Missing | P1 | read-only; a cache miss can start a METADATA_FETCH job (check jobs after the run) |
| `/datapilot/api/navigator/connections/<connection_name>/catalogs/<catalog_name>/schemas` | GET | — | Missing | P1 | read-only; a cache miss can start a METADATA_FETCH job (check jobs after the run) |
| `/datapilot/api/navigator/connections/<connection_name>/catalogs/<catalog_name>/schemas/<schema_name>/tables` | GET | — | Missing | P1 | read-only; a cache miss can start a METADATA_FETCH job (check jobs after the run) |
| `/datapilot/api/navigator/connections/<connection_name>/catalogs/<catalog_name>/schemas/<schema_name>/tables/<table_name>/columns` | GET | — | Missing | P1 | read-only; a cache miss can start a METADATA_FETCH job (check jobs after the run) |
| `/datapilot/api/navigator/connections/<connection_name>/schemas` | GET | — | Missing | P1 | read-only; a cache miss can start a METADATA_FETCH job (check jobs after the run) |
| `/datapilot/api/navigator/connections/<connection_name>/schemas/<schema_name>/<object_type>/<object_name>/columns` | GET | — | Missing | P1 | read-only; a cache miss can start a METADATA_FETCH job (check jobs after the run) |
| `/datapilot/api/navigator/connections/<connection_name>/schemas/<schema_name>/objects` | GET | — | Missing | P1 | read-only; a cache miss can start a METADATA_FETCH job (check jobs after the run) |
| `/datapilot/api/navigator/connections/<connection_name>/schemas/<schema_name>/packages` | GET | — | Missing | P1 | read-only; a cache miss can start a METADATA_FETCH job (check jobs after the run) |
| `/datapilot/api/navigator/connections/<connection_name>/schemas/<schema_name>/procedures` | GET | — | Missing | P1 | read-only; a cache miss can start a METADATA_FETCH job (check jobs after the run) |
| `/datapilot/api/navigator/connections/<connection_name>/schemas/<schema_name>/sequences` | GET | — | Missing | P1 | read-only; a cache miss can start a METADATA_FETCH job (check jobs after the run) |
| `/datapilot/api/navigator/connections/<connection_name>/schemas/<schema_name>/synonyms` | GET | — | Missing | P1 | read-only; a cache miss can start a METADATA_FETCH job (check jobs after the run) |
| `/datapilot/api/navigator/connections/<connection_name>/schemas/<schema_name>/tables` | GET | — | Missing | P1 | read-only; a cache miss can start a METADATA_FETCH job (check jobs after the run) |
| `/datapilot/api/navigator/connections/<connection_name>/schemas/<schema_name>/views` | GET | — | Missing | P1 | read-only; a cache miss can start a METADATA_FETCH job (check jobs after the run) |
| `/datapilot/api/navigator/connections/<int:conn_id>` | GET | — | Missing | P1 | read-only; a cache miss can start a METADATA_FETCH job (check jobs after the run) |
| `/datapilot/api/navigator/connections/<int:connection_id>/autocomplete` | GET | — | Missing | P1 | read-only; a cache miss can start a METADATA_FETCH job (check jobs after the run) |
| `/datapilot/api/navigator/connections/<int:connection_id>/schemas/<schema_name>/autocomplete-objects` | GET | — | Missing | P1 | read-only; a cache miss can start a METADATA_FETCH job (check jobs after the run) |
| `/datapilot/api/navigator/connections/<int:connection_id>/schemas/<schema_name>/tables/<table_name>/columns` | GET | — | Missing | P1 | read-only; a cache miss can start a METADATA_FETCH job (check jobs after the run) |
| `/datapilot/api/navigator/connections/<int:connection_id>/trino-children` | GET | — | Missing | P1 | read-only; a cache miss can start a METADATA_FETCH job (check jobs after the run) |
| `/datapilot/api/navigator/database-types` | GET | — | Missing | P1 | read-only; a cache miss can start a METADATA_FETCH job (check jobs after the run) |
| `/datapilot/api/navigator/smart/connection-info/<connection_name>` | GET | — | Missing | P1 | read-only; a cache miss can start a METADATA_FETCH job (check jobs after the run) |
| `/datapilot/api/navigator/async/columns` | POST | — | Blocked | P1 | starts METADATA_FETCH jobs or changes navigator metadata/config |
| `/datapilot/api/navigator/async/tables` | POST | — | Blocked | P1 | starts METADATA_FETCH jobs or changes navigator metadata/config |
| `/datapilot/api/navigator/connections` | POST | — | Blocked | P1 | starts METADATA_FETCH jobs or changes navigator metadata/config |
| `/datapilot/api/navigator/connections/<connection_name>/cache/clear` | POST | — | Blocked | P1 | starts METADATA_FETCH jobs or changes navigator metadata/config |
| `/datapilot/api/navigator/connections/<connection_name>/connect` | POST | — | Missing | P1 | RECLASSIFIED from Blocked: connection-test probe that creates no job (confirm in source before testing) |
| `/datapilot/api/navigator/connections/<connection_name>/schemas/<schema_name>/cache/clear` | POST | — | Blocked | P1 | starts METADATA_FETCH jobs or changes navigator metadata/config |
| `/datapilot/api/navigator/connections/<connection_name>/schemas/<schema_name>/tables/<table_name>/cache/clear` | POST | — | Blocked | P1 | starts METADATA_FETCH jobs or changes navigator metadata/config |
| `/datapilot/api/navigator/connections/<int:conn_id>` | PUT | — | Blocked | P1 | starts METADATA_FETCH jobs or changes navigator metadata/config |
| `/datapilot/api/navigator/search` | POST | — | Missing | P1 | RECLASSIFIED from Blocked: reads only the Redis metadata cache, never a source database |
| `/datapilot/api/navigator/smart/tables` | POST | — | Blocked | P1 | starts METADATA_FETCH jobs or changes navigator metadata/config |
| `/api/prompts/` | GET | anonymous GET /api/prompts/ is rejected; a bad token is rejected: /api/prompts/ | Covered | P1 | 2 tests; negative/validation/auth only: happy path not exercised |
| `/api/prompts/<int:pid>` | GET | read it back: the stored template and fields match; the prompt update is persisted (+4 more) | Covered | P1 | 6 tests |
| `/api/prompts/<int:pid>/delete` | POST | delete the prompt; deleting the prompt again is a 404 (+1 more) | Covered | P1 | 3 tests |
| `/api/prompts/<int:pid>/preview` | POST | previewing an unknown prompt is a 404 | Covered | P1 | 1 test; negative/validation/auth only: happy path not exercised |
| `/api/prompts/data` | GET | the prompt list has typed summaries | Covered | P1 | 1 test |
| `/api/prompts/save` | POST | create a prompt; update the template in place (+6 more) | Covered | P1 | 8 tests |
| `/api/prompts/import` | POST | — | Missing | P2 | write path: needs a throw-away object with cleanup |
| `/api/prompts/versions` | GET | — | Missing | P1 | read-only; safe to add |
| `/api/prompts/versions` | POST | — | Missing | P1 | write path: needs a throw-away object with cleanup |
| `/api/prompts/versions/<int:tv_id>` | GET | — | Missing | P1 | read-only; safe to add |
| `/api/prompts/versions/<int:tv_id>` | PUT | — | Missing | P1 | write path: needs a throw-away object with cleanup |
| `/api/prompts/versions/<int:tv_id>/delete` | POST | — | Missing | P1 | write path: needs a throw-away object with cleanup |
| `/api/prompts/versions/<int:tv_id>/duplicate` | POST | — | Missing | P1 | write path: needs a throw-away object with cleanup |
| `/api/prompts/versions/<int:tv_id>/preview` | POST | — | Missing | P1 | write path: needs a throw-away object with cleanup |
| `/api/prompts/versions/<int:tv_id>/sets` | POST | — | Missing | P1 | write path: needs a throw-away object with cleanup |
| `/api/prompts/new` | GET | — | Not Required | P2 | server-rendered/admin form helper, not a data API |
| `/api/prompts/versions/new` | GET | — | Not Required | P2 | server-rendered/admin form helper, not a data API |
| `/api/semantic` | GET | listing models returns an array; KNOWN DEFECT: anonymous GET /api/semantic requires a token | Covered | P1 | 2 tests |
| `/api/semantic` | POST | creating a model without a name is rejected | Covered | P1 | 1 test; negative/validation/auth only: happy path not exercised |
| `/api/semantic/<int:model_id>` | GET | the dashboard has numeric statistics and a list of recent imports; listing physical databases returns an array (+3 more) | Covered | P1 | 5 tests; negative/validation/auth only: happy path not exercised |
| `/api/semantic/<int:model_id>/tables` | GET | list the tables of a model with an unknown id is a 404 | Covered | P1 | 1 test; negative/validation/auth only: happy path not exercised |
| `/api/semantic/by-connection/<int:connection_id>` | GET | listing models of a connection returns an array | Covered | P1 | 1 test |
| `/api/semantic/dashboard` | GET | the dashboard has numeric statistics and a list of recent imports; KNOWN DEFECT: anonymous GET /api/semantic/dashboard requires a token | Covered | P1 | 2 tests |
| `/api/semantic/physical-databases` | GET | listing physical databases returns an array; KNOWN DEFECT: anonymous GET /api/semantic/physical-databases requires a token | Covered | P1 | 2 tests |
| `/api/semantic/physical-databases/<db_id>` | GET | KNOWN DEFECT: a malformed physical-database id is a 4xx and does not leak database internals | Defect-only | P1 | 1 test; NOT COUNTED AS COVERED: reached only by KNOWN DEFECT (test.fail) tests, mostly anonymous requests; needs an authenticated happy-path test |
| `/api/semantic/<int:model_id>` | DELETE | — | Missing | P1 | write path: needs a throw-away object with cleanup |
| `/api/semantic/<int:model_id>` | PUT | — | Missing | P1 | write path: needs a throw-away object with cleanup |
| `/api/semantic/<int:model_id>/available-schemas` | GET | — | Missing | P1 | read-only; safe to add |
| `/api/semantic/<int:model_id>/available-tables` | GET | — | Missing | P1 | read-only; safe to add |
| `/api/semantic/<int:model_id>/schema` | GET | — | Missing | P1 | read-only; safe to add |
| `/api/semantic/<int:model_id>/tables` | POST | — | Missing | P1 | write path: needs a throw-away object with cleanup |
| `/api/semantic/<int:model_id>/tables` | PUT | — | Missing | P1 | write path: needs a throw-away object with cleanup |
| `/api/semantic/<int:model_id>/tables/<int:table_id>` | DELETE | — | Missing | P1 | write path: needs a throw-away object with cleanup |
| `/api/semantic/<int:model_id>/tables/<int:table_id>` | PUT | — | Missing | P1 | write path: needs a throw-away object with cleanup |
| `/api/semantic/canonical/columns` | GET | — | Missing | P1 | read-only; safe to add |
| `/api/semantic/canonical/columns/<column_id>` | PUT | — | Missing | P1 | write path: needs a throw-away object with cleanup |
| `/api/semantic/canonical/entities` | GET | — | Missing | P1 | read-only; safe to add |
| `/api/semantic/canonical/entities/<entity_id>` | DELETE | — | Missing | P1 | write path: needs a throw-away object with cleanup |
| `/api/semantic/canonical/entities/<entity_id>` | GET | — | Missing | P1 | read-only; safe to add |
| `/api/semantic/canonical/entities/<entity_id>` | PATCH | — | Missing | P1 | write path: needs a throw-away object with cleanup |
| `/api/semantic/canonical/entities/<entity_id>/suggested-joins` | GET | — | Blocked | P1 | RECLASSIFIED from Missing: calls the LLM (canonical_join_suggester) |
| `/api/semantic/canonical/entities/<source_id>/merge-into/<target_id>` | POST | — | Missing | P1 | write path: needs a throw-away object with cleanup |
| `/api/semantic/canonical/relationships` | GET | — | Missing | P1 | read-only; safe to add |
| `/api/semantic/canonical/relationships` | POST | — | Missing | P1 | write path: needs a throw-away object with cleanup |
| `/api/semantic/canonical/relationships/<rel_id>` | DELETE | — | Missing | P1 | write path: needs a throw-away object with cleanup |
| `/api/semantic/canonical/relationships/<rel_id>` | GET | — | Missing | P1 | read-only; safe to add |
| `/api/semantic/canonical/relationships/<rel_id>` | PUT | — | Missing | P1 | write path: needs a throw-away object with cleanup |
| `/api/semantic/canonical/relationships/<rel_id>/verify` | POST | — | Missing | P1 | write path: needs a throw-away object with cleanup |
| `/api/semantic/canonical/sources/<source_id>` | PUT | — | Missing | P1 | write path: needs a throw-away object with cleanup |
| `/api/semantic/canonical/sources/<source_id>/verify` | POST | — | Missing | P1 | write path: needs a throw-away object with cleanup |
| `/api/semantic/canonical/stats` | GET | — | Missing | P1 | read-only; safe to add |
| `/api/semantic/graph` | GET | — | Missing | P1 | read-only; safe to add |
| `/api/semantic/imports` | GET | — | Missing | P1 | read-only; safe to add |
| `/api/semantic/imports` | POST | — | Missing | P1 | write path: needs a throw-away object with cleanup |
| `/api/semantic/imports/<config_id>` | DELETE | — | Missing | P1 | write path: needs a throw-away object with cleanup |
| `/api/semantic/imports/<config_id>` | GET | — | Missing | P1 | read-only; safe to add |
| `/api/semantic/imports/<config_id>` | PUT | — | Missing | P1 | write path: needs a throw-away object with cleanup |
| `/api/semantic/imports/<config_id>/duplicate` | POST | — | Missing | P1 | write path: needs a throw-away object with cleanup |
| `/api/semantic/imports/connections/<connection_id>/schemas` | GET | — | Missing | P1 | read-only; safe to add |
| `/api/semantic/logical-references` | GET | — | Missing | P1 | read-only; safe to add |
| `/api/semantic/logical-references` | POST | — | Missing | P1 | write path: needs a throw-away object with cleanup |
| `/api/semantic/logical-references/<ref_id>` | DELETE | — | Missing | P1 | write path: needs a throw-away object with cleanup |
| `/api/semantic/logical-references/<ref_id>` | GET | — | Missing | P1 | read-only; safe to add |
| `/api/semantic/logical-references/<ref_id>` | PATCH | — | Missing | P1 | write path: needs a throw-away object with cleanup |
| `/api/semantic/logical-references/export.csv` | GET | — | Missing | P1 | read-only; safe to add |
| `/api/semantic/physical-databases/<db_id>` | DELETE | — | Missing | P1 | write path: needs a throw-away object with cleanup |
| `/api/semantic/physical-databases/<db_id>/tables` | GET | — | Missing | P1 | read-only; safe to add |
| `/api/semantic/physical-tables/<table_id>` | GET | — | Missing | P1 | read-only; safe to add |
| `/api/semantic/physical/aliases` | GET | — | Missing | P1 | read-only; safe to add |
| `/api/semantic/physical/aliases` | POST | — | Missing | P1 | write path: needs a throw-away object with cleanup |
| `/api/semantic/physical/aliases/<alias_id>` | DELETE | — | Missing | P1 | write path: needs a throw-away object with cleanup |
| `/api/semantic/physical/aliases/<alias_id>` | GET | — | Missing | P1 | read-only; safe to add |
| `/api/semantic/physical/aliases/<alias_id>` | PUT | — | Missing | P1 | write path: needs a throw-away object with cleanup |
| `/api/semantic/pii/recognizers` | GET | — | Missing | P1 | read-only; safe to add |
| `/api/semantic/pii/recognizers` | POST | — | Missing | P1 | write path: needs a throw-away object with cleanup |
| `/api/semantic/pii/recognizers/<recognizer_id>` | DELETE | — | Missing | P1 | write path: needs a throw-away object with cleanup |
| `/api/semantic/pii/recognizers/<recognizer_id>` | GET | — | Missing | P1 | read-only; safe to add |
| `/api/semantic/pii/recognizers/<recognizer_id>` | PUT | — | Missing | P1 | write path: needs a throw-away object with cleanup |
| `/api/semantic/pii/recognizers/<recognizer_id>/toggle` | POST | — | Missing | P1 | write path: needs a throw-away object with cleanup |
| `/api/semantic/wizard/connections` | GET | — | Missing | P1 | read-only; safe to add |
| `/api/semantic/wizard/jobs` | GET | — | Missing | P1 | read-only; safe to add |
| `/api/semantic/wizard/jobs/<job_id>` | DELETE | — | Missing | P1 | write path: needs a throw-away object with cleanup |
| `/api/semantic/wizard/jobs/<job_id>` | GET | — | Missing | P1 | read-only; safe to add |
| `/api/semantic/wizard/llm-models` | GET | — | Missing | P1 | read-only; safe to add |
| `/api/semantic/wizard/schemas` | POST | — | Missing | P1 | read-only introspection POST (was labelled a write path); safe to add |
| `/api/semantic/wizard/tables` | POST | — | Missing | P1 | read-only introspection POST (was labelled a write path); safe to add |
| `/api/semantic/canonical/bulk/approve` | POST | — | Blocked | P1 | starts jobs / LLM / bulk-mutates the shared semantic catalog |
| `/api/semantic/canonical/bulk/delete` | POST | — | Blocked | P1 | starts jobs / LLM / bulk-mutates the shared semantic catalog |
| `/api/semantic/canonical/bulk/reject` | POST | — | Blocked | P1 | starts jobs / LLM / bulk-mutates the shared semantic catalog |
| `/api/semantic/canonical/entities/<entity_id>/generate-aliases` | POST | — | Missing | P1 | RECLASSIFIED from Blocked: docstring says idempotent, no LLM; write path, needs a throw-away entity first (confirm one can be created) |
| `/api/semantic/canonical/generate` | POST | — | Blocked | P1 | starts jobs / LLM / bulk-mutates the shared semantic catalog |
| `/api/semantic/canonical/models/<model_id>/derive-raw-relationships` | POST | — | Blocked | P1 | starts jobs / LLM / bulk-mutates the shared semantic catalog |
| `/api/semantic/canonical/relationships/bulk-verify` | POST | — | Blocked | P1 | starts jobs / LLM / bulk-mutates the shared semantic catalog |
| `/api/semantic/canonical/sources/bulk-verify` | POST | — | Blocked | P1 | starts jobs / LLM / bulk-mutates the shared semantic catalog |
| `/api/semantic/imports/<config_id>/run` | POST | — | Blocked | P1 | starts jobs / LLM / bulk-mutates the shared semantic catalog |
| `/api/semantic/logical-references/bulk-delete` | POST | — | Blocked | P1 | starts jobs / LLM / bulk-mutates the shared semantic catalog |
| `/api/semantic/logical-references/derive-relationships` | POST | — | Blocked | P1 | starts jobs / LLM / bulk-mutates the shared semantic catalog |
| `/api/semantic/logical-references/import/csv` | POST | — | Blocked | P1 | starts jobs / LLM / bulk-mutates the shared semantic catalog |
| `/api/semantic/logical-references/import/sql` | POST | — | Blocked | P1 | starts jobs / LLM / bulk-mutates the shared semantic catalog |
| `/api/semantic/physical-databases/<db_id>/refresh` | POST | — | Blocked | P1 | starts jobs / LLM / bulk-mutates the shared semantic catalog |
| `/api/semantic/wizard/start` | POST | — | Blocked | P1 | starts jobs / LLM / bulk-mutates the shared semantic catalog |
| `/api/tabs/cached-results` | GET | cached results is a successful list | Covered | P1 | 1 test |
| `/api/tabs/cleanup` | POST | admin cleanup of expired cache entries reports a numeric count | Covered | P1 | 1 test; non-admin 403 test is skipped (BLOCKED: no non-admin credentials) |
| `/api/tabs/clear-user-data` | DELETE | clearing the user's cache data reports what was cleared | Covered | P1 | 1 test |
| `/api/tabs/health` | GET | health reports the overall status and each component | Covered | P1 | 1 test |
| `/api/tabs/history` | GET | tab history with a valid limit is a list no longer than the limit; tab history rejects limit=0 (+3 more) | Covered | P1 | 5 tests |
| `/api/tabs/invalidate/<int:query_log_id>` | DELETE | invalidating an unknown cached result is a 404 | Covered | P1 | 1 test; negative/validation/auth only: happy path not exercised |
| `/api/tabs/recent-connections` | GET | recent connections is a successful list | Covered | P1 | 1 test |
| `/api/tabs/restore` | GET | capture the existing tab state; restore returns exactly what was saved (+3 more) | Covered | P1 | 5 tests |
| `/api/tabs/results/<int:query_log_id>` | GET | cached results of an unknown query are a 404 that echoes the id; results and save without a token are rejected | Covered | P1 | 2 tests; negative/validation/auth only: happy path not exercised |
| `/api/tabs/save` | POST | save a tab state; the original tab state is restored and verified (+2 more) | Covered | P1 | 4 tests |
| `/api/tabs/stats` | GET | stats expose the result cache and state cache with typed counters; anonymous GET /api/tabs/stats is rejected | Covered | P1 | 2 tests |
| `/api/trino/catalog-configs` | GET | KNOWN DEFECT: anonymous GET /api/trino/catalog-configs requires a token; KNOWN DEFECT: catalog-configs do not expose connector credentials | Defect-only | P0 | 2 tests; NOT COUNTED AS COVERED: reached only by KNOWN DEFECT (test.fail) tests, mostly anonymous requests; needs an authenticated happy-path test |
| `/api/trino/catalogs` | GET | KNOWN DEFECT: anonymous GET /api/trino/catalogs requires a token; should return Trino catalogs | Covered | P1 | 2 tests |
| `/api/trino/catalogs/<catalog>/schemas` | GET | KNOWN DEFECT: an invalid catalog name is a 4xx, not a 500 with a Trino error | Covered | P1 | 1 test |
| `/api/trino/config` | GET | KNOWN DEFECT: anonymous GET /api/trino/config requires a token; config exposes host, port and default catalog but no password | Covered | P1 | 2 tests |
| `/api/trino/functions` | GET | KNOWN DEFECT: anonymous GET /api/trino/functions requires a token; should return the function catalog | Covered | P1 | 2 tests |
| `/api/trino/info` | GET | KNOWN DEFECT: anonymous GET /api/trino/info requires a token | Defect-only | P1 | 1 test; NOT COUNTED AS COVERED: reached only by KNOWN DEFECT (test.fail) tests, mostly anonymous requests; needs an authenticated happy-path test |
| `/api/trino/queries` | GET | KNOWN DEFECT: anonymous GET /api/trino/queries requires a token; query history returns success and a list | Covered | P1 | 2 tests |
| `/api/trino/query` | POST | KNOWN DEFECT: anonymous POST /api/trino/query requires a token; query returns the computed row (+1 more) | Covered | P0 | 3 tests |
| `/api/trino/query/explain` | POST | explain without sql is rejected | Covered | P1 | 1 test |
| `/api/trino/status` | GET | KNOWN DEFECT: anonymous GET /api/trino/status requires a token; status shows Trino is reachable | Covered | P1 | 2 tests |
| `/api/trino/supported-connectors` | GET | should return the supported connectors | Covered | P1 | 1 test |
| `/api/trino/validate-connection` | POST | KNOWN DEFECT: anonymous POST /api/trino/validate-connection requires a token; validate-connection reports every missing parameter | Covered | P1 | 2 tests; negative/validation/auth only: happy path not exercised (verified from tests: only the empty body {} is sent (200, valid=false, error "Host is required"); a valid connection (valid=true) is never tested, and the anonymous test is an expected-failure defect test) |
| `/api/trino/catalog-configs/<catalog_name>` | GET | — | Missing | P0 | read-only; safe to add |
| `/api/trino/catalogs/<catalog>/properties` | GET | — | Missing | P1 | read-only; safe to add |
| `/api/trino/catalogs/<catalog>/schemas/<schema>/tables` | GET | — | Missing | P1 | read-only; safe to add |
| `/api/trino/catalogs/<catalog>/schemas/<schema>/tables/<table>/columns` | GET | — | Missing | P1 | read-only; safe to add |
| `/api/trino/catalogs/<catalog>/schemas/<schema>/tables/<table>/preview` | GET | — | Missing | P1 | read-only; safe to add |
| `/api/trino/catalogs/<catalog>/schemas/<schema>/tables/<table>/stats` | GET | — | Missing | P1 | read-only; safe to add |
| `/api/trino/cluster` | GET | — | Missing | P1 | read-only; safe to add |
| `/api/trino/queries/<query_id>` | GET | — | Missing | P1 | read-only; safe to add |
| `/api/trino/catalog-configs` | POST | — | Blocked | P1 | changes shared Trino configuration / cancels queries: needs approval |
| `/api/trino/catalog-configs/<catalog_name>` | DELETE | — | Blocked | P1 | changes shared Trino configuration / cancels queries: needs approval |
| `/api/trino/catalog-configs/<catalog_name>` | PUT | — | Blocked | P1 | changes shared Trino configuration / cancels queries: needs approval |
| `/api/trino/catalog-configs/from-connection` | POST | — | Blocked | P1 | changes shared Trino configuration / cancels queries: needs approval |
| `/api/trino/catalog-configs/from-file-connection` | POST | — | Blocked | P1 | changes shared Trino configuration / cancels queries: needs approval |
| `/api/trino/config` | PUT | — | Blocked | P1 | changes shared Trino configuration / cancels queries: needs approval |
| `/api/trino/queries/<query_id>` | DELETE | — | Blocked | P1 | changes shared Trino configuration / cancels queries: needs approval |
| `/api/trino/restart` | POST | — | Blocked | P1 | changes shared Trino configuration / cancels queries: needs approval |
| `/api/weave/flows` | GET | — | Missing | P1 | read-only; safe to add |
| `/api/weave/flows/<int:flow_id>` | GET | — | Missing | P1 | read-only; safe to add |
| `/api/weave/flows/<int:flow_id>/nodes/<node_id>/input-schema` | GET | — | Missing | P1 | read-only; safe to add |
| `/api/weave/flows/<int:flow_id>/runs` | GET | — | Missing | P1 | read-only; safe to add |
| `/api/weave/node-types` | GET | — | Missing | P1 | read-only; safe to add |
| `/api/weave/runs/<int:run_id>` | GET | — | Missing | P1 | read-only; safe to add |
| `/api/weave/schema` | GET | — | Missing | P1 | read-only; safe to add |
| `/api/weave/flows` | POST | — | Missing | P1 | RECLASSIFIED from Blocked: create/update/delete of a throw-away flow is an isolated write (run/preview stay Blocked) |
| `/api/weave/flows/<int:flow_id>` | DELETE | — | Missing | P1 | RECLASSIFIED from Blocked: throw-away flow only |
| `/api/weave/flows/<int:flow_id>` | PUT | — | Missing | P1 | RECLASSIFIED from Blocked: throw-away flow only |
| `/api/weave/flows/<int:flow_id>/preview` | POST | — | Blocked | P1 | creates, runs or alters a flow (run/preview execute it) |
| `/api/weave/flows/<int:flow_id>/run` | POST | — | Blocked | P1 | creates, runs or alters a flow (run/preview execute it) |
| `/api/conversations/<conversation_id>` | DELETE | — | Missing | P1 | DB-backed; testable with a throw-away conversation and cleanup |
| `/api/datapilot/chat/sessions/<session_id>` | DELETE | — | Blocked | P2 | needs a chat session, which can only be created through the WebSocket |
| `/api/messages/<message_id>` | DELETE | — | Missing | P1 | DB-backed; testable with a throw-away conversation and cleanup |
| `/auth/admin/providers/<provider_name>` | DELETE | — | Blocked | P0 | changes the shared authentication posture (providers/roles); provider test calls an external IdP |
| `/auth/admin/role-mappings/api/mappings/<mapping_id>` | DELETE | — | Blocked | P1 | changes the shared role-mapping posture |
| `/auth/admin/roles/api/roles/<role_id>` | DELETE | — | Blocked | P0 | changes the shared authentication posture (providers/roles); provider test calls an external IdP |
| `/auth/api/atlassian-mcp/disconnect` | DELETE | — | Blocked | P2 | changes or revokes the caller's stored OAuth tokens |
| `/auth/api/atlassian/disconnect` | DELETE | — | Blocked | P2 | changes or revokes the caller's stored OAuth tokens |
| `/auth/api/atlassian/index` | DELETE | — | Blocked | P2 | deletes the caller's indexed documents; restoring them would need a new sync (inferred from the sync handlers, not verified). UNCERTAIN: could be tested with an approved disposable user |
| `/auth/api/github-mcp/disconnect` | DELETE | — | Blocked | P2 | changes or revokes the caller's stored OAuth tokens |
| `/auth/api/sharepoint-mcp/disconnect` | DELETE | — | Blocked | P2 | changes or revokes the caller's stored OAuth tokens |
| `/auth/api/sharepoint/index` | DELETE | — | Blocked | P2 | deletes the caller's indexed documents; restoring them would need a new sync (inferred from the sync handlers, not verified). UNCERTAIN: could be tested with an approved disposable user |
| `/api/conversations` | GET | — | Missing | P1 | read-only |
| `/api/conversations/<conversation_id>` | GET | — | Missing | P1 | read-only |
| `/api/conversations/<conversation_id>/search` | GET | — | Missing | P1 | read-only |
| `/api/conversations/<conversation_id>/unread-count` | GET | — | Missing | P1 | read-only |
| `/api/datapilot/chat/sessions` | GET | — | Missing | P2 | read-only list |
| `/api/datapilot/chat/sessions/<session_id>` | GET | — | Blocked | P2 | needs a chat session, which can only be created through the WebSocket |
| `/api/messages/<parent_id>/thread` | GET | — | Missing | P1 | read-only |
| `/api/repo/llm-analytics/recent-executions` | GET | — | Missing | P1 | read-only |
| `/api/repo/llm-analytics/stats` | GET | — | Missing | P1 | read-only |
| `/api/repo/llm-analytics/usage-by-day` | GET | — | Missing | P1 | read-only |
| `/api/repo/llm-analytics/usage-by-model` | GET | — | Missing | P1 | read-only |
| `/api/voice/config` | GET | — | Missing | P2 | read-only |
| `/api/voice/test` | GET | — | Missing | P2 | read-only |
| `/api/voice/tts_engines` | GET | — | Missing | P2 | read-only |
| `/api/voice/vad/status` | GET | — | Missing | P2 | read-only |
| `/api/voice/voices` | GET | — | Missing | P2 | read-only |
| `/api/voice/wake_words` | GET | — | Missing | P2 | read-only |
| `/auth/admin/audit-log` | GET | — | Missing | P1 | read-only admin view; assert no secrets |
| `/auth/admin/integrations` | GET | — | Missing | P1 | read-only admin view; assert no secrets |
| `/auth/admin/providers` | GET | — | Missing | P0 | read-only admin view; assert no secrets |
| `/auth/admin/providers/<provider_name>` | GET | — | Missing | P0 | read-only admin view; assert no secrets |
| `/auth/admin/role-mappings` | GET | — | Missing | P1 | read-only admin view |
| `/auth/admin/role-mappings/api/mappings` | GET | — | Missing | P1 | read-only admin view |
| `/auth/admin/role-mappings/metadata` | GET | — | Missing | P1 | read-only admin view |
| `/auth/admin/roles` | GET | — | Missing | P0 | read-only admin view; assert no secrets |
| `/auth/admin/roles/api/roles` | GET | — | Missing | P0 | read-only admin view; assert no secrets |
| `/auth/admin/roles/api/roles/<role_id>` | GET | — | Missing | P0 | read-only admin view; assert no secrets |
| `/auth/api/atlassian-mcp/callback` | GET | — | Blocked | P2 | starts or completes an external OAuth flow (redirect and token exchange) |
| `/auth/api/atlassian-mcp/connect` | GET | — | Blocked | P2 | starts or completes an external OAuth flow (redirect and token exchange) |
| `/auth/api/atlassian-mcp/status` | GET | — | Missing | P2 | RECLASSIFIED from Blocked: read-only, caller-scoped, no external call (atlassian_mcp.py: reads the caller's OAuthToken row only). Assert no token or secret fields in the response |
| `/auth/api/atlassian-mcp/tools` | GET | — | Blocked | P2 | lists tools through the MCP tool service, which loads live from the external MCP server when the caller is connected. UNCERTAIN: for a user with no stored token it may return an empty list without any external call; not verified, so not reclassified |
| `/auth/api/atlassian/callback` | GET | — | Blocked | P2 | starts or completes an external OAuth flow (redirect and token exchange) |
| `/auth/api/atlassian/connect` | GET | — | Blocked | P2 | starts or completes an external OAuth flow (redirect and token exchange) |
| `/auth/api/atlassian/connector` | GET | — | Missing | P2 | RECLASSIFIED from Blocked: read-only, caller-scoped, no external call (atlassian.py: OAuthToken row, chunk count and get_settings(), all DB reads). Assert no token or secret fields in the response |
| `/auth/api/atlassian/index/documents` | GET | — | Missing | P2 | RECLASSIFIED from Blocked: read-only, caller-scoped, no external call (atlassian.py: reads the caller's atlassian_kb_chunks only (docstring: read-only, scoped to the caller)). Assert no token or secret fields in the response |
| `/auth/api/atlassian/search` | GET | — | Blocked | P2 | live search against the external Atlassian APIs using the caller's token |
| `/auth/api/atlassian/status` | GET | — | Missing | P2 | RECLASSIFIED from Blocked: read-only, caller-scoped, no external call (atlassian.py: reads the caller's OAuthToken row only). Assert no token or secret fields in the response |
| `/auth/api/database/connector` | GET | — | Missing | P2 | RECLASSIFIED from Blocked: read-only, caller-scoped, no external call (database.py: _state() = caller settings row + list of registered DIA connections (assert no credential fields)). Assert no token or secret fields in the response |
| `/auth/api/database/tools` | GET | — | Missing | P2 | RECLASSIFIED from Blocked: read-only, caller-scoped, no external call (database.py: lists tool definitions via get_advertised_tools(user,"database"); the "database" connector uses a local sentinel token and build_database_tools() only constructs tool objects, nothing is executed). Assert no token or secret fields in the response |
| `/auth/api/github-mcp/callback` | GET | — | Blocked | P2 | starts or completes an external OAuth flow (redirect and token exchange) |
| `/auth/api/github-mcp/connect` | GET | — | Blocked | P2 | starts or completes an external OAuth flow (redirect and token exchange) |
| `/auth/api/github-mcp/status` | GET | — | Missing | P2 | RECLASSIFIED from Blocked: read-only, caller-scoped, no external call (github_mcp.py: OAuthToken row; build_install_url() only builds a string, no network call). Assert no token or secret fields in the response |
| `/auth/api/github-mcp/tools` | GET | — | Blocked | P2 | lists tools through the MCP tool service, which loads live from the external MCP server when the caller is connected. UNCERTAIN: for a user with no stored token it may return an empty list without any external call; not verified, so not reclassified |
| `/auth/api/sharepoint-mcp/callback` | GET | — | Blocked | P2 | starts or completes an external OAuth flow (redirect and token exchange) |
| `/auth/api/sharepoint-mcp/connect` | GET | — | Blocked | P2 | starts or completes an external OAuth flow (redirect and token exchange) |
| `/auth/api/sharepoint-mcp/status` | GET | — | Missing | P2 | RECLASSIFIED from Blocked: read-only, caller-scoped, no external call (sharepoint_mcp.py: OAuthToken row; is_configured()/build_admin_consent_url() only build values, no network call). Assert no token or secret fields in the response |
| `/auth/api/sharepoint-mcp/tools` | GET | — | Blocked | P2 | lists tools through the MCP tool service, which loads live from the external MCP server when the caller is connected. UNCERTAIN: for a user with no stored token it may return an empty list without any external call; not verified, so not reclassified |
| `/auth/api/sharepoint/connector` | GET | — | Missing | P2 | RECLASSIFIED from Blocked: read-only, caller-scoped, no external call (sharepoint.py: _is_connected + chunk count + get_settings(), all DB reads). Assert no token or secret fields in the response |
| `/auth/api/sharepoint/index/documents` | GET | — | Missing | P2 | RECLASSIFIED from Blocked: read-only, caller-scoped, no external call (sharepoint.py: reads the caller's SharePointKBChunk rows only). Assert no token or secret fields in the response |
| `/auth/oauth/<provider_name>/callback` | GET | — | Blocked | P2 | needs an identity provider |
| `/auth/oauth/<provider_name>/login` | GET | — | Blocked | P2 | needs an identity provider |
| `/auth/oauth/<provider_name>/logout` | GET | — | Blocked | P2 | needs an identity provider |
| `/auth/oauth/avatar/<user_id>` | GET | — | Blocked | P2 | needs an identity provider |
| `/auth/oauth/providers` | GET | — | Missing | P1 | public read-only provider list |
| `/api/<path>` | OPTIONS | — | Not Required | P2 | framework CORS preflight (catch-all); nothing to test |
| `/api/datapilot/chat/sessions/<session_id>` | PATCH | — | Blocked | P2 | needs a chat session, which can only be created through the WebSocket |
| `/api/conversations` | POST | — | Missing | P1 | DB-backed; testable with a throw-away conversation and cleanup |
| `/api/conversations/<conversation_id>/messages` | POST | — | Missing | P1 | DB-backed; testable with a throw-away conversation and cleanup |
| `/api/conversations/<conversation_id>/participants` | POST | — | Missing | P1 | DB-backed; testable with a throw-away conversation and cleanup |
| `/api/conversations/<conversation_id>/read` | POST | — | Missing | P1 | DB-backed; testable with a throw-away conversation and cleanup |
| `/api/voice/synthesize` | POST | — | Blocked | P2 | needs speech models (STT/TTS/VAD) running |
| `/api/voice/transcribe` | POST | — | Blocked | P2 | needs speech models (STT/TTS/VAD) running |
| `/api/voice/tts_engine` | POST | — | Blocked | P2 | needs speech models (STT/TTS/VAD) running |
| `/api/voice/vad/process` | POST | — | Blocked | P2 | needs speech models (STT/TTS/VAD) running |
| `/auth/admin/integrations/<name>/enable` | POST | — | Blocked | P0 | changes the shared authentication posture (providers/roles); provider test calls an external IdP |
| `/auth/admin/providers/<provider_name>` | POST | — | Blocked | P0 | changes the shared authentication posture (providers/roles); provider test calls an external IdP |
| `/auth/admin/providers/<provider_name>/enable` | POST | — | Blocked | P0 | changes the shared authentication posture (providers/roles); provider test calls an external IdP |
| `/auth/admin/providers/<provider_name>/test` | POST | — | Blocked | P0 | changes the shared authentication posture (providers/roles); provider test calls an external IdP |
| `/auth/admin/role-mappings/api/mappings` | POST | — | Blocked | P1 | changes the shared role-mapping posture |
| `/auth/admin/role-mappings/api/reload` | POST | — | Blocked | P1 | changes the shared role-mapping posture |
| `/auth/admin/roles/api/roles` | POST | — | Blocked | P0 | changes the shared authentication posture (providers/roles); provider test calls an external IdP |
| `/auth/admin/roles/api/roles/seed` | POST | — | Blocked | P0 | changes the shared authentication posture (providers/roles); provider test calls an external IdP |
| `/auth/api/atlassian/ask` | POST | — | Blocked | P2 | external sync, embedding and LLM work against the connected service |
| `/auth/api/atlassian/sync` | POST | — | Blocked | P2 | external sync, embedding and LLM work against the connected service |
| `/auth/api/sharepoint/ask` | POST | — | Blocked | P2 | external sync, embedding and LLM work against the connected service |
| `/auth/api/sharepoint/sync` | POST | — | Blocked | P2 | external sync, embedding and LLM work against the connected service |
| `/auth/oauth/<provider_name>/backchannel-logout` | POST | — | Blocked | P2 | needs an identity provider |
| `/api/conversations/<conversation_id>` | PUT | — | Missing | P1 | DB-backed; testable with a throw-away conversation and cleanup |
| `/auth/admin/role-mappings/api/mappings/<mapping_id>` | PUT | — | Blocked | P1 | changes the shared role-mapping posture |
| `/auth/admin/roles/api/roles/<role_id>` | PUT | — | Blocked | P0 | changes the shared authentication posture (providers/roles); provider test calls an external IdP |
| `/auth/api/atlassian/connector` | PUT | — | Blocked | P2 | changes the caller's connector settings (local database write, not an external call). UNCERTAIN: could be tested if the previous settings are saved and restored; not reclassified |
| `/auth/api/database/connector` | PUT | — | Blocked | P2 | changes the caller's connector settings (local database write, not an external call). UNCERTAIN: could be tested if the previous settings are saved and restored; not reclassified |
| `/auth/api/sharepoint/connector` | PUT | — | Blocked | P2 | changes the caller's connector settings (local database write, not an external call). UNCERTAIN: could be tested if the previous settings are saved and restored; not reclassified |
| `/ws/chat/datapilot` | WS | — | Blocked | P2 | WebSocket: cannot be driven by APIRequestContext |
| `/ws/chat/general` | WS | — | Blocked | P2 | WebSocket: cannot be driven by APIRequestContext |
| `/api/v2/dashboard` | GET | — | Missing | P1 | read-only; FastAPI v2 |
| `/api/v2/dashboard/recent-conversations` | GET | — | Missing | P1 | read-only; FastAPI v2 |
| `/api/v2/dashboard/recent-queries` | GET | — | Missing | P1 | read-only; FastAPI v2 |
| `/api/v2/dashboard/recent-jobs` | GET | — | Missing | P1 | read-only; FastAPI v2 |
| `/api/v2/dashboard/llm-stats` | GET | — | Missing | P1 | read-only; FastAPI v2 |
| `/api/v2/logs/files` | GET | — | Missing | P1 | read-only; FastAPI v2 |
| `/api/v2/logs/content/{filename}` | GET | — | Missing | P1 | read-only; FastAPI v2 |
| `/api/v2/logs/tail/{filename}` | GET | — | Missing | P1 | read-only; FastAPI v2 |
| `/api/v2/prompts/data` | GET | — | Missing | P1 | read-only |
| `/api/v2/prompts/new` | GET | — | Missing | P1 | read-only |
| `/api/v2/prompts/{pid}` | GET | — | Missing | P1 | read-only |
| `/api/v2/prompts/save` | POST | — | Missing | P1 | write path: needs a throw-away object with cleanup |
| `/api/v2/prompts/{pid}` | DELETE | — | Missing | P1 | write path: needs a throw-away object with cleanup |
| `/api/v2/prompts/import` | POST | — | Missing | P1 | write path: needs a throw-away object with cleanup |
| `/api/v2/prompts/{pid}/preview` | POST | — | Missing | P1 | write path: needs a throw-away object with cleanup |
| `/api/v2/facetedsearch/settings` | GET | — | Missing | P2 | read-only; FastAPI v2 faceted search (probe first: may need the external search engine) |
| `/api/v2/facetedsearch/settings` | PUT | — | Blocked | P2 | FastAPI v2 faceted search write/sync/test: needs the external search engine (+ optional LLM) |
| `/api/v2/facetedsearch/settings/reset` | POST | — | Blocked | P2 | FastAPI v2 faceted search write/sync/test: needs the external search engine (+ optional LLM) |
| `/api/v2/facetedsearch/settings/test-connection` | POST | — | Blocked | P2 | FastAPI v2 faceted search write/sync/test: needs the external search engine (+ optional LLM) |
| `/api/v2/facetedsearch/settings/test-ai` | POST | — | Blocked | P2 | FastAPI v2 faceted search write/sync/test: needs the external search engine (+ optional LLM) |
| `/api/v2/facetedsearch/settings/available-models` | GET | — | Missing | P2 | read-only; FastAPI v2 faceted search (probe first: may need the external search engine) |
| `/api/v2/facetedsearch/indexes` | GET | — | Missing | P2 | read-only; FastAPI v2 faceted search (probe first: may need the external search engine) |
| `/api/v2/facetedsearch/indexes` | POST | — | Blocked | P2 | FastAPI v2 faceted search write/sync/test: needs the external search engine (+ optional LLM) |
| `/api/v2/facetedsearch/indexes/{index_id}` | GET | — | Missing | P2 | read-only; FastAPI v2 faceted search (probe first: may need the external search engine) |
| `/api/v2/facetedsearch/indexes/{index_id}` | PUT | — | Blocked | P2 | FastAPI v2 faceted search write/sync/test: needs the external search engine (+ optional LLM) |
| `/api/v2/facetedsearch/indexes/{index_id}` | DELETE | — | Blocked | P2 | FastAPI v2 faceted search write/sync/test: needs the external search engine (+ optional LLM) |
| `/api/v2/facetedsearch/indexes/{index_id}/sync` | POST | — | Blocked | P2 | FastAPI v2 faceted search write/sync/test: needs the external search engine (+ optional LLM) |
| `/api/v2/facetedsearch/indexes/{index_id}/reindex` | POST | — | Blocked | P2 | FastAPI v2 faceted search write/sync/test: needs the external search engine (+ optional LLM) |
| `/api/v2/facetedsearch/indexes/{index_id}/preview` | GET | — | Missing | P2 | read-only; FastAPI v2 faceted search (probe first: may need the external search engine) |
| `/api/v2/facetedsearch/source-types` | GET | — | Missing | P2 | read-only; FastAPI v2 faceted search (probe first: may need the external search engine) |
| `/api/v2/facetedsearch/facets` | GET | — | Missing | P2 | read-only; FastAPI v2 faceted search (probe first: may need the external search engine) |
| `/api/v2/facetedsearch/facets` | POST | — | Blocked | P2 | FastAPI v2 faceted search write/sync/test: needs the external search engine (+ optional LLM) |
| `/api/v2/facetedsearch/facets/{facet_id}` | PUT | — | Blocked | P2 | FastAPI v2 faceted search write/sync/test: needs the external search engine (+ optional LLM) |
| `/api/v2/facetedsearch/facets/{facet_id}` | DELETE | — | Blocked | P2 | FastAPI v2 faceted search write/sync/test: needs the external search engine (+ optional LLM) |
| `/api/v2/facetedsearch/facets/reorder` | POST | — | Blocked | P2 | FastAPI v2 faceted search write/sync/test: needs the external search engine (+ optional LLM) |
| `/api/v2/facetedsearch/facet-types` | GET | — | Missing | P2 | read-only; FastAPI v2 faceted search (probe first: may need the external search engine) |
| `/api/v2/facetedsearch/search-pages` | GET | — | Missing | P2 | read-only; FastAPI v2 faceted search (probe first: may need the external search engine) |
| `/api/v2/facetedsearch/search-pages` | POST | — | Blocked | P2 | FastAPI v2 faceted search write/sync/test: needs the external search engine (+ optional LLM) |
| `/api/v2/facetedsearch/search-pages/{page_id}` | PUT | — | Blocked | P2 | FastAPI v2 faceted search write/sync/test: needs the external search engine (+ optional LLM) |
| `/api/v2/facetedsearch/search-pages/{page_id}` | DELETE | — | Blocked | P2 | FastAPI v2 faceted search write/sync/test: needs the external search engine (+ optional LLM) |
| `/api/v2/facetedsearch/dashboards` | GET | — | Missing | P2 | read-only; FastAPI v2 faceted search (probe first: may need the external search engine) |
| `/api/v2/facetedsearch/dashboards` | POST | — | Blocked | P2 | FastAPI v2 faceted search write/sync/test: needs the external search engine (+ optional LLM) |
| `/api/v2/facetedsearch/dashboards/{dashboard_id}` | GET | — | Missing | P2 | read-only; FastAPI v2 faceted search (probe first: may need the external search engine) |
| `/api/v2/facetedsearch/dashboards/{dashboard_id}` | PUT | — | Blocked | P2 | FastAPI v2 faceted search write/sync/test: needs the external search engine (+ optional LLM) |
| `/api/v2/facetedsearch/dashboards/{dashboard_id}` | DELETE | — | Blocked | P2 | FastAPI v2 faceted search write/sync/test: needs the external search engine (+ optional LLM) |
| `/api/v2/facetedsearch/dashboards/{dashboard_id}/duplicate` | POST | — | Blocked | P2 | FastAPI v2 faceted search write/sync/test: needs the external search engine (+ optional LLM) |
| `/api/v2/facetedsearch/dashboards/{dashboard_id}/export` | GET | — | Missing | P2 | read-only; FastAPI v2 faceted search (probe first: may need the external search engine) |
| `/api/v2/facetedsearch/dashboards/import` | POST | — | Blocked | P2 | FastAPI v2 faceted search write/sync/test: needs the external search engine (+ optional LLM) |
| `/api/v2/facetedsearch/dashboards/{dashboard_id}/widgets` | POST | — | Blocked | P2 | FastAPI v2 faceted search write/sync/test: needs the external search engine (+ optional LLM) |
| `/api/v2/facetedsearch/widgets/{widget_id}` | PUT | — | Blocked | P2 | FastAPI v2 faceted search write/sync/test: needs the external search engine (+ optional LLM) |
| `/api/v2/facetedsearch/widgets/{widget_id}` | DELETE | — | Blocked | P2 | FastAPI v2 faceted search write/sync/test: needs the external search engine (+ optional LLM) |
| `/api/v2/facetedsearch/widgets/reorder` | POST | — | Blocked | P2 | FastAPI v2 faceted search write/sync/test: needs the external search engine (+ optional LLM) |
| `/api/v2/facetedsearch/widgets/{widget_id}/preview` | POST | — | Blocked | P2 | FastAPI v2 faceted search write/sync/test: needs the external search engine (+ optional LLM) |
| `/api/v2/facetedsearch/chart-types` | GET | — | Missing | P2 | read-only; FastAPI v2 faceted search (probe first: may need the external search engine) |
| `/api/v2/facetedsearch/pages/active` | GET | — | Missing | P2 | read-only; FastAPI v2 faceted search (probe first: may need the external search engine) |
| `/api/v2/facetedsearch/pages/{slug}` | GET | — | Missing | P2 | read-only; FastAPI v2 faceted search (probe first: may need the external search engine) |
| `/api/v2/facetedsearch/pages/{slug}/search` | POST | — | Blocked | P2 | FastAPI v2 faceted search write/sync/test: needs the external search engine (+ optional LLM) |
| `/api/v2/facetedsearch/dashboards-active` | GET | — | Missing | P2 | read-only; FastAPI v2 faceted search (probe first: may need the external search engine) |
| `/api/v2/facetedsearch/dashboard/{slug}` | GET | — | Missing | P2 | read-only; FastAPI v2 faceted search (probe first: may need the external search engine) |
| `/api/v2/facetedsearch/dashboard/{slug}/data` | POST | — | Blocked | P2 | FastAPI v2 faceted search write/sync/test: needs the external search engine (+ optional LLM) |
| `/api/v2/facetedsearch/nlp/analyze` | POST | — | Blocked | P2 | FastAPI v2 faceted search write/sync/test: needs the external search engine (+ optional LLM) |
| `/api/v2/health` | GET | — | Missing | P2 | read-only; FastAPI v2 |
| `/api/v2/openapi.json` | GET | — | Missing | P2 | read-only; FastAPI v2 |
| `/api/v2/docs` | GET | — | Missing | P2 | read-only; FastAPI v2 |
| `/api/v2/redoc` | GET | — | Missing | P2 | read-only; FastAPI v2 |

## Added in this revision (found in the QA source, not in the 2026-10-07 map)

| Area | Missing | Blocked | Not Required |
|---|---:|---:|---:|
| Auth admin: providers / roles / integrations | 7 | 9 | 0 |
| Auth admin: role mappings | 3 | 4 | 0 |
| Connections / LLM / queries (repo) | 4 | 0 | 0 |
| Connector OAuth | 10 | 25 | 0 |
| Conversations / messages | 12 | 0 | 0 |
| DataPilot chat sessions | 1 | 3 | 0 |
| OAuth / SSO | 1 | 5 | 0 |
| Other | 0 | 0 | 1 |
| Voice | 6 | 4 | 0 |
| WebSocket | 0 | 2 | 0 |
| v2 (FastAPI) | 19 | 0 | 0 |
| v2 faceted search (FastAPI) | 17 | 29 | 0 |
| **Total** | 80 | 81 | 1 |

Several of these classifications are provisional until checked against the handler source when tests are written: the connector OAuth routes (10 caller-scoped read-only GETs were verified from source and moved to Missing; the three `*/tools` GETs, the three connector settings PUTs and the two index DELETEs stay Blocked with their uncertainty stated in the row) and the 17 FastAPI v2 faceted-search GETs (their handlers delegate to services; `GET /settings/available-models` and `GET /indexes/{index_id}/preview` may reach an LLM provider or a data source and need a source check).

## UNVERIFIED: routes found only in `/home/dia/backend` (not counted)

These 16 routes exist in the dev tree `/home/dia/backend` and not in `/home/dia-qa/backend`. They are **not** part of the 594-route denominator and are not classified as Covered, Missing or Blocked, because it is not confirmed that the QA environment serving `:8081` includes them. They would return 404 if it does not. Once the QA tree is confirmed to include them, add them as Missing (read-only or dry-run only for export; throw-away data for variable sets).

| Method | Route | Note |
|---|---|---|
| GET | `/api/datapilot/variable-sets` | read-only |
| POST | `/api/export/bundle` | read-only or dry-run only (POST /import must be sent with apply=false; never apply:true) |
| POST | `/api/export/bundle/archive` | read-only or dry-run only (POST /import must be sent with apply=false; never apply:true) |
| POST | `/api/export/bundle/files` | read-only or dry-run only (POST /import must be sent with apply=false; never apply:true) |
| GET | `/api/export/entities` | read-only or dry-run only (POST /import must be sent with apply=false; never apply:true) |
| POST | `/api/export/import` | read-only or dry-run only (POST /import must be sent with apply=false; never apply:true) |
| POST | `/api/export/import/preview` | read-only or dry-run only (POST /import must be sent with apply=false; never apply:true) |
| GET | `/api/logs/sql-gate-fallbacks` | read-only |
| GET | `/api/repo/variable-sets` | read-only |
| POST | `/api/repo/variable-sets` | write path: needs a throw-away object with cleanup |
| DELETE | `/api/repo/variable-sets/<set_id>` | write path: needs a throw-away object with cleanup |
| GET | `/api/repo/variable-sets/<set_id>` | read-only |
| PUT | `/api/repo/variable-sets/<set_id>` | write path: needs a throw-away object with cleanup |
| POST | `/api/repo/variable-sets/<set_id>/variables` | write path: needs a throw-away object with cleanup |
| DELETE | `/api/repo/variables/<variable_id>` | write path: needs a throw-away object with cleanup |
| PUT | `/api/repo/variables/<variable_id>` | write path: needs a throw-away object with cleanup |
