"use client";

import { useTranslations } from "next-intl";
import {
  Target,
  Award,
  Users,
  FlaskConical,
  GraduationCap,
  Zap,
} from "lucide-react";
import AnimateIn from "@/components/AnimateIn";
import SectionLabel from "@/components/landing/SectionLabel";

const whyUsIcons = [
  { icon: Target, color: "text-indigo-600", bg: "bg-indigo-50" },
  { icon: Award, color: "text-rose-600", bg: "bg-rose-50" },
  { icon: Users, color: "text-amber-600", bg: "bg-amber-50" },
  { icon: FlaskConical, color: "text-emerald-600", bg: "bg-emerald-50" },
  { icon: GraduationCap, color: "text-sky-600", bg: "bg-sky-50" },
  { icon: Zap, color: "text-violet-600", bg: "bg-violet-50" },
];

export default function WhyUsSection() {
  const t = useTranslations();

  return (
    <section id="about" className="scroll-mt-20 section-y section-x relative">
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
            <span className="bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">
              {t("about.headingHighlight")}
            </span>
          </h2>
          <p className="text-body-xl text-slate-500 mt-5 max-w-lg mx-auto">
            {t("about.subtitle")}
          </p>
        </AnimateIn>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 items-stretch">
          {whyUsIcons.map((item, i) => {
            const Icon = item.icon;
            return (
              <AnimateIn key={i} delay={i * 0.07} className="h-full">
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 sm:p-8 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 h-full flex flex-col items-start group">
                  <div className={`w-12 h-12 rounded-xl ${item.bg} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className={`w-6 h-6 ${item.color}`} />
                  </div>
                  <h4 className="text-display-md text-slate-900 mb-3">
                    {t(`about.cards.${i}.title`)}
                  </h4>
                  <p className="text-body-md text-slate-500 leading-relaxed">
                    {t(`about.cards.${i}.desc`)}
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
