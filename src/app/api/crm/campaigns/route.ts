import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { requireCapability } from "@/lib/auth";
import { getBrevoCredentials, sendEmail } from "@/lib/brevo";
import { enforceRateLimit } from "@/lib/rate-limit";
import { resolveSegment } from "@/lib/crm";
import { unsubscribeUrl } from "@/lib/email-optout";
import { htmlToText, renderEmail } from "@/lib/email-template";
import { logActivity } from "@/lib/activity-log";
import Campaign, { CAMPAIGN_SEGMENTS, type CampaignSegment } from "@/models/Campaign";

const BATCH_SIZE = 5;

/**
 * Wraps the admin-authored campaign body in the shared branded shell.
 *
 * The body is intentionally *not* escaped — campaign composing is gated behind
 * the `campaigns:send` capability, so its author is a trusted admin writing
 * HTML on purpose. It is wrapped in a font-normalising div so unstyled markup
 * still inherits the layout's typography instead of falling back to Times.
 */
function renderCampaignHtml(subject: string, body: string, unsubscribe: string): string {
  return renderEmail({
    title: subject,
    // First ~90 characters of the body double as the inbox preview.
    preheader: htmlToText(body).slice(0, 90),
    heading: subject,
    kind: "marketing",
    unsubscribeUrl: unsubscribe,
    body: `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:16px;line-height:1.6;color:#1f2933;">${body}</div>`,
  });
}

export async function GET() {
  const session = await requireCapability("dashboard:read");
  if (session instanceof NextResponse) return session;

  await connectDB();
  const campaigns = await Campaign.find().sort({ createdAt: -1 }).limit(200).lean();
  return NextResponse.json({ campaigns });
}

export async function POST(req: NextRequest) {
  const session = await requireCapability("campaigns:send");
  if (session instanceof NextResponse) return session;

  await connectDB();
  const body = await req.json();
  const subject = String(body.subject ?? "").trim();
  const htmlBody = String(body.body ?? "").trim();
  const segment = body.segment as CampaignSegment;

  if (!subject || !htmlBody) {
    return NextResponse.json({ error: "Subject and body are required" }, { status: 400 });
  }
  if (!CAMPAIGN_SEGMENTS.includes(segment)) {
    return NextResponse.json({ error: "Invalid segment" }, { status: 400 });
  }

  // Blasts are irreversible and metered by Brevo — cap how often one admin
  // can fire them, so a stuck retry loop can't drain the sending quota.
  const limited = await enforceRateLimit("campaign-send", session.id, 5, 60 * 60);
  if (limited) return limited;

  const creds = await getBrevoCredentials();
  if (!creds) {
    return NextResponse.json(
      { error: "Brevo isn't configured yet — set it up under Settings → Brevo Email" },
      { status: 400 }
    );
  }

  const recipients = await resolveSegment(segment);
  const campaign = await Campaign.create({
    subject,
    body: htmlBody,
    segment,
    status: "sending",
    recipientCount: recipients.length,
  });

  let sentCount = 0;
  let failedCount = 0;

  for (let i = 0; i < recipients.length; i += BATCH_SIZE) {
    const batch = recipients.slice(i, i + BATCH_SIZE);
    const results = await Promise.allSettled(
      batch.map(r => {
        // The unsubscribe link is per-recipient, so the branded shell has to be
        // rendered per recipient too — only the admin-authored body is shared.
        const unsubscribe = unsubscribeUrl(r.email);
        return sendEmail(creds, {
          to: r.email,
          name: r.name,
          subject,
          html: renderCampaignHtml(subject, htmlBody, unsubscribe),
          kind: "marketing",
          unsubscribeUrl: unsubscribe,
        });
      })
    );
    for (const r of results) {
      if (r.status === "fulfilled") sentCount++;
      else failedCount++;
    }
  }

  campaign.status = failedCount === 0 ? "sent" : sentCount === 0 ? "failed" : "partial";
  campaign.sentCount = sentCount;
  campaign.failedCount = failedCount;
  campaign.sentAt = new Date();
  await campaign.save();

  logActivity(session, "sent", "campaign", String(campaign._id), {
    subject, segment, sentCount, failedCount, recipientCount: recipients.length,
  });
  return NextResponse.json(campaign, { status: 201 });
}
