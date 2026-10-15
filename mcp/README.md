# stack-mcp

A single [Model Context Protocol](https://modelcontextprotocol.io) server foundation over the
atc-web platform's 20 generated typed clients (`atc-stack/clients/typescript/`). Talks to real services
through their real, canonical HTTP APIs — never a database, never a service's own `src/`, never a
hand-rolled HTTP call.

## Architecture boundary (hard, tested)

```
MCP tool handler -> ServiceRegistry -> a generated typed client -> the service's real HTTP API
```

- No direct DB access, anywhere in this package.
- No `import` of a sibling service's own `src/` tree.
- No hand-rolled `fetch()` of a service endpoint — every service call goes through
  `src/registry.mjs`'s `ServiceRegistry`, the only file that constructs a typed client.
- No hardcoded service path or base URL in source — callers configure base URLs explicitly (see
  Configuration below).

`test/boundary-scan.test.mjs` asserts all of the above by scanning this package's own source, so a
future edit that reintroduces one of these is a failing test, not a design doc nobody re-reads.

## One server, explicit tool list, default deny

This is **not** an API mirror. Of the platform's 608 canonical operations, **157 tools** are exposed (see "Available tools"). The scope, decided for the `1.27.0` suite:

- **Every service gets read tools plus safe writes**: create and update, enqueue, publish, start an export, render a stored document, create a monitor, create a payment intent, and similar calls that either can be undone by another safe call or only queue/start work.
- **Nothing destructive or irreversible**: no delete, purge, clear, refund, cancel, restore, revoke, rotate, reset, key or role changes, dead-letter purge, and nothing that re-sends mail or deliveries. Every tool declares `destructiveHint: false`.
- **atc-auth is read-only** (user lookup and list, sessions, its security event log) and never returns secrets: password hashes, tokens, TOTP data and recovery codes are filtered out of every result (`src/tools/overrides.mjs`), on top of the service never sending them. Its credential flows stay out because they take passwords or mint tokens, and `forgot`/`resend` must stay enumeration-resistant (see the atc-auth README's security notes). Use a `read` key for it.
- **atc-console has no business tool**; only its probes are touched, via `atc-stack.status`.
- Local STDIO only: no remote transport, no MCP-specific authentication, no package publication.

How a tool comes to exist:

- `tool-policy.mjs` names, per service, the operations that are tools and gives a one-line reason for every class of write operation that is not.
- `tools.generate.mjs` turns those operations into explicit, committed definitions under `src/tools/services/<service>.mjs`: each tool is named after its `operationId`, and its input schema copies the operation's own path, query, header and body contract from its `openapi.yaml`. Nothing reads a spec at runtime.
- `src/tools/hand-written.mjs` keeps `atc-stack.status` and the first ten tools as they were; `src/tools/overrides.mjs` holds the few deliberate tweaks (secret filtering, render always stored, extra descriptions).
- `tool-catalog.json` classifies all 608 operations (`READ_SAFE`/`MUTATION`/`DESTRUCTIVE`/`HIGH_RISK`/`OPERATOR`/`INTERNAL`/`BINARY`/`ASYNC`/`POOR_MCP_FIT`), marks the ones a tool calls as `exposed`, and carries the policy. `tool-catalog.reconcile.mjs` fails when policy, tools and catalog disagree, or when a write operation is neither a tool nor excluded with a reason.

## Install / build / configure / run

```bash
cd atc-stack/mcp
npm install          # isolated node_modules, separate from stack's own (see "Why isolated" below)
npm run -w . build    # (no build step today -- source is plain .mjs + the generated .ts clients)
```

Configuration is explicit and flat — nothing is auto-discovered from `process.env`'s usual stack
conventions, a `services.json`, or any secret store. Per service (only needed for a service a tool
actually calls):

```bash
STACK_MCP_FLAGS_BASE_URL=https://flags.internal:4000
STACK_MCP_FLAGS_API_KEY=example-flags-api-key
STACK_MCP_NOTIFY_BASE_URL=https://notify.internal:4001
STACK_MCP_NOTIFY_API_KEY=example-notify-api-key
# ... one BASE_URL (+ API_KEY where the service needs one) per service a tool uses.
STACK_MCP_TIMEOUT_MS=30000   # optional; default matches gateway's own UPSTREAM_TIMEOUT_MS default.
```

Every service that has tools needs both variables (`STACK_MCP_<SERVICE>_BASE_URL`, `STACK_MCP_<SERVICE>_API_KEY`, e.g. `STACK_MCP_WEBHOOK_OUT_API_KEY`). Give the MCP server its own keys with the smallest role that covers its tools, and a `read` key wherever you want read tools only.

`atc-stack.status` only ever needs a `BASE_URL` per service (its 3 probes are unauthenticated on every
service) — a service with no `BASE_URL` configured is reported `configured: false` in its result,
not an error. Every other tool needs both `BASE_URL` and `API_KEY` for its own service; a missing
one produces a clear, specific `SERVICE_UNAVAILABLE` tool error naming exactly which env var is
missing — never a vague failure, never a secret value.

### Running (STDIO)

This process directly imports the generated `*.ts` typed clients under
`atc-stack/clients/typescript/`, so it must be started with Node's type-stripping flag:

```bash
node --experimental-strip-types --disable-warning=ExperimentalWarning atc-stack/mcp/bin/stack-mcp.js
```

(`--disable-warning=ExperimentalWarning` just silences Node's SQLite/type-stripping experimental
warnings on stderr — harmless without it, just noisier.) From an MCP client's own config (e.g. a
`claude_desktop_config.json`-style `mcpServers` entry), that's the `command`/`args` pair to use,
with `env` set to the `STACK_MCP_*` variables above.

Only **STDIO** transport is implemented this phase (local client integration). No HTTP/SSE server
is started — remote MCP hosting is out of scope here.

## Why isolated `node_modules` (not stack's root)

`atc-stack/mcp/package.json` has its own `node_modules`, deliberately separate from stack's own root
`package.json`, for the same reason `atc-stack/clients/typescript/` does (see that package's own
README): stack's own toolchain isn't touched by anything this package needs, and vice versa. The
official MCP SDK (`@modelcontextprotocol/sdk`) and `zod` are real runtime dependencies of a
running `stack-mcp` process — that's normal and expected — but neither one is added to stack's
root `package.json`, and no service repo's dependency graph changes at all.

## Available tools

`atc-stack.status` (every configured service's `/health`, `/ready` and `/v1/info`; one dead or unconfigured service never fails the call) plus the tools below. "safe write" tools create, update, queue or start work; "idempotent" means a repeat with the same arguments has no further effect; "external" means the call reaches outside the platform (mail, external URLs, Stripe).

### atc-console

No tools.

Not exposed:
- `*`: The console is a human admin UI with its own session auth; agents use the services directly.

### atc-audit

| Tool | Kind |
|---|---|
| `atc-audit.events.list` | read |
| `atc-audit.events.get` | read |
| `atc-audit.stats.get` | read |
| `atc-audit.chain.getHead` | read |
| `atc-audit.chain.verify` | read |
| `atc-audit.anchors.list` | read |

Not exposed:
- `events.create`, `events.createBatch`: The audit log is append-only security history; an agent must not author entries that can never be withdrawn.
- `events.export`: Bulk NDJSON download; use events.list pages instead.

### atc-auth

| Tool | Kind |
|---|---|
| `atc-auth.users.list` | read |
| `atc-auth.users.get` | read |
| `atc-auth.sessions.list` | read |
| `atc-auth.events.list` | read |

Not exposed:
- `users.create`, `users.patch`, `users.delete`: Account changes are identity administration; read-only by decision.
- `sessions.revokeAll`, `sessions.revokeOne`, `logout`: Revoking sessions signs people out and cannot be undone.
- `login`, `refresh`, `introspect`: End-user credential flows: they take passwords or tokens and mint secrets.
- `password.change`, `password.forgot`, `password.reset`, `emailVerification.resend`, `emailVerification.verify`: Password and verification flows act for an end user and send mail; forgot/resend must stay enumeration-resistant.

### atc-backup

| Tool | Kind |
|---|---|
| `atc-backup.sources.list` | read |
| `atc-backup.sources.get` | read |
| `atc-backup.backups.list` | read |
| `atc-backup.backups.get` | read |
| `atc-backup.stats.get` | read |
| `atc-backup.backups.verify` | safe write, idempotent |

Not exposed:
- `sources.backup`: A new backup runs retention, which can delete the oldest kept backup.
- `backups.restore`, `backups.delete`: Restore overwrites files (or a live database); delete is irreversible.
- `backups.download`: Streams a whole database (secrets included) as binary.

### atc-content

| Tool | Kind |
|---|---|
| `atc-content.namespaces.list` | read |
| `atc-content.namespaces.get` | read |
| `atc-content.keys.list` | read |
| `atc-content.keys.get` | read |
| `atc-content.releases.list` | read |
| `atc-content.releases.get` | read |
| `atc-content.stats.get` | read |
| `atc-content.bundles.get` | read |
| `atc-content.namespaces.create` | safe write |
| `atc-content.namespaces.update` | safe write, idempotent |
| `atc-content.locales.upsert` | safe write, idempotent |
| `atc-content.keys.upsert` | safe write, idempotent |

Not exposed:
- `namespaces.delete`, `locales.delete`, `keys.delete`: Deletes are irreversible.
- `releases.publish`, `releases.rollback`: Changes what every end user is served at once; a human decision in the console.
- `translations.import`: Bulk overwrite of a whole locale; not undoable key by key.
- `translations.export`: Bulk file download; read keys with keys.list.

### atc-export

| Tool | Kind |
|---|---|
| `atc-export.sources.list` | read |
| `atc-export.exports.list` | read |
| `atc-export.exports.get` | read |
| `atc-export.stats.get` | read |
| `atc-export.exports.download` | read |
| `atc-export.exports.create` | safe write |
| `atc-export.exports.retry` | safe write |

Not exposed:
- `exports.cancel`, `exports.delete`: Cancel and delete discard work and files irreversibly.

### atc-flags

| Tool | Kind |
|---|---|
| `atc-flags.evaluate` | read |
| `atc-flags.environments.list` | read |
| `atc-flags.flags.list` | read |
| `atc-flags.flags.get` | read |
| `atc-flags.flags.getHistory` | read |
| `atc-flags.history.list` | read |
| `atc-flags.envs.get` | read |
| `atc-flags.stats.get` | read |
| `atc-flags.flags.create` | safe write |
| `atc-flags.flags.patch` | safe write, idempotent |

Not exposed:
- `flags.delete`: Irreversible.
- `envs.copy`, `envs.patch`: Bulk changes to a whole environment at once.
- `evaluate.get`, `snapshot.get`: Duplicates of evaluate.post / SDK bootstrap payloads; no extra value for an agent.

### atc-geo

| Tool | Kind |
|---|---|
| `atc-geo.ip.lookup` | read |
| `atc-geo.ip.lookupBatch` | read |
| `atc-geo.phone.normalize` | read |
| `atc-geo.phone.normalizeBatch` | read |
| `atc-geo.distance.compute` | read |
| `atc-geo.countries.list` | read |
| `atc-geo.countries.get` | read |
| `atc-geo.currencies.list` | read |
| `atc-geo.timezones.list` | read |
| `atc-geo.collections.list` | read |
| `atc-geo.collections.get` | read |
| `atc-geo.places.list` | read |
| `atc-geo.places.get` | read |
| `atc-geo.places.nearby` | read |
| `atc-geo.stats.get` | read |
| `atc-geo.database.getInfo` | read |
| `atc-geo.collections.create` | safe write |
| `atc-geo.collections.patch` | safe write, idempotent |
| `atc-geo.places.upsert` | safe write, idempotent |

Not exposed:
- `collections.delete`, `collections.clear`, `places.delete`: Delete and clear are irreversible.
- `database.reload`: Operator action that swaps the live IP database.

### atc-media

| Tool | Kind |
|---|---|
| `atc-media.files.get` | read |
| `atc-media.files.list` | read |
| `atc-media.files.signUrls` | read |

Not exposed:
- `files.delete`, `files.restore`: Delete is irreversible; restore is its operator counterpart.
- `files.patch`: Can switch a private file to public, which exposes it.
- `files.upload`, `files.uploadTicketed`, `tickets.create`: Binary uploads do not fit MCP tool calls.

### atc-notify

| Tool | Kind |
|---|---|
| `atc-notify.messages.list` | read |
| `atc-notify.messages.create` | safe write, external |
| `atc-notify.messages.get` | read |
| `atc-notify.templates.list` | read |
| `atc-notify.suppressions.list` | read (admin key) |
| `atc-notify.suppressions.get` | read (admin key) |

Not exposed:
- `messages.retry`: Sends an e-mail again to a real recipient.

### atc-payments

| Tool | Kind |
|---|---|
| `atc-payments.payments.list` | read |
| `atc-payments.payments.get` | read |
| `atc-payments.ledger.list` | read |
| `atc-payments.events.list` | read |
| `atc-payments.stats.get` | read |
| `atc-payments.payments.create` | safe write, idempotent, external |
| `atc-payments.payments.sync` | safe write, idempotent, external |

Not exposed:
- `refunds.create`, `payments.cancel`: Moves or stops real money; irreversible.
- `webhooks.stripe`: Stripe-only endpoint authenticated by its signature.

### atc-queue

| Tool | Kind |
|---|---|
| `atc-queue.queues.list` | read |
| `atc-queue.queues.get` | read |
| `atc-queue.messages.list` | read |
| `atc-queue.messages.get` | read |
| `atc-queue.stats.get` | read |
| `atc-queue.queues.upsert` | safe write, idempotent |
| `atc-queue.messages.enqueue` | safe write |
| `atc-queue.messages.enqueueBatch` | safe write |

Not exposed:
- `queues.delete`, `queues.purge`, `messages.delete`: Deletes messages irreversibly.
- `messages.pull`, `messages.ack`, `messages.nack`, `messages.extend`: Worker data plane: leasing and acking another consumer's work.
- `queues.redrive`: Dead-letter handling is an operator decision in the console.

### atc-ratelimit

| Tool | Kind |
|---|---|
| `atc-ratelimit.check` | read |
| `atc-ratelimit.policies.list` | read |
| `atc-ratelimit.policies.get` | read |
| `atc-ratelimit.policies.getStats` | read |
| `atc-ratelimit.policies.getTop` | read |
| `atc-ratelimit.overrides.list` | read |
| `atc-ratelimit.subjects.getUsage` | read |
| `atc-ratelimit.stats.get` | read |
| `atc-ratelimit.policies.create` | safe write |
| `atc-ratelimit.policies.patch` | safe write, idempotent |

Not exposed:
- `policies.delete`, `overrides.delete`, `subjects.resetUsage`: Irreversible; reset wipes counters.
- `overrides.set`: Undoing an override needs a delete.
- `checkBatch`, `release`: Consume or return real quota (check is exposed as a peek only).

### atc-render

| Tool | Kind |
|---|---|
| `atc-render.templates.list` | read |
| `atc-render.templates.get` | read |
| `atc-render.versions.get` | read |
| `atc-render.stats.get` | read |
| `atc-render.templates.create` | safe write |
| `atc-render.templates.update` | safe write, idempotent |
| `atc-render.versions.create` | safe write |
| `atc-render.render.create` | safe write |

Not exposed:
- `templates.delete`: Irreversible.
- `render.preview`: Returns the PDF bytes; render.create stores the document and returns a reference instead.

### atc-scheduler

| Tool | Kind |
|---|---|
| `atc-scheduler.jobs.list` | read |
| `atc-scheduler.jobs.get` | read |
| `atc-scheduler.jobs.listRuns` | read |
| `atc-scheduler.runs.list` | read |
| `atc-scheduler.runs.get` | read |
| `atc-scheduler.schedule.preview` | read |
| `atc-scheduler.stats.get` | read |
| `atc-scheduler.timezones.list` | read |
| `atc-scheduler.targetKeys.list` | read |
| `atc-scheduler.jobs.create` | safe write, external |
| `atc-scheduler.jobs.patch` | safe write, idempotent, external |

Not exposed:
- `jobs.delete`, `runs.cancel`: Irreversible.
- `jobs.run`: Fires the job's HTTP call at once, outside its schedule.

### atc-search

| Tool | Kind |
|---|---|
| `atc-search.query` | read |
| `atc-search.indexes.list` | read |
| `atc-search.indexes.get` | read |
| `atc-search.query.post` | read |
| `atc-search.suggest` | read |
| `atc-search.documents.get` | read |
| `atc-search.documents.browse` | read |
| `atc-search.stats.get` | read |
| `atc-search.indexes.create` | safe write |
| `atc-search.indexes.patch` | safe write, idempotent |
| `atc-search.documents.upsert` | safe write, idempotent |

Not exposed:
- `indexes.delete`, `indexes.clear`, `documents.delete`: Irreversible.

### atc-shortlink

| Tool | Kind |
|---|---|
| `atc-shortlink.links.create` | safe write |
| `atc-shortlink.links.list` | read |
| `atc-shortlink.links.get` | read |
| `atc-shortlink.links.getStats` | read |
| `atc-shortlink.stats.get` | read |
| `atc-shortlink.links.patch` | safe write, idempotent |

Not exposed:
- `links.delete`: Irreversible.
- `links.getQr`, `qr.getForText`, `qr.getPublic`: Binary images.
- `redirect.follow`, `robots.get`: Public browser endpoints that count clicks.

### atc-status

| Tool | Kind |
|---|---|
| `atc-status.monitors.list` | read |
| `atc-status.monitors.get` | read |
| `atc-status.monitors.checks` | read |
| `atc-status.incidents.list` | read |
| `atc-status.incidents.get` | read |
| `atc-status.stats.get` | read |
| `atc-status.page.summary` | read |
| `atc-status.monitors.upsert` | safe write, idempotent, external |

Not exposed:
- `monitors.delete`: Irreversible (checks and incidents go with it).
- `monitors.check`: Can open an incident and send alert e-mails.
- `page.get`: HTML; page.summary has the same data.

### atc-webhook-out

| Tool | Kind |
|---|---|
| `atc-webhook-out.subscriptions.list` | read |
| `atc-webhook-out.subscriptions.get` | read |
| `atc-webhook-out.subscriptions.listDeliveries` | read |
| `atc-webhook-out.events.list` | read |
| `atc-webhook-out.events.get` | read |
| `atc-webhook-out.eventTypes.list` | read |
| `atc-webhook-out.deliveries.list` | read |
| `atc-webhook-out.deliveries.get` | read |
| `atc-webhook-out.stats.get` | read |
| `atc-webhook-out.subscriptions.create` | safe write, external |
| `atc-webhook-out.subscriptions.patch` | safe write, idempotent, external |
| `atc-webhook-out.events.publish` | safe write, external |

Not exposed:
- `subscriptions.delete`, `deliveries.cancel`: Irreversible.
- `subscriptions.rotate`: Signing-secret change: breaks receivers until they update.
- `subscriptions.test`, `subscriptions.replay`, `deliveries.redeliver`: Re-sends deliveries to external receivers.


Notes on specific tools:

- `atc-ratelimit.check` always evaluates with `peek: true`, so it can never consume quota.
- `atc-payments.payments.create` requires `idempotencyKey` (sent as the `Idempotency-Key` header): the same key with the same body returns the same payment, and Stripe gets one PaymentIntent. Confirm the payment in the browser with the returned `clientSecret`.
- `atc-render.render.create` always stores the PDF in atc-media and returns the reference; it never returns document bytes. `atc-export.exports.download` returns a short-lived signed URL, not the file.
- `atc-webhook-out.subscriptions.*` results never include the signing secret; read or rotate it in the console.
- List tools keep each service's own pagination (`items`/`nextCursor` cursors, or `total`/`limit`/`offset`); query parameters are strings exactly as the service's contract defines them (for example `limit: "20"`).

The ten original tools keep their names (`atc-flags.evaluate` calls `atc-flags.evaluate.post`, `atc-search.query` calls `atc-search.query.get`); every other tool is named exactly after its operation's `operationId` — no invented naming scheme, no API-path-shaped names like `notify_post_v1_messages`.

### On the two different pagination shapes

`atc-notify.messages.list` returns `{items, nextCursor}`; `atc-search.query` returns
`{hits, total, limit, offset}`. This is a **real, existing** platform inconsistency
(a deliberate open policy question), not something this
package invented or should silently paper over. Each tool's output uses that operation's own real
field names.

### Binary

No tool in this phase transports file bytes through MCP. `atc-media.files.get` returns metadata
(including signed/public URLs) that a caller can fetch directly — never base64-encoded content in a
tool result. A future phase adding a true binary tool should use an MCP resource/content primitive
deliberately, not a giant base64 string stuffed into `structuredContent`.

## Input validation

Every tool's `inputSchema` is a `zod` raw shape whose fields, types, and requiredness are copied
directly from that operation's own OpenAPI request schema (see the file-and-line citations in each
tool's comment in `src/tools/index.mjs`) — never invented, never loosened or tightened. Deep
per-value validation that the real service already does at the JSON-Schema level (e.g. notify's
per-email-template `data` shape) is intentionally **not** re-derived here a third time — the real
service is still the final validator; this schema only re-derives the outer contract shape so
obviously malformed calls fail fast, before an HTTP round trip.

The official SDK validates every call's arguments against this schema **before** invoking a tool's
handler. A validation failure comes back as a normal `CallToolResult` with `isError: true` — the
MCP protocol's own design for tool-level errors (not a rejected JSON-RPC request) — with a message
naming the failing field. Confirmed directly against a running server, not assumed from docs.

## Output shape

Every successful tool result: `{ content: [{type:'text', text: <short summary>}], structuredContent:
{ status, data, requestId? } }`. `data` is the real, typed response body. `requestId` is the
service's own `X-Request-Id` when present (safe, useful for correlating with that service's logs);
no other header is ever included — everything else on this platform is either routine or
documented as internal-only propagation in `atc-stack/docs/OBSERVABILITY.md`.

## Error translation

Every tool funnels failures through one adapter (`src/errors.mjs`). What's always preserved: the
target service name, the real HTTP status (when there is one), the service's own canonical error
code (its real `ErrorEnvelope.error.code`, e.g. `NOT_FOUND`), and a safe message. What's **never**
included, under any circumstance: API keys, cookies, `Authorization` header values, stack traces,
local filesystem paths, or a raw unrecognized upstream body. Verified by a real, sentinel-secret
based test in `test/e2e/protocol.test.mjs`, not just documented.

Four MCP-boundary-only error kinds (not a new copy of every service's own domain error taxonomy):
`INVALID_INPUT`, `SERVICE_UNAVAILABLE` (missing config), `UPSTREAM_ERROR` (a real, well-formed error
response from the service — its own code/message preserved inside), `TRANSPORT_ERROR` (network
failure, timeout, or an unparseable response).

## Timeouts and retries

Every request gets a default timeout (`STACK_MCP_TIMEOUT_MS`, default 30000ms — matches gateway's
own `UPSTREAM_TIMEOUT_MS` default, reused rather than picked arbitrarily) via `AbortSignal.timeout`,
unless the caller already supplied a signal. **No automatic retry, anywhere, ever** — a mutating
call retried automatically risks a real duplicate side effect, and the generated typed clients this
package builds on ([Phase 2](../clients/typescript/README.md)) are deliberately retry-free for the
same reason.

## Logging

STDIO is the protocol channel: only the SDK's own framed JSON-RPC traffic may ever touch stdout.
Anything this package itself needs to say goes to stderr, or isn't said at all — no logging
dependency was added since stderr already satisfies "don't log secrets, don't touch stdout" without
one. `test/e2e/protocol.test.mjs`'s STDIO-purity test asserts stdout stays clean and stderr never
contains a sentinel test secret.

## Testing

```bash
npm run mcp:typecheck   # strict, from stack root
npm run mcp:test        # fast: catalog/allowlist/boundary-scan invariants, no process spawning
STACK_INTEGRATION=1 npm run mcp:e2e   # real: spawned services + a real stack-mcp child process, driven by the official MCP client SDK over real STDIO
```

`mcp:e2e` proves, against real running services (not mocks, not direct handler calls): `initialize`
→ `listTools` → `callTool`, a read-only tool, an authenticated read, a safe mutation, an async
submit-then-status-read pair, both real pagination shapes, an expected 4xx from a real service, a
malformed-input rejection, an unconfigured-service error, a wrong-credential error, an
unreachable-service transport error, and STDIO purity / secret non-leakage. `test/e2e/operations.test.mjs` adds the generated operation tools against real atc-queue, atc-payments (with a local fake Stripe, never real keys), atc-render with atc-media, and atc-auth with atc-notify: a PUT upsert, enqueue and cursor paging, a payment created twice with one idempotency key (one PaymentIntent), a stored render returned as a reference, and auth reads with no secret-looking field in any result.

## Adding a tool

1. The operation must already exist in that service's canonical `openapi.yaml`, and `npm run clients:check` (from `atc-stack/`) must be green.
2. Decide in `tool-policy.mjs`: add the operationId to the service's `tools`, or keep it under `excluded` with a reason. `DESTRUCTIVE`/`HIGH_RISK` operations stay excluded; changing that is a reviewed policy change to this README and the tests.
3. Regenerate: `node mcp/tools.generate.mjs`, then `npm run mcp:catalog` (catalog + reconcile). Put any behaviour tweak in `src/tools/overrides.mjs`, never in a generated file.
4. Update `test/allowlist.test.mjs`'s `EXPECTED_COUNT` deliberately (the test fails on an accidental change on purpose).
5. Add a service-backed `test/e2e/` case when the tool brings a new pattern (a new pagination shape, header idempotency, a stored output, binary content).
