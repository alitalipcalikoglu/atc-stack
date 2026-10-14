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
  'atc-notify': '# notify\nPORT=3001\nHOST=0.0.0.0\nNOTIFY_API_KEYS=shop:REPLACE_WITH_64_HEX_CHARS,blog:REPLACE_WITH_64_HEX_CHARS\nSMTP_URL=smtps://user:password@smtp.example.com:465\nSMTP_FROM="Example App <no-reply@example.com>"\nWEBHOOK_SIGNING_SECRET=REPLACE_WITH_64_HEX_CHARS\nWEBHOOK_ALLOW_HTTP=false\n',
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
  'atc-gateway': 'PORT=3000\nHOST=0.0.0.0\nMETRICS_TOKEN=\nAUTH_API_KEY=REPLACE_WITH_THE_GATEWAY_KEY_FROM_AUTH_API_KEYS\nMEDIA_API_KEY=REPLACE_WITH_THE_GATEWAY_KEY_FROM_MEDIA_API_KEYS\nNOTIFY_API_KEY=REPLACE_WITH_THE_GATEWAY_KEY_FROM_NOTIFY_API_KEYS\n',
  'atc-console': 'PORT=3004\nHOST=0.0.0.0\nCOOKIE_SECURE=true\nNOTIFY_API_KEY=REPLACE_WITH_THE_CONSOLE_KEY_FROM_NOTIFY_API_KEYS\nAUTH_API_KEY=REPLACE_WITH\nMEDIA_API_KEY=REPLACE_WITH\nGATEWAY_METRICS_TOKEN=REPLACE_WITH\nAUDIT_API_KEY=REPLACE_WITH\nSHORTLINK_API_KEY=REPLACE_WITH\nFLAGS_API_KEY=REPLACE_WITH\nSCHEDULER_API_KEY=REPLACE_WITH\nWEBHOOK_OUT_API_KEY=REPLACE_WITH\nSEARCH_API_KEY=REPLACE_WITH\n',
});
for (const [id, text] of Object.entries(TEMPLATES)) { mkdirSync(join(root, id), { recursive: true }); writeFileSync(join(root, id, '.env.example'), text); }
mkdirSync(join(root, 'atc-auth', 'keys'), { recursive: true }); writeFileSync(join(root, 'atc-auth', 'keys', 'jwt-private.pem'), 'x');
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
  assert.deepEqual(Object.keys(keys('atc-search', 'SEARCH_API_KEYS')), ['atc-console'], 'template placeholders dropped');
  assert.equal(env('atc-console').GATEWAY_METRICS_TOKEN, env('atc-gateway').METRICS_TOKEN);
  assert.equal(env('atc-console').COOKIE_SECURE, 'false');
  assert.match(env('atc-gateway').METRICS_TOKEN, /^[0-9a-f]{64}$/);
  // Template example keys are dropped; real holders kept.
  assert.deepEqual(Object.keys(keys('atc-flags', 'FLAGS_API_KEYS')).sort(), ['atc-console', 'atc-scheduler']);
  assert.equal(keys('atc-flags', 'FLAGS_API_KEYS')['atc-scheduler'].role, 'write');
  assert.equal(keys('atc-webhook-out', 'WEBHOOK_API_KEYS')['atc-scheduler'].role, 'publish');
  // Cross-service holders.
  assert.equal(env('atc-auth').NOTIFY_API_KEY, keys('atc-notify', 'NOTIFY_API_KEYS')['atc-auth'].secret);
  assert.equal(env('atc-gateway').AUTH_API_KEY, keys('atc-auth', 'AUTH_API_KEYS')['atc-gateway'].secret);
  assert.equal(env('atc-scheduler').TARGET_KEYS, `atc-flags:${keys('atc-flags', 'FLAGS_API_KEYS')['atc-scheduler'].secret},atc-notify:${keys('atc-notify', 'NOTIFY_API_KEYS')['atc-scheduler'].secret},atc-webhook-out:${keys('atc-webhook-out', 'WEBHOOK_API_KEYS')['atc-scheduler'].secret}`);
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
  assert.deepEqual(routes.routes.map((/** @type {any} */ r) => r.id), ['auth-public', 'media-user', 'media-files', 'jwks']);
  // stripPrefix removes only a literal substring of the caller's URL (gateway has no path-insert
  // capability); the caller must therefore include the target's real upstream path verbatim after
  // pathPrefix. Regression for the Stage 1.1 finding: a caller hitting the *short* form the route
  // "looks like" it should accept (`/api/auth/login`) is a caller bug, not a generator bug — this
  // pins the real, documented, working shape (`atc-gateway/examples/public-route-with-injected-key.md`).
  const authPublic = routes.routes.find((/** @type {any} */ r) => r.id === 'auth-public');
  assert.deepEqual([authPublic.pathPrefix, authPublic.stripPrefix], ['/api/auth/', '/api/auth']);
  assert.equal('/api/auth/v1/auth/login'.slice(authPublic.stripPrefix.length), '/v1/auth/login');
  const mediaUser = routes.routes.find((/** @type {any} */ r) => r.id === 'media-user');
  assert.deepEqual([mediaUser.pathPrefix, mediaUser.stripPrefix], ['/api/media/', '/api/media']);
  assert.equal('/api/media/v1/files'.slice(mediaUser.stripPrefix.length), '/v1/files');
  // Stage 9: generated routes.json must parse cleanly under the gateway's own (real) validation —
  // in particular, none of these routes declares `policy`, so the new failOpen-required rule never
  // rejects the local-stack default. Proven against the actual gateway code, not a copy of its rules.
  assert.doesNotThrow(() => RouteTable.parse(routes, { AUTH_API_KEY: 'a'.repeat(40), MEDIA_API_KEY: 'm'.repeat(40) }));

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
  rmSync(join(root, 'atc-console', 'build'), { recursive: true });
  /** @type {string[]} */ const ran = [];
  const ctx = new SetupContext({ root, host: '127.0.0.1', local: true, run: async (id, argv) => { ran.push(`${id} ${argv.join(' ')}`); } });
  await ctx.compute();
  assert.deepEqual(ran, ['atc-auth npm run keygen', 'atc-console npm run build']);
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
  assert.match(ctx.env('atc-media').get('MEDIA_API_KEYS') ?? '', new RegExp(`^shop:${'s'.repeat(64)},atc-gateway:[0-9a-f]{64},atc-console:[0-9a-f]{64}$`));
  assert.equal(ctx.env('atc-scheduler').get('TARGET_ALLOW_PRIVATE'), 'false');
  assert.equal(ctx.env('atc-console').get('COOKIE_SECURE'), 'true');
  assert.equal(ctx.env('atc-auth').get('NOTIFY_URL'), 'http://10.0.0.5:3001');
  rmSync(root2, { recursive: true, force: true });
});
