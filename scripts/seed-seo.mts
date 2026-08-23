/**
 * Materialises the shipped SEO/AEO defaults into the database.
 *
 * The app already does this by itself — `getSeoConfig()` seeds off the read it
 * performs anyway, on the first request after a deploy (see `autoSeed` in
 * `@/lib/seo`). This script exists for the cases that automatic pass can't
 * cover: previewing a change before it happens (`--dry-run`), resetting a
 * config an admin has edited (`--force`), seeding an environment that isn't
 * taking traffic yet, or running against a database other than the app's own.
 *
 * It shares the merge and the comparison with the runtime, so it writes
 * exactly what the site would: stored values win over defaults field by field,
 * and an admin's edits survive. Only absent or blank fields get filled.
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
import { changedSeoFields, mergeSeo } from "@/lib/seo";

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

/* The same comparison the app's auto-seed uses, so this script's report can't
   disagree with what the running site would write. Reported per top-level
   field rather than as a wall of JSON, to make an unexpected overwrite
   obvious before it's committed. */
const changed = changedSeoFields(before, next);

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
