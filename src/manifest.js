/**
 * Every service in the stack, in start order. Adding a service means adding one entry here
 * (and, for services the console shows, the console entry's `keys` list and `services.json`).
 *
 * @typedef {object} Service
 * @property {string} id            Folder name under the workspace root, PM2 app name, console service id.
 * @property {number} port
 * @property {string} [entry]       Runtime entry relative to the service root. Defaults to
 *   `src/index.js`; Console explicitly uses its adapter-node wrapper.
 * @property {string} [keysVar]     Env variable holding `id:secret[:role…]` API keys this service issues.
 * @property {(ctx: import('./setup-context.js').SetupContext) => Record<string, string>} env
 *   Values written to the service's `.env` for a local stack (secrets and cross-service keys included).
 * @property {(ctx: import('./setup-context.js').SetupContext) => Record<string, string>} [files]
 *   Extra files to write into the service folder, by relative path.
 * @property {(ctx: import('./setup-context.js').SetupContext) => Promise<void>} [prepare]
 *   One-off preparation before the env is computed (key pairs, builds).
 * @property {{ type: string, label: string, keyEnv?: string, metricsTokenEnv?: string, polling?: { enabled: boolean, intervalSec: number } }} [console]
 *   How the service appears in the console's `services.json`.
 * @property {boolean} [splitWorkers]
 *   True for a service whose `ecosystem.config.cjs` ships a commented-out split template
 *   (`<id>-api` + `<id>-worker`, via `src/api-main.js`/`src/worker-main.js` — Stage 6). Read by
 *   `Stack#up({ splitWorkers: true })` to generate that split ecosystem at runtime instead of
 *   requiring an operator to hand-edit the file. Services without this flag only ever run their
 *   single combined app, `--split-workers` or not.
 */

/**
 * Every service forwards its write and security events to the audit service with its own write-role key.
 * @param {import('./setup-context.js').SetupContext} c
 * @param {string} id
 * @returns {{ AUDIT_URL: string, AUDIT_API_KEY: string }}
 */
const auditEnv = (c, id) => ({ AUDIT_URL: String(c.url('atc-audit')), AUDIT_API_KEY: String(c.issue('atc-audit', id, 'write')) });

/** Where a service publishes its events (docs/EVENTS.md): atc-webhook-out, with a key that may only publish. */
const eventsEnv = (c, id) => ({ WEBHOOK_OUT_URL: String(c.url('atc-webhook-out')), WEBHOOK_OUT_API_KEY: String(c.issue('atc-webhook-out', id, 'publish')) });

/**
 * Media must accept export files and database backups: append those types to whatever the operator allows.
 * @param {string} list
 */
const withDataTypes = (list) => [...new Set([...list.split(',').map((t) => t.trim()).filter(Boolean), 'text/csv', 'application/x-ndjson', 'application/vnd.sqlite3', 'application/gzip', 'application/vnd.atc-backup'])].join(',');

/** Files and directories atc-backup archives besides the databases: the media blobs and the signing keys (relative to the workspace). */
export const BACKUP_TREES = Object.freeze({
  'atc-media-files': 'atc-media/data/files', 'atc-auth-keys': 'atc-auth/keys', 'atc-audit-keys': 'atc-audit/keys',
});

/** Each service's SQLite file under its folder (its DB_PATH default); atc-backup reads them in place. */
export const DATA_FILES = Object.freeze({
  'atc-notify': 'notify.db', 'atc-auth': 'auth.db', 'atc-media': 'media.db', 'atc-audit': 'audit.db', 'atc-shortlink': 'shortlink.db', 'atc-flags': 'flags.db',
  'atc-scheduler': 'scheduler.db', 'atc-webhook-out': 'webhook-out.db', 'atc-search': 'search.db', 'atc-ratelimit': 'ratelimit.db', 'atc-geo': 'geo.db',
  'atc-content': 'content.db', 'atc-export': 'export.db', 'atc-render': 'render.db', 'atc-queue': 'queue.db', 'atc-status': 'status.db', 'atc-payments': 'payments.db', 'atc-console': 'console.db',
});

/** @type {Service[]} */
export const SERVICES = [
  {
    id: 'atc-notify', port: 3001, keysVar: 'NOTIFY_API_KEYS', splitWorkers: true,
    env: (c) => ({ ...auditEnv(c, 'atc-notify'), SMTP_URL: c.keep('atc-notify', 'SMTP_URL', 'json:'), SMTP_FROM: c.keep('atc-notify', 'SMTP_FROM', '"atc-web <no-reply@localhost>"') }),
    console: { type: 'atc-notify', label: 'Notify', keyEnv: 'NOTIFY_API_KEY', polling: { enabled: true, intervalSec: 30 } },
  },
  {
    id: 'atc-auth', port: 3002, keysVar: 'AUTH_API_KEYS',
    prepare: async (c) => { if (!c.exists('atc-auth', 'keys/jwt-private.pem')) await c.run('atc-auth', ['npm', 'run', 'keygen']); },
    env: (c) => ({
      ...auditEnv(c, 'atc-auth'), ...eventsEnv(c, 'atc-auth'),
      NOTIFY_URL: c.url('atc-notify'), NOTIFY_API_KEY: c.issue('atc-notify', 'atc-auth'), JWT_ISSUER: c.url('atc-gateway'), JWT_AUDIENCE: c.keep('atc-auth', 'JWT_AUDIENCE', 'app'),
      APP_NAME: c.keep('atc-auth', 'APP_NAME', 'atc-web'), // Links in verification mails point at your web app, which auth insists is https; a local stack has no app yet.
      VERIFY_URL_TEMPLATE: c.keep('atc-auth', 'VERIFY_URL_TEMPLATE', `https://${c.host}/verify-email?token={token}`), RESET_URL_TEMPLATE: c.keep('atc-auth', 'RESET_URL_TEMPLATE', `https://${c.host}/reset-password?token={token}`),
    }),
    console: { type: 'atc-auth', label: 'Auth', keyEnv: 'AUTH_API_KEY' },
  },
  {
    id: 'atc-media', port: 3003, keysVar: 'MEDIA_API_KEYS',
    env: (c) => ({
      ...auditEnv(c, 'atc-media'), PUBLIC_BASE_URL: c.publicUrl('atc-media'), SIGNING_SECRET: c.secret('atc-media', 'SIGNING_SECRET'), CORS_ORIGINS: c.keep('atc-media', 'CORS_ORIGINS', c.url('atc-gateway')),
      // Database backups (atc-backup) are far larger than the default upload limit.
      KEY_MAX_UPLOAD_BYTES: 'atc-backup:1073741824',
      ALLOWED_TYPES: withDataTypes(c.keep('atc-media', 'ALLOWED_TYPES', 'image/jpeg,image/png,image/webp,image/gif,image/avif,application/pdf')),
    }),
    console: { type: 'atc-media', label: 'Media', keyEnv: 'MEDIA_API_KEY' },
  },
  {
    id: 'atc-audit', port: 3005, keysVar: 'AUDIT_API_KEYS',
    // Signed chain anchors: without them the hash chain alone cannot prove the log was not rewritten by whoever can write the database.
    prepare: async (c) => { if (!c.exists('atc-audit', 'keys/anchor-private.pem')) await c.run('atc-audit', ['npm', 'run', 'anchor-keygen', '--', 'keys/anchor']); },
    env: (c) => ({ ...eventsEnv(c, 'atc-audit'), ANCHOR_PRIVATE_KEY_PATH: c.keep('atc-audit', 'ANCHOR_PRIVATE_KEY_PATH', './keys/anchor-private.pem') }),
    console: { type: 'atc-audit', label: 'Audit', keyEnv: 'AUDIT_API_KEY', polling: { enabled: true, intervalSec: 60 } },
  },
  {
    id: 'atc-shortlink', port: 3006, keysVar: 'SHORTLINK_API_KEYS',
    env: (c) => ({ ...auditEnv(c, 'atc-shortlink'), PUBLIC_BASE_URL: c.publicUrl('atc-shortlink'), HASH_SECRET: c.secret('atc-shortlink', 'HASH_SECRET') }),
    console: { type: 'atc-shortlink', label: 'Shortlink', keyEnv: 'SHORTLINK_API_KEY' },
  },
  {
    id: 'atc-flags', port: 3007, keysVar: 'FLAGS_API_KEYS',
    env: (c) => ({ ...auditEnv(c, 'atc-flags'), ...eventsEnv(c, 'atc-flags'),}),
    console: { type: 'atc-flags', label: 'Flags', keyEnv: 'FLAGS_API_KEY' },
  },
  {
    id: 'atc-scheduler', port: 3008, keysVar: 'SCHEDULER_API_KEYS', splitWorkers: true,
    env: (c) => ({
      SIGNING_SECRET: c.secret('atc-scheduler', 'SIGNING_SECRET'),
      ...auditEnv(c, 'atc-scheduler'), ...eventsEnv(c, 'atc-scheduler'),
      // Named bearer keys a job can use against internal services: the least role the typical scheduled call needs.
      TARGET_KEYS: [
        ['atc-flags', 'write'], ['atc-notify'], ['atc-webhook-out', 'publish'], ['atc-export', 'readwrite'], ['atc-queue', 'write'],
        ['atc-backup', 'admin'], ['atc-status', 'admin'], ['atc-render', 'readwrite'], ['atc-payments', 'write'],
      ].map(([id, role]) => `${id}:${c.issue(String(id), 'atc-scheduler', role)}`).join(','),
      ...c.outbound('atc-scheduler'),
    }),
    console: { type: 'atc-scheduler', label: 'Scheduler', keyEnv: 'SCHEDULER_API_KEY' },
  },
  {
    id: 'atc-webhook-out', port: 3009, keysVar: 'WEBHOOK_API_KEYS', splitWorkers: true,
    env: (c) => ({
      ...auditEnv(c, 'atc-webhook-out'), SECRETS_KEY: c.secret('atc-webhook-out', 'SECRETS_KEY'), ...c.outbound('atc-webhook-out'),
      // The alert hub: every ops.* event is delivered, signed, to atc-status, which e-mails and lists it.
      SUBSCRIPTION_SEEDS: `alert-hub|${c.url('atc-status')}/v1/hooks/webhook-out|ops.*|${c.secret('atc-status', 'ALERT_HOOK_SECRET')}`,
    }),
    console: { type: 'atc-webhook-out', label: 'Webhooks', keyEnv: 'WEBHOOK_OUT_API_KEY' },
  },
  {
    id: 'atc-search', port: 3010, keysVar: 'SEARCH_API_KEYS',
    env: (c) => ({ ...auditEnv(c, 'atc-search'),}),
    console: { type: 'atc-search', label: 'Search', keyEnv: 'SEARCH_API_KEY' },
  },
  {
    id: 'atc-ratelimit', port: 3011, keysVar: 'RATELIMIT_API_KEYS',
    // Policies the generated gateway routes name; created when missing, never overwritten.
    env: (c) => ({ ...auditEnv(c, 'atc-ratelimit'), POLICY_SEEDS: 'auth-public=20/60' }),
    console: { type: 'atc-ratelimit', label: 'Rate limits', keyEnv: 'RATELIMIT_API_KEY' },
  },
  {
    id: 'atc-geo', port: 3012, keysVar: 'GEO_API_KEYS',
    // MMDB_PATH stays as the operator sets it (empty = no IP geolocation; see atc-geo/examples/ip-databases.md).
    env: (c) => ({ ...auditEnv(c, 'atc-geo'), MMDB_PATH: c.keep('atc-geo', 'MMDB_PATH', ''), ASN_MMDB_PATH: c.keep('atc-geo', 'ASN_MMDB_PATH', '') }),
    console: { type: 'atc-geo', label: 'Geo', keyEnv: 'GEO_API_KEY' },
  },
  {
    id: 'atc-content', port: 3013, keysVar: 'CONTENT_API_KEYS',
    // Bundles reach applications through the gateway route below; direct anonymous reads stay off unless the operator turns them on.
    env: (c) => ({ ...auditEnv(c, 'atc-content'), ...eventsEnv(c, 'atc-content'), CONTENT_PUBLIC_BUNDLES: c.keep('atc-content', 'CONTENT_PUBLIC_BUNDLES', 'false'), ACTOR_KEYS: 'atc-console' }),
    console: { type: 'atc-content', label: 'Content', keyEnv: 'CONTENT_API_KEY' },
  },
  {
    id: 'atc-export', port: 3014, keysVar: 'EXPORT_API_KEYS',
    env: (c) => ({
      ...auditEnv(c, 'atc-export'),
      ACTOR_KEYS: 'atc-console', // the console names the signed-in admin in X-Actor
      MEDIA_URL: c.url('atc-media'), MEDIA_API_KEY: c.issue('atc-media', 'atc-export'),
      NOTIFY_URL: c.url('atc-notify'), NOTIFY_API_KEY: c.issue('atc-notify', 'atc-export'),
      // Read keys on every source service; each export pages through that service's own list API.
      SOURCE_AUDIT_URL: c.url('atc-audit'), SOURCE_AUDIT_API_KEY: c.issue('atc-audit', 'atc-export-reader', 'read'),
      SOURCE_AUTH_URL: c.url('atc-auth'), SOURCE_AUTH_API_KEY: c.issue('atc-auth', 'atc-export', 'read'),
      SOURCE_SHORTLINK_URL: c.url('atc-shortlink'), SOURCE_SHORTLINK_API_KEY: c.issue('atc-shortlink', 'atc-export', 'read'),
      SOURCE_FLAGS_URL: c.url('atc-flags'), SOURCE_FLAGS_API_KEY: c.issue('atc-flags', 'atc-export', 'read'),
      SOURCE_MEDIA_URL: c.url('atc-media'), SOURCE_MEDIA_API_KEY: c.issue('atc-media', 'atc-export'),
      SOURCE_CONTENT_URL: c.url('atc-content'), SOURCE_CONTENT_API_KEY: c.issue('atc-content', 'atc-export', 'read'),
      SOURCE_PAYMENTS_URL: c.url('atc-payments'), SOURCE_PAYMENTS_API_KEY: c.issue('atc-payments', 'atc-export', 'read'),
      SOURCE_STATUS_URL: c.url('atc-status'), SOURCE_STATUS_API_KEY: c.issue('atc-status', 'atc-export', 'read'),
      SOURCE_QUEUE_URL: c.url('atc-queue'), SOURCE_QUEUE_API_KEY: c.issue('atc-queue', 'atc-export', 'read'),
      SOURCE_SCHEDULER_URL: c.url('atc-scheduler'), SOURCE_SCHEDULER_API_KEY: c.issue('atc-scheduler', 'atc-export', 'read'),
      SOURCE_WEBHOOK_OUT_URL: c.url('atc-webhook-out'), SOURCE_WEBHOOK_OUT_API_KEY: c.issue('atc-webhook-out', 'atc-export', 'read'),
    }),
    console: { type: 'atc-export', label: 'Exports', keyEnv: 'EXPORT_API_KEY' },
  },
  {
    id: 'atc-render', port: 3015, keysVar: 'RENDER_API_KEYS',
    // Media is its only network peer: image blocks by file id and stored renders.
    env: (c) => ({ ...auditEnv(c, 'atc-render'), ACTOR_KEYS: 'atc-console', MEDIA_URL: c.url('atc-media'), MEDIA_API_KEY: c.issue('atc-media', 'atc-render') }),
    console: { type: 'atc-render', label: 'Render', keyEnv: 'RENDER_API_KEY' },
  },
  {
    id: 'atc-queue', port: 3016, keysVar: 'QUEUE_API_KEYS',
    env: (c) => ({ ...auditEnv(c, 'atc-queue'), ...eventsEnv(c, 'atc-queue') }),
    console: { type: 'atc-queue', label: 'Queues', keyEnv: 'QUEUE_API_KEY' },
  },
  {
    id: 'atc-backup', port: 3017, keysVar: 'BACKUP_API_KEYS',
    env: (c) => ({
      ...auditEnv(c, 'atc-backup'), ...eventsEnv(c, 'atc-backup'),
      BACKUP_SOURCES: Object.entries(DATA_FILES).map(([id, file]) => `${id}=../${id}/data/${file}`).join(','),
      BACKUP_TREES: Object.entries(BACKUP_TREES).map(([id, path]) => `${id}=../${path}`).join(','),
      // Operator-owned: set 64 hex characters to encrypt backups at rest, and keep that key outside this host's backup volume.
      BACKUP_ENCRYPTION_KEY: c.keep('atc-backup', 'BACKUP_ENCRYPTION_KEY', ''),
      // Off-host copies: every successful backup also goes to media as a private file.
      MEDIA_URL: c.url('atc-media'), MEDIA_API_KEY: c.issue('atc-media', 'atc-backup'),
      ALLOW_LIVE_RESTORE: c.keep('atc-backup', 'ALLOW_LIVE_RESTORE', 'false'),
    }),
    console: { type: 'atc-backup', label: 'Backups', keyEnv: 'BACKUP_API_KEY' },
  },
  {
    id: 'atc-status', port: 3018, keysVar: 'STATUS_API_KEYS',
    env: (c) => ({
      ...auditEnv(c, 'atc-status'), ...eventsEnv(c, 'atc-status'),
      // /health and /ready of every other service, as public monitors on the status page.
      MONITOR_SEEDS: SERVICES.filter((s) => s.id !== 'atc-status').map((s) => `${s.id}=${c.url(s.id)}`).join(','),
      NOTIFY_URL: c.url('atc-notify'), NOTIFY_API_KEY: c.issue('atc-notify', 'atc-status'),
      ALERT_EMAILS: c.keep('atc-status', 'ALERT_EMAILS', 'ops@example.com'),
      ALERT_HOOK_SECRET: c.secret('atc-status', 'ALERT_HOOK_SECRET'),
    }),
    console: { type: 'atc-status', label: 'Status', keyEnv: 'STATUS_API_KEY' },
  },
  {
    id: 'atc-payments', port: 3019, keysVar: 'PAYMENTS_API_KEYS',
    env: (c) => ({
      ...auditEnv(c, 'atc-payments'),
      // Operator-owned: empty = provider (and webhook endpoint) disabled; /ready reports it.
      STRIPE_SECRET_KEY: c.keep('atc-payments', 'STRIPE_SECRET_KEY', ''),
      STRIPE_WEBHOOK_SECRET: c.keep('atc-payments', 'STRIPE_WEBHOOK_SECRET', ''),
      STRIPE_API_URL: c.keep('atc-payments', 'STRIPE_API_URL', 'https://api.stripe.com'),
      WEBHOOK_OUT_URL: c.url('atc-webhook-out'), WEBHOOK_OUT_API_KEY: c.issue('atc-webhook-out', 'atc-payments', 'publish'),
    }),
    console: { type: 'atc-payments', label: 'Payments', keyEnv: 'PAYMENTS_API_KEY' },
  },
  {
    id: 'atc-gateway', port: 3000,
    env: (c) => ({
      METRICS_TOKEN: c.secret('atc-gateway', 'METRICS_TOKEN'), AUTH_API_KEY: c.issue('atc-auth', 'atc-gateway'), MEDIA_API_KEY: c.issue('atc-media', 'atc-gateway'), NOTIFY_API_KEY: c.issue('atc-notify', 'atc-gateway'),
      // Routes may declare "policy" (central rate limits) and "atc-geo": true (X-Geo-* headers); the keys are issued here so routes.json can use them at once.
      RATELIMIT_URL: c.url('atc-ratelimit'), RATELIMIT_API_KEY: c.issue('atc-ratelimit', 'atc-gateway', 'check'), GEO_URL: c.url('atc-geo'), GEO_API_KEY: c.issue('atc-geo', 'atc-gateway', 'read'),
      CONTENT_API_KEY: c.issue('atc-content', 'atc-gateway', 'read'), // injected on the public content-bundles route
      ...auditEnv(c, 'atc-gateway'), // 401/413/429 refusals and route reloads
    }),
    files: (c) => ({ 'routes.json': `${JSON.stringify(c.gatewayRoutes(), null, 2)}\n` }),
    console: { type: 'atc-gateway', label: 'Gateway', metricsTokenEnv: 'GATEWAY_METRICS_TOKEN' },
  },
  {
    id: 'atc-console', port: 3004, entry: 'server.mjs',
    env: (c) => ({
      COOKIE_SECURE: c.local ? 'false' : 'true',
      GATEWAY_METRICS_TOKEN: c.secret('atc-gateway', 'METRICS_TOKEN'),
      ...Object.fromEntries(c.consoleServices().filter((s) => s.console?.keyEnv).map((s) => [/** @type {string} */ (s.console?.keyEnv), c.issue(s.id, 'atc-console', c.consoleRole(s.id))])),
    }),
    files: (c) => ({ 'services.json': `${JSON.stringify(c.consoleServicesJson(), null, 2)}\n` }),
    prepare: async (c) => {
      if (!c.exists('atc-console', 'server.mjs')) throw new Error('console: canonical adapter-node wrapper server.mjs is missing');
      // A surviving handler can belong to an older source checkout. Setup is the production
      // preparation boundary, so rebuild here instead of treating file existence as freshness.
      await c.run('atc-console', ['npm', 'run', 'build']);
    },
  },
];

/** Roles the console's key needs per service; everything else gets the issuer's default role. */
export const CONSOLE_ROLES = /** @type {Record<string, string>} */ ({
  'atc-audit': 'readwrite', // reads events and forwards its own log
  'atc-notify': 'admin', // sees the messages every other service sent, and retries them
  'atc-queue': 'admin', // manages queues, purges and redrives dead letters
  'atc-backup': 'admin', // runs, downloads, verifies, restores and deletes backups
  'atc-status': 'admin', // creates, changes, checks and deletes monitors
  'atc-payments': 'write', // creates, cancels, syncs and refunds payments
});
