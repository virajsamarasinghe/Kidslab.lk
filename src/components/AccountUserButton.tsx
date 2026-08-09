"use client";

import { UserButton } from "@clerk/nextjs";
import { User, GraduationCap, Receipt } from "lucide-react";

/**
 * Clerk's `<UserButton />` with links into the account area added to its menu.
 *
 * Clerk's own "Manage account" and "Sign out" entries stay — `MenuItems` only
 * prepends to the existing menu, so identity management keeps living where
 * Clerk handles it, and these three go to the pages we own.
 *
 * Shared so the desktop and mobile navbars can't drift apart.
 */
export default function AccountUserButton() {
  return (
    <UserButton>
      <UserButton.MenuItems>
        <UserButton.Link
          href="/account"
          label="My Profile"
          labelIcon={<User className="size-4" />}
        />
        <UserButton.Link
          href="/account/courses"
          label="My Courses"
          labelIcon={<GraduationCap className="size-4" />}
        />
        <UserButton.Link
          href="/account/payments"
          label="Payment History"
          labelIcon={<Receipt className="size-4" />}
        />
      </UserButton.MenuItems>
    </UserButton>
  );
}
