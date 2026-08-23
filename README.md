# Kidslab.lk

Marketing site, seminar registration pipeline, and admin dashboard for **[kidslab.lk](https://kidslab.lk)** — Sri Lanka's Robotics & AI academy for children, run by Computer Engineers from the University of Ruhuna, Faculty of Engineering.

Built with Next.js (App Router), TypeScript, Tailwind CSS, and MongoDB.

## Features

- **Marketing site** — Hero (with a 3D scene), Programs, About, Team, Testimonials, Contact, and Footer sections, fully bilingual (English / Sinhala) via `next-intl`.
- **SEO** — structured data (Organization, Event, Person), sitemap, robots.txt, Open Graph/Twitter metadata.
- **Seminar registration** — a lead-capture form (modal + standalone `/register` page) that writes to MongoDB and sends a Brevo welcome email.
- **User accounts** — visitor sign-in/sign-up via [Clerk](https://clerk.com), synced into MongoDB through a webhook so accounts appear in the admin dashboard alongside seminar leads.
- **Admin dashboard** — JWT-protected `/admin` area for managing users, courses, and subscribers, with signup-trend and status-breakdown charts.

See [`RELEASE_NOTES.md`](./RELEASE_NOTES.md) for the full v1.0.0 feature breakdown.

## Tech stack

| Layer | Choice |
|---|---|
| Framework | [Next.js 16](https://nextjs.org) (App Router, Turbopack) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Database | MongoDB (Mongoose) |
| Auth (visitors) | [Clerk](https://clerk.com) |
| Auth (admin) | Custom JWT session cookie |
| Email | [Brevo](https://www.brevo.com) transactional email |
| 3D / animation | react-three-fiber, drei, Motion |
| Charts | Recharts |
| i18n | next-intl (English, Sinhala) |

## Project structure

```
src/
├─ app/              # Routes (App Router)
│  ├─ admin/         # Admin dashboard (users, courses, subscribers)
│  ├─ api/           # Route handlers (auth, register, courses, webhooks, ...)
│  ├─ login/         # Admin login
│  └─ register/      # Public seminar registration page
├─ components/       # UI components (Navbar, RegisterModal, admin/*, ui/*)
├─ config/           # Site constants (name, URL, cookie names)
├─ lib/              # DB connection, auth helpers, Brevo client, contexts
├─ messages/         # i18n strings (en.json, si.json)
├─ models/           # Mongoose schemas (User, Course, Subscriber)
└─ proxy.ts          # Clerk session + admin route protection (Next 16's middleware)
.env.example         # Required environment variables
```

## Getting started

### Prerequisites

- Node.js 20+
- A MongoDB connection string
- A [Clerk](https://dashboard.clerk.com) application (test keys are fine for local dev)
- A [Brevo](https://app.brevo.com) account with a verified sender (optional — email sending is skipped gracefully if unset)

### Setup

```bash
npm install
cp .env.example .env.local   # fill in the values below
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000).

### Environment variables

| Variable | Required | Purpose |
|---|---|---|
| `MONGODB_URI` | Yes | Database connection |
| `JWT_SECRET` | Yes | Signs/verifies the admin session cookie |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Yes | Clerk sign-in/sign-up (client) |
| `CLERK_SECRET_KEY` | Yes | Clerk sign-in/sign-up (server) |
| `CLERK_WEBHOOK_SIGNING_SECRET` | Yes | Verifies Clerk → `/api/webhooks` requests |
| `BREVO_API_KEY` | No | Sends welcome emails |
| `BREVO_SENDER_EMAIL` | No | Verified Brevo sender address |
| `BREVO_SENDER_NAME` | No | Defaults to the site name if unset |

`.env.local` is gitignored — never commit real secrets. `.env.example` should always stay blank placeholders.

> **Production note:** Clerk ties dev-vs-production mode to which keys you use. Local dev uses `pk_test_.../sk_test_...` keys; deploying to kidslab.lk requires verifying the domain in the Clerk dashboard and using the `pk_live_.../sk_live_...` keys (with a separate production webhook endpoint/secret) in your hosting provider's environment settings.

### Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the dev server (Turbopack) |
| `npm run build` | Production build |
| `npm run start` | Run the production build |
| `npm run lint` | Lint the codebase |
| `npm run seed:seo` | Write the shipped SEO/AEO defaults into the database (see below) |

## Deployment

The app is a standard Next.js app and deploys to any Next.js-compatible host (e.g. Vercel). Set all required environment variables (with **live** Clerk keys and a production Clerk webhook) on the hosting platform — none of the `.env.local` values ship with the build.

### Seeding the SEO defaults

The site does not need this to work: anything the database doesn't carry falls back to `SEO_DEFAULTS` in `src/config/seo.ts`, so a brand-new install renders with the correct metadata already. Run the seed when you want the database to *state* the config rather than imply it — every default written out as an editable row in **Settings → SEO & AEO** from day one, instead of appearing there only after the first Publish.

```bash
npm run seed:seo              # fill in whatever's missing
npm run seed:seo -- --dry-run # show what would change, write nothing
npm run seed:seo -- --force   # discard overrides, reset to the shipped defaults
```

It reads `MONGODB_URI` from `.env.local`; point it at another environment by setting the variable in front of the command:

```bash
MONGODB_URI="mongodb+srv://…/kidslab" npm run seed:seo
```

Without `--force` it is safe to re-run as often as you like — it goes through the same `mergeSeo()` the request path uses, so stored values win over defaults field by field and an admin's edits survive. Changes are live within ~60 seconds (the app's SEO cache TTL); no redeploy needed.

**Running it automatically on deploy.** Do *not* put it in the `build` script: builds also run for preview deployments, and a build container often has no network route to the production database (Atlas IP allow-lists, in particular). Run it as a post-deploy step instead — e.g. a GitHub Actions job on push to `main`, with `MONGODB_URI` stored as a repository secret:

```yaml
- run: npm ci
- run: npm run seed:seo
  env:
    MONGODB_URI: ${{ secrets.MONGODB_URI }}
```

Because the default mode never overwrites an override, running it on every deploy is harmless — a new field added to `SEO_DEFAULTS` in a later release gets filled in automatically, and everything the admin has edited stays put.

## License

MIT — see [LICENSE](./LICENSE).
