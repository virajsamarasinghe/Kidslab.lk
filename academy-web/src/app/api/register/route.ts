import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, phone, email, age, parentName, city, interestedCourse } = body;

    if (!name || !phone) {
      return NextResponse.json(
        { error: "Name and phone number are required" },
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

    return NextResponse.json(
      { success: true, message: "Registration successful!" },
      { status: 201 }
    );
  } catch (err) {
    console.error("[register]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
