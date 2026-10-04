import Link from "next/link";

import { Button } from "@/components/ui/button";
import type { Dictionary } from "@/content";

type NoMatchesProps = {
  resetHref: string;
  t: Pick<Dictionary["residences"], "noMatches" | "resetFilters">;
};

/** Empty result of the filters in the floor grid and the list. */
export function NoMatches({ resetHref, t }: NoMatchesProps) {
  return (
    <div role="status" className="container-page flex flex-col items-start gap-6 pt-8 pb-16 lg:py-24">
      <p className="max-w-[520px] text-body-l text-foreground">{t.noMatches}</p>
      <Button asChild variant="secondary">
        <Link href={resetHref} prefetch={false} scroll={false}>
          {t.resetFilters}
        </Link>
      </Button>
    </div>
  );
}
