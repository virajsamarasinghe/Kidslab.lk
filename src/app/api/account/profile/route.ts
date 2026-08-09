import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAccountUser } from "@/lib/account";
import { parseBody } from "@/lib/validate";
import { enforceRateLimit, clientIp } from "@/lib/rate-limit";

/**
 * The signed-in visitor's own profile.
 *
 * Name, email and password are Clerk's to manage — this covers only the
 * academy-specific fields that live in MongoDB and have no Clerk equivalent.
 */

const ProfileSchema = z.object({
  phone: z.string().trim().max(20).default(""),
  parentName: z.string().trim().max(80).default(""),
  city: z.string().trim().max(80).default(""),
  age: z.number().int().min(0).max(120).optional(),
});

export async function GET() {
  const account = await getAccountUser();
  if (!account) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  return NextResponse.json({
    name: account.name,
    email: account.email,
    phone: account.phone ?? "",
    parentName: account.parentName ?? "",
    city: account.city ?? "",
    age: account.age ?? 0,
    interestedCourse: account.interestedCourse ?? "",
    memberSince: account.createdAt,
  });
}

export async function PATCH(req: NextRequest) {
  const account = await getAccountUser();
  if (!account) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const limited = await enforceRateLimit("account-profile", clientIp(req), 30, 60 * 60);
  if (limited) return limited;

  const parsed = await parseBody(req, ProfileSchema);
  if (parsed instanceof NextResponse) return parsed;

  // Assigned field by field, never spread from the body. `role`, `status` and
  // `password` live on the same document, and a spread would let a visitor
  // hand themselves an admin role by adding a key to the request.
  account.phone = parsed.phone;
  account.parentName = parsed.parentName;
  account.city = parsed.city;
  if (parsed.age !== undefined) account.age = parsed.age;
  await account.save();

  return NextResponse.json({ success: true });
}
