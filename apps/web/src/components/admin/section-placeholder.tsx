import Link from "next/link";

import { ArrowRightIcon } from "@/components/icons";
import { getAdminDictionary } from "@/content/en-admin";
import { ADMIN_HOME } from "@/lib/admin/paths";

const t = getAdminDictionary();

export function SectionPlaceholder({ title }: { title: string }) {
  return (
    <>
      <h1 className="text-admin-title text-foreground">{title}</h1>
      <section className="flex flex-col items-start gap-3 rounded-base border border-border bg-card p-6">
        <h2 className="text-admin-section text-foreground">{t.placeholder.title}</h2>
        <p className="text-admin-body text-muted-foreground">{t.placeholder.text}</p>
        <Link
          href={ADMIN_HOME}
          className="flex items-center gap-2 text-admin-strong text-foreground transition-colors hover:text-primary"
        >
          {t.placeholder.back}
          <ArrowRightIcon />
        </Link>
      </section>
    </>
  );
}
