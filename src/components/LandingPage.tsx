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
import ChatWidget from "@/components/ChatWidget";
import type { GoogleReview } from "@/lib/google-reviews";
import { LocaleProvider, useLocale } from "@/lib/locale-context";
import type { Locale } from "@/config/locales";
import { RegisterModalProvider, useRegisterModal } from "@/lib/register-modal-context";
import { track } from "@/lib/analytics";
import { Button } from "@/components/ui/button";
import type { Course } from "@/types/course";
import type { SeoFaq } from "@/config/seo";
import {
    ArrowRight,
    Award,
    CheckCircle,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    Eye,
    FlaskConical,
    GraduationCap,
    Lock,
    MapPin,
    ShieldCheck,
    Star,
    Target,
    Users,
    Video,
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
    role: "Parent · Matara",
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

/* ── University credit strip ──
   Shared by the hero's desktop parallax banner and its in-flow mobile
   counterpart, so the copy can never drift between the two. */
function UniversityBannerContent() {
  const t = useTranslations();
  return (
    <div className="max-w-screen-2xl mx-auto flex items-start sm:items-center justify-center gap-2.5">
      <GraduationCap className="w-4 h-4 text-blue-200 shrink-0 mt-0.5 sm:mt-0" />
      <p
        className="text-center text-[0.75rem] sm:text-[0.8125rem] leading-relaxed"
        style={{
          color: "rgba(255,255,255,0.8)",
          letterSpacing: "0.01em",
        }}
      >
        {t("universityBanner.prefix")}
        <span className="font-bold text-white">{t("universityBanner.bold")}</span>
        <span className="text-blue-300 mx-1.5 sm:mx-2">·</span>
        <span className="inline-flex items-center gap-1 text-blue-100 whitespace-nowrap">
          <MapPin className="w-3 h-3 shrink-0" /> {t("universityBanner.location")}
        </span>
      </p>
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
  const [reduceMotion] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
  const [sentenceIndex, setSentenceIndex] = useState(0);
  const [count, setCount] = useState(() =>
    reduceMotion ? sentences[0].reduce((sum, s) => sum + s.text.length, 0) : 0
  );
  const [phase, setPhase] = useState<"typing" | "pausing" | "deleting">(() =>
    reduceMotion ? "pausing" : "typing"
  );

  const segments = sentences[sentenceIndex];
  const totalLength = segments.reduce((sum, s) => sum + s.text.length, 0);

  useEffect(() => {
    if (reduceMotion) return;

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
        const id = setTimeout(() => {
          setSentenceIndex((i) => (i + 1) % sentences.length);
          setPhase("typing");
        }, 0);
        return () => clearTimeout(id);
      }
      const id = setTimeout(() => setCount((c) => c - 1), 20);
      return () => clearTimeout(id);
    }
  }, [reduceMotion, phase, count, totalLength, sentences]);

  const idle = phase === "pausing";
  const starts: number[] = [];
  {
    let acc = 0;
    for (const seg of segments) {
      starts.push(acc);
      acc += seg.text.length;
    }
  }

  return (
    <>
      <span className="sr-only">{srText}</span>
      {/* Grid-stack every sentence so the tallest one reserves the box's
          height/width up front — the layout no longer shifts as the
          visible layer types and deletes shorter or longer sentences. */}
      <span className="relative grid" aria-hidden="true">
        {sentences.map((seg, i) => (
          <span key={i} className="invisible [grid-area:1/1]">
            {seg.map((s) => s.text).join("")}
          </span>
        ))}
        <span className="[grid-area:1/1]">
          {segments.map((seg, i) => {
            const start = starts[i];
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

export default function LandingPage({
  courses,
  googleReviews = [],
  faqs = [],
  locale,
}: {
  courses: Course[];
  googleReviews?: GoogleReview[];
  faqs?: SeoFaq[];
  /* Comes from the route (`/` vs `/si`), not from browser state — see
     `@/lib/locale-context` for why that matters. */
  locale: Locale;
}) {
  return (
    <LocaleProvider locale={locale}>
      <I18nProvider>
        <RegisterModalProvider>
          <HomeContent courses={courses} googleReviews={googleReviews} faqs={faqs} />
          <RegisterModal />
          <SubscribePopup />
        </RegisterModalProvider>
      </I18nProvider>
    </LocaleProvider>
  );
}

function HomeContent({
  courses,
  googleReviews,
  faqs,
}: {
  courses: Course[];
  googleReviews: GoogleReview[];
  faqs: SeoFaq[];
}) {
  const t = useTranslations();
  const { locale } = useLocale();
  const { openRegisterModal } = useRegisterModal();
  const heroSentences = useMemo(() => getHeroSentences(t), [t]);
  const statLabels = t.raw("stats.labels") as string[];
  /* The FAQ comes from Settings -> SEO & AEO, not the messages file, so one
     edit updates the visible section, the FAQPage JSON-LD and /llms.txt at
     once — Google only credits FAQ markup whose answers are actually visible
     on the page, and two sources are how those drift apart. Entries flagged
     structured-data-only are already filtered out server-side; Sinhala falls
     back to English when a translation hasn't been written yet. */
  const faqItems = useMemo(
    () =>
      faqs.map((f) => ({
        q: (locale === "si" && f.questionSi) || f.question,
        a: (locale === "si" && f.answerSi) || f.answer,
      })),
    [faqs, locale]
  );

  /* Prefer live Google reviews when available; otherwise fall back to the
     hardcoded, translated testimonials so the section never sits empty. */
  const displayTestimonials = useMemo(
    () =>
      googleReviews.length > 0
        ? googleReviews
        : testimonials.map((item, i) => ({
            name: item.name,
            role: t(`testimonials.cards.${i}.role`),
            quote: t(`testimonials.cards.${i}.quote`),
            stars: item.stars,
            photoUrl: null as string | null,
          })),
    [googleReviews, t],
  );

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

  /* ── Live programs. Fetched server-side (src/lib/courses.ts) and passed in
       as a prop so the real course text is present in the SSR HTML for
       crawlers — a client-side fetch left them seeing only the fallback. ── */
  const programCards = useMemo(() => {
    if (courses.length > 0) {
      return courses.map((c) => ({
        id: c._id,
        title: c.title,
        desc: c.description || t("programs.card.desc"),
        level: c.ageRange || t("programs.card.level"),
        duration: c.duration || t("programs.card.duration"),
        schedule: c.schedule,
        feeLabel: `LKR ${c.price.toLocaleString()}`,
        installmentNote: t("programs.card.installment"),
        badgeText: c.badgeText || t("programs.enrollingNow"),
        ctaLabel: c.ctaLabel || t("programs.ctaRegister"),
        seminarNote: c.seminarNote || t("programs.card.seminar"),
        instructorNames: c.instructors.map((i) => i.name).join(", "),
      }));
    }
    return [
      {
        id: "flagship",
        title: t("programs.card.title"),
        desc: t("programs.card.desc"),
        level: t("programs.card.level"),
        duration: t("programs.card.duration"),
        schedule: "",
        feeLabel: t("programs.card.fee"),
        installmentNote: t("programs.card.installment"),
        badgeText: t("programs.enrollingNow"),
        ctaLabel: t("programs.ctaRegister"),
        seminarNote: t("programs.card.seminar"),
        instructorNames: "",
      },
    ];
  }, [courses, t]);
  const [activeCourseIndex, setActiveCourseIndex] = useState(0);
  const courseScrollRef = useRef<HTMLDivElement>(null);
  const scrollToCourse = (index: number) => {
    const el = courseScrollRef.current;
    if (!el) return;
    const clamped = Math.max(0, Math.min(index, programCards.length - 1));
    el.scrollTo({ left: clamped * el.clientWidth, behavior: "smooth" });
    setActiveCourseIndex(clamped);
  };

  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const heroY = useTransform(scrollYProgress, [0, 1], ["0%", "18%"]);
  const bannerY = useTransform(scrollYProgress, [0, 1], ["0%", "-100%"]);

  return (
    <>
      {/* JSON-LD lives in the server component at src/app/page.tsx so that it
          is built from the same DB courses the cards render — see
          buildLandingJsonLd() in src/lib/structured-data.ts. */}
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
          className="relative lg:min-h-svh lg:h-svh flex items-center pt-16 pb-0 lg:pb-4 overflow-hidden"
        >
          <div
            className="absolute inset-0"
            style={{ backgroundColor: "var(--brand-paper)" }}
          />
          <div
            className="absolute top-0 right-0 w-[700px] h-[700px] opacity-20 max-w-full"
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
            className="relative z-10 max-w-screen-xl mx-auto px-5 sm:px-6 lg:px-10 xl:px-16 w-full py-7 sm:py-9 lg:py-10 xl:py-14 2xl:py-20"
          >
            <div className="max-w-3xl mx-auto text-center">
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45 }}
                className="flex justify-center"
              >
                <span
                  className="pcb-stamp inline-flex items-center gap-2 pl-3.5 pr-4 sm:pl-4 sm:pr-5 py-1.5 text-label mb-4 lg:mb-5 max-w-full text-center"
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
                className="text-display-xl hero-headline text-slate-900"
              >
                <TypingHeadline srText={t("hero.srText")} sentences={heroSentences} />
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="text-body-xl text-slate-500 mt-2 lg:mt-3 max-w-2xl mx-auto"
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
                className="mt-5 lg:mt-6 flex flex-col sm:flex-row sm:flex-wrap justify-center gap-3"
              >
                <motion.div
                  className="rounded-full w-full sm:w-auto"
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
                    onClick={() => {
                      track("register_cta_click", { source: "hero" });
                      openRegisterModal();
                    }}
                    className="btn-register btn-brand-copper w-full sm:w-auto text-white font-semibold px-6 sm:px-8 xl:px-10 h-12 xl:h-14 2xl:h-16 rounded-full text-[15px] xl:text-base 2xl:text-lg tracking-[-0.01em] shadow-md"
                  >
                    {t("hero.ctaRegister")}
                    <ArrowRight className="ml-2 w-4 h-4 shrink-0" />
                  </Button>
                </motion.div>
                <a href="#programs" className="w-full sm:w-auto">
                  <Button
                    size="lg"
                    variant="outline"
                    className="w-full sm:w-auto border-slate-200 text-slate-700 hover:bg-slate-50 px-6 sm:px-8 xl:px-10 h-12 xl:h-14 2xl:h-16 rounded-full text-[15px] xl:text-base 2xl:text-lg tracking-[-0.01em] font-medium transition-all"
                  >
                    {t("hero.ctaExplore")}
                  </Button>
                </a>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.44 }}
                /* Two tidy columns on a phone — free-wrapping these four
                   chips produced a ragged 3-line block that read as
                   overflow rather than a list. */
                className="mt-5 lg:mt-6 grid grid-cols-2 gap-x-4 gap-y-2.5 text-left sm:flex sm:flex-wrap sm:justify-center sm:gap-5 sm:text-center"
              >
                {[t("hero.trust1"), t("hero.trust2"), t("hero.trust3"), t("hero.trust4")].map(
                  (label) => (
                    <div
                      key={label}
                      className="flex items-center gap-2 text-slate-500 min-w-0"
                      style={{ fontSize: "0.8125rem" }}
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
              className="mt-7 sm:mt-9 lg:mt-11 xl:mt-12 grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-4 xl:gap-6 max-w-4xl mx-auto"
            >
              {stats.map(({ value, label }, i) => (
                <div
                  key={label}
                  className="pcb-card bg-white rounded-2xl border border-slate-100 shadow-sm px-3 sm:px-6 xl:px-8 py-3.5 sm:py-4 xl:py-7 flex flex-col items-center text-center min-w-0"
                >
                  <p
                    className="font-extrabold text-slate-900 leading-none tracking-tight"
                    style={{
                      fontSize: "clamp(1.25rem, 5.5vw, 1.625rem)",
                      fontFamily: "var(--font-display)",
                    }}
                  >
                    <CountUp value={value} />
                  </p>
                  <p
                    className="text-slate-400 mt-1"
                    style={{ fontSize: "clamp(0.6875rem, 2.6vw, 0.8125rem)" }}
                  >
                    {statLabels[i]}
                  </p>
                </div>
              ))}
            </motion.div>
          </motion.div>

          {/* ══ University Banner — pinned to hero's bottom edge, drifts up on
              scroll. Desktop only: absolutely positioning it over a hero
              whose content is taller than the viewport (which is every
              phone) meant it sat on top of the stats cards. On mobile the
              same strip is rendered in flow, just below the hero. ══ */}
          <motion.div
            style={{ y: bannerY }}
            className="hidden lg:block absolute bottom-0 left-0 right-0 z-10 bg-gradient-to-r from-blue-700 to-violet-700 py-4 px-6"
          >
            <UniversityBannerContent />
          </motion.div>
        </section>

        {/* Mobile counterpart of the hero's university banner */}
        <div className="lg:hidden bg-gradient-to-r from-blue-700 to-violet-700 py-3.5 px-5">
          <UniversityBannerContent />
        </div>

        {/* ══ Programs ══════════════════════════════════════════════════ */}
        <section
          id="programs"
          className="scroll-mt-20 section-y section-x bg-slate-50"
        >
          <div className="max-w-screen-2xl mx-auto">
            <AnimateIn className="text-center mb-10 sm:mb-14 xl:mb-16">
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

            {/* Programs carousel — driven by the admin-managed course
                backend, with a translation-based fallback card so the
                section never renders empty before any course is added. */}
            <AnimateIn className="max-w-4xl xl:max-w-5xl mx-auto relative">
              <div
                ref={courseScrollRef}
                onScroll={(e) => {
                  const el = e.currentTarget;
                  const idx = Math.round(el.scrollLeft / Math.max(el.clientWidth, 1));
                  if (idx !== activeCourseIndex) setActiveCourseIndex(idx);
                }}
                className="flex overflow-x-auto snap-x snap-mandatory scroll-smooth no-scrollbar rounded-3xl"
                style={{ scrollbarWidth: "none" }}
              >
                {programCards.map((card, i) => (
                  <div key={card.id} className="w-full shrink-0 snap-center px-1">
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
                        delay: i * 0.15,
                      }}
                    >
                      <div
                        className="pcb-card relative rounded-3xl border-2 overflow-hidden bg-white"
                        style={{ borderColor: "var(--brand-navy)" }}
                      >
                        {/* Datasheet corner stamp — echoes the hero's REV. 2026 badge */}
                        <span
                          className="pcb-stamp absolute top-0 right-3 sm:right-6 z-10 px-3 sm:px-4 py-1.5 text-white text-[10px] sm:text-[11px] font-semibold tracking-widest uppercase inline-flex items-center gap-1.5"
                          style={{ backgroundColor: "var(--brand-red)" }}
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse shrink-0" />
                          {card.badgeText}
                        </span>

                        {/* Three blocks, not two columns: on a phone the
                            spec sheet (with the fee) has to come before the
                            CTA, while on desktop it belongs in its own
                            column beside both. Explicit grid placement gets
                            both orders out of one DOM order. */}
                        <div className="flex flex-col md:grid md:grid-cols-[1.35fr_1fr] md:grid-rows-[1fr_auto]">
                          {/* Left — the story */}
                          <div className="md:col-start-1 md:row-start-1 p-5 sm:p-8 xl:p-10 pt-11 sm:pt-12 flex flex-col gap-4 sm:gap-5">
                            <div>
                              <h3
                                className="text-display-md"
                                style={{ color: "var(--brand-navy)" }}
                              >
                                {card.title}
                              </h3>
                              <p className="text-body-md text-slate-500 mt-2">
                                {card.desc}
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
                                {card.seminarNote}
                              </p>
                            </div>

                            {card.instructorNames && (
                              <p className="text-[13px] text-slate-500">
                                <span className="font-semibold text-slate-600">Conducted by:</span>{" "}
                                {card.instructorNames}
                              </p>
                            )}
                          </div>

                          {/* CTA — last on mobile (after the fee), bottom of
                              the left column on desktop */}
                          <div className="order-last md:order-none md:col-start-1 md:row-start-2 px-5 pb-5 pt-5 sm:px-8 sm:pb-8 xl:px-10 xl:pb-10 md:pt-0">
                            <motion.div
                              className="rounded-full"
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
                                onClick={() => {
                                  track("register_cta_click", { source: "program_card" });
                                  openRegisterModal();
                                }}
                                className="btn-register btn-brand-copper w-full text-white font-semibold h-12 md:h-11 rounded-full text-[15px] md:text-[14px] tracking-[-0.01em]"
                              >
                                {card.ctaLabel}
                              </button>
                            </motion.div>
                          </div>

                          {/* Right — spec sheet */}
                          <div
                            className="md:col-start-2 md:row-start-1 md:row-span-2 px-5 py-2 sm:p-8 xl:p-10 flex flex-col justify-center border-t md:border-t-0 md:border-l border-slate-100"
                            style={{ backgroundColor: "var(--brand-paper)" }}
                          >
                            {[
                              { label: t("programs.card.levelLabel"), value: card.level },
                              { label: t("programs.card.durationLabel"), value: card.duration },
                              // Class times are optional — only shown when the
                              // admin has filled in the course's Schedule field.
                              ...(card.schedule
                                ? [{ label: t("programs.card.scheduleLabel"), value: card.schedule }]
                                : []),
                              { label: t("programs.courseFee"), value: card.feeLabel, note: card.installmentNote },
                            ].map((row, ri, arr) => (
                              /* Label and value share a line on mobile —
                                 stacked, four of these rows ran the card
                                 an extra screen long. */
                              <div
                                key={row.label}
                                className={`py-3 sm:py-4 ${ri < arr.length - 1 ? "border-b border-slate-200/70" : ""}`}
                              >
                                <div className="flex items-baseline justify-between gap-3 sm:block">
                                  <p className="text-label text-slate-400 shrink-0">
                                    {row.label}
                                  </p>
                                  <p
                                    className="font-bold text-right sm:text-left sm:mt-1 text-[0.9375rem] sm:text-[1.0625rem]"
                                    style={{ color: "var(--brand-navy)" }}
                                  >
                                    {row.value}
                                  </p>
                                </div>
                                {row.note && (
                                  <p className="text-[12px] text-slate-500 mt-1 sm:mt-0.5 leading-snug text-right sm:text-left">
                                    {row.note}
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  </div>
                ))}
              </div>

              {/* Carousel controls — only shown once there's more than one active course */}
              {programCards.length > 1 && (
                <>
                  <button
                    aria-label="Previous program"
                    onClick={() => scrollToCourse(activeCourseIndex - 1)}
                    disabled={activeCourseIndex === 0}
                    className="hidden md:flex absolute top-1/2 -left-5 -translate-y-1/2 items-center justify-center w-10 h-10 rounded-full bg-white shadow-lg border border-slate-200 text-slate-500 hover:text-[color:var(--brand-navy)] hover:border-slate-300 transition-all disabled:opacity-0 disabled:pointer-events-none"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    aria-label="Next program"
                    onClick={() => scrollToCourse(activeCourseIndex + 1)}
                    disabled={activeCourseIndex === programCards.length - 1}
                    className="hidden md:flex absolute top-1/2 -right-5 -translate-y-1/2 items-center justify-center w-10 h-10 rounded-full bg-white shadow-lg border border-slate-200 text-slate-500 hover:text-[color:var(--brand-navy)] hover:border-slate-300 transition-all disabled:opacity-0 disabled:pointer-events-none"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>

                  <div className="flex items-center justify-center gap-2 mt-6">
                    {programCards.map((card, i) => (
                      <button
                        key={card.id}
                        aria-label={`Go to program ${i + 1}`}
                        onClick={() => scrollToCourse(i)}
                        className="h-1.5 rounded-full transition-all"
                        style={{
                          width: i === activeCourseIndex ? "1.5rem" : "0.375rem",
                          backgroundColor:
                            i === activeCourseIndex ? "var(--brand-red)" : "#cbd5e1",
                        }}
                      />
                    ))}
                  </div>
                </>
              )}
            </AnimateIn>
          </div>
        </section>

        {/* ══ Why kidslab.lk ════════════════════════════════════════════ */}
        <section id="about" className="scroll-mt-20 section-y section-x bg-white">
          <div className="max-w-screen-2xl mx-auto">
            <AnimateIn className="text-center mb-10 sm:mb-14 xl:mb-16">
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

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-5 items-stretch">
              {whyUs.map((item, i) => (
                <AnimateIn key={item.title} delay={i * 0.07} className="h-full">
                  <div className="pcb-card bg-white rounded-2xl border border-slate-100 shadow-sm p-5 sm:p-6 xl:p-7 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 h-full">
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
          /* The full-viewport minimum is desktop-only: on a phone this
             section's content is several screens tall, and `100vh` there
             is the pre-collapse URL-bar height, which overshoots. */
          className="scroll-mt-20 py-14 section-x xl:py-14 relative overflow-hidden lg:min-h-[calc(100svh-5rem)] flex flex-col justify-center"
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
            <AnimateIn className="text-center mb-5 xl:mb-7">
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
              <p className="text-body-xl text-slate-400 mt-2 max-w-xl mx-auto">
                {t("team.subtitle")}
              </p>
            </AnimateIn>

            {/* Founder cards — standard avatar layout */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 xl:gap-6 max-w-xl xl:max-w-2xl mx-auto">
              {founders.map((f, i) => (
                <AnimateIn key={f.name} delay={i * 0.15} className="h-full">
                  <div className="h-full flex flex-col items-center text-center gap-2 rounded-2xl bg-white/[0.04] border border-white/10 px-5 py-4 xl:py-5 hover:bg-white/[0.06] transition-colors duration-300">
                    {/* Avatar */}
                    <div className="relative w-16 h-16 xl:w-20 xl:h-20 rounded-full overflow-hidden ring-2 ring-blue-400/40 shrink-0">
                      <Image
                        src={f.photo}
                        alt={f.name}
                        fill
                        className="object-cover object-top"
                        sizes="80px"
                      />
                    </div>

                    {/* Co-Founder badge */}
                    <span className="inline-flex items-center gap-1.5 bg-blue-500/15 text-blue-300 border border-blue-400/30 font-bold rounded-full px-3 py-0.5 text-[10px] tracking-widest uppercase">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
                      {t("team.coFounder")}
                    </span>

                    {/* Name + role */}
                    <div>
                      <h3 className="text-white font-extrabold tracking-tight text-base xl:text-lg">
                        {f.name}
                      </h3>
                      <p className="text-blue-300 font-medium text-xs xl:text-sm mt-0.5">
                        {t("team.role")}
                      </p>
                    </div>

                    {/* Degree + university */}
                    <div className="flex flex-col items-center gap-1">
                      <div className="flex items-center gap-1.5 text-blue-200 text-xs font-semibold">
                        <Award className="w-3.5 h-3.5 shrink-0 text-blue-400" />
                        {t("team.degree")}
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-400 text-xs">
                        <GraduationCap className="w-3.5 h-3.5 shrink-0 text-blue-400" />
                        {t("team.university")}
                      </div>
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
                      className="mt-auto inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#0A66C2]/50 bg-[#0A66C2]/20 hover:bg-[#0A66C2]/50 text-[#93c5fd] hover:text-white transition-all duration-200 font-semibold text-sm"
                    >
                      <LinkedInIcon className="w-3.5 h-3.5 shrink-0" />
                      {t("team.linkedin")}
                    </a>
                  </div>
                </AnimateIn>
              ))}
            </div>

            {/* Credentials — answers "are they actually qualified?" */}
            <AnimateIn delay={0.25} className="mt-6 xl:mt-8">
              <div className="max-w-3xl xl:max-w-5xl mx-auto">
                <h3 className="text-center text-white/90 font-bold tracking-tight mb-3 xl:mb-4 text-sm xl:text-base">
                  {t("team.credentialsHeading")}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 xl:gap-3">
                  {(
                    t.raw("team.credentials") as { title: string; desc: string }[]
                  ).map((c) => (
                    <div
                      key={c.title}
                      className="flex gap-2.5 rounded-xl bg-white/[0.04] border border-white/10 px-4 py-3"
                    >
                      <CheckCircle className="w-4 h-4 shrink-0 mt-0.5 text-blue-400" />
                      <div>
                        <p className="text-white font-semibold text-[0.8125rem] xl:text-sm leading-snug">
                          {c.title}
                        </p>
                        <p className="text-slate-400 text-xs xl:text-[0.8125rem] leading-relaxed mt-0.5">
                          {c.desc}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </AnimateIn>

            {/* University strip */}
            <AnimateIn delay={0.3} className="mt-4 xl:mt-6">
              <div className="max-w-3xl xl:max-w-5xl mx-auto bg-white/[0.04] border border-white/8 rounded-2xl px-8 xl:px-12 py-3 flex flex-col sm:flex-row items-center justify-center gap-2 xl:gap-8">
                <div className="flex items-center gap-3">
                  <GraduationCap className="w-4 h-4 xl:w-5 xl:h-5 text-blue-400 shrink-0" />
                  <p
                    className="text-slate-300 font-semibold"
                    style={{ fontSize: "clamp(0.78rem, 0.85vw, 1.05rem)" }}
                  >
                    {t("team.universityStrip")}
                  </p>
                </div>
                <div className="hidden sm:block w-px h-5 bg-white/20" />
                <div className="flex items-center gap-3">
                  <MapPin className="w-3.5 h-3.5 xl:w-4 xl:h-4 text-slate-500 shrink-0" />
                  <p
                    className="text-slate-500"
                    style={{ fontSize: "clamp(0.72rem, 0.8vw, 0.95rem)" }}
                  >
                    {t("team.location")}
                  </p>
                </div>
              </div>
            </AnimateIn>
          </div>
        </section>

        {/* ══ Parent safety / supervision ═══════════════════════════════ */}
        <section
          id="safety"
          className="scroll-mt-20 section-y section-x bg-white"
        >
          <div className="max-w-screen-2xl mx-auto">
            <AnimateIn className="text-center mb-10 sm:mb-14 xl:mb-16">
              <SectionLabel className="text-blue-600">
                {t("safety.eyebrow")}
              </SectionLabel>
              <h2 className="text-display-lg text-slate-900">
                {t("safety.headingStart")}
                <span className="bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                  {t("safety.headingHighlight")}
                </span>
              </h2>
              <p className="text-body-xl text-slate-500 mt-5 max-w-xl mx-auto">
                {t("safety.subtitle")}
              </p>
            </AnimateIn>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-5 items-stretch">
              {[Video, Eye, ShieldCheck, Lock].map((Icon, i) => (
                <AnimateIn key={i} delay={i * 0.07} className="h-full">
                  <div className="pcb-card bg-white rounded-2xl border border-slate-100 shadow-sm p-5 sm:p-6 xl:p-7 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 h-full">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center mb-4">
                      <Icon className="w-5 h-5 text-blue-600" />
                    </div>
                    <h4 className="text-display-md text-slate-900 mb-2">
                      {t(`safety.cards.${i}.title`)}
                    </h4>
                    <p className="text-body-md text-slate-500">
                      {t(`safety.cards.${i}.desc`)}
                    </p>
                  </div>
                </AnimateIn>
              ))}
            </div>
          </div>
        </section>

        {/* ══ Testimonials ══════════════════════════════════════════════ */}
        <section className="section-y section-x bg-slate-50">
          <div className="max-w-6xl mx-auto">
            <AnimateIn className="text-center mb-10 sm:mb-14 xl:mb-16">
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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 sm:gap-5 items-stretch">
              {displayTestimonials.map((item, i) => (
                <AnimateIn key={`${item.name}-${i}`} delay={i * 0.1} className="h-full">
                  <div className="pcb-card bg-white rounded-2xl border border-slate-100 shadow-sm p-5 sm:p-7 xl:p-8 flex flex-col gap-4 sm:gap-5 h-full hover:shadow-md transition-shadow duration-300">
                    <div className="flex gap-1">
                      {Array.from({ length: item.stars }).map((_, s) => (
                        <Star
                          key={s}
                          className="w-4 h-4 fill-amber-400 text-amber-400"
                        />
                      ))}
                    </div>
                    <p className="text-body-md text-slate-600 flex-1 leading-[1.75]">
                      &ldquo;{item.quote}&rdquo;
                    </p>
                    <div className="flex items-center gap-3 pt-5 border-t border-slate-100">
                      {item.photoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={item.photoUrl}
                          alt={item.name}
                          className="w-9 h-9 rounded-full object-cover shrink-0"
                        />
                      ) : (
                        <div
                          className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center text-white font-bold shrink-0"
                          style={{ fontSize: "0.6875rem" }}
                        >
                          {item.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </div>
                      )}
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
                          {item.role}
                        </p>
                      </div>
                    </div>
                  </div>
                </AnimateIn>
              ))}
            </div>

            {googleReviews.length > 0 && (
              <AnimateIn className="text-center mt-10">
                <a
                  href="https://www.google.com/maps/search/?api=1&query=1%2F108+Pelawaththa+Circle+Road%2C+Hittatiya+Central%2C+Matara%2C+Sri+Lanka"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-900 transition-colors"
                >
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  {t("testimonials.googleLink")}
                </a>
              </AnimateIn>
            )}
          </div>
        </section>

        {/* ══ FAQ ═══════════════════════════════════════════════════════ */}
        <section id="faq" className="scroll-mt-20 section-y section-x bg-white">
          <div className="max-w-3xl mx-auto">
            <AnimateIn className="text-center mb-10 sm:mb-14 xl:mb-16">
              <SectionLabel>{t("faq.eyebrow")}</SectionLabel>
              <h2 className="text-display-lg text-slate-900">
                {t("faq.headingStart")}
                <span className="bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                  {t("faq.headingHighlight")}
                </span>
              </h2>
              <p className="text-body-xl text-slate-500 mt-5 max-w-lg mx-auto">
                {t("faq.subtitle")}
              </p>
            </AnimateIn>

            <div className="flex flex-col gap-3">
              {faqItems.map((item, i) => (
                <AnimateIn key={i} delay={i * 0.04}>
                  <details
                    className="group pcb-card bg-white rounded-2xl border border-slate-100 shadow-sm open:shadow-md transition-shadow duration-300"
                    onToggle={(e) => {
                      /* onToggle also fires on collapse — only the open is interesting. */
                      if (!e.currentTarget.open) return;
                      track("faq_open", {
                        faq_index: i,
                        faq_question: item.q,
                        locale,
                      });
                    }}
                  >
                    <summary className="flex items-center justify-between gap-4 cursor-pointer list-none p-6 select-none">
                      <span className="font-semibold text-slate-900 text-body-lg">
                        {item.q}
                      </span>
                      <ChevronDown className="w-5 h-5 text-slate-400 shrink-0 transition-transform duration-300 group-open:rotate-180" />
                    </summary>
                    <p className="text-body-md text-slate-500 px-6 pb-6 -mt-2 leading-[1.75]">
                      {item.a}
                    </p>
                  </details>
                </AnimateIn>
              ))}
            </div>
          </div>
        </section>

        {/* ══ Contact ═══════════════════════════════════════════════════ */}
        <section
          className="section-y section-x bg-gradient-to-b from-slate-50 via-white to-slate-50 relative overflow-hidden"
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

          <div id="contact" className="max-w-screen-2xl mx-auto relative z-10 scroll-mt-24">
            <AnimateIn className="text-center mb-10 sm:mb-12 xl:mb-14">
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

            <div className="grid md:grid-cols-2 gap-5 sm:gap-8 xl:gap-12 max-w-4xl mx-auto items-stretch">
              {/* Contact channels — presented as a 4-pin connector header,
                  echoing the site's circuit-board signature instead of a
                  generic icon-list card. */}
              <AnimateIn delay={0.1} className="h-full">
                <div className="bg-white rounded-3xl border border-slate-200/70 shadow-xl shadow-slate-200/50 h-full flex flex-col overflow-hidden">
                  <div className="px-5 pt-6 sm:px-8 sm:pt-8 xl:px-10 xl:pt-10 pb-4 sm:pb-6 flex items-baseline justify-between gap-3">
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
                        value: "+94 76 397 7035",
                        href: "https://wa.me/94763977035",
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
                        href: "https://www.google.com/maps/search/?api=1&query=1%2F108+Pelawaththa+Circle+Road%2C+Hittatiya+Central%2C+Matara%2C+Sri+Lanka",
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
                        onClick={
                          c.id === "whatsapp"
                            ? () => track("whatsapp_click", { source: "contact_card" })
                            : undefined
                        }
                        className={`group relative flex flex-col gap-2.5 sm:gap-3 p-4 sm:p-6 border-slate-100 ${c.hoverBg} transition-colors duration-200 ${
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
                  <div className="flex gap-1.5 px-5 sm:px-8 xl:px-10 py-3 border-t border-slate-100 bg-slate-50/60">
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
                  className="rounded-3xl p-6 sm:p-8 xl:p-10 flex flex-col justify-between h-full relative overflow-hidden shadow-xl shadow-blue-950/20"
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
                      onClick={() => {
                        track("register_cta_click", { source: "contact_section" });
                        openRegisterModal();
                      }}
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
          className="text-white pt-12 sm:pt-14 pb-8 sm:pb-10 px-[clamp(1.25rem,2vw,2.5rem)]"
          style={{ backgroundColor: "var(--brand-navy)" }}
        >
          <div className="w-full">
            <div className="flex flex-col md:flex-row items-start justify-between gap-9 md:gap-12 pb-9 md:pb-12 border-b border-white/10">
              {/* Brand */}
              <div className="w-full max-w-none md:max-w-[300px]">
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
              <div className="w-full md:w-auto grid grid-cols-2 gap-x-6 sm:gap-x-16 gap-y-3">
                <div>
                  <p className="text-label text-slate-500 mb-4">{t("footer.programsHeading")}</p>
                  {(t.raw("footer.programLinks") as string[]).map((l) => (
                    <a
                      key={l}
                      href="#programs"
                      className="block text-slate-400 hover:text-white py-1.5 md:py-0 md:mb-2.5 transition-colors"
                      style={{ fontSize: "0.875rem" }}
                    >
                      {l}
                    </a>
                  ))}
                </div>
                <div>
                  <p className="text-label text-slate-500 mb-4">{t("footer.academyHeading")}</p>
                  {(t.raw("footer.academyLinks") as string[]).map((l, i) => {
                    const hrefs = ["#about", "#team", undefined, "#contact"];
                    const href = hrefs[i];
                    return (
                      <a
                        key={l}
                        href={href ?? "#"}
                        onClick={
                          href
                            ? undefined
                            : () => {
                                track("register_cta_click", { source: "footer_link" });
                                openRegisterModal();
                              }
                        }
                        className="block text-slate-400 hover:text-white py-1.5 md:py-0 md:mb-2.5 transition-colors"
                        style={{ fontSize: "0.875rem" }}
                      >
                        {l}
                      </a>
                    );
                  })}
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

            <p
              className="text-center text-slate-500/70 mt-4"
              style={{ fontSize: "0.75rem" }}
            >
              {t("footer.company")}
            </p>
          </div>
        </footer>
      </motion.main>

      {/* ── Floating WhatsApp button — sits one slot above the AI assistant
             launcher, which occupies the bottom corner ── */}
      <a
        href="https://wa.me/94763977035"
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => track("whatsapp_click", { source: "floating_button" })}
        aria-label="Chat on WhatsApp"
        className="fixed bottom-20 right-4 md:bottom-[5.25rem] md:right-5 xl:bottom-[5.5rem] xl:right-6 z-40 flex items-center justify-center w-12 h-12 md:w-11 md:h-11 xl:w-12 xl:h-12 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 active:scale-95"
        style={{ backgroundColor: "#25D366" }}
      >
        <WhatsAppIcon className="w-5 h-5 text-white" />
      </a>

      {/* Renders nothing unless Settings → AI Assistant is enabled. */}
      <ChatWidget />
    </>
  );
}
