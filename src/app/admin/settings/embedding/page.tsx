"use client";

import { Layers3 } from "lucide-react";
import ProviderConfigForm from "@/components/admin/ProviderConfigForm";
import { EMBEDDING_PROVIDERS } from "@/lib/llm-providers";

export default function EmbeddingSettingsPage() {
  return (
    <ProviderConfigForm
      section="embedding"
      title="Embedding Model"
      description="Connect an embeddings provider for search, RAG, or similarity features."
      icon={Layers3}
      providers={EMBEDDING_PROVIDERS}
      keyPlaceholder="sk-…"
    />
  );
}
