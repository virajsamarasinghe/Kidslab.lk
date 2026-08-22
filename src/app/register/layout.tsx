import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Register — Free Kids AI & Robotics Seminar, 19 September 2026",
  description:
    "Register for the free introductory seminar at kidslab.lk, Sri Lanka's first AI & Robotics academy for kids. Live online, ages 9–14, open from Colombo to Matara. Limited seats — Day 1 is completely free, with no obligation to enrol.",
  keywords: [
    "kids AI class Sri Lanka registration",
    "free robotics seminar Sri Lanka",
    "AI classes for children Sri Lanka",
    "register kids robotics class Sri Lanka",
  ],
  alternates: { canonical: "https://kidslab.lk/register" },
  openGraph: {
    title: "Register for the Free Kids AI & Robotics Seminar | kidslab.lk",
    description:
      "Secure your child's spot at Sri Lanka's first Kids AI & Robotics academy. Free seminar on 19 September 2026. Ages 9–14, 100% online — join from anywhere in Sri Lanka.",
    url: "https://kidslab.lk/register",
    images: [{ url: "/og-cover.png", width: 1200, height: 630, alt: "kidslab.lk — Robotics & AI Academy for Kids" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Register for the Free Kids AI & Robotics Seminar | kidslab.lk",
    description:
      "Secure your child's spot at Sri Lanka's first Kids AI & Robotics academy. Free seminar on 19 September 2026. Ages 9–14, 100% online — join from anywhere in Sri Lanka.",
    images: ["/og-cover.png"],
  },
};

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
