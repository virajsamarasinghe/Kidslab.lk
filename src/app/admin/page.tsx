"use client";

import { useEffect, useState } from "react";
import {
  Users, BookOpen, CheckCircle, Mail, ArrowRight, ArrowUpRight, ArrowDownRight,
  GraduationCap, Contact2, Send, Filter,
} from "lucide-react";
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
    status: "draft" | "sending" | "sent" | "failed";
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

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    fetch("/api/stats").then(r => r.json()).then(setStats);
  }, []);

  const cards = [
    { label: "Total Students", value: stats?.totalUsers ?? "—", icon: Users, bg: "rgba(15,36,24,0.06)", color: "var(--brand-navy)" },
    { label: "Active Courses", value: stats ? `${stats.activeCourses}/${stats.totalCourses}` : "—", icon: BookOpen, bg: "rgba(224,138,60,0.12)", color: "var(--brand-red)" },
    { label: "Active Students", value: stats?.activeUsers ?? "—", icon: CheckCircle, bg: "rgba(22,163,74,0.10)", color: "#16a34a" },
    { label: "Newsletter Subscribers", value: stats?.totalSubscribers ?? "—", icon: Mail, bg: "rgba(43,95,224,0.10)", color: "var(--brand-blue)" },
  ];

  const secondaryCards = [
    { label: "Instructors", value: stats?.totalInstructors ?? "—", icon: GraduationCap, bg: "rgba(147,51,234,0.10)", color: "#9333ea" },
    { label: "CRM Contacts", value: stats?.totalContacts ?? "—", icon: Contact2, bg: "rgba(43,95,224,0.10)", color: "var(--brand-blue)" },
    { label: "Campaigns Sent", value: stats ? `${stats.campaignsSent}/${stats.totalCampaigns}` : "—", icon: Send, bg: "rgba(224,138,60,0.12)", color: "var(--brand-red)" },
    {
      label: "Enrolled → Alumni",
      value: stats ? stats.pipeline.find(p => p.stage === "enrolled")?.count ?? 0 : "—",
      icon: Filter,
      bg: "rgba(22,163,74,0.10)",
      color: "#16a34a",
    },
  ];

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

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-6">
        {cards.map(({ label, value, icon: Icon, bg, color }) => (
          <Card key={label} className="pcb-card border-slate-100 shadow-sm">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: bg }}>
                <Icon className="w-6 h-6" style={{ color }} />
              </div>
              <div>
                <p className="text-2xl font-extrabold text-slate-900 tracking-tight leading-none">{value}</p>
                <p className="text-xs text-slate-400 mt-1 font-medium">{label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Secondary stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-6">
        {secondaryCards.map(({ label, value, icon: Icon, bg, color }) => (
          <Card key={label} className="pcb-card border-slate-100 shadow-sm">
            <CardContent className="p-5 flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: bg }}>
                <Icon className="w-5 h-5" style={{ color }} />
              </div>
              <div>
                <p className="text-xl font-extrabold text-slate-900 tracking-tight leading-none">{value}</p>
                <p className="text-xs text-slate-400 mt-1 font-medium">{label}</p>
              </div>
            </CardContent>
          </Card>
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
            <a
              href="/admin/crm/pipeline"
              className="text-xs font-semibold hover:underline flex items-center gap-1"
              style={{ color: "var(--brand-red)" }}
            >
              Open board <ArrowRight className="w-3 h-3" />
            </a>
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
