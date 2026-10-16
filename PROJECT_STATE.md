# ATC-WEB Project State

Last source verification: 2026-10-16 (v1.32.0). A concise living handoff of the current state, not a
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
Every HTTP service keeps a `docs/READINESS.md` (dependencies, idempotency, failure modes); the
2026-10-16 pass brought them up to v1.32.0 (webhook-out events, content mirror, Safe Browsing,
clamd, HIBP, `Idempotency-Key`).
The release column is immutable; development HEAD may advance. Stack's listed HEAD is the clean
baseline immediately before the commit that updates this file, so the commit containing the newest
state update is necessarily newer.

| Repository | Role | Verified development HEAD | Immutable current release | State / note |
|---|---|---|---|---|
| atc-audit | HTTP service: append-only audit log | `53ad3b52e046141c4b53fdf9cbdf2ec0030fdfd8` | `v1.32.0` → `2f18c0ef550f7ad65b05a1ad91a417d6d468c898` | Readiness docs ahead of release |
| atc-auth | HTTP service: identity and tokens | `2bd97861f68b15aa13eb6cdcbcc1d0b5eaab0387` | `v1.32.0` → `feb205c227b43759cbd93db95f45036b44b574b4` | Readiness docs ahead of release |
| atc-backup | HTTP service: SQLite backups, restore and standby pulls | `89e00b7e997aa3aa25a552f54145adb3e2ae4707` | `v1.32.0` → `60b0c20fab3be18e600f818ad03084267031c1ca` | Readiness docs ahead of release |
| atc-console | HTTP service: administration UI/API | `00436fd37125cab40b077b2e0aef4744a4792e93` | `v1.32.0` → `00436fd37125cab40b077b2e0aef4744a4792e93` | SvelteKit 3; sidebar drawer below 900 px |
| atc-content | HTTP service: structured content and releases | `9b3b6e675ef359dd48e071452e463a6d96ada66f` | `v1.32.0` → `0cf85175c616a15989ffe1d43c52e9a970b3cb6a` | Readiness docs ahead of release |
| atc-export | HTTP service: CSV/NDJSON exports into atc-media | `61231dca59cd108cada6cae86fcecd5cd63f13d1` | `v1.32.0` → `ab8683c2d21462da01fb472486bd917febeea2c2` | Readiness docs ahead of release |
| atc-flags | HTTP service: feature flags/settings | `eeb448979ad578321449eeaedc4b14fb63a81e4d` | `v1.32.0` → `45c8203aae8a644e82b7ec8d0f8126eb6b1d9ade` | Readiness docs ahead of release |
| atc-gateway | HTTP service: public edge | `6b314ca4d7e349ffb6a01080d3b0a4160da2fb3f` | `v1.32.0` → `7e1769ab6634a8b6ad2345a341b4e3b15712d87b` | Readiness docs ahead of release |
| atc-geo | HTTP service: geolocation/reference data | `08805f15781ff48d8f1cdea2682d6b69e40f99b6` | `v1.32.0` → `08805f15781ff48d8f1cdea2682d6b69e40f99b6` | HEAD at release |
| atc-media | HTTP service: uploads and delivery | `eef75ebffafbfa2fc4ad2f46855667e8d08ea083` | `v1.32.0` → `850d1875968aee03b840048db3da02816d516f6a` | Readiness docs ahead of release |
| atc-notify | HTTP service: queued notifications | `a6bf7556b76d99dd893915c8be8b17e6db926d45` | `v1.32.0` → `97f1c626ef73b7b05d2448a839de0fc8c3357b8c` | Email only |
| atc-payments | HTTP service: Stripe payments, refunds and disputes | `825fcd2bf1a4ca937cbbdc724725df6532217955` | `v1.32.0` → `825fcd2bf1a4ca937cbbdc724725df6532217955` | HEAD at release |
| atc-queue | HTTP service: durable task queue | `9989739e3dc8d88b28441be8aec340084feff0c9` | `v1.32.0` → `90618d079fb0ed17cd3745ae291064de43d77a93` | Readiness docs ahead of release |
| atc-ratelimit | HTTP service: policies and quotas | `ec832829e78c94833f125d1813db99ad98e7c946` | `v1.32.0` → `ec832829e78c94833f125d1813db99ad98e7c946` | HEAD at release |
| atc-render | HTTP service: HTML/PDF rendering from templates | `5215d8f35b2564ee884c55ae0c5d6dddc69ca485` | `v1.32.0` → `5215d8f35b2564ee884c55ae0c5d6dddc69ca485` | HEAD at release |
| atc-scheduler | HTTP service: scheduled HTTP jobs | `a0adaa193cb5c2ca39affe819929d21ba7e941f9` | `v1.32.0` → `bb04bccd45f34fac4ffe92bddd10e85a85f40639` | Readiness docs ahead of release |
| atc-search | HTTP service: SQLite FTS search | `3a91064113d3175f700d891e3782f431a8551d60` | `v1.32.0` → `ab6f0a9a0beb3e2c7f8febf1c94905725761837e` | Readiness docs ahead of release |
| atc-service-core | Shared runtime package | `b89e7c1dfd67690859d5ac021c13f96389c3deda` | `v1.32.0` → `f8e0954cd9423f7859e4d34b79b389d0bc2b914a` | Readiness docs ahead of release |
| atc-shortlink | HTTP service: short links and QR | `afb45168946eab42206736bcbb02b50e73d7efd5` | `v1.32.0` → `63f32d6e6d411c378cf610492e74ced74cc094a9` | Readiness docs ahead of release |
| atc-stack | Installer/orchestrator/release management | `518a0bb04bb8da608cf512342cc98e7f116bf596` | `v1.32.0` → `6ee3aab68d4618ac07aaf2ab98b8cf7e01e37701` | v1.32.0 published and verified |
| atc-status | HTTP service: uptime checks, incidents and status page | `980a672302e8135d2f775763d67d6888e587d814` | `v1.32.0` → `e0afdca77c5616db3fea9c53622f5ac611d13574` | Readiness docs ahead of release |
| atc-webhook-out | HTTP service: durable outbound webhooks | `c2e3177bd992ce5170b834321ebed585ccca6abc` | `v1.32.0` → `c56686f9e2171ff4e28a5b34c900e14c51a61312` | Readiness docs ahead of release |

## Current release

- Supported release: all 22 repositories at `v1.32.0`.
- `atc-stack` `v1.32.0` peels to `6ee3aab68d4618ac07aaf2ab98b8cf7e01e37701`; `atc-service-core`
  `v1.32.0` peels to `f8e0954cd9423f7859e4d34b79b389d0bc2b914a`.
- `installation-manifests/supported.json` selects the install matrix; `releases/` holds the current
  release notes and verification evidence. Tags are never moved.

## Current suite contract

- 20 canonical `openapi.yaml` files, all OpenAPI 3.1.0. Console: 206 paths, 261 operations. Suite:
  658 operations (repositories added on `main` after the supported release enter the next release manifest).
- Generated TypeScript clients: 20/20, 658/658 operations, no regeneration drift.
- MCP: 658 operations classified, 168 tools (reads everywhere plus safe writes; nothing destructive; atc-auth read-only), STDIO transport only.

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
clients, documentation and audit forwarding. All 261 API operations (206 `+server` endpoints) and 55 pages live in
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
