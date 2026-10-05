// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { getDictionary } from "@/content";
import { allResidences } from "@/lib/__fixtures__/residences";

import { EnquiryProvider, RequestButton } from "./enquiry-context";

const t = getDictionary();
const residence = allResidences.find((item) => item.number === "7.03")!;

function deferFetch() {
  let answer: (response: Response) => void = () => undefined;
  const fetchMock = vi.fn(
    () =>
      new Promise<Response>((resolve) => {
        answer = resolve;
      }),
  );
  vi.stubGlobal("fetch", fetchMock);
  return { fetchMock, answer: (response: Response) => answer(response) };
}

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

async function openAndSend() {
  const user = userEvent.setup({ pointerEventsCheck: 0 });
  render(
    <EnquiryProvider residence={residence} t={t}>
      <RequestButton>Request this residence</RequestButton>
    </EnquiryProvider>,
  );
  await user.click(screen.getByRole("button", { name: "Request this residence" }));
  await user.type(screen.getByLabelText(t.residenceEnquiry.nameLabel), "Elena Marsh");
  await user.selectOptions(screen.getByLabelText(t.enquiry.countryCode), "+1");
  await user.type(screen.getByLabelText(t.enquiry.phone), "555 014 2271");
  await user.type(screen.getByLabelText(t.enquiry.email), "elena.marsh@example.com");
  await user.click(screen.getByRole("checkbox"));
  await user.click(screen.getByRole("button", { name: t.residenceEnquiry.submit }));
  return user;
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("EnquiryDialog while a request is out", () => {
  it("cannot be closed by the close button, Escape or a click outside and sends only once", async () => {
    const { fetchMock, answer } = deferFetch();
    const user = await openAndSend();
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));

    const close = screen.getByRole("button", { name: t.residenceEnquiry.close });
    expect(close.getAttribute("aria-disabled")).toBe("true");

    await user.click(close);
    await user.keyboard("{Escape}");
    await user.click(document.body);

    expect(screen.getByRole("dialog")).toBeTruthy();
    await user.click(screen.getByRole("button", { name: new RegExp(t.enquirySend.sending) }));
    expect(fetchMock).toHaveBeenCalledTimes(1);

    answer(json(201, { residence: "7.03" }));
    expect(await screen.findByText(t.enquirySend.success.overline)).toBeTruthy();
    expect(close.hasAttribute("aria-disabled")).toBe(false);
  });

  it("keeps the values after a late error and can be closed again", async () => {
    const { answer } = deferFetch();
    const user = await openAndSend();

    await user.keyboard("{Escape}");
    answer(json(500, {}));

    expect(await screen.findByText(new RegExp(t.enquirySend.failedBefore.slice(0, 20)))).toBeTruthy();
    expect((screen.getByLabelText(t.residenceEnquiry.nameLabel) as HTMLInputElement).value).toBe("Elena Marsh");
    expect((screen.getByLabelText(t.enquiry.phone) as HTMLInputElement).value).toBe("555 014 2271");
    expect((screen.getByLabelText(t.enquiry.email) as HTMLInputElement).value).toBe("elena.marsh@example.com");

    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  });
});
