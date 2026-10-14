# ATC-WEB Project State

Last source verification: 2026-10-14 (v1.25.0). A concise living handoff of the current state, not a
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
| atc-audit | HTTP service: append-only audit log | `b35ad9c208b33445df0a5bd71aa942f7eae7e78b` | `v1.25.0` → `b35ad9c208b33445df0a5bd71aa942f7eae7e78b` | HEAD at release |
| atc-auth | HTTP service: identity and tokens | `d9e074abdbe7984f941dec066a916f38b20f39c6` | `v1.25.0` → `d9e074abdbe7984f941dec066a916f38b20f39c6` | HEAD at release |
| atc-console | HTTP service: administration UI/API | `4d965d7dacd65f91d811869de0eb446a84c03873` | `v1.25.0` → `4d965d7dacd65f91d811869de0eb446a84c03873` | SvelteKit 3; sidebar drawer below 900 px |
| atc-flags | HTTP service: feature flags/settings | `f0c254e6544009cea0f7a9ff6e41fdc2645a548a` | `v1.25.0` → `f0c254e6544009cea0f7a9ff6e41fdc2645a548a` | HEAD at release |
| atc-gateway | HTTP service: public edge | `18fb4c538d19f7a6e9fae98a6f7d943a3f1de1c1` | `v1.25.0` → `18fb4c538d19f7a6e9fae98a6f7d943a3f1de1c1` | HEAD at release |
| atc-geo | HTTP service: geolocation/reference data | `97c4df15b795f917b82487dbaa88c9d1e72919af` | `v1.25.0` → `97c4df15b795f917b82487dbaa88c9d1e72919af` | HEAD at release |
| atc-media | HTTP service: uploads and delivery | `bab6cf6c56843be72df6573d70d04b7cbcfea115` | `v1.25.0` → `bab6cf6c56843be72df6573d70d04b7cbcfea115` | HEAD at release |
| atc-notify | HTTP service: queued notifications | `1f134fe22f44e637ac714042588531bb1f07f52f` | `v1.25.0` → `1f134fe22f44e637ac714042588531bb1f07f52f` | Email only |
| atc-ratelimit | HTTP service: policies and quotas | `bb6f1f88cdba2be0c288ac7e431fdbfce0c541b4` | `v1.25.0` → `bb6f1f88cdba2be0c288ac7e431fdbfce0c541b4` | HEAD at release |
| atc-scheduler | HTTP service: scheduled HTTP jobs | `b981f5e8d04f7707b51837f2b5cdb4a6b7a57d0e` | `v1.25.0` → `b981f5e8d04f7707b51837f2b5cdb4a6b7a57d0e` | HEAD at release |
| atc-search | HTTP service: SQLite FTS search | `27d5cae9f4f6a8bfd04e34981f8d722142f88003` | `v1.25.0` → `27d5cae9f4f6a8bfd04e34981f8d722142f88003` | HEAD at release |
| atc-service-core | Shared runtime package | `1eb77ef43013d166d675de83629ead4b29d50964` | `v1.25.0` → `1eb77ef43013d166d675de83629ead4b29d50964` | HEAD at release |
| atc-shortlink | HTTP service: short links and QR | `03a3236685439d61c6fb30c2014b1f641359a251` | `v1.25.0` → `03a3236685439d61c6fb30c2014b1f641359a251` | HEAD at release |
| atc-stack | Installer/orchestrator/release management | `7736e23e0012ff3158c5277aa72c8529fe744f2d` | `v1.25.0` → `7736e23e0012ff3158c5277aa72c8529fe744f2d` | v1.25.0 published and verified |
| atc-webhook-out | HTTP service: durable outbound webhooks | `e2d0d47c19058edf4be723349013aa24ed5d00ec` | `v1.25.0` → `e2d0d47c19058edf4be723349013aa24ed5d00ec` | HEAD at release |

## Current release

- Supported release: all 22 repositories at `v1.25.0`.
- `atc-stack` `v1.25.0` peels to `7736e23e0012ff3158c5277aa72c8529fe744f2d`; `atc-service-core`
  `v1.25.0` peels to `1eb77ef43013d166d675de83629ead4b29d50964`.
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
