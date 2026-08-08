import mongoose, { Schema, Document } from "mongoose";
import { PIPELINE_STAGES, type PipelineStage } from "@/types/crm";

export { PIPELINE_STAGES };
export type { PipelineStage };

interface INote {
  text: string;
  createdAt: Date;
}

export interface IContact extends Document {
  email: string;
  name: string;
  phone: string;
  stage: PipelineStage;
  tags: string[];
  notes: INote[];
  source: "user" | "subscriber" | "manual";
  createdAt: Date;
}

const NoteSchema = new Schema<INote>(
  { text: { type: String, required: true } },
  { timestamps: { createdAt: true, updatedAt: false } }
);

const ContactSchema = new Schema<IContact>(
  {
    email:  { type: String, required: true, unique: true, lowercase: true, trim: true },
    name:   { type: String, default: "" },
    phone:  { type: String, default: "" },
    stage:  { type: String, enum: PIPELINE_STAGES, default: "lead" },
    tags:   [{ type: String }],
    notes:  [NoteSchema],
    source: { type: String, enum: ["user", "subscriber", "manual"], default: "manual" },
  },
  { timestamps: true }
);

ContactSchema.index({ stage: 1 });

export default mongoose.models.Contact as mongoose.Model<IContact> ||
  mongoose.model<IContact>("Contact", ContactSchema);
