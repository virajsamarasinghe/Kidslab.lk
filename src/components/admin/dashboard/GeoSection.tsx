import { MapPin, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getGeoStats } from "@/lib/dashboard-stats";
import MapPanel from "./MapPanel";
import { LazyRankedBarChart } from "./charts/lazy";

export function GeoSectionSkeleton() {
  return (
    <>
      <Card className="pcb-card border-slate-100 shadow-sm mb-6">
        <CardContent className="py-5">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-5">
            <div className="h-[380px] rounded-lg bg-slate-50 animate-pulse" />
            <div className="h-[380px] rounded-lg bg-slate-50 animate-pulse" />
          </div>
        </CardContent>
      </Card>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 mb-6">
        {[0, 1].map(i => (
          <Card key={i} className="pcb-card border-slate-100 shadow-sm">
            <CardContent className="py-5">
              <div className="h-[200px] rounded-lg bg-slate-50 animate-pulse" />
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}

export default async function GeoSection() {
  const geo = await getGeoStats();

  const mappedRegistrations = geo.mapCities.reduce((sum, c) => sum + c.count, 0);
  // Districts that actually have registrations, biggest first — the map only
  // shows intensity, so the list gives exact counts per district.
  const registeredDistricts = [...geo.mapDistricts].sort((a, b) => b.value - a.value);
  const topDistrictCount = registeredDistricts[0]?.value ?? 0;

  return (
    <>
      <Card className="pcb-card border-slate-100 shadow-sm mb-6">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle className="text-sm font-semibold text-slate-900 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" style={{ color: "var(--brand-red)" }} />
              Registrations Across Sri Lanka
            </CardTitle>
            <p className="text-xs text-slate-400 mt-1">
              {mappedRegistrations} plotted across {registeredDistricts.length} district
              {registeredDistricts.length === 1 ? "" : "s"}
              {geo.unmatchedCities > 0 ? ` · ${geo.unmatchedCities} unmatched city entries` : ""}
            </p>
          </div>
          {geo.unmatchedCityList.length > 0 && (
            <details className="relative text-xs text-slate-400 shrink-0">
              <summary className="cursor-pointer select-none hover:text-slate-600 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                Unmatched cities
              </summary>
              <ul className="absolute right-0 mt-1 z-10 bg-white border border-slate-100 rounded-md shadow-md p-2 min-w-[180px] max-h-[220px] overflow-y-auto">
                {geo.unmatchedCityList.map(c => (
                  <li key={c.city} className="flex items-center justify-between gap-3 py-0.5 text-slate-600">
                    <span className="truncate">{c.city}</span>
                    <span className="font-semibold text-slate-900 tabular-nums shrink-0">{c.count}</span>
                  </li>
                ))}
              </ul>
            </details>
          )}
        </CardHeader>
        <CardContent className="pb-4">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-5">
            <MapPanel districts={geo.mapDistricts} cities={geo.mapCities} />

            <div className="flex flex-col min-w-0">
              <div className="flex items-baseline justify-between mb-2">
                <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-wide">
                  Registered Districts
                </h3>
                <span className="text-xs text-slate-400">{registeredDistricts.length}</span>
              </div>

              {registeredDistricts.length === 0 ? (
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

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 mb-6">
        <Card className="pcb-card border-slate-100 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-slate-900">Top Cities</CardTitle>
          </CardHeader>
          <CardContent className="pb-4">
            {geo.topCities.length > 0 ? (
              <LazyRankedBarChart data={geo.topCities} categoryKey="city" categoryWidth={80} />
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
            {geo.topCourses.length > 0 ? (
              <LazyRankedBarChart
                data={geo.topCourses}
                categoryKey="course"
                categoryWidth={100}
                fill="var(--brand-red)"
              />
            ) : (
              <div className="h-[200px] flex items-center justify-center text-slate-400 text-sm">No data yet</div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
