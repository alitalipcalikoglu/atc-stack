# ATC-WEB Project State

Last source verification: 2026-10-14 (v1.14.1). A concise living handoff of the current state, not a
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
all named `atc-<name>`: 13 independently deployable HTTP services, `atc-service-core` (shared runtime
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
| atc-audit | HTTP service: append-only audit log | `41888ad2bd62dc12535024ca84778558a65b484b` | `v1.14.1` → `41888ad2bd62dc12535024ca84778558a65b484b` | HEAD at release |
| atc-auth | HTTP service: identity and tokens | `76e6754a4e7560ea290b205ae88e40904820262d` | `v1.14.1` → `76e6754a4e7560ea290b205ae88e40904820262d` | HEAD at release; silent resend/forgot; session revoke requires `write` |
| atc-console | HTTP service: administration UI/API | `5357b66676182c5422b5d57c96148c841af2b922` | `v1.14.1` → `5357b66676182c5422b5d57c96148c841af2b922` | SvelteKit; `fastify` dev-only for service-core JSDoc types |
| atc-flags | HTTP service: feature flags/settings | `29fd2667822e02393610e2cf1cc22ea729516a1c` | `v1.14.1` → `29fd2667822e02393610e2cf1cc22ea729516a1c` | HEAD at release |
| atc-gateway | HTTP service: public edge | `a988edab07a26c5735b4c091c4a1f23d0a44c51d` | `v1.14.1` → `a988edab07a26c5735b4c091c4a1f23d0a44c51d` | Independent package-version oracle |
| atc-geo | HTTP service: geolocation/reference data | `f8866e47cf8e5de5969fdc05c4b46faf82f3a7e5` | `v1.14.1` → `f8866e47cf8e5de5969fdc05c4b46faf82f3a7e5` | Canonical country dataset included |
| atc-media | HTTP service: uploads and delivery | `d8e6b1a34951f8007f3c8d1e936a170efd5c37b7` | `v1.14.1` → `d8e6b1a34951f8007f3c8d1e936a170efd5c37b7` | HEAD at release; ticket audited by hash |
| atc-notify | HTTP service: queued notifications | `de95f9fa2860f98fc5c771db7e8ae56e2a31790a` | `v1.14.1` → `de95f9fa2860f98fc5c771db7e8ae56e2a31790a` | HEAD at release |
| atc-ratelimit | HTTP service: policies and quotas | `e99c1d495f502e55724a87b44b61914c31bef548` | `v1.14.1` → `e99c1d495f502e55724a87b44b61914c31bef548` | HEAD at release |
| atc-scheduler | HTTP service: scheduled HTTP jobs | `23ac5830773214afdcfa0b4d6092df644bc94526` | `v1.14.1` → `23ac5830773214afdcfa0b4d6092df644bc94526` | HEAD at release; job audit meta redacted |
| atc-search | HTTP service: SQLite FTS search | `fcdf93d985779eb53e96384db783bfbd730ceb76` | `v1.14.1` → `fcdf93d985779eb53e96384db783bfbd730ceb76` | HEAD at release |
| atc-service-core | Shared runtime package | `d0ad58dfcea072cabc070e21833a3c01392655ff` | `v1.14.1` → `d0ad58dfcea072cabc070e21833a3c01392655ff` | HEAD at release; unified version |
| atc-shortlink | HTTP service: short links and QR | `c9416fc9844ada301cbafdb7f942b9ddbf9abab7` | `v1.14.1` → `c9416fc9844ada301cbafdb7f942b9ddbf9abab7` | HEAD at release |
| atc-stack | Installer/orchestrator/release management | `a0bd32211a26e58c4fed6b9b670a31dba87fbd1a` | `v1.14.1` → `a0bd32211a26e58c4fed6b9b670a31dba87fbd1a` | v1.14.1 published and verified; pre-current-update baseline |
| atc-webhook-out | HTTP service: durable outbound webhooks | `c7083127db8db21efb1d374f5074e6a4fdd2c46f` | `v1.14.1` → `c7083127db8db21efb1d374f5074e6a4fdd2c46f` | HEAD at release; subscription audit meta redacted |

## Current release

- Supported release: all 15 repositories at `v1.14.1`.
- `atc-stack` `v1.14.1` peels to `a0bd32211a26e58c4fed6b9b670a31dba87fbd1a`; `atc-service-core`
  `v1.14.1` peels to `d0ad58dfcea072cabc070e21833a3c01392655ff`.
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
