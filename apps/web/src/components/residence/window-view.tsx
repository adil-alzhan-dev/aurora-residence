import Image from "next/image";

import { RevealSection } from "@/components/motion/reveal-section";
import type { Dictionary } from "@/content";
import type { Residence } from "@/lib/api/residences";
import { fillTemplate } from "@/lib/format";

const WINDOW_VIEW_SRC = "/images/window-view.jpg";

/** Floor-to-floor height used for "24 m above the ground" on floor 7. */
const STOREY_M = 3.4;

const RENDERED_FROM = "7.03";

export const facesPark = (residence: Residence) => residence.view.toLowerCase().includes("park");

type WindowViewProps = {
  residence: Residence;
  t: Dictionary["residencePage"]["windowView"];
};

/** One render, taken from 7.03, shown on every residence that looks onto the park. */
export function WindowView({ residence, t }: WindowViewProps) {
  const height = Math.round(residence.floor * STOREY_M);
  const values = { number: residence.number, height };
  const text = residence.number === RENDERED_FROM ? fillTemplate(t.textExact, values) : fillTemplate(t.textOther, values);

  return (
    <RevealSection aria-labelledby="window-view-title" className="container-page flex flex-col gap-8 py-12 lg:gap-12 lg:pt-0 lg:pb-32">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between lg:gap-16">
        <div className="flex flex-col gap-4">
          <p className="text-overline text-primary">{t.overline}</p>
          <h2 id="window-view-title" className="text-h2 text-foreground">
            {fillTemplate(t.title, { floors: t.floorWords[residence.floor - 1] ?? "" })}
          </h2>
        </div>
        <p className="text-body text-muted-foreground lg:max-w-[420px]">{text}</p>
      </div>
      <div data-reveal="up" className="relative h-60 overflow-hidden md:h-[420px] lg:h-[680px]">
        <Image src={WINDOW_VIEW_SRC} alt={t.alt} fill sizes="(width >= 1440px) 1280px, 100vw" className="object-cover" />
      </div>
    </RevealSection>
  );
}
