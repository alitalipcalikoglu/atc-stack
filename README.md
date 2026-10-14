# atc-stack

One command to set up and run every atc-web service together with the console: installs dependencies, generates every secret and API key, wires the services to each other and to the console (`.env` files, gateway `routes.json`, console `services.json`), builds the console, creates the first administrator, and starts or supervises the whole set.

No runtime dependencies. Node 22.13+.

## Layout it expects

```
<any folder>/
  stack/          this repo
  notify/  auth/  media/  audit/  shortlink/  flags/  scheduler/  webhook-out/  search/  ratelimit/  geo/  gateway/  console/
```

Each sibling folder is a clone of `github.com/alitalipcalikoglu/<name>`. The workspace root can have any name and is not a repository; the stack finds the services relative to its own folder.

## Quick start

### Download, configure, and start the complete suite

Prerequisites: Git, npm, Node 22.17 or newer, and—unless `--no-start` is used—a globally available
PM2 (`npm i -g pm2`). Clone only this repository, install its CLI dependencies, then let the CLI
acquire the 14 sibling repositories:

```bash
git clone https://github.com/alitalipcalikoglu/atc-stack.git
cd atc-stack
npm ci
npm link            # exposes both `stack` and the existing `atc-stack` command names
stack install:all --admin-password '<choose-a-strong-password>'
```

`install:all` resolves the workspace from the actual stack checkout, not the shell's current
directory. It validates prerequisites before mutation, clones missing official repositories,
validates and reuses safe existing checkouts, runs `npm ci` from every sibling lockfile, delegates
configuration to the existing `setup` implementation, starts through the existing PM2 `up` path,
and waits (bounded) for all 20 HTTP services to report ready.

The default is the current supported **production release** (`1.20.0`): every sibling is checked
against the immutable tag and exact commit recorded in
[`installation-manifests/v1.15.0.json`](installation-manifests/v1.15.0.json), selected by the explicit
[`installation-manifests/supported.json`](installation-manifests/supported.json) pointer.
Every repository shares one version, and every repository, folder and service id carries the
`atc-` prefix (`atc-notify`, `atc-service-core`, …). The installation manifest is the source of
truth; the release notes under [`releases/`](releases/) are evidence and are deliberately not
consumed by the installer.

Explicit development installation resolves every sibling—including `atc-service-core`—to the current
official `main` branch and reports the exact resolved commits. It is moving and non-immutable:

```bash
stack install:all --ref main --admin-password '<choose-a-strong-password>'
```

Use that explicit development mode only when intentionally following moving `main` heads. The
supported `v1.20.0` release and current development mode both require Console's canonical
`server.mjs` plus adapter-node build; historical manifests remain unchanged and retain their own
matching runtime snapshots.

Options intentionally stay small:

- `--no-start`: clone/install/configure without requiring PM2 or starting services.
- `--split-workers`: forward the existing split-worker topology to `stack up`.
- `--dry-run`: perform read-only prerequisite, remote-ref, and existing-checkout validation and
  print the plan and resolved commits; no clone, fetch, install, setup, or startup occurs.
- Existing setup options `--host`, `--public`, `--admin-username`, and `--admin-password` are passed to
  the established setup path. `install:all` never prints a password; on a fresh install, supply
  `--admin-password` so the credential is known, or reset the generated credential afterward with
  Console's admin CLI.
- `--root <dir>` is available for an explicit workspace root; normally the parent of the executing
  stack checkout is correct.

Existing directories fail closed unless they are real, clean Git repositories with the exact
official `origin`. Release mode additionally requires HEAD and the locally/remote-resolved tag to
match the descriptor's exact commit. Development mode requires the checked-out branch to be
`main`; it fetches and performs only a fast-forward update. Dirty trees, detached/wrong branches,
diverged history, spoofed remotes, symlinks, non-Git directories, and commit/tag mismatches are
never reset, cleaned, stashed, overwritten, or deleted.

The command is safely rerunnable. Repositories cloned before a later network, npm, setup, startup,
or readiness failure are validated and reused on the next run; existing `.env` values, issued keys,
secrets, routes, service registry, and first administrator are preserved by the idempotent setup
machinery. Fix the phase-labelled error and rerun the same command. After a startup/readiness
failure, inspect `pm2 logs` and `node bin/stack.js status`; use `--no-start` when PM2 is intentionally
not installed.

### Configure an already-present workspace

```bash
git clone https://github.com/alitalipcalikoglu/atc-stack.git && cd atc-stack && npm ci
npm run setup      # dependencies, secrets, keys, .env files, routes, console build, first admin
npm run dev        # every service in this terminal, prefixed logs, Ctrl-C stops all
```

Then open `http://127.0.0.1:3004` and sign in with the credentials `setup` printed (shown once).

Production-style supervision with PM2 (`npm i -g pm2`):

```bash
npm run up         # pm2 startOrRestart in every folder, then status
npm run status     # /health and /ready of every service
npm run status -- --matrix  # version/API/schema/service-core/capabilities matrix, from each service's own /v1/info
npm run down       # pm2 delete every app
```

See [docs/API_CONTRACT.md](docs/API_CONTRACT.md) for the exact `/v1/info` contract every service
serves (`service`, `version`, `apiVersion`, `capabilities`, `schemaVersion`, `serviceCore`) and what
the matrix does with it — an operator visibility tool, never a startup check or a runtime coupling
mechanism: a `serviceCore` major mismatch is a printed warning, nothing refuses to start or run.

Backup and restore:

```bash
npm run backup                                   # snapshot every service's database and other state
npm run restore -- backups/<timestamp>            # stop, restore, start, wait for /ready
```

See [docs/UPGRADE.md](docs/UPGRADE.md) for what's covered, restore's validation and atomicity, and
rollback after a bad upgrade.

Operator maintenance (post-production Phase 4 — today: media only):

```bash
atc-stack maintenance media    # one-shot: purge + trash reconciliation, safe alongside a live server
```

Runs media's real production `Maintenance`/`MediaService#purge()` directly against its `.env`/data
directory — no HTTP route, no new auth system; see [atc-media/README.md](../atc-media/README.md#maintenance).

## What `setup` does

1. **Dependencies**: `npm ci` in every folder that has no `node_modules` (or all with `--install`).
2. **Preparation**: `npm run keygen` in `atc-auth` when `keys/jwt-private.pem` is missing, `npm run anchor-keygen -- keys/anchor` in `atc-audit` when `keys/anchor-private.pem` is missing (signed chain anchors are on by default); `npm run build` in `atc-console` when `public/` is missing.
3. **Env files**: each service's `.env` is loaded (or started from its `.env.example`), then the stack sets `PORT`, `HOST`, every secret that is empty or still a `REPLACE_WITH…` placeholder, the URLs services use to reach each other, and the API keys:
   - every service that issues keys (`*_API_KEYS`) gets an entry per holder: `atc-console` (role `read` for audit, default elsewhere), `atc-gateway` (auth, media, notify), `atc-auth` (notify), `atc-scheduler` (flags `write`, notify, webhook-out `publish`);
   - holders receive the same secret: console `*_API_KEY` variables and `GATEWAY_METRICS_TOKEN`, gateway `AUTH_API_KEY`/`MEDIA_API_KEY`/`NOTIFY_API_KEY`, auth `NOTIFY_API_KEY`, scheduler `TARGET_KEYS`.
4. **Files**: `atc-gateway/routes.json` (auth, media, JWKS through the gateway) and `atc-console/services.json` (every service with its local URL and key variable).
5. **MCP**: an `atc-mcp` key on every service that has MCP tools, and the untracked, 0600 `mcp.env` and `.mcp.json` here (see "MCP server").
6. **First admin**: username `admin` (or `--admin-username`) with a generated password, printed once. Nothing is created when an administrator already exists.

Running `setup` again is safe: existing secrets, keys and any value you edited by hand are kept; only placeholders and missing entries are filled. Delete a line from a `.env` to get the stack's default back. Console's adapter-node application is rebuilt on every setup boundary so a build artifact left by an older source checkout is never accepted as current.

## Local versus server

By default the stack is **local**: `HOST=127.0.0.1`, plain HTTP everywhere, `COOKIE_SECURE=false`, notify's mail transport `json:` (mails are logged, not sent), and the outbound guards of scheduler and webhook-out opened for loopback (`TARGET_ALLOW_HTTP=true`, `TARGET_ALLOW_PRIVATE=true`, `TARGET_ALLOWED_HOSTS=127.0.0.1,localhost`) so jobs and webhooks can reach the other services and local receivers.

`npm run setup -- --public --host 10.0.0.5` keeps every security default from the templates (HTTPS-only outbound, secure cookies, allowlists empty until you fill them), uses the given host for service-to-service URLs, keeps `PUBLIC_BASE_URL`s you set, and does not rewrite an existing `atc-gateway/routes.json`. Put a TLS-terminating proxy in front and set `TRUST_PROXY=true` per service.

Options: `--root <dir>` (default: the parent of this checkout), `--admin-username <name>` (default `admin`), `--admin-password <password>` (otherwise generated), `--install`.

## Docker Compose

`npm run compose` writes `compose/docker-compose.yml`, which builds every service from its own `Dockerfile` (`atc-web/<id>:local` images) and runs them on one network:

```bash
npm run setup                     # once: secrets, keys and the JWT key pair the containers reuse
npm run compose                   # or: npm run compose -- --port-offset 10000 when the PM2 stack uses the ports
docker compose -f compose/docker-compose.yml up -d --build
docker compose -f compose/docker-compose.yml exec atc-console node --disable-warning=ExperimentalWarning scripts/admin.js create admin
```

- Generated next to it: one env file per service (`compose/env/<id>.env`, mode 0600, the same secrets as the local `.env` files; relative host paths are dropped so the images' own `/data`, `/config` and `/keys` apply), the gateway's `routes.json` and the console's `services.json` under `compose/config/`. Everything in `compose/` is untracked. The compose file itself holds no secrets.
- Services call each other by container name (`http://atc-media:3003`); scheduler and webhook-out may reach those names. Only the gateway (3000), the console (3004) and media (3003, for signed file URLs; `PUBLIC_BASE_URL` points at the published port) are published, on 127.0.0.1. `--port-offset N` adds `N` to those host ports.
- One named volume per service (`<id>-data` at `/data`); atc-auth's keys are mounted read-only from `atc-auth/keys`. atc-backup mounts every data volume at `/sources/<id>` and backs them all up.
- Start order: the gateway waits for auth; backup and status wait until every other service is healthy, so their first backups and checks find everything up. `stop_grace_period` is 35 s, matching PM2's `kill_timeout`.
- Stripe stays off until `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` are set in `atc-payments/.env` and `npm run compose` runs again.

## Load test

`npm run load` drives the gateway with plain `fetch` loops (no load-test dependency) and prints, per route, requests, rate, p50/p95/p99/max latency, errors (network failures and 5xx), 429s and other 4xx. It exits non-zero when any route had errors.

```bash
npm run load -- --url http://127.0.0.1:3000 --duration 30 --concurrency 20
npm run load -- --routes "GET /health,GET /status/summary.json" --json
```

`--profile writes` instead drives the services that take a SQLite write on every request, directly and with the console's admin keys: `atc-ratelimit` checks, `atc-queue` enqueue and pull, and `atc-shortlink` clicks (it creates a `loadtest` policy, a `loadtest` queue and a `loadtest` short link first; delete them afterwards). Use it to watch p95/p99 and 5xx while the writers compete for each database's single write lock, and compare with the idle numbers before deciding that a service needs a different storage model.

```bash
npm run load -- --profile writes --duration 20 --concurrency 20
```

The services keep their own per-IP limits (`RATE_LIMIT_MAX`, shortlink `REDIRECT_RATE_LIMIT_MAX`), so the `429` column fills quickly on one machine. To measure the write lock itself, raise those limits in the three `.env` files for the test, restart, and put them back afterwards.

```
http://127.0.0.1:3000  5s  5 loops per route
route           requests     rps  p50 ms  p95 ms  p99 ms  max ms  errors    429  other 4xx
gateway health     23428  4671.3     0.8     2.4     3.8    37.8       0      0          0
status json        23235  4628.7     0.8     2.4     4.5    16.8       0  22933          0
```

Default routes are public and change nothing: `/health`, `/.well-known/jwks.json`, `/status/summary.json`, `/status`. Every loop runs from one address, so the gateway's per-route and per-IP limits answer 429 quickly (counted apart, not as errors): that column shows the limits working, the rest shows the cost of a request through the gateway. Measure upstream latency with routes that have no limit, or raise the route's `rateLimit` in `routes.json` for the run.

## Service list

| Service | Port | Repository | What it does | Calls |
|---|---|---|---|---|
| atc-gateway | 3000 | [atc-gateway](https://github.com/alitalipcalikoglu/atc-gateway) | Public edge: routes, JWT verification, service-key injection, CORS, per-IP limits, central rate limit policies, geo headers | auth (JWKS), ratelimit, geo, audit (refusals, route reloads), every upstream (auth, media, content, status, payments webhooks) |
| atc-notify | 3001 | [atc-notify](https://github.com/alitalipcalikoglu/atc-notify) | Queued e-mail with templates and retries. API/worker split-capable. | audit |
| atc-auth | 3002 | [atc-auth](https://github.com/alitalipcalikoglu/atc-auth) | Users, passwords, ES256 JWT + JWKS, refresh tokens, e-mail verification, password reset | notify, webhook-out, audit |
| atc-media | 3003 | [atc-media](https://github.com/alitalipcalikoglu/atc-media) | Uploads, deduplication, image variants, signed URLs, upload tickets | audit |
| atc-console | 3004 | [atc-console](https://github.com/alitalipcalikoglu/atc-console) | Admin web app for every service: own admins, 2FA, console log | every service, audit |
| atc-audit | 3005 | [atc-audit](https://github.com/alitalipcalikoglu/atc-audit) | Append-only event log with a hash chain, filters, export, retention | webhook-out |
| atc-shortlink | 3006 | [atc-shortlink](https://github.com/alitalipcalikoglu/atc-shortlink) | Short links, click statistics, QR codes | audit |
| atc-flags | 3007 | [atc-flags](https://github.com/alitalipcalikoglu/atc-flags) | Feature flags and typed settings per environment, rollouts, targeting rules | webhook-out, audit |
| atc-scheduler | 3008 | [atc-scheduler](https://github.com/alitalipcalikoglu/atc-scheduler) | Cron and one-shot jobs calling HTTP targets with signatures and retries. API/worker split-capable. | flags, notify, webhook-out (targets and events), export, queue, backup, status, render, payments (targets), audit |
| atc-webhook-out | 3009 | [atc-webhook-out](https://github.com/alitalipcalikoglu/atc-webhook-out) | The durable, general-purpose outbound-webhook service: subscriptions, signed deliveries, retries, replay. API/worker split-capable. | audit, status (delivers `ops.*` to the alert hub) |
| atc-search | 3010 | [atc-search](https://github.com/alitalipcalikoglu/atc-search) | Full-text search over your documents with facets and highlights (SQLite FTS5) | audit |
| atc-ratelimit | 3011 | [atc-ratelimit](https://github.com/alitalipcalikoglu/atc-ratelimit) | Central rate limits and quotas: policies, sliding windows, overrides, blocks | audit |
| atc-geo | 3012 | [atc-geo](https://github.com/alitalipcalikoglu/atc-geo) | IP geolocation (MMDB), countries, currencies, time zones, phone normalization, places | audit |
| atc-content | 3013 | [atc-content](https://github.com/alitalipcalikoglu/atc-content) | Translations and content strings: namespaces, locale fallback chains, placeholder checks, numbered releases, ETag bundles (public through the gateway at `/api/content/v1/bundles/`) | webhook-out, audit |
| atc-export | 3014 | [atc-export](https://github.com/alitalipcalikoglu/atc-export) | Background data exports: CSV/NDJSON from audit events, users, links, flags, media metadata, translation keys, payments and ledger, status incidents and alerts, queue messages, scheduler runs and webhook deliveries, streamed into private media files by a leased worker; retention | media, notify, audit (events + forwarding), auth, shortlink, flags, content, payments, status, queue, scheduler, webhook-out |
| atc-render | 3015 | [atc-render](https://github.com/alitalipcalikoglu/atc-render) | PDF rendering from versioned JSON layout templates: Unicode fonts, tables across pages, images, QR; streamed or stored in media | media, audit |
| atc-queue | 3016 | [atc-queue](https://github.com/alitalipcalikoglu/atc-queue) | Durable message queue: delays, priorities, dedupe keys, leased pulls with ack/nack/extend, retries, dead letters with redrive | webhook-out, audit |
| atc-backup | 3017 | [atc-backup](https://github.com/alitalipcalikoglu/atc-backup) | Scheduled online SQLite backups of every service database: integrity check, SHA-256, retention, download, verify, restore to a file or guarded live restore | media, webhook-out, audit |
| atc-status | 3018 | [atc-status](https://github.com/alitalipcalikoglu/atc-status) | Uptime monitors for every service's /health and /ready and any URL, automatic incidents, e-mail alerts, public status page at /status through the gateway | notify, webhook-out, audit |
| atc-payments | 3019 | [atc-payments](https://github.com/alitalipcalikoglu/atc-payments) | Stripe payment intents and refunds over REST: idempotency keys, signed webhooks at /api/payments/v1/webhooks/stripe, state machine, ledger, events | Stripe (operator keys), webhook-out, audit |
| atc-stack | – | [atc-stack](https://github.com/alitalipcalikoglu/atc-stack) | This installer and runner | – |

Every service is its own repository and deployable alone; "Calls" lists the services it talks to over HTTP when configured (all optional except auth → notify for verification and reset mails). Browsers only ever reach the gateway and the console.

## API keys

`npm run keys` lists who may call which service (holder, role, expiry; never secrets). `npm run keys -- rotate <issuer> <holder>` mints a new secret for one key and writes it on both sides: the issuer's key list and the holder's `.env` (and the MCP files when they hold it). Example after a leak: `npm run keys -- rotate atc-media atc-gateway`, then `npm run up` so both services restart and the old secret stops working. Nothing else changes. A key line may end in `@YYYY-MM-DD` to expire after that day once the service runs an `atc-service-core` release that understands it; `setup` never writes expiry dates itself.

## Ports

| Service | Port | | Service | Port |
|---|---|---|---|---|
| atc-gateway | 3000 | | atc-audit | 3005 |
| atc-notify | 3001 | | atc-shortlink | 3006 |
| atc-auth | 3002 | | atc-flags | 3007 |
| atc-media | 3003 | | atc-scheduler | 3008 |
| atc-console | 3004 | | atc-webhook-out | 3009 |
| | | | atc-search | 3010 |
| | | | atc-ratelimit | 3011 |
| | | | atc-geo | 3012 |
| | | | atc-content | 3013 |
| | | | atc-export | 3014 |
| | | | atc-render | 3015 |
| | | | atc-queue | 3016 |
| | | | atc-backup | 3017 |
| | | | atc-status | 3018 |
| | | | atc-payments | 3019 |

## Adding a service

A new service is part of the stack from its first release. In the same delivery:

1. Add its entry to `src/manifest.js`: `id` (folder, PM2 name, console id), `port`, `keysVar` when it issues API keys, `env(ctx)` for the values a local stack needs (secrets via `ctx.secret`, keys via `ctx.issue`, URLs via `ctx.url`/`ctx.publicUrl`, operator-kept values via `ctx.keep`, outbound guards via `ctx.outbound`), `files(ctx)` for generated files, `prepare(ctx)` for one-off steps, and `atc-console` when the console shows it (type, label, key variable, polling).
2. Add the holders it needs to other entries: the console's key comes from `console.keyEnv` automatically; a key for another service is one `ctx.issue(...)` in that service's `env`.
3. Add the port to the table above and a template line to `test/stack.test.js` so the wiring test covers it.
4. Run `npm run setup` and `npm run dev`; every service, old and new, must report `ready`.

## Releasing

Every repository shares one version. A release runs locally in three resumable steps; progress is
kept in `.release/v<version>.json` (untracked), so a failed step can simply be run again.

1. Write the release notes to `releases/v<version>.md`.
2. `npm run release:prepare -- <version>`: checks that all 22 repositories are clean and in sync on
   `main`; bumps `atc-service-core`, runs its tests, tags and pushes it; bumps every service to that
   tag and runs `npm ci`, tests, typecheck and the production audit; then writes the candidate
   `installation-manifests/v<version>.json`, moves `supported.json`, removes the previous manifest
   and release files and pushes the candidate commit.
3. `npm run release:verify -- <version>`: integration suite, contracts, client pilots, MCP E2E,
   every Console smoke, all 20 Docker images (healthy as `node`, exit 0 on SIGTERM), and a fresh
   `install:all --ref main` from GitHub whose commits must match the candidate manifest. Stop the
   local stack first; the install uses ports 3000-3019.
4. `npm run release:publish -- <version>`: tags the 20 services and stack at the manifest commits,
   checks the remote tags, runs a fresh default `install:all` (exact tags, three suites, reuse),
   writes `releases/v<version>.json`, updates `PROJECT_STATE.md` and pushes. Existing tags are never
   moved.

`test/docs-version.test.js` fails when a document still names an older suite version.

## Code layout

| Class | File | Role |
|---|---|---|
| `EnvFile` | `src/env-file.js` | `.env` read/modify/write that keeps comments and order |
| `SERVICES` | `src/manifest.js` | The service list: ports, keys, env, files, console entry |
| `SetupContext` | `src/setup-context.js` | In-memory envs, secrets, key issuing, routes and services.json, save |
| `Stack` | `src/stack.js` | `setup`, `up`, `down`, `dev`, `status`, `matrix`, `backup`, `restore`, `maintenance`, first admin |
| `Snapshot` | `src/snapshot.js` | Whole-workspace backup creation and validated restore |
| `Release` | `src/release.js` | `release:prepare`, `release:verify`, `release:publish` |
| `McpConfig` | `src/mcp-config.js` | `atc-mcp` keys per service, `mcp.env`, `.mcp.json` |
| `Compose`, `ComposeContext` | `src/compose.js` | `compose`: docker-compose.yml, env files and config for containers |
| `LoadTest` | `src/load-test.js` | `load`: fetch loops per route, latency percentiles, errors |
| `Cli` | `bin/stack.js` | Argument parsing |

## MCP server

[`mcp/`](mcp/README.md) is one local STDIO [Model Context Protocol](https://modelcontextprotocol.io) server over the generated typed clients: 155 tools, read tools for every service plus safe writes (create, update, enqueue, publish, start an export, render a stored document, create a monitor or a payment intent). Nothing destructive or irreversible is exposed (no delete, purge, refund, cancel, restore, revoke, rotate or key/role change); atc-auth is read-only with secrets filtered; atc-console only answers the status probe. `mcp/tool-policy.mjs` holds the per-service decision with a reason for every excluded write class.

### Configuration is generated

`npm run setup` issues a dedicated `atc-mcp` key on every service that has tools. A first setup is **read-only**: every key is a `read` key, and write access is an explicit `npm run mcp:config -- --full`. The full roles are the smallest that cover the tools (`read` for audit and auth, `admin` for queue, status and backup, `write` for payments, `readwrite` elsewhere; notify and media keys have no roles), and writes two files at the root of this checkout:

- `mcp.env`: `STACK_MCP_<SERVICE>_BASE_URL` for every service and `STACK_MCP_<SERVICE>_API_KEY` for every service with tools.
- `.mcp.json`: the standard `mcpServers` entry (`command: node`, `args: [--experimental-strip-types, --disable-warning=ExperimentalWarning, <this checkout>/mcp/bin/stack-mcp.js]`, `env` from `mcp.env`).

`npm run mcp:config` re-issues the keys and rewrites both files without a full setup; `-- --read-only` switches every MCP key to `read` (role-less notify and media get no key, and ratelimit's peek check needs more than `read`, so it answers 403; this is the default of a first setup), `-- --full` gives the write roles, and the choice is kept by later setups. `-- --print` prints the `.mcp.json` document. A role change edits the service's `.env`: restart it (`npm run up`) before using the MCP server.

> **The two files hold API keys.** They are written owner-only (0600) and ignored by git. Do not commit them, paste them into tickets, or copy them to another machine; run `npm run mcp:config` there instead. Keep the default read-only mode unless the agent needs to write.

### Adding it to a client

Install the server's own dependencies once: `cd mcp && npm install`.

- **Claude Code**, user scope: `claude mcp add-json atc-stack "$(node -e "console.log(JSON.stringify(require('./.mcp.json').mcpServers['atc-stack']))")"` (run in this checkout). For the project scope, Claude Code reads `.mcp.json` from the folder it is started in: start it here, or copy the file to your project root (it stays untracked; keep it out of git there too).
- **Claude Desktop**: merge the `mcpServers.atc-stack` entry from `.mcp.json` into `claude_desktop_config.json` (macOS `~/Library/Application Support/Claude/`, Windows `%APPDATA%\Claude\`) and restart the app.
- **Other MCP clients** (Cursor, VS Code, Windsurf, Zed, any SDK client): use the same `command`, `args` and `env` from `.mcp.json` as a STDIO server; most accept the `mcpServers` shape as it is.

Node 22.13+ must be on `PATH` as `node` for the client that starts the server.

```bash
npm run mcp:test                         # policy, catalog, allowlist and boundary checks
STACK_INTEGRATION=1 npm run mcp:e2e      # real services and a real MCP client over STDIO
npm run mcp:catalog                      # regenerate the tools and catalog after a spec or policy change
```

## Documentation

- [docs/OBSERVABILITY.md](docs/OBSERVABILITY.md) — the request-id/`traceparent` propagation rules and structured-log field vocabulary every service is measured against.
- [docs/EVENTS.md](docs/EVENTS.md) — the event catalog: who publishes which event to atc-webhook-out, and how `ops.*` events reach people through the atc-status alert hub.
- [docs/UPGRADE.md](docs/UPGRADE.md) — how migrations apply on upgrade, what `backup`/`restore` cover, restore's validation and atomicity, and rollback.
- [docs/READINESS_TEMPLATE.md](docs/READINESS_TEMPLATE.md) — the 19-section production-readiness contract; every service has its own filled copy at `<service>/docs/READINESS.md`.
- [docs/READINESS.md](docs/READINESS.md) — index into every service's own `docs/READINESS.md`, one real line each.
- [docs/API_CONTRACT.md](docs/API_CONTRACT.md) — the `/v1/info` contract (Stage 7) every service serves, and what `stack status --matrix` does with it.
- [docs/COMPATIBILITY.md](docs/COMPATIBILITY.md) — what `stack status --matrix` reports and the compatibility semantics around it (major/minor `serviceCore` mismatch, API vs. schema compatibility, mixed-version rollout coverage).
- [test/integration/](test/integration/) — cross-service integration tests that spawn real service processes (`STACK_INTEGRATION=1 npm test`; plain `npm test` stays fast and spawns nothing).

## License

MIT, see [LICENSE](LICENSE).

## IP databases for atc-geo

Docker: put `city.mmdb` (and optionally `asn.mmdb`) into `atc-geo/mmdb/` before `npm run compose`; the directory is mounted read-only at `/mmdb` and `MMDB_PATH` / `ASN_MMDB_PATH` are set for you. Without a city file the container runs without IP geolocation. PM2: set `MMDB_PATH` (and `ASN_MMDB_PATH`) in `atc-geo/.env`; setup keeps your values. The service flags files older than `MMDB_MAX_AGE_DAYS` in `/ready`.
