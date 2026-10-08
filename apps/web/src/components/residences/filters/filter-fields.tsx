"use client";

import { useCurrency } from "@/components/currency/currency-provider";
import { SelectField, type SelectOption } from "@/components/ui/select-field";
import { Switcher, type SwitcherOption } from "@/components/ui/switcher";
import type { Dictionary } from "@/content";
import { floorNumbers } from "@/lib/building";
import { fillTemplate } from "@/lib/format";
import { formatAmount, formatMoney, type MoneySettings } from "@/lib/money";
import { maxPriceChoices } from "@/lib/price-filter";
import { bedroomOptions, type ResidenceFilters } from "@/lib/residence-filters";
import { cn } from "@/lib/utils";

export type PriceRange = { min: number; max: number };

const ANY = "";

type FilterFieldsProps = {
  filters: ResidenceFilters;
  priceRange: PriceRange | null;
  onChange: (patch: Partial<ResidenceFilters>) => void;
  t: Dictionary["filters"];
  idPrefix: string;
  className?: string;
};

const toNumber = (value: string) => (value === ANY ? null : Number(value));

function priceOptions(
  current: number | null,
  range: PriceRange | null,
  t: Dictionary["filters"],
  money: MoneySettings,
): SelectOption[] {
  const label = (amount: string) =>
    range ? fillTemplate(t.priceRange, { min: formatMoney(range.min, money), max: amount }) : amount;
  return [
    { value: ANY, label: range ? label(formatMoney(range.max, money)) : t.anyPrice },
    ...maxPriceChoices(current, money, range?.min ?? null).map((option) => ({
      value: String(option.usd),
      label: label(formatAmount(option.amount, money)),
    })),
  ];
}

export function FilterFields({ filters, priceRange, onChange, t, idPrefix, className }: FilterFieldsProps) {
  const { currency, money } = useCurrency();
  const bedrooms: SwitcherOption<string>[] = [
    { value: ANY, label: t.bedroomsAll },
    ...bedroomOptions.map((count) => ({ value: String(count), label: t.bedroomOptions[count] })),
  ];
  const floors: SelectOption[] = [
    { value: ANY, label: t.anyFloor },
    ...floorNumbers.map((floor) => ({ value: String(floor), label: fillTemplate(t.floorOption, { floor }) })),
  ];

  return (
    <div className={cn("flex flex-col gap-6", className)}>
      <div className="flex flex-col gap-3">
        <p aria-hidden="true" className="text-label text-muted-foreground">
          {t.bedrooms}
        </p>
        <Switcher
          label={t.bedrooms}
          options={bedrooms}
          value={filters.bedrooms === null ? ANY : String(filters.bedrooms)}
          onValueChange={(value) => onChange({ bedrooms: toNumber(value) })}
          className="-mx-3 flex-wrap lg:mx-0 lg:flex-nowrap"
        />
      </div>
      <SelectField
        id={`${idPrefix}-price`}
        label={fillTemplate(t.price, { currency })}
        value={filters.maxPrice === null ? ANY : String(filters.maxPrice)}
        options={priceOptions(filters.maxPrice, priceRange, t, money)}
        onValueChange={(value) => onChange({ maxPrice: toNumber(value) })}
        className="lg:w-[280px]"
      />
      <SelectField
        id={`${idPrefix}-floor`}
        label={t.floor}
        value={filters.floor === null ? ANY : String(filters.floor)}
        options={floors}
        onValueChange={(value) => onChange({ floor: toNumber(value) })}
        className="lg:w-[200px]"
      />
    </div>
  );
}
