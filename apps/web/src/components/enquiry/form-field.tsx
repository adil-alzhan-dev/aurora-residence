import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export const inputClass =
  "min-w-0 flex-1 bg-transparent font-sans text-base leading-[1.625rem] text-foreground outline-none placeholder:text-muted-foreground";

type FormFieldProps = {
  id: string;
  label: string;
  error?: string;
  children: ReactNode;
};

export const errorId = (id: string) => `${id}-error`;

export function FormField({ id, label, error, children }: FormFieldProps) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-label text-muted-foreground">
        {label}
      </label>
      <div
        className={cn(
          "flex items-center gap-3 border-b py-3 transition-colors duration-200",
          error ? "border-destructive" : "border-border not-focus-within:hover:border-foreground focus-within:border-primary",
        )}
      >
        {children}
      </div>
      {error && (
        <p id={errorId(id)} className="text-caption text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
