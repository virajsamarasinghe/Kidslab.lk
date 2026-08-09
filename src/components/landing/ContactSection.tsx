"use client";

import { useTranslations } from "next-intl";
import { CheckCircle, ChevronRight, MapPin } from "lucide-react";
import AnimateIn from "@/components/AnimateIn";
import SectionLabel from "@/components/landing/SectionLabel";
import WhatsAppIcon from "@/components/WhatsAppIcon";
import FacebookIcon from "@/components/FacebookIcon";
import { useRegisterModal } from "@/lib/register-modal-context";

export default function ContactSection() {
  const t = useTranslations();
  const { openRegisterModal } = useRegisterModal();

  return (
    <section className="section-y section-x bg-gradient-to-b from-slate-50 via-white to-slate-50 relative overflow-hidden">
      {/* Decorative blobs */}
      <div
        className="absolute -left-40 top-10 w-96 h-96 rounded-full opacity-[0.05] pointer-events-none mix-blend-multiply blur-3xl"
        style={{
          background: "radial-gradient(circle, var(--brand-navy), transparent)",
        }}
      />
      <div
        className="absolute -right-40 bottom-10 w-96 h-96 rounded-full opacity-[0.05] pointer-events-none mix-blend-multiply blur-3xl"
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
                  "linear-gradient(to right, var(--brand-blue), var(--brand-navy))",
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
          <AnimateIn delay={0.1} className="h-full">
            <div className="bg-white rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/50 h-full flex flex-col overflow-hidden hover:border-slate-300 transition-colors">
              <div className="px-5 pt-6 sm:px-8 sm:pt-8 xl:px-10 xl:pt-10 pb-4 sm:pb-6 flex items-baseline justify-between gap-3">
                <h3
                  className="text-display-md"
                  style={{ color: "var(--brand-navy)" }}
                >
                  {t("contact.contactUsTitle")}
                </h3>
                <span className="text-label text-slate-400 whitespace-nowrap bg-slate-100 px-2 py-1 rounded-md text-xs font-semibold">
                  4 CHANNELS
                </span>
              </div>

              <div className="grid grid-cols-2 border-t border-slate-100 flex-1 bg-white">
                {[
                  {
                    id: "whatsapp",
                    label: t("contact.whatsapp"),
                    value: "+94 70 390 6478",
                    href: "https://wa.me/94703906478",
                    external: true,
                    accent: "#25D366",
                    hoverBg: "hover:bg-green-50/50",
                    icon: <WhatsAppIcon className="w-5 h-5" />,
                  },
                  {
                    id: "facebook",
                    label: t("contact.facebook"),
                    value: t("contact.facebookHandle"),
                    href: "https://www.facebook.com/profile.php?id=61585638656242",
                    external: true,
                    accent: "#1877F2",
                    hoverBg: "hover:bg-blue-50/50",
                    icon: <FacebookIcon className="w-5 h-5" />,
                  },
                  {
                    id: "email",
                    label: t("contact.email"),
                    value: "info@kidslab.lk",
                    href: "mailto:info@kidslab.lk",
                    external: false,
                    accent: "var(--brand-navy)",
                    hoverBg: "hover:bg-slate-50/80",
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
                    hoverBg: "hover:bg-rose-50/50",
                    icon: <MapPin className="w-5 h-5" />,
                  },
                ].map((c, i) => (
                  <a
                    key={c.id}
                    href={c.href}
                    target={c.external ? "_blank" : undefined}
                    rel={c.external ? "noopener noreferrer" : undefined}
                    className={`group relative flex flex-col gap-2.5 sm:gap-3 p-5 sm:p-6 border-slate-100 ${c.hoverBg} transition-all duration-300 ${
                      i % 2 === 0 ? "border-r" : ""
                    } ${i < 2 ? "border-b" : ""}`}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className="text-label text-[10px]"
                        style={{ color: "var(--brand-red)" }}
                      >
                        P{i + 1}
                      </span>
                      <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-600 group-hover:translate-x-1 transition-all" />
                    </div>
                    <div
                      className="transition-transform duration-300 group-hover:-translate-y-1 group-hover:scale-110"
                      style={{ color: c.accent }}
                    >
                      {c.icon}
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 text-sm">
                        {c.label}
                      </p>
                      <p
                        className="text-slate-500 mt-0.5 leading-snug truncate"
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

              <div className="flex gap-1.5 px-5 sm:px-8 xl:px-10 py-3 border-t border-slate-100 bg-slate-50">
                {Array.from({ length: 8 }).map((_, i) => (
                  <span
                    key={i}
                    className="h-1 flex-1 rounded-full opacity-30"
                    style={{ backgroundColor: "var(--brand-red)" }}
                  />
                ))}
              </div>
            </div>
          </AnimateIn>

          {/* CTA card */}
          <AnimateIn delay={0.18} className="h-full">
            <div
              className="rounded-3xl p-6 sm:p-8 xl:p-10 flex flex-col justify-between h-full relative overflow-hidden shadow-2xl shadow-indigo-900/20"
              style={{
                background:
                  "linear-gradient(135deg, var(--brand-navy) 0%, #1e1b4b 50%, #0f172a 100%)",
              }}
            >
              <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full border border-white/5 bg-white/5 backdrop-blur-md" />
              <div className="absolute -right-8 -bottom-20 w-80 h-80 rounded-full border border-white/5 bg-white/5 backdrop-blur-md" />
              <div
                className="absolute inset-0 opacity-[0.04] pointer-events-none"
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
                <p className="text-indigo-100 mt-3 leading-relaxed text-body-md">
                  {t("contact.ctaDescPrefix")}
                  <span className="text-white font-bold ml-1">
                    {t("contact.ctaDescBold")}
                  </span>
                  {t("contact.ctaDescSuffix")}
                </p>

                <div className="mt-6 space-y-3">
                  {(t.raw("contact.highlights") as string[]).map((item) => (
                    <div
                      key={item}
                      className="flex items-center gap-3 text-indigo-50 text-sm font-medium"
                    >
                      <CheckCircle className="w-5 h-5 text-indigo-400 shrink-0" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="relative z-10 mt-8 flex flex-col gap-3">
                <button
                  onClick={openRegisterModal}
                  className="w-full bg-white font-bold h-14 rounded-full text-[15px] tracking-[-0.01em] transition-all hover:bg-slate-50 hover:shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:-translate-y-1 shadow-lg"
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
                  <button className="w-full border-2 border-white/20 text-white font-semibold h-12 rounded-full text-sm hover:bg-white/10 hover:border-white/40 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2">
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
  );
}
