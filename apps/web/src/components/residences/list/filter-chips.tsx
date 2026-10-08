"use client";

import { useCurrency } from "@/components/currency/currency-provider";
import { CloseIcon } from "@/components/icons";
import type { Dictionary } from "@/content";
import { fillTemplate, lowerFirst } from "@/lib/format";
import type { MoneySettings } from "@/lib/money";
import { formatMaxPrice } from "@/lib/price-filter";
import type { KeptParams, ResidenceFilters } from "@/lib/residence-filters";

import { useFilterNavigation } from "../filters/use-filter-navigation";

type FilterChipsProps = {
  filters: ResidenceFilters;
  keep: KeptParams;
  t: Dictionary["list"];
};

type Chip = { key: keyof ResidenceFilters; label: string };

function chipsFor(filters: ResidenceFilters, t: Dictionary["list"], money: MoneySettings): Chip[] {
  const chips: Chip[] = [];
  if (filters.bedrooms !== null) chips.push({ key: "bedrooms", label: t.chips.bedrooms[filters.bedrooms] ?? "" });
  if (filters.maxPrice !== null) {
    chips.push({ key: "maxPrice", label: fillTemplate(t.chips.price, { price: formatMaxPrice(filters.maxPrice, money) }) });
  }
  if (filters.floor !== null) chips.push({ key: "floor", label: fillTemplate(t.chips.floor, { floor: filters.floor }) });
  return chips;
}

/** Mobile list: each active filter as a chip that removes it with one tap. */
export function FilterChips({ filters, keep, t }: FilterChipsProps) {
  const navigation = useFilterNavigation(filters, keep);
  const { money } = useCurrency();
  const chips = chipsFor(navigation.filters, t, money);
  if (chips.length === 0) return null;

  return (
    <ul aria-label={t.activeFilters} className="contents">
      {chips.map((chip) => (
        <li
          key={chip.key}
          className="flex min-h-12 items-center gap-1 rounded-base border border-border bg-card pr-1 pl-4 text-body text-foreground"
        >
          {chip.label}
          <button
            type="button"
            aria-label={fillTemplate(t.chips.remove, { label: lowerFirst(chip.label) })}
            onClick={() => navigation.update({ [chip.key]: null })}
            className="flex size-11 items-center justify-center"
          >
            <CloseIcon />
          </button>
        </li>
      ))}
    </ul>
  );
}
