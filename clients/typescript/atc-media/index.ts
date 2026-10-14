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
  /** Origin + path prefix the atc-media service is reachable at, e.g. "https://atc-media.internal:4000". */
  baseUrl: string;
  /** Headers merged into every request (e.g. { Authorization: "Bearer <key>" }). Per-call headers passed to an operation win over these. */
  headers?: HeadersInit;
  /** Override the fetch implementation (useful in tests, or for a non-global fetch runtime). Defaults to the ambient global fetch. */
  fetch?: typeof fetch;
  /** Passed straight to every underlying fetch() call's RequestInit.credentials -- set to "include" for cookie-based auth (console). */
  credentials?: RequestCredentials;
}

/**
 * One operationId-keyed method per operation in atc-media's openapi.yaml (16 total).
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
    "atc-media.files.delete": (init: FetchOptions<operations["atc-media.files.delete"]>) => client.DELETE("/v1/files/{id}", init),
    "atc-media.files.deliver": (init: FetchOptions<operations["atc-media.files.deliver"]>) => client.GET("/files/{id}/{variant}", init),
    "atc-media.files.get": (init: FetchOptions<operations["atc-media.files.get"]>) => client.GET("/v1/files/{id}", init),
    "atc-media.files.list": (init: FetchOptions<operations["atc-media.files.list"]>) => client.GET("/v1/files", init),
    "atc-media.files.patch": (init: FetchOptions<operations["atc-media.files.patch"]>) => client.PATCH("/v1/files/{id}", init),
    "atc-media.files.restore": (init: FetchOptions<operations["atc-media.files.restore"]>) => client.POST("/v1/files/{id}/restore", init),
    "atc-media.files.signUrls": (init: FetchOptions<operations["atc-media.files.signUrls"]>) => client.POST("/v1/files/{id}/urls", init),
    "atc-media.files.upload": (init: FetchOptions<operations["atc-media.files.upload"]>) => client.PUT("/v1/files", init),
    "atc-media.files.uploadTicketed": (init: FetchOptions<operations["atc-media.files.uploadTicketed"]>) => client.PUT("/v1/uploads/{token}", init),
    "atc-media.openapi": (init: FetchOptions<operations["atc-media.openapi"]>) => client.GET("/openapi.yaml", init),
    "atc-media.ops.health": (init: FetchOptions<operations["atc-media.ops.health"]>) => client.GET("/health", init),
    "atc-media.ops.info": (init: FetchOptions<operations["atc-media.ops.info"]>) => client.GET("/v1/info", init),
    "atc-media.ops.metrics": (init: FetchOptions<operations["atc-media.ops.metrics"]>) => client.GET("/metrics", init),
    "atc-media.ops.ready": (init: FetchOptions<operations["atc-media.ops.ready"]>) => client.GET("/ready", init),
    "atc-media.tickets.create": (init: FetchOptions<operations["atc-media.tickets.create"]>) => client.POST("/v1/uploads", init),
    "atc-media.usage.get": (init: FetchOptions<operations["atc-media.usage.get"]>) => client.GET("/v1/usage", init),
  } as const;
}

export type AtcMediaClient = ReturnType<typeof createClient>;
