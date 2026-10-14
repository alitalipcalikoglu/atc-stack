import { join } from 'node:path';
import { EnvFile } from './env-file.js';

/**
 * A small HTTP load generator on the standard library: `concurrency` fetch loops per route for
 * `durationMs`, against routes of the gateway. Reports per route requests, rate, latency
 * percentiles (p50/p95/p99/max), errors (network failures and 5xx), 429s and other unexpected
 * statuses. No dependency; numbers are from the client side, including the network.
 */
export class LoadTest {
  /** Public gateway routes that need no key and change nothing. */
  static DEFAULT_ROUTES = Object.freeze([
    { name: 'gateway health', method: 'GET', path: '/health' },
    { name: 'jwks', method: 'GET', path: '/.well-known/jwks.json' },
    { name: 'status json', method: 'GET', path: '/status/summary.json' },
    { name: 'status page', method: 'GET', path: '/status' },
  ]);

  /**
   * @param {object} o
   * @param {string} o.baseUrl
   * @param {readonly { name: string, method: string, path: string, url?: string, body?: string, headers?: Record<string, string> }[]} [o.routes]
   *   A route with `url` (absolute) bypasses the base URL, to hit a service directly.
   * @param {number} [o.durationMs]
   * @param {number} [o.concurrency]   Parallel loops per route.
   * @param {number} [o.timeoutMs]     Per request.
   * @param {typeof fetch} [o.fetch]
   * @param {() => number} [o.now]     Milliseconds, high resolution.
   */
  constructor({ baseUrl, routes = LoadTest.DEFAULT_ROUTES, durationMs = 10_000, concurrency = 10, timeoutMs = 10_000, fetch: fetchImpl = fetch, now = () => performance.now() }) {
    this.baseUrl = baseUrl.replace(/\/+$/, '');
    this.routes = routes;
    this.durationMs = durationMs;
    this.concurrency = concurrency;
    this.timeoutMs = timeoutMs;
    this.fetch = fetchImpl;
    this.now = now;
  }

  /**
   * The write-heavy profile for the SQLite services that take a write per request: rate-limit
   * checks, queue enqueue + pull, and short-link clicks. It talks to the services directly with
   * the console's admin keys (read from the checkout's `.env` files) and creates the `loadtest`
   * policy and queue first. Run it to see how the single write lock behaves under concurrency.
   * @param {string} root  Workspace root.
   * @param {typeof fetch} [fetchImpl]
   */
  static async writeProfile(root, fetchImpl = fetch) {
    const env = (/** @type {string} */ id) => EnvFile.load(join(root, id, '.env'));
    const need = (/** @type {EnvFile} */ f, /** @type {string} */ k) => {
      const v = f.get(k);
      if (!v) throw new Error(`${k} is missing; run "npm run setup" first`);
      return v;
    };
    const consoleEnv = env('atc-console');
    const rl = { url: `http://127.0.0.1:${need(env('atc-ratelimit'), 'PORT')}`, key: need(consoleEnv, 'RATELIMIT_API_KEY') };
    const q = { url: `http://127.0.0.1:${need(env('atc-queue'), 'PORT')}`, key: need(consoleEnv, 'QUEUE_API_KEY') };
    const sl = { url: `http://127.0.0.1:${need(env('atc-shortlink'), 'PORT')}`, key: need(consoleEnv, 'SHORTLINK_API_KEY') };
    const call = async (/** @type {{ url: string, key: string }} */ svc, /** @type {string} */ method, /** @type {string} */ path, /** @type {object} */ body) => {
      const res = await fetchImpl(`${svc.url}${path}`, { method, headers: { authorization: `Bearer ${svc.key}`, 'content-type': 'application/json' }, body: JSON.stringify(body) });
      if (!res.ok && res.status !== 409) throw new Error(`${method} ${svc.url}${path} answered ${res.status}`);
      return res.status === 204 ? {} : /** @type {any} */ (await res.json());
    };
    await call(rl, 'POST', '/v1/policies', { name: 'loadtest', description: 'stack load profile', limits: [{ window: 60, limit: 1_000_000_000 }] });
    await call(q, 'PUT', '/v1/queues/loadtest', { description: 'stack load profile', visibilitySec: 1 });
    const link = await call(sl, 'POST', '/v1/links', { url: 'https://example.com/load', note: 'stack load profile' });
    const code = link.link?.code ?? 'loadtest';
    const publicBase = need(env('atc-shortlink'), 'PUBLIC_BASE_URL').replace(/\/+$/, '');
    /** @param {{ url: string, key: string }} svc */
    const auth = (svc) => ({ authorization: `Bearer ${svc.key}`, 'content-type': 'application/json' });
    return [
      { name: 'ratelimit check', method: 'POST', path: '', url: `${rl.url}/v1/check`, headers: auth(rl), body: JSON.stringify({ policy: 'loadtest', subject: 'load' }) },
      { name: 'queue enqueue', method: 'POST', path: '', url: `${q.url}/v1/queues/loadtest/messages`, headers: auth(q), body: JSON.stringify({ body: { n: 1 } }) },
      { name: 'queue pull', method: 'POST', path: '', url: `${q.url}/v1/queues/loadtest/pull`, headers: auth(q), body: JSON.stringify({ max: 10 }) },
      { name: 'shortlink click', method: 'GET', path: '', url: `${publicBase}/${code}` },
    ];
  }

  /** Routes from `--routes "GET /health,GET /status"`. @param {string} spec */
  static parseRoutes(spec) {
    return spec.split(',').map((s) => s.trim()).filter(Boolean).map((s) => {
      const m = /^(GET|HEAD|POST|PUT|PATCH|DELETE)\s+(\/\S*)$/i.exec(s);
      if (!m) throw new Error(`route "${s}" must look like "GET /path"`);
      return { name: `${m[1].toUpperCase()} ${m[2]}`, method: m[1].toUpperCase(), path: m[2] };
    });
  }

  /** Nearest-rank percentile of sorted values. @param {number[]} sorted @param {number} p */
  static percentile(sorted, p) {
    if (!sorted.length) return null;
    return sorted[Math.min(sorted.length - 1, Math.max(0, Math.ceil((p / 100) * sorted.length) - 1))];
  }

  /** Run every route at the same time and resolve with one result row per route. */
  async run() {
    const deadline = this.now() + this.durationMs;
    const started = this.now();
    const results = await Promise.all(this.routes.map(async (route) => {
      /** @type {number[]} */ const latencies = [];
      /** @type {Record<string, number>} */ const statuses = {};
      const counters = { requests: 0, errors: 0, limited: 0, unexpected: 0 };
      const loop = async () => {
        while (this.now() < deadline) {
          const t0 = this.now();
          try {
            const res = await this.fetch(route.url ?? `${this.baseUrl}${route.path}`, { method: route.method, headers: route.headers, body: route.body, redirect: 'manual', signal: AbortSignal.timeout(this.timeoutMs) });
            await res.arrayBuffer();
            statuses[res.status] = (statuses[res.status] ?? 0) + 1;
            if (res.status >= 500) counters.errors++;
            else if (res.status === 429) counters.limited++;
            else if (res.status >= 400) counters.unexpected++;
          } catch {
            counters.errors++;
            statuses.network = (statuses.network ?? 0) + 1;
          }
          counters.requests++;
          latencies.push(this.now() - t0);
        }
      };
      await Promise.all(Array.from({ length: this.concurrency }, loop));
      latencies.sort((a, b) => a - b);
      const seconds = Math.max(0.001, (this.now() - started) / 1000);
      const r = (/** @type {number|null} */ v) => (v === null ? null : Math.round(v * 10) / 10);
      return {
        route: route.name, requests: counters.requests, rps: Math.round((counters.requests / seconds) * 10) / 10,
        p50: r(LoadTest.percentile(latencies, 50)), p95: r(LoadTest.percentile(latencies, 95)), p99: r(LoadTest.percentile(latencies, 99)), max: r(latencies.at(-1) ?? null),
        errors: counters.errors, limited: counters.limited, unexpected: counters.unexpected, statuses,
      };
    }));
    return { baseUrl: this.baseUrl, durationMs: this.durationMs, concurrency: this.concurrency, results };
  }

  /** A fixed-width table. @param {Awaited<ReturnType<LoadTest['run']>>} report */
  static table(report) {
    const head = ['route', 'requests', 'rps', 'p50 ms', 'p95 ms', 'p99 ms', 'max ms', 'errors', '429', 'other 4xx'];
    const rows = report.results.map((x) => [x.route, x.requests, x.rps, x.p50 ?? '–', x.p95 ?? '–', x.p99 ?? '–', x.max ?? '–', x.errors, x.limited, x.unexpected].map(String));
    const widths = head.map((h, i) => Math.max(h.length, ...rows.map((row) => row[i].length)));
    const line = (/** @type {string[]} */ cells) => cells.map((c, i) => (i === 0 ? c.padEnd(widths[i]) : c.padStart(widths[i]))).join('  ');
    return [`${report.baseUrl}  ${report.durationMs / 1000}s  ${report.concurrency} loops per route`, line(head), ...rows.map(line)].join('\n');
  }
}
