import { NextResponse } from "next/server";
import { getAssistantConfig } from "@/lib/assistant";
import { getLLMConfigs } from "@/lib/llm";

/**
 * Presentation config the chat widget needs before its first message.
 *
 * Public, so it returns only what's rendered on screen — never the system
 * prompt, which would hand an attacker the exact text to talk around.
 *
 * `enabled` also folds in whether a provider is actually usable: an admin who
 * turns the assistant on before adding an API key should get no widget at all,
 * rather than one that opens and then fails on the first question.
 */
export async function GET() {
  try {
    const [config, providers] = await Promise.all([getAssistantConfig(), getLLMConfigs()]);

    return NextResponse.json(
      {
        enabled: config.enabled && providers.length > 0,
        title: config.title,
        greeting: config.greeting,
        suggestions: config.suggestions.slice(0, 4),
      },
      // Deliberately uncached: the admin toggle has to take effect on the next
      // page load, not up to a cache lifetime later. Any shared/CDN caching
      // here makes the switch look broken — an admin flips it off, reloads,
      // and the widget is still there.
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch {
    // The marketing page must render even when Mongo is unreachable — a
    // missing widget is a far better outcome than a broken landing page.
    return NextResponse.json({ enabled: false, title: "", greeting: "", suggestions: [] });
  }
}
