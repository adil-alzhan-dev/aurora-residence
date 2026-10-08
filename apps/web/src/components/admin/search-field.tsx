"use client";

import { useEffect, useId, useState, type HTMLAttributes } from "react";

import { SearchIcon } from "@/components/admin/admin-icons";

const SEARCH_DELAY_MS = 250;

type SearchFieldProps = {
  value: string;
  onSearch: (search: string) => void;
  clean: (raw: string) => string;
  label: string;
  placeholder: string;
  maxLength: number;
  inputMode?: HTMLAttributes<HTMLInputElement>["inputMode"];
};

/** Typing goes to the address after a short pause; the address stays the source of the filter. */
export function SearchField({ value, onSearch, clean, label, placeholder, maxLength, inputMode }: SearchFieldProps) {
  const id = useId();
  const [draft, setDraft] = useState(value);
  const [synced, setSynced] = useState(value);
  if (value !== synced) {
    setSynced(value);
    setDraft(value);
  }

  useEffect(() => {
    const search = clean(draft);
    if (search === value) return;
    const timer = setTimeout(() => onSearch(search), SEARCH_DELAY_MS);
    return () => clearTimeout(timer);
  }, [draft, value, onSearch, clean]);

  return (
    <div className="flex h-11 w-full items-center gap-2 rounded-base border border-border bg-card px-3 focus-within:border-primary sm:w-70 md:h-10">
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <SearchIcon className="shrink-0 text-muted-foreground" />
      <input
        id={id}
        type="search"
        inputMode={inputMode}
        autoComplete="off"
        value={draft}
        maxLength={maxLength}
        placeholder={placeholder}
        onChange={(event) => setDraft(event.target.value)}
        className="h-full min-w-0 flex-1 bg-transparent text-admin-body text-foreground outline-none placeholder:text-muted-foreground"
      />
    </div>
  );
}
