# DIA API endpoint coverage (Playwright)

_Generated 2026-10-07. Denominator: 432 route+method combinations in the 35 backend files reachable through the gateway (blueprint route table). Status "Covered" means a real Playwright test sends a request to that route; the test names are listed. Not inventoried: WebSocket (`/ws`, datapilot_ws), OAuth/SSO views, voice and admin role-mapping views._

| Status | Routes | Share |
|---|---:|---:|
| Covered | 171 | 40% |
| Missing | 149 | 34% |
| Blocked | 93 | 22% |
| Not Required | 19 | 4% |
| **Total** | **432** | |

**Coverage = 171/432 (40%).** Of the Covered routes, 51 are exercised only by negative/validation/auth tests (happy path not exercised). Excluding Not Required routes, coverage is 171/413 (41%).

Open work by priority: **P0**: 7 missing, 11 blocked; **P1**: 134 missing, 74 blocked; **P2**: 8 missing, 8 blocked.

## By area

| Area | Covered | Missing | Blocked | Not Required | Total |
|---|---:|---:|---:|---:|---:|
| Semantic models | 8 | 61 | 15 | 0 | 84 |
| Connections / LLM / queries (repo) | 30 | 13 | 6 | 5 | 54 |
| Authorization | 16 | 6 | 11 | 0 | 33 |
| Navigator | 0 | 23 | 10 | 0 | 33 |
| Trino | 12 | 8 | 8 | 0 | 28 |
| DataPilot SQL / saved queries | 19 | 0 | 0 | 0 | 19 |
| Jobs | 8 | 0 | 10 | 0 | 18 |
| Prompts | 6 | 9 | 0 | 2 | 17 |
| Data quality | 5 | 11 | 0 | 0 | 16 |
| Knowledge graph | 4 | 3 | 9 | 0 | 16 |
| MCP servers | 8 | 0 | 7 | 0 | 15 |
| Agents | 8 | 2 | 3 | 0 | 13 |
| Cache manager | 7 | 1 | 4 | 1 | 13 |
| Weave flows | 0 | 7 | 5 | 0 | 12 |
| DataPilot viz / autocomplete | 9 | 2 | 0 | 0 | 11 |
| Tabs | 11 | 0 | 0 | 0 | 11 |
| Authentication & users | 9 | 0 | 0 | 0 | 9 |
| Chat | 2 | 1 | 5 | 0 | 8 |
| Docker services | 0 | 0 | 0 | 8 | 8 |
| Few-shots | 5 | 1 | 0 | 1 | 7 |
| Application logs | 2 | 1 | 0 | 0 | 3 |
| Health | 1 | 0 | 0 | 2 | 3 |
| Dashboard | 1 | 0 | 0 | 0 | 1 |

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
| `/api/logs/content/<path:filename>` | GET | KNOWN DEFECT: anonymous GET /api/logs/content/app.log requires a token | Covered | P2 | 1 test; negative/validation/auth only: happy path not exercised |
| `/api/logs/files` | GET | KNOWN DEFECT: anonymous GET /api/logs/files requires a token | Covered | P2 | 1 test; negative/validation/auth only: happy path not exercised |
| `/api/logs/tail/<path:filename>` | GET | — | Missing | P2 | read-only; safe to add |
| `/auth/api/login` | POST | login succeeds and returns a JWT plus the full user object; login rejects invalid input: unknown username (+13 more) | Covered | P0 | 15 tests |
| `/auth/api/logout` | POST | logout succeeds | Covered | P0 | 1 test |
| `/auth/api/me` | GET | /me returns the logged-in user with the full schema and no credentials; anonymous GET /auth/api/me is rejected (+4 more) | Covered | P0 | 6 tests |
| `/auth/api/providers` | GET | providers is public and lists the login providers, with a default among them | Covered | P0 | 1 test |
| `/auth/api/refresh` | POST | refresh issues a new JWT for the same user; refresh without a token is rejected | Covered | P0 | 2 tests |
| `/auth/api/users` | GET | the user list has typed users, includes the caller and the four standard roles, and no credentials; list users without a token is rejected | Covered | P0 | 2 tests; non-admin 403 test is skipped (BLOCKED: no non-admin credentials) |
| `/auth/api/users/<int:user_id>` | DELETE | delete a user without a token is rejected; delete a non-existent user is rejected | Covered | P0 | 2 tests; negative/validation/auth only: happy path not exercised; non-admin 403 test is skipped (BLOCKED: no non-admin credentials) |
| `/auth/api/users/<int:user_id>/active` | PUT | set a user active without a token is rejected; set active on a non-existent user is rejected | Covered | P0 | 2 tests; negative/validation/auth only: happy path not exercised; non-admin 403 test is skipped (BLOCKED: no non-admin credentials) |
| `/auth/api/users/<int:user_id>/role` | PUT | update a role without a token is rejected; update role of a non-existent user is rejected (+3 more) | Covered | P0 | 5 tests; negative/validation/auth only: happy path not exercised; non-admin 403 test is skipped (BLOCKED: no non-admin credentials) |
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
| `/api/datapilot/cache/<int:query_log_id>/status` | GET | the result cache reports an unknown query as status "unknown" | Covered | P1 | 1 test; negative/validation/auth only: happy path not exercised |
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
| `/api/repo/<model>` | GET | it appears in the connection list, enabled; the deleted connection is gone from the list (+11 more) | Covered | P1 | 13 tests |
| `/api/repo/admin-stats` | GET | KNOWN DEFECT: anonymous GET /api/repo/admin-stats requires a token | Covered | P1 | 1 test; negative/validation/auth only: happy path not exercised |
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
| `/api/repo/connections/test` | POST | test-connection with no parameters is rejected | Covered | P0 | 1 test |
| `/api/repo/connections/upload` | POST | upload of a database file without a file part is rejected; KNOWN DEFECT: anonymous POST /api/repo/connections/upload requires a token | Covered | P0 | 2 tests |
| `/api/repo/connections/upload-source-file` | POST | upload of a source file without a file part is rejected | Covered | P0 | 1 test |
| `/api/repo/llm-models` | POST | create a model under the provider; KNOWN DEFECT: anonymous POST /api/repo/llm-models requires a token (+1 more) | Covered | P1 | 3 tests |
| `/api/repo/llm-models/<int:model_id>` | DELETE | delete the model; delete an LLM model with an unknown id is a 404 | Covered | P1 | 2 tests |
| `/api/repo/llm-models/<int:model_id>` | GET | get an LLM model with an unknown id is a 404 | Covered | P1 | 1 test; negative/validation/auth only: happy path not exercised |
| `/api/repo/llm-models/<int:model_id>` | PUT | update the model; update an LLM model with an unknown id is a 404 | Covered | P1 | 2 tests |
| `/api/repo/llm-providers` | GET | the model appears in the combined list and the provider counts it; the default provider is unchanged and the throw-away provider is gone (+2 more) | Covered | P0 | 4 tests |
| `/api/repo/llm-providers` | POST | create a throw-away provider (non-default); KNOWN DEFECT: anonymous POST /api/repo/llm-providers requires a token (+3 more) | Covered | P0 | 5 tests |
| `/api/repo/llm-providers/<int:provider_id>` | DELETE | delete the provider; delete an LLM provider with an unknown id is a 404 | Covered | P0 | 2 tests |
| `/api/repo/llm-providers/<int:provider_id>` | GET | read the provider back; the deleted provider is a 404 (+1 more) | Covered | P0 | 3 tests |
| `/api/repo/llm-providers/<int:provider_id>` | PUT | update an LLM provider with an unknown id is a 404 | Covered | P0 | 1 test; negative/validation/auth only: happy path not exercised |
| `/api/repo/query-history` | GET | KNOWN DEFECT: anonymous GET /api/repo/query-history requires a token | Covered | P1 | 1 test; negative/validation/auth only: happy path not exercised |
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
| `/api/repo/<model>/data` | GET | — | Not Required | P2 | server-rendered/admin form helper, not a data API |
| `/api/repo/<model>/new` | GET | — | Not Required | P2 | server-rendered/admin form helper, not a data API |
| `/api/repo/<model>/new` | POST | — | Not Required | P2 | server-rendered/admin form helper, not a data API |
| `/api/repo/test-upload` | GET | — | Not Required | P2 | server-rendered/admin form helper, not a data API |
| `/api/dashboard` | GET | KNOWN DEFECT: anonymous GET /api/dashboard requires a token | Covered | P2 | 1 test; negative/validation/auth only: happy path not exercised |
| `/api/datapilot/dq/evaluate` | POST | evaluating without a query_log_id is rejected | Covered | P1 | 1 test; negative/validation/auth only: happy path not exercised |
| `/api/datapilot/dq/rules` | GET | the rule list is an array; rule list and rule creation without a token are rejected | Covered | P1 | 2 tests |
| `/api/datapilot/dq/rules` | POST | creating a rule without its fields names the missing ones; KNOWN DEFECT: a rule with an unknown template is rejected with a 4xx (+1 more) | Covered | P1 | 3 tests; negative/validation/auth only: happy path not exercised |
| `/api/datapilot/dq/rules/<int:rule_id>` | DELETE | deleting an unknown rule is a 404 | Covered | P1 | 1 test; negative/validation/auth only: happy path not exercised |
| `/api/datapilot/dq/runs/<int:query_log_id>` | GET | the runs of an unknown query are an empty list | Covered | P1 | 1 test; negative/validation/auth only: happy path not exercised |
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
| `/api/datapilot/cancel/<int:query_log_id>` | POST | cancelling an already-completed query is refused; cancelling an unknown query reports that nothing was cancelled (+1 more) | Covered | P0 | 3 tests |
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
| `/metrics` | GET | — | Not Required | P2 | infrastructure probe |
| `/ready` | GET | — | Not Required | P2 | infrastructure probe |
| `/api/jobs` | GET | anonymous GET /api/jobs is rejected; the job list has a pagination envelope and well-formed jobs | Covered | P1 | 2 tests |
| `/api/jobs/<string:job_id>` | GET | jobs health reports a running, healthy executor; get an unknown job is a 404 (+1 more) | Covered | P1 | 3 tests |
| `/api/jobs/<string:job_id>/cancel` | POST | cancel an unknown job is a 404 | Covered | P1 | 1 test; negative/validation/auth only: happy path not exercised |
| `/api/jobs/<string:job_id>/details` | GET | details of an unknown job is a 404 | Covered | P1 | 1 test; negative/validation/auth only: happy path not exercised |
| `/api/jobs/<string:job_id>/logs` | GET | KNOWN DEFECT: the logs of an unknown job are a 404 | Covered | P1 | 1 test; negative/validation/auth only: happy path not exercised |
| `/api/jobs/<string:job_id>/tasks` | GET | KNOWN DEFECT: the tasks of an unknown job are a 404 | Covered | P1 | 1 test; negative/validation/auth only: happy path not exercised |
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
| `/api/connections/<int:connection_id>/knowledge-graph` | GET | KNOWN DEFECT: anonymous GET /api/connections/9/knowledge-graph requires a token; a connection without a knowledge graph reports none configured | Covered | P1 | 2 tests; negative/validation/auth only: happy path not exercised |
| `/api/connections/<int:connection_id>/knowledge-graph/nodes` | GET | the nodes of a missing knowledge graph are a 404 | Covered | P1 | 1 test |
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
| `/api/mcp-servers` | POST | creating a server with a missing name is rejected; creating a server with a missing transport is rejected (+5 more) | Covered | P1 | 7 tests |
| `/api/mcp-servers/<int:server_id>` | DELETE | delete an unknown server is a 404 | Covered | P1 | 1 test; negative/validation/auth only: happy path not exercised |
| `/api/mcp-servers/<int:server_id>` | GET | the tool list count matches the tools returned; the registry has well-formed entries and a matching count (+1 more) | Covered | P1 | 3 tests |
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
| `/datapilot/api/navigator/connections/<connection_name>/connect` | POST | — | Blocked | P1 | starts METADATA_FETCH jobs or changes navigator metadata/config |
| `/datapilot/api/navigator/connections/<connection_name>/schemas/<schema_name>/cache/clear` | POST | — | Blocked | P1 | starts METADATA_FETCH jobs or changes navigator metadata/config |
| `/datapilot/api/navigator/connections/<connection_name>/schemas/<schema_name>/tables/<table_name>/cache/clear` | POST | — | Blocked | P1 | starts METADATA_FETCH jobs or changes navigator metadata/config |
| `/datapilot/api/navigator/connections/<int:conn_id>` | PUT | — | Blocked | P1 | starts METADATA_FETCH jobs or changes navigator metadata/config |
| `/datapilot/api/navigator/search` | POST | — | Blocked | P1 | starts METADATA_FETCH jobs or changes navigator metadata/config |
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
| `/api/semantic/<int:model_id>` | GET | the dashboard has numeric statistics and a list of recent imports; listing physical databases returns an array (+3 more) | Covered | P1 | 5 tests |
| `/api/semantic/<int:model_id>/tables` | GET | list the tables of a model with an unknown id is a 404 | Covered | P1 | 1 test; negative/validation/auth only: happy path not exercised |
| `/api/semantic/by-connection/<int:connection_id>` | GET | listing models of a connection returns an array | Covered | P1 | 1 test |
| `/api/semantic/dashboard` | GET | the dashboard has numeric statistics and a list of recent imports; KNOWN DEFECT: anonymous GET /api/semantic/dashboard requires a token | Covered | P1 | 2 tests |
| `/api/semantic/physical-databases` | GET | listing physical databases returns an array; KNOWN DEFECT: anonymous GET /api/semantic/physical-databases requires a token | Covered | P1 | 2 tests |
| `/api/semantic/physical-databases/<db_id>` | GET | KNOWN DEFECT: a malformed physical-database id is a 4xx and does not leak database internals | Covered | P1 | 1 test; negative/validation/auth only: happy path not exercised |
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
| `/api/semantic/canonical/entities/<entity_id>/suggested-joins` | GET | — | Missing | P1 | read-only; safe to add |
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
| `/api/semantic/wizard/schemas` | POST | — | Missing | P1 | write path: needs a throw-away object with cleanup |
| `/api/semantic/wizard/tables` | POST | — | Missing | P1 | write path: needs a throw-away object with cleanup |
| `/api/semantic/canonical/bulk/approve` | POST | — | Blocked | P1 | starts jobs / LLM / bulk-mutates the shared semantic catalog |
| `/api/semantic/canonical/bulk/delete` | POST | — | Blocked | P1 | starts jobs / LLM / bulk-mutates the shared semantic catalog |
| `/api/semantic/canonical/bulk/reject` | POST | — | Blocked | P1 | starts jobs / LLM / bulk-mutates the shared semantic catalog |
| `/api/semantic/canonical/entities/<entity_id>/generate-aliases` | POST | — | Blocked | P1 | starts jobs / LLM / bulk-mutates the shared semantic catalog |
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
| `/api/trino/catalog-configs` | GET | KNOWN DEFECT: anonymous GET /api/trino/catalog-configs requires a token; KNOWN DEFECT: catalog-configs do not expose connector credentials | Covered | P0 | 2 tests |
| `/api/trino/catalogs` | GET | KNOWN DEFECT: anonymous GET /api/trino/catalogs requires a token; should return Trino catalogs | Covered | P1 | 2 tests |
| `/api/trino/catalogs/<catalog>/schemas` | GET | KNOWN DEFECT: an invalid catalog name is a 4xx, not a 500 with a Trino error | Covered | P1 | 1 test; negative/validation/auth only: happy path not exercised |
| `/api/trino/config` | GET | KNOWN DEFECT: anonymous GET /api/trino/config requires a token; config exposes host, port and default catalog but no password | Covered | P1 | 2 tests |
| `/api/trino/functions` | GET | KNOWN DEFECT: anonymous GET /api/trino/functions requires a token; should return the function catalog | Covered | P1 | 2 tests |
| `/api/trino/info` | GET | KNOWN DEFECT: anonymous GET /api/trino/info requires a token | Covered | P1 | 1 test; negative/validation/auth only: happy path not exercised |
| `/api/trino/queries` | GET | KNOWN DEFECT: anonymous GET /api/trino/queries requires a token; query history returns success and a list | Covered | P1 | 2 tests |
| `/api/trino/query` | POST | KNOWN DEFECT: anonymous POST /api/trino/query requires a token; query returns the computed row (+1 more) | Covered | P0 | 3 tests |
| `/api/trino/query/explain` | POST | explain without sql is rejected | Covered | P1 | 1 test; negative/validation/auth only: happy path not exercised |
| `/api/trino/status` | GET | KNOWN DEFECT: anonymous GET /api/trino/status requires a token; status shows Trino is reachable | Covered | P1 | 2 tests |
| `/api/trino/supported-connectors` | GET | should return the supported connectors | Covered | P1 | 1 test |
| `/api/trino/validate-connection` | POST | KNOWN DEFECT: anonymous POST /api/trino/validate-connection requires a token; validate-connection reports every missing parameter | Covered | P1 | 2 tests; negative/validation/auth only: happy path not exercised |
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
| `/api/weave/flows` | POST | — | Blocked | P1 | creates, runs or alters a flow (run/preview execute it) |
| `/api/weave/flows/<int:flow_id>` | DELETE | — | Blocked | P1 | creates, runs or alters a flow (run/preview execute it) |
| `/api/weave/flows/<int:flow_id>` | PUT | — | Blocked | P1 | creates, runs or alters a flow (run/preview execute it) |
| `/api/weave/flows/<int:flow_id>/preview` | POST | — | Blocked | P1 | creates, runs or alters a flow (run/preview execute it) |
| `/api/weave/flows/<int:flow_id>/run` | POST | — | Blocked | P1 | creates, runs or alters a flow (run/preview execute it) |
