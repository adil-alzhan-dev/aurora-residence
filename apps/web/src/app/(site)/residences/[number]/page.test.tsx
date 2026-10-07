// @vitest-environment jsdom
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";

import { getDictionary } from "@/content";
import { allResidences } from "@/lib/__fixtures__/residences";
import type { Residence } from "@/lib/api/residences";
import { loadResidencePage } from "@/lib/residence-page-data";

import ResidencePage from "./page";

vi.mock("@/lib/residence-page-data", () => ({ loadResidencePage: vi.fn() }));

const t = getDictionary();
const residence = allResidences.find((item) => item.number === "7.03")!;

/** The server page as a live refresh renders it again: the same route, fresh data. */
async function page(change: Partial<Residence>) {
  const current = { ...residence, ...change };
  vi.mocked(loadResidencePage).mockResolvedValue({
    residence: current,
    floorResidences: allResidences.filter((other) => other.floor === current.floor),
    similar: [],
  });
  return ResidencePage({ params: Promise.resolve({ number: residence.number }) } as PageProps<"/residences/[number]">);
}

class StillObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return [];
  }
}

beforeAll(() => {
  vi.stubGlobal("IntersectionObserver", StillObserver);
  vi.stubGlobal("ResizeObserver", StillObserver);
});

afterEach(cleanup);

describe("Residence page after a live update", () => {
  it("keeps the open enquiry form and what was typed when the residence is reserved or repriced", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    const { rerender } = render(await page({ status: "available" }));
    await user.click(screen.getAllByRole("button", { name: t.residencePage.request })[0]);
    const dialog = screen.getByRole("dialog");
    await user.type(within(dialog).getByLabelText(t.residenceEnquiry.nameLabel), "Elena Marsh");

    rerender(await page({ status: "reserved" }));
    rerender(await page({ status: "reserved", priceUsd: residence.priceUsd + 4000 }));

    const name = within(screen.getByRole("dialog")).getByLabelText(t.residenceEnquiry.nameLabel);
    expect((name as HTMLInputElement).value).toBe("Elena Marsh");
  });
});
