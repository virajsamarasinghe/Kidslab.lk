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
npm run lint     # eslint
npm test         # vitest — unit tests for the pure lib logic
```

`npm test` (vitest) covers the pure, high-consequence logic only — roles, password policy, TOTP, email-template merging. It is not a general suite: also verify changes with `npm run build` and, for UI changes, by actually running the dev server.

## Structure

- `src/app/` — routes. `admin/` (dashboard), `api/` (route handlers), `login/` (admin login), `register/` (public seminar registration page).
- `src/components/` — `Navbar`, `RegisterModal`, `admin/*`, `ui/*` (shadcn — see below).
- `src/lib/` — `mongodb.ts` (connection), `auth.ts` (admin JWT), `brevo.ts` (email), `seo.ts` (live SEO config + `generateMetadata` builder), `structured-data.ts` (JSON-LD), `locale-context.tsx`, `register-modal-context.tsx`.
- `src/models/` — Mongoose schemas: `User`, `Course`, `Subscriber`.
- `src/instrumentation.ts` — Next's `register()` hook, run once per server start. Seeds the email templates; see below.
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
- Read it with `getSeoConfig()` (60s in-process cache, never throws). Anything that writes it must call `invalidateSeoCache()` — `PUT /api/settings` with `section: "seo"` already does, along with `revalidatePath` for each configured page.
- The Person / ProfilePage JSON-LD blocks in `structured-data.ts` stay hardcoded on purpose: two fixed founders, not business facts that change between deploys.
- **The FAQ has one source**: `seo.faqs`. Each entry carries English + Sinhala text and a `showOnPage` flag, and drives the landing page's FAQ section, the `FAQPage` JSON-LD and `/llms.txt` together. Don't put FAQ copy back into `src/messages/*.json` — it lived in both places before and the two drifted, which is exactly what Google penalises (it only credits FAQ markup whose answers are visible on the page). Structured data and `/llms.txt` always use the English text; Sinhala is page-only and falls back to English when blank.
- The public pages are ISR'd (`revalidate = 300`). Keep `generateMetadata` reading through `getSeoConfig()` rather than hitting Mongo directly, or `/` and `/register` go dynamic.

## Email copy is data too

The wording of every outbound email lives in the `emailTemplates` section of the same Settings doc, edited at `/admin/settings/email-templates`. Same shape as the SEO section: `src/config/email-templates.ts` holds the shipped defaults and `mergeEmailTemplates` (`src/lib/email-templates.ts`) overlays what's stored, slot by slot.

- Four templates: `welcome`, `adminInvite`, `passwordReset`, `smtpTest`. Adding one means a key in `EMAIL_TEMPLATE_DEFAULTS` + `EMAIL_TEMPLATE_META` and a `renderEmailTemplate` call at the send site — the model, the API section and the dashboard page all iterate `EMAIL_TEMPLATE_KEYS`.
- **Blank means two different things, on purpose.** `subject`, `preheader`, `heading` and `intro` fall back to the shipped copy when cleared — an email can't go out headless. `outro`, `buttonLabel`, `buttonUrl`, `note` and `footerNote` stay blank, because clearing them is how an admin removes a button or a closing note. That's why those fields have no schema default: `undefined` (never written) and `""` (deliberately cleared) have to stay distinguishable. Pinned in `src/lib/email-templates.test.ts`.
- What stays in code is the machinery, not the words: the branded shell in `email-template.ts`, the detail panels (generated from the real record), and the raw reset link, which is passed as `extraNotes` precisely so an edit can't delete it.
- `{{placeholders}}` are substituted escaped in the body and raw in the subject; an unknown token resolves to nothing, and the editor flags it. Values come from the caller — see `commonVars()` in `brevo.ts` for the site-wide ones.
- The dashboard preview calls the very same `previewEmailTemplate` the send path uses, in the browser, so it can't drift. It loads through a **blob URL, not `srcDoc`** — a `srcdoc` written to a frame React mounts is silently dropped and the pane comes up blank.
- **The copy seeds itself at server start.** `src/instrumentation.ts` — Next's `register()` hook, which runs once per server instance — kicks off `seedEmailTemplates()`, writing `mergeEmailTemplates(stored)` so the database states the shipped copy outright instead of leaving it implied. Non-destructive by construction (stored values win slot by slot) and self-limiting (once written, `changedEmailTemplateFields` is empty). Deliberately not awaited: `register()` blocks the server from taking requests, so an unreachable database must not be on that path — the first send seeds again if the hook couldn't land it. `EMAIL_TEMPLATES_AUTO_SEED=0` disables it.
- Seeding makes the defaults *explicit*, so changing a shipped default in a later release will **not** reach an already-seeded install. Adding a template or a slot is fine and needs no migration; changing existing wording needs `npm run seed:email-templates -- --force`.
- `npm run seed:email-templates` (`scripts/seed-email-templates.mts`) does the same write from the CLI, sharing `mergeEmailTemplates` and `changedEmailTemplateFields` with the runtime so the two can't disagree. It covers what the automatic pass can't: `--dry-run` previews, `--force` resets an admin's edits, and it can target a database that isn't taking traffic.
- Anything that writes this section must call `invalidateSettingsSnapshot()`; `PUT /api/settings` with `section: "emailTemplates"` already does.

## Environment / secrets hygiene

- `.env.example` must **only ever contain blank placeholders** — it's the one `.env*` file that isn't gitignored. Real values (including local test-mode Clerk keys) go in `.env.local`, which is gitignored.
- Production secrets live in the hosting platform's environment settings, not in any file in this repo.

## Conventions

- Tests exist only for pure, security- or correctness-critical lib functions (`src/lib/*.test.ts`). Add one there when you write logic of that kind; don't add tests for components or routes speculatively.
- Keep `.env.example` in sync whenever you add a new required environment variable, but with a blank value.
- This repo previously lived nested under `academy-web/`; it was flattened to the repo root. If you see stale references to an `academy-web/` path anywhere (docs, scripts, old branches), that's leftover from before the flatten — fix forward, don't recreate the nested layout.
