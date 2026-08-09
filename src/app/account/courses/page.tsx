import Link from "next/link";
import { GraduationCap, Clock, CalendarDays, Users } from "lucide-react";
import { getAccountUser } from "@/lib/account";
import Course from "@/models/Course";
import "@/models/Instructor"; // register the ref before populate()
import { Button } from "@/components/ui/button";

interface LeanInstructor {
  name?: string;
  title?: string;
}

export default async function AccountCoursesPage() {
  const account = await getAccountUser();
  if (!account) return null;

  const ids = account.enrolledCourses ?? [];
  const courses =
    ids.length === 0
      ? []
      : await Course.find({ _id: { $in: ids } })
          .select("title description ageRange level duration schedule instructors")
          .populate("instructors", "name title")
          .lean();

  if (courses.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-100 bg-white p-12 text-center">
        <GraduationCap className="mx-auto mb-4 h-10 w-10 text-slate-300" />
        <h2 className="mb-2 font-semibold" style={{ color: "var(--brand-navy)" }}>
          You&apos;re not enrolled yet
        </h2>
        <p className="mb-6 text-sm text-slate-400">
          Courses appear here once your payment is confirmed.
        </p>
        <Link href="/#courses">
          <Button className="btn-brand-copper rounded-full px-8 text-white">
            Browse courses
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {courses.map((c) => {
        const instructors = (c.instructors ?? []) as unknown as LeanInstructor[];
        return (
          <article key={String(c._id)} className="rounded-2xl border border-slate-100 bg-white p-6">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <h2 className="font-semibold" style={{ color: "var(--brand-navy)" }}>
                {c.title}
              </h2>
              <span className="rounded-full border border-green-200 bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-700">
                Enrolled
              </span>
            </div>

            {c.description && (
              <p className="mb-4 text-sm leading-relaxed text-slate-500">{c.description}</p>
            )}

            <dl className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-500">
              {c.duration && (
                <div className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4 text-slate-300" />
                  {c.duration}
                </div>
              )}
              {c.schedule && (
                <div className="flex items-center gap-1.5">
                  <CalendarDays className="h-4 w-4 text-slate-300" />
                  {c.schedule}
                </div>
              )}
              {c.ageRange && (
                <div className="flex items-center gap-1.5">
                  <Users className="h-4 w-4 text-slate-300" />
                  Ages {c.ageRange}
                </div>
              )}
            </dl>

            {instructors.length > 0 && (
              <p className="mt-4 border-t border-slate-50 pt-4 text-sm text-slate-400">
                Taught by{" "}
                <span className="text-slate-600">
                  {instructors.map((i) => i.name).filter(Boolean).join(", ")}
                </span>
              </p>
            )}
          </article>
        );
      })}
    </div>
  );
}
