import { SITE_URL } from "@/config/site";
import { getActiveCourses } from "@/lib/courses";
import { getSeoConfig } from "@/lib/seo";

/* Same cadence as the landing page — the facts here come from the same two
   sources (courses + SEO settings) and change just as rarely. */
export const revalidate = 300;

/**
 * `/llms.txt` — a plain-text fact sheet for answer engines.
 *
 * The emerging convention for telling an LLM crawler what a site is, without
 * making it infer it from marketing HTML. Everything here is generated from
 * live data (SEO settings, active courses, the admin-managed FAQ), so it can't
 * drift from the page or the JSON-LD the way a hand-written file would.
 */
export async function GET() {
  const [seo, courses] = await Promise.all([getSeoConfig(), getActiveCourses()]);
  const org = seo.organization;

  const lines: string[] = [
    `# ${seo.siteName}`,
    "",
    `> ${org.slogan}`,
    "",
    org.description,
    "",
    "## Key facts",
    "",
    ...seo.answerFacts.map((f) => `- **${f.label}:** ${f.value}`),
    "",
    "## Contact",
    "",
    `- Website: ${SITE_URL}`,
    `- Website (Sinhala): ${SITE_URL}/si`,
    `- Register: ${SITE_URL}/register`,
    `- Email: ${org.email}`,
    `- Phone / WhatsApp: ${org.telephone}`,
    `- Office: ${[org.streetAddress, org.addressLocality, org.postalCode].filter(Boolean).join(", ")}, Sri Lanka`,
    `- Areas served: ${["all of Sri Lanka", ...org.areaServed].join(", ")}`,
    "",
  ];

  if (courses.length > 0) {
    lines.push("## Courses", "");
    for (const c of courses) {
      lines.push(
        `### ${c.title}`,
        "",
        c.description,
        "",
        `- Ages: ${c.ageRange}`,
        `- Level: ${c.level}`,
        `- Duration: ${c.duration}`,
        ...(c.schedule ? [`- Schedule: ${c.schedule}`] : []),
        `- Fee: LKR ${c.price.toLocaleString("en-LK")}`,
        ...(c.instructors.length > 0
          ? [`- Taught by: ${c.instructors.map((i) => i.name).join(", ")}`]
          : []),
        ""
      );
    }
  }

  if (seo.event.enabled) {
    lines.push(
      "## Free introductory seminar",
      "",
      seo.event.description,
      "",
      `- Date: ${seo.event.startDate}`,
      `- Time: ${seo.event.startTime}–${seo.event.endTime} (Sri Lanka time, UTC+05:30)`,
      `- Cost: free`,
      `- Register: ${seo.event.url}`,
      ""
    );
  }

  lines.push("## Frequently asked questions", "");
  for (const faq of seo.faqs) {
    lines.push(`### ${faq.question}`, "", faq.answer, "");
  }

  if (seo.llmsTxtNotes.trim()) {
    lines.push("## Notes for AI assistants", "", seo.llmsTxtNotes.trim(), "");
  }

  return new Response(lines.join("\n"), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=300, stale-while-revalidate=86400",
    },
  });
}
