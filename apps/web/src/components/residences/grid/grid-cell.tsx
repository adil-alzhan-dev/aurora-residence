import Link from "next/link";

import type { Dictionary } from "@/content";
import { residenceHref } from "@/content/navigation";
import type { Residence, ResidenceStatus } from "@/lib/api/residences";
import { fillTemplate, formatUsd } from "@/lib/format";
import { cn } from "@/lib/utils";

import { areaText, isOpenable, typeAreaText } from "../floor/residence-text";

type GridCellProps = {
  residence: Residence;
  matches: boolean;
  t: Pick<Dictionary, "grid" | "floorPage" | "filters" | "status">;
};

const tone: Record<ResidenceStatus, { idle: string; hover: string }> = {
  available: {
    idle: "bg-status-free-subtle",
    hover: "hover:bg-status-free focus-visible:bg-status-free",
  },
  reserved: {
    idle: "bg-status-reserved-subtle",
    hover: "hover:bg-status-reserved focus-visible:bg-status-reserved",
  },
  sold: { idle: "bg-status-sold-subtle", hover: "" },
};

const onSolid = "group-hover/cell:text-primary-foreground group-focus-visible/cell:text-primary-foreground";

/** Chess Cell from Figma: tint by status, solid fill and a dark card on hover; sold cells are not links. */
export function GridCell({ residence, matches, t }: GridCellProps) {
  const openable = isOpenable(residence);
  const info = fillTemplate(t.grid.info, {
    bedrooms: t.filters.bedroomOptions[residence.bedrooms] ?? "",
    area: areaText(residence, t.floorPage),
  });
  const className = cn(
    "group/cell relative flex h-full min-h-[98px] flex-col justify-center gap-1 rounded-base p-3 transition-colors duration-200",
    tone[residence.status].idle,
    openable && tone[residence.status].hover,
    openable && "outline-offset-2",
    !matches && "opacity-45",
  );

  const solidText = openable && onSolid;
  const content = (
    <>
      <span className={cn("text-body text-foreground", solidText)}>{residence.number}</span>
      <span className={cn("text-caption text-muted-foreground", solidText)}>
        {residence.isPenthouse && <span className="block">{t.floorPage.penthouse}</span>}
        {info}
      </span>
      <span className={cn("text-caption text-foreground", solidText)}>{formatUsd(residence.priceUsd)}</span>
    </>
  );

  if (!openable) return <div className={className}>{content}</div>;

  return (
    <Link
      href={residenceHref(residence.number)}
      prefetch={false}
      aria-label={fillTemplate(t.grid.cellLabel, {
        number: residence.number,
        type: typeAreaText(residence, t.floorPage),
        price: formatUsd(residence.priceUsd),
        status: t.status[residence.status],
      })}
      className={className}
    >
      {content}
      <span
        data-theme="dark"
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute -top-2.5 z-10 hidden w-max flex-col gap-1 rounded-base bg-card px-6 py-4 group-hover/cell:flex group-focus-visible/cell:flex",
          residence.position === 1 ? "left-[calc(100%+8px)]" : "right-[calc(100%+8px)]",
        )}
      >
        <span className="text-label text-primary">{fillTemplate(t.floorPage.residence, { number: residence.number })}</span>
        <span className="text-body text-foreground">{typeAreaText(residence, t.floorPage)}</span>
        {residence.isPenthouse && <span className="text-caption text-muted-foreground">{t.floorPage.penthouse}</span>}
        <span className="text-body-l text-foreground">{formatUsd(residence.priceUsd)}</span>
        <span className="text-caption text-muted-foreground">{t.floorPage.clickToOpen}</span>
      </span>
    </Link>
  );
}
