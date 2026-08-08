import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { getAdminSession } from "@/lib/auth";
import Instructor from "@/models/Instructor";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();
  const { id } = await params;
  const body = await req.json();
  const instructor = await Instructor.findByIdAndUpdate(id, body, { new: true }).lean();
  if (!instructor) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(instructor);
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();
  const { id } = await params;
  await Instructor.findByIdAndDelete(id);
  return NextResponse.json({ success: true });
}
