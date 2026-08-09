import { NextRequest, NextResponse } from "next/server";
import { requireCapability } from "@/lib/auth";
import { getSettings, invalidateSettingsSnapshot } from "@/lib/settings";
import { logActivity } from "@/lib/activity-log";
import type { ISettings, LLMConfig } from "@/models/Settings";

const SECTIONS = ["brevo", "llm", "embedding", "assistant"] as const;
type Section = (typeof SECTIONS)[number];

function maskSecret(value: string) {
  if (!value) return "";
  if (value.length <= 8) return "••••••••";
  return `${value.slice(0, 4)}••••${value.slice(-4)}`;
}

/**
 * Builds the client-safe view of the settings doc.
 *
 * `toObject()` is essential here: `settings.brevo` / `settings.embedding` /
 * each `settings.llm` entry are Mongoose subdocuments, and spreading one
 * yields its internals (`_doc`, `$__`, `$__parent`) instead of its fields —
 * which both dropped every non-`apiKey` field from the response and leaked
 * the whole unmasked settings doc through `$__parent`.
 */
function serialize(settings: ISettings) {
  const { brevo, llm, embedding, assistant } = settings.toObject<
    Pick<ISettings, "brevo" | "llm" | "embedding" | "assistant">
  >();

  return {
    brevo: { ...brevo, smtpKey: maskSecret(brevo.smtpKey) },
    llm: llm.map((entry: LLMConfig) => ({ ...entry, apiKey: maskSecret(entry.apiKey) })),
    embedding: { ...embedding, apiKey: maskSecret(embedding.apiKey) },
    // No masking: the assistant section holds copy and a prompt, no secrets.
    assistant,
  };
}

export async function GET() {
  const session = await requireCapability("settings:manage");
  if (session instanceof NextResponse) return session;

  const settings = await getSettings();
  return NextResponse.json(serialize(settings));
}

export async function PUT(req: NextRequest) {
  const session = await requireCapability("settings:manage");
  if (session instanceof NextResponse) return session;

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
    // The chat path reads settings from a cached snapshot; without this an
    // admin fixing a dead API key would keep seeing the old one fail.
    invalidateSettingsSnapshot();
    logActivity(session, "updated", "settings", "llm");
    return NextResponse.json(serialize(settings).llm);
  }

  if (section === "assistant") {
    const data = (body.data ?? {}) as Record<string, unknown>;
    const current = settings.assistant;

    settings.assistant = {
      enabled: typeof data.enabled === "boolean" ? data.enabled : current.enabled,
      title: (data.title as string) ?? current.title,
      greeting: (data.greeting as string) ?? current.greeting,
      // Blank rows are how an admin deletes a suggestion chip in the UI.
      suggestions: Array.isArray(data.suggestions)
        ? data.suggestions.map(String).map(s => s.trim()).filter(Boolean).slice(0, 4)
        : current.suggestions,
      // Falling back to the stored prompt on an empty string keeps a cleared
      // textarea from silently leaving the assistant with no instructions.
      systemPrompt: (data.systemPrompt as string)?.trim() || current.systemPrompt,
      includeCourses:
        typeof data.includeCourses === "boolean" ? data.includeCourses : current.includeCourses,
      maxTokens: Math.min(4000, Math.max(100, Number(data.maxTokens) || current.maxTokens || 700)),
    };

    settings.markModified("assistant");
    await settings.save();
    invalidateSettingsSnapshot();
    logActivity(session, "updated", "settings", "assistant");
    return NextResponse.json(serialize(settings).assistant);
  }

  const incoming = (body.data ?? {}) as Record<string, string>;

  // If a secret field still contains the masked placeholder, the admin didn't
  // touch it — keep the stored secret rather than overwriting it.
  const nextApiKey =
    typeof incoming.apiKey === "string" && incoming.apiKey.includes("••••")
      ? settings.embedding.apiKey
      : incoming.apiKey;

  if (section === "brevo") {
    const nextSmtpKey =
      typeof incoming.smtpKey === "string" && incoming.smtpKey.includes("••••")
        ? settings.brevo.smtpKey
        : incoming.smtpKey;

    settings.brevo = {
      senderEmail: incoming.senderEmail ?? settings.brevo.senderEmail,
      senderName: incoming.senderName ?? settings.brevo.senderName,
      smtpUser: incoming.smtpUser ?? settings.brevo.smtpUser,
      smtpKey: nextSmtpKey ?? settings.brevo.smtpKey,
      smtpHost: incoming.smtpHost ?? settings.brevo.smtpHost,
      smtpPort: Number(incoming.smtpPort) || settings.brevo.smtpPort || 587,
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
  invalidateSettingsSnapshot();
  logActivity(session, "updated", "settings", section);

  const saved = serialize(settings);
  return NextResponse.json(section === "brevo" ? saved.brevo : saved.embedding);
}
