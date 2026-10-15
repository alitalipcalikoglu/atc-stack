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
  /** Origin + path prefix the atc-notify service is reachable at, e.g. "https://atc-notify.internal:4000". */
  baseUrl: string;
  /** Headers merged into every request (e.g. { Authorization: "Bearer <key>" }). Per-call headers passed to an operation win over these. */
  headers?: HeadersInit;
  /** Override the fetch implementation (useful in tests, or for a non-global fetch runtime). Defaults to the ambient global fetch. */
  fetch?: typeof fetch;
  /** Passed straight to every underlying fetch() call's RequestInit.credentials -- set to "include" for cookie-based auth (console). */
  credentials?: RequestCredentials;
}

/**
 * One operationId-keyed method per operation in atc-notify's openapi.yaml (18 total).
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
    "atc-notify.health.get": (init: FetchOptions<operations["atc-notify.health.get"]>) => client.GET("/health", init),
    "atc-notify.hooks.bounces": (init: FetchOptions<operations["atc-notify.hooks.bounces"]>) => client.POST("/v1/hooks/bounces", init),
    "atc-notify.info.get": (init: FetchOptions<operations["atc-notify.info.get"]>) => client.GET("/v1/info", init),
    "atc-notify.messages.create": (init: FetchOptions<operations["atc-notify.messages.create"]>) => client.POST("/v1/messages", init),
    "atc-notify.messages.get": (init: FetchOptions<operations["atc-notify.messages.get"]>) => client.GET("/v1/messages/{id}", init),
    "atc-notify.messages.list": (init: FetchOptions<operations["atc-notify.messages.list"]>) => client.GET("/v1/messages", init),
    "atc-notify.messages.retry": (init: FetchOptions<operations["atc-notify.messages.retry"]>) => client.POST("/v1/messages/{id}/retry", init),
    "atc-notify.metrics.get": (init: FetchOptions<operations["atc-notify.metrics.get"]>) => client.GET("/metrics", init),
    "atc-notify.openapi": (init: FetchOptions<operations["atc-notify.openapi"]>) => client.GET("/openapi.yaml", init),
    "atc-notify.ready.get": (init: FetchOptions<operations["atc-notify.ready.get"]>) => client.GET("/ready", init),
    "atc-notify.suppressions.create": (init: FetchOptions<operations["atc-notify.suppressions.create"]>) => client.POST("/v1/suppressions", init),
    "atc-notify.suppressions.delete": (init: FetchOptions<operations["atc-notify.suppressions.delete"]>) => client.DELETE("/v1/suppressions/{email}", init),
    "atc-notify.suppressions.get": (init: FetchOptions<operations["atc-notify.suppressions.get"]>) => client.GET("/v1/suppressions/{email}", init),
    "atc-notify.suppressions.list": (init: FetchOptions<operations["atc-notify.suppressions.list"]>) => client.GET("/v1/suppressions", init),
    "atc-notify.suppressions.report": (init: FetchOptions<operations["atc-notify.suppressions.report"]>) => client.POST("/v1/suppressions/events", init),
    "atc-notify.templates.list": (init: FetchOptions<operations["atc-notify.templates.list"]>) => client.GET("/v1/templates", init),
    "atc-notify.unsubscribe.confirm": (init: FetchOptions<operations["atc-notify.unsubscribe.confirm"]>) => client.POST("/v1/unsubscribe/{token}", init),
    "atc-notify.unsubscribe.page": (init: FetchOptions<operations["atc-notify.unsubscribe.page"]>) => client.GET("/v1/unsubscribe/{token}", init),
  } as const;
}

export type AtcNotifyClient = ReturnType<typeof createClient>;
