import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { after, test } from 'node:test';
import { freePort, randomSecret, ServiceProcess, stopAll, waitUntil } from './harness.js';

/**
 * atc-payments queues `payment.*` events in its outbox and hands them to atc-webhook-out, which
 * delivers them signed to a subscriber. Stripe is replaced by the service's own fake (the shape of
 * the real API), so the real provider path runs without keys. Runs only with STACK_INTEGRATION=1.
 */
const shouldRun = Boolean(process.env.STACK_INTEGRATION);
const skip = shouldRun ? false : 'set STACK_INTEGRATION=1 to run (spawns real service processes)';
const workspaceRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
/** @type {ServiceProcess[]} */ const services = [];
/** @type {{ close: () => Promise<unknown> }[]} */ const closers = [];

after(async () => { await stopAll(services); await Promise.all(closers.map((c) => c.close())); });

/** @param {string} id @param {Record<string, string>} env @param {number} port */
async function start(id, env, port) {
  const proc = new ServiceProcess({
    name: id, cwd: join(workspaceRoot, id), entry: 'src/index.js', port,
    env: { PATH: process.env.PATH ?? '', PORT: String(port), HOST: '127.0.0.1', LOG_LEVEL: 'info', DB_PATH: ':memory:', ...env },
  });
  await proc.start();
  services.push(proc);
  return proc;
}

test('a payment created through atc-payments is delivered by atc-webhook-out', { skip }, async () => {
  const { FakeStripe } = await import(pathToFileURL(join(workspaceRoot, 'atc-payments', 'test', 'fake-stripe.js')).href);
  const fake = new FakeStripe();
  await fake.start();
  closers.push({ close: () => fake.close() });

  /** @type {{ headers: Record<string, string|string[]|undefined>, body: any }[]} */
  const received = [];
  const receiver = createServer((req, res) => {
    let raw = '';
    req.on('data', (c) => { raw += c; });
    req.on('end', () => { received.push({ headers: req.headers, body: JSON.parse(raw || '{}') }); res.writeHead(200).end('{}'); });
  });
  const receiverPort = await freePort();
  await new Promise((r) => receiver.listen(receiverPort, '127.0.0.1', () => r(undefined)));
  closers.push({ close: () => new Promise((r) => { receiver.closeAllConnections(); receiver.close(r); }) });

  const [hookPort, payPort] = [await freePort(), await freePort()];
  const whKey = randomSecret();
  const payKey = randomSecret();
  const wh = await start('atc-webhook-out', {
    WEBHOOK_API_KEYS: `harness:${whKey}:readwrite`, SECRETS_KEY: randomSecret(32),
    TARGET_ALLOW_HTTP: 'true', TARGET_ALLOW_PRIVATE: 'true', TARGET_ALLOWED_HOSTS: '127.0.0.1',
    RETRY_SCHEDULE_SEC: '1,2', POLL_MS: '100', DELIVERY_TIMEOUT_MS: '2000',
    SUBSCRIPTION_SEEDS: `shop|http://127.0.0.1:${receiverPort}/hook|payment.*|${randomSecret()}`,
  }, hookPort);
  const pay = await start('atc-payments', {
    PAYMENTS_API_KEYS: `shop:${payKey}:write`, STRIPE_SECRET_KEY: FakeStripe.SECRET_KEY, STRIPE_WEBHOOK_SECRET: FakeStripe.WEBHOOK_SECRET,
    STRIPE_API_URL: fake.url, OUTBOX_MS: '200', WEBHOOK_OUT_URL: wh.baseUrl, WEBHOOK_OUT_API_KEY: whKey,
  }, payPort);

  const res = await fetch(`${pay.baseUrl}/v1/payments`, {
    method: 'POST',
    headers: { authorization: `Bearer ${payKey}`, 'content-type': 'application/json', 'idempotency-key': 'integration-order-1' },
    body: JSON.stringify({ amount: 2500, currency: 'usd', customerEmail: 'ada@example.com', metadata: { order: 'A-1' } }),
  });
  const body = await res.json();
  assert.equal(res.status, 201, JSON.stringify(body));

  const hit = /** @type {NonNullable<(typeof received)[number]>} */ (await waitUntil(() => received.find((r) => JSON.stringify(r.body).includes('payment.created')), { timeoutMs: 15_000, message: 'payment.created at the subscriber' }));
  assert.ok(JSON.stringify(hit.body).includes(body.payment.id), 'the delivery carries the payment id');
  assert.ok(Object.keys(hit.headers).some((h) => h.startsWith('x-webhook')), 'the delivery is signed by atc-webhook-out');
});
