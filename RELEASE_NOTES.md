# Release Notes

## v1.1.0 — Dashboard-managed SEO & AEO (2026-08-23)

Everything search engines and AI answer engines see is now editable from the admin dashboard instead of being hardcoded in the source.

### Settings → SEO & AEO (`/admin/settings/seo`)
- **General** — default title, title template, meta description and the keyword list, with a live Google-result preview and length counters.
- **Social cards** — separate OG/Twitter title and description, share image and card type, with a preview.
- **Organization** — legal name, slogan, description, phone, email, full postal address, map coordinates, profile URLs, cities served and subjects taught. Feeds the `EducationalOrganization` / `LocalBusiness` structured data.
- **Seminar** — the free seminar's name, description, date, times and registration URL, plus a switch that removes the `Event` markup entirely once the date has passed. This date also drives each course's start date in the structured data.
- **Pages** — per-route title, description, keywords, canonical, share image, `noindex`, sitemap inclusion, priority and change frequency.
- **FAQ** — one bilingual Q&A set (English + Sinhala, with a per-entry "show on the landing page" switch) that now drives the landing page's FAQ section, the `FAQPage` structured data and `/llms.txt` together. Previously the visible FAQ lived in `src/messages/*.json` and the markup lived in code; the two had drifted apart in wording, which costs rich-result eligibility. The biggest single lever on how the site is quoted in AI answers.
- **Key facts** — short, quotable claims listed at the top of `/llms.txt`.
- **AI crawlers** — per-bot access for GPTBot, ClaudeBot, PerplexityBot, Google-Extended, Applebot-Extended and eleven others; a bot switched off gets an explicit `Disallow: /` in robots.txt.
- **llms.txt** — a free-text note appended to the generated file.

### New public surface
- `/llms.txt` — a plain-text fact sheet for AI crawlers, generated from the settings above plus the live course list, so it can't drift from the site.

### Behaviour
- `sitemap.xml` and `robots.txt` are now generated from the page list and crawler toggles rather than from hardcoded arrays.
- Saving publishes immediately: the SEO cache is dropped and every affected page is revalidated, so an edit doesn't wait out the 5-minute ISR window.
- Blank fields fall back to the shipped defaults in `src/config/seo.ts`, so clearing an input restores the built-in value rather than emitting empty markup. The same defaults render if MongoDB is unreachable.
- The FAQ section on the landing page is now server-rendered from the settings rather than the message files, in Sinhala when a translation exists and English when it doesn't. `faq.items` has been removed from `src/messages/en.json` and `si.json`; the section's heading and subtitle stay there.
- No new environment variables.

## v1.0.0 — First Release (2026-08-08)

Initial public release of the kidslab.lk website: a marketing site for the Robotics & AI academy, a lead/registration pipeline, user accounts, and an admin dashboard.

### Marketing site
- Full landing page — Hero (with 3D scene), Programs, About, Team, Testimonials, Contact, Footer.
- Bilingual support: English and Sinhala (`next-intl`), with a language toggle in the navbar.
- SEO: structured data (Organization, Event, Person schemas), sitemap, robots.txt, Open Graph/Twitter metadata, Google Search Console verification.

### Seminar registration (leads)
- "Register for Free Seminar" form, available both as a modal (triggered from CTAs throughout the page) and a standalone `/register` page.
- Submissions are stored in MongoDB (`User` collection) with duplicate phone/email checks.
- A welcome email is sent via Brevo on successful registration.

### User accounts (Clerk)
- Visitors can sign in / sign up from the navbar using Clerk (modal sign-in/sign-up, account menu when signed in).
- A webhook (`/api/webhooks`) keeps Clerk accounts in sync with the MongoDB `User` collection (create/update/delete), so account holders show up in the admin dashboard alongside seminar leads.
- A welcome email is sent via Brevo the first time a Clerk account is created.
- When a signed-in user opens the registration form, their name and email are pre-filled from their account.
- Admin auth is separate and unaffected: `/admin` still uses its own JWT-cookie login at `/login`.

### Admin dashboard
- JWT-protected admin login and dashboard at `/admin`.
- Manage users, courses, and subscribers (`/admin/users`, `/admin/courses`, `/admin/subscribers`).
- Overview charts: signup trends and status breakdowns, plus summary stats (total subscribers, active users).

### Infrastructure
- Next.js 16 (App Router, Turbopack), TypeScript, Tailwind CSS.
- MongoDB via Mongoose for persistence.
- `proxy.ts` (Next 16's renamed `middleware.ts`) handles both Clerk's session context and the admin JWT-cookie gate.

### Environment variables required
| Variable | Purpose |
|---|---|
| `MONGODB_URI` | Database connection |
| `JWT_SECRET` | Signs/verifies admin session cookies |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` / `CLERK_SECRET_KEY` | Clerk sign-in/sign-up |
| `CLERK_WEBHOOK_SIGNING_SECRET` | Verifies Clerk → `/api/webhooks` requests |
| `BREVO_API_KEY` / `BREVO_SENDER_EMAIL` / `BREVO_SENDER_NAME` | Welcome emails |

See `.env.example` for the full template. Production deployments need their own **live** Clerk keys and a **production** Clerk webhook endpoint — the values used locally are test-mode only.

### Known follow-ups
- Clerk is currently running in development/test mode; switching kidslab.lk to production requires verifying the domain in the Clerk dashboard and issuing live keys.
- No automated test suite yet.
