"use client";

import { useRef, useState } from "react";

import type { Dictionary } from "@/content";
import { padNumber } from "@/lib/format";
import { cn } from "@/lib/utils";

import { GalleryShot } from "./gallery-shot";

type GalleryCarouselProps = {
  t: Dictionary["gallery"];
  onOpen: (index: number) => void;
};

export function GalleryCarousel({ t, onOpen }: GalleryCarouselProps) {
  const trackRef = useRef<HTMLUListElement>(null);
  const [current, setCurrent] = useState(0);
  const total = t.items.length;

  const handleScroll = () => {
    const track = trackRef.current;
    const slide = track?.firstElementChild as HTMLElement | null;
    if (!track || !slide) return;
    const step = slide.offsetWidth + parseFloat(getComputedStyle(track).columnGap || "0");
    setCurrent(Math.min(total - 1, Math.round(track.scrollLeft / step)));
  };

  return (
    <div className="flex flex-col gap-8 lg:hidden">
      <ul
        ref={trackRef}
        onScroll={handleScroll}
        aria-label={t.carouselLabel}
        className="-mx-(--page-gutter) flex snap-x snap-mandatory scroll-px-(--page-gutter) gap-3 overflow-x-auto px-(--page-gutter) [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {t.items.map((item, index) => (
          <li key={item.id} className="w-[min(310px,80vw)] shrink-0 snap-start">
            <GalleryShot
              item={item}
              index={index}
              openLabel={t.openImage}
              sizes="(min-width: 400px) 310px, 80vw"
              imageClassName="aspect-[310/388]"
              onOpen={onOpen}
            />
          </li>
        ))}
      </ul>
      <div className="flex flex-col gap-8">
        <div className="flex items-center justify-between">
          <p className="text-body font-light text-foreground" aria-live="polite">
            {padNumber(current + 1)} / {padNumber(total)}
          </p>
          <div aria-hidden="true" className="flex items-center gap-1">
            {t.items.map((item, index) => (
              <span
                key={item.id}
                className={cn(
                  "h-0.5 transition-[width,background-color] duration-300 ease-(--ease-out-soft)",
                  index === current ? "w-8 bg-primary" : "w-4 bg-border",
                )}
              />
            ))}
          </div>
        </div>
        <p className="text-caption text-muted-foreground">{t.swipeHint}</p>
      </div>
    </div>
  );
}
