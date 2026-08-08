import { connectDB } from "@/lib/mongodb";
import ActivityLog from "@/models/ActivityLog";

interface Session {
  email: string;
}

/**
 * Records an admin action for the activity feed. Fire-and-forget — a logging
 * failure must never break the mutation it's describing, so errors are
 * swallowed after being logged to the server console.
 */
export function logActivity(
  session: Session,
  action: string,
  resource: string,
  resourceId?: string,
  meta?: Record<string, unknown>
) {
  (async () => {
    try {
      await connectDB();
      await ActivityLog.create({ actorEmail: session.email, action, resource, resourceId, meta });
    } catch (err) {
      console.error("[activity-log]", err);
    }
  })();
}
