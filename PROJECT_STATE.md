# ATC-WEB Project State

Last source verification: 2026-10-14 (v1.17.1). A concise living handoff of the current state, not a
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
| atc-audit | HTTP service: append-only audit log | `098c093764cc131cb3b129c01ccfec19551a0226` | `v1.17.1` → `098c093764cc131cb3b129c01ccfec19551a0226` | HEAD at release |
| atc-auth | HTTP service: identity and tokens | `e9fc89abbcc41db89161416ce083066e8814a867` | `v1.17.1` → `e9fc89abbcc41db89161416ce083066e8814a867` | HEAD at release |
| atc-console | HTTP service: administration UI/API | `0b31432f1186aeb87d688aeb517d1e2512910c01` | `v1.17.1` → `0b31432f1186aeb87d688aeb517d1e2512910c01` | SvelteKit 3; sidebar drawer below 900 px |
| atc-flags | HTTP service: feature flags/settings | `7703f9082233240bc5981b5e605076f741cb8cb1` | `v1.17.1` → `7703f9082233240bc5981b5e605076f741cb8cb1` | HEAD at release |
| atc-gateway | HTTP service: public edge | `a8a1e67de61f42327e582dd47f9428a5b8d5d9a9` | `v1.17.1` → `a8a1e67de61f42327e582dd47f9428a5b8d5d9a9` | HEAD at release |
| atc-geo | HTTP service: geolocation/reference data | `68f5418abbb6c94176c725a7a40b82fa9f2b8db4` | `v1.17.1` → `68f5418abbb6c94176c725a7a40b82fa9f2b8db4` | HEAD at release |
| atc-media | HTTP service: uploads and delivery | `f76f6ca73e1ec9645244f6d137e5879a00887590` | `v1.17.1` → `f76f6ca73e1ec9645244f6d137e5879a00887590` | HEAD at release |
| atc-notify | HTTP service: queued notifications | `82c810fc98baf800fac54f1d22ddffc27b0a8ccc` | `v1.17.1` → `82c810fc98baf800fac54f1d22ddffc27b0a8ccc` | Email only |
| atc-ratelimit | HTTP service: policies and quotas | `c552d85ae70847b1b7f598474db5167353d3a5cb` | `v1.17.1` → `c552d85ae70847b1b7f598474db5167353d3a5cb` | HEAD at release |
| atc-scheduler | HTTP service: scheduled HTTP jobs | `3dc5c7c03dbb7bf60d8de55e4b1b54854128843c` | `v1.17.1` → `3dc5c7c03dbb7bf60d8de55e4b1b54854128843c` | HEAD at release |
| atc-search | HTTP service: SQLite FTS search | `0dabbd6ef0c52487fc93c4458ea55cfdb5c76b79` | `v1.17.1` → `0dabbd6ef0c52487fc93c4458ea55cfdb5c76b79` | HEAD at release |
| atc-service-core | Shared runtime package | `6b28a8811125c3cda91b63a592d929afb88386a4` | `v1.17.1` → `6b28a8811125c3cda91b63a592d929afb88386a4` | HEAD at release |
| atc-shortlink | HTTP service: short links and QR | `fbaeaaaf16a4af96db8ff3bdcf7f914d6afc2513` | `v1.17.1` → `fbaeaaaf16a4af96db8ff3bdcf7f914d6afc2513` | HEAD at release |
| atc-stack | Installer/orchestrator/release management | `33704cc56cb8b7c7d8c9062a09461ebc38d04f82` | `v1.17.1` → `33704cc56cb8b7c7d8c9062a09461ebc38d04f82` | v1.17.1 published and verified |
| atc-webhook-out | HTTP service: durable outbound webhooks | `460cd5e79cc514217c4c49d3c945bf5afd20585f` | `v1.17.1` → `460cd5e79cc514217c4c49d3c945bf5afd20585f` | HEAD at release |

## Current release

- Supported release: all 15 repositories at `v1.17.1`.
- `atc-stack` `v1.17.1` peels to `33704cc56cb8b7c7d8c9062a09461ebc38d04f82`; `atc-service-core`
  `v1.17.1` peels to `6b28a8811125c3cda91b63a592d929afb88386a4`.
- `installation-manifests/supported.json` selects the install matrix; `releases/` holds the current
  release notes and verification evidence. Tags are never moved.

## Current suite contract

- 14 canonical `openapi.yaml` files, all OpenAPI 3.1.0. Console: 134 paths, 174 operations. Suite:
  418 operations (`atc-content` joined on `main` after the supported release; it enters the next release manifest).
- Generated TypeScript clients: 14/14, 418/418 operations, no regeneration drift.
- MCP: 418-operation candidate catalog, 10 explicitly exposed tools, STDIO transport only.

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
