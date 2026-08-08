import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { requireCapability } from "@/lib/auth";
import Instructor from "@/models/Instructor";
import { logActivity } from "@/lib/activity-log";

const ALLOWED_FIELDS = ["name", "title", "bio", "photo", "email"] as const;

function pickAllowed(body: Record<string, unknown>) {
  const update: Record<string, unknown> = {};
  for (const key of ALLOWED_FIELDS) if (key in body) update[key] = body[key];
  return update;
}

export async function GET() {
  const session = await requireCapability("dashboard:read");
  if (session instanceof NextResponse) return session;

  await connectDB();
  const instructors = await Instructor.find().sort({ name: 1 }).limit(500).lean();
  return NextResponse.json({ instructors });
}

export async function POST(req: NextRequest) {
  const session = await requireCapability("content:write");
  if (session instanceof NextResponse) return session;

  await connectDB();
  const body = await req.json();
  const instructor = await Instructor.create(pickAllowed(body));
  logActivity(session, "created", "instructor", String(instructor._id), { name: instructor.name });
  return NextResponse.json(instructor, { status: 201 });
}
