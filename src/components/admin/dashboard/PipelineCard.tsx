import { ArrowRight, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { PipelineStage } from "@/types/crm";

const STAGE_LABELS: Record<PipelineStage, string> = {
  lead: "Lead",
  contacted: "Contacted",
  registered: "Registered",
  enrolled: "Enrolled",
  alumni: "Alumni",
};

export const STAGE_ACCENTS: Record<PipelineStage, string> = {
  lead: "#94a3b8",
  contacted: "var(--brand-blue)",
  registered: "var(--brand-yellow)",
  enrolled: "#16a34a",
  alumni: "#9333ea",
};

export default function PipelineCard({
  pipeline,
  totalContacts,
}: {
  pipeline: Array<{ stage: PipelineStage; count: number }>;
  totalContacts: number;
}) {
  const pipelineTotal = pipeline.reduce((sum, p) => sum + p.count, 0);
  const enrolledCount = pipeline.find(p => p.stage === "enrolled")?.count ?? 0;
  const alumniCount = pipeline.find(p => p.stage === "alumni")?.count ?? 0;
  const conversionRate =
    pipelineTotal > 0 ? Math.round(((enrolledCount + alumniCount) / pipelineTotal) * 100) : 0;

  return (
    <Card className="pcb-card border-slate-100 shadow-sm xl:col-span-2">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="text-sm font-semibold text-slate-900">Enrollment Pipeline</CardTitle>
          <p className="text-xs text-slate-400 mt-1">{totalContacts} contacts across all stages</p>
        </div>
        <div className="flex items-center gap-3">
          <span
            className="flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full text-green-700 bg-green-50"
            title="Contacts that reached Enrolled or Alumni"
          >
            <TrendingUp className="w-3.5 h-3.5" />
            {conversionRate}% conversion
          </span>
          <a
            href="/admin/crm/pipeline"
            className="text-xs font-semibold hover:underline flex items-center gap-1"
            style={{ color: "var(--brand-red)" }}
          >
            Open board <ArrowRight className="w-3 h-3" />
          </a>
        </div>
      </CardHeader>
      <CardContent className="pb-5">
        <div className="space-y-3">
          {pipeline.map(({ stage, count }) => {
            const pct = pipelineTotal > 0 ? Math.round((count / pipelineTotal) * 100) : 0;
            return (
              <div key={stage}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="flex items-center gap-1.5 font-medium text-slate-600">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: STAGE_ACCENTS[stage] }} />
                    {STAGE_LABELS[stage]}
                  </span>
                  <span className="text-slate-400">{count} · {pct}%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${pct}%`, backgroundColor: STAGE_ACCENTS[stage] }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
