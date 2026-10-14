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
  /** Origin + path prefix the atc-ratelimit service is reachable at, e.g. "https://atc-ratelimit.internal:4000". */
  baseUrl: string;
  /** Headers merged into every request (e.g. { Authorization: "Bearer <key>" }). Per-call headers passed to an operation win over these. */
  headers?: HeadersInit;
  /** Override the fetch implementation (useful in tests, or for a non-global fetch runtime). Defaults to the ambient global fetch. */
  fetch?: typeof fetch;
  /** Passed straight to every underlying fetch() call's RequestInit.credentials -- set to "include" for cookie-based auth (console). */
  credentials?: RequestCredentials;
}

/**
 * One operationId-keyed method per operation in atc-ratelimit's openapi.yaml (21 total).
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
    "atc-ratelimit.check": (init: FetchOptions<operations["atc-ratelimit.check"]>) => client.POST("/v1/check", init),
    "atc-ratelimit.checkBatch": (init: FetchOptions<operations["atc-ratelimit.checkBatch"]>) => client.POST("/v1/check/batch", init),
    "atc-ratelimit.health.check": (init: FetchOptions<operations["atc-ratelimit.health.check"]>) => client.GET("/health", init),
    "atc-ratelimit.info.get": (init: FetchOptions<operations["atc-ratelimit.info.get"]>) => client.GET("/v1/info", init),
    "atc-ratelimit.metrics.get": (init: FetchOptions<operations["atc-ratelimit.metrics.get"]>) => client.GET("/metrics", init),
    "atc-ratelimit.openapi": (init: FetchOptions<operations["atc-ratelimit.openapi"]>) => client.GET("/openapi.yaml", init),
    "atc-ratelimit.overrides.delete": (init: FetchOptions<operations["atc-ratelimit.overrides.delete"]>) => client.DELETE("/v1/policies/{name}/overrides/{subject}", init),
    "atc-ratelimit.overrides.list": (init: FetchOptions<operations["atc-ratelimit.overrides.list"]>) => client.GET("/v1/policies/{name}/overrides", init),
    "atc-ratelimit.overrides.set": (init: FetchOptions<operations["atc-ratelimit.overrides.set"]>) => client.PUT("/v1/policies/{name}/overrides/{subject}", init),
    "atc-ratelimit.policies.create": (init: FetchOptions<operations["atc-ratelimit.policies.create"]>) => client.POST("/v1/policies", init),
    "atc-ratelimit.policies.delete": (init: FetchOptions<operations["atc-ratelimit.policies.delete"]>) => client.DELETE("/v1/policies/{name}", init),
    "atc-ratelimit.policies.get": (init: FetchOptions<operations["atc-ratelimit.policies.get"]>) => client.GET("/v1/policies/{name}", init),
    "atc-ratelimit.policies.getStats": (init: FetchOptions<operations["atc-ratelimit.policies.getStats"]>) => client.GET("/v1/policies/{name}/stats", init),
    "atc-ratelimit.policies.getTop": (init: FetchOptions<operations["atc-ratelimit.policies.getTop"]>) => client.GET("/v1/policies/{name}/top", init),
    "atc-ratelimit.policies.list": (init: FetchOptions<operations["atc-ratelimit.policies.list"]>) => client.GET("/v1/policies", init),
    "atc-ratelimit.policies.patch": (init: FetchOptions<operations["atc-ratelimit.policies.patch"]>) => client.PATCH("/v1/policies/{name}", init),
    "atc-ratelimit.ready.check": (init: FetchOptions<operations["atc-ratelimit.ready.check"]>) => client.GET("/ready", init),
    "atc-ratelimit.release": (init: FetchOptions<operations["atc-ratelimit.release"]>) => client.POST("/v1/release", init),
    "atc-ratelimit.stats.get": (init: FetchOptions<operations["atc-ratelimit.stats.get"]>) => client.GET("/v1/stats", init),
    "atc-ratelimit.subjects.getUsage": (init: FetchOptions<operations["atc-ratelimit.subjects.getUsage"]>) => client.GET("/v1/policies/{name}/subjects/{subject}", init),
    "atc-ratelimit.subjects.resetUsage": (init: FetchOptions<operations["atc-ratelimit.subjects.resetUsage"]>) => client.DELETE("/v1/policies/{name}/subjects/{subject}/usage", init),
  } as const;
}

export type AtcRatelimitClient = ReturnType<typeof createClient>;
