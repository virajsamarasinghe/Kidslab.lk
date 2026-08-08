import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { getAdminSession } from "@/lib/auth";
import { getUnifiedContacts } from "@/lib/crm";
import User from "@/models/User";
import Subscriber from "@/models/Subscriber";

function sinceDate(param: string | null) {
  const ms = Number(param);
  return Number.isFinite(ms) && ms > 0 ? new Date(ms) : new Date(0);
}

export async function GET(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();

  const usersSince = sinceDate(req.nextUrl.searchParams.get("users"));
  const subscribersSince = sinceDate(req.nextUrl.searchParams.get("subscribers"));
  const leadsSince = sinceDate(req.nextUrl.searchParams.get("leads"));

  const [users, subscribers, contacts] = await Promise.all([
    User.countDocuments({ role: "user", createdAt: { $gt: usersSince } }),
    Subscriber.countDocuments({ createdAt: { $gt: subscribersSince } }),
    getUnifiedContacts(),
  ]);

  const leads = contacts.filter(
    c => c.stage === "lead" && new Date(c.createdAt) > leadsSince
  ).length;

  return NextResponse.json({ users, subscribers, leads });
}
