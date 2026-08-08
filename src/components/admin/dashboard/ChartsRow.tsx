import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCoreStats } from "@/lib/dashboard-stats";
import { LazySignupTrendChart, LazyStatusDonut } from "./charts/lazy";

export function ChartsRowSkeleton() {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 mb-6">
      <Card className="pcb-card border-slate-100 shadow-sm xl:col-span-2">
        <CardContent className="py-5">
          <div className="h-[220px] rounded-lg bg-slate-50 animate-pulse" />
        </CardContent>
      </Card>
      <Card className="pcb-card border-slate-100 shadow-sm">
        <CardContent className="py-5">
          <div className="h-[220px] rounded-lg bg-slate-50 animate-pulse" />
        </CardContent>
      </Card>
    </div>
  );
}

export default async function ChartsRow() {
  const stats = await getCoreStats();
  const isPositive = stats.weeklyGrowth >= 0;

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 mb-6">
      <Card className="pcb-card border-slate-100 shadow-sm xl:col-span-2">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle className="text-sm font-semibold text-slate-900">Registrations — Last 14 Days</CardTitle>
            <p className="text-xs text-slate-400 mt-1">{stats.usersThisWeek} new this week</p>
          </div>
          <div
            className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${
              isPositive ? "text-green-700 bg-green-50" : "text-red-600 bg-red-50"
            }`}
          >
            {isPositive ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
            {Math.abs(stats.weeklyGrowth)}% vs last week
          </div>
        </CardHeader>
        <CardContent className="pb-4">
          <LazySignupTrendChart data={stats.signupTrend} />
        </CardContent>
      </Card>

      <Card className="pcb-card border-slate-100 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-slate-900">Student Status</CardTitle>
          <p className="text-xs text-slate-400 mt-1">Active vs inactive</p>
        </CardHeader>
        <CardContent className="flex flex-col items-center pb-4">
          <LazyStatusDonut activeUsers={stats.activeUsers} inactiveUsers={stats.inactiveUsers} />
          <div className="flex items-center gap-4 mt-2">
            <span className="flex items-center gap-1.5 text-xs text-slate-500">
              <span className="w-2 h-2 rounded-full bg-green-600" /> Active {stats.activeUsers}
            </span>
            <span className="flex items-center gap-1.5 text-xs text-slate-500">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: "var(--brand-red)" }} /> Inactive{" "}
              {stats.inactiveUsers}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
