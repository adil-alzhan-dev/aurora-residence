"use client";

import { usePathname } from "next/navigation";

import type { AdminDictionary } from "@/content/en-admin";
import { useMe } from "@/lib/admin/queries";

import { activeNavKey } from "./admin-nav";

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

export function AdminTopbar({ t }: { t: AdminDictionary }) {
  const pathname = usePathname();
  return (
    <header className="flex h-16 items-center justify-between gap-4 border-b border-border bg-card px-4 lg:h-18 lg:px-8">
      <p className="text-admin-caption text-muted-foreground">{t.nav[activeNavKey(pathname)]}</p>
      <CurrentManager t={t} />
    </header>
  );
}
