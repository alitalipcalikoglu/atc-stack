// The hand-written tools: atc-stack.status and the first tools, whose names and handlers predate
// the generated operation tools (src/tools/services/) and stay as they are. src/tools/index.mjs
// combines both into the one exposed list.
//
// Every input schema's fields, constraints and requiredness are copied from that operation's own
// OpenAPI request schema (see the file-and-line citations in each tool's comment) -- never
// invented, never loosened or tightened relative to the real contract. Deep per-value validation
// (e.g. notify's per-template email `data` shape) intentionally stays server-side, not re-derived
// here a third time (see mcp/README.md's "input schemas" section).
import { z } from 'zod';
import { toolResult } from '../output.mjs';
import { SERVICES } from '../config.mjs';

/** @typedef {import('./operation.mjs').ToolDef} ToolDef */

/**
 * Shared response.status/data extraction + a request-id passthrough (x-request-id is safe/useful
 * for log correlation; every other header is either routine or internal-only per the Phase 0 audit).
 * @param {{ response: Response }} res
 */
function summarize(res) {
  return { status: res.response.status, requestId: res.response.headers.get('x-request-id') };
}

/** The operational probes atc-stack.status calls on every service, whatever each one named them. */
export const OPERATIONAL_PROBE_OPIDS = [
  'atc-gateway.health.check', 'atc-gateway.ready.check', 'atc-gateway.info.get',
  'atc-notify.health.get', 'atc-notify.ready.get', 'atc-notify.info.get',
  'atc-auth.health.get', 'atc-auth.ready.get', 'atc-auth.info.get',
  'atc-media.ops.health', 'atc-media.ops.ready', 'atc-media.ops.info',
  'atc-console.health.get', 'atc-console.ready.get', 'atc-console.info.get',
  'atc-audit.health.get', 'atc-audit.ready.get', 'atc-audit.info.get',
  'atc-shortlink.health.get', 'atc-shortlink.ready.get', 'atc-shortlink.info.get',
  'atc-flags.health.get', 'atc-flags.ready.get', 'atc-flags.info.get',
  'atc-scheduler.health.get', 'atc-scheduler.ready.get', 'atc-scheduler.info.get',
  'atc-webhook-out.health.get', 'atc-webhook-out.ready.get', 'atc-webhook-out.info.get',
  'atc-search.system.health', 'atc-search.system.ready', 'atc-search.system.info',
  'atc-ratelimit.health.check', 'atc-ratelimit.ready.check', 'atc-ratelimit.info.get',
  'atc-geo.health.check', 'atc-geo.ready.check', 'atc-geo.info.get',
  'atc-content.health.get', 'atc-content.ready.get', 'atc-content.info.get',
  'atc-export.health.get', 'atc-export.ready.get', 'atc-export.info.get',
  'atc-render.health.get', 'atc-render.ready.get', 'atc-render.info.get',
  'atc-queue.health.get', 'atc-queue.ready.get', 'atc-queue.info.get',
  'atc-backup.health.get', 'atc-backup.ready.get', 'atc-backup.info.get',
  'atc-status.health.get', 'atc-status.ready.get', 'atc-status.info.get',
  'atc-payments.health.get', 'atc-payments.ready.get', 'atc-payments.info.get',
];

/** @type {ToolDef[]} */
export const HAND_TOOLS = [
  // ---------------------------------------------------------------------------------------------
  // atc-stack.status -- MCP-native aggregate. Not one OpenAPI operationId: polls every configured
  // service's own /health + /ready + /v1/info (all three unauthenticated on every service, per the
  // Phase 0/1 audits), exactly the "operational aggregate" stack status --matrix already does at
  // the CLI layer. One dead/unconfigured service never fails the whole call -- its row just reports
  // the failure, per-service, so the tool stays useful when the platform is partially up.
  // ---------------------------------------------------------------------------------------------
  {
    name: 'atc-stack.status',
    operations: OPERATIONAL_PROBE_OPIDS,
    description:
      'Reports liveness (/health), readiness (/ready) and identity (/v1/info: version, apiVersion, ' +
      'capabilities, schemaVersion) for every configured atc-web service. Read-only, safe to call ' +
      'anytime. A service with no base URL configured for this MCP server is reported as ' +
      '"unconfigured", not as an error -- this tool never fails as a whole because one service is down.',
    inputSchema: {},
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
    async handler(_args, registry) {
      const rows = await Promise.all(
        SERVICES.map(async (service) => {
          if (!registry.config.services[service]?.baseUrl) return { service, configured: false };
          try {
            const client = await registry.probeClient(service);
            // operationId naming for the 3 operational probes is NOT consistent across the 13
            // specs (a real Phase 1 finding, worth fixing in a future contract pass, not silently
            // patched here): atc-gateway/atc-ratelimit/atc-geo use "atc-<svc>.health.check", most others
            // "<svc>.health.get", media uses "atc-media.ops.health", search uses
            // "atc-search.system.health" (entity and verb swapped). Matching on "does the operationId
            // contain this whole dot-segment" is robust to all three shapes without guessing which
            // one a given service picked.
            /** @param {string} word */
            const findOp = (word) => Object.keys(/** @type {object} */ (client)).find((k) => k.split('.').includes(word));
            const [healthKey, readyKey, infoKey] = [findOp('health'), findOp('ready'), findOp('info')];
            if (!healthKey || !readyKey || !infoKey) {
              return { service, configured: true, healthy: false, ready: false, error: 'could not find health/ready/info operations on the generated client' };
            }
            const [health, ready, info] = await Promise.all([client[healthKey]({}), client[readyKey]({}), client[infoKey]({})]);
            return {
              service,
              configured: true,
              healthy: health.response.status === 200,
              ready: ready.response.status === 200,
              version: info.data?.version ?? null,
              apiVersion: info.data?.apiVersion ?? null,
              schemaVersion: info.data?.schemaVersion ?? null,
              capabilities: info.data?.capabilities ?? null,
            };
          } catch (err) {
            return { service, configured: true, healthy: false, ready: false, error: err instanceof Error ? err.message : 'unreachable' };
          }
        }),
      );
      const upCount = rows.filter((r) => r.healthy).length;
      return toolResult({
        status: 200,
        data: { services: rows },
        summary: `${upCount}/${rows.filter((r) => r.configured).length} configured services healthy (${rows.length - rows.filter((r) => r.configured).length} unconfigured)`,
      });
    },
  },

  // ---------------------------------------------------------------------------------------------
  // atc-flags.evaluate -- authenticated read. atc-flags/openapi.yaml operationId atc-flags.evaluate.post,
  // request body EvaluateBody (env required; context.userId/email/attrs, keys, details all optional).
  // ---------------------------------------------------------------------------------------------
  {
    name: 'atc-flags.evaluate',
    operations: ['atc-flags.evaluate.post'],
    description:
      'Evaluates feature flags for one environment and (optional) targeting context. Read-only ' +
      '(no state changes -- evaluation only increments an in-process counter). An unknown key in ' +
      '`keys` evaluates to reason "missing", not an error.',
    inputSchema: {
      env: z.string().regex(/^[a-z][a-z0-9-]{0,31}$/, 'lowercase, starts with a letter, max 32 chars'),
      userId: z.string().min(1).max(128).optional(),
      email: z.string().min(3).max(254).optional(),
      attrs: z.record(z.string().regex(/^[a-zA-Z][a-zA-Z0-9_.-]{0,63}$/), z.string().max(128)).optional(),
      keys: z.array(z.string()).max(200).optional().describe('Narrows evaluation to these flag keys; omit to evaluate every non-archived flag.'),
      details: z.boolean().optional().describe('true: return {value, reason, ruleId?} per flag. false/omitted: bare values only.'),
    },
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: false, openWorldHint: false },
    async handler(args, registry) {
      const client = await registry.client('atc-flags');
      const { env, userId, email, attrs, keys, details } = args;
      const context = userId || email || attrs ? { userId, email, attrs } : undefined;
      const res = await client['atc-flags.evaluate.post']({ body: { env, context, keys, details } });
      if (res.error) throw res;
      return toolResult({ ...summarize(res), data: res.data });
    },
  },

  // ---------------------------------------------------------------------------------------------
  // atc-geo.ip.lookup -- authenticated read. atc-geo/openapi.yaml operationId atc-geo.ip.lookup, path {ip}, query {lang?}.
  // ---------------------------------------------------------------------------------------------
  {
    name: 'atc-geo.ip.lookup',
    operations: ['atc-geo.ip.lookup'],
    description:
      'Looks up country/region/city/coordinates/timezone (and ASN, if configured) for a public ' +
      'IPv4/IPv6 address. Private/loopback/reserved addresses are classified without a database ' +
      'lookup and always return found:false, never an error. Read-only.',
    inputSchema: {
      ip: z.string().min(2).max(64),
      lang: z.string().regex(/^[A-Za-z0-9-]+$/).min(2).max(35).optional(),
    },
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    async handler(args, registry) {
      const client = await registry.client('atc-geo');
      const res = await client['atc-geo.ip.lookup']({ params: { path: { ip: args.ip }, query: { lang: args.lang } } });
      if (res.error) throw res;
      return toolResult({ ...summarize(res), data: res.data });
    },
  },

  // ---------------------------------------------------------------------------------------------
  // atc-media.files.get -- authenticated read + real error path. atc-media/openapi.yaml operationId
  // atc-media.files.get, path {id}. Deliberately metadata-only: this tool never transports file bytes
  // through MCP (see mcp/README.md's "binary" section for why).
  // ---------------------------------------------------------------------------------------------
  {
    name: 'atc-media.files.get',
    operations: ['atc-media.files.get'],
    description:
      "Reads one file's metadata (name, mime, size, dimensions, visibility, URLs) by id. Does not " +
      'return file bytes -- use the `url` fields in the response to fetch content directly. A ' +
      "nonexistent or another key's file id returns a real 404, not an error thrown by this tool.",
    inputSchema: { id: z.string().uuid() },
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    async handler(args, registry) {
      const client = await registry.client('atc-media');
      const res = await client['atc-media.files.get']({ params: { path: { id: args.id } } });
      if (res.error) throw res;
      return toolResult({ ...summarize(res), data: res.data });
    },
  },

  // ---------------------------------------------------------------------------------------------
  // atc-notify.messages.list -- pagination proof (cursor-based). atc-notify/openapi.yaml operationId
  // atc-notify.messages.list, query {status?, limit?, cursor?}. Field names (items/nextCursor) are
  // notify's own real contract, not normalized to match any other service's list shape.
  // ---------------------------------------------------------------------------------------------
  {
    name: 'atc-notify.messages.list',
    operations: ['atc-notify.messages.list'],
    description:
      "Lists the calling API key's own queued/sent/failed messages, newest first. Cursor-paginated: " +
      'pass the previous call\'s `nextCursor` back as `cursor` to get the next page; `nextCursor: ' +
      'null` means there is no more data.',
    inputSchema: {
      status: z.enum(['queued', 'processing', 'sent', 'failed']).optional(),
      limit: z.number().int().min(1).max(100).optional().describe('Defaults to 20 when omitted.'),
      cursor: z.string().max(128).optional(),
    },
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    async handler(args, registry) {
      const client = await registry.client('atc-notify');
      const res = await client['atc-notify.messages.list']({
        params: { query: { status: args.status, limit: args.limit !== undefined ? String(args.limit) : undefined, cursor: args.cursor } },
      });
      if (res.error) throw res;
      return toolResult({ ...summarize(res), data: res.data });
    },
  },

  // ---------------------------------------------------------------------------------------------
  // atc-notify.messages.create -- async submit (safe mutation). atc-notify/openapi.yaml operationId
  // atc-notify.messages.create, body MessageCreateEmail (`channel` is always `email`, set by the
  // handler). Per-template `data` shape is intentionally NOT re-derived here (server-side
  // Ajv is the real validator for that) -- this schema only re-derives the OUTER contract shape.
  // ---------------------------------------------------------------------------------------------
  {
    name: 'atc-notify.messages.create',
    operations: ['atc-notify.messages.create'],
    description:
      'Queues an email for delivery. Returns immediately (202 new / 200 replay ' +
      'of an idempotencyKey) -- this does NOT mean delivery has happened, only that it was accepted. ' +
      'Use atc-notify.messages.get with the returned id to check real delivery status later.',
    inputSchema: {
      template: z.enum(['email-verification', 'password-reset', 'generic']),
      to: z.array(z.string().email()).min(1).max(10),
      data: z.record(z.string(), z.unknown()).describe('Validated server-side against the named template\'s schema.'),
      idempotencyKey: z.string().min(1).max(128).optional(),
    },
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true },
    async handler(args, registry) {
      const client = await registry.client('atc-notify');
      const body = { channel: /** @type {const} */ ('email'), template: args.template, to: args.to, data: args.data, idempotencyKey: args.idempotencyKey };
      const res = await client['atc-notify.messages.create']({ body });
      if (res.error) throw res;
      return toolResult({ ...summarize(res), data: res.data, summary: `message ${res.data?.id} queued, status ${res.response.status}` });
    },
  },

  // ---------------------------------------------------------------------------------------------
  // atc-notify.messages.get -- async status/read half of the same flow.
  // ---------------------------------------------------------------------------------------------
  {
    name: 'atc-notify.messages.get',
    operations: ['atc-notify.messages.get'],
    description:
      'Reads one message\'s current delivery state (queued/processing/sent/failed), attempt count ' +
      'and last error, by id. Use this to check on a message created with atc-notify.messages.create.',
    inputSchema: { id: z.string().uuid() },
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    async handler(args, registry) {
      const client = await registry.client('atc-notify');
      const res = await client['atc-notify.messages.get']({ params: { path: { id: args.id } } });
      if (res.error) throw res;
      return toolResult({ ...summarize(res), data: res.data });
    },
  },

  // ---------------------------------------------------------------------------------------------
  // atc-shortlink.links.create -- safe mutation (create, non-destructive). atc-shortlink/openapi.yaml
  // operationId atc-shortlink.links.create, body LinkCreate (url required).
  // ---------------------------------------------------------------------------------------------
  {
    name: 'atc-shortlink.links.create',
    operations: ['atc-shortlink.links.create'],
    description:
      'Creates a new short link for a URL. Non-destructive -- creates a new resource, never ' +
      'overwrites or deletes anything. Slug is auto-generated if omitted.',
    inputSchema: {
      url: z.string().min(8).max(8192).describe('Absolute http/https URL; must not point at the shortlink service itself.'),
      slug: z.string().regex(/^[A-Za-z0-9][A-Za-z0-9_-]{2,63}$/).optional(),
      permanent: z.boolean().optional().describe('301 vs 302 redirect. Defaults to the service config when omitted.'),
      expiresAt: z.string().max(40).nullable().optional().describe('ISO 8601, must be in the future.'),
      maxClicks: z.number().int().min(1).max(1_000_000_000).nullable().optional(),
      tags: z.array(z.string().min(1).max(40)).max(20).optional(),
      note: z.string().max(500).nullable().optional(),
    },
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
    async handler(args, registry) {
      const client = await registry.client('atc-shortlink');
      const res = await client['atc-shortlink.links.create']({ body: args });
      if (res.error) throw res;
      return toolResult({ ...summarize(res), data: res.data, summary: `created ${res.data?.link?.shortUrl ?? res.data?.link?.code}` });
    },
  },

  // ---------------------------------------------------------------------------------------------
  // atc-ratelimit.check -- read-only by construction: `peek` is hard-coded true in the handler, never
  // caller-controlled, so this tool can never consume real quota (a non-peek check is a real
  // mutation of a subject's counters -- deliberately left out of the initial allowlist).
  // atc-ratelimit/openapi.yaml operationId atc-ratelimit.check, body CheckRequest.
  // ---------------------------------------------------------------------------------------------
  {
    name: 'atc-ratelimit.check',
    operations: ['atc-ratelimit.check'],
    description:
      'Previews (does not consume) what a rate-limit decision would be for a subject against a ' +
      'policy. Always evaluated with peek:true -- this tool can never consume real quota. Note: ' +
      'the real, non-peek endpoint returns HTTP 200 for both an allow and a deny; the business ' +
      'decision is the `allowed` field, never the HTTP status -- this preview shares that shape.',
    inputSchema: {
      policy: z.string().min(1),
      subject: z.string().min(1),
      cost: z.number().int().min(0).optional().describe('Units that would be consumed by a real (non-peek) check. Default 1.'),
    },
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    async handler(args, registry) {
      const client = await registry.client('atc-ratelimit');
      const res = await client['atc-ratelimit.check']({ body: { policy: args.policy, subject: args.subject, cost: args.cost, peek: true } });
      if (res.error) throw res;
      return toolResult({ ...summarize(res), data: res.data, summary: `allowed=${res.data?.allowed}` });
    },
  },

  // ---------------------------------------------------------------------------------------------
  // atc-search.query -- authenticated read, offset-based pagination (deliberately different pagination
  // style from atc-notify.messages.list's cursor style -- both are real, neither is normalized to
  // match the other).
  // atc-search/openapi.yaml operationId atc-search.query.get, path {name}, query {q?, limit?, offset?, ...}.
  // ---------------------------------------------------------------------------------------------
  {
    name: 'atc-search.query',
    operations: ['atc-search.query.get'],
    description:
      'Full-text search over one index. Empty/omitted `q` is a browse (no ranking, score is null ' +
      'on every hit). Offset-based pagination: total/limit/offset in the response, not a cursor.',
    inputSchema: {
      name: z.string().describe('Index name.'),
      q: z.string().max(500).optional(),
      limit: z.number().int().min(1).max(1000).optional().describe('Default 20, clamped server-side to maxPage (default 100).'),
      offset: z.number().int().min(0).optional(),
      highlight: z.boolean().optional(),
    },
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    async handler(args, registry) {
      const client = await registry.client('atc-search');
      const res = await client['atc-search.query.get']({
        params: {
          path: { name: args.name },
          query: {
            q: args.q,
            limit: args.limit !== undefined ? String(args.limit) : undefined,
            offset: args.offset !== undefined ? String(args.offset) : undefined,
            highlight: args.highlight !== undefined ? String(args.highlight) : undefined,
          },
        },
      });
      if (res.error) throw res;
      return toolResult({ ...summarize(res), data: res.data });
    },
  },
];


/** Operations a hand-written tool already covers; the generator skips them. */
export const HAND_WRITTEN_OPERATIONS = new Set(HAND_TOOLS.filter((t) => t.name !== 'atc-stack.status').flatMap((t) => t.operations));
