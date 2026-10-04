"use client";

import { useEffect, useRef, useState, type ComponentProps } from "react";

type RevealSectionProps = ComponentProps<"section"> & {
  threshold?: number;
};

export function RevealSection({ threshold = 0.2, children, ...props }: RevealSectionProps) {
  const ref = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [threshold]);

  return (
    <section ref={ref} data-visible={visible || undefined} {...props}>
      {children}
    </section>
  );
}
