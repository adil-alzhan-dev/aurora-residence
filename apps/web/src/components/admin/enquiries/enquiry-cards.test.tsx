// @vitest-environment jsdom
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { AdminLocaleProvider } from "@/components/admin/admin-locale";
import { adminEn } from "@/content/en-admin";
import { adminRu } from "@/content/ru-admin";
import type { AdminEnquiryListItem } from "@/lib/admin/schemas";

import { EnquiryCards } from "./enquiry-cards";

const now = new Date(2026, 9, 8, 12, 0);

const items: AdminEnquiryListItem[] = [
  {
    id: 3,
    name: "Elena Marsh",
    phone: "+1 (555) 014-2271",
    email: "elena.marsh@example.com",
    status: "NEW",
    source: "Residence page",
    residence: "7.03",
    createdAt: new Date(2026, 9, 8, 10, 42),
  },
  {
    id: 2,
    name: "Jonas Weber",
    phone: "+1 (555) 010-0000",
    email: "jonas@example.com",
    status: "IN_PROGRESS",
    source: "Contacts form",
    residence: null,
    createdAt: new Date(2026, 9, 7, 9, 5),
  },
];

afterEach(cleanup);

describe("EnquiryCards", () => {
  it("shows name, residence or General, status and date, and opens the enquiry", () => {
    render(<EnquiryCards items={items} page={1} total={26} now={now} t={adminEn} />);
    const list = screen.getByRole("list", { name: "Enquiries, page 1 of 2" });
    const [elena, jonas] = within(list).getAllByRole("link");
    expect(elena.getAttribute("href")).toBe("/admin/enquiries/3");
    expect(elena.getAttribute("aria-label")).toBe("Open enquiry from Elena Marsh, new, residence 7.03, today, 10:42");
    expect(elena.textContent).toContain("Residence 7.03");
    expect(jonas.textContent).toContain("General");
    expect(jonas.textContent).toContain("Yesterday, 09:05");
  });

  it("marks new enquiries like the desktop table", () => {
    render(<EnquiryCards items={items} page={1} total={26} now={now} t={adminEn} />);
    const [elena, jonas] = screen.getAllByRole("link");
    expect(elena.className).toContain("bg-background");
    expect(elena.querySelector(".w-0\\.5.bg-primary")).not.toBeNull();
    expect(jonas.className).toContain("bg-card");
    expect(jonas.querySelector(".w-0\\.5.bg-primary")).toBeNull();
  });

  it("keeps only the first word capitalised in the Russian label", () => {
    render(
      <AdminLocaleProvider intl="ru-RU">
        <EnquiryCards items={[items[1]]} page={1} total={1} now={now} t={adminRu} />
      </AdminLocaleProvider>,
    );
    const label = screen.getByRole("link").getAttribute("aria-label") ?? "";
    expect(label.startsWith("Открыть заявку")).toBe(true);
    expect(label.slice(1)).toBe(label.slice(1).replace(/, \p{Lu}\p{Ll}/u, ""));
  });
});
