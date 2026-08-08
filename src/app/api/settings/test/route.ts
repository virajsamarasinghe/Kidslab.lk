import { NextRequest, NextResponse } from "next/server";
import { requireCapability } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { createSmtpTransport, mergeBrevoInput, resolveSmtp, type BrevoSmtpCredentials } from "@/lib/brevo";

const SECTIONS = ["brevo", "llm", "embedding"] as const;
type Section = (typeof SECTIONS)[number];
const TIMEOUT_MS = 12000;

async function fetchWithTimeout(url: string, init: RequestInit) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(id);
  }
}

/** Verifies the Brevo SMTP relay — the transport `sendEmail` actually uses. */
async function testBrevo(smtp: BrevoSmtpCredentials | null) {
  if (!smtp) return { success: false, message: "SMTP login and key are required" };

  const transport = createSmtpTransport(smtp);
  try {
    await transport.verify();
    return { success: true, message: `SMTP relay reachable — authenticated as ${smtp.user} on ${smtp.host}:${smtp.port}` };
  } catch (err) {
    const message = err instanceof Error ? err.message : "SMTP connection failed";
    return { success: false, message: `SMTP error: ${message}` };
  } finally {
    transport.close();
  }
}

async function testAnthropic(baseUrl: string, apiKey: string, model: string) {
  const url = `${(baseUrl || "https://api.anthropic.com").replace(/\/$/, "")}/v1/messages`;
  const res = await fetchWithTimeout(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      max_tokens: 8,
      messages: [{ role: "user", content: "Reply with the single word: OK" }],
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    return { success: false, message: `Anthropic responded ${res.status}: ${body.slice(0, 200)}` };
  }
  const data = await res.json();
  const reply = data.content?.[0]?.text?.trim();
  return { success: true, message: reply ? `Model replied: "${reply}"` : "Connected — model responded successfully" };
}

async function testLLM(providerId: string, baseUrl: string, apiKey: string, model: string) {
  if (!apiKey || !model) return { success: false, message: "API key and model are required" };
  if (providerId === "anthropic") return testAnthropic(baseUrl, apiKey, model);

  const url = `${(baseUrl || "https://api.openai.com/v1").replace(/\/$/, "")}/chat/completions`;
  const res = await fetchWithTimeout(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content: "Reply with the single word: OK" }],
      max_tokens: 5,
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    return { success: false, message: `LLM endpoint responded ${res.status}: ${body.slice(0, 200)}` };
  }
  const data = await res.json();
  const reply = data.choices?.[0]?.message?.content?.trim();
  return { success: true, message: reply ? `Model replied: "${reply}"` : "Connected — model responded successfully" };
}

async function testEmbedding(baseUrl: string, apiKey: string, model: string) {
  if (!apiKey || !model) return { success: false, message: "API key and model are required" };
  const url = `${(baseUrl || "https://api.openai.com/v1").replace(/\/$/, "")}/embeddings`;
  const res = await fetchWithTimeout(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ model, input: "connection test" }),
  });
  if (!res.ok) {
    const body = await res.text();
    return { success: false, message: `Embedding endpoint responded ${res.status}: ${body.slice(0, 200)}` };
  }
  const data = await res.json();
  const dims = data.data?.[0]?.embedding?.length;
  return { success: true, message: dims ? `Connected — received a ${dims}-dimension vector` : "Connected successfully" };
}

export async function POST(req: NextRequest) {
  const session = await requireCapability("settings:manage");
  if (session instanceof NextResponse) return session;

  const body = await req.json();
  const section = body.section as Section;
  if (!SECTIONS.includes(section)) {
    return NextResponse.json({ error: "Invalid section" }, { status: 400 });
  }

  const incoming = (body.data ?? {}) as Record<string, string | number>;
  const settings = await getSettings();
  const storedApiKey =
    section === "llm" ? (settings.llm[Number(incoming.index)]?.apiKey ?? "") :
    settings.embedding.apiKey;

  // Resolve a still-masked apiKey field back to the real stored secret.
  const apiKeyIn = incoming.apiKey as string | undefined;
  const apiKey =
    typeof apiKeyIn === "string" && apiKeyIn.includes("••••")
      ? storedApiKey
      : apiKeyIn ?? storedApiKey;

  try {
    let result;
    if (section === "brevo") {
      result = await testBrevo(resolveSmtp(mergeBrevoInput(settings.brevo, incoming)));
    } else if (section === "llm") {
      result = await testLLM(
        (incoming.providerId as string) ?? "",
        (incoming.baseUrl as string) ?? "",
        apiKey,
        (incoming.model as string) ?? ""
      );
    } else {
      result = await testEmbedding((incoming.baseUrl as string) ?? "", apiKey, (incoming.model as string) ?? "");
    }
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error && err.name === "AbortError"
      ? "Request timed out"
      : err instanceof Error ? err.message : "Connection test failed";
    return NextResponse.json({ success: false, message });
  }
}
