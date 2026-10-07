"use client";

import { usePathname } from "next/navigation";

import { LocaleSwitcher } from "@/components/locale-switcher";
import type { AdminDictionary } from "@/content/en-admin";
import { useEnquiryCard } from "@/lib/admin/enquiry-queries";
import { useMe } from "@/lib/admin/queries";

import { activeNavKey } from "./admin-nav";
import { LiveIndicator } from "./live-indicator";

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function CurrentManager({ t }: { t: AdminDictionary }) {
  const { data: me, isPending, isError } = useMe();
  if (isError) return null;
  if (isPending) {
    return (
      <div aria-hidden="true" className="flex items-center gap-3">
        <span className="size-9 rounded-full border border-border bg-background" />
        <span className="hidden h-10 w-28 bg-background sm:block" />
      </div>
    );
  }
  return (
    <div className="flex items-center gap-3">
      <span
        aria-hidden="true"
        className="flex size-9 items-center justify-center rounded-full border border-border bg-background text-admin-strong text-foreground"
      >
        {initials(me.name)}
      </span>
      <div className="hidden flex-col sm:flex">
        <span className="text-admin-strong text-foreground">{me.name}</span>
        <span className="text-admin-caption text-muted-foreground">{t.roles[me.role]}</span>
      </div>
      <span className="sr-only sm:hidden">{`${me.name}, ${t.roles[me.role]}`}</span>
    </div>
  );
}

/** Reads the card the page already loads, so the name costs no extra request. */
function EnquiryCrumb({ id }: { id: number }) {
  const { data } = useEnquiryCard(id);
  return data ? <span>{`\u00a0/\u00a0${data.name}`}</span> : null;
}

export function AdminTopbar({ t }: { t: AdminDictionary }) {
  const pathname = usePathname();
  const residence = /^\/admin\/residences\/(\d{1,2}\.\d{2})$/.exec(pathname)?.[1];
  const enquiryId = /^\/admin\/enquiries\/([1-9]\d{0,8})$/.exec(pathname)?.[1];
  return (
    <header className="flex h-16 items-center justify-between gap-4 border-b border-border bg-card px-4 lg:h-18 lg:px-8">
      <p className="min-w-0 truncate text-admin-caption text-muted-foreground">
        {t.nav[activeNavKey(pathname)]}
        {residence && <span>{`\u00a0/\u00a0${residence}`}</span>}
        {enquiryId && <EnquiryCrumb id={Number(enquiryId)} />}
      </p>
      <div className="flex shrink-0 items-center gap-3 md:gap-6">
        <LiveIndicator t={t.live} />
        <LocaleSwitcher locale={t.locale.lang} label={t.common.language} languages={t.common.languages} />
        <span aria-hidden="true" className="h-8 w-px bg-border" />
        <CurrentManager t={t} />
      </div>
    </header>
  );
}
