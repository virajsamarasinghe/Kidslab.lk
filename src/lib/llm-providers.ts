export interface ProviderModel {
  value: string;
  label: string;
}

export interface ProviderPreset {
  id: string;
  label: string;
  baseUrl: string;
  /** "openai" = OpenAI-compatible chat/completions or embeddings shape. "anthropic" = native Messages API. */
  apiStyle: "openai" | "anthropic";
  docsUrl: string;
  models: ProviderModel[];
}

export const CUSTOM_PROVIDER_ID = "custom";
export const CUSTOM_MODEL_VALUE = "__custom__";

export const LLM_PROVIDERS: ProviderPreset[] = [
  {
    id: "openai",
    label: "OpenAI",
    baseUrl: "https://api.openai.com/v1",
    apiStyle: "openai",
    docsUrl: "https://platform.openai.com/api-keys",
    models: [
      { value: "gpt-4o", label: "GPT-4o" },
      { value: "gpt-4o-mini", label: "GPT-4o mini" },
      { value: "gpt-4.1", label: "GPT-4.1" },
      { value: "gpt-4.1-mini", label: "GPT-4.1 mini" },
      { value: "o4-mini", label: "o4-mini" },
    ],
  },
  {
    id: "anthropic",
    label: "Anthropic (Claude)",
    baseUrl: "https://api.anthropic.com",
    apiStyle: "anthropic",
    docsUrl: "https://console.anthropic.com/settings/keys",
    models: [
      { value: "claude-opus-5", label: "Claude Opus 5" },
      { value: "claude-sonnet-5", label: "Claude Sonnet 5" },
      { value: "claude-haiku-4-5-20251001", label: "Claude Haiku 4.5" },
    ],
  },
  {
    id: "groq",
    label: "Groq",
    baseUrl: "https://api.groq.com/openai/v1",
    apiStyle: "openai",
    docsUrl: "https://console.groq.com/keys",
    models: [
      { value: "llama-3.3-70b-versatile", label: "Llama 3.3 70B Versatile" },
      { value: "llama-3.1-8b-instant", label: "Llama 3.1 8B Instant" },
      { value: "mixtral-8x7b-32768", label: "Mixtral 8x7B" },
    ],
  },
  {
    id: "openrouter",
    label: "OpenRouter",
    baseUrl: "https://openrouter.ai/api/v1",
    apiStyle: "openai",
    docsUrl: "https://openrouter.ai/keys",
    models: [
      { value: "openai/gpt-4o", label: "OpenAI GPT-4o" },
      { value: "anthropic/claude-3.5-sonnet", label: "Anthropic Claude 3.5 Sonnet" },
      { value: "meta-llama/llama-3.1-70b-instruct", label: "Llama 3.1 70B Instruct" },
    ],
  },
  {
    id: "google",
    label: "Google Gemini",
    baseUrl: "https://generativelanguage.googleapis.com/v1beta/openai",
    apiStyle: "openai",
    docsUrl: "https://aistudio.google.com/apikey",
    models: [
      { value: "gemini-2.0-flash", label: "Gemini 2.0 Flash" },
      { value: "gemini-1.5-pro", label: "Gemini 1.5 Pro" },
    ],
  },
  {
    id: "mistral",
    label: "Mistral",
    baseUrl: "https://api.mistral.ai/v1",
    apiStyle: "openai",
    docsUrl: "https://console.mistral.ai/api-keys",
    models: [
      { value: "mistral-large-latest", label: "Mistral Large" },
      { value: "mistral-small-latest", label: "Mistral Small" },
    ],
  },
];

export const EMBEDDING_PROVIDERS: ProviderPreset[] = [
  {
    id: "openai",
    label: "OpenAI",
    baseUrl: "https://api.openai.com/v1",
    apiStyle: "openai",
    docsUrl: "https://platform.openai.com/api-keys",
    models: [
      { value: "text-embedding-3-small", label: "text-embedding-3-small" },
      { value: "text-embedding-3-large", label: "text-embedding-3-large" },
      { value: "text-embedding-ada-002", label: "text-embedding-ada-002 (legacy)" },
    ],
  },
  {
    id: "mistral",
    label: "Mistral",
    baseUrl: "https://api.mistral.ai/v1",
    apiStyle: "openai",
    docsUrl: "https://console.mistral.ai/api-keys",
    models: [{ value: "mistral-embed", label: "mistral-embed" }],
  },
  {
    id: "jina",
    label: "Jina AI",
    baseUrl: "https://api.jina.ai/v1",
    apiStyle: "openai",
    docsUrl: "https://jina.ai/embeddings",
    models: [
      { value: "jina-embeddings-v3", label: "jina-embeddings-v3" },
      { value: "jina-clip-v2", label: "jina-clip-v2" },
    ],
  },
];

export function findProvider(list: ProviderPreset[], id: string) {
  return list.find(p => p.id === id);
}
