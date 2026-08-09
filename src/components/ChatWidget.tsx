"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowUp, MessageCircle, Sparkles, X } from "lucide-react";
import { useLocale } from "@/lib/locale-context";

interface WidgetConfig {
  enabled: boolean;
  title: string;
  greeting: string;
  suggestions: string[];
}

interface Message {
  role: "user" | "assistant";
  content: string;
}

/** Kept in step with MAX_HISTORY on the API so the client never sends a body the route rejects. */
const MAX_HISTORY = 12;

/**
 * Floating AI assistant for the public site.
 *
 * Everything visitor-facing — whether it appears at all, its name, greeting and
 * starter chips — comes from Settings → AI Assistant, so this component renders
 * nothing until `/api/chat/config` says it's live.
 */
export default function ChatWidget() {
  const { locale } = useLocale();
  const [config, setConfig] = useState<WidgetConfig | null>(null);
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/chat/config")
      .then(r => (r.ok ? r.json() : null))
      .then(setConfig)
      .catch(() => {});
  }, []);

  // Pin to the newest message as replies stream in.
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, busy]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  // Escape closes the panel, matching every other overlay on the site.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  async function send(text: string) {
    const question = text.trim();
    if (!question || busy) return;

    // Trimmed to the newest turns: the route caps history, and older context
    // stops earning its token cost in a short pre-sales chat.
    const history = [...messages, { role: "user" as const, content: question }].slice(-MAX_HISTORY);
    setMessages(history);
    setInput("");
    setError("");
    setBusy(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history, locale }),
      });

      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? "Something went wrong.");
      }

      // Append an empty assistant turn, then grow it chunk by chunk so the
      // reply types itself out instead of appearing all at once.
      setMessages(m => [...m, { role: "assistant", content: "" }]);
      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        setMessages(m => {
          const next = [...m];
          next[next.length - 1] = {
            role: "assistant",
            content: next[next.length - 1].content + chunk,
          };
          return next;
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      // Drop the empty assistant bubble so a failure doesn't leave a blank row.
      setMessages(m => (m.at(-1)?.role === "assistant" && !m.at(-1)?.content ? m.slice(0, -1) : m));
    } finally {
      setBusy(false);
    }
  }

  if (!config?.enabled) return null;

  const streaming = busy && messages.at(-1)?.role === "assistant";

  return (
    <>
      {/* Backdrop — mobile only, where the panel covers most of the screen. */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-40 bg-slate-900/20 backdrop-blur-[2px] sm:hidden"
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {open && (
          <motion.div
            role="dialog"
            aria-label={config.title}
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 380, damping: 30 }}
            style={{ transformOrigin: "bottom right" }}
            className="fixed z-50 flex flex-col overflow-hidden
                       inset-x-3 bottom-3 top-20
                       sm:inset-x-auto sm:top-auto sm:right-5 sm:bottom-[8.5rem] sm:h-[32rem] sm:w-[23rem]
                       rounded-[1.75rem] border border-white/60 bg-white/95 backdrop-blur-xl
                       shadow-[0_24px_60px_-12px_rgba(15,36,24,0.35)]"
          >
            {/* ── Header ── */}
            <div
              className="relative flex items-center gap-3 px-5 py-4 text-white"
              style={{
                background:
                  "linear-gradient(135deg, var(--brand-navy) 0%, #16351f 55%, #1d4429 100%)",
              }}
            >
              <span
                className="pointer-events-none absolute -top-10 -right-6 h-28 w-28 rounded-full opacity-40 blur-2xl"
                style={{ background: "var(--brand-red)" }}
              />
              <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10 ring-1 ring-white/20">
                <Sparkles className="h-[18px] w-[18px]" style={{ color: "var(--brand-yellow)" }} />
              </div>
              <div className="relative min-w-0 flex-1">
                <p className="truncate text-[15px] font-semibold leading-tight">{config.title}</p>
                <p className="flex items-center gap-1.5 text-[11px] text-white/70">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  Usually replies instantly
                </p>
              </div>
              <button
                onClick={() => setOpen(false)}
                aria-label="Close chat"
                className="relative rounded-full p-1.5 text-white/70 transition hover:bg-white/10 hover:text-white"
              >
                <X className="h-[18px] w-[18px]" />
              </button>
            </div>

            {/* ── Messages ── */}
            <div
              ref={scrollRef}
              className="flex-1 space-y-3 overflow-y-auto px-4 py-4"
              style={{ backgroundColor: "var(--brand-paper)" }}
            >
              <Bubble role="assistant">{config.greeting}</Bubble>

              {messages.map((m, i) => (
                <Bubble key={i} role={m.role}>
                  {m.content}
                  {streaming && i === messages.length - 1 && (
                    <span className="ml-0.5 inline-block h-[1em] w-[2px] translate-y-[2px] animate-pulse bg-current align-middle" />
                  )}
                </Bubble>
              ))}

              {busy && !streaming && <TypingDots />}

              {error && (
                <p role="alert" className="px-1 text-[12px] font-medium text-red-600">
                  {error}
                </p>
              )}

              {messages.length === 0 && config.suggestions.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {config.suggestions.map(s => (
                    <button
                      key={s}
                      onClick={() => send(s)}
                      className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[12px] font-medium text-slate-600 shadow-sm transition hover:border-slate-300 hover:text-slate-900"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* ── Composer ── */}
            <form
              onSubmit={e => {
                e.preventDefault();
                send(input);
              }}
              className="flex items-center gap-2 border-t border-slate-100 bg-white px-3 py-3"
            >
              <input
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                maxLength={1000}
                placeholder="Ask about our courses…"
                aria-label="Your message"
                className="min-w-0 flex-1 rounded-full bg-slate-100/80 px-4 py-2.5 text-[14px] text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
              />
              <button
                type="submit"
                disabled={busy || !input.trim()}
                aria-label="Send message"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white transition disabled:opacity-30"
                style={{ backgroundColor: "var(--brand-navy)" }}
              >
                <ArrowUp className="h-[18px] w-[18px]" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Launcher — sits below the WhatsApp button in the floating stack ── */}
      <motion.button
        onClick={() => setOpen(o => !o)}
        aria-label={open ? "Close chat" : "Chat with our AI assistant"}
        aria-expanded={open}
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.94 }}
        className="fixed bottom-4 right-4 z-50 flex h-12 w-12 items-center justify-center rounded-full text-white
                   shadow-lg transition-shadow hover:shadow-xl md:bottom-5 md:right-5 xl:bottom-6 xl:right-6"
        style={{
          background: "linear-gradient(135deg, var(--brand-navy) 0%, #1d4429 100%)",
        }}
      >
        {/* One-shot halo that draws the eye on load without animating forever. */}
        {!open && (
          <motion.span
            className="absolute inset-0 rounded-full"
            style={{ border: "2px solid var(--brand-red)" }}
            initial={{ opacity: 0.7, scale: 1 }}
            animate={{ opacity: 0, scale: 1.7 }}
            transition={{ duration: 1.8, repeat: 2, repeatDelay: 2.5, delay: 1.2 }}
          />
        )}
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={open ? "close" : "open"}
            initial={{ opacity: 0, rotate: -60, scale: 0.6 }}
            animate={{ opacity: 1, rotate: 0, scale: 1 }}
            exit={{ opacity: 0, rotate: 60, scale: 0.6 }}
            transition={{ duration: 0.16 }}
          >
            {open ? <X className="h-5 w-5" /> : <MessageCircle className="h-5 w-5" />}
          </motion.span>
        </AnimatePresence>
      </motion.button>
    </>
  );
}

function Bubble({ role, children }: { role: "user" | "assistant"; children: React.ReactNode }) {
  const isUser = role === "user";
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={`flex ${isUser ? "justify-end" : "justify-start"}`}
    >
      <div
        className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-[13.5px] leading-relaxed ${
          isUser
            ? "rounded-br-md text-white"
            : "rounded-bl-md border border-slate-100 bg-white text-slate-700 shadow-sm"
        }`}
        style={isUser ? { backgroundColor: "var(--brand-navy)" } : undefined}
      >
        {children}
      </div>
    </motion.div>
  );
}

function TypingDots() {
  return (
    <div className="flex justify-start">
      <div className="flex gap-1 rounded-2xl rounded-bl-md border border-slate-100 bg-white px-3.5 py-3 shadow-sm">
        {[0, 1, 2].map(i => (
          <motion.span
            key={i}
            className="h-1.5 w-1.5 rounded-full bg-slate-300"
            animate={{ y: [0, -3, 0] }}
            transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.12 }}
          />
        ))}
      </div>
    </div>
  );
}
