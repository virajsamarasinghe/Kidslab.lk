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

    await User.findOneAndUpdate(
      { clerkId: clerk.id },
      {
        $setOnInsert: { clerkId: clerk.id, role: "user", status: "active" },
        $set: { name, email: email.toLowerCase() },
      },
      { upsert: true, setDefaultsOnInsert: true }
    );

    // Only on first sign-up, not on later profile edits
    if (event.type === "user.created") {
      sendWelcomeEmail({ name, email: email.toLowerCase() }).catch((err) =>
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
