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
  /** Origin + path prefix the atc-payments service is reachable at, e.g. "https://atc-payments.internal:4000". */
  baseUrl: string;
  /** Headers merged into every request (e.g. { Authorization: "Bearer <key>" }). Per-call headers passed to an operation win over these. */
  headers?: HeadersInit;
  /** Override the fetch implementation (useful in tests, or for a non-global fetch runtime). Defaults to the ambient global fetch. */
  fetch?: typeof fetch;
  /** Passed straight to every underlying fetch() call's RequestInit.credentials -- set to "include" for cookie-based auth (console). */
  credentials?: RequestCredentials;
}

/**
 * One operationId-keyed method per operation in atc-payments's openapi.yaml (17 total).
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
    "atc-payments.events.list": (init: FetchOptions<operations["atc-payments.events.list"]>) => client.GET("/v1/provider-events", init),
    "atc-payments.health.get": (init: FetchOptions<operations["atc-payments.health.get"]>) => client.GET("/health", init),
    "atc-payments.info.get": (init: FetchOptions<operations["atc-payments.info.get"]>) => client.GET("/v1/info", init),
    "atc-payments.ledger.list": (init: FetchOptions<operations["atc-payments.ledger.list"]>) => client.GET("/v1/ledger", init),
    "atc-payments.metrics.get": (init: FetchOptions<operations["atc-payments.metrics.get"]>) => client.GET("/metrics", init),
    "atc-payments.openapi": (init: FetchOptions<operations["atc-payments.openapi"]>) => client.GET("/openapi.yaml", init),
    "atc-payments.payments.anonymize": (init: FetchOptions<operations["atc-payments.payments.anonymize"]>) => client.POST("/v1/payments/{id}/anonymize", init),
    "atc-payments.payments.cancel": (init: FetchOptions<operations["atc-payments.payments.cancel"]>) => client.POST("/v1/payments/{id}/cancel", init),
    "atc-payments.payments.create": (init: FetchOptions<operations["atc-payments.payments.create"]>) => client.POST("/v1/payments", init),
    "atc-payments.payments.get": (init: FetchOptions<operations["atc-payments.payments.get"]>) => client.GET("/v1/payments/{id}", init),
    "atc-payments.payments.list": (init: FetchOptions<operations["atc-payments.payments.list"]>) => client.GET("/v1/payments", init),
    "atc-payments.payments.sync": (init: FetchOptions<operations["atc-payments.payments.sync"]>) => client.POST("/v1/payments/{id}/sync", init),
    "atc-payments.ready.get": (init: FetchOptions<operations["atc-payments.ready.get"]>) => client.GET("/ready", init),
    "atc-payments.reconciliation.run": (init: FetchOptions<operations["atc-payments.reconciliation.run"]>) => client.POST("/v1/reconciliation", init),
    "atc-payments.refunds.create": (init: FetchOptions<operations["atc-payments.refunds.create"]>) => client.POST("/v1/payments/{id}/refunds", init),
    "atc-payments.stats.get": (init: FetchOptions<operations["atc-payments.stats.get"]>) => client.GET("/v1/stats", init),
    "atc-payments.webhooks.stripe": (init: FetchOptions<operations["atc-payments.webhooks.stripe"]>) => client.POST("/v1/webhooks/stripe", init),
  } as const;
}

export type AtcPaymentsClient = ReturnType<typeof createClient>;
