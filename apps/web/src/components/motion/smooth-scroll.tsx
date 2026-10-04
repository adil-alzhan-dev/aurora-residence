"use client";

import Lenis from "lenis";
import { useEffect } from "react";

import { prefersReducedMotion, registerLenis } from "@/lib/motion";

export function SmoothScroll() {
  useEffect(() => {
    if (prefersReducedMotion()) return;
    const lenis = new Lenis({ autoRaf: true, anchors: true });
    registerLenis(lenis);
    return () => {
      registerLenis(null);
      lenis.destroy();
    };
  }, []);

  return null;
}
