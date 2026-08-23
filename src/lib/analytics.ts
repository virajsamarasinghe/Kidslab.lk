import { sendGTMEvent } from "@next/third-parties/google";

/**
 * Conversion events pushed to the GTM dataLayer.
 *
 * Each name here needs a matching Custom Event trigger in the GTM container
 * (Trigger type "Custom Event", event name copied verbatim) before anything
 * shows up in GA4 — the push alone does nothing until a tag listens for it.
 *
 * NEVER pass a name, email, phone number or anything else that identifies a
 * child or parent through these params. GA4's terms prohibit sending PII, and
 * the people registering here are under 14. Params are limited to where the
 * click happened, not who clicked.
 */
export type AnalyticsEvent =
  /** A "register" button was pressed — top of the funnel. */
  | "register_cta_click"
  /** The registration form was submitted successfully — the real conversion. */
  | "seminar_registration_complete"
  /** A WhatsApp link was opened. */
  | "whatsapp_click"
  /** A FAQ question was expanded — shows which answers parents look for. */
  | "faq_open";

type EventParams = Record<string, string | number | boolean>;

/**
 * Push a named event to the dataLayer.
 *
 * `sendGTMEvent` creates `window.dataLayer` if GTM has not finished loading,
 * so events fired early (a fast click on the hero CTA) queue rather than
 * being dropped.
 */
export function track(event: AnalyticsEvent, params: EventParams = {}): void {
  if (typeof window === "undefined") return;
  sendGTMEvent({ event, ...params });
}
