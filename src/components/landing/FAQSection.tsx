"use client";

import { useTranslations } from "next-intl";
import { ChevronDown } from "lucide-react";
import AnimateIn from "@/components/AnimateIn";
import SectionLabel from "@/components/landing/SectionLabel";

const FAQ_COUNT = 10;

export default function FAQSection() {
  const t = useTranslations();

  return (
    <section id="faq" className="scroll-mt-20 section-y section-x bg-white relative">
      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-amber-50/50 rounded-full blur-3xl opacity-50 -z-10 pointer-events-none" />
      <div className="max-w-3xl mx-auto">
        <AnimateIn className="text-center mb-10 sm:mb-14 xl:mb-16">
          <SectionLabel>{t("faq.eyebrow")}</SectionLabel>
          <h2 className="text-display-lg text-slate-900">
            {t("faq.headingStart")}
            <span className="bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent">
              {t("faq.headingHighlight")}
            </span>
          </h2>
          <p className="text-body-xl text-slate-500 mt-5 max-w-lg mx-auto">
            {t("faq.subtitle")}
          </p>
        </AnimateIn>

        <div className="flex flex-col gap-4">
          {Array.from({ length: FAQ_COUNT }).map((_, i) => (
            <AnimateIn key={i} delay={i * 0.04}>
              <details className="group bg-white rounded-2xl border border-slate-200 shadow-sm open:shadow-md hover:border-slate-300 transition-all duration-300">
                <summary className="flex items-center justify-between gap-4 cursor-pointer list-none p-6 select-none focus:outline-none rounded-2xl focus-visible:ring-2 focus-visible:ring-amber-500">
                  <span className="font-semibold text-slate-900 text-body-lg group-hover:text-amber-600 transition-colors">
                    {t(`faq.items.${i}.q`)}
                  </span>
                  <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center shrink-0 group-hover:bg-amber-50 transition-colors">
                    <ChevronDown className="w-5 h-5 text-slate-400 group-hover:text-amber-500 shrink-0 transition-transform duration-300 group-open:rotate-180" />
                  </div>
                </summary>
                <div className="overflow-hidden">
                  <p className="text-body-md text-slate-600 px-6 pb-6 -mt-2 leading-[1.75]">
                    {t(`faq.items.${i}.a`)}
                  </p>
                </div>
              </details>
            </AnimateIn>
          ))}
        </div>
      </div>
    </section>
  );
}
