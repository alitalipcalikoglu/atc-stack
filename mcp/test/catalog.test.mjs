// Tests the classification artifact's own invariants -- not tool behavior (see allowlist.test.mjs
// and e2e/ for that). Fast, no process spawning.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse as parseYaml } from 'yaml';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const WORKSPACE_ROOT = path.resolve(HERE, '..', '..', '..');
const SERVICES = ['atc-gateway', 'atc-notify', 'atc-auth', 'atc-media', 'atc-console', 'atc-audit', 'atc-shortlink', 'atc-flags', 'atc-scheduler', 'atc-webhook-out', 'atc-search', 'atc-ratelimit', 'atc-geo', 'atc-content', 'atc-export', 'atc-render', 'atc-queue', 'atc-backup', 'atc-status', 'atc-payments'];
const HTTP_METHODS = new Set(['get', 'post', 'put', 'patch', 'delete', 'head', 'options', 'trace']);
/** @typedef {{ service: string, operationId: string, method: string, path: string, flags: string[], exposed: boolean }} CatalogEntry */
/** @type {{ totalOperations: number, entries: CatalogEntry[] }} */
const catalog = JSON.parse(await readFile(path.join(HERE, '..', 'tool-catalog.json'), 'utf8'));

test('catalog accounts for every canonical operation, with the expected total derived from the 20 specs', async () => {
  let expected = 0;
  for (const service of SERVICES) {
    const spec = parseYaml(await readFile(path.join(WORKSPACE_ROOT, service, 'openapi.yaml'), 'utf8'));
    for (const item of Object.values(spec.paths ?? {})) {
      if (item && typeof item === 'object') expected += Object.keys(item).filter((key) => HTTP_METHODS.has(key)).length;
    }
  }
  assert.ok(expected > 0);
  assert.equal(catalog.totalOperations, expected);
  assert.equal(catalog.entries.length, expected);
});

test('every entry has at least one classification flag and a real service/operationId/method/path', () => {
  const validFlags = new Set(['READ_SAFE', 'MUTATION', 'DESTRUCTIVE', 'HIGH_RISK', 'OPERATOR', 'INTERNAL', 'BINARY', 'ASYNC', 'POOR_MCP_FIT']);
  for (const e of catalog.entries) {
    assert.ok(e.flags.length > 0, `${e.operationId} has no classification flags`);
    for (const f of e.flags) assert.ok(validFlags.has(f), `${e.operationId} has unknown flag ${f}`);
    assert.equal(typeof e.service, 'string');
    assert.equal(typeof e.operationId, 'string');
    assert.match(e.method, /^(GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS|TRACE)$/);
    assert.ok(e.path.startsWith('/'), `${e.operationId}'s path "${e.path}" doesn't start with /`);
  }
});

test('operationIds are globally unique within the catalog (matches Phase 1\'s own global-uniqueness guarantee)', () => {
  const ids = catalog.entries.map((e) => e.operationId);
  assert.equal(new Set(ids).size, ids.length);
});

test('the catalog is not the tool list: only the operations a tool calls are exposed', async () => {
  const exposedCount = catalog.entries.filter((e) => e.exposed).length;
  const { TOOLS } = await import('../src/tools/index.mjs');
  assert.ok(exposedCount > 0, 'reconcile.mjs has not been run, or found nothing');
  assert.ok(exposedCount < catalog.totalOperations, 'catalog exposure count must not equal the full catalog -- that would mean every operation became a tool');
  // exposedCount (operation-level) and TOOLS.length (tool-level) are deliberately different numbers
  // -- atc-stack.status alone accounts for 39 of the exposed operations under one tool.
  assert.notEqual(exposedCount, TOOLS.length, 'exposedCount and tool count coincidentally matching would be worth double-checking by hand');
});

test('atc-auth exposes read operations only and atc-console only its probes', () => {
  for (const e of catalog.entries.filter((x) => x.exposed && x.service === 'atc-console')) assert.deepEqual(e.flags, ['READ_SAFE', 'OPERATOR'], `${e.operationId} (${e.flags.join(',')})`);
  for (const e of catalog.entries.filter((x) => x.exposed && x.service === 'atc-auth')) assert.ok(e.method === 'GET' && e.flags.includes('READ_SAFE'), `${e.operationId} is exposed but not a read`);
});

test('no DESTRUCTIVE operation is exposed; HIGH_RISK only as an atc-auth read', () => {
  for (const e of catalog.entries.filter((x) => x.exposed)) {
    assert.ok(!e.flags.includes('DESTRUCTIVE'), `${e.operationId} is DESTRUCTIVE and must not be exposed`);
    if (e.flags.includes('HIGH_RISK')) assert.ok(e.service === 'atc-auth' && e.method === 'GET', `${e.operationId} is HIGH_RISK and must not be exposed`);
  }
});

test('policy in the catalog matches tool-policy.mjs and agrees with the tools; every write is a tool or excluded with a reason', async () => {
  const { POLICY } = await import('../tool-policy.mjs');
  const { TOOLS } = await import('../src/tools/index.mjs');
  const { check } = await import('../tool-catalog.reconcile.mjs');
  assert.deepEqual(/** @type {any} */ (catalog).policy, POLICY, 'run npm run mcp:catalog');
  assert.deepEqual(check(catalog, TOOLS), []);
  const exposed = new Set(catalog.entries.filter((e) => e.exposed).map((e) => e.operationId));
  for (const t of TOOLS) for (const id of t.operations) assert.ok(exposed.has(id), `${id} is called by ${t.name} but not marked exposed`);
});
