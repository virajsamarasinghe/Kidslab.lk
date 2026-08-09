"use client";

import { useEffect } from "react";

/**
 * Boundary for the public site. The admin area has its own at
 * `admin/error.tsx`, which renders inside the dashboard shell.
 */
export default function SiteError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-24 text-center">
      <div className="max-w-md">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Something went wrong</h1>
        <p className="mt-3 text-sm leading-relaxed text-slate-500">
          We hit an unexpected problem loading this page. Please try again — if it keeps happening,
          get in touch and we&rsquo;ll take a look.
        </p>
        {error.digest && (
          <p className="mt-3 text-xs text-slate-400">Reference: {error.digest}</p>
        )}
        <div className="mt-6 flex items-center justify-center gap-3">
          <button
            onClick={() => { window.location.href = "/"; }}
            className="rounded-full border border-slate-200 px-5 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
          >
            Go home
          </button>
          <button
            onClick={() => unstable_retry()}
            className="btn-brand-navy rounded-full px-5 py-2 text-sm font-semibold text-white"
          >
            Try again
          </button>
        </div>
      </div>
    </main>
  );
}
