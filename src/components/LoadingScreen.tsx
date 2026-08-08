"use client";

import { motion, AnimatePresence } from "motion/react";
import { useEffect, useState } from "react";
import { Cpu, Zap, Bot } from "lucide-react";
import Image from "next/image";

export default function LoadingScreen() {
  const [visible, setVisible] = useState(true);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          clearInterval(interval);
          setTimeout(() => setVisible(false), 300);
          return 100;
        }
        return p + 4;
      });
    }, 50);
    return () => clearInterval(interval);
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="loader"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.04 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
          className="fixed inset-0 z-[9999] bg-white flex flex-col items-center justify-center gap-8"
        >
          {/* Animated logo */}
          <div className="relative flex items-center justify-center w-24 h-24">
            {/* Outer ring */}
            <motion.div
              className="absolute inset-0 rounded-full border-4 border-blue-100"
            />
            <motion.div
              className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-600"
              animate={{ rotate: 360 }}
              transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
            />
            <motion.div
              className="absolute inset-2 rounded-full border-4 border-transparent"
              style={{ borderTopColor: "var(--brand-red)" }}
              animate={{ rotate: -360 }}
              transition={{ duration: 1.8, repeat: Infinity, ease: "linear" }}
            />
            {/* Center logo */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="w-12 h-12 rounded-xl overflow-hidden shadow-lg"
            >
              <Image
                src="/logo.png"
                alt="kidslab.lk"
                width={48}
                height={48}
                className="w-full h-full object-contain"
                priority
              />
            </motion.div>
          </div>

          {/* Brand name */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-center"
          >
            <p className="text-2xl font-bold text-slate-900 tracking-tight">
              <span style={{ color: "var(--brand-navy)" }}>kid</span><span style={{ color: "var(--brand-red)" }}>s</span><span style={{ color: "var(--brand-navy)" }}>lab.lk</span>
            </p>
            <p className="text-sm text-slate-400 mt-1">AI & Robotics Academy</p>
          </motion.div>

          {/* Floating mini icons */}
          <div className="flex gap-6">
            {[Cpu, Zap, Bot].map((Icon, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: [0.3, 1, 0.3], y: [0, -6, 0] }}
                transition={{
                  delay: i * 0.2,
                  duration: 1.4,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="w-9 h-9 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center"
              >
                <Icon className="w-4 h-4 text-slate-400" />
              </motion.div>
            ))}
          </div>

          {/* Progress bar */}
          <div className="w-48 h-1 bg-slate-100 rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{
                width: `${progress}%`,
                background:
                  "linear-gradient(to right, var(--brand-blue), var(--brand-red))",
              }}
              transition={{ ease: "linear" }}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
