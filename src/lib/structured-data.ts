import type { Course } from "@/types/course";

/** Date of the free introductory seminar (ISO, Sri Lanka time, +05:30). */
const SEMINAR_DATE = "2026-09-19";
const SEMINAR_START = `${SEMINAR_DATE}T09:00:00+05:30`;
const SEMINAR_END = `${SEMINAR_DATE}T13:00:00+05:30`;
/** When seats open — kept ~2 weeks ahead of the seminar. */
const SEMINAR_OFFER_VALID_FROM = "2026-09-05";

/* Fallbacks used when no active course exists in the DB. These must stay in
   sync with `programs.card.*` in src/messages/*.json, which the landing page
   falls back to under exactly the same condition. */
const DEFAULT_COURSE = {
  title: "Robotics & AI for Kids",
  description:
    "A 3-month hands-on program covering robotics mechanics, sensors, microcontrollers, and machine learning basics. Designed for children aged 9–14. Taught by Computer Engineers from the University of Ruhuna.",
  ageRange: "9–14",
  level: "Beginner",
  price: 5000,
  timeRequired: "P3M",
  startDate: SEMINAR_DATE,
  endDate: "2026-12-19",
  instructors: [
    { name: "Viraj Samarasinghe", title: "Software Engineer · AI Specialized" },
    { name: "Menura Dulkith", title: "Software Engineer · AI Specialized" },
  ],
};

/**
 * Best-effort conversion of the admin's free-text Duration field ("3 Months",
 * "12 weeks") into an ISO-8601 duration for schema.org's `timeRequired`.
 * Falls back to the default when the text doesn't parse, since bad markup is
 * worse than none.
 */
function isoDuration(duration: string | undefined): string {
  const m = duration?.match(/(\d+)\s*(year|month|week|day)/i);
  if (!m) return DEFAULT_COURSE.timeRequired;
  const n = m[1];
  switch (m[2].toLowerCase()) {
    case "year":  return `P${n}Y`;
    case "month": return `P${n}M`;
    case "week":  return `P${n}W`;
    default:      return `P${n}D`;
  }
}

/** Add `months` to an ISO date string, for the course's implied end date. */
function addMonths(iso: string, months: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCMonth(d.getUTCMonth() + months);
  return d.toISOString().slice(0, 10);
}

/** schema.org/Course built from a DB course, or from DEFAULT_COURSE. */
function courseSchema(c?: Course) {
  const months = Number(isoDuration(c?.duration).match(/^P(\d+)M$/)?.[1] ?? 3);
  const instructors =
    c && c.instructors.length > 0
      ? c.instructors.map((i) => ({
          "@type": "Person",
          name: i.name,
          ...(i.title ? { jobTitle: i.title } : {}),
        }))
      : DEFAULT_COURSE.instructors.map((i) => ({
          "@type": "Person",
          name: i.name,
          jobTitle: i.title,
        }));

  return {
    "@context": "https://schema.org",
    "@type": "Course",
    name: c?.title || DEFAULT_COURSE.title,
    description: c?.description || DEFAULT_COURSE.description,
    provider: {
      "@type": "EducationalOrganization",
      name: "kidslab.lk",
      url: "https://kidslab.lk",
    },
    educationalLevel: c?.level || DEFAULT_COURSE.level,
    audience: {
      "@type": "EducationalAudience",
      educationalRole: "student",
      audienceType: `Children aged ${c?.ageRange || DEFAULT_COURSE.ageRange}`,
    },
    timeRequired: isoDuration(c?.duration),
    numberOfCredits: 0,
    offers: {
      "@type": "Offer",
      price: String(c ? c.price : DEFAULT_COURSE.price),
      priceCurrency: "LKR",
      availability: "https://schema.org/InStock",
      validFrom: DEFAULT_COURSE.startDate,
      url: "https://kidslab.lk/register",
      description:
        "Payable in installments within 3 months. Day 1 is a FREE seminar.",
    },
    hasCourseInstance: {
      "@type": "CourseInstance",
      courseMode: "in-person",
      ...(c?.schedule ? { courseSchedule: c.schedule } : {}),
      location: {
        "@type": "Place",
        name: "kidslab.lk Academy",
        address: {
          "@type": "PostalAddress",
          addressLocality: "Hapugala, Galle",
          addressCountry: "LK",
        },
      },
      startDate: DEFAULT_COURSE.startDate,
      endDate: addMonths(DEFAULT_COURSE.startDate, months),
      instructor: instructors,
    },
  };
}

/**
 * Every JSON-LD block emitted by the landing page.
 *
 * Built on the server from the same `courses` the page renders, so the
 * structured data can't drift from what visitors actually see — previously
 * these were hardcoded and silently went stale whenever an admin edited a
 * course's price or title.
 */
export function buildLandingJsonLd(courses: Course[]) {
  return [
    /* 1. WebSite */
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: "kidslab.lk",
      url: "https://kidslab.lk",
      description: "Sri Lanka's Robotics & AI academy for children aged 9–14",
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
        "https://www.facebook.com/profile.php?id=61585638656242",
        "https://wa.me/94703906478",
      ],
    },
    /* 3. Course — one block per active course, or the default when none */
    ...(courses.length > 0 ? courses.map((c) => courseSchema(c)) : [courseSchema()]),
    /* 4. Event — Free Seminar */
    {
      "@context": "https://schema.org",
      "@type": "Event",
      name: "Free Robotics & AI Introductory Seminar — kidslab.lk",
      description:
        "A free introductory seminar covering basics of Robotics & AI, mindset building, and motivation. No obligation to enrol. Open to children aged 9–14 and their parents.",
      image: ["https://kidslab.lk/og-image.png", "https://kidslab.lk/logo.png"],
      startDate: SEMINAR_START,
      endDate: SEMINAR_END,
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
        validFrom: SEMINAR_OFFER_VALID_FROM,
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
            text: "The free introductory seminar is on 19 September 2026 at the kidslab.lk Academy in Hapugala, Galle, Sri Lanka. Seats are limited — register at kidslab.lk/register.",
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
}
