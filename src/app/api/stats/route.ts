import { NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { connectDB } from "@/lib/mongodb";
import { getAdminSession } from "@/lib/auth";
import User from "@/models/User";
import Course from "@/models/Course";
import Subscriber from "@/models/Subscriber";
import Instructor from "@/models/Instructor";
import Contact, { PIPELINE_STAGES } from "@/models/Contact";
import Campaign from "@/models/Campaign";
import { resolveCity, districtName } from "@/lib/sri-lanka-locations";

const DAY_MS = 24 * 60 * 60 * 1000;
const TREND_DAYS = 14;

export async function GET() {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const stats = await getCachedStats();
  return NextResponse.json(stats);
}

/**
 * The dashboard's 17-query aggregation is identical for every admin viewing
 * it within the same window, so it's cached for a short TTL instead of
 * re-running on every page load.
 */
const getCachedStats = unstable_cache(computeStats, ["admin-stats"], {
  revalidate: 60,
  tags: ["admin-stats"],
});

async function computeStats() {
  await connectDB();

  const now = new Date();
  const trendStart = new Date(now.getTime() - (TREND_DAYS - 1) * DAY_MS);
  trendStart.setHours(0, 0, 0, 0);
  const weekAgo = new Date(now.getTime() - 7 * DAY_MS);
  const twoWeeksAgo = new Date(now.getTime() - 14 * DAY_MS);

  const [
    totalUsers,
    totalCourses,
    activeCourses,
    totalSubscribers,
    activeUsers,
    inactiveUsers,
    recentUsers,
    signupsByDay,
    topCitiesRaw,
    topCoursesRaw,
    usersThisWeek,
    usersLastWeek,
    totalInstructors,
    totalContacts,
    pipelineByStageRaw,
    totalCampaigns,
    campaignsSent,
    recentCampaigns,
  ] = await Promise.all([
    User.countDocuments({ role: "user" }),
    Course.countDocuments(),
    Course.countDocuments({ isActive: true }),
    Subscriber.countDocuments(),
    User.countDocuments({ role: "user", status: "active" }),
    User.countDocuments({ role: "user", status: "inactive" }),
    User.find({ role: "user" }).select("-password").sort({ createdAt: -1 }).limit(5).lean(),
    User.aggregate([
      { $match: { role: "user", createdAt: { $gte: trendStart } } },
      { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, count: { $sum: 1 } } },
    ]),
    User.aggregate([
      { $match: { role: "user", city: { $nin: [null, ""] } } },
      { $group: { _id: "$city", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
    User.aggregate([
      { $match: { role: "user", interestedCourse: { $nin: [null, ""] } } },
      { $group: { _id: "$interestedCourse", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ]),
    User.countDocuments({ role: "user", createdAt: { $gte: weekAgo } }),
    User.countDocuments({ role: "user", createdAt: { $gte: twoWeeksAgo, $lt: weekAgo } }),
    Instructor.countDocuments(),
    Contact.countDocuments(),
    Contact.aggregate([
      { $group: { _id: "$stage", count: { $sum: 1 } } },
    ]),
    Campaign.countDocuments(),
    Campaign.countDocuments({ status: "sent" }),
    Campaign.find().sort({ createdAt: -1 }).limit(5).select("subject segment status recipientCount sentCount createdAt").lean(),
  ]);

  // Fill every day in the trend window, including days with zero signups
  const countsByDate = new Map(signupsByDay.map((d: { _id: string; count: number }) => [d._id, d.count]));
  const signupTrend = Array.from({ length: TREND_DAYS }, (_, i) => {
    const date = new Date(trendStart.getTime() + i * DAY_MS);
    const key = date.toISOString().slice(0, 10);
    return {
      date: date.toLocaleDateString("en-GB", { day: "2-digit", month: "short" }),
      signups: countsByDate.get(key) ?? 0,
    };
  });

  const weeklyGrowth =
    usersLastWeek === 0
      ? usersThisWeek > 0
        ? 100
        : 0
      : Math.round(((usersThisWeek - usersLastWeek) / usersLastWeek) * 100);

  const countsByStage = new Map(pipelineByStageRaw.map((s: { _id: string; count: number }) => [s._id, s.count]));
  const pipeline = PIPELINE_STAGES.map(stage => ({ stage, count: countsByStage.get(stage) ?? 0 }));

  // Resolve free-text city entries against the Sri Lanka district/town
  // lookup so registrations can be plotted on the map. Unresolved spellings
  // are counted separately rather than guessed at.
  const districtCounts = new Map<string, number>();
  const cityPoints = new Map<string, { name: string; lat: number; lon: number; count: number }>();
  let unmatchedCities = 0;
  for (const c of topCitiesRaw as { _id: string; count: number }[]) {
    const match = resolveCity(c._id);
    if (!match) {
      unmatchedCities += c.count;
      continue;
    }
    districtCounts.set(match.district, (districtCounts.get(match.district) ?? 0) + c.count);
    const existing = cityPoints.get(match.label);
    if (existing) existing.count += c.count;
    else cityPoints.set(match.label, { name: match.label, lat: match.lat, lon: match.lon, count: c.count });
  }
  const mapDistricts = Array.from(districtCounts.entries()).map(([key, count]) => ({
    "hc-key": key,
    name: districtName(key),
    value: count,
  }));
  const mapCities = Array.from(cityPoints.values()).sort((a, b) => b.count - a.count);

  return {
    totalUsers,
    totalCourses,
    activeCourses,
    totalSubscribers,
    activeUsers,
    inactiveUsers,
    usersThisWeek,
    weeklyGrowth,
    recentUsers,
    signupTrend,
    topCities: topCitiesRaw.slice(0, 5).map((c: { _id: string; count: number }) => ({ city: c._id, count: c.count })),
    mapDistricts,
    mapCities,
    unmatchedCities,
    topCourses: topCoursesRaw.map((c: { _id: string; count: number }) => ({ course: c._id, count: c.count })),
    totalInstructors,
    totalContacts,
    pipeline,
    totalCampaigns,
    campaignsSent,
    recentCampaigns,
  };
}
