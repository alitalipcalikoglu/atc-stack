#!/usr/bin/env node
// Writes the exposure decision into tool-catalog.json and checks it against the real tools:
// - `policy` (per service: tools + one-line reason per excluded write class) is copied from
//   tool-policy.mjs;
// - every entry gets `exposed: true` exactly when a registered tool (src/tools/) calls it;
// - the registered tools must be exactly the policy's tools (plus atc-stack.status's probes), every
//   named operationId must exist, and every write operation of a service must be either a tool or
//   listed as excluded with a reason.
// Run after tool-catalog.generate.mjs, and whenever src/tools/ or tool-policy.mjs changes:
// `node mcp/tool-catalog.generate.mjs && node mcp/tool-catalog.reconcile.mjs`.
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { POLICY } from './tool-policy.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));

/** Problems between policy, tools and catalog; empty when they agree. @param {any} catalog @param {{ name: string, operations: string[] }[]} tools */
export function check(catalog, tools) {
  /** @type {string[]} */
  const problems = [];
  const ids = new Set(catalog.entries.map((/** @type {any} */ e) => e.operationId));
  const called = new Set(tools.filter((t) => t.name !== 'atc-stack.status').flatMap((t) => t.operations));
  const allowed = new Set(Object.values(POLICY).flatMap((p) => p.tools));
  for (const id of called) if (!allowed.has(id)) problems.push(`tool calls ${id}, which tool-policy.mjs does not allow`);
  for (const id of allowed) if (!called.has(id)) problems.push(`tool-policy.mjs allows ${id}, but no tool calls it`);
  for (const [service, p] of Object.entries(POLICY)) {
    for (const id of [...p.tools, ...p.excluded.flatMap((x) => x.ops)]) if (id !== '*' && !ids.has(id)) problems.push(`${service}: ${id} is not an operationId in any spec`);
    for (const x of p.excluded) if (!x.reason || x.reason.length < 10) problems.push(`${service}: excluded ${x.ops.join(', ')} has no reason`);
    if (p.excluded.some((x) => x.ops.includes('*'))) continue;
    const covered = new Set([...p.tools, ...p.excluded.flatMap((x) => x.ops)]);
    for (const e of catalog.entries) if (e.service === service && !e.flags.includes('READ_SAFE') && !covered.has(e.operationId)) problems.push(`${service}: write operation ${e.operationId} is neither a tool nor excluded with a reason`);
  }
  return problems;
}

async function main() {
  const { TOOLS } = await import('./src/tools/index.mjs');
  const catalogPath = path.join(HERE, 'tool-catalog.json');
  const catalog = JSON.parse(await readFile(catalogPath, 'utf8'));
  const problems = check(catalog, TOOLS);
  if (problems.length) throw new Error(`tool policy, tools and catalog disagree:\n- ${problems.join('\n- ')}`);
  const exposedOpIds = new Set(TOOLS.flatMap((/** @type {{ operations: string[] }} */ t) => t.operations));
  let exposedCount = 0;
  for (const entry of catalog.entries) {
    delete entry.exposedInPhase3;
    entry.exposed = exposedOpIds.has(entry.operationId);
    if (entry.exposed) exposedCount += 1;
  }
  catalog.policy = POLICY;
  await writeFile(catalogPath, JSON.stringify(catalog, null, 2) + '\n');
  console.log(`Reconciled: ${exposedCount}/${catalog.totalOperations} canonical operations are used by the ${TOOLS.length} exposed MCP tools.`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) main().catch((err) => { console.error(err.stack || err.message); process.exit(1); });
