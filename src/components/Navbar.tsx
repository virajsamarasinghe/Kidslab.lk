"use client";

import { AnimatePresence, motion, useScroll, useMotionValueEvent } from "motion/react";
import { useEffect, useState } from "react";
import { ChevronRight, Menu, Phone, X } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { SignInButton, SignUpButton, UserButton, useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/lib/locale-context";
import { useRegisterModal } from "@/lib/register-modal-context";

export default function Navbar() {
  const t = useTranslations("nav");
  const { locale, setLocale } = useLocale();
  const { isLoaded, isSignedIn } = useUser();
  const { openRegisterModal } = useRegisterModal();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { scrollY } = useScroll();

  const links = [
    { label: t("programs"), href: "#programs" },
    { label: t("about"), href: "#about" },
    { label: t("team"), href: "#team" },
    { label: t("faq"), href: "#faq" },
  ];

  useMotionValueEvent(scrollY, "change", (y) => setScrolled(y > 40));

  useEffect(() => {
    if (!mobileOpen) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, [mobileOpen]);

  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mobileOpen]);

  return (
    <>
      <motion.header
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className={`fixed top-0 left-0 right-0 z-50 backdrop-blur-xl transition-all duration-300 ${scrolled
          ? "bg-white/95 border-b border-slate-200/50 shadow-sm"
          : "bg-white/70 border-b border-transparent"
          }`}
      >
        <div className="relative w-full px-[clamp(0.875rem,2vw,2.5rem)] h-16 sm:h-20 flex items-center justify-between gap-2 sm:gap-4">
          {/* Logo */}
          <a href="#" className="flex items-center gap-2 sm:gap-3 shrink-0 min-w-0 group transition-all">
            <span className="flex items-center justify-center rounded-xl p-1 shrink-0 bg-white shadow-sm ring-1 ring-slate-900/5 group-hover:shadow-md group-hover:scale-105 transition-all duration-300">
              <Image
                src="/logo.png"
                alt="kidslab.lk logo"
                width={52}
                height={52}
                className="rounded-lg object-contain w-8 h-8 sm:w-10 sm:h-10"
                priority
              />
            </span>
            <span
              className="font-extrabold text-lg sm:text-xl tracking-tight truncate text-slate-900 group-hover:text-indigo-950 transition-colors"
              style={{
                fontFamily: "var(--font-display), var(--font-sans), system-ui, sans-serif",
              }}
            >
              kid<span className="text-coral-500" style={{ color: "var(--brand-red)" }}>s</span>lab.lk
            </span>
          </a>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center justify-center flex-1 gap-7 lg:gap-10">
            {links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-lg font-bold text-slate-600 hover:text-indigo-600 transition-colors duration-200"
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* CTA */}
          <div className="flex items-center justify-end gap-2 shrink-0">
            {/* Language toggle */}
            <div className="hidden md:flex items-center p-1 rounded-full bg-slate-100 border border-slate-200/50 shadow-inner shrink-0 relative">
              {/* Sliding highlight */}
              <div
                className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-white rounded-full shadow-sm transition-transform duration-300 ease-out ${locale === "si" ? "translate-x-[100%]" : "translate-x-0"
                  }`}
              />
              <button
                onClick={() => setLocale("en")}
                className={`relative z-10 w-11 py-1.5 text-[13px] font-bold rounded-full transition-colors duration-200 ${locale === "en" ? "text-indigo-950" : "text-slate-500 hover:text-slate-700"
                  }`}
                aria-pressed={locale === "en"}
              >
                EN
              </button>
              <button
                onClick={() => setLocale("si")}
                className={`relative z-10 w-11 py-1.5 text-[13px] font-bold rounded-full transition-colors duration-200 ${locale === "si" ? "text-indigo-950" : "text-slate-500 hover:text-slate-700"
                  }`}
                aria-pressed={locale === "si"}
              >
                සිං
              </button>
            </div>

            <a href="#contact" className="hidden md:block shrink-0">
            <Button
              variant="outline"
              className="gap-2 rounded-full border-slate-300 bg-transparent font-bold text-slate-700 hover:border-slate-400 hover:bg-slate-50 transition-all shadow-sm h-11 px-6 text-base"
            >
              <Phone className="size-4.5" />
              {t("contactUs")}
            </Button>
          </a>

            <div className="hidden md:flex items-center gap-2 shrink-0">
              {isLoaded && (
                isSignedIn ? (
                  <div className="flex items-center pl-2">
                    <UserButton />
                  </div>
                ) : (
                  <>
                    <SignInButton mode="modal">
                    <Button
                      variant="outline"
                      className="rounded-full border-slate-300 bg-transparent font-bold text-slate-700 hover:border-slate-400 hover:bg-slate-50 transition-all shadow-sm h-11 px-6 text-base"
                    >
                      {t("signIn")}
                    </Button>
                  </SignInButton>
                    <SignUpButton mode="modal">
                    <Button
                      className="rounded-full font-bold shadow-md hover:shadow-lg transition-all h-11 px-7 text-base hover:-translate-y-0.5 border-none"
                      style={{ backgroundColor: "var(--brand-red)", color: "white" }}
                    >
                      {t("signUp")}
                    </Button>
                  </SignUpButton>
                  </>
                )
              )}
            </div>

            {/* ── Mobile: compact language toggle ── */}
            <button
              onClick={() => setLocale(locale === "en" ? "si" : "en")}
              aria-label={locale === "en" ? "Switch to Sinhala" : "Switch to English"}
              className="md:hidden shrink-0 h-10 min-w-10 px-2 rounded-full text-xs font-extrabold transition-colors bg-white/80 border border-slate-200/80 text-indigo-950 shadow-sm backdrop-blur-md"
            >
              {locale === "en" ? "සිං" : "EN"}
            </button>

            {/* Mobile menu toggle */}
            <button
              className="md:hidden shrink-0 flex items-center justify-center w-10 h-10 -mr-1.5 rounded-full text-slate-700 hover:bg-white/80 active:bg-white/80 bg-white/50 border border-slate-200/50 shadow-sm backdrop-blur-md transition-all"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-expanded={mobileOpen}
              aria-label={mobileOpen ? t("closeMenu") : t("menu")}
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </motion.header>

      {/* Mobile menu backdrop */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden fixed inset-0 top-[4.5rem] z-40 bg-indigo-950/20 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="md:hidden fixed left-0 right-0 top-[4.5rem] z-40 max-h-[calc(100dvh-4.5rem)] overflow-y-auto overscroll-contain bg-white/95 backdrop-blur-xl border-t border-slate-100 shadow-2xl px-[clamp(0.875rem,2vw,2.5rem)] pt-4 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))] flex flex-col gap-1 rounded-b-3xl"
          >
            {links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="flex items-center justify-between px-5 min-h-[3.25rem] py-3 text-[15px] font-bold text-slate-700 hover:text-indigo-600 hover:bg-indigo-50/50 active:bg-indigo-50/50 rounded-2xl transition-colors"
              >
                {link.label}
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </a>
            ))}

            <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col gap-3">
              <Button
                size="lg"
                onClick={() => {
                  setMobileOpen(false);
                  openRegisterModal();
                }}
                className="w-full text-white font-bold rounded-full h-14 text-[15px] shadow-md border-none hover:-translate-y-0.5 transition-all"
                style={{ backgroundColor: "var(--brand-red)" }}
              >
                {t("registerFree")}
              </Button>
              <a href="#contact" onClick={() => setMobileOpen(false)}>
                <Button variant="outline" size="lg" className="w-full gap-2 font-bold rounded-full border-slate-200 h-14 text-[15px] text-indigo-950 hover:bg-slate-50 transition-colors">
                  <Phone className="size-4.5" />
                  {t("contactUs")}
                </Button>
              </a>
            </div>

            {isLoaded && (
              isSignedIn ? (
                <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-3 px-2 py-1">
                  <UserButton />
                  <span className="text-sm font-semibold text-slate-600">{t("account")}</span>
                </div>
              ) : (
                <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col gap-3">
                  <SignInButton mode="modal">
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={() => setMobileOpen(false)}
                      className="w-full font-bold rounded-full border-slate-200 h-14 text-[15px] text-indigo-950 hover:bg-slate-50 transition-colors"
                    >
                      {t("signIn")}
                    </Button>
                  </SignInButton>
                  <SignUpButton mode="modal">
                    <Button
                      size="lg"
                      onClick={() => setMobileOpen(false)}
                      className="w-full text-white font-bold rounded-full h-14 text-[15px] shadow-md border-none hover:-translate-y-0.5 transition-all"
                      style={{ backgroundColor: "var(--brand-navy)" }}
                    >
                      {t("signUp")}
                    </Button>
                  </SignUpButton>
                </div>
              )
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
