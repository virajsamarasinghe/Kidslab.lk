import { cache } from "react";
import { unstable_cache } from "next/cache";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import Course from "@/models/Course";
import Subscriber from "@/models/Subscriber";
import Instructor from "@/models/Instructor";
import Contact, { PIPELINE_STAGES } from "@/models/Contact";
import Campaign from "@/models/Campaign";
import { resolveCity, districtName } from "@/lib/sri-lanka-locations";
import type { PipelineStage } from "@/types/crm";
import type { MapDistrict, MapCity } from "@/types/dashboard";

export const ADMIN_STATS_TAG = "admin-stats";

const DAY_MS = 24 * 60 * 60 * 1000;
const TREND_DAYS = 14;

/** Counts, recent rows and the signup trend — all index-backed, so this tier is cheap. */
export interface CoreStats {
  totalUsers: number;
  totalCourses: number;
  activeCourses: number;
  totalSubscribers: number;
  activeUsers: number;
  inactiveUsers: number;
  usersThisWeek: number;
  weeklyGrowth: number;
  totalInstructors: number;
  totalContacts: number;
  totalCampaigns: number;
  campaignsSent: number;
  pipeline: Array<{ stage: PipelineStage; count: number }>;
  signupTrend: Array<{ date: string; signups: number }>;
  recentUsers: Array<{
    _id: string;
    name: string;
    email: string;
    city: string;
    interestedCourse: string;
    createdAt: string;
  }>;
  recentCampaigns: Array<{
    _id: string;
    subject: string;
    segment: string;
    status: "draft" | "sending" | "sent" | "partial" | "failed";
    recipientCount: number;
    sentCount: number;
    createdAt: string;
  }>;
}

/** City/course group-bys plus the Sri Lanka geo resolution — the expensive tier. */
export interface GeoStats {
  topCities: Array<{ city: string; count: number }>;
  topCourses: Array<{ course: string; count: number }>;
  mapDistricts: MapDistrict[];
  mapCities: MapCity[];
  unmatchedCities: number;
  unmatchedCityList: Array<{ city: string; count: number }>;
}

export type DashboardStats = CoreStats & GeoStats;

async function computeCoreStats(): Promise<CoreStats> {
  await connectDB();

  const now = new Date();
  const trendStart = new Date(now.getTime() - (TREND_DAYS - 1) * DAY_MS);
  trendStart.setHours(0, 0, 0, 0);
  const weekAgo = new Date(now.getTime() - 7 * DAY_MS);
  const twoWeeksAgo = new Date(now.getTime() - 14 * DAY_MS);

  const [
    usersByStatus,
    totalCourses,
    activeCourses,
    totalSubscribers,
    recentUsers,
    signupsByDay,
    usersThisWeek,
    usersLastWeek,
    totalInstructors,
    pipelineByStageRaw,
    campaignsByStatus,
    recentCampaigns,
  ] = await Promise.all([
    // One grouped pass instead of three separate counts — covered by the
    // { role, status } index.
    User.aggregate([
      { $match: { role: "user" } },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]),
    Course.estimatedDocumentCount(),
    Course.countDocuments({ isActive: true }),
    Subscriber.estimatedDocumentCount(),
    User.find({ role: "user" })
      .select("name email city interestedCourse createdAt")
      .sort({ createdAt: -1 })
      .limit(5)
      .lean(),
    User.aggregate([
      { $match: { role: "user", createdAt: { $gte: trendStart } } },
      { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, count: { $sum: 1 } } },
    ]),
    User.countDocuments({ role: "user", createdAt: { $gte: weekAgo } }),
    User.countDocuments({ role: "user", createdAt: { $gte: twoWeeksAgo, $lt: weekAgo } }),
    Instructor.estimatedDocumentCount(),
    Contact.aggregate([{ $group: { _id: "$stage", count: { $sum: 1 } } }]),
    Campaign.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
    Campaign.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select("subject segment status recipientCount sentCount createdAt")
      .lean(),
  ]);

  const userStatusCounts = new Map(
    (usersByStatus as { _id: string; count: number }[]).map(s => [s._id, s.count])
  );
  const activeUsers = userStatusCounts.get("active") ?? 0;
  const inactiveUsers = userStatusCounts.get("inactive") ?? 0;
  const totalUsers = Array.from(userStatusCounts.values()).reduce((sum, n) => sum + n, 0);

  const campaignStatusCounts = new Map(
    (campaignsByStatus as { _id: string; count: number }[]).map(s => [s._id, s.count])
  );
  const campaignsSent = campaignStatusCounts.get("sent") ?? 0;
  const totalCampaigns = Array.from(campaignStatusCounts.values()).reduce((sum, n) => sum + n, 0);

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
  // Derived from the same grouped pass, so the tile and the funnel can never
  // disagree — and it saves a redundant count query.
  const totalContacts = pipeline.reduce((sum, p) => sum + p.count, 0);

  return {
    totalUsers,
    totalCourses,
    activeCourses,
    totalSubscribers,
    activeUsers,
    inactiveUsers,
    usersThisWeek,
    weeklyGrowth,
    totalInstructors,
    totalContacts,
    totalCampaigns,
    campaignsSent,
    pipeline,
    signupTrend,
    recentUsers: JSON.parse(JSON.stringify(recentUsers)),
    recentCampaigns: JSON.parse(JSON.stringify(recentCampaigns)),
  };
}

async function computeGeoStats(): Promise<GeoStats> {
  await connectDB();

  const [cityCounts, topCoursesRaw] = await Promise.all([
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
  ]);

  // Resolve free-text city entries against the Sri Lanka district/town
  // lookup so registrations can be plotted on the map. Unresolved spellings
  // are counted separately rather than guessed at.
  const districtCounts = new Map<string, number>();
  const cityPoints = new Map<string, MapCity>();
  let unmatchedCities = 0;
  const unmatchedCityList: { city: string; count: number }[] = [];
  for (const c of cityCounts as { _id: string; count: number }[]) {
    const match = resolveCity(c._id);
    if (!match) {
      unmatchedCities += c.count;
      unmatchedCityList.push({ city: c._id, count: c.count });
      continue;
    }
    districtCounts.set(match.district, (districtCounts.get(match.district) ?? 0) + c.count);
    const existing = cityPoints.get(match.label);
    if (existing) existing.count += c.count;
    else cityPoints.set(match.label, { name: match.label, lat: match.lat, lon: match.lon, count: c.count });
  }

  return {
    topCities: cityCounts.slice(0, 5).map((c: { _id: string; count: number }) => ({ city: c._id, count: c.count })),
    topCourses: topCoursesRaw.map((c: { _id: string; count: number }) => ({ course: c._id, count: c.count })),
    mapDistricts: Array.from(districtCounts.entries()).map(([key, count]) => ({
      "hc-key": key,
      name: districtName(key),
      value: count,
    })),
    mapCities: Array.from(cityPoints.values()).sort((a, b) => b.count - a.count),
    unmatchedCities,
    unmatchedCityList: unmatchedCityList.slice(0, 10),
  };
}

/**
 * Both tiers are identical for every admin viewing the dashboard in the same
 * window, so they're cached rather than recomputed per page load. They're split
 * so the page can stream the cheap counts immediately and let the slower geo
 * aggregation arrive a beat later, instead of blocking the whole dashboard on
 * the slowest query.
 *
 * The extra `cache()` wrapper is request-level memoization: the dashboard page
 * renders several independently-streamed sections that each need the core
 * stats, and this collapses them into a single lookup per request.
 */
export const getCoreStats = cache(
  unstable_cache(computeCoreStats, ["admin-core-stats"], {
    revalidate: 60,
    tags: [ADMIN_STATS_TAG],
  })
);

export const getGeoStats = cache(
  unstable_cache(computeGeoStats, ["admin-geo-stats"], {
    revalidate: 300,
    tags: [ADMIN_STATS_TAG],
  })
);

export async function getDashboardStats(): Promise<DashboardStats> {
  const [core, geo] = await Promise.all([getCoreStats(), getGeoStats()]);
  return { ...core, ...geo };
}
