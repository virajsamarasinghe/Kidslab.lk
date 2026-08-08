import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { getAdminSession } from "@/lib/auth";
import { ADMIN_STATS_TAG } from "@/lib/dashboard-stats";

/** Lets the dashboard's Refresh button bypass the stats TTL on demand. */
export async function POST() {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // { expire: 0 } drops the entry immediately rather than serving it stale
  // while revalidating — an explicit refresh should return fresh numbers.
  revalidateTag(ADMIN_STATS_TAG, { expire: 0 });
  return NextResponse.json({ ok: true });
}
