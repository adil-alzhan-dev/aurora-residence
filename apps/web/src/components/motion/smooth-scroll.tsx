"use client";

import type Lenis from "lenis";
import { useEffect } from "react";

import { prefersReducedMotion, registerLenis } from "@/lib/motion";

/** Lenis is loaded after hydration: it only changes how the page scrolls, not what the first screen shows. */
export function SmoothScroll() {
  useEffect(() => {
    if (prefersReducedMotion()) return;
    let lenis: Lenis | null = null;
    let unmounted = false;
    void import("lenis").then(({ default: LenisScroll }) => {
      if (unmounted) return;
      lenis = new LenisScroll({ autoRaf: true, anchors: true });
      registerLenis(lenis);
    });
    return () => {
      unmounted = true;
      registerLenis(null);
      lenis?.destroy();
    };
  }, []);

  return null;
}
