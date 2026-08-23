import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { connectDB } from "@/lib/mongodb";
import { requireCapability } from "@/lib/auth";
import User from "@/models/User";
import { z } from "zod";
import { parseBody } from "@/lib/validate";
import { ADMIN_STATS_TAG } from "@/lib/dashboard-stats";

const UserUpdateSchema = z.object({
  name:             z.string().trim().min(1).max(120).optional(),
  phone:            z.string().trim().max(40).optional(),
  age:              z.number().int().min(0).max(120).optional(),
  parentName:       z.string().trim().max(120).optional(),
  city:             z.string().trim().max(120).optional(),
  interestedCourse: z.string().trim().max(200).optional(),
  status:           z.enum(["active", "inactive"]).optional(),
}).strict();
import { logActivity } from "@/lib/activity-log";

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireCapability("dashboard:read");
  if (session instanceof NextResponse) return session;

  await connectDB();
  const { id } = await params;
  const user = await User.findOne({ _id: id, role: "user" }).select("-password").lean();
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(user);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireCapability("users:manage");
  if (session instanceof NextResponse) return session;

  // The previous allow-list filtered which *keys* were accepted but not their
  // values, so `age: "abc"` or `status: "anything"` went straight to Mongo.
  const parsed = await parseBody(req, UserUpdateSchema);
  if (parsed instanceof NextResponse) return parsed;

  await connectDB();
  const { id } = await params;

  const user = await User.findOneAndUpdate({ _id: id, role: "user" }, parsed, { new: true }).select("-password").lean();
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });
  revalidateTag(ADMIN_STATS_TAG, { expire: 0 });
  return NextResponse.json(user);
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireCapability("users:manage");
  if (session instanceof NextResponse) return session;

  await connectDB();
  const { id } = await params;
  const user = await User.findOneAndDelete({ _id: id, role: "user" });
  if (user) {
    logActivity(session, "deleted", "user", id, { name: user.name, email: user.email });
    revalidateTag(ADMIN_STATS_TAG, { expire: 0 });
  }
  return NextResponse.json({ success: true });
}
