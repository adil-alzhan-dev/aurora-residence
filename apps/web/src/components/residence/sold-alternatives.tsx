import Link from "next/link";

import { ArrowRightIcon } from "@/components/icons";
import { Button, ButtonArrow } from "@/components/ui/button";
import type { Dictionary } from "@/content";
import { residenceHref, residencesViewHref } from "@/content/navigation";
import type { Residence } from "@/lib/api/residences";
import { fillTemplate, formatArea, formatUsd } from "@/lib/format";

import { bedroomsShortText } from "../residences/floor/residence-text";

type SoldAlternativesProps = {
  floor: number;
  floorResidences: Residence[];
  similar: Residence[];
  t: Dictionary;
};

/** A sold residence has no request button: it points to what can still be bought, on this floor first. */
export function SoldAlternatives({ floor, floorResidences, similar, t }: SoldAlternativesProps) {
  const text = t.residencePage;
  const onFloor = floorResidences.filter((residence) => residence.status === "available");
  const [title, options] =
    onFloor.length > 0 ? [fillTemplate(text.soldOnFloor, { floor }), onFloor] : [text.soldSimilar, similar];

  return (
    <div className="flex flex-col gap-4 rounded-base border border-border bg-card p-4 lg:p-6">
      <div className="flex flex-col gap-2">
        <p className="text-overline text-foreground">{text.soldTitle}</p>
        <p className="text-caption text-muted-foreground">{options.length > 0 ? text.soldNote : text.soldNone}</p>
      </div>
      {options.length > 0 && (
        <div className="flex flex-col gap-1">
          <p className="text-label text-muted-foreground">{title}</p>
          <ul>
            {options.map((residence) => (
              <li key={residence.number} className="border-b border-border last:border-b-0">
                <Link
                  href={residenceHref(residence.number)}
                  className="group flex min-h-11 items-center justify-between gap-4 py-2 text-body text-foreground transition-colors duration-200 hover:text-primary"
                >
                  <span>
                    {fillTemplate(text.residenceShort, { number: residence.number })}
                    <span className="text-muted-foreground">
                      {"  ·  "}
                      {bedroomsShortText(residence, t.floorPage)}, {formatArea(residence.areaM2)} m²
                    </span>
                  </span>
                  <span className="flex items-center gap-3 whitespace-nowrap">
                    {formatUsd(residence.priceUsd)}
                    <ArrowRightIcon className="transition-transform duration-200 group-hover:translate-x-1" />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
      <Button asChild variant="secondary" className="w-full">
        <Link href={residencesViewHref("list")}>
          {text.soldAll}
          <ButtonArrow />
        </Link>
      </Button>
    </div>
  );
}
