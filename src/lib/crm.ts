import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import Subscriber from "@/models/Subscriber";
import Contact, { type PipelineStage } from "@/models/Contact";
import type { CampaignSegment } from "@/models/Campaign";

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
export async function getUnifiedContacts(): Promise<UnifiedContact[]> {
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
