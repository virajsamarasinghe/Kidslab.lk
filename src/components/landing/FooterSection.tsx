"use client";

import { useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { CheckCircle, ArrowRight, GraduationCap } from "lucide-react";
import FacebookIcon from "@/components/FacebookIcon";
import { useRegisterModal } from "@/lib/register-modal-context";

function FooterSubscribe({
  heading,
  placeholder,
  cta,
  success,
  error,
}: {
  heading: string;
  placeholder: string;
  cta: string;
  success: string;
  error: string;
}) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    const res = await fetch("/api/subscribers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    setStatus(res.ok ? "success" : "error");
    if (res.ok) setEmail("");
  }

  return (
    <div className="w-full max-w-[320px]">
      <p className="text-label text-slate-400 mb-4 font-semibold tracking-wider uppercase text-xs">{heading}</p>
      {status === "success" ? (
        <p className="flex items-center gap-2 text-emerald-400 text-sm bg-emerald-400/10 px-4 py-2.5 rounded-lg border border-emerald-400/20">
          <CheckCircle className="w-4 h-4 shrink-0" />
          {success}
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="flex gap-2 relative">
          <input
            type="email"
            required
            placeholder={placeholder}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="min-w-0 flex-1 rounded-full bg-white/5 border border-white/10 px-5 py-2.5 text-sm text-white placeholder:text-slate-500 outline-none focus:border-indigo-400/50 focus:bg-white/10 transition-all shadow-inner"
          />
          <button
            type="submit"
            disabled={status === "loading"}
            className="absolute right-1 top-1 bottom-1 shrink-0 rounded-full w-8 flex items-center justify-center text-white disabled:opacity-60 transition-all hover:bg-indigo-600 hover:scale-105 shadow-md"
            style={{ backgroundColor: "var(--brand-blue)" }}
            aria-label={cta}
          >
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      )}
      {status === "error" && (
        <p className="text-rose-400 text-xs mt-2 flex items-center gap-1">
          <span className="w-1 h-1 rounded-full bg-rose-400" />
          {error}
        </p>
      )}
    </div>
  );
}

export default function FooterSection() {
  const t = useTranslations();
  const { openRegisterModal } = useRegisterModal();

  return (
    <footer
      className="text-white pt-16 sm:pt-20 pb-8 sm:pb-10 px-[clamp(1.25rem,2vw,2.5rem)] relative overflow-hidden"
      style={{ backgroundColor: "var(--brand-navy)" }}
    >
      {/* Background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-indigo-900/30 blur-[100px] rounded-full pointer-events-none" />

      <div className="w-full max-w-screen-2xl mx-auto relative z-10">
        <div className="flex flex-col md:flex-row items-start justify-between gap-10 md:gap-16 pb-10 md:pb-14 border-b border-white/10">
          <div className="w-full max-w-none md:max-w-[340px]">
            <div className="flex items-center gap-3 mb-5">
              <div className="bg-white rounded-xl p-2 flex-shrink-0 shadow-lg shadow-white/5">
                <Image
                  src="/logo.png"
                  alt="kidslab.lk logo"
                  width={64}
                  height={64}
                  className="rounded-lg object-contain"
                />
              </div>
              <span className="font-bold text-2xl tracking-tight">
                kid<span style={{ color: "var(--brand-red)" }}>s</span>lab.lk
              </span>
            </div>
            <p
              className="text-slate-400 leading-relaxed text-sm mb-6"
            >
              {t("footer.blurb")}
            </p>

            <FooterSubscribe
              heading={t("footer.subscribeHeading")}
              placeholder={t("footer.subscribePlaceholder")}
              cta={t("footer.subscribeCta")}
              success={t("footer.subscribeSuccess")}
              error={t("footer.subscribeError")}
            />

            <a
              href="https://www.facebook.com/profile.php?id=61585638656242"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 mt-8 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-slate-300 hover:bg-[#1877F2]/10 hover:text-[#1877F2] hover:border-[#1877F2]/30 transition-all text-sm font-medium"
            >
              <FacebookIcon className="w-4 h-4" />
              {t("footer.followFacebook")}
            </a>
          </div>

          <div className="w-full md:w-auto grid grid-cols-2 gap-x-10 sm:gap-x-20 gap-y-10">
            <div>
              <p className="text-label text-slate-300 mb-5 font-semibold tracking-widest uppercase text-xs">
                {t("footer.programsHeading")}
              </p>
              <div className="space-y-3.5">
                {(t.raw("footer.programLinks") as string[]).map((l) => (
                  <a
                    key={l}
                    href="#programs"
                    className="block text-slate-400 hover:text-indigo-300 hover:translate-x-1 transition-all text-sm font-medium"
                  >
                    {l}
                  </a>
                ))}
              </div>
            </div>
            <div>
              <p className="text-label text-slate-300 mb-5 font-semibold tracking-widest uppercase text-xs">
                {t("footer.academyHeading")}
              </p>
              <div className="space-y-3.5">
                {(t.raw("footer.academyLinks") as string[]).map((l, i) => {
                  const hrefs = ["#about", "#team", undefined, "#contact"];
                  const href = hrefs[i];
                  return (
                    <a
                      key={l}
                      href={href ?? "#"}
                      onClick={href ? undefined : openRegisterModal}
                      className="block text-slate-400 hover:text-indigo-300 hover:translate-x-1 transition-all text-sm font-medium"
                    >
                      {l}
                    </a>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <div
          className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-500 text-sm"
        >
          <p>
            © {new Date().getFullYear()} kid<span style={{ color: "var(--brand-red)" }}>s</span>lab.lk —{" "}
            {t("footer.copyright")}
          </p>
          <p className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-full border border-white/5 text-xs font-medium text-slate-400">
            <GraduationCap
              className="w-4 h-4"
              style={{ color: "var(--brand-red)" }}
            />
            {t("footer.founded")}
          </p>
        </div>

        <p
          className="text-center text-slate-600 mt-6 text-xs"
        >
          {t("footer.company")}
        </p>
      </div>
    </footer>
  );
}
