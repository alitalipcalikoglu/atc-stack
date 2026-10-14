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
   * @param {readonly { name: string, method: string, path: string, body?: string, headers?: Record<string, string> }[]} [o.routes]
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
            const res = await this.fetch(`${this.baseUrl}${route.path}`, { method: route.method, headers: route.headers, body: route.body, redirect: 'manual', signal: AbortSignal.timeout(this.timeoutMs) });
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
