import mongoose, { Schema, Document } from "mongoose";

export interface ISubscriber extends Document {
  email: string;
  source: string;
  createdAt: Date;
}

const SubscriberSchema = new Schema<ISubscriber>(
  {
    email:  { type: String, required: true, unique: true, lowercase: true, trim: true },
    source: { type: String, default: "popup" },
  },
  { timestamps: true }
);

SubscriberSchema.index({ createdAt: -1 });

export default mongoose.models.Subscriber as mongoose.Model<ISubscriber> ||
  mongoose.model<ISubscriber>("Subscriber", SubscriberSchema);
