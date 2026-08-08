"use client";

import { BrainCircuit } from "lucide-react";
import ProviderConfigForm from "@/components/admin/ProviderConfigForm";
import { LLM_PROVIDERS } from "@/lib/llm-providers";

export default function LLMSettingsPage() {
  return (
    <ProviderConfigForm
      section="llm"
      title="LLM Config"
      description="Connect any LLM provider — pick a preset or configure a custom OpenAI-compatible endpoint."
      icon={BrainCircuit}
      providers={LLM_PROVIDERS}
      keyPlaceholder="sk-…"
    />
  );
}
