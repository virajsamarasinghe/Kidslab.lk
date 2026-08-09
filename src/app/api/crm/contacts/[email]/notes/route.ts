import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { requireCapability } from "@/lib/auth";
import { invalidateUnifiedContacts } from "@/lib/crm";
import Contact from "@/models/Contact";
import { logActivity } from "@/lib/activity-log";

export async function POST(req: NextRequest, { params }: { params: Promise<{ email: string }> }) {
  const session = await requireCapability("content:write");
  if (session instanceof NextResponse) return session;

  await connectDB();
  const { email } = await params;
  const body = await req.json();
  const text = String(body.text ?? "").trim();
  if (!text) return NextResponse.json({ error: "Note text is required" }, { status: 400 });

  const contact = await Contact.findOneAndUpdate(
    { email: decodeURIComponent(email).toLowerCase() },
    {
      $setOnInsert: { source: "manual" },
      $push: { notes: { text, createdAt: new Date() } },
    },
    { upsert: true, new: true }
  ).lean();

  logActivity(session, "added note", "contact", decodeURIComponent(email).toLowerCase());
  invalidateUnifiedContacts();
  return NextResponse.json(contact);
}
