import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { getAdminSession } from "@/lib/auth";
import Contact from "@/models/Contact";

export async function POST(req: NextRequest, { params }: { params: Promise<{ email: string }> }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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

  return NextResponse.json(contact);
}
