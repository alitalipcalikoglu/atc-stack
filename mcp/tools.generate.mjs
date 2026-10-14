#!/usr/bin/env node
// Writes src/tools/services/<service>.mjs: one explicit tool definition per operation that
// tool-policy.mjs allows (and that no hand-written tool in src/tools/index.mjs already covers).
// Every input field, type, constraint and requiredness is copied from that operation's own
// canonical openapi.yaml at generation time; the output is plain, reviewable source that the
// server imports. Nothing reads a spec at runtime, and an operation only becomes a tool because
// tool-policy.mjs names it. Re-run after a spec or the policy changes:
// `node mcp/tools.generate.mjs && node mcp/tool-catalog.reconcile.mjs`.
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse as parseYaml } from 'yaml';
import { POLICY } from './tool-policy.mjs';
import { HAND_WRITTEN_OPERATIONS } from './src/tools/hand-written.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const WORKSPACE = path.resolve(HERE, '..', '..');
const OUT = path.join(HERE, 'src', 'tools', 'services');
const METHODS = ['get', 'post', 'put', 'patch', 'delete'];

/** POST operations that only compute or read. */
const READ_POSTS = new Set(['atc-geo.ip.lookupBatch', 'atc-geo.phone.normalizeBatch', 'atc-search.query.post', 'atc-media.files.signUrls']);
/** POST operations whose repeat has no further effect (verification result, provider sync, keyed create). */
const IDEMPOTENT_POSTS = new Set([...READ_POSTS, 'atc-backup.backups.verify', 'atc-payments.payments.sync', 'atc-payments.payments.create']);
/** Operations that reach outside the platform (mail, external URLs, Stripe). */
const OPEN_WORLD = new Set(['atc-payments.payments.create', 'atc-payments.payments.sync', 'atc-webhook-out.events.publish', 'atc-webhook-out.subscriptions.create', 'atc-webhook-out.subscriptions.patch', 'atc-scheduler.jobs.create', 'atc-scheduler.jobs.patch', 'atc-status.monitors.upsert']);

/** @param {string} s */
const camel = (s) => s.replace(/[-_.]([a-z0-9])/gi, (_m, c) => c.toUpperCase());
/** @param {string} s */
const lit = (s) => JSON.stringify(s);

class Spec {
  /** @param {any} doc */
  constructor(doc) { this.doc = doc; }

  /** @param {any} node @returns {any} */
  deref(node) {
    let n = node;
    for (let i = 0; n && n.$ref && i < 10; i++) {
      const parts = String(n.$ref).replace(/^#\//, '').split('/');
      n = parts.reduce((/** @type {any} */ o, k) => o?.[k.replace(/~1/g, '/').replace(/~0/g, '~')], this.doc);
    }
    return n;
  }

  /** @param {string} opId */
  operation(opId) {
    for (const [p, item] of Object.entries(this.doc.paths ?? {})) {
      for (const m of METHODS) if (/** @type {any} */ (item)?.[m]?.operationId === opId) return { method: m, path: p, op: /** @type {any} */ (item)[m], shared: /** @type {any} */ (item).parameters ?? [] };
    }
    throw new Error(`${opId}: not in the spec`);
  }

  /**
   * zod source for a JSON schema.
   * @param {any} raw @param {number} [depth] @returns {string}
   */
  zod(raw, depth = 0) {
    const s = this.deref(raw) ?? {};
    if (depth > 6) return 'z.unknown()';
    let out;
    let nullable = false;
    let type = s.type;
    if (Array.isArray(type)) { nullable = type.includes('null'); type = type.filter((t) => t !== 'null')[0]; }
    if (s.allOf) {
      const merged = { type: 'object', properties: {}, required: /** @type {string[]} */ ([]), additionalProperties: undefined };
      for (const part of s.allOf.map((/** @type {any} */ x) => this.deref(x))) {
        Object.assign(merged.properties, part.properties ?? {});
        merged.required.push(...(part.required ?? []));
      }
      out = this.zod(merged, depth + 1);
    } else if (s.oneOf || s.anyOf) {
      const alts = (s.oneOf ?? s.anyOf).map((/** @type {any} */ x) => this.deref(x));
      const nonNull = alts.filter((/** @type {any} */ a) => a.type !== 'null');
      if (nonNull.length < alts.length) nullable = true;
      out = nonNull.length === 1 ? this.zod(nonNull[0], depth + 1) : `z.union([${nonNull.map((/** @type {any} */ a) => this.zod(a, depth + 1)).join(', ')}])`;
    } else if (s.const !== undefined) {
      out = `z.literal(${JSON.stringify(s.const)})`;
    } else if (Array.isArray(s.enum)) {
      const vals = s.enum.filter((/** @type {any} */ v) => v !== null);
      if (vals.length < s.enum.length) nullable = true;
      out = vals.every((/** @type {any} */ v) => typeof v === 'string') ? `z.enum([${vals.map(lit).join(', ')}])` : `z.union([${vals.map((/** @type {any} */ v) => `z.literal(${JSON.stringify(v)})`).join(', ')}])`;
    } else if (type === 'string') {
      out = 'z.string()';
      if (s.minLength !== undefined) out += `.min(${s.minLength})`;
      if (s.maxLength !== undefined) out += `.max(${s.maxLength})`;
      if (s.pattern) out += `.regex(${Spec.regex(s.pattern)})`;
    } else if (type === 'integer' || type === 'number') {
      out = type === 'integer' ? 'z.number().int()' : 'z.number()';
      if (s.minimum !== undefined) out += `.min(${s.minimum})`;
      if (s.exclusiveMinimum !== undefined) out += `.gt(${s.exclusiveMinimum})`;
      if (s.maximum !== undefined) out += `.max(${s.maximum})`;
    } else if (type === 'boolean') {
      out = 'z.boolean()';
    } else if (type === 'array') {
      out = `z.array(${s.items ? this.zod(s.items, depth + 1) : 'z.unknown()'})`;
      if (s.minItems !== undefined) out += `.min(${s.minItems})`;
      if (s.maxItems !== undefined) out += `.max(${s.maxItems})`;
    } else if (type === 'object' || s.properties) {
      const props = Object.entries(s.properties ?? {});
      if (!props.length) {
        const ap = s.additionalProperties;
        out = `z.record(z.string(), ${ap && typeof ap === 'object' ? this.zod(ap, depth + 1) : 'z.unknown()'})`;
      } else {
        const req = new Set(s.required ?? []);
        out = `z.object({ ${props.map(([k, v]) => `${Spec.key(k)}: ${this.zod(v, depth + 1)}${req.has(k) ? '' : '.optional()'}`).join(', ')} })`;
        if (s.additionalProperties === false) out += '.strict()';
        else if (s.additionalProperties) out += '.passthrough()';
      }
    } else {
      out = 'z.unknown()';
    }
    if (nullable) out += '.nullable()';
    if (s.description && depth > 0) out += `.describe(${lit(Spec.short(s.description, 160))})`;
    return out;
  }

  /** A regex literal the server's (ajv, unicode) and zod would read the same way. @param {string} p */
  static regex(p) {
    try { new RegExp(p, 'u'); return `new RegExp(${lit(p)}, 'u')`; } catch { return `new RegExp(${lit(p)})`; }
  }

  /** @param {string} k */
  static key(k) { return /^[A-Za-z_$][\w$]*$/.test(k) ? k : lit(k); }

  /** @param {string} t @param {number} n */
  static short(t, n) {
    const one = String(t).replace(/\s+/g, ' ').trim();
    return one.length > n ? `${one.slice(0, n - 1)}…` : one;
  }
}

/** @param {string} service @param {string} opId @param {Spec} spec */
function toolSource(service, opId, spec) {
  const { method, op, shared } = spec.operation(opId);
  const params = [...shared, ...(op.parameters ?? [])].map((p) => spec.deref(p)).filter((p) => ['path', 'query', 'header'].includes(p.in));
  /** @type {string[]} */ const input = [];
  /** @type {Record<string, Record<string, string>>} */ const map = { path: {}, query: {}, header: {} };
  for (const p of params) {
    const arg = camel(p.name);
    map[p.in][arg] = p.name;
    let z = spec.zod(p.schema ?? {}, 1);
    if (p.description) z += `.describe(${lit(Spec.short(p.description, 160))})`;
    input.push(`${Spec.key(arg)}: ${z}${p.required ? '' : '.optional()'}`);
  }
  let bodyMode = 'none';
  /** @type {string[]} */ const bodyFields = [];
  const rb = spec.deref(op.requestBody);
  const bodySchema = rb?.content?.['application/json']?.schema ? spec.deref(rb.content['application/json'].schema) : null;
  if (bodySchema) {
    const merged = bodySchema.allOf ? { properties: Object.assign({}, ...bodySchema.allOf.map((/** @type {any} */ x) => spec.deref(x).properties ?? {})), required: bodySchema.allOf.flatMap((/** @type {any} */ x) => spec.deref(x).required ?? []) } : bodySchema;
    const props = Object.entries(merged.properties ?? {});
    const clash = props.some(([k]) => Object.values(map).some((m) => camel(k) in m || k in m));
    if (props.length && !clash && !bodySchema.oneOf && !bodySchema.anyOf) {
      bodyMode = 'flat';
      const req = new Set(rb.required ? merged.required ?? [] : []);
      for (const [k, v] of props) {
        bodyFields.push(k);
        input.push(`${Spec.key(k)}: ${spec.zod(v, 1)}${req.has(k) ? '' : '.optional()'}`);
      }
    } else {
      bodyMode = 'nested';
      input.push(`body: ${spec.zod(bodySchema, 1)}${rb.required ? '' : '.optional()'}.describe('Request body.')`);
    }
  }
  const readOnly = method === 'get' || READ_POSTS.has(opId);
  const idempotent = method === 'get' || method === 'put' || method === 'patch' || IDEMPOTENT_POSTS.has(opId);
  // Service paths stay out of tool source (the boundary scan forbids them); the tool name says which operation it is.
  const words = [op.summary, op.description].filter(Boolean).map((t) => Spec.short(String(t).replace(/\s*`?(?:\b(?:GET|POST|PUT|PATCH|DELETE)\s+)?\/v1\/[^\s`),]*`?/g, ' this API').replace(/\s+/g, ' '), 420)).map((t) => (/[.!?]$/.test(t) ? t : `${t}.`)).join(' ');
  const kind = readOnly ? 'Read-only.' : 'Safe write: creates, updates, queues or starts work; never deletes anything.';
  return `  operationTool({
    service: ${lit(service)},
    operation: ${lit(opId)},
    description: ${lit(`${Spec.short(words || opId, 600)} ${kind}`)},
    input: {${input.length ? `\n      ${input.join(',\n      ')},\n    ` : ''}},
    map: ${JSON.stringify({ ...Object.fromEntries(Object.entries(map).filter(([, v]) => Object.keys(v).length)), body: bodyMode, ...(bodyMode === 'flat' ? { bodyFields } : {}) })},
    annotations: { readOnlyHint: ${readOnly}, destructiveHint: false, idempotentHint: ${idempotent}, openWorldHint: ${OPEN_WORLD.has(opId)} },
  }),`;
}

async function main() {
  await mkdir(OUT, { recursive: true });
  let total = 0;
  /** @type {string[]} */ const files = [];
  for (const [service, p] of Object.entries(POLICY)) {
    const ops = p.tools.filter((id) => !HAND_WRITTEN_OPERATIONS.has(id));
    if (!ops.length) continue;
    const spec = new Spec(parseYaml(await readFile(path.join(WORKSPACE, service, 'openapi.yaml'), 'utf8')));
    const body = ops.map((id) => toolSource(service, id, spec)).join('\n');
    const file = `// GENERATED by mcp/tools.generate.mjs from ${service}/openapi.yaml and mcp/tool-policy.mjs -- do not edit by hand.
// Explicit tool definitions; behaviour tweaks live in src/tools/overrides.mjs.
import { z } from 'zod';
import { operationTool } from '../operation.mjs';

/** @type {import('../operation.mjs').ToolDef[]} */
export const TOOLS = [
${body}
];
`;
    await writeFile(path.join(OUT, `${service}.mjs`), file);
    total += ops.length;
    files.push(service);
  }
  const index = `// GENERATED by mcp/tools.generate.mjs -- do not edit by hand. The generated operation tools, per service.
${files.map((s, i) => `import { TOOLS as t${i} } from './${s}.mjs';`).join('\n')}

/** @type {import('../operation.mjs').ToolDef[]} */
export const OPERATION_TOOLS = [${files.map((_s, i) => `...t${i}`).join(', ')}];
`;
  await writeFile(path.join(OUT, 'index.mjs'), index);
  console.log(`generated ${total} operation tools`);
}

main().catch((err) => { console.error(err.stack || err.message); process.exit(1); });
