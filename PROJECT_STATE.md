# ATC-WEB Project State

Last source verification: 2026-10-14 (v1.17.0). A concise living handoff of the current state, not a
history log; Git history and tags hold the past.

## Purpose and update rules

Read this file before changing any repository, then verify the facts you rely on in source. It does
not replace source, tests, OpenAPI, installation manifests or tags.

- Update it when a release or product phase closes: verified HEADs, material decisions, debt.
- Remove debt only when its resolution is implemented and validated.
- If this document conflicts with repository source, source wins and this file is corrected.
- Keep it short: current state only, no copied registries, secrets, local paths or transcripts.

## Workspace topology

The workspace root is local-only and is not a Git repository. It holds 15 independent repositories,
all named `atc-<name>`: 13 independently deployable HTTP services (atc-notify delivers email only; outbound webhooks are atc-webhook-out), `atc-service-core` (shared runtime
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
| atc-audit | HTTP service: append-only audit log | `fc5bdbd5a9e504ef027a3d8c7e6e55aa4617c661` | `v1.17.0` → `fc5bdbd5a9e504ef027a3d8c7e6e55aa4617c661` | HEAD at release |
| atc-auth | HTTP service: identity and tokens | `2bad3b6a061a916a3fc90b042c869ef387d6c7b4` | `v1.17.0` → `2bad3b6a061a916a3fc90b042c869ef387d6c7b4` | HEAD at release |
| atc-console | HTTP service: administration UI/API | `91fc5eeafaee729ceb926e2251e4260a5a22932c` | `v1.17.0` → `91fc5eeafaee729ceb926e2251e4260a5a22932c` | SvelteKit 3; sidebar drawer below 900 px |
| atc-flags | HTTP service: feature flags/settings | `32431058ebb9cfa56f60941c4a83c68be0d11d5e` | `v1.17.0` → `32431058ebb9cfa56f60941c4a83c68be0d11d5e` | HEAD at release |
| atc-gateway | HTTP service: public edge | `987eff125cc74a8da950ba79b2d3620703e19fcd` | `v1.17.0` → `987eff125cc74a8da950ba79b2d3620703e19fcd` | HEAD at release |
| atc-geo | HTTP service: geolocation/reference data | `12d203be50ea4e088845ecf80f88ef318b5fb0ac` | `v1.17.0` → `12d203be50ea4e088845ecf80f88ef318b5fb0ac` | HEAD at release |
| atc-media | HTTP service: uploads and delivery | `cc3df85459467509589d1d4ce404b2ddec29a0f6` | `v1.17.0` → `cc3df85459467509589d1d4ce404b2ddec29a0f6` | HEAD at release |
| atc-notify | HTTP service: queued notifications | `fc06ab037acea1453ef600e8479d32b0a909a9f3` | `v1.17.0` → `fc06ab037acea1453ef600e8479d32b0a909a9f3` | Email only |
| atc-ratelimit | HTTP service: policies and quotas | `03293950ee3380790745f9b1f42ff5d1b57d4165` | `v1.17.0` → `03293950ee3380790745f9b1f42ff5d1b57d4165` | HEAD at release |
| atc-scheduler | HTTP service: scheduled HTTP jobs | `b2f756235e90dafeea9079c7b3d365efa102a427` | `v1.17.0` → `b2f756235e90dafeea9079c7b3d365efa102a427` | HEAD at release |
| atc-search | HTTP service: SQLite FTS search | `60b18075a7db58a97e36426976dc7d16a72597e5` | `v1.17.0` → `60b18075a7db58a97e36426976dc7d16a72597e5` | HEAD at release |
| atc-service-core | Shared runtime package | `a572861846b3a8c24d7a98c05b541699daf95948` | `v1.17.0` → `a572861846b3a8c24d7a98c05b541699daf95948` | HEAD at release |
| atc-shortlink | HTTP service: short links and QR | `0e015bc35a536e8c3fec01acfb5fb4f5973bcf3b` | `v1.17.0` → `0e015bc35a536e8c3fec01acfb5fb4f5973bcf3b` | HEAD at release |
| atc-stack | Installer/orchestrator/release management | `f6d9ada87425359fe9c07053ad090f687ea9406c` | `v1.17.0` → `f6d9ada87425359fe9c07053ad090f687ea9406c` | v1.17.0 published and verified |
| atc-webhook-out | HTTP service: durable outbound webhooks | `1f1281596feba2a835ead446056c21b75839b386` | `v1.17.0` → `1f1281596feba2a835ead446056c21b75839b386` | HEAD at release |

## Current release

- Supported release: all 15 repositories at `v1.17.0`.
- `atc-stack` `v1.17.0` peels to `f6d9ada87425359fe9c07053ad090f687ea9406c`; `atc-service-core`
  `v1.17.0` peels to `a572861846b3a8c24d7a98c05b541699daf95948`.
- `installation-manifests/supported.json` selects the install matrix; `releases/` holds the current
  release notes and verification evidence. Tags are never moved.

## Current suite contract

- 13 canonical `openapi.yaml` files, all OpenAPI 3.1.0. Console: 122 paths, 156 operations. Suite:
  376 operations.
- Generated TypeScript clients: 13/13, 376/376 operations, no regeneration drift.
- MCP: 376-operation candidate catalog, 10 explicitly exposed tools, STDIO transport only.

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

1. Verify all 15 repositories: branch, remote, HEAD, clean tree.
2. Update the repository table, the current release and the contract counts from source.
3. Record decisions and debt; remove debt only with validated evidence.
4. Validate affected repositories locally, inspect the diff, then commit focused changes.
