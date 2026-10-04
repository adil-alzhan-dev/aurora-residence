import type { CSSProperties } from "react";

import { CountUp } from "@/components/motion/count-up";
import { RevealSection } from "@/components/motion/reveal-section";
import type { Dictionary } from "@/content";

type StatsProps = {
  t: Pick<Dictionary, "stats">;
};

export function Stats({ t }: StatsProps) {
  return (
    <RevealSection threshold={0.4} aria-label={t.stats.label} className="bg-background py-12 lg:py-32">
      <ul className="container-page grid grid-cols-2 gap-x-4 gap-y-8 lg:flex">
        {t.stats.items.map((item, index) => (
          <li key={item.label} className="relative flex flex-col gap-2 lg:flex-1 lg:items-center lg:gap-3 lg:text-center">
            {index > 0 && (
              <span
                aria-hidden="true"
                data-reveal="line-y"
                style={{ "--reveal-delay": `${index * 120}ms` } as CSSProperties}
                className="absolute top-0.5 left-0 hidden h-24 w-px bg-border lg:block"
              />
            )}
            <span className="text-stat whitespace-nowrap text-foreground lining-nums">
              {"value" in item ? (
                <CountUp value={item.value} suffix={item.suffix} />
              ) : (
                <span data-reveal="fade">{item.text}</span>
              )}
            </span>
            <span className="text-overline text-muted-foreground">{item.label}</span>
          </li>
        ))}
      </ul>
    </RevealSection>
  );
}
