"use client";

import { Send } from "lucide-react";
import SettingsForm from "@/components/admin/SettingsForm";

export default function BrevoSettingsPage() {
  return (
    <SettingsForm
      section="brevo"
      title="Brevo Email"
      description="Transactional email used for welcome emails and notifications."
      icon={Send}
      fields={[
        { key: "apiKey", label: "API Key", type: "password", placeholder: "xkeysib-…", helper: "Found in Brevo → Settings → SMTP & API." },
        { key: "senderEmail", label: "Sender Email", placeholder: "hello@kidslab.lk" },
        { key: "senderName", label: "Sender Name", placeholder: "kidslab.lk" },
      ]}
    />
  );
}
