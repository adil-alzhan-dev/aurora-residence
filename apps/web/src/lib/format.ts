const NBSP = " ";

export function formatUsd(amount: number) {
  return `$${Math.round(amount).toLocaleString("en-US").replaceAll(",", NBSP)}`;
}

export function fillTemplate(template: string, values: Record<string, string | number>) {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => (key in values ? String(values[key]) : match));
}

export const padNumber = (value: number) => String(value).padStart(2, "0");
