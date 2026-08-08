import { ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import type { CoreStats } from "@/lib/dashboard-stats";

const COLUMNS = ["Name", "Email", "City", "Interested In", "Joined"];

export default function RecentRegistrations({
  users,
}: {
  users: CoreStats["recentUsers"];
}) {
  return (
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
              {COLUMNS.map(col => (
                <th
                  key={col}
                  className="text-left px-6 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.length ? (
              users.map(u => (
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
                <td colSpan={COLUMNS.length} className="px-6 py-10 text-center text-slate-400 text-sm">
                  No registrations yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
