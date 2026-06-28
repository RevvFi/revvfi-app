"use client";

import { useEffect, useRef } from "react";
import { useInView } from "framer-motion";
import { cn } from "@/lib/utils";

interface CountUpProps {
  end: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  separator?: string;
  decimals?: number;
  className?: string;
}

export function CountUp({
  end,
  duration = 1.5,
  prefix = "",
  suffix = "",
  separator = ",",
  decimals = 0,
  className,
}: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (!isInView || !ref.current) return;

    let startTime: number | null = null;
    const totalDuration = duration * 1000;

    function formatValue(val: number): string {
      const fixed = val.toFixed(decimals);
      const [int, dec] = fixed.split(".");
      const intFormatted = int.replace(/\B(?=(\d{3})+(?!\d))/g, separator);
      return prefix + (dec !== undefined ? `${intFormatted}.${dec}` : intFormatted) + suffix;
    }

    function step(timestamp: number) {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / totalDuration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      if (ref.current) ref.current.textContent = formatValue(eased * end);
      if (progress < 1) requestAnimationFrame(step);
    }

    requestAnimationFrame(step);
  }, [isInView, end, duration, prefix, suffix, separator, decimals]);

  return (
    <span ref={ref} className={cn("tabular-nums", className)}>
      {prefix}0{suffix}
    </span>
  );
}
