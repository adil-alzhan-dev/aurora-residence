import type { ReactNode } from "react";

import { Logo } from "@/components/logo";
import type { Dictionary } from "@/content";
import { contactLinks, residencesHref, residencesViewHref, sectionHref } from "@/content/navigation";

import { LanguageSwitcher } from "./settings-switchers";

type SiteFooterProps = {
  t: Dictionary;
};

const linkClass =
  "-my-2.5 flex min-h-11 items-center transition-colors duration-200 hover:text-primary lg:my-0 lg:min-h-0";

function FooterColumn({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-overline text-primary">{title}</h2>
      <ul className="flex flex-col gap-5 text-body lg:gap-4">{children}</ul>
    </div>
  );
}

function FooterLink({ href, children, className }: { href: string; children: ReactNode; className?: string }) {
  return (
    <li className={className}>
      <a href={href} className={linkClass}>
        {children}
      </a>
    </li>
  );
}

export function SiteFooter({ t }: SiteFooterProps) {
  const { footer, nav, contacts } = t;
  return (
    <footer data-theme="dark" className="bg-background text-foreground">
      <div className="container-page flex flex-col gap-12 pt-16 pb-8 lg:gap-16 lg:pt-24">
        <div className="flex flex-col gap-12 lg:flex-row lg:justify-between lg:gap-24">
          <div className="flex flex-col items-start gap-6">
            <Logo size="responsive" />
            <p className="max-w-80 text-body text-muted-foreground max-lg:max-w-none">{footer.tagline}</p>
          </div>

          <nav aria-label={t.a11y.footerNavigation} className="flex flex-col gap-8 whitespace-nowrap lg:flex-row lg:gap-24">
            <FooterColumn title={footer.residencesTitle}>
              <FooterLink href={residencesHref}>{footer.chooseOnFacade}</FooterLink>
              <FooterLink href={residencesViewHref("grid")} className="max-lg:hidden">
                {footer.floorGrid}
              </FooterLink>
              <FooterLink href={residencesViewHref("list")}>{footer.allResidences}</FooterLink>
            </FooterColumn>
            <FooterColumn title={footer.projectTitle}>
              <FooterLink href={sectionHref("about")}>{nav.about}</FooterLink>
              <FooterLink href={sectionHref("gallery")}>{nav.gallery}</FooterLink>
              <FooterLink href={sectionHref("location")}>{nav.location}</FooterLink>
              <FooterLink href={sectionHref("progress")}>{nav.progress}</FooterLink>
            </FooterColumn>
            <FooterColumn title={footer.salesOfficeTitle}>
              <FooterLink href={contactLinks.phone}>{contacts.phone}</FooterLink>
              <FooterLink href={contactLinks.email}>{contacts.email}</FooterLink>
              <li className="flex min-h-11 items-center -my-2.5 lg:my-0 lg:min-h-0">{contacts.hours}</li>
            </FooterColumn>
          </nav>
        </div>

        <div className="h-px bg-border" />

        <div className="flex flex-col items-start gap-4 lg:flex-row lg:items-center lg:justify-between">
          <p className="text-caption text-muted-foreground">{footer.copyright}</p>
          <div className="flex items-center gap-6 text-caption text-muted-foreground">
            <span>{footer.privacy}</span>
            <LanguageSwitcher t={{ locale: t.locale, a11y: t.a11y, settings: t.settings }} />
          </div>
        </div>
      </div>
    </footer>
  );
}
