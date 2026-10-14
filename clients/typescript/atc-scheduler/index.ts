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
  /** Origin + path prefix the atc-scheduler service is reachable at, e.g. "https://atc-scheduler.internal:4000". */
  baseUrl: string;
  /** Headers merged into every request (e.g. { Authorization: "Bearer <key>" }). Per-call headers passed to an operation win over these. */
  headers?: HeadersInit;
  /** Override the fetch implementation (useful in tests, or for a non-global fetch runtime). Defaults to the ambient global fetch. */
  fetch?: typeof fetch;
  /** Passed straight to every underlying fetch() call's RequestInit.credentials -- set to "include" for cookie-based auth (console). */
  credentials?: RequestCredentials;
}

/**
 * One operationId-keyed method per operation in atc-scheduler's openapi.yaml (19 total).
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
    "atc-scheduler.health.get": (init: FetchOptions<operations["atc-scheduler.health.get"]>) => client.GET("/health", init),
    "atc-scheduler.info.get": (init: FetchOptions<operations["atc-scheduler.info.get"]>) => client.GET("/v1/info", init),
    "atc-scheduler.jobs.create": (init: FetchOptions<operations["atc-scheduler.jobs.create"]>) => client.POST("/v1/jobs", init),
    "atc-scheduler.jobs.delete": (init: FetchOptions<operations["atc-scheduler.jobs.delete"]>) => client.DELETE("/v1/jobs/{name}", init),
    "atc-scheduler.jobs.get": (init: FetchOptions<operations["atc-scheduler.jobs.get"]>) => client.GET("/v1/jobs/{name}", init),
    "atc-scheduler.jobs.list": (init: FetchOptions<operations["atc-scheduler.jobs.list"]>) => client.GET("/v1/jobs", init),
    "atc-scheduler.jobs.listRuns": (init: FetchOptions<operations["atc-scheduler.jobs.listRuns"]>) => client.GET("/v1/jobs/{name}/runs", init),
    "atc-scheduler.jobs.patch": (init: FetchOptions<operations["atc-scheduler.jobs.patch"]>) => client.PATCH("/v1/jobs/{name}", init),
    "atc-scheduler.jobs.run": (init: FetchOptions<operations["atc-scheduler.jobs.run"]>) => client.POST("/v1/jobs/{name}/run", init),
    "atc-scheduler.metrics.get": (init: FetchOptions<operations["atc-scheduler.metrics.get"]>) => client.GET("/metrics", init),
    "atc-scheduler.openapi": (init: FetchOptions<operations["atc-scheduler.openapi"]>) => client.GET("/openapi.yaml", init),
    "atc-scheduler.ready.get": (init: FetchOptions<operations["atc-scheduler.ready.get"]>) => client.GET("/ready", init),
    "atc-scheduler.runs.cancel": (init: FetchOptions<operations["atc-scheduler.runs.cancel"]>) => client.POST("/v1/runs/{id}/cancel", init),
    "atc-scheduler.runs.get": (init: FetchOptions<operations["atc-scheduler.runs.get"]>) => client.GET("/v1/runs/{id}", init),
    "atc-scheduler.runs.list": (init: FetchOptions<operations["atc-scheduler.runs.list"]>) => client.GET("/v1/runs", init),
    "atc-scheduler.schedule.preview": (init: FetchOptions<operations["atc-scheduler.schedule.preview"]>) => client.GET("/v1/schedule/preview", init),
    "atc-scheduler.stats.get": (init: FetchOptions<operations["atc-scheduler.stats.get"]>) => client.GET("/v1/stats", init),
    "atc-scheduler.targetKeys.list": (init: FetchOptions<operations["atc-scheduler.targetKeys.list"]>) => client.GET("/v1/target-keys", init),
    "atc-scheduler.timezones.list": (init: FetchOptions<operations["atc-scheduler.timezones.list"]>) => client.GET("/v1/timezones", init),
  } as const;
}

export type AtcSchedulerClient = ReturnType<typeof createClient>;
