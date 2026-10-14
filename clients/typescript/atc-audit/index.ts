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
  /** Origin + path prefix the atc-audit service is reachable at, e.g. "https://atc-audit.internal:4000". */
  baseUrl: string;
  /** Headers merged into every request (e.g. { Authorization: "Bearer <key>" }). Per-call headers passed to an operation win over these. */
  headers?: HeadersInit;
  /** Override the fetch implementation (useful in tests, or for a non-global fetch runtime). Defaults to the ambient global fetch. */
  fetch?: typeof fetch;
  /** Passed straight to every underlying fetch() call's RequestInit.credentials -- set to "include" for cookie-based auth (console). */
  credentials?: RequestCredentials;
}

/**
 * One operationId-keyed method per operation in atc-audit's openapi.yaml (16 total).
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
    "atc-audit.anchorKey.get": (init: FetchOptions<operations["atc-audit.anchorKey.get"]>) => client.GET("/.well-known/audit-anchor-key", init),
    "atc-audit.anchors.getLatest": (init: FetchOptions<operations["atc-audit.anchors.getLatest"]>) => client.GET("/v1/chain/anchors/latest", init),
    "atc-audit.anchors.list": (init: FetchOptions<operations["atc-audit.anchors.list"]>) => client.GET("/v1/chain/anchors", init),
    "atc-audit.chain.getHead": (init: FetchOptions<operations["atc-audit.chain.getHead"]>) => client.GET("/v1/chain/head", init),
    "atc-audit.chain.verify": (init: FetchOptions<operations["atc-audit.chain.verify"]>) => client.GET("/v1/chain/verify", init),
    "atc-audit.events.create": (init: FetchOptions<operations["atc-audit.events.create"]>) => client.POST("/v1/events", init),
    "atc-audit.events.createBatch": (init: FetchOptions<operations["atc-audit.events.createBatch"]>) => client.POST("/v1/events/batch", init),
    "atc-audit.events.export": (init: FetchOptions<operations["atc-audit.events.export"]>) => client.GET("/v1/events/export", init),
    "atc-audit.events.get": (init: FetchOptions<operations["atc-audit.events.get"]>) => client.GET("/v1/events/{id}", init),
    "atc-audit.events.list": (init: FetchOptions<operations["atc-audit.events.list"]>) => client.GET("/v1/events", init),
    "atc-audit.health.get": (init: FetchOptions<operations["atc-audit.health.get"]>) => client.GET("/health", init),
    "atc-audit.info.get": (init: FetchOptions<operations["atc-audit.info.get"]>) => client.GET("/v1/info", init),
    "atc-audit.metrics.get": (init: FetchOptions<operations["atc-audit.metrics.get"]>) => client.GET("/metrics", init),
    "atc-audit.openapi": (init: FetchOptions<operations["atc-audit.openapi"]>) => client.GET("/openapi.yaml", init),
    "atc-audit.ready.get": (init: FetchOptions<operations["atc-audit.ready.get"]>) => client.GET("/ready", init),
    "atc-audit.stats.get": (init: FetchOptions<operations["atc-audit.stats.get"]>) => client.GET("/v1/stats", init),
  } as const;
}

export type AtcAuditClient = ReturnType<typeof createClient>;
