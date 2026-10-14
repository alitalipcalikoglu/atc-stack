// THE exposed MCP tool list: the hand-written tools plus the generated operation tools, and nothing
// else. Nothing here iterates a spec or the catalog; an operation is a tool only because
// tool-policy.mjs names it and src/tools/services/ holds its explicit definition (default deny).
import { toErrorResult } from '../errors.mjs';
import { HAND_TOOLS } from './hand-written.mjs';
import { OPERATION_TOOLS } from './services/index.mjs';

/** @typedef {import('./operation.mjs').ToolDef} ToolDef */

/** @type {ToolDef[]} */
export const TOOLS = [...HAND_TOOLS, ...OPERATION_TOOLS];

/**
 * Wraps a tool's real handler so every real/thrown failure funnels through the one error adapter.
 * @param {ToolDef} tool
 */
export function wrapHandler(tool) {
  return /** @param {Record<string, unknown>} args @param {import('../registry.mjs').ServiceRegistry} registry */ async (args, registry) => {
    try {
      return await tool.handler(args, registry);
    } catch (err) {
      // A generated-client call that returned a real {error, response} pair throws `res` itself
      // (see each handler's `if (res.error) throw res`) so it reaches this single translation point
      // too, alongside genuine thrown Errors (config/transport failures).
      return toErrorResult(tool.name.split('.')[0], err);
    }
  };
}
