# ATC-WEB Project State

Last source verification: 2026-10-14 (v1.19.0). A concise living handoff of the current state, not a
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
| atc-audit | HTTP service: append-only audit log | `35d54dd2556dd9d0499b41c5675cbbf2b0e156a7` | `v1.19.0` → `35d54dd2556dd9d0499b41c5675cbbf2b0e156a7` | HEAD at release |
| atc-auth | HTTP service: identity and tokens | `9dc78c30606814a11eede7d0f515990f91f8677d` | `v1.19.0` → `9dc78c30606814a11eede7d0f515990f91f8677d` | HEAD at release |
| atc-console | HTTP service: administration UI/API | `d74a2ba5b0628d043bb66e56e11ad72bf7bb106e` | `v1.19.0` → `d74a2ba5b0628d043bb66e56e11ad72bf7bb106e` | SvelteKit 3; sidebar drawer below 900 px |
| atc-flags | HTTP service: feature flags/settings | `1eff5257acd264dafe97cecc239b52a0d9b9b358` | `v1.19.0` → `1eff5257acd264dafe97cecc239b52a0d9b9b358` | HEAD at release |
| atc-gateway | HTTP service: public edge | `7e53e66959c3172a0d826f69142e10718d5fe12b` | `v1.19.0` → `7e53e66959c3172a0d826f69142e10718d5fe12b` | HEAD at release |
| atc-geo | HTTP service: geolocation/reference data | `2657c6bb836ac5ea10525b419853ecfadcd426f6` | `v1.19.0` → `2657c6bb836ac5ea10525b419853ecfadcd426f6` | HEAD at release |
| atc-media | HTTP service: uploads and delivery | `914a3f43c4e3099db5c2dab8e41856fed0ba671e` | `v1.19.0` → `914a3f43c4e3099db5c2dab8e41856fed0ba671e` | HEAD at release |
| atc-notify | HTTP service: queued notifications | `cb97fcd4380b4d8904dc1f7ad31e7671a98ced86` | `v1.19.0` → `cb97fcd4380b4d8904dc1f7ad31e7671a98ced86` | Email only |
| atc-ratelimit | HTTP service: policies and quotas | `f973586bb9ba06481ab098685d7294c45edd6e8a` | `v1.19.0` → `f973586bb9ba06481ab098685d7294c45edd6e8a` | HEAD at release |
| atc-scheduler | HTTP service: scheduled HTTP jobs | `bf0da5f60fb3be86112dda4e2fb758cd587be5e6` | `v1.19.0` → `bf0da5f60fb3be86112dda4e2fb758cd587be5e6` | HEAD at release |
| atc-search | HTTP service: SQLite FTS search | `e57f214ba817fe9d7bbe4a87b7af613ec72fee93` | `v1.19.0` → `e57f214ba817fe9d7bbe4a87b7af613ec72fee93` | HEAD at release |
| atc-service-core | Shared runtime package | `0fbd9da4b2ad3e3674cd2d17f0d6ba840d0aaf40` | `v1.19.0` → `0fbd9da4b2ad3e3674cd2d17f0d6ba840d0aaf40` | HEAD at release |
| atc-shortlink | HTTP service: short links and QR | `bcaefd6bdcc5e2f2cb43373385ea1d4641b289a3` | `v1.19.0` → `bcaefd6bdcc5e2f2cb43373385ea1d4641b289a3` | HEAD at release |
| atc-stack | Installer/orchestrator/release management | `76e25ac70f13d276f81e9adbbf8d95d46501ada8` | `v1.19.0` → `76e25ac70f13d276f81e9adbbf8d95d46501ada8` | v1.19.0 published and verified |
| atc-webhook-out | HTTP service: durable outbound webhooks | `9dfb7cd928f50917d8a770cfc6b7f1edf665cb62` | `v1.19.0` → `9dfb7cd928f50917d8a770cfc6b7f1edf665cb62` | HEAD at release |

## Current release

- Supported release: all 15 repositories at `v1.19.0`.
- `atc-stack` `v1.19.0` peels to `76e25ac70f13d276f81e9adbbf8d95d46501ada8`; `atc-service-core`
  `v1.19.0` peels to `0fbd9da4b2ad3e3674cd2d17f0d6ba840d0aaf40`.
- `installation-manifests/supported.json` selects the install matrix; `releases/` holds the current
  release notes and verification evidence. Tags are never moved.

## Current suite contract

- 20 canonical `openapi.yaml` files, all OpenAPI 3.1.0. Console: 176 paths, 228 operations. Suite:
  568 operations (repositories added on `main` after the supported release enter the next release manifest).
- Generated TypeScript clients: 20/20, 568/568 operations, no regeneration drift.
- MCP: 568 operations classified, 153 tools (reads everywhere plus safe writes; nothing destructive; atc-auth read-only), STDIO transport only.

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
