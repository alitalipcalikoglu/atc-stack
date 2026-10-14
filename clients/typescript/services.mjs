// Single source of truth for which services get a generated TypeScript client, and where their
// canonical OpenAPI contract lives. Used by generate.mjs, check.mjs, and the test suite -- never
// duplicate this list elsewhere.
export const SERVICES = [
  'atc-gateway', 'atc-notify', 'atc-auth', 'atc-media', 'atc-console', 'atc-audit', 'atc-shortlink',
  'atc-flags', 'atc-scheduler', 'atc-webhook-out', 'atc-search', 'atc-ratelimit', 'atc-geo', 'atc-content', 'atc-export', 'atc-render', 'atc-queue', 'atc-backup',
];
