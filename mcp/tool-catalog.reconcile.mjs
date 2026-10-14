#!/usr/bin/env node
// Marks tool-catalog.json entries `exposedInPhase3: true` for exactly the operationIds the real,
// explicit tool allowlist (mcp/src/tools/index.mjs) actually calls -- nothing else. This is a
// reconciliation step, not a generator: it never invents a tool from the catalog, it only records,
// against the real allowlist, which classified operations that allowlist happens to use.
// Run after tool-catalog.generate.mjs, and again whenever src/tools/index.mjs changes:
// `node mcp/tool-catalog.generate.mjs && node mcp/tool-catalog.reconcile.mjs`.
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));

// The real, hand-verified mapping from each exposed MCP tool to the operationId(s) its handler
// calls. atc-stack.status is the one MCP-native aggregate: it calls the 3 operational probes on every
// one of the 19 services, whatever that service happens to have named them (see
// src/tools/index.mjs's findOp() comment on the real cross-service naming inconsistency).
const OPERATIONAL_PROBE_OPIDS = [
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
];

export const TOOL_TO_OPERATION_IDS = {
  'atc-stack.status': OPERATIONAL_PROBE_OPIDS,
  'atc-flags.evaluate': ['atc-flags.evaluate.post'],
  'atc-geo.ip.lookup': ['atc-geo.ip.lookup'],
  'atc-media.files.get': ['atc-media.files.get'],
  'atc-notify.messages.list': ['atc-notify.messages.list'],
  'atc-notify.messages.create': ['atc-notify.messages.create'],
  'atc-notify.messages.get': ['atc-notify.messages.get'],
  'atc-shortlink.links.create': ['atc-shortlink.links.create'],
  'atc-ratelimit.check': ['atc-ratelimit.check'],
  'atc-search.query': ['atc-search.query.get'],
};

async function main() {
  const { TOOLS } = await import('./src/tools/index.mjs');
  const toolNames = new Set(TOOLS.map((t) => t.name));
  const mappedNames = new Set(Object.keys(TOOL_TO_OPERATION_IDS));
  if (toolNames.size !== mappedNames.size || [...toolNames].some((n) => !mappedNames.has(n))) {
    throw new Error(
      `TOOL_TO_OPERATION_IDS in this file is out of sync with src/tools/index.mjs's real allowlist. ` +
      `Tools: [${[...toolNames].join(', ')}]. Mapped: [${[...mappedNames].join(', ')}]. Update TOOL_TO_OPERATION_IDS.`,
    );
  }

  const exposedOpIds = new Set(Object.values(TOOL_TO_OPERATION_IDS).flat());
  const catalogPath = path.join(HERE, 'tool-catalog.json');
  const catalog = JSON.parse(await readFile(catalogPath, 'utf8'));
  let exposedCount = 0;
  for (const entry of catalog.entries) {
    entry.exposedInPhase3 = exposedOpIds.has(entry.operationId);
    if (entry.exposedInPhase3) exposedCount += 1;
  }
  const unmatched = [...exposedOpIds].filter((id) => !catalog.entries.some((e) => e.operationId === id));
  if (unmatched.length) {
    throw new Error(`TOOL_TO_OPERATION_IDS names operationId(s) not found in any spec: ${unmatched.join(', ')}`);
  }

  await writeFile(catalogPath, JSON.stringify(catalog, null, 2) + '\n');
  console.log(`Reconciled: ${exposedCount}/${catalog.totalOperations} canonical operations are used by the ${toolNames.size} exposed MCP tools.`);
}

main().catch((err) => { console.error(err.stack || err.message); process.exit(1); });
