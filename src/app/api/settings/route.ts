import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { getSettings } from "@/lib/settings";

const SECTIONS = ["brevo", "llm", "embedding"] as const;
type Section = (typeof SECTIONS)[number];

function maskSecret(value: string) {
  if (!value) return "";
  if (value.length <= 8) return "••••••••";
  return `${value.slice(0, 4)}••••${value.slice(-4)}`;
}

export async function GET() {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const settings = await getSettings();
  return NextResponse.json({
    brevo: { ...settings.brevo, apiKey: maskSecret(settings.brevo.apiKey) },
    llm: { ...settings.llm, apiKey: maskSecret(settings.llm.apiKey) },
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
  const incoming = (body.data ?? {}) as Record<string, string>;

  // If the apiKey field still contains the masked placeholder, the admin
  // didn't touch it — keep the stored secret rather than overwriting it.
  const currentApiKey =
    section === "brevo" ? settings.brevo.apiKey :
    section === "llm" ? settings.llm.apiKey :
    settings.embedding.apiKey;
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
  } else if (section === "llm") {
    settings.llm = {
      provider: incoming.provider ?? settings.llm.provider,
      baseUrl: incoming.baseUrl ?? settings.llm.baseUrl,
      apiKey: nextApiKey ?? settings.llm.apiKey,
      model: incoming.model ?? settings.llm.model,
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

  const saved = section === "brevo" ? settings.brevo : section === "llm" ? settings.llm : settings.embedding;
  return NextResponse.json({ ...saved, apiKey: maskSecret(saved.apiKey) });
}
