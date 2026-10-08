export const CURRENCIES = ["USD", "EUR", "KZT"] as const;

export type Currency = (typeof CURRENCIES)[number];

export const DEFAULT_CURRENCY: Currency = "USD";

/** Units of each currency one US dollar buys, as stored in CurrencyRate. */
export type CurrencyRates = Partial<Record<Currency, number>>;

export type FormatPrice = (amountUsd: number) => string;

export type MoneySettings = {
  currency: Currency;
  rates: CurrencyRates;
  locale?: string;
};

export function parseCurrency(value: string | null | undefined): Currency {
  const code = value?.toUpperCase();
  return CURRENCIES.find((currency) => currency === code) ?? DEFAULT_CURRENCY;
}

/** Without a rate for the chosen currency (the API is down) prices stay in dollars. */
export function displayCurrency({ currency, rates }: MoneySettings): Currency {
  return rates[currency] === undefined ? DEFAULT_CURRENCY : currency;
}

/** Prices are stored in dollars and converted only for display, rounded to whole units. */
export function convertUsd(amountUsd: number, settings: MoneySettings) {
  const rate = settings.rates[displayCurrency(settings)] ?? 1;
  return Math.round(amountUsd * rate);
}

/** The way back to dollars for amounts typed or picked in the display currency, rounded to the dollar. */
export function toUsd(amount: number, settings: MoneySettings) {
  const rate = settings.rates[displayCurrency(settings)] ?? 1;
  return Math.round(amount / rate);
}

/** Formats an amount that is already in the display currency. */
export function formatAmount(amount: number, settings: MoneySettings) {
  return new Intl.NumberFormat(settings.locale ?? "en-US", {
    style: "currency",
    currency: displayCurrency(settings),
    currencyDisplay: "narrowSymbol",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatMoney(amountUsd: number, settings: MoneySettings) {
  return formatAmount(convertUsd(amountUsd, settings), settings);
}
