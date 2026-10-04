"use client";

import { useState } from "react";

/** The list grows by one page per "Show more"; a new sort or filter remounts it from the first page. */
export function useShowMore(total: number, pageSize: number) {
  const [shown, setShown] = useState(pageSize);
  return {
    shown: Math.min(shown, total),
    hasMore: shown < total,
    showMore: () => setShown((current) => current + pageSize),
  };
}
