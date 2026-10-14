/**
 * The repositories installed next to stack. Runtime topology remains in manifest.js; this list
 * includes service-core as a source/dependency repository and deliberately excludes stack itself.
 */
export const REPOSITORIES = Object.freeze([
  'atc-service-core',
  'atc-gateway',
  'atc-notify',
  'atc-auth',
  'atc-media',
  'atc-console',
  'atc-audit',
  'atc-shortlink',
  'atc-flags',
  'atc-scheduler',
  'atc-webhook-out',
  'atc-search',
  'atc-ratelimit',
  'atc-geo',
  'atc-content',
].map((id) => Object.freeze({ id, remote: `https://github.com/alitalipcalikoglu/${id}.git` })));

