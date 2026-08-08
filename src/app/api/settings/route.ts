import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { logActivity } from "@/lib/activity-log";
import type { LLMConfig } from "@/models/Settings";

const SECTIONS = ["brevo", "llm", "embedding"] as const;
type Section = (typeof SECTIONS)[number];

function maskSecret(value: string) {
  if (!value) return "";
  if (value.length <= 8) return "••••••••";
  return `${value.slice(0, 4)}••••${value.slice(-4)}`;
}

function maskLLM(entry: LLMConfig) {
  return { ...entry, apiKey: maskSecret(entry.apiKey) };
}

export async function GET() {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const settings = await getSettings();
  return NextResponse.json({
    brevo: { ...settings.brevo, apiKey: maskSecret(settings.brevo.apiKey) },
    llm: settings.llm.map(maskLLM),
    embedding: { ...settings.embedding, apiKey: maskSecret(settings.embedding.apiKey) },
  });
}

export async function PUT(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const section = body.section as Section;
  if (!SECTIONS.includes(section)) {
    return NextResponse.json({ error: "Invalid section" }, { status: 400 });
  }

  const settings = await getSettings();

  if (section === "llm") {
    // `data` is either a single entry (with optional `index` to update an
    // existing one, or omitted to append a new provider) or `{ remove: index }`.
    const incoming = (body.data ?? {}) as Record<string, unknown>;

    if (typeof incoming.remove === "number") {
      settings.llm.splice(incoming.remove, 1);
    } else {
      const index = typeof incoming.index === "number" ? incoming.index : -1;
      const existing = index >= 0 ? settings.llm[index] : undefined;
      const apiKeyIn = incoming.apiKey as string | undefined;
      const nextApiKey =
        typeof apiKeyIn === "string" && apiKeyIn.includes("••••")
          ? existing?.apiKey ?? ""
          : apiKeyIn ?? existing?.apiKey ?? "";

      const entry: LLMConfig = {
        provider: (incoming.provider as string) ?? existing?.provider ?? "",
        baseUrl: (incoming.baseUrl as string) ?? existing?.baseUrl ?? "",
        apiKey: nextApiKey,
        model: (incoming.model as string) ?? existing?.model ?? "",
        priority: typeof incoming.priority === "number" ? incoming.priority : existing?.priority ?? 3,
      };

      if (existing) {
        settings.llm[index] = entry;
      } else {
        settings.llm.push(entry);
      }
    }

    settings.markModified("llm");
    await settings.save();
    logActivity(session, "updated", "settings", "llm");
    return NextResponse.json(settings.llm.map(maskLLM));
  }

  const incoming = (body.data ?? {}) as Record<string, string>;

  // If the apiKey field still contains the masked placeholder, the admin
  // didn't touch it — keep the stored secret rather than overwriting it.
  const currentApiKey = section === "brevo" ? settings.brevo.apiKey : settings.embedding.apiKey;
  const nextApiKey =
    typeof incoming.apiKey === "string" && incoming.apiKey.includes("••••")
      ? currentApiKey
      : incoming.apiKey;

  if (section === "brevo") {
    settings.brevo = {
      apiKey: nextApiKey ?? settings.brevo.apiKey,
      senderEmail: incoming.senderEmail ?? settings.brevo.senderEmail,
      senderName: incoming.senderName ?? settings.brevo.senderName,
    };
  } else {
    settings.embedding = {
      provider: incoming.provider ?? settings.embedding.provider,
      baseUrl: incoming.baseUrl ?? settings.embedding.baseUrl,
      apiKey: nextApiKey ?? settings.embedding.apiKey,
      model: incoming.model ?? settings.embedding.model,
    };
  }

  await settings.save();
  logActivity(session, "updated", "settings", section);

  const saved = section === "brevo" ? settings.brevo : settings.embedding;
  return NextResponse.json({ ...saved, apiKey: maskSecret(saved.apiKey) });
}
