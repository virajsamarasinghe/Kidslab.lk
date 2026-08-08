import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { getAdminSession } from "@/lib/auth";
import Subscriber from "@/models/Subscriber";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    const resolvedEmail = String(email ?? "").trim().toLowerCase();

    if (!EMAIL_RE.test(resolvedEmail)) {
      return NextResponse.json({ error: "Enter a valid email address" }, { status: 400 });
    }

    await connectDB();

    const exists = await Subscriber.findOne({ email: resolvedEmail });
    if (exists) {
      return NextResponse.json({ success: true, message: "You're already subscribed!" });
    }

    await Subscriber.create({ email: resolvedEmail, source: "popup" });

    return NextResponse.json(
      { success: true, message: "Subscribed!" },
      { status: 201 }
    );
  } catch (err) {
    console.error("[subscribers:POST]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function GET() {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();
  const subscribers = await Subscriber.find().sort({ createdAt: -1 }).lean();
  const total = await Subscriber.countDocuments();

  return NextResponse.json({ subscribers, total });
}
