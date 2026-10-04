import { ChevronDownIcon } from "@/components/icons";
import { cn } from "@/lib/utils";

export type SelectOption = {
  value: string;
  label: string;
};

type SelectFieldProps = {
  id: string;
  label: string;
  value: string;
  options: SelectOption[];
  onValueChange: (value: string) => void;
  className?: string;
};

/** Underline select from the Input component in Figma. Native, so phones show their own picker. */
export function SelectField({ id, label, value, options, onValueChange, className }: SelectFieldProps) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <label htmlFor={id} className="text-label text-muted-foreground">
        {label}
      </label>
      <div className="relative flex items-center border-b border-border transition-colors duration-200 not-focus-within:hover:border-foreground focus-within:border-primary">
        <select
          id={id}
          value={value}
          onChange={(event) => onValueChange(event.target.value)}
          className="min-h-[50px] w-full cursor-pointer appearance-none bg-transparent py-3 pr-7 font-sans text-base leading-[1.625rem] text-foreground outline-none"
        >
          {options.map((option) => (
            <option key={option.value} value={option.value} className="bg-card text-foreground">
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDownIcon className="pointer-events-none absolute right-0 text-foreground" />
      </div>
    </div>
  );
}
