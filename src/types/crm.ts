export const PIPELINE_STAGES = ["lead", "contacted", "registered", "enrolled", "alumni"] as const;
export type PipelineStage = (typeof PIPELINE_STAGES)[number];

export interface ContactNote {
  text: string;
  createdAt: string;
}

export interface Contact {
  email: string;
  name: string;
  phone: string;
  stage: PipelineStage;
  tags: string[];
  notes: ContactNote[];
  source: "user" | "subscriber" | "manual";
  city: string;
  interestedCourse: string;
  createdAt: string;
}

export type CampaignSegment =
  | "all_contacts"
  | "all_subscribers"
  | "all_students"
  | "active_students"
  | "inactive_students";

export interface Campaign {
  _id: string;
  subject: string;
  body: string;
  segment: CampaignSegment;
  status: "draft" | "sending" | "sent" | "partial" | "failed";
  recipientCount: number;
  sentCount: number;
  failedCount: number;
  sentAt?: string;
  createdAt: string;
}
