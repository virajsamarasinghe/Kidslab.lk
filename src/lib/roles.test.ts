import { describe, expect, it } from "vitest";
import { ADMIN_ROLES, can, isAdminRole, isRole, outranks, rankOf } from "./roles";

describe("capabilities", () => {
  it("grants each role exactly its tier", () => {
    expect(can("viewer", "dashboard:read")).toBe(true);
    expect(can("viewer", "content:write")).toBe(false);
    expect(can("editor", "content:write")).toBe(true);
    expect(can("editor", "campaigns:send")).toBe(true);
    expect(can("editor", "users:manage")).toBe(false);
    expect(can("admin", "users:manage")).toBe(true);
    expect(can("admin", "settings:manage")).toBe(true);
    expect(can("admin", "admins:manage")).toBe(false);
    expect(can("super_admin", "admins:manage")).toBe(true);
  });

  it("is strictly hierarchical — a higher rank holds everything below it", () => {
    const caps = ["dashboard:read", "content:write", "campaigns:send", "users:manage", "settings:manage", "admins:manage"] as const;
    for (const cap of caps) {
      for (let i = 0; i < ADMIN_ROLES.length; i++) {
        if (!can(ADMIN_ROLES[i], cap)) continue;
        // Every role above this one must also hold the capability.
        for (const higher of ADMIN_ROLES.slice(i + 1)) {
          expect(can(higher, cap), `${higher} should inherit ${cap}`).toBe(true);
        }
      }
    }
  });

  it("fails closed on anything that isn't a known role", () => {
    expect(can("user", "dashboard:read")).toBe(false);
    expect(can(undefined, "dashboard:read")).toBe(false);
    expect(can("", "admins:manage")).toBe(false);
    expect(can("SUPER_ADMIN", "admins:manage")).toBe(false);
    expect(can("root", "admins:manage")).toBe(false);
    expect(can("__proto__", "dashboard:read")).toBe(false);
  });
});

describe("role predicates", () => {
  it("separates site users from admin tiers", () => {
    expect(isRole("user")).toBe(true);
    expect(isAdminRole("user")).toBe(false);
    expect(isAdminRole("super_admin")).toBe(true);
    expect(isAdminRole("nonsense")).toBe(false);
  });

  it("ranks unknown roles below every real one", () => {
    expect(rankOf("nonsense")).toBe(-1);
    expect(rankOf(undefined)).toBe(-1);
    expect(rankOf("user")).toBeGreaterThan(rankOf("nonsense"));
  });

  it("outranks is strict — equal roles do not outrank each other", () => {
    expect(outranks("super_admin", "admin")).toBe(true);
    expect(outranks("admin", "super_admin")).toBe(false);
    expect(outranks("admin", "admin")).toBe(false);
    expect(outranks("nonsense", "user")).toBe(false);
  });
});
