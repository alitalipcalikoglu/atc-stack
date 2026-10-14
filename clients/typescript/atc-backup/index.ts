/**
 * GENERATED FILE -- do not edit by hand.
 * Produced from <repo>/openapi.yaml by `node clients/typescript/generate.mjs`.
 * Re-run generation instead of patching this file; see clients/typescript/README.md.
 */

import createFetchClient from 'openapi-fetch';
import type { FetchOptions } from 'openapi-fetch';
import type { paths, operations, components } from './types.gen.js';
export type { paths, operations, components } from './types.gen.js';

/**
 * Caller-supplied configuration. Nothing is read from process.env, a stack config file,
 * or any other implicit source -- baseUrl and credentials must always be passed explicitly.
 */
export interface ClientConfig {
  /** Origin + path prefix the atc-backup service is reachable at, e.g. "https://atc-backup.internal:4000". */
  baseUrl: string;
  /** Headers merged into every request (e.g. { Authorization: "Bearer <key>" }). Per-call headers passed to an operation win over these. */
  headers?: HeadersInit;
  /** Override the fetch implementation (useful in tests, or for a non-global fetch runtime). Defaults to the ambient global fetch. */
  fetch?: typeof fetch;
  /** Passed straight to every underlying fetch() call's RequestInit.credentials -- set to "include" for cookie-based auth (console). */
  credentials?: RequestCredentials;
}

/**
 * One operationId-keyed method per operation in atc-backup's openapi.yaml (15 total).
 * Each call returns openapi-fetch's own { data, error, response } union -- status, headers and
 * the raw Response are always reachable via .response; nothing throws on a non-2xx by default.
 * No retry, no timeout, no polling: this is a transport, not a workflow SDK. Pass an AbortSignal
 * via the per-call init if you need cancellation/timeout -- the client has no built-in timeout.
 */
export function createClient(config: ClientConfig) {
  const client = createFetchClient<paths>({
    baseUrl: config.baseUrl,
    headers: config.headers,
    fetch: config.fetch,
    credentials: config.credentials,
  });
  return {
    "atc-backup.backups.delete": (init: FetchOptions<operations["atc-backup.backups.delete"]>) => client.DELETE("/v1/backups/{id}", init),
    "atc-backup.backups.download": (init: FetchOptions<operations["atc-backup.backups.download"]>) => client.GET("/v1/backups/{id}/download", init),
    "atc-backup.backups.get": (init: FetchOptions<operations["atc-backup.backups.get"]>) => client.GET("/v1/backups/{id}", init),
    "atc-backup.backups.list": (init: FetchOptions<operations["atc-backup.backups.list"]>) => client.GET("/v1/backups", init),
    "atc-backup.backups.restore": (init: FetchOptions<operations["atc-backup.backups.restore"]>) => client.POST("/v1/backups/{id}/restore", init),
    "atc-backup.backups.verify": (init: FetchOptions<operations["atc-backup.backups.verify"]>) => client.POST("/v1/backups/{id}/verify", init),
    "atc-backup.health.get": (init: FetchOptions<operations["atc-backup.health.get"]>) => client.GET("/health", init),
    "atc-backup.info.get": (init: FetchOptions<operations["atc-backup.info.get"]>) => client.GET("/v1/info", init),
    "atc-backup.metrics.get": (init: FetchOptions<operations["atc-backup.metrics.get"]>) => client.GET("/metrics", init),
    "atc-backup.openapi": (init: FetchOptions<operations["atc-backup.openapi"]>) => client.GET("/openapi.yaml", init),
    "atc-backup.ready.get": (init: FetchOptions<operations["atc-backup.ready.get"]>) => client.GET("/ready", init),
    "atc-backup.sources.backup": (init: FetchOptions<operations["atc-backup.sources.backup"]>) => client.POST("/v1/sources/{id}/backups", init),
    "atc-backup.sources.get": (init: FetchOptions<operations["atc-backup.sources.get"]>) => client.GET("/v1/sources/{id}", init),
    "atc-backup.sources.list": (init: FetchOptions<operations["atc-backup.sources.list"]>) => client.GET("/v1/sources", init),
    "atc-backup.stats.get": (init: FetchOptions<operations["atc-backup.stats.get"]>) => client.GET("/v1/stats", init),
  } as const;
}

export type AtcBackupClient = ReturnType<typeof createClient>;
