"use client";

import { SignInButton, SignUpButton } from "@clerk/nextjs";
import { LockKeyhole } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Shown in place of the checkout form when nobody is signed in.
 *
 * Clerk runs in modal mode across this site (there's no standalone /sign-in
 * route), so the gate offers the modal here rather than navigating away —
 * after signing in the visitor lands back on this same checkout page.
 */
export default function CheckoutSignInPrompt() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6 py-16">
      <div className="mx-auto max-w-md text-center">
        <div className="mb-6 flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-sm">
            <LockKeyhole className="h-7 w-7" style={{ color: "var(--brand-navy)" }} />
          </div>
        </div>

        <h1 className="mb-3 text-2xl font-bold" style={{ color: "var(--brand-navy)" }}>
          Sign in to continue
        </h1>
        <p className="mb-8 text-slate-500">
          Enrolments are linked to your account, so you can find your courses, payment
          history and receipts in one place. It only takes a moment.
        </p>

        <div className="flex flex-col justify-center gap-3 sm:flex-row">
          <SignUpButton mode="modal">
            <Button className="btn-brand-copper rounded-full px-8 text-white">
              Create an account
            </Button>
          </SignUpButton>
          <SignInButton mode="modal">
            <Button variant="outline" className="rounded-full px-8">
              I already have one
            </Button>
          </SignInButton>
        </div>
      </div>
    </main>
  );
}
