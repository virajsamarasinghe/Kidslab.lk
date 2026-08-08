import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { requireCapability } from "@/lib/auth";
import { invalidateUnifiedContacts } from "@/lib/crm";
import { logActivity } from "@/lib/activity-log";
import Contact, { PIPELINE_STAGES } from "@/models/Contact";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ email: string }> }) {
  const session = await requireCapability("content:write");
  if (session instanceof NextResponse) return session;

  await connectDB();
  const { email } = await params;
  const body = await req.json();

  const update: Record<string, unknown> = {};
  if (body.stage && PIPELINE_STAGES.includes(body.stage)) update.stage = body.stage;
  if (Array.isArray(body.tags)) update.tags = body.tags;
  if (typeof body.name === "string") update.name = body.name;
  if (typeof body.phone === "string") update.phone = body.phone;

  const contact = await Contact.findOneAndUpdate(
    { email: decodeURIComponent(email).toLowerCase() },
    { $setOnInsert: { source: "manual" }, $set: update },
    { upsert: true, new: true }
  ).lean();

  invalidateUnifiedContacts();
  if (update.stage) logActivity(session, "moved-stage", "contact", contact.email, { stage: update.stage });
  return NextResponse.json(contact);
}
