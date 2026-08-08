import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { getDashboardStats } from "@/lib/dashboard-stats";

/**
 * The dashboard renders these stats on the server now, so this endpoint exists
 * for programmatic/JSON consumers only. It shares the same cached computation
 * from `@/lib/dashboard-stats`, so hitting it is never extra database work.
 */
export async function GET() {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const stats = await getDashboardStats();
  return NextResponse.json(stats, {
    headers: { "Cache-Control": "private, max-age=30" },
  });
}
