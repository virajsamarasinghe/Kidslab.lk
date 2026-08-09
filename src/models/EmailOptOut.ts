import mongoose, { Schema, Document } from "mongoose";

/**
 * A suppression list: addresses that must never receive marketing mail again.
 *
 * Kept as its own collection rather than a flag on Subscriber/User because a
 * campaign audience is a merge of Users, Subscribers and manual Contacts — an
 * opt-out has to outlive whichever of those records it came from, and has to
 * apply even if the person later re-registers through another route.
 */
export interface IEmailOptOut extends Document {
  email: string;
  source: string;
  createdAt: Date;
}

const EmailOptOutSchema = new Schema<IEmailOptOut>(
  {
    email:  { type: String, required: true, unique: true, lowercase: true, trim: true },
    source: { type: String, default: "email-link" },
  },
  { timestamps: true }
);

export default mongoose.models.EmailOptOut as mongoose.Model<IEmailOptOut> ||
  mongoose.model<IEmailOptOut>("EmailOptOut", EmailOptOutSchema);
