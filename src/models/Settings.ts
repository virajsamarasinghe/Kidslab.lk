import mongoose, { Schema, Document } from "mongoose";

interface BrevoConfig {
  senderEmail: string;
  senderName: string;
  /** SMTP relay login — the account email shown in Brevo → SMTP & API → SMTP. */
  smtpUser: string;
  /** SMTP relay key (`xsmtpsib-…`) — not the `xkeysib-…` REST API key. */
  smtpKey: string;
  smtpHost: string;
  smtpPort: number;
}

export interface LLMConfig {
  provider: string;
  baseUrl: string;
  apiKey: string;
  model: string;
  /** Fallback order when multiple LLM providers are configured — 1 tried first, 5 last. */
  priority: number;
}

interface EmbeddingConfig {
  provider: string;
  baseUrl: string;
  apiKey: string;
  model: string;
}

export interface ISettings extends Document {
  brevo: BrevoConfig;
  llm: LLMConfig[];
  embedding: EmbeddingConfig;
}

const BrevoSchema = new Schema<BrevoConfig>(
  {
    senderEmail: { type: String, default: "" },
    senderName:  { type: String, default: "" },
    smtpUser:    { type: String, default: "" },
    smtpKey:     { type: String, default: "" },
    smtpHost:    { type: String, default: "" },
    smtpPort:    { type: Number, default: 587 },
  },
  { _id: false }
);

const LLMSchema = new Schema<LLMConfig>(
  {
    provider: { type: String, default: "" },
    baseUrl:  { type: String, default: "" },
    apiKey:   { type: String, default: "" },
    model:    { type: String, default: "" },
    priority: { type: Number, default: 3, min: 1, max: 5 },
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
    llm:       { type: [LLMSchema],     default: () => [] },
    embedding: { type: EmbeddingSchema, default: () => ({}) },
  },
  { timestamps: true }
);

export default mongoose.models.Settings as mongoose.Model<ISettings> ||
  mongoose.model<ISettings>("Settings", SettingsSchema);
