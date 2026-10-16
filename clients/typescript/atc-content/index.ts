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
  /** Origin + path prefix the atc-content service is reachable at, e.g. "https://atc-content.internal:4000". */
  baseUrl: string;
  /** Headers merged into every request (e.g. { Authorization: "Bearer <key>" }). Per-call headers passed to an operation win over these. */
  headers?: HeadersInit;
  /** Override the fetch implementation (useful in tests, or for a non-global fetch runtime). Defaults to the ambient global fetch. */
  fetch?: typeof fetch;
  /** Passed straight to every underlying fetch() call's RequestInit.credentials -- set to "include" for cookie-based auth (console). */
  credentials?: RequestCredentials;
}

/**
 * One operationId-keyed method per operation in atc-content's openapi.yaml (25 total).
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
    "atc-content.bundles.get": (init: FetchOptions<operations["atc-content.bundles.get"]>) => client.GET("/v1/bundles/{ns}/{locale}", init),
    "atc-content.health.get": (init: FetchOptions<operations["atc-content.health.get"]>) => client.GET("/health", init),
    "atc-content.info.get": (init: FetchOptions<operations["atc-content.info.get"]>) => client.GET("/v1/info", init),
    "atc-content.keys.delete": (init: FetchOptions<operations["atc-content.keys.delete"]>) => client.DELETE("/v1/namespaces/{ns}/keys/{key}", init),
    "atc-content.keys.get": (init: FetchOptions<operations["atc-content.keys.get"]>) => client.GET("/v1/namespaces/{ns}/keys/{key}", init),
    "atc-content.keys.list": (init: FetchOptions<operations["atc-content.keys.list"]>) => client.GET("/v1/namespaces/{ns}/keys", init),
    "atc-content.keys.upsert": (init: FetchOptions<operations["atc-content.keys.upsert"]>) => client.PUT("/v1/namespaces/{ns}/keys/{key}", init),
    "atc-content.locales.delete": (init: FetchOptions<operations["atc-content.locales.delete"]>) => client.DELETE("/v1/namespaces/{ns}/locales/{locale}", init),
    "atc-content.locales.upsert": (init: FetchOptions<operations["atc-content.locales.upsert"]>) => client.PUT("/v1/namespaces/{ns}/locales/{locale}", init),
    "atc-content.metrics.get": (init: FetchOptions<operations["atc-content.metrics.get"]>) => client.GET("/metrics", init),
    "atc-content.namespaces.create": (init: FetchOptions<operations["atc-content.namespaces.create"]>) => client.POST("/v1/namespaces", init),
    "atc-content.namespaces.delete": (init: FetchOptions<operations["atc-content.namespaces.delete"]>) => client.DELETE("/v1/namespaces/{ns}", init),
    "atc-content.namespaces.get": (init: FetchOptions<operations["atc-content.namespaces.get"]>) => client.GET("/v1/namespaces/{ns}", init),
    "atc-content.namespaces.list": (init: FetchOptions<operations["atc-content.namespaces.list"]>) => client.GET("/v1/namespaces", init),
    "atc-content.namespaces.update": (init: FetchOptions<operations["atc-content.namespaces.update"]>) => client.PATCH("/v1/namespaces/{ns}", init),
    "atc-content.openapi": (init: FetchOptions<operations["atc-content.openapi"]>) => client.GET("/openapi.yaml", init),
    "atc-content.ready.get": (init: FetchOptions<operations["atc-content.ready.get"]>) => client.GET("/ready", init),
    "atc-content.releases.get": (init: FetchOptions<operations["atc-content.releases.get"]>) => client.GET("/v1/namespaces/{ns}/releases/{number}", init),
    "atc-content.releases.list": (init: FetchOptions<operations["atc-content.releases.list"]>) => client.GET("/v1/namespaces/{ns}/releases", init),
    "atc-content.releases.publish": (init: FetchOptions<operations["atc-content.releases.publish"]>) => client.POST("/v1/namespaces/{ns}/publish", init),
    "atc-content.releases.rollback": (init: FetchOptions<operations["atc-content.releases.rollback"]>) => client.POST("/v1/namespaces/{ns}/rollback", init),
    "atc-content.stats.get": (init: FetchOptions<operations["atc-content.stats.get"]>) => client.GET("/v1/stats", init),
    "atc-content.translations.export": (init: FetchOptions<operations["atc-content.translations.export"]>) => client.GET("/v1/namespaces/{ns}/export/{locale}", init),
    "atc-content.translations.import": (init: FetchOptions<operations["atc-content.translations.import"]>) => client.POST("/v1/namespaces/{ns}/import", init),
    "atc-content.values.review": (init: FetchOptions<operations["atc-content.values.review"]>) => client.POST("/v1/namespaces/{ns}/review", init),
  } as const;
}

export type AtcContentClient = ReturnType<typeof createClient>;
