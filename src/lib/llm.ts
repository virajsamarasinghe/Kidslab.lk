import { getSettings } from "@/lib/settings";
import { LLM_PROVIDERS, findProvider } from "@/lib/llm-providers";
import type { LLMConfig } from "@/models/Settings";

export interface ResolvedLLM {
  provider: string;
  baseUrl: string;
  apiKey: string;
  model: string;
  /** "openai" = OpenAI-compatible chat/completions. "anthropic" = native Messages API. */
  apiStyle: "openai" | "anthropic";
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

/**
 * Every configured LLM provider that's actually usable, best first.
 *
 * Credentials come only from Settings → AI Providers in the dashboard — never
 * from environment variables — so a key can be rotated without a redeploy and
 * every caller sees the same values. Same rule as the Brevo config in
 * `@/lib/brevo`.
 *
 * `priority` is the admin's fallback order (1 tried first, 5 last); entries
 * missing a key or a model are dropped rather than left to fail at request
 * time.
 */
export async function getLLMConfigs(): Promise<ResolvedLLM[]> {
  const settings = await getSettings();
  return (settings.llm ?? [])
    .filter((c: LLMConfig) => c.apiKey && c.model)
    .sort((a: LLMConfig, b: LLMConfig) => (a.priority ?? 3) - (b.priority ?? 3))
    .map((c: LLMConfig) => {
      const preset = findProvider(LLM_PROVIDERS, c.provider);
      return {
        provider: c.provider,
        baseUrl: (c.baseUrl || preset?.baseUrl || "").replace(/\/$/, ""),
        apiKey: c.apiKey,
        model: c.model,
        apiStyle: preset?.apiStyle ?? "openai",
      };
    })
    .filter((c: ResolvedLLM) => Boolean(c.baseUrl));
}

/**
 * Builds the upstream request for one provider.
 *
 * Deliberately minimal: `model`, `max_tokens`, `system`, `messages`, `stream`
 * and nothing else. The model is a free-text field an admin picks from a
 * dropdown that spans six vendors, so any model-specific tuning parameter
 * (Anthropic's `thinking` / `output_config.effort`, OpenAI's reasoning knobs)
 * risks a 400 on whatever they select next. Response length is controlled by
 * the system prompt and `max_tokens` instead, which every provider honours.
 */
function buildRequest(
  llm: ResolvedLLM,
  system: string,
  messages: ChatMessage[],
  maxTokens: number
): { url: string; headers: Record<string, string>; body: string } {
  if (llm.apiStyle === "anthropic") {
    return {
      url: `${llm.baseUrl}/v1/messages`,
      headers: {
        "Content-Type": "application/json",
        "x-api-key": llm.apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: llm.model,
        max_tokens: maxTokens,
        system,
        messages,
        stream: true,
      }),
    };
  }

  return {
    url: `${llm.baseUrl}/chat/completions`,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${llm.apiKey}`,
    },
    body: JSON.stringify({
      model: llm.model,
      max_tokens: maxTokens,
      messages: [{ role: "system", content: system }, ...messages],
      stream: true,
    }),
  };
}

/**
 * Pulls the incremental text out of one SSE `data:` payload.
 *
 * Both wire formats are newline-delimited `data: <json>` frames, so one parser
 * covers them — Anthropic puts the text at `delta.text` on a
 * `content_block_delta`, OpenAI-compatible providers at
 * `choices[0].delta.content`. Anything else (ping, usage, role-only opener) has
 * no text and is skipped.
 */
function extractDelta(payload: string): string {
  if (payload === "[DONE]") return "";
  try {
    const data = JSON.parse(payload);
    if (data.type === "content_block_delta") return data.delta?.text ?? "";
    return data.choices?.[0]?.delta?.content ?? "";
  } catch {
    return "";
  }
}

/**
 * Streams a completion as plain UTF-8 text chunks, trying each configured
 * provider in priority order until one accepts the request.
 *
 * Fallback only covers failures that happen *before* the first byte — a
 * connection error or a non-2xx status. Once a provider starts streaming, its
 * response is what the caller gets; retrying mid-stream would duplicate text
 * already shown to the user.
 *
 * Throws when every provider fails, so the route can answer with a real status
 * code rather than an empty 200.
 */
export async function streamChat(
  system: string,
  messages: ChatMessage[],
  maxTokens = 700
): Promise<ReadableStream<Uint8Array>> {
  const configs = await getLLMConfigs();
  if (configs.length === 0) {
    throw new Error("No AI provider configured in Settings → AI Providers");
  }

  const failures: string[] = [];

  for (const llm of configs) {
    const { url, headers, body } = buildRequest(llm, system, messages, maxTokens);

    let res: Response;
    try {
      res = await fetch(url, { method: "POST", headers, body });
    } catch (err) {
      failures.push(`${llm.provider}: ${err instanceof Error ? err.message : "network error"}`);
      continue;
    }

    if (!res.ok || !res.body) {
      const detail = await res.text().catch(() => "");
      failures.push(`${llm.provider} responded ${res.status}: ${detail.slice(0, 200)}`);
      continue;
    }

    return toTextStream(res.body);
  }

  throw new Error(`All AI providers failed — ${failures.join("; ")}`);
}

/** Re-frames an upstream SSE body as a bare text stream the browser can append directly. */
function toTextStream(upstream: ReadableStream<Uint8Array>): ReadableStream<Uint8Array> {
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  const reader = upstream.getReader();
  // SSE frames don't align with network chunks — a `data:` line can arrive
  // split across two reads, so hold the tail until it's newline-terminated.
  let buffer = "";

  return new ReadableStream({
    async pull(controller) {
      const { done, value } = await reader.read();
      if (done) {
        controller.close();
        return;
      }

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      let text = "";
      for (const line of lines) {
        if (!line.startsWith("data:")) continue;
        text += extractDelta(line.slice(5).trim());
      }
      if (text) controller.enqueue(encoder.encode(text));
    },
    cancel(reason) {
      // Propagate a client disconnect upstream so we stop paying for tokens
      // nobody will read.
      return reader.cancel(reason);
    },
  });
}
