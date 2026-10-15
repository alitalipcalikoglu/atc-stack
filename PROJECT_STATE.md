# ATC-WEB Project State

Last source verification: 2026-10-15 (v1.27.0). A concise living handoff of the current state, not a
history log; Git history and tags hold the past.

## Purpose and update rules

Read this file before changing any repository, then verify the facts you rely on in source. It does
not replace source, tests, OpenAPI, installation manifests or tags.

- Update it when a release or product phase closes: verified HEADs, material decisions, debt.
- Remove debt only when its resolution is implemented and validated.
- If this document conflicts with repository source, source wins and this file is corrected.
- Keep it short: current state only, no copied registries, secrets, local paths or transcripts.

## Workspace topology

The workspace root is local-only and is not a Git repository. It holds 22 independent repositories,
all named `atc-<name>`: 20 independently deployable HTTP services (atc-notify delivers email only; outbound webhooks are atc-webhook-out), `atc-service-core` (shared runtime
package) and `atc-stack` (installer, orchestrator and release management). Every repository,
folder, package (`@atc-web/atc-<name>`), service id, PM2 name, operationId prefix and audit action
prefix uses the `atc-` name. Environment variable names, database file names, error codes, metric
names, gateway public routes and Console browser-storage keys use plain names.

## Source-of-truth hierarchy

1. Repository source, configuration and tests.
2. Each HTTP service's canonical root `openapi.yaml`.
3. `atc-stack/installation-manifests/`: the supported release pointer and its manifest.
4. Annotated Git tags and their peeled commits.
5. This summary.

No production runtime may derive a second OpenAPI source of truth or depend on a hand-maintained
route registry.

## Current repository state

All rows were clean, on `main`, synchronized with `origin/main` (0 ahead/0 behind) at verification.
The release column is immutable; development HEAD may advance. Stack's listed HEAD is the clean
baseline immediately before the commit that updates this file, so the commit containing the newest
state update is necessarily newer.

| Repository | Role | Verified development HEAD | Immutable current release | State / note |
|---|---|---|---|---|
| atc-audit | HTTP service: append-only audit log | `d3eb14de4e9b7a7213eab4160fc8a79744cc05ef` | `v1.27.0` → `d3eb14de4e9b7a7213eab4160fc8a79744cc05ef` | HEAD at release |
| atc-auth | HTTP service: identity and tokens | `f3f4e68ac9b126021201506375d9d78f7086c14a` | `v1.27.0` → `f3f4e68ac9b126021201506375d9d78f7086c14a` | HEAD at release |
| atc-console | HTTP service: administration UI/API | `7ce731a10675aa90f7d59692d557d09ef38073e1` | `v1.27.0` → `7ce731a10675aa90f7d59692d557d09ef38073e1` | SvelteKit 3; sidebar drawer below 900 px |
| atc-flags | HTTP service: feature flags/settings | `6aa626e252993a7e94db278b4751e91233eda38f` | `v1.27.0` → `6aa626e252993a7e94db278b4751e91233eda38f` | HEAD at release |
| atc-gateway | HTTP service: public edge | `f6b4dd64eaa1148a3d2a6386fea27b10133461ff` | `v1.27.0` → `f6b4dd64eaa1148a3d2a6386fea27b10133461ff` | HEAD at release |
| atc-geo | HTTP service: geolocation/reference data | `9ac4ab808223c2d868715ac6278b007220457112` | `v1.27.0` → `9ac4ab808223c2d868715ac6278b007220457112` | HEAD at release |
| atc-media | HTTP service: uploads and delivery | `219e9090d3e721b29789f14f8a760477eea0149f` | `v1.27.0` → `219e9090d3e721b29789f14f8a760477eea0149f` | HEAD at release |
| atc-notify | HTTP service: queued notifications | `2641aadd11ebdb7e6e7999cdb6b88f1f7a3c1bec` | `v1.27.0` → `2641aadd11ebdb7e6e7999cdb6b88f1f7a3c1bec` | Email only |
| atc-ratelimit | HTTP service: policies and quotas | `2a2021c2e2a5a1230e05db78a90d91c3878c2e5f` | `v1.27.0` → `2a2021c2e2a5a1230e05db78a90d91c3878c2e5f` | HEAD at release |
| atc-scheduler | HTTP service: scheduled HTTP jobs | `f9738b715fd0797f37e2e993706d54e55f6ebde4` | `v1.27.0` → `f9738b715fd0797f37e2e993706d54e55f6ebde4` | HEAD at release |
| atc-search | HTTP service: SQLite FTS search | `b6e5f11c75a6823db7cb3684f5f746fec875424d` | `v1.27.0` → `b6e5f11c75a6823db7cb3684f5f746fec875424d` | HEAD at release |
| atc-service-core | Shared runtime package | `013e76e567d6b4674fbd7cc0fc3079d7a761e683` | `v1.27.0` → `013e76e567d6b4674fbd7cc0fc3079d7a761e683` | HEAD at release |
| atc-shortlink | HTTP service: short links and QR | `636baa69422fc00205cf71fb3de881fdb083a39a` | `v1.27.0` → `636baa69422fc00205cf71fb3de881fdb083a39a` | HEAD at release |
| atc-stack | Installer/orchestrator/release management | `6cff282f77dfb67b01935b2fdd30cdf7e889cbd8` | `v1.27.0` → `6cff282f77dfb67b01935b2fdd30cdf7e889cbd8` | v1.27.0 published and verified |
| atc-webhook-out | HTTP service: durable outbound webhooks | `54429ccbe394ac75a2263531e90f6d4cdb2f1b97` | `v1.27.0` → `54429ccbe394ac75a2263531e90f6d4cdb2f1b97` | HEAD at release |

## Current release

- Supported release: all 22 repositories at `v1.27.0`.
- `atc-stack` `v1.27.0` peels to `6cff282f77dfb67b01935b2fdd30cdf7e889cbd8`; `atc-service-core`
  `v1.27.0` peels to `013e76e567d6b4674fbd7cc0fc3079d7a761e683`.
- `installation-manifests/supported.json` selects the install matrix; `releases/` holds the current
  release notes and verification evidence. Tags are never moved.

## Current suite contract

- 20 canonical `openapi.yaml` files, all OpenAPI 3.1.0. Console: 184 paths, 236 operations. Suite:
  595 operations (repositories added on `main` after the supported release enter the next release manifest).
- Generated TypeScript clients: 20/20, 595/595 operations, no regeneration drift.
- MCP: 595 operations classified, 155 tools (reads everywhere plus safe writes; nothing destructive; atc-auth read-only), STDIO transport only.

Boundaries:

- Canonical OpenAPI is the API source of truth; tests may derive oracles, runtime code must not
  gain a duplicate contract registry.
- Service API keys stay server-side. Console sessions are opaque and server-side.
- Long-lived process-owned SQLite connections; no request-per-connection database access.
- No generic downstream proxy. Large upload, download and export paths stream.
- Authenticated APIs and session-aware HTML never enter a service-worker cache.

## Installer and release

The public workflow is `stack install:all`, `stack setup`, `stack dev`, `stack up`, `stack down`
and `stack status`. `install:all` installs the supported release; `--ref main` is the explicit
moving development selection. GitHub supplies source and tags. There is no CI; release validation
runs locally through `release:prepare`, `release:verify` and `release:publish` (README,
"Releasing"). Do not change the supported pointer, manifests or tags as a side effect of other work.

## Console architecture

One full-stack SvelteKit 3 application on adapter-node 6 (Node 22.17+): one Node process, one HTTP framework, one
filesystem router, SSR pages and filesystem API/operational endpoints. Root `server.mjs` wraps the
adapter handler with HTTP/HTTPS, IPC readiness and graceful shutdown. `src/hooks.server.ts` owns the
request, security and session lifecycle; the process-scoped runtime owns SQLite, maintenance,
clients, documentation and audit forwarding. All 156 API operations and 34 page patterns live in
`src/routes/`. The service worker caches only its own static assets and owns only its own
`atc-console-static-` caches; SvelteKit version polling is off. CSRF is the required
`X-Console-Request` header on every API mutation (login/TOTP: JSON only); SvelteKit's origin check
is disabled. Navigation is a left sidebar that becomes an off-canvas drawer below
900 px, with the signed-in user and sign-out at its bottom. Stack rebuilds the Console at every
`setup` and starts it through `server.mjs`.

Excluded by design: Fastify, a separate SPA or BFF, a custom router, `adapter-static`, a generic
downstream proxy, and extra controller/service/repository layering.

## Known debt

None open. Media byte ranges are forwarded (single range, 206/416), binary routes keep their
private cache lifetimes, and the lazy Swagger chunk is bounded at 400 KB brotli by the M7 smoke.

## Operational constraints

- No GitHub workflow files. Validation, tagging and release checks stay local.
- Preserve server-side credentials, opaque sessions, schema compatibility, streaming, graceful
  shutdown, native TLS/proxy semantics and PM2 readiness/shutdown contracts.
- Never create, move or delete tags without an explicit release.

## Next controlled stage

None. Future work is ordinary product maintenance.

## Update checklist

1. Verify all 22 repositories: branch, remote, HEAD, clean tree.
2. Update the repository table, the current release and the contract counts from source.
3. Record decisions and debt; remove debt only with validated evidence.
4. Validate affected repositories locally, inspect the diff, then commit focused changes.
