import Link from "next/link";
import type { Metadata } from "next";
import { verifyEmailSignature } from "@/lib/email-optout";
import UnsubscribeForm from "./UnsubscribeForm";

export const metadata: Metadata = {
  title: "Unsubscribe · KidsLab",
  // Unsubscribe URLs are per-recipient; keep them out of search results.
  robots: { index: false, follow: false },
};

/**
 * The human-facing half of unsubscribing.
 *
 * This page confirms rather than opting out on load, because corporate mail
 * security appliances and link-preview bots fetch every URL in an incoming
 * message. Opting out on GET would silently unsubscribe people whose employer
 * scans their mail, and would be undone by no one because they never saw it.
 * The one-click POST from Gmail/Outlook skips this page entirely.
 */
export default async function UnsubscribePage(props: PageProps<"/unsubscribe">) {
  const params = await props.searchParams;
  const email = String(params.e ?? "").trim().toLowerCase();
  const signature = String(params.s ?? "");
  const valid = Boolean(email) && verifyEmailSignature(email, signature);

  return (
    <div
      className="flex min-h-screen items-center justify-center px-6"
      style={{ backgroundColor: "var(--brand-paper)" }}
    >
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          {valid ? "Unsubscribe" : "Link not recognised"}
        </h1>

        {valid ? (
          <>
            <p className="mt-1.5 text-sm text-slate-500">
              Sorry to see you go. Confirm below and we&rsquo;ll stop sending marketing emails to
              this address.
            </p>
            <UnsubscribeForm email={email} signature={signature} />
          </>
        ) : (
          <>
            <p className="mt-1.5 text-sm text-slate-500">
              This unsubscribe link is incomplete or has been altered — that usually means it was
              copied by hand rather than clicked. Open the link straight from the email, or write to{" "}
              <a href="mailto:info@kidslab.lk" className="font-semibold text-slate-700 underline">
                info@kidslab.lk
              </a>{" "}
              and we&rsquo;ll remove you.
            </p>
            <Link
              href="/"
              className="mt-6 inline-block text-xs font-semibold text-slate-500 transition-colors hover:text-slate-800"
            >
              Back to kidslab.lk
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
