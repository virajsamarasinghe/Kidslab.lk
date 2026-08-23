/**
 * Materialises the shipped SEO/AEO defaults into the database.
 *
 * The site works without this: `getSeoConfig()` falls back to `SEO_DEFAULTS`
 * for anything the `seo` section doesn't carry, so a fresh install renders
 * correctly with an empty database. What this script buys you is a database
 * that *states* the config rather than implying it — every default written out
 * as a real, editable row in Settings -> SEO & AEO from day one, instead of
 * appearing only after an admin presses Publish for the first time.
 *
 * It runs through the same `mergeSeo()` the request path uses, which is what
 * makes it safe to re-run: stored values win over defaults field by field, so
 * an admin's edits survive. Only genuinely absent or blank fields get filled.
 *
 * Usage (from the repo root):
 *   npm run seed:seo              # fill in whatever's missing
 *   npm run seed:seo -- --dry-run # show what would change, write nothing
 *   npm run seed:seo -- --force   # discard overrides, reset to the defaults
 *
 * Reads MONGODB_URI from .env.local like the app does; point it at another
 * environment by setting MONGODB_URI in front of the command.
 */
import mongoose from "mongoose";
// `@next/env` is CommonJS, so the named export isn't reachable from ESM.
import nextEnv from "@next/env";

import { SEO_DEFAULTS, type SeoConfig } from "@/config/seo";
import { mergeSeo } from "@/lib/seo";

// Neither import reads MONGODB_URI at module scope (`@/lib/mongodb` does, and
// would throw, which is why nothing here imports it) — but the connection
// below needs the env loaded, so do it before anything else runs.
nextEnv.loadEnvConfig(process.cwd());

const args = new Set(process.argv.slice(2));
const dryRun = args.has("--dry-run");
const force = args.has("--force");

const { MONGODB_URI } = process.env;
if (!MONGODB_URI) {
  console.error("MONGODB_URI is not set — check .env.local");
  process.exit(1);
}

await mongoose.connect(MONGODB_URI);

// The raw collection rather than the Mongoose model, like
// scripts/promote-super-admin.mjs: registering the model here would pull the
// whole app's schema graph into a standalone script for no benefit, and the
// other sections of the doc are none of this script's business.
const settings = mongoose.connection.collection("settings");

const doc = await settings.findOne({});
if (!doc) console.log("No settings document yet — one will be created.");

const before: Partial<SeoConfig> = doc?.seo ?? {};
const next = force ? SEO_DEFAULTS : mergeSeo(before);

/* Report per top-level field rather than a wall of JSON — the point of the
   summary is to make an unexpected overwrite obvious before it's committed. */
const changed = (Object.keys(next) as (keyof typeof next)[]).filter(
  (key) => JSON.stringify(before[key]) !== JSON.stringify(next[key])
);

if (changed.length === 0) {
  console.log("Already up to date — nothing to write.");
} else {
  console.log(`${dryRun ? "Would update" : "Updating"} ${changed.length} field(s):`);
  for (const key of changed) {
    const from = before[key] === undefined ? "(unset)" : summarise(before[key]);
    console.log(`  • ${String(key)}: ${from} -> ${summarise(next[key])}`);
  }
}

if (!dryRun && changed.length > 0) {
  await settings.updateOne(
    doc ? { _id: doc._id } : {},
    { $set: { seo: next, updatedAt: new Date() }, $setOnInsert: { createdAt: new Date() } },
    { upsert: true }
  );
  console.log(
    force
      ? "Reset to the shipped defaults."
      : "Saved. Existing overrides were preserved."
  );
  // The running app caches the config for 60s per instance, so a seed against
  // a live database shows up within a minute without a redeploy.
  console.log("Live within ~60s (the app's SEO cache TTL).");
}

await mongoose.disconnect();

/** One-line preview of a value, whatever its shape. */
function summarise(value: unknown): string {
  if (Array.isArray(value)) return `${value.length} item(s)`;
  if (value && typeof value === "object") return `${Object.keys(value).length} field(s)`;
  const text = String(value);
  return text.length > 48 ? `${text.slice(0, 45)}…` : text;
}
