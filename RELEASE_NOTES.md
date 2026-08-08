# Release Notes

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
