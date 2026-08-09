import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { requireCapability } from "@/lib/auth";
import { getUnifiedContacts } from "@/lib/crm";
import User from "@/models/User";
import Subscriber from "@/models/Subscriber";

/**
 * Upper bound on exported rows. These handlers buffer the whole result set in
 * memory and serialise it to a single string, so an unbounded `find()` turns a
 * grown dataset into an out-of-memory crash. The cap fails loudly instead.
 */
const MAX_EXPORT_ROWS = 50_000;

/** Wraps a CSV field in quotes and escapes embedded quotes/newlines per RFC 4180. */
function csvField(value: unknown): string {
  const str = String(value ?? "");
  return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
}

function toCsv(headers: string[], rows: unknown[][]): string {
  const lines = [headers.map(csvField).join(",")];
  for (const row of rows) lines.push(row.map(csvField).join(","));
  return lines.join("\r\n");
}

const EXPORTERS: Record<string, () => Promise<{ filename: string; csv: string }>> = {
  async users() {
    await connectDB();
    const users = await User.find({ role: "user" }).select("-password").sort({ createdAt: -1 }).limit(MAX_EXPORT_ROWS).lean();
    const csv = toCsv(
      ["Name", "Email", "Phone", "Age", "City", "Interested Course", "Status", "Joined"],
      users.map(u => [u.name, u.email, u.phone, u.age, u.city, u.interestedCourse, u.status, new Date(u.createdAt).toISOString()])
    );
    return { filename: "users.csv", csv };
  },
  async subscribers() {
    await connectDB();
    const subs = await Subscriber.find().sort({ createdAt: -1 }).limit(MAX_EXPORT_ROWS).lean();
    const csv = toCsv(
      ["Email", "Source", "Subscribed"],
      subs.map(s => [s.email, s.source, new Date(s.createdAt).toISOString()])
    );
    return { filename: "subscribers.csv", csv };
  },
  async contacts() {
    const contacts = await getUnifiedContacts();
    const csv = toCsv(
      ["Name", "Email", "Phone", "City", "Interested Course", "Source", "Stage", "Created"],
      contacts.map(c => [c.name, c.email, c.phone, c.city, c.interestedCourse, c.source, c.stage, new Date(c.createdAt).toISOString()])
    );
    return { filename: "contacts.csv", csv };
  },
};

export async function GET(_req: NextRequest, { params }: { params: Promise<{ resource: string }> }) {
  const session = await requireCapability("dashboard:read");
  if (session instanceof NextResponse) return session;

  const { resource } = await params;
  const exporter = EXPORTERS[resource];
  if (!exporter) return NextResponse.json({ error: "Unknown export resource" }, { status: 404 });

  const { filename, csv } = await exporter();
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
