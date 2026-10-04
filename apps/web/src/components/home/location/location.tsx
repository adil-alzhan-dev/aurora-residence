"use client";

import { useState } from "react";

import { RevealSection } from "@/components/motion/reveal-section";
import type { Dictionary, PlaceItem } from "@/content";
import type { SectionId } from "@/content/navigation";
import { fillTemplate } from "@/lib/format";
import { revealDelay } from "@/lib/motion";

import { NeighbourhoodMap } from "./neighbourhood-map";

type LocationProps = {
  t: Pick<Dictionary, "location">;
};

export function Location({ t }: LocationProps) {
  const { location } = t;
  const [highlighted, setHighlighted] = useState<PlaceItem["id"] | null>(null);

  return (
    <RevealSection
      id={"location" satisfies SectionId}
      aria-labelledby="location-title"
      className="bg-background py-16 lg:py-32"
    >
      <div className="container-page flex flex-col gap-8 lg:flex-row lg:items-start">
        <div className="contents lg:flex lg:w-[clamp(300px,30vw,412px)] lg:shrink-0 lg:flex-col lg:gap-6">
          <div data-reveal="up" className="flex flex-col gap-4 lg:gap-6">
            <p className="text-overline text-primary">{location.overline}</p>
            <h2 id="location-title" className="text-h2 text-foreground">
              {location.title}
            </h2>
            <p className="text-body text-muted-foreground">{location.lead}</p>
          </div>
          <ul data-reveal="up" style={revealDelay(120)} className="order-2 lg:order-none lg:mt-4 lg:border-t lg:border-border">
            {location.places.map((place) => (
              <li
                key={place.id}
                onPointerEnter={() => setHighlighted(place.id)}
                onPointerLeave={() => setHighlighted(null)}
                className="flex items-center justify-between gap-4 border-b border-border py-4 text-body whitespace-nowrap"
              >
                <span className="text-foreground">{place.name}</span>
                <span className="text-caption text-muted-foreground lg:text-body">
                  {fillTemplate(location.walk, { minutes: place.minutes })}
                </span>
              </li>
            ))}
          </ul>
        </div>
        <NeighbourhoodMap
          t={location}
          highlighted={highlighted}
          className="order-1 h-80 lg:order-none lg:h-[640px] lg:max-w-[836px] lg:min-w-0 lg:flex-1"
        />
      </div>
    </RevealSection>
  );
}
