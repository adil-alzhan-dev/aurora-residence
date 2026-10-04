"use client";

import { useLayoutEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

export type SwitcherOption<T extends string> = {
  value: T;
  label: string;
  disabled?: boolean;
};

type SwitcherProps<T extends string> = {
  options: SwitcherOption<T>[];
  label: string;
  value?: T;
  defaultValue?: T;
  onValueChange?: (value: T) => void;
  className?: string;
};

type Indicator = { left: number; width: number };

export function Switcher<T extends string>({
  options,
  label,
  value,
  defaultValue,
  onValueChange,
  className,
}: SwitcherProps<T>) {
  const [innerValue, setInnerValue] = useState(defaultValue ?? options[0]?.value);
  const selected = value ?? innerValue;
  const groupRef = useRef<HTMLDivElement>(null);
  const [indicator, setIndicator] = useState<Indicator | null>(null);

  useLayoutEffect(() => {
    const group = groupRef.current;
    if (!group) return;
    const measure = () => {
      const button = group.querySelector<HTMLButtonElement>('[aria-pressed="true"]');
      if (button) setIndicator({ left: button.offsetLeft, width: button.offsetWidth });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(group);
    return () => observer.disconnect();
  }, [selected]);

  const select = (next: T) => {
    setInnerValue(next);
    onValueChange?.(next);
  };

  return (
    <div ref={groupRef} role="group" aria-label={label} className={cn("relative flex items-center gap-1", className)}>
      {options.map((option) => {
        const isSelected = option.value === selected;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={isSelected}
            disabled={option.disabled}
            onClick={() => select(option.value)}
            className={cn(
              "flex items-center border-b px-3 py-3.5 text-label transition-colors duration-200 lg:py-2",
              isSelected ? "text-foreground" : "text-muted-foreground hover:border-border hover:text-foreground",
              isSelected && !indicator ? "border-primary" : "border-transparent",
              "disabled:pointer-events-none disabled:text-disabled-foreground",
            )}
          >
            {option.label}
          </button>
        );
      })}
      {indicator && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute bottom-0 left-0 h-px bg-primary transition-[translate,width] duration-300 ease-(--ease-out-soft)"
          style={{ width: indicator.width, translate: `${indicator.left}px 0` }}
        />
      )}
    </div>
  );
}
