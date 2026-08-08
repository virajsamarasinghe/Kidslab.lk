import { connectDB } from "@/lib/mongodb";
import Settings, { ISettings } from "@/models/Settings";

/** Fetches the singleton settings doc, creating it with defaults if it doesn't exist yet. */
export async function getSettings(): Promise<ISettings> {
  await connectDB();
  let doc = await Settings.findOne();
  if (!doc) doc = await Settings.create({});
  return doc;
}
