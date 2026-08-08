import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { getAdminSession } from "@/lib/auth";
import { getUnifiedContacts, invalidateUnifiedContacts } from "@/lib/crm";
import Contact from "@/models/Contact";

export async function GET(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const search = (req.nextUrl.searchParams.get("search") ?? "").trim().toLowerCase();
  const page = Math.max(1, Number(req.nextUrl.searchParams.get("page") ?? "1"));
  const limit = Math.min(100, Math.max(1, Number(req.nextUrl.searchParams.get("limit") ?? "20")));

  const all = await getUnifiedContacts();
  const filtered = search
    ? all.filter(c => c.name.toLowerCase().includes(search) || c.email.toLowerCase().includes(search))
    : all;
  const total = filtered.length;
  const contacts = filtered.slice((page - 1) * limit, page * limit);

  return NextResponse.json({ contacts, total });
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

  invalidateUnifiedContacts();
  return NextResponse.json(contact, { status: 201 });
}
