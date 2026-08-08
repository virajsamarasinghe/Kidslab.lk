import { NextRequest, NextResponse } from "next/server";
import { requireCapability } from "@/lib/auth";
import { resolveSegment } from "@/lib/crm";
import { CAMPAIGN_SEGMENTS, type CampaignSegment } from "@/models/Campaign";

export async function GET(req: NextRequest) {
  const session = await requireCapability("dashboard:read");
  if (session instanceof NextResponse) return session;

  const segment = req.nextUrl.searchParams.get("segment") as CampaignSegment;
  if (!CAMPAIGN_SEGMENTS.includes(segment)) {
    return NextResponse.json({ error: "Invalid segment" }, { status: 400 });
  }

  const recipients = await resolveSegment(segment);
  return NextResponse.json({ count: recipients.length });
}
