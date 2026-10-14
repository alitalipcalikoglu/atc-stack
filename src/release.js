import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { REPOSITORIES } from './repository-catalog.js';
import { SERVICES } from './manifest.js';

/**
 * @typedef {(cwd: string, argv: string[], opts?: { stdio?: 'inherit'|'pipe', env?: Record<string, string> }) => Promise<{ code: number, out: string }>} Exec
 * @typedef {{ version: string, previous: string, tests: Record<string, number>, steps: Record<string, unknown> }} Record_
 */

export class ReleaseError extends Error {}

/**
 * The local release flow for the whole suite, in three resumable commands:
 *   prepare  bump every repository, tag service-core, write the candidate manifest
 *   verify   integration, contracts, Console smokes, Docker images, candidate install from `main`
 *   publish  tag the 14 repositories, verify the default install, record the evidence
 * Progress is kept in `.release/v<version>.json` inside stack (untracked), so a failed run can be
 * repeated without redoing finished steps. Pure text transformations are static and unit-tested.
 */
export class Release {
  static OWNER = 'alitalipcalikoglu';
  static SEMVER = /^\d+\.\d+\.\d+$/;
  /** Workspace `.env` keys that point at host paths and must not reach a container. */
  static HOST_ONLY_ENV = /^(HOST|DB_PATH|DATA_DIR|[A-Z_]*_PATH|[A-Z_]*_FILE)=/;
  static CONSOLE_SMOKES = ['build', 'runtime', 'auth', 'm4', 'm5', 'm6', 'm7', 'm7-browser'];
  static INSTALLED_SUITES = ['atc-console', 'atc-notify', 'atc-gateway'];

  /**
   * @param {object} o
   * @param {string} o.root workspace with one folder per repository
   * @param {string} o.stackDir this checkout
   * @param {string} o.version
   * @param {Exec} [o.exec]
   * @param {(line: string) => void} [o.log]
   */
  constructor({ root, stackDir, version, exec = Release.exec, log = (line) => console.log(line) }) {
    if (!Release.SEMVER.test(version)) throw new ReleaseError(`version must be X.Y.Z, got "${version}"`);
    this.root = root;
    this.stackDir = stackDir;
    this.version = version;
    this.tag = `v${version}`;
    this.exec = exec;
    this.log = log;
    this.statePath = join(stackDir, '.release', `${this.tag}.json`);
  }

  // ---------------------------------------------------------------- prepare

  async prepare() {
    const state = this.#state();
    const notes = join(this.stackDir, 'releases', `${this.tag}.md`);
    if (!existsSync(notes)) throw new ReleaseError(`write the release notes first: releases/${this.tag}.md`);
    if (state.previous === this.version) throw new ReleaseError(`${this.version} is already the supported release`);
    await this.#preflight([`releases/${this.tag}.md`]);
    this.#save(state);

    const core = this.#dir('atc-service-core');
    if (!(await this.#done(core))) {
      this.#bump(core);
      for (const file of ['README.md', 'VERSIONING.md']) {
        const path = join(core, file);
        writeFileSync(path, Release.retag(readFileSync(path, 'utf8'), `#v${state.previous}`, `#${this.tag}`));
      }
      await this.#run(core, ['npm', 'install', '--package-lock-only', '--no-audit', '--no-fund']);
      await this.#gate('atc-service-core', core, state);
      await this.#commit(core, `release: ${this.tag}`);
    }
    if (!(await this.#remoteTag(core))) {
      await this.#run(core, ['git', 'tag', '-a', this.tag, '-m', `Release ${this.tag}`]);
      await this.#run(core, ['git', 'push', '-q', 'origin', 'main', this.tag]);
    }

    for (const { id } of REPOSITORIES.filter((r) => r.id !== 'atc-service-core')) {
      const dir = this.#dir(id);
      if (await this.#done(dir)) continue;
      this.#bump(dir);
      const pkg = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8'));
      if (pkg.dependencies?.['@atc-web/atc-service-core']) {
        await this.#run(dir, ['npm', 'install', `@atc-web/atc-service-core@github:${Release.OWNER}/atc-service-core#${this.tag}`, '--no-audit', '--no-fund']);
      } else {
        await this.#run(dir, ['npm', 'install', '--package-lock-only', '--no-audit', '--no-fund']);
      }
      await this.#gate(id, dir, state);
      await this.#commit(dir, `release: ${this.tag}`);
    }

    const stack = this.stackDir;
    if (!(await this.#done(stack, `release: ${this.tag} candidate`))) {
      this.#bump(stack);
      await this.#run(stack, ['npm', 'install', '--package-lock-only', '--no-audit', '--no-fund']);
      for (const path of this.#stackDocs()) writeFileSync(path, Release.retag(readFileSync(path, 'utf8'), state.previous, this.version));
      const manifests = join(stack, 'installation-manifests');
      const previous = JSON.parse(readFileSync(join(manifests, `v${state.previous}.json`), 'utf8'));
      /** @type {Record<string, string>} */
      const commits = {};
      for (const { id } of REPOSITORIES) commits[id] = await this.#git(this.#dir(id), ['rev-parse', 'HEAD']);
      writeFileSync(join(manifests, `${this.tag}.json`), Release.manifest(previous, this.version, commits));
      writeFileSync(join(manifests, 'supported.json'), `${JSON.stringify({ schemaVersion: 1, release: this.version }, null, 2)}\n`);
      for (const old of [`installation-manifests/v${state.previous}.json`, `releases/v${state.previous}.md`, `releases/v${state.previous}.json`]) {
        if (existsSync(join(stack, old))) await this.#run(stack, ['git', 'rm', '-q', old]);
      }
      await this.#gate('atc-stack', stack, state, { audit: false });
      await this.#commit(stack, `release: ${this.tag} candidate`);
    }
    state.steps.prepared = true;
    this.#save(state);
    this.log(`prepare ${this.tag}: 15 repositories bumped, service-core tagged, candidate manifest pushed`);
    return state;
  }

  // ----------------------------------------------------------------- verify

  async verify() {
    const state = this.#state();
    if (!state.steps.prepared) throw new ReleaseError(`run release:prepare ${this.version} first`);
    const stack = this.stackDir;
    await this.#run(stack, ['node', 'bin/stack.js', 'setup']);
    const integration = { STACK_INTEGRATION: '1' };
    state.tests['atc-stack'] = Release.passed((await this.#run(stack, ['npm', 'test'], integration)).out);
    await this.#run(stack, ['npm', 'run', '-s', 'contracts:check']);
    state.steps.clientsSmoke = Release.passed((await this.#run(stack, ['npm', 'run', '-s', 'clients:smoke'], integration)).out);
    state.steps.mcpE2e = Release.passed((await this.#run(stack, ['npm', 'run', '-s', 'mcp:e2e'], integration)).out);

    const consoleDir = this.#dir('atc-console');
    await this.#run(consoleDir, ['npm', 'run', '-s', 'build']);
    for (const smoke of Release.CONSOLE_SMOKES) {
      await this.#run(consoleDir, ['node', '--disable-warning=ExperimentalWarning', `scripts/verify-sveltekit-${smoke}.mjs`]);
    }
    state.steps.consoleSmokes = Release.CONSOLE_SMOKES;

    state.steps.docker = await this.#docker();
    state.steps.candidateInstall = await this.#install(['--ref', 'main']);
    this.#save(state);
    this.log(`verify ${this.tag}: integration, contracts, Console smokes, ${state.steps.docker} Docker images, candidate install OK`);
    return state;
  }

  // ---------------------------------------------------------------- publish

  async publish() {
    const state = this.#state();
    if (!state.steps.candidateInstall) throw new ReleaseError(`run release:verify ${this.version} first`);
    const manifest = JSON.parse(readFileSync(join(this.stackDir, 'installation-manifests', `${this.tag}.json`), 'utf8'));
    const candidate = await this.#git(this.stackDir, ['log', '-1', '--format=%H', '--grep', `^release: ${this.tag} candidate$`]);
    /** @type {[string, string, string][]} */
    const targets = Object.entries(manifest.repositories).map(([id, e]) => /** @type {[string, string, string]} */ ([id, this.#dir(id), e.commit]));
    targets.push(['atc-stack', this.stackDir, candidate]);
    for (const [id, dir, commit] of targets) {
      if (await this.#remoteTag(dir)) continue;
      if ((await this.#git(dir, ['rev-parse', 'HEAD'])) !== commit) throw new ReleaseError(`${id} HEAD moved away from ${commit}`);
      await this.#run(dir, ['git', 'tag', '-a', this.tag, '-m', `Release ${this.tag}`, commit]);
      await this.#run(dir, ['git', 'push', '-q', 'origin', this.tag]);
      if ((await this.#remoteTag(dir)) !== commit) throw new ReleaseError(`${id} remote tag does not peel to ${commit}`);
    }
    state.steps.defaultInstall = await this.#install([], { suites: true, reuse: true });

    /** @type {Record<string, { tagObject: string, commit: string }>} */
    const tags = {};
    for (const [id, dir] of targets) {
      tags[id] = { tagObject: await this.#git(dir, ['rev-parse', this.tag]), commit: await this.#git(dir, ['rev-parse', `${this.tag}^{commit}`]) };
    }
    const today = new Date().toISOString().slice(0, 10);
    writeFileSync(join(this.stackDir, 'releases', `${this.tag}.json`), `${JSON.stringify(Release.evidence(state, tags, today), null, 2)}\n`);
    const projectState = join(this.stackDir, 'PROJECT_STATE.md');
    writeFileSync(projectState, Release.projectState(readFileSync(projectState, 'utf8'), this.version, tags, today));
    await this.#run(this.stackDir, ['npm', 'test']);
    await this.#commit(this.stackDir, `docs: record ${this.tag} release evidence`);
    state.steps.published = true;
    this.#save(state);
    this.log(`publish ${this.tag}: ${targets.length} tags pushed, default install verified, evidence recorded`);
    return state;
  }

  // ------------------------------------------------------- pure transforms

  /** Change only the top-level `"version"` of a package.json text. @param {string} text @param {string} version */
  static bumpJson(text, version) {
    const next = text.replace(/^(\s*"version":\s*")[^"]+(")/m, `$1${version}$2`);
    if (next === text && !text.includes(`"version": "${version}"`)) throw new ReleaseError('package.json has no version field');
    return next;
  }

  /** Replace one exact version string, never a longer number that merely contains it. @param {string} text @param {string} from @param {string} to */
  static retag(text, from, to) {
    const escaped = from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return text.replace(new RegExp(`(?<![\\d.])${escaped}(?![\\d.])`, 'g'), () => to);
  }

  /**
   * The next installation manifest: previous shape, new release, tags and commits, one line per repository.
   * @param {{ repositories: Record<string, { repository: string }> } & Record<string, unknown>} previous
   * @param {string} version
   * @param {Record<string, string>} commits
   */
  static manifest(previous, version, commits) {
    const repositories = Object.fromEntries(Object.entries(previous.repositories).map(([id, entry]) => {
      if (!commits[id]) throw new ReleaseError(`no commit for ${id}`);
      return [id, { repository: entry.repository, tag: `v${version}`, commit: commits[id] }];
    }));
    const text = JSON.stringify({ ...previous, release: version, repositories }, null, 2);
    return `${text.replace(/\{\n\s+"repository": ("[^"]+"),\n\s+"tag": ("[^"]+"),\n\s+"commit": ("[^"]+")\n\s+\}/g, (_, r, t, c) => `{ "repository": ${r}, "tag": ${t}, "commit": ${c} }`)}\n`;
  }

  /** `# pass N` from node:test output; throws when anything failed. @param {string} out */
  static passed(out) {
    const pass = /^# pass (\d+)$/m.exec(out);
    const fail = /^# fail (\d+)$/m.exec(out);
    if (!pass || !fail) throw new ReleaseError('test output has no node:test summary');
    if (Number(fail[1]) !== 0) throw new ReleaseError(`${fail[1]} test(s) failed`);
    return Number(pass[1]);
  }

  /**
   * Release evidence written to `releases/v<version>.json`.
   * @param {Record_} state
   * @param {Record<string, { tagObject: string, commit: string }>} tags
   * @param {string} date
   */
  static evidence(state, tags, date) {
    const steps = /** @type {Record<string, any>} */ (state.steps);
    return {
      schemaVersion: 1,
      release: state.version,
      releasedAt: date,
      status: 'verified',
      supersedes: state.previous,
      releasePolicy: 'annotated Git tags; no GitHub Release object and no GitHub Actions',
      releaseMatrix: Object.keys(tags).sort().map((repo) => ({ repo, version: state.version, tag: `v${state.version}`, ...tags[repo] })),
      publication: {
        manifest: `installation-manifests/v${state.version}.json`,
        supportedRelease: state.version,
        stackTagCommit: tags['atc-stack'].commit,
        remoteTagsVerified: Object.keys(tags).length,
        forcePushUsed: false,
        historicalTagsMoved: false,
      },
      tests: {
        repositoryTestsPassed: Object.fromEntries(Object.entries(state.tests).sort(([a], [b]) => a.localeCompare(b))),
        clientsSmoke: steps.clientsSmoke,
        mcpE2e: steps.mcpE2e,
        consoleSmokes: steps.consoleSmokes,
        docker: `${steps.docker}/${SERVICES.length} healthy as non-root node, SIGTERM exit 0`,
        productionAudit: 0,
      },
      candidateInstall: steps.candidateInstall,
      defaultInstall: steps.defaultInstall,
    };
  }

  /**
   * Point PROJECT_STATE.md at the new release: verification line, repository table, current release.
   * @param {string} text
   * @param {string} version
   * @param {Record<string, { commit: string }>} tags
   * @param {string} date
   */
  static projectState(text, version, tags, date) {
    let next = text.replace(/Last source verification: \d{4}-\d{2}-\d{2} \(v[\d.]+\)\./, `Last source verification: ${date} (v${version}).`);
    next = next.replace(/^\| (atc-[a-z-]+) \| ([^|]+?) \| `[0-9a-f]{40}` \| `v[\d.]+` → `[0-9a-f]{40}` \|/gm, (row, id, role) => {
      const commit = tags[id]?.commit;
      return commit ? `| ${id} | ${role} | \`${commit}\` | \`v${version}\` → \`${commit}\` |` : row;
    });
    next = next.replace(/\| v[\d.]+ published and verified \|/, `| v${version} published and verified |`);
    next = next.replace(/- Supported release: all 15 repositories at `v[\d.]+`\./, `- Supported release: all 15 repositories at \`v${version}\`.`);
    next = next.replace(/- `atc-stack` `v[\d.]+` peels to `[0-9a-f]+`; `atc-service-core`\n  `v[\d.]+` peels to `[0-9a-f]+`\./,
      `- \`atc-stack\` \`v${version}\` peels to \`${tags['atc-stack'].commit}\`; \`atc-service-core\`\n  \`v${version}\` peels to \`${tags['atc-service-core'].commit}\`.`);
    return next;
  }

  // -------------------------------------------------------------- internals

  /** @returns {Record_} */
  #state() {
    if (existsSync(this.statePath)) return JSON.parse(readFileSync(this.statePath, 'utf8'));
    const previous = JSON.parse(readFileSync(join(this.stackDir, 'installation-manifests', 'supported.json'), 'utf8')).release;
    return { version: this.version, previous, tests: {}, steps: {} };
  }

  /** @param {Record_} state */
  #save(state) {
    mkdirSync(join(this.stackDir, '.release'), { recursive: true });
    writeFileSync(this.statePath, `${JSON.stringify(state, null, 2)}\n`);
  }

  /** @param {string} id */
  #dir(id) {
    return id === 'atc-stack' ? this.stackDir : join(this.root, id);
  }

  /** Markdown that names the suite version: README, mcp/README and docs/. */
  #stackDocs() {
    const docs = join(this.stackDir, 'docs');
    return [join(this.stackDir, 'README.md'), join(this.stackDir, 'mcp', 'README.md'),
      ...(existsSync(docs) ? readdirSync(docs).filter((f) => f.endsWith('.md')).map((f) => join(docs, f)) : [])].filter((p) => existsSync(p));
  }

  /** Every repository on a clean, synchronized `main`. @param {string[]} allowedInStack */
  async #preflight(allowedInStack) {
    for (const { id } of [...REPOSITORIES, { id: 'atc-stack' }]) {
      const dir = this.#dir(id);
      if (!existsSync(dir)) throw new ReleaseError(`${id} is missing from the workspace`);
      if ((await this.#git(dir, ['rev-parse', '--abbrev-ref', 'HEAD'])) !== 'main') throw new ReleaseError(`${id} is not on main`);
      const dirty = (await this.#git(dir, ['status', '--porcelain'])).split('\n').filter(Boolean)
        .filter((line) => !(id === 'atc-stack' && allowedInStack.includes(line.slice(3))));
      if (dirty.length) throw new ReleaseError(`${id} has uncommitted changes: ${dirty.join(', ')}`);
      await this.#run(dir, ['git', 'fetch', '-q', 'origin', 'main']);
      if ((await this.#git(dir, ['rev-list', '--count', 'HEAD...origin/main'])) !== '0') throw new ReleaseError(`${id} is not in sync with origin/main`);
    }
  }

  /** Already released in this run: version bumped and committed. @param {string} dir @param {string} [subject] */
  async #done(dir, subject = `release: ${this.tag}`) {
    const pkg = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8'));
    return pkg.version === this.version && (await this.#git(dir, ['log', '-1', '--format=%s'])) === subject;
  }

  /** @param {string} dir */
  #bump(dir) {
    const path = join(dir, 'package.json');
    writeFileSync(path, Release.bumpJson(readFileSync(path, 'utf8'), this.version));
  }

  /** `npm ci`, tests, typecheck and the production audit for one repository. @param {string} id @param {string} dir @param {Record_} state @param {{ audit?: boolean }} [o] */
  async #gate(id, dir, state, { audit = true } = {}) {
    if (id !== 'atc-stack') await this.#run(dir, ['npm', 'ci', '--no-audit', '--no-fund']);
    state.tests[id] = Release.passed((await this.#run(dir, ['npm', 'test'])).out);
    await this.#run(dir, ['npm', 'run', '-s', 'typecheck']);
    if (audit) await this.#run(dir, ['npm', 'audit', '--omit=dev']);
    this.#save(state);
    this.log(`  ${id}: ${state.tests[id]} tests passed`);
  }

  /** @param {string} dir @param {string} message */
  async #commit(dir, message) {
    await this.#run(dir, ['git', 'add', '-A']);
    await this.#run(dir, ['git', 'commit', '-q', '-m', message]);
    await this.#run(dir, ['git', 'push', '-q', 'origin', 'main']);
  }

  /** The commit the remote tag peels to, or null. @param {string} dir */
  async #remoteTag(dir) {
    const out = await this.#git(dir, ['ls-remote', 'origin', `refs/tags/${this.tag}^{}`]);
    return out ? out.split('\t')[0] : null;
  }

  /** Build, run, probe and stop every service image with the workspace configuration. */
  async #docker() {
    const scratch = mkdtempSync(join(tmpdir(), 'atc-release-docker-'));
    const started = [];
    try {
      for (const s of SERVICES) {
        const dir = this.#dir(s.id);
        const env = readFileSync(join(dir, '.env'), 'utf8').split('\n').filter((line) => line && !Release.HOST_ONLY_ENV.test(line));
        const envFile = join(scratch, `${s.id}.env`);
        writeFileSync(envFile, `${env.join('\n')}\n`);
        const port = Number(/^PORT=(\d+)$/m.exec(env.join('\n'))?.[1]);
        /** @type {Record<string, string[]>} */
        const mounts = {
          'atc-auth': ['-v', `${join(dir, 'keys')}:/keys:ro`],
          'atc-console': ['-v', `${join(dir, 'services.json')}:/config/services.json:ro`],
          'atc-gateway': ['-v', `${join(dir, 'routes.json')}:/config/routes.json:ro`],
        };
        const image = `${s.id}:release-check`;
        await this.#run(dir, ['docker', 'build', '-q', '-t', image, '.']);
        await this.#run(dir, ['docker', 'run', '-d', '--name', `${s.id}-release-check`, '-p', `127.0.0.1:${40000 + port}:${port}`, '--env-file', envFile, ...(mounts[s.id] ?? []), image]);
        started.push(s.id);
      }
      for (const id of started) {
        const deadline = Date.now() + 120_000;
        let status = '';
        while (Date.now() < deadline) {
          status = (await this.exec(this.root, ['docker', 'inspect', '-f', '{{.State.Health.Status}}/{{.Config.User}}', `${id}-release-check`], { stdio: 'pipe' })).out.trim();
          if (status.startsWith('healthy') || status.startsWith('unhealthy')) break;
          await new Promise((r) => setTimeout(r, 2_000));
        }
        if (status !== 'healthy/node') throw new ReleaseError(`${id} container is ${status || 'not reporting health'}`);
      }
      for (const id of started) {
        await this.#run(this.root, ['docker', 'stop', '-t', '90', `${id}-release-check`]);
        const code = (await this.#run(this.root, ['docker', 'inspect', '-f', '{{.State.ExitCode}}', `${id}-release-check`])).out.trim();
        if (code !== '0') throw new ReleaseError(`${id} exited ${code} on SIGTERM`);
      }
      return started.length;
    } finally {
      for (const s of SERVICES) {
        await this.exec(this.root, ['docker', 'rm', '-f', `${s.id}-release-check`], { stdio: 'pipe' }).catch(() => null);
        await this.exec(this.root, ['docker', 'rmi', '-f', `${s.id}:release-check`], { stdio: 'pipe' }).catch(() => null);
      }
      rmSync(scratch, { recursive: true, force: true });
    }
  }

  /**
   * Fresh `install:all` from GitHub into a scratch workspace with its own PM2 home.
   * @param {string[]} args
   * @param {{ suites?: boolean, reuse?: boolean }} [o]
   */
  async #install(args, { suites = false, reuse = false } = {}) {
    const busy = await fetch('http://127.0.0.1:3004/health').then(() => true, () => false);
    if (busy) throw new ReleaseError('ports 3000-3012 are in use; stop the local stack before verifying an install');
    const scratch = mkdtempSync(join(tmpdir(), 'atc-release-install-'));
    const env = { PM2_HOME: join(scratch, 'pm2') };
    const stack = join(scratch, 'atc-stack');
    const manifest = JSON.parse(readFileSync(join(this.stackDir, 'installation-manifests', `${this.tag}.json`), 'utf8'));
    try {
      await this.#run(scratch, ['git', 'clone', '-q', `https://github.com/${Release.OWNER}/atc-stack.git`]);
      await this.#run(stack, ['npm', 'ci', '--no-audit', '--no-fund']);
      const first = await this.#run(stack, ['node', 'bin/stack.js', 'install:all', ...args], env);
      const result = { mode: args.length ? args.join(' ') : 'release', readiness: Release.#ready(first.out) };
      let match = 0;
      for (const [id, entry] of Object.entries(manifest.repositories)) {
        if ((await this.#git(join(scratch, id), ['rev-parse', 'HEAD'])) === entry.commit) match += 1;
      }
      if (match !== REPOSITORIES.length) throw new ReleaseError(`install matched ${match}/${REPOSITORIES.length} manifest commits`);
      Object.assign(result, { manifestMatch: `${match}/${REPOSITORIES.length}` });
      if (suites) {
        let exact = 0;
        for (const { id } of [...REPOSITORIES, { id: 'atc-stack' }]) {
          const dir = join(scratch, id);
          const tag = (await this.exec(dir, ['git', 'describe', '--tags', '--exact-match'], { stdio: 'pipe' })).out.trim();
          if (tag === this.tag && !(await this.#git(dir, ['status', '--porcelain']))) exact += 1;
        }
        if (exact !== REPOSITORIES.length + 1) throw new ReleaseError(`only ${exact} installed repositories sit cleanly on ${this.tag}`);
        /** @type {Record<string, number>} */
        const installedSuites = {};
        for (const id of Release.INSTALLED_SUITES) installedSuites[id] = Release.passed((await this.#run(join(scratch, id), ['npm', 'test'])).out);
        Object.assign(result, { exactTags: `${exact}/${exact} clean`, installedSuites });
      }
      if (reuse) {
        const again = await this.#run(stack, ['node', 'bin/stack.js', 'install:all', ...args], env);
        if (!/repositories: 0 clone, 14 reuse/.test(again.out)) throw new ReleaseError('the second install did not reuse every repository');
        Object.assign(result, { reuse: `0 clone, 14 reuse, ${Release.#ready(again.out)} ready` });
      }
      return result;
    } finally {
      await this.exec(stack, ['node', 'bin/stack.js', 'down'], { stdio: 'pipe', env }).catch(() => null);
      await this.exec(scratch, ['npx', '-y', 'pm2', 'kill'], { stdio: 'pipe', env }).catch(() => null);
      rmSync(scratch, { recursive: true, force: true });
    }
  }

  /** @param {string} out */
  static #ready(out) {
    const ready = /^ready:\s+(\d+)\/(\d+)$/m.exec(out);
    if (!ready || ready[1] !== ready[2]) throw new ReleaseError(`install:all did not report every service ready (${ready?.[0] ?? 'no ready line'})`);
    return `${ready[1]}/${ready[2]}`;
  }

  /** @param {string} dir @param {string[]} args */
  async #git(dir, args) {
    return (await this.#run(dir, ['git', ...args])).out.trim();
  }

  /** @param {string} cwd @param {string[]} argv @param {Record<string, string>} [env] */
  async #run(cwd, argv, env) {
    const result = await this.exec(cwd, argv, { stdio: 'pipe', env });
    if (result.code !== 0) throw new ReleaseError(`${argv.join(' ')} failed in ${cwd} (exit ${result.code})\n${result.out.slice(-2000)}`);
    return result;
  }

  /** @type {Exec} */
  static exec(cwd, argv, { stdio = 'inherit', env } = {}) {
    return new Promise((resolve, reject) => {
      const [cmd, ...args] = argv;
      const executable = process.platform === 'win32' && ['npm', 'npx'].includes(cmd) ? `${cmd}.cmd` : cmd;
      const child = spawn(executable, args, { cwd, env: { ...process.env, ...env }, stdio: stdio === 'pipe' ? ['ignore', 'pipe', 'pipe'] : 'inherit', shell: false });
      let out = '';
      child.stdout?.on('data', (d) => { out += d; });
      child.stderr?.on('data', (d) => { out += d; });
      child.on('error', reject);
      child.on('exit', (code) => resolve({ code: code ?? 1, out }));
    });
  }
}
