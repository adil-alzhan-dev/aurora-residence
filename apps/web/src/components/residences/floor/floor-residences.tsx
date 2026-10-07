import Link from "next/link";

import { CurrencyText } from "@/components/currency/currency-text";
import { CurrencySwitcher } from "@/components/layout/settings-switchers";
import { Button, ButtonArrow } from "@/components/ui/button";
import type { Dictionary } from "@/content";
import { residenceHref } from "@/content/navigation";
import type { FloorSummary } from "@/lib/api/floors";
import type { Residence } from "@/lib/api/residences";
import { fillTemplate } from "@/lib/format";
import { plural } from "@/lib/plural";
import { revealDelay } from "@/lib/motion";

import { ResidenceList } from "./residence-list";
import { ResidenceTable } from "./residence-table";
import { isOpenable } from "./residence-text";

type FloorResidencesProps = {
  floor: FloorSummary;
  residences: Residence[];
  active: string | null;
  onActivate: (number: string) => void;
  onLeave: () => void;
  t: Dictionary;
};

export function FloorResidences({ floor, residences, active, onActivate, onLeave, t }: FloorResidencesProps) {
  const text = t.floorPage;
  const highlighted = residences.find((residence) => residence.number === active);
  const target = highlighted && isOpenable(highlighted) ? highlighted : residences.find(isOpenable);

  return (
    <section
      aria-labelledby="floor-residences-title"
      data-reveal="up"
      style={revealDelay(120)}
      className="flex flex-col px-4 lg:px-0 xl:w-[440px] xl:shrink-0"
    >
      <div className="flex items-center justify-between gap-4 pb-2 lg:pb-6">
        <div className="flex flex-col gap-1">
          <p className="hidden text-overline text-muted-foreground lg:block">{text.onThisFloor}</p>
          <h2 id="floor-residences-title" className="text-h3 text-foreground">
            <span className="lg:hidden">{fillTemplate(t.residences.residencesOnFloor, { floor: floor.floor })}</span>
            <span className="hidden lg:inline">{fillTemplate(plural(residences.length, text.residencesCount, t.locale.intl), { count: residences.length })}</span>
          </h2>
        </div>
        <p className="text-caption text-muted-foreground lg:hidden">
          {fillTemplate(text.availableOf, { available: floor.available, total: floor.total })}
        </p>
        <CurrencySwitcher t={t} className="hidden lg:flex" />
      </div>

      <div className="hidden lg:block">
        <ResidenceTable residences={residences} active={active} onActivate={onActivate} onLeave={onLeave} t={t} />
      </div>
      <div className="lg:hidden">
        <ResidenceList residences={residences} t={t} />
      </div>

      <p className="pt-4 text-caption text-muted-foreground lg:pt-6">
        <CurrencyText template={text.note} />
      </p>
      {target && (
        <Button asChild className="mt-6 hidden w-full lg:inline-flex">
          <Link href={residenceHref(target.number)} prefetch={false}>
            {fillTemplate(text.openResidence, { number: target.number })}
            <ButtonArrow />
          </Link>
        </Button>
      )}
    </section>
  );
}
