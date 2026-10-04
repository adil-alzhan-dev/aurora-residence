"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import type { Dictionary } from "@/content";
import { headerVariant, sectionHref, sectionIds } from "@/content/navigation";
import { cn } from "@/lib/utils";

import { CurrencySwitcher, LanguageSwitcher } from "./settings-switchers";
import { MobileMenu } from "./mobile-menu";

const SOLID_AFTER_PX = 80;

type SiteHeaderProps = {
  t: Dictionary;
};

export function SiteHeader({ t }: SiteHeaderProps) {
  const variant = headerVariant(usePathname());
  const [scrolled, setScrolled] = useState(false);
  const solid = scrolled || variant === "light";

  useEffect(() => {
    const update = () => setScrolled(window.scrollY > SOLID_AFTER_PX);
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);

  return (
    <header
      data-theme={solid ? "light" : "dark"}
      className={cn(
        "fixed inset-x-0 top-0 z-40 animate-fade-down border-b transition-[background-color,border-color,color] duration-300",
        solid ? "border-border bg-background" : "bg-transparent",
        !solid && (variant === "overlay" ? "border-transparent" : "border-transparent lg:border-border"),
      )}
    >
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-4 focus:z-50 focus:bg-background focus:px-4 focus:py-3 focus:text-label"
      >
        {t.a11y.skipToContent}
      </a>
      <div className="flex h-16 items-center justify-between pr-1.5 pl-4 xl:h-auto xl:px-10 xl:py-6 wide:px-20">
        <Link href="/" aria-label={t.a11y.home} className="flex">
          <Logo />
        </Link>

        <nav aria-label={t.a11y.mainNavigation} className="hidden xl:block">
          <ul className="flex gap-6 text-caption wide:gap-8">
            {sectionIds.map((id) => (
              <li key={id}>
                <a href={sectionHref(id)} className="transition-colors duration-200 hover:text-primary">
                  {t.nav[id]}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="hidden items-center gap-6 xl:flex">
          <LanguageSwitcher t={t} />
          <CurrencySwitcher t={t} />
          <Button variant="secondary" asChild>
            <a href={sectionHref("contacts")}>{t.actions.enquire}</a>
          </Button>
        </div>

        <MobileMenu t={t} className="xl:hidden" />
      </div>
    </header>
  );
}
