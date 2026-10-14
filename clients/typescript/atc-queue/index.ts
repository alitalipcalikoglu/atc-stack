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
  /** Origin + path prefix the atc-queue service is reachable at, e.g. "https://atc-queue.internal:4000". */
  baseUrl: string;
  /** Headers merged into every request (e.g. { Authorization: "Bearer <key>" }). Per-call headers passed to an operation win over these. */
  headers?: HeadersInit;
  /** Override the fetch implementation (useful in tests, or for a non-global fetch runtime). Defaults to the ambient global fetch. */
  fetch?: typeof fetch;
  /** Passed straight to every underlying fetch() call's RequestInit.credentials -- set to "include" for cookie-based auth (console). */
  credentials?: RequestCredentials;
}

/**
 * One operationId-keyed method per operation in atc-queue's openapi.yaml (21 total).
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
    "atc-queue.health.get": (init: FetchOptions<operations["atc-queue.health.get"]>) => client.GET("/health", init),
    "atc-queue.info.get": (init: FetchOptions<operations["atc-queue.info.get"]>) => client.GET("/v1/info", init),
    "atc-queue.messages.ack": (init: FetchOptions<operations["atc-queue.messages.ack"]>) => client.POST("/v1/queues/{name}/messages/{id}/ack", init),
    "atc-queue.messages.delete": (init: FetchOptions<operations["atc-queue.messages.delete"]>) => client.DELETE("/v1/queues/{name}/messages/{id}", init),
    "atc-queue.messages.enqueue": (init: FetchOptions<operations["atc-queue.messages.enqueue"]>) => client.POST("/v1/queues/{name}/messages", init),
    "atc-queue.messages.enqueueBatch": (init: FetchOptions<operations["atc-queue.messages.enqueueBatch"]>) => client.POST("/v1/queues/{name}/messages/batch", init),
    "atc-queue.messages.extend": (init: FetchOptions<operations["atc-queue.messages.extend"]>) => client.POST("/v1/queues/{name}/messages/{id}/extend", init),
    "atc-queue.messages.get": (init: FetchOptions<operations["atc-queue.messages.get"]>) => client.GET("/v1/queues/{name}/messages/{id}", init),
    "atc-queue.messages.list": (init: FetchOptions<operations["atc-queue.messages.list"]>) => client.GET("/v1/queues/{name}/messages", init),
    "atc-queue.messages.nack": (init: FetchOptions<operations["atc-queue.messages.nack"]>) => client.POST("/v1/queues/{name}/messages/{id}/nack", init),
    "atc-queue.messages.pull": (init: FetchOptions<operations["atc-queue.messages.pull"]>) => client.POST("/v1/queues/{name}/pull", init),
    "atc-queue.metrics.get": (init: FetchOptions<operations["atc-queue.metrics.get"]>) => client.GET("/metrics", init),
    "atc-queue.openapi": (init: FetchOptions<operations["atc-queue.openapi"]>) => client.GET("/openapi.yaml", init),
    "atc-queue.queues.delete": (init: FetchOptions<operations["atc-queue.queues.delete"]>) => client.DELETE("/v1/queues/{name}", init),
    "atc-queue.queues.get": (init: FetchOptions<operations["atc-queue.queues.get"]>) => client.GET("/v1/queues/{name}", init),
    "atc-queue.queues.list": (init: FetchOptions<operations["atc-queue.queues.list"]>) => client.GET("/v1/queues", init),
    "atc-queue.queues.purge": (init: FetchOptions<operations["atc-queue.queues.purge"]>) => client.POST("/v1/queues/{name}/purge", init),
    "atc-queue.queues.redrive": (init: FetchOptions<operations["atc-queue.queues.redrive"]>) => client.POST("/v1/queues/{name}/redrive", init),
    "atc-queue.queues.upsert": (init: FetchOptions<operations["atc-queue.queues.upsert"]>) => client.PUT("/v1/queues/{name}", init),
    "atc-queue.ready.get": (init: FetchOptions<operations["atc-queue.ready.get"]>) => client.GET("/ready", init),
    "atc-queue.stats.get": (init: FetchOptions<operations["atc-queue.stats.get"]>) => client.GET("/v1/stats", init),
  } as const;
}

export type AtcQueueClient = ReturnType<typeof createClient>;
