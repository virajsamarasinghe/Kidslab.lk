import { ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { CoreStats } from "@/lib/dashboard-stats";

const CAMPAIGN_STATUS_STYLES: Record<string, string> = {
  draft: "bg-slate-50 text-slate-500 border-slate-200",
  sending: "bg-blue-50 text-blue-600 border-blue-200",
  sent: "bg-green-50 text-green-700 border-green-200",
  partial: "bg-amber-50 text-amber-700 border-amber-200",
  failed: "bg-red-50 text-red-600 border-red-200",
};

export default function RecentCampaignsCard({
  campaigns,
}: {
  campaigns: CoreStats["recentCampaigns"];
}) {
  return (
    <Card className="pcb-card border-slate-100 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-semibold text-slate-900">Recent Campaigns</CardTitle>
        <a
          href="/admin/crm/campaigns"
          className="text-xs font-semibold hover:underline flex items-center gap-1"
          style={{ color: "var(--brand-red)" }}
        >
          View all <ArrowRight className="w-3 h-3" />
        </a>
      </CardHeader>
      <CardContent className="pb-4 space-y-2.5">
        {campaigns.length > 0 ? (
          campaigns.map(c => (
            <div
              key={c._id}
              className="flex items-start justify-between gap-2 border-b border-slate-50 last:border-0 pb-2.5 last:pb-0"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-900 truncate">{c.subject}</p>
                <p className="text-xs text-slate-400 mt-0.5">{c.sentCount}/{c.recipientCount} sent</p>
              </div>
              <Badge className={`text-[10px] shrink-0 capitalize ${CAMPAIGN_STATUS_STYLES[c.status]}`}>
                {c.status}
              </Badge>
            </div>
          ))
        ) : (
          <div className="h-[120px] flex items-center justify-center text-slate-400 text-sm">No campaigns yet</div>
        )}
      </CardContent>
    </Card>
  );
}
