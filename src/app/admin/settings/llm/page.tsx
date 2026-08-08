"use client";

import { BrainCircuit } from "lucide-react";
import SettingsForm from "@/components/admin/SettingsForm";

export default function LLMSettingsPage() {
  return (
    <SettingsForm
      section="llm"
      title="LLM Config"
      description="Connect any OpenAI-compatible chat model — OpenAI, Anthropic, Groq, OpenRouter, local models, etc."
      icon={BrainCircuit}
      fields={[
        { key: "provider", label: "Provider Name", placeholder: "e.g. OpenAI, Groq, OpenRouter" },
        { key: "baseUrl", label: "Base URL", placeholder: "https://api.openai.com/v1", helper: "Leave blank to default to OpenAI's endpoint." },
        { key: "apiKey", label: "API Key", type: "password", placeholder: "sk-…" },
        { key: "model", label: "Model", placeholder: "e.g. gpt-4o-mini" },
      ]}
    />
  );
}
