import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { requireCapability } from "@/lib/auth";
import ActivityLog from "@/models/ActivityLog";

export async function GET(req: NextRequest) {
  const session = await requireCapability("dashboard:read");
  if (session instanceof NextResponse) return session;

  await connectDB();
  const page = Math.max(1, Number(req.nextUrl.searchParams.get("page") ?? "1"));
  const limit = Math.min(100, Math.max(1, Number(req.nextUrl.searchParams.get("limit") ?? "30")));

  const [entries, total] = await Promise.all([
    ActivityLog.find().sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    ActivityLog.countDocuments(),
  ]);

  return NextResponse.json({ entries, total });
}
