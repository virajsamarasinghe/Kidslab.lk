"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { Award, GraduationCap, MapPin, CheckCircle } from "lucide-react";
import AnimateIn from "@/components/AnimateIn";
import SectionLabel from "@/components/landing/SectionLabel";

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

export default function FoundersSection() {
  const t = useTranslations();

  return (
    <section
      id="team"
      className="scroll-mt-20 py-16 section-x xl:py-20 relative overflow-hidden lg:min-h-[calc(100svh-5rem)] flex flex-col justify-center"
    >
      <div className="max-w-screen-2xl mx-auto relative z-10 w-full">
        {/* Header */}
        <AnimateIn className="text-center mb-8 xl:mb-12">
          <SectionLabel>
            {t("team.eyebrow")}
          </SectionLabel>
          <h2 className="text-display-lg text-slate-900">
            {t("team.headingStart")}
            <span
              className="bg-clip-text text-transparent"
              style={{
                backgroundImage:
                  "linear-gradient(to right, var(--brand-blue), var(--brand-red))",
              }}
            >
              {t("team.headingHighlight")}
            </span>
          </h2>
          <p className="text-body-xl text-slate-600 mt-4 max-w-xl mx-auto">
            {t("team.subtitle")}
          </p>
        </AnimateIn>

        {/* Founder cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 xl:gap-8 max-w-xl xl:max-w-3xl mx-auto">
          {founders.map((f, i) => (
            <AnimateIn key={f.name} delay={i * 0.15} className="h-full">
              <div className="h-full flex flex-col items-center text-center gap-3 rounded-3xl bg-white/70 border border-white px-6 py-8 xl:py-10 backdrop-blur-xl hover:-translate-y-1 transition-all duration-300 shadow-xl hover:shadow-2xl">
                {/* Avatar */}
                <div className="relative w-32 h-32 xl:w-40 xl:h-40 rounded-full overflow-hidden ring-4 ring-indigo-100 shadow-md shrink-0 mb-3">
                  <Image
                    src={f.photo}
                    alt={f.name}
                    fill
                    className="object-cover object-top"
                    sizes="160px"
                  />
                </div>

                {/* Co-Founder badge */}
                <span className="inline-flex items-center gap-1.5 bg-indigo-100 text-indigo-700 border border-indigo-200 font-bold rounded-full px-3 py-1 text-[10px] tracking-widest uppercase shadow-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />
                  {t("team.coFounder")}
                </span>

                {/* Name + role */}
                <div>
                  <h3 className="text-slate-900 font-extrabold tracking-tight text-lg xl:text-xl">
                    {f.name}
                  </h3>
                  <p className="text-indigo-600 font-medium text-sm xl:text-base mt-1">
                    {t("team.role")}
                  </p>
                </div>

                {/* Degree + university */}
                <div className="flex flex-col items-center gap-1.5 mt-2">
                  <div className="flex items-center gap-2 text-slate-700 text-sm font-semibold">
                    <Award className="w-4 h-4 shrink-0 text-indigo-500" />
                    {t("team.degree")}
                  </div>
                  <div className="flex items-center gap-2 text-slate-600 text-sm">
                    <GraduationCap className="w-4 h-4 shrink-0 text-indigo-500" />
                    {t("team.university")}
                  </div>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap justify-center gap-2 mt-4 mb-3">
                  {(t.raw("team.tags") as string[]).map((tag) => (
                    <span
                      key={tag}
                      className="bg-indigo-50 text-indigo-700 border border-indigo-100 px-3 py-1 rounded-full text-xs font-semibold tracking-wide"
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
                  className="mt-auto inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-[#0A66C2]/30 bg-white hover:bg-[#0A66C2] text-[#0A66C2] hover:text-white transition-all duration-300 font-semibold text-sm shadow-sm"
                >
                  <LinkedInIcon className="w-4 h-4 shrink-0" />
                  {t("team.linkedin")}
                </a>
              </div>
            </AnimateIn>
          ))}
        </div>

        {/* Credentials */}
        <AnimateIn delay={0.25} className="mt-10 xl:mt-12">
          <div className="max-w-3xl xl:max-w-4xl mx-auto">
            <h3 className="text-center text-slate-800 font-bold tracking-tight mb-4 xl:mb-6 text-base xl:text-lg">
              {t("team.credentialsHeading")}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 xl:gap-5">
              {(
                t.raw("team.credentials") as { title: string; desc: string }[]
              ).map((c) => (
                <div
                  key={c.title}
                  className="flex gap-4 rounded-2xl bg-white/70 border border-white px-5 py-4 backdrop-blur-xl shadow-md hover:shadow-lg transition-all"
                >
                  <CheckCircle className="w-5 h-5 shrink-0 mt-0.5 text-indigo-500" />
                  <div>
                    <p className="text-slate-900 font-semibold text-sm xl:text-base leading-snug">
                      {c.title}
                    </p>
                    <p className="text-slate-600 text-sm leading-relaxed mt-1">
                      {c.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </AnimateIn>

        {/* University strip */}
        <AnimateIn delay={0.3} className="mt-8 xl:mt-10">
          <div className="max-w-3xl xl:max-w-4xl mx-auto bg-white/70 border border-white rounded-2xl px-8 xl:px-12 py-5 flex flex-col sm:flex-row items-center justify-center gap-4 xl:gap-10 backdrop-blur-xl shadow-md">
            <div className="flex items-center gap-3">
              <GraduationCap className="w-5 h-5 xl:w-6 xl:h-6 text-indigo-500 shrink-0" />
              <p className="text-slate-800 font-semibold text-sm xl:text-base tracking-wide">
                {t("team.universityStrip")}
              </p>
            </div>
            <div className="hidden sm:block w-px h-6 bg-slate-200" />
            <div className="flex items-center gap-3">
              <MapPin className="w-4 h-4 xl:w-5 xl:h-5 text-indigo-500 shrink-0" />
              <p className="text-slate-600 font-medium text-sm xl:text-base">
                {t("team.location")}
              </p>
            </div>
          </div>
        </AnimateIn>
      </div>
    </section>
  );
}
