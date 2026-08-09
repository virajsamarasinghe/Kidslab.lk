"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { User, GraduationCap, Receipt } from "lucide-react";

const LINKS = [
  { href: "/account", label: "Profile", icon: User },
  { href: "/account/courses", label: "My Courses", icon: GraduationCap },
  { href: "/account/payments", label: "Payments", icon: Receipt },
];

/**
 * Side navigation for the account area.
 *
 * Scrolls horizontally on narrow screens rather than collapsing into a menu —
 * with only three destinations, a tab strip is quicker to use than anything
 * that needs opening first.
 */
export default function AccountNav() {
  const pathname = usePathname();

  return (
    <nav className="flex gap-1 overflow-x-auto pb-2 lg:flex-col lg:overflow-visible lg:pb-0">
      {LINKS.map(({ href, label, icon: Icon }) => {
        // `/account` would otherwise match every child route.
        const active = href === "/account" ? pathname === href : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`flex shrink-0 items-center gap-2.5 rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
              active
                ? "bg-white text-[color:var(--brand-navy)] shadow-sm"
                : "text-slate-500 hover:bg-white/60 hover:text-[color:var(--brand-navy)]"
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
