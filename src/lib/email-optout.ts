import { createHmac, timingSafeEqual } from "crypto";
import { connectDB } from "@/lib/mongodb";
import EmailOptOut from "@/models/EmailOptOut";
import { SITE_URL } from "@/config/site";

/**
 * Unsubscribe links carry the address plus an HMAC of it, rather than a random
 * token row per recipient. A blast to a few thousand contacts would otherwise
 * mean a few thousand token writes per campaign, and the signature already
 * gives the property that matters: nobody can unsubscribe an address they
 * didn't receive a link for.
 *
 * The links deliberately don't expire — a two-year-old newsletter still has to
 * honour its unsubscribe, and CAN-SPAM requires the link to work for at least
 * 30 days after send.
 */
function secret(): string {
  const value = process.env.JWT_SECRET;
  if (!value) throw new Error("JWT_SECRET is required to sign unsubscribe links");
  return value;
}

export function signEmail(email: string): string {
  return createHmac("sha256", secret())
    .update(email.trim().toLowerCase())
    .digest("hex");
}

export function verifyEmailSignature(email: string, signature: string): boolean {
  const expected = Buffer.from(signEmail(email));
  const given = Buffer.from(signature ?? "");
  // Length must match before timingSafeEqual, which throws on a mismatch.
  return expected.length === given.length && timingSafeEqual(expected, given);
}

/** The per-recipient unsubscribe URL embedded in the footer and List-Unsubscribe header. */
export function unsubscribeUrl(email: string): string {
  const address = email.trim().toLowerCase();
  return `${SITE_URL}/unsubscribe?e=${encodeURIComponent(address)}&s=${signEmail(address)}`;
}

/** Records an opt-out. Idempotent — re-clicking the same link is not an error. */
export async function recordOptOut(email: string, source = "email-link"): Promise<void> {
  await connectDB();
  await EmailOptOut.updateOne(
    { email: email.trim().toLowerCase() },
    { $setOnInsert: { email: email.trim().toLowerCase(), source } },
    { upsert: true }
  );
}

/**
 * The set of addresses that must be dropped from any marketing send.
 *
 * Returned as a Set so callers filter a whole audience with one query instead
 * of a lookup per recipient.
 */
export async function getSuppressedEmails(): Promise<Set<string>> {
  await connectDB();
  const rows = await EmailOptOut.find().select("email").lean();
  return new Set(rows.map(r => r.email.toLowerCase()));
}
