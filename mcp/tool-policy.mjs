// The exposure decision per service: which operations are MCP tools (by operationId, which is also
// the tool name) and, for every class of write operation that is NOT exposed, one line on why.
// Scope (product decision for 1.19): read tools everywhere, plus SAFE writes -- ones that create or
// update a resource and can be undone by another safe call, or that only queue/start work without
// destroying anything. Nothing destructive or irreversible: no delete, purge, clear, refund,
// cancel, restore, revoke, rotate, key or role changes. atc-auth is read-only and never returns
// secrets; atc-console exposes nothing beyond the atc-stack.status probe.
//
// This file is data, not registration: src/tools/ is still the only place a tool exists.
// tool-catalog.reconcile.mjs copies it into tool-catalog.json and checks both agree.

/** @typedef {{ tools: string[], excluded: { ops: string[], reason: string }[] }} ServicePolicy */

/** @type {Record<string, ServicePolicy>} */
export const POLICY = {
  'atc-gateway': { tools: [], excluded: [] },
  'atc-console': {
    tools: [],
    excluded: [{ ops: ['*'], reason: 'The console is a human admin UI with its own session auth; agents use the services directly.' }],
  },
  'atc-audit': {
    tools: ['atc-audit.events.list', 'atc-audit.events.get', 'atc-audit.stats.get', 'atc-audit.chain.getHead', 'atc-audit.chain.verify', 'atc-audit.anchors.list'],
    excluded: [
      { ops: ['atc-audit.events.create', 'atc-audit.events.createBatch'], reason: 'The audit log is append-only security history; an agent must not author entries that can never be withdrawn.' },
      { ops: ['atc-audit.events.export'], reason: 'Bulk NDJSON download; use events.list pages instead.' },
    ],
  },
  'atc-auth': {
    tools: ['atc-auth.users.list', 'atc-auth.users.get', 'atc-auth.sessions.list', 'atc-auth.events.list'],
    excluded: [
      { ops: ['atc-auth.users.create', 'atc-auth.users.patch', 'atc-auth.users.delete', 'atc-auth.users.anonymize'], reason: 'Account changes are identity administration; read-only by decision.' },
      { ops: ['atc-auth.sessions.revokeAll', 'atc-auth.sessions.revokeOne', 'atc-auth.logout'], reason: 'Revoking sessions signs people out and cannot be undone.' },
      { ops: ['atc-auth.users.export'], reason: 'Everything stored about one person (addresses included): a data-subject request for a human.' },
      { ops: ['atc-auth.email.change', 'atc-auth.email.confirm'], reason: 'End-user flows: the first takes a password, the second a mailed token.' },
      { ops: ['atc-auth.login.mfa', 'atc-auth.mfa.setup', 'atc-auth.mfa.enable', 'atc-auth.mfa.disable', 'atc-auth.mfa.recoveryCodes'], reason: 'End-user MFA flows: they need the user\'s own token or code and return secrets.' },
      { ops: ['atc-auth.users.resetMfa'], reason: 'Removing a second factor weakens an account; an administrator decides that in the console.' },
      { ops: ['atc-auth.login', 'atc-auth.refresh', 'atc-auth.introspect'], reason: 'End-user credential flows: they take passwords or tokens and mint secrets.' },
      { ops: ['atc-auth.password.change', 'atc-auth.password.forgot', 'atc-auth.password.reset', 'atc-auth.emailVerification.resend', 'atc-auth.emailVerification.verify'], reason: 'Password and verification flows act for an end user and send mail; forgot/resend must stay enumeration-resistant.' },
    ],
  },
  'atc-backup': {
    tools: ['atc-backup.sources.list', 'atc-backup.sources.get', 'atc-backup.backups.list', 'atc-backup.backups.get', 'atc-backup.stats.get', 'atc-backup.backups.verify'],
    excluded: [
      { ops: ['atc-backup.sources.backup'], reason: 'A new backup runs retention, which can delete the oldest kept backup.' },
      { ops: ['atc-backup.backups.restore', 'atc-backup.backups.delete'], reason: 'Restore overwrites files (or a live database); delete is irreversible.' },
      { ops: ['atc-backup.backups.drill'], reason: 'Unpacks the whole backup to a scratch place; heavy file work, run from the console or the schedule.' },
      { ops: ['atc-backup.backups.download'], reason: 'Streams a whole database (secrets included) as binary.' },
    ],
  },
  'atc-content': {
    tools: ['atc-content.namespaces.list', 'atc-content.namespaces.get', 'atc-content.keys.list', 'atc-content.keys.get', 'atc-content.releases.list', 'atc-content.releases.get', 'atc-content.stats.get', 'atc-content.bundles.get', 'atc-content.namespaces.create', 'atc-content.namespaces.update', 'atc-content.locales.upsert', 'atc-content.keys.upsert'],
    excluded: [
      { ops: ['atc-content.values.review'], reason: "Approving translations is a reviewer's judgement; four eyes by design." },
      { ops: ['atc-content.namespaces.delete', 'atc-content.locales.delete', 'atc-content.keys.delete'], reason: 'Deletes are irreversible.' },
      { ops: ['atc-content.releases.publish', 'atc-content.releases.rollback'], reason: 'Changes what every end user is served at once; a human decision in the console.' },
      { ops: ['atc-content.translations.import'], reason: 'Bulk overwrite of a whole locale; not undoable key by key.' },
      { ops: ['atc-content.translations.export'], reason: 'Bulk file download; read keys with keys.list.' },
    ],
  },
  'atc-export': {
    tools: ['atc-export.sources.list', 'atc-export.exports.list', 'atc-export.exports.get', 'atc-export.stats.get', 'atc-export.exports.download', 'atc-export.exports.create', 'atc-export.exports.retry'],
    excluded: [{ ops: ['atc-export.exports.cancel', 'atc-export.exports.delete'], reason: 'Cancel and delete discard work and files irreversibly.' }],
  },
  'atc-flags': {
    tools: ['atc-flags.environments.list', 'atc-flags.flags.list', 'atc-flags.flags.get', 'atc-flags.flags.getHistory', 'atc-flags.history.list', 'atc-flags.envs.get', 'atc-flags.stats.get', 'atc-flags.evaluate.post', 'atc-flags.flags.create', 'atc-flags.flags.patch', 'atc-flags.changes.list'],
    excluded: [
      { ops: ['atc-flags.changes.approve', 'atc-flags.changes.reject'], reason: "Approval of a protected-environment change is a second person's decision; an agent must not make it." },
      { ops: ['atc-flags.flags.delete'], reason: 'Irreversible.' },
      { ops: ['atc-flags.envs.copy', 'atc-flags.envs.patch'], reason: 'Bulk changes to a whole environment at once.' },
      { ops: ['atc-flags.evaluate.get', 'atc-flags.snapshot.get'], reason: 'Duplicates of evaluate.post / SDK bootstrap payloads; no extra value for an agent.' },
    ],
  },
  'atc-geo': {
    tools: ['atc-geo.ip.lookup', 'atc-geo.ip.lookupBatch', 'atc-geo.phone.normalize', 'atc-geo.phone.normalizeBatch', 'atc-geo.distance.compute', 'atc-geo.countries.list', 'atc-geo.countries.get', 'atc-geo.currencies.list', 'atc-geo.timezones.list', 'atc-geo.collections.list', 'atc-geo.collections.get', 'atc-geo.places.list', 'atc-geo.places.get', 'atc-geo.places.nearby', 'atc-geo.stats.get', 'atc-geo.database.getInfo', 'atc-geo.collections.create', 'atc-geo.collections.patch', 'atc-geo.places.upsert'],
    excluded: [
      { ops: ['atc-geo.collections.delete', 'atc-geo.collections.clear', 'atc-geo.places.delete'], reason: 'Delete and clear are irreversible.' },
      { ops: ['atc-geo.database.reload'], reason: 'Operator action that swaps the live IP database.' },
    ],
  },
  'atc-media': {
    tools: ['atc-media.files.list', 'atc-media.files.get', 'atc-media.files.signUrls', 'atc-media.quarantine.list'],
    excluded: [
      { ops: ['atc-media.quarantine.delete'], reason: 'Deletes the only copy of a rejected upload; irreversible.' },
      { ops: ['atc-media.files.delete', 'atc-media.files.restore'], reason: 'Delete is irreversible; restore is its operator counterpart.' },
      { ops: ['atc-media.files.patch'], reason: 'Can switch a private file to public, which exposes it.' },
      { ops: ['atc-media.files.upload', 'atc-media.files.uploadTicketed', 'atc-media.tickets.create'], reason: 'Binary uploads do not fit MCP tool calls.' },
    ],
  },
  'atc-notify': {
    tools: ['atc-notify.messages.list', 'atc-notify.messages.create', 'atc-notify.messages.get', 'atc-notify.templates.list', 'atc-notify.suppressions.list', 'atc-notify.suppressions.get'],
    excluded: [
      { ops: ['atc-notify.messages.retry'], reason: 'Sends an e-mail again to a real recipient.' },
      { ops: ['atc-notify.suppressions.create', 'atc-notify.suppressions.delete', 'atc-notify.suppressions.report'], reason: 'Who may get mail is an operator decision; removing a suppression can mail someone who complained.' },
      { ops: ['atc-notify.hooks.bounces', 'atc-notify.unsubscribe.page', 'atc-notify.unsubscribe.confirm'], reason: 'Provider and recipient endpoints, not an API for agents.' },
    ],
  },
  'atc-payments': {
    tools: ['atc-payments.payments.list', 'atc-payments.payments.get', 'atc-payments.ledger.list', 'atc-payments.events.list', 'atc-payments.stats.get', 'atc-payments.payments.create', 'atc-payments.payments.sync', 'atc-payments.disputes.list', 'atc-payments.disputes.get'],
    excluded: [
      { ops: ['atc-payments.disputes.evidence', 'atc-payments.disputes.accept'], reason: 'Evidence goes to the card issuer and accepting concedes the money; both are final.' },
      { ops: ['atc-payments.refunds.create', 'atc-payments.payments.cancel'], reason: 'Moves or stops real money; irreversible.' },
      { ops: ['atc-payments.payments.anonymize'], reason: 'Erases customer data here and at Stripe; irreversible.' },
      { ops: ['atc-payments.reconciliation.run'], reason: 'Reads Stripe once per payment and can repair (write); a deliberate operator action.' },
      { ops: ['atc-payments.webhooks.stripe'], reason: 'Stripe-only endpoint authenticated by its signature.' },
    ],
  },
  'atc-queue': {
    tools: ['atc-queue.queues.list', 'atc-queue.queues.get', 'atc-queue.messages.list', 'atc-queue.messages.get', 'atc-queue.stats.get', 'atc-queue.queues.upsert', 'atc-queue.messages.enqueue', 'atc-queue.messages.enqueueBatch'],
    excluded: [
      { ops: ['atc-queue.queues.delete', 'atc-queue.queues.purge', 'atc-queue.messages.delete'], reason: 'Deletes messages irreversibly.' },
      { ops: ['atc-queue.messages.pull', 'atc-queue.messages.ack', 'atc-queue.messages.nack', 'atc-queue.messages.extend'], reason: 'Worker data plane: leasing and acking another consumer\'s work.' },
      { ops: ['atc-queue.queues.redrive'], reason: 'Dead-letter handling is an operator decision in the console.' },
    ],
  },
  'atc-ratelimit': {
    tools: ['atc-ratelimit.policies.list', 'atc-ratelimit.policies.get', 'atc-ratelimit.policies.getStats', 'atc-ratelimit.policies.getTop', 'atc-ratelimit.overrides.list', 'atc-ratelimit.subjects.getUsage', 'atc-ratelimit.stats.get', 'atc-ratelimit.check', 'atc-ratelimit.policies.create', 'atc-ratelimit.policies.patch'],
    excluded: [
      { ops: ['atc-ratelimit.policies.delete', 'atc-ratelimit.overrides.delete', 'atc-ratelimit.subjects.resetUsage'], reason: 'Irreversible; reset wipes counters.' },
      { ops: ['atc-ratelimit.overrides.set'], reason: 'Undoing an override needs a delete.' },
      { ops: ['atc-ratelimit.checkBatch', 'atc-ratelimit.release'], reason: 'Consume or return real quota (check is exposed as a peek only).' },
    ],
  },
  'atc-render': {
    tools: ['atc-render.templates.list', 'atc-render.templates.get', 'atc-render.versions.get', 'atc-render.stats.get', 'atc-render.templates.create', 'atc-render.templates.update', 'atc-render.versions.create', 'atc-render.render.create', 'atc-render.fonts.list', 'atc-render.jobs.list', 'atc-render.jobs.get', 'atc-render.jobs.create'],
    excluded: [
      { ops: ['atc-render.jobs.pdf'], reason: 'Returns the PDF bytes; jobs.get reports the outcome.' },
      { ops: ['atc-render.jobs.cancel'], reason: 'Irreversible, like the scheduler and export cancels.' },
      { ops: ['atc-render.templates.delete'], reason: 'Irreversible.' },
      { ops: ['atc-render.render.preview'], reason: 'Returns the PDF bytes; render.create stores the document and returns a reference instead.' },
    ],
  },
  'atc-scheduler': {
    tools: ['atc-scheduler.jobs.list', 'atc-scheduler.jobs.get', 'atc-scheduler.jobs.listRuns', 'atc-scheduler.runs.list', 'atc-scheduler.runs.get', 'atc-scheduler.schedule.preview', 'atc-scheduler.stats.get', 'atc-scheduler.timezones.list', 'atc-scheduler.targetKeys.list', 'atc-scheduler.jobs.create', 'atc-scheduler.jobs.patch'],
    excluded: [
      { ops: ['atc-scheduler.jobs.delete', 'atc-scheduler.runs.cancel'], reason: 'Irreversible.' },
      { ops: ['atc-scheduler.jobs.run'], reason: 'Fires the job\'s HTTP call at once, outside its schedule.' },
    ],
  },
  'atc-search': {
    tools: ['atc-search.indexes.list', 'atc-search.indexes.get', 'atc-search.query.get', 'atc-search.query.post', 'atc-search.suggest', 'atc-search.documents.get', 'atc-search.documents.browse', 'atc-search.stats.get', 'atc-search.indexes.create', 'atc-search.indexes.patch', 'atc-search.documents.upsert'],
    excluded: [
      { ops: ['atc-search.indexes.delete', 'atc-search.indexes.clear', 'atc-search.documents.delete'], reason: 'Irreversible.' },
      { ops: ['atc-search.contentSync.run'], reason: 'Replaces every document of a mirror index; the content events keep it current.' },
      { ops: ['atc-search.hooks.webhookOut'], reason: 'Signed delivery endpoint for atc-webhook-out.' },
    ],
  },
  'atc-shortlink': {
    tools: ['atc-shortlink.links.list', 'atc-shortlink.links.get', 'atc-shortlink.links.getStats', 'atc-shortlink.stats.get', 'atc-shortlink.links.create', 'atc-shortlink.links.patch', 'atc-shortlink.links.batch'],
    excluded: [
      { ops: ['atc-shortlink.links.delete'], reason: 'Irreversible.' },
      { ops: ['atc-shortlink.links.getQr', 'atc-shortlink.qr.getForText', 'atc-shortlink.qr.getPublic'], reason: 'Binary images.' },
      { ops: ['atc-shortlink.redirect.follow', 'atc-shortlink.robots.get'], reason: 'Public browser endpoints that count clicks.' },
    ],
  },
  'atc-status': {
    tools: ['atc-status.monitors.list', 'atc-status.monitors.get', 'atc-status.monitors.checks', 'atc-status.incidents.list', 'atc-status.incidents.get', 'atc-status.stats.get', 'atc-status.page.summary', 'atc-status.alerts.list', 'atc-status.alerts.ack', 'atc-status.monitors.upsert', 'atc-status.maintenance.list', 'atc-status.maintenance.create'],
    excluded: [
      { ops: ['atc-status.page.subscribe', 'atc-status.page.subscribeConfirmPage', 'atc-status.page.subscribeConfirm', 'atc-status.page.unsubscribePage', 'atc-status.page.unsubscribe'], reason: 'Public pages for people subscribing by e-mail; the tokens in the links are the credential.' },
      { ops: ['atc-status.subscribers.list'], reason: 'Lists subscriber e-mail addresses (personal data).' },
      { ops: ['atc-status.maintenance.delete', 'atc-status.subscribers.delete'], reason: 'Irreversible.' },
      { ops: ['atc-status.incidents.addUpdate'], reason: 'Publishes text on the public status page and mails subscribers; a human writes it.' },
      { ops: ['atc-status.hooks.webhook-out'], reason: 'Signed machine endpoint for atc-webhook-out deliveries.' },
      { ops: ['atc-status.ping.post', 'atc-status.ping.get'], reason: 'Heartbeat from a monitored job; the path token is the credential.' },
      { ops: ['atc-status.monitors.delete'], reason: 'Irreversible (checks and incidents go with it).' },
      { ops: ['atc-status.monitors.check'], reason: 'Can open an incident and send alert e-mails.' },
      { ops: ['atc-status.page.get'], reason: 'HTML; page.summary has the same data.' },
    ],
  },
  'atc-webhook-out': {
    tools: ['atc-webhook-out.subscriptions.list', 'atc-webhook-out.subscriptions.get', 'atc-webhook-out.subscriptions.listDeliveries', 'atc-webhook-out.events.list', 'atc-webhook-out.events.get', 'atc-webhook-out.eventTypes.list', 'atc-webhook-out.deliveries.list', 'atc-webhook-out.deliveries.get', 'atc-webhook-out.stats.get', 'atc-webhook-out.subscriptions.create', 'atc-webhook-out.subscriptions.patch', 'atc-webhook-out.events.publish'],
    excluded: [
      { ops: ['atc-webhook-out.subscriptions.delete', 'atc-webhook-out.deliveries.cancel'], reason: 'Irreversible.' },
      { ops: ['atc-webhook-out.subscriptions.rotate'], reason: 'Signing-secret change: breaks receivers until they update.' },
      { ops: ['atc-webhook-out.subscriptions.test', 'atc-webhook-out.subscriptions.replay', 'atc-webhook-out.deliveries.redeliver'], reason: 'Re-sends deliveries to external receivers.' },
    ],
  },
};
