import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { requireCapability } from "@/lib/auth";
import { logActivity } from "@/lib/activity-log";
import { ADMIN_ROLES, isAdminRole } from "@/lib/roles";
import User from "@/models/User";

/**
 * Would this change leave nobody able to manage admins?
 *
 * `admins:manage` is super-admin-only, so demoting or deactivating the last
 * active super admin locks the role system permanently — nobody left can undo
 * it without direct database access.
 */
async function wouldOrphanSuperAdmins(targetId: string) {
  const remaining = await User.countDocuments({
    _id: { $ne: targetId },
    role: "super_admin",
    status: "active",
  });
  return remaining === 0;
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireCapability("admins:manage");
  if (guard instanceof NextResponse) return guard;

  const { id } = await params;
  const body = await req.json();

  await connectDB();
  const target = await User.findById(id);
  if (!target || !ADMIN_ROLES.includes(target.role as (typeof ADMIN_ROLES)[number])) {
    return NextResponse.json({ error: "Admin not found" }, { status: 404 });
  }

  // Self-edits are refused outright: changing your own role is either a
  // self-demotion lockout or a self-promotion, and neither should be possible
  // from this screen. Use another super admin's account instead.
  if (String(target._id) === guard.id) {
    return NextResponse.json({ error: "You can't change your own role or status" }, { status: 403 });
  }

  const nextRole = body.role;
  const nextStatus = body.status;
  const losingSuperAdmin =
    target.role === "super_admin" &&
    ((isAdminRole(nextRole) && nextRole !== "super_admin") || nextStatus === "inactive");

  if (losingSuperAdmin && (await wouldOrphanSuperAdmins(String(target._id)))) {
    return NextResponse.json(
      { error: "This is the last active super admin — promote another one first" },
      { status: 409 }
    );
  }

  if (nextRole !== undefined) {
    if (!isAdminRole(nextRole)) {
      return NextResponse.json({ error: "Choose a valid role" }, { status: 400 });
    }
    target.role = nextRole;
  }

  if (nextStatus !== undefined) {
    if (nextStatus !== "active" && nextStatus !== "inactive") {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }
    target.status = nextStatus;
  }

  await target.save();
  logActivity(guard, "updated", "admin", String(target._id), {
    email: target.email,
    role: target.role,
    status: target.status,
  });

  return NextResponse.json({
    id: String(target._id),
    name: target.name,
    email: target.email,
    role: target.role,
    status: target.status,
    avatar: target.avatar ?? "",
  });
}

/**
 * Revokes dashboard access by dropping the account back to `user`. The record
 * itself is kept — these accounts are often also site users with registration
 * history, so deleting the document would take unrelated data with it.
 */
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireCapability("admins:manage");
  if (guard instanceof NextResponse) return guard;

  const { id } = await params;

  await connectDB();
  const target = await User.findById(id);
  if (!target || !ADMIN_ROLES.includes(target.role as (typeof ADMIN_ROLES)[number])) {
    return NextResponse.json({ error: "Admin not found" }, { status: 404 });
  }
  if (String(target._id) === guard.id) {
    return NextResponse.json({ error: "You can't revoke your own access" }, { status: 403 });
  }
  if (target.role === "super_admin" && (await wouldOrphanSuperAdmins(String(target._id)))) {
    return NextResponse.json(
      { error: "This is the last active super admin — promote another one first" },
      { status: 409 }
    );
  }

  target.role = "user";
  await target.save();
  logActivity(guard, "revoked", "admin", String(target._id), { email: target.email });

  return NextResponse.json({ success: true });
}
