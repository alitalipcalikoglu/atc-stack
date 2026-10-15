import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, test } from 'node:test';
import { EnvFile } from '../src/env-file.js';
import { SERVICES } from '../src/manifest.js';
import { SetupContext } from '../src/setup-context.js';
// Real gateway validation (Stage 9), not a reimplementation — same pattern as snapshot.test.js
// exercising other services' real `Database` through the workspace checkout.
import { RouteTable } from '../../atc-gateway/src/route-table.js';

const root = mkdtempSync(join(tmpdir(), 'atc-stack-'));
after(() => rmSync(root, { recursive: true, force: true }));

/** Templates mirroring the real .env.example files: only the variables the manifest touches. */
const TEMPLATES = /** @type {Record<string, string>} */ ({
  'atc-notify': '# notify\nPORT=3001\nHOST=0.0.0.0\nNOTIFY_API_KEYS=shop:REPLACE_WITH_64_HEX_CHARS,blog:REPLACE_WITH_64_HEX_CHARS\nSMTP_URL=smtps://user:password@smtp.example.com:465\nSMTP_FROM="Example App <no-reply@example.com>"\n',
  'atc-auth': 'PORT=3002\nHOST=0.0.0.0\nAUTH_API_KEYS=shop-backend:REPLACE_WITH_64_HEX_CHARS\nJWT_ISSUER=https://auth.example.com\nJWT_AUDIENCE=shop\nNOTIFY_URL=https://notify.internal:3001\nNOTIFY_API_KEY=REPLACE_WITH_NOTIFY_KEY_FOR_AUTH\nAPP_NAME=Shop\nVERIFY_URL_TEMPLATE=https://shop.example.com/verify-email?token={token}\nRESET_URL_TEMPLATE=https://shop.example.com/reset-password?token={token}\n',
  'atc-media': 'PORT=3003\nHOST=0.0.0.0\nPUBLIC_BASE_URL=https://media.example.com\nMEDIA_API_KEYS=shop-backend:REPLACE_WITH_64_HEX_CHARS\nSIGNING_SECRET=REPLACE_WITH_64_HEX_CHARS\nCORS_ORIGINS=https://shop.example.com\n',
  'atc-audit': 'PORT=3005\nHOST=0.0.0.0\nAUDIT_API_KEYS=auth:REPLACE_WITH_64_HEX_CHARS:write,console:REPLACE_WITH_64_HEX_CHARS:read\n',
  'atc-shortlink': 'PORT=3006\nHOST=0.0.0.0\nPUBLIC_BASE_URL=https://s.example.com\nSHORTLINK_API_KEYS=shop-backend:REPLACE_WITH_64_HEX_CHARS,console:REPLACE_WITH_64_HEX_CHARS\nHASH_SECRET=REPLACE_WITH_64_HEX_CHARS\n',
  'atc-flags': 'PORT=3007\nHOST=0.0.0.0\nFLAGS_API_KEYS=console:REPLACE_WITH_64_HEX_CHARS,shop-backend:REPLACE_WITH_64_HEX_CHARS:read:prod\n',
  'atc-scheduler': 'PORT=3008\nHOST=0.0.0.0\nSCHEDULER_API_KEYS=console:REPLACE_WITH_64_HEX_CHARS\nSIGNING_SECRET=REPLACE_WITH_64_HEX_CHARS\nTARGET_KEYS=flags:REPLACE_WITH_THE_SCHEDULER_KEY_FROM_FLAGS_API_KEYS\nTARGET_ALLOW_HTTP=false\nTARGET_ALLOW_PRIVATE=false\nTARGET_ALLOWED_HOSTS=\n',
  'atc-webhook-out': 'PORT=3009\nHOST=0.0.0.0\nSECRETS_KEY=REPLACE_WITH_64_HEX_CHARS\nWEBHOOK_API_KEYS=console:REPLACE_WITH_64_HEX_CHARS,shop-backend:REPLACE_WITH_64_HEX_CHARS:publish\nTARGET_ALLOW_HTTP=false\nTARGET_ALLOW_PRIVATE=false\nTARGET_ALLOWED_HOSTS=\n',
  'atc-search': 'PORT=3010\nHOST=0.0.0.0\nSEARCH_API_KEYS=console:REPLACE_WITH_64_HEX_CHARS,shop-backend:REPLACE_WITH_64_HEX_CHARS:write:products\n',
  'atc-ratelimit': 'PORT=3011\nHOST=0.0.0.0\nRATELIMIT_API_KEYS=console:REPLACE_WITH_64_HEX_CHARS,gateway:REPLACE_WITH_64_HEX_CHARS:check\n',
  'atc-geo': 'PORT=3012\nHOST=0.0.0.0\nMMDB_PATH=\nASN_MMDB_PATH=\nGEO_API_KEYS=console:REPLACE_WITH_64_HEX_CHARS,shop-backend:REPLACE_WITH_64_HEX_CHARS:read\n',
  'atc-content': 'PORT=3013\nHOST=0.0.0.0\nCONTENT_API_KEYS=atc-console:REPLACE_WITH_64_HEX_CHARS,web-frontend:REPLACE_WITH_64_HEX_CHARS:read\nCONTENT_PUBLIC_BUNDLES=false\n',
  'atc-export': 'PORT=3014\nHOST=0.0.0.0\nEXPORT_API_KEYS=atc-console:REPLACE_WITH_64_HEX_CHARS\nMEDIA_URL=http://127.0.0.1:3003\nMEDIA_API_KEY=REPLACE_WITH_THE_EXPORT_KEY_FROM_MEDIA_API_KEYS\nNOTIFY_URL=\nNOTIFY_API_KEY=\nSOURCE_AUTH_URL=\nSOURCE_AUTH_API_KEY=\n',
  'atc-render': 'PORT=3015\nHOST=0.0.0.0\nRENDER_API_KEYS=atc-console:REPLACE_WITH_64_HEX_CHARS,billing:REPLACE_WITH_64_HEX_CHARS:read\nMEDIA_URL=\nMEDIA_API_KEY=\n',
  'atc-queue': 'PORT=3016\nHOST=0.0.0.0\nQUEUE_API_KEYS=atc-console:REPLACE_WITH_64_HEX_CHARS:admin,mailer:REPLACE_WITH_64_HEX_CHARS:write:emails\n',
  'atc-backup': 'PORT=3017\nHOST=0.0.0.0\nBACKUP_API_KEYS=atc-console:REPLACE_WITH_64_HEX_CHARS:admin\nBACKUP_SOURCES=\nALLOW_LIVE_RESTORE=false\n',
  'atc-status': 'PORT=3018\nHOST=0.0.0.0\nSTATUS_API_KEYS=atc-console:REPLACE_WITH_64_HEX_CHARS:admin\nMONITOR_SEEDS=\nALERT_EMAILS=\n',
  'atc-payments': 'PORT=3019\nHOST=0.0.0.0\nPAYMENTS_API_KEYS=atc-console:REPLACE_WITH_64_HEX_CHARS:write\nSTRIPE_SECRET_KEY=\nSTRIPE_WEBHOOK_SECRET=\n',
  'atc-gateway': 'PORT=3000\nHOST=0.0.0.0\nMETRICS_TOKEN=\nAUTH_API_KEY=REPLACE_WITH_THE_GATEWAY_KEY_FROM_AUTH_API_KEYS\nMEDIA_API_KEY=REPLACE_WITH_THE_GATEWAY_KEY_FROM_MEDIA_API_KEYS\nNOTIFY_API_KEY=REPLACE_WITH_THE_GATEWAY_KEY_FROM_NOTIFY_API_KEYS\n',
  'atc-console': 'PORT=3004\nHOST=0.0.0.0\nCOOKIE_SECURE=true\nNOTIFY_API_KEY=REPLACE_WITH_THE_CONSOLE_KEY_FROM_NOTIFY_API_KEYS\nAUTH_API_KEY=REPLACE_WITH\nMEDIA_API_KEY=REPLACE_WITH\nGATEWAY_METRICS_TOKEN=REPLACE_WITH\nAUDIT_API_KEY=REPLACE_WITH\nSHORTLINK_API_KEY=REPLACE_WITH\nFLAGS_API_KEY=REPLACE_WITH\nSCHEDULER_API_KEY=REPLACE_WITH\nWEBHOOK_OUT_API_KEY=REPLACE_WITH\nSEARCH_API_KEY=REPLACE_WITH\n',
});
for (const [id, text] of Object.entries(TEMPLATES)) { mkdirSync(join(root, id), { recursive: true }); writeFileSync(join(root, id, '.env.example'), text); }
mkdirSync(join(root, 'atc-auth', 'keys'), { recursive: true }); writeFileSync(join(root, 'atc-auth', 'keys', 'jwt-private.pem'), 'x');
mkdirSync(join(root, 'atc-audit', 'keys'), { recursive: true }); writeFileSync(join(root, 'atc-audit', 'keys', 'anchor-private.pem'), 'x');
writeFileSync(join(root, 'atc-console', 'server.mjs'), '// canonical adapter-node wrapper\n');
mkdirSync(join(root, 'atc-console', 'build'), { recursive: true }); writeFileSync(join(root, 'atc-console', 'build', 'handler.js'), '// adapter-node handler\n');

test('EnvFile: parse, get, needs, set, serialise', () => {
  const e = EnvFile.parse('# c\nA=1\nB=REPLACE_WITH_X\nC=\nD="quoted value"\nKEYS=a:REPLACE_WITH_64,b:sec\n');
  assert.equal(e.get('A'), '1');
  assert.equal(e.get('D'), '"quoted value"', 'raw');
  assert.equal(e.toObject().D, 'quoted value', 'unquoted for consumers');
  assert.deepEqual(['A', 'B', 'C', 'Z', 'KEYS'].map((k) => e.needs(k)), [false, true, true, true, true]);
  e.set('A', '2').set('Z', 'new');
  assert.equal(e.toString(), '# c\nA=2\nB=REPLACE_WITH_X\nC=\nD="quoted value"\nKEYS=a:REPLACE_WITH_64,b:sec\nZ=new\n');
});

test('setup wires every service: secrets, keys, URLs, console files; second run keeps everything', async () => {
  /** @type {string[]} */ const ran = [];
  const ctx = new SetupContext({ root, host: '127.0.0.1', local: true, run: async (id, argv) => { ran.push(`${id} ${argv.join(' ')}`); } });
  await ctx.compute();
  /** @type {Record<string, string>} */ const written = {};
  ctx.save((p, t) => { written[p.replace(`${root}/`, '')] = t; mkdirSync(join(root, p.replace(`${root}/`, '').split('/')[0]), { recursive: true }); writeFileSync(p, t); });
  assert.deepEqual(ran, ['atc-console npm run build'], 'Console is rebuilt at every setup boundary so a surviving adapter-node handler cannot be stale');
  const env = (/** @type {string} */ id) => EnvFile.parse(written[`${id}/.env`]).toObject();
  const keys = (/** @type {string} */ id, /** @type {string} */ v) => Object.fromEntries(env(id)[v].split(',').map((e) => { const [h, s, ...r] = e.split(':'); return [h, { secret: s, role: r.join(':') }]; }));

  // Placeholders are gone everywhere.
  for (const id of Object.keys(TEMPLATES)) assert.equal(/REPLACE_WITH/.test(written[`${id}/.env`]), false, `${id} has no placeholders left`);
  // Console holds a key issued by every service it shows, with the right role.
  assert.equal(env('atc-console').FLAGS_API_KEY, keys('atc-flags', 'FLAGS_API_KEYS')['atc-console'].secret);
  assert.equal(keys('atc-audit', 'AUDIT_API_KEYS')['atc-console'].role, 'readwrite');
  assert.equal(env('atc-console').AUDIT_API_KEY, keys('atc-audit', 'AUDIT_API_KEYS')['atc-console'].secret);
  assert.equal(keys('atc-notify', 'NOTIFY_API_KEYS')['atc-console'].role, 'admin', 'the console sees every sender\'s messages');
  assert.equal(env('atc-audit').ANCHOR_PRIVATE_KEY_PATH, './keys/anchor-private.pem', 'chain anchors are on by default');
  assert.equal(env('atc-console').WEBHOOK_OUT_API_KEY, keys('atc-webhook-out', 'WEBHOOK_API_KEYS')['atc-console'].secret);
  assert.equal(env('atc-console').SEARCH_API_KEY, keys('atc-search', 'SEARCH_API_KEYS')['atc-console'].secret);
  assert.equal(env('atc-console').RATELIMIT_API_KEY, keys('atc-ratelimit', 'RATELIMIT_API_KEYS')['atc-console'].secret);
  assert.equal(env('atc-console').GEO_API_KEY, keys('atc-geo', 'GEO_API_KEYS')['atc-console'].secret);
  const auditKeys = keys('atc-audit', 'AUDIT_API_KEYS');
  {
    // A key issued earlier with another role is re-issued with the manifest's role, same secret.
    const ctx2 = new SetupContext({ root, host: '127.0.0.1', local: true, run: async () => {} });
    const before = ctx2.issue('atc-audit', 'someone', 'read');
    assert.equal(ctx2.issue('atc-audit', 'someone', 'write'), before);
    assert.match(ctx2.env('atc-audit').get('AUDIT_API_KEYS') ?? '', /someone:[0-9a-f]{64}:write/);
  }
  assert.deepEqual([auditKeys['atc-console'].role, auditKeys['atc-flags'].role, env('atc-flags').AUDIT_API_KEY, env('atc-flags').AUDIT_URL.endsWith(':3005')], ['readwrite', 'write', auditKeys['atc-flags'].secret, true], 'every service gets a write key for audit; the console reads and writes');
  assert.deepEqual([keys('atc-ratelimit', 'RATELIMIT_API_KEYS')['atc-gateway'].role, keys('atc-geo', 'GEO_API_KEYS')['atc-gateway'].role, env('atc-gateway').RATELIMIT_API_KEY, env('atc-gateway').GEO_URL.endsWith(':3012')], ['check', 'read', keys('atc-ratelimit', 'RATELIMIT_API_KEYS')['atc-gateway'].secret, true]);
  assert.equal(env('atc-geo').MMDB_PATH, '', 'operator-owned value kept empty');
  assert.deepEqual([env('atc-render').MEDIA_URL.endsWith(':3003'), env('atc-render').MEDIA_API_KEY, env('atc-console').RENDER_API_KEY, auditKeys['atc-render'].role], [true, keys('atc-media', 'MEDIA_API_KEYS')['atc-render'].secret, keys('atc-render', 'RENDER_API_KEYS')['atc-console'].secret, 'write']);
  assert.deepEqual(Object.keys(keys('atc-render', 'RENDER_API_KEYS')).sort(), ['atc-console', 'atc-scheduler'], 'template placeholders dropped; the scheduler may call render');
  assert.deepEqual([keys('atc-queue', 'QUEUE_API_KEYS')['atc-console'].role, env('atc-console').QUEUE_API_KEY, Object.keys(keys('atc-queue', 'QUEUE_API_KEYS')).sort()], ['admin', keys('atc-queue', 'QUEUE_API_KEYS')['atc-console'].secret, ['atc-console', 'atc-export', 'atc-scheduler']]);
  assert.equal(env('atc-media').KEY_MAX_UPLOAD_BYTES, 'atc-backup:1073741824', 'database backups fit through media');
  const bk = env('atc-backup');
  assert.deepEqual([bk.BACKUP_TREES, bk.BACKUP_ENCRYPTION_KEY], ['atc-media-files=../atc-media/data/files,atc-auth-keys=../atc-auth/keys,atc-audit-keys=../atc-audit/keys', ''], 'blobs and signing keys are archived; encryption is the operator\'s choice');
  assert.deepEqual([keys('atc-backup', 'BACKUP_API_KEYS')['atc-console'].role, env('atc-console').BACKUP_API_KEY, bk.MEDIA_API_KEY, bk.ALLOW_LIVE_RESTORE, auditKeys['atc-backup'].role], ['admin', keys('atc-backup', 'BACKUP_API_KEYS')['atc-console'].secret, keys('atc-media', 'MEDIA_API_KEYS')['atc-backup'].secret, 'false', 'write']);
  assert.deepEqual(bk.BACKUP_SOURCES.split(',').slice(0, 2), ['atc-notify=../atc-notify/data/notify.db', 'atc-auth=../atc-auth/data/auth.db']);
  assert.match(EnvFile.load(join(root, 'atc-auth', '.env')).get('MFA_SECRETS_KEY') ?? '', /^[0-9a-f]{64}$/, 'auth gets a key for end-user MFA');
  assert.equal(bk.BACKUP_SOURCES.split(',').length, 18, 'every service with a database, console included');
  const stx = env('atc-status');
  assert.deepEqual([keys('atc-status', 'STATUS_API_KEYS')['atc-console'].role, env('atc-console').STATUS_API_KEY, stx.NOTIFY_API_KEY, stx.ALERT_EMAILS, auditKeys['atc-status'].role], ['admin', keys('atc-status', 'STATUS_API_KEYS')['atc-console'].secret, keys('atc-notify', 'NOTIFY_API_KEYS')['atc-status'].secret, 'ops@example.com', 'write']);
  assert.deepEqual([stx.MONITOR_SEEDS.split(',').length, stx.MONITOR_SEEDS.split(',')[0], stx.MONITOR_SEEDS.includes('atc-status=')], [19, 'atc-notify=http://127.0.0.1:3001', false], 'every other service is monitored');
  assert.deepEqual([env('atc-gateway').AUDIT_API_KEY, auditKeys['atc-gateway'].role], [auditKeys['atc-gateway'].secret, 'write'], 'the gateway reports refusals to audit');
  // Events: every producer publishes with a key that may only publish; webhook-out delivers ops.* to the status alert hub with a shared secret.
  const wk = keys('atc-webhook-out', 'WEBHOOK_API_KEYS');
  for (const id of ['atc-backup', 'atc-queue', 'atc-scheduler', 'atc-flags', 'atc-content', 'atc-auth', 'atc-status', 'atc-audit']) {
    assert.deepEqual([env(id).WEBHOOK_OUT_API_KEY, wk[id]?.role, env(id).WEBHOOK_OUT_URL.endsWith(':3009')], [wk[id]?.secret, 'publish', true], `${id} publishes events`);
  }
  assert.equal(env('atc-webhook-out').SUBSCRIPTION_SEEDS, `alert-hub|http://127.0.0.1:3018/v1/hooks/webhook-out|ops.*|${env('atc-status').ALERT_HOOK_SECRET},search-content|http://127.0.0.1:3010/v1/hooks/webhook-out|content.release.*|${env('atc-search').SYNC_HOOK_SECRET}`, 'ops.* events reach the alert hub, content releases the search mirror');
  assert.deepEqual([env('atc-search').CONTENT_URL, env('atc-search').CONTENT_API_KEY === keys('atc-content', 'CONTENT_API_KEYS')['atc-search']?.secret, keys('atc-notify', 'NOTIFY_API_KEYS')['atc-export-reader']?.role, env('atc-export').SOURCE_NOTIFY_API_KEY === keys('atc-notify', 'NOTIFY_API_KEYS')['atc-export-reader']?.secret], ['http://127.0.0.1:3013', true, 'admin', true]);
  assert.match(env('atc-status').ALERT_HOOK_SECRET, /^[0-9a-f]{64}$/);
  // The scheduler can call the services a job typically needs, each with the least role; export reads more sources.
  const tk = Object.fromEntries(env('atc-scheduler').TARGET_KEYS.split(',').map((e) => e.split(':')));
  assert.deepEqual([tk['atc-backup'], keys('atc-backup', 'BACKUP_API_KEYS')['atc-scheduler'].role, keys('atc-queue', 'QUEUE_API_KEYS')['atc-scheduler'].role, keys('atc-payments', 'PAYMENTS_API_KEYS')['atc-scheduler'].role], [keys('atc-backup', 'BACKUP_API_KEYS')['atc-scheduler'].secret, 'admin', 'write', 'write']);
  const exs = env('atc-export');
  assert.deepEqual([exs.SOURCE_QUEUE_API_KEY, keys('atc-queue', 'QUEUE_API_KEYS')['atc-export'].role, exs.SOURCE_WEBHOOK_OUT_URL.endsWith(':3009'), keys('atc-scheduler', 'SCHEDULER_API_KEYS')['atc-export'].role], [keys('atc-queue', 'QUEUE_API_KEYS')['atc-export'].secret, 'read', true, 'read']);
  const px = env('atc-payments');
  assert.deepEqual([keys('atc-payments', 'PAYMENTS_API_KEYS')['atc-console'].role, env('atc-console').PAYMENTS_API_KEY, px.STRIPE_SECRET_KEY, px.STRIPE_WEBHOOK_SECRET, px.WEBHOOK_OUT_API_KEY, keys('atc-webhook-out', 'WEBHOOK_API_KEYS')['atc-payments'].role, auditKeys['atc-payments'].role],
    ['write', keys('atc-payments', 'PAYMENTS_API_KEYS')['atc-console'].secret, '', '', keys('atc-webhook-out', 'WEBHOOK_API_KEYS')['atc-payments'].secret, 'publish', 'write'], 'Stripe stays off until the operator sets keys');
  const ex = env('atc-export');
  assert.deepEqual([ex.EXPORT_API_KEYS.includes('atc-console:'), ex.MEDIA_API_KEY, ex.NOTIFY_API_KEY, ex.SOURCE_AUDIT_API_KEY, auditKeys['atc-export-reader'].role, auditKeys['atc-export'].role, keys('atc-auth', 'AUTH_API_KEYS')['atc-export'].role, keys('atc-flags', 'FLAGS_API_KEYS')['atc-export'].role, keys('atc-content', 'CONTENT_API_KEYS')['atc-export'].role, ex.SOURCE_SHORTLINK_URL.endsWith(':3006')],
    [true, keys('atc-media', 'MEDIA_API_KEYS')['atc-export'].secret, keys('atc-notify', 'NOTIFY_API_KEYS')['atc-export'].secret, auditKeys['atc-export-reader'].secret, 'read', 'write', 'read', 'read', 'read', true], 'export reads every source with read keys and writes files to media');
  assert.equal(env('atc-console').EXPORT_API_KEY, keys('atc-export', 'EXPORT_API_KEYS')['atc-console'].secret);
  assert.deepEqual(env('atc-media').ALLOWED_TYPES.split(','), ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif', 'application/pdf', 'text/csv', 'application/x-ndjson', 'application/vnd.sqlite3', 'application/gzip', 'application/vnd.atc-backup'], 'media accepts export files and database backups');
  assert.deepEqual(['atc-content', 'atc-export', 'atc-render'].map((id) => env(id).ACTOR_KEYS), ['atc-console', 'atc-console', 'atc-console'], 'records name the signed-in admin');
  const contentKeys = keys('atc-content', 'CONTENT_API_KEYS');
  assert.deepEqual([env('atc-console').CONTENT_API_KEY, contentKeys['atc-console'].role, contentKeys['atc-gateway'].role, env('atc-gateway').CONTENT_API_KEY, env('atc-content').CONTENT_PUBLIC_BUNDLES, auditKeys['atc-content'].role], [contentKeys['atc-console'].secret, '', 'read:public', contentKeys['atc-gateway'].secret, 'false', 'write'], 'console edits content, gateway only reads bundles, and only of the public namespace');
  assert.deepEqual(Object.keys(keys('atc-search', 'SEARCH_API_KEYS')), ['atc-console'], 'template placeholders dropped');
  assert.equal(env('atc-console').GATEWAY_METRICS_TOKEN, env('atc-gateway').METRICS_TOKEN);
  assert.equal(env('atc-console').COOKIE_SECURE, 'false');
  assert.match(env('atc-gateway').METRICS_TOKEN, /^[0-9a-f]{64}$/);
  // Template example keys are dropped; real holders kept.
  assert.deepEqual(Object.keys(keys('atc-flags', 'FLAGS_API_KEYS')).sort(), ['atc-console', 'atc-export', 'atc-scheduler']);
  assert.equal(keys('atc-flags', 'FLAGS_API_KEYS')['atc-scheduler'].role, 'write');
  assert.equal(keys('atc-webhook-out', 'WEBHOOK_API_KEYS')['atc-scheduler'].role, 'publish');
  // Cross-service holders.
  assert.equal(env('atc-auth').NOTIFY_API_KEY, keys('atc-notify', 'NOTIFY_API_KEYS')['atc-auth'].secret);
  assert.equal(env('atc-gateway').AUTH_API_KEY, keys('atc-auth', 'AUTH_API_KEYS')['atc-gateway'].secret);
  assert.equal(env('atc-scheduler').TARGET_KEYS, `atc-flags:${keys('atc-flags', 'FLAGS_API_KEYS')['atc-scheduler'].secret},atc-notify:${keys('atc-notify', 'NOTIFY_API_KEYS')['atc-scheduler'].secret},atc-webhook-out:${keys('atc-webhook-out', 'WEBHOOK_API_KEYS')['atc-scheduler'].secret}${['atc-export', 'atc-queue', 'atc-backup', 'atc-status', 'atc-render', 'atc-payments'].map((id) => `,${id}:${keys(id, /** @type {Record<string, string>} */ ({ 'atc-export': 'EXPORT_API_KEYS', 'atc-queue': 'QUEUE_API_KEYS', 'atc-backup': 'BACKUP_API_KEYS', 'atc-status': 'STATUS_API_KEYS', 'atc-render': 'RENDER_API_KEYS', 'atc-payments': 'PAYMENTS_API_KEYS' })[id])['atc-scheduler'].secret}`).join('')}`);
  // Local URLs and lax outbound settings.
  assert.equal(env('atc-auth').NOTIFY_URL, 'http://127.0.0.1:3001');
  assert.equal(env('atc-auth').JWT_ISSUER, 'http://127.0.0.1:3000');
  assert.equal(env('atc-media').PUBLIC_BASE_URL, 'http://127.0.0.1:3003');
  assert.equal(env('atc-notify').SMTP_URL, 'json:');
  assert.deepEqual([env('atc-scheduler').TARGET_ALLOW_PRIVATE, env('atc-scheduler').TARGET_ALLOWED_HOSTS, env('atc-webhook-out').TARGET_ALLOW_HTTP], ['true', '127.0.0.1,localhost', 'true']);
  assert.equal(env('atc-notify').HOST, '127.0.0.1');
  // Console services.json and gateway routes.
  const services = JSON.parse(written['atc-console/services.json']).services;
  assert.deepEqual(services.map((/** @type {any} */ s) => s.id), SERVICES.filter((s) => s.console).map((s) => s.id));
  assert.deepEqual(services.find((/** @type {any} */ s) => s.id === 'atc-gateway'), { id: 'atc-gateway', type: 'atc-gateway', label: 'Gateway', url: 'http://127.0.0.1:3000', metricsTokenEnv: 'GATEWAY_METRICS_TOKEN' });
  assert.deepEqual(services.find((/** @type {any} */ s) => s.id === 'atc-notify').polling, { enabled: true, intervalSec: 30 });
  const routes = JSON.parse(written['atc-gateway/routes.json']);
  assert.equal(routes.jwt.jwksUrl, 'http://127.0.0.1:3002/.well-known/jwks.json');
  assert.deepEqual(routes.routes.map((/** @type {any} */ r) => r.id), ['auth-public', 'media-user', 'media-files', 'content-bundles', 'jwks', 'status-page', 'payments-webhooks']);
  // stripPrefix removes only a literal substring of the caller's URL (gateway has no path-insert
  // capability); the caller must therefore include the target's real upstream path verbatim after
  // pathPrefix. Regression for the Stage 1.1 finding: a caller hitting the *short* form the route
  // "looks like" it should accept (`/api/auth/login`) is a caller bug, not a generator bug — this
  // pins the real, documented, working shape (`atc-gateway/examples/public-route-with-injected-key.md`).
  const authPublic = routes.routes.find((/** @type {any} */ r) => r.id === 'auth-public');
  assert.deepEqual(authPublic.policy, { name: 'auth-public', subject: 'ip', cost: 1, failOpen: true }, 'login routes use the shared rate-limit policy');
  assert.equal(env('atc-ratelimit').POLICY_SEEDS, 'auth-public=20/60', 'and the policy exists');
  assert.deepEqual([authPublic.pathPrefix, authPublic.stripPrefix], ['/api/auth/', '/api/auth']);
  assert.equal('/api/auth/v1/auth/login'.slice(authPublic.stripPrefix.length), '/v1/auth/login');
  const mediaUser = routes.routes.find((/** @type {any} */ r) => r.id === 'media-user');
  assert.deepEqual([mediaUser.pathPrefix, mediaUser.stripPrefix], ['/api/media/', '/api/media']);
  assert.equal('/api/media/v1/files'.slice(mediaUser.stripPrefix.length), '/v1/files');
  // Content bundles are public through the gateway with the gateway's read key; nothing but /v1/bundles/ is reachable.
  const bundles = routes.routes.find((/** @type {any} */ r) => r.id === 'content-bundles');
  assert.deepEqual([bundles.pathPrefix, bundles.stripPrefix, bundles.upstreams, bundles.methods, bundles.injectApiKey, bundles.auth], ['/api/content/v1/bundles/', '/api/content', ['http://127.0.0.1:3013'], ['GET', 'HEAD', 'OPTIONS'], 'CONTENT_API_KEY', undefined]);
  assert.equal('/api/content/v1/bundles/web/tr-CY'.slice(bundles.stripPrefix.length), '/v1/bundles/web/tr-CY');
  // Stage 9: generated routes.json must parse cleanly under the gateway's own (real) validation —
  // in particular, none of these routes declares `policy`, so the new failOpen-required rule never
  // rejects the local-stack default. Proven against the actual gateway code, not a copy of its rules.
  assert.doesNotThrow(() => RouteTable.parse(routes, { AUTH_API_KEY: 'a'.repeat(40), MEDIA_API_KEY: 'm'.repeat(40), CONTENT_API_KEY: 'c'.repeat(40) }));

  // Second run: nothing regenerated.
  const again = new SetupContext({ root, host: '127.0.0.1', local: true, run: async () => {} });
  await again.compute();
  /** @type {Record<string, string>} */ const written2 = {};
  again.save((p, t) => { written2[p.replace(`${root}/`, '')] = t; });
  assert.deepEqual(written2, written, 'idempotent');

  // Operator edits survive; a newly listed holder is appended without touching the others.
  const f = EnvFile.load(join(root, 'atc-flags', '.env'));
  f.set('FLAGS_API_KEYS', `${f.get('FLAGS_API_KEYS')},mobile:${'m'.repeat(64)}:read:prod`).save(join(root, 'atc-flags', '.env'));
  const third = new SetupContext({ root, host: '127.0.0.1', local: true, run: async () => {} });
  await third.compute();
  assert.equal(third.env('atc-flags').get('FLAGS_API_KEYS'), f.get('FLAGS_API_KEYS'));
  assert.equal(third.env('atc-console').get('FLAGS_API_KEY'), env('atc-console').FLAGS_API_KEY);
});

test('setup prepares missing JWT keys and always refreshes the console build', async () => {
  rmSync(join(root, 'atc-auth', 'keys'), { recursive: true });
  rmSync(join(root, 'atc-audit', 'keys'), { recursive: true });
  rmSync(join(root, 'atc-console', 'build'), { recursive: true });
  /** @type {string[]} */ const ran = [];
  const ctx = new SetupContext({ root, host: '127.0.0.1', local: true, run: async (id, argv) => { ran.push(`${id} ${argv.join(' ')}`); } });
  await ctx.compute();
  assert.deepEqual(ran, ['atc-auth npm run keygen', 'atc-audit npm run anchor-keygen -- keys/anchor', 'atc-console npm run build']);
});

test('setup rejects an obsolete Console checkout without the canonical adapter-node wrapper', async () => {
  rmSync(join(root, 'atc-console', 'server.mjs'));
  const ctx = new SetupContext({ root, host: '127.0.0.1', local: true, run: async () => {} });
  await assert.rejects(ctx.compute(), /canonical adapter-node wrapper server\.mjs is missing/);
  writeFileSync(join(root, 'atc-console', 'server.mjs'), '// canonical adapter-node wrapper\n');
});

test('server mode keeps secure defaults and operator URLs', async () => {
  const root2 = mkdtempSync(join(tmpdir(), 'atc-stack-srv-'));
  for (const [id, text] of Object.entries(TEMPLATES)) { mkdirSync(join(root2, id), { recursive: true }); writeFileSync(join(root2, id, '.env.example'), text); }
  mkdirSync(join(root2, 'atc-auth', 'keys'), { recursive: true }); writeFileSync(join(root2, 'atc-auth', 'keys', 'jwt-private.pem'), 'x');
  writeFileSync(join(root2, 'atc-console', 'server.mjs'), '// canonical adapter-node wrapper\n');
  mkdirSync(join(root2, 'atc-console', 'build'), { recursive: true }); writeFileSync(join(root2, 'atc-console', 'build', 'handler.js'), '// adapter-node handler\n');
  writeFileSync(join(root2, 'atc-media', '.env'), 'PORT=3003\nHOST=0.0.0.0\nPUBLIC_BASE_URL=https://media.mysite.com\nMEDIA_API_KEYS=shop:' + 's'.repeat(64) + '\nSIGNING_SECRET=' + 'a'.repeat(64) + '\nCORS_ORIGINS=https://mysite.com\n');
  const ctx = new SetupContext({ root: root2, host: '10.0.0.5', local: false, run: async () => {} });
  await ctx.compute();
  assert.equal(ctx.env('atc-media').get('PUBLIC_BASE_URL'), 'https://media.mysite.com');
  assert.equal(ctx.env('atc-media').get('SIGNING_SECRET'), 'a'.repeat(64));
  assert.equal(ctx.env('atc-media').get('CORS_ORIGINS'), 'https://mysite.com');
  assert.match(ctx.env('atc-media').get('MEDIA_API_KEYS') ?? '', new RegExp(`^shop:${'s'.repeat(64)},atc-export:[0-9a-f]{64},atc-render:[0-9a-f]{64},atc-backup:[0-9a-f]{64},atc-gateway:[0-9a-f]{64},atc-console:[0-9a-f]{64}$`));
  assert.equal(ctx.env('atc-scheduler').get('TARGET_ALLOW_PRIVATE'), 'false');
  assert.equal(ctx.env('atc-console').get('COOKIE_SECURE'), 'true');
  assert.equal(ctx.env('atc-auth').get('NOTIFY_URL'), 'http://10.0.0.5:3001');
  rmSync(root2, { recursive: true, force: true });
});

test('MCP config: an atc-mcp key per service with tools, smallest role, re-roled for read-only; 0600 mcp.env and .mcp.json', async () => {
  const { McpConfig } = await import('../src/mcp-config.js');
  const { Stack } = await import('../src/stack.js');
  const { statSync } = await import('node:fs');
  const stackDir = mkdtempSync(join(tmpdir(), 'atc-stack-mcp-'));
  try {
    const stack = new Stack({ root, stackDir, log: () => {} });
    const keyOf = (/** @type {string} */ id) => {
      const s = /** @type {any} */ (SERVICES.find((x) => x.id === id));
      const entry = (EnvFile.load(join(root, id, '.env')).get(s.keysVar) ?? '').split(',').find((e) => e.startsWith(`${McpConfig.HOLDER}:`));
      return entry ? { secret: entry.split(':')[1], role: entry.split(':')[2] ?? '' } : null;
    };
    const full = stack.mcpConfig({ readOnly: false });
    assert.equal(full.readOnly, false);
    for (const [id, r] of Object.entries(McpConfig.ROLES)) assert.equal(keyOf(id)?.role, r.full ?? '', `${id} full role`);
    assert.deepEqual([keyOf('atc-queue')?.role, keyOf('atc-status')?.role, keyOf('atc-backup')?.role, keyOf('atc-payments')?.role, keyOf('atc-ratelimit')?.role, keyOf('atc-auth')?.role], ['admin', 'admin', 'admin', 'write', 'readwrite', 'read']);
    assert.equal(keyOf('atc-console'), null, 'the console issues no MCP key');
    const env = EnvFile.load(join(stackDir, 'mcp.env')).toObject();
    assert.deepEqual([env.STACK_MCP_QUEUE_BASE_URL, env.STACK_MCP_QUEUE_API_KEY, env.STACK_MCP_WEBHOOK_OUT_API_KEY, env.STACK_MCP_CONSOLE_BASE_URL, env.STACK_MCP_READ_ONLY], ['http://127.0.0.1:3016', keyOf('atc-queue')?.secret, keyOf('atc-webhook-out')?.secret, 'http://127.0.0.1:3004', 'false']);
    const json = JSON.parse(readFileSync(join(stackDir, '.mcp.json'), 'utf8'));
    assert.deepEqual([json.mcpServers['atc-stack'].command, json.mcpServers['atc-stack'].args], ['node', ['--experimental-strip-types', '--disable-warning=ExperimentalWarning', join(stackDir, 'mcp', 'bin', 'stack-mcp.js')]]);
    assert.deepEqual(json.mcpServers['atc-stack'].env, env);
    for (const f of ['mcp.env', '.mcp.json']) assert.equal(statSync(join(stackDir, f)).mode & 0o777, 0o600, f);
    const queueSecret = keyOf('atc-queue')?.secret;

    const ro = stack.mcpConfig({ readOnly: true });
    assert.ok(ro.changed.includes('atc-queue') && !ro.changed.includes('atc-audit'), 'only re-roled services change');
    assert.deepEqual([keyOf('atc-queue')?.role, keyOf('atc-queue')?.secret, keyOf('atc-payments')?.role], ['read', queueSecret, 'read'], 'same secret, read role');
    const roEnv = EnvFile.load(join(stackDir, 'mcp.env')).toObject();
    assert.deepEqual([roEnv.STACK_MCP_NOTIFY_API_KEY === keyOf('atc-notify')?.secret, keyOf('atc-notify')?.role, roEnv.STACK_MCP_MEDIA_API_KEY, roEnv.STACK_MCP_READ_ONLY], [true, 'read', undefined, 'true'], 'notify gets a read key; role-less media gets none in read-only mode');
    assert.equal(stack.mcpConfig().readOnly, true, 'the saved mode is kept');
    assert.equal(stack.mcpConfig({ readOnly: false }).readOnly, false);
    assert.equal(keyOf('atc-queue')?.role, 'admin');
  } finally {
    rmSync(stackDir, { recursive: true, force: true });
  }
});

test('keys: list shows holders and roles without secrets; rotate replaces one key on both sides and nothing else', async () => {
  const { Stack } = await import('../src/stack.js');
  const keysDir = mkdtempSync(join(tmpdir(), 'atc-stack-keys-'));
  writeFileSync(join(keysDir, 'mcp.env'), 'STACK_MCP_READ_ONLY=false\n'); // the workspace was set up with full MCP keys; a fresh stack dir would default to read-only
  const stack = new Stack({ root, stackDir: keysDir, log: () => {}, exec: async () => ({ code: 0, out: '' }) });
  const list = stack.listKeys();
  assert.ok(list.some((k) => k.issuer === 'atc-media' && k.holder === 'atc-gateway'));
  assert.equal(JSON.stringify(list).match(/[0-9a-f]{64}/), null, 'no secrets in the listing');
  const secretOf = (/** @type {string} */ id, /** @type {string} */ variable, /** @type {string} */ holder) => (EnvFile.load(join(root, id, '.env')).get(variable) ?? '').split(',').map((e) => e.split(':')).find((p) => p[0] === holder)?.[1];
  const gateway = () => EnvFile.load(join(root, 'atc-gateway', '.env')).get('MEDIA_API_KEY');
  const before = { media: secretOf('atc-media', 'MEDIA_API_KEYS', 'atc-gateway'), gateway: gateway(), other: secretOf('atc-media', 'MEDIA_API_KEYS', 'atc-render'), audit: secretOf('atc-audit', 'AUDIT_API_KEYS', 'atc-gateway') };
  assert.equal(before.media, before.gateway);
  const r = await stack.rotateKey({ issuer: 'atc-media', holder: 'atc-gateway' });
  assert.deepEqual(r.changed.sort(), ['atc-gateway', 'atc-media']);
  const after = { media: secretOf('atc-media', 'MEDIA_API_KEYS', 'atc-gateway'), gateway: gateway() };
  assert.notEqual(after.media, before.media);
  assert.equal(after.media, after.gateway, 'issuer and holder agree on the new secret');
  assert.equal(secretOf('atc-audit', 'AUDIT_API_KEYS', 'atc-gateway'), before.audit, 'other keys keep their secret');
  await assert.rejects(stack.rotateKey({ issuer: 'atc-media', holder: 'nobody' }), /no key for "nobody"/);
});
