# Remaining API coverage gaps (Playwright suite)

Revised 2026-10-14 (previous version 2026-10-07). Denominator: **594** route+method combinations read statically from the QA backend source `/home/dia-qa/backend/app` (529 Quart + 65 FastAPI v2); see `COVERAGE_MAP.md` for every route and `endpoint-inventory.json` for the machine-readable list.
**160 (26.9%) are Covered**, 10 are *Defect-only* (reached only by expected-failure tests, so not counted), 239 are Missing, 170 are Blocked and 15 are Not Required.
That the QA tree is what serves `:8081` is suggested by the QA compose file but **not verified at runtime**; this is not a claim of verified runtime availability. Routes found only in `/home/dia/backend` (16) are listed separately in the map and are not counted.
Priorities are by risk, not by route count.

## P0: critical authentication / security / core functionality
| Gap | Routes | Status |
|---|---:|---|
| Role-based authorization (non-admin gets 403) | 7 tests | **BLOCKED**: needs non-admin credentials. 7 tests written, skipped until `DIA_VIEWER_USERNAME`/`DIA_VIEWER_PASSWORD` are set |
| Authorization read endpoints (`/api/authz/*` GETs), Trino `GET /catalog-configs/<name>`, auth admin reads (providers, roles) | 12 Missing | read-only; safe to add |
| Authorization writes (grants, policies, classifications, access-request approve/deny, role switches) and auth admin writes (providers, roles, integrations) | 20 Blocked | change the shared permission/authentication posture: need explicit approval and a disposable connection, user and role |
| Routes reached only by KNOWN DEFECT tests (`/api/trino/catalog-configs`, `/api/repo/admin-stats`, `/api/logs/*`, ...) | 10 Defect-only | the defects themselves are covered by 65 `test.fail` tests (2 critical: anonymous Trino API and plaintext key reveal); an authenticated happy-path test is still missing |

## P1: important functional APIs and lifecycles
| Gap | Missing | Blocked | Notes |
|---|---:|---:|---|
| Semantic models (`/api/semantic/*`) | 61 | 15 | 26 reads are safe; writes need throw-away models; `suggested-joins` needs an LLM (reclassified Blocked) |
| Navigator (`/datapilot/api/navigator/*`) | 25 | 8 | GETs are read-only but a cache miss can start a `METADATA_FETCH` job (check jobs after the run); `POST /search` is cache-only |
| Repo: saved queries, models, LLM execution/analytics logs, generic `<model>` reads | 20 | 7 | reads are safe; provider discover/health-check would call a provider (Blocked) |
| Data quality | 11 | 0 | 6 reads, 5 writes with throw-away data |
| Prompt versions | 9 | 0 | 2 reads, 7 writes with throw-away data |
| Trino remaining reads | 8 | 8 | read-only; catalog-config CRUD, `/restart`, query cancel are Blocked |
| Weave flows | 10 | 2 | 7 reads, throw-away flow create/update/delete; run and preview are Blocked (they execute a flow) |
| Knowledge graph | 3 | 9 | reads only; build/enable/feedback need an LLM or have no delete API |
| Conversations / messages | 12 | 0 | DB-backed, testable with throw-away data |
| FastAPI v2 (dashboard, logs, prompts, health/docs, faceted-search reads) | 36 | 29 | faceted-search writes need the external search engine |
| Jobs, MCP, agents | 2 | 20 | start real work / spawn processes / need an LLM |
| Chat (`/chat/*`) | 1 | 5 | `GET /chat/search` is a read-only gap; attachments (GET P1, DELETE P2), `POST /history/clear`, `POST /prompts` and `POST /upload` are Blocked because they write files or shared chat configuration |

## P2: low value / rarely used / destructive
Remaining P2 reads (`/metrics`, `/ready`, `logs/tail`, `export-cache-list`, ONNX status, voice GETs), implied-relationships settings, SQL-context cache delete, few-shots import; `cache-manager/delete-all-cache`; chat attachment delete, history clear, prompts POST and upload. Weave run/preview are P1 Blocked (see the P1 table). Trino catalog-config CRUD, `/restart` and query cancel are **P1 Blocked** (8 routes), not P2.

**Connector OAuth** (`/auth/api/atlassian*`, `sharepoint*`, `github-mcp*`, `database*`, all P2): 10 caller-scoped, read-only GETs verified from source are **Missing** (`atlassian-mcp/status`, `atlassian/status`, `atlassian/connector`, `atlassian/index/documents`, `github-mcp/status`, `sharepoint-mcp/status`, `sharepoint/connector`, `sharepoint/index/documents`, `database/connector`, `database/tools`). 25 stay **Blocked**: OAuth `connect`/`callback`, `disconnect`, `sync`/`ask`, live `search`, the three `*-mcp/tools` GETs, the two index DELETEs and the three connector settings PUTs. Uncertain and therefore not reclassified: the `*-mcp/tools` GETs (they may return an empty list without any external call for a user with no stored token), the index DELETEs and the settings PUTs (local data changes that could be tested with an approved disposable user).

## Blocked: required credentials, data, services or approval are missing
Every blocked route is listed in the **BLOCKED endpoints** section of `COVERAGE_MAP.md` with its exact method, route, reason and what is needed to unblock it. Blocked routes are not counted as covered. Main causes: non-admin credentials; shared-state mutation needing approval (authorization, Trino config, worker pool); a running LLM; spawning processes (MCP); external services (connector OAuth, identity providers); the WebSocket protocol (`APIRequestContext` cannot drive it); the PostgreSQL connection `test` (localhost:5432 unreachable); successful file upload (writes a permanent file, no delete API).

## Not exposed in this environment, verified
`/api/navigator/*` answers 405 **correctly**: it is mounted at `/datapilot/api/navigator/*`. WebSocket endpoints (`/ws`, DataPilot streaming, chat messages) are not request/response HTTP. OAuth/SSO needs an identity provider. Result-cache paging/profile and DQ evaluation return "Cache not ready" because `/health` reports the result cache degraded (`DORIS_DISABLED`).

## Infrastructure-only: deliberately not tested
Docker services `/api/services/*` (container start/stop/restart). Note they currently return HTTP 500 ("No module named 'app.services.docker_service'", and the module is absent from both source trees): worth reporting to the DIA team, not worth automating.

## Not counted: routes found only in `/home/dia/backend`
16 routes (`/api/export/*`, variable sets, `/api/logs/sql-gate-fallbacks`) exist in the dev tree and not in `/home/dia-qa`. They are listed in the UNVERIFIED section of `COVERAGE_MAP.md` and are added to the inventory only once the QA environment is confirmed to include them.
