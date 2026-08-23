/**
 * Materialises the shipped email copy into the database.
 *
 * The app already does this by itself — `seedEmailTemplates()` runs at server
 * start from `src/instrumentation.ts`, and again off the first send if that
 * couldn't reach Mongo. This script exists for the cases that automatic pass
 * can't cover: previewing a change before it happens (`--dry-run`), resetting
 * copy an admin has edited (`--force`), pushing a *changed* default into an
 * install that was seeded before it changed, seeding an environment that isn't
 * taking traffic yet, or running against a database other than the app's own.
 *
 * It shares the merge and the comparison with the runtime, so it writes
 * exactly what the app would: stored values win over defaults slot by slot,
 * and an admin's edits survive. Only absent slots get filled.
 *
 * Usage (from the repo root):
 *   npm run seed:email-templates              # fill in whatever's missing
 *   npm run seed:email-templates -- --dry-run # show what would change, write nothing
 *   npm run seed:email-templates -- --force   # discard edits, reset to the shipped copy
 *
 * Reads MONGODB_URI from .env.local like the app does; point it at another
 * environment by setting MONGODB_URI in front of the command.
 */
import mongoose from "mongoose";
// `@next/env` is CommonJS, so the named export isn't reachable from ESM.
import nextEnv from "@next/env";

import {
  EMAIL_TEMPLATE_DEFAULTS,
  type EmailTemplateContent,
  type EmailTemplateKey,
} from "@/config/email-templates";
import {
  changedEmailTemplateFields,
  mergeEmailTemplates,
  type StoredEmailTemplates,
} from "@/lib/email-templates";

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

// The raw collection rather than the Mongoose model: registering the model
// here would pull the whole app's schema graph into a standalone script for no
// benefit, and the other sections of the doc are none of this script's
// business.
const settings = mongoose.connection.collection("settings");

const doc = await settings.findOne({});
if (!doc) console.log("No settings document yet — one will be created.");

const before: StoredEmailTemplates = doc?.emailTemplates ?? {};
const next = force ? EMAIL_TEMPLATE_DEFAULTS : mergeEmailTemplates(before);

/* The same comparison the app's auto-seed uses, so this script's report can't
   disagree with what the running app would write. Reported per slot rather
   than as a wall of JSON, to make an unexpected overwrite obvious before it's
   committed. */
const changed = changedEmailTemplateFields(before, next);

if (changed.length === 0) {
  console.log("Already up to date — nothing to write.");
} else {
  console.log(`${dryRun ? "Would update" : "Updating"} ${changed.length} slot(s):`);
  for (const path of changed) {
    const [key, slot] = path.split(".") as [EmailTemplateKey, keyof EmailTemplateContent];
    const from = (before ?? {})[key]?.[slot];
    console.log(`  • ${path}: ${from === undefined ? "(unset)" : summarise(from)} -> ${summarise(next[key][slot])}`);
  }
}

if (!dryRun && changed.length > 0) {
  await settings.updateOne(
    doc ? { _id: doc._id } : {},
    { $set: { emailTemplates: next, updatedAt: new Date() }, $setOnInsert: { createdAt: new Date() } },
    { upsert: true }
  );
  console.log(
    force ? "Reset to the shipped copy." : "Saved. Existing edits were preserved."
  );
  // The running app caches settings for 60s per instance, so a seed against a
  // live database shows up within a minute without a redeploy.
  console.log("Live within ~60s (the app's settings cache TTL).");
}

await mongoose.disconnect();

/** One-line preview of a slot's value. */
function summarise(value: string): string {
  if (value === "") return "(blank)";
  const text = value.replace(/\s+/g, " ");
  return text.length > 48 ? `"${text.slice(0, 45)}…"` : `"${text}"`;
}
