import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { SERVICES } from './manifest.js';

/**
 * Dependency hygiene across the workspace, on npm's own tools: known vulnerabilities in production
 * dependencies (`npm audit`), packages behind their latest release (`npm outdated`), and a
 * CycloneDX bill of materials per service (`npm sbom`). Nothing is changed; updating stays a
 * deliberate act per service.
 */
export class Deps {
  /**
   * @param {object} o
   * @param {string} o.root                Workspace root.
   * @param {(cwd: string, argv: string[], opts?: { stdio?: 'inherit'|'pipe' }) => Promise<{ code: number, out: string }>} o.exec
   * @param {(line: string) => void} [o.log]
   */
  constructor({ root, exec, log = () => {} }) {
    this.root = root;
    this.exec = exec;
    this.log = log;
  }

  /** The JSON document inside npm's output, which may carry warning lines around it. @param {string} out */
  static json(out) {
    const a = out.indexOf('{');
    const b = out.lastIndexOf('}');
    if (a < 0 || b < a) return null;
    try { return JSON.parse(out.slice(a, b + 1)); } catch { return null; }
  }

  /**
   * Audit and outdated check of every service.
   * @returns {Promise<{ results: { id: string, vulnerabilities: Record<string, number>, outdated: number, majorBehind: number, error?: string }[], failed: boolean }>}
   */
  async check() {
    const results = [];
    for (const s of SERVICES) {
      const cwd = join(this.root, s.id);
      const audit = Deps.json((await this.exec(cwd, ['npm', 'audit', '--omit=dev', '--json'], { stdio: 'pipe' })).out);
      const outdated = Deps.json((await this.exec(cwd, ['npm', 'outdated', '--json'], { stdio: 'pipe' })).out) ?? {};
      const entries = Object.values(outdated);
      const meta = audit?.metadata?.vulnerabilities;
      results.push({
        id: s.id,
        vulnerabilities: meta ?? {},
        outdated: entries.length,
        majorBehind: entries.filter((e) => Number(String(e.latest).split('.')[0]) > Number(String(e.current).split('.')[0])).length,
        ...(audit ? {} : { error: 'npm audit gave no result (offline?)' }),
      });
    }
    return { results, failed: results.some((r) => (r.vulnerabilities.high ?? 0) + (r.vulnerabilities.critical ?? 0) > 0 || r.error !== undefined) };
  }

  /** @param {Awaited<ReturnType<Deps['check']>>} report */
  static table(report) {
    const head = ['service', 'critical', 'high', 'moderate', 'low', 'outdated', 'major behind'];
    const rows = report.results.map((r) => [r.id, r.vulnerabilities.critical ?? 0, r.vulnerabilities.high ?? 0, r.vulnerabilities.moderate ?? 0, r.vulnerabilities.low ?? 0, r.outdated, r.majorBehind].map(String).concat(r.error ? [r.error] : []));
    const width = head.map((h, i) => Math.max(h.length, ...rows.map((r) => r[i].length)));
    const line = (/** @type {string[]} */ cells) => cells.map((c, i) => (i === 0 ? c.padEnd(width[0]) : c.padStart(width[i] ?? 0))).join('  ').trimEnd();
    return [line(head), ...rows.map(line)].join('\n');
  }

  /**
   * One CycloneDX JSON per service (production dependencies only) in `outDir`.
   * @param {string} outDir
   * @returns {Promise<{ written: string[], failed: string[] }>}
   */
  async sbom(outDir) {
    mkdirSync(outDir, { recursive: true });
    /** @type {string[]} */ const written = [];
    /** @type {string[]} */ const failed = [];
    for (const s of SERVICES) {
      const r = await this.exec(join(this.root, s.id), ['npm', 'sbom', '--sbom-format', 'cyclonedx', '--omit', 'dev', '--package-lock-only'], { stdio: 'pipe' });
      const doc = r.code === 0 ? Deps.json(r.out) : null;
      if (!doc) { failed.push(s.id); this.log(`${s.id}: no SBOM (${r.out.trim().split('\n')[0] ?? 'npm sbom failed'})`); continue; }
      const file = join(outDir, `${s.id}.cdx.json`);
      writeFileSync(file, `${JSON.stringify(doc, null, 2)}\n`);
      written.push(file);
    }
    return { written, failed };
  }
}
