"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import I18nProvider from "@/components/I18nProvider";
import LoadingScreen from "@/components/LoadingScreen";
import Navbar from "@/components/Navbar";
import RegisterModal from "@/components/RegisterModal";
import SubscribePopup from "@/components/SubscribePopup";
import WhatsAppIcon from "@/components/WhatsAppIcon";
import ChatWidget from "@/components/ChatWidget";
import { LocaleProvider, useLocale } from "@/lib/locale-context";
import { RegisterModalProvider } from "@/lib/register-modal-context";
import type { GoogleReview } from "@/lib/google-reviews";
import type { Course } from "@/types/course";

// Imported Landing Sections
import HeroSection from "@/components/landing/HeroSection";
import ProgramsSection from "@/components/landing/ProgramsSection";
import WhyUsSection from "@/components/landing/WhyUsSection";
import FoundersSection from "@/components/landing/FoundersSection";
import TestimonialsSection from "@/components/landing/TestimonialsSection";
import FAQSection from "@/components/landing/FAQSection";
import ContactSection from "@/components/landing/ContactSection";
import FooterSection from "@/components/landing/FooterSection";

export default function LandingPage({
  courses,
  googleReviews = [],
}: {
  courses: Course[];
  googleReviews?: GoogleReview[];
}) {
  return (
    <LocaleProvider>
      <I18nProvider>
        <RegisterModalProvider>
          <HomeContent courses={courses} googleReviews={googleReviews} />
          <RegisterModal />
          <SubscribePopup />
        </RegisterModalProvider>
      </I18nProvider>
    </LocaleProvider>
  );
}

function HomeContent({
  courses,
  googleReviews,
}: {
  courses: Course[];
  googleReviews: GoogleReview[];
}) {
  const { locale } = useLocale();

  /* ── Smooth cross-fade whenever the language toggle switches locale ── */
  const [langFading, setLangFading] = useState(false);
  const isFirstLocaleRender = useRef(true);
  useEffect(() => {
    if (isFirstLocaleRender.current) {
      isFirstLocaleRender.current = false;
      return;
    }
    const reduceMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) return;

    setLangFading(true);
    const id = setTimeout(() => setLangFading(false), 160);
    return () => clearTimeout(id);
  }, [locale]);

  // Pass down the global stats for the Hero section.
  const stats = [
    { value: "50+", label: "Young Innovators" },
    { value: "5+", label: "Expert Engineers" },
    { value: "1", label: "Program" },
    { value: "100%", label: "Hands-on Learning" },
  ];

  return (
    <>
      <LoadingScreen />
      <motion.main
        className="bg-white selection:bg-indigo-500/30"
        animate={{ opacity: langFading ? 0.15 : 1 }}
        transition={{ duration: langFading ? 0.13 : 0.28, ease: "easeInOut" }}
      >
        <Navbar />

        <HeroSection stats={stats} />
        <ProgramsSection courses={courses} />
        <WhyUsSection />
        <FoundersSection />
        <TestimonialsSection googleReviews={googleReviews} />
        <FAQSection />
        <ContactSection />
        <FooterSection />

      </motion.main>

      {/* ── Floating WhatsApp button ── */}
      <a
        href="https://wa.me/94703906478"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat on WhatsApp"
        className="fixed bottom-20 right-4 md:bottom-[5.25rem] md:right-5 xl:bottom-[5.5rem] xl:right-6 z-40 flex items-center justify-center w-12 h-12 md:w-11 md:h-11 xl:w-12 xl:h-12 rounded-full shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 active:scale-95"
        style={{ backgroundColor: "#25D366" }}
      >
        <WhatsAppIcon className="w-5 h-5 text-white" />
      </a>

      <ChatWidget />
    </>
  );
}
