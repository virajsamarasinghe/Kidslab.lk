import LandingPage from "@/components/LandingPage";
import { getActiveCourses } from "@/lib/courses";
import { buildLandingJsonLd } from "@/lib/structured-data";

/* Courses change rarely and only via the admin dashboard, so serve a cached
   render and refresh it in the background every 5 minutes. */
export const revalidate = 300;

export default async function Home() {
  const courses = await getActiveCourses();
  const jsonLd = buildLandingJsonLd(courses);

  return (
    <>
      {jsonLd.map((schema, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}
      <LandingPage courses={courses} />
    </>
  );
}
