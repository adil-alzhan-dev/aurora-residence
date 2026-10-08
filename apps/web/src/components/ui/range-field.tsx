import type { CSSProperties } from "react";

type RangeFieldProps = {
  id: string;
  label: string;
  value: number;
  valueText: string;
  min: number;
  max: number;
  step: number;
  minText: string;
  maxText: string;
  onValueChange: (value: number) => void;
};

/** Slider component from Figma on a native range input: keyboard, screen readers and touch work as is. */
export function RangeField({ id, label, value, valueText, min, max, step, minText, maxText, onValueChange }: RangeFieldProps) {
  const progress = `${((value - min) / (max - min)) * 100}%`;
  return (
    <div className="flex flex-col gap-1 lg:gap-3">
      <div className="flex items-baseline justify-between gap-4">
        <label htmlFor={id} className="text-label text-muted-foreground">
          {label}
        </label>
        <output htmlFor={id} className="text-slider-value whitespace-nowrap text-foreground">
          {valueText}
        </output>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        aria-valuetext={valueText}
        onChange={(event) => onValueChange(Number(event.target.value))}
        className="range-input"
        style={{ "--range-progress": progress } as CSSProperties}
      />
      <div aria-hidden="true" className="flex justify-between text-caption text-muted-foreground">
        <span>{minText}</span>
        <span>{maxText}</span>
      </div>
    </div>
  );
}
