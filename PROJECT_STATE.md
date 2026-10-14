# ATC-WEB Project State

Last source verification: 2026-10-14 (v1.20.0). A concise living handoff of the current state, not a
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
| atc-audit | HTTP service: append-only audit log | `18ada8d4dc7fcf7d160fce247b1787ab61e05340` | `v1.20.0` → `18ada8d4dc7fcf7d160fce247b1787ab61e05340` | HEAD at release |
| atc-auth | HTTP service: identity and tokens | `059da33077e4eeace144514d2ce41bf42dd7d958` | `v1.20.0` → `059da33077e4eeace144514d2ce41bf42dd7d958` | HEAD at release |
| atc-console | HTTP service: administration UI/API | `f460f71979f8f2948d397fb86d038f894d262b76` | `v1.20.0` → `f460f71979f8f2948d397fb86d038f894d262b76` | SvelteKit 3; sidebar drawer below 900 px |
| atc-flags | HTTP service: feature flags/settings | `4085f66b3ac231646477a0ec334ccd6d4a4d68b7` | `v1.20.0` → `4085f66b3ac231646477a0ec334ccd6d4a4d68b7` | HEAD at release |
| atc-gateway | HTTP service: public edge | `8c5a8376a97afb7e17398c2d9d4f720fca4761da` | `v1.20.0` → `8c5a8376a97afb7e17398c2d9d4f720fca4761da` | HEAD at release |
| atc-geo | HTTP service: geolocation/reference data | `810b4b251ea634314f8c5c7586fd1bdf214ece07` | `v1.20.0` → `810b4b251ea634314f8c5c7586fd1bdf214ece07` | HEAD at release |
| atc-media | HTTP service: uploads and delivery | `a56e556cd9a667f444934f2d3fb04186a249fb17` | `v1.20.0` → `a56e556cd9a667f444934f2d3fb04186a249fb17` | HEAD at release |
| atc-notify | HTTP service: queued notifications | `108f8c57bacfba2e2ab20467528a85f8dde8f4c3` | `v1.20.0` → `108f8c57bacfba2e2ab20467528a85f8dde8f4c3` | Email only |
| atc-ratelimit | HTTP service: policies and quotas | `685bc37ba05e0eeb5d2359311b5a90af7e8ebb6b` | `v1.20.0` → `685bc37ba05e0eeb5d2359311b5a90af7e8ebb6b` | HEAD at release |
| atc-scheduler | HTTP service: scheduled HTTP jobs | `d6bbf2d2fa130f53a4b25551e1a56c4f6c175b80` | `v1.20.0` → `d6bbf2d2fa130f53a4b25551e1a56c4f6c175b80` | HEAD at release |
| atc-search | HTTP service: SQLite FTS search | `9accbcb1f205df63ee2d28adf3b7d5300819670f` | `v1.20.0` → `9accbcb1f205df63ee2d28adf3b7d5300819670f` | HEAD at release |
| atc-service-core | Shared runtime package | `da4983cc02a7a8fddbfec49ec3265169a9035d0d` | `v1.20.0` → `da4983cc02a7a8fddbfec49ec3265169a9035d0d` | HEAD at release |
| atc-shortlink | HTTP service: short links and QR | `9355e0fe0649c8891911bb8db4d9956d03cef148` | `v1.20.0` → `9355e0fe0649c8891911bb8db4d9956d03cef148` | HEAD at release |
| atc-stack | Installer/orchestrator/release management | `49e21e1a5079c2fbf8d5e58bdb88b6503aba9b67` | `v1.20.0` → `49e21e1a5079c2fbf8d5e58bdb88b6503aba9b67` | v1.20.0 published and verified |
| atc-webhook-out | HTTP service: durable outbound webhooks | `e149975afb8b267080237ada3a8ba06cef2ac44b` | `v1.20.0` → `e149975afb8b267080237ada3a8ba06cef2ac44b` | HEAD at release |

## Current release

- Supported release: all 22 repositories at `v1.20.0`.
- `atc-stack` `v1.20.0` peels to `49e21e1a5079c2fbf8d5e58bdb88b6503aba9b67`; `atc-service-core`
  `v1.20.0` peels to `da4983cc02a7a8fddbfec49ec3265169a9035d0d`.
- `installation-manifests/supported.json` selects the install matrix; `releases/` holds the current
  release notes and verification evidence. Tags are never moved.

## Current suite contract

- 20 canonical `openapi.yaml` files, all OpenAPI 3.1.0. Console: 179 paths, 231 operations. Suite:
  577 operations (repositories added on `main` after the supported release enter the next release manifest).
- Generated TypeScript clients: 20/20, 577/577 operations, no regeneration drift.
- MCP: 577 operations classified, 155 tools (reads everywhere plus safe writes; nothing destructive; atc-auth read-only), STDIO transport only.

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
