"use client";

import { useTranslations } from "next-intl";
import { Video, Users, History, Lock } from "lucide-react";
import AnimateIn from "@/components/AnimateIn";
import SectionLabel from "@/components/landing/SectionLabel";

// Icons matched to the 4 safety cards
const ICONS = [Video, Users, History, Lock];

export default function SafetySection() {
  const t = useTranslations();
  const cards = t.raw("safety.cards") as { title: string; desc: string }[];

  return (
    <section className="py-16 section-x xl:py-24 relative z-10">
      <div className="max-w-screen-xl mx-auto">
        {/* Header */}
        <AnimateIn className="text-center mb-10 xl:mb-16">
          <SectionLabel>{t("safety.eyebrow")}</SectionLabel>
          <h2 className="text-display-lg text-slate-900">
            {t("safety.headingStart")}
            <span
              className="bg-clip-text text-transparent"
              style={{
                backgroundImage:
                  "linear-gradient(to right, var(--brand-blue), var(--brand-red))",
              }}
            >
              {t("safety.headingHighlight")}
            </span>
          </h2>
          <p className="text-body-xl text-slate-600 mt-4 max-w-2xl mx-auto drop-shadow-sm">
            {t("safety.subtitle")}
          </p>
        </AnimateIn>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 xl:gap-6">
          {cards.map((card, i) => {
            const Icon = ICONS[i % ICONS.length];
            return (
              <AnimateIn key={card.title} delay={i * 0.15} className="h-full">
                <div className="h-full flex flex-col bg-white/70 backdrop-blur-xl border border-white shadow-xl hover:shadow-2xl transition-all duration-300 rounded-3xl p-6 lg:p-7 hover:-translate-y-1">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0 mb-5 shadow-inner">
                    <Icon className="w-6 h-6 text-indigo-500" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 tracking-tight mb-2.5">
                    {card.title}
                  </h3>
                  <p className="text-slate-600 text-sm leading-relaxed font-medium">
                    {card.desc}
                  </p>
                </div>
              </AnimateIn>
            );
          })}
        </div>
      </div>
    </section>
  );
}
