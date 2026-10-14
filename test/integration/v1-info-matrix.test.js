import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { after, before, test } from 'node:test';
import { SERVICES } from '../../src/manifest.js';
import { Stack } from '../../src/stack.js';
import { freePort, randomSecret, ServiceProcess, stopAll } from './harness.js';

/**
 * `stack status --matrix` (Stage 7) exercised against real, currently-running service processes —
 * not mocked HTTP, not an in-process fake. Spawns audit and notify for real, over real ports, and
 * runs `Stack#matrix()` (the exact code `stack status --matrix` calls) against them through a real
 * `.env`-backed root, so the matrix parser is proven against the real `/v1/info` JSON these two
 * services actually serve today, not a hand-written stand-in for it.
 *
 * Spawns real `node` processes; only runs when explicitly requested (STACK_INTEGRATION=1 npm test
 * in stack/), same convention as every other file in this directory.
 */
const shouldRun = Boolean(process.env.STACK_INTEGRATION);
const skip = shouldRun ? false : 'set STACK_INTEGRATION=1 to run (spawns real service processes)';

const workspaceRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
/** @type {ServiceProcess} */ let audit;
/** @type {ServiceProcess} */ let notify;
/** @type {string} */ let root;

before(async () => {
  if (!shouldRun) return;
  const [auditPort, notifyPort] = await Promise.all([freePort(), freePort()]);
  audit = new ServiceProcess({
    name: 'atc-audit', cwd: join(workspaceRoot, 'atc-audit'), entry: 'src/index.js', port: auditPort,
    env: { PATH: process.env.PATH ?? '', PORT: String(auditPort), HOST: '127.0.0.1', LOG_LEVEL: 'info', DB_PATH: ':memory:', AUDIT_API_KEYS: `harness:${randomSecret()}` },
  });
  notify = new ServiceProcess({
    name: 'atc-notify', cwd: join(workspaceRoot, 'atc-notify'), entry: 'src/index.js', port: notifyPort,
    env: {
      PATH: process.env.PATH ?? '', PORT: String(notifyPort), HOST: '127.0.0.1', LOG_LEVEL: 'info', DB_PATH: ':memory:',
      NOTIFY_API_KEYS: `harness:${randomSecret()}`, SMTP_URL: 'json:', SMTP_FROM: 'Harness <harness@example.test>',
    },
  });
  await Promise.all([audit.start(), notify.start()]);

  root = mkdtempSync(join(tmpdir(), 'stack-matrix-integration-'));
  // Stack#matrix() iterates the whole manifest, so every id needs a readable .env — the 11 not
  // spawned here just point at the manifest's own (closed) port and read as plain unreachable
  // rows, exactly like any other down service; only audit/notify point at the real processes.
  const realPort = /** @type {Record<string, number>} */ ({ 'atc-audit': auditPort, 'atc-notify': notifyPort });
  for (const s of SERVICES) {
    mkdirSync(join(root, s.id), { recursive: true });
    writeFileSync(join(root, s.id, '.env'), `PORT=${realPort[s.id] ?? s.port}\nHOST=127.0.0.1\n`);
  }
});

after(async () => {
  if (!shouldRun) return;
  await stopAll([audit, notify]);
  rmSync(root, { recursive: true, force: true });
});

test('a real service\'s /v1/info matches the documented contract shape exactly', { skip }, async () => {
  const res = await fetch(`${audit.baseUrl}/v1/info`);
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.service, 'atc-audit');
  assert.equal(typeof body.version, 'string');
  assert.equal(body.apiVersion, 'v1');
  assert.deepEqual(body.capabilities, ['chain-verification', 'anchors', 'export']);
  assert.equal(typeof body.schemaVersion, 'number');
  assert.ok(body.schemaVersion >= 1);
  assert.equal(typeof body.serviceCore, 'string');
});

test('notify\'s real /v1/info advertises exactly its email channel, templates and idempotency', { skip }, async () => {
  const res = await fetch(`${notify.baseUrl}/v1/info`);
  const body = await res.json();
  assert.equal(body.service, 'atc-notify');
  assert.deepEqual(body.capabilities, ['email', 'templates', 'idempotency']);
});

test('Stack#matrix(), pointed at these real running services (not a mock), parses their actual responses correctly', { skip }, async () => {
  /** @type {string[]} */ const logged = [];
  const rows = await new Stack({ root, log: (l) => logged.push(l) }).matrix();
  const byId = /** @type {Record<string, any>} */ (Object.fromEntries(rows.filter((r) => r.id === 'atc-audit' || r.id === 'atc-notify').map((r) => [r.id, r])));

  assert.equal(byId['atc-audit'].ok, true);
  assert.equal(byId['atc-audit'].infoOk, true);
  assert.deepEqual(byId['atc-audit'].capabilities, ['chain-verification', 'anchors', 'export']);

  assert.equal(byId['atc-notify'].ok, true);
  assert.equal(byId['atc-notify'].infoOk, true);
  assert.deepEqual(byId['atc-notify'].capabilities, ['email', 'templates', 'idempotency']);

  // The other 11 manifest entries point at closed ports and read as plain unreachable rows — the
  // command still completed and printed a full matrix rather than throwing over any of them.
  assert.ok(logged.some((l) => l.startsWith('atc-audit')));
  assert.ok(logged.some((l) => l.startsWith('atc-notify')));
});
