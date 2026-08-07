"use client";

import { motion, useScroll, useMotionValueEvent } from "motion/react";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";

const links = [
  { label: "Programs", href: "#programs" },
  { label: "About", href: "#about" },
  { label: "Team", href: "#team" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (y) => setScrolled(y > 40));

  return (
    <motion.header
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-white/95 backdrop-blur-md border-b border-slate-100 shadow-sm"
          : "bg-white/80 backdrop-blur-sm"
      }`}
    >
      <div className="max-w-screen-2xl mx-auto px-6 xl:px-12 2xl:px-16 h-16 xl:h-20 2xl:h-24 flex items-center justify-between">
        {/* Logo */}
        <a href="#" className="flex items-center gap-2.5 opacity-100 hover:opacity-80 transition-opacity">
          <Image
            src="/logo.png"
            alt="kidslab.lk logo"
            width={52}
            height={52}
            className="rounded-lg object-contain w-12 h-12 xl:w-14 xl:h-14 2xl:w-16 2xl:h-16"
            priority
          />
          <span className="font-bold text-lg xl:text-xl 2xl:text-2xl tracking-tight" style={{ color: "var(--brand-navy)" }}>
            kid<span style={{ color: "var(--brand-red)" }}>s</span>lab.lk
          </span>
        </a>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="px-4 py-2 text-sm xl:text-base 2xl:text-lg font-medium text-slate-600 hover:text-[#1d2b52] hover:bg-blue-50 rounded-lg transition-all duration-150"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* CTA */}
        <div className="flex items-center gap-2">
          <a href="#contact" className="hidden md:block">
            <Button variant="outline" className="text-sm xl:text-base 2xl:text-lg font-semibold px-5 xl:px-7 h-9 xl:h-11 2xl:h-12 rounded-full border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all" style={{ color: "var(--brand-navy)" }}>
              Contact Me
            </Button>
          </a>
          <motion.div
            className="hidden md:block rounded-full"
            animate={{
              boxShadow: [
                "0 0 0 0px rgba(29,43,82,0.45)",
                "0 0 0 5px rgba(29,43,82,0.12)",
                "0 0 0 10px rgba(29,43,82,0)",
              ],
            }}
            transition={{ duration: 2.2, repeat: Infinity, ease: "easeOut" }}
          >
            <a href="/register">
              <Button
                className="btn-register btn-brand-copper text-white font-semibold text-sm xl:text-base 2xl:text-lg px-5 xl:px-7 h-9 xl:h-11 2xl:h-12 rounded-full shadow-sm"
              >
                Register
              </Button>
            </a>
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
          className="md:hidden bg-white border-t border-slate-100 px-6 py-4 flex flex-col gap-1"
        >
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className="px-4 py-2.5 text-sm font-medium text-slate-700 hover:text-[#1d2b52] hover:bg-blue-50 rounded-lg"
            >
              {link.label}
            </a>
          ))}
          <a href="#contact" className="mt-1">
            <Button variant="outline" className="w-full font-semibold rounded-full border-slate-200" style={{ color: "var(--brand-navy)" }}>
              Contact Me
            </Button>
          </a>
          <a href="/register" className="mt-1">
            <Button className="btn-brand-copper w-full text-white font-semibold rounded-full">
              Register
            </Button>
          </a>
        </motion.div>
      )}
    </motion.header>
  );
}
