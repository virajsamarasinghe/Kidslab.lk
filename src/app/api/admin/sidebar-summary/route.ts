import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { getAdminSession } from "@/lib/auth";
import { getUnifiedContacts } from "@/lib/crm";
import User from "@/models/User";
import Subscriber from "@/models/Subscriber";

export async function GET() {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();

  const [users, subscribers, contacts] = await Promise.all([
    User.countDocuments({ role: "user" }),
    Subscriber.countDocuments(),
    getUnifiedContacts(),
  ]);

  const leads = contacts.filter(c => c.stage === "lead").length;

  return NextResponse.json({ users, subscribers, leads });
}
