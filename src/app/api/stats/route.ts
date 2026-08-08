import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { getAdminSession } from "@/lib/auth";
import User from "@/models/User";
import Course from "@/models/Course";
import Subscriber from "@/models/Subscriber";
import Instructor from "@/models/Instructor";
import Contact, { PIPELINE_STAGES } from "@/models/Contact";
import Campaign from "@/models/Campaign";

const DAY_MS = 24 * 60 * 60 * 1000;
const TREND_DAYS = 14;

export async function GET() {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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
      { $limit: 5 },
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

  return NextResponse.json({
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
    topCities: topCitiesRaw.map((c: { _id: string; count: number }) => ({ city: c._id, count: c.count })),
    topCourses: topCoursesRaw.map((c: { _id: string; count: number }) => ({ course: c._id, count: c.count })),
    totalInstructors,
    totalContacts,
    pipeline,
    totalCampaigns,
    campaignsSent,
    recentCampaigns,
  });
}
