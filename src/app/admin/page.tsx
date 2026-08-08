"use client";

import { useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { ArrowRight, ArrowUpRight, ArrowDownRight, MapPin, TrendingUp, AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig,
} from "@/components/ui/chart";
import type { PipelineStage } from "@/types/crm";
import type { MapDistrict, MapCity } from "@/components/admin/SriLankaMap";

const SriLankaMap = dynamic(() => import("@/components/admin/SriLankaMap"), {
  ssr: false,
  loading: () => <div className="h-[380px] flex items-center justify-center text-slate-400 text-sm">Loading map…</div>,
});

interface Stats {
  totalUsers: number;
  totalCourses: number;
  activeCourses: number;
  totalSubscribers: number;
  activeUsers: number;
  inactiveUsers: number;
  usersThisWeek: number;
  weeklyGrowth: number;
  recentUsers: Array<{
    _id: string;
    name: string;
    email: string;
    city: string;
    interestedCourse: string;
    createdAt: string;
  }>;
  signupTrend: Array<{ date: string; signups: number }>;
  topCities: Array<{ city: string; count: number }>;
  mapDistricts: MapDistrict[];
  mapCities: MapCity[];
  unmatchedCities: number;
  topCourses: Array<{ course: string; count: number }>;
  totalInstructors: number;
  totalContacts: number;
  pipeline: Array<{ stage: PipelineStage; count: number }>;
  totalCampaigns: number;
  campaignsSent: number;
  recentCampaigns: Array<{
    _id: string;
    subject: string;
    segment: string;
    status: "draft" | "sending" | "sent" | "partial" | "failed";
    recipientCount: number;
    sentCount: number;
    createdAt: string;
  }>;
}

const STAGE_LABELS: Record<PipelineStage, string> = {
  lead: "Lead",
  contacted: "Contacted",
  registered: "Registered",
  enrolled: "Enrolled",
  alumni: "Alumni",
};

const STAGE_ACCENTS: Record<PipelineStage, string> = {
  lead: "#94a3b8",
  contacted: "var(--brand-blue)",
  registered: "var(--brand-yellow)",
  enrolled: "#16a34a",
  alumni: "#9333ea",
};

const CAMPAIGN_STATUS_STYLES: Record<string, string> = {
  draft: "bg-slate-50 text-slate-500 border-slate-200",
  sending: "bg-blue-50 text-blue-600 border-blue-200",
  sent: "bg-green-50 text-green-700 border-green-200",
  partial: "bg-amber-50 text-amber-700 border-amber-200",
  failed: "bg-red-50 text-red-600 border-red-200",
};

const signupChartConfig = {
  signups: { label: "New Students", color: "var(--color-chart-1)" },
} satisfies ChartConfig;

const cityChartConfig = {
  count: { label: "Students", color: "var(--color-chart-3)" },
} satisfies ChartConfig;

const statusChartConfig = {
  active: { label: "Active", color: "#16a34a" },
  inactive: { label: "Inactive", color: "var(--color-chart-2)" },
} satisfies ChartConfig;

interface Kpi {
  label: string;
  value: number | null;
  hint: string;
  accent: string;
  delta?: number;
}

function KpiTile({ label, value, hint, accent, delta }: Kpi) {
  const loading = value === null;
  return (
    <Card className="pcb-card border-slate-100 shadow-sm overflow-hidden">
      <CardContent className="relative px-5 py-4">
        <span className="absolute left-0 top-4 bottom-4 w-[3px] rounded-r-full" style={{ backgroundColor: accent }} />
        <div className="pl-3.5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">{label}</p>
          <div className="flex items-baseline gap-2 mt-2">
            {loading ? (
              <span className="block h-8 w-16 rounded-md bg-slate-100 animate-pulse" />
            ) : (
              <span className="text-[28px] leading-none font-extrabold text-slate-900 tabular-nums tracking-tight">
                {value.toLocaleString()}
              </span>
            )}
            {!loading && delta !== undefined && (
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
          {loading ? (
            <span className="block h-3 w-24 rounded bg-slate-100 animate-pulse mt-2.5" />
          ) : (
            <p className="text-xs text-slate-400 mt-2">{hint}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadStats = useCallback(() => {
    setError(null);
    fetch("/api/stats")
      .then(r => {
        if (!r.ok) throw new Error(`Request failed (${r.status})`);
        return r.json();
      })
      .then(setStats)
      .catch(e => setError(e instanceof Error ? e.message : "Failed to load dashboard data"));
  }, []);

  useEffect(() => { loadStats(); }, [loadStats]);

  const pipeline = stats?.pipeline ?? [];
  const pipelineTotal = pipeline.reduce((sum, p) => sum + p.count, 0);

  const statusData = stats
    ? [
        { name: "active", label: "Active", value: stats.activeUsers, fill: "#16a34a" },
        { name: "inactive", label: "Inactive", value: stats.inactiveUsers, fill: "var(--color-chart-2)" },
      ]
    : [];

  const growth = stats?.weeklyGrowth ?? 0;
  const isPositive = growth >= 0;

  const alumniCount = stats?.pipeline.find(p => p.stage === "alumni")?.count ?? 0;
  const enrolledCount = stats?.pipeline.find(p => p.stage === "enrolled")?.count ?? 0;
  const conversionRate =
    stats && pipelineTotal > 0 ? Math.round(((enrolledCount + alumniCount) / pipelineTotal) * 100) : 0;

  const mappedRegistrations = stats ? stats.mapCities.reduce((sum, c) => sum + c.count, 0) : 0;

  // Districts that actually have registrations, biggest first — the map only
  // shows intensity, so the list gives exact counts per district.
  const registeredDistricts = stats
    ? [...stats.mapDistricts].sort((a, b) => b.value - a.value)
    : [];
  const topDistrictCount = registeredDistricts[0]?.value ?? 0;

  const activeShare =
    stats && stats.totalUsers > 0 ? Math.round((stats.activeUsers / stats.totalUsers) * 100) : 0;

  const kpis: Kpi[] = [
    {
      label: "Total Students",
      value: stats?.totalUsers ?? null,
      hint: `${stats?.usersThisWeek ?? 0} joined this week`,
      accent: "var(--brand-navy)",
      delta: growth,
    },
    {
      label: "Active Students",
      value: stats?.activeUsers ?? null,
      hint: `${activeShare}% of all students`,
      accent: "#16a34a",
    },
    {
      label: "Active Courses",
      value: stats?.activeCourses ?? null,
      hint: `of ${stats?.totalCourses ?? 0} courses published`,
      accent: "var(--brand-red)",
    },
    {
      label: "Subscribers",
      value: stats?.totalSubscribers ?? null,
      hint: "opted into the newsletter",
      accent: "var(--brand-blue)",
    },
    {
      label: "Instructors",
      value: stats?.totalInstructors ?? null,
      hint: "on the teaching team",
      accent: "#9333ea",
    },
    {
      label: "CRM Contacts",
      value: stats?.totalContacts ?? null,
      hint: `${pipelineTotal} tracked in the pipeline`,
      accent: "var(--brand-blue)",
    },
    {
      label: "Campaigns Sent",
      value: stats?.campaignsSent ?? null,
      hint: `of ${stats?.totalCampaigns ?? 0} created`,
      accent: "var(--brand-red)",
    },
    {
      label: "Enrolled",
      value: stats ? enrolledCount : null,
      hint: `${conversionRate}% pipeline conversion`,
      accent: "#16a34a",
    },
  ];

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1
          className="text-2xl font-bold text-slate-900 tracking-tight"
          style={{ fontFamily: "var(--font-display), var(--font-sans), system-ui, sans-serif" }}
        >
          Dashboard
        </h1>
        <p className="text-slate-500 text-sm mt-1">Welcome back, Admin · <span style={{ color: "var(--brand-navy)" }}>kid<span style={{ color: "var(--brand-red)" }}>s</span>lab.lk</span></p>
      </div>

      {error && (
        <div className="flex items-center gap-3 text-sm px-4 py-3 rounded-xl border bg-red-50 border-red-200 text-red-600 mb-6">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span className="flex-1">Couldn&apos;t load dashboard data: {error}</span>
          <Button variant="outline" size="sm" onClick={loadStats} className="gap-1.5 shrink-0">
            <RefreshCw className="w-3.5 h-3.5" /> Retry
          </Button>
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        {kpis.map(kpi => (
          <KpiTile key={kpi.label} {...kpi} />
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 mb-6">
        {/* Signup trend */}
        <Card className="pcb-card border-slate-100 shadow-sm xl:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-sm font-semibold text-slate-900">Registrations — Last 14 Days</CardTitle>
              <p className="text-xs text-slate-400 mt-1">{stats?.usersThisWeek ?? 0} new this week</p>
            </div>
            <div
              className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${
                isPositive ? "text-green-700 bg-green-50" : "text-red-600 bg-red-50"
              }`}
            >
              {isPositive ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
              {Math.abs(growth)}% vs last week
            </div>
          </CardHeader>
          <CardContent className="pb-4">
            {stats ? (
              <ChartContainer config={signupChartConfig} className="h-[220px] w-full">
                <AreaChart data={stats.signupTrend} margin={{ left: 0, right: 8, top: 8 }}>
                  <defs>
                    <linearGradient id="signupsFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-signups)" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="var(--color-signups)" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} fontSize={11} />
                  <YAxis tickLine={false} axisLine={false} width={28} fontSize={11} allowDecimals={false} />
                  <ChartTooltip content={(props: any) => <ChartTooltipContent {...props} indicator="dot" />} />
                  <Area
                    type="monotone"
                    dataKey="signups"
                    stroke="var(--color-signups)"
                    fill="url(#signupsFill)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ChartContainer>
            ) : (
              <div className="h-[220px] flex items-center justify-center text-slate-400 text-sm">Loading…</div>
            )}
          </CardContent>
        </Card>

        {/* Status breakdown */}
        <Card className="pcb-card border-slate-100 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-slate-900">Student Status</CardTitle>
            <p className="text-xs text-slate-400 mt-1">Active vs inactive</p>
          </CardHeader>
          <CardContent className="flex flex-col items-center pb-4">
            {stats ? (
              <>
                <ChartContainer config={statusChartConfig} className="h-[160px] w-full">
                  <PieChart>
                    <ChartTooltip content={(props: any) => <ChartTooltipContent {...props} hideLabel nameKey="name" />} />
                    <Pie data={statusData} dataKey="value" nameKey="name" innerRadius={45} outerRadius={70} strokeWidth={2}>
                      {statusData.map(d => (
                        <Cell key={d.name} fill={d.fill} />
                      ))}
                    </Pie>
                  </PieChart>
                </ChartContainer>
                <div className="flex items-center gap-4 mt-2">
                  <span className="flex items-center gap-1.5 text-xs text-slate-500">
                    <span className="w-2 h-2 rounded-full bg-green-600" /> Active {stats.activeUsers}
                  </span>
                  <span className="flex items-center gap-1.5 text-xs text-slate-500">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: "var(--brand-red)" }} /> Inactive {stats.inactiveUsers}
                  </span>
                </div>
              </>
            ) : (
              <div className="h-[160px] flex items-center justify-center text-slate-400 text-sm">Loading…</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Sri Lanka map */}
      <Card className="pcb-card border-slate-100 shadow-sm mb-6">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle className="text-sm font-semibold text-slate-900 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" style={{ color: "var(--brand-red)" }} />
              Registrations Across Sri Lanka
            </CardTitle>
            <p className="text-xs text-slate-400 mt-1">
              {mappedRegistrations} plotted across {registeredDistricts.length} district{registeredDistricts.length === 1 ? "" : "s"}
              {stats && stats.unmatchedCities > 0 ? ` · ${stats.unmatchedCities} unmatched city entries` : ""}
            </p>
          </div>
        </CardHeader>
        <CardContent className="pb-4">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-5">
            <SriLankaMap
              districts={stats?.mapDistricts ?? []}
              cities={stats?.mapCities ?? []}
              loading={!stats}
            />

            <div className="flex flex-col min-w-0">
              <div className="flex items-baseline justify-between mb-2">
                <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-wide">
                  Registered Districts
                </h3>
                <span className="text-xs text-slate-400">{registeredDistricts.length}</span>
              </div>

              {!stats ? (
                <div className="flex-1 min-h-[200px] flex items-center justify-center text-slate-400 text-sm">
                  Loading…
                </div>
              ) : registeredDistricts.length === 0 ? (
                <div className="flex-1 min-h-[200px] flex items-center justify-center text-slate-400 text-sm">
                  No districts yet
                </div>
              ) : (
                <ul className="flex-1 lg:max-h-[340px] overflow-y-auto pr-1 divide-y divide-slate-100">
                  {registeredDistricts.map(d => (
                    <li key={d["hc-key"]} className="py-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs text-slate-600 truncate">{d.name}</span>
                        <span className="text-xs font-semibold text-slate-900 tabular-nums shrink-0">
                          {d.value}
                        </span>
                      </div>
                      <div className="mt-1 h-1 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${topDistrictCount > 0 ? (d.value / topDistrictCount) * 100 : 0}%`,
                            backgroundColor: "var(--brand-red)",
                          }}
                        />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Breakdown row */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 mb-6">
        <Card className="pcb-card border-slate-100 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-slate-900">Top Cities</CardTitle>
          </CardHeader>
          <CardContent className="pb-4">
            {stats && stats.topCities.length > 0 ? (
              <ChartContainer config={cityChartConfig} className="h-[200px] w-full">
                <BarChart data={stats.topCities} layout="vertical" margin={{ left: 8, right: 8 }}>
                  <CartesianGrid horizontal={false} strokeDasharray="3 3" />
                  <XAxis type="number" tickLine={false} axisLine={false} fontSize={11} allowDecimals={false} />
                  <YAxis type="category" dataKey="city" tickLine={false} axisLine={false} width={80} fontSize={11} />
                  <ChartTooltip content={(props: any) => <ChartTooltipContent {...props} indicator="line" />} />
                  <Bar dataKey="count" fill="var(--color-count)" radius={4} />
                </BarChart>
              </ChartContainer>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-slate-400 text-sm">No data yet</div>
            )}
          </CardContent>
        </Card>

        <Card className="pcb-card border-slate-100 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-slate-900">Most Popular Course Interest</CardTitle>
          </CardHeader>
          <CardContent className="pb-4">
            {stats && stats.topCourses.length > 0 ? (
              <ChartContainer config={cityChartConfig} className="h-[200px] w-full">
                <BarChart data={stats.topCourses} layout="vertical" margin={{ left: 8, right: 8 }}>
                  <CartesianGrid horizontal={false} strokeDasharray="3 3" />
                  <XAxis type="number" tickLine={false} axisLine={false} fontSize={11} allowDecimals={false} />
                  <YAxis type="category" dataKey="course" tickLine={false} axisLine={false} width={100} fontSize={11} />
                  <ChartTooltip content={(props: any) => <ChartTooltipContent {...props} indicator="line" />} />
                  <Bar dataKey="count" fill="var(--brand-red)" radius={4} />
                </BarChart>
              </ChartContainer>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-slate-400 text-sm">No data yet</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* CRM row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 mb-6">
        {/* Pipeline funnel */}
        <Card className="pcb-card border-slate-100 shadow-sm xl:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-sm font-semibold text-slate-900">Enrollment Pipeline</CardTitle>
              <p className="text-xs text-slate-400 mt-1">{stats?.totalContacts ?? 0} contacts across all stages</p>
            </div>
            <div className="flex items-center gap-3">
              {stats && (
                <span
                  className="flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full text-green-700 bg-green-50"
                  title="Contacts that reached Enrolled or Alumni"
                >
                  <TrendingUp className="w-3.5 h-3.5" />
                  {conversionRate}% conversion
                </span>
              )}
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
            {stats ? (
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
            ) : (
              <div className="h-[160px] flex items-center justify-center text-slate-400 text-sm">Loading…</div>
            )}
          </CardContent>
        </Card>

        {/* Recent campaigns */}
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
            {stats && stats.recentCampaigns.length > 0 ? (
              stats.recentCampaigns.map(c => (
                <div key={c._id} className="flex items-start justify-between gap-2 border-b border-slate-50 last:border-0 pb-2.5 last:pb-0">
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
      </div>

      {/* Recent Registrations */}
      <Card className="pcb-card border-slate-100 shadow-sm">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-semibold text-slate-900 text-sm">Recent Registrations</h2>
          <a
            href="/admin/users"
            className="text-xs font-semibold hover:underline flex items-center gap-1"
            style={{ color: "var(--brand-red)" }}
          >
            View all <ArrowRight className="w-3 h-3" />
          </a>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Name</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Email</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">City</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Interested In</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Joined</th>
              </tr>
            </thead>
            <tbody>
              {stats?.recentUsers?.length ? (
                stats.recentUsers.map(u => (
                  <tr key={u._id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-3.5 font-medium text-slate-900">{u.name}</td>
                    <td className="px-6 py-3.5 text-slate-500">{u.email}</td>
                    <td className="px-6 py-3.5 text-slate-500">{u.city || "—"}</td>
                    <td className="px-6 py-3.5 text-slate-500">{u.interestedCourse || "—"}</td>
                    <td className="px-6 py-3.5 text-slate-400 text-xs">
                      {new Date(u.createdAt).toLocaleDateString("en-GB")}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-slate-400 text-sm">
                    No registrations yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
