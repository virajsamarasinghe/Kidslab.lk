import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/mongodb";
import { requireCapability } from "@/lib/auth";
import User from "@/models/User";
import { validatePassword } from "@/lib/password";
import { logActivity } from "@/lib/activity-log";

export async function GET() {
  const session = await requireCapability("dashboard:read");
  if (session instanceof NextResponse) return session;

  await connectDB();
  const user = await User.findById(session.id).select("name email avatar");
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ name: user.name, email: user.email, avatar: user.avatar });
}

export async function PATCH(req: NextRequest) {
  const session = await requireCapability("dashboard:read");
  if (session instanceof NextResponse) return session;

  const body = await req.json();
  const { name, email, currentPassword, newPassword } = body as {
    name?: string; email?: string; currentPassword?: string; newPassword?: string;
  };

  await connectDB();
  const user = await User.findById(session.id);
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (typeof name === "string" && name.trim()) user.name = name.trim();

  if (typeof email === "string" && email.trim() && email.trim().toLowerCase() !== user.email) {
    const nextEmail = email.trim().toLowerCase();
    const existing = await User.findOne({ email: nextEmail, _id: { $ne: user._id } });
    if (existing) {
      return NextResponse.json({ error: "That email is already in use" }, { status: 409 });
    }
    user.email = nextEmail;
  }

  if (newPassword) {
    if (!currentPassword) {
      return NextResponse.json({ error: "Current password is required to set a new password" }, { status: 400 });
    }
    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) {
      return NextResponse.json({ error: "Current password is incorrect" }, { status: 401 });
    }
    const policy = validatePassword(newPassword, [user.email, user.name]);
    if (!policy.valid) {
      return NextResponse.json({ error: policy.error }, { status: 400 });
    }
    user.password = await bcrypt.hash(newPassword, 10);
    // Invalidates every session issued before now, including other devices.
    user.passwordChangedAt = new Date();
    user.mustChangePassword = false;
  }

  await user.save();
  logActivity(session, newPassword ? "changed password" : "updated profile", "admin", session.id);

  return NextResponse.json({ name: user.name, email: user.email, avatar: user.avatar });
}
