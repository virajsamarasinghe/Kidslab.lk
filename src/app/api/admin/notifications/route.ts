import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { requireCapability } from "@/lib/auth";
import { getLeadCountSince } from "@/lib/crm";
import User from "@/models/User";
import Subscriber from "@/models/Subscriber";

export const SUMMARY_KEYS = ["users", "subscribers", "leads"] as const;
type SummaryKey = (typeof SUMMARY_KEYS)[number];

function isSummaryKey(value: unknown): value is SummaryKey {
  return typeof value === "string" && (SUMMARY_KEYS as readonly string[]).includes(value);
}

/**
 * Reads the caller's per-badge "seen up to" checkpoints.
 *
 * A key with no checkpoint yet is initialised to now and persisted, so an
 * admin opening the dashboard for the first time sees a clean tray rather than
 * every historical record counted as new.
 */
async function loadSeen(adminId: string) {
  const admin = await User.findById(adminId).select("notificationsSeen");
  if (!admin) return null;

  const seen = admin.notificationsSeen ?? new Map<string, Date>();
  let changed = false;
  for (const key of SUMMARY_KEYS) {
    if (!seen.get(key)) {
      seen.set(key, new Date());
      changed = true;
    }
  }
  if (changed) {
    admin.notificationsSeen = seen;
    admin.markModified("notificationsSeen");
    await admin.save();
  }
  return seen;
}

async function countsSince(seen: Map<string, Date>) {
  const [users, subscribers, leads] = await Promise.all([
    User.countDocuments({ role: "user", createdAt: { $gt: seen.get("users") } }),
    Subscriber.countDocuments({ createdAt: { $gt: seen.get("subscribers") } }),
    // Rounded to the minute so the poll reuses one cache entry instead of
    // minting a new one on every request with a slightly different timestamp.
    getLeadCountSince(Math.floor((seen.get("leads")?.getTime() ?? 0) / 60_000) * 60_000),
  ]);
  return { users, subscribers, leads };
}

export async function GET() {
  const guard = await requireCapability("dashboard:read");
  if (guard instanceof NextResponse) return guard;

  await connectDB();
  const seen = await loadSeen(guard.id);
  if (!seen) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(await countsSince(seen), {
    headers: { "Cache-Control": "private, no-store" },
  });
}

/**
 * Marks notifications read by moving the checkpoint forward to now — which is
 * also how already-read notifications are discarded, since anything at or
 * before the checkpoint stops being counted and can never reappear.
 *
 * Body: `{ keys: ["users"] }` for one badge, or `{}` / omitted to clear all.
 */
export async function POST(req: NextRequest) {
  const guard = await requireCapability("dashboard:read");
  if (guard instanceof NextResponse) return guard;

  const body = await req.json().catch(() => ({}));
  const requested: unknown = body?.keys;
  const keys: readonly SummaryKey[] = Array.isArray(requested)
    ? requested.filter(isSummaryKey)
    : SUMMARY_KEYS;

  await connectDB();
  const admin = await User.findById(guard.id).select("notificationsSeen");
  if (!admin) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const seen = admin.notificationsSeen ?? new Map<string, Date>();
  const now = new Date();
  for (const key of keys) seen.set(key, now);
  // Backfill any key not in this request so `countsSince` always has a bound.
  for (const key of SUMMARY_KEYS) if (!seen.get(key)) seen.set(key, now);

  admin.notificationsSeen = seen;
  admin.markModified("notificationsSeen");
  await admin.save();

  return NextResponse.json(await countsSince(seen), {
    headers: { "Cache-Control": "private, no-store" },
  });
}
