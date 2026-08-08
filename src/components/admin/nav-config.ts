import {
  LayoutDashboard, Users, BookOpen, Mail, UserRound,
  Settings, Send, BrainCircuit, Layers3,
  Contact2, KanbanSquare, Megaphone, type LucideIcon,
} from "lucide-react";

export type SummaryKey = "users" | "subscribers" | "leads";

export interface NavItemDef {
  label: string;
  href: string;
  icon: LucideIcon;
  countKey?: SummaryKey;
}

export interface NavGroupDef {
  id: string;
  label: string;
  icon: LucideIcon;
  basePath: string;
  items: NavItemDef[];
}

export const navItems: NavItemDef[] = [
  { label: "Dashboard",   href: "/admin",             icon: LayoutDashboard },
  { label: "Users",       href: "/admin/users",       icon: Users,    countKey: "users" },
  { label: "Courses",     href: "/admin/courses",     icon: BookOpen },
  { label: "Instructors", href: "/admin/instructors", icon: UserRound },
  { label: "Subscribers", href: "/admin/subscribers", icon: Mail,     countKey: "subscribers" },
];

export const navGroups: NavGroupDef[] = [
  {
    id: "crm",
    label: "CRM",
    icon: Contact2,
    basePath: "/admin/crm",
    items: [
      { label: "Contacts",        href: "/admin/crm/contacts",  icon: Contact2 },
      { label: "Pipeline",        href: "/admin/crm/pipeline",  icon: KanbanSquare, countKey: "leads" },
      { label: "Email Marketing", href: "/admin/crm/campaigns", icon: Megaphone },
    ],
  },
  {
    id: "settings",
    label: "Settings",
    icon: Settings,
    basePath: "/admin/settings",
    items: [
      { label: "Brevo Email",     href: "/admin/settings/brevo",     icon: Send },
      { label: "LLM Config",      href: "/admin/settings/llm",       icon: BrainCircuit },
      { label: "Embedding Model", href: "/admin/settings/embedding", icon: Layers3 },
    ],
  },
];

/** Flat href -> breadcrumb trail (group label omitted for top-level items). */
export function breadcrumbFor(pathname: string): { label: string; href: string }[] {
  if (pathname.startsWith("/admin/profile")) {
    return [{ label: "My Profile", href: "/admin/profile" }];
  }
  for (const item of navItems) {
    if (item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href)) {
      return [{ label: item.label, href: item.href }];
    }
  }
  for (const group of navGroups) {
    for (const item of group.items) {
      if (pathname.startsWith(item.href)) {
        return [
          { label: group.label, href: group.basePath },
          { label: item.label, href: item.href },
        ];
      }
    }
    if (pathname.startsWith(group.basePath)) {
      return [{ label: group.label, href: group.basePath }];
    }
  }
  return [];
}
