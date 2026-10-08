// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { MiniFacade } from "@/components/admin/dashboard/mini-facade";
import { adminEn } from "@/content/en-admin";
import { adminRu } from "@/content/ru-admin";

import { AdminTopbar } from "./admin-topbar";

vi.mock("next/navigation", () => ({
  usePathname: () => "/admin",
  useRouter: () => ({ refresh: vi.fn() }),
}));
vi.mock("@/lib/admin/queries", () => ({
  useMe: () => ({
    data: { id: 1, email: "maya@example.com", name: "Maya Collins", role: "MANAGER" },
    isPending: false,
    isError: false,
  }),
}));
vi.mock("@/lib/admin/enquiry-queries", () => ({ useEnquiryCard: () => ({ data: undefined }) }));
vi.mock("./live-indicator", () => ({ LiveIndicator: () => null }));
vi.mock("@/components/locale-switcher", () => ({ LocaleSwitcher: () => null }));

afterEach(cleanup);

describe("admin phrases for screen readers", () => {
  it("reads the manager name and role with a lowercase role in both languages", () => {
    const { unmount } = render(<AdminTopbar t={adminRu} />);
    expect(screen.getByText("Maya Collins, менеджер по продажам")).toBeTruthy();
    unmount();
    render(<AdminTopbar t={adminEn} />);
    expect(screen.getByText("Maya Collins, sales manager")).toBeTruthy();
  });

  it("keeps the status lowercase in the floor rows of the dashboard facade", () => {
    render(
      <MiniFacade
        t={adminRu.facade}
        cells={[
          { number: "7.01", status: "AVAILABLE" },
          { number: "7.02", status: "SOLD" },
        ]}
      />,
    );
    expect(screen.getByText("Этаж 7. Квартира 7.01, свободна. Квартира 7.02, продана")).toBeTruthy();
  });
});
