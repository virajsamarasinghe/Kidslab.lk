import { connectDB } from "@/lib/mongodb";
import Settings, { ISettings } from "@/models/Settings";
import {
  changedEmailTemplateFields,
  mergeEmailTemplates,
  type StoredEmailTemplates,
} from "@/lib/email-templates";
import type { EmailTemplates } from "@/config/email-templates";

/** Fetches the singleton settings doc, creating it with defaults if it doesn't exist yet. */
export async function getSettings(): Promise<ISettings> {
  await connectDB();
  let doc = await Settings.findOne();
  if (!doc) doc = await Settings.create({});
  return doc;
}

/** Plain (non-Mongoose) view of the settings doc — safe to hold across requests. */
export type SettingsSnapshot = Pick<
  ISettings,
  "brevo" | "llm" | "embedding" | "assistant" | "emailTemplates"
>;

/**
 * How long a snapshot is reused before the next read goes back to Mongo.
 *
 * Bounds staleness on hosts that run several instances, where
 * {@link invalidateSettingsSnapshot} only clears the instance that handled the
 * save. A minute is well under the time it takes an admin to change a key and
 * check the widget, and it's the difference between one Mongo round-trip per
 * chat message and none.
 */
const SNAPSHOT_TTL_MS = 60_000;

interface SnapshotCache {
  value: SettingsSnapshot | null;
  expires: number;
  inflight: Promise<SettingsSnapshot> | null;
}

declare global {
  var _settingsSnapshot: SnapshotCache | undefined;
}

// On `global` for the same reason as the Mongoose connection: dev hot-reload
// re-evaluates this module, and a module-local cache would be dropped (and the
// DB re-hit) on every edit.
const cache: SnapshotCache = globalThis._settingsSnapshot ?? {
  value: null,
  expires: 0,
  inflight: null,
};
globalThis._settingsSnapshot = cache;

/**
 * Cached, read-only settings for the request path.
 *
 * The public chat endpoint reads settings twice per message (provider list and
 * assistant persona) and can't afford a Mongo round-trip for each — the visitor
 * is watching a cursor blink. Deliberately an in-process cache rather than
 * `unstable_cache`: `llm[].apiKey` and `brevo.smtpKey` are live credentials, and
 * Next's data cache persists to disk.
 *
 * Concurrent misses share one query via `inflight`, so a burst of first requests
 * after a cold start doesn't fan out into N identical `findOne`s.
 *
 * Use {@link getSettings} instead when you intend to *write* — this returns a
 * detached copy, so mutating it saves nothing.
 */
export async function getSettingsSnapshot(): Promise<SettingsSnapshot> {
  if (cache.value && cache.expires > Date.now()) return cache.value;
  if (cache.inflight) return cache.inflight;

  const load = async () => {
    const doc = await getSettings();
    const value = doc.toObject<SettingsSnapshot>();
    cache.value = value;
    cache.expires = Date.now() + SNAPSHOT_TTL_MS;
    return value;
  };

  cache.inflight = load().finally(() => {
    cache.inflight = null;
  });
  return cache.inflight;
}

/** Call after saving settings so the next read reflects the change immediately. */
export function invalidateSettingsSnapshot() {
  cache.value = null;
  cache.expires = 0;
}

/**
 * The live email copy, with every unset slot filled in from the shipped
 * defaults in `@/config/email-templates`.
 *
 * Never throws, for the same reason `getSeoConfig` doesn't: a Mongo outage
 * must not stop a password reset going out. A failed read falls back to the
 * shipped copy, which is always a complete, sendable template.
 *
 * Reads through the same cached snapshot as the rest of the settings, so the
 * template lookup costs no extra round-trip on a send path that is already
 * fetching Brevo credentials. `invalidateSettingsSnapshot` (which the settings
 * PUT already calls) is what makes an edit visible immediately.
 */
export async function getEmailTemplates(): Promise<EmailTemplates> {
  try {
    const snapshot = await getSettingsSnapshot();
    const merged = mergeEmailTemplates(snapshot.emailTemplates);
    // Not awaited: a registrant must not wait on a housekeeping write, and it
    // is a no-op on every call after the first anyway.
    void seedEmailTemplates(snapshot.emailTemplates, merged);
    return merged;
  } catch {
    return mergeEmailTemplates(null);
  }
}

// On `global` for the same reason as the caches above: a dev hot-reload
// re-evaluates this module, and a module-local flag would let the seed run
// again on every edit.
declare global {
  var _emailTemplatesSeeded: boolean | undefined;
}

/**
 * Writes the shipped email copy into the database so it states outright what
 * is being sent, instead of leaving it implied by `@/config/email-templates`.
 *
 * Runs once per server instance — from `src/instrumentation.ts` at startup,
 * and again off the first send in case that hook couldn't reach Mongo. It
 * writes `mergeEmailTemplates(stored)`, so stored values win slot by slot and
 * an admin's edits are never overwritten; once written the slots match and
 * there is nothing left to do. A release that adds a template or a slot
 * therefore needs no migration: the fallback covers it immediately and the
 * next start fills it in.
 *
 * Note this makes the shipped copy *explicit* in the database. Changing a
 * default in a later release will not propagate to an already-seeded install —
 * that is what `npm run seed:email-templates -- --force` is for.
 *
 * Set `EMAIL_TEMPLATES_AUTO_SEED=0` to turn it off and seed by hand instead.
 */
export async function seedEmailTemplates(
  stored?: StoredEmailTemplates,
  merged?: EmailTemplates
): Promise<void> {
  if (globalThis._emailTemplatesSeeded) return;
  if (process.env.EMAIL_TEMPLATES_AUTO_SEED === "0") return;
  // Claimed before the first await so two concurrent requests can't both write.
  globalThis._emailTemplatesSeeded = true;

  try {
    let before = stored;
    let next = merged;
    if (next === undefined) {
      const snapshot = await getSettingsSnapshot();
      before = snapshot.emailTemplates;
      next = mergeEmailTemplates(before);
    }

    if (changedEmailTemplateFields(before, next).length === 0) return;

    // Upsert on an empty filter: this is the singleton settings document, and
    // it may not exist yet on a brand-new database.
    await Settings.updateOne({}, { $set: { emailTemplates: next } }, { upsert: true });
    // The snapshot this was read from predates the write; drop it so the next
    // reader sees the seeded document rather than a minute of stale absence.
    invalidateSettingsSnapshot();
  } catch {
    // Never surface a seeding failure: the merged copy is already correct in
    // memory, so every email still renders. Release the claim so the next
    // read (or the next server start) retries.
    globalThis._emailTemplatesSeeded = false;
  }
}
