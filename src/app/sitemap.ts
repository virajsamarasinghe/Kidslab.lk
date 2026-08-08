import type { MetadataRoute } from "next";
import { SITE_URL } from "@/config/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = SITE_URL;
  const now  = new Date();

  return [
    {
      url:             base,
      lastModified:    now,
      changeFrequency: "weekly",
      priority:        1.0,
    },
    {
      url:             `${base}/register`,
      lastModified:    now,
      changeFrequency: "monthly",
      priority:        0.9,
    },
  ];
}
