import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI!;

if (!MONGODB_URI) throw new Error("MONGODB_URI is not defined");

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var _mongooseCache: MongooseCache;
}

const cache: MongooseCache = global._mongooseCache ?? { conn: null, promise: null };
global._mongooseCache = cache;

export async function connectDB() {
  if (cache.conn) return cache.conn;
  if (!cache.promise) {
    cache.promise = mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
      // The dashboard fires a dozen queries in parallel, so the pool needs
      // enough sockets to run them concurrently instead of queueing.
      maxPoolSize: 20,
      // Keep a socket warm so a request after an idle spell doesn't pay for a
      // fresh TCP + TLS handshake before its first query.
      minPoolSize: 2,
      maxIdleTimeMS: 60_000,
      // Fail fast rather than letting a page hang for the 30s default.
      serverSelectionTimeoutMS: 8_000,
    });
  }
  cache.conn = await cache.promise;
  return cache.conn;
}
