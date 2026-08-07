# AI Robotics Academy — Web

Marketing site and admin dashboard for AI Robotics Academy, built with Next.js (App Router), TypeScript, Tailwind CSS, and MongoDB.

## Stack

- **Framework**: Next.js 16 (App Router), React 19
- **Styling**: Tailwind CSS v4, shadcn/ui components (`src/components/ui`)
- **3D/animation**: React Three Fiber + drei, Motion
- **Database**: MongoDB via Mongoose
- **Auth**: JWT sessions (`jose`) + `bcryptjs` password hashing

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment variables

Copy `.env.example` to `.env.local` and fill in:

```
MONGODB_URI=your-mongodb-connection-string
JWT_SECRET=your-jwt-secret
```

## Scripts

- `npm run dev` — start the dev server
- `npm run build` — production build
- `npm run start` — run the production build
- `npm run lint` — lint the codebase

## Project structure

```
src/
  app/
    admin/        # Admin dashboard (courses, users) — protected via proxy.ts
    api/          # Route handlers: auth, courses, users, register, stats, health
    login/        # Login page
    register/     # Registration page
    page.tsx      # Public homepage
  components/
    admin/        # Admin-only UI (sidebar, etc.)
    ui/           # shadcn/ui primitives
  config/         # site.ts — site URL/name, admin cookie name
  lib/            # auth.ts (JWT), mongodb.ts (connection), utils.ts
  models/         # Mongoose schemas (Course, User)
  types/          # Shared client-facing domain types (Course, User)
  proxy.ts        # Middleware-style route protection
```
