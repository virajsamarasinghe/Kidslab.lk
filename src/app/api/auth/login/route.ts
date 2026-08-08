import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/mongodb";
import { signToken, COOKIE } from "@/lib/auth";
import User from "@/models/User";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    await connectDB();

    // Seed admin if none exists
    const adminExists = await User.findOne({ role: "admin" });
    if (!adminExists) {
      const hashed = await bcrypt.hash(process.env.ADMIN_PASSWORD!, 10);
      await User.create({
        name: "Admin",
        email: process.env.ADMIN_EMAIL!,
        password: hashed,
        role: "admin",
        status: "active",
      });
    }

    const user = await User.findOne({ email: email.toLowerCase(), role: "admin" });
    if (!user) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const token = await signToken({ id: user._id.toString(), email: user.email, role: "admin" });

    const res = NextResponse.json({ success: true });
    res.cookies.set(COOKIE, token, {
      httpOnly: true,
      path: "/",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
    });
    return res;
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
