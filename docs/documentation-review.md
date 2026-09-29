# Documentation review baseline — 2026-09-28

Scope: all repository-authored Markdown, manifests/configuration, and application source present before the Clean Architecture change. Generated/vendor documentation was used only for framework verification. There were no commits and the existing application/docs were untracked when reviewed, so this is a historical working-tree baseline, not a commit-tagged release audit. The [backend architecture](architecture/WHITEPLATE_BACKEND_ARCHITECTURE.md) and [development guide](development.md) describe the current API solution.

## Documentation issues corrected

| Finding | Correction |
| --- | --- |
| README described a finished platform, .NET 8, a nonexistent backend path, and nonexistent Compose setup | Replaced with actual .NET 10/frontend scaffold status and runnable project paths |
| System architecture said the API directory was empty | Documented the controller project, weather route, OpenAPI, launch profiles, and API Dockerfile |
| Technology stack claimed configured database, CI, containers, and tests | Separated integrated dependencies, installed-but-unused libraries, and proposals |
| Frontend template README encouraged regenerating an existing button | Added package-specific commands and source/navigation guidance |
| Frontend architecture omitted locale-cookie precedence and mixed repository documentation languages | Clarified request lifecycle, matcher, client boundary, theme behavior, and English reference documentation |
| API guide presented future routes/header trust as implemented, and every success as `200` with a data envelope | Documented actual array response and marked business contracts as proposals; clarified authorization, `201` creation, `409` conflicts, validation and open DTO decisions |
| Database diagram was unclosed and omitted category/item definitions | Completed the diagram and added tenant-aware relationships, historical snapshots, constraints, lifecycle and migration considerations |
| Query filters were described as a guarantee against all tenant leaks | Added read/write ownership, foreign-key, cache, job, and real-time isolation requirements |
| Coding standards assumed MediatR/EF layers and Tailwind 3 configuration | Adapted guidance to the scaffold, Tailwind 4, Server Components and optional future architecture |
| Test plan treated nonexistent journeys as executable and confused API `401` with a browser redirect | Split present smoke checks from future acceptance scenarios and aligned proposed response semantics |
| No repository-wide development handoff | Added documentation index, development guide, root agent rules, API README, security boundaries, and roadmap/decision register |

The existing frontend `AGENTS.md` framework instructions were reviewed and preserved. Its installed Next.js guides confirmed the engine requirement and `proxy.ts` convention. The API error proposal references [RFC 9457](https://www.rfc-editor.org/rfc/rfc9457); the isolation clarification references [EF Core query filters](https://learn.microsoft.com/en-us/ef/core/querying/filters).

## Verification performed

Environment: Windows, Node 24.19.0, .NET SDK 10.0.401. npm was unavailable on the agent shell PATH; frontend checks used the already-installed local CLI entry points. Fresh `npm ci` and network restores were not tested.

| Check | Result |
| --- | --- |
| Earlier API scaffold build, before the host-folder rename | Passed, zero warnings/errors; use the current solution commands in the development guide |
| `node node_modules/typescript/bin/tsc --noEmit` from frontend | Passed |
| `node node_modules/eslint/bin/eslint.js .` from frontend | Failed in React plugin: `contextOrFilename.getFilename is not a function` with ESLint 10.11.0 |
| `node node_modules/next/dist/bin/next build` from frontend | Failed spawning a Node worker with Windows access-denied error 5; same result on an outside-sandbox retry |
| API HTTP profile startup and requests | Initial restricted run hit Windows Event Log access errors; outside-sandbox rerun succeeded |
| `GET /WeatherForecast` | Passed: five items with expected camelCase fields |
| `GET /openapi/v1.json` in Development | Passed: OpenAPI 3.1.1 document contains `/WeatherForecast` |
| `GET /api/v1/menu` | Returned expected `404` for an unimplemented route |
| Documentation structure | Checked all 17 Markdown files: 82 relative links resolve, 19 code fences are balanced, and all 4 JSON examples parse |

The 2 Mermaid blocks were checked for closed fences and diagram declarations, but not rendered. Browser interactions, Production-only OpenAPI behavior, HTTPS certificate setup, Docker builds, clean installs, and future business scenarios were not executed. No application source or dependency versions were changed during this documentation review.

## Remaining engineering issues

| Priority | Issue | Next action |
| --- | --- | --- |
| High | Frontend lint command fails inside installed tooling | Select compatible ESLint/React plugin/Next config versions, update lockfile deliberately, and rerun lint |
| High | Frontend production build is unverified due to worker-spawn access failure | Reproduce in a supported complete Node environment; inspect executable permissions/runtime restrictions before changing application CSS |
| Medium | No pinned runtime/package-manager policy and npm absent from review shell | Choose toolchain policy and verify setup on a clean checkout |
| Resolved for backend | No root/backend ignore policy | Root `.gitignore` now excludes .NET build output and IDE user state |
| Partly resolved | No test harness or CI | Backend xUnit suite now covers the sample and dependency direction; business coverage and CI remain future work |
| Planned | Product/security/storage decisions unresolved | Resolve dependent entries in the roadmap before claiming working restaurant functionality |

These findings capture the earlier review. The [development guide](development.md) records current commands, and the [roadmap](development-roadmap.md) records remaining decisions without silently choosing product requirements.
