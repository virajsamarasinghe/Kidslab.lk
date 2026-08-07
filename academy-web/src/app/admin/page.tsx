"use client";

import { useEffect, useState } from "react";
import { Users, BookOpen, CheckCircle, TrendingUp, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface Stats {
  totalUsers: number;
  totalCourses: number;
  activeCourses: number;
  recentUsers: Array<{
    _id: string;
    name: string;
    email: string;
    city: string;
    interestedCourse: string;
    createdAt: string;
  }>;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    fetch("/api/stats").then(r => r.json()).then(setStats);
  }, []);

  const cards = [
    { label: "Total Students",    value: stats?.totalUsers ?? "—",    icon: Users,        bg: "rgba(15,36,24,0.06)",   color: "var(--brand-navy)" },
    { label: "Total Courses",     value: stats?.totalCourses ?? "—",  icon: BookOpen,     bg: "rgba(224,138,60,0.12)", color: "var(--brand-red)"  },
    { label: "Active Courses",    value: stats?.activeCourses ?? "—", icon: CheckCircle,  bg: "rgba(22,163,74,0.10)",  color: "#16a34a"           },
    { label: "Growth",            value: "↑ Growing",                 icon: TrendingUp,   bg: "rgba(43,95,224,0.10)",  color: "var(--brand-blue)" },
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

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
        {cards.map(({ label, value, icon: Icon, bg, color }) => (
          <Card key={label} className="pcb-card border-slate-100 shadow-sm">
            <CardContent className="p-6 flex items-center gap-4">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                style={{ backgroundColor: bg }}
              >
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
