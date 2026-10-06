import Link from "next/link";

import { Button, ButtonArrow } from "@/components/ui/button";
import { getDictionary } from "@/content";
import { residencesHref } from "@/content/navigation";

const t = getDictionary("en");

export const notFoundTitle = t.notFound.metaTitle;

export function NotFoundContent() {
  const text = t.notFound;
  return (
    <section data-theme="dark" aria-labelledby="not-found-title" className="bg-background pt-(--header-height)">
      <div className="container-page flex min-h-[70svh] flex-col items-start justify-center gap-6 py-24 lg:py-32">
        <p className="text-overline text-primary">{text.overline}</p>
        <h1 id="not-found-title" className="text-h1 text-foreground">
          {text.title}
        </h1>
        <p className="max-w-[520px] text-body-l text-muted-foreground">{text.text}</p>
        <div className="flex flex-col gap-4 sm:flex-row">
          <Button asChild>
            <Link href={residencesHref}>
              {text.residences}
              <ButtonArrow />
            </Link>
          </Button>
          <Button asChild variant="secondary">
            <Link href="/">{text.home}</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
