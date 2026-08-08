import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";

export const dynamic = "force-dynamic";

function maskUri(uri: string | undefined) {
  if (!uri) return null;
  // mongodb+srv://user:pass@host/db?...  →  mongodb+srv://***:***@host/db?...
  return uri.replace(/\/\/([^:]+):([^@]+)@/, "//***:***@");
}

export async function GET() {
  const env = {
    MONGODB_URI: !!process.env.MONGODB_URI,
    JWT_SECRET: !!process.env.JWT_SECRET,
    ADMIN_EMAIL: !!process.env.ADMIN_EMAIL,
    ADMIN_PASSWORD: !!process.env.ADMIN_PASSWORD,
    NODE_ENV: process.env.NODE_ENV,
  };

  let dbStatus: {
    ok: boolean;
    readyState?: number;
    durationMs?: number;
    errorName?: string;
    errorMessage?: string;
    uriHost?: string | null;
  } = { ok: false };

  const start = Date.now();
  try {
    await connectDB();
    dbStatus = {
      ok: true,
      readyState: mongoose.connection.readyState,
      durationMs: Date.now() - start,
      uriHost: maskUri(process.env.MONGODB_URI),
    };
  } catch (err) {
    const e = err as Error;
    dbStatus = {
      ok: false,
      durationMs: Date.now() - start,
      errorName: e.name,
      errorMessage: e.message,
      uriHost: maskUri(process.env.MONGODB_URI),
    };
  }

  return NextResponse.json({ env, db: dbStatus }, { status: dbStatus.ok ? 200 : 503 });
}
