import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import RateLimit from "@/models/RateLimit";

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

/**
 * Fixed-window rate limiter backed by MongoDB.
 *
 * Counting in memory is useless here — the app runs on serverless instances
 * that don't share state, so a per-process counter resets constantly and never
 * actually throttles. A single atomic upsert per call keeps the cost to one
 * round trip on an already-pooled connection.
 *
 * Fixed windows (rather than sliding) can allow up to 2x the limit across a
 * window boundary. That's an accepted trade for the simplicity; these limits
 * exist to stop runaway loops and abuse, not to meter billing precisely.
 */
export async function checkRateLimit(
  bucket: string,
  identifier: string,
  limit: number,
  windowSeconds: number
): Promise<RateLimitResult> {
  await connectDB();

  const key = `${bucket}:${identifier}`;
  const now = new Date();
  const windowMs = windowSeconds * 1000;

  const existing = await RateLimit.findOne({ key });

  // No record, or the previous window has elapsed: start a fresh one.
  if (!existing || now.getTime() - existing.windowStart.getTime() >= windowMs) {
    await RateLimit.findOneAndUpdate(
      { key },
      { $set: { count: 1, windowStart: now } },
      { upsert: true }
    );
    return { allowed: true, remaining: limit - 1, retryAfterSeconds: 0 };
  }

  const elapsed = now.getTime() - existing.windowStart.getTime();
  const retryAfterSeconds = Math.max(1, Math.ceil((windowMs - elapsed) / 1000));

  if (existing.count >= limit) {
    return { allowed: false, remaining: 0, retryAfterSeconds };
  }

  const updated = await RateLimit.findOneAndUpdate(
    { key },
    { $inc: { count: 1 } },
    { new: true }
  );
  return {
    allowed: true,
    remaining: Math.max(0, limit - (updated?.count ?? limit)),
    retryAfterSeconds,
  };
}

/**
 * Guard form: returns a ready-to-return 429 when the caller is over budget,
 * or `null` to proceed. Mirrors `requireCapability`'s shape so route handlers
 * read the same way.
 */
export async function enforceRateLimit(
  bucket: string,
  identifier: string,
  limit: number,
  windowSeconds: number
): Promise<NextResponse | null> {
  const result = await checkRateLimit(bucket, identifier, limit, windowSeconds);
  if (result.allowed) return null;

  return NextResponse.json(
    { error: `Too many requests. Try again in ${result.retryAfterSeconds}s.` },
    { status: 429, headers: { "Retry-After": String(result.retryAfterSeconds) } }
  );
}

/** Best-effort client IP from the proxy headers, for limiting unauthenticated routes. */
export function clientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}
