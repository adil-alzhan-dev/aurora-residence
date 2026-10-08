"use client";

import type { AdminDictionary } from "@/content/en-admin";
import { useLiveStatus } from "@/lib/live/use-live";
import { cn } from "@/lib/utils";

/**
 * Hidden while the first connection is being made, so a normal start never flashes "offline".
 * On phones a working connection is only the green dot; a lost one also gets a short word.
 */
export function LiveIndicator({ t }: { t: AdminDictionary["live"] }) {
  const status = useLiveStatus();
  const open = status === "open";

  return (
    <div role="status" className="flex items-center empty:hidden">
      {status !== "connecting" && (
        <p className="flex items-center gap-2 text-admin-caption text-muted-foreground">
          <span
            aria-hidden="true"
            className={cn("size-2 shrink-0 rounded-full", open ? "bg-status-free" : "bg-status-reserved")}
          />
          <span className="sr-only md:not-sr-only md:whitespace-nowrap">{open ? t.open : t.offline}</span>
          {!open && (
            <span aria-hidden="true" className="whitespace-nowrap md:hidden">
              {t.offlineShort}
            </span>
          )}
        </p>
      )}
    </div>
  );
}
