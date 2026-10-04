"use client";

import { useState } from "react";

import { RevealSection } from "@/components/motion/reveal-section";
import type { Dictionary } from "@/content";
import type { SectionId } from "@/content/navigation";

import { GalleryCarousel } from "./gallery-carousel";
import { GalleryLightbox } from "./gallery-lightbox";
import { GalleryShot } from "./gallery-shot";

const STAGGER_MS = 150;

type GalleryProps = {
  t: Pick<Dictionary, "gallery">;
};

export function Gallery({ t }: GalleryProps) {
  const { gallery } = t;
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [main, ...side] = gallery.items;

  return (
    <RevealSection
      id={"gallery" satisfies SectionId}
      aria-labelledby="gallery-title"
      className="overflow-hidden bg-background py-16 lg:py-32"
    >
      <div className="container-page flex flex-col gap-8 lg:gap-16">
        <div data-reveal="up" className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between lg:gap-8">
          <div className="flex max-w-[624px] flex-col gap-4 lg:gap-6">
            <p className="text-overline text-primary">{gallery.overline}</p>
            <h2 id="gallery-title" className="text-h2 text-foreground">
              {gallery.title}
            </h2>
          </div>
          <p className="text-body text-muted-foreground lg:w-[406px] lg:shrink-0">{gallery.lead}</p>
        </div>

        {main && (
          <div className="hidden items-start gap-8 lg:grid lg:grid-cols-[840fr_408fr]">
            <GalleryShot
              item={main}
              index={0}
              openLabel={gallery.openImage}
              sizes="(min-width: 1440px) 840px, 58vw"
              imageClassName="aspect-[840/620]"
              delay={0}
              onOpen={setOpenIndex}
            />
            <div className="flex flex-col gap-6">
              {side.map((item, offset) => (
                <GalleryShot
                  key={item.id}
                  item={item}
                  index={offset + 1}
                  openLabel={gallery.openImage}
                  sizes="(min-width: 1440px) 408px, 28vw"
                  imageClassName="aspect-[408/298]"
                  delay={(offset + 1) * STAGGER_MS}
                  onOpen={setOpenIndex}
                />
              ))}
            </div>
          </div>
        )}

        <GalleryCarousel t={gallery} onOpen={setOpenIndex} />
      </div>
      <GalleryLightbox t={gallery} index={openIndex} onIndexChange={setOpenIndex} />
    </RevealSection>
  );
}
