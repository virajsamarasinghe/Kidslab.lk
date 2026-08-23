import mongoose, { Schema, Document } from "mongoose";
import { DEFAULT_ASSISTANT_PROMPT } from "@/config/assistant";
import { SEO_DEFAULTS, type SeoConfig } from "@/config/seo";

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
  seo: SeoConfig;
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

/**
 * Admin-editable SEO/AEO overrides.
 *
 * Every field defaults to the shipped value in `@/config/seo`, and blank
 * fields fall back to it again at read time (see `@/lib/seo`) — so clearing an
 * input in the dashboard restores the default rather than emitting empty
 * markup. `strict: false` is deliberately NOT set: unknown keys are dropped,
 * which keeps a malformed PUT from persisting junk into the public metadata.
 */
const SeoPageSchema = new Schema<SeoConfig["pages"][number]>(
  {
    path:             { type: String,   default: "/" },
    title:            { type: String,   default: "" },
    description:      { type: String,   default: "" },
    keywords:         { type: [String], default: () => [] },
    ogImage:          { type: String,   default: "" },
    canonical:        { type: String,   default: "" },
    noindex:          { type: Boolean,  default: false },
    includeInSitemap: { type: Boolean,  default: true },
    priority:         { type: Number,   default: 0.5, min: 0, max: 1 },
    changeFrequency:  { type: String,   default: "monthly", enum: ["always", "hourly", "daily", "weekly", "monthly", "yearly", "never"] },
  },
  { _id: false }
);

const SeoFaqSchema = new Schema<SeoConfig["faqs"][number]>(
  {
    question: { type: String, default: "" },
    answer:   { type: String, default: "" },
  },
  { _id: false }
);

const SeoFactSchema = new Schema<SeoConfig["answerFacts"][number]>(
  {
    label: { type: String, default: "" },
    value: { type: String, default: "" },
  },
  { _id: false }
);

const SeoOrganizationSchema = new Schema<SeoConfig["organization"]>(
  {
    legalName:       { type: String,   default: "" },
    alternateNames:  { type: [String], default: () => [] },
    slogan:          { type: String,   default: "" },
    description:     { type: String,   default: "" },
    keywords:        { type: String,   default: "" },
    telephone:       { type: String,   default: "" },
    email:           { type: String,   default: "" },
    streetAddress:   { type: String,   default: "" },
    addressLocality: { type: String,   default: "" },
    postalCode:      { type: String,   default: "" },
    addressCountry:  { type: String,   default: "" },
    latitude:        { type: Number,   default: 0 },
    longitude:       { type: Number,   default: 0 },
    foundingDate:    { type: String,   default: "" },
    sameAs:          { type: [String], default: () => [] },
    areaServed:      { type: [String], default: () => [] },
    knowsAbout:      { type: [String], default: () => [] },
  },
  { _id: false }
);

const SeoEventSchema = new Schema<SeoConfig["event"]>(
  {
    enabled:        { type: Boolean, default: true },
    name:           { type: String,  default: "" },
    description:    { type: String,  default: "" },
    startDate:      { type: String,  default: "" },
    startTime:      { type: String,  default: "" },
    endTime:        { type: String,  default: "" },
    offerValidFrom: { type: String,  default: "" },
    url:            { type: String,  default: "" },
  },
  { _id: false }
);

const SeoSchema = new Schema<SeoConfig>(
  {
    siteName:           { type: String,   default: "" },
    defaultTitle:       { type: String,   default: "" },
    titleTemplate:      { type: String,   default: "" },
    description:        { type: String,   default: "" },
    socialTitle:        { type: String,   default: "" },
    socialDescription:  { type: String,   default: "" },
    keywords:           { type: [String], default: () => [] },
    ogImage:            { type: String,   default: "" },
    twitterCard:        { type: String,   default: "summary_large_image", enum: ["summary", "summary_large_image"] },
    googleVerification: { type: String,   default: "" },
    bingVerification:   { type: String,   default: "" },
    organization:       { type: SeoOrganizationSchema, default: () => ({}) },
    event:              { type: SeoEventSchema,        default: () => ({}) },
    pages:              { type: [SeoPageSchema],       default: () => SEO_DEFAULTS.pages },
    faqs:               { type: [SeoFaqSchema],        default: () => SEO_DEFAULTS.faqs },
    answerFacts:        { type: [SeoFactSchema],       default: () => SEO_DEFAULTS.answerFacts },
    // A free-form bot -> boolean map. Mixed rather than a sub-schema so a new
    // crawler added to AI_CRAWLER_AGENTS needs no migration.
    aiCrawlers:         { type: Schema.Types.Mixed,    default: () => ({ ...SEO_DEFAULTS.aiCrawlers }) },
    llmsTxtNotes:       { type: String,   default: "" },
  },
  { _id: false }
);

const SettingsSchema = new Schema<ISettings>(
  {
    brevo:     { type: BrevoSchema,     default: () => ({}) },
    llm:       { type: [LLMSchema],     default: () => [] },
    embedding: { type: EmbeddingSchema, default: () => ({}) },
    assistant: { type: AssistantSchema, default: () => ({}) },
    seo:       { type: SeoSchema,       default: () => ({}) },
  },
  { timestamps: true }
);

export default mongoose.models.Settings as mongoose.Model<ISettings> ||
  mongoose.model<ISettings>("Settings", SettingsSchema);
