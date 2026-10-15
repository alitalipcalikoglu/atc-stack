# ATC-WEB Project State

Last source verification: 2026-10-15 (v1.26.0). A concise living handoff of the current state, not a
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
| atc-audit | HTTP service: append-only audit log | `a916c9a1bffd5fb59b02986b1fcb8d89bfc3e62c` | `v1.26.0` → `a916c9a1bffd5fb59b02986b1fcb8d89bfc3e62c` | HEAD at release |
| atc-auth | HTTP service: identity and tokens | `e26f5d38d7b332b8b87151868c6e21df922f4a42` | `v1.26.0` → `e26f5d38d7b332b8b87151868c6e21df922f4a42` | HEAD at release |
| atc-console | HTTP service: administration UI/API | `2993d2a9ad382527d8445126d60d3f63aabf4d5c` | `v1.26.0` → `2993d2a9ad382527d8445126d60d3f63aabf4d5c` | SvelteKit 3; sidebar drawer below 900 px |
| atc-flags | HTTP service: feature flags/settings | `ef8a3610015d8a27ff235577462ab5e18b076650` | `v1.26.0` → `ef8a3610015d8a27ff235577462ab5e18b076650` | HEAD at release |
| atc-gateway | HTTP service: public edge | `63ab533579ef40710cb3a058058d2c6ba9f3db97` | `v1.26.0` → `63ab533579ef40710cb3a058058d2c6ba9f3db97` | HEAD at release |
| atc-geo | HTTP service: geolocation/reference data | `2236a572cdbeeaae95d38bba15ce4e3e7cfeb26e` | `v1.26.0` → `2236a572cdbeeaae95d38bba15ce4e3e7cfeb26e` | HEAD at release |
| atc-media | HTTP service: uploads and delivery | `5430e997c56f08b65f5b81237a8af889644cdf9f` | `v1.26.0` → `5430e997c56f08b65f5b81237a8af889644cdf9f` | HEAD at release |
| atc-notify | HTTP service: queued notifications | `85027611646721646c044e90a5646cfeaf8207d1` | `v1.26.0` → `85027611646721646c044e90a5646cfeaf8207d1` | Email only |
| atc-ratelimit | HTTP service: policies and quotas | `8146fbb818c2ed2fec6bf081c9241f6d83cdd1cf` | `v1.26.0` → `8146fbb818c2ed2fec6bf081c9241f6d83cdd1cf` | HEAD at release |
| atc-scheduler | HTTP service: scheduled HTTP jobs | `9bfe2dc95bb8dbe68d4ed2becbc0029643e163cb` | `v1.26.0` → `9bfe2dc95bb8dbe68d4ed2becbc0029643e163cb` | HEAD at release |
| atc-search | HTTP service: SQLite FTS search | `2923b6cb4eeb5e410df5364753e6c0862e647714` | `v1.26.0` → `2923b6cb4eeb5e410df5364753e6c0862e647714` | HEAD at release |
| atc-service-core | Shared runtime package | `415bb82fca06d97be84ddcec75c62815750bb123` | `v1.26.0` → `415bb82fca06d97be84ddcec75c62815750bb123` | HEAD at release |
| atc-shortlink | HTTP service: short links and QR | `f1b92351442a449377f1d4bdb65c7645bd0b01be` | `v1.26.0` → `f1b92351442a449377f1d4bdb65c7645bd0b01be` | HEAD at release |
| atc-stack | Installer/orchestrator/release management | `45447801cbd5d94056e028dfc5de90508a5b3ffe` | `v1.26.0` → `45447801cbd5d94056e028dfc5de90508a5b3ffe` | v1.26.0 published and verified |
| atc-webhook-out | HTTP service: durable outbound webhooks | `c42f72a7f8f327816808476b87765546ddaadea0` | `v1.26.0` → `c42f72a7f8f327816808476b87765546ddaadea0` | HEAD at release |

## Current release

- Supported release: all 22 repositories at `v1.26.0`.
- `atc-stack` `v1.26.0` peels to `45447801cbd5d94056e028dfc5de90508a5b3ffe`; `atc-service-core`
  `v1.26.0` peels to `415bb82fca06d97be84ddcec75c62815750bb123`.
- `installation-manifests/supported.json` selects the install matrix; `releases/` holds the current
  release notes and verification evidence. Tags are never moved.

## Current suite contract

- 20 canonical `openapi.yaml` files, all OpenAPI 3.1.0. Console: 183 paths, 235 operations. Suite:
  587 operations (repositories added on `main` after the supported release enter the next release manifest).
- Generated TypeScript clients: 20/20, 587/587 operations, no regeneration drift.
- MCP: 587 operations classified, 155 tools (reads everywhere plus safe writes; nothing destructive; atc-auth read-only), STDIO transport only.

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
