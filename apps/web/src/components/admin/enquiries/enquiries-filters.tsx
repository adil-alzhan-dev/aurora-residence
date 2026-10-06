"use client";

import { useId } from "react";

import { SearchField } from "@/components/admin/search-field";
import { ChevronDownIcon } from "@/components/icons";
import type { AdminDictionary } from "@/content/en-admin";
import { ENQUIRY_STATUSES, cleanEnquirySearch, type EnquiryFilters } from "@/lib/admin/enquiry-filters";
import type { EnquiryCounts } from "@/lib/admin/enquiry-queries";
import { cn } from "@/lib/utils";

const box = "flex h-10 items-center gap-2 rounded-base border border-border bg-card px-3";

type FiltersProps = {
  filters: EnquiryFilters;
  counts: EnquiryCounts | undefined;
  residenceNumbers: string[];
  onChange: (next: Partial<EnquiryFilters>) => void;
  t: AdminDictionary;
};

type Text = AdminDictionary["enquiryList"];

function StatusTabs({ filters, counts, onChange, t }: Omit<FiltersProps, "residenceNumbers">) {
  const options = [
    { status: null, label: t.enquiryList.all, count: counts?.ALL },
    ...ENQUIRY_STATUSES.map((status) => ({ status, label: t.enquiries.statuses[status], count: counts?.[status] })),
  ];
  return (
    <div
      role="group"
      aria-label={t.enquiryList.statusFilter}
      className="flex overflow-x-auto rounded-base border border-border bg-card"
    >
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
            {option.count !== undefined && <span>{option.count}</span>}
          </button>
        );
      })}
    </div>
  );
}

type ResidenceSelectProps = {
  value: string | null;
  numbers: string[];
  onResidence: (residence: string | null) => void;
  t: Text;
};

function ResidenceSelect({ value, numbers, onResidence, t }: ResidenceSelectProps) {
  const id = useId();
  const options = value && !numbers.includes(value) ? [value, ...numbers] : numbers;
  return (
    <div className={cn(box, "relative w-full focus-within:border-primary sm:w-50")}>
      <label htmlFor={id} className="text-admin-caption text-muted-foreground">
        {t.residenceLabel}
      </label>
      <select
        id={id}
        value={value ?? ""}
        onChange={(event) => onResidence(event.target.value || null)}
        className="h-full min-w-0 flex-1 cursor-pointer appearance-none bg-transparent pr-6 text-admin-body text-foreground outline-none"
      >
        <option value="">{t.anyResidence}</option>
        {options.map((number) => (
          <option key={number} value={number}>
            {number}
          </option>
        ))}
      </select>
      <ChevronDownIcon className="pointer-events-none absolute right-3 text-foreground" />
    </div>
  );
}

export function EnquiriesFilters({ filters, counts, residenceNumbers, onChange, t }: FiltersProps) {
  return (
    <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
      <SearchField
        value={filters.search}
        onSearch={(search) => onChange({ search })}
        clean={cleanEnquirySearch}
        label={t.enquiryList.searchLabel}
        placeholder={t.enquiryList.searchPlaceholder}
        maxLength={100}
      />
      <StatusTabs filters={filters} counts={counts} onChange={onChange} t={t} />
      <ResidenceSelect
        value={filters.residence}
        numbers={residenceNumbers}
        onResidence={(residence) => onChange({ residence })}
        t={t.enquiryList}
      />
      <p className="text-admin-caption text-muted-foreground xl:ml-auto">{t.enquiryList.newestFirst}</p>
    </div>
  );
}
