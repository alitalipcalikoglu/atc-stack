# ATC-WEB Project State

Last source verification: 2026-10-16 (v1.30.0). A concise living handoff of the current state, not a
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
| atc-audit | HTTP service: append-only audit log | `d38fd19448b617c12db03ab2c569c049151b2d0a` | `v1.30.0` → `d38fd19448b617c12db03ab2c569c049151b2d0a` | HEAD at release |
| atc-auth | HTTP service: identity and tokens | `e35134a386ad81ed4fbfbb3fa5240cfcb44cf063` | `v1.30.0` → `e35134a386ad81ed4fbfbb3fa5240cfcb44cf063` | HEAD at release |
| atc-console | HTTP service: administration UI/API | `328e881832ee6f34db8a5e1006a13c10a2be3c18` | `v1.30.0` → `328e881832ee6f34db8a5e1006a13c10a2be3c18` | SvelteKit 3; sidebar drawer below 900 px |
| atc-flags | HTTP service: feature flags/settings | `5ac39bf99a82dd91a1a9da2b0bf73ccf30fbff87` | `v1.30.0` → `5ac39bf99a82dd91a1a9da2b0bf73ccf30fbff87` | HEAD at release |
| atc-gateway | HTTP service: public edge | `193249b353a52f2c557e6e23bfedef16ddbb2bc3` | `v1.30.0` → `193249b353a52f2c557e6e23bfedef16ddbb2bc3` | HEAD at release |
| atc-geo | HTTP service: geolocation/reference data | `9efea2bb9a4860fb71c032a1e13effdce15ee281` | `v1.30.0` → `9efea2bb9a4860fb71c032a1e13effdce15ee281` | HEAD at release |
| atc-media | HTTP service: uploads and delivery | `493bef3702f44139c0cea2f057116929b2addc2d` | `v1.30.0` → `493bef3702f44139c0cea2f057116929b2addc2d` | HEAD at release |
| atc-notify | HTTP service: queued notifications | `7501ab5e4d5f8bbd381d8174e55368764a5a3ddb` | `v1.30.0` → `7501ab5e4d5f8bbd381d8174e55368764a5a3ddb` | Email only |
| atc-ratelimit | HTTP service: policies and quotas | `1c061b1554c599e7c492cad0e5b39afcca23e482` | `v1.30.0` → `1c061b1554c599e7c492cad0e5b39afcca23e482` | HEAD at release |
| atc-scheduler | HTTP service: scheduled HTTP jobs | `8576db4a26763042710c795a9a1fee1c8035d3dd` | `v1.30.0` → `8576db4a26763042710c795a9a1fee1c8035d3dd` | HEAD at release |
| atc-search | HTTP service: SQLite FTS search | `5cc10857e66e039b6b646dc0e4c35b9459b0ce8e` | `v1.30.0` → `5cc10857e66e039b6b646dc0e4c35b9459b0ce8e` | HEAD at release |
| atc-service-core | Shared runtime package | `44a86927155f982fa88d33490ad3d36f6b0fbee6` | `v1.30.0` → `44a86927155f982fa88d33490ad3d36f6b0fbee6` | HEAD at release |
| atc-shortlink | HTTP service: short links and QR | `6175405ba433df9654287c6e54cce01852e1befc` | `v1.30.0` → `6175405ba433df9654287c6e54cce01852e1befc` | HEAD at release |
| atc-stack | Installer/orchestrator/release management | `c7837b6d6051816f43c6f130b02032fd5cd059ac` | `v1.30.0` → `c7837b6d6051816f43c6f130b02032fd5cd059ac` | v1.30.0 published and verified |
| atc-webhook-out | HTTP service: durable outbound webhooks | `671570f78fa6e56126685801b74f618fc318d247` | `v1.30.0` → `671570f78fa6e56126685801b74f618fc318d247` | HEAD at release |

## Current release

- Supported release: all 22 repositories at `v1.30.0`.
- `atc-stack` `v1.30.0` peels to `c7837b6d6051816f43c6f130b02032fd5cd059ac`; `atc-service-core`
  `v1.30.0` peels to `44a86927155f982fa88d33490ad3d36f6b0fbee6`.
- `installation-manifests/supported.json` selects the install matrix; `releases/` holds the current
  release notes and verification evidence. Tags are never moved.

## Current suite contract

- 20 canonical `openapi.yaml` files, all OpenAPI 3.1.0. Console: 200 paths, 254 operations. Suite:
  650 operations (repositories added on `main` after the supported release enter the next release manifest).
- Generated TypeScript clients: 20/20, 650/650 operations, no regeneration drift.
- MCP: 650 operations classified, 168 tools (reads everywhere plus safe writes; nothing destructive; atc-auth read-only), STDIO transport only.

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
