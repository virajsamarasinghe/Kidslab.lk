import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import NotFoundTracker from "@/components/NotFoundTracker";
import { SITE_NAME } from "@/config/site";

/**
 * Metadata for the 404.
 *
 * `canonical: null` is the load-bearing line. Without it this page inherits
 * the root layout's canonical, which points at the homepage — a 404 that
 * declares itself a duplicate of `/` is the textbook soft-404 signal, and it
 * invites Google to index the missing URL as if it were the front page.
 *
 * `follow: true` alongside `index: false` is deliberate: don't index this
 * page, but do walk the recovery links below, so a crawler that lands here
 * from a broken inbound link still reaches the real pages. Next injects its
 * own bare `noindex` tag on 404 responses, so the rendered page carries two
 * robots tags saying compatible things — that's expected, not a bug to tidy
 * away. Stating it here keeps the intent in the code rather than resting on
 * framework behaviour.
 */
export const metadata: Metadata = {
  // `absolute` opts out of the root layout's title template, which would
  // otherwise render "Page not found — kidslab.lk | kidslab.lk".
  title: { absolute: `Page not found — ${SITE_NAME}` },
  description:
    "The page you were looking for doesn't exist. Find our Robotics & AI classes for kids, or register for the free introductory seminar.",
  robots: { index: false, follow: true },
  alternates: { canonical: null },
};

/** Where a lost visitor most likely meant to go. */
const RECOVERY_LINKS = [
  { href: "/", label: "Home", hint: "Everything about the academy" },
  { href: "/register", label: "Free seminar", hint: "Register in under a minute" },
  { href: "/#programs", label: "Programs", hint: "What your child will build" },
  { href: "/#team", label: "Instructors", hint: "The engineers who teach" },
  { href: "/#contact", label: "Contact", hint: "Talk to us on WhatsApp" },
  { href: "/si", label: "සිංහල", hint: "මෙම වෙබ් අඩවිය සිංහලෙන්" },
];

/**
 * The site's 404.
 *
 * Deliberately a real page and not a redirect to `/`. Bouncing a missing URL
 * to the homepage returns 200 for a page that doesn't exist, which is how a
 * broken link quietly stays broken: Google records a soft 404, the visitor
 * loses the thread of what they clicked, and nobody finds out. This returns
 * the 404 status, says plainly what happened, and offers the routes someone
 * who wanted a robotics class for their child would actually want next.
 */
export default function NotFound() {
  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-20">
      <NotFoundTracker />

      <div className="w-full max-w-2xl text-center">
        <Link href="/" className="inline-flex items-center gap-3" aria-label={SITE_NAME}>
          <span className="rounded-xl bg-white p-1.5 shadow-sm ring-1 ring-slate-100">
            <Image
              src="/logo.png"
              alt=""
              width={44}
              height={44}
              className="h-11 w-11 rounded-lg object-contain"
            />
          </span>
          <span className="text-lg font-bold tracking-tight" style={{ color: "var(--brand-navy)" }}>
            kid<span style={{ color: "var(--brand-red)" }}>s</span>lab.lk
          </span>
        </Link>

        <p
          className="mt-10 font-display text-7xl font-bold leading-none tracking-tight sm:text-8xl"
          style={{ color: "color-mix(in srgb, var(--brand-navy) 18%, white)" }}
        >
          404
        </p>

        <h1
          className="mt-4 text-2xl font-bold tracking-tight sm:text-3xl"
          style={{ color: "var(--brand-navy)" }}
        >
          This page doesn&rsquo;t exist
        </h1>

        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-slate-500 sm:text-base">
          The link may be out of date, or the address may have a typo. Nothing is
          broken on your end — here&rsquo;s where to go instead.
        </p>
        <p className="mt-2 text-sm text-slate-400" lang="si">
          ඔබ සොයන පිටුව හමු නොවීය.
        </p>

        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/register"
            className="btn-brand-copper w-full rounded-full px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors sm:w-auto"
          >
            Register for the free seminar →
          </Link>
          <Link
            href="/"
            className="w-full rounded-full border border-slate-200 px-6 py-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 sm:w-auto"
          >
            Back to home
          </Link>
        </div>

        {/* Real internal links, not a search box: they give the visitor a way
            out and a crawler that arrived here somewhere to go next. */}
        <nav aria-label="Popular pages" className="mt-12 text-left">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Popular pages
          </h2>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {RECOVERY_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="flex flex-col rounded-xl border border-slate-100 px-4 py-3 transition-colors hover:border-slate-200 hover:bg-slate-50"
                >
                  <span
                    className="text-sm font-semibold"
                    style={{ color: "var(--brand-navy)" }}
                  >
                    {link.label}
                  </span>
                  <span className="mt-0.5 text-xs text-slate-400">{link.hint}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </main>
  );
}
