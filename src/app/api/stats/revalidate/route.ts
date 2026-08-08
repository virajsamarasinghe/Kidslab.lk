import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { requireCapability } from "@/lib/auth";
import { ADMIN_STATS_TAG } from "@/lib/dashboard-stats";

/** Lets the dashboard's Refresh button bypass the stats TTL on demand. */
export async function POST() {
  const session = await requireCapability("content:write");
  if (session instanceof NextResponse) return session;

  // { expire: 0 } drops the entry immediately rather than serving it stale
  // while revalidating — an explicit refresh should return fresh numbers.
  revalidateTag(ADMIN_STATS_TAG, { expire: 0 });
  return NextResponse.json({ ok: true });
}
