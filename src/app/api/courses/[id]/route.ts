import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { getAdminSession } from "@/lib/auth";
import Course from "@/models/Course";
import "@/models/Instructor";
import { logActivity } from "@/lib/activity-log";

const ALLOWED_FIELDS = [
  "title", "description", "ageRange", "level", "duration", "schedule",
  "price", "instructors", "maxStudents", "enrolledCount", "isActive",
  "badgeText", "ctaLabel", "seminarNote",
] as const;

function pickAllowed(body: Record<string, unknown>) {
  const update: Record<string, unknown> = {};
  for (const key of ALLOWED_FIELDS) if (key in body) update[key] = body[key];
  return update;
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();
  const { id } = await params;
  const body = await req.json();
  const course = await Course.findByIdAndUpdate(id, pickAllowed(body), { new: true })
    .populate("instructors", "name")
    .lean();
  if (!course) return NextResponse.json({ error: "Not found" }, { status: 404 });
  logActivity(session, "updated", "course", id, { title: course.title });
  return NextResponse.json(course);
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();
  const { id } = await params;
  const course = await Course.findByIdAndDelete(id);
  if (course) logActivity(session, "deleted", "course", id, { title: course.title });
  return NextResponse.json({ success: true });
}
