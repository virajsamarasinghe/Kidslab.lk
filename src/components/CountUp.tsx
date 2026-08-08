"use client";

import { useEffect, useRef, useState } from "react";
import { animate, useInView } from "motion/react";

interface CountUpProps {
  value: string;
  duration?: number;
  className?: string;
}

export default function CountUp({ value, duration = 1.4, className }: CountUpProps) {
  const match = value.match(/^([\d.]+)(.*)$/);
  const target = match ? parseFloat(match[1]) : 0;
  const suffix = match ? match[2] : "";

  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const [display, setDisplay] = useState("0" + suffix);

  useEffect(() => {
    if (!inView || !match) return;

    const controls = animate(0, target, {
      duration,
      ease: "easeOut",
      onUpdate: (latest) => {
        const rounded = Number.isInteger(target)
          ? Math.round(latest)
          : Math.round(latest * 10) / 10;
        setDisplay(rounded + suffix);
      },
    });

    return () => controls.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView]);

  return (
    <span ref={ref} className={className}>
      {match ? display : value}
    </span>
  );
}
