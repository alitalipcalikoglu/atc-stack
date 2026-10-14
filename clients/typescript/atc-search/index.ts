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
  /** Origin + path prefix the atc-search service is reachable at, e.g. "https://atc-search.internal:4000". */
  baseUrl: string;
  /** Headers merged into every request (e.g. { Authorization: "Bearer <key>" }). Per-call headers passed to an operation win over these. */
  headers?: HeadersInit;
  /** Override the fetch implementation (useful in tests, or for a non-global fetch runtime). Defaults to the ambient global fetch. */
  fetch?: typeof fetch;
  /** Passed straight to every underlying fetch() call's RequestInit.credentials -- set to "include" for cookie-based auth (console). */
  credentials?: RequestCredentials;
}

/**
 * One operationId-keyed method per operation in atc-search's openapi.yaml (19 total).
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
    "atc-search.documents.browse": (init: FetchOptions<operations["atc-search.documents.browse"]>) => client.GET("/v1/indexes/{name}/documents", init),
    "atc-search.documents.delete": (init: FetchOptions<operations["atc-search.documents.delete"]>) => client.DELETE("/v1/indexes/{name}/documents/{id}", init),
    "atc-search.documents.get": (init: FetchOptions<operations["atc-search.documents.get"]>) => client.GET("/v1/indexes/{name}/documents/{id}", init),
    "atc-search.documents.upsert": (init: FetchOptions<operations["atc-search.documents.upsert"]>) => client.PUT("/v1/indexes/{name}/documents", init),
    "atc-search.indexes.clear": (init: FetchOptions<operations["atc-search.indexes.clear"]>) => client.POST("/v1/indexes/{name}/clear", init),
    "atc-search.indexes.create": (init: FetchOptions<operations["atc-search.indexes.create"]>) => client.POST("/v1/indexes", init),
    "atc-search.indexes.delete": (init: FetchOptions<operations["atc-search.indexes.delete"]>) => client.DELETE("/v1/indexes/{name}", init),
    "atc-search.indexes.get": (init: FetchOptions<operations["atc-search.indexes.get"]>) => client.GET("/v1/indexes/{name}", init),
    "atc-search.indexes.list": (init: FetchOptions<operations["atc-search.indexes.list"]>) => client.GET("/v1/indexes", init),
    "atc-search.indexes.patch": (init: FetchOptions<operations["atc-search.indexes.patch"]>) => client.PATCH("/v1/indexes/{name}", init),
    "atc-search.openapi": (init: FetchOptions<operations["atc-search.openapi"]>) => client.GET("/openapi.yaml", init),
    "atc-search.query.get": (init: FetchOptions<operations["atc-search.query.get"]>) => client.GET("/v1/indexes/{name}/search", init),
    "atc-search.query.post": (init: FetchOptions<operations["atc-search.query.post"]>) => client.POST("/v1/indexes/{name}/search", init),
    "atc-search.stats.get": (init: FetchOptions<operations["atc-search.stats.get"]>) => client.GET("/v1/stats", init),
    "atc-search.suggest": (init: FetchOptions<operations["atc-search.suggest"]>) => client.GET("/v1/indexes/{name}/suggest", init),
    "atc-search.system.health": (init: FetchOptions<operations["atc-search.system.health"]>) => client.GET("/health", init),
    "atc-search.system.info": (init: FetchOptions<operations["atc-search.system.info"]>) => client.GET("/v1/info", init),
    "atc-search.system.metrics": (init: FetchOptions<operations["atc-search.system.metrics"]>) => client.GET("/metrics", init),
    "atc-search.system.ready": (init: FetchOptions<operations["atc-search.system.ready"]>) => client.GET("/ready", init),
  } as const;
}

export type AtcSearchClient = ReturnType<typeof createClient>;
