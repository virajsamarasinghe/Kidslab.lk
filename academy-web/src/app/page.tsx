"use client";

import AnimateIn from "@/components/AnimateIn";
import CountUp from "@/components/CountUp";
import FacebookIcon from "@/components/FacebookIcon";
import I18nProvider from "@/components/I18nProvider";
import LoadingScreen from "@/components/LoadingScreen";
import Navbar from "@/components/Navbar";
import RegisterModal from "@/components/RegisterModal";
import SubscribePopup from "@/components/SubscribePopup";
import WhatsAppIcon from "@/components/WhatsAppIcon";
import { LocaleProvider, useLocale } from "@/lib/locale-context";
import { RegisterModalProvider, useRegisterModal } from "@/lib/register-modal-context";
import { Button } from "@/components/ui/button";
import {
    ArrowRight,
    Award,
    CheckCircle,
    ChevronRight,
    FlaskConical,
    GraduationCap,
    MapPin,
    Star,
    Target,
    Users,
    Zap,
} from "lucide-react";
import { motion, useScroll, useTransform } from "motion/react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";

/* ─── Data ─── */

const founders = [
  {
    name: "Viraj Samarasinghe",
    role: "Software Engineer · AI Specialized",
    photo: "/viraj.jpg",
    linkedin: "https://www.linkedin.com/in/virajsamarasinghe/",
    tags: ["AI & Machine Learning", "Robotics", "Embedded Systems"],
  },
  {
    name: "Menura Dulkith",
    role: "Software Engineer · AI Specialized",
    photo: "/menura.jpg",
    linkedin: "https://www.linkedin.com/in/menuradulkith/",
    tags: ["AI & Machine Learning", "Robotics", "Embedded Systems"],
  },
];

const stats = [
  { value: "50+", label: "Young Innovators" },
  { value: "5+", label: "Expert Engineers" },
  { value: "1", label: "Program" },
  { value: "100%", label: "Hands-on Learning" },
];

const whyUs = [
  {
    icon: Target,
    title: "Project-Based Learning",
    desc: "Every lesson ends with a real build. Kids learn by doing, not just watching.",
    color: "text-blue-600",
    bg: "bg-blue-50",
  },
  {
    icon: Award,
    title: "Industry Expert Educators",
    desc: "Curriculum designed and taught by Computer Engineering graduates from the University of Ruhuna, now industry professionals.",
    color: "text-violet-600",
    bg: "bg-violet-50",
  },
  {
    icon: Users,
    title: "Small Class Sizes",
    desc: "Max 50 students per class ensures every child gets personal attention and guidance.",
    color: "text-teal-600",
    bg: "bg-teal-50",
  },
  {
    icon: FlaskConical,
    title: "Real Lab Equipment",
    desc: "Actual robotics kits, sensors, microcontrollers — not simulations.",
    color: "text-orange-600",
    bg: "bg-orange-50",
  },
  {
    icon: GraduationCap,
    title: "Age-Appropriate Tracks",
    desc: "Programs designed for ages 8–18, with difficulty scaling as they grow.",
    color: "text-green-600",
    bg: "bg-green-50",
  },
  {
    icon: Zap,
    title: "Fast, Fun & Engaging",
    desc: "Gamified challenges, team projects, and showcases keep kids excited to learn.",
    color: "text-amber-600",
    bg: "bg-amber-50",
  },
];

const testimonials = [
  {
    name: "Kavisha Fernando",
    role: "Parent · Galle",
    quote:
      "My daughter was nervous at first, but after the first class she couldn't stop talking about robots. The engineers make it so fun and easy to understand.",
    stars: 5,
  },
  {
    name: "Tharindu Perera",
    role: "Student · Age 13",
    quote:
      "I built my first robot here! The teachers are from a real university and they explain everything step by step. I want to become an engineer now.",
    stars: 5,
  },
  {
    name: "Nimal Jayasinghe",
    role: "Parent · Matara",
    quote:
      "The quality is outstanding. Real university engineers teaching kids — I'm impressed by how much my son has learned in just 3 months.",
    stars: 5,
  },
];

const BLUE_GRADIENT = "linear-gradient(to right, var(--brand-blue), #1a3fa0)";
const COPPER_GRADIENT = "linear-gradient(to right, var(--brand-red), #b8651f)";

function getHeroSentences(t: ReturnType<typeof useTranslations>) {
  return [
    [
      { text: t("hero.sentence1.part1") },
      { text: t("hero.sentence1.highlight1"), gradient: BLUE_GRADIENT },
      { text: t("hero.sentence1.part2") },
      { text: t("hero.sentence1.highlight2"), gradient: COPPER_GRADIENT },
      { text: t("hero.sentence1.part3") },
    ],
    [
      { text: t("hero.sentence2.part1") },
      { text: t("hero.sentence2.highlight1"), gradient: BLUE_GRADIENT },
      { text: t("hero.sentence2.part2") },
      { text: t("hero.sentence2.highlight2"), gradient: COPPER_GRADIENT },
      { text: t("hero.sentence2.part3") },
    ],
  ];
}

/* ─── Reusable section label ─── */
function SectionLabel({
  children,
  className = "",
  style,
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div className="inline-flex flex-col items-center mb-3">
      <p
        className={`text-label ${className || (style ? "" : "text-[color:var(--brand-red)]")}`}
        style={style}
      >
        {children}
      </p>
      <span className="pcb-trace w-10 mt-2" />
    </div>
  );
}

/* ── Footer newsletter form ──
   Same /api/subscribers endpoint as the popup, condensed to a single
   inline input + button for the footer. */
function FooterSubscribe({
  heading,
  placeholder,
  cta,
  success,
  error,
}: {
  heading: string;
  placeholder: string;
  cta: string;
  success: string;
  error: string;
}) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    const res = await fetch("/api/subscribers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    setStatus(res.ok ? "success" : "error");
    if (res.ok) setEmail("");
  }

  return (
    <div className="w-full max-w-[280px]">
      <p className="text-label text-slate-500 mb-4">{heading}</p>
      {status === "success" ? (
        <p className="flex items-center gap-2 text-green-400 text-sm">
          <CheckCircle className="w-4 h-4 shrink-0" />
          {success}
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="email"
            required
            placeholder={placeholder}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="min-w-0 flex-1 rounded-full bg-white/5 border border-white/10 px-4 py-2 text-sm text-white placeholder:text-slate-500 outline-none focus:border-white/30 transition-colors"
          />
          <button
            type="submit"
            disabled={status === "loading"}
            className="btn-brand-copper shrink-0 rounded-full w-9 h-9 flex items-center justify-center text-white disabled:opacity-60 transition-opacity"
            aria-label={cta}
          >
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      )}
      {status === "error" && (
        <p className="text-red-400 text-xs mt-2">{error}</p>
      )}
    </div>
  );
}

/* ── Hero headline typewriter ──
   Cycles through several sentences: types one out, pauses with a
   blinking cursor, deletes it, then types the next — like a terminal
   waiting on input. Respects prefers-reduced-motion by holding on the
   first sentence, fully typed, with no motion. */
type TypingSegment = { text: string; gradient?: string };

function TypingHeadline({
  sentences,
  srText,
}: {
  sentences: TypingSegment[][];
  srText: string;
}) {
  const [sentenceIndex, setSentenceIndex] = useState(0);
  const [count, setCount] = useState(0);
  const [phase, setPhase] = useState<"typing" | "pausing" | "deleting">("typing");

  const segments = sentences[sentenceIndex];
  const totalLength = segments.reduce((sum, s) => sum + s.text.length, 0);

  useEffect(() => {
    const reduceMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduceMotion) {
      setCount(sentences[0].reduce((sum, s) => sum + s.text.length, 0));
      setPhase("pausing");
      return;
    }

    if (phase === "typing") {
      if (count >= totalLength) {
        const id = setTimeout(() => setPhase("pausing"), 1800);
        return () => clearTimeout(id);
      }
      const id = setTimeout(() => setCount((c) => c + 1), 38);
      return () => clearTimeout(id);
    }

    if (phase === "pausing") {
      const id = setTimeout(() => setPhase("deleting"), 1400);
      return () => clearTimeout(id);
    }

    if (phase === "deleting") {
      if (count <= 0) {
        setSentenceIndex((i) => (i + 1) % sentences.length);
        setPhase("typing");
        return;
      }
      const id = setTimeout(() => setCount((c) => c - 1), 20);
      return () => clearTimeout(id);
    }
  }, [phase, count, totalLength, sentences]);

  const idle = phase === "pausing";
  let consumed = 0;

  return (
    <>
      <span className="sr-only">{srText}</span>
      <span aria-hidden="true">
        {segments.map((seg, i) => {
          const start = consumed;
          consumed += seg.text.length;
          const visible = Math.max(0, Math.min(seg.text.length, count - start));
          const shown = seg.text.slice(0, visible);
          if (!shown) return null;
          return seg.gradient ? (
            <span
              key={i}
              className="bg-clip-text text-transparent"
              style={{ backgroundImage: seg.gradient }}
            >
              {shown}
            </span>
          ) : (
            <span key={i}>{shown}</span>
          );
        })}
        <motion.span
          className="inline-block align-middle"
          style={{
            width: 3,
            height: "0.85em",
            marginLeft: "0.15em",
            backgroundColor: "var(--brand-red)",
          }}
          animate={idle ? { opacity: [1, 1, 0, 0] } : { opacity: 1 }}
          transition={
            idle
              ? { duration: 1, times: [0, 0.5, 0.5, 1], repeat: Infinity, ease: "linear" }
              : { duration: 0 }
          }
        />
      </span>
    </>
  );
}

/* ─── Page ─── */

/* ── LinkedIn icon ── */
function LinkedInIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

export default function Home() {
  return (
    <LocaleProvider>
      <I18nProvider>
        <RegisterModalProvider>
          <HomeContent />
          <RegisterModal />
          <SubscribePopup />
        </RegisterModalProvider>
      </I18nProvider>
    </LocaleProvider>
  );
}

function HomeContent() {
  const t = useTranslations();
  const { locale } = useLocale();
  const { openRegisterModal } = useRegisterModal();
  const heroSentences = useMemo(() => getHeroSentences(t), [t]);
  const statLabels = t.raw("stats.labels") as string[];

  /* ── Smooth cross-fade whenever the language toggle switches locale ── */
  const [langFading, setLangFading] = useState(false);
  const isFirstLocaleRender = useRef(true);
  useEffect(() => {
    if (isFirstLocaleRender.current) {
      isFirstLocaleRender.current = false;
      return;
    }
    const reduceMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) return;

    setLangFading(true);
    const id = setTimeout(() => setLangFading(false), 160);
    return () => clearTimeout(id);
  }, [locale]);

  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const heroY = useTransform(scrollYProgress, [0, 1], ["0%", "18%"]);
  const bannerY = useTransform(scrollYProgress, [0, 1], ["0%", "-100%"]);

  /* ── JSON-LD structured data ── */
  const jsonLd = [
    /* 1. WebSite */
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: "kidslab.lk",
      url: "https://kidslab.lk",
      description: "Sri Lanka's Robotics & AI academy for children aged 9–14",
      potentialAction: {
        "@type": "SearchAction",
        target: "https://kidslab.lk/register",
        "query-input": "required name=search_term_string",
      },
    },
    /* 2. EducationalOrganization */
    {
      "@context": "https://schema.org",
      "@type": ["EducationalOrganization", "LocalBusiness"],
      name: "kidslab.lk",
      alternateName: "kidslab Academy",
      url: "https://kidslab.lk",
      logo: "https://kidslab.lk/logo.png",
      image: "https://kidslab.lk/logo.png",
      description:
        "Robotics & AI academy for children aged 9–14, conducted by Computer Engineers from the University of Ruhuna.",
      address: {
        "@type": "PostalAddress",
        streetAddress: "Hapugala",
        addressLocality: "Galle",
        postalCode: "80000",
        addressCountry: "LK",
      },
      geo: { "@type": "GeoCoordinates", latitude: 6.0328, longitude: 80.2168 },
      telephone: "+94703906478",
      email: "info@kidslab.lk",
      foundingDate: "2026",
      founders: [
        { "@type": "Person", name: "Viraj Samarasinghe" },
        { "@type": "Person", name: "Menura Dulkith" },
      ],
      parentOrganization: {
        "@type": "CollegeOrUniversity",
        name: "University of Ruhuna",
        department:
          "Faculty of Engineering — Department of Computer Engineering",
        address: {
          "@type": "PostalAddress",
          addressLocality: "Hapugala, Galle",
          addressCountry: "LK",
        },
      },
      sameAs: [
        "https://www.facebook.com/profile.php?id=61585638656242",
        "https://wa.me/94703906478",
      ],
    },
    /* 3. Course */
    {
      "@context": "https://schema.org",
      "@type": "Course",
      name: "Robotics & AI for Kids",
      description:
        "A 3-month hands-on program covering robotics mechanics, sensors, microcontrollers, and machine learning basics. Designed for children aged 9–14. Taught by Computer Engineers from the University of Ruhuna.",
      provider: {
        "@type": "EducationalOrganization",
        name: "kidslab.lk",
        url: "https://kidslab.lk",
      },
      educationalLevel: "Beginner",
      audience: {
        "@type": "EducationalAudience",
        educationalRole: "student",
        audienceType: "Children aged 9–14",
      },
      timeRequired: "P3M",
      numberOfCredits: 0,
      offers: {
        "@type": "Offer",
        price: "5000",
        priceCurrency: "LKR",
        availability: "https://schema.org/InStock",
        validFrom: "2026-06-27",
        url: "https://kidslab.lk/register",
        description:
          "Payable in installments within 3 months. Day 1 is a FREE seminar.",
      },
      hasCourseInstance: {
        "@type": "CourseInstance",
        courseMode: "in-person",
        location: {
          "@type": "Place",
          name: "kidslab.lk Academy",
          address: {
            "@type": "PostalAddress",
            addressLocality: "Hapugala, Galle",
            addressCountry: "LK",
          },
        },
        startDate: "2026-06-27",
        endDate: "2026-09-27",
        instructor: [
          {
            "@type": "Person",
            name: "Viraj Samarasinghe",
            jobTitle: "Software Engineer · AI Specialized",
          },
          {
            "@type": "Person",
            name: "Menura Dulkith",
            jobTitle: "Software Engineer · AI Specialized",
          },
        ],
      },
    },
    /* 4. Event — Free Seminar */
    {
      "@context": "https://schema.org",
      "@type": "Event",
      name: "Free Robotics & AI Introductory Seminar — kidslab.lk",
      description:
        "A free introductory seminar covering basics of Robotics & AI, mindset building, and motivation. No obligation to enrol. Open to children aged 9–14 and their parents.",
      image: ["https://kidslab.lk/og-image.png", "https://kidslab.lk/logo.png"],
      startDate: "2026-06-27T09:00:00+05:30",
      endDate: "2026-06-27T13:00:00+05:30",
      eventStatus: "https://schema.org/EventScheduled",
      eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
      location: {
        "@type": "Place",
        name: "kidslab.lk Academy",
        address: {
          "@type": "PostalAddress",
          streetAddress: "Hapugala",
          addressLocality: "Galle",
          addressCountry: "LK",
        },
      },
      organizer: {
        "@type": "EducationalOrganization",
        name: "kidslab.lk",
        url: "https://kidslab.lk",
      },
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "LKR",
        availability: "https://schema.org/LimitedAvailability",
        url: "https://kidslab.lk/register",
        validFrom: "2026-06-14",
      },
      performer: [
        { "@type": "Person", name: "Viraj Samarasinghe" },
        { "@type": "Person", name: "Menura Dulkith" },
      ],
      audience: {
        "@type": "Audience",
        audienceType: "Children aged 9–14 and parents",
      },
    },
    /* 5a. Person — Viraj Samarasinghe */
    {
      "@context": "https://schema.org",
      "@type": "Person",
      "@id": "https://kidslab.lk/#viraj-samarasinghe",
      name: "Viraj Samarasinghe",
      givenName: "Viraj",
      familyName: "Samarasinghe",
      jobTitle: "Software Engineer — AI Specialized",
      description:
        "Computer Engineering graduate from the University of Ruhuna, Faculty of Engineering, Sri Lanka. Co-founder of kidslab.lk, specializing in Artificial Intelligence, Robotics, and Embedded Systems. Passionate about making technology education accessible to children in Sri Lanka.",
      image: "https://kidslab.lk/viraj.jpg",
      nationality: { "@type": "Country", name: "Sri Lanka" },
      worksFor: {
        "@type": "EducationalOrganization",
        name: "kidslab.lk",
        url: "https://kidslab.lk",
        foundingDate: "2026",
      },
      hasOccupation: {
        "@type": "Occupation",
        name: "Software Engineer",
        occupationLocation: { "@type": "Country", name: "Sri Lanka" },
        skills:
          "Artificial Intelligence, Machine Learning, Robotics, Embedded Systems, Python, Computer Vision",
        educationRequirements: "Bachelor of Science in Computer Engineering",
      },
      alumniOf: {
        "@type": "CollegeOrUniversity",
        name: "University of Ruhuna",
        department:
          "Faculty of Engineering — Department of Computer Engineering",
        address: {
          "@type": "PostalAddress",
          addressLocality: "Hapugala, Galle",
          addressCountry: "LK",
        },
      },
      knowsAbout: [
        "Artificial Intelligence",
        "Machine Learning",
        "Robotics",
        "Embedded Systems",
        "Computer Engineering",
        "IoT",
        "Python Programming",
        "STEM Education for Children",
      ],
      url: "https://kidslab.lk/#viraj-samarasinghe",
      sameAs: [
        "https://www.linkedin.com/in/virajsamarasinghe/",
        "https://kidslab.lk",
      ],
    },
    /* 5b. Person — Menura Dulkith */
    {
      "@context": "https://schema.org",
      "@type": "Person",
      "@id": "https://kidslab.lk/#menura-dulkith",
      name: "Menura Dulkith",
      givenName: "Menura",
      familyName: "Dulkith",
      jobTitle: "Software Engineer — AI Specialized",
      description:
        "Computer Engineering graduate from the University of Ruhuna, Faculty of Engineering, Sri Lanka. Co-founder of kidslab.lk, specializing in Artificial Intelligence, Robotics, and Embedded Systems. Dedicated to inspiring the next generation of young engineers in Sri Lanka.",
      image: "https://kidslab.lk/menura.jpg",
      nationality: { "@type": "Country", name: "Sri Lanka" },
      worksFor: {
        "@type": "EducationalOrganization",
        name: "kidslab.lk",
        url: "https://kidslab.lk",
        foundingDate: "2026",
      },
      hasOccupation: {
        "@type": "Occupation",
        name: "Software Engineer",
        occupationLocation: { "@type": "Country", name: "Sri Lanka" },
        skills:
          "Artificial Intelligence, Machine Learning, Robotics, Embedded Systems, Python, Computer Vision",
        educationRequirements: "Bachelor of Science in Computer Engineering",
      },
      alumniOf: {
        "@type": "CollegeOrUniversity",
        name: "University of Ruhuna",
        department:
          "Faculty of Engineering — Department of Computer Engineering",
        address: {
          "@type": "PostalAddress",
          addressLocality: "Hapugala, Galle",
          addressCountry: "LK",
        },
      },
      knowsAbout: [
        "Artificial Intelligence",
        "Machine Learning",
        "Robotics",
        "Embedded Systems",
        "Computer Engineering",
        "IoT",
        "Python Programming",
        "STEM Education for Children",
      ],
      url: "https://kidslab.lk/#menura-dulkith",
      sameAs: [
        "https://www.linkedin.com/in/menuradulkith/",
        "https://kidslab.lk",
      ],
    },
    /* 5c. ProfilePage — Viraj (for Google's People results & AI KGs) */
    {
      "@context": "https://schema.org",
      "@type": "ProfilePage",
      "@id": "https://kidslab.lk/#team",
      name: "Meet the Founders — kidslab.lk",
      description:
        "Viraj Samarasinghe and Menura Dulkith, co-founders of kidslab.lk, are Computer Engineering graduates from the University of Ruhuna specializing in AI & Robotics.",
      url: "https://kidslab.lk/#team",
      mainEntity: [
        { "@id": "https://kidslab.lk/#viraj-samarasinghe" },
        { "@id": "https://kidslab.lk/#menura-dulkith" },
      ],
    },
    /* 6. FAQPage — key AEO schema */
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: "What is kidslab.lk?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "kidslab.lk is Sri Lanka's Robotics & AI academy for children aged 9–14, conducted by Computer Engineers from the University of Ruhuna, Faculty of Engineering, based in Galle, Sri Lanka.",
          },
        },
        {
          "@type": "Question",
          name: "What age group is the Robotics & AI program for?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "The program is designed for children aged 9 to 14 years old.",
          },
        },
        {
          "@type": "Question",
          name: "How much does the Robotics & AI program cost?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "The course fee is LKR 5,000 for 3 months. It can be paid in installments within 3 months. Day 1 is a completely free introductory seminar with no obligation to continue.",
          },
        },
        {
          "@type": "Question",
          name: "When is the free seminar?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "The free introductory seminar is on 27 June 2026 at the kidslab.lk Academy in Hapugala, Galle, Sri Lanka. Seats are limited — register at kidslab.lk/register.",
          },
        },
        {
          "@type": "Question",
          name: "What will my child learn in the Robotics & AI program?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Children learn to build real robots using mechanics, sensors, and microcontrollers. The program also covers Artificial Intelligence basics, machine learning concepts, and hands-on project building — all in one 3-month course.",
          },
        },
        {
          "@type": "Question",
          name: "Who teaches the classes at kidslab.lk?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Classes are designed and taught by Viraj Samarasinghe and Menura Dulkith — Computer Engineering graduates from the University of Ruhuna, Faculty of Engineering, who specialize in AI & Robotics.",
          },
        },
        {
          "@type": "Question",
          name: "Where are the kidslab.lk classes held?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Classes are held at the kidslab.lk Academy in Hapugala, Galle 80000, Sri Lanka.",
          },
        },
        {
          "@type": "Question",
          name: "Can I pay the course fee in installments?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Yes. The LKR 5,000 course fee can be paid in installments spread over 3 months.",
          },
        },
        {
          "@type": "Question",
          name: "How do I register for the free seminar or the course?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Visit kidslab.lk/register and fill in your child's details. You can also contact us via WhatsApp at +94703906478.",
          },
        },
        {
          "@type": "Question",
          name: "Is kidslab.lk affiliated with the University of Ruhuna?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "The programs are designed and conducted by Computer Engineering graduates and professionals from the University of Ruhuna, Faculty of Engineering.",
          },
        },
        {
          "@type": "Question",
          name: "Who is Viraj Samarasinghe?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Viraj Samarasinghe is a Software Engineer specializing in AI, and co-founder of kidslab.lk. He is a Computer Engineering graduate from the University of Ruhuna, Faculty of Engineering, Sri Lanka, with expertise in Artificial Intelligence, Robotics, and Embedded Systems.",
          },
        },
        {
          "@type": "Question",
          name: "Who is Menura Dulkith?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Menura Dulkith is a Software Engineer specializing in AI, and co-founder of kidslab.lk. He is a Computer Engineering graduate from the University of Ruhuna, Faculty of Engineering, Sri Lanka, with expertise in Artificial Intelligence, Robotics, and Embedded Systems.",
          },
        },
      ],
    },
  ];

  return (
    <>
      {/* Inject all JSON-LD schemas */}
      {jsonLd.map((schema, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}

      <LoadingScreen />
      <motion.main
        className="bg-white"
        animate={{ opacity: langFading ? 0.15 : 1 }}
        transition={{ duration: langFading ? 0.13 : 0.28, ease: "easeInOut" }}
      >
        <Navbar />

        {/* ══ Hero ══════════════════════════════════════════════════════ */}
        <section
          ref={heroRef}
          className="relative min-h-svh lg:h-svh flex items-center pt-16 pb-4 overflow-hidden"
        >
          <div
            className="absolute inset-0"
            style={{ backgroundColor: "var(--brand-paper)" }}
          />
          <div
            className="absolute top-0 right-0 w-[700px] h-[700px] opacity-20"
            style={{
              background:
                "radial-gradient(circle at 65% 35%, #dbe6ff 0%, transparent 55%), radial-gradient(circle at 80% 75%, #f3ddc3 0%, transparent 50%)",
            }}
          />
          {/* PCB layout grid — the hero's signature backdrop */}
          <div
            className="absolute inset-0 opacity-[0.06]"
            style={{
              backgroundImage:
                "linear-gradient(var(--brand-blue) 1px, transparent 1px), linear-gradient(90deg, var(--brand-blue) 1px, transparent 1px)",
              backgroundSize: "34px 34px",
            }}
          />
          <div
            className="absolute inset-0 opacity-[0.08]"
            style={{
              backgroundImage:
                "radial-gradient(var(--brand-red) 1.5px, transparent 1.5px)",
              backgroundSize: "68px 68px",
              backgroundPosition: "17px 17px",
            }}
          />

          <motion.div
            style={{ y: heroY }}
            className="relative z-10 max-w-screen-xl mx-auto px-6 lg:px-10 xl:px-16 w-full py-8 lg:py-10 xl:py-14 2xl:py-20"
          >
            <div className="max-w-3xl mx-auto text-center">
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45 }}
                className="flex justify-center"
              >
                <span
                  className="pcb-stamp inline-flex items-center gap-2 pl-4 pr-5 py-1.5 text-label mb-4 lg:mb-5"
                  style={{
                    backgroundColor: "var(--brand-navy)",
                    color: "var(--brand-paper)",
                  }}
                >
                  <span className="w-1.5 h-1.5 rounded-full animate-pulse bg-green-400" />
                  {t("hero.badge")}
                </span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 28 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="text-display-xl text-slate-900"
                style={{ minHeight: "2.15em" }}
              >
                <TypingHeadline srText={t("hero.srText")} sentences={heroSentences} />
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="text-body-xl text-slate-500 mt-4 lg:mt-5 max-w-2xl mx-auto"
              >
                {t("hero.subtitlePrefix")}
                <span className="font-semibold text-slate-800">
                  {t("hero.subtitleBold")}
                </span>
                {t("hero.subtitleSuffix")}
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="mt-6 lg:mt-7 flex flex-wrap justify-center gap-3"
              >
                <motion.div
                  className="rounded-full"
                  animate={{
                    boxShadow: [
                      "0 0 0 0px rgba(224,138,60,0.45)",
                      "0 0 0 7px rgba(224,138,60,0.13)",
                      "0 0 0 14px rgba(224,138,60,0)",
                    ],
                  }}
                  transition={{
                    duration: 2.2,
                    repeat: Infinity,
                    ease: "easeOut",
                  }}
                >
                  <Button
                    size="lg"
                    onClick={openRegisterModal}
                    className="btn-register btn-brand-copper text-white font-semibold px-8 xl:px-10 h-12 xl:h-14 2xl:h-16 rounded-full text-[15px] xl:text-base 2xl:text-lg tracking-[-0.01em] shadow-md"
                  >
                    {t("hero.ctaRegister")}
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </motion.div>
                <a href="#programs">
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-slate-200 text-slate-700 hover:bg-slate-50 px-8 xl:px-10 h-12 xl:h-14 2xl:h-16 rounded-full text-[15px] xl:text-base 2xl:text-lg tracking-[-0.01em] font-medium transition-all"
                  >
                    {t("hero.ctaExplore")}
                  </Button>
                </a>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.44 }}
                className="mt-5 lg:mt-7 flex flex-wrap justify-center gap-5"
              >
                {[t("hero.trust1"), t("hero.trust2"), t("hero.trust3")].map(
                  (label) => (
                    <div
                      key={label}
                      className="flex items-center gap-2 text-slate-500"
                      style={{ fontSize: "0.875rem" }}
                    >
                      <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                      <span className="font-medium">{label}</span>
                    </div>
                  ),
                )}
              </motion.div>
            </div>

            {/* Stats bar */}
            <motion.div
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65, delay: 0.58 }}
              className="mt-12 lg:mt-14 xl:mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 xl:gap-6 max-w-4xl mx-auto"
            >
              {stats.map(({ value, label }, i) => (
                <div
                  key={label}
                  className="pcb-card bg-white rounded-2xl border border-slate-100 shadow-sm px-6 xl:px-8 py-4 lg:py-4 xl:py-7 flex flex-col items-center text-center"
                >
                  <p
                    className="font-extrabold text-slate-900 leading-none tracking-tight"
                    style={{
                      fontSize: "1.625rem",
                      fontFamily: "var(--font-display)",
                    }}
                  >
                    <CountUp value={value} />
                  </p>
                  <p
                    className="text-slate-400 mt-1"
                    style={{ fontSize: "0.8125rem" }}
                  >
                    {statLabels[i]}
                  </p>
                </div>
              ))}
            </motion.div>
          </motion.div>

          {/* ══ University Banner — pinned to hero's bottom edge, drifts up on scroll ══ */}
          <motion.div
            style={{ y: bannerY }}
            className="absolute bottom-0 left-0 right-0 z-10 bg-gradient-to-r from-blue-700 to-violet-700 py-4 px-6"
          >
            <div className="max-w-screen-2xl mx-auto flex flex-col sm:flex-row items-center justify-center gap-2.5">
              <GraduationCap className="w-4 h-4 text-blue-200 shrink-0" />
              <p
                className="text-center"
                style={{
                  fontSize: "0.8125rem",
                  color: "rgba(255,255,255,0.8)",
                  letterSpacing: "0.01em",
                }}
              >
                {t("universityBanner.prefix")}
                <span className="font-bold text-white">
                  {t("universityBanner.bold")}
                </span>
                <span className="hidden sm:inline text-blue-300 mx-2">·</span>
                <span className="inline-flex items-center gap-1 text-blue-100">
                  <MapPin className="w-3 h-3" /> {t("universityBanner.location")}
                </span>
              </p>
            </div>
          </motion.div>
        </section>

        {/* ══ Programs ══════════════════════════════════════════════════ */}
        <section
          id="programs"
          className="py-28 px-6 xl:py-36 xl:px-12 bg-slate-50"
        >
          <div className="max-w-screen-2xl mx-auto">
            <AnimateIn className="text-center mb-16">
              <SectionLabel>{t("programs.eyebrow")}</SectionLabel>
              <h2 className="text-display-lg text-slate-900">
                {t("programs.headingStart")}
                <span
                  className="bg-clip-text text-transparent"
                  style={{
                    backgroundImage:
                      "linear-gradient(to right, var(--brand-blue), #1a3fa0)",
                  }}
                >
                  {t("programs.headingHighlight")}
                </span>
              </h2>
              <p className="text-body-xl text-slate-500 mt-5 max-w-lg mx-auto">
                {t("programs.subtitle")}
              </p>
            </AnimateIn>

            {/* Flagship program — a single offering shown as a component
                datasheet rather than a generic pricing card, since a
                one-item "programs" list reads as sparse in a plain card. */}
            <AnimateIn className="max-w-4xl xl:max-w-5xl mx-auto">
                <motion.div
                  className="rounded-3xl"
                  animate={{
                    boxShadow: [
                      "0 0 0 0px rgba(224,138,60,0.3), 0 10px 40px rgba(15,36,24,0.08)",
                      "0 0 0 5px rgba(224,138,60,0.1), 0 10px 40px rgba(15,36,24,0.15)",
                      "0 0 0 10px rgba(224,138,60,0), 0 10px 40px rgba(15,36,24,0.08)",
                    ],
                  }}
                  transition={{
                    duration: 2.5,
                    repeat: Infinity,
                    ease: "easeOut",
                  }}
                >
                  <div
                    className="pcb-card relative rounded-3xl border-2 overflow-hidden bg-white"
                    style={{ borderColor: "var(--brand-navy)" }}
                  >
                    {/* Datasheet corner stamp — echoes the hero's REV. 2026 badge */}
                    <span
                      className="pcb-stamp absolute top-0 right-6 z-10 px-4 py-1.5 text-white text-[11px] font-semibold tracking-widest uppercase inline-flex items-center gap-1.5"
                      style={{ backgroundColor: "var(--brand-red)" }}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse shrink-0" />
                      {t("programs.enrollingNow")}
                    </span>

                    <div className="grid md:grid-cols-[1.35fr_1fr]">
                      {/* Left — the story */}
                      <div className="p-8 xl:p-10 pt-12 flex flex-col gap-5">
                        <div>
                          <h3
                            className="text-display-md"
                            style={{ color: "var(--brand-navy)" }}
                          >
                            {t("programs.card.title")}
                          </h3>
                          <p className="text-body-md text-slate-500 mt-2">
                            {t("programs.card.desc")}
                          </p>
                        </div>

                        {/* Seminar callout */}
                        <div
                          className="rounded-xl px-4 py-3 flex gap-3 items-start"
                          style={{
                            backgroundColor: "#f0f4ff",
                            border: "1px solid #c8d4f0",
                          }}
                        >
                          <Star
                            className="w-4 h-4 mt-0.5 shrink-0"
                            style={{ color: "var(--brand-red)" }}
                          />
                          <p className="text-[13px] text-slate-600 leading-snug">
                            {t("programs.card.seminar")}
                          </p>
                        </div>

                        {/* CTA */}
                        <motion.div
                          className="rounded-full mt-auto"
                          animate={{
                            boxShadow: [
                              "0 0 0 0px rgba(224,138,60,0.4)",
                              "0 0 0 4px rgba(224,138,60,0.13)",
                              "0 0 0 8px rgba(224,138,60,0)",
                            ],
                          }}
                          transition={{
                            duration: 2.2,
                            repeat: Infinity,
                            ease: "easeOut",
                          }}
                        >
                          <button
                            onClick={openRegisterModal}
                            className="btn-register btn-brand-copper w-full text-white font-semibold h-11 rounded-full text-[14px] tracking-[-0.01em]"
                          >
                            {t("programs.ctaRegister")}
                          </button>
                        </motion.div>
                      </div>

                      {/* Right — spec sheet */}
                      <div
                        className="p-8 xl:p-10 flex flex-col justify-center border-t md:border-t-0 md:border-l border-slate-100"
                        style={{ backgroundColor: "var(--brand-paper)" }}
                      >
                        {[
                          { label: t("programs.card.levelLabel"), value: t("programs.card.level") },
                          { label: t("programs.card.durationLabel"), value: t("programs.card.duration") },
                          { label: t("programs.courseFee"), value: t("programs.card.fee"), note: t("programs.card.installment") },
                        ].map((row, i, arr) => (
                          <div
                            key={row.label}
                            className={`py-4 ${i < arr.length - 1 ? "border-b border-slate-200/70" : ""}`}
                          >
                            <p className="text-label text-slate-400">{row.label}</p>
                            <p
                              className="font-bold mt-1"
                              style={{ color: "var(--brand-navy)", fontSize: "1.0625rem" }}
                            >
                              {row.value}
                            </p>
                            {row.note && (
                              <p className="text-[12px] text-slate-500 mt-0.5 leading-snug">
                                {row.note}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
            </AnimateIn>
          </div>
        </section>

        {/* ══ Why kidslab.lk ════════════════════════════════════════════ */}
        <section id="about" className="py-28 px-6 xl:py-36 xl:px-12 bg-white">
          <div className="max-w-screen-2xl mx-auto">
            <AnimateIn className="text-center mb-16">
              <SectionLabel>
                <span style={{ color: "var(--brand-navy)" }}>
                  {t("about.eyebrowStart")}
                  <span style={{ color: "var(--brand-red)" }}>{t("about.eyebrowMid")}</span>
                  {t("about.eyebrowEnd")}
                </span>
              </SectionLabel>
              <h2 className="text-display-lg text-slate-900">
                {t("about.headingStart")}
                <span className="bg-gradient-to-r from-violet-600 to-blue-600 bg-clip-text text-transparent">
                  {t("about.headingHighlight")}
                </span>
              </h2>
              <p className="text-body-xl text-slate-500 mt-5 max-w-lg mx-auto">
                {t("about.subtitle")}
              </p>
            </AnimateIn>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 items-stretch">
              {whyUs.map((item, i) => (
                <AnimateIn key={item.title} delay={i * 0.07} className="h-full">
                  <div className="pcb-card bg-white rounded-2xl border border-slate-100 shadow-sm p-7 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 h-full">
                    <h4 className="text-display-md text-slate-900 mb-2">
                      {t(`about.cards.${i}.title`)}
                    </h4>
                    <p className="text-body-md text-slate-500">
                      {t(`about.cards.${i}.desc`)}
                    </p>
                  </div>
                </AnimateIn>
              ))}
            </div>
          </div>
        </section>

        {/* ══ Team / Founders ════════════════════════════════════════════ */}
        <section
          id="team"
          className="py-28 px-6 xl:py-36 xl:px-12 relative overflow-hidden"
          style={{
            background:
              "linear-gradient(135deg, var(--brand-navy) 0%, #123a2a 50%, #0d2560 100%)",
          }}
        >
          {/* Decorative blobs */}
          <div
            className="absolute -left-32 top-0 w-96 h-96 rounded-full opacity-10 pointer-events-none"
            style={{
              background: "radial-gradient(circle, var(--brand-blue), transparent)",
            }}
          />
          <div
            className="absolute -right-32 bottom-0 w-96 h-96 rounded-full opacity-10 pointer-events-none"
            style={{
              background: "radial-gradient(circle, var(--brand-red), transparent)",
            }}
          />

          <div className="max-w-screen-2xl mx-auto relative z-10">
            {/* Header */}
            <AnimateIn className="text-center mb-16 xl:mb-20">
              <SectionLabel
                style={{
                  color: "color-mix(in srgb, var(--brand-red) 70%, white)",
                }}
              >
                {t("team.eyebrow")}
              </SectionLabel>
              <h2 className="text-display-lg text-white">
                {t("team.headingStart")}
                <span
                  className="bg-clip-text text-transparent"
                  style={{
                    backgroundImage:
                      "linear-gradient(to right, #60a5fa, color-mix(in srgb, var(--brand-red) 70%, white))",
                  }}
                >
                  {t("team.headingHighlight")}
                </span>
              </h2>
              <p className="text-body-xl text-slate-400 mt-5 max-w-xl mx-auto">
                {t("team.subtitle")}
              </p>
            </AnimateIn>

            {/* Founder cards — standard avatar layout */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 xl:gap-8 max-w-xl xl:max-w-2xl mx-auto">
              {founders.map((f, i) => (
                <AnimateIn key={f.name} delay={i * 0.15} className="h-full">
                  <div className="h-full flex flex-col items-center text-center gap-4 rounded-2xl bg-white/[0.04] border border-white/10 px-6 py-8 hover:bg-white/[0.06] transition-colors duration-300">
                    {/* Avatar */}
                    <div className="relative w-24 h-24 xl:w-28 xl:h-28 rounded-full overflow-hidden ring-2 ring-blue-400/40 shrink-0">
                      <Image
                        src={f.photo}
                        alt={f.name}
                        fill
                        className="object-cover object-top"
                        sizes="112px"
                      />
                    </div>

                    {/* Co-Founder badge */}
                    <span className="inline-flex items-center gap-1.5 bg-blue-500/15 text-blue-300 border border-blue-400/30 font-bold rounded-full px-3 py-1 text-[11px] tracking-widest uppercase">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
                      {t("team.coFounder")}
                    </span>

                    {/* Name + role */}
                    <div>
                      <h3 className="text-white font-extrabold tracking-tight text-lg xl:text-xl">
                        {f.name}
                      </h3>
                      <p className="text-blue-300 font-medium text-sm mt-1">
                        {t("team.role")}
                      </p>
                    </div>

                    {/* University */}
                    <div className="flex items-center gap-2 text-slate-400 text-xs xl:text-sm">
                      <GraduationCap className="w-3.5 h-3.5 xl:w-4 xl:h-4 shrink-0 text-blue-400" />
                      {t("team.university")}
                    </div>

                    {/* Tags */}
                    <div className="flex flex-wrap justify-center gap-1.5">
                      {(t.raw("team.tags") as string[]).map((tag) => (
                        <span
                          key={tag}
                          className="bg-white/10 text-blue-200 border border-white/15 px-2.5 py-1 rounded-full text-[10px] font-semibold tracking-wider uppercase"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>

                    {/* LinkedIn */}
                    <a
                      href={f.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-auto inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#0A66C2]/50 bg-[#0A66C2]/20 hover:bg-[#0A66C2]/50 text-[#93c5fd] hover:text-white transition-all duration-200 font-semibold text-sm"
                    >
                      <LinkedInIcon className="w-3.5 h-3.5 shrink-0" />
                      {t("team.linkedin")}
                    </a>
                  </div>
                </AnimateIn>
              ))}
            </div>

            {/* University strip */}
            <AnimateIn delay={0.3} className="mt-10 xl:mt-14">
              <div className="max-w-3xl xl:max-w-5xl mx-auto bg-white/[0.04] border border-white/8 rounded-2xl px-8 xl:px-12 py-5 xl:py-6 flex flex-col sm:flex-row items-center justify-center gap-4 xl:gap-8">
                <div className="flex items-center gap-3">
                  <GraduationCap className="w-5 h-5 xl:w-6 xl:h-6 text-blue-400 shrink-0" />
                  <p
                    className="text-slate-300 font-semibold"
                    style={{ fontSize: "clamp(0.8rem, 0.9vw, 1.1rem)" }}
                  >
                    {t("team.universityStrip")}
                  </p>
                </div>
                <div className="hidden sm:block w-px h-5 bg-white/20" />
                <div className="flex items-center gap-3">
                  <MapPin className="w-4 h-4 xl:w-5 xl:h-5 text-slate-500 shrink-0" />
                  <p
                    className="text-slate-500"
                    style={{ fontSize: "clamp(0.75rem, 0.85vw, 1rem)" }}
                  >
                    {t("team.location")}
                  </p>
                </div>
              </div>
            </AnimateIn>
          </div>
        </section>

        {/* ══ Testimonials ══════════════════════════════════════════════ */}
        <section className="py-28 px-6 xl:py-36 xl:px-12 bg-slate-50">
          <div className="max-w-6xl mx-auto">
            <AnimateIn className="text-center mb-16">
              <SectionLabel className="text-green-600">
                {t("testimonials.eyebrow")}
              </SectionLabel>
              <h2 className="text-display-lg text-slate-900">
                {t("testimonials.headingStart")}
                <span className="bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent">
                  {t("testimonials.headingHighlight")}
                </span>
              </h2>
            </AnimateIn>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-stretch">
              {testimonials.map((item, i) => (
                <AnimateIn key={item.name} delay={i * 0.1} className="h-full">
                  <div className="pcb-card bg-white rounded-2xl border border-slate-100 shadow-sm p-8 flex flex-col gap-5 h-full hover:shadow-md transition-shadow duration-300">
                    <div className="flex gap-1">
                      {Array.from({ length: item.stars }).map((_, s) => (
                        <Star
                          key={s}
                          className="w-4 h-4 fill-amber-400 text-amber-400"
                        />
                      ))}
                    </div>
                    <p className="text-body-md text-slate-600 flex-1 leading-[1.75]">
                      &ldquo;{t(`testimonials.cards.${i}.quote`)}&rdquo;
                    </p>
                    <div className="flex items-center gap-3 pt-5 border-t border-slate-100">
                      <div
                        className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center text-white font-bold shrink-0"
                        style={{ fontSize: "0.6875rem" }}
                      >
                        {item.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </div>
                      <div>
                        <p
                          className="font-semibold text-slate-900"
                          style={{
                            fontSize: "0.9375rem",
                            letterSpacing: "-0.01em",
                          }}
                        >
                          {item.name}
                        </p>
                        <p
                          className="text-slate-400 mt-0.5"
                          style={{ fontSize: "0.8125rem" }}
                        >
                          {t(`testimonials.cards.${i}.role`)}
                        </p>
                      </div>
                    </div>
                  </div>
                </AnimateIn>
              ))}
            </div>
          </div>
        </section>

        {/* ══ Contact ═══════════════════════════════════════════════════ */}
        <section
          id="contact"
          className="py-28 px-6 xl:py-36 xl:px-12 bg-gradient-to-b from-slate-50 via-white to-slate-50 relative overflow-hidden"
        >
          {/* Decorative blobs */}
          <div
            className="absolute -left-40 top-10 w-96 h-96 rounded-full opacity-[0.07] pointer-events-none"
            style={{
              background: "radial-gradient(circle, var(--brand-navy), transparent)",
            }}
          />
          <div
            className="absolute -right-40 bottom-10 w-96 h-96 rounded-full opacity-[0.07] pointer-events-none"
            style={{
              background: "radial-gradient(circle, var(--brand-red), transparent)",
            }}
          />

          <div className="max-w-screen-2xl mx-auto relative z-10">
            <AnimateIn className="text-center mb-14">
              <SectionLabel>{t("contact.eyebrow")}</SectionLabel>
              <h2 className="text-display-lg text-slate-900">
                {t("contact.headingStart")}
                <span
                  className="bg-clip-text text-transparent"
                  style={{
                    backgroundImage:
                      "linear-gradient(to right, var(--brand-blue), #1a3fa0)",
                  }}
                >
                  {t("contact.headingHighlight")}
                </span>
              </h2>
              <p className="text-body-xl text-slate-500 mt-4 max-w-xl mx-auto">
                {t("contact.subtitle")}
              </p>
            </AnimateIn>

            <div className="grid md:grid-cols-2 gap-8 xl:gap-12 max-w-4xl mx-auto items-stretch">
              {/* Contact channels — presented as a 4-pin connector header,
                  echoing the site's circuit-board signature instead of a
                  generic icon-list card. */}
              <AnimateIn delay={0.1} className="h-full">
                <div className="bg-white rounded-3xl border border-slate-200/70 shadow-xl shadow-slate-200/50 h-full flex flex-col overflow-hidden">
                  <div className="px-8 pt-8 xl:px-10 xl:pt-10 pb-6 flex items-baseline justify-between gap-3">
                    <h3
                      className="text-display-md"
                      style={{ color: "var(--brand-navy)" }}
                    >
                      {t("contact.contactUsTitle")}
                    </h3>
                    <span className="text-label text-slate-400 whitespace-nowrap">
                      4 CHANNELS
                    </span>
                  </div>

                  <div className="grid grid-cols-2 border-t border-slate-100 flex-1">
                    {[
                      {
                        id: "whatsapp",
                        label: t("contact.whatsapp"),
                        value: "+94 70 390 6478",
                        href: "https://wa.me/94703906478",
                        external: true,
                        accent: "#25D366",
                        hoverBg: "hover:bg-green-50",
                        icon: <WhatsAppIcon className="w-5 h-5" />,
                      },
                      {
                        id: "facebook",
                        label: t("contact.facebook"),
                        value: t("contact.facebookHandle"),
                        href: "https://www.facebook.com/profile.php?id=61585638656242",
                        external: true,
                        accent: "#1877F2",
                        hoverBg: "hover:bg-blue-50",
                        icon: <FacebookIcon className="w-5 h-5" />,
                      },
                      {
                        id: "email",
                        label: t("contact.email"),
                        value: "info@kidslab.lk",
                        href: "mailto:info@kidslab.lk",
                        external: false,
                        accent: "var(--brand-navy)",
                        hoverBg: "hover:bg-slate-50",
                        icon: (
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                            />
                          </svg>
                        ),
                      },
                      {
                        id: "location",
                        label: t("contact.location"),
                        value: t("contact.locationValue"),
                        href: "https://www.google.com/maps/search/?api=1&query=Hapugala+Galle+Sri+Lanka",
                        external: true,
                        accent: "var(--brand-red)",
                        hoverBg: "hover:bg-orange-50",
                        icon: <MapPin className="w-5 h-5" />,
                      },
                    ].map((c, i) => (
                      <a
                        key={c.id}
                        href={c.href}
                        target={c.external ? "_blank" : undefined}
                        rel={c.external ? "noopener noreferrer" : undefined}
                        className={`group relative flex flex-col gap-3 p-6 border-slate-100 ${c.hoverBg} transition-colors duration-200 ${
                          i % 2 === 0 ? "border-r" : ""
                        } ${i < 2 ? "border-b" : ""}`}
                      >
                        <div className="flex items-center justify-between">
                          <span
                            className="text-label"
                            style={{ color: "var(--brand-red)" }}
                          >
                            P{i + 1}
                          </span>
                          <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-400 group-hover:translate-x-0.5 transition-all" />
                        </div>
                        <div
                          className="transition-transform duration-200 group-hover:-translate-y-0.5"
                          style={{ color: c.accent }}
                        >
                          {c.icon}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800 text-sm">
                            {c.label}
                          </p>
                          <p
                            className="text-slate-400 mt-0.5 leading-snug"
                            style={{
                              fontFamily: "var(--font-mono), ui-monospace, monospace",
                              fontSize: "0.75rem",
                            }}
                          >
                            {c.value}
                          </p>
                        </div>
                      </a>
                    ))}
                  </div>

                  {/* edge-connector strip — gold pads, like the PCB card
                      accents used elsewhere on the page */}
                  <div className="flex gap-1.5 px-8 xl:px-10 py-3 border-t border-slate-100 bg-slate-50/60">
                    {Array.from({ length: 8 }).map((_, i) => (
                      <span
                        key={i}
                        className="h-1 flex-1 rounded-full opacity-40"
                        style={{ backgroundColor: "var(--brand-red)" }}
                      />
                    ))}
                  </div>
                </div>
              </AnimateIn>

              {/* CTA card */}
              <AnimateIn delay={0.18} className="h-full">
                <div
                  className="rounded-3xl p-8 xl:p-10 flex flex-col justify-between h-full relative overflow-hidden shadow-xl shadow-blue-950/20"
                  style={{
                    background:
                      "linear-gradient(135deg, var(--brand-navy) 0%, #123a2a 50%, #0d2560 100%)",
                  }}
                >
                  {/* Decorative rings */}
                  <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full border border-white/10" />
                  <div className="absolute -right-8 -bottom-20 w-80 h-80 rounded-full border border-white/10" />
                  <div
                    className="absolute inset-0 opacity-[0.06] pointer-events-none"
                    style={{
                      backgroundImage:
                        "radial-gradient(circle, #fff 1px, transparent 1px)",
                      backgroundSize: "18px 18px",
                    }}
                  />

                  <div className="relative z-10">
                    <h3 className="text-display-md text-white">
                      {t("contact.ctaTitle")}
                    </h3>
                    <p className="text-white/75 mt-3 leading-relaxed text-body-md">
                      {t("contact.ctaDescPrefix")}
                      <span className="text-white font-semibold">
                        {t("contact.ctaDescBold")}
                      </span>
                      {t("contact.ctaDescSuffix")}
                    </p>

                    <div className="mt-6 space-y-2">
                      {(t.raw("contact.highlights") as string[]).map((item) => (
                        <div
                          key={item}
                          className="flex items-center gap-2 text-white/80 text-sm"
                        >
                          <CheckCircle className="w-4 h-4 text-green-400 shrink-0" />
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="relative z-10 mt-8 flex flex-col gap-3">
                    <button
                      onClick={openRegisterModal}
                      className="w-full bg-white font-bold h-12 rounded-full text-sm tracking-[-0.01em] transition-all hover:bg-slate-50 hover:shadow-lg hover:-translate-y-0.5 shadow-lg"
                      style={{ color: "var(--brand-navy)" }}
                    >
                      {t("contact.registerCta")}
                    </button>
                    <a
                      href="https://www.facebook.com/profile.php?id=61585638656242"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block"
                    >
                      <button className="w-full border border-white/25 text-white font-medium h-11 rounded-full text-sm hover:bg-white/10 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2">
                        <FacebookIcon className="w-4 h-4" />
                        {t("contact.followFacebook")}
                      </button>
                    </a>
                  </div>
                </div>
              </AnimateIn>
            </div>
          </div>
        </section>

        {/* ══ Footer ════════════════════════════════════════════════════ */}
        <footer
          className="text-white pt-14 pb-10 px-[clamp(1.5rem,4vw,5rem)]"
          style={{ backgroundColor: "var(--brand-navy)" }}
        >
          <div className="w-full max-w-[1920px] mx-auto">
            <div className="flex flex-col md:flex-row items-start justify-between gap-12 pb-12 border-b border-white/10">
              {/* Brand */}
              <div className="max-w-[300px]">
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-white rounded-xl p-1.5 flex-shrink-0">
                    <Image
                      src="/logo.png"
                      alt="kidslab.lk logo"
                      width={56}
                      height={56}
                      className="rounded-lg object-contain"
                    />
                  </div>
                  <span className="font-bold text-[1.0625rem] tracking-[-0.02em]">
                    kid<span style={{ color: "var(--brand-red)" }}>s</span>lab.lk
                  </span>
                </div>
                <p
                  className="text-slate-400 leading-relaxed"
                  style={{ fontSize: "0.875rem" }}
                >
                  {t("footer.blurb")}
                </p>

                {/* Newsletter — folded into the brand column, right under
                    the blurb, rather than floated as its own disconnected
                    column (the standard placement for a footer this size). */}
                <div className="mt-5">
                  <FooterSubscribe
                    heading={t("footer.subscribeHeading")}
                    placeholder={t("footer.subscribePlaceholder")}
                    cta={t("footer.subscribeCta")}
                    success={t("footer.subscribeSuccess")}
                    error={t("footer.subscribeError")}
                  />
                </div>

                <a
                  href="https://www.facebook.com/profile.php?id=61585638656242"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 mt-5 text-slate-400 hover:text-[#1877F2] transition-colors"
                  style={{ fontSize: "0.875rem" }}
                >
                  <FacebookIcon className="w-4 h-4" />
                  {t("footer.followFacebook")}
                </a>
              </div>

              {/* Link columns */}
              <div className="grid grid-cols-2 gap-x-16 gap-y-3">
                <div>
                  <p className="text-label text-slate-500 mb-4">{t("footer.programsHeading")}</p>
                  {(t.raw("footer.programLinks") as string[]).map((l) => (
                    <a
                      key={l}
                      href="#programs"
                      className="block text-slate-400 hover:text-white mb-2.5 transition-colors"
                      style={{ fontSize: "0.875rem" }}
                    >
                      {l}
                    </a>
                  ))}
                </div>
                <div>
                  <p className="text-label text-slate-500 mb-4">{t("footer.academyHeading")}</p>
                  {(t.raw("footer.academyLinks") as string[]).map((l) => (
                    <a
                      key={l}
                      href="#"
                      className="block text-slate-400 hover:text-white mb-2.5 transition-colors"
                      style={{ fontSize: "0.875rem" }}
                    >
                      {l}
                    </a>
                  ))}
                </div>
              </div>
            </div>

            <div
              className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-slate-500"
              style={{ fontSize: "0.8125rem" }}
            >
              <p>
                © 2026 kid<span style={{ color: "var(--brand-red)" }}>s</span>lab.lk —{" "}
                {t("footer.copyright")}
              </p>
              <p className="flex items-center gap-1.5">
                <GraduationCap
                  className="w-4 h-4"
                  style={{ color: "var(--brand-red)" }}
                />
                {t("footer.founded")}
              </p>
            </div>
          </div>
        </footer>
      </motion.main>

      {/* ── Floating WhatsApp button ── */}
      <a
        href="https://wa.me/94703906478"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat on WhatsApp"
        className="fixed bottom-6 right-6 xl:bottom-8 xl:right-8 2xl:bottom-10 2xl:right-10 z-50 flex items-center justify-center w-14 h-14 xl:w-16 xl:h-16 2xl:w-20 2xl:h-20 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 active:scale-95"
        style={{ backgroundColor: "#25D366" }}
      >
        <WhatsAppIcon className="w-7 h-7 text-white" />
      </a>
    </>
  );
}
