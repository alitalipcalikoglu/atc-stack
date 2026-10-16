import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import YAML from 'yaml';
import { McpConfig } from '../src/mcp-config.js';
import { SERVICES } from '../src/manifest.js';

const workspace = resolve(fileURLToPath(new URL('../..', import.meta.url)));
const ready = SERVICES.every((s) => existsSync(join(workspace, s.id, 'openapi.yaml')));
const skip = !ready && 'needs the full workspace';
const read = (/** @type {string} */ p) => readFileSync(join(workspace, p), 'utf8');
/** Every .js file under a directory, concatenated. @param {string} dir @returns {string} */
const readTree = (dir) => readdirSync(dir, { recursive: true, encoding: 'utf8' }).filter((f) => f.endsWith('.js')).map((f) => readFileSync(join(dir, f), 'utf8')).join('\n');

test('consistency: every MCP role is one the service accepts (its own GRANTS, else the shared read/readwrite/admin)', { skip }, () => {
  for (const [id, r] of Object.entries(McpConfig.ROLES)) {
    if (r.full === undefined) continue; // keys without roles
    const auth = existsSync(join(workspace, id, 'src/http/api-key-auth.js')) ? read(`${id}/src/http/api-key-auth.js`) : read(`${id}/src/auth.js`);
    const grants = /GRANTS = Object\.freeze\(\{([^)]*)\}\)/.exec(auth);
    const allowed = new Set(grants ? [...grants[1].matchAll(/'([a-z]+)'/g)].map((m) => m[1]) : ['read', 'readwrite', 'admin']);
    for (const role of [r.full, r.read]) if (role) assert.ok(allowed.has(role), `${id}: MCP role "${role}" is not accepted by the service (${[...allowed].join(', ')})`);
  }
});

test('consistency: list responses paginate with nextCursor (no second spelling) and every service documents the probes', { skip }, () => {
  for (const s of SERVICES) {
    const spec = read(`${s.id}/openapi.yaml`);
    assert.equal(/^\s+(next_cursor|nextPage|nextOffset|hasMore|cursorNext|pageToken):/m.test(spec), false, `${s.id}: a pagination field other than nextCursor`);
    for (const path of ['/health', '/ready']) assert.ok(new RegExp(`^\\s{2}${path}:`, 'm').test(spec), `${s.id}: ${path} missing from openapi.yaml`);
  }
});

const PAGES = new Set(['before', 'beforeSeq', 'offset', 'page', 'after']);
const SERVICES_AND_CONSOLE = [...SERVICES.map((s) => s.id), 'atc-console'];

test('consistency: every GET list answers { items, nextCursor } and pages only by limit + cursor', { skip }, () => {
  for (const id of SERVICES_AND_CONSOLE) {
    const doc = YAML.parse(read(`${id}/openapi.yaml`));
    const deref = (/** @type {any} */ o) => { while (o?.$ref) o = o.$ref.slice(2).split('/').reduce((/** @type {any} */ x, /** @type {string} */ k) => x[k], doc); return o; };
    for (const [path, item] of Object.entries(/** @type {Record<string, any>} */ (doc.paths))) {
      const op = item.get;
      if (!op) continue;
      const where = `${id} GET ${path}`;
      for (const p of [...(item.parameters ?? []), ...(op.parameters ?? [])].map(deref)) {
        if (p.in === 'query') assert.ok(!PAGES.has(p.name), `${where}: pages with "${p.name}"; use cursor`);
      }
      const schema = deref(deref(op.responses?.['200'])?.content?.['application/json']?.schema);
      const props = schema?.properties ?? {};
      assert.ok(!('hits' in props) && !('nextBefore' in props) && !('nextBeforeSeq' in props), `${where}: list fields must be items/nextCursor`);
      if (/\/stats$/.test(path)) continue; // aggregates, not lists
      if (deref(props.items)?.type === 'array') assert.ok('nextCursor' in props, `${where}: a list without nextCursor`);
    }
  }
});

test('consistency: Idempotency-Key is one shared header parameter per service', { skip }, () => {
  for (const id of SERVICES_AND_CONSOLE) {
    const doc = YAML.parse(read(`${id}/openapi.yaml`));
    for (const [path, item] of Object.entries(/** @type {Record<string, any>} */ (doc.paths))) {
      for (const [method, op] of Object.entries(/** @type {Record<string, any>} */ (item))) {
        for (const p of op?.parameters ?? []) assert.ok(p.$ref || String(p.name).toLowerCase() !== 'idempotency-key', `${id} ${method.toUpperCase()} ${path}: inline Idempotency-Key; reference the shared parameter`);
      }
    }
    const opted = existsSync(join(workspace, id, 'src')) && /idempotent: true/.test(readTree(join(workspace, id, 'src')));
    if (opted) assert.ok(Object.values(doc.components?.parameters ?? {}).some((/** @type {any} */ p) => String(p.name).toLowerCase() === 'idempotency-key'), `${id}: routes opt in to Idempotency-Key but the spec has no shared header parameter`);
  }
});

test('consistency: error bodies are { error: { code, message } } in every service contract', { skip }, () => {
  for (const s of SERVICES) {
    const spec = read(`${s.id}/openapi.yaml`);
    const m = /^    (Error[A-Za-z]*):.*\n?((?:      .*\n)*)/m.exec(spec);
    assert.ok(m, `${s.id}: no Error schema in components`);
    assert.ok(/\bcode\b/.test(m[0]) && /\bmessage\b/.test(m[0]) && /\berror\b/.test(m[0]), `${s.id}: the ${m[1]} schema must describe { error: { code, message } }`);
  }
});

test('mcp config: a first setup is read-only, a saved full mode stays full', () => {
  const dir = mkdtempSync(join(tmpdir(), 'atc-mcp-default-'));
  try {
    const mcp = new McpConfig({ stackDir: dir });
    assert.equal(mcp.savedReadOnly(), true);
    writeFileSync(mcp.envPath, 'STACK_MCP_READ_ONLY=false\n');
    assert.equal(mcp.savedReadOnly(), false);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
