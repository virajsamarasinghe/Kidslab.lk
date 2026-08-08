import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { resolveSegment } from "@/lib/crm";
import { CAMPAIGN_SEGMENTS, type CampaignSegment } from "@/models/Campaign";

export async function GET(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const segment = req.nextUrl.searchParams.get("segment") as CampaignSegment;
  if (!CAMPAIGN_SEGMENTS.includes(segment)) {
    return NextResponse.json({ error: "Invalid segment" }, { status: 400 });
  }

  const recipients = await resolveSegment(segment);
  return NextResponse.json({ count: recipients.length });
}
