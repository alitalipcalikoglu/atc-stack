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
  /** Origin + path prefix the atc-flags service is reachable at, e.g. "https://atc-flags.internal:4000". */
  baseUrl: string;
  /** Headers merged into every request (e.g. { Authorization: "Bearer <key>" }). Per-call headers passed to an operation win over these. */
  headers?: HeadersInit;
  /** Override the fetch implementation (useful in tests, or for a non-global fetch runtime). Defaults to the ambient global fetch. */
  fetch?: typeof fetch;
  /** Passed straight to every underlying fetch() call's RequestInit.credentials -- set to "include" for cookie-based auth (console). */
  credentials?: RequestCredentials;
}

/**
 * One operationId-keyed method per operation in atc-flags's openapi.yaml (20 total).
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
    "atc-flags.environments.list": (init: FetchOptions<operations["atc-flags.environments.list"]>) => client.GET("/v1/environments", init),
    "atc-flags.envs.copy": (init: FetchOptions<operations["atc-flags.envs.copy"]>) => client.POST("/v1/flags/{key}/envs/{env}/copy", init),
    "atc-flags.envs.get": (init: FetchOptions<operations["atc-flags.envs.get"]>) => client.GET("/v1/flags/{key}/envs/{env}", init),
    "atc-flags.envs.patch": (init: FetchOptions<operations["atc-flags.envs.patch"]>) => client.PATCH("/v1/flags/{key}/envs/{env}", init),
    "atc-flags.evaluate.get": (init: FetchOptions<operations["atc-flags.evaluate.get"]>) => client.GET("/v1/evaluate", init),
    "atc-flags.evaluate.post": (init: FetchOptions<operations["atc-flags.evaluate.post"]>) => client.POST("/v1/evaluate", init),
    "atc-flags.flags.create": (init: FetchOptions<operations["atc-flags.flags.create"]>) => client.POST("/v1/flags", init),
    "atc-flags.flags.delete": (init: FetchOptions<operations["atc-flags.flags.delete"]>) => client.DELETE("/v1/flags/{key}", init),
    "atc-flags.flags.get": (init: FetchOptions<operations["atc-flags.flags.get"]>) => client.GET("/v1/flags/{key}", init),
    "atc-flags.flags.getHistory": (init: FetchOptions<operations["atc-flags.flags.getHistory"]>) => client.GET("/v1/flags/{key}/history", init),
    "atc-flags.flags.list": (init: FetchOptions<operations["atc-flags.flags.list"]>) => client.GET("/v1/flags", init),
    "atc-flags.flags.patch": (init: FetchOptions<operations["atc-flags.flags.patch"]>) => client.PATCH("/v1/flags/{key}", init),
    "atc-flags.health.get": (init: FetchOptions<operations["atc-flags.health.get"]>) => client.GET("/health", init),
    "atc-flags.history.list": (init: FetchOptions<operations["atc-flags.history.list"]>) => client.GET("/v1/history", init),
    "atc-flags.info.get": (init: FetchOptions<operations["atc-flags.info.get"]>) => client.GET("/v1/info", init),
    "atc-flags.metrics.get": (init: FetchOptions<operations["atc-flags.metrics.get"]>) => client.GET("/metrics", init),
    "atc-flags.openapi": (init: FetchOptions<operations["atc-flags.openapi"]>) => client.GET("/openapi.yaml", init),
    "atc-flags.ready.get": (init: FetchOptions<operations["atc-flags.ready.get"]>) => client.GET("/ready", init),
    "atc-flags.snapshot.get": (init: FetchOptions<operations["atc-flags.snapshot.get"]>) => client.GET("/v1/snapshot/{env}", init),
    "atc-flags.stats.get": (init: FetchOptions<operations["atc-flags.stats.get"]>) => client.GET("/v1/stats", init),
  } as const;
}

export type AtcFlagsClient = ReturnType<typeof createClient>;
