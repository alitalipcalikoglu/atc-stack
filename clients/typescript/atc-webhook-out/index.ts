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
  /** Origin + path prefix the atc-webhook-out service is reachable at, e.g. "https://atc-webhook-out.internal:4000". */
  baseUrl: string;
  /** Headers merged into every request (e.g. { Authorization: "Bearer <key>" }). Per-call headers passed to an operation win over these. */
  headers?: HeadersInit;
  /** Override the fetch implementation (useful in tests, or for a non-global fetch runtime). Defaults to the ambient global fetch. */
  fetch?: typeof fetch;
  /** Passed straight to every underlying fetch() call's RequestInit.credentials -- set to "include" for cookie-based auth (console). */
  credentials?: RequestCredentials;
}

/**
 * One operationId-keyed method per operation in atc-webhook-out's openapi.yaml (23 total).
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
    "atc-webhook-out.deliveries.cancel": (init: FetchOptions<operations["atc-webhook-out.deliveries.cancel"]>) => client.POST("/v1/deliveries/{id}/cancel", init),
    "atc-webhook-out.deliveries.get": (init: FetchOptions<operations["atc-webhook-out.deliveries.get"]>) => client.GET("/v1/deliveries/{id}", init),
    "atc-webhook-out.deliveries.list": (init: FetchOptions<operations["atc-webhook-out.deliveries.list"]>) => client.GET("/v1/deliveries", init),
    "atc-webhook-out.deliveries.redeliver": (init: FetchOptions<operations["atc-webhook-out.deliveries.redeliver"]>) => client.POST("/v1/deliveries/{id}/redeliver", init),
    "atc-webhook-out.events.get": (init: FetchOptions<operations["atc-webhook-out.events.get"]>) => client.GET("/v1/events/{id}", init),
    "atc-webhook-out.events.list": (init: FetchOptions<operations["atc-webhook-out.events.list"]>) => client.GET("/v1/events", init),
    "atc-webhook-out.events.publish": (init: FetchOptions<operations["atc-webhook-out.events.publish"]>) => client.POST("/v1/events", init),
    "atc-webhook-out.eventTypes.list": (init: FetchOptions<operations["atc-webhook-out.eventTypes.list"]>) => client.GET("/v1/event-types", init),
    "atc-webhook-out.health.get": (init: FetchOptions<operations["atc-webhook-out.health.get"]>) => client.GET("/health", init),
    "atc-webhook-out.info.get": (init: FetchOptions<operations["atc-webhook-out.info.get"]>) => client.GET("/v1/info", init),
    "atc-webhook-out.metrics.get": (init: FetchOptions<operations["atc-webhook-out.metrics.get"]>) => client.GET("/metrics", init),
    "atc-webhook-out.openapi": (init: FetchOptions<operations["atc-webhook-out.openapi"]>) => client.GET("/openapi.yaml", init),
    "atc-webhook-out.ready.get": (init: FetchOptions<operations["atc-webhook-out.ready.get"]>) => client.GET("/ready", init),
    "atc-webhook-out.stats.get": (init: FetchOptions<operations["atc-webhook-out.stats.get"]>) => client.GET("/v1/stats", init),
    "atc-webhook-out.subscriptions.create": (init: FetchOptions<operations["atc-webhook-out.subscriptions.create"]>) => client.POST("/v1/subscriptions", init),
    "atc-webhook-out.subscriptions.delete": (init: FetchOptions<operations["atc-webhook-out.subscriptions.delete"]>) => client.DELETE("/v1/subscriptions/{id}", init),
    "atc-webhook-out.subscriptions.get": (init: FetchOptions<operations["atc-webhook-out.subscriptions.get"]>) => client.GET("/v1/subscriptions/{id}", init),
    "atc-webhook-out.subscriptions.list": (init: FetchOptions<operations["atc-webhook-out.subscriptions.list"]>) => client.GET("/v1/subscriptions", init),
    "atc-webhook-out.subscriptions.listDeliveries": (init: FetchOptions<operations["atc-webhook-out.subscriptions.listDeliveries"]>) => client.GET("/v1/subscriptions/{id}/deliveries", init),
    "atc-webhook-out.subscriptions.patch": (init: FetchOptions<operations["atc-webhook-out.subscriptions.patch"]>) => client.PATCH("/v1/subscriptions/{id}", init),
    "atc-webhook-out.subscriptions.replay": (init: FetchOptions<operations["atc-webhook-out.subscriptions.replay"]>) => client.POST("/v1/subscriptions/{id}/replay", init),
    "atc-webhook-out.subscriptions.rotate": (init: FetchOptions<operations["atc-webhook-out.subscriptions.rotate"]>) => client.POST("/v1/subscriptions/{id}/rotate", init),
    "atc-webhook-out.subscriptions.test": (init: FetchOptions<operations["atc-webhook-out.subscriptions.test"]>) => client.POST("/v1/subscriptions/{id}/test", init),
  } as const;
}

export type AtcWebhookOutClient = ReturnType<typeof createClient>;
