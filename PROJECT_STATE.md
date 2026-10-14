# ATC-WEB Project State

Last source verification: 2026-10-14 (v1.15.0). A concise living handoff of the current state, not a
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
| atc-audit | HTTP service: append-only audit log | `388b581b80b44e431b1b59371d13d54e283242f7` | `v1.15.0` → `388b581b80b44e431b1b59371d13d54e283242f7` | HEAD at release |
| atc-auth | HTTP service: identity and tokens | `ac850cafdde10d658ad5a7a7fe4dfd3c86c5e2a3` | `v1.15.0` → `ac850cafdde10d658ad5a7a7fe4dfd3c86c5e2a3` | HEAD at release |
| atc-console | HTTP service: administration UI/API | `e3ff9f5adf811f6182f34edfad84a3a726350de7` | `v1.15.0` → `e3ff9f5adf811f6182f34edfad84a3a726350de7` | SvelteKit 3; sidebar drawer below 900 px |
| atc-flags | HTTP service: feature flags/settings | `2e9ad51797e6134f46ab8668ad80c31c2b200f98` | `v1.15.0` → `2e9ad51797e6134f46ab8668ad80c31c2b200f98` | HEAD at release |
| atc-gateway | HTTP service: public edge | `94819cec14dd04f91439593c32dd2be87ba3d372` | `v1.15.0` → `94819cec14dd04f91439593c32dd2be87ba3d372` | HEAD at release |
| atc-geo | HTTP service: geolocation/reference data | `870d79cd7911f154d59a8f58f577d374ac6c350c` | `v1.15.0` → `870d79cd7911f154d59a8f58f577d374ac6c350c` | HEAD at release |
| atc-media | HTTP service: uploads and delivery | `7fe3399d08ab06ab468dbe19e0d1e82e5fb43ba1` | `v1.15.0` → `7fe3399d08ab06ab468dbe19e0d1e82e5fb43ba1` | HEAD at release |
| atc-notify | HTTP service: queued notifications | `828e751981988b889e6175174b8d46de47732273` | `v1.15.0` → `828e751981988b889e6175174b8d46de47732273` | Email only |
| atc-ratelimit | HTTP service: policies and quotas | `ca784e6c60a31820c2fc6a6bf3000d859c2314d0` | `v1.15.0` → `ca784e6c60a31820c2fc6a6bf3000d859c2314d0` | HEAD at release |
| atc-scheduler | HTTP service: scheduled HTTP jobs | `6de60c2ea86cdaa8302dc8f96e10eb0764871577` | `v1.15.0` → `6de60c2ea86cdaa8302dc8f96e10eb0764871577` | HEAD at release |
| atc-search | HTTP service: SQLite FTS search | `80f6df59a5ba45f0ef0772e818483c7d8a0554fb` | `v1.15.0` → `80f6df59a5ba45f0ef0772e818483c7d8a0554fb` | HEAD at release |
| atc-service-core | Shared runtime package | `329cf6aaac89d74d87cfe3fb1da2d005af5f2810` | `v1.15.0` → `329cf6aaac89d74d87cfe3fb1da2d005af5f2810` | HEAD at release |
| atc-shortlink | HTTP service: short links and QR | `b00cd04b502a8d8e4314e2dc72ffa540a0bbd07e` | `v1.15.0` → `b00cd04b502a8d8e4314e2dc72ffa540a0bbd07e` | HEAD at release |
| atc-stack | Installer/orchestrator/release management | `485e223ff273baa5ca620219f667dd6eec2a331c` | `v1.15.0` → `485e223ff273baa5ca620219f667dd6eec2a331c` | v1.15.0 published and verified |
| atc-webhook-out | HTTP service: durable outbound webhooks | `bdb197a39a03f78a18bae79110cb42b883f159c9` | `v1.15.0` → `bdb197a39a03f78a18bae79110cb42b883f159c9` | HEAD at release |

## Current release

- Supported release: all 15 repositories at `v1.15.0`.
- `atc-stack` `v1.15.0` peels to `485e223ff273baa5ca620219f667dd6eec2a331c`; `atc-service-core`
  `v1.15.0` peels to `329cf6aaac89d74d87cfe3fb1da2d005af5f2810`.
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

1. **Range:** the media-byte path does not forward inbound `Range` downstream. Changing it needs an
   explicit behavior and security decision.
2. Media-byte and QR responses receive `Cache-Control: no-store` from the shared API response hook,
   overriding route-local cache directives.
3. **Swagger bundle size:** the local Swagger UI is a 1,425,215-byte lazy chunk, loaded only on
   `/docs`.

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
