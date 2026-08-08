import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { getSettings } from "@/lib/settings";

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

async function testBrevo(apiKey: string) {
  if (!apiKey) return { success: false, message: "No API key provided" };
  const res = await fetchWithTimeout("https://api.brevo.com/v3/account", {
    headers: { Accept: "application/json", "api-key": apiKey },
  });
  if (!res.ok) {
    const body = await res.text();
    return { success: false, message: `Brevo responded ${res.status}: ${body.slice(0, 200)}` };
  }
  const data = await res.json();
  return { success: true, message: `Connected as ${data.email ?? data.companyName ?? "account"}` };
}

async function testLLM(baseUrl: string, apiKey: string, model: string) {
  if (!apiKey || !model) return { success: false, message: "API key and model are required" };
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
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const section = body.section as Section;
  if (!SECTIONS.includes(section)) {
    return NextResponse.json({ error: "Invalid section" }, { status: 400 });
  }

  const incoming = (body.data ?? {}) as Record<string, string>;
  const settings = await getSettings();
  const stored = section === "brevo" ? settings.brevo : section === "llm" ? settings.llm : settings.embedding;

  // Resolve a still-masked apiKey field back to the real stored secret.
  const apiKey =
    typeof incoming.apiKey === "string" && incoming.apiKey.includes("••••")
      ? stored.apiKey
      : incoming.apiKey ?? stored.apiKey;

  try {
    let result;
    if (section === "brevo") {
      result = await testBrevo(apiKey);
    } else if (section === "llm") {
      result = await testLLM(incoming.baseUrl ?? "", apiKey, incoming.model ?? "");
    } else {
      result = await testEmbedding(incoming.baseUrl ?? "", apiKey, incoming.model ?? "");
    }
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error && err.name === "AbortError"
      ? "Request timed out"
      : err instanceof Error ? err.message : "Connection test failed";
    return NextResponse.json({ success: false, message });
  }
}
