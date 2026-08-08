import { unstable_cache, revalidateTag } from "next/cache";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import Subscriber from "@/models/Subscriber";
import Contact, { type PipelineStage } from "@/models/Contact";
import type { CampaignSegment } from "@/models/Campaign";

export const UNIFIED_CONTACTS_TAG = "unified-contacts";

/** Call after any write that changes a User/Subscriber/Contact so the next read is fresh. */
export function invalidateUnifiedContacts() {
  // { expire: 0 } forces immediate expiration so a stage/note change is
  // visible on the very next read, instead of the deprecated single-arg
  // behavior or the stale-while-revalidate "max" profile.
  revalidateTag(UNIFIED_CONTACTS_TAG, { expire: 0 });
}

export interface UnifiedContact {
  email: string;
  name: string;
  phone: string;
  city: string;
  interestedCourse: string;
  source: "user" | "subscriber" | "manual";
  stage: PipelineStage;
  tags: string[];
  notes: { text: string; createdAt: Date }[];
  createdAt: Date;
}

/** Merges Users, Subscribers, and manual Contact entries into one CRM view, keyed by email. */
async function fetchUnifiedContacts(): Promise<UnifiedContact[]> {
  await connectDB();

  const [users, subscribers, overlays] = await Promise.all([
    User.find({ role: "user" }).select("-password").lean(),
    Subscriber.find().lean(),
    Contact.find().lean(),
  ]);

  const overlayByEmail = new Map(overlays.map(o => [o.email.toLowerCase(), o]));
  const byEmail = new Map<string, UnifiedContact>();

  for (const u of users) {
    const email = u.email.toLowerCase();
    const overlay = overlayByEmail.get(email);
    byEmail.set(email, {
      email,
      name: u.name,
      phone: u.phone || "",
      city: u.city || "",
      interestedCourse: u.interestedCourse || "",
      source: "user",
      stage: overlay?.stage ?? "registered",
      tags: overlay?.tags ?? [],
      notes: overlay?.notes ?? [],
      createdAt: u.createdAt,
    });
  }

  for (const s of subscribers) {
    const email = s.email.toLowerCase();
    if (byEmail.has(email)) continue;
    const overlay = overlayByEmail.get(email);
    byEmail.set(email, {
      email,
      name: overlay?.name || "",
      phone: overlay?.phone || "",
      city: "",
      interestedCourse: "",
      source: "subscriber",
      stage: overlay?.stage ?? "lead",
      tags: overlay?.tags ?? [],
      notes: overlay?.notes ?? [],
      createdAt: s.createdAt,
    });
  }

  for (const o of overlays) {
    const email = o.email.toLowerCase();
    if (byEmail.has(email)) continue;
    // Manual-only contact, not tied to a User or Subscriber record.
    byEmail.set(email, {
      email,
      name: o.name || "",
      phone: o.phone || "",
      city: "",
      interestedCourse: "",
      source: "manual",
      stage: o.stage,
      tags: o.tags ?? [],
      notes: o.notes ?? [],
      createdAt: o.createdAt,
    });
  }

  return Array.from(byEmail.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

/**
 * Cached view of {@link fetchUnifiedContacts} — this merge does three unbounded
 * collection scans and is hit every ~60s by the sidebar summary poll plus every
 * CRM page load, so a short TTL cuts that down substantially. Call
 * {@link invalidateUnifiedContacts} after any write that should be reflected
 * immediately (stage change, note added, contact created).
 */
export const getUnifiedContacts = unstable_cache(fetchUnifiedContacts, ["unified-contacts"], {
  revalidate: 30,
  tags: [UNIFIED_CONTACTS_TAG],
});

/**
 * Number of unified contacts sitting in the `lead` stage that are newer than
 * `since` — the sidebar badge count.
 *
 * This deliberately avoids {@link getUnifiedContacts}: that merge pulls every
 * field of every User, Subscriber and Contact document, and the sidebar polls
 * this on every admin page load plus every 60s. Here the same merge runs over
 * three narrow projections instead, so the wire payload is a fraction of the
 * size while the stage resolution stays identical.
 */
async function countLeadsSince(sinceMs: number): Promise<number> {
  await connectDB();
  const since = new Date(sinceMs);

  const [users, subscribers, overlays] = await Promise.all([
    User.find({ role: "user" }).select("email createdAt").lean(),
    Subscriber.find().select("email createdAt").lean(),
    Contact.find().select("email stage createdAt").lean(),
  ]);

  const overlayStageByEmail = new Map(overlays.map(o => [o.email.toLowerCase(), o.stage]));
  const seen = new Set<string>();
  let leads = 0;

  // Users default to "registered", so one only counts as a lead when an overlay
  // explicitly put it back in that stage.
  for (const u of users) {
    const email = u.email.toLowerCase();
    seen.add(email);
    const stage = overlayStageByEmail.get(email) ?? "registered";
    if (stage === "lead" && u.createdAt > since) leads++;
  }

  for (const s of subscribers) {
    const email = s.email.toLowerCase();
    if (seen.has(email)) continue;
    seen.add(email);
    const stage = overlayStageByEmail.get(email) ?? "lead";
    if (stage === "lead" && s.createdAt > since) leads++;
  }

  for (const o of overlays) {
    const email = o.email.toLowerCase();
    if (seen.has(email)) continue;
    seen.add(email);
    if (o.stage === "lead" && o.createdAt > since) leads++;
  }

  return leads;
}

/** Cached alongside the unified-contacts view so CRM writes invalidate both. */
export const getLeadCountSince = unstable_cache(countLeadsSince, ["unified-lead-count"], {
  revalidate: 30,
  tags: [UNIFIED_CONTACTS_TAG],
});

/** Resolves a campaign audience segment into a list of {email, name} recipients. */
export async function resolveSegment(segment: CampaignSegment): Promise<{ email: string; name: string }[]> {
  await connectDB();

  if (segment === "all_subscribers") {
    const subs = await Subscriber.find().lean();
    return subs.map(s => ({ email: s.email, name: "" }));
  }
  if (segment === "all_students") {
    const users = await User.find({ role: "user" }).select("email name").lean();
    return users.map(u => ({ email: u.email, name: u.name }));
  }
  if (segment === "active_students") {
    const users = await User.find({ role: "user", status: "active" }).select("email name").lean();
    return users.map(u => ({ email: u.email, name: u.name }));
  }
  if (segment === "inactive_students") {
    const users = await User.find({ role: "user", status: "inactive" }).select("email name").lean();
    return users.map(u => ({ email: u.email, name: u.name }));
  }
  // all_contacts
  const contacts = await getUnifiedContacts();
  return contacts.map(c => ({ email: c.email, name: c.name }));
}
