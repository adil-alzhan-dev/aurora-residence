import type { ComponentType, CSSProperties, SVGProps } from "react";

import { CourtyardIcon, KeyIcon, TreeIcon, WindowIcon } from "@/components/icons";
import { RevealSection } from "@/components/motion/reveal-section";
import type { AdvantageItem, Dictionary } from "@/content";

type AdvantagesProps = {
  t: Pick<Dictionary, "advantages">;
};

const icons: Record<AdvantageItem["id"], ComponentType<SVGProps<SVGSVGElement>>> = {
  park: TreeIcon,
  glass: WindowIcon,
  courtyard: CourtyardIcon,
  concierge: KeyIcon,
};

const delay = (ms: number) => ({ "--reveal-delay": `${ms}ms` }) as CSSProperties;

export function Advantages({ t }: AdvantagesProps) {
  const { advantages } = t;
  return (
    <RevealSection aria-labelledby="advantages-title" className="bg-background py-16 lg:py-32">
      <div className="container-page flex flex-col gap-8 lg:gap-16">
        <div data-reveal="up" className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between lg:gap-8">
          <div className="flex max-w-[624px] flex-col gap-4 lg:gap-6">
            <p className="text-overline text-primary">{advantages.overline}</p>
            <h2 id="advantages-title" className="text-h2 text-foreground">
              {advantages.title}
            </h2>
          </div>
          <p className="text-body text-muted-foreground lg:w-[406px] lg:shrink-0 lg:text-[1.125rem] lg:leading-[1.875rem]">
            {advantages.lead}
          </p>
        </div>

        <ul className="flex flex-col lg:grid lg:grid-cols-4 lg:gap-8">
          {advantages.items.map((item, index) => {
            const Icon = icons[item.id];
            const start = index * 120;
            return (
              <li key={item.id} className="flex flex-col">
                <span aria-hidden="true" data-reveal="line-x" style={delay(start)} className="h-px bg-border" />
                <div className="flex gap-4 py-6 lg:flex-col lg:gap-6 lg:pb-0">
                  <span data-reveal="draw" style={delay(start + 200)} className="shrink-0">
                    <Icon className="text-primary" />
                  </span>
                  <div data-reveal="up" style={delay(start + 700)} className="flex flex-col gap-2 lg:gap-3">
                    <h3 className="text-h3 text-foreground">{item.title}</h3>
                    <p className="text-body text-muted-foreground">{item.text}</p>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </RevealSection>
  );
}
