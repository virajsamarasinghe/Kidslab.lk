import mongoose, { Schema, Document } from "mongoose";

interface BrevoConfig {
  apiKey: string;
  senderEmail: string;
  senderName: string;
}

interface LLMConfig {
  provider: string;
  baseUrl: string;
  apiKey: string;
  model: string;
}

interface EmbeddingConfig {
  provider: string;
  baseUrl: string;
  apiKey: string;
  model: string;
}

export interface ISettings extends Document {
  brevo: BrevoConfig;
  llm: LLMConfig;
  embedding: EmbeddingConfig;
}

const BrevoSchema = new Schema<BrevoConfig>(
  {
    apiKey:      { type: String, default: "" },
    senderEmail: { type: String, default: "" },
    senderName:  { type: String, default: "" },
  },
  { _id: false }
);

const LLMSchema = new Schema<LLMConfig>(
  {
    provider: { type: String, default: "" },
    baseUrl:  { type: String, default: "" },
    apiKey:   { type: String, default: "" },
    model:    { type: String, default: "" },
  },
  { _id: false }
);

const EmbeddingSchema = new Schema<EmbeddingConfig>(
  {
    provider: { type: String, default: "" },
    baseUrl:  { type: String, default: "" },
    apiKey:   { type: String, default: "" },
    model:    { type: String, default: "" },
  },
  { _id: false }
);

const SettingsSchema = new Schema<ISettings>(
  {
    brevo:     { type: BrevoSchema,     default: () => ({}) },
    llm:       { type: LLMSchema,       default: () => ({}) },
    embedding: { type: EmbeddingSchema, default: () => ({}) },
  },
  { timestamps: true }
);

export default mongoose.models.Settings as mongoose.Model<ISettings> ||
  mongoose.model<ISettings>("Settings", SettingsSchema);
