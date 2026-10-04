import Link from "next/link";

import { Button, ButtonArrow } from "@/components/ui/button";
import type { Dictionary } from "@/content";
import { residencesHref } from "@/content/navigation";

type ViewComingSoonProps = {
  view: "grid" | "list";
  t: Dictionary["residences"]["comingSoon"];
};

/** Placeholder until the floor grid and the list are built. */
export function ViewComingSoon({ view, t }: ViewComingSoonProps) {
  return (
    <div data-reveal="up" className="container-page flex flex-col items-start gap-6 py-24 lg:py-32">
      <h2 className="text-h2 text-foreground">{t[view]}</h2>
      <p className="max-w-[520px] text-body text-muted-foreground">{t.text}</p>
      <Button asChild variant="secondary">
        <Link href={residencesHref}>
          {t.back}
          <ButtonArrow />
        </Link>
      </Button>
    </div>
  );
}
