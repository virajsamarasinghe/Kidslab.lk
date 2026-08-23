import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { revalidateTag } from "next/cache";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import { sendWelcomeEmail } from "@/lib/brevo";
import { enforceRateLimit, clientIp } from "@/lib/rate-limit";
import { ADMIN_STATS_TAG } from "@/lib/dashboard-stats";

export async function POST(req: NextRequest) {
  try {
    const limited = await enforceRateLimit("register", clientIp(req), 10, 60 * 60);
    if (limited) return limited;

    const body = await req.json();
    const { name, phone, email, age, parentName, city, interestedCourse } = body;

    if (!name || !phone || !city?.trim()) {
      return NextResponse.json(
        { error: "Name, phone number and city are required" },
        { status: 400 }
      );
    }

    await connectDB();

    // Duplicate phone check
    const existsByPhone = await User.findOne({ phone: phone.trim() });
    if (existsByPhone) {
      return NextResponse.json(
        { error: "This phone number is already registered" },
        { status: 409 }
      );
    }

    // Normalise email — fall back to a unique placeholder so the unique index is satisfied
    const resolvedEmail = email?.trim()
      ? email.trim().toLowerCase()
      : `${phone.replace(/\s+/g, "")}@kidslab.lk`;

    const existsByEmail = await User.findOne({ email: resolvedEmail });
    if (existsByEmail) {
      return NextResponse.json(
        { error: "This email address is already registered" },
        { status: 409 }
      );
    }

    // Auto-generate a password — public seminar registration doesn't require login
    const autoPassword =
      Math.random().toString(36).slice(-8) +
      Math.random().toString(36).slice(-6).toUpperCase() +
      "!";
    const hashed = await bcrypt.hash(autoPassword, 10);

    await User.create({
      name: name.trim(),
      email: resolvedEmail,
      password: hashed,
      phone: phone.trim(),
      age: age ? Number(age) : 0,
      parentName: parentName?.trim() ?? "",
      city: city?.trim() ?? "",
      interestedCourse: interestedCourse ?? "Robotics & AI",
    });

    // So the admin dashboard's cached counts/map reflect this registration
    // immediately instead of waiting out the stats cache TTL.
    revalidateTag(ADMIN_STATS_TAG, { expire: 0 });

    // Only send a welcome email when the user provided a real address
    if (email?.trim()) {
      sendWelcomeEmail({
        name: name.trim(),
        email: resolvedEmail,
        phone: phone.trim(),
        interestedCourse: interestedCourse ?? "Robotics & AI",
      }).catch((err) => console.error("[register] failed to send welcome email", err));
    }

    return NextResponse.json(
      { success: true, message: "Registration successful!" },
      { status: 201 }
    );
  } catch (err) {
    console.error("[register]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
