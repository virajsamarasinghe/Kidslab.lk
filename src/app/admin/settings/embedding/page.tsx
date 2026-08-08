"use client";

import { Layers3 } from "lucide-react";
import SettingsForm from "@/components/admin/SettingsForm";

export default function EmbeddingSettingsPage() {
  return (
    <SettingsForm
      section="embedding"
      title="Embedding Model"
      description="Connect an embeddings endpoint for search, RAG, or similarity features."
      icon={Layers3}
      fields={[
        { key: "provider", label: "Provider Name", placeholder: "e.g. OpenAI, Cohere, Voyage" },
        { key: "baseUrl", label: "Base URL", placeholder: "https://api.openai.com/v1", helper: "Leave blank to default to OpenAI's endpoint." },
        { key: "apiKey", label: "API Key", type: "password", placeholder: "sk-…" },
        { key: "model", label: "Model", placeholder: "e.g. text-embedding-3-small" },
      ]}
    />
  );
}
