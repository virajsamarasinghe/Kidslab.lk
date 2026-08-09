import { connectDB } from "@/lib/mongodb";
import Settings, { ISettings } from "@/models/Settings";

/** Fetches the singleton settings doc, creating it with defaults if it doesn't exist yet. */
export async function getSettings(): Promise<ISettings> {
  await connectDB();
  let doc = await Settings.findOne();
  if (!doc) doc = await Settings.create({});
  return doc;
}

/** Plain (non-Mongoose) view of the settings doc — safe to hold across requests. */
export type SettingsSnapshot = Pick<ISettings, "brevo" | "llm" | "embedding" | "assistant">;

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
