import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { after, before, test } from 'node:test';
import { freePort, randomSecret, ServiceProcess, stopAll, waitUntil } from './harness.js';

/**
 * atc-backup copies every finished backup to atc-media and removes the copy when the backup is
 * deleted. Real processes, real SQLite source database. Runs only with STACK_INTEGRATION=1.
 */
const shouldRun = Boolean(process.env.STACK_INTEGRATION);
const skip = shouldRun ? false : 'set STACK_INTEGRATION=1 to run (spawns real service processes)';
const workspaceRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
/** @type {ServiceProcess[]} */ const services = [];
/** @type {string} */ let scratch;

before(() => { if (shouldRun) scratch = mkdtempSync(join(tmpdir(), 'backup-media-')); });
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

test('a finished backup is copied to media and the copy goes with the backup', { skip }, async () => {
  const source = join(scratch, 'source.db');
  const db = new DatabaseSync(source);
  db.exec("CREATE TABLE t (id INTEGER PRIMARY KEY, v TEXT); INSERT INTO t (v) VALUES ('one'), ('two')");
  db.close();
  mkdirSync(join(scratch, 'files'));
  const [mediaPort, backupPort] = [await freePort(), await freePort()];
  const mediaKey = randomSecret();
  const backupKey = randomSecret();
  const media = await start('atc-media', {
    MEDIA_API_KEYS: `harness:${mediaKey}`, SIGNING_SECRET: randomSecret(32), DATA_DIR: join(scratch, 'files'),
    PUBLIC_BASE_URL: `http://127.0.0.1:${mediaPort}`, CORS_ORIGINS: '', ALLOWED_TYPES: 'application/vnd.sqlite3,application/gzip,application/vnd.atc-backup',
  }, mediaPort);
  const backup = await start('atc-backup', {
    BACKUP_API_KEYS: `harness:${backupKey}:admin`, BACKUP_SOURCES: `src=${source}`, BACKUP_DIR: join(scratch, 'backups'), RESTORE_DIR: join(scratch, 'restores'),
    BACKUP_INTERVAL_MIN: '0', MEDIA_URL: media.baseUrl, MEDIA_API_KEY: mediaKey,
  }, backupPort);

  const b = (/** @type {string} */ path, /** @type {RequestInit} */ init = {}) => fetch(`${backup.baseUrl}${path}`, { ...init, headers: { authorization: `Bearer ${backupKey}`, ...(init.body ? { 'content-type': 'application/json' } : {}) } });
  const m = (/** @type {string} */ path) => fetch(`${media.baseUrl}${path}`, { headers: { authorization: `Bearer ${mediaKey}` } });

  const created = await b('/v1/sources/src/backups', { method: 'POST', body: '{}' });
  const body = await created.json();
  assert.equal(created.status, 201, JSON.stringify(body));
  assert.equal(body.backup.status, 'ok', JSON.stringify(body));
  const id = body.backup.id;

  const fileId = await waitUntil(async () => (await (await b(`/v1/backups/${id}`)).json()).backup.media?.fileId, { timeoutMs: 15_000, message: 'the media copy of the backup' });
  const meta = await m(`/v1/files/${fileId}`);
  assert.equal(meta.status, 200, await meta.text());

  const removed = await b(`/v1/backups/${id}`, { method: 'DELETE' });
  assert.equal(removed.status, 204, await removed.text());
  await waitUntil(async () => (await m(`/v1/files/${fileId}`)).status === 404, { timeoutMs: 10_000, message: 'the media copy removed with the backup' });
});
