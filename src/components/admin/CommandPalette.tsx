"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import {
  Search, CornerDownLeft, ArrowUp, ArrowDown, UserCog, LogOut, ExternalLink,
  type LucideIcon,
} from "lucide-react";
import { flattenNav } from "./nav-config";

interface Command {
  id: string;
  label: string;
  hint?: string;
  section: string;
  icon: LucideIcon;
  run: () => void;
}

interface PaletteProps {
  open: boolean;
  onClose: () => void;
  onLogout: () => void;
}

/**
 * Body is mounted only while open, so query/cursor reset on every launch
 * without a synchronising effect.
 */
function PaletteBody({ onClose, onLogout }: Omit<PaletteProps, "open">) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [cursor, setCursor] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);

  const commands = useMemo<Command[]>(() => {
    const go = (href: string) => () => {
      onClose();
      router.push(href);
    };
    return [
      ...flattenNav().map(item => ({
        id: `nav:${item.href}`,
        label: item.label,
        hint: item.group,
        section: "Navigate",
        icon: item.icon,
        run: go(item.href),
      })),
      {
        id: "action:profile",
        label: "Edit Profile",
        section: "Actions",
        icon: UserCog,
        run: go("/admin/profile"),
      },
      {
        id: "action:site",
        label: "Open Public Site",
        hint: "new tab",
        section: "Actions",
        icon: ExternalLink,
        run: () => {
          onClose();
          window.open("/", "_blank", "noopener,noreferrer");
        },
      },
      {
        id: "action:logout",
        label: "Sign Out",
        section: "Actions",
        icon: LogOut,
        run: () => {
          onClose();
          onLogout();
        },
      },
    ];
  }, [router, onClose, onLogout]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return commands;
    return commands.filter(c => `${c.label} ${c.hint ?? ""} ${c.section}`.toLowerCase().includes(q));
  }, [commands, query]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setCursor(c => (results.length ? (c + 1) % results.length : 0));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setCursor(c => (results.length ? (c - 1 + results.length) % results.length : 0));
      } else if (e.key === "Enter") {
        e.preventDefault();
        results[cursor]?.run();
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [results, cursor, onClose]);

  // Keep the highlighted row inside the scroll viewport.
  useEffect(() => {
    listRef.current?.querySelector<HTMLElement>('[data-active="true"]')?.scrollIntoView({ block: "nearest" });
  }, [cursor]);

  let lastSection = "";

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center p-4 pt-[12vh]">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]"
      />
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
        initial={{ opacity: 0, y: -12, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -8, scale: 0.985 }}
        transition={{ duration: 0.16, ease: "easeOut" }}
        className="relative w-full max-w-xl rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden"
      >
        <div className="flex items-center gap-3 px-4 border-b border-slate-100">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            autoFocus
            value={query}
            onChange={e => {
              setQuery(e.target.value);
              setCursor(0);
            }}
            placeholder="Search pages and actions…"
            className="flex-1 py-4 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
          />
          <kbd className="text-[10px] font-semibold text-slate-400 border border-slate-200 rounded px-1.5 py-0.5">
            ESC
          </kbd>
        </div>

        <div ref={listRef} className="max-h-80 overflow-y-auto p-2">
          {results.length === 0 ? (
            <p className="px-3 py-8 text-sm text-slate-400 text-center">
              No results for &ldquo;{query}&rdquo;
            </p>
          ) : (
            results.map((cmd, i) => {
              const showSection = cmd.section !== lastSection;
              lastSection = cmd.section;
              const active = i === cursor;
              const Icon = cmd.icon;
              return (
                <div key={cmd.id}>
                  {showSection && (
                    <p className="px-3 pt-3 pb-1.5 text-[10px] font-bold tracking-[0.16em] uppercase text-slate-400">
                      {cmd.section}
                    </p>
                  )}
                  <button
                    data-active={active}
                    onMouseEnter={() => setCursor(i)}
                    onClick={cmd.run}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors ${
                      active ? "bg-slate-100" : "hover:bg-slate-50"
                    }`}
                  >
                    <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-slate-100 text-slate-500 shrink-0">
                      <Icon className="w-3.5 h-3.5" />
                    </span>
                    <span className="text-sm font-medium text-slate-800 truncate">{cmd.label}</span>
                    {cmd.hint && <span className="text-[11px] text-slate-400 truncate">{cmd.hint}</span>}
                    {active && <CornerDownLeft className="w-3.5 h-3.5 text-slate-400 ml-auto shrink-0" />}
                  </button>
                </div>
              );
            })
          )}
        </div>

        <div className="flex items-center gap-4 px-4 py-2.5 border-t border-slate-100 bg-slate-50/70 text-[11px] text-slate-400">
          <span className="flex items-center gap-1">
            <ArrowUp className="w-3 h-3" />
            <ArrowDown className="w-3 h-3" />
            navigate
          </span>
          <span className="flex items-center gap-1">
            <CornerDownLeft className="w-3 h-3" />
            select
          </span>
          <span className="ml-auto font-medium">{results.length} results</span>
        </div>
      </motion.div>
    </div>
  );
}

export default function CommandPalette({ open, onClose, onLogout }: PaletteProps) {
  return (
    <AnimatePresence>
      {open && <PaletteBody onClose={onClose} onLogout={onLogout} />}
    </AnimatePresence>
  );
}
