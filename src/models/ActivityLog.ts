import mongoose, { Schema, Document } from "mongoose";

export interface IActivityLog extends Document {
  actorEmail: string;
  action: string;
  resource: string;
  resourceId?: string;
  meta?: Record<string, unknown>;
  createdAt: Date;
}

const ActivityLogSchema = new Schema<IActivityLog>(
  {
    actorEmail: { type: String, required: true },
    action:     { type: String, required: true },
    resource:   { type: String, required: true },
    resourceId: { type: String, default: "" },
    meta:       { type: Schema.Types.Mixed },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

ActivityLogSchema.index({ createdAt: -1 });
// Retention: entries older than 90 days are dropped automatically.
ActivityLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 90 });

export default mongoose.models.ActivityLog as mongoose.Model<IActivityLog> ||
  mongoose.model<IActivityLog>("ActivityLog", ActivityLogSchema);
