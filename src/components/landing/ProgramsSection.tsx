"use client";

import { useMemo, useRef, useState } from "react";
import { motion } from "motion/react";
import { useTranslations } from "next-intl";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";
import AnimateIn from "@/components/AnimateIn";
import SectionLabel from "@/components/landing/SectionLabel";
import { useRegisterModal } from "@/lib/register-modal-context";
import type { Course } from "@/types/course";

export default function ProgramsSection({ courses }: { courses: Course[] }) {
  const t = useTranslations();
  const { openRegisterModal } = useRegisterModal();
  
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

  return (
    <section id="programs" className="scroll-mt-20 section-y section-x relative overflow-hidden">
      {/* Decorative background blob */}
      <div className="absolute top-40 left-0 w-96 h-96 bg-indigo-100 rounded-full blur-3xl opacity-50 -z-10 pointer-events-none mix-blend-multiply" />
      <div className="absolute bottom-40 right-0 w-96 h-96 bg-rose-100 rounded-full blur-3xl opacity-50 -z-10 pointer-events-none mix-blend-multiply" />

      <div className="max-w-screen-2xl mx-auto">
        <AnimateIn className="text-center mb-10 sm:mb-14 xl:mb-16">
          <SectionLabel>{t("programs.eyebrow")}</SectionLabel>
          <h2 className="text-display-lg text-slate-900">
            {t("programs.headingStart")}
            <span
              className="bg-clip-text text-transparent"
              style={{
                backgroundImage:
                  "linear-gradient(to right, var(--brand-blue), var(--brand-navy))",
              }}
            >
              {t("programs.headingHighlight")}
            </span>
          </h2>
          <p className="text-body-xl text-slate-600 mt-5 max-w-lg mx-auto">
            {t("programs.subtitle")}
          </p>
        </AnimateIn>

        <AnimateIn className="max-w-4xl xl:max-w-5xl mx-auto relative">
          <div
            ref={courseScrollRef}
            onScroll={(e) => {
              const el = e.currentTarget;
              const idx = Math.round(el.scrollLeft / Math.max(el.clientWidth, 1));
              if (idx !== activeCourseIndex) setActiveCourseIndex(idx);
            }}
            className="flex overflow-x-auto snap-x snap-mandatory scroll-smooth no-scrollbar rounded-3xl pb-4"
            style={{ scrollbarWidth: "none" }}
          >
            {programCards.map((card, i) => (
              <div key={card.id} className="w-full shrink-0 snap-center px-2">
                <motion.div
                  className="rounded-3xl"
                  animate={{
                    boxShadow: [
                      "0 0 0 0px rgba(242,100,87,0.2), 0 10px 40px rgba(15,23,42,0.06)",
                      "0 0 0 5px rgba(242,100,87,0.1), 0 10px 40px rgba(15,23,42,0.1)",
                      "0 0 0 10px rgba(242,100,87,0), 0 10px 40px rgba(15,23,42,0.06)",
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
                    className="relative rounded-3xl border border-slate-200 overflow-hidden bg-white hover:border-indigo-200 transition-colors duration-300"
                  >
                    <span
                      className="absolute top-0 right-4 sm:right-6 z-10 px-3 py-1.5 text-white text-[10px] sm:text-[11px] font-semibold tracking-widest uppercase inline-flex items-center gap-1.5 rounded-b-lg shadow-sm"
                      style={{ backgroundColor: "var(--brand-red)" }}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-yellow-300 animate-pulse shrink-0" />
                      {card.badgeText}
                    </span>

                    <div className="flex flex-col md:grid md:grid-cols-[1.35fr_1fr] md:grid-rows-[1fr_auto]">
                      <div className="md:col-start-1 md:row-start-1 p-6 sm:p-8 xl:p-10 pt-12 sm:pt-14 flex flex-col gap-4 sm:gap-5">
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

                        <div
                          className="rounded-xl px-4 py-3 flex gap-3 items-start bg-indigo-50/50 border border-indigo-100"
                        >
                          <Star
                            className="w-4 h-4 mt-0.5 shrink-0"
                            style={{ color: "var(--brand-yellow)" }}
                          />
                          <p className="text-[13px] text-slate-700 leading-snug">
                            {card.seminarNote}
                          </p>
                        </div>

                        {card.instructorNames && (
                          <p className="text-[13px] text-slate-500">
                            <span className="font-semibold text-slate-700">Conducted by:</span>{" "}
                            {card.instructorNames}
                          </p>
                        )}
                      </div>

                      <div className="order-last md:order-none md:col-start-1 md:row-start-2 px-6 pb-6 pt-2 sm:px-8 sm:pb-8 xl:px-10 xl:pb-10 md:pt-0">
                        <button
                          onClick={openRegisterModal}
                          className="w-full text-white font-semibold h-12 md:h-11 rounded-full text-[15px] md:text-[14px] tracking-[-0.01em] hover:-translate-y-0.5 hover:shadow-lg transition-all duration-300"
                          style={{ backgroundColor: "var(--brand-navy)" }}
                        >
                          {card.ctaLabel}
                        </button>
                      </div>

                      <div
                        className="md:col-start-2 md:row-start-1 md:row-span-2 px-6 py-4 sm:p-8 xl:p-10 flex flex-col justify-center border-t md:border-t-0 md:border-l border-slate-100"
                        style={{ backgroundColor: "var(--brand-paper)" }}
                      >
                        {[
                          { label: t("programs.card.levelLabel"), value: card.level },
                          { label: t("programs.card.durationLabel"), value: card.duration },
                          ...(card.schedule
                            ? [{ label: t("programs.card.scheduleLabel"), value: card.schedule }]
                            : []),
                          { label: t("programs.courseFee"), value: card.feeLabel, note: card.installmentNote },
                        ].map((row, ri, arr) => (
                          <div
                            key={row.label}
                            className={`py-3 sm:py-4 ${ri < arr.length - 1 ? "border-b border-slate-200/60" : ""}`}
                          >
                            <div className="flex items-baseline justify-between gap-3 sm:block">
                              <p className="text-label text-slate-500 shrink-0 uppercase tracking-wide text-xs font-semibold">
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

          {programCards.length > 1 && (
            <>
              <button
                aria-label="Previous program"
                onClick={() => scrollToCourse(activeCourseIndex - 1)}
                disabled={activeCourseIndex === 0}
                className="hidden md:flex absolute top-1/2 -left-5 -translate-y-1/2 items-center justify-center w-10 h-10 rounded-full bg-white shadow-lg border border-slate-100 text-slate-500 hover:text-[color:var(--brand-blue)] hover:border-indigo-200 transition-all disabled:opacity-0 disabled:pointer-events-none hover:scale-105"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                aria-label="Next program"
                onClick={() => scrollToCourse(activeCourseIndex + 1)}
                disabled={activeCourseIndex === programCards.length - 1}
                className="hidden md:flex absolute top-1/2 -right-5 -translate-y-1/2 items-center justify-center w-10 h-10 rounded-full bg-white shadow-lg border border-slate-100 text-slate-500 hover:text-[color:var(--brand-blue)] hover:border-indigo-200 transition-all disabled:opacity-0 disabled:pointer-events-none hover:scale-105"
              >
                <ChevronRight className="w-5 h-5" />
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
  );
}
