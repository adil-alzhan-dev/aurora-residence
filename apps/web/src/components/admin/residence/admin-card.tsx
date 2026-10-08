import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type AdminCardProps = {
  id: string;
  title: string;
  lead?: string;
  className?: string;
  children: ReactNode;
};

export function AdminCard({ id, title, lead, className, children }: AdminCardProps) {
  return (
    <section aria-labelledby={id} className={cn("flex flex-col rounded-base border border-border bg-card p-4 md:p-6", className)}>
      <div className="flex flex-col">
        <h2 id={id} className="text-admin-section text-foreground">
          {title}
        </h2>
        {lead && <p className="text-admin-caption text-muted-foreground">{lead}</p>}
      </div>
      {children}
    </section>
  );
}
