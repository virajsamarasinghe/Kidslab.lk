import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { requireCapability } from "@/lib/auth";
import Instructor from "@/models/Instructor";
import Course from "@/models/Course";
import { logActivity } from "@/lib/activity-log";

const ALLOWED_FIELDS = ["name", "title", "bio", "photo", "email"] as const;

function pickAllowed(body: Record<string, unknown>) {
  const update: Record<string, unknown> = {};
  for (const key of ALLOWED_FIELDS) if (key in body) update[key] = body[key];
  return update;
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireCapability("content:write");
  if (session instanceof NextResponse) return session;

  await connectDB();
  const { id } = await params;
  const body = await req.json();
  const instructor = await Instructor.findByIdAndUpdate(id, pickAllowed(body), { new: true }).lean();
  if (!instructor) return NextResponse.json({ error: "Not found" }, { status: 404 });
  logActivity(session, "updated", "instructor", id, { name: instructor.name });
  return NextResponse.json(instructor);
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireCapability("content:write");
  if (session instanceof NextResponse) return session;

  await connectDB();
  const { id } = await params;
  const instructor = await Instructor.findByIdAndDelete(id);
  await Course.updateMany({ instructors: id }, { $pull: { instructors: id } });
  if (instructor) logActivity(session, "deleted", "instructor", id, { name: instructor.name });
  return NextResponse.json({ success: true });
}
