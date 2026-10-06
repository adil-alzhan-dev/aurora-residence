import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

type LoginFieldProps = ComponentProps<"input"> & {
  id: string;
  label: string;
  invalid: boolean;
  describedBy?: string;
};

export function LoginField({ id, label, invalid, describedBy, className, ...inputProps }: LoginFieldProps) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className={cn("text-label", invalid ? "text-destructive" : "text-muted-foreground")}>
        {label}
      </label>
      <input
        id={id}
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
        className={cn(
          "w-full border-b bg-transparent py-3 text-base leading-[1.625rem] text-foreground transition-colors duration-200 outline-none",
          invalid ? "border-destructive" : "border-border hover:border-foreground focus-visible:border-primary",
          className,
        )}
        {...inputProps}
      />
    </div>
  );
}
