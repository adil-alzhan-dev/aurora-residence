"use client";

import { useEffect, useRef, useState } from "react";

import { prefersReducedMotion } from "@/lib/motion";

type CountUpProps = {
  value: number;
  suffix?: string;
  duration?: number;
  className?: string;
};

const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

export function CountUp({ value, suffix = "", duration = 1200, className }: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const [current, setCurrent] = useState(value);

  useEffect(() => {
    const node = ref.current;
    if (!node || prefersReducedMotion()) return;
    let frame = 0;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        observer.disconnect();
        const start = performance.now();
        const tick = (now: number) => {
          const progress = Math.min((now - start) / duration, 1);
          setCurrent(Math.round(easeOut(progress) * value));
          if (progress < 1) frame = requestAnimationFrame(tick);
        };
        frame = requestAnimationFrame(tick);
      },
      { threshold: 0.4 },
    );
    if (node.getBoundingClientRect().top > window.innerHeight) {
      frame = requestAnimationFrame(() => setCurrent(0));
      observer.observe(node);
    }
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [value, duration]);

  return (
    <span ref={ref} className={className}>
      <span aria-hidden="true">
        {current}
        {suffix}
      </span>
      <span className="sr-only">
        {value}
        {suffix}
      </span>
    </span>
  );
}
