import { cache } from "react";
import { currentUser } from "@clerk/nextjs/server";
import { connectDB } from "@/lib/mongodb";
import User, { type IUser } from "@/models/User";

/**
 * Resolves the signed-in visitor's MongoDB `User` from their Clerk session.
 *
 * Every account and payment route goes through this rather than accepting a
 * user id from the client — the Clerk session is the only identity claim we
 * can't be lied to about.
 *
 * It also creates or adopts the record when needed, instead of assuming the
 * Clerk webhook got there first. The webhook is asynchronous and can lag a
 * fresh sign-up by seconds (or fail entirely, e.g. a misconfigured signing
 * secret), and "you just signed up, so your account doesn't exist yet" is not
 * an acceptable answer at a checkout. The matching rules mirror
 * `/api/webhooks` exactly, so whichever path runs first, the other finds the
 * same row.
 *
 * Returns `null` only when nobody is signed in.
 *
 * Memoised per request: the account layout and the page beneath it both call
 * this, and Clerk memoises `currentUser()` but nothing would memoise the
 * MongoDB round trip that follows it.
 */
export const getAccountUser = cache(async function getAccountUser(): Promise<IUser | null> {
  const clerk = await currentUser();
  if (!clerk) return null;

  const email = clerk.emailAddresses.find(
    (e) => e.id === clerk.primaryEmailAddressId
  )?.emailAddress;
  if (!email) return null;

  const normalisedEmail = email.toLowerCase();
  const name =
    [clerk.firstName, clerk.lastName].filter(Boolean).join(" ").trim() ||
    normalisedEmail.split("@")[0];

  await connectDB();

  const existing = await User.findOne({
    $or: [{ clerkId: clerk.id }, { email: normalisedEmail }],
  });

  if (existing) {
    // Stamp the link onto a seminar lead that signed up later. The stored
    // name is left alone — it's the student's, not the account holder's.
    if (existing.clerkId !== clerk.id) {
      existing.clerkId = clerk.id;
      await existing.save();
    }
    return existing;
  }

  return User.create({
    clerkId: clerk.id,
    name,
    email: normalisedEmail,
    role: "user",
    status: "active",
  });
});
