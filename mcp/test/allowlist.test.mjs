// Deterministic tool-count / default-deny tests. An operation existing in a spec must never become
// a tool just by being there -- only src/tools/index.mjs's explicit array does that.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { TOOLS } from '../src/tools/index.mjs';
import { z } from 'zod';

const EXPECTED_TOOL_NAMES = [
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
].sort();

test('exposed tool count is deterministic: exactly the expected 10, no more, no fewer', () => {
  const actual = TOOLS.map((t) => t.name).sort();
  assert.deepEqual(actual, EXPECTED_TOOL_NAMES, 'the exposed tool set changed -- if intentional, update EXPECTED_TOOL_NAMES deliberately, not accidentally');
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

test('no tool declares destructiveHint:true (Phase 3 exposes no destructive tools)', () => {
  for (const t of TOOLS) assert.notEqual(t.annotations.destructiveHint, true, `${t.name} must not be destructive in Phase 3`);
});

test('readOnlyHint matches the handler\'s real semantics: mutation tools are explicitly marked non-read-only', () => {
  const mutationTools = new Set(['atc-notify.messages.create', 'atc-shortlink.links.create']);
  for (const t of TOOLS) {
    if (mutationTools.has(t.name)) assert.equal(t.annotations.readOnlyHint, false, `${t.name} performs a real mutation and must have readOnlyHint:false`);
    else assert.equal(t.annotations.readOnlyHint, true, `${t.name} is read-only and must have readOnlyHint:true`);
  }
});

test('an operation that is NOT in the allowlist cannot become a tool merely by existing in a spec (spot check)', () => {
  // atc-auth.login is a real, valid operationId in atc-auth/openapi.yaml -- it must never appear here.
  const names = TOOLS.map((t) => t.name);
  assert.ok(!names.includes('atc-auth.login'));
  assert.ok(!names.some((n) => n.startsWith('auth.')));
  assert.ok(!names.some((n) => n.startsWith('console.')));
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
