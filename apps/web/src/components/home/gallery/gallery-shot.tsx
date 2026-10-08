import Image from "next/image";

import type { GalleryItem } from "@/content";
import { fillTemplate, lowerFirst, padNumber } from "@/lib/format";
import { revealDelay } from "@/lib/motion";
import { cn } from "@/lib/utils";

export const gallerySources: Record<GalleryItem["id"], string> = {
  view: "/images/window-view.jpg",
  bedroom: "/images/bedroom.jpg",
  living: "/images/living.jpg",
};

type GalleryShotProps = {
  item: GalleryItem;
  index: number;
  openLabel: string;
  sizes: string;
  imageClassName: string;
  delay?: number;
  onOpen: (index: number) => void;
};

export function GalleryShot({ item, index, openLabel, sizes, imageClassName, delay, onOpen }: GalleryShotProps) {
  return (
    <figure className="flex flex-col gap-3">
      <button
        type="button"
        onClick={() => onOpen(index)}
        aria-label={fillTemplate(openLabel, { caption: lowerFirst(item.caption) })}
        data-reveal={delay === undefined ? undefined : "wipe-up"}
        style={delay === undefined ? undefined : revealDelay(delay)}
        className={cn("group relative block w-full cursor-zoom-in overflow-hidden bg-border", imageClassName)}
      >
        <Image
          src={gallerySources[item.id]}
          alt={item.alt}
          fill
          sizes={sizes}
          className="object-cover transition-transform duration-800 ease-out group-hover:scale-[1.04]"
        />
      </button>
      <figcaption className="flex gap-2 text-caption text-muted-foreground">
        <span>{padNumber(index + 1)}</span>
        {item.caption}
      </figcaption>
    </figure>
  );
}
