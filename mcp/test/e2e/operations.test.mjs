// Real, service-backed end-to-end test of the generated operation tools over real STDIO with the
// official MCP client: queue (PUT upsert, enqueue, cursor list), payments (required idempotency key
// sent as a header, against a local fake Stripe -- never real keys), render (a stored document
// returned as a reference, never bytes) and auth (read-only, secrets filtered).
// Runs only with `STACK_INTEGRATION=1 npm run mcp:e2e`.
import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { freePort, randomSecret, ServiceProcess, stopAll } from '../../../test/integration/harness.js';
import { FakeStripe } from '../../../../atc-payments/test/fake-stripe.js';

const shouldRun = Boolean(process.env.STACK_INTEGRATION);
const skip = shouldRun ? false : 'set STACK_INTEGRATION=1 to run (spawns real service processes + a real stack-mcp child process)';
const WORKSPACE_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..', '..', '..');
const MCP_BIN = join(WORKSPACE_ROOT, 'atc-stack', 'mcp', 'bin', 'stack-mcp.js');

/** @type {string} */ let scratch;
/** @type {ServiceProcess[]} */ const services = [];
/** @type {Record<string, string>} */ let mcpEnv = {};
/** @type {FakeStripe} */ let stripe;
/** @type {string} */ let authKey = '';
/** @type {string} */ let authUrl = '';

/** @param {string} name @param {string} entryEnvPrefix @param {Record<string, string>} env */
async function start(name, entryEnvPrefix, env) {
  const port = await freePort();
  const proc = new ServiceProcess({ name, cwd: join(WORKSPACE_ROOT, name), entry: 'src/index.js', port, env: { PATH: process.env.PATH ?? '', PORT: String(port), HOST: '127.0.0.1', LOG_LEVEL: 'warn', ...env } });
  await proc.start();
  services.push(proc);
  mcpEnv[`STACK_MCP_${entryEnvPrefix}_BASE_URL`] = proc.baseUrl;
  return proc;
}

before(async () => {
  if (!shouldRun) return;
  scratch = mkdtempSync(join(tmpdir(), 'atc-mcp-ops-'));
  mcpEnv = { PATH: process.env.PATH ?? '' };
  stripe = await new FakeStripe().start();

  const queueKey = randomSecret();
  await start('atc-queue', 'QUEUE', { DB_PATH: join(scratch, 'queue.db'), QUEUE_API_KEYS: `mcp:${queueKey}:admin` });
  mcpEnv.STACK_MCP_QUEUE_API_KEY = queueKey;

  const payKey = randomSecret();
  await start('atc-payments', 'PAYMENTS', { DB_PATH: join(scratch, 'payments.db'), PAYMENTS_API_KEYS: `mcp:${payKey}:write`, STRIPE_SECRET_KEY: FakeStripe.SECRET_KEY, STRIPE_API_URL: stripe.url });
  mcpEnv.STACK_MCP_PAYMENTS_API_KEY = payKey;

  const mediaKey = randomSecret();
  const mediaDir = join(scratch, 'media');
  mkdirSync(mediaDir, { recursive: true });
  const media = await start('atc-media', 'MEDIA', { PUBLIC_BASE_URL: 'http://127.0.0.1:1', DB_PATH: join(scratch, 'media.db'), DATA_DIR: mediaDir, MEDIA_API_KEYS: `render:${mediaKey}`, SIGNING_SECRET: randomSecret(32), STORAGE_DRIVER: 'local', ALLOWED_TYPES: 'application/pdf' });
  delete mcpEnv.STACK_MCP_MEDIA_BASE_URL; // the tools under test reach media only through render
  const renderKey = randomSecret();
  await start('atc-render', 'RENDER', { DB_PATH: join(scratch, 'render.db'), RENDER_API_KEYS: `mcp:${renderKey}:readwrite`, MEDIA_URL: media.baseUrl, MEDIA_API_KEY: mediaKey });
  mcpEnv.STACK_MCP_RENDER_API_KEY = renderKey;

  const notifyKey = randomSecret();
  const notify = await start('atc-notify', 'NOTIFY', { DB_PATH: join(scratch, 'notify.db'), NOTIFY_API_KEYS: `auth:${notifyKey}`, SMTP_URL: 'json:', SMTP_FROM: 'noreply@example.test' });
  authKey = randomSecret();
  const auth = await start('atc-auth', 'AUTH', {
    DB_PATH: join(scratch, 'auth.db'), AUTH_API_KEYS: `mcp:${authKey}:readwrite`, JWT_PRIVATE_KEY_PATH: join(WORKSPACE_ROOT, 'atc-auth', 'keys', 'jwt-private.pem'),
    JWT_ISSUER: 'http://issuer.example.test', JWT_AUDIENCE: 'app', NOTIFY_URL: notify.baseUrl, NOTIFY_API_KEY: notifyKey, APP_NAME: 'MCP test',
    VERIFY_URL_TEMPLATE: 'https://app.example.test/verify?token={token}', RESET_URL_TEMPLATE: 'https://app.example.test/reset?token={token}',
  });
  authUrl = auth.baseUrl;
  mcpEnv.STACK_MCP_AUTH_API_KEY = authKey;
});

after(async () => {
  if (!shouldRun) return;
  await stopAll(services);
  await stripe?.close();
  rmSync(scratch, { recursive: true, force: true });
});

async function connect() {
  const transport = new StdioClientTransport({ command: process.execPath, args: ['--disable-warning=ExperimentalWarning', '--experimental-strip-types', MCP_BIN], env: mcpEnv, stderr: 'pipe' });
  const client = new Client({ name: 'mcp-ops-test', version: '0.0.0' });
  await client.connect(transport);
  return client;
}

/** @param {Client} client @param {string} name @param {Record<string, unknown>} args @returns {Promise<any>} */
const call = (client, name, args) => client.callTool({ name, arguments: args });

test('queue: upsert a queue (PUT), enqueue, list with a cursor, read the queue', { skip }, async () => {
  const client = await connect();
  try {
    const up = await call(client, 'atc-queue.queues.upsert', { name: 'mcp-jobs', description: 'from MCP', maxAttempts: 3 });
    assert.equal(up.isError, undefined, JSON.stringify(up.structuredContent));
    assert.deepEqual([up.structuredContent.status, up.structuredContent.data.queue.maxAttempts], [201, 3]);
    for (const n of [1, 2, 3]) assert.equal((await call(client, 'atc-queue.messages.enqueue', { name: 'mcp-jobs', body: { n }, priority: n })).structuredContent.status, 201);
    const page = await call(client, 'atc-queue.messages.list', { name: 'mcp-jobs', limit: '2' });
    assert.deepEqual([page.structuredContent.data.items.length, typeof page.structuredContent.data.nextCursor], [2, 'string']);
    const rest = await call(client, 'atc-queue.messages.list', { name: 'mcp-jobs', limit: '2', cursor: page.structuredContent.data.nextCursor });
    assert.deepEqual([rest.structuredContent.data.items.length, rest.structuredContent.data.nextCursor], [1, null]);
    assert.equal((await call(client, 'atc-queue.queues.get', { name: 'mcp-jobs' })).structuredContent.data.depth.ready, 3);
    const bad = await call(client, 'atc-queue.queues.get', { name: 'Bad Name' });
    assert.equal(bad.isError, true, 'invalid path value rejected by the input schema');
  } finally {
    await client.close();
  }
});

test('payments: create needs an idempotency key, sent as the Idempotency-Key header; a repeat returns the same payment', { skip }, async () => {
  const client = await connect();
  try {
    const missing = await call(client, 'atc-payments.payments.create', { amount: 1500, currency: 'eur' });
    assert.equal(missing.isError, true);
    const args = { idempotencyKey: 'mcp-order-1', amount: 1500, currency: 'eur', description: 'MCP order' };
    const first = await call(client, 'atc-payments.payments.create', args);
    assert.equal(first.isError, undefined, JSON.stringify(first.structuredContent));
    const again = await call(client, 'atc-payments.payments.create', args);
    assert.equal(again.structuredContent.data.payment.id, first.structuredContent.data.payment.id);
    assert.equal(stripe.requests.filter((r) => r.path === '/v1/payment_intents').length, 1, 'one PaymentIntent at the provider');
    const got = await call(client, 'atc-payments.payments.get', { id: first.structuredContent.data.payment.id });
    assert.equal(got.structuredContent.data.payment.status, 'pending');
  } finally {
    await client.close();
  }
});

test('render: a template, then a document stored in media and returned as a reference (no bytes)', { skip }, async () => {
  const client = await connect();
  try {
    const t = await call(client, 'atc-render.templates.create', { name: 'mcp-note', layout: { blocks: [{ type: 'heading', text: 'Hello {{name}}' }] } });
    assert.equal(t.isError, undefined, JSON.stringify(t.structuredContent));
    const r = await call(client, 'atc-render.render.create', { template: 'mcp-note', data: { name: 'Ada' } });
    assert.equal(r.isError, undefined, JSON.stringify(r.structuredContent));
    assert.equal(r.structuredContent.status, 201);
    const text = JSON.stringify(r.structuredContent.data);
    assert.ok(text.length < 4_000 && !text.includes('%PDF'), 'a reference, not the document');
  } finally {
    await client.close();
  }
});

test('auth: users and sessions are readable; no secret-looking field ever comes back; no write tool exists', { skip }, async () => {
  const created = await fetch(`${authUrl}/v1/users`, { method: 'POST', headers: { authorization: `Bearer ${authKey}`, 'content-type': 'application/json' }, body: JSON.stringify({ email: 'ada@example.test', password: 'Correct-Horse-Battery-9', name: 'Ada' }) });
  assert.equal(created.status, 201);
  const { user } = /** @type {any} */ (await created.json());
  await fetch(`${authUrl}/v1/auth/login`, { method: 'POST', headers: { authorization: `Bearer ${authKey}`, 'content-type': 'application/json' }, body: JSON.stringify({ email: 'ada@example.test', password: 'Correct-Horse-Battery-9' }) });
  const client = await connect();
  try {
    const list = await call(client, 'atc-auth.users.list', { email: 'ada@example.test' });
    assert.equal(list.isError, undefined, JSON.stringify(list.structuredContent));
    const sessions = await call(client, 'atc-auth.sessions.list', { id: user.id });
    const all = JSON.stringify([list.structuredContent, sessions.structuredContent, (await call(client, 'atc-auth.users.get', { id: user.id })).structuredContent]);
    assert.ok(all.includes('ada@example.test'));
    assert.doesNotMatch(all.replace(/passwordChangedAt/g, ''), /password|hash|secret|totp|recovery|refreshToken|"token"/i);
    const { tools } = await client.listTools();
    assert.deepEqual(tools.filter((x) => x.name.startsWith('atc-auth.')).map((x) => x.annotations?.readOnlyHint), [true, true, true, true]);
  } finally {
    await client.close();
  }
});
