"use client";

import { useEffect, useId, useState } from "react";

import { SearchIcon } from "@/components/admin/admin-icons";
import { ChevronDownIcon } from "@/components/icons";
import type { AdminDictionary } from "@/content/en-admin";
import { floorNumbers } from "@/lib/building";
import { cleanSearch, type ResidenceFilters } from "@/lib/admin/residence-filters";
import type { AdminResidenceStatus, ResidenceList } from "@/lib/admin/schemas";
import { fillTemplate } from "@/lib/format";
import { cn } from "@/lib/utils";

const SEARCH_DELAY_MS = 250;
const box = "flex h-10 items-center gap-2 rounded-base border border-border bg-card px-3";

type FiltersProps = {
  filters: ResidenceFilters;
  counts: ResidenceList["counts"] | undefined;
  shown: number;
  onChange: (next: Partial<ResidenceFilters>) => void;
  t: AdminDictionary["residences"];
  statuses: AdminDictionary["facade"]["statuses"];
};

function SearchField({ value, onSearch, t }: { value: string; onSearch: (search: string) => void; t: FiltersProps["t"] }) {
  const id = useId();
  const [draft, setDraft] = useState(value);
  const [synced, setSynced] = useState(value);
  if (value !== synced) {
    setSynced(value);
    setDraft(value);
  }

  useEffect(() => {
    const search = cleanSearch(draft);
    if (search === value) return;
    const timer = setTimeout(() => onSearch(search), SEARCH_DELAY_MS);
    return () => clearTimeout(timer);
  }, [draft, value, onSearch]);

  return (
    <div className={cn(box, "w-full focus-within:border-primary sm:w-70")}>
      <label htmlFor={id} className="sr-only">
        {t.searchLabel}
      </label>
      <SearchIcon className="shrink-0 text-muted-foreground" />
      <input
        id={id}
        type="search"
        inputMode="decimal"
        autoComplete="off"
        value={draft}
        maxLength={10}
        placeholder={t.searchPlaceholder}
        onChange={(event) => setDraft(event.target.value)}
        className="min-w-0 flex-1 bg-transparent text-admin-body text-foreground outline-none placeholder:text-muted-foreground"
      />
    </div>
  );
}

function FloorSelect({ value, onFloor, t }: { value: number | null; onFloor: (floor: number | null) => void; t: FiltersProps["t"] }) {
  const id = useId();
  return (
    <div className={cn(box, "relative w-full focus-within:border-primary sm:w-50")}>
      <label htmlFor={id} className="text-admin-caption text-muted-foreground">
        {t.floorLabel}
      </label>
      <select
        id={id}
        value={value ?? ""}
        onChange={(event) => onFloor(event.target.value ? Number(event.target.value) : null)}
        className="h-full min-w-0 flex-1 cursor-pointer appearance-none bg-transparent pr-6 text-admin-body text-foreground outline-none"
      >
        <option value="">{t.allFloors}</option>
        {floorNumbers.map((floor) => (
          <option key={floor} value={floor}>
            {fillTemplate(t.floorOption, { floor })}
          </option>
        ))}
      </select>
      <ChevronDownIcon className="pointer-events-none absolute right-3 text-foreground" />
    </div>
  );
}

const STATUS_ORDER: AdminResidenceStatus[] = ["AVAILABLE", "RESERVED", "SOLD"];

function StatusTabs({ filters, counts, onChange, t, statuses }: Omit<FiltersProps, "shown">) {
  const total = counts ? counts.AVAILABLE + counts.RESERVED + counts.SOLD : null;
  const options = [
    { status: null, label: t.all, count: total },
    ...STATUS_ORDER.map((status) => ({ status, label: statuses[status], count: counts?.[status] ?? null })),
  ];
  return (
    <div role="group" aria-label={t.statusFilter} className="flex overflow-x-auto rounded-base border border-border bg-card">
      {options.map((option) => {
        const active = filters.status === option.status;
        return (
          <button
            key={option.label}
            type="button"
            aria-pressed={active}
            onClick={() => onChange({ status: option.status })}
            className={cn(
              "flex h-10 shrink-0 items-center gap-2 px-4 transition-colors duration-200 focus-visible:-outline-offset-2",
              active ? "bg-foreground text-admin-strong text-card" : "text-admin-body text-muted-foreground hover:text-foreground",
            )}
          >
            {option.label}
            {option.count !== null && <span>{option.count}</span>}
          </button>
        );
      })}
    </div>
  );
}

export function ResidencesFilters({ filters, counts, shown, onChange, t, statuses }: FiltersProps) {
  const total = counts ? counts.AVAILABLE + counts.RESERVED + counts.SOLD : null;
  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
      <div className="flex flex-col gap-3 sm:flex-row">
        <SearchField value={filters.search} onSearch={(search) => onChange({ search })} t={t} />
        <FloorSelect value={filters.floor} onFloor={(floor) => onChange({ floor })} t={t} />
      </div>
      <StatusTabs filters={filters} counts={counts} onChange={onChange} t={t} statuses={statuses} />
      {total !== null && (
        <p aria-live="polite" className="text-admin-caption text-muted-foreground lg:ml-auto">
          {fillTemplate(t.showing, { shown, total })}
        </p>
      )}
    </div>
  );
}
