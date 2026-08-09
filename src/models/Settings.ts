import mongoose, { Schema, Document } from "mongoose";
import { DEFAULT_ASSISTANT_PROMPT } from "@/config/assistant";

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

/**
 * The public site's chat assistant. Answers using whichever provider in
 * {@link LLMConfig} is configured — this section is only its persona and
 * presentation, so the wording can be tuned from the dashboard without a deploy.
 */
export interface AssistantConfig {
  /** Hides the widget site-wide when false, whatever the LLM config says. */
  enabled: boolean;
  /** Name shown in the panel header. */
  title: string;
  /** First message, rendered locally — it costs no tokens and never varies. */
  greeting: string;
  /** Starter chips shown on the empty state. */
  suggestions: string[];
  /** Admin-authored persona and rules. Course facts and contact details are appended automatically. */
  systemPrompt: string;
  /** Appends the live course list to the prompt so answers track the database. */
  includeCourses: boolean;
  /** Ceiling on one reply. Kept low — this is a chat bubble, not a document. */
  maxTokens: number;
}

export interface ISettings extends Document {
  brevo: BrevoConfig;
  llm: LLMConfig[];
  embedding: EmbeddingConfig;
  assistant: AssistantConfig;
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

const AssistantSchema = new Schema<AssistantConfig>(
  {
    enabled:        { type: Boolean, default: false },
    title:          { type: String,  default: "KidsLab Assistant" },
    greeting:       { type: String,  default: "Hi! Ask me anything about our robotics and AI courses." },
    suggestions:    { type: [String], default: () => ["What ages do you teach?", "How much are the courses?", "When do classes run?"] },
    systemPrompt:   { type: String,  default: DEFAULT_ASSISTANT_PROMPT },
    includeCourses: { type: Boolean, default: true },
    maxTokens:      { type: Number,  default: 700, min: 100, max: 4000 },
  },
  { _id: false }
);

const SettingsSchema = new Schema<ISettings>(
  {
    brevo:     { type: BrevoSchema,     default: () => ({}) },
    llm:       { type: [LLMSchema],     default: () => [] },
    embedding: { type: EmbeddingSchema, default: () => ({}) },
    assistant: { type: AssistantSchema, default: () => ({}) },
  },
  { timestamps: true }
);

export default mongoose.models.Settings as mongoose.Model<ISettings> ||
  mongoose.model<ISettings>("Settings", SettingsSchema);
