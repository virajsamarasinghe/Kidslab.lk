import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { getAdminSession } from "@/lib/auth";
import { getBrevoCredentials, sendEmail } from "@/lib/brevo";
import { resolveSegment } from "@/lib/crm";
import { logActivity } from "@/lib/activity-log";
import Campaign, { CAMPAIGN_SEGMENTS, type CampaignSegment } from "@/models/Campaign";

const BATCH_SIZE = 5;

export async function GET() {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();
  const campaigns = await Campaign.find().sort({ createdAt: -1 }).limit(200).lean();
  return NextResponse.json({ campaigns });
}

export async function POST(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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
      batch.map(r => sendEmail(creds, { to: r.email, name: r.name, subject, html: htmlBody }))
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
