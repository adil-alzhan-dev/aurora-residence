"use client";

import * as Select from "@radix-ui/react-select";

import { ResidenceStatusBadge } from "@/components/admin/residences/residence-row";
import { CheckIcon, ChevronDownIcon } from "@/components/icons";
import type { AdminDictionary } from "@/content/en-admin";
import type { AdminResidenceStatus } from "@/lib/admin/schemas";

const STATUSES: AdminResidenceStatus[] = ["AVAILABLE", "RESERVED", "SOLD"];

type StatusSelectProps = {
  value: AdminResidenceStatus;
  /** Status the residence has in the API: Reserved can be kept, but never chosen here. */
  current: AdminResidenceStatus;
  onValueChange: (status: AdminResidenceStatus) => void;
  label: string;
  reservedHint: string;
  statuses: AdminDictionary["facade"]["statuses"];
  disabled?: boolean;
};

/** Admin / Status Select and Admin / Status Menu from Figma, on Radix Select for keyboard and screen readers. */
export function StatusSelect({ value, current, onValueChange, label, reservedHint, statuses, disabled }: StatusSelectProps) {
  return (
    <Select.Root value={value} onValueChange={(next) => onValueChange(next as AdminResidenceStatus)} disabled={disabled}>
      <Select.Trigger
        aria-label={label}
        className="group flex h-11 w-37 items-center justify-between gap-2 rounded-base border border-border bg-card pr-2 pl-1 transition-colors duration-200 hover:border-foreground data-disabled:opacity-60 data-[state=open]:border-primary md:h-8"
      >
        <Select.Value>
          <ResidenceStatusBadge status={value} statuses={statuses} />
        </Select.Value>
        <Select.Icon>
          <ChevronDownIcon className="text-foreground transition-transform duration-200 group-data-[state=open]:rotate-180" />
        </Select.Icon>
      </Select.Trigger>
      <Select.Portal>
        <Select.Content
          position="popper"
          side="bottom"
          align="start"
          sideOffset={4}
          className="z-50 w-46 rounded-base border border-border bg-card p-1"
        >
          <Select.Viewport>
            {STATUSES.map((status) => {
              const locked = status === "RESERVED" && current !== "RESERVED";
              return (
                <Select.Item
                  key={status}
                  value={status}
                  disabled={locked}
                  className="flex h-11 cursor-pointer items-center justify-between gap-2 px-2 outline-none select-none data-disabled:cursor-not-allowed data-highlighted:bg-background md:h-9"
                >
                  <Select.ItemText>
                    <span className={locked ? "opacity-50" : undefined}>
                      <ResidenceStatusBadge status={status} statuses={statuses} />
                    </span>
                  </Select.ItemText>
                  {locked && <span className="sr-only">{reservedHint}</span>}
                  <Select.ItemIndicator>
                    <CheckIcon className="text-foreground" />
                  </Select.ItemIndicator>
                </Select.Item>
              );
            })}
          </Select.Viewport>
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  );
}
