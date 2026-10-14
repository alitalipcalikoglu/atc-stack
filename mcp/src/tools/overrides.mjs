// Hand-decided behaviour on top of the generated operation tools, keyed by operationId. Each entry
// can drop input fields (`omit`), force body fields (`body`), filter the response (`output`) and add
// to the description. Everything else comes from the operation's own contract.

/** Response keys that may carry a secret; removed from every atc-auth and webhook-subscription result. */
const SECRET_KEY = /(password|hash|secret|totp|recovery|token|otp|salt)/i;

/** Deep copy without secret-looking keys. @param {unknown} v @returns {unknown} */
export function withoutSecrets(v) {
  if (Array.isArray(v)) return v.map(withoutSecrets);
  if (v && typeof v === 'object') return Object.fromEntries(Object.entries(v).filter(([k]) => !SECRET_KEY.test(k) || k === 'passwordChangedAt').map(([k, x]) => [k, withoutSecrets(x)]));
  return v;
}

/** @type {Record<string, { omit?: string[], body?: Record<string, unknown>, output?: (data: any) => unknown, description?: string, summary?: (data: any) => string }>} */
export const OVERRIDES = {
  'atc-auth.users.list': { output: withoutSecrets, description: 'Never returns password hashes, tokens or TOTP data.' },
  'atc-auth.users.get': { output: withoutSecrets, description: 'Never returns password hashes, tokens or TOTP data.' },
  'atc-auth.sessions.list': { output: withoutSecrets, description: 'Session metadata only; refresh tokens are never returned.' },
  'atc-auth.events.list': { output: withoutSecrets },
  'atc-webhook-out.subscriptions.create': { output: withoutSecrets, description: 'The signing secret is not returned here; read or rotate it in the console.' },
  'atc-webhook-out.subscriptions.get': { output: withoutSecrets },
  'atc-webhook-out.subscriptions.list': { output: withoutSecrets },
  'atc-webhook-out.subscriptions.patch': { output: withoutSecrets },
  // The PDF is stored in atc-media; the result is the file reference, never the bytes.
  'atc-render.render.create': { omit: ['store'], body: { store: true }, description: 'The document is always stored in atc-media; the result references the stored file.' },
  'atc-export.exports.download': { description: 'Returns a short-lived signed URL, not the file.' },
  'atc-payments.payments.create': { description: 'Requires idempotencyKey: the same key with the same body returns the same payment. Confirm the payment in the browser with the returned clientSecret.' },
};
