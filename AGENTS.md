<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Kidslab.lk

Marketing site + seminar-registration pipeline + admin dashboard for [kidslab.lk](https://kidslab.lk), a Robotics & AI academy for children. See `README.md` for setup and `RELEASE_NOTES.md` for the feature changelog.

## Stack

Next.js 16 (App Router, Turbopack) · TypeScript · Tailwind CSS · MongoDB (Mongoose) · Clerk (visitor auth) · custom JWT cookie (admin auth) · Brevo (transactional email) · next-intl (English/Sinhala).

## Commands

```bash
npm run dev      # dev server
npm run build    # production build (also type-checks)
npm run lint      # eslint
```

There is no test suite yet — verify changes with `npm run build` and, for UI changes, by actually running the dev server.

## Structure

- `src/app/` — routes. `admin/` (dashboard), `api/` (route handlers), `login/` (admin login), `register/` (public seminar registration page).
- `src/components/` — `Navbar`, `RegisterModal`, `admin/*`, `ui/*` (shadcn — see below).
- `src/lib/` — `mongodb.ts` (connection), `auth.ts` (admin JWT), `brevo.ts` (email), `seo.ts` (live SEO config + `generateMetadata` builder), `structured-data.ts` (JSON-LD), `locale-context.tsx`, `register-modal-context.tsx`.
- `src/models/` — Mongoose schemas: `User`, `Course`, `Subscriber`.
- `src/proxy.ts` — this is Next 16's renamed `middleware.ts` (see below). Handles both Clerk session context and the `/admin` JWT-cookie gate in one file.

## Two separate auth systems — don't conflate them

- **Site visitors** sign in/up via **Clerk** (`useUser()`, `<SignInButton>`, `<UserButton>` from `@clerk/nextjs`). Clerk accounts are synced into the MongoDB `User` collection via the webhook at `src/app/api/webhooks/route.ts` (`user.created`/`updated`/`deleted`), which is how they show up in the admin dashboard.
- **Admin dashboard** (`/admin`) uses its own JWT stored in a cookie (`ADMIN_COOKIE_NAME`, `src/config/site.ts`), checked in `src/proxy.ts`, unrelated to Clerk. Login lives at `/login` and posts to `/api/auth/login`.
- The `User` model serves both: `clerkId` is set (and `password` empty) for Clerk accounts; seminar leads and the admin account have a `password` hash and no `clerkId`.

## Non-obvious things worth knowing before you touch auth or middleware

- **`middleware.ts` doesn't exist in this Next.js version** — it's `proxy.ts`, exporting a function named `proxy` (default or named export), same behavior otherwise. Don't recreate `middleware.ts`; it will silently do nothing.
- **This Clerk version (`@clerk/nextjs` v7) dropped `<SignedIn>`/`<SignedOut>`.** Use `useUser()` (`{ isLoaded, isSignedIn }`) in client components and gate rendering yourself, or the server-only `<Show when="signed-in">` in server components. `<UserButton>` no longer takes `afterSignOutUrl`.
- Clerk's dev-vs-production mode is determined by which **keys** you use (`pk_test_`/`sk_test_` vs `pk_live_`/`sk_live_`), not `NODE_ENV`. Going live on kidslab.lk means verifying the domain in the Clerk dashboard and switching to live keys + a separate production webhook endpoint/secret.
- The Clerk webhook endpoint is `/api/webhooks` (not `/api/webhooks/clerk`) — that's the path actually registered in the Clerk dashboard for this project. If you ever add a second webhook source, don't just nest it under this route; check the dashboard config first.

## SEO / AEO is data, not code

Titles, descriptions, keywords, Organization + Event structured data, the FAQ set, the sitemap page list, robots.txt AI-crawler toggles and `/llms.txt` all come from the `seo` section of the singleton Settings doc, edited at `/admin/settings/seo`. Don't hardcode any of it back into a page.

- `src/config/seo.ts` is the **fallback** layer, not the live source — it holds `SEO_DEFAULTS`, and `mergeSeo` in `src/lib/seo.ts` overlays the stored values field by field. A blank stored field falls back here, so clearing an input in the dashboard restores the default instead of emitting empty markup. Same defaults render when Mongo is unreachable.
- **The defaults seed themselves.** `getSeoConfig()` writes `mergeSeo(stored)` back whenever the stored section differs from what the site is serving (`autoSeed`), off the read it already does. Non-destructive by construction — stored values win field by field — and self-limiting, since once written the fields match. So adding a field to `SEO_DEFAULTS` needs no migration: the fallback covers the gap immediately and the next request fills it in. `SEO_AUTO_SEED=0` disables it.
- `npm run seed:seo` (`scripts/seed-seo.mts`) does the same write from the CLI, sharing `mergeSeo` and `changedSeoFields` with the runtime so the two can't disagree. It's for what auto-seeding can't do: `--dry-run` previews, `--force` resets an admin's overrides, and it can target a database that isn't taking traffic.
- Read it with `getSeoConfig()` (60s in-process cache, never throws). Anything that writes it must call `invalidateSeoCache()` — `PUT /api/settings` with `section: "seo"` already does, along with `revalidatePath` for each configured page.
- The Person / ProfilePage JSON-LD blocks in `structured-data.ts` stay hardcoded on purpose: two fixed founders, not business facts that change between deploys.
- **The FAQ has one source**: `seo.faqs`. Each entry carries English + Sinhala text and a `showOnPage` flag, and drives the landing page's FAQ section, the `FAQPage` JSON-LD and `/llms.txt` together. Don't put FAQ copy back into `src/messages/*.json` — it lived in both places before and the two drifted, which is exactly what Google penalises (it only credits FAQ markup whose answers are visible on the page). Structured data and `/llms.txt` always use the English text; Sinhala is page-only and falls back to English when blank.
- The public pages are ISR'd (`revalidate = 300`). Keep `generateMetadata` reading through `getSeoConfig()` rather than hitting Mongo directly, or `/` and `/register` go dynamic.

## Environment / secrets hygiene

- `.env.example` must **only ever contain blank placeholders** — it's the one `.env*` file that isn't gitignored. Real values (including local test-mode Clerk keys) go in `.env.local`, which is gitignored.
- Production secrets live in the hosting platform's environment settings, not in any file in this repo.

## Conventions

- No test suite — don't add one speculatively; ask first if a task seems to call for it.
- Keep `.env.example` in sync whenever you add a new required environment variable, but with a blank value.
- This repo previously lived nested under `academy-web/`; it was flattened to the repo root. If you see stale references to an `academy-web/` path anywhere (docs, scripts, old branches), that's leftover from before the flatten — fix forward, don't recreate the nested layout.
