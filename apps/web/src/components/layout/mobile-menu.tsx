"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { useRef, useState, type MouseEvent } from "react";

import { ArrowRightIcon, CloseIcon, MenuIcon } from "@/components/icons";
import { Logo } from "@/components/logo";
import { Button, ButtonArrow } from "@/components/ui/button";
import type { Dictionary } from "@/content";
import { contactLinks, sectionHref, sectionIds } from "@/content/navigation";
import { scrollToSection } from "@/lib/motion";
import { cn } from "@/lib/utils";

import { CurrencySwitcher, LanguageSwitcher } from "./settings-switchers";

type MobileMenuProps = {
  t: Dictionary;
  className?: string;
};

const iconButton =
  "flex size-11 items-center justify-center text-foreground transition-colors duration-200 hover:text-primary";

export function MobileMenu({ t, className }: MobileMenuProps) {
  const [open, setOpen] = useState(false);
  const pendingSection = useRef<string | null>(null);

  const handleNavigate = (event: MouseEvent<HTMLAnchorElement>) => {
    const id = event.currentTarget.hash.slice(1);
    // On other pages the section is not here, so the browser follows the link to the home page.
    if (!document.getElementById(id)) return;
    event.preventDefault();
    pendingSection.current = id;
    setOpen(false);
  };

  const handleCloseAutoFocus = (event: Event) => {
    const id = pendingSection.current;
    if (!id) return;
    event.preventDefault();
    pendingSection.current = null;
    scrollToSection(id);
  };

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger className={cn(iconButton, className)} aria-label={t.a11y.openMenu}>
        <MenuIcon />
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Content
          data-theme="dark"
          data-lenis-prevent
          onCloseAutoFocus={handleCloseAutoFocus}
          aria-describedby={undefined}
          className="fixed inset-0 z-50 flex flex-col overflow-y-auto bg-background text-foreground data-[state=closed]:animate-fade-out data-[state=open]:animate-fade-in"
        >
          <Dialog.Title className="sr-only">{t.a11y.menu}</Dialog.Title>
          <div className="flex h-16 shrink-0 items-center justify-between pr-1.5 pl-4">
            <Logo />
            <Dialog.Close className={iconButton} aria-label={t.a11y.closeMenu}>
              <CloseIcon />
            </Dialog.Close>
          </div>

          <nav aria-label={t.a11y.mainNavigation} className="flex-1 px-4 pt-6">
            <ul>
              {sectionIds.map((id) => (
                <li key={id}>
                  <a
                    href={sectionHref(id)}
                    onClick={handleNavigate}
                    className="flex min-h-15 items-center justify-between border-b border-border text-h2 transition-colors duration-200 hover:text-primary focus-visible:text-primary"
                  >
                    {t.nav[id]}
                    <ArrowRightIcon />
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div className="flex flex-col gap-4 px-4 py-6">
            <div className="flex items-center justify-between">
              <span className="text-overline text-muted-foreground">{t.settings.language}</span>
              <LanguageSwitcher t={t} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-overline text-muted-foreground">{t.settings.currency}</span>
              <CurrencySwitcher t={t} />
            </div>
            <div className="flex flex-col gap-1">
              <a href={contactLinks.phone} className="self-start py-2 text-body-l -my-2">
                {t.contacts.phone}
              </a>
              <span className="text-caption text-muted-foreground">{t.contacts.salesOfficeHours}</span>
            </div>
          </div>

          <div className="px-4 pb-8">
            <Button asChild className="w-full">
              <a href={sectionHref("contacts")} onClick={handleNavigate}>
                {t.actions.enquire}
                <ButtonArrow />
              </a>
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
