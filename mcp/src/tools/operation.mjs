// Builds one MCP tool from a generated, explicit operation definition (src/tools/services/*.mjs).
// The handler only maps validated arguments onto the operation's path/query/header/body slots and
// calls the typed client from the registry -- no paths, no fetch, no business logic here.
import { toolResult } from '../output.mjs';
import { OVERRIDES } from './overrides.mjs';

/** @typedef {{ name: string, operations: string[], description: string, inputSchema: Record<string, import('zod').ZodTypeAny>, annotations: import('@modelcontextprotocol/sdk/types.js').ToolAnnotations, handler: (args: any, registry: import('../registry.mjs').ServiceRegistry) => Promise<any> }} ToolDef */
/** @typedef {{ path?: Record<string, string>, query?: Record<string, string>, header?: Record<string, string>, body: 'none'|'flat'|'nested', bodyFields?: string[] }} ArgMap */

/**
 * @param {object} d
 * @param {string} d.service
 * @param {string} d.operation  operationId; also the tool name.
 * @param {string} d.description
 * @param {Record<string, import('zod').ZodTypeAny>} d.input
 * @param {ArgMap} d.map
 * @param {import('@modelcontextprotocol/sdk/types.js').ToolAnnotations} d.annotations
 * @returns {ToolDef}
 */
export function operationTool(d) {
  const o = OVERRIDES[d.operation] ?? {};
  const input = { ...d.input };
  for (const k of o.omit ?? []) delete input[k];
  return {
    name: d.operation,
    operations: [d.operation],
    description: o.description ? `${d.description} ${o.description}` : d.description,
    inputSchema: input,
    annotations: d.annotations,
    async handler(args, registry) {
      const client = /** @type {Record<string, (init: any) => Promise<any>>} */ (await registry.client(d.service));
      /** @type {Record<string, any>} */
      const params = {};
      for (const slot of /** @type {const} */ (['path', 'query', 'header'])) {
        const m = d.map[slot];
        if (!m) continue;
        const values = Object.fromEntries(Object.entries(m).filter(([arg]) => args[arg] !== undefined).map(([arg, name]) => [name, args[arg]]));
        if (Object.keys(values).length) params[slot] = values;
      }
      /** @type {any} */
      let body;
      if (d.map.body === 'flat') body = Object.fromEntries((d.map.bodyFields ?? []).filter((k) => args[k] !== undefined).map((k) => [k, args[k]]));
      else if (d.map.body === 'nested') body = args.body;
      if (o.body) body = { ...(body ?? {}), ...o.body };
      const res = await client[d.operation]({ params, ...(body !== undefined ? { body } : {}) });
      if (res.error) throw res;
      const data = o.output ? o.output(res.data) : res.data;
      return toolResult({ status: res.response.status, requestId: res.response.headers.get('x-request-id'), data, summary: o.summary?.(data) });
    },
  };
}
