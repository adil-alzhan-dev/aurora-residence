import { describe, expect, it } from "vitest";

import { allResidences } from "./__fixtures__/residences";
import { convertUsd, formatAmount, type CurrencyRates, type MoneySettings } from "./money";
import { formatMaxPrice, maxPriceAmount, maxPriceChoices, maxPriceOptions } from "./price-filter";
import { matchesFilters, parseResidenceFilters } from "./residence-filters";

const RATES: CurrencyRates = { USD: 1, EUR: 0.92, KZT: 505 };
const usd: MoneySettings = { currency: "USD", rates: RATES };
const eur: MoneySettings = { currency: "EUR", rates: RATES };
const kzt: MoneySettings = { currency: "KZT", rates: RATES };

const labels = (settings: MoneySettings) => maxPriceOptions(settings).map((option) => formatAmount(option.amount, settings));
const countUpTo = (maxPrice: number) =>
  allResidences.filter((residence) => matchesFilters(residence, parseResidenceFilters({ maxPrice: String(maxPrice) }))).length;

describe("price filter options", () => {
  it("offers round amounts in every currency", () => {
    expect(labels(usd)).toEqual(["$150,000", "$200,000", "$250,000", "$300,000", "$400,000"]);
    expect(labels(eur)).toEqual(["€140,000", "€180,000", "€230,000", "€280,000", "€370,000"]);
    expect(labels(kzt)).toEqual(["₸70,000,000", "₸100,000,000", "₸130,000,000", "₸150,000,000", "₸200,000,000"]);
  });

  it("keeps dollars in the address, converted at the rate and rounded to the dollar", () => {
    expect(maxPriceOptions(usd).map((option) => option.usd)).toEqual([150_000, 200_000, 250_000, 300_000, 400_000]);
    expect(maxPriceOptions(eur).map((option) => option.usd)).toEqual([152_174, 195_652, 250_000, 304_348, 402_174]);
    expect(maxPriceOptions(kzt).map((option) => option.usd)).toEqual([138_614, 198_020, 257_426, 297_030, 396_040]);
  });

  it("finds the same residences as the shown amount in every currency", () => {
    for (const settings of [usd, eur, kzt]) {
      for (const option of maxPriceOptions(settings)) {
        const shownUpTo = allResidences.filter((residence) => convertUsd(residence.priceUsd, settings) <= option.amount);
        expect(countUpTo(option.usd)).toBe(shownUpTo.length);
      }
    }
  });

  it("falls back to dollars without a rate", () => {
    expect(labels({ currency: "KZT", rates: {} })[0]).toBe("$150,000");
  });
});

describe("selected price limit", () => {
  it("shows a limit picked in this currency as its round amount", () => {
    expect(maxPriceAmount(138_614, kzt)).toBe(70_000_000);
    expect(formatMaxPrice(138_614, kzt)).toBe("₸70,000,000");
    expect(formatMaxPrice(152_174, { ...eur, locale: "ru-RU" })).toBe("140 000 €");
  });

  it("shows a limit picked in another currency as its exact conversion", () => {
    expect(formatMaxPrice(138_614, usd)).toBe("$138,614");
    expect(formatMaxPrice(138_614, eur)).toBe("€127,525");
    expect(formatMaxPrice(200_000, kzt)).toBe("₸101,000,000");
  });

  it("adds a limit from another currency to the choices, in dollar order", () => {
    const choices = maxPriceChoices(138_614, eur, 95_000);
    expect(choices.map((option) => option.usd)).toEqual([138_614, 152_174, 195_652, 250_000, 304_348, 402_174]);
    expect(choices[0]).toEqual({ usd: 138_614, amount: 127_525 });
  });

  it("does not repeat a limit that is already a round step", () => {
    expect(maxPriceChoices(138_614, kzt, 95_000)).toHaveLength(5);
  });

  it("leaves out steps below the cheapest residence", () => {
    expect(maxPriceChoices(null, usd, 160_000).map((option) => option.usd)).toEqual([200_000, 250_000, 300_000, 400_000]);
  });

  it("filters the same residences for a KZT step and the same dollars in the address", () => {
    const [step] = maxPriceOptions(kzt);
    expect(countUpTo(step.usd)).toBe(countUpTo(138_614));
    expect(countUpTo(step.usd)).toBeGreaterThan(0);
  });
});
