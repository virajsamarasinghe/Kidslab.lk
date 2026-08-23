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
- **The FAQ has one source**: `seo.faqs`. Each entry carries English + Sinhala text and a `showOnPage` flag, and drives the landing page's FAQ section, the `FAQPage` JSON-LD and `/llms.txt` together. Don't put FAQ copy back into `src/messages/*.json` — it lived in both places before and the two drifted, which is exactly what Google penalises (it only credits FAQ markup whose answers are visible on the page). Each URL's JSON-LD carries the language that URL renders: `/` emits the English Q&A, `/si` the Sinhala, falling back to English per entry exactly as the page does. `/llms.txt` is English-only, and stays that way.
- **The 404 (`src/app/not-found.tsx`) sets `alternates: { canonical: null }`.** Without it the page inherits the root layout's canonical, which points at the homepage — a missing URL declaring itself a duplicate of `/` is the classic soft-404 signal. It's also a real page rather than a redirect to `/`, so the response keeps its 404 status, and it's `noindex, follow` so a crawler arriving on a broken link still walks the recovery links. Next injects its own bare `noindex` on 404s; two compatible robots tags is expected, don't tidy one away.
- The public pages are ISR'd (`revalidate = 300`). Keep `generateMetadata` reading through `getSeoConfig()` rather than hitting Mongo directly, or `/` and `/register` go dynamic.

## Both languages are URLs, not a toggle

English is served unprefixed and Sinhala under `/si`. `src/config/locales.ts` owns that mapping — `LOCALES`, `TRANSLATED_PATHS`, `localizedPath`, `stripLocale` — and everything that emits a URL derives it from there. Nothing should hardcode the `/si` prefix.

- It used to be `localStorage` state on one URL, which meant the Sinhala copy was effectively unpublished: a crawler, and anyone opening a shared link, only ever got English. `LocaleProvider` now takes its locale from the route and the Navbar switcher navigates; there is no stored preference and no locale-based redirect.
- **Only the landing page is translated.** `/register` is an English-only form, so it has no `/si` twin and advertises no `si-LK` alternate — a `/si/register` serving English copy would be duplicate content under a language annotation it doesn't honour. Add a path to `TRANSLATED_PATHS` once its copy actually exists in `src/messages/si.json`, and give it a route folder under `src/app/si/`.
- `buildMetadata(config, path, locale)` takes the *route's* path plus the language it's being served in, so `/si` reuses the `"/"` entry from the dashboard while emitting its own canonical and `og:locale`. `languageAlternates` derives the whole hreflang cluster from the English canonical, so the two pages can't disagree — that reciprocity is pinned in `src/lib/seo.test.ts`, and Search Console flags (and Google discards) a cluster whose members don't return each other's tags.
- The sitemap lists each translated route once per language, both entries carrying the same hreflang set the pages emit. Sitemap annotations and on-page tags are read as one signal; they have to agree.
- `<html lang>` stays `"en"` — the root layout is shared and can't see which route is rendering without going dynamic and costing every page its ISR. `/si` scopes the language on a `display: contents` wrapper instead, which is what screen readers use for the text they're actually reading.

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
