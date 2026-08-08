"use client";

import { Send } from "lucide-react";
import SettingsForm from "@/components/admin/SettingsForm";

export default function BrevoSettingsPage() {
  return (
    <SettingsForm
      section="brevo"
      title="Brevo Email"
      description="Transactional email used for welcome emails and notifications, sent through the Brevo SMTP relay."
      icon={Send}
      allowTestEmail
      fields={[
        { key: "senderEmail", label: "Sender Email", placeholder: "hello@kidslab.lk", helper: "Must be a verified sender in Brevo." },
        { key: "senderName", label: "Sender Name", placeholder: "kidslab.lk" },
        { key: "smtpUser", label: "SMTP Login", placeholder: "you@example.com", helper: "Brevo → SMTP & API → SMTP tab." },
        { key: "smtpKey", label: "SMTP Key", type: "password", placeholder: "xsmtpsib-…", helper: "The SMTP key, not the API key." },
        { key: "smtpHost", label: "SMTP Host", placeholder: "smtp-relay.brevo.com", helper: "Leave blank for the Brevo default." },
        { key: "smtpPort", label: "SMTP Port", placeholder: "587", helper: "587 (STARTTLS) or 465 (TLS)." },
      ]}
    />
  );
}
