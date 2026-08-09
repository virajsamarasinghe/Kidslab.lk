import React from "react";

export default function SectionLabel({
  children,
  className = "",
  style,
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div className="inline-flex flex-col items-center mb-3">
      <p
        className={`text-label font-bold tracking-widest uppercase text-sm ${className || (style ? "" : "text-[color:var(--brand-red)]")}`}
        style={style}
      >
        {children}
      </p>
      <span className="pcb-trace w-10 mt-2 rounded-full opacity-60" style={{ height: '3px', backgroundColor: 'var(--brand-red)' }} />
    </div>
  );
}
