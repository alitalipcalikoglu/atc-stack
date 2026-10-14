import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { SERVICES } from '../src/manifest.js';

const read = (/** @type {string} */ p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');

test('documented service counts match the manifest', () => {
  const n = SERVICES.length;
  assert.match(read('README.md'), new RegExp(`for all ${n} HTTP services to report ready`), 'README install:all paragraph');
  assert.match(read('PROJECT_STATE.md'), new RegExp(`${n} independently deployable HTTP services`), 'PROJECT_STATE topology');
  assert.match(read('PROJECT_STATE.md'), new RegExp(`holds ${n + 2} independent repositories`), 'services + service-core + stack');
  for (const s of SERVICES) assert.ok(read('README.md').includes(`| ${s.id} | ${s.port} |`), `${s.id} has its row in the README port/service tables`);
});
