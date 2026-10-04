import Link from "next/link";

import { ArrowRightIcon } from "@/components/icons";
import type { Dictionary } from "@/content";
import { floorHref, residencesHref } from "@/content/navigation";
import { fillTemplate } from "@/lib/format";

type ResidenceBreadcrumbsProps = {
  number: string;
  floor: number;
  t: Dictionary["residencePage"];
};

export function ResidenceBreadcrumbs({ number, floor, t }: ResidenceBreadcrumbsProps) {
  const crumbs = [
    { label: t.crumbResidences, href: residencesHref },
    { label: fillTemplate(t.crumbFloor, { floor }), href: floorHref(floor) },
  ];

  return (
    <div className="container-page flex items-center justify-between pt-2 lg:pt-12 lg:pb-8">
      <Link
        href={floorHref(floor)}
        className="group flex min-h-11 items-center gap-2 text-overline text-foreground transition-colors duration-200 hover:text-primary lg:min-h-12 lg:text-label"
      >
        <ArrowRightIcon className="rotate-180 transition-transform duration-200 group-hover:-translate-x-1" />
        <span className="lg:hidden">{fillTemplate(t.backShort, { floor })}</span>
        <span className="hidden lg:inline">{fillTemplate(t.backToFloor, { floor })}</span>
      </Link>
      <nav aria-label={t.breadcrumbs} className="hidden lg:block">
        <ol className="flex items-center gap-2 text-caption text-muted-foreground">
          {crumbs.map((crumb) => (
            <li key={crumb.href} className="flex items-center gap-2">
              <Link href={crumb.href} className="transition-colors duration-200 hover:text-foreground">
                {crumb.label}
              </Link>
              <span aria-hidden="true">/</span>
            </li>
          ))}
          <li aria-current="page">{fillTemplate(t.crumbResidence, { number })}</li>
        </ol>
      </nav>
    </div>
  );
}
