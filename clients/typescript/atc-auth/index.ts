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
  /** Origin + path prefix the atc-auth service is reachable at, e.g. "https://atc-auth.internal:4000". */
  baseUrl: string;
  /** Headers merged into every request (e.g. { Authorization: "Bearer <key>" }). Per-call headers passed to an operation win over these. */
  headers?: HeadersInit;
  /** Override the fetch implementation (useful in tests, or for a non-global fetch runtime). Defaults to the ambient global fetch. */
  fetch?: typeof fetch;
  /** Passed straight to every underlying fetch() call's RequestInit.credentials -- set to "include" for cookie-based auth (console). */
  credentials?: RequestCredentials;
}

/**
 * One operationId-keyed method per operation in atc-auth's openapi.yaml (34 total).
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
    "atc-auth.email.change": (init: FetchOptions<operations["atc-auth.email.change"]>) => client.POST("/v1/auth/email/change", init),
    "atc-auth.email.confirm": (init: FetchOptions<operations["atc-auth.email.confirm"]>) => client.POST("/v1/auth/email/confirm", init),
    "atc-auth.emailVerification.resend": (init: FetchOptions<operations["atc-auth.emailVerification.resend"]>) => client.POST("/v1/auth/verify-email/resend", init),
    "atc-auth.emailVerification.verify": (init: FetchOptions<operations["atc-auth.emailVerification.verify"]>) => client.POST("/v1/auth/verify-email", init),
    "atc-auth.events.list": (init: FetchOptions<operations["atc-auth.events.list"]>) => client.GET("/v1/users/{id}/events", init),
    "atc-auth.health.get": (init: FetchOptions<operations["atc-auth.health.get"]>) => client.GET("/health", init),
    "atc-auth.info.get": (init: FetchOptions<operations["atc-auth.info.get"]>) => client.GET("/v1/info", init),
    "atc-auth.introspect": (init: FetchOptions<operations["atc-auth.introspect"]>) => client.POST("/v1/auth/introspect", init),
    "atc-auth.jwks.get": (init: FetchOptions<operations["atc-auth.jwks.get"]>) => client.GET("/.well-known/jwks.json", init),
    "atc-auth.login": (init: FetchOptions<operations["atc-auth.login"]>) => client.POST("/v1/auth/login", init),
    "atc-auth.login.mfa": (init: FetchOptions<operations["atc-auth.login.mfa"]>) => client.POST("/v1/auth/login/mfa", init),
    "atc-auth.logout": (init: FetchOptions<operations["atc-auth.logout"]>) => client.POST("/v1/auth/logout", init),
    "atc-auth.metrics.get": (init: FetchOptions<operations["atc-auth.metrics.get"]>) => client.GET("/metrics", init),
    "atc-auth.mfa.disable": (init: FetchOptions<operations["atc-auth.mfa.disable"]>) => client.POST("/v1/auth/mfa/disable", init),
    "atc-auth.mfa.enable": (init: FetchOptions<operations["atc-auth.mfa.enable"]>) => client.POST("/v1/auth/mfa/enable", init),
    "atc-auth.mfa.recoveryCodes": (init: FetchOptions<operations["atc-auth.mfa.recoveryCodes"]>) => client.POST("/v1/auth/mfa/recovery-codes", init),
    "atc-auth.mfa.setup": (init: FetchOptions<operations["atc-auth.mfa.setup"]>) => client.POST("/v1/auth/mfa/setup", init),
    "atc-auth.openapi": (init: FetchOptions<operations["atc-auth.openapi"]>) => client.GET("/openapi.yaml", init),
    "atc-auth.password.change": (init: FetchOptions<operations["atc-auth.password.change"]>) => client.POST("/v1/auth/password/change", init),
    "atc-auth.password.forgot": (init: FetchOptions<operations["atc-auth.password.forgot"]>) => client.POST("/v1/auth/password/forgot", init),
    "atc-auth.password.reset": (init: FetchOptions<operations["atc-auth.password.reset"]>) => client.POST("/v1/auth/password/reset", init),
    "atc-auth.ready.get": (init: FetchOptions<operations["atc-auth.ready.get"]>) => client.GET("/ready", init),
    "atc-auth.refresh": (init: FetchOptions<operations["atc-auth.refresh"]>) => client.POST("/v1/auth/refresh", init),
    "atc-auth.sessions.list": (init: FetchOptions<operations["atc-auth.sessions.list"]>) => client.GET("/v1/users/{id}/sessions", init),
    "atc-auth.sessions.revokeAll": (init: FetchOptions<operations["atc-auth.sessions.revokeAll"]>) => client.DELETE("/v1/users/{id}/sessions", init),
    "atc-auth.sessions.revokeOne": (init: FetchOptions<operations["atc-auth.sessions.revokeOne"]>) => client.DELETE("/v1/users/{id}/sessions/{sid}", init),
    "atc-auth.users.anonymize": (init: FetchOptions<operations["atc-auth.users.anonymize"]>) => client.POST("/v1/users/{id}/anonymize", init),
    "atc-auth.users.create": (init: FetchOptions<operations["atc-auth.users.create"]>) => client.POST("/v1/users", init),
    "atc-auth.users.delete": (init: FetchOptions<operations["atc-auth.users.delete"]>) => client.DELETE("/v1/users/{id}", init),
    "atc-auth.users.export": (init: FetchOptions<operations["atc-auth.users.export"]>) => client.GET("/v1/users/{id}/export", init),
    "atc-auth.users.get": (init: FetchOptions<operations["atc-auth.users.get"]>) => client.GET("/v1/users/{id}", init),
    "atc-auth.users.list": (init: FetchOptions<operations["atc-auth.users.list"]>) => client.GET("/v1/users", init),
    "atc-auth.users.patch": (init: FetchOptions<operations["atc-auth.users.patch"]>) => client.PATCH("/v1/users/{id}", init),
    "atc-auth.users.resetMfa": (init: FetchOptions<operations["atc-auth.users.resetMfa"]>) => client.DELETE("/v1/users/{id}/mfa", init),
  } as const;
}

export type AtcAuthClient = ReturnType<typeof createClient>;
