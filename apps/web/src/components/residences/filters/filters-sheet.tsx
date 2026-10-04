"use client";

import * as Dialog from "@radix-ui/react-dialog";

import { CloseIcon } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { fillTemplate } from "@/lib/format";
import { activeFilterCount } from "@/lib/residence-filters";
import { cn } from "@/lib/utils";

import { FilterFields } from "./filter-fields";
import { describeResult, type FiltersProps } from "./filters-bar";
import { useFilterNavigation } from "./use-filter-navigation";

type FiltersSheetProps = FiltersProps & {
  theme: "light" | "dark";
  className?: string;
};

/** Mobile: a "Filters" button opens the same fields in a bottom sheet; results update behind it. */
export function FiltersSheet({ filters, result, priceRange, keep, t, theme, className }: FiltersSheetProps) {
  const navigation = useFilterNavigation(filters, keep);
  const count = activeFilterCount(navigation.filters);

  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>
        <Button variant="secondary" className={className}>
          {count > 0 ? fillTemplate(t.openWithCount, { count }) : t.open}
        </Button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-dark/60 data-[state=closed]:animate-fade-out data-[state=open]:animate-fade-in" />
        <Dialog.Content
          data-theme={theme}
          data-lenis-prevent
          aria-describedby={undefined}
          className="fixed inset-x-0 bottom-0 z-50 flex max-h-[90dvh] flex-col gap-6 overflow-y-auto rounded-t-sheet border-t border-border bg-card px-4 pt-2 pb-8 text-foreground data-[state=closed]:animate-fade-out data-[state=open]:animate-rise"
        >
          <span aria-hidden="true" className="mx-auto h-1 w-9 shrink-0 rounded-base bg-border" />
          <div className="-mt-2 flex items-center justify-between">
            <Dialog.Title className="text-h3">{t.title}</Dialog.Title>
            <Dialog.Close
              aria-label={t.close}
              className="-mr-2.5 flex size-11 items-center justify-center transition-colors duration-200 hover:text-primary"
            >
              <CloseIcon />
            </Dialog.Close>
          </div>
          <FilterFields
            filters={navigation.filters}
            priceRange={priceRange}
            onChange={navigation.update}
            t={t}
            idPrefix="filters-sheet"
          />
          {result && (
            <p
              aria-live="polite"
              className={cn("text-body text-muted-foreground transition-opacity", navigation.pending && "opacity-50")}
            >
              {describeResult(result, filters, t)}
            </p>
          )}
          <div className="flex flex-col gap-2">
            <Dialog.Close asChild>
              <Button className="w-full">{t.show}</Button>
            </Dialog.Close>
            <Button variant="ghost" onClick={navigation.reset} className="w-full">
              {t.reset}
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
