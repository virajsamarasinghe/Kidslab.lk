import { Suspense } from "react";
import { getCoreStats } from "@/lib/dashboard-stats";
import KpiGrid, { KpiGridSkeleton } from "@/components/admin/dashboard/KpiGrid";
import ChartsRow, { ChartsRowSkeleton } from "@/components/admin/dashboard/ChartsRow";
import GeoSection, { GeoSectionSkeleton } from "@/components/admin/dashboard/GeoSection";
import RevenueSection, { RevenueSectionSkeleton } from "@/components/admin/dashboard/RevenueSection";
import PipelineCard from "@/components/admin/dashboard/PipelineCard";
import RecentCampaignsCard from "@/components/admin/dashboard/RecentCampaignsCard";
import RecentRegistrations from "@/components/admin/dashboard/RecentRegistrations";
import CrmRowSkeleton from "@/components/admin/dashboard/CrmRowSkeleton";
import RefreshButton from "@/components/admin/dashboard/RefreshButton";

async function KpiSection() {
  return <KpiGrid stats={await getCoreStats()} />;
}

async function CrmSection() {
  const stats = await getCoreStats();
  return (
    <>
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 mb-6">
        <PipelineCard pipeline={stats.pipeline} totalContacts={stats.totalContacts} />
        <RecentCampaignsCard campaigns={stats.recentCampaigns} />
      </div>
      <RecentRegistrations users={stats.recentUsers} />
    </>
  );
}

/**
 * Rendered on the server and streamed section by section: the header and
 * skeletons go out in the first flush, the cheap counts land as soon as they
 * resolve, and the heavier city/district aggregation arrives without holding up
 * anything else. Nothing waits on client-side hydration to start fetching.
 */
export default function AdminDashboard() {
  return (
    <div className="p-8">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1
            className="text-2xl font-bold text-slate-900 tracking-tight"
            style={{ fontFamily: "var(--font-display), var(--font-sans), system-ui, sans-serif" }}
          >
            Dashboard
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Welcome back, Admin ·{" "}
            <span style={{ color: "var(--brand-navy)" }}>
              kid<span style={{ color: "var(--brand-red)" }}>s</span>lab.lk
            </span>
          </p>
        </div>
        <RefreshButton />
      </div>

      <Suspense fallback={<KpiGridSkeleton />}>
        <KpiSection />
      </Suspense>

      <Suspense fallback={<RevenueSectionSkeleton />}>
        <RevenueSection />
      </Suspense>

      <Suspense fallback={<ChartsRowSkeleton />}>
        <ChartsRow />
      </Suspense>

      <Suspense fallback={<GeoSectionSkeleton />}>
        <GeoSection />
      </Suspense>

      <Suspense fallback={<CrmRowSkeleton />}>
        <CrmSection />
      </Suspense>
    </div>
  );
}
