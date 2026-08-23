import type { Course } from "@/types/course";
import { SITE_URL } from "@/config/site";
import {
  DEFAULT_LOCALE,
  LOCALE_TAGS,
  localizedPath,
  type Locale,
} from "@/config/locales";
import type { SeoConfig } from "@/config/seo";

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

/** Seminar date + time from the dashboard, stamped with Sri Lanka's +05:30 offset. */
function seminarInstant(date: string, time: string): string {
  return `${date}T${time.length === 5 ? `${time}:00` : time}+05:30`;
}

/** schema.org/Course built from a DB course, or from DEFAULT_COURSE. */
function courseSchema(seo: SeoConfig, c?: Course) {
  const months = Number(isoDuration(c?.duration).match(/^P(\d+)M$/)?.[1] ?? 3);
  const startDate = seo.event.startDate;
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
      name: seo.siteName,
      url: SITE_URL,
    },
    educationalLevel: c?.level || DEFAULT_COURSE.level,
    audience: {
      "@type": "EducationalAudience",
      educationalRole: "student",
      audienceType: `Children aged ${c?.ageRange || DEFAULT_COURSE.ageRange}`,
      geographicArea: { "@type": "Country", name: "Sri Lanka" },
    },
    timeRequired: isoDuration(c?.duration),
    numberOfCredits: 0,
    offers: {
      "@type": "Offer",
      price: String(c ? c.price : DEFAULT_COURSE.price),
      priceCurrency: "LKR",
      availability: "https://schema.org/InStock",
      validFrom: startDate,
      url: `${SITE_URL}/register`,
      description:
        "Payable in installments within 3 months. Day 1 is a FREE seminar.",
    },
    hasCourseInstance: {
      "@type": "CourseInstance",
      courseMode: "online",
      ...(c?.schedule ? { courseSchedule: c.schedule } : {}),
      startDate,
      endDate: addMonths(startDate, months),
      instructor: instructors,
    },
  };
}

/**
 * schema.org/FAQPage from the admin-managed Q&A list, in the language the
 * page is rendered in.
 *
 * Google only credits FAQ markup whose answers the visitor can actually read
 * on that URL, so the Sinhala page has to emit the Sinhala text — English
 * markup on a Sinhala page is exactly the mismatch the single-source FAQ was
 * introduced to avoid. Entries with no translation fall back to English,
 * which is also what the page itself renders.
 */
export function faqSchema(seo: SeoConfig, locale: Locale = DEFAULT_LOCALE) {
  const si = locale === "si";
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    inLanguage: LOCALE_TAGS[locale],
    mainEntity: seo.faqs.map((f) => ({
      "@type": "Question",
      name: (si && f.questionSi) || f.question,
      acceptedAnswer: { "@type": "Answer", text: (si && f.answerSi) || f.answer },
    })),
  };
}

/**
 * Every JSON-LD block emitted by the landing page.
 *
 * Built on the server from the same `courses` the page renders and the same
 * `seo` config that produced its `<head>`, so the structured data can't drift
 * from what visitors actually see — these were previously hardcoded and
 * silently went stale whenever an admin edited a course's price or title.
 *
 * The Person / ProfilePage blocks below stay in code on purpose: they describe
 * two fixed founders, not business facts that change between deploys, and
 * modelling credentials in a settings form would be all cost and no benefit.
 */
export function buildLandingJsonLd(
  courses: Course[],
  seo: SeoConfig,
  locale: Locale = DEFAULT_LOCALE
) {
  const org = seo.organization;
  /* The URL this particular rendering lives at — `/` in English, `/si` in
     Sinhala — so the WebSite block and the FAQ markup describe the page the
     crawler is actually reading. The organisation blocks below stay identical
     in both: they describe the business, not the document. */
  const pageUrl = `${SITE_URL}${localizedPath("/", locale)}`.replace(/\/$/, "");

  return [
    /* 1. WebSite */
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: seo.siteName,
      url: pageUrl,
      description: seo.description,
      inLanguage: LOCALE_TAGS[locale],
    },
    /* 2. EducationalOrganization */
    {
      "@context": "https://schema.org",
      "@type": ["EducationalOrganization", "LocalBusiness"],
      name: seo.siteName,
      alternateName: org.alternateNames,
      slogan: org.slogan,
      url: SITE_URL,
      logo: `${SITE_URL}/logo.png`,
      image: `${SITE_URL}/logo.png`,
      description: org.description,
      keywords: org.keywords,
      address: {
        "@type": "PostalAddress",
        streetAddress: org.streetAddress,
        addressLocality: org.addressLocality,
        postalCode: org.postalCode,
        addressCountry: org.addressCountry,
      },
      geo: { "@type": "GeoCoordinates", latitude: org.latitude, longitude: org.longitude },
      hasMap: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        [org.streetAddress, org.addressLocality, "Sri Lanka"].filter(Boolean).join(", ")
      )}`,
      areaServed: [
        { "@type": "Country", name: "Sri Lanka" },
        ...org.areaServed.map((city) => ({ "@type": "City", name: city })),
      ],
      knowsAbout: org.knowsAbout,
      knowsLanguage: ["en", "si"],
      telephone: org.telephone,
      email: org.email,
      foundingDate: org.foundingDate,
      foundingLocation: {
        "@type": "Place",
        name: `${org.addressLocality}, Sri Lanka`,
        address: {
          "@type": "PostalAddress",
          addressLocality: org.addressLocality,
          addressCountry: org.addressCountry,
        },
      },
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
      sameAs: org.sameAs,
    },
    /* 3. Course — one block per active course, or the default when none */
    ...(courses.length > 0
      ? courses.map((c) => courseSchema(seo, c))
      : [courseSchema(seo)]),
    /* 4. Event — the free seminar. Dropped entirely once an admin switches it
       off, so an expired Event can't sit on the site advertising a past date. */
    ...(seo.event.enabled
      ? [
          {
            "@context": "https://schema.org",
            "@type": "Event",
            name: seo.event.name,
            description: seo.event.description,
            image: [`${SITE_URL}/og-image.png`, `${SITE_URL}/logo.png`],
            startDate: seminarInstant(seo.event.startDate, seo.event.startTime),
            endDate: seminarInstant(seo.event.startDate, seo.event.endTime),
            eventStatus: "https://schema.org/EventScheduled",
            eventAttendanceMode: "https://schema.org/OnlineEventAttendanceMode",
            location: {
              "@type": "VirtualLocation",
              url: seo.event.url,
            },
            organizer: {
              "@type": "EducationalOrganization",
              name: seo.siteName,
              url: SITE_URL,
            },
            offers: {
              "@type": "Offer",
              price: "0",
              priceCurrency: "LKR",
              availability: "https://schema.org/LimitedAvailability",
              url: seo.event.url,
              validFrom: seo.event.offerValidFrom,
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
        ]
      : []),
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
      hasCredential: {
        "@type": "EducationalOccupationalCredential",
        name: "BSc Eng (Hons) in Computer Engineering",
        credentialCategory: "Bachelor's Degree",
        educationalLevel: "Bachelor's Degree (4 years)",
        recognizedBy: {
          "@type": "CollegeOrUniversity",
          name: "University of Ruhuna",
          department:
            "Faculty of Engineering — Department of Computer Engineering",
          url: "https://www.ruh.ac.lk/",
        },
      },
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
      hasCredential: {
        "@type": "EducationalOccupationalCredential",
        name: "BSc Eng (Hons) in Computer Engineering",
        credentialCategory: "Bachelor's Degree",
        educationalLevel: "Bachelor's Degree (4 years)",
        recognizedBy: {
          "@type": "CollegeOrUniversity",
          name: "University of Ruhuna",
          department:
            "Faculty of Engineering — Department of Computer Engineering",
          url: "https://www.ruh.ac.lk/",
        },
      },
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
    /* 6. FAQPage — key AEO schema, managed from Settings -> SEO & AEO */
    faqSchema(seo, locale),
  ];
}
