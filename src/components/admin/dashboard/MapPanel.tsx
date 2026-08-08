"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import type { MapDistrict, MapCity } from "@/types/dashboard";

const SriLankaMap = dynamic(() => import("@/components/admin/SriLankaMap"), {
  ssr: false,
  loading: () => <MapPlaceholder />,
});

function MapPlaceholder() {
  return (
    <div className="h-[380px] w-full animate-pulse rounded-lg bg-slate-50" />
  );
}

/**
 * Highmaps + proj4 + the district topology are the heaviest thing on this page
 * and the map sits below the fold, so it only loads once the panel is actually
 * scrolled near the viewport.
 */
export default function MapPanel({
  districts,
  cities,
}: {
  districts: MapDistrict[];
  cities: MapCity[];
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    if (typeof IntersectionObserver === "undefined") {
      // No observer support — fall back to loading the map straight away.
      const frame = requestAnimationFrame(() => setVisible(true));
      return () => cancelAnimationFrame(frame);
    }

    const observer = new IntersectionObserver(
      entries => {
        if (entries.some(e => e.isIntersecting)) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px" }
    );
    observer.observe(host);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={hostRef}>
      {visible ? <SriLankaMap districts={districts} cities={cities} loading={false} /> : <MapPlaceholder />}
    </div>
  );
}
