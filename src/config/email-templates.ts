/**
 * The shipped copy for every outbound email, and the metadata the dashboard
 * needs to edit it.
 *
 * Same arrangement as `@/config/seo`: this file is the **fallback** layer, not
 * the live source. `mergeEmailTemplates` in `@/lib/email-templates` overlays
 * whatever the admin saved on top of these, field by field, so a template that
 * has never been touched — or one saved before a new field existed — still
 * renders complete copy.
 *
 * What is editable is the *wording*: subject, inbox preheader, heading, the
 * paragraphs around the detail panel, the button, and the two closing notes.
 * What stays in code is the *machinery*: the branded shell, the detail rows
 * (they're generated from real data), and the reset link itself. An admin
 * should be able to rewrite every sentence we send without being able to break
 * a password reset.
 */

import {
  CONTACT_PHONE,
  SITE_LEGAL_NAME,
  SITE_NAME,
  SITE_URL,
} from "@/config/site";

export const EMAIL_TEMPLATE_KEYS = [
  "welcome",
  "adminInvite",
  "passwordReset",
  "smtpTest",
] as const;

export type EmailTemplateKey = (typeof EMAIL_TEMPLATE_KEYS)[number];

/**
 * The editable slots of one email, in the order they render:
 *
 * ```
 * heading
 * intro          ← paragraphs, blank line between them
 * [detail panel] ← supplied by the sending code, not editable
 * outro          ← paragraphs
 * [button]       ← omitted when buttonLabel is blank
 * note           ← small print, e.g. "this link expires in 30 minutes"
 * ─────────
 * footerNote     ← small print, e.g. "didn't request this?"
 * ```
 *
 * Every slot except `subject`, `preheader`, `heading` and `intro` may be left
 * blank to drop it from the message; the four required ones fall back to the
 * shipped text so an email can never go out headless or with an empty subject.
 */
export interface EmailTemplateContent {
  subject: string;
  /** Inbox preview text, shown beside the subject. Keep under ~90 characters. */
  preheader: string;
  heading: string;
  intro: string;
  outro: string;
  buttonLabel: string;
  buttonUrl: string;
  note: string;
  footerNote: string;
}

export type EmailTemplates = Record<EmailTemplateKey, EmailTemplateContent>;

/**
 * Placeholders an admin may use in any slot of a given template, with the
 * value the preview and the test send substitute in.
 *
 * `{{token}}` substitution is escaped at render time — a registrant's name
 * arriving as `<script>` gets neutralised, while the admin's own markup around
 * it (a `<strong>`, a link) is honoured, since editing settings already
 * requires the `settings:manage` capability.
 */
export interface EmailTemplateVariable {
  token: string;
  description: string;
  sample: string;
}

export interface EmailTemplateMeta {
  key: EmailTemplateKey;
  label: string;
  /** When this email goes out — shown under the template name in the dashboard. */
  description: string;
  /** Marketing mail carries an unsubscribe footer; transactional mail doesn't. */
  kind: "transactional" | "marketing";
  variables: EmailTemplateVariable[];
  /** Stand-in for the detail rows the sending code injects, so previews aren't hollow. */
  sampleRows: { label: string; value: string }[];
}

/** Tokens every template understands, on top of its own. */
const COMMON_VARIABLES: EmailTemplateVariable[] = [
  { token: "siteName", description: "Site name", sample: SITE_NAME },
  { token: "siteUrl", description: "Site address", sample: SITE_URL },
  { token: "legalName", description: "Full academy name", sample: SITE_LEGAL_NAME },
  { token: "contactPhone", description: "WhatsApp / phone number", sample: CONTACT_PHONE },
];

export const EMAIL_TEMPLATE_META: Record<EmailTemplateKey, EmailTemplateMeta> = {
  welcome: {
    key: "welcome",
    label: "Registration welcome",
    description: "Sent to a visitor the moment they complete the public seminar registration form.",
    kind: "marketing",
    variables: [
      { token: "name", description: "Registrant's name", sample: "Nimal Perera" },
      { token: "email", description: "Registrant's email", sample: "nimal@example.com" },
      { token: "phone", description: "Registrant's phone (may be blank)", sample: "+94 77 123 4567" },
      { token: "course", description: "Course they're interested in (may be blank)", sample: "Robotics Explorers" },
      ...COMMON_VARIABLES,
    ],
    sampleRows: [
      { label: "Name", value: "Nimal Perera" },
      { label: "Email", value: "nimal@example.com" },
      { label: "Phone", value: "+94 77 123 4567" },
      { label: "Interested in", value: "Robotics Explorers" },
    ],
  },
  adminInvite: {
    key: "adminInvite",
    label: "Admin invitation",
    description: "Sent to a new dashboard admin with their login link and one-time temporary password.",
    kind: "transactional",
    variables: [
      { token: "name", description: "New admin's name", sample: "Sanduni Fernando" },
      { token: "email", description: "New admin's email", sample: "sanduni@example.com" },
      { token: "roleLabel", description: "Role they were given", sample: "Editor" },
      { token: "loginUrl", description: "Dashboard login link", sample: `${SITE_URL}/login` },
      ...COMMON_VARIABLES,
    ],
    sampleRows: [
      { label: "Login link", value: `${SITE_URL}/login` },
      { label: "Email", value: "sanduni@example.com" },
      { label: "Temporary password", value: "Xk4p-92mQ-7Tzr" },
    ],
  },
  passwordReset: {
    key: "passwordReset",
    label: "Password reset",
    description: "Sent when an admin uses “Forgot password” on the login page.",
    kind: "transactional",
    variables: [
      { token: "name", description: "Admin's name", sample: "Sanduni Fernando" },
      { token: "email", description: "Admin's email", sample: "sanduni@example.com" },
      { token: "minutes", description: "Minutes until the link expires", sample: "30" },
      { token: "resetUrl", description: "The one-time reset link", sample: `${SITE_URL}/reset-password?token=…` },
      ...COMMON_VARIABLES,
    ],
    sampleRows: [],
  },
  smtpTest: {
    key: "smtpTest",
    label: "SMTP test",
    description: "The diagnostic message sent by “Send Test Email” under Settings → Brevo Email.",
    kind: "transactional",
    variables: [
      { token: "sender", description: "Configured sender address", sample: "support@kidslab.lk" },
      { token: "relay", description: "SMTP host and port", sample: "smtp-relay.brevo.com:587" },
      ...COMMON_VARIABLES,
    ],
    sampleRows: [
      { label: "Sender", value: "support@kidslab.lk" },
      { label: "Relay", value: "smtp-relay.brevo.com:587" },
      { label: "Sent at", value: "Mon, 23 Aug 2026 09:14:00 GMT" },
    ],
  },
};

export const EMAIL_TEMPLATE_DEFAULTS: EmailTemplates = {
  welcome: {
    subject: "Welcome to {{siteName}} — your registration is confirmed",
    preheader: "We've received your registration — here's what happens next.",
    heading: "Welcome, {{name}}!",
    intro:
      "Thanks for registering with <strong>{{legalName}}</strong>. We're delighted to have you with us.\n\nHere's what we have on file:",
    outro:
      "Our team will contact you shortly on WhatsApp or by phone to confirm your seminar slot and answer any questions.",
    buttonLabel: "Explore our courses",
    buttonUrl: "{{siteUrl}}/#courses",
    note: "",
    footerNote:
      "Something not right? Just reply to this email or message us on WhatsApp at {{contactPhone}} and we'll fix it.",
  },
  adminInvite: {
    subject: "Your {{siteName}} admin account",
    preheader: "You've been added as a {{roleLabel}} — sign in and set your own password.",
    heading: "Welcome to the {{siteName}} dashboard",
    intro:
      "Hi {{name}},\n\nAn account has been created for you on the {{siteName}} admin dashboard with the <strong>{{roleLabel}}</strong> role. Use the temporary credentials below to sign in.",
    outro: "",
    buttonLabel: "Sign in",
    buttonUrl: "{{loginUrl}}",
    note: "You'll be asked to choose your own password the moment you sign in — the temporary one above stops working as soon as you do.",
    footerNote:
      "Weren't expecting this? Contact your administrator — someone may have added your email by mistake.",
  },
  passwordReset: {
    subject: "Reset your {{siteName}} admin password",
    preheader: "Your password reset link expires in {{minutes}} minutes.",
    heading: "Reset your password",
    intro:
      "Hi {{name}},\n\nWe received a request to reset the password for your {{siteName}} admin account. Click the button below to choose a new one.",
    outro: "",
    buttonLabel: "Reset password",
    buttonUrl: "{{resetUrl}}",
    note: "This link expires in <strong>{{minutes}} minutes</strong> and can only be used once.",
    footerNote:
      "Didn't request this? You can safely ignore this email — your password won't change, and nobody can reset it without this link. If you keep receiving these, contact your administrator.",
  },
  smtpTest: {
    subject: "{{siteName}} — SMTP test email",
    preheader: "Your {{siteName}} email configuration is delivering correctly.",
    heading: "SMTP is working",
    intro:
      "This is a test message from the KidsLab admin dashboard. If you're reading it, outgoing email is configured correctly and delivering to real inboxes.",
    outro: "",
    buttonLabel: "",
    buttonUrl: "",
    note: "No action is needed. This message was triggered manually from Settings → Brevo Email.",
    footerNote: "",
  },
};
