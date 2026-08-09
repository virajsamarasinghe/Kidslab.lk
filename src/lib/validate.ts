import { NextResponse } from "next/server";
import type { ZodType } from "zod";

/**
 * Parses and validates a JSON request body against a schema.
 *
 * Returns either the typed data or a ready-to-return 400. Mirrors the shape of
 * `requireCapability`, so a handler reads:
 *
 *     const parsed = await parseBody(req, Schema);
 *     if (parsed instanceof NextResponse) return parsed;
 *
 * Beyond rejecting bad input, this strips unknown keys — which matters for
 * handlers that spread the body into a database update, where an extra field
 * would otherwise be written straight through.
 */
export async function parseBody<T>(
  req: Request,
  schema: ZodType<T>
): Promise<T | NextResponse> {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: "Expected a JSON body" }, { status: 400 });
  }

  const result = schema.safeParse(raw);
  if (!result.success) {
    const first = result.error.issues[0];
    const field = first?.path.join(".");
    return NextResponse.json(
      { error: field ? `${field}: ${first.message}` : (first?.message ?? "Invalid request") },
      { status: 400 }
    );
  }
  return result.data;
}
