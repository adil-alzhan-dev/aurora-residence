// @vitest-environment jsdom
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { AdminLocaleProvider } from "@/components/admin/admin-locale";
import { adminEn } from "@/content/en-admin";
import { adminRu } from "@/content/ru-admin";
import type { AdminResidence } from "@/lib/admin/schemas";

import { ResidenceCards } from "./residence-cards";

const residence = (overrides: Partial<AdminResidence>): AdminResidence => ({
  number: "7.03",
  floor: 7,
  position: 3,
  bedrooms: 2,
  areaM2: 84.2,
  isPenthouse: false,
  priceUsd: 218000,
  status: "AVAILABLE",
  side: "South",
  view: "Park",
  statusChangedAt: new Date("2026-09-28T10:00:00Z"),
  reservedUntil: null,
  ...overrides,
});

const items = [
  residence({}),
  residence({ number: "11.05", floor: 11, position: 5, bedrooms: 3, areaM2: 152.4, isPenthouse: true, priceUsd: 486000, status: "RESERVED" }),
];

afterEach(cleanup);

describe("ResidenceCards", () => {
  it("links every card to its residence with the facts in one lowercase phrase", () => {
    render(<ResidenceCards items={items} t={adminEn.residences} statuses={adminEn.facade.statuses} />);
    const list = screen.getByRole("list", { name: "Residences, 2 shown" });
    const links = within(list).getAllByRole("link");
    expect(links.map((link) => link.getAttribute("href"))).toEqual(["/admin/residences/7.03", "/admin/residences/11.05"]);
    expect(links[0].getAttribute("aria-label")).toBe("Open residence 7.03, available, $218 000, floor 7, 2 bd, 84.2 m²");
    expect(links[1].getAttribute("aria-label")).toContain("reserved");
    expect(links[1].textContent).toContain("Penthouse, incl. terrace");
  });

  it("has no status control, so nothing in the list changes a residence", () => {
    render(<ResidenceCards items={items} t={adminEn.residences} statuses={adminEn.facade.statuses} />);
    expect(screen.queryByRole("combobox")).toBeNull();
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("formats numbers in Russian", () => {
    render(
      <AdminLocaleProvider intl="ru-RU">
        <ResidenceCards items={[items[0]]} t={adminRu.residences} statuses={adminRu.facade.statuses} />
      </AdminLocaleProvider>,
    );
    const link = screen.getByRole("link");
    expect(link.textContent).toContain("Этаж 7 · 2 сп., 84,2 м²");
    expect(link.getAttribute("aria-label")).toBe(
      "Открыть квартиру 7.03, свободна, 218 000 $, этаж 7, 2 сп., 84,2 м²",
    );
  });
});
