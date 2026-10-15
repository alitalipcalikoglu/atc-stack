# ATC-WEB Project State

Last source verification: 2026-10-15 (v1.28.0). A concise living handoff of the current state, not a
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
| atc-audit | HTTP service: append-only audit log | `b4d405f06aee228d6d762dd1d85a51286dc11cbe` | `v1.28.0` → `b4d405f06aee228d6d762dd1d85a51286dc11cbe` | HEAD at release |
| atc-auth | HTTP service: identity and tokens | `d16286caa7376be745fce0b0de479ebef15e8880` | `v1.28.0` → `d16286caa7376be745fce0b0de479ebef15e8880` | HEAD at release |
| atc-console | HTTP service: administration UI/API | `593c7864197e108cddd5963e94969155a7bb9686` | `v1.28.0` → `593c7864197e108cddd5963e94969155a7bb9686` | SvelteKit 3; sidebar drawer below 900 px |
| atc-flags | HTTP service: feature flags/settings | `4196441d0c39d79fc91055d59831466d8250e6a5` | `v1.28.0` → `4196441d0c39d79fc91055d59831466d8250e6a5` | HEAD at release |
| atc-gateway | HTTP service: public edge | `91a5867f51f8b896e687bb8ccd1517a82749b9ef` | `v1.28.0` → `91a5867f51f8b896e687bb8ccd1517a82749b9ef` | HEAD at release |
| atc-geo | HTTP service: geolocation/reference data | `de50c9217d051f5f977782f9e0f425008b6a1ee5` | `v1.28.0` → `de50c9217d051f5f977782f9e0f425008b6a1ee5` | HEAD at release |
| atc-media | HTTP service: uploads and delivery | `03c64d9dcf0a93cff10194262e35c0c7ad6b5777` | `v1.28.0` → `03c64d9dcf0a93cff10194262e35c0c7ad6b5777` | HEAD at release |
| atc-notify | HTTP service: queued notifications | `d5918e6fb06e59e8b9a21abc43e9f099b43c0168` | `v1.28.0` → `d5918e6fb06e59e8b9a21abc43e9f099b43c0168` | Email only |
| atc-ratelimit | HTTP service: policies and quotas | `4546165d7d2649e8b42f453eb2f0dc5be9d26e34` | `v1.28.0` → `4546165d7d2649e8b42f453eb2f0dc5be9d26e34` | HEAD at release |
| atc-scheduler | HTTP service: scheduled HTTP jobs | `bb0b303f3d468cdcde4e2b49ed3e604e27a18f96` | `v1.28.0` → `bb0b303f3d468cdcde4e2b49ed3e604e27a18f96` | HEAD at release |
| atc-search | HTTP service: SQLite FTS search | `4b89ab35d7c182700ca8ce723167e2e9e3b60118` | `v1.28.0` → `4b89ab35d7c182700ca8ce723167e2e9e3b60118` | HEAD at release |
| atc-service-core | Shared runtime package | `4acbf83febf4736a250bcf96367657ddc89502b9` | `v1.28.0` → `4acbf83febf4736a250bcf96367657ddc89502b9` | HEAD at release |
| atc-shortlink | HTTP service: short links and QR | `20339d1cb460cf603c62099259a95ec8540fdc42` | `v1.28.0` → `20339d1cb460cf603c62099259a95ec8540fdc42` | HEAD at release |
| atc-stack | Installer/orchestrator/release management | `b772411f3b3da7e9308f703c3a9d9f2edfef7be5` | `v1.28.0` → `b772411f3b3da7e9308f703c3a9d9f2edfef7be5` | v1.28.0 published and verified |
| atc-webhook-out | HTTP service: durable outbound webhooks | `38a26fba39ff3242af4293170db5ac7c40523373` | `v1.28.0` → `38a26fba39ff3242af4293170db5ac7c40523373` | HEAD at release |

## Current release

- Supported release: all 22 repositories at `v1.28.0`.
- `atc-stack` `v1.28.0` peels to `b772411f3b3da7e9308f703c3a9d9f2edfef7be5`; `atc-service-core`
  `v1.28.0` peels to `4acbf83febf4736a250bcf96367657ddc89502b9`.
- `installation-manifests/supported.json` selects the install matrix; `releases/` holds the current
  release notes and verification evidence. Tags are never moved.

## Current suite contract

- 20 canonical `openapi.yaml` files, all OpenAPI 3.1.0. Console: 186 paths, 239 operations. Suite:
  608 operations (repositories added on `main` after the supported release enter the next release manifest).
- Generated TypeScript clients: 20/20, 608/608 operations, no regeneration drift.
- MCP: 608 operations classified, 157 tools (reads everywhere plus safe writes; nothing destructive; atc-auth read-only), STDIO transport only.

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
