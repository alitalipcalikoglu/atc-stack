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
  /** Origin + path prefix the atc-geo service is reachable at, e.g. "https://atc-geo.internal:4000". */
  baseUrl: string;
  /** Headers merged into every request (e.g. { Authorization: "Bearer <key>" }). Per-call headers passed to an operation win over these. */
  headers?: HeadersInit;
  /** Override the fetch implementation (useful in tests, or for a non-global fetch runtime). Defaults to the ambient global fetch. */
  fetch?: typeof fetch;
  /** Passed straight to every underlying fetch() call's RequestInit.credentials -- set to "include" for cookie-based auth (console). */
  credentials?: RequestCredentials;
}

/**
 * One operationId-keyed method per operation in atc-geo's openapi.yaml (31 total).
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
    "atc-geo.collections.clear": (init: FetchOptions<operations["atc-geo.collections.clear"]>) => client.POST("/v1/collections/{name}/clear", init),
    "atc-geo.collections.create": (init: FetchOptions<operations["atc-geo.collections.create"]>) => client.POST("/v1/collections", init),
    "atc-geo.collections.delete": (init: FetchOptions<operations["atc-geo.collections.delete"]>) => client.DELETE("/v1/collections/{name}", init),
    "atc-geo.collections.get": (init: FetchOptions<operations["atc-geo.collections.get"]>) => client.GET("/v1/collections/{name}", init),
    "atc-geo.collections.list": (init: FetchOptions<operations["atc-geo.collections.list"]>) => client.GET("/v1/collections", init),
    "atc-geo.collections.patch": (init: FetchOptions<operations["atc-geo.collections.patch"]>) => client.PATCH("/v1/collections/{name}", init),
    "atc-geo.countries.get": (init: FetchOptions<operations["atc-geo.countries.get"]>) => client.GET("/v1/countries/{code}", init),
    "atc-geo.countries.list": (init: FetchOptions<operations["atc-geo.countries.list"]>) => client.GET("/v1/countries", init),
    "atc-geo.currencies.get": (init: FetchOptions<operations["atc-geo.currencies.get"]>) => client.GET("/v1/currencies/{code}", init),
    "atc-geo.currencies.list": (init: FetchOptions<operations["atc-geo.currencies.list"]>) => client.GET("/v1/currencies", init),
    "atc-geo.database.getInfo": (init: FetchOptions<operations["atc-geo.database.getInfo"]>) => client.GET("/v1/database", init),
    "atc-geo.database.reload": (init: FetchOptions<operations["atc-geo.database.reload"]>) => client.POST("/v1/database/reload", init),
    "atc-geo.distance.compute": (init: FetchOptions<operations["atc-geo.distance.compute"]>) => client.GET("/v1/distance", init),
    "atc-geo.health.check": (init: FetchOptions<operations["atc-geo.health.check"]>) => client.GET("/health", init),
    "atc-geo.info.get": (init: FetchOptions<operations["atc-geo.info.get"]>) => client.GET("/v1/info", init),
    "atc-geo.ip.lookup": (init: FetchOptions<operations["atc-geo.ip.lookup"]>) => client.GET("/v1/ip/{ip}", init),
    "atc-geo.ip.lookupBatch": (init: FetchOptions<operations["atc-geo.ip.lookupBatch"]>) => client.POST("/v1/ip/batch", init),
    "atc-geo.ip.lookupSelf": (init: FetchOptions<operations["atc-geo.ip.lookupSelf"]>) => client.GET("/v1/ip/self", init),
    "atc-geo.metrics.get": (init: FetchOptions<operations["atc-geo.metrics.get"]>) => client.GET("/metrics", init),
    "atc-geo.openapi": (init: FetchOptions<operations["atc-geo.openapi"]>) => client.GET("/openapi.yaml", init),
    "atc-geo.phone.normalize": (init: FetchOptions<operations["atc-geo.phone.normalize"]>) => client.GET("/v1/phone", init),
    "atc-geo.phone.normalizeBatch": (init: FetchOptions<operations["atc-geo.phone.normalizeBatch"]>) => client.POST("/v1/phone/batch", init),
    "atc-geo.places.delete": (init: FetchOptions<operations["atc-geo.places.delete"]>) => client.DELETE("/v1/collections/{name}/places/{id}", init),
    "atc-geo.places.get": (init: FetchOptions<operations["atc-geo.places.get"]>) => client.GET("/v1/collections/{name}/places/{id}", init),
    "atc-geo.places.list": (init: FetchOptions<operations["atc-geo.places.list"]>) => client.GET("/v1/collections/{name}/places", init),
    "atc-geo.places.nearby": (init: FetchOptions<operations["atc-geo.places.nearby"]>) => client.GET("/v1/collections/{name}/nearby", init),
    "atc-geo.places.upsert": (init: FetchOptions<operations["atc-geo.places.upsert"]>) => client.PUT("/v1/collections/{name}/places", init),
    "atc-geo.ready.check": (init: FetchOptions<operations["atc-geo.ready.check"]>) => client.GET("/ready", init),
    "atc-geo.stats.get": (init: FetchOptions<operations["atc-geo.stats.get"]>) => client.GET("/v1/stats", init),
    "atc-geo.timezones.get": (init: FetchOptions<operations["atc-geo.timezones.get"]>) => client.GET("/v1/timezones/{tzPath}", init),
    "atc-geo.timezones.list": (init: FetchOptions<operations["atc-geo.timezones.list"]>) => client.GET("/v1/timezones", init),
  } as const;
}

export type AtcGeoClient = ReturnType<typeof createClient>;
