import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { requireCapability } from "@/lib/auth";
import Subscriber from "@/models/Subscriber";
import { logActivity } from "@/lib/activity-log";

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireCapability("content:write");
  if (session instanceof NextResponse) return session;

  await connectDB();
  const { id } = await params;
  const removed = await Subscriber.findByIdAndDelete(id);
  if (removed) logActivity(session, "deleted", "subscriber", id, { email: removed.email });
  return NextResponse.json({ success: true });
}
