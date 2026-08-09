import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { parseBody } from "@/lib/validate";
import { enforceRateLimit, clientIp } from "@/lib/rate-limit";
import { streamChat, type ChatMessage } from "@/lib/llm";
import { getAssistantConfig, buildSystemPrompt } from "@/lib/assistant";

/**
 * Caps chosen for a landing-page assistant, not a general chatbot: enough
 * history to keep a short conversation coherent, short enough that a scripted
 * caller can't push a large prompt through our API key.
 */
const MAX_HISTORY = 12;

const ChatSchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().trim().min(1).max(1000),
      })
    )
    .min(1)
    .max(MAX_HISTORY),
  locale: z.enum(["en", "si"]).default("en"),
}).strict();

/**
 * Public chat endpoint for the landing-page assistant.
 *
 * Unauthenticated and backed by a paid API key, so it's rate-limited per IP.
 * Both halves of the configuration are admin-owned and read from the database:
 * the provider and model from Settings → LLM Config (`@/lib/llm`), the persona
 * and rules from Settings → AI Assistant (`@/lib/assistant`).
 */
export async function POST(req: NextRequest) {
  const limited = await enforceRateLimit("chat", clientIp(req), 20, 300);
  if (limited) return limited;

  const parsed = await parseBody(req, ChatSchema);
  if (parsed instanceof NextResponse) return parsed;

  const config = await getAssistantConfig();
  if (!config.enabled) {
    return NextResponse.json({ error: "The assistant is turned off." }, { status: 404 });
  }

  const system = await buildSystemPrompt(config, parsed.locale);

  try {
    const stream = await streamChat(system, parsed.messages as ChatMessage[], config.maxTokens);
    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store",
        // Without this, a proxy that buffers the response defeats streaming
        // and the widget sits silent until the whole reply is ready.
        "X-Accel-Buffering": "no",
      },
    });
  } catch (err) {
    console.error("[chat] no provider could answer", err);
    return NextResponse.json(
      { error: "The assistant is unavailable right now. Please message us on WhatsApp." },
      { status: 503 }
    );
  }
}
