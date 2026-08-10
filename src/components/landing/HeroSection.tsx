"use client";

import { useRef, useMemo, useState, useEffect } from "react";
import { motion, AnimatePresence, useScroll, useTransform } from "motion/react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle, GraduationCap, MapPin } from "lucide-react";
import { useRegisterModal } from "@/lib/register-modal-context";
import CountUp from "@/components/CountUp";

const INDIGO_GRADIENT = "linear-gradient(to right, #93c5fd, #a5b4fc)"; // Lighter blue/indigo for dark backgrounds
const CORAL_GRADIENT = "linear-gradient(to right, #fda4af, #fb7185)"; // Lighter coral/rose for dark backgrounds

function getHeroSentences(t: ReturnType<typeof useTranslations>) {
  return [
    [
      { text: t("hero.sentence1.part1") },
      { text: t("hero.sentence1.highlight1"), gradient: INDIGO_GRADIENT },
      { text: t("hero.sentence1.part2") },
      { text: t("hero.sentence1.highlight2"), gradient: CORAL_GRADIENT },
      { text: t("hero.sentence1.part3") },
    ],
    [
      { text: t("hero.sentence2.part1") },
      { text: t("hero.sentence2.highlight1"), gradient: INDIGO_GRADIENT },
      { text: t("hero.sentence2.part2") },
      { text: t("hero.sentence2.highlight2"), gradient: CORAL_GRADIENT },
      { text: t("hero.sentence2.part3") },
    ],
  ];
}

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

function UniversityBannerContent() {
  const t = useTranslations();
  return (
    <div className="max-w-screen-2xl mx-auto flex items-start sm:items-center justify-center gap-2.5">
      <GraduationCap className="w-4 h-4 text-indigo-300 shrink-0 mt-0.5 sm:mt-0" />
      <p
        className="text-center text-[0.75rem] sm:text-[0.8125rem] leading-relaxed"
        style={{
          color: "rgba(255,255,255,0.85)",
          letterSpacing: "0.01em",
        }}
      >
        {t("universityBanner.prefix")}
        <span className="font-bold text-white">{t("universityBanner.bold")}</span>
        <span className="text-indigo-400 mx-1.5 sm:mx-2">·</span>
        <span className="inline-flex items-center gap-1 text-indigo-200 whitespace-nowrap">
          <MapPin className="w-3 h-3 shrink-0" /> {t("universityBanner.location")}
        </span>
      </p>
    </div>
  );
}

export default function HeroSection({ stats }: { stats: { value: string; label: string }[] }) {
  const t = useTranslations();
  const { openRegisterModal } = useRegisterModal();
  const heroSentences = useMemo(() => getHeroSentences(t), [t]);
  const statLabels = t.raw("stats.labels") as string[];

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const bgImages = ["/hero-bg-1.png", "/hero-bg-2.png", "/hero-bg-3.png"];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % bgImages.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const heroY = useTransform(scrollYProgress, [0, 1], ["0%", "18%"]);
  const bannerY = useTransform(scrollYProgress, [0, 1], ["0%", "-100%"]);

  return (
    <>
      <section
        ref={heroRef}
        className="relative lg:min-h-svh lg:h-svh flex items-center pt-16 pb-20 lg:pb-28 overflow-hidden"
      >
        {/* Background Images Carousel */}
        <div className="absolute inset-0 z-0 bg-slate-950">
          <AnimatePresence mode="popLayout">
            <motion.img
              key={currentImageIndex}
              src={bgImages[currentImageIndex]}
              alt="Hero Background"
              className="absolute inset-0 w-full h-full object-cover"
              initial={{ opacity: 0, scale: 1.05 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.5, ease: "easeInOut" }}
            />
          </AnimatePresence>
          {/* Dark Overlay for Readability */}
          <div className="absolute inset-0 bg-slate-950/30 mix-blend-multiply" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/60 to-transparent opacity-50" />
        </div>

        <motion.div
          style={{ y: heroY }}
          className="relative z-10 max-w-screen-xl mx-auto px-5 sm:px-6 lg:px-10 xl:px-16 w-full py-10 sm:py-14 lg:py-20 xl:py-28"
        >
          <div className="max-w-4xl mx-auto text-center">
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
                  borderRadius: "9999px", // More pill-like and friendly
                  boxShadow: "0 4px 14px 0 rgba(15,23,42,0.1)",
                }}
              >
                <span className="w-1.5 h-1.5 rounded-full animate-pulse bg-emerald-400" />
                {t("hero.badge")}
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-display-xl hero-headline text-white drop-shadow-lg"
            >
              <TypingHeadline srText={t("hero.srText")} sentences={heroSentences} />
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-lg sm:text-xl text-slate-300 mt-5 max-w-2xl mx-auto drop-shadow-md"
            >
              {t("hero.subtitlePrefix")}
              <span className="font-semibold text-white">
                {t("hero.subtitleBold")}
              </span>
              {t("hero.subtitleSuffix")}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="mt-8 lg:mt-10 flex flex-col sm:flex-row sm:flex-wrap justify-center gap-4"
            >
              <motion.div
                className="rounded-full w-full sm:w-auto"
                animate={{
                  boxShadow: [
                    "0 0 0 0px rgba(242,100,87,0.45)",
                    "0 0 0 7px rgba(242,100,87,0.13)",
                    "0 0 0 14px rgba(242,100,87,0)",
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
                  className="btn-register w-full sm:w-auto text-white font-semibold px-6 sm:px-8 xl:px-10 h-12 xl:h-14 2xl:h-16 rounded-full text-[15px] xl:text-base 2xl:text-lg tracking-[-0.01em] shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all"
                  style={{ backgroundColor: "var(--brand-red)" }}
                >
                  {t("hero.ctaRegister")}
                  <ArrowRight className="ml-2 w-4 h-4 shrink-0" />
                </Button>
              </motion.div>
              <a href="#programs" className="w-full sm:w-auto">
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full sm:w-auto bg-transparent border-2 border-white/30 text-white hover:bg-white/10 hover:text-white hover:border-white/50 px-6 sm:px-8 xl:px-10 h-12 xl:h-14 2xl:h-16 rounded-full text-[15px] xl:text-base 2xl:text-lg tracking-[-0.01em] font-medium transition-all shadow-sm"
                >
                  {t("hero.ctaExplore")}
                </Button>
              </a>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.44 }}
              className="mt-8 lg:mt-12 grid grid-cols-2 gap-x-4 gap-y-3 text-left sm:flex sm:flex-wrap sm:justify-center sm:gap-6 sm:text-center"
            >
              {[t("hero.trust1"), t("hero.trust2"), t("hero.trust3"), t("hero.trust4")].map(
                (label) => (
                  <div
                    key={label}
                    className="flex items-center gap-2 text-slate-300 min-w-0"
                    style={{ fontSize: "0.8125rem" }}
                  >
                    <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="font-medium">{label}</span>
                  </div>
                ),
              )}
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* Stats bar Strip */}
      <div className="relative z-20 -mt-6 sm:-mt-8 lg:-mt-12 max-w-screen-xl mx-auto px-5 sm:px-6 lg:px-10 xl:px-16 mb-8 lg:mb-12">
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, delay: 0.58 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 xl:gap-6"
        >
          {stats.map(({ value, label }, i) => (
            <div
              key={label}
              className="bg-white/70 backdrop-blur-xl rounded-2xl border border-white/50 shadow-xl shadow-slate-200/50 px-3 sm:px-6 xl:px-8 py-5 sm:py-6 xl:py-8 flex flex-col items-center text-center min-w-0 hover:shadow-2xl hover:bg-white/90 transition-all duration-300 hover:-translate-y-1"
            >
              <p
                className="font-extrabold text-indigo-900 leading-none tracking-tight"
                style={{
                  fontSize: "clamp(1.5rem, 5.5vw, 2rem)",
                  fontFamily: "var(--font-display)",
                }}
              >
                <CountUp value={value} />
              </p>
              <p
                className="text-slate-600 mt-1.5 font-medium"
                style={{ fontSize: "clamp(0.75rem, 2.6vw, 0.875rem)" }}
              >
                {statLabels[i]}
              </p>
            </div>
          ))}
        </motion.div>
      </div>

      {/* University Banner */}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-900 py-4 px-5 sm:px-6 border-y border-indigo-500/20">
        <UniversityBannerContent />
      </div>
    </>
  );
}
