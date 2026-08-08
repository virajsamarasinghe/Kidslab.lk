import mongoose, { Schema, Document } from "mongoose";

export const CAMPAIGN_SEGMENTS = [
  "all_contacts",
  "all_subscribers",
  "all_students",
  "active_students",
  "inactive_students",
] as const;
export type CampaignSegment = (typeof CAMPAIGN_SEGMENTS)[number];

export interface ICampaign extends Document {
  subject: string;
  body: string;
  segment: CampaignSegment;
  status: "draft" | "sending" | "sent" | "partial" | "failed";
  recipientCount: number;
  sentCount: number;
  failedCount: number;
  sentAt?: Date;
  createdAt: Date;
}

const CampaignSchema = new Schema<ICampaign>(
  {
    subject:        { type: String, required: true, trim: true },
    body:           { type: String, required: true },
    segment:        { type: String, enum: CAMPAIGN_SEGMENTS, default: "all_contacts" },
    status:         { type: String, enum: ["draft", "sending", "sent", "partial", "failed"], default: "draft" },
    recipientCount: { type: Number, default: 0 },
    sentCount:      { type: Number, default: 0 },
    failedCount:    { type: Number, default: 0 },
    sentAt:         { type: Date },
  },
  { timestamps: true }
);

// The campaigns list and the dashboard's "recent campaigns" panel both sort by
// newest first.
CampaignSchema.index({ createdAt: -1 });

export default mongoose.models.Campaign as mongoose.Model<ICampaign> ||
  mongoose.model<ICampaign>("Campaign", CampaignSchema);
