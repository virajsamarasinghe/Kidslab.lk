import type { Course } from "@/types/course";

/** Shape Mongoose hands back from .lean() — ObjectIds and Dates, not strings. */
interface LeanCourse {
  _id: unknown;
  title?: string;
  description?: string;
  ageRange?: string;
  level?: Course["level"];
  duration?: string;
  schedule?: string;
  price?: number;
  instructors?: { _id: unknown; name?: string; title?: string }[];
  maxStudents?: number;
  enrolledCount?: number;
  isActive?: boolean;
  badgeText?: string;
  ctaLabel?: string;
  seminarNote?: string;
}

function serialize(c: LeanCourse): Course {
  return {
    _id: String(c._id),
    title: c.title ?? "",
    description: c.description ?? "",
    ageRange: c.ageRange ?? "",
    level: c.level ?? "Beginner",
    duration: c.duration ?? "",
    schedule: c.schedule ?? "",
    price: c.price ?? 0,
    instructors: (c.instructors ?? []).map((i) => ({
      _id: String(i._id),
      name: i.name ?? "",
      title: i.title ?? "",
    })),
    maxStudents: c.maxStudents ?? 0,
    enrolledCount: c.enrolledCount ?? 0,
    isActive: c.isActive ?? true,
    badgeText: c.badgeText ?? "",
    ctaLabel: c.ctaLabel ?? "",
    seminarNote: c.seminarNote ?? "",
  };
}

/**
 * Active courses for the public landing page, fetched on the server so the
 * real course text ends up in the SSR HTML (crawlers and AI answer engines
 * don't run the client-side fetch this replaced).
 *
 * Deliberately never throws: the marketing page must still render — and still
 * emit structured data from the hardcoded defaults — when Mongo is down or
 * MONGODB_URI is unset. `@/lib/mongodb` throws at *module scope* in that case,
 * which is why the import is dynamic and inside the try.
 */
export async function getActiveCourses(): Promise<Course[]> {
  try {
    const { connectDB } = await import("@/lib/mongodb");
    const { default: CourseModel } = await import("@/models/Course");
    await import("@/models/Instructor"); // register the ref before populate()

    await connectDB();
    const docs = await CourseModel.find({ isActive: true })
      .sort({ createdAt: -1 })
      .populate("instructors", "name title")
      .lean<LeanCourse[]>();

    return docs.map(serialize);
  } catch {
    return [];
  }
}
