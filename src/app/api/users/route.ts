import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { requireCapability } from "@/lib/auth";
import User from "@/models/User";
import type { QueryFilter } from "mongoose";
import type { IUser } from "@/models/User";
import { escapeRegex } from "@/lib/utils";

export async function GET(req: NextRequest) {
  const session = await requireCapability("dashboard:read");
  if (session instanceof NextResponse) return session;

  await connectDB();
  const search = req.nextUrl.searchParams.get("search") ?? "";
  const page = Math.max(1, Number(req.nextUrl.searchParams.get("page") ?? "1"));
  const limit = Math.min(100, Math.max(1, Number(req.nextUrl.searchParams.get("limit") ?? "20")));

  const query: QueryFilter<IUser> = { role: "user" };
  if (search) {
    const safe = escapeRegex(search);
    query.$or = [
      { name: { $regex: safe, $options: "i" } },
      { email: { $regex: safe, $options: "i" } },
    ];
  }

  const [users, total] = await Promise.all([
    User.find(query).select("-password").sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    User.countDocuments(query),
  ]);

  return NextResponse.json({ users, total });
}
