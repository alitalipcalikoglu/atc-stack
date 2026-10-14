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
  /** Origin + path prefix the atc-shortlink service is reachable at, e.g. "https://atc-shortlink.internal:4000". */
  baseUrl: string;
  /** Headers merged into every request (e.g. { Authorization: "Bearer <key>" }). Per-call headers passed to an operation win over these. */
  headers?: HeadersInit;
  /** Override the fetch implementation (useful in tests, or for a non-global fetch runtime). Defaults to the ambient global fetch. */
  fetch?: typeof fetch;
  /** Passed straight to every underlying fetch() call's RequestInit.credentials -- set to "include" for cookie-based auth (console). */
  credentials?: RequestCredentials;
}

/**
 * One operationId-keyed method per operation in atc-shortlink's openapi.yaml (17 total).
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
    "atc-shortlink.health.get": (init: FetchOptions<operations["atc-shortlink.health.get"]>) => client.GET("/health", init),
    "atc-shortlink.info.get": (init: FetchOptions<operations["atc-shortlink.info.get"]>) => client.GET("/v1/info", init),
    "atc-shortlink.links.create": (init: FetchOptions<operations["atc-shortlink.links.create"]>) => client.POST("/v1/links", init),
    "atc-shortlink.links.delete": (init: FetchOptions<operations["atc-shortlink.links.delete"]>) => client.DELETE("/v1/links/{code}", init),
    "atc-shortlink.links.get": (init: FetchOptions<operations["atc-shortlink.links.get"]>) => client.GET("/v1/links/{code}", init),
    "atc-shortlink.links.getQr": (init: FetchOptions<operations["atc-shortlink.links.getQr"]>) => client.GET("/v1/links/{code}/qr", init),
    "atc-shortlink.links.getStats": (init: FetchOptions<operations["atc-shortlink.links.getStats"]>) => client.GET("/v1/links/{code}/stats", init),
    "atc-shortlink.links.list": (init: FetchOptions<operations["atc-shortlink.links.list"]>) => client.GET("/v1/links", init),
    "atc-shortlink.links.patch": (init: FetchOptions<operations["atc-shortlink.links.patch"]>) => client.PATCH("/v1/links/{code}", init),
    "atc-shortlink.metrics.get": (init: FetchOptions<operations["atc-shortlink.metrics.get"]>) => client.GET("/metrics", init),
    "atc-shortlink.openapi": (init: FetchOptions<operations["atc-shortlink.openapi"]>) => client.GET("/openapi.yaml", init),
    "atc-shortlink.qr.getForText": (init: FetchOptions<operations["atc-shortlink.qr.getForText"]>) => client.GET("/v1/qr", init),
    "atc-shortlink.qr.getPublic": (init: FetchOptions<operations["atc-shortlink.qr.getPublic"]>) => client.GET("/{code}/qr", init),
    "atc-shortlink.ready.get": (init: FetchOptions<operations["atc-shortlink.ready.get"]>) => client.GET("/ready", init),
    "atc-shortlink.redirect.follow": (init: FetchOptions<operations["atc-shortlink.redirect.follow"]>) => client.GET("/{code}", init),
    "atc-shortlink.robots.get": (init: FetchOptions<operations["atc-shortlink.robots.get"]>) => client.GET("/robots.txt", init),
    "atc-shortlink.stats.get": (init: FetchOptions<operations["atc-shortlink.stats.get"]>) => client.GET("/v1/stats", init),
  } as const;
}

export type AtcShortlinkClient = ReturnType<typeof createClient>;
