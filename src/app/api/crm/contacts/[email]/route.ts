import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { getAdminSession } from "@/lib/auth";
import Contact, { PIPELINE_STAGES } from "@/models/Contact";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ email: string }> }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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

  return NextResponse.json(contact);
}
