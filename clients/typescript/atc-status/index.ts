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
  /** Origin + path prefix the atc-status service is reachable at, e.g. "https://atc-status.internal:4000". */
  baseUrl: string;
  /** Headers merged into every request (e.g. { Authorization: "Bearer <key>" }). Per-call headers passed to an operation win over these. */
  headers?: HeadersInit;
  /** Override the fetch implementation (useful in tests, or for a non-global fetch runtime). Defaults to the ambient global fetch. */
  fetch?: typeof fetch;
  /** Passed straight to every underlying fetch() call's RequestInit.credentials -- set to "include" for cookie-based auth (console). */
  credentials?: RequestCredentials;
}

/**
 * One operationId-keyed method per operation in atc-status's openapi.yaml (32 total).
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
    "atc-status.alerts.ack": (init: FetchOptions<operations["atc-status.alerts.ack"]>) => client.POST("/v1/alerts/{id}/ack", init),
    "atc-status.alerts.list": (init: FetchOptions<operations["atc-status.alerts.list"]>) => client.GET("/v1/alerts", init),
    "atc-status.health.get": (init: FetchOptions<operations["atc-status.health.get"]>) => client.GET("/health", init),
    "atc-status.hooks.webhook-out": (init: FetchOptions<operations["atc-status.hooks.webhook-out"]>) => client.POST("/v1/hooks/webhook-out", init),
    "atc-status.incidents.addUpdate": (init: FetchOptions<operations["atc-status.incidents.addUpdate"]>) => client.POST("/v1/incidents/{id}/updates", init),
    "atc-status.incidents.get": (init: FetchOptions<operations["atc-status.incidents.get"]>) => client.GET("/v1/incidents/{id}", init),
    "atc-status.incidents.list": (init: FetchOptions<operations["atc-status.incidents.list"]>) => client.GET("/v1/incidents", init),
    "atc-status.info.get": (init: FetchOptions<operations["atc-status.info.get"]>) => client.GET("/v1/info", init),
    "atc-status.maintenance.create": (init: FetchOptions<operations["atc-status.maintenance.create"]>) => client.POST("/v1/maintenance", init),
    "atc-status.maintenance.delete": (init: FetchOptions<operations["atc-status.maintenance.delete"]>) => client.DELETE("/v1/maintenance/{id}", init),
    "atc-status.maintenance.list": (init: FetchOptions<operations["atc-status.maintenance.list"]>) => client.GET("/v1/maintenance", init),
    "atc-status.metrics.get": (init: FetchOptions<operations["atc-status.metrics.get"]>) => client.GET("/metrics", init),
    "atc-status.monitors.check": (init: FetchOptions<operations["atc-status.monitors.check"]>) => client.POST("/v1/monitors/{id}/check", init),
    "atc-status.monitors.checks": (init: FetchOptions<operations["atc-status.monitors.checks"]>) => client.GET("/v1/monitors/{id}/checks", init),
    "atc-status.monitors.delete": (init: FetchOptions<operations["atc-status.monitors.delete"]>) => client.DELETE("/v1/monitors/{id}", init),
    "atc-status.monitors.get": (init: FetchOptions<operations["atc-status.monitors.get"]>) => client.GET("/v1/monitors/{id}", init),
    "atc-status.monitors.list": (init: FetchOptions<operations["atc-status.monitors.list"]>) => client.GET("/v1/monitors", init),
    "atc-status.monitors.upsert": (init: FetchOptions<operations["atc-status.monitors.upsert"]>) => client.PUT("/v1/monitors/{id}", init),
    "atc-status.openapi": (init: FetchOptions<operations["atc-status.openapi"]>) => client.GET("/openapi.yaml", init),
    "atc-status.page.get": (init: FetchOptions<operations["atc-status.page.get"]>) => client.GET("/status", init),
    "atc-status.page.subscribe": (init: FetchOptions<operations["atc-status.page.subscribe"]>) => client.POST("/status/subscribe", init),
    "atc-status.page.subscribeConfirm": (init: FetchOptions<operations["atc-status.page.subscribeConfirm"]>) => client.POST("/status/subscribe/{token}", init),
    "atc-status.page.subscribeConfirmPage": (init: FetchOptions<operations["atc-status.page.subscribeConfirmPage"]>) => client.GET("/status/subscribe/{token}", init),
    "atc-status.page.summary": (init: FetchOptions<operations["atc-status.page.summary"]>) => client.GET("/status/summary.json", init),
    "atc-status.page.unsubscribe": (init: FetchOptions<operations["atc-status.page.unsubscribe"]>) => client.POST("/status/unsubscribe/{token}", init),
    "atc-status.page.unsubscribePage": (init: FetchOptions<operations["atc-status.page.unsubscribePage"]>) => client.GET("/status/unsubscribe/{token}", init),
    "atc-status.ping.get": (init: FetchOptions<operations["atc-status.ping.get"]>) => client.GET("/v1/ping/{id}/{token}", init),
    "atc-status.ping.post": (init: FetchOptions<operations["atc-status.ping.post"]>) => client.POST("/v1/ping/{id}/{token}", init),
    "atc-status.ready.get": (init: FetchOptions<operations["atc-status.ready.get"]>) => client.GET("/ready", init),
    "atc-status.stats.get": (init: FetchOptions<operations["atc-status.stats.get"]>) => client.GET("/v1/stats", init),
    "atc-status.subscribers.delete": (init: FetchOptions<operations["atc-status.subscribers.delete"]>) => client.DELETE("/v1/subscribers/{id}", init),
    "atc-status.subscribers.list": (init: FetchOptions<operations["atc-status.subscribers.list"]>) => client.GET("/v1/subscribers", init),
  } as const;
}

export type AtcStatusClient = ReturnType<typeof createClient>;
