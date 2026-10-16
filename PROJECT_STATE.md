# ATC-WEB Project State

Last source verification: 2026-10-16 (v1.31.0). A concise living handoff of the current state, not a
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
| atc-audit | HTTP service: append-only audit log | `87310737e59bf81824145d408db14011b8371c42` | `v1.31.0` → `87310737e59bf81824145d408db14011b8371c42` | HEAD at release |
| atc-auth | HTTP service: identity and tokens | `2ec18c6e8b6d44d6a6454b6833910f16c3949ca2` | `v1.31.0` → `2ec18c6e8b6d44d6a6454b6833910f16c3949ca2` | HEAD at release |
| atc-console | HTTP service: administration UI/API | `3a871393fce5c3d844cd442b35223a34235e5707` | `v1.31.0` → `3a871393fce5c3d844cd442b35223a34235e5707` | SvelteKit 3; sidebar drawer below 900 px |
| atc-flags | HTTP service: feature flags/settings | `fdc7de268f6a74a643ac7248487e2edb69e27544` | `v1.31.0` → `fdc7de268f6a74a643ac7248487e2edb69e27544` | HEAD at release |
| atc-gateway | HTTP service: public edge | `2d4f33bba1370c95482804430ffc484f13e18d6c` | `v1.31.0` → `2d4f33bba1370c95482804430ffc484f13e18d6c` | HEAD at release |
| atc-geo | HTTP service: geolocation/reference data | `bf3fdf35a24ccc95f306a6418d693a9fcf30636b` | `v1.31.0` → `bf3fdf35a24ccc95f306a6418d693a9fcf30636b` | HEAD at release |
| atc-media | HTTP service: uploads and delivery | `2a72f42f175d194cbe53a410b3c95cb3a9e79aa6` | `v1.31.0` → `2a72f42f175d194cbe53a410b3c95cb3a9e79aa6` | HEAD at release |
| atc-notify | HTTP service: queued notifications | `93d146abccde738728e4ff45edaf64ad96370626` | `v1.31.0` → `93d146abccde738728e4ff45edaf64ad96370626` | Email only |
| atc-ratelimit | HTTP service: policies and quotas | `6cd870b63dde02a670f0c22ec0250295e130cd80` | `v1.31.0` → `6cd870b63dde02a670f0c22ec0250295e130cd80` | HEAD at release |
| atc-scheduler | HTTP service: scheduled HTTP jobs | `793d5e26ca520f9258b463b6651cfe9f92569759` | `v1.31.0` → `793d5e26ca520f9258b463b6651cfe9f92569759` | HEAD at release |
| atc-search | HTTP service: SQLite FTS search | `7d8da79da60235f4d1990983d5d32f3df23612e5` | `v1.31.0` → `7d8da79da60235f4d1990983d5d32f3df23612e5` | HEAD at release |
| atc-service-core | Shared runtime package | `b01c4640721bfd505914594677799414fcff99ed` | `v1.31.0` → `b01c4640721bfd505914594677799414fcff99ed` | HEAD at release |
| atc-shortlink | HTTP service: short links and QR | `3adf88557bf62dd0ab4e72435fbfb4bc3764d275` | `v1.31.0` → `3adf88557bf62dd0ab4e72435fbfb4bc3764d275` | HEAD at release |
| atc-stack | Installer/orchestrator/release management | `bc6d07281cb28d3a1bf2e07f5f92cc0191dbf37e` | `v1.31.0` → `bc6d07281cb28d3a1bf2e07f5f92cc0191dbf37e` | v1.31.0 published and verified |
| atc-webhook-out | HTTP service: durable outbound webhooks | `fc33a507e327cc21d24568bd38356bdbaf3f5e1f` | `v1.31.0` → `fc33a507e327cc21d24568bd38356bdbaf3f5e1f` | HEAD at release |

## Current release

- Supported release: all 22 repositories at `v1.31.0`.
- `atc-stack` `v1.31.0` peels to `bc6d07281cb28d3a1bf2e07f5f92cc0191dbf37e`; `atc-service-core`
  `v1.31.0` peels to `b01c4640721bfd505914594677799414fcff99ed`.
- `installation-manifests/supported.json` selects the install matrix; `releases/` holds the current
  release notes and verification evidence. Tags are never moved.

## Current suite contract

- 20 canonical `openapi.yaml` files, all OpenAPI 3.1.0. Console: 206 paths, 261 operations. Suite:
  658 operations (repositories added on `main` after the supported release enter the next release manifest).
- Generated TypeScript clients: 20/20, 658/658 operations, no regeneration drift.
- MCP: 658 operations classified, 168 tools (reads everywhere plus safe writes; nothing destructive; atc-auth read-only), STDIO transport only.

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
