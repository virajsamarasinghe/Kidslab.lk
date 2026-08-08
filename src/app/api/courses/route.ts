import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { requireCapability } from "@/lib/auth";
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

export async function GET() {
  const session = await requireCapability("dashboard:read");
  if (session instanceof NextResponse) return session;

  await connectDB();
  const courses = await Course.find()
    .sort({ createdAt: -1 })
    .limit(500)
    .populate("instructors", "name")
    .lean();
  return NextResponse.json({ courses });
}

export async function POST(req: NextRequest) {
  const session = await requireCapability("content:write");
  if (session instanceof NextResponse) return session;

  await connectDB();
  const body = await req.json();
  const course = await Course.create(pickAllowed(body));
  logActivity(session, "created", "course", String(course._id), { title: course.title });
  return NextResponse.json(course, { status: 201 });
}
