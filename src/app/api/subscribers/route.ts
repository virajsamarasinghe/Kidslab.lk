import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { getAdminSession } from "@/lib/auth";
import Subscriber from "@/models/Subscriber";
import type { QueryFilter } from "mongoose";
import type { ISubscriber } from "@/models/Subscriber";
import { escapeRegex } from "@/lib/utils";

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

export async function GET(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();
  const search = req.nextUrl.searchParams.get("search") ?? "";
  const page = Math.max(1, Number(req.nextUrl.searchParams.get("page") ?? "1"));
  const limit = Math.min(100, Math.max(1, Number(req.nextUrl.searchParams.get("limit") ?? "20")));

  const query: QueryFilter<ISubscriber> = {};
  if (search) query.email = { $regex: escapeRegex(search), $options: "i" };

  const [subscribers, total] = await Promise.all([
    Subscriber.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    Subscriber.countDocuments(query),
  ]);

  return NextResponse.json({ subscribers, total });
}
