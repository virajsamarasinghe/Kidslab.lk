import mongoose, { Schema, Document } from "mongoose";

export interface IRateLimit extends Document {
  /** `${bucket}:${identifier}` — e.g. `campaign-send:64f...`. */
  key: string;
  count: number;
  /** Start of the current fixed window; also drives TTL expiry. */
  windowStart: Date;
}

const RateLimitSchema = new Schema<IRateLimit>({
  key:         { type: String, required: true, unique: true },
  count:       { type: Number, default: 0 },
  windowStart: { type: Date, default: Date.now },
});

// Mongo reclaims stale counters on its own, so nothing has to sweep them.
// Generous relative to any window we use, since expiry only needs to outlive
// the window itself.
RateLimitSchema.index({ windowStart: 1 }, { expireAfterSeconds: 60 * 60 * 24 });

export default mongoose.models.RateLimit as mongoose.Model<IRateLimit> ||
  mongoose.model<IRateLimit>("RateLimit", RateLimitSchema);
