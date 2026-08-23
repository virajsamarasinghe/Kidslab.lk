import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Noto_Sans_Sinhala, Space_Grotesk } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { GoogleAnalytics, GoogleTagManager } from "@next/third-parties/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { GTM_ID, GA_MEASUREMENT_ID } from "@/config/site";
import { buildMetadata, getSeoConfig } from "@/lib/seo";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const notoSansSinhala = Noto_Sans_Sinhala({
  variable: "--font-sinhala",
  subsets: ["sinhala"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

/**
 * Site-wide metadata, read from the `seo` section of the Settings document so
 * titles, descriptions, keywords, social cards and verification tags can be
 * edited at /admin/settings/seo without a deploy. Falls back to the shipped
 * values in `@/config/seo` for any field left blank — or entirely, if Mongo is
 * unreachable — so the site can never render an empty <head>.
 */
export async function generateMetadata(): Promise<Metadata> {
  return buildMetadata(await getSeoConfig(), "/");
}

/* Mobile chrome. `viewportFit: "cover"` lets the sticky mobile CTA bar
   paint into the home-indicator area (it pads itself back off with
   env(safe-area-inset-bottom)). maximumScale is deliberately left
   unset — capping zoom breaks pinch-to-zoom for low-vision users. */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7f5ee" },
    { media: "(prefers-color-scheme: dark)", color: "#0f2418" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider
      appearance={{
        variables: {
          colorPrimary: "#0f2418",
          colorForeground: "#0f2418",
          colorMutedForeground: "#64748b",
          colorBackground: "#ffffff",
          colorInput: "#ffffff",
          colorInputForeground: "#0f2418",
          colorDanger: "#dc2626",
          colorSuccess: "#16a34a",
          colorNeutral: "#0f2418",
          borderRadius: "0.75rem",
          fontFamily: "var(--font-sans), system-ui, sans-serif",
        },
        elements: {
          rootBox: "font-sans",
          // Force the modal overlay to be a fixed, full-viewport, centered
          // flex container above the sticky navbar (z-50) regardless of
          // where clerk-js mounts it in the DOM. Constrain width so the
          // card can't overflow narrow viewports (that overflow is what
          // reads as "blurry" text on mobile — the card gets squeezed
          // past its default min-width instead of reflowing).
          modalBackdrop: "!fixed !inset-0 !z-[100] !flex !items-center !justify-center !p-3 sm:!p-4 !bg-black/60 !backdrop-blur-sm",
          modalContent: "!static !top-auto !left-auto !right-auto !bottom-auto !translate-x-0 !translate-y-0 !w-full !max-w-[400px] !max-h-[90vh] !overflow-y-auto",
          card: "shadow-xl border border-slate-100 rounded-2xl !w-full",
          headerTitle: "font-extrabold tracking-tight",
          headerSubtitle: "text-slate-500",
          socialButtonsBlockButton: "rounded-full border-slate-200 hover:bg-slate-50",
          dividerLine: "bg-slate-200",
          dividerText: "text-slate-400",
          formFieldLabel: "text-slate-600 font-medium",
          formFieldInput: "rounded-lg border-slate-200 focus:border-[#0f2418]",
          formButtonPrimary: "!bg-[#e08a3c] hover:!bg-[color-mix(in_srgb,#e08a3c_85%,black)] text-white font-semibold rounded-full normal-case",
          footerActionLink: "font-semibold text-[#e08a3c] hover:text-[#c9762e]",
          identityPreviewEditButton: "text-[#e08a3c]",
          // Hide the "Secured by Clerk" branding badge without removing the
          // sign-in/sign-up footer action link next to it.
          footer: {
            "& > div:last-child": { display: "none" },
          },
        },
      }}
    >
      <html
        lang="en"
        className={`${geistSans.variable} ${geistMono.variable} ${spaceGrotesk.variable} ${notoSansSinhala.variable} h-full antialiased`}
        suppressHydrationWarning
      >
        {/* Google Tag Manager. The official Next integration injects GTM's
            own loader script and also fires a `pageview` on client-side route
            changes, which the raw GTM snippet cannot see in an App Router
            SPA — a hand-pasted snippet would only ever record the first
            page of a visit. */}
        <GoogleTagManager gtmId={GTM_ID} />
        <body className="min-h-full flex flex-col bg-white text-slate-900">
          {/* GTM's no-JavaScript fallback, required immediately after <body>. */}
          <noscript>
            <iframe
              src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
              height="0"
              width="0"
              style={{ display: "none", visibility: "hidden" }}
            />
          </noscript>
          {children}
          <Analytics />
          <SpeedInsights />
        </body>
        {/* GA4 via gtag.js. Like the GTM component above, this also sends a
            page_view on client-side route changes — the raw gtag snippet only
            ever reports the landing page in an App Router app. */}
        <GoogleAnalytics gaId={GA_MEASUREMENT_ID} />
      </html>
    </ClerkProvider>
  );
}
