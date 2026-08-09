import { NextRequest, NextResponse } from "next/server";
import { recordOptOut, verifyEmailSignature } from "@/lib/email-optout";
import { invalidateUnifiedContacts } from "@/lib/crm";

/**
 * One-click unsubscribe (RFC 8058).
 *
 * Gmail and Outlook show their own "Unsubscribe" control next to the sender
 * when a message carries `List-Unsubscribe-Post: List-Unsubscribe=One-Click`,
 * and they POST here directly — no confirmation page, no logged-in session, no
 * CSRF token. The HMAC in the link is what authorises the change.
 *
 * Deliberately unauthenticated and unrate-limited beyond the signature check:
 * an unsubscribe must never fail. The worst a replayed POST can do is opt out
 * an address that is already opted out.
 */
export async function POST(req: NextRequest) {
  // Mailbox providers send `List-Unsubscribe=One-Click` as a form body; the
  // in-page confirmation sends JSON. Accept either.
  const contentType = req.headers.get("content-type") ?? "";
  let email = "";
  let signature = "";

  if (contentType.includes("application/json")) {
    const body = await req.json().catch(() => ({}));
    email = typeof body.email === "string" ? body.email : "";
    signature = typeof body.signature === "string" ? body.signature : "";
  }

  // The one-click POST carries no address of its own — it re-posts the query
  // string of the List-Unsubscribe URL, so fall back to that.
  const url = new URL(req.url);
  email ||= url.searchParams.get("e") ?? "";
  signature ||= url.searchParams.get("s") ?? "";

  email = email.trim().toLowerCase();
  if (!email || !verifyEmailSignature(email, signature)) {
    return NextResponse.json({ error: "Invalid unsubscribe link" }, { status: 400 });
  }

  await recordOptOut(email);
  invalidateUnifiedContacts();
  return NextResponse.json({ success: true });
}
