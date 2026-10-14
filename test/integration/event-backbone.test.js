import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { after, before, test } from 'node:test';
import { freePort, randomSecret, ServiceProcess, stopAll, waitUntil } from './harness.js';

/**
 * The operations event backbone over real processes: a message dead-lettered in atc-queue becomes
 * an `ops.queue.dead_letter` event published to atc-webhook-out, which delivers it (signed) to the
 * alert hub of atc-status, where it shows up as an open alert, is e-mailed through atc-notify (JSON
 * transport) and is acknowledged through the API.
 * Runs only with STACK_INTEGRATION=1.
 */
const shouldRun = Boolean(process.env.STACK_INTEGRATION);
const skip = shouldRun ? false : 'set STACK_INTEGRATION=1 to run (spawns real service processes)';
const workspaceRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
/** @type {ServiceProcess[]} */ const services = [];
/** @type {string} */ let scratch;

before(() => { if (shouldRun) scratch = mkdtempSync(join(tmpdir(), 'event-backbone-')); });
after(async () => { if (!shouldRun) return; await stopAll(services); rmSync(scratch, { recursive: true, force: true }); });

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

test('queue dead letter reaches the status alert hub through webhook-out', { skip }, async () => {
  const [hookPort, statusPort, queuePort] = [await freePort(), await freePort(), await freePort()];
  const hookSecret = randomSecret();
  const whKey = randomSecret();
  const statusKey = randomSecret();
  const queueKey = randomSecret();
  const notifyAdminKey = randomSecret();
  const notifyStatusKey = randomSecret();
  const notifyPort = await freePort();
  const notify = await start('atc-notify', { NOTIFY_API_KEYS: `harness:${notifyAdminKey}:admin,atc-status:${notifyStatusKey}:readwrite`, SMTP_URL: 'json:', SMTP_FROM: 'atc-web <no-reply@localhost>', WORKER_POLL_MS: '100' }, notifyPort);
  const wh = await start('atc-webhook-out', {
    WEBHOOK_API_KEYS: `harness:${whKey}:readwrite`, SECRETS_KEY: randomSecret(32),
    TARGET_ALLOW_HTTP: 'true', TARGET_ALLOW_PRIVATE: 'true', TARGET_ALLOWED_HOSTS: '127.0.0.1',
    RETRY_SCHEDULE_SEC: '1,2', POLL_MS: '100', DELIVERY_TIMEOUT_MS: '2000',
    SUBSCRIPTION_SEEDS: `alert-hub|http://127.0.0.1:${statusPort}/v1/hooks/webhook-out|ops.*|${hookSecret}`,
  }, hookPort);
  const status = await start('atc-status', {
    STATUS_API_KEYS: `harness:${statusKey}:admin`, ALERT_HOOK_SECRET: hookSecret, MONITOR_SEEDS: '',
    NOTIFY_URL: notify.baseUrl, NOTIFY_API_KEY: notifyStatusKey, ALERT_EMAILS: 'ops@example.com',
  }, statusPort);
  const queue = await start('atc-queue', {
    QUEUE_API_KEYS: `harness:${queueKey}:admin`, REAP_MS: '200',
    WEBHOOK_OUT_URL: wh.baseUrl, WEBHOOK_OUT_API_KEY: whKey,
  }, queuePort);

  const q = (/** @type {string} */ path, /** @type {RequestInit} */ init = {}) => fetch(`${queue.baseUrl}${path}`, { ...init, headers: { authorization: `Bearer ${queueKey}`, 'content-type': 'application/json' } });
  const s = (/** @type {string} */ path, /** @type {RequestInit} */ init = {}) => fetch(`${status.baseUrl}${path}`, { ...init, headers: { authorization: `Bearer ${statusKey}`, 'content-type': 'application/json' } });

  assert.equal((await q('/v1/queues/jobs', { method: 'PUT', body: JSON.stringify({ maxAttempts: 1 }) })).status, 201);
  await new Promise((r) => setTimeout(r, 600)); // let one reaper pass record the baseline dead count
  assert.equal((await q('/v1/queues/jobs/messages', { method: 'POST', body: JSON.stringify({ body: { n: 1 } }) })).status, 201);
  const pulled = await (await q('/v1/queues/jobs/pull', { method: 'POST', body: JSON.stringify({ max: 1 }) })).json();
  const msg = pulled.messages[0];
  const nack = await q(`/v1/queues/jobs/messages/${msg.id}/nack`, { method: 'POST', body: JSON.stringify({ leaseToken: msg.leaseToken, dead: true, error: 'integration' }) });
  assert.equal(nack.status, 200, await nack.text());

  const alert = await waitUntil(async () => {
    const body = await (await s('/v1/alerts?state=open')).json();
    return body.items.find((/** @type {any} */ a) => a.type === 'ops.queue.dead_letter');
  }, { timeoutMs: 15_000, message: 'a dead-letter alert in the status hub' });
  assert.equal(alert.data.queue, 'jobs');
  assert.equal(alert.state, 'open');

  const mail = await waitUntil(async () => {
    const r = await fetch(`${notify.baseUrl}/v1/messages`, { headers: { authorization: `Bearer ${notifyAdminKey}` } });
    const list = await r.json();
    return (list.items ?? []).find((/** @type {any} */ m) => JSON.stringify(m).includes('ops@example.com') && ['sent', 'delivered'].includes(m.status));
  }, { timeoutMs: 15_000, message: 'the alert e-mail sent through notify' });
  assert.equal(mail.status === 'sent' || mail.status === 'delivered', true);

  const ack = await s(`/v1/alerts/${alert.id}/ack`, { method: 'POST', body: '{}' });
  assert.equal(ack.status, 200, await ack.text());
  const acked = await (await s('/v1/alerts?state=acked')).json();
  assert.ok(acked.items.some((/** @type {any} */ a) => a.id === alert.id));
});
