"use client";

import AnimateIn from "@/components/AnimateIn";
import FacebookIcon from "@/components/FacebookIcon";
import LoadingScreen from "@/components/LoadingScreen";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
    ArrowRight,
    Award,
    BookOpen,
    Bot,
    CheckCircle,
    ChevronRight,
    FlaskConical,
    GraduationCap,
    MapPin,
    Star,
    Target,
    Users,
    Zap,
} from "lucide-react";
import { motion, useScroll, useTransform } from "motion/react";
import Image from "next/image";
import { useRef } from "react";

/* ─── Data ─── */

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

const stats = [
  { value: "50+", label: "Young Innovators", icon: Users },
  { value: "5+", label: "Expert Engineers", icon: GraduationCap },
  { value: "1", label: "Program", icon: BookOpen },
  { value: "100%", label: "Hands-on Learning", icon: FlaskConical },
];

const programs = [
  {
    icon: Bot,
    title: "Robotics & AI",
    desc: "Build real robots and explore Artificial Intelligence hands-on. From mechanics and sensors to machine learning — all in one exciting program.",
    level: "Ages 9–14",
    duration: "3 Months",
    fee: "LKR 5,000",
    installment: "Pay in installments within 3 months",
    seminar:
      "Day 1 is a FREE seminar — intro to Robotics & AI, mindset building & motivation",
    iconBg: "bg-blue-100",
    iconColor: "text-blue-600",
    badge: "bg-blue-100 text-blue-700",
  },
];

const whyUs = [
  {
    icon: Target,
    title: "Project-Based Learning",
    desc: "Every lesson ends with a real build. Kids learn by doing, not just watching.",
    color: "text-blue-600",
    bg: "bg-blue-50",
  },
  {
    icon: Award,
    title: "Industry Expert Educators",
    desc: "Curriculum designed and taught by Computer Engineering graduates from the University of Ruhuna, now industry professionals.",
    color: "text-violet-600",
    bg: "bg-violet-50",
  },
  {
    icon: Users,
    title: "Small Class Sizes",
    desc: "Max 50 students per class ensures every child gets personal attention and guidance.",
    color: "text-teal-600",
    bg: "bg-teal-50",
  },
  {
    icon: FlaskConical,
    title: "Real Lab Equipment",
    desc: "Actual robotics kits, sensors, microcontrollers — not simulations.",
    color: "text-orange-600",
    bg: "bg-orange-50",
  },
  {
    icon: GraduationCap,
    title: "Age-Appropriate Tracks",
    desc: "Programs designed for ages 8–18, with difficulty scaling as they grow.",
    color: "text-green-600",
    bg: "bg-green-50",
  },
  {
    icon: Zap,
    title: "Fast, Fun & Engaging",
    desc: "Gamified challenges, team projects, and showcases keep kids excited to learn.",
    color: "text-amber-600",
    bg: "bg-amber-50",
  },
];

const testimonials = [
  {
    name: "Kavisha Fernando",
    role: "Parent · Galle",
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

/* ─── Reusable section label ─── */
function SectionLabel({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className="inline-flex flex-col items-center mb-3">
      <p className={`text-label ${className || "text-[color:var(--brand-red)]"}`}>
        {children}
      </p>
      <span className="pcb-trace w-10 mt-2" />
    </div>
  );
}

/* ─── Page ─── */

/* ── LinkedIn icon ── */
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

export default function Home() {
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const heroY = useTransform(scrollYProgress, [0, 1], ["0%", "18%"]);

  /* ── JSON-LD structured data ── */
  const jsonLd = [
    /* 1. WebSite */
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: "kidslab.lk",
      url: "https://kidslab.lk",
      description: "Sri Lanka's Robotics & AI academy for children aged 9–14",
      potentialAction: {
        "@type": "SearchAction",
        target: "https://kidslab.lk/register",
        "query-input": "required name=search_term_string",
      },
    },
    /* 2. EducationalOrganization */
    {
      "@context": "https://schema.org",
      "@type": ["EducationalOrganization", "LocalBusiness"],
      name: "kidslab.lk",
      alternateName: "kidslab Academy",
      url: "https://kidslab.lk",
      logo: "https://kidslab.lk/logo.png",
      image: "https://kidslab.lk/logo.png",
      description:
        "Robotics & AI academy for children aged 9–14, conducted by Computer Engineers from the University of Ruhuna.",
      address: {
        "@type": "PostalAddress",
        streetAddress: "Hapugala",
        addressLocality: "Galle",
        postalCode: "80000",
        addressCountry: "LK",
      },
      geo: { "@type": "GeoCoordinates", latitude: 6.0328, longitude: 80.2168 },
      telephone: "+94703906478",
      email: "info@kidslab.lk",
      foundingDate: "2026",
      founders: [
        { "@type": "Person", name: "Viraj Samarasinghe" },
        { "@type": "Person", name: "Menura Dulkith" },
      ],
      parentOrganization: {
        "@type": "CollegeOrUniversity",
        name: "University of Ruhuna",
        department:
          "Faculty of Engineering — Department of Computer Engineering",
        address: {
          "@type": "PostalAddress",
          addressLocality: "Hapugala, Galle",
          addressCountry: "LK",
        },
      },
      sameAs: [
        "https://www.facebook.com/kidslab.lk",
        "https://wa.me/94703906478",
      ],
    },
    /* 3. Course */
    {
      "@context": "https://schema.org",
      "@type": "Course",
      name: "Robotics & AI for Kids",
      description:
        "A 3-month hands-on program covering robotics mechanics, sensors, microcontrollers, and machine learning basics. Designed for children aged 9–14. Taught by Computer Engineers from the University of Ruhuna.",
      provider: {
        "@type": "EducationalOrganization",
        name: "kidslab.lk",
        url: "https://kidslab.lk",
      },
      educationalLevel: "Beginner",
      audience: {
        "@type": "EducationalAudience",
        educationalRole: "student",
        audienceType: "Children aged 9–14",
      },
      timeRequired: "P3M",
      numberOfCredits: 0,
      offers: {
        "@type": "Offer",
        price: "5000",
        priceCurrency: "LKR",
        availability: "https://schema.org/InStock",
        validFrom: "2026-06-27",
        url: "https://kidslab.lk/register",
        description:
          "Payable in installments within 3 months. Day 1 is a FREE seminar.",
      },
      hasCourseInstance: {
        "@type": "CourseInstance",
        courseMode: "in-person",
        location: {
          "@type": "Place",
          name: "kidslab.lk Academy",
          address: {
            "@type": "PostalAddress",
            addressLocality: "Hapugala, Galle",
            addressCountry: "LK",
          },
        },
        startDate: "2026-06-27",
        endDate: "2026-09-27",
        instructor: [
          {
            "@type": "Person",
            name: "Viraj Samarasinghe",
            jobTitle: "Software Engineer · AI Specialized",
          },
          {
            "@type": "Person",
            name: "Menura Dulkith",
            jobTitle: "Software Engineer · AI Specialized",
          },
        ],
      },
    },
    /* 4. Event — Free Seminar */
    {
      "@context": "https://schema.org",
      "@type": "Event",
      name: "Free Robotics & AI Introductory Seminar — kidslab.lk",
      description:
        "A free introductory seminar covering basics of Robotics & AI, mindset building, and motivation. No obligation to enrol. Open to children aged 9–14 and their parents.",
      image: ["https://kidslab.lk/og-image.png", "https://kidslab.lk/logo.png"],
      startDate: "2026-06-27T09:00:00+05:30",
      endDate: "2026-06-27T13:00:00+05:30",
      eventStatus: "https://schema.org/EventScheduled",
      eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
      location: {
        "@type": "Place",
        name: "kidslab.lk Academy",
        address: {
          "@type": "PostalAddress",
          streetAddress: "Hapugala",
          addressLocality: "Galle",
          addressCountry: "LK",
        },
      },
      organizer: {
        "@type": "EducationalOrganization",
        name: "kidslab.lk",
        url: "https://kidslab.lk",
      },
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "LKR",
        availability: "https://schema.org/LimitedAvailability",
        url: "https://kidslab.lk/register",
        validFrom: "2026-06-14",
      },
      performer: [
        { "@type": "Person", name: "Viraj Samarasinghe" },
        { "@type": "Person", name: "Menura Dulkith" },
      ],
      audience: {
        "@type": "Audience",
        audienceType: "Children aged 9–14 and parents",
      },
    },
    /* 5a. Person — Viraj Samarasinghe */
    {
      "@context": "https://schema.org",
      "@type": "Person",
      "@id": "https://kidslab.lk/#viraj-samarasinghe",
      name: "Viraj Samarasinghe",
      givenName: "Viraj",
      familyName: "Samarasinghe",
      jobTitle: "Software Engineer — AI Specialized",
      description:
        "Computer Engineering graduate from the University of Ruhuna, Faculty of Engineering, Sri Lanka. Co-founder of kidslab.lk, specializing in Artificial Intelligence, Robotics, and Embedded Systems. Passionate about making technology education accessible to children in Sri Lanka.",
      image: "https://kidslab.lk/viraj.jpg",
      nationality: { "@type": "Country", name: "Sri Lanka" },
      worksFor: {
        "@type": "EducationalOrganization",
        name: "kidslab.lk",
        url: "https://kidslab.lk",
        foundingDate: "2026",
      },
      hasOccupation: {
        "@type": "Occupation",
        name: "Software Engineer",
        occupationLocation: { "@type": "Country", name: "Sri Lanka" },
        skills:
          "Artificial Intelligence, Machine Learning, Robotics, Embedded Systems, Python, Computer Vision",
        educationRequirements: "Bachelor of Science in Computer Engineering",
      },
      alumniOf: {
        "@type": "CollegeOrUniversity",
        name: "University of Ruhuna",
        department:
          "Faculty of Engineering — Department of Computer Engineering",
        address: {
          "@type": "PostalAddress",
          addressLocality: "Hapugala, Galle",
          addressCountry: "LK",
        },
      },
      knowsAbout: [
        "Artificial Intelligence",
        "Machine Learning",
        "Robotics",
        "Embedded Systems",
        "Computer Engineering",
        "IoT",
        "Python Programming",
        "STEM Education for Children",
      ],
      url: "https://kidslab.lk/#viraj-samarasinghe",
      sameAs: [
        "https://www.linkedin.com/in/virajsamarasinghe/",
        "https://kidslab.lk",
      ],
    },
    /* 5b. Person — Menura Dulkith */
    {
      "@context": "https://schema.org",
      "@type": "Person",
      "@id": "https://kidslab.lk/#menura-dulkith",
      name: "Menura Dulkith",
      givenName: "Menura",
      familyName: "Dulkith",
      jobTitle: "Software Engineer — AI Specialized",
      description:
        "Computer Engineering graduate from the University of Ruhuna, Faculty of Engineering, Sri Lanka. Co-founder of kidslab.lk, specializing in Artificial Intelligence, Robotics, and Embedded Systems. Dedicated to inspiring the next generation of young engineers in Sri Lanka.",
      image: "https://kidslab.lk/menura.jpg",
      nationality: { "@type": "Country", name: "Sri Lanka" },
      worksFor: {
        "@type": "EducationalOrganization",
        name: "kidslab.lk",
        url: "https://kidslab.lk",
        foundingDate: "2026",
      },
      hasOccupation: {
        "@type": "Occupation",
        name: "Software Engineer",
        occupationLocation: { "@type": "Country", name: "Sri Lanka" },
        skills:
          "Artificial Intelligence, Machine Learning, Robotics, Embedded Systems, Python, Computer Vision",
        educationRequirements: "Bachelor of Science in Computer Engineering",
      },
      alumniOf: {
        "@type": "CollegeOrUniversity",
        name: "University of Ruhuna",
        department:
          "Faculty of Engineering — Department of Computer Engineering",
        address: {
          "@type": "PostalAddress",
          addressLocality: "Hapugala, Galle",
          addressCountry: "LK",
        },
      },
      knowsAbout: [
        "Artificial Intelligence",
        "Machine Learning",
        "Robotics",
        "Embedded Systems",
        "Computer Engineering",
        "IoT",
        "Python Programming",
        "STEM Education for Children",
      ],
      url: "https://kidslab.lk/#menura-dulkith",
      sameAs: [
        "https://www.linkedin.com/in/menuradulkith/",
        "https://kidslab.lk",
      ],
    },
    /* 5c. ProfilePage — Viraj (for Google's People results & AI KGs) */
    {
      "@context": "https://schema.org",
      "@type": "ProfilePage",
      "@id": "https://kidslab.lk/#team",
      name: "Meet the Founders — kidslab.lk",
      description:
        "Viraj Samarasinghe and Menura Dulkith, co-founders of kidslab.lk, are Computer Engineering graduates from the University of Ruhuna specializing in AI & Robotics.",
      url: "https://kidslab.lk/#team",
      mainEntity: [
        { "@id": "https://kidslab.lk/#viraj-samarasinghe" },
        { "@id": "https://kidslab.lk/#menura-dulkith" },
      ],
    },
    /* 6. FAQPage — key AEO schema */
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: "What is kidslab.lk?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "kidslab.lk is Sri Lanka's Robotics & AI academy for children aged 9–14, conducted by Computer Engineers from the University of Ruhuna, Faculty of Engineering, based in Galle, Sri Lanka.",
          },
        },
        {
          "@type": "Question",
          name: "What age group is the Robotics & AI program for?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "The program is designed for children aged 9 to 14 years old.",
          },
        },
        {
          "@type": "Question",
          name: "How much does the Robotics & AI program cost?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "The course fee is LKR 5,000 for 3 months. It can be paid in installments within 3 months. Day 1 is a completely free introductory seminar with no obligation to continue.",
          },
        },
        {
          "@type": "Question",
          name: "When is the free seminar?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "The free introductory seminar is on 27 June 2026 at the kidslab.lk Academy in Hapugala, Galle, Sri Lanka. Seats are limited — register at kidslab.lk/register.",
          },
        },
        {
          "@type": "Question",
          name: "What will my child learn in the Robotics & AI program?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Children learn to build real robots using mechanics, sensors, and microcontrollers. The program also covers Artificial Intelligence basics, machine learning concepts, and hands-on project building — all in one 3-month course.",
          },
        },
        {
          "@type": "Question",
          name: "Who teaches the classes at kidslab.lk?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Classes are designed and taught by Viraj Samarasinghe and Menura Dulkith — Computer Engineering graduates from the University of Ruhuna, Faculty of Engineering, who specialize in AI & Robotics.",
          },
        },
        {
          "@type": "Question",
          name: "Where are the kidslab.lk classes held?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Classes are held at the kidslab.lk Academy in Hapugala, Galle 80000, Sri Lanka.",
          },
        },
        {
          "@type": "Question",
          name: "Can I pay the course fee in installments?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Yes. The LKR 5,000 course fee can be paid in installments spread over 3 months.",
          },
        },
        {
          "@type": "Question",
          name: "How do I register for the free seminar or the course?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Visit kidslab.lk/register and fill in your child's details. You can also contact us via WhatsApp at +94703906478.",
          },
        },
        {
          "@type": "Question",
          name: "Is kidslab.lk affiliated with the University of Ruhuna?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "The programs are designed and conducted by Computer Engineering graduates and professionals from the University of Ruhuna, Faculty of Engineering.",
          },
        },
        {
          "@type": "Question",
          name: "Who is Viraj Samarasinghe?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Viraj Samarasinghe is a Software Engineer specializing in AI, and co-founder of kidslab.lk. He is a Computer Engineering graduate from the University of Ruhuna, Faculty of Engineering, Sri Lanka, with expertise in Artificial Intelligence, Robotics, and Embedded Systems.",
          },
        },
        {
          "@type": "Question",
          name: "Who is Menura Dulkith?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Menura Dulkith is a Software Engineer specializing in AI, and co-founder of kidslab.lk. He is a Computer Engineering graduate from the University of Ruhuna, Faculty of Engineering, Sri Lanka, with expertise in Artificial Intelligence, Robotics, and Embedded Systems.",
          },
        },
      ],
    },
  ];

  return (
    <>
      {/* Inject all JSON-LD schemas */}
      {jsonLd.map((schema, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}

      <LoadingScreen />
      <main className="bg-white">
        <Navbar />

        {/* ══ Hero ══════════════════════════════════════════════════════ */}
        <section
          ref={heroRef}
          className="relative min-h-svh lg:h-svh flex items-center pt-16 pb-4 overflow-hidden"
        >
          <div
            className="absolute inset-0"
            style={{ backgroundColor: "var(--brand-paper)" }}
          />
          <div
            className="absolute top-0 right-0 w-[700px] h-[700px] opacity-20"
            style={{
              background:
                "radial-gradient(circle at 65% 35%, #dbe6ff 0%, transparent 55%), radial-gradient(circle at 80% 75%, #f3ddc3 0%, transparent 50%)",
            }}
          />
          {/* PCB layout grid — the hero's signature backdrop */}
          <div
            className="absolute inset-0 opacity-[0.06]"
            style={{
              backgroundImage:
                "linear-gradient(var(--brand-blue) 1px, transparent 1px), linear-gradient(90deg, var(--brand-blue) 1px, transparent 1px)",
              backgroundSize: "34px 34px",
            }}
          />
          <div
            className="absolute inset-0 opacity-[0.08]"
            style={{
              backgroundImage:
                "radial-gradient(var(--brand-red) 1.5px, transparent 1.5px)",
              backgroundSize: "68px 68px",
              backgroundPosition: "17px 17px",
            }}
          />

          <motion.div
            style={{ y: heroY }}
            className="relative z-10 max-w-screen-xl mx-auto px-6 lg:px-10 xl:px-16 w-full py-8 lg:py-10 xl:py-14 2xl:py-20"
          >
            <div className="max-w-3xl mx-auto text-center">
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45 }}
                className="flex justify-center"
              >
                <span
                  className="pcb-stamp inline-flex items-center gap-2 pl-4 pr-5 py-1.5 text-label mb-4 lg:mb-5"
                  style={{
                    backgroundColor: "var(--brand-navy)",
                    color: "var(--brand-paper)",
                  }}
                >
                  <span className="w-1.5 h-1.5 rounded-full animate-pulse bg-green-400" />
                  REV. 2026 · ENROLMENTS OPEN
                </span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 28 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="text-display-xl text-slate-900"
              >
                Where Kids Learn to{" "}
                <span
                  className="bg-clip-text text-transparent"
                  style={{
                    backgroundImage:
                      "linear-gradient(to right, var(--brand-blue), #1a3fa0)",
                  }}
                >
                  Build Robots
                </span>{" "}
                &{" "}
                <span
                  className="bg-clip-text text-transparent"
                  style={{
                    backgroundImage:
                      "linear-gradient(to right, var(--brand-red), #b8651f)",
                  }}
                >
                  AI
                </span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="text-body-xl text-slate-500 mt-4 lg:mt-5 max-w-2xl mx-auto"
              >
                Sri Lanka&apos;s leading Robotics &amp; AI academy for
                children, conducted by{" "}
                <span className="font-semibold text-slate-800">
                  Computer Engineers from the University of Ruhuna
                </span>
                , Faculty of Engineering.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="mt-6 lg:mt-7 flex flex-wrap justify-center gap-3"
              >
                <motion.div
                  className="rounded-full"
                  animate={{
                    boxShadow: [
                      "0 0 0 0px rgba(29,43,82,0.45)",
                      "0 0 0 7px rgba(29,43,82,0.13)",
                      "0 0 0 14px rgba(29,43,82,0)",
                    ],
                  }}
                  transition={{
                    duration: 2.2,
                    repeat: Infinity,
                    ease: "easeOut",
                  }}
                >
                  <a href="/register">
                    <Button
                      size="lg"
                      className="btn-register btn-brand-copper text-white font-semibold px-8 xl:px-10 h-12 xl:h-14 2xl:h-16 rounded-full text-[15px] xl:text-base 2xl:text-lg tracking-[-0.01em] shadow-md"
                    >
                      Register for Free Seminar
                      <ArrowRight className="ml-2 w-4 h-4" />
                    </Button>
                  </a>
                </motion.div>
                <a href="#programs">
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-slate-200 text-slate-700 hover:bg-slate-50 px-8 xl:px-10 h-12 xl:h-14 2xl:h-16 rounded-full text-[15px] xl:text-base 2xl:text-lg tracking-[-0.01em] font-medium transition-all"
                  >
                    Explore Programs
                  </Button>
                </a>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.44 }}
                className="mt-5 lg:mt-7 flex flex-wrap justify-center gap-5"
              >
                {["Ages 8–18", "Hands-on Kits", "University Certified"].map(
                  (t) => (
                    <div
                      key={t}
                      className="flex items-center gap-2 text-slate-500"
                      style={{ fontSize: "0.875rem" }}
                    >
                      <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                      <span className="font-medium">{t}</span>
                    </div>
                  ),
                )}
              </motion.div>
            </div>

            {/* Stats bar */}
            <motion.div
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65, delay: 0.58 }}
              className="mt-12 lg:mt-14 xl:mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 xl:gap-6 max-w-4xl mx-auto"
            >
              {stats.map(({ value, label, icon: Icon }) => (
                <div
                  key={label}
                  className="bg-white rounded-2xl border border-slate-100 shadow-sm px-6 xl:px-8 py-4 lg:py-4 xl:py-7 flex items-center gap-4 xl:gap-6"
                >
                  <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p
                      className="font-extrabold text-slate-900 leading-none tracking-tight"
                      style={{
                        fontSize: "1.625rem",
                        fontFamily: "var(--font-display)",
                      }}
                    >
                      {value}
                    </p>
                    <p
                      className="text-slate-400 mt-1"
                      style={{ fontSize: "0.8125rem" }}
                    >
                      {label}
                    </p>
                  </div>
                </div>
              ))}
            </motion.div>
          </motion.div>
        </section>

        {/* ══ University Banner ══════════════════════════════════════════ */}
        <section className="bg-gradient-to-r from-blue-700 to-violet-700 py-4 px-6">
          <div className="max-w-screen-2xl mx-auto flex flex-col sm:flex-row items-center justify-center gap-2.5">
            <GraduationCap className="w-4 h-4 text-blue-200 shrink-0" />
            <p
              className="text-center"
              style={{
                fontSize: "0.8125rem",
                color: "rgba(255,255,255,0.8)",
                letterSpacing: "0.01em",
              }}
            >
              Programs conducted by{" "}
              <span className="font-bold text-white">
                Computer Engineers · University of Ruhuna, Faculty of
                Engineering
              </span>
              <span className="hidden sm:inline text-blue-300 mx-2">·</span>
              <span className="inline-flex items-center gap-1 text-blue-100">
                <MapPin className="w-3 h-3" /> Hapugala, Galle, Sri Lanka
              </span>
            </p>
          </div>
        </section>

        {/* ══ Programs ══════════════════════════════════════════════════ */}
        <section
          id="programs"
          className="py-28 px-6 xl:py-36 xl:px-12 bg-slate-50"
        >
          <div className="max-w-screen-2xl mx-auto">
            <AnimateIn className="text-center mb-16">
              <SectionLabel>Our Programs</SectionLabel>
              <h2 className="text-display-lg text-slate-900">
                Start Your{" "}
                <span
                  className="bg-clip-text text-transparent"
                  style={{
                    backgroundImage:
                      "linear-gradient(to right, var(--brand-blue), #1a3fa0)",
                  }}
                >
                  Journey
                </span>
              </h2>
              <p className="text-body-xl text-slate-500 mt-5 max-w-lg mx-auto">
                Our flagship program — currently enrolling.
              </p>
            </AnimateIn>

            <AnimateIn className="max-w-xl mx-auto">
              {programs.map((p) => (
                <motion.div
                  key={p.title}
                  className="rounded-2xl"
                  animate={{
                    boxShadow: [
                      "0 0 0 0px rgba(29,43,82,0.3), 0 10px 40px rgba(29,43,82,0.08)",
                      "0 0 0 5px rgba(29,43,82,0.1), 0 10px 40px rgba(29,43,82,0.15)",
                      "0 0 0 10px rgba(29,43,82,0), 0 10px 40px rgba(29,43,82,0.08)",
                    ],
                  }}
                  transition={{
                    duration: 2.5,
                    repeat: Infinity,
                    ease: "easeOut",
                  }}
                >
                  <Card
                    className="border-2 rounded-2xl hover:-translate-y-1 transition-transform duration-300"
                    style={{
                      borderColor: "var(--brand-navy)",
                      backgroundColor: "#fff",
                    }}
                  >
                    <CardContent className="p-8 flex flex-col gap-5">
                      {/* Header */}
                      <div className="flex items-start justify-between">
                        <div
                          className={`w-12 h-12 rounded-xl ${p.iconBg} flex items-center justify-center`}
                        >
                          <p.icon className={`w-6 h-6 ${p.iconColor}`} />
                        </div>
                        <span
                          className="text-label px-3 py-1 rounded-full text-white text-[10px] inline-flex items-center gap-1.5"
                          style={{ backgroundColor: "var(--brand-red)" }}
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse shrink-0" />
                          Enrolling Now
                        </span>
                      </div>

                      {/* Title & desc */}
                      <div>
                        <h3
                          className="text-display-md"
                          style={{ color: "var(--brand-navy)" }}
                        >
                          {p.title}
                        </h3>
                        <p className="text-body-md text-slate-500 mt-2">
                          {p.desc}
                        </p>
                      </div>

                      {/* Seminar callout */}
                      <div
                        className="rounded-xl px-4 py-3 flex gap-3 items-start"
                        style={{
                          backgroundColor: "#f0f4ff",
                          border: "1px solid #c8d4f0",
                        }}
                      >
                        <Star
                          className="w-4 h-4 mt-0.5 shrink-0"
                          style={{ color: "var(--brand-red)" }}
                        />
                        <p className="text-[13px] text-slate-600 leading-snug">
                          {p.seminar}
                        </p>
                      </div>

                      {/* Meta badges */}
                      <div className="flex flex-wrap gap-2">
                        <span className="text-label px-3 py-1.5 rounded-full bg-blue-100 text-blue-700">
                          {p.level}
                        </span>
                        <span className="text-label px-3 py-1.5 rounded-full bg-slate-100 text-slate-600">
                          {p.duration}
                        </span>
                      </div>

                      {/* Fee */}
                      <div className="rounded-xl px-4 py-3 border border-slate-100 bg-slate-50 flex items-center justify-between">
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
                            Course Fee
                          </p>
                          <p
                            className="text-xl font-extrabold mt-0.5"
                            style={{ color: "var(--brand-navy)" }}
                          >
                            {p.fee}
                          </p>
                        </div>
                        <p className="text-[12px] text-slate-500 text-right max-w-[130px] leading-snug">
                          {p.installment}
                        </p>
                      </div>

                      {/* CTA */}
                      <a href="/register">
                        <motion.div
                          className="rounded-full"
                          animate={{
                            boxShadow: [
                              "0 0 0 0px rgba(29,43,82,0.4)",
                              "0 0 0 4px rgba(29,43,82,0.13)",
                              "0 0 0 8px rgba(29,43,82,0)",
                            ],
                          }}
                          transition={{
                            duration: 2.2,
                            repeat: Infinity,
                            ease: "easeOut",
                          }}
                        >
                          <button
                            className="btn-register w-full text-white font-semibold h-11 rounded-full text-[14px] tracking-[-0.01em] hover:opacity-90"
                            style={{ backgroundColor: "var(--brand-navy)" }}
                          >
                            Register for Free Seminar
                          </button>
                        </motion.div>
                      </a>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimateIn>
          </div>
        </section>

        {/* ══ Why kidslab.lk ════════════════════════════════════════════ */}
        <section id="about" className="py-28 px-6 xl:py-36 xl:px-12 bg-white">
          <div className="max-w-screen-2xl mx-auto">
            <AnimateIn className="text-center mb-16">
              <SectionLabel>
                <span style={{ color: "var(--brand-navy)" }}>
                  Why kid<span style={{ color: "var(--brand-red)" }}>s</span>
                  lab.lk?
                </span>
              </SectionLabel>
              <h2 className="text-display-lg text-slate-900">
                Learning Built for{" "}
                <span className="bg-gradient-to-r from-violet-600 to-blue-600 bg-clip-text text-transparent">
                  Young Minds
                </span>
              </h2>
              <p className="text-body-xl text-slate-500 mt-5 max-w-lg mx-auto">
                We believe every child can be a creator. Our approach combines
                university-level expertise with kid-friendly teaching.
              </p>
            </AnimateIn>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 items-stretch">
              {whyUs.map((item, i) => (
                <AnimateIn key={item.title} delay={i * 0.07} className="h-full">
                  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-7 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 h-full">
                    <h4 className="text-display-md text-slate-900 mb-2">
                      {item.title}
                    </h4>
                    <p className="text-body-md text-slate-500">{item.desc}</p>
                  </div>
                </AnimateIn>
              ))}
            </div>
          </div>
        </section>

        {/* ══ Team / Founders ════════════════════════════════════════════ */}
        <section
          id="team"
          className="py-28 px-6 xl:py-36 xl:px-12 bg-gradient-to-br from-slate-900 via-blue-950 to-violet-950 relative overflow-hidden"
        >
          {/* Decorative blobs */}
          <div
            className="absolute -left-32 top-0 w-96 h-96 rounded-full opacity-10 pointer-events-none"
            style={{
              background: "radial-gradient(circle, #3b82f6, transparent)",
            }}
          />
          <div
            className="absolute -right-32 bottom-0 w-96 h-96 rounded-full opacity-10 pointer-events-none"
            style={{
              background: "radial-gradient(circle, #8b5cf6, transparent)",
            }}
          />

          <div className="max-w-screen-2xl mx-auto relative z-10">
            {/* Header */}
            <AnimateIn className="text-center mb-16 xl:mb-20">
              <p className="text-label text-blue-400 mb-3">Meet the Founders</p>
              <h2 className="text-display-lg text-white">
                Built by Real{" "}
                <span
                  className="bg-clip-text text-transparent"
                  style={{
                    backgroundImage:
                      "linear-gradient(to right, #60a5fa, #a78bfa)",
                  }}
                >
                  Engineers
                </span>
              </h2>
              <p className="text-body-xl text-slate-400 mt-5 max-w-xl mx-auto">
                Computer Engineering graduates from the University of Ruhuna,
                specializing in AI &amp; Robotics.
              </p>
            </AnimateIn>

            {/* Founder cards — standard avatar layout */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 xl:gap-8 max-w-xl xl:max-w-2xl mx-auto">
              {founders.map((f, i) => (
                <AnimateIn key={f.name} delay={i * 0.15} className="h-full">
                  <div className="h-full flex flex-col items-center text-center gap-4 rounded-2xl bg-white/[0.04] border border-white/10 px-6 py-8 hover:bg-white/[0.06] transition-colors duration-300">
                    {/* Avatar */}
                    <div className="relative w-24 h-24 xl:w-28 xl:h-28 rounded-full overflow-hidden ring-2 ring-blue-400/40 shrink-0">
                      <Image
                        src={f.photo}
                        alt={f.name}
                        fill
                        className="object-cover object-top"
                        sizes="112px"
                      />
                    </div>

                    {/* Co-Founder badge */}
                    <span className="inline-flex items-center gap-1.5 bg-blue-500/15 text-blue-300 border border-blue-400/30 font-bold rounded-full px-3 py-1 text-[11px] tracking-widest uppercase">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
                      Co‑Founder
                    </span>

                    {/* Name + role */}
                    <div>
                      <h3 className="text-white font-extrabold tracking-tight text-lg xl:text-xl">
                        {f.name}
                      </h3>
                      <p className="text-blue-300 font-medium text-sm mt-1">
                        {f.role}
                      </p>
                    </div>

                    {/* University */}
                    <div className="flex items-center gap-2 text-slate-400 text-xs xl:text-sm">
                      <GraduationCap className="w-3.5 h-3.5 xl:w-4 xl:h-4 shrink-0 text-blue-400" />
                      University of Ruhuna
                    </div>

                    {/* Tags */}
                    <div className="flex flex-wrap justify-center gap-1.5">
                      {f.tags.map((tag) => (
                        <span
                          key={tag}
                          className="bg-white/10 text-blue-200 border border-white/15 px-2.5 py-1 rounded-full text-[10px] font-semibold tracking-wider uppercase"
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
                      className="mt-auto inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#0A66C2]/50 bg-[#0A66C2]/20 hover:bg-[#0A66C2]/50 text-[#93c5fd] hover:text-white transition-all duration-200 font-semibold text-sm"
                    >
                      <LinkedInIcon className="w-3.5 h-3.5 shrink-0" />
                      LinkedIn Profile
                    </a>
                  </div>
                </AnimateIn>
              ))}
            </div>

            {/* University strip */}
            <AnimateIn delay={0.3} className="mt-10 xl:mt-14">
              <div className="max-w-3xl xl:max-w-5xl mx-auto bg-white/[0.04] border border-white/8 rounded-2xl px-8 xl:px-12 py-5 xl:py-6 flex flex-col sm:flex-row items-center justify-center gap-4 xl:gap-8">
                <div className="flex items-center gap-3">
                  <GraduationCap className="w-5 h-5 xl:w-6 xl:h-6 text-blue-400 shrink-0" />
                  <p
                    className="text-slate-300 font-semibold"
                    style={{ fontSize: "clamp(0.8rem, 0.9vw, 1.1rem)" }}
                  >
                    University of Ruhuna · Faculty of Engineering
                  </p>
                </div>
                <div className="hidden sm:block w-px h-5 bg-white/20" />
                <div className="flex items-center gap-3">
                  <MapPin className="w-4 h-4 xl:w-5 xl:h-5 text-slate-500 shrink-0" />
                  <p
                    className="text-slate-500"
                    style={{ fontSize: "clamp(0.75rem, 0.85vw, 1rem)" }}
                  >
                    Hapugala, Galle, Sri Lanka
                  </p>
                </div>
              </div>
            </AnimateIn>
          </div>
        </section>

        {/* ══ Testimonials ══════════════════════════════════════════════ */}
        <section className="py-28 px-6 xl:py-36 xl:px-12 bg-slate-50">
          <div className="max-w-6xl mx-auto">
            <AnimateIn className="text-center mb-16">
              <SectionLabel className="text-green-600">
                Student &amp; Parent Reviews
              </SectionLabel>
              <h2 className="text-display-lg text-slate-900">
                What They&apos;re{" "}
                <span className="bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent">
                  Saying
                </span>
              </h2>
            </AnimateIn>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-stretch">
              {testimonials.map((t, i) => (
                <AnimateIn key={t.name} delay={i * 0.1} className="h-full">
                  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 flex flex-col gap-5 h-full hover:shadow-md transition-shadow duration-300">
                    <div className="flex gap-1">
                      {Array.from({ length: t.stars }).map((_, s) => (
                        <Star
                          key={s}
                          className="w-4 h-4 fill-amber-400 text-amber-400"
                        />
                      ))}
                    </div>
                    <p className="text-body-md text-slate-600 flex-1 leading-[1.75]">
                      &ldquo;{t.quote}&rdquo;
                    </p>
                    <div className="flex items-center gap-3 pt-5 border-t border-slate-100">
                      <div
                        className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center text-white font-bold shrink-0"
                        style={{ fontSize: "0.6875rem" }}
                      >
                        {t.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </div>
                      <div>
                        <p
                          className="font-semibold text-slate-900"
                          style={{
                            fontSize: "0.9375rem",
                            letterSpacing: "-0.01em",
                          }}
                        >
                          {t.name}
                        </p>
                        <p
                          className="text-slate-400 mt-0.5"
                          style={{ fontSize: "0.8125rem" }}
                        >
                          {t.role}
                        </p>
                      </div>
                    </div>
                  </div>
                </AnimateIn>
              ))}
            </div>
          </div>
        </section>

        {/* ══ Contact ═══════════════════════════════════════════════════ */}
        <section
          id="contact"
          className="py-28 px-6 xl:py-36 xl:px-12 bg-gradient-to-b from-slate-50 via-white to-slate-50 relative overflow-hidden"
        >
          {/* Decorative blobs */}
          <div
            className="absolute -left-40 top-10 w-96 h-96 rounded-full opacity-[0.07] pointer-events-none"
            style={{
              background: "radial-gradient(circle, #1d2b52, transparent)",
            }}
          />
          <div
            className="absolute -right-40 bottom-10 w-96 h-96 rounded-full opacity-[0.07] pointer-events-none"
            style={{
              background: "radial-gradient(circle, #5a1515, transparent)",
            }}
          />

          <div className="max-w-screen-2xl mx-auto relative z-10">
            <AnimateIn className="text-center mb-14">
              <SectionLabel>Get In Touch</SectionLabel>
              <h2 className="text-display-lg text-slate-900">
                Ready to{" "}
                <span
                  className="bg-clip-text text-transparent"
                  style={{
                    backgroundImage:
                      "linear-gradient(to right, var(--brand-blue), #1a3fa0)",
                  }}
                >
                  Enrol Your Child?
                </span>
              </h2>
              <p className="text-body-xl text-slate-500 mt-4 max-w-xl mx-auto">
                Reach out via any channel below — we&apos;re happy to answer
                your questions and guide you through the process.
              </p>
            </AnimateIn>

            <div className="grid md:grid-cols-2 gap-8 xl:gap-12 max-w-4xl mx-auto items-stretch">
              {/* Contact channels */}
              <AnimateIn delay={0.1} className="h-full">
                <div className="bg-white/90 backdrop-blur-sm rounded-3xl border border-slate-200/70 shadow-xl shadow-slate-200/50 p-8 xl:p-10 flex flex-col gap-3 h-full">
                  <h3
                    className="text-display-md mb-2"
                    style={{ color: "var(--brand-navy)" }}
                  >
                    Contact Us
                  </h3>

                  {/* WhatsApp */}
                  <a
                    href="https://wa.me/94703906478"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-4 p-4 rounded-2xl border border-transparent hover:border-green-100 hover:bg-green-50 hover:shadow-sm hover:-translate-y-0.5 transition-all duration-200 group"
                  >
                    <div
                      className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 shadow-sm"
                      style={{ backgroundColor: "#25D366" }}
                    >
                      <svg viewBox="0 0 32 32" className="w-5 h-5 fill-white">
                        <path d="M16 2C8.268 2 2 8.268 2 16c0 2.492.651 4.833 1.789 6.863L2 30l7.347-1.766A13.924 13.924 0 0016 30c7.732 0 14-6.268 14-14S23.732 2 16 2zm6.34 19.386c-.347-.174-2.053-1.013-2.373-1.128-.32-.116-.553-.174-.786.174-.233.347-.9 1.128-1.103 1.36-.203.232-.406.26-.752.087-.347-.174-1.464-.54-2.788-1.72-1.031-.918-1.727-2.05-1.93-2.397-.202-.347-.021-.534.152-.707.157-.155.347-.406.52-.609.174-.203.232-.347.348-.578.115-.232.058-.435-.029-.609-.087-.174-.786-1.894-1.077-2.592-.283-.68-.57-.588-.786-.598l-.668-.012a1.28 1.28 0 00-.927.435c-.32.347-1.218 1.19-1.218 2.9s1.247 3.363 1.42 3.596c.174.232 2.453 3.745 5.944 5.252.831.359 1.48.573 1.985.733.834.265 1.594.228 2.194.138.669-.1 2.053-.84 2.343-1.651.29-.812.29-1.507.203-1.651-.086-.145-.32-.232-.667-.406z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800 group-hover:text-green-700 transition-colors">
                        WhatsApp
                      </p>
                      <p className="text-slate-400 text-sm">+94 70 390 6478</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300 ml-auto group-hover:text-green-500 group-hover:translate-x-0.5 transition-all" />
                  </a>

                  {/* Facebook */}
                  <a
                    href="https://www.facebook.com/profile.php?id=61585638656242"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-4 p-4 rounded-2xl border border-transparent hover:border-blue-100 hover:bg-blue-50 hover:shadow-sm hover:-translate-y-0.5 transition-all duration-200 group"
                  >
                    <div
                      className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 shadow-sm"
                      style={{ backgroundColor: "#1877F2" }}
                    >
                      <FacebookIcon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800 group-hover:text-blue-700 transition-colors">
                        Facebook
                      </p>
                      <p className="text-slate-400 text-sm">
                        kidslab.lk — Academy for Kids
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300 ml-auto group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all" />
                  </a>

                  {/* Email */}
                  <a
                    href="mailto:info@kidslab.lk"
                    className="flex items-center gap-4 p-4 rounded-2xl border border-transparent hover:border-slate-200 hover:bg-slate-50 hover:shadow-sm hover:-translate-y-0.5 transition-all duration-200 group"
                  >
                    <div
                      className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 shadow-sm"
                      style={{ backgroundColor: "var(--brand-navy)" }}
                    >
                      <svg
                        className="w-5 h-5 text-white"
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
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800 group-hover:text-slate-900 transition-colors">
                        Email
                      </p>
                      <p className="text-slate-400 text-sm">info@kidslab.lk</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300 ml-auto group-hover:text-slate-500 group-hover:translate-x-0.5 transition-all" />
                  </a>

                  {/* Location */}
                  <a
                    href="https://www.google.com/maps/search/?api=1&query=Hapugala+Galle+Sri+Lanka"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-transparent hover:border-slate-200 hover:shadow-sm hover:-translate-y-0.5 transition-all duration-200 group"
                  >
                    <div className="w-11 h-11 rounded-xl bg-slate-100 flex items-center justify-center shrink-0 shadow-sm">
                      <MapPin className="w-5 h-5 text-slate-500" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800">Location</p>
                      <p className="text-slate-400 text-sm">
                        Hapugala, Galle, Sri Lanka
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300 ml-auto group-hover:text-slate-500 group-hover:translate-x-0.5 transition-all" />
                  </a>
                </div>
              </AnimateIn>

              {/* CTA card */}
              <AnimateIn delay={0.18} className="h-full">
                <div
                  className="rounded-3xl p-8 xl:p-10 flex flex-col justify-between h-full relative overflow-hidden shadow-xl shadow-blue-950/20"
                  style={{
                    background:
                      "linear-gradient(135deg, var(--brand-navy) 0%, #2a3f6f 60%, #5a1515 100%)",
                  }}
                >
                  {/* Decorative rings */}
                  <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full border border-white/10" />
                  <div className="absolute -right-8 -bottom-20 w-80 h-80 rounded-full border border-white/10" />
                  <div
                    className="absolute inset-0 opacity-[0.06] pointer-events-none"
                    style={{
                      backgroundImage:
                        "radial-gradient(circle, #fff 1px, transparent 1px)",
                      backgroundSize: "18px 18px",
                    }}
                  />

                  <div className="relative z-10">
                    <div className="bg-white/15 backdrop-blur-sm w-14 h-14 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
                      <Image
                        src="/logo.png"
                        alt="kidslab.lk"
                        width={44}
                        height={44}
                        className="rounded-xl object-contain"
                      />
                    </div>
                    <h3 className="text-display-md text-white">
                      Free Seminar — First Day
                    </h3>
                    <p className="text-white/75 mt-3 leading-relaxed text-body-md">
                      Attend our{" "}
                      <span className="text-white font-semibold">
                        free introductory seminar
                      </span>{" "}
                      — basic Robotics &amp; AI, mindset building &amp;
                      motivation. No commitment required.
                    </p>

                    <div className="mt-6 space-y-2">
                      {[
                        "Ages 9–14",
                        "3-Month Program",
                        "LKR 5,000 · Pay in Installments",
                      ].map((item) => (
                        <div
                          key={item}
                          className="flex items-center gap-2 text-white/80 text-sm"
                        >
                          <CheckCircle className="w-4 h-4 text-green-400 shrink-0" />
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="relative z-10 mt-8 flex flex-col gap-3">
                    <a href="/register" className="block">
                      <button
                        className="w-full bg-white font-bold h-12 rounded-full text-sm tracking-[-0.01em] transition-all hover:bg-slate-50 hover:shadow-lg hover:-translate-y-0.5 shadow-lg"
                        style={{ color: "var(--brand-navy)" }}
                      >
                        Register for Free Seminar →
                      </button>
                    </a>
                    <a
                      href="https://www.facebook.com/profile.php?id=61585638656242"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block"
                    >
                      <button className="w-full border border-white/25 text-white font-medium h-11 rounded-full text-sm hover:bg-white/10 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2">
                        <FacebookIcon className="w-4 h-4" />
                        Follow on Facebook
                      </button>
                    </a>
                  </div>
                </div>
              </AnimateIn>
            </div>
          </div>
        </section>

        {/* ══ Footer ════════════════════════════════════════════════════ */}
        <footer className="bg-slate-900 text-white pt-14 pb-10 px-6">
          <div className="max-w-screen-2xl mx-auto">
            <div className="flex flex-col md:flex-row items-start justify-between gap-12 pb-12 border-b border-white/10">
              {/* Brand */}
              <div className="max-w-[260px]">
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-white rounded-xl p-1.5 flex-shrink-0">
                    <Image
                      src="/logo.png"
                      alt="kidslab.lk logo"
                      width={56}
                      height={56}
                      className="rounded-lg object-contain"
                    />
                  </div>
                  <span className="font-bold text-[1.0625rem] tracking-[-0.02em]">
                    kid<span style={{ color: "#e07070" }}>s</span>lab.lk
                  </span>
                </div>
                <p
                  className="text-slate-400 leading-relaxed"
                  style={{ fontSize: "0.875rem" }}
                >
                  Sri Lanka&apos;s leading AI &amp; Robotics academy for young
                  innovators — taught by University of Ruhuna graduates.
                </p>
                <a
                  href="https://www.facebook.com/profile.php?id=61585638656242"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 mt-5 text-slate-400 hover:text-[#1877F2] transition-colors"
                  style={{ fontSize: "0.875rem" }}
                >
                  <FacebookIcon className="w-4 h-4" />
                  Follow on Facebook
                </a>
              </div>

              {/* Link columns */}
              <div className="grid grid-cols-2 gap-x-16 gap-y-3">
                <div>
                  <p className="text-label text-slate-500 mb-4">Programs</p>
                  {[
                    "Robotics",
                    "AI & ML",
                    "IoT",
                    "Autonomous Systems",
                    "Coding",
                  ].map((l) => (
                    <a
                      key={l}
                      href="#programs"
                      className="block text-slate-400 hover:text-white mb-2.5 transition-colors"
                      style={{ fontSize: "0.875rem" }}
                    >
                      {l}
                    </a>
                  ))}
                </div>
                <div>
                  <p className="text-label text-slate-500 mb-4">Academy</p>
                  {[
                    "About Us",
                    "Our Team",
                    "Enrol",
                    "Contact",
                  ].map((l) => (
                    <a
                      key={l}
                      href="#"
                      className="block text-slate-400 hover:text-white mb-2.5 transition-colors"
                      style={{ fontSize: "0.875rem" }}
                    >
                      {l}
                    </a>
                  ))}
                </div>
              </div>
            </div>

            <div
              className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-slate-500"
              style={{ fontSize: "0.8125rem" }}
            >
              <p>
                © 2026 kid<span style={{ color: "#e07070" }}>s</span>lab.lk —
                All rights reserved.
              </p>
              <p className="flex items-center gap-1.5">
                <GraduationCap
                  className="w-4 h-4"
                  style={{ color: "#e07070" }}
                />
                Founded by University of Ruhuna Engineering Graduates
              </p>
            </div>
          </div>
        </footer>
      </main>

      {/* ── Floating WhatsApp button ── */}
      <a
        href="https://wa.me/94703906478"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat on WhatsApp"
        className="fixed bottom-6 right-6 xl:bottom-8 xl:right-8 2xl:bottom-10 2xl:right-10 z-50 flex items-center justify-center w-14 h-14 xl:w-16 xl:h-16 2xl:w-20 2xl:h-20 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 active:scale-95"
        style={{ backgroundColor: "#25D366" }}
      >
        <svg viewBox="0 0 32 32" className="w-7 h-7 fill-white">
          <path d="M16 2C8.268 2 2 8.268 2 16c0 2.492.651 4.833 1.789 6.863L2 30l7.347-1.766A13.924 13.924 0 0016 30c7.732 0 14-6.268 14-14S23.732 2 16 2zm0 25.6a11.556 11.556 0 01-5.867-1.6l-.42-.25-4.36 1.048 1.068-4.248-.275-.437A11.556 11.556 0 014.4 16C4.4 9.592 9.592 4.4 16 4.4S27.6 9.592 27.6 16 22.408 27.6 16 27.6zm6.34-8.614c-.347-.174-2.053-1.013-2.373-1.128-.32-.116-.553-.174-.786.174-.233.347-.9 1.128-1.103 1.36-.203.232-.406.26-.752.087-.347-.174-1.464-.54-2.788-1.72-1.031-.918-1.727-2.05-1.93-2.397-.202-.347-.021-.534.152-.707.157-.155.347-.406.52-.609.174-.203.232-.347.348-.578.115-.232.058-.435-.029-.609-.087-.174-.786-1.894-1.077-2.592-.283-.68-.57-.588-.786-.598l-.668-.012a1.28 1.28 0 00-.927.435c-.32.347-1.218 1.19-1.218 2.9s1.247 3.363 1.42 3.596c.174.232 2.453 3.745 5.944 5.252.831.359 1.48.573 1.985.733.834.265 1.594.228 2.194.138.669-.1 2.053-.84 2.343-1.651.29-.812.29-1.507.203-1.651-.086-.145-.32-.232-.667-.406z" />
        </svg>
      </a>
    </>
  );
}
