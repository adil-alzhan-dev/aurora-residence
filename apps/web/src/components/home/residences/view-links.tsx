import Link from "next/link";

import type { Dictionary } from "@/content";
import { residencesViewHref, type ResidenceView } from "@/content/navigation";
import { cn } from "@/lib/utils";

const views: ResidenceView[] = ["facade", "grid", "list"];

type ViewLinksProps = {
  t: Pick<Dictionary["residencePicker"], "views" | "viewsLabel">;
  current: ResidenceView;
};

export function ViewLinks({ t, current }: ViewLinksProps) {
  return (
    <nav aria-label={t.viewsLabel}>
      <ul className="flex items-center gap-1">
        {views.map((view) => {
          const isCurrent = view === current;
          return (
            <li key={view} className={cn(view === "grid" && "hidden lg:block")}>
              <Link
                href={residencesViewHref(view)}
                prefetch={false}
                aria-current={isCurrent ? "true" : undefined}
                className={cn(
                  "flex border-b px-3 py-3.5 text-label transition-colors duration-200 lg:py-2",
                  isCurrent
                    ? "border-primary text-foreground"
                    : "border-transparent text-muted-foreground hover:border-border hover:text-foreground",
                )}
              >
                {t.views[view]}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
