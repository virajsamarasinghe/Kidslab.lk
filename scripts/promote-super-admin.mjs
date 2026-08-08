/**
 * One-off migration for the tiered-admin-roles change.
 *
 * Before that change every dashboard account had `role: "admin"`. Afterwards,
 * managing admins requires `super_admin` — so an existing install has nobody
 * who can open Settings -> Administrators until one account is promoted.
 *
 * Usage (from the repo root):
 *   node scripts/promote-super-admin.mjs                 # promote the oldest admin
 *   node scripts/promote-super-admin.mjs you@kidslab.lk  # promote a specific one
 *
 * Safe to re-run: it exits early once a super admin exists.
 */
import mongoose from "mongoose";
// `@next/env` is CommonJS, so the named export isn't reachable from ESM.
import nextEnv from "@next/env";

nextEnv.loadEnvConfig(process.cwd());

const { MONGODB_URI } = process.env;
if (!MONGODB_URI) {
  console.error("MONGODB_URI is not set — check .env.local");
  process.exit(1);
}

const targetEmail = process.argv[2]?.trim().toLowerCase();

await mongoose.connect(MONGODB_URI);
const users = mongoose.connection.collection("users");

const existingSuper = await users.findOne({ role: "super_admin" });
if (existingSuper && !targetEmail) {
  console.log(`Nothing to do — ${existingSuper.email} is already a super admin.`);
  await mongoose.disconnect();
  process.exit(0);
}

const target = targetEmail
  ? await users.findOne({ email: targetEmail })
  : await users.find({ role: "admin" }).sort({ createdAt: 1 }).limit(1).next();

if (!target) {
  console.error(
    targetEmail ? `No account found for ${targetEmail}` : "No account with role 'admin' found"
  );
  await mongoose.disconnect();
  process.exit(1);
}

await users.updateOne(
  { _id: target._id },
  { $set: { role: "super_admin", status: "active" } }
);
console.log(`Promoted ${target.email} to super_admin.`);

await mongoose.disconnect();
