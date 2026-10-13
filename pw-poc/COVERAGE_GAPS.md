# Remaining API coverage gaps (Playwright suite)

Measured 2026-10-07. Denominator: 432 route+method combinations in the 35 backend files reachable through the gateway;
**171 (40%) are exercised** (see `COVERAGE_MAP.md` for every route). The gaps below are APIs the Playwright suite does not test yet.
Priorities are by risk, not by route count.

## P0: critical authentication / security / core functionality
| Gap | Why P0 | Status |
|---|---|---|
| Role-based authorization (non-admin gets 403) | the access-control contract; only admin and anonymous are verified | **BLOCKED**: needs non-admin credentials. 7 tests written, skipped until `DIA_VIEWER_*` is set |
| Authorization positive/write paths (grants, policies, classifications, access-request approve/deny, trino-rules, role switches; 17 routes) | the permission engine itself | needs approval + a safe throw-away isolation plan (these change shared permission posture) |
| The 27 known defects (2 critical: anonymous Trino API and plaintext key reveal) | security regressions must flip red when fixed | **covered** by 65 `test.fail` tests |

## P1: important functional APIs and lifecycles
| Gap | Uncovered routes | Notes |
|---|---:|---|
| Navigator `/datapilot/api/navigator/*` (schema/table/column browsing, search, cache) | 33 | exposed (200). The 23 GETs are read-only and safe; POST connect/async/cache-clear start `METADATA_FETCH` jobs: need care |
| Semantic models (CRUD, canonical entities/columns/relationships, imports, logical references, PII recognizers, wizard) | 76 | many reads return 200 with empty data; writes need throw-away models |
| Repo: saved queries (`/api/repo/queries`), models, LLM execution logs | 24 | reads are safe; provider discover/health-check would call a provider |
| Knowledge graph writes, DQ rule CRUD/evaluate, prompt versions, jobs create/pause/retry | 12 + 11 + 11 + 10 | lifecycle tests with throw-away data; jobs/KG start real work |
| Trino remaining reads (`cluster`, query by id) and Weave flows reads | 8 + 7 | read-only, safe |
| MCP create/connect lifecycle | 7 | needs a harmless HTTP/SSE endpoint to register |

## P2: low value / rarely used / destructive
Trino catalog-config CRUD and `/restart`; `cache-manager/delete-all-cache`; chat attachments/search; `/metrics`, `/ready`; prompts/few-shots `/new` form endpoints; Weave writes.

## Blocked: required credentials, data or configuration is missing
Non-admin account (above); PostgreSQL connection `test` (localhost:5432 unreachable); successful file upload (writes a permanent file, no delete API); real LLM calls, agent chat/delegate (need a running model); KG build/semantic import (need an LLM/source metadata).

## Not exposed in this environment, verified
`/api/navigator/*` answers 405 **correctly**: it is mounted at `/datapilot/api/navigator/*`. WebSocket endpoints (`/ws`, DataPilot streaming, chat messages) are not request/response HTTP. OAuth/SSO needs an identity provider. Result-cache paging/profile and DQ evaluation return "Cache not ready" because `/health` reports the result cache degraded (`DORIS_DISABLED`).

## Infrastructure-only: deliberately not tested
Docker services `/api/services/*` (container start/stop/restart). Note they currently return HTTP 500 ("No module named 'app.services.docker_service'"): worth reporting to the DIA team, not worth automating.
