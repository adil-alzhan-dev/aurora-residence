import Image from "next/image";
import type { CSSProperties } from "react";

import { RevealSection } from "@/components/motion/reveal-section";
import { Button, ButtonArrow } from "@/components/ui/button";
import type { Dictionary } from "@/content";
import { sectionHref } from "@/content/navigation";

type AboutProps = {
  t: Pick<Dictionary, "about">;
};

const delay = (ms: number) => ({ "--reveal-delay": `${ms}ms` }) as CSSProperties;

export function About({ t }: AboutProps) {
  const { about } = t;
  return (
    <RevealSection
      id="about"
      aria-labelledby="about-title"
      className="flex flex-col gap-8 overflow-hidden bg-background px-(--page-gutter) py-16 lg:flex-row lg:items-center lg:gap-[clamp(48px,9.8vw,141px)] lg:pt-16 lg:pr-0 lg:pb-32 lg:pl-[max(var(--page-gutter),calc((100%-var(--container-page))/2))]"
    >
      <div className="contents lg:flex lg:w-[min(515px,42%)] lg:shrink-0 lg:flex-col lg:gap-6">
        <div data-reveal="up" className="flex flex-col gap-4 lg:gap-6">
          <p className="text-overline text-primary">{about.overline}</p>
          <h2 id="about-title" className="text-h2 text-foreground">
            {about.title}
          </h2>
        </div>
        <div data-reveal="up" style={delay(120)} className="flex flex-col gap-4 lg:gap-6">
          <p className="text-body-l text-foreground">{about.lead}</p>
          <p className="text-body text-muted-foreground">{about.text}</p>
        </div>
        <dl
          data-reveal="up"
          style={delay(240)}
          className="order-1 flex justify-between gap-4 lg:order-none lg:justify-start lg:gap-12 lg:pt-4"
        >
          {about.facts.map((fact) => (
            <div key={fact.label} className="flex flex-col-reverse gap-1">
              <dt className="text-caption text-muted-foreground">{fact.label}</dt>
              <dd className="text-fact whitespace-nowrap text-foreground">{fact.value}</dd>
            </div>
          ))}
        </dl>
        <div data-reveal="up" style={delay(320)} className="order-1 lg:order-none">
          <Button variant="ghost" asChild>
            <a href={sectionHref("residences")}>
              {about.cta}
              <ButtonArrow />
            </a>
          </Button>
        </div>
      </div>

      <figure className="flex flex-col gap-3 lg:min-w-0 lg:flex-1 lg:gap-4">
        <div data-reveal="wipe" className="relative h-[268px] overflow-hidden lg:h-[640px]">
          <Image
            src="/images/living.jpg"
            alt={about.imageAlt}
            fill
            sizes="(min-width: 1024px) 50vw, calc(100vw - 32px)"
            className="object-cover"
          />
        </div>
        <figcaption className="flex items-center gap-4 text-caption text-muted-foreground">
          <span aria-hidden="true" className="hidden h-px w-8 bg-primary lg:block" />
          {about.caption}
        </figcaption>
      </figure>
    </RevealSection>
  );
}
