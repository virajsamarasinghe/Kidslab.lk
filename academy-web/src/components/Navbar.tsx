"use client";

import { motion, useScroll, useMotionValueEvent } from "motion/react";
import { useState } from "react";
import { ArrowRight, Menu, Phone, X } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/lib/locale-context";
import { useRegisterModal } from "@/lib/register-modal-context";

export default function Navbar() {
  const t = useTranslations("nav");
  const { locale, setLocale } = useLocale();
  const { openRegisterModal } = useRegisterModal();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { scrollY } = useScroll();

  const links = [
    { label: t("programs"), href: "#programs" },
    { label: t("about"), href: "#about" },
    { label: t("team"), href: "#team" },
  ];

  useMotionValueEvent(scrollY, "change", (y) => setScrolled(y > 40));

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
      <div className="w-full max-w-[1920px] mx-auto px-[clamp(1.5rem,4vw,5rem)] h-16 flex items-center justify-between">
        {/* Logo */}
        <a href="#" className="flex items-center gap-2.5 opacity-100 hover:opacity-80 transition-opacity">
          <Image
            src="/logo.png"
            alt="kidslab.lk logo"
            width={52}
            height={52}
            className="rounded-lg object-contain w-10 h-10"
            priority
          />
          <span
            className="font-bold text-lg tracking-tight"
            style={{
              color: "var(--brand-navy)",
              fontFamily: "var(--font-display), var(--font-sans), system-ui, sans-serif",
            }}
          >
            kid<span style={{ color: "var(--brand-red)" }}>s</span>lab.lk
          </span>
        </a>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
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
        <div className="flex items-center gap-2">
          {/* Language toggle */}
          <div
            className="hidden md:inline-flex items-center rounded-full p-0.5 text-xs font-semibold"
            style={{ backgroundColor: "#f0f1f5", border: "1px solid #dde1ea" }}
          >
            <button
              onClick={() => setLocale("en")}
              className="px-2.5 py-1 rounded-full transition-colors"
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
              className="px-2.5 py-1 rounded-full transition-colors"
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
          <a href="#contact" className="hidden md:block">
            <Button
              variant="outline"
              size="lg"
              className="gap-2 rounded-full border-slate-200 font-semibold hover:border-slate-300 hover:bg-slate-50 transition-all"
              style={{ color: "var(--brand-navy)" }}
            >
              <Phone className="size-4" />
              {t("contactMe")}
            </Button>
          </a>
          <motion.div
            className="hidden md:block rounded-full"
            animate={{
              boxShadow: [
                "0 0 0 0px rgba(224,138,60,0.45)",
                "0 0 0 5px rgba(224,138,60,0.12)",
                "0 0 0 10px rgba(224,138,60,0)",
              ],
            }}
            transition={{ duration: 2.2, repeat: Infinity, ease: "easeOut" }}
          >
            <Button
              size="lg"
              onClick={openRegisterModal}
              className="btn-register btn-brand-copper gap-2 rounded-full text-white font-semibold shadow-sm"
            >
              {t("register")}
              <ArrowRight className="size-4" />
            </Button>
          </motion.div>
          {/* Mobile toggle */}
          <button
            className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="md:hidden bg-white border-t border-slate-100 px-[clamp(1.5rem,4vw,5rem)] py-4 flex flex-col gap-1"
        >
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className="px-4 py-2.5 text-sm font-medium text-slate-700 hover:text-[color:var(--brand-blue)] hover:bg-blue-50 rounded-lg"
            >
              {link.label}
            </a>
          ))}

          {/* Language toggle */}
          <div
            className="inline-flex items-center self-start rounded-full p-0.5 text-xs font-semibold mt-1 mb-1"
            style={{ backgroundColor: "#f0f1f5", border: "1px solid #dde1ea" }}
          >
            <button
              onClick={() => setLocale("en")}
              className="px-3 py-1.5 rounded-full transition-colors"
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
              className="px-3 py-1.5 rounded-full transition-colors"
              style={
                locale === "si"
                  ? { backgroundColor: "var(--brand-navy)", color: "#fff" }
                  : { color: "#64748b" }
              }
              aria-pressed={locale === "si"}
            >
              සිංහල
            </button>
          </div>

          <a href="#contact" className="mt-1">
            <Button variant="outline" size="lg" className="w-full gap-2 font-semibold rounded-full border-slate-200" style={{ color: "var(--brand-navy)" }}>
              <Phone className="size-4" />
              {t("contactMe")}
            </Button>
          </a>
          <Button
            size="lg"
            onClick={() => { setMobileOpen(false); openRegisterModal(); }}
            className="mt-1 btn-brand-copper w-full gap-2 text-white font-semibold rounded-full"
          >
            {t("register")}
            <ArrowRight className="size-4" />
          </Button>
        </motion.div>
      )}
    </motion.header>
  );
}
