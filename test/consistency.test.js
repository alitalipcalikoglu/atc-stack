import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { McpConfig } from '../src/mcp-config.js';
import { SERVICES } from '../src/manifest.js';

const workspace = resolve(fileURLToPath(new URL('../..', import.meta.url)));
const ready = SERVICES.every((s) => existsSync(join(workspace, s.id, 'openapi.yaml')));
const skip = !ready && 'needs the full workspace';
const read = (/** @type {string} */ p) => readFileSync(join(workspace, p), 'utf8');

test('consistency: every MCP role is one the service accepts (its own GRANTS, else the shared read/readwrite/admin)', { skip }, () => {
  for (const [id, r] of Object.entries(McpConfig.ROLES)) {
    if (r.full === undefined) continue; // keys without roles
    const auth = read(`${id}/src/http/api-key-auth.js`);
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
