import type { NextConfig } from "next";

/**
 * Baseline security headers.
 *
 * No CSP here: this app renders Clerk, Cloudinary, Highcharts and Google
 * fonts, and a `script-src` tight enough to be worth having would need a nonce
 * threaded through the whole render. A wrong CSP breaks the site silently, so
 * that belongs in its own change with a report-only rollout first.
 */
const securityHeaders = [
  // The admin dashboard has no reason to be framed — this blocks clickjacking.
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },
  // Only meaningful over HTTPS; browsers ignore it on plain HTTP, so it's safe
  // to send in development too.
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
];

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
    ],
  },
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      // Belt and braces: the dashboard must never be indexed or cached by a
      // shared proxy, independent of the per-page metadata.
      {
        source: "/admin/:path*",
        headers: [
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
          { key: "Cache-Control", value: "private, no-store" },
        ],
      },
    ];
  },
};

export default nextConfig;
