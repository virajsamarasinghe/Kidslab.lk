import { NextResponse } from "next/server";
import { getAccountUser } from "@/lib/account";
import Course from "@/models/Course";
import "@/models/Instructor"; // register the ref before populate()

/** Courses the signed-in visitor is enrolled in, scoped by their session. */
export async function GET() {
  const account = await getAccountUser();
  if (!account) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const ids = account.enrolledCourses ?? [];
  if (ids.length === 0) return NextResponse.json({ courses: [] });

  const courses = await Course.find({ _id: { $in: ids } })
    .select("title description ageRange level duration schedule instructors")
    .populate("instructors", "name title")
    .lean();

  return NextResponse.json({
    courses: courses.map((c) => ({
      _id: String(c._id),
      title: c.title,
      description: c.description ?? "",
      ageRange: c.ageRange ?? "",
      level: c.level,
      duration: c.duration ?? "",
      schedule: c.schedule ?? "",
      instructors: (c.instructors ?? []).map((i) => ({
        name: (i as unknown as { name?: string }).name ?? "",
        title: (i as unknown as { title?: string }).title ?? "",
      })),
    })),
  });
}
