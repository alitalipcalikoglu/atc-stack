# ATC-WEB Project State

Last source verification: 2026-10-14 (v1.14.2). A concise living handoff of the current state, not a
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
| atc-audit | HTTP service: append-only audit log | `0bfe8122575927b7a832c77258a42b29a57bc701` | `v1.14.2` → `0bfe8122575927b7a832c77258a42b29a57bc701` | HEAD at release |
| atc-auth | HTTP service: identity and tokens | `1dd7e9be81853ed9b145ddb1a47e602ce62a63c0` | `v1.14.2` → `1dd7e9be81853ed9b145ddb1a47e602ce62a63c0` | HEAD at release |
| atc-console | HTTP service: administration UI/API | `5d9f063a3841638be82f4d59bbf7ad56963209ff` | `v1.14.2` → `5d9f063a3841638be82f4d59bbf7ad56963209ff` | SvelteKit; sidebar drawer below 900 px |
| atc-flags | HTTP service: feature flags/settings | `e9552b3c2aa3a4c68fcd065900cc13101658beba` | `v1.14.2` → `e9552b3c2aa3a4c68fcd065900cc13101658beba` | HEAD at release |
| atc-gateway | HTTP service: public edge | `ec9e66b4bf4b9e261db219520f145af6b88ea72b` | `v1.14.2` → `ec9e66b4bf4b9e261db219520f145af6b88ea72b` | HEAD at release |
| atc-geo | HTTP service: geolocation/reference data | `514a74906b4bb9640a27b7dae4f89096ca2b497b` | `v1.14.2` → `514a74906b4bb9640a27b7dae4f89096ca2b497b` | HEAD at release |
| atc-media | HTTP service: uploads and delivery | `3909dd96e8e038a37b5c2eac5a1488b786f7d604` | `v1.14.2` → `3909dd96e8e038a37b5c2eac5a1488b786f7d604` | HEAD at release |
| atc-notify | HTTP service: queued notifications | `79b5b86f15f7421700a32db5288bf97ca408f164` | `v1.14.2` → `79b5b86f15f7421700a32db5288bf97ca408f164` | Email only |
| atc-ratelimit | HTTP service: policies and quotas | `f3da3ed8de3a3f3857374806f94c287c94e31710` | `v1.14.2` → `f3da3ed8de3a3f3857374806f94c287c94e31710` | HEAD at release |
| atc-scheduler | HTTP service: scheduled HTTP jobs | `78f021a77b89dc243ed37948a3019aac8ed7fb7e` | `v1.14.2` → `78f021a77b89dc243ed37948a3019aac8ed7fb7e` | HEAD at release |
| atc-search | HTTP service: SQLite FTS search | `e10f877ed1da4b30e11d9639ee41d3a8311c7880` | `v1.14.2` → `e10f877ed1da4b30e11d9639ee41d3a8311c7880` | HEAD at release |
| atc-service-core | Shared runtime package | `4299455a1c95dc3bf548167bd6c62ccd4d1af29d` | `v1.14.2` → `4299455a1c95dc3bf548167bd6c62ccd4d1af29d` | HEAD at release |
| atc-shortlink | HTTP service: short links and QR | `c88172c523a4f64638da8dca0de5cf496621ce7e` | `v1.14.2` → `c88172c523a4f64638da8dca0de5cf496621ce7e` | HEAD at release |
| atc-stack | Installer/orchestrator/release management | `bf6826ecc4b07dec01e934b419aed102ae900adc` | `v1.14.2` → `bf6826ecc4b07dec01e934b419aed102ae900adc` | v1.14.2 published and verified |
| atc-webhook-out | HTTP service: durable outbound webhooks | `a8c0d7a5118b6471b53b414275deea745e59bd68` | `v1.14.2` → `a8c0d7a5118b6471b53b414275deea745e59bd68` | HEAD at release |

## Current release

- Supported release: all 15 repositories at `v1.14.2`.
- `atc-stack` `v1.14.2` peels to `bf6826ecc4b07dec01e934b419aed102ae900adc`; `atc-service-core`
  `v1.14.2` peels to `4299455a1c95dc3bf548167bd6c62ccd4d1af29d`.
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
runs locally. Do not change the supported pointer, manifests or tags as a side effect of other work.

## Console architecture

One full-stack SvelteKit 2 application on adapter-node: one Node process, one HTTP framework, one
filesystem router, SSR pages and filesystem API/operational endpoints. Root `server.mjs` wraps the
adapter handler with HTTP/HTTPS, IPC readiness and graceful shutdown. `src/hooks.server.ts` owns the
request, security and session lifecycle; the process-scoped runtime owns SQLite, maintenance,
clients, documentation and audit forwarding. All 156 API operations and 34 page patterns live in
`src/routes/`. The service worker caches only its own static assets and owns only its own
`atc-console-static-` caches. Navigation is a left sidebar that becomes an off-canvas drawer below
900 px, with the signed-in user and sign-out at its bottom. Stack rebuilds the Console at every
`setup` and starts it through `server.mjs`.

Excluded by design: Fastify, a separate SPA or BFF, a custom router, `adapter-static`, a generic
downstream proxy, and extra controller/service/repository layering.

## Known debt

1. **Range:** the media-byte path does not forward inbound `Range` downstream. Changing it needs an
   explicit behavior and security decision.
2. Media-byte and QR responses receive `Cache-Control: no-store` from the shared API response hook,
   overriding route-local cache directives.
3. **Development advisory:** SvelteKit 2.70.3 pins `cookie` 0.6.0 (low-severity, development-only);
   the fix is the deferred SvelteKit 3 upgrade.
4. **Swagger bundle size:** the local Swagger UI is a 1,425,215-byte lazy chunk, loaded only on
   `/docs`.

## Operational constraints

- No GitHub workflow files. Validation, tagging and release checks stay local.
- Preserve server-side credentials, opaque sessions, schema compatibility, streaming, graceful
  shutdown, native TLS/proxy semantics and PM2 readiness/shutdown contracts.
- Never create, move or delete tags without an explicit release.

## Next controlled stage

None. Future work is ordinary product maintenance. The SvelteKit 3 upgrade is deferred until its
first patch releases settle.

## Update checklist

1. Verify all 15 repositories: branch, remote, HEAD, clean tree.
2. Update the repository table, the current release and the contract counts from source.
3. Record decisions and debt; remove debt only with validated evidence.
4. Validate affected repositories locally, inspect the diff, then commit focused changes.
