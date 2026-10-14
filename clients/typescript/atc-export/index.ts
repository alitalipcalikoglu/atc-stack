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
  /** Origin + path prefix the atc-export service is reachable at, e.g. "https://atc-export.internal:4000". */
  baseUrl: string;
  /** Headers merged into every request (e.g. { Authorization: "Bearer <key>" }). Per-call headers passed to an operation win over these. */
  headers?: HeadersInit;
  /** Override the fetch implementation (useful in tests, or for a non-global fetch runtime). Defaults to the ambient global fetch. */
  fetch?: typeof fetch;
  /** Passed straight to every underlying fetch() call's RequestInit.credentials -- set to "include" for cookie-based auth (console). */
  credentials?: RequestCredentials;
}

/**
 * One operationId-keyed method per operation in atc-export's openapi.yaml (14 total).
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
    "atc-export.exports.cancel": (init: FetchOptions<operations["atc-export.exports.cancel"]>) => client.POST("/v1/exports/{id}/cancel", init),
    "atc-export.exports.create": (init: FetchOptions<operations["atc-export.exports.create"]>) => client.POST("/v1/exports", init),
    "atc-export.exports.delete": (init: FetchOptions<operations["atc-export.exports.delete"]>) => client.DELETE("/v1/exports/{id}", init),
    "atc-export.exports.download": (init: FetchOptions<operations["atc-export.exports.download"]>) => client.GET("/v1/exports/{id}/download", init),
    "atc-export.exports.get": (init: FetchOptions<operations["atc-export.exports.get"]>) => client.GET("/v1/exports/{id}", init),
    "atc-export.exports.list": (init: FetchOptions<operations["atc-export.exports.list"]>) => client.GET("/v1/exports", init),
    "atc-export.exports.retry": (init: FetchOptions<operations["atc-export.exports.retry"]>) => client.POST("/v1/exports/{id}/retry", init),
    "atc-export.health.get": (init: FetchOptions<operations["atc-export.health.get"]>) => client.GET("/health", init),
    "atc-export.info.get": (init: FetchOptions<operations["atc-export.info.get"]>) => client.GET("/v1/info", init),
    "atc-export.metrics.get": (init: FetchOptions<operations["atc-export.metrics.get"]>) => client.GET("/metrics", init),
    "atc-export.openapi": (init: FetchOptions<operations["atc-export.openapi"]>) => client.GET("/openapi.yaml", init),
    "atc-export.ready.get": (init: FetchOptions<operations["atc-export.ready.get"]>) => client.GET("/ready", init),
    "atc-export.sources.list": (init: FetchOptions<operations["atc-export.sources.list"]>) => client.GET("/v1/sources", init),
    "atc-export.stats.get": (init: FetchOptions<operations["atc-export.stats.get"]>) => client.GET("/v1/stats", init),
  } as const;
}

export type AtcExportClient = ReturnType<typeof createClient>;
