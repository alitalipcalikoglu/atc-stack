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
  /** Origin + path prefix the atc-render service is reachable at, e.g. "https://atc-render.internal:4000". */
  baseUrl: string;
  /** Headers merged into every request (e.g. { Authorization: "Bearer <key>" }). Per-call headers passed to an operation win over these. */
  headers?: HeadersInit;
  /** Override the fetch implementation (useful in tests, or for a non-global fetch runtime). Defaults to the ambient global fetch. */
  fetch?: typeof fetch;
  /** Passed straight to every underlying fetch() call's RequestInit.credentials -- set to "include" for cookie-based auth (console). */
  credentials?: RequestCredentials;
}

/**
 * One operationId-keyed method per operation in atc-render's openapi.yaml (21 total).
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
    "atc-render.fonts.list": (init: FetchOptions<operations["atc-render.fonts.list"]>) => client.GET("/v1/fonts", init),
    "atc-render.health.get": (init: FetchOptions<operations["atc-render.health.get"]>) => client.GET("/health", init),
    "atc-render.info.get": (init: FetchOptions<operations["atc-render.info.get"]>) => client.GET("/v1/info", init),
    "atc-render.jobs.cancel": (init: FetchOptions<operations["atc-render.jobs.cancel"]>) => client.POST("/v1/renders/{id}/cancel", init),
    "atc-render.jobs.create": (init: FetchOptions<operations["atc-render.jobs.create"]>) => client.POST("/v1/renders", init),
    "atc-render.jobs.get": (init: FetchOptions<operations["atc-render.jobs.get"]>) => client.GET("/v1/renders/{id}", init),
    "atc-render.jobs.list": (init: FetchOptions<operations["atc-render.jobs.list"]>) => client.GET("/v1/renders", init),
    "atc-render.jobs.pdf": (init: FetchOptions<operations["atc-render.jobs.pdf"]>) => client.GET("/v1/renders/{id}/pdf", init),
    "atc-render.metrics.get": (init: FetchOptions<operations["atc-render.metrics.get"]>) => client.GET("/metrics", init),
    "atc-render.openapi": (init: FetchOptions<operations["atc-render.openapi"]>) => client.GET("/openapi.yaml", init),
    "atc-render.ready.get": (init: FetchOptions<operations["atc-render.ready.get"]>) => client.GET("/ready", init),
    "atc-render.render.create": (init: FetchOptions<operations["atc-render.render.create"]>) => client.POST("/v1/render", init),
    "atc-render.render.preview": (init: FetchOptions<operations["atc-render.render.preview"]>) => client.POST("/v1/render/preview", init),
    "atc-render.stats.get": (init: FetchOptions<operations["atc-render.stats.get"]>) => client.GET("/v1/stats", init),
    "atc-render.templates.create": (init: FetchOptions<operations["atc-render.templates.create"]>) => client.POST("/v1/templates", init),
    "atc-render.templates.delete": (init: FetchOptions<operations["atc-render.templates.delete"]>) => client.DELETE("/v1/templates/{name}", init),
    "atc-render.templates.get": (init: FetchOptions<operations["atc-render.templates.get"]>) => client.GET("/v1/templates/{name}", init),
    "atc-render.templates.list": (init: FetchOptions<operations["atc-render.templates.list"]>) => client.GET("/v1/templates", init),
    "atc-render.templates.update": (init: FetchOptions<operations["atc-render.templates.update"]>) => client.PATCH("/v1/templates/{name}", init),
    "atc-render.versions.create": (init: FetchOptions<operations["atc-render.versions.create"]>) => client.POST("/v1/templates/{name}/versions", init),
    "atc-render.versions.get": (init: FetchOptions<operations["atc-render.versions.get"]>) => client.GET("/v1/templates/{name}/versions/{version}", init),
  } as const;
}

export type AtcRenderClient = ReturnType<typeof createClient>;
