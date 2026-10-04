import type Lenis from "lenis";

let lenis: Lenis | null = null;

export function registerLenis(instance: Lenis | null) {
  lenis = instance;
}

export function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function scrollToSection(id: string) {
  const target = document.getElementById(id);
  if (!target) return;
  if (lenis) {
    lenis.scrollTo(target);
  } else {
    target.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth" });
  }
  window.history.replaceState(null, "", `#${id}`);
}
