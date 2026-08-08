import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { getAdminSession } from "@/lib/auth";
import { getUnifiedContacts } from "@/lib/crm";
import Contact from "@/models/Contact";

export async function GET() {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const contacts = await getUnifiedContacts();
  return NextResponse.json({ contacts });
}

export async function POST(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();
  const body = await req.json();
  if (!body.email) return NextResponse.json({ error: "Email is required" }, { status: 400 });

  const contact = await Contact.findOneAndUpdate(
    { email: String(body.email).toLowerCase() },
    {
      $setOnInsert: { source: "manual" },
      $set: {
        name: body.name ?? "",
        phone: body.phone ?? "",
        stage: body.stage ?? "lead",
      },
    },
    { upsert: true, new: true }
  ).lean();

  return NextResponse.json(contact, { status: 201 });
}
