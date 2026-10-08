import { convertUsd, displayCurrency, formatAmount, toUsd, type Currency, type MoneySettings } from "./money";

/**
 * Round price limits in each currency. The EUR and KZT steps follow the dollar ones at the
 * rates in CurrencyRate (0.92 and 505), so every currency offers a similar choice.
 */
const MAX_PRICE_STEPS: Record<Currency, readonly number[]> = {
  USD: [150_000, 200_000, 250_000, 300_000, 400_000],
  EUR: [140_000, 180_000, 230_000, 280_000, 370_000],
  KZT: [70_000_000, 100_000_000, 130_000_000, 150_000_000, 200_000_000],
};

export type MaxPriceOption = {
  /** Value for the address: the limit in dollars, rounded to the dollar. */
  usd: number;
  /** Round amount in the display currency, shown to the visitor. */
  amount: number;
};

export function maxPriceOptions(settings: MoneySettings): MaxPriceOption[] {
  return MAX_PRICE_STEPS[displayCurrency(settings)].map((amount) => ({ usd: toUsd(amount, settings), amount }));
}

/**
 * A limit from the address in the display currency: the round step it came from, or, for a limit
 * picked in another currency, its exact conversion.
 */
export function maxPriceAmount(usd: number, settings: MoneySettings) {
  return maxPriceOptions(settings).find((option) => option.usd === usd)?.amount ?? convertUsd(usd, settings);
}

export function formatMaxPrice(usd: number, settings: MoneySettings) {
  return formatAmount(maxPriceAmount(usd, settings), settings);
}

/**
 * Options for the price select: round steps above the cheapest residence, plus the current limit
 * when it is not one of them, so a link made in another currency keeps working and stays visible.
 */
export function maxPriceChoices(current: number | null, settings: MoneySettings, minPriceUsd: number | null) {
  const options = maxPriceOptions(settings).filter((option) => minPriceUsd === null || option.usd > minPriceUsd);
  if (current !== null && !options.some((option) => option.usd === current)) {
    options.push({ usd: current, amount: convertUsd(current, settings) });
  }
  return options.sort((a, b) => a.usd - b.usd);
}
