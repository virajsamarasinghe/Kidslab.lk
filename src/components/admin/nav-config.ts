import {
  LayoutDashboard, Users, BookOpen, Mail, UserRound,
  Settings, Send, BrainCircuit, Layers3, Bot,
  Contact2, KanbanSquare, Megaphone, History, ShieldCheck, Globe, type LucideIcon,
} from "lucide-react";
import { can, type Capability } from "@/lib/roles";

export type SummaryKey = "users" | "subscribers" | "leads";

export interface NavItemDef {
  label: string;
  href: string;
  icon: LucideIcon;
  countKey?: SummaryKey;
  /** Hidden from the sidebar unless the signed-in role holds this. */
  capability?: Capability;
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
  { label: "Users",       href: "/admin/users",       icon: Users,    countKey: "users", capability: "users:manage" },
  { label: "Courses",     href: "/admin/courses",     icon: BookOpen },
  { label: "Instructors", href: "/admin/instructors", icon: UserRound },
  { label: "Subscribers", href: "/admin/subscribers", icon: Mail,     countKey: "subscribers" },
  { label: "Activity",    href: "/admin/activity",    icon: History },
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
      { label: "Administrators",  href: "/admin/settings/admins",    icon: ShieldCheck,   capability: "admins:manage" },
      { label: "Brevo Email",     href: "/admin/settings/brevo",     icon: Send,          capability: "settings:manage" },
      { label: "LLM Config",      href: "/admin/settings/llm",       icon: BrainCircuit,  capability: "settings:manage" },
      { label: "AI Assistant",    href: "/admin/settings/assistant", icon: Bot,           capability: "settings:manage" },
      { label: "Embedding Model", href: "/admin/settings/embedding", icon: Layers3,       capability: "settings:manage" },
      { label: "SEO & AEO",       href: "/admin/settings/seo",       icon: Globe,         capability: "settings:manage" },
    ],
  },
];

/** Flat list of routes that carry a "new since last visit" badge. */
export const countedRoutes: { href: string; countKey: SummaryKey }[] = [
  ...navItems.filter((i): i is NavItemDef & { countKey: SummaryKey } => !!i.countKey),
  ...navGroups.flatMap(g => g.items.filter((i): i is NavItemDef & { countKey: SummaryKey } => !!i.countKey)),
];

/** True when `role` may see this entry — items without a capability are open to all admins. */
function visibleTo(role: string | undefined, item: NavItemDef) {
  return !item.capability || can(role, item.capability);
}

/** The sidebar's view of the nav for one role: empty groups drop out entirely. */
export function navForRole(role: string | undefined) {
  return {
    items: navItems.filter(item => visibleTo(role, item)),
    groups: navGroups
      .map(group => ({ ...group, items: group.items.filter(item => visibleTo(role, item)) }))
      .filter(group => group.items.length > 0),
  };
}

export interface FlatNavEntry extends NavItemDef {
  group?: string;
}

/** Every navigable destination as one flat list — used by search and the command palette. */
export function flattenNav(role?: string): FlatNavEntry[] {
  const { items, groups } = role === undefined
    ? { items: navItems, groups: navGroups }
    : navForRole(role);
  return [
    ...items.map(item => ({ ...item })),
    ...groups.flatMap(group => group.items.map(item => ({ ...item, group: group.label }))),
  ];
}

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
