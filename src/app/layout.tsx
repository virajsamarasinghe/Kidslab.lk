import type { Metadata } from "next";
import { Geist, Geist_Mono, Noto_Sans_Sinhala, Space_Grotesk } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { Analytics } from "@vercel/analytics/next";
import { SITE_URL, SITE_NAME } from "@/config/site";
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

const DESCRIPTION =
  "Sri Lanka's #1 Robotics & AI academy for children aged 9–14. Hands-on programs designed and taught by Computer Engineers from the University of Ruhuna, Faculty of Engineering. Free introductory seminar on 27 June 2026 — limited seats, register now.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),

  title: {
    default: `${SITE_NAME} — Robotics & AI Academy for Kids | Galle, Sri Lanka`,
    template: `%s | ${SITE_NAME}`,
  },

  description: DESCRIPTION,

  keywords: [
    "robotics academy Sri Lanka",
    "AI academy for kids Sri Lanka",
    "coding classes kids Galle",
    "STEM education Sri Lanka",
    "robotics classes children Sri Lanka",
    "kidslab.lk",
    "AI robotics program kids",
    "University of Ruhuna academy",
    "kids programming Sri Lanka",
    "robotics Galle Sri Lanka",
    "free seminar robotics AI",
    "children STEM Galle",
  ],

  authors: [
    { name: "Viraj Samarasinghe", url: SITE_URL },
    { name: "Menura Dulkith",     url: SITE_URL },
  ],
  creator:   SITE_NAME,
  publisher: SITE_NAME,

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },

  icons: {
    icon: [
      { url: "/og-image.png", type: "image/png", sizes: "512x512" },
    ],
    shortcut: ["/og-image.png"],
    apple: [
      { url: "/og-image.png", sizes: "512x512", type: "image/png" },
    ],
  },

  openGraph: {
    type:        "website",
    locale:      "en_LK",
    url:          SITE_URL,
    siteName:     SITE_NAME,
    title:       `${SITE_NAME} — Robotics & AI Academy for Kids`,
    description:  DESCRIPTION,
    images: [
      {
        url:    "/og-cover.png",
        width:  1200,
        height: 630,
        alt:    "kidslab.lk — Robotics & AI Academy for Kids, Galle, Sri Lanka",
      },
    ],
  },

  twitter: {
    card:        "summary_large_image",
    title:       `${SITE_NAME} — Robotics & AI Academy for Kids`,
    description:  DESCRIPTION,
    images:      ["/og-cover.png"],
  },

  alternates: {
    canonical: SITE_URL,
  },

  verification: {
    google: "CfMuSDh9YhqTrRtebz6FMzLUyreCuosJgNQP2c9SRFc",
  },

  category: "education",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html
        lang="en"
        className={`${geistSans.variable} ${geistMono.variable} ${spaceGrotesk.variable} ${notoSansSinhala.variable} h-full antialiased`}
        suppressHydrationWarning
      >
        <body className="min-h-full flex flex-col bg-white text-slate-900">
          {children}
          <Analytics />
        </body>
      </html>
    </ClerkProvider>
  );
}
