"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { LogOutIcon } from "@/components/admin/admin-icons";
import { Logo } from "@/components/logo";
import type { AdminDictionary } from "@/content/en-admin";
import { ADMIN_HOME } from "@/lib/admin/paths";
import { cn } from "@/lib/utils";

import { adminNavItems, isNavActive } from "./admin-nav";
import { useLogout } from "./use-logout";

const itemClass =
  "relative flex h-11 shrink-0 items-center gap-3 px-3 text-admin-body whitespace-nowrap transition-colors duration-200 lg:h-10";

export function AdminSidebar({ t }: { t: AdminDictionary }) {
  const pathname = usePathname();
  const { logout, pending } = useLogout();

  const logoutButton = (className?: string) => (
    <button
      type="button"
      onClick={logout}
      disabled={pending}
      aria-busy={pending}
      className={cn(itemClass, "text-muted-foreground hover:text-foreground disabled:opacity-60", className)}
    >
      <LogOutIcon className="shrink-0" />
      {pending ? t.nav.loggingOut : t.nav.logout}
    </button>
  );

  return (
    <aside className="border-border bg-card max-lg:border-b lg:w-60 lg:shrink-0 lg:border-r">
      <div className="flex flex-col lg:sticky lg:top-0 lg:h-svh lg:px-6 lg:py-8">
        <div className="flex items-center justify-between py-2 pr-1 pl-4 lg:p-0">
          <Link href={ADMIN_HOME} aria-label={t.common.home} className="flex">
            <Logo size="small" />
          </Link>
          {logoutButton("lg:hidden")}
        </div>
        <p className="mt-12 mb-5 hidden text-label text-muted-foreground lg:block">{t.common.salesAdmin}</p>
        <nav aria-label={t.nav.label}>
          <ul className="flex gap-1 overflow-x-auto px-4 pb-2 lg:flex-col lg:p-0">
            {adminNavItems.map(({ key, href, Icon }) => {
              const active = isNavActive(href, pathname);
              return (
                <li key={key}>
                  <Link
                    href={href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      itemClass,
                      active
                        ? "bg-background font-semibold text-foreground"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {active && <span aria-hidden="true" className="absolute inset-y-0 left-0 w-0.5 bg-primary" />}
                    <Icon className="shrink-0 max-sm:hidden" />
                    {t.nav[key]}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        <div className="mt-auto hidden flex-col gap-5 lg:flex">
          <div aria-hidden="true" className="h-px bg-border" />
          {logoutButton()}
        </div>
      </div>
    </aside>
  );
}
