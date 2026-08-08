import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { CoreStats } from "@/lib/dashboard-stats";

interface Kpi {
  label: string;
  value: number;
  hint: string;
  accent: string;
  delta?: number;
}

function KpiTile({ label, value, hint, accent, delta }: Kpi) {
  return (
    <Card className="pcb-card border-slate-100 shadow-sm overflow-hidden">
      <CardContent className="relative px-5 py-4">
        <span className="absolute left-0 top-4 bottom-4 w-[3px] rounded-r-full" style={{ backgroundColor: accent }} />
        <div className="pl-3.5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">{label}</p>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-[28px] leading-none font-extrabold text-slate-900 tabular-nums tracking-tight">
              {value.toLocaleString()}
            </span>
            {delta !== undefined && (
              <span
                className={`flex items-center gap-0.5 text-[11px] font-semibold ${
                  delta >= 0 ? "text-green-700" : "text-red-600"
                }`}
              >
                {delta >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {Math.abs(delta)}%
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-2">{hint}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export function KpiGridSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
      {Array.from({ length: 8 }, (_, i) => (
        <Card key={i} className="pcb-card border-slate-100 shadow-sm overflow-hidden">
          <CardContent className="relative px-5 py-4">
            <span className="absolute left-0 top-4 bottom-4 w-[3px] rounded-r-full bg-slate-100" />
            <div className="pl-3.5">
              <span className="block h-3 w-20 rounded bg-slate-100 animate-pulse" />
              <span className="block h-8 w-16 rounded-md bg-slate-100 animate-pulse mt-3" />
              <span className="block h-3 w-24 rounded bg-slate-100 animate-pulse mt-2.5" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function KpiGrid({ stats }: { stats: CoreStats }) {
  const pipelineTotal = stats.pipeline.reduce((sum, p) => sum + p.count, 0);
  const enrolledCount = stats.pipeline.find(p => p.stage === "enrolled")?.count ?? 0;
  const alumniCount = stats.pipeline.find(p => p.stage === "alumni")?.count ?? 0;
  const conversionRate =
    pipelineTotal > 0 ? Math.round(((enrolledCount + alumniCount) / pipelineTotal) * 100) : 0;
  const activeShare =
    stats.totalUsers > 0 ? Math.round((stats.activeUsers / stats.totalUsers) * 100) : 0;

  const kpis: Kpi[] = [
    {
      label: "Total Students",
      value: stats.totalUsers,
      hint: `${stats.usersThisWeek} joined this week`,
      accent: "var(--brand-navy)",
      delta: stats.weeklyGrowth,
    },
    {
      label: "Active Students",
      value: stats.activeUsers,
      hint: `${activeShare}% of all students`,
      accent: "#16a34a",
    },
    {
      label: "Active Courses",
      value: stats.activeCourses,
      hint: `of ${stats.totalCourses} courses published`,
      accent: "var(--brand-red)",
    },
    {
      label: "Subscribers",
      value: stats.totalSubscribers,
      hint: "opted into the newsletter",
      accent: "var(--brand-blue)",
    },
    {
      label: "Instructors",
      value: stats.totalInstructors,
      hint: "on the teaching team",
      accent: "#9333ea",
    },
    {
      label: "CRM Contacts",
      value: stats.totalContacts,
      hint: `${pipelineTotal} tracked in the pipeline`,
      accent: "var(--brand-blue)",
    },
    {
      label: "Campaigns Sent",
      value: stats.campaignsSent,
      hint: `of ${stats.totalCampaigns} created`,
      accent: "var(--brand-red)",
    },
    {
      label: "Enrolled",
      value: enrolledCount,
      hint: `${conversionRate}% pipeline conversion`,
      accent: "#16a34a",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
      {kpis.map(kpi => (
        <KpiTile key={kpi.label} {...kpi} />
      ))}
    </div>
  );
}
