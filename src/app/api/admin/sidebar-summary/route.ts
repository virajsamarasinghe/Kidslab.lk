import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { getAdminSession } from "@/lib/auth";
import { getLeadCountSince } from "@/lib/crm";
import User from "@/models/User";
import Subscriber from "@/models/Subscriber";

function sinceMs(param: string | null) {
  const ms = Number(param);
  return Number.isFinite(ms) && ms > 0 ? ms : 0;
}

export async function GET(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();

  const usersSince = sinceMs(req.nextUrl.searchParams.get("users"));
  const subscribersSince = sinceMs(req.nextUrl.searchParams.get("subscribers"));
  const leadsSince = sinceMs(req.nextUrl.searchParams.get("leads"));

  const [users, subscribers, leads] = await Promise.all([
    User.countDocuments({ role: "user", createdAt: { $gt: new Date(usersSince) } }),
    Subscriber.countDocuments({ createdAt: { $gt: new Date(subscribersSince) } }),
    // Rounded to the minute so the badge poll reuses one cache entry instead of
    // minting a new one on every request with a slightly different timestamp.
    getLeadCountSince(Math.floor(leadsSince / 60_000) * 60_000),
  ]);

  return NextResponse.json(
    { users, subscribers, leads },
    { headers: { "Cache-Control": "private, max-age=30" } }
  );
}
