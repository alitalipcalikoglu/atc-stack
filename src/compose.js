import { chmodSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { DATA_FILES, SERVICES } from './manifest.js';
import { SetupContext } from './setup-context.js';

/**
 * The setup context for Docker Compose: services reach each other by container name on one
 * network, the browser reaches the published ports on localhost, and paths are the images' own
 * (`/data`, `/config`, `/keys`), so relative paths from a local `.env` are dropped.
 */
export class ComposeContext extends SetupContext {
  /** @param {{ root: string, portOffset?: number }} o */
  constructor({ root, portOffset = 0 }) {
    super({ root, host: '0.0.0.0', local: true, run: () => { throw new Error('compose generation runs no commands; run "npm run setup" first'); } });
    this.portOffset = portOffset;
  }

  /** @param {string} id */
  url(id) {
    return `http://${id}:${SetupContext.port(id)}`;
  }

  /** @param {string} id */
  publicUrl(id) {
    return `http://localhost:${SetupContext.port(id) + this.portOffset}`;
  }

  /** Outbound callers (scheduler, webhook-out) may reach the other containers by name. @param {string} id */
  outbound(id) {
    void id;
    return { TARGET_ALLOW_HTTP: 'true', TARGET_ALLOW_PRIVATE: 'true', TARGET_ALLOWED_HOSTS: [...SERVICES.map((s) => s.id), 'localhost'].join(',') };
  }
}

/**
 * Generates `compose/docker-compose.yml` that builds every service from its own Dockerfile, plus
 * one env file per service (`compose/env/<id>.env`, 0600, secrets reused from the local `.env`
 * files) and the gateway's and console's config files. Only the gateway (3000), the console (3004)
 * and media (3003, signed file URLs) are published, on 127.0.0.1. Everything under `compose/` is
 * generated and untracked.
 */
export class Compose {
  /** Ports reachable from the host; everything else stays on the compose network. */
  static PUBLISHED = Object.freeze(['atc-gateway', 'atc-console', 'atc-media']);

  /** @param {{ root: string, stackDir: string, portOffset?: number }} o `portOffset` moves the published host ports (when the PM2 stack already uses them). */
  constructor({ root, stackDir, portOffset = 0 }) {
    this.root = root;
    this.stackDir = stackDir;
    this.portOffset = portOffset;
    this.outDir = join(stackDir, 'compose');
  }

  /** @returns {{ file: string, services: number, published: string[] }} */
  generate() {
    for (const s of SERVICES) if (!existsSync(join(this.root, s.id, 'Dockerfile'))) throw new Error(`${s.id}: no Dockerfile in ${join(this.root, s.id)}`);
    if (!existsSync(join(this.root, 'atc-auth', 'keys', 'jwt-private.pem'))) throw new Error('atc-auth has no JWT key pair yet; run "npm run setup" first');
    const c = new ComposeContext({ root: this.root, portOffset: this.portOffset });
    /** @type {Map<string, Record<string, string>>} */
    const files = new Map();
    for (const s of SERVICES) {
      const e = c.env(s.id);
      e.set('PORT', String(s.port)).set('HOST', '0.0.0.0');
      for (const [k, v] of Object.entries(s.env(c))) e.set(k, v);
      if (s.files) files.set(s.id, s.files(c));
    }
    // The backup service reads every data volume, mounted under /sources/<id>.
    c.env('atc-backup').set('BACKUP_SOURCES', Object.entries(DATA_FILES).map(([id, file]) => `${id}=/sources/${id}/${file}`).join(','));
    mkdirSync(join(this.outDir, 'env'), { recursive: true, mode: 0o700 });
    for (const s of SERVICES) {
      const path = join(this.outDir, 'env', `${s.id}.env`);
      writeFileSync(path, Compose.envText(c.env(s.id).toObject()), { mode: 0o600 });
      chmodSync(path, 0o600);
    }
    for (const [id, fs] of files) {
      const dir = join(this.outDir, 'config', id);
      mkdirSync(dir, { recursive: true });
      for (const [name, text] of Object.entries(fs)) writeFileSync(join(dir, name), text);
    }
    const file = join(this.outDir, 'docker-compose.yml');
    writeFileSync(file, Compose.yaml(this.document()));
    return { file, services: SERVICES.length, published: Compose.PUBLISHED.map((id) => `${id} ${SetupContext.port(id) + this.portOffset}`) };
  }

  /** The compose document as plain data (paths relative to `compose/`). */
  document() {
    const rel = (/** @type {string} */ p) => relative(this.outDir, p) || '.';
    /** @type {Record<string, any>} */
    const services = {};
    /** @type {Record<string, object>} */
    const volumes = {};
    for (const s of SERVICES) {
      /** @type {string[]} */
      const mounts = [];
      if (s.id in DATA_FILES || s.id === 'atc-backup') { mounts.push(`${s.id}-data:/data`); volumes[`${s.id}-data`] = {}; }
      if (s.id === 'atc-auth') mounts.push(`${rel(join(this.root, 'atc-auth', 'keys'))}:/keys:ro`);
      if (s.id === 'atc-gateway' || s.id === 'atc-console') mounts.push(`./config/${s.id}:/config:ro`);
      // SQLite reads a WAL database through its -shm file, so the source volumes are mounted read-write.
      if (s.id === 'atc-backup') for (const id of Object.keys(DATA_FILES)) mounts.push(`${id}-data:/sources/${id}`);
      services[s.id] = {
        build: { context: rel(join(this.root, s.id)) },
        image: `atc-web/${s.id}:local`,
        restart: 'unless-stopped',
        env_file: [`./env/${s.id}.env`],
        ...(Compose.PUBLISHED.includes(s.id) ? { ports: [`127.0.0.1:${s.port + this.portOffset}:${s.port}`] } : {}),
        ...(mounts.length ? { volumes: mounts } : {}),
        ...(Compose.dependsOn(s.id) ? { depends_on: Compose.dependsOn(s.id) } : {}),
        stop_grace_period: '35s',
      };
    }
    return { name: 'atc-web', services, volumes };
  }

  /**
   * Start order where it matters: the gateway needs auth's keys; backup and status look at every
   * other service at start (data files, /health and /ready), so they wait until those are healthy.
   * @param {string} id
   * @returns {Record<string, { condition: string }>|null}
   */
  static dependsOn(id) {
    const healthy = (/** @type {string[]} */ ids) => Object.fromEntries(ids.map((x) => [x, { condition: 'service_healthy' }]));
    if (id === 'atc-gateway') return healthy(['atc-auth']);
    if (id === 'atc-backup' || id === 'atc-status') return healthy(SERVICES.map((s) => s.id).filter((x) => x !== 'atc-backup' && x !== 'atc-status'));
    return null;
  }

  /**
   * `KEY=value` lines for an env file: plain when safe, single-quoted (literal) otherwise.
   * @param {Record<string, string>} env
   */
  static envText(env) {
    const lines = ['# Generated by "npm run compose". Contains secrets; do not commit.'];
    for (const [k, raw] of Object.entries(env)) {
      if (/^\.\.?\//.test(raw)) continue; // a host path from a local .env; the image has its own
      let v = raw;
      if (!/^[A-Za-z0-9_.,:/@+=%-]*$/.test(v)) v = v.includes("'") ? `"${v.replace(/["\\$]/g, '\\$&')}"` : `'${v}'`;
      lines.push(`${k}=${v}`);
    }
    return `${lines.join('\n')}\n`;
  }

  /**
   * Minimal YAML for nested maps, lists and scalars (strings JSON-quoted, which YAML accepts).
   * @param {unknown} v @param {number} [indent]
   * @returns {string}
   */
  static yaml(v, indent = 0) {
    const pad = ' '.repeat(indent);
    if (Array.isArray(v)) return v.map((x) => `${pad}- ${Compose.#scalar(x)}`).join('\n');
    return Object.entries(/** @type {Record<string, unknown>} */ (v)).map(([k, x]) => {
      if (x && typeof x === 'object' && !Array.isArray(x)) return Object.keys(x).length ? `${pad}${k}:\n${Compose.yaml(x, indent + 2)}` : `${pad}${k}: {}`;
      if (Array.isArray(x)) return `${pad}${k}:\n${Compose.yaml(x, indent + 2)}`;
      return `${pad}${k}: ${Compose.#scalar(x)}`;
    }).join('\n') + (indent === 0 ? '\n' : '');
  }

  /** @param {unknown} x */
  static #scalar(x) {
    return typeof x === 'string' ? JSON.stringify(x) : String(x);
  }
}
