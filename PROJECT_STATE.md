# ATC-WEB Project State

Last source verification: 2026-10-14 (v1.16.0). A concise living handoff of the current state, not a
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
| atc-audit | HTTP service: append-only audit log | `b78d17693e61a4173c60b1b1cd6967d74b6a37d5` | `v1.16.0` → `b78d17693e61a4173c60b1b1cd6967d74b6a37d5` | HEAD at release |
| atc-auth | HTTP service: identity and tokens | `440bc88a92ea85801a8c22b32da4f5bec94740f6` | `v1.16.0` → `440bc88a92ea85801a8c22b32da4f5bec94740f6` | HEAD at release |
| atc-console | HTTP service: administration UI/API | `9f7b31972aa715f2fd5e5cc1fcf92269f4b40d51` | `v1.16.0` → `9f7b31972aa715f2fd5e5cc1fcf92269f4b40d51` | SvelteKit 3; sidebar drawer below 900 px |
| atc-flags | HTTP service: feature flags/settings | `c3554cdb516e331ef7c963fe2ee0706def487349` | `v1.16.0` → `c3554cdb516e331ef7c963fe2ee0706def487349` | HEAD at release |
| atc-gateway | HTTP service: public edge | `24b2fd68912d7e2b89870593ad1e698488d2ccec` | `v1.16.0` → `24b2fd68912d7e2b89870593ad1e698488d2ccec` | HEAD at release |
| atc-geo | HTTP service: geolocation/reference data | `cab488690685481c1b7b9f2f4e4810855e166060` | `v1.16.0` → `cab488690685481c1b7b9f2f4e4810855e166060` | HEAD at release |
| atc-media | HTTP service: uploads and delivery | `7dec4e8efb92e5f7e14233acc82104898491b6a8` | `v1.16.0` → `7dec4e8efb92e5f7e14233acc82104898491b6a8` | HEAD at release |
| atc-notify | HTTP service: queued notifications | `03c633445f4e7a4636fadb05b0e9bc9c9bd27d5a` | `v1.16.0` → `03c633445f4e7a4636fadb05b0e9bc9c9bd27d5a` | Email only |
| atc-ratelimit | HTTP service: policies and quotas | `b8e01cd4792cd738b49a4135ab89f18712b00651` | `v1.16.0` → `b8e01cd4792cd738b49a4135ab89f18712b00651` | HEAD at release |
| atc-scheduler | HTTP service: scheduled HTTP jobs | `9909e02fb2863a3c2443db4cd40c0c58d1046054` | `v1.16.0` → `9909e02fb2863a3c2443db4cd40c0c58d1046054` | HEAD at release |
| atc-search | HTTP service: SQLite FTS search | `cfd2079a391b8cae4b8a1e9544a4b3b449fd0a7f` | `v1.16.0` → `cfd2079a391b8cae4b8a1e9544a4b3b449fd0a7f` | HEAD at release |
| atc-service-core | Shared runtime package | `c2b5552cd69d3d9f6e115187c00a9e34c6d814b7` | `v1.16.0` → `c2b5552cd69d3d9f6e115187c00a9e34c6d814b7` | HEAD at release |
| atc-shortlink | HTTP service: short links and QR | `3c4bddee0bcffef9c5e9dacdfcfda23252ef4062` | `v1.16.0` → `3c4bddee0bcffef9c5e9dacdfcfda23252ef4062` | HEAD at release |
| atc-stack | Installer/orchestrator/release management | `abbf28fd2ca0d5aa9e80a1fe2fe4b13de03368bc` | `v1.16.0` → `abbf28fd2ca0d5aa9e80a1fe2fe4b13de03368bc` | v1.16.0 published and verified |
| atc-webhook-out | HTTP service: durable outbound webhooks | `ab87d7146d461d6f335f015fbd29ac1b786244c0` | `v1.16.0` → `ab87d7146d461d6f335f015fbd29ac1b786244c0` | HEAD at release |

## Current release

- Supported release: all 15 repositories at `v1.16.0`.
- `atc-stack` `v1.16.0` peels to `abbf28fd2ca0d5aa9e80a1fe2fe4b13de03368bc`; `atc-service-core`
  `v1.16.0` peels to `c2b5552cd69d3d9f6e115187c00a9e34c6d814b7`.
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
