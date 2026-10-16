// Deterministic tool-count / default-deny tests. An operation existing in a spec must never become
// a tool just by being there -- only src/tools/index.mjs's explicit array does that.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { TOOLS } from '../src/tools/index.mjs';
import { z } from 'zod';
import { POLICY } from '../tool-policy.mjs';
import { HAND_WRITTEN_OPERATIONS } from '../src/tools/hand-written.mjs';
import { withoutSecrets } from '../src/tools/overrides.mjs';
import catalog from '../tool-catalog.json' with { type: 'json' };

const HAND_TOOL_NAMES = [
  'atc-stack.status',
  'atc-flags.evaluate',
  'atc-geo.ip.lookup',
  'atc-media.files.get',
  'atc-notify.messages.list',
  'atc-notify.messages.create',
  'atc-notify.messages.get',
  'atc-shortlink.links.create',
  'atc-ratelimit.check',
  'atc-search.query',
];
// Every other tool is named after the operation it calls, exactly as tool-policy.mjs lists it.
const EXPECTED_TOOL_NAMES = [...HAND_TOOL_NAMES, ...Object.values(POLICY).flatMap((p) => p.tools).filter((id) => !HAND_WRITTEN_OPERATIONS.has(id))].sort();
const EXPECTED_COUNT = 168;

test('exposed tools are exactly the hand-written ones plus the policy\'s operations (count pinned)', () => {
  const actual = TOOLS.map((t) => t.name).sort();
  assert.deepEqual(actual, EXPECTED_TOOL_NAMES, 'the exposed tool set changed -- change tool-policy.mjs and regenerate deliberately, not accidentally');
  assert.equal(actual.length, EXPECTED_COUNT, 'tool count changed -- update EXPECTED_COUNT deliberately');
});

test('tool names are globally unique', () => {
  const names = TOOLS.map((t) => t.name);
  assert.equal(new Set(names).size, names.length);
});

test('every tool has a non-empty description, an inputSchema object, and annotations', () => {
  for (const t of TOOLS) {
    assert.ok(t.description && t.description.length > 20, `${t.name}: description too short/missing`);
    assert.equal(typeof t.inputSchema, 'object');
    assert.ok(t.annotations && typeof t.annotations.readOnlyHint === 'boolean', `${t.name}: missing readOnlyHint annotation`);
  }
});

test('no tool is destructive: destructiveHint is false everywhere and no name is a delete/purge/refund/cancel/restore/revoke/rotate/reset', () => {
  for (const t of TOOLS) {
    assert.equal(t.annotations.destructiveHint, false, `${t.name} must declare destructiveHint:false`);
    assert.doesNotMatch(t.name, /\.(delete|purge|clear|refund|cancel|restore|revoke|rotate|reset|redrive)/i, `${t.name} looks destructive`);
  }
});

test('read-only annotation matches the operation: GET operations are read-only; writes are POST/PUT/PATCH and never DESTRUCTIVE or HIGH_RISK in the catalog', () => {
  const byId = new Map(catalog.entries.map((e) => [e.operationId, e]));
  for (const t of TOOLS) {
    if (t.name === 'atc-stack.status') continue;
    for (const id of t.operations) {
      const e = /** @type {any} */ (byId.get(id));
      assert.ok(e, `${t.name}: ${id} is not in the catalog`);
      if (e.method === 'GET') assert.equal(t.annotations.readOnlyHint, true, `${t.name} reads (${e.method}) and must be readOnlyHint:true`);
      assert.notEqual(e.method, 'DELETE', `${t.name} calls a DELETE`);
      if (!t.annotations.readOnlyHint) {
        assert.ok(!e.flags.includes('DESTRUCTIVE') && !e.flags.includes('HIGH_RISK'), `${t.name} writes and is flagged ${e.flags.join(',')}`);
      }
    }
  }
  const ratelimit = TOOLS.find((t) => t.name === 'atc-ratelimit.check');
  assert.equal(ratelimit?.annotations.readOnlyHint, true, 'the rate-limit check is a peek');
});

test('atc-auth is read-only and filtered; atc-console has no business tool', () => {
  const auth = TOOLS.filter((t) => t.name.startsWith('atc-auth.'));
  assert.deepEqual(auth.map((t) => t.name).sort(), ['atc-auth.events.list', 'atc-auth.sessions.list', 'atc-auth.users.get', 'atc-auth.users.list']);
  for (const t of auth) assert.equal(t.annotations.readOnlyHint, true, t.name);
  assert.ok(!TOOLS.some((t) => t.name.startsWith('atc-console.')));
  assert.deepEqual(withoutSecrets({ user: { id: 'u1', passwordHash: 'x', totpSecret: 'y', passwordChangedAt: 't', sessions: [{ id: 's', refreshTokenHash: 'z', recoveryCodes: ['a'] }] } }),
    { user: { id: 'u1', passwordChangedAt: 't', sessions: [{ id: 's' }] } });
});

test('payments create requires an idempotency key; render always stores and never returns bytes', () => {
  const pay = TOOLS.find((t) => t.name === 'atc-payments.payments.create');
  assert.equal(z.object(/** @type {any} */ (pay).inputSchema).safeParse({ amount: 100, currency: 'eur' }).success, false);
  assert.equal(z.object(/** @type {any} */ (pay).inputSchema).safeParse({ amount: 100, currency: 'eur', idempotencyKey: 'order-1-pay' }).success, true);
  const render = TOOLS.find((t) => t.name === 'atc-render.render.create');
  assert.ok(render && !('store' in render.inputSchema));
});

test('every tool\'s inputSchema is a valid zod raw shape that rejects an obviously malformed input', () => {
  for (const t of TOOLS) {
    const schema = z.object(t.inputSchema);
    // An empty object is invalid for every tool that has at least one required field; tools with
    // zero required fields (atc-stack.status) must accept it.
    const result = schema.safeParse({});
    const hasRequiredField = Object.values(t.inputSchema).some((s) => !s.isOptional());
    if (hasRequiredField) assert.equal(result.success, false, `${t.name}: empty input should be rejected (it has required fields)`);
    else assert.equal(result.success, true, `${t.name}: has no required fields, empty input should be accepted`);
  }
});
