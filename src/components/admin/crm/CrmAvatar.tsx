const PALETTE = ["var(--brand-navy)", "var(--brand-red)", "var(--brand-blue)", "#16a34a", "#9333ea", "#c2410c"];

function hashString(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function initialsFor(name: string, email: string) {
  const base = (name || email || "?").trim();
  const parts = base.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return base.slice(0, 2).toUpperCase();
}

/** Colored initials avatar for a CRM contact — color is a stable hash of the email, not the stage, so it stays put as a contact moves through the pipeline. */
export function CrmAvatar({ name, email, size = "sm" }: { name: string; email: string; size?: "sm" | "md" }) {
  const color = PALETTE[hashString(email || name) % PALETTE.length];
  const dims = size === "md" ? "w-10 h-10 text-sm" : "w-8 h-8 text-[11px]";
  return (
    <span
      className={`inline-flex items-center justify-center rounded-full font-semibold text-white shrink-0 ${dims}`}
      style={{ backgroundColor: color }}
    >
      {initialsFor(name, email)}
    </span>
  );
}
