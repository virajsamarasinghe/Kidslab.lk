"use client";

import { useEffect, useRef, useState } from "react";
import HighchartsReact from "highcharts-react-official";
import Highcharts from "highcharts/highmaps";
import proj4 from "proj4";
import type { MapDistrict, MapCity } from "@/types/dashboard";

export type { MapDistrict, MapCity };

const TOPOLOGY_URL = "/maps/lk-all.geo.json";

export default function SriLankaMap({
  districts,
  cities,
  loading,
}: {
  districts: MapDistrict[];
  cities: MapCity[];
  loading: boolean;
}) {
  const [topology, setTopology] = useState<unknown>(null);
  const chartRef = useRef<HighchartsReact.RefObject>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(TOPOLOGY_URL)
      .then(r => r.json())
      .then(data => {
        if (!cancelled) setTopology(data);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const ready = topology && !loading;

  const options: Highcharts.Options = {
    chart: {
      map: topology ?? undefined,
      backgroundColor: "transparent",
      height: 380,
      proj4,
    } as Highcharts.ChartOptions & { proj4: typeof proj4 },
    title: { text: undefined },
    credits: { enabled: false },
    mapNavigation: {
      enabled: true,
      buttonOptions: { verticalAlign: "bottom" },
    },
    colorAxis: {
      min: 0,
      minColor: "rgba(15,36,24,0.06)",
      maxColor: "var(--brand-red, #e08a3c)" as unknown as string,
    },
    legend: {
      layout: "horizontal",
      align: "left",
      verticalAlign: "bottom",
      floating: true,
      symbolHeight: 10,
      itemStyle: { fontSize: "10px", color: "#64748b" },
    },
    tooltip: {
      useHTML: true,
      backgroundColor: "#0f2418",
      borderWidth: 0,
      style: { color: "#fff", fontSize: "12px" },
      formatter: function (this: Highcharts.Point) {
        const point = this as unknown as { name?: string; value?: number; z?: number; series: { type: string } };
        const count = point.series.type === "mapbubble" ? point.z ?? 0 : point.value ?? 0;
        return `<b>${point.name}</b><br/>${count} registration${count === 1 ? "" : "s"}`;
      },
    },
    series: [
      {
        type: "map",
        name: "Registrations",
        data: districts as unknown as Highcharts.SeriesMapDataOptions[],
        joinBy: "hc-key",
        nullColor: "rgba(15,36,24,0.04)",
        borderColor: "#fff",
        borderWidth: 0.5,
        states: { hover: { color: "var(--brand-yellow, #f2c14e)" as unknown as string } },
      },
      {
        type: "mapbubble",
        name: "City",
        data: cities.map(c => ({ name: c.name, lat: c.lat, lon: c.lon, z: c.count })),
        colorAxis: false,
        minSize: 6,
        maxSize: 26,
        color: "var(--brand-navy, #0f2418)" as unknown as string,
        fillOpacity: 0.75,
        marker: { lineColor: "#fff", lineWidth: 1 },
      } as unknown as Highcharts.SeriesMapbubbleOptions,
    ],
  };

  if (!ready) {
    return (
      <div className="h-[380px] flex items-center justify-center text-slate-400 text-sm">
        {loading ? "Loading…" : "Loading map…"}
      </div>
    );
  }

  return (
    <HighchartsReact
      highcharts={Highcharts}
      constructorType="mapChart"
      options={options}
      ref={chartRef}
    />
  );
}
