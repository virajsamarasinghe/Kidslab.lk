"use client";

import { AnimatePresence, motion, useScroll, useMotionValueEvent } from "motion/react";
import { useEffect, useState } from "react";
import { ChevronRight, Menu, Phone, X } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { SignInButton, SignUpButton, useUser } from "@clerk/nextjs";
import AccountUserButton from "@/components/AccountUserButton";
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

  /* Escape closes the sheet — expected of any overlay, and the only
     keyboard way out for someone on a tablet with a keyboard. */
  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mobileOpen]);

  return (
    <motion.header
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className={`fixed top-0 left-0 right-0 z-50 backdrop-blur-md transition-all duration-300 ${
        scrolled
          ? "bg-white/95 border-b border-slate-100 shadow-sm"
          : "border-b border-transparent"
      }`}
      style={{
        backgroundColor: scrolled
          ? undefined
          : "color-mix(in srgb, var(--brand-paper) 82%, transparent)",
      }}
    >
      <div className="relative w-full px-[clamp(0.875rem,2vw,2.5rem)] h-16 flex items-center justify-between gap-2 sm:gap-4">
        {/* Logo */}
        <a href="#" className="flex items-center gap-2 sm:gap-2.5 shrink-0 min-w-0 opacity-100 hover:opacity-80 transition-opacity">
          <span
            className="flex items-center justify-center rounded-lg p-0.5 shrink-0"
            style={{ border: "2px solid var(--brand-yellow)" }}
          >
            <Image
              src="/logo.png"
              alt="kidslab.lk logo"
              width={52}
              height={52}
              className="rounded-md object-contain w-8 h-8 sm:w-9 sm:h-9"
              priority
            />
          </span>
          <span
            className="font-bold text-base sm:text-lg tracking-tight truncate"
            style={{
              color: "var(--brand-navy)",
              fontFamily: "var(--font-display), var(--font-sans), system-ui, sans-serif",
            }}
          >
            kid<span style={{ color: "var(--brand-red)" }}>s</span>lab.lk
          </span>
        </a>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1 md:absolute md:left-1/2 md:-translate-x-1/2">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-[color:var(--brand-blue)] hover:bg-blue-50 rounded-lg transition-all duration-150"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* CTA */}
        <div className="flex items-center justify-end gap-1.5 shrink-0">
          {/* Language toggle */}
          <div
            className="hidden md:inline-flex items-center rounded-full p-0.5 text-xs font-semibold shrink-0"
            style={{ backgroundColor: "#f0f1f5", border: "1px solid #dde1ea" }}
          >
            <button
              onClick={() => setLocale("en")}
              className="px-2 py-1 rounded-full transition-colors"
              style={
                locale === "en"
                  ? { backgroundColor: "var(--brand-navy)", color: "#fff" }
                  : { color: "#64748b" }
              }
              aria-pressed={locale === "en"}
            >
              EN
            </button>
            <button
              onClick={() => setLocale("si")}
              className="px-2 py-1 rounded-full transition-colors"
              style={
                locale === "si"
                  ? { backgroundColor: "var(--brand-navy)", color: "#fff" }
                  : { color: "#64748b" }
              }
              aria-pressed={locale === "si"}
            >
              සිං
            </button>
          </div>
          <a href="#contact" className="hidden md:block shrink-0">
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 rounded-full border-slate-200 font-semibold hover:border-slate-300 hover:bg-slate-50 transition-all whitespace-nowrap"
              style={{ color: "var(--brand-navy)" }}
            >
              <Phone className="size-3.5" />
              {t("contactMe")}
            </Button>
          </a>
          <div className="hidden md:flex items-center gap-1.5 shrink-0">
            {isLoaded && (
              isSignedIn ? (
                <AccountUserButton />
              ) : (
                <>
                  <SignInButton mode="modal">
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-full border-slate-200 font-semibold hover:border-slate-300 hover:bg-slate-50 whitespace-nowrap"
                      style={{ color: "var(--brand-navy)" }}
                    >
                      {t("signIn")}
                    </Button>
                  </SignInButton>
                  <SignUpButton mode="modal">
                    <Button
                      size="sm"
                      className="btn-brand-copper rounded-full text-white font-semibold shadow-sm whitespace-nowrap"
                    >
                      {t("signUp")}
                    </Button>
                  </SignUpButton>
                </>
              )
            )}
          </div>
          {/* ── Mobile: compact language toggle stays in the bar itself. ── */}
          <button
            onClick={() => setLocale(locale === "en" ? "si" : "en")}
            aria-label={locale === "en" ? "Switch to Sinhala" : "Switch to English"}
            className="md:hidden shrink-0 h-9 min-w-9 px-2 rounded-full text-xs font-bold transition-colors"
            style={{
              backgroundColor: "#f0f1f5",
              border: "1px solid #dde1ea",
              color: "var(--brand-navy)",
            }}
          >
            {locale === "en" ? "සිං" : "EN"}
          </button>

          {/* Mobile menu toggle */}
          <button
            className="md:hidden shrink-0 flex items-center justify-center w-10 h-10 -mr-1.5 rounded-lg text-slate-600 hover:bg-slate-100 active:bg-slate-100"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-expanded={mobileOpen}
            aria-label={mobileOpen ? t("closeMenu") : t("menu")}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu backdrop */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden fixed inset-0 top-16 z-40 bg-black/30"
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
            className="md:hidden fixed left-0 right-0 top-16 z-40 max-h-[calc(100dvh-4rem)] overflow-y-auto overscroll-contain bg-white border-t border-slate-100 shadow-xl px-[clamp(0.875rem,2vw,2.5rem)] pt-3 pb-[calc(1.25rem+env(safe-area-inset-bottom,0px))] flex flex-col gap-0.5"
          >
            {links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="flex items-center justify-between px-4 min-h-12 py-3 text-[15px] font-medium text-slate-700 hover:text-[color:var(--brand-blue)] hover:bg-blue-50 active:bg-blue-50 rounded-xl transition-colors"
              >
                {link.label}
                <ChevronRight className="w-4 h-4 text-slate-300" />
              </a>
            ))}

            <div className="mt-3 pt-3 border-t border-slate-100 flex flex-col gap-2">
              <Button
                size="lg"
                onClick={() => {
                  setMobileOpen(false);
                  openRegisterModal();
                }}
                className="btn-brand-copper w-full text-white font-semibold rounded-full h-12 text-[15px]"
              >
                {t("registerFree")}
              </Button>
              <a href="#contact" onClick={() => setMobileOpen(false)}>
                <Button variant="outline" size="lg" className="w-full gap-2 font-semibold rounded-full border-slate-200 h-12 text-[15px]" style={{ color: "var(--brand-navy)" }}>
                  <Phone className="size-4" />
                  {t("contactMe")}
                </Button>
              </a>
            </div>

            {isLoaded && (
              isSignedIn ? (
                <div className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-2 px-1 py-1">
                  <AccountUserButton />
                  <span className="text-sm text-slate-500">{t("account")}</span>
                </div>
              ) : (
                <div className="mt-3 pt-3 border-t border-slate-100 flex flex-col gap-2">
                  <SignInButton mode="modal">
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={() => setMobileOpen(false)}
                      className="w-full font-semibold rounded-full border-slate-200 h-12 text-[15px]"
                      style={{ color: "var(--brand-navy)" }}
                    >
                      {t("signIn")}
                    </Button>
                  </SignInButton>
                  {/* Navy, not copper — the copper fill is reserved for the
                      register CTA above so the sheet has one clear primary. */}
                  <SignUpButton mode="modal">
                    <Button
                      size="lg"
                      onClick={() => setMobileOpen(false)}
                      className="btn-brand-navy w-full text-white font-semibold rounded-full h-12 text-[15px]"
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
    </motion.header>
  );
}
