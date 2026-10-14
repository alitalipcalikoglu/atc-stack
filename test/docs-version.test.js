import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { test } from 'node:test';

const ROOT = join(import.meta.dirname, '..');
const { version } = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'));
// Every repository shares one version since 1.13.0; older numbers in docs are illustrative examples.
const UNIFIED = [1, 13, 0];
// PROJECT_STATE.md describes the last verified release until release:publish rewrites it.
const SKIP = new Set(['node_modules', '.git', 'releases', 'data', 'keys', 'PROJECT_STATE.md']);

/** @param {string} dir @returns {string[]} */
const markdown = (dir) => readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
  if (SKIP.has(entry.name)) return [];
  const path = join(dir, entry.name);
  return entry.isDirectory() ? markdown(path) : entry.name.endsWith('.md') ? [path] : [];
});

/** @param {string} a */
const unified = (a) => {
  const parts = a.split('.').map(Number);
  for (let i = 0; i < 3; i += 1) if (parts[i] !== UNIFIED[i]) return parts[i] > UNIFIED[i];
  return true;
};

test('documentation names only the current suite version', () => {
  const stale = [];
  for (const file of markdown(ROOT)) {
    for (const [, found] of readFileSync(file, 'utf8').matchAll(/(?<![\d.])v?(\d+\.\d+\.\d+)(?![\d.])/g)) {
      if (found.startsWith('1.') && unified(found) && found !== version) stale.push(`${relative(ROOT, file)}: ${found}`);
    }
  }
  assert.deepEqual(stale, [], `docs must say ${version}`);
});
