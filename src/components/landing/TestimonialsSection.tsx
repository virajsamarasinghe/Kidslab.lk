"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { Star } from "lucide-react";
import AnimateIn from "@/components/AnimateIn";
import SectionLabel from "@/components/landing/SectionLabel";
import type { GoogleReview } from "@/lib/google-reviews";

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

export default function TestimonialsSection({ googleReviews = [] }: { googleReviews?: GoogleReview[] }) {
  const t = useTranslations();

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

  return (
    <section className="section-y section-x bg-slate-50 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-indigo-50 rounded-full blur-3xl opacity-50 -z-10" />
      <div className="max-w-6xl mx-auto">
        <AnimateIn className="text-center mb-10 sm:mb-14 xl:mb-16">
          <SectionLabel className="text-emerald-600">
            {t("testimonials.eyebrow")}
          </SectionLabel>
          <h2 className="text-display-lg text-slate-900">
            {t("testimonials.headingStart")}
            <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
              {t("testimonials.headingHighlight")}
            </span>
          </h2>
        </AnimateIn>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6 items-stretch">
          {displayTestimonials.map((item, i) => (
            <AnimateIn key={`${item.name}-${i}`} delay={i * 0.1} className="h-full">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 flex flex-col gap-5 h-full hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                <div className="flex gap-1">
                  {Array.from({ length: item.stars }).map((_, s) => (
                    <Star
                      key={s}
                      className="w-4 h-4 fill-amber-400 text-amber-400"
                    />
                  ))}
                </div>
                <p className="text-body-md text-slate-600 flex-1 leading-[1.75] italic">
                  &ldquo;{item.quote}&rdquo;
                </p>
                <div className="flex items-center gap-4 pt-5 border-t border-slate-100">
                  {item.photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.photoUrl}
                      alt={item.name}
                      className="w-10 h-10 rounded-full object-cover shrink-0 ring-2 ring-indigo-50"
                    />
                  ) : (
                    <div
                      className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-blue-500 flex items-center justify-center text-white font-bold shrink-0 ring-2 ring-indigo-50"
                      style={{ fontSize: "0.75rem" }}
                    >
                      {item.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </div>
                  )}
                  <div>
                    <p
                      className="font-bold text-slate-900"
                      style={{
                        fontSize: "0.9375rem",
                        letterSpacing: "-0.01em",
                      }}
                    >
                      {item.name}
                    </p>
                    <p
                      className="text-slate-500 mt-0.5"
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
          <AnimateIn className="text-center mt-12">
            <a
              href="https://www.google.com/maps/search/?api=1&query=1%2F108+Pelawaththa+Circle+Road%2C+Hittatiya+Central%2C+Matara%2C+Sri+Lanka"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-white border border-slate-200 text-sm font-semibold text-slate-600 hover:text-slate-900 hover:border-slate-300 hover:shadow-md transition-all"
            >
              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
              {t("testimonials.googleLink")}
            </a>
          </AnimateIn>
        )}
      </div>
    </section>
  );
}
