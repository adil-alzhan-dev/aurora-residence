import { useCurrency } from "@/components/currency/currency-provider";
import type { Dictionary } from "@/content";
import type { Residence } from "@/lib/api/residences";
import { fillTemplate } from "@/lib/format";

import { planX, planY } from "./plan-units";
import { isOpenable, typeAreaText } from "./residence-text";

type PlanHoverCardProps = {
  residence: Residence;
  point: { x: number; y: number };
  t: Dictionary["floorPage"];
};

/** Dark card above the pointer, as on the Floor 7 frame; desktop only, phones open the residence on tap. */
export function PlanHoverCard({ residence, point, t }: PlanHoverCardProps) {
  const { formatPrice } = useCurrency();
  const style = { left: planX(point.x), top: planY(point.y) };

  return (
    <>
      <span
        aria-hidden="true"
        className="pointer-events-none absolute hidden size-2.5 -translate-1/2 rounded-full border-2 border-card bg-primary lg:block"
        style={style}
      />
      <div
        data-theme="dark"
        aria-hidden="true"
        className="pointer-events-none absolute z-10 hidden w-max -translate-x-1/2 -translate-y-[calc(100%+17px)] animate-fade-in flex-col gap-1 rounded-base bg-card px-6 py-4 lg:flex"
        style={style}
      >
        <p className="text-label text-primary">{fillTemplate(t.residence, { number: residence.number })}</p>
        <p className="text-body text-foreground">{typeAreaText(residence, t)}</p>
        {residence.isPenthouse && <p className="text-caption text-muted-foreground">{t.penthouse}</p>}
        <p className="text-body-l text-foreground">{formatPrice(residence.priceUsd)}</p>
        <p className="text-caption text-muted-foreground">{isOpenable(residence) ? t.clickToOpen : t.notForSale}</p>
      </div>
    </>
  );
}
