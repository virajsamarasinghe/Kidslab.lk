import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Register for Free Seminar — 27 June 2026",
  description:
    "Register for kidslab.lk's free Robotics & AI introductory seminar on 27 June 2026. Limited seats available for children aged 9–14 in Galle, Sri Lanka. No obligation — Day 1 is completely free.",
  alternates: { canonical: "https://kidslab.lk/register" },
  openGraph: {
    title: "Register for the Free Seminar | kidslab.lk",
    description:
      "Secure your child's spot at our free Robotics & AI seminar on 27 June 2026. Ages 9–14. Hapugala, Galle, Sri Lanka.",
    url: "https://kidslab.lk/register",
    images: [{ url: "/og-cover.png", width: 1200, height: 630, alt: "kidslab.lk — Robotics & AI Academy for Kids" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Register for the Free Seminar | kidslab.lk",
    description:
      "Secure your child's spot at our free Robotics & AI seminar on 27 June 2026. Ages 9–14. Hapugala, Galle, Sri Lanka.",
    images: ["/og-cover.png"],
  },
};

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
