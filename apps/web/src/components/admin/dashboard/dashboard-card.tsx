import Link from "next/link";
import type { ReactNode } from "react";

import { ArrowRightIcon } from "@/components/icons";
import { cn } from "@/lib/utils";

type DashboardCardProps = {
  id: string;
  title: string;
  lead: string;
  action?: { href: string; label: string };
  className?: string;
  headerClassName?: string;
  children: ReactNode;
};

export function DashboardCard({ id, title, lead, action, className, headerClassName, children }: DashboardCardProps) {
  return (
    <section aria-labelledby={id} className={cn("flex flex-col rounded-base border border-border bg-card", className)}>
      <div className={cn("flex items-center justify-between gap-4", headerClassName)}>
        <div className="flex flex-col">
          <h2 id={id} className="text-admin-section text-foreground">
            {title}
          </h2>
          <p className="text-admin-caption text-muted-foreground">{lead}</p>
        </div>
        {action && (
          <Link
            href={action.href}
            className="flex shrink-0 items-center gap-2 text-admin-strong text-foreground transition-colors duration-200 hover:text-primary"
          >
            {action.label}
            <ArrowRightIcon />
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}
