import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/mongodb";
import { requireCapability } from "@/lib/auth";
import { logActivity } from "@/lib/activity-log";
import { ADMIN_ROLES, outranks } from "@/lib/roles";
import { validatePassword } from "@/lib/password";
import { z } from "zod";
import { parseBody } from "@/lib/validate";

const CreateAdminSchema = z.object({
  name:     z.string().trim().max(120).default(""),
  email:    z.string().trim().toLowerCase().email("Enter a valid email address"),
  password: z.string().default(""),
  role:     z.enum(ADMIN_ROLES),
}).strict();
import User from "@/models/User";

/** Lists every account holding an admin-tier role. */
export async function GET() {
  const guard = await requireCapability("admins:manage");
  if (guard instanceof NextResponse) return guard;

  await connectDB();
  const admins = await User.find({ role: { $in: ADMIN_ROLES } })
    .select("name email role status avatar createdAt")
    .sort({ createdAt: 1 })
    .lean();

  return NextResponse.json(
    admins.map(a => ({
      id: String(a._id),
      name: a.name,
      email: a.email,
      role: a.role,
      status: a.status,
      avatar: a.avatar ?? "",
      createdAt: a.createdAt,
      /** True for the caller's own row, so the UI can lock its controls. */
      isSelf: String(a._id) === guard.id,
    }))
  );
}

/**
 * Adds an admin — either by promoting an existing account or creating a new
 * one. A password is required only in the create case, since existing accounts
 * (including Clerk-backed ones) already have their own credential.
 */
export async function POST(req: NextRequest) {
  const guard = await requireCapability("admins:manage");
  if (guard instanceof NextResponse) return guard;

  const parsed = await parseBody(req, CreateAdminSchema);
  if (parsed instanceof NextResponse) return parsed;
  const { name, email, password, role } = parsed;

  // Prevents a super admin from being minted by someone who isn't one already.
  if (!outranks(guard.role, role) && guard.role !== role) {
    return NextResponse.json({ error: "You can't grant a role above your own" }, { status: 403 });
  }

  await connectDB();
  const existing = await User.findOne({ email });

  if (existing) {
    if (ADMIN_ROLES.includes(existing.role as (typeof ADMIN_ROLES)[number])) {
      return NextResponse.json({ error: "That account is already an admin" }, { status: 409 });
    }
    existing.role = role;
    existing.status = "active";
    if (name) existing.name = name;
    await existing.save();

    logActivity(guard, "promoted", "admin", String(existing._id), { email, role });
    return NextResponse.json({
      id: String(existing._id),
      name: existing.name,
      email: existing.email,
      role: existing.role,
      status: existing.status,
      avatar: existing.avatar ?? "",
      promoted: true,
    });
  }

  if (!name) {
    return NextResponse.json({ error: "Name is required for a new account" }, { status: 400 });
  }
  const policy = validatePassword(password, [email, name]);
  if (!policy.valid) {
    return NextResponse.json({ error: policy.error }, { status: 400 });
  }

  const created = await User.create({
    name,
    email,
    password: await bcrypt.hash(password, 10),
    role,
    status: "active",
  });

  logActivity(guard, "created", "admin", String(created._id), { email, role });
  return NextResponse.json(
    {
      id: String(created._id),
      name: created.name,
      email: created.email,
      role: created.role,
      status: created.status,
      avatar: "",
      promoted: false,
    },
    { status: 201 }
  );
}
