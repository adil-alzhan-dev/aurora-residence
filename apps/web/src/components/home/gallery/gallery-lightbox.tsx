"use client";

import * as Dialog from "@radix-ui/react-dialog";
import Image from "next/image";
import type { KeyboardEvent } from "react";

import { ArrowRightIcon, CloseIcon } from "@/components/icons";
import type { Dictionary } from "@/content";
import { padNumber } from "@/lib/format";

import { gallerySources } from "./gallery-shot";

type GalleryLightboxProps = {
  t: Dictionary["gallery"];
  index: number | null;
  onIndexChange: (index: number | null) => void;
};

const iconButton =
  "flex size-11 items-center justify-center text-foreground transition-colors duration-200 hover:text-primary";

export function GalleryLightbox({ t, index, onIndexChange }: GalleryLightboxProps) {
  const total = t.items.length;
  const item = index === null ? null : t.items[index];
  const step = (delta: number) => index !== null && onIndexChange((index + delta + total) % total);

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === "ArrowRight") step(1);
    if (event.key === "ArrowLeft") step(-1);
  };

  return (
    <Dialog.Root open={item !== null} onOpenChange={(open) => !open && onIndexChange(null)}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-dark/95 data-[state=closed]:animate-fade-out data-[state=open]:animate-fade-in" />
        <Dialog.Content
          data-theme="dark"
          data-lenis-prevent
          aria-describedby={undefined}
          onKeyDown={handleKeyDown}
          className="fixed inset-0 z-50 flex flex-col text-foreground data-[state=closed]:animate-fade-out data-[state=open]:animate-fade-in"
        >
          <Dialog.Title className="sr-only">{t.viewerLabel}</Dialog.Title>
          <div className="flex justify-end p-2 lg:p-6">
            <Dialog.Close className={iconButton} aria-label={t.close}>
              <CloseIcon />
            </Dialog.Close>
          </div>
          {item && index !== null && (
            <figure className="flex min-h-0 flex-1 flex-col gap-4 px-4 pb-6 lg:px-24 lg:pb-10">
              <div key={item.id} className="relative min-h-0 flex-1 animate-fade-in">
                <Image src={gallerySources[item.id]} alt={item.alt} fill sizes="100vw" className="object-contain" />
              </div>
              <div className="flex items-center justify-between gap-4">
                <figcaption className="flex gap-2 text-caption text-muted-foreground">
                  <span>
                    {padNumber(index + 1)} / {padNumber(total)}
                  </span>
                  {item.caption}
                </figcaption>
                <div className="flex shrink-0">
                  <button type="button" className={iconButton} aria-label={t.previous} onClick={() => step(-1)}>
                    <ArrowRightIcon className="rotate-180" />
                  </button>
                  <button type="button" className={iconButton} aria-label={t.next} onClick={() => step(1)}>
                    <ArrowRightIcon />
                  </button>
                </div>
              </div>
            </figure>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
