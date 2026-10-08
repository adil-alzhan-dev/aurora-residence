const NBSP = " ";

export function formatUsd(amount: number) {
  return `$${Math.round(amount).toLocaleString("en-US").replaceAll(",", NBSP)}`;
}

export function fillTemplate(template: string, values: Record<string, string | number>) {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => (key in values ? String(values[key]) : match));
}

export const padNumber = (value: number) => String(value).padStart(2, "0");

export const formatArea = (squareMetres: number) => squareMetres.toFixed(1);

/** Areas and heights with one decimal in the reader's language: "84.2" or "84,2". */
export const formatDecimal = (value: number, intl: string) =>
  new Intl.NumberFormat(intl, { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(value);

/** "Свободно" becomes "свободно" inside a phrase; words such as "AURORA" or "Q4" stay as they are. */
export const lowerFirst = (text: string) =>
  /^\p{Lu}\p{Ll}/u.test(text) ? text.charAt(0).toLowerCase() + text.slice(1) : text;

/** Parts of one spoken phrase, such as an aria-label: only the first part keeps its capital. */
export const joinPhrase = (parts: (string | null | undefined)[]) =>
  parts
    .filter((part): part is string => Boolean(part))
    .map((part, index) => (index === 0 ? part : lowerFirst(part)))
    .join(", ");
