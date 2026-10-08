import { cva } from "class-variance-authority";

import type { ResidenceStatus } from "@/lib/api/residences";
import { cn } from "@/lib/utils";

const badgeVariants = cva("inline-flex items-center gap-2 rounded-base px-2 py-1 text-label whitespace-nowrap text-foreground", {
  variants: {
    status: {
      available: "bg-status-free-subtle",
      reserved: "bg-status-reserved-subtle",
      sold: "bg-status-sold-subtle",
    },
  },
});

const dotVariants = cva("size-1.5 shrink-0 rounded-full", {
  variants: {
    status: {
      available: "bg-status-free",
      reserved: "bg-status-reserved",
      sold: "bg-status-sold",
    },
  },
});

type StatusBadgeProps = {
  status: ResidenceStatus;
  label: string;
  className?: string;
};

export function StatusBadge({ status, label, className }: StatusBadgeProps) {
  return (
    <span className={cn(badgeVariants({ status }), className)}>
      <span aria-hidden="true" className={dotVariants({ status })} />
      {label}
    </span>
  );
}
