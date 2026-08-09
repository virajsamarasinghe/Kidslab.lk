/**
 * Role and capability definitions for the admin dashboard.
 *
 * This is the single source of truth — the Mongoose enum, the proxy gate, the
 * API guards and the sidebar all derive from it, so adding a role or moving a
 * capability is a one-file change.
 *
 * Note this is the same `role` field the public site uses: `"user"` means a
 * site visitor (Clerk sign-up or seminar lead) with no dashboard access at all.
 */

export const ADMIN_ROLES = ["viewer", "editor", "admin", "super_admin"] as const;
export type AdminRole = (typeof ADMIN_ROLES)[number];

export const ALL_ROLES = ["user", ...ADMIN_ROLES] as const;
export type Role = (typeof ALL_ROLES)[number];

/** Higher rank strictly implies every capability of the ranks below it. */
const RANK: Record<Role, number> = {
  user: 0,
  viewer: 1,
  editor: 2,
  admin: 3,
  super_admin: 4,
};

export const ROLE_LABELS: Record<Role, string> = {
  user: "User",
  viewer: "Viewer",
  editor: "Editor",
  admin: "Admin",
  super_admin: "Super Admin",
};

export const ROLE_DESCRIPTIONS: Record<AdminRole, string> = {
  viewer: "Read-only access to the dashboard and its reports.",
  editor: "Can create and edit courses, instructors, contacts and campaigns.",
  admin: "Full access including site users and integration settings.",
  super_admin: "Everything, plus adding admins and changing their roles.",
};

export type Capability =
  /** See the dashboard at all. */
  | "dashboard:read"
  /** Create/update/delete content: courses, instructors, contacts, campaigns, subscribers. */
  | "content:write"
  /** Send marketing email to real recipients. */
  | "campaigns:send"
  /** Manage site-visitor user records. */
  | "users:manage"
  /** Read and change integration settings (Brevo, LLM, embedding). */
  | "settings:manage"
  /** Add admins and change their roles. */
  | "admins:manage";

const CAPABILITY_MIN_RANK: Record<Capability, number> = {
  "dashboard:read": RANK.viewer,
  "content:write": RANK.editor,
  "campaigns:send": RANK.editor,
  "users:manage": RANK.admin,
  "settings:manage": RANK.admin,
  "admins:manage": RANK.super_admin,
};

export function isRole(value: unknown): value is Role {
  return typeof value === "string" && value in RANK;
}

export function isAdminRole(value: unknown): value is AdminRole {
  return typeof value === "string" && (ADMIN_ROLES as readonly string[]).includes(value);
}

export function rankOf(role: string | undefined): number {
  return isRole(role) ? RANK[role] : -1;
}

/** True when `role` holds `capability`. Unknown roles always fail closed. */
export function can(role: string | undefined, capability: Capability): boolean {
  const rank = rankOf(role);
  return rank >= 0 && rank >= CAPABILITY_MIN_RANK[capability];
}

/** True when `actor` outranks `target` — the rule for who may edit whom. */
export function outranks(actor: string | undefined, target: string | undefined): boolean {
  return rankOf(actor) > rankOf(target);
}
