import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [
        {
          text: [
            "display", "h1", "h2", "h3", "body-l", "body", "caption", "overline", "label", "stat", "fact", "amount", "slider-value", "fact-compact", "stat-compact",
            "admin-title", "admin-section", "admin-body", "admin-strong", "admin-stat", "admin-caption",
          ],
        },
      ],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
