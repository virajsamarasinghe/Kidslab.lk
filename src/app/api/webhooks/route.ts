import { NextRequest, NextResponse } from "next/server";
import { Webhook } from "svix";
import type { WebhookEvent } from "@clerk/nextjs/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import { sendWelcomeEmail } from "@/lib/brevo";

// Keeps the MongoDB `User` collection (used by the admin dashboard) in sync
// with accounts created through Clerk's hosted sign-in/sign-up.
export async function POST(req: NextRequest) {
  const signingSecret = process.env.CLERK_WEBHOOK_SIGNING_SECRET;
  if (!signingSecret) {
    return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
  }

  const svixId = req.headers.get("svix-id");
  const svixTimestamp = req.headers.get("svix-timestamp");
  const svixSignature = req.headers.get("svix-signature");
  if (!svixId || !svixTimestamp || !svixSignature) {
    return NextResponse.json({ error: "Missing svix headers" }, { status: 400 });
  }

  const body = await req.text();
  let event: WebhookEvent;
  try {
    event = new Webhook(signingSecret).verify(body, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as WebhookEvent;
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  await connectDB();

  if (event.type === "user.created" || event.type === "user.updated") {
    const clerk = event.data;
    const email = clerk.email_addresses.find(
      e => e.id === clerk.primary_email_address_id
    )?.email_address;
    if (!email) return NextResponse.json({ received: true });

    const name =
      [clerk.first_name, clerk.last_name].filter(Boolean).join(" ").trim() ||
      email.split("@")[0];
    const normalisedEmail = email.toLowerCase();

    // Match on either key, rather than upserting on `clerkId` alone.
    //
    // Seminar leads created by /api/register already occupy their email
    // address with no `clerkId`, and `email` is uniquely indexed — so an
    // insert keyed only on `clerkId` throws a duplicate-key error the moment
    // one of those parents signs up with Clerk. Adopting the existing row
    // instead also keeps their history attached: phone, city, enrolled
    // courses and past payments all survive the link-up.
    const existing = await User.findOne({
      $or: [{ clerkId: clerk.id }, { email: normalisedEmail }],
    });

    if (existing?.clerkId === clerk.id) {
      // Already linked — Clerk owns the identity fields from here on.
      existing.name = name;
      existing.email = normalisedEmail;
      await existing.save();
    } else if (existing) {
      // Adopting a seminar lead. The name on file is deliberately left alone:
      // /api/register stores the *student's* name there, while Clerk holds the
      // account holder's (usually the parent), so overwriting would lose it.
      existing.clerkId = clerk.id;
      existing.email = normalisedEmail;
      await existing.save();
    } else {
      await User.create({
        clerkId: clerk.id,
        name,
        email: normalisedEmail,
        role: "user",
        status: "active",
      });
    }

    // Only for a genuinely new account — an adopted lead already had a welcome
    // email when they registered for the seminar.
    if (event.type === "user.created" && !existing) {
      sendWelcomeEmail({ name, email: normalisedEmail }).catch((err) =>
        console.error("[webhooks] failed to send welcome email", err)
      );
    }
  }

  if (event.type === "user.deleted") {
    if (event.data.id) {
      await User.deleteOne({ clerkId: event.data.id });
    }
  }

  return NextResponse.json({ received: true });
}
