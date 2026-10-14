import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { Release, ReleaseError } from '../src/release.js';
import { REPOSITORIES } from '../src/repository-catalog.js';

const STACK = join(import.meta.dirname, '..');
const supported = JSON.parse(readFileSync(join(STACK, 'installation-manifests', 'supported.json'), 'utf8')).release;
const manifestText = readFileSync(join(STACK, 'installation-manifests', `v${supported}.json`), 'utf8');
const manifest = JSON.parse(manifestText);

test('manifest reproduces the committed descriptor byte for byte', () => {
  const commits = Object.fromEntries(Object.entries(manifest.repositories).map(([id, e]) => [id, /** @type {any} */ (e).commit]));
  const listed = Object.entries(manifest.repositories).map(([id, e]) => ({ id, remote: /** @type {any} */ (e).repository }));
  assert.equal(Release.manifest(manifest, supported, commits, listed), manifestText);
  const next = JSON.parse(Release.manifest(manifest, '9.9.9', commits, listed));
  assert.equal(next.release, '9.9.9');
  assert.ok(Object.values(next.repositories).every((e) => /** @type {any} */ (e).tag === 'v9.9.9'));
  assert.throws(() => Release.manifest(manifest, '9.9.9', {}, listed), ReleaseError);
});

test('manifest takes its entries from the repository catalog, so a new repository enters the next release', () => {
  const commits = Object.fromEntries(REPOSITORIES.map((r, i) => [r.id, String(i).padStart(40, 'a')]));
  const next = JSON.parse(Release.manifest(manifest, '9.9.9', commits));
  assert.deepEqual(Object.keys(next.repositories), REPOSITORIES.map((r) => r.id));
  const added = REPOSITORIES.find((r) => !(r.id in manifest.repositories));
  if (added) assert.deepEqual(next.repositories[added.id], { repository: added.remote, tag: 'v9.9.9', commit: commits[added.id] });
  assert.ok(REPOSITORIES.some((r) => r.id === 'atc-content') && REPOSITORIES.some((r) => r.id === 'atc-export'));
  assert.throws(() => Release.manifest(manifest, '9.9.9', { ...commits, 'atc-content': '' }), /no commit for atc-content/);
});

test('bumpJson changes only the top-level version and keeps formatting', () => {
  const text = '{\n  "name": "x",\n  "version": "1.2.3",\n  "dependencies": {\n    "y": "1.2.3"\n  }\n}\n';
  assert.equal(Release.bumpJson(text, '1.3.0'), text.replace('"version": "1.2.3"', '"version": "1.3.0"'));
  assert.throws(() => Release.bumpJson('{}', '1.0.0'), ReleaseError);
});

test('retag replaces whole version strings only', () => {
  assert.equal(Release.retag('at 1.15.0, not 11.15.0 or 1.15.01, `#v1.15.0`', '1.15.0', '1.16.0'), 'at 1.16.0, not 11.15.0 or 1.15.01, `#v1.16.0`');
  assert.equal(Release.retag('#v1.15.0 and v1.15.0', '#v1.15.0', '#v1.16.0'), '#v1.16.0 and v1.15.0');
});

test('passed reads node:test summaries and rejects failures', () => {
  assert.equal(Release.passed('ok 1\n# pass 12\n# fail 0\n'), 12);
  assert.throws(() => Release.passed('# pass 11\n# fail 1\n'), /1 test\(s\) failed/);
  assert.throws(() => Release.passed('no summary'), ReleaseError);
});

test('projectState rewrite is idempotent on the current file and moves every release reference', () => {
  const text = readFileSync(join(STACK, 'PROJECT_STATE.md'), 'utf8');
  const [, date = '', recorded = ''] = /Last source verification: (\d{4}-\d{2}-\d{2}) \(v([\d.]+)\)/.exec(text) ?? [];
  /** @type {Record<string, { commit: string }>} */
  const tags = {};
  for (const [, id, commit] of text.matchAll(/^\| (atc-[a-z-]+) \| [^|]+ \| `[0-9a-f]{40}` \| `v[\d.]+` → `([0-9a-f]{40})` \|/gm)) tags[id] = { commit };
  assert.equal(Object.keys(tags).length, 15);
  assert.equal(Release.projectState(text, recorded, tags, date), text);
  const moved = Release.projectState(text, '9.9.9', tags, '2030-01-01');
  assert.equal((moved.match(/`v9\.9\.9`/g) ?? []).length, 15 + 3);
  assert.match(moved, /Last source verification: 2030-01-01 \(v9\.9\.9\)\./);
  assert.doesNotMatch(moved, new RegExp(`v${recorded.replaceAll('.', '\\.')}`));
});

test('evidence carries the matrix, tests and install results', () => {
  const tags = { 'atc-stack': { tagObject: 'a', commit: 'b' }, 'atc-service-core': { tagObject: 'c', commit: 'd' } };
  const state = { version: '9.9.9', previous: '9.9.8', tests: { 'atc-stack': 1 }, steps: { docker: 15, candidateInstall: { readiness: '15/15' }, defaultInstall: { readiness: '15/15' } } };
  const evidence = Release.evidence(state, tags, '2030-01-01');
  assert.deepEqual(evidence.releaseMatrix.map((e) => e.repo), ['atc-service-core', 'atc-stack']);
  assert.equal(evidence.publication.stackTagCommit, 'b');
  assert.equal(evidence.supersedes, '9.9.8');
  assert.match(evidence.tests.docker, /^15\/15 /);
});

test('prepare refuses to start without release notes or on a dirty workspace, and never pushes then', async () => {
  const root = mkdtempSync(join(tmpdir(), 'atc-release-'));
  try {
    const stackDir = join(root, 'atc-stack');
    mkdirSync(join(stackDir, 'installation-manifests'), { recursive: true });
    mkdirSync(join(stackDir, 'releases'));
    writeFileSync(join(stackDir, 'installation-manifests', 'supported.json'), JSON.stringify({ schemaVersion: 1, release: '1.0.0' }));
    /** @type {string[][]} */
    const calls = [];
    const exec = async (/** @type {string} */ cwd, /** @type {string[]} */ argv) => {
      calls.push(argv);
      if (argv[1] === 'rev-parse') return { code: 0, out: 'main\n' };
      if (argv[1] === 'rev-list') return { code: 0, out: '0\n' };
      if (argv[1] === 'status') return { code: 0, out: cwd.endsWith('atc-gateway') ? ' M package.json\n' : '' };
      return { code: 0, out: '' };
    };
    const release = new Release({ root, stackDir, version: '1.1.0', exec, log: () => {} });
    await assert.rejects(release.prepare(), /write the release notes first/);
    writeFileSync(join(stackDir, 'releases', 'v1.1.0.md'), '# notes\n');
    for (const id of ['atc-service-core', 'atc-gateway']) mkdirSync(join(root, id));
    await assert.rejects(release.prepare(), /atc-gateway has uncommitted changes: M package.json/);
    assert.equal(calls.some((argv) => argv.includes('push') || argv.includes('tag')), false);
    assert.throws(() => new Release({ root, stackDir, version: 'v1.1', exec }), ReleaseError);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
